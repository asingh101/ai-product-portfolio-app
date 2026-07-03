"use client";

import { useCallback, useRef, useState } from "react";
import { callToolStream } from "@/lib/job-search-agent/apiClient";
import type {
  AgentToolUsage,
  CoverLetterPayload,
  CoverLetterResult,
  CoverLetterTone,
} from "@/lib/job-search-agent/types";

export type CoverLetterPhase = "idle" | "running" | "complete" | "error";

export function useJobSearchCoverLetter() {
  const [phase, setPhase] = useState<CoverLetterPhase>("idle");
  const [streamedText, setStreamedText] = useState("");
  const [result, setResult] = useState<CoverLetterResult | null>(null);
  const [usage, setUsage] = useState<AgentToolUsage | null>(null);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase("idle");
    setStreamedText("");
    setResult(null);
    setUsage(null);
    setError(null);
  }, []);

  const runCoverLetter = useCallback(async (payload: CoverLetterPayload): Promise<CoverLetterPhase> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPhase("running");
    setStreamedText("");
    setResult(null);
    setUsage(null);
    setError(null);

    let outcome: CoverLetterPhase = "error";

    await callToolStream(
      "draft_cover_letter",
      payload as unknown as Record<string, unknown>,
      { workflow: "draft_cover_letter" },
      {
        onChunk: (text) => {
          setStreamedText((prev) => prev + text);
        },
        onReplace: (letter) => {
          setStreamedText(letter);
        },
        onComplete: (coverResult, toolUsage) => {
          setResult(coverResult);
          setStreamedText(coverResult.letter);
          setUsage(toolUsage);
          setPhase("complete");
          outcome = "complete";
        },
        onError: (code, message) => {
          setError({ code, message });
          setPhase("error");
          outcome = "error";
        },
      },
      controller.signal
    );

    if (controller.signal.aborted) return "idle";
    return outcome;
  }, []);

  return { phase, streamedText, result, usage, error, runCoverLetter, reset };
};

export const COVER_LETTER_TONES: { id: CoverLetterTone; label: string }[] = [
  { id: "confident", label: "Confident" },
  { id: "collaborative", label: "Collaborative" },
  { id: "concise", label: "Concise" },
];
