const { callGeminiJsonLean, extractText } = require("../../shared/geminiClient");
const { chunkJobDescription, formatChunksForPrompt, stripBoilerplate, trim } = require("../jdChunks");
const { validateFitResult } = require("../fitValidate");
const {
  normalizeResumeText,
  buildKeywordHints,
  parseJsonFromModel,
} = require("../../resumeOptimizer/normalize");
const { DEFAULT_MODEL } = require("../config");
const { getCached, setCachedForInputs } = require("../fitCache");
const { checkFitScanRateLimit, recordFitScan } = require("../fitScanRateLimit");

const SYSTEM_PROMPT =
  "You are a precise recruiter. Return ONLY valid JSON. No markdown, no explanation. Never invent resume facts or JD requirements.";

function buildUserPrompt({ resumeText, jdFormatted, keywordHints }) {
  const hintBlock = keywordHints.missing?.length
    ? `\nDeterministic keyword hints (JD terms absent from resume): ${keywordHints.missing.slice(0, 12).join(", ")}`
    : "";

  return `Resume:
${resumeText}

Job Description (labeled sections):
${jdFormatted}
${hintBlock}

Return exactly this JSON shape:
{
  "score": number,
  "tier": "strong" | "reach" | "weak",
  "matchedSkills": string[],
  "missingSkills": string[],
  "sourcedFrom": string[],
  "redFlags": string[],
  "highlights": string[]
}

Rules:
- score 0-100; tier: score >= 75 strong, 50-74 reach, below 50 weak
- sourcedFrom must quote exact JD phrases that justify each missing skill (include section label, e.g. Requirements: "...")
- redFlags: real mismatches only (years, domain, location), omit if none
- highlights: strongest resume-JD alignments
- Do not invent skills not implied by the JD or resume`;
}

async function callFitModel({ apiKey, config, userText, temperature }) {
  return callGeminiJsonLean({
    apiKey,
    model: config.model || DEFAULT_MODEL,
    systemText: SYSTEM_PROMPT,
    userText,
    temperature,
    maxOutputTokens: config.tools?.analyze_fit?.maxOutputTokens ?? 1200,
  });
}

async function run({ payload, apiKey, config, clientIp }) {
  const resumeRaw = typeof payload.resumeText === "string" ? payload.resumeText.trim() : "";
  const jdRaw = typeof payload.jobDescriptionText === "string" ? payload.jobDescriptionText.trim() : "";

  if (resumeRaw.length < 200) {
    throw Object.assign(new Error("Resume text too short (min 200 characters)"), { code: "VALIDATION" });
  }
  if (jdRaw.length < 50) {
    throw Object.assign(new Error("Job description too short"), { code: "VALIDATION" });
  }

  const resumeText = normalizeResumeText(resumeRaw, { resumeMaxChars: 8000 });
  const jdClean = trim(stripBoilerplate(jdRaw.replace(/\r\n/g, "\n")), 6000);

  const cachedResult = getCached(resumeText, jdClean);
  if (cachedResult) {
    return {
      result: { ...cachedResult, cached: true },
      geminiResponse: null,
      cached: true,
    };
  }

  const maxScans = config.rateLimit?.maxFitScansPerHourPerIp ?? 5;
  if (clientIp) {
    const { allowed, retryAfterSeconds } = checkFitScanRateLimit(clientIp, maxScans);
    if (!allowed) {
      const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
      throw Object.assign(
        new Error(
          `You've hit the limit of ${maxScans} fit scans per hour. Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`
        ),
        { code: "RATE_LIMIT", retryAfterSeconds }
      );
    }
    recordFitScan(clientIp);
  }

  const chunks = chunkJobDescription(jdClean);
  const jdFormatted = formatChunksForPrompt(chunks);
  const keywordHints = buildKeywordHints(resumeText, [{ label: "primary", text: jdClean }]);

  const baseUserText = buildUserPrompt({ resumeText, jdFormatted, keywordHints });

  let geminiResponse = await callFitModel({
    apiKey,
    config,
    userText: baseUserText,
    temperature: 0,
  });

  let validated = validateFitResult(parseJsonFromModel(extractText(geminiResponse)), jdClean);

  if (!validated) {
    geminiResponse = await callFitModel({
      apiKey,
      config,
      userText: `${baseUserText}\n\nYour previous response was not valid JSON. Return only the JSON object.`,
      temperature: 0,
    });
    validated = validateFitResult(parseJsonFromModel(extractText(geminiResponse)), jdClean);
  }

  if (!validated) {
    throw Object.assign(new Error("Could not parse fit analysis"), { code: "PARSE_FAILURE" });
  }

  const result = {
    ...validated,
    chunkCount: chunks.length,
  };

  setCachedForInputs(resumeText, jdClean, result);

  return {
    result,
    geminiResponse,
  };
}

module.exports = { run };
