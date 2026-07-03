const crypto = require("crypto");

const MAX_ENTRIES = 200;
const cache = new Map();

function hashRewriteInputs(bullets, briefKey) {
  const payload = bullets.join("\n") + "\n---\n" + briefKey;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

function getCachedRewrites(bullets, briefKey) {
  const key = hashRewriteInputs(bullets, briefKey);
  const entry = cache.get(key);
  if (!entry) return null;
  return entry.rewrites;
}

function setCachedRewrites(bullets, briefKey, rewrites) {
  const key = hashRewriteInputs(bullets, briefKey);
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(key, { rewrites, ts: Date.now() });
}

module.exports = { getCachedRewrites, setCachedRewrites };
