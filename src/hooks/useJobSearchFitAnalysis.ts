"use client";

import { useCallback, useRef, useState } from "react";
import { callTool } from "@/lib/job-search-agent/apiClient";
import { hashFitInputs } from "@/lib/job-search-agent/fitInputHash";
import type { AgentToolUsage, FitAnalysisPayload, FitAnalysisResult } from "@/lib/job-search-agent/types";
import { AgentToolError } from "@/lib/job-search-agent/types";

export type FitAnalysisPhase = "idle" | "running" | "complete" | "error";

const resultCache = new Map<string, { result: FitAnalysisResult; usage: AgentToolUsage | null }>();

/** Minimum time the fit progress UI runs so the bar animates 0→100% smoothly. */
const MIN_FIT_PROGRESS_MS = 4000;

export function useJobSearchFitAnalysis() {
  const [phase, setPhase] = useState<FitAnalysisPhase>("idle");
  const [result, setResult] = useState<FitAnalysisResult | null>(null);
  const [usage, setUsage] = useState<AgentToolUsage | null>(null);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const runIdRef = useRef(0);

  const reset = useCallback(() => {
    setPhase("idle");
    setResult(null);
    setUsage(null);
    setError(null);
  }, []);

  const runFitAnalysis = useCallback(async (payload: FitAnalysisPayload) => {
    const cacheKey = hashFitInputs(payload.resumeText, payload.jobDescriptionText);
    const cached = resultCache.get(cacheKey);
    const runId = ++runIdRef.current;
    setPhase("running");
    setResult(null);
    setUsage(null);
    setError(null);

    const minProgressDelay = new Promise((r) => setTimeout(r, MIN_FIT_PROGRESS_MS));

    try {
      if (cached) {
        await minProgressDelay;
        if (runId !== runIdRef.current) return;
        setResult(cached.result);
        setUsage(cached.usage);
        setPhase("complete");
        return;
      }

      const [{ result: fit, usage: toolUsage }] = await Promise.all([
        callTool<FitAnalysisResult>("analyze_fit", payload, { workflow: "analyze_fit" }),
        minProgressDelay,
      ]);
      if (runId !== runIdRef.current) return;

      resultCache.set(cacheKey, { result: fit, usage: toolUsage });
      setResult(fit);
      setUsage(toolUsage);
      setPhase("complete");
    } catch (err) {
      if (runId !== runIdRef.current) return;
      const code = err instanceof AgentToolError ? err.code : "INTERNAL";
      const message = err instanceof Error ? err.message : "Analysis failed";
      setError({ code, message });
      setPhase("error");
    }
  }, []);

  return { phase, result, usage, error, runFitAnalysis, reset };
}
