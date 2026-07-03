"use client";

import type { AgentToolUsage, FitAnalysisResult, FitTier } from "@/lib/job-search-agent/types";

const TIER_LABELS: Record<FitTier, string> = {
  strong: "Strong fit",
  reach: "Reach",
  weak: "Weak fit",
};

const TIER_STYLES: Record<FitTier, string> = {
  strong: "bg-emerald-100 text-emerald-800 border-emerald-200",
  reach: "bg-amber-100 text-amber-900 border-amber-200",
  weak: "bg-rose-100 text-rose-800 border-rose-200",
};

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-36 h-36 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120" aria-hidden>
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-surface-container-high"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="url(#fitScoreGradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id="fitScoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3525cd" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold font-[family-name:var(--font-headline)] text-on-surface">
          {score}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          fit score
        </span>
      </div>
    </div>
  );
}

function SkillList({
  title,
  items,
  icon,
  empty,
  tone,
}: {
  title: string;
  items: string[];
  icon: string;
  empty: string;
  tone: "positive" | "negative";
}) {
  const toneClass = tone === "positive" ? "text-emerald-700" : "text-rose-700";

  return (
    <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-1.5">
        <span className={`material-symbols-outlined text-base ${toneClass}`}>{icon}</span>
        {title}
      </h4>
      {items.length === 0 ? (
        <p className="text-sm text-on-surface-variant">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item} className="text-sm text-on-surface leading-relaxed flex gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type Props = {
  result: FitAnalysisResult;
  usage?: AgentToolUsage | null;
};

export function FitAnalysisPanel({ result, usage }: Props) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          <ScoreRing score={result.score} />
          <div className="flex-1 text-center md:text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              Fit analysis
            </p>
            <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start mb-4">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${TIER_STYLES[result.tier]}`}
              >
                {TIER_LABELS[result.tier]}
              </span>
              {usage && (
                <span className="text-[10px] text-on-surface-variant">
                  {usage.latencyMs}ms · {usage.inputTokens + usage.outputTokens} tokens
                </span>
              )}
            </div>
            {result.highlights.length > 0 && (
              <ul className="space-y-2 text-sm text-on-surface leading-relaxed">
                {result.highlights.map((h) => (
                  <li key={h} className="flex gap-2">
                    <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">
                      thumb_up
                    </span>
                    {h}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <SkillList
          title="Matched skills"
          items={result.matchedSkills}
          icon="check_circle"
          empty="No strong overlaps surfaced."
          tone="positive"
        />
        <SkillList
          title="Missing skills"
          items={result.missingSkills}
          icon="cancel"
          empty="No major gaps flagged."
          tone="negative"
        />
      </div>

      {result.sourcedFrom.length > 0 && (
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base text-primary">format_quote</span>
            JD evidence
          </h4>
          <ul className="space-y-3">
            {result.sourcedFrom.map((line) => (
              <li
                key={line}
                className="text-sm text-on-surface-variant leading-relaxed border-l-2 border-primary/30 pl-3 italic"
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.redFlags.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">warning</span>
            Red flags
          </h4>
          <ul className="space-y-2">
            {result.redFlags.map((flag) => (
              <li key={flag} className="text-sm text-rose-900 leading-relaxed">
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
