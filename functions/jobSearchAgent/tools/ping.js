/** Zero-token health check, verifies routing without calling Gemini. */
async function run({ payload, metadata }) {
  return {
    result: {
      ok: true,
      tool: "ping",
      feature: metadata?.feature ?? null,
      workflow: metadata?.workflow ?? null,
      echo: typeof payload?.message === "string" ? payload.message.slice(0, 120) : null,
      serverTime: new Date().toISOString(),
    },
    geminiResponse: null,
  };
}

module.exports = { run };
