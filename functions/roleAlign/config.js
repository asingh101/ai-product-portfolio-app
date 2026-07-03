const { ROLE_ALIGN_CONFIG_DEFAULTS, deepMerge } = require("./defaults");

let configCache = { data: null, fetchedAt: 0 };
const TTL_MS = 5 * 60 * 1000;

async function loadRoleAlignConfig(db) {
  if (configCache.data && Date.now() - configCache.fetchedAt < TTL_MS) {
    return configCache.data;
  }

  try {
    const snap = await db.doc("role_align_config/active").get();
    const remote = snap.exists ? snap.data() : {};
    const merged = deepMerge(ROLE_ALIGN_CONFIG_DEFAULTS, remote);
    configCache = { data: merged, fetchedAt: Date.now() };
    return merged;
  } catch (err) {
    console.error("[RoleAlign] Config load failed, using defaults:", err);
    return ROLE_ALIGN_CONFIG_DEFAULTS;
  }
}

function bustConfigCache() {
  configCache = { data: null, fetchedAt: 0 };
}

const rateLimitMap = new Map();

function checkRateLimit(ip, maxPerHour) {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  let entries = rateLimitMap.get(ip) || [];
  entries = entries.filter((t) => t > hourAgo);
  if (entries.length >= maxPerHour) {
    return false;
  }
  entries.push(now);
  rateLimitMap.set(ip, entries);
  return true;
}

function getProgressStep(config, stepId) {
  const steps = config.progressSteps || ROLE_ALIGN_CONFIG_DEFAULTS.progressSteps;
  return steps.find((s) => s.id === stepId) || { id: stepId, label: stepId, progress: 0, detailTemplates: [] };
}

function pickDetail(step) {
  const templates = step.detailTemplates || [];
  if (!templates.length) return undefined;
  return templates[Math.floor(Math.random() * templates.length)];
}

module.exports = {
  loadRoleAlignConfig,
  bustConfigCache,
  checkRateLimit,
  getProgressStep,
  pickDetail,
};
