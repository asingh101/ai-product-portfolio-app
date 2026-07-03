/** Shared JD keyword extraction, filters stop words and company names. */

const STOPWORDS = new Set(
  [
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "from", "as",
    "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "must", "can", "this", "that", "these", "those", "it", "its",
    "we", "you", "your", "our", "their", "they", "them", "who", "what", "when", "where", "why", "how", "all",
    "each", "every", "both", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own",
    "same", "so", "than", "too", "very", "just", "into", "over", "after", "before", "between", "through",
    "during", "about", "above", "below", "up", "down", "out", "off", "work", "working", "role", "team", "join",
    "help", "build", "years", "year", "able", "using", "used", "including", "within", "across", "strong",
    "experience", "preferred", "required", "looking", "seeking", "ideal", "candidate", "candidates", "company",
    "position", "opportunity", "responsibilities", "qualifications", "requirements", "description", "apply",
    "offer", "offers", "provide", "provides", "ability", "skills", "skill", "well", "also", "etc", "via",
  ]
);

/** Short tokens allowed despite length < 4 */
const SKILL_ALLOWLIST = new Set([
  "sql", "aws", "gcp", "api", "sdk", "ui", "ux", "pm", "ai", "ml", "nlp", "etl", "crm", "erp", "saas", "b2b",
  "b2c", "kpi", "roi", "seo", "sem", "hr", "it", "qa", "ci", "cd", "ios", "dba", "iot", "llm", "rag",
]);

function normalizeTerm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#./-]/g, "")
    .trim();
}

function buildExcludedTerms(jds = []) {
  const excluded = new Set();
  for (const jd of jds) {
    if (jd.company) {
      for (const part of String(jd.company).split(/[\s,/|]+/)) {
        const t = normalizeTerm(part);
        if (t.length >= 2) excluded.add(t);
      }
    }
    const firstLine = (jd.text || "").split("\n").find((l) => l.trim().length > 2);
    if (firstLine) {
      for (const part of firstLine.split(/[\s,/|–—-]+/)) {
        const t = normalizeTerm(part);
        if (t.length >= 3 && !STOPWORDS.has(t)) excluded.add(t);
      }
    }
  }
  return excluded;
}

function isUsefulKeyword(word, excludedTerms) {
  if (!word || word.length < 3) return false;
  if (STOPWORDS.has(word)) return false;
  if (excludedTerms.has(word)) return false;
  if (word.length < 4 && !SKILL_ALLOWLIST.has(word)) return false;
  return true;
}

function extractKeywordFreq(text, maxTerms = 20, excludedTerms = new Set()) {
  const words = String(text || "")
    .toLowerCase()
    .match(/[a-z][a-z0-9+#./-]{2,}/g) || [];
  const freq = new Map();
  for (const w of words) {
    if (!isUsefulKeyword(w, excludedTerms)) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, maxTerms);
}

function normalizeForMatch(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** True if snippet appears verbatim (or near-verbatim) in source document text. */
function snippetExistsInSource(snippet, sourceText) {
  if (!snippet || !sourceText) return false;
  const normSource = normalizeForMatch(sourceText);
  const normSnippet = normalizeForMatch(snippet);
  if (normSnippet.length < 8) return normSource.includes(normSnippet);
  const probe = normSnippet.slice(0, Math.min(normSnippet.length, 120));
  return normSource.includes(probe);
}

module.exports = {
  STOPWORDS,
  SKILL_ALLOWLIST,
  buildExcludedTerms,
  extractKeywordFreq,
  isUsefulKeyword,
  snippetExistsInSource,
  normalizeForMatch,
};
