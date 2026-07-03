const { RESUME_OPTIMIZER_CONFIG_DEFAULTS, deepMerge } = require("./defaults");

let configCache = { data: null, fetchedAt: 0 };
const TTL_MS = 5 * 60 * 1000;

async function loadResumeOptimizerConfig(db) {
  if (configCache.data && Date.now() - configCache.fetchedAt < TTL_MS) {
    return configCache.data;
  }

  try {
    const snap = await db.doc("resume_optimizer_config/active").get();
    const remote = snap.exists ? snap.data() : {};
    const merged = deepMerge(RESUME_OPTIMIZER_CONFIG_DEFAULTS, remote);
    configCache = { data: merged, fetchedAt: Date.now() };
    return merged;
  } catch (err) {
    console.error("[ResumeOptimizer] Config load failed, using defaults:", err);
    return RESUME_OPTIMIZER_CONFIG_DEFAULTS;
  }
}

const rateLimitMap = new Map();

function checkRateLimit(ip, maxPerHour) {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  let entries = rateLimitMap.get(ip) || [];
  entries = entries.filter((t) => t > hourAgo);
  if (entries.length >= maxPerHour) return false;
  entries.push(now);
  rateLimitMap.set(ip, entries);
  return true;
}

function getProgressStep(config, stepId) {
  const steps = config.progressSteps || RESUME_OPTIMIZER_CONFIG_DEFAULTS.progressSteps;
  return steps.find((s) => s.id === stepId) || { id: stepId, label: stepId, progress: 0, detailTemplates: [] };
}

function pickDetail(step) {
  const templates = step.detailTemplates || [];
  if (!templates.length) return undefined;
  return templates[Math.floor(Math.random() * templates.length)];
}

module.exports = {
  loadResumeOptimizerConfig,
  checkRateLimit,
  getProgressStep,
  pickDetail,
};
