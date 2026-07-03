const { snippetExistsInSource, normalizeForMatch } = require("./keywordFilter");

const IMPACT_ORDER = { high: 0, medium: 1, low: 2 };
const EFFORT_ORDER = { low: 0, medium: 1, high: 2 };

function suggestionHasInventedTenure(suggestion, sourceText) {
  if (!suggestion || !sourceText) return false;
  const normSource = normalizeForMatch(sourceText);
  const matches = String(suggestion).match(/\b(\d{1,2})\+?\s*(?:years?|yrs?)\b/gi) || [];
  for (const m of matches) {
    const num = m.match(/\d{1,2}/)?.[0];
    if (num && !normSource.includes(num)) return true;
  }
  return false;
}

function validateAndRankRecommendations(
  recommendations,
  extractOutput,
  sectionPriority,
  sourceText,
  maxItems = 10
) {
  const allTerms = new Set();
  for (const jd of extractOutput?.jd_extracts || []) {
    for (const t of [...(jd.must_have || []), ...(jd.nice_to_have || [])]) {
      allTerms.add(String(t).toLowerCase());
    }
  }

  const cleaned = (recommendations || [])
    .map((rec, i) => {
      let jd_evidence = (rec.jd_evidence || []).filter((e) =>
        [...allTerms].some(
          (t) => t.includes(String(e).toLowerCase()) || String(e).toLowerCase().includes(t)
        )
      );
      if (!jd_evidence.length) jd_evidence = (rec.jd_evidence || []).slice(0, 3);

      let current_snippet = rec.current_snippet;
      if (current_snippet && sourceText && !snippetExistsInSource(current_snippet, sourceText)) {
        current_snippet = null;
      }

      let suggestion = rec.suggestion;
      if (sourceText && suggestionHasInventedTenure(suggestion, sourceText)) {
        const issue = rec.issue || "Update this section using details from your document.";
        suggestion = `${issue} Revise using your actual employers, titles, and metrics from the document.`;
      }

      return {
        ...rec,
        id: rec.id || `rec-${i + 1}`,
        jd_evidence,
        current_snippet: current_snippet || null,
        suggestion,
      };
    })
    .filter((rec) => rec.issue || rec.suggestion);

  const priorityIndex = Object.fromEntries((sectionPriority || []).map((s, idx) => [s, idx]));

  cleaned.sort((a, b) => {
    const ia = IMPACT_ORDER[a.impact] ?? 2;
    const ib = IMPACT_ORDER[b.impact] ?? 2;
    if (ia !== ib) return ia - ib;
    const ea = EFFORT_ORDER[a.effort] ?? 2;
    const eb = EFFORT_ORDER[b.effort] ?? 2;
    if (ea !== eb) return ea - eb;
    return (priorityIndex[a.section] ?? 9) - (priorityIndex[b.section] ?? 9);
  });

  return cleaned.slice(0, maxItems);
}

module.exports = {
  validateAndRankRecommendations,
  suggestionHasInventedTenure,
};
