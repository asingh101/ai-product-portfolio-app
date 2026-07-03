const BOILERPLATE_PATTERNS = [
  /equal opportunity employer[\s\S]{0,500}/gi,
  /benefits include[\s\S]{0,600}/gi,
  /apply now[\s\S]{0,200}/gi,
];

const HEADER_RE =
  /^(requirements|qualifications|responsibilities|about the role|nice to have|what you(?:'|')ll do|what you will do|who you are|about you|skills|must have|preferred|minimum qualifications|key responsibilities)/i;

function trim(str, max) {
  if (typeof str !== "string") return "";
  const t = str.trim();
  if (!max || t.length <= max) return t;
  return t.slice(0, max) + "…";
}

function stripBoilerplate(text) {
  let out = text;
  for (const re of BOILERPLATE_PATTERNS) {
    out = out.replace(re, "");
  }
  return out.replace(/[^\S\n]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function isSectionHeader(line) {
  const t = line.trim();
  if (t.length < 3 || t.length > 80) return false;
  if (HEADER_RE.test(t)) return true;
  if (/^[A-Z][A-Za-z0-9 &/()-]{2,}:$/.test(t)) return true;
  if (t === t.toUpperCase() && /[A-Z]/.test(t) && t.length < 50) return true;
  return false;
}

function splitIntoChunks(text, section, maxChunkChars, startIndex) {
  const chunks = [];
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return { chunks, nextIndex: startIndex };

  let chunkIndex = startIndex;
  let pos = 0;
  while (pos < normalized.length) {
    let end = Math.min(pos + maxChunkChars, normalized.length);
    if (end < normalized.length) {
      const slice = normalized.slice(pos, end);
      const lastSpace = slice.lastIndexOf(" ");
      if (lastSpace > maxChunkChars * 0.5) end = pos + lastSpace;
    }
    const piece = normalized.slice(pos, end).trim();
    if (piece) {
      chunks.push({ section, chunkIndex, text: piece });
      chunkIndex += 1;
    }
    pos = end;
    while (pos < normalized.length && normalized[pos] === " ") pos += 1;
  }
  return { chunks, nextIndex: chunkIndex };
}

/** Split JD into labeled chunks for citations (no LLM tokens). */
function chunkJobDescription(jobDescriptionText, maxChunkChars = 300) {
  const cleaned = trim(stripBoilerplate(jobDescriptionText.replace(/\r\n/g, "\n")), 6000);
  if (!cleaned) return [];

  const lines = cleaned.split("\n").map((l) => l.trim());
  const chunks = [];
  let section = "General";
  let buffer = [];
  let chunkIndex = 0;

  const flushSection = () => {
    const text = buffer.join(" ").trim();
    buffer = [];
    if (!text) return;
    const split = splitIntoChunks(text, section, maxChunkChars, chunkIndex);
    chunks.push(...split.chunks);
    chunkIndex = split.nextIndex;
  };

  let sawHeader = false;
  for (const line of lines) {
    if (!line) continue;
    if (isSectionHeader(line)) {
      sawHeader = true;
      flushSection();
      section = line.replace(/:$/, "").trim();
    } else {
      buffer.push(line);
    }
  }
  flushSection();

  if (!sawHeader || chunks.length === 0) {
    const paras = cleaned.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
    const fallback = [];
    let idx = 0;
    for (const para of paras.length ? paras : [cleaned]) {
      const split = splitIntoChunks(para, "General", maxChunkChars, idx);
      fallback.push(...split.chunks);
      idx = split.nextIndex;
    }
    return fallback.length ? fallback : splitIntoChunks(cleaned, "General", maxChunkChars, 0).chunks;
  }

  return chunks;
}

function formatChunksForPrompt(chunks) {
  return chunks
    .map((c) => `[${c.section} #${c.chunkIndex + 1}] ${c.text}`)
    .join("\n\n");
}

module.exports = {
  stripBoilerplate,
  trim,
  chunkJobDescription,
  formatChunksForPrompt,
};
