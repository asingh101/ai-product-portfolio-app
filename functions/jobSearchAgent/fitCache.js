const crypto = require("crypto");

const MAX_ENTRIES = 300;
const cache = new Map();

function hashFitInputs(resumeText, jdText) {
  return crypto.createHash("sha256").update(resumeText).update("\n---\n").update(jdText).digest("hex");
}

function getCached(resumeText, jdText) {
  const key = hashFitInputs(resumeText, jdText);
  const entry = cache.get(key);
  if (!entry) return null;
  return entry.result;
}

function setCachedForInputs(resumeText, jdText, result) {
  const key = hashFitInputs(resumeText, jdText);
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(key, { result, ts: Date.now() });
}

module.exports = { getCached, setCachedForInputs };
