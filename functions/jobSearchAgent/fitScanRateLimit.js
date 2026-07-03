const fitScanMap = new Map();
const HOUR_MS = 60 * 60 * 1000;

function pruneEntries(entries, hourAgo) {
  return entries.filter((t) => t > hourAgo);
}

function checkFitScanRateLimit(ip, maxPerHour = 5) {
  const now = Date.now();
  const hourAgo = now - HOUR_MS;
  const entries = pruneEntries(fitScanMap.get(ip) || [], hourAgo);

  if (entries.length >= maxPerHour) {
    const oldest = entries[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + HOUR_MS - now) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

function recordFitScan(ip) {
  const now = Date.now();
  const hourAgo = now - HOUR_MS;
  const entries = pruneEntries(fitScanMap.get(ip) || [], hourAgo);
  entries.push(now);
  fitScanMap.set(ip, entries);
}

module.exports = { checkFitScanRateLimit, recordFitScan };
