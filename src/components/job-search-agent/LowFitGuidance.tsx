"use client";

import Link from "next/link";

const PROFILE_OPTIMIZATION_PATH = "/ai-prototypes/profile-optimization";

type Props = {
  score: number;
};

export function LowFitGuidance({ score }: Props) {
  return (
    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-6 py-5 space-y-4">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-amber-700 text-2xl shrink-0">tune</span>
        <div>
          <h3 className="text-lg font-bold font-[family-name:var(--font-headline)] text-amber-950">
            Match score is {score}%, strengthen your resume first
          </h3>
          <p className="text-sm text-amber-900/90 mt-2 leading-relaxed">
            Tailored bullets and cover letters work best when your fit is at least 50%. Review the gaps
            above, then use Profile Optimization to align your resume and LinkedIn to this role. Come
            back and run fit analysis again when you&apos;re ready.
          </p>
        </div>
      </div>
      <Link
        href={PROFILE_OPTIMIZATION_PATH}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-opacity"
      >
        <span className="material-symbols-outlined text-lg">arrow_forward</span>
        Open Profile Optimization
      </Link>
    </div>
  );
}
