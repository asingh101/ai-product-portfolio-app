const BANNED_PHRASES = [
  /i am a hardworking/i,
  /i would be a great fit/i,
  /great fit for your team/i,
  /i am writing to apply/i,
  /passionate individual/i,
  /highly motivated self[- ]starter/i,
  /dedicated team player/i,
  /excited to apply/i,
];

const MAX_WORDS = 250;

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function findMatchedSkillsInLetter(letter, skills) {
  const lower = letter.toLowerCase();
  return (skills || [])
    .filter((s) => typeof s === "string" && s.length >= 2 && lower.includes(s.toLowerCase()))
    .slice(0, 12);
}

function findBannedPhrase(letter) {
  for (const re of BANNED_PHRASES) {
    if (re.test(letter)) return re.source;
  }
  return null;
}

function validateCoverLetter(letter, fitAnalysis, jdMeta) {
  if (!letter || typeof letter !== "string") {
    return { ok: false, reason: "Empty letter" };
  }

  const trimmed = letter.trim();
  if (trimmed.length < 80) {
    return { ok: false, reason: "Letter too short" };
  }

  const banned = findBannedPhrase(trimmed);
  if (banned) {
    return { ok: false, reason: `Generic phrase detected: ${banned}` };
  }

  const wc = wordCount(trimmed);
  if (wc > MAX_WORDS + 30) {
    return { ok: false, reason: `Too long (${wc} words)` };
  }

  const matchedSkills = fitAnalysis?.matchedSkills || [];
  const matchedSkillsUsed = findMatchedSkillsInLetter(trimmed, matchedSkills);
  const minSkills = matchedSkills.length >= 2 ? 2 : matchedSkills.length >= 1 ? 1 : 0;
  if (minSkills > 0 && matchedSkillsUsed.length < minSkills) {
    return {
      ok: false,
      reason: `Must name at least ${minSkills} matched skill(s) explicitly`,
    };
  }

  return {
    ok: true,
    result: {
      letter: trimmed,
      wordCount: wc,
      matchedSkillsUsed,
      company: jdMeta?.company || "the company",
      roleTitle: jdMeta?.roleTitle || "this role",
      tone: fitAnalysis?.tone || "confident",
    },
  };
}

module.exports = { validateCoverLetter, wordCount, findMatchedSkillsInLetter, MAX_WORDS };
