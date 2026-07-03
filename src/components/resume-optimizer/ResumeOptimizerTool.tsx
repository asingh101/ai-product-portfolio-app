"use client";

import { useEffect, useMemo, useState } from "react";
import { useResumeOptimizerAnalysis } from "@/hooks/useResumeOptimizerAnalysis";
import type { JobDescriptionInput, ResumeOptimizerUI } from "@/lib/resume-optimizer/types";
import { validateResumeAnalyzeRequest } from "@/lib/resume-optimizer/validation";
import { OptimizationProgress } from "@/components/profile-optimization/OptimizationProgress";
import { trackToolUsage } from "@/lib/profile-optimization/trackUsage";
import { ResumeInputForm } from "./ResumeInputForm";
import { ResumeReportView } from "./ResumeReportView";

type Props = {
  ui: ResumeOptimizerUI;
};

export function ResumeOptimizerTool({ ui }: Props) {
  const [resumeText, setResumeText] = useState("");
  const [primaryJd, setPrimaryJd] = useState<JobDescriptionInput>({
    label: "primary",
    text: "",
    company: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { phase, progress, result, error, runAnalysis, reset } = useResumeOptimizerAnalysis();

  const payload = useMemo(
    () => ({
      resumeText,
      jobDescriptions: [primaryJd],
    }),
    [resumeText, primaryJd]
  );

  useEffect(() => {
    if (phase === "complete") trackToolUsage("resume", "analyze_complete");
    if (phase === "error") trackToolUsage("resume", "analyze_fail");
  }, [phase]);

  const handleRun = () => {
    const v = validateResumeAnalyzeRequest(payload, ui.validationMessages, ui.limits);
    if (!v.ok) {
      setErrors(v.errors);
      return;
    }
    setErrors({});
    trackToolUsage("resume", "analyze_start");
    runAnalysis(payload);
  };

  const handleStartOver = () => {
    reset();
    setResumeText("");
    setPrimaryJd({ label: "primary", text: "", company: "" });
    setErrors({});
  };

  if (phase === "running") {
    return (
      <OptimizationProgress
        title="Tailoring your resume"
        progressSteps={ui.progressSteps}
        loadingTips={ui.loadingTips}
        progress={progress}
        estimateNote={ui.analyzeEstimateNote}
      />
    );
  }

  if (phase === "complete" && result) {
    return (
      <ResumeReportView
        ui={ui}
        report={result.report}
        meta={result.meta}
        onStartOver={handleStartOver}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-8 max-w-2xl">
        <h2 className="text-2xl font-extrabold font-[family-name:var(--font-headline)] mb-2">
          {ui.heroTitle}
        </h2>
        <p className="text-sm text-on-surface-variant leading-relaxed">{ui.heroSubtitle}</p>
      </header>

      {phase === "error" && error && (
        <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 flex gap-3">
          <span className="material-symbols-outlined text-red-600">error</span>
          <div>
            <p className="text-sm font-bold text-red-900">Analysis failed</p>
            <p className="text-sm text-red-800/90 mt-1">{error.message}</p>
            {error.retryable && (
              <button
                type="button"
                onClick={handleRun}
                className="mt-3 text-sm font-bold text-red-900 underline"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      )}

      <ResumeInputForm
        ui={ui}
        resumeText={resumeText}
        primaryJd={primaryJd}
        onResumeChange={setResumeText}
        onPrimaryChange={setPrimaryJd}
        errors={errors}
      />

      <div className="flex justify-end mt-10">
        <button
          type="button"
          onClick={handleRun}
          className="px-8 py-3 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">document_scanner</span>
          {ui.runButtonLabel}
        </button>
      </div>

      <p className="text-xs text-on-surface-variant text-center mt-6">{ui.privacyNote}</p>
    </div>
  );
}
