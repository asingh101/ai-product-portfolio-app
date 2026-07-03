"use client";

import type { ProgressEvent, ProgressStepConfig, RoleAlignUI } from "@/lib/role-align/types";

type Props = {
  ui: RoleAlignUI;
  progress: ProgressEvent | null;
};

function ProgressRing({ value }: { value: number }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative w-28 h-28 mx-auto mb-6">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 110 110">
        <circle
          cx="55"
          cy="55"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-surface-container-high"
        />
        <circle
          cx="55"
          cy="55"
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3525cd" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-extrabold font-[family-name:var(--font-headline)] text-on-surface">
          {Math.min(100, Math.round(value))}%
        </span>
      </div>
    </div>
  );
}

export function AnalysisProgress({ ui, progress }: Props) {
  const steps = ui.progressSteps;
  const currentProgress = progress?.progress ?? 5;

  const stepIndex = steps.findIndex((s) => s.id === progress?.step);
  const activeIndex = stepIndex >= 0 ? stepIndex : 0;

  return (
    <div className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-8 md:p-10 shadow-sm max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-4 justify-center">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-40" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
        </span>
        <h2 className="text-xl font-extrabold font-[family-name:var(--font-headline)]">
          Analyzing your profile
        </h2>
      </div>

      <ProgressRing value={currentProgress} />

      {progress?.detail && (
        <p className="text-sm text-on-surface-variant text-center mb-6 italic">
          {progress.detail}
        </p>
      )}

      <div className="h-2 w-full rounded-full bg-surface-container-high overflow-hidden mb-8">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#3525cd] to-[#4f46e5] transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, currentProgress)}%` }}
        />
      </div>

      <ul className="space-y-4 mb-8">
        {steps.map((step: ProgressStepConfig, i) => {
          const done = i < activeIndex || (i === activeIndex && currentProgress >= 100);
          const active = i === activeIndex && currentProgress < 100;
          return (
            <li
              key={step.id}
              className={`flex items-start gap-3 rounded-xl px-3 py-2 transition-colors ${
                active ? "bg-primary-fixed/40" : ""
              }`}
            >
              <span className="mt-0.5 shrink-0">
                {done ? (
                  <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                ) : active ? (
                  <span className="material-symbols-outlined text-primary text-xl animate-pulse">
                    progress_activity
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-on-surface-variant/40 text-xl">
                    radio_button_unchecked
                  </span>
                )}
              </span>
              <div>
                <p
                  className={`text-sm font-bold ${
                    active || done ? "text-on-surface" : "text-on-surface-variant/70"
                  }`}
                >
                  {step.label}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-on-surface-variant text-center">{ui.analyzeEstimateNote}</p>
    </div>
  );
}
