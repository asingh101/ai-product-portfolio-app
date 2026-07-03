const { callGeminiJsonLean, extractText, getUsageTokens } = require("../../shared/geminiClient");
const { normalizeBulletInput } = require("../extractBullets");
const {
  parseJsonArrayFromModel,
  buildFallbackRewrites,
  validateCompactBulletRewrites,
} = require("../bulletValidate");
const { buildRewriteBrief } = require("../rewriteBrief");
const { getCachedRewrites, setCachedRewrites } = require("../rewriteCache");
const { DEFAULT_MODEL } = require("../config");

const BATCH_SIZE = 5;
const SYSTEM_PROMPT = `You are a resume coach. Reframe bullets for a target role.
Rules: never invent experience; never change numbers; same person/company/role.
Surface implied skills already supported by the bullet. Mirror 1 JD keyword when relevant.
Return ONLY valid JSON, a compact array.`;

function buildBatchPrompt(briefText, batchBullets) {
  const numbered = batchBullets.map((b, i) => `${i}. ${b}`).join("\n");
  return `${briefText}

Bullets to rewrite (local indices 0–${batchBullets.length - 1}):
${numbered}

Return JSON array. Each item:
{"i": number, "r": "rewritten text", "why": "≤80 chars: Added X (JD), you already Y", "u": false}
If already well-targeted: {"i": number, "u": true}
Include one entry per bullet index.`;
}

function outputTokensForBatch(batchLen) {
  return Math.min(4096, 180 + batchLen * 220);
}

function mergeUsage(a, b) {
  return {
    inputTokens: (a?.inputTokens ?? 0) + (b?.inputTokens ?? 0),
    outputTokens: (a?.outputTokens ?? 0) + (b?.outputTokens ?? 0),
    latencyMs: (a?.latencyMs ?? 0) + (b?.latencyMs ?? 0),
  };
}

async function callRewriteModel({ apiKey, config, userText, maxOutputTokens }) {
  return callGeminiJsonLean({
    apiKey,
    model: config.model || DEFAULT_MODEL,
    systemText: SYSTEM_PROMPT,
    userText,
    temperature: 0,
    maxOutputTokens,
  });
}

async function rewriteBatch({ batchBullets, briefText, apiKey, config }) {
  const userText = buildBatchPrompt(briefText, batchBullets);
  const maxOut = outputTokensForBatch(batchBullets.length);

  let geminiResponse = await callRewriteModel({ apiKey, config, userText, maxOutputTokens: maxOut });
  let validated = validateCompactBulletRewrites(
    parseJsonArrayFromModel(extractText(geminiResponse)),
    batchBullets
  );

  if (!validated) {
    geminiResponse = await callRewriteModel({
      apiKey,
      config,
      userText: `${userText}\n\nReturn only the JSON array. One object per index.`,
      maxOutputTokens: maxOut,
    });
    validated = validateCompactBulletRewrites(
      parseJsonArrayFromModel(extractText(geminiResponse)),
      batchBullets
    );
  }

  const tokens = getUsageTokens(geminiResponse);
  const usage = {
    inputTokens: tokens.input,
    outputTokens: tokens.output,
    latencyMs: 0,
  };

  if (!validated) {
    return { rewrites: buildFallbackRewrites(batchBullets), usage, usedFallback: true };
  }

  return { rewrites: validated, usage, usedFallback: false };
}

async function run({ payload, apiKey, config }) {
  const bullets = normalizeBulletInput(payload.bullets);
  const jdRaw = typeof payload.jobDescriptionText === "string" ? payload.jobDescriptionText.trim() : "";
  const fitAnalysis = payload.fitAnalysis;

  if (bullets.length === 0) {
    throw Object.assign(new Error("At least one valid bullet is required (10–500 chars each)"), {
      code: "VALIDATION",
    });
  }
  if (jdRaw.length < 50) {
    throw Object.assign(new Error("Job description too short"), { code: "VALIDATION" });
  }

  const { textBlock, cacheKey: briefKey } = buildRewriteBrief(jdRaw, fitAnalysis);

  const cached = getCachedRewrites(bullets, briefKey);
  if (cached) {
    const changedCount = cached.filter((r) => !r.unchanged).length;
    return {
      result: {
        rewrites: cached,
        changedCount,
        totalCount: cached.length,
        usedFallback: false,
        cached: true,
      },
      geminiResponse: null,
      usage: { inputTokens: 0, outputTokens: 0, latencyMs: 0 },
    };
  }

  let totalUsage = { inputTokens: 0, outputTokens: 0, latencyMs: 0 };
  const allRewrites = [];
  let anyFallback = false;

  for (let start = 0; start < bullets.length; start += BATCH_SIZE) {
    const batchBullets = bullets.slice(start, start + BATCH_SIZE);
    const { rewrites, usage, usedFallback } = await rewriteBatch({
      batchBullets,
      briefText: textBlock,
      apiKey,
      config,
    });
    allRewrites.push(...rewrites);
    totalUsage = mergeUsage(totalUsage, usage);
    if (usedFallback) anyFallback = true;
  }

  setCachedRewrites(bullets, briefKey, allRewrites);

  const changedCount = allRewrites.filter((r) => !r.unchanged).length;

  return {
    result: {
      rewrites: allRewrites,
      changedCount,
      totalCount: allRewrites.length,
      usedFallback: anyFallback,
    },
    geminiResponse: null,
    usage: totalUsage,
  };
}

module.exports = { run };
