"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AgentToolUsage, BulletRewriteItem } from "@/lib/job-search-agent/types";

type Props = {
  rewrites: BulletRewriteItem[];
  usage?: AgentToolUsage | null;
  usedFallback?: boolean;
  onAcceptedBulletsChange?: (bullets: string[]) => void;
};

export function BulletRewritePanel({ rewrites, usage, usedFallback, onAcceptedBulletsChange }: Props) {
  const rewrittenOnly = useMemo(() => rewrites.filter((r) => !r.unchanged), [rewrites]);
  const omittedCount = rewrites.length - rewrittenOnly.length;

  const [accepted, setAccepted] = useState<Record<number, boolean>>({});
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    const initial: Record<number, boolean> = {};
    rewrittenOnly.forEach((_, i) => {
      initial[i] = true;
    });
    setAccepted(initial);
  }, [rewrittenOnly]);

  const acceptedBullets = useMemo(
    () =>
      rewrittenOnly
        .map((item, i) => (accepted[i] ? item.rewritten : null))
        .filter((b): b is string => Boolean(b)),
    [rewrittenOnly, accepted]
  );

  useEffect(() => {
    onAcceptedBulletsChange?.(acceptedBullets);
  }, [acceptedBullets, onAcceptedBulletsChange]);

  const toggleAccepted = (index: number) => {
    setAccepted((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const copyBullet = useCallback(async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, []);

  const copyAllAccepted = useCallback(async () => {
    if (!acceptedBullets.length) return;
    try {
      await navigator.clipboard.writeText(acceptedBullets.map((b) => `• ${b}`).join("\n"));
      setCopiedIndex(-1);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [acceptedBullets]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold font-[family-name:var(--font-headline)]">Bullet rewrites</h3>
          <p className="text-sm text-on-surface-variant mt-1">
            {rewrittenOnly.length === 0
              ? "No bullets needed reframing for this role."
              : `${rewrittenOnly.length} bullet${rewrittenOnly.length === 1 ? "" : "s"} reframed for this role. Accept or reject each suggestion.`}
            {omittedCount > 0 && rewrittenOnly.length > 0 && (
              <span className="block text-xs mt-1 text-on-surface-variant/80">
                {omittedCount} other bullet{omittedCount === 1 ? " was" : "s were"} already well-targeted and
                omitted.
              </span>
            )}
          </p>
        </div>
        {rewrittenOnly.length > 0 && (
          <div className="flex items-center gap-2">
            {usage && (
              <span className="text-[10px] text-on-surface-variant">
                {usage.latencyMs}ms · {usage.inputTokens + usage.outputTokens} tokens
              </span>
            )}
            <button
              type="button"
              onClick={copyAllAccepted}
              disabled={acceptedBullets.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-outline-variant/25 text-xs font-bold text-on-surface-variant hover:text-primary disabled:opacity-50 transition-colors"
            >
              <span className="material-symbols-outlined text-base">content_copy</span>
              {copiedIndex === -1 ? "Copied!" : `Copy ${acceptedBullets.length} accepted`}
            </button>
          </div>
        )}
      </div>

      {usedFallback && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Could not validate AI rewrites, try again or edit bullets manually.
        </div>
      )}

      {rewrittenOnly.length === 0 && !usedFallback && (
        <p className="text-sm text-on-surface-variant rounded-xl border border-outline-variant/15 bg-surface-container-lowest px-4 py-3">
          Your experience bullets already align well with this job description.
        </p>
      )}

      <ul className="space-y-4">
        {rewrittenOnly.map((item, i) => {
          const isAccepted = accepted[i] ?? false;

          return (
            <li
              key={`${item.original.slice(0, 40)}-${i}`}
              className={`rounded-2xl border p-5 transition-colors ${
                isAccepted
                  ? "border-primary/30 bg-primary-fixed/20"
                  : "border-outline-variant/15 bg-surface-container-lowest opacity-80"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-[10px] font-bold uppercase tracking-wider text-indigo-800">
                  Rewritten
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyBullet(item.rewritten, i)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-on-surface-variant hover:text-primary"
                  >
                    <span className="material-symbols-outlined text-base">content_copy</span>
                    {copiedIndex === i ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleAccepted(i)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                      isAccepted
                        ? "bg-primary text-on-primary"
                        : "border border-outline-variant/25 text-on-surface-variant"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {isAccepted ? "check_circle" : "radio_button_unchecked"}
                    </span>
                    {isAccepted ? "Accepted" : "Accept"}
                  </button>
                </div>
              </div>

              <p className="text-xs text-on-surface-variant mb-2 line-through decoration-on-surface-variant/40">
                {item.original}
              </p>
              <p className="text-sm text-on-surface leading-relaxed font-medium">{item.rewritten}</p>
              {item.changedBecause && (
                <p className="text-xs text-on-surface-variant mt-3 italic">{item.changedBecause}</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
