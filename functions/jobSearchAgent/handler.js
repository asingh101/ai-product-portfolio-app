const { ALLOWED_TOOLS, JOB_SEARCH_AGENT_DEFAULTS } = require("./config");
const { getTool } = require("./tools");
const { getUsageTokens } = require("../shared/geminiClient");

const rateLimitMap = new Map();

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.ip || "unknown";
}

function checkRateLimit(ip) {
  const max = JOB_SEARCH_AGENT_DEFAULTS.rateLimit.maxRunsPerHourPerIp;
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  let entries = rateLimitMap.get(ip) || [];
  entries = entries.filter((t) => t > hourAgo);
  if (entries.length >= max) return false;
  entries.push(now);
  rateLimitMap.set(ip, entries);
  return true;
}

function normalizeMetadata(raw) {
  if (!raw || typeof raw !== "object") return {};
  return {
    feature: typeof raw.feature === "string" ? raw.feature.slice(0, 64) : undefined,
    workflow: typeof raw.workflow === "string" ? raw.workflow.slice(0, 64) : undefined,
    sessionId: typeof raw.sessionId === "string" ? raw.sessionId.slice(0, 128) : undefined,
  };
}

function buildUsage(geminiResponse, latencyMs, streamUsage) {
  if (streamUsage) {
    return {
      inputTokens: streamUsage.input ?? 0,
      outputTokens: streamUsage.output ?? 0,
      latencyMs,
    };
  }
  const tokens = geminiResponse ? getUsageTokens(geminiResponse) : { input: 0, output: 0, total: 0 };
  return {
    inputTokens: tokens.input,
    outputTokens: tokens.output,
    latencyMs,
  };
}

function logToolRun({ tool, metadata, usage, ok, errorCode }) {
  console.log(
    JSON.stringify({
      event: "agent_tool",
      tool,
      feature: metadata?.feature ?? "job_search_agent",
      workflow: metadata?.workflow ?? null,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      latencyMs: usage.latencyMs,
      ok,
      errorCode: errorCode ?? null,
    })
  );
}

function writeSse(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function wantsSse(req) {
  return (
    req.headers.accept?.includes("text/event-stream") ||
    req.query?.stream === "1" ||
    req.body?.stream === true
  );
}

async function executeTool({ tool, payload, metadata, apiKey, clientIp }) {
  const impl = getTool(tool);
  if (!impl) {
    const err = Object.assign(new Error(`Unknown tool: ${tool}`), { code: "UNKNOWN_TOOL" });
    throw err;
  }

  const safePayload = payload && typeof payload === "object" ? payload : {};
  return impl.run({
    payload: safePayload,
    metadata,
    apiKey,
    config: JOB_SEARCH_AGENT_DEFAULTS,
    clientIp,
  });
}

async function executeToolStream({ tool, payload, metadata, apiKey, res, clientIp }) {
  const impl = getTool(tool);
  if (!impl || typeof impl.runStream !== "function") {
    const err = Object.assign(new Error(`Tool does not support streaming: ${tool}`), {
      code: "NOT_IMPLEMENTED",
    });
    throw err;
  }

  const safePayload = payload && typeof payload === "object" ? payload : {};
  return impl.runStream({
    payload: safePayload,
    metadata,
    apiKey,
    config: JOB_SEARCH_AGENT_DEFAULTS,
    clientIp,
    onChunk: (text) => writeSse(res, "chunk", { text }),
    onReplace: (letter) => writeSse(res, "replace", { letter }),
  });
}

function createRunAgentToolHandler({ geminiApiKey }) {
  return async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED", message: "POST required" } });
      return;
    }

    const started = Date.now();
    const sse = wantsSse(req);
    const { tool, payload, metadata: rawMetadata } = req.body || {};
    const metadata = normalizeMetadata(rawMetadata);

    try {
      const apiKey = geminiApiKey.value();
      if (!apiKey) {
        if (sse) {
          res.setHeader("Content-Type", "text/event-stream");
          writeSse(res, "error", { code: "CONFIG", message: "Gemini API key not configured" });
          res.end();
        } else {
          res.status(500).json({
            error: { code: "CONFIG", message: "Gemini API key not configured" },
          });
        }
        return;
      }

      const ip = getClientIp(req);

      if (tool !== "analyze_fit" && tool !== "ping") {
        if (!checkRateLimit(ip)) {
          const err = {
            code: "RATE_LIMIT",
            message: "Too many requests. Try again later.",
          };
          if (sse) {
            res.setHeader("Content-Type", "text/event-stream");
            writeSse(res, "error", err);
            res.end();
          } else {
            res.status(429).json({ error: err });
          }
          return;
        }
      }

      if (!tool || typeof tool !== "string") {
        res.status(400).json({
          error: { code: "VALIDATION", message: "tool is required" },
        });
        return;
      }

      if (!ALLOWED_TOOLS.has(tool)) {
        res.status(400).json({
          error: { code: "UNKNOWN_TOOL", message: `Tool not registered: ${tool}` },
        });
        return;
      }

      if (!getTool(tool)) {
        res.status(501).json({
          error: { code: "NOT_IMPLEMENTED", message: `Tool not implemented yet: ${tool}` },
        });
        return;
      }

      const impl = getTool(tool);
      const useStream = sse && typeof impl.runStream === "function";

      if (useStream) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders?.();

        const { result, usage: streamUsage } = await executeToolStream({
          tool,
          payload,
          metadata,
          apiKey,
          res,
          clientIp: ip,
        });

        const usage = buildUsage(null, Date.now() - started, streamUsage);
        logToolRun({ tool, metadata, usage, ok: true });
        writeSse(res, "complete", { result, usage });
        res.end();
        return;
      }

      const { result, geminiResponse, usage: toolUsage } = await executeTool({
        tool,
        payload,
        metadata,
        apiKey,
        clientIp: ip,
      });

      const usage =
        toolUsage && typeof toolUsage.inputTokens === "number"
          ? { ...toolUsage, latencyMs: Date.now() - started }
          : buildUsage(geminiResponse, Date.now() - started);

      logToolRun({ tool, metadata, usage, ok: true });
      res.json({ result, usage });
    } catch (error) {
      const code = error.code || "INTERNAL";
      const message = error.message || "Tool execution failed";
      const usage = buildUsage(null, Date.now() - started);

      logToolRun({
        tool: tool ?? "unknown",
        metadata,
        usage,
        ok: false,
        errorCode: code,
      });

      console.error("[runAgentTool]", code, message);

      if (sse && res.headersSent) {
        writeSse(res, "error", { code, message });
        res.end();
        return;
      }

      const status =
        code === "VALIDATION" || code === "UNKNOWN_TOOL"
          ? 400
          : code === "RATE_LIMIT"
            ? 429
            : code === "NOT_IMPLEMENTED"
              ? 501
              : 500;

      res.status(status).json({
        error: {
          code,
          message,
          retryAfterSeconds: error.retryAfterSeconds,
        },
        usage,
      });
    }
  };
}

module.exports = { createRunAgentToolHandler };
