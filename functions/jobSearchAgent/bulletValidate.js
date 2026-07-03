function parseJsonArrayFromModel(text) {
  if (!text) return null;
  let trimmed = text
    .trim()
    .replace(/^\uFEFF/, "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    const start = trimmed.indexOf("[");
    if (start < 0) return null;
    let json = trimmed.slice(start);
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        const parsed = JSON.parse(json);
        return Array.isArray(parsed) ? parsed : null;
      } catch {
        if (json.endsWith(",")) json = json.slice(0, -1);
        const openB = (json.match(/\[/g) || []).length;
        const closeB = (json.match(/\]/g) || []).length;
        json += "]".repeat(Math.max(0, openB - closeB));
      }
    }
    return null;
  }
}

function extractNumericTokens(text) {
  return (String(text).match(/\d[\d,]*\.?\d*%?|\$[\d,]+(?:\.\d+)?/g) || [])
    .map((n) => n.replace(/,/g, ""))
    .filter((n) => {
      const digits = n.replace(/[^\d]/g, "");
      return digits.length >= 2 || n.includes("%") || n.startsWith("$");
    });
}

function hasNewNumbers(original, rewritten) {
  const origNums = new Set(extractNumericTokens(original));
  const rewriteNums = extractNumericTokens(rewritten);
  return rewriteNums.some((n) => n && !origNums.has(n));
}

function buildFallbackRewrites(originals) {
  return originals.map((original) => ({
    original,
    rewritten: original,
    changedBecause: "Could not validate rewrite",
    unchanged: true,
  }));
}

function normalizeRewriteItem(item) {
  if (!item || typeof item !== "object") return null;

  const unchanged = Boolean(item.u ?? item.unchanged);
  let rewritten = "";
  if (typeof item.r === "string") rewritten = item.r.trim();
  else if (typeof item.rewritten === "string") rewritten = item.rewritten.trim();

  let changedBecause = "";
  if (typeof item.why === "string") changedBecause = item.why.trim().slice(0, 100);
  else if (typeof item.changedBecause === "string") changedBecause = item.changedBecause.trim().slice(0, 100);

  const localIndex =
    typeof item.i === "number" && Number.isInteger(item.i) ? item.i : null;

  return { unchanged, rewritten, changedBecause, localIndex };
}

function validateSingleRewrite(original, item) {
  const norm = normalizeRewriteItem(item);
  if (!norm) return null;

  const { unchanged, rewritten, changedBecause } = norm;

  if (unchanged) {
    return {
      original,
      rewritten: original,
      changedBecause: changedBecause || "Already well-targeted for this role",
      unchanged: true,
    };
  }

  if (!rewritten) return null;

  if (rewritten.length > original.length * 2 || hasNewNumbers(original, rewritten)) {
    return {
      original,
      rewritten: original,
      changedBecause: "Preserved original, rewrite would have changed facts or metrics",
      unchanged: true,
    };
  }

  return {
    original,
    rewritten,
    changedBecause: changedBecause || "Surfaced JD-relevant experience",
    unchanged: false,
  };
}

/** Legacy full-array shape (original + rewritten fields). */
function validateBulletRewrites(parsed, originals) {
  if (!Array.isArray(parsed) || parsed.length !== originals.length) return null;

  const results = [];
  for (let i = 0; i < originals.length; i++) {
    const row = validateSingleRewrite(originals[i], parsed[i]);
    if (!row) return null;
    results.push(row);
  }
  return results;
}

/** Compact index-based batch: [{ i, r, why, u }], partial arrays OK. */
function validateCompactBulletRewrites(parsed, originals) {
  if (!Array.isArray(parsed) || !originals.length) return null;

  const results = originals.map((original) => ({
    original,
    rewritten: original,
    changedBecause: "Could not validate rewrite",
    unchanged: true,
  }));

  let matched = 0;
  for (const item of parsed) {
    const norm = normalizeRewriteItem(item);
    if (!norm || norm.localIndex === null) continue;
    if (norm.localIndex < 0 || norm.localIndex >= originals.length) continue;

    const row = validateSingleRewrite(originals[norm.localIndex], item);
    if (!row) continue;
    results[norm.localIndex] = row;
    matched += 1;
  }

  if (matched === 0 && parsed.length > 0) {
    for (let i = 0; i < Math.min(parsed.length, originals.length); i++) {
      const row = validateSingleRewrite(originals[i], parsed[i]);
      if (row) {
        results[i] = row;
        matched += 1;
      }
    }
  }

  return matched > 0 ? results : null;
}

module.exports = {
  parseJsonArrayFromModel,
  buildFallbackRewrites,
  validateBulletRewrites,
  validateCompactBulletRewrites,
  hasNewNumbers,
};
