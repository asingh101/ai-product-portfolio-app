const MAX_BULLETS = 15;
const MIN_BULLET_CHARS = 10;
const MAX_BULLET_CHARS = 500;

/** Pull experience bullets from pasted resume text (no LLM). */
function extractBulletsFromResume(resumeText, maxBullets = MAX_BULLETS) {
  if (typeof resumeText !== "string" || !resumeText.trim()) return [];

  const normalized = resumeText.replace(/\r\n/g, "\n");
  const bulletMatches = normalized.match(/^[\s]*[-•*]\s+.+$/gm) || [];
  let bullets = bulletMatches
    .map((line) => line.replace(/^[\s]*[-•*]\s+/, "").trim())
    .filter((b) => b.length >= MIN_BULLET_CHARS && b.length <= MAX_BULLET_CHARS);

  if (bullets.length === 0) {
    const lines = normalized
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length >= 40 && l.length <= MAX_BULLET_CHARS && !/^[-•*]/.test(l));
    bullets = lines;
  }

  const seen = new Set();
  const unique = [];
  for (const b of bullets) {
    const key = b.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(b);
    if (unique.length >= maxBullets) break;
  }
  return unique;
}

function normalizeBulletInput(bullets, maxBullets = MAX_BULLETS) {
  if (!Array.isArray(bullets)) return [];
  const out = [];
  for (const raw of bullets) {
    if (typeof raw !== "string") continue;
    const t = raw.trim();
    if (t.length < MIN_BULLET_CHARS || t.length > MAX_BULLET_CHARS) continue;
    out.push(t);
    if (out.length >= maxBullets) break;
  }
  return out;
}

module.exports = {
  MAX_BULLETS,
  MIN_BULLET_CHARS,
  MAX_BULLET_CHARS,
  extractBulletsFromResume,
  normalizeBulletInput,
};
