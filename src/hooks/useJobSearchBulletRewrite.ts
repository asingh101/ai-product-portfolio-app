"use client";

import { useCallback, useState } from "react";
import { callTool } from "@/lib/job-search-agent/apiClient";
import type { AgentToolUsage, BulletRewritePayload, BulletRewriteResult } from "@/lib/job-search-agent/types";
import { AgentToolError } from "@/lib/job-search-agent/types";

export type BulletRewritePhase = "idle" | "running" | "complete" | "error";

export function useJobSearchBulletRewrite() {
  const [phase, setPhase] = useState<BulletRewritePhase>("idle");
  const [result, setResult] = useState<BulletRewriteResult | null>(null);
  const [usage, setUsage] = useState<AgentToolUsage | null>(null);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  const reset = useCallback(() => {
    setPhase("idle");
    setResult(null);
    setUsage(null);
    setError(null);
  }, []);

  const runBulletRewrite = useCallback(async (payload: BulletRewritePayload): Promise<BulletRewriteResult | null> => {
    setPhase("running");
    setResult(null);
    setUsage(null);
    setError(null);

    try {
      const { result: rewrite, usage: toolUsage } = await callTool<BulletRewriteResult>(
        "rewrite_bullets",
        payload,
        { workflow: "rewrite_bullets" }
      );
      setResult(rewrite);
      setUsage(toolUsage);
      setPhase("complete");
      return rewrite;
    } catch (err) {
      const code = err instanceof AgentToolError ? err.code : "INTERNAL";
      const message = err instanceof Error ? err.message : "Bullet rewrite failed";
      setError({ code, message });
      setPhase("error");
      return null;
    }
  }, []);

  return { phase, result, usage, error, runBulletRewrite, reset };
};
