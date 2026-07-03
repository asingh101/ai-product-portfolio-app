const {
  loadResumeOptimizerConfig,
  checkRateLimit,
  getProgressStep,
  pickDetail,
} = require("./config");
const { runPipeline } = require("./pipeline");

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.ip || "unknown";
}

function writeSse(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function createResumeOptimizerHandler({ db, geminiApiKey }) {
  return async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const wantsSse =
      req.headers.accept?.includes("text/event-stream") || req.query?.stream === "1";

    try {
      const apiKey = geminiApiKey.value();
      if (!apiKey) {
        const err = { code: "CONFIG", message: "Gemini API key not configured", retryable: false };
        if (wantsSse) {
          res.setHeader("Content-Type", "text/event-stream");
          writeSse(res, "error", err);
          res.end();
        } else {
          res.status(500).json(err);
        }
        return;
      }

      const config = await loadResumeOptimizerConfig(db);
      const ip = getClientIp(req);
      const maxRuns = config.rateLimit?.maxRunsPerHourPerIp ?? 10;

      if (!checkRateLimit(ip, maxRuns)) {
        const err = {
          code: "RATE_LIMIT",
          message: "Too many analyses. Please try again in an hour.",
          retryable: true,
        };
        if (wantsSse) {
          res.setHeader("Content-Type", "text/event-stream");
          writeSse(res, "error", err);
          res.end();
        } else {
          res.status(429).json(err);
        }
        return;
      }

      const emitProgress = (stepId) => {
        const step = getProgressStep(config, stepId);
        writeSse(res, "progress", {
          step: stepId,
          progress: step.progress,
          label: step.label,
          detail: pickDetail(step),
        });
      };

      if (wantsSse) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders?.();
      }

      const progress = async (stepId) => {
        if (wantsSse) emitProgress(stepId);
      };

      if (wantsSse) emitProgress("validate");

      const body = req.body || {};
      if (!body.resumeText?.trim() || !body.jobDescriptions?.length) {
        const err = {
          code: "VALIDATION",
          message: "Resume text and job descriptions are required",
          retryable: false,
        };
        if (wantsSse) {
          writeSse(res, "error", err);
          res.end();
        } else {
          res.status(400).json(err);
        }
        return;
      }

      if (wantsSse) emitProgress("normalize");

      const { report, meta } = await runPipeline({
        apiKey,
        config,
        body,
        onProgress: progress,
      });

      if (wantsSse) emitProgress("finalize");

      if (wantsSse) {
        writeSse(res, "complete", { report, meta });
        res.end();
      } else {
        res.json({ report, meta });
      }
    } catch (error) {
      console.error("[ResumeOptimizer Error]", error);
      const errPayload = {
        code: error.code || "INTERNAL",
        message: error.message || "Analysis failed",
        retryable: error.code === "PARSE_ERROR" || error.code === "RATE_LIMIT",
      };
      if (wantsSse && !res.headersSent) {
        res.setHeader("Content-Type", "text/event-stream");
      }
      if (wantsSse) {
        writeSse(res, "error", errPayload);
        res.end();
      } else if (!res.headersSent) {
        res.status(500).json(errPayload);
      }
    }
  };
}

module.exports = { createResumeOptimizerHandler };
