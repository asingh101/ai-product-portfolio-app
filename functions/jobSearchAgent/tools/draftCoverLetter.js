const { streamGeminiText, getUsageTokens } = require("../../shared/geminiClient");
const { stripBoilerplate, trim } = require("../jdChunks");
const { extractJdMeta } = require("../extractJdMeta");
const { validateCoverLetter } = require("../coverLetterValidate");
const { DEFAULT_MODEL } = require("../config");

const TONES = new Set(["confident", "collaborative", "concise"]);

const SYSTEM_PROMPT = `You write sharp, specific cover letters. Never use generic phrases.
Every claim must connect to the candidate's actual experience from the provided highlights and proof points.
Banned: "I am a hardworking individual", "I would be a great fit", "I am writing to apply", "passionate team player", "highly motivated".
Output plain prose only, no bullet points, no markdown, no subject line.`;

function normalizeFitAnalysis(raw, tone) {
  if (!raw || typeof raw !== "object") {
    return { matchedSkills: [], missingSkills: [], highlights: [], tone };
  }
  const pick = (key) =>
    Array.isArray(raw[key])
      ? raw[key].filter((x) => typeof x === "string").map((s) => s.trim()).filter(Boolean).slice(0, 12)
      : [];
  return {
    matchedSkills: pick("matchedSkills"),
    missingSkills: pick("missingSkills"),
    highlights: pick("highlights"),
    tone,
  };
}

function buildUserPrompt({ tone, jdMeta, fitAnalysis, acceptedBullets }) {
  const topGap = fitAnalysis.missingSkills[0] || "a skill area you are growing";
  const proofBlock = acceptedBullets?.length
    ? `\nConcrete proof points from resume (use one result, do not invent others):\n${acceptedBullets
        .slice(0, 4)
        .map((b, i) => `${i + 1}. ${b}`)
        .join("\n")}`
    : "";

  return `Write a ${tone} cover letter for this role.

Role: ${jdMeta.roleTitle} at ${jdMeta.company}
What they build: ${jdMeta.companyFocus}
Candidate's matched skills: ${fitAnalysis.matchedSkills.join(", ") || "see highlights"}
Candidate's top gap: ${topGap}
Highlights: ${fitAnalysis.highlights.join("; ") || "see matched skills"}
${proofBlock}

Structure:
- Line 1: One sentence hook about ${jdMeta.company}'s specific work
- Para 1: 2-3 matched skills, named explicitly, with one concrete result from highlights or proof points
- Para 2: Address ${topGap} briefly as a trajectory not a deficit
- Last line: Clear ask for a conversation

Max 250 words. No bullet points. No "I am writing to apply for".`;
}

function buildRepairPrompt(baseUserText, reason) {
  return `${baseUserText}\n\nYour draft failed validation: ${reason}. Rewrite the full letter fixing this. Max 250 words.`;
}

function prepareContext(payload) {
  const jdRaw = typeof payload.jobDescriptionText === "string" ? payload.jobDescriptionText.trim() : "";
  const tone = TONES.has(payload.tone) ? payload.tone : "confident";

  if (jdRaw.length < 50) {
    throw Object.assign(new Error("Job description too short"), { code: "VALIDATION" });
  }

  const jobDescriptionText = trim(stripBoilerplate(jdRaw.replace(/\r\n/g, "\n")), 6000);
  const jdMeta = extractJdMeta(jobDescriptionText);
  const fitAnalysis = normalizeFitAnalysis(payload.fitAnalysis, tone);
  const acceptedBullets = Array.isArray(payload.acceptedBullets)
    ? payload.acceptedBullets
        .filter((b) => typeof b === "string" && b.trim())
        .map((b) => b.trim())
        .slice(0, 6)
    : [];

  if (fitAnalysis.matchedSkills.length === 0 && fitAnalysis.highlights.length === 0) {
    throw Object.assign(new Error("fitAnalysis must include matchedSkills or highlights"), {
      code: "VALIDATION",
    });
  }

  const userText = buildUserPrompt({ tone, jdMeta, fitAnalysis, acceptedBullets });

  return { jobDescriptionText, jdMeta, fitAnalysis, userText, tone, acceptedBullets };
}

async function collectStreamedLetter({ apiKey, config, systemText, userText, temperature, onChunk }) {
  let letter = "";
  let lastRaw = null;

  for await (const { text, raw } of streamGeminiText({
    apiKey,
    model: config.model || DEFAULT_MODEL,
    systemText,
    userText,
    temperature,
    maxOutputTokens: config.tools?.draft_cover_letter?.maxOutputTokens ?? 900,
  })) {
    letter += text;
    lastRaw = raw;
    if (onChunk) onChunk(text);
  }

  const usage = lastRaw ? getUsageTokens(lastRaw) : { input: 0, output: 0, total: 0 };

  return {
    letter: letter.trim(),
    geminiResponse: lastRaw,
    usage,
  };
}

async function generateValidatedLetter({ apiKey, config, ctx, onChunk, onReplace }) {
  const first = await collectStreamedLetter({
    apiKey,
    config,
    systemText: SYSTEM_PROMPT,
    userText: ctx.userText,
    temperature: 0.35,
    onChunk,
  });

  let validation = validateCoverLetter(
    first.letter,
    { ...ctx.fitAnalysis, tone: ctx.tone },
    ctx.jdMeta
  );

  if (validation.ok) {
    return {
      result: validation.result,
      geminiResponse: first.geminiResponse,
      usage: first.usage,
    };
  }

  const repaired = await collectStreamedLetter({
    apiKey,
    config,
    systemText: SYSTEM_PROMPT,
    userText: buildRepairPrompt(ctx.userText, validation.reason),
    temperature: 0.2,
    onChunk: null,
  });

  validation = validateCoverLetter(
    repaired.letter,
    { ...ctx.fitAnalysis, tone: ctx.tone },
    ctx.jdMeta
  );

  if (!validation.ok) {
    throw Object.assign(new Error(`Cover letter validation failed: ${validation.reason}`), {
      code: "VALIDATION",
    });
  }

  if (onReplace) onReplace(repaired.letter);

  return {
    result: { ...validation.result, repaired: true },
    geminiResponse: repaired.geminiResponse,
    usage: {
      input: first.usage.input + repaired.usage.input,
      output: first.usage.output + repaired.usage.output,
      total: first.usage.total + repaired.usage.total,
    },
  };
}

async function run({ payload, apiKey, config }) {
  const ctx = prepareContext(payload);
  const { result, geminiResponse, usage } = await generateValidatedLetter({
    apiKey,
    config,
    ctx,
    onChunk: null,
    onReplace: null,
  });

  return {
    result,
    geminiResponse,
    usage: { inputTokens: usage.input, outputTokens: usage.output },
  };
}

async function runStream({ payload, apiKey, config, onChunk, onReplace }) {
  const ctx = prepareContext(payload);
  const { result, geminiResponse, usage } = await generateValidatedLetter({
    apiKey,
    config,
    ctx,
    onChunk,
    onReplace,
  });

  return {
    result,
    geminiResponse,
    usage,
  };
}

module.exports = { run, runStream };
