"use client";

import { useCallback, useRef, useState } from "react";
import type {
  AnalyzeRequest,
  CompleteEvent,
  ErrorEvent,
  ProgressEvent,
} from "@/lib/role-align/types";

export type AnalysisPhase = "idle" | "running" | "complete" | "error";

export function useRoleAlignAnalysis() {
  const [phase, setPhase] = useState<AnalysisPhase>("idle");
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const [result, setResult] = useState<CompleteEvent | null>(null);
  const [error, setError] = useState<ErrorEvent | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase("idle");
    setProgress(null);
    setResult(null);
    setError(null);
  }, []);

  const runAnalysis = useCallback(async (payload: AnalyzeRequest) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPhase("running");
    setProgress(null);
    setResult(null);
    setError(null);

    const apiUrl =
      process.env.NEXT_PUBLIC_ROLE_ALIGN_API_URL ||
      process.env.NEXT_PUBLIC_CHAT_API_URL?.replace(/\/chat\/?$/, "/roleAlignAnalyze") ||
      "";

    if (!apiUrl) {
      setError({
        code: "CONFIG",
        message:
          "Analysis API is not configured. Set NEXT_PUBLIC_ROLE_ALIGN_API_URL to your deployed Cloud Function URL.",
        retryable: false,
      });
      setPhase("error");
      return;
    }

    let completed = false;

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok && !res.headers.get("content-type")?.includes("text/event-stream")) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || `API error ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("No response stream");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";

        for (const chunk of chunks) {
          const lines = chunk.split("\n");
          let eventType = "message";
          let dataLine = "";

          for (const line of lines) {
            if (line.startsWith("event:")) eventType = line.slice(6).trim();
            if (line.startsWith("data:")) dataLine += line.slice(5).trim();
          }

          if (!dataLine) continue;

          try {
            const data = JSON.parse(dataLine);
            if (eventType === "progress") {
              setProgress(data as ProgressEvent);
            } else if (eventType === "complete") {
              completed = true;
              setResult(data as CompleteEvent);
              setPhase("complete");
            } else if (eventType === "error") {
              completed = true;
              setError(data as ErrorEvent);
              setPhase("error");
            }
          } catch {
            // ignore malformed chunks
          }
        }
      }

      if (!completed) {
        setError({
          code: "STREAM_END",
          message: "Analysis ended unexpectedly. Please try again.",
          retryable: true,
        });
        setPhase("error");
      }
    } catch (e) {
      if (controller.signal.aborted) return;
      setError({
        code: "NETWORK",
        message: e instanceof Error ? e.message : "Analysis failed",
        retryable: true,
      });
      setPhase("error");
    }
  }, []);

  return {
    phase,
    progress,
    result,
    error,
    runAnalysis,
    reset,
  };
}
