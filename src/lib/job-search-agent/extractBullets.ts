const MAX_BULLETS = 15;
const MIN_BULLET_CHARS = 10;
const MAX_BULLET_CHARS = 500;

/** Pull experience bullets from pasted resume text (no LLM). */
export function extractBulletsFromResume(resumeText: string, maxBullets = MAX_BULLETS): string[] {
  if (!resumeText.trim()) return [];

  const normalized = resumeText.replace(/\r\n/g, "\n");
  const bulletMatches = normalized.match(/^[\s]*[-•*]\s+.+$/gm) || [];
  let bullets = bulletMatches
    .map((line) => line.replace(/^[\s]*[-•*]\s+/, "").trim())
    .filter((b) => b.length >= MIN_BULLET_CHARS && b.length <= MAX_BULLET_CHARS);

  if (bullets.length === 0) {
    bullets = normalized
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length >= 40 && l.length <= MAX_BULLET_CHARS && !/^[-•*]/.test(l));
  }

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const b of bullets) {
    const key = b.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(b);
    if (unique.length >= maxBullets) break;
  }
  return unique;
}

export { MAX_BULLETS, MIN_BULLET_CHARS, MAX_BULLET_CHARS };
