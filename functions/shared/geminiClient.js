const { callGeminiJson, streamGeminiText, extractText, getFinishReason, GEMINI_API_BASE } = require("../roleAlign/gemini");

function getUsageTokens(apiResponse) {
  const meta = apiResponse?.usageMetadata;
  return {
    input: meta?.promptTokenCount ?? 0,
    output: meta?.candidatesTokenCount ?? 0,
    total: meta?.totalTokenCount ?? 0,
  };
}

/** Token-efficient Gemini call, JSON mode, capped output. */
async function callGeminiJsonLean({
  apiKey,
  model,
  systemText,
  userText,
  temperature = 0.2,
  maxOutputTokens = 1024,
}) {
  return callGeminiJson({
    apiKey,
    model,
    systemText,
    userText,
    temperature,
    maxOutputTokens,
  });
}

module.exports = {
  GEMINI_API_BASE,
  callGeminiJson,
  callGeminiJsonLean,
  streamGeminiText,
  extractText,
  getFinishReason,
  getUsageTokens,
};
