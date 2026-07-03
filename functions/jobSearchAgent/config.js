/** Default model: fast + cheap for agent tools */
const DEFAULT_MODEL = "gemini-3.1-flash-lite-preview";

const JOB_SEARCH_AGENT_DEFAULTS = {
  model: DEFAULT_MODEL,
  rateLimit: {
    maxFitScansPerHourPerIp: 5,
    maxRunsPerHourPerIp: 30,
  },
  tools: {
    ping: { maxOutputTokens: 0 },
    analyze_fit: { maxOutputTokens: 1200 },
    rewrite_bullets: { maxOutputTokens: 4096 },
    draft_cover_letter: { maxOutputTokens: 900 },
  },
};

const ALLOWED_TOOLS = new Set(Object.keys(JOB_SEARCH_AGENT_DEFAULTS.tools));

module.exports = { JOB_SEARCH_AGENT_DEFAULTS, DEFAULT_MODEL, ALLOWED_TOOLS };
