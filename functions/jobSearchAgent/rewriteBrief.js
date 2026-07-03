const { extractJdMeta } = require("./extractJdMeta");
const { stripBoilerplate, trim } = require("./jdChunks");

function pickStrings(raw, key, max = 8) {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw[key])) return [];
  return raw[key]
    .filter((x) => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);
}

function normalizeFitForRewrite(raw) {
  if (!raw || typeof raw !== "object") {
    return { matchedSkills: [], missingSkills: [], highlights: [], sourcedFrom: [] };
  }
  return {
    matchedSkills: pickStrings(raw, "matchedSkills", 8),
    missingSkills: pickStrings(raw, "missingSkills", 8),
    highlights: pickStrings(raw, "highlights", 4),
    sourcedFrom: pickStrings(raw, "sourcedFrom", 3).map((s) => s.slice(0, 140)),
  };
}

function buildRewriteBrief(jobDescriptionText, fitAnalysis) {
  const jdRaw = typeof jobDescriptionText === "string" ? jobDescriptionText.trim() : "";
  const jdClean = trim(stripBoilerplate(jdRaw.replace(/\r\n/g, "\n")), 6000);
  const meta = extractJdMeta(jdClean);
  const fit = normalizeFitForRewrite(fitAnalysis);

  const keywords = [...new Set([...fit.missingSkills, ...fit.matchedSkills])].slice(0, 10);
  const anchorBlock = fit.sourcedFrom.length
    ? fit.sourcedFrom.map((q, i) => `${i + 1}. ${q}`).join("\n")
    : "See target keywords.";
  const highlightBlock = fit.highlights.length ? fit.highlights.join("; ") : "See matched skills.";

  const textBlock = `Role: ${meta.roleTitle} at ${meta.company}
Company focus: ${meta.companyFocus}
Target keywords: ${keywords.join(", ") || "See role title"}
JD evidence:
${anchorBlock}
Strong alignments: ${highlightBlock}`;

  return { meta, fit, textBlock, cacheKey: `${textBlock}\n---\n${keywords.join("|")}` };
}

module.exports = { buildRewriteBrief, normalizeFitForRewrite };
