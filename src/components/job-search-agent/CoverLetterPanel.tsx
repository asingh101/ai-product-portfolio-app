"use client";

import { useCallback, useState } from "react";
import type { AgentToolUsage, CoverLetterResult, CoverLetterTone } from "@/lib/job-search-agent/types";
import { COVER_LETTER_TONES } from "@/hooks/useJobSearchCoverLetter";

type Props = {
  tone: CoverLetterTone;
  onToneChange: (tone: CoverLetterTone) => void;
  onDraft: () => void;
  disabled?: boolean;
  drafting?: boolean;
  canDraft: boolean;
};

export function CoverLetterControls({
  tone,
  onToneChange,
  onDraft,
  disabled,
  drafting,
  canDraft,
}: Props) {
  return (
    <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-low/50 p-5 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-on-surface mb-1">Cover letter</h3>
        <p className="text-xs text-on-surface-variant">
          Drafted from your fit analysis, names matched skills and addresses your top gap.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {COVER_LETTER_TONES.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={disabled || drafting}
            onClick={() => onToneChange(t.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${
              tone === t.id
                ? "bg-primary text-on-primary"
                : "border border-outline-variant/25 text-on-surface-variant hover:text-primary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onDraft}
        disabled={disabled || drafting || !canDraft}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        <span className="material-symbols-outlined text-lg">
          {drafting ? "hourglass_top" : "description"}
        </span>
        {drafting ? "Drafting…" : "Draft cover letter"}
      </button>
    </div>
  );
}

type PanelProps = {
  text: string;
  result: CoverLetterResult | null;
  usage?: AgentToolUsage | null;
  streaming?: boolean;
};

export function CoverLetterPanel({ text, result, usage, streaming }: PanelProps) {
  const [copied, setCopied] = useState(false);

  const copyLetter = useCallback(async () => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [text]);

  if (!text && !streaming) return null;

  const wordCount = result?.wordCount ?? text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6 md:p-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold font-[family-name:var(--font-headline)]">Cover letter</h3>
          {result && (
            <p className="text-sm text-on-surface-variant mt-1">
              {result.roleTitle} at {result.company}
              {result.matchedSkillsUsed.length > 0 && (
                <> · Skills: {result.matchedSkillsUsed.slice(0, 4).join(", ")}</>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {usage && !streaming && (
            <span className="text-[10px] text-on-surface-variant">
              {usage.latencyMs}ms · {usage.inputTokens + usage.outputTokens} tokens
            </span>
          )}
          <span className="text-[10px] text-on-surface-variant">{wordCount} words</span>
          <button
            type="button"
            onClick={copyLetter}
            disabled={!text.trim() || streaming}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-outline-variant/25 text-xs font-bold text-on-surface-variant hover:text-primary disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">content_copy</span>
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {result?.repaired && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          First draft was adjusted to meet quality checks.
        </p>
      )}

      <div
        className={`prose prose-sm max-w-none text-on-surface leading-relaxed whitespace-pre-wrap ${
          streaming ? "opacity-90" : ""
        }`}
      >
        {text}
        {streaming && (
          <span className="inline-block w-2 h-4 ml-0.5 bg-primary/60 animate-pulse align-middle" />
        )}
      </div>
    </div>
  );
}
