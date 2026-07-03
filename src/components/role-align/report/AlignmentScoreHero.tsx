"use client";

import type { AlignmentByJd, AlignmentReport } from "@/lib/role-align/types";

type Props = {
  report: AlignmentReport;
  targetLabel?: string;
};

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-36 h-36 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
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
          stroke="url(#scoreGradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3525cd" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold font-[family-name:var(--font-headline)] text-on-surface">
          {score}%
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          aligned
        </span>
      </div>
    </div>
  );
}

export function AlignmentScoreHero({ report, targetLabel }: Props) {
  const headline =
    targetLabel ||
    report.profileMeta?.displayName ||
    report.executive_summary.top_gaps[0]?.slice(0, 60) ||
    "Your profile";

  return (
    <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6 md:p-8">
      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
        <ScoreRing score={report.alignment_score ?? 0} />
        <div className="flex-1 text-center md:text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            Alignment summary
          </p>
          <h2 className="text-xl md:text-2xl font-extrabold font-[family-name:var(--font-headline)] mb-3">
            {headline}
          </h2>
          {report.alignment_by_jd?.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
              {report.alignment_by_jd.map((jd: AlignmentByJd) => (
                <span
                  key={`${jd.label}-${jd.company}`}
                  className="px-3 py-1 rounded-full bg-surface-container text-xs font-bold text-on-surface-variant"
                >
                  {jd.company || jd.label}
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-rose-700">
              <span className="material-symbols-outlined text-base">cancel</span>
              {report.stats?.needs_improvement ?? 0} needs work
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700">
              <span className="material-symbols-outlined text-base">check_circle</span>
              {report.stats?.well_done ?? 0} well done
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
