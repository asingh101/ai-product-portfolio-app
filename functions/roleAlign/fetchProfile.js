const { mapProxycurlToProfile } = require("./mapProxycurl");
const { checkRateLimit } = require("./config");

const LINKEDIN_URL_RE = /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w%-]+\/?$/i;
const PROXYCURL_BASE = "https://nubela.co/proxycurl/api/v2/linkedin";
const FETCH_TIMEOUT_MS = 8000;

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.ip || "unknown";
}

async function fetchFromProxycurl(linkedInUrl, apiKey) {
  const url = `${PROXYCURL_BASE}?linkedin_profile_url=${encodeURIComponent(linkedInUrl)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const err = new Error(
        res.status === 404
          ? "LinkedIn profile not found or is private."
          : res.status === 429
            ? "Profile fetch rate limit reached. Try again shortly."
            : `Profile fetch failed (${res.status})`
      );
      err.code = res.status === 404 ? "NOT_FOUND" : res.status === 429 ? "RATE_LIMIT" : "FETCH_ERROR";
      err.retryable = res.status === 429 || res.status >= 500;
      err.detail = body.slice(0, 200);
      throw err;
    }

    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function createFetchProfileHandler() {
  return async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const apiKey = process.env.PROXYCURL_API_KEY || "";
      if (!apiKey) {
        res.status(500).json({
          code: "CONFIG",
          message: "Proxycurl API key not configured",
          retryable: false,
        });
        return;
      }

      const ip = getClientIp(req);
      if (!checkRateLimit(`fetch:${ip}`, 15)) {
        res.status(429).json({
          code: "RATE_LIMIT",
          message: "Too many profile fetches. Please try again in an hour.",
          retryable: true,
        });
        return;
      }

      const linkedInUrl = (req.body?.linkedInUrl || "").trim();
      if (!linkedInUrl || !LINKEDIN_URL_RE.test(linkedInUrl)) {
        res.status(400).json({
          code: "VALIDATION",
          message: "Enter a valid LinkedIn profile URL (linkedin.com/in/…).",
          retryable: false,
        });
        return;
      }

      const raw = await fetchFromProxycurl(linkedInUrl, apiKey);
      const mapped = mapProxycurlToProfile(raw, linkedInUrl);

      res.json({
        ok: true,
        ...mapped,
        fetchMeta: { source: "proxycurl", partial: false },
      });
    } catch (error) {
      console.error("[RoleAlign Fetch]", error);
      const status =
        error.code === "NOT_FOUND"
          ? 404
          : error.code === "RATE_LIMIT"
            ? 429
            : error.name === "AbortError"
              ? 504
              : 500;

      res.status(status).json({
        ok: false,
        code: error.code || (error.name === "AbortError" ? "TIMEOUT" : "FETCH_ERROR"),
        message:
          error.name === "AbortError"
            ? "Profile fetch timed out. You can continue with manual fields."
            : error.message || "Failed to fetch LinkedIn profile",
        retryable: error.retryable ?? error.name === "AbortError",
      });
    }
  };
}

module.exports = { createFetchProfileHandler };
