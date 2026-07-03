function tierFromScore(score) {
  if (score >= 75) return "strong";
  if (score >= 50) return "reach";
  return "weak";
}

function asStringArray(value, max = 15) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((x) => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);
}

function quoteInJd(quote, jdLower) {
  const q = quote.replace(/^["']|["']$/g, "").trim();
  if (!q || q.length < 8) return false;
  if (jdLower.includes(q.toLowerCase())) return true;
  const snippet = q.toLowerCase().slice(0, Math.min(48, q.length));
  return snippet.length >= 12 && jdLower.includes(snippet);
}

function filterSourcedFrom(items, jdText) {
  const jdLower = jdText.toLowerCase();
  return items.filter((item) => {
    const quoted = item.match(/"([^"]{8,})"/);
    if (quoted) return quoteInJd(quoted[1], jdLower);
    const afterParen = item.match(/\)\s*(.+)$/);
    const body = afterParen ? afterParen[1] : item;
    return quoteInJd(body, jdLower);
  });
}

function validateFitResult(parsed, jdText) {
  if (!parsed || typeof parsed !== "object") return null;

  const score = Number(parsed.score);
  if (!Number.isFinite(score) || score < 0 || score > 100) return null;

  const rounded = Math.round(score);
  const tier = tierFromScore(rounded);

  const matchedSkills = asStringArray(parsed.matchedSkills, 12);
  const missingSkills = asStringArray(parsed.missingSkills, 12);
  const sourcedFrom = filterSourcedFrom(asStringArray(parsed.sourcedFrom, 12), jdText);
  const redFlags = asStringArray(parsed.redFlags, 8);
  const highlights = asStringArray(parsed.highlights, 8);

  return {
    score: rounded,
    tier,
    matchedSkills,
    missingSkills,
    sourcedFrom,
    redFlags,
    highlights,
  };
}

module.exports = { validateFitResult, tierFromScore };
