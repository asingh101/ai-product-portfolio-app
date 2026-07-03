"use client";

import { useState } from "react";
import type { ImpactLevel, Recommendation, RecommendationAction } from "@/lib/role-align/types";

type LabelUi = {
  actionLabels: Record<RecommendationAction, string>;
  impactLabels: Record<ImpactLevel, string>;
};

type Props = {
  ui: LabelUi;
  recommendations: Recommendation[];
  title: string;
  variant?: "full" | "summary";
};

function CopyButton({ text, label = "Copy suggestion" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="text-xs font-bold text-primary hover:opacity-80 flex items-center gap-1 shrink-0"
    >
      <span className="material-symbols-outlined text-sm">
        {copied ? "check" : "content_copy"}
      </span>
      {copied ? "Copied" : label}
    </button>
  );
}

function RecCardFull({
  rec,
  ui,
}: {
  rec: Recommendation;
  ui: LabelUi;
}) {
  return (
    <article className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-5">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase">
          {ui.actionLabels[rec.action]}
        </span>
        <span className="text-xs font-bold text-on-surface-variant capitalize">
          {rec.section.replace(/_/g, " ")}
        </span>
        <span className="text-xs font-bold text-on-surface-variant">
          · {ui.impactLabels[rec.impact]}
        </span>
      </div>
      <p className="text-sm font-bold text-on-surface mb-2">{rec.issue}</p>
      <p className="text-sm text-on-surface-variant mb-3 leading-relaxed">{rec.suggestion}</p>
      {rec.current_snippet && (
        <p className="text-xs text-on-surface-variant/80 italic border-l-2 border-outline-variant/30 pl-3 mb-3">
          Current: {rec.current_snippet}
        </p>
      )}
      {rec.jd_evidence.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {rec.jd_evidence.map((e) => (
            <span
              key={e}
              className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-surface-container text-on-surface-variant"
            >
              {e}
            </span>
          ))}
        </div>
      )}
      <CopyButton text={rec.suggestion} />
    </article>
  );
}

function RecCardSummary({
  rec,
  ui,
}: {
  rec: Recommendation;
  ui: LabelUi;
}) {
  return (
    <article className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-bold text-on-surface-variant capitalize">
              {rec.section.replace(/_/g, " ")}
            </span>
            <span className="text-xs font-bold text-on-surface-variant">
              · {ui.impactLabels[rec.impact]}
            </span>
          </div>
          <p className="text-sm font-bold text-on-surface leading-snug">{rec.issue}</p>
        </div>
        <CopyButton text={rec.suggestion} label="Copy" />
      </div>
    </article>
  );
}

export function RecommendationsPanel({ ui, recommendations, title, variant = "full" }: Props) {
  const high = recommendations.filter((r) => r.impact === "high");
  const medium = recommendations.filter((r) => r.impact === "medium");
  const low = recommendations.filter((r) => r.impact === "low");
  const isSummary = variant === "summary";
  const RecCard = isSummary ? RecCardSummary : RecCardFull;

  if (!recommendations.length) return null;

  return (
    <section>
      <h3 className="text-xl font-extrabold font-[family-name:var(--font-headline)] mb-6">
        {title}
      </h3>
      <div className="space-y-8">
        {high.length > 0 && (
          <div>
            {!isSummary && (
              <h4 className="text-xs font-bold uppercase tracking-widest text-rose-700 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">priority_high</span>
                High impact
              </h4>
            )}
            <div className={isSummary ? "space-y-2" : "space-y-3"}>
              {high.map((rec) => (
                <RecCard key={rec.id} rec={rec} ui={ui} />
              ))}
            </div>
          </div>
        )}
        {medium.length > 0 && (
          <div>
            {!isSummary && (
              <h4 className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-3">
                Medium impact
              </h4>
            )}
            <div className={isSummary ? "space-y-2" : "space-y-3"}>
              {medium.map((rec) => (
                <RecCard key={rec.id} rec={rec} ui={ui} />
              ))}
            </div>
          </div>
        )}
        {low.length > 0 && (
          <div>
            {!isSummary && (
              <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                Quick improvements
              </h4>
            )}
            <div className={isSummary ? "space-y-2" : "space-y-3"}>
              {low.map((rec) => (
                <RecCard key={rec.id} rec={rec} ui={ui} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
