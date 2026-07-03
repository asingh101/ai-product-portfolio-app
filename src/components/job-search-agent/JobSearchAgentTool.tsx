"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { OptimizationProgress } from "@/components/profile-optimization/OptimizationProgress";
import { useSimulatedProgress } from "@/hooks/useSimulatedProgress";
import { useJobSearchBulletRewrite } from "@/hooks/useJobSearchBulletRewrite";
import { useJobSearchCoverLetter } from "@/hooks/useJobSearchCoverLetter";
import { useJobSearchFitAnalysis } from "@/hooks/useJobSearchFitAnalysis";
import { extractBulletsFromResume } from "@/lib/job-search-agent/extractBullets";
import { trackJobSearchAgentUsage } from "@/lib/job-search-agent/trackUsage";
import type { CoverLetterTone, FitAnalysisResult } from "@/lib/job-search-agent/types";
import { BulletRewritePanel } from "./BulletRewritePanel";
import { CoverLetterPanel } from "./CoverLetterPanel";
import { FitAnalysisInputForm, validateFitInputs } from "./FitAnalysisInputForm";
import { FitAnalysisPanel } from "./FitAnalysisPanel";
import { LowFitGuidance } from "./LowFitGuidance";
import { WorkflowDecisionPanel } from "./WorkflowDecisionPanel";
import {
  buildInitialWorkflowSteps,
  WorkflowProgressStrip,
  type WorkflowStepState,
} from "./WorkflowProgressStrip";

const FIT_THRESHOLD = 50;

const FIT_PROGRESS_STEPS = [
  {
    id: "extract" as const,
    label: "Parsing job description",
    progress: 33,
    detailTemplates: ["Chunking requirements and responsibilities…"],
  },
  {
    id: "analyze" as const,
    label: "Scoring resume fit",
    progress: 66,
    detailTemplates: ["Comparing resume to job requirements…"],
  },
  {
    id: "finalize" as const,
    label: "Validating citations",
    progress: 92,
    detailTemplates: ["Checking JD evidence for gaps…"],
  },
];

const REWRITE_PROGRESS_STEPS = [
  {
    id: "extract" as const,
    label: "Reading your bullets",
    progress: 30,
    detailTemplates: ["Matching experience to job requirements…"],
  },
  {
    id: "analyze" as const,
    label: "Reframing for this role",
    progress: 75,
    detailTemplates: ["Surfacing relevant keywords without inventing experience…"],
  },
  {
    id: "finalize" as const,
    label: "Validating rewrites",
    progress: 95,
    detailTemplates: ["Checking metrics and facts are preserved…"],
  },
];

const FIT_LOADING_TIPS = [
  "Gaps are cited from the job description, not invented.",
  "Strong fit is 75+, reach is 50–74.",
  "After fit analysis, choose tailored bullets and/or a cover letter.",
];

const REWRITE_LOADING_TIPS = [
  "Rewrites never invent experience, only reframe what is already there.",
  "Numbers from your original bullets are preserved.",
  "Accept or reject each suggestion before copying.",
];

type UiStage = "idle" | "decision" | "pipeline" | "results";

function patchStep(steps: WorkflowStepState[], id: WorkflowStepState["id"], status: WorkflowStepState["status"]) {
  return steps.map((s) => (s.id === id ? { ...s, status } : s));
}

function buildFitPayload(result: FitAnalysisResult) {
  return {
    matchedSkills: result.matchedSkills,
    missingSkills: result.missingSkills,
    highlights: result.highlights,
    sourcedFrom: result.sourcedFrom,
  };
}

export function JobSearchAgentTool({
  onWorkflowStepsChange,
}: {
  onWorkflowStepsChange?: (steps: WorkflowStepState[]) => void;
}) {
  const [resumeText, setResumeText] = useState("");
  const [jobDescriptionText, setJobDescriptionText] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [coverTone, setCoverTone] = useState<CoverLetterTone>("confident");
  const [acceptedBullets, setAcceptedBullets] = useState<string[]>([]);
  const [fitProgressVisible, setFitProgressVisible] = useState(false);
  const [uiStage, setUiStage] = useState<UiStage>("idle");
  const [wantsBullets, setWantsBullets] = useState(true);
  const [wantsCover, setWantsCover] = useState(true);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStepState[]>(buildInitialWorkflowSteps);

  const { phase, result, usage, error, runFitAnalysis, reset: resetFit } = useJobSearchFitAnalysis();
  const {
    phase: rewritePhase,
    result: rewriteResult,
    usage: rewriteUsage,
    error: rewriteError,
    runBulletRewrite,
    reset: resetRewrite,
  } = useJobSearchBulletRewrite();
  const {
    phase: coverPhase,
    streamedText,
    result: coverResult,
    usage: coverUsage,
    error: coverError,
    runCoverLetter,
    reset: resetCover,
  } = useJobSearchCoverLetter();

  const extractedBullets = useMemo(
    () => (phase === "complete" || rewritePhase === "complete" ? extractBulletsFromResume(resumeText) : []),
    [phase, rewritePhase, resumeText]
  );

  const meetsFitThreshold = result != null && result.score >= FIT_THRESHOLD;

  useEffect(() => {
    onWorkflowStepsChange?.(workflowSteps);
  }, [workflowSteps, onWorkflowStepsChange]);

  useEffect(() => {
    if (phase === "running") {
      setFitProgressVisible(true);
      setWorkflowSteps((s) => patchStep(patchStep(s, "fit", "running"), "gaps", "pending"));
      return;
    }
    if (phase === "complete") {
      const t = window.setTimeout(() => setFitProgressVisible(false), 500);
      return () => window.clearTimeout(t);
    }
    setFitProgressVisible(false);
  }, [phase]);

  useEffect(() => {
    if (phase !== "complete" || !result || fitProgressVisible) return;

    setWorkflowSteps((s) => patchStep(patchStep(s, "fit", "done"), "gaps", "done"));

    if (result.score >= FIT_THRESHOLD) {
      setUiStage("decision");
    } else {
      setUiStage("results");
      setWorkflowSteps((s) => patchStep(patchStep(s, "bullets", "skipped"), "cover", "skipped"));
    }
  }, [phase, result, fitProgressVisible]);

  const fitProgressRunning = phase === "running";
  const fitProgressComplete = phase === "complete";
  const { progress: fitProgress, step: fitStep } = useSimulatedProgress(
    fitProgressRunning,
    fitProgressComplete
  );

  const rewriteProgressRunning = rewritePhase === "running";
  const rewriteProgressComplete = rewritePhase === "complete";
  const { progress: rewriteProgress, step: rewriteStep } = useSimulatedProgress(
    rewriteProgressRunning,
    rewriteProgressComplete
  );

  const fitProgressDetail = useMemo(() => {
    const step = FIT_PROGRESS_STEPS.find((s) => s.id === fitStep);
    return step?.detailTemplates[0] ?? "Analyzing…";
  }, [fitStep]);

  const rewriteProgressDetail = useMemo(() => {
    const step = REWRITE_PROGRESS_STEPS.find((s) => s.id === rewriteStep);
    return step?.detailTemplates[0] ?? "Rewriting…";
  }, [rewriteStep]);

  useEffect(() => {
    if (phase === "complete") trackJobSearchAgentUsage("analyze_complete");
    if (phase === "error") trackJobSearchAgentUsage("analyze_fail");
  }, [phase]);

  useEffect(() => {
    if (rewritePhase === "complete") trackJobSearchAgentUsage("rewrite_complete");
    if (rewritePhase === "error") trackJobSearchAgentUsage("rewrite_fail");
  }, [rewritePhase]);

  useEffect(() => {
    if (coverPhase === "complete") trackJobSearchAgentUsage("cover_letter_complete");
    if (coverPhase === "error") trackJobSearchAgentUsage("cover_letter_fail");
  }, [coverPhase]);

  const handleAnalyze = async () => {
    const nextErrors = validateFitInputs(resumeText, jobDescriptionText);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    resetRewrite();
    resetCover();
    setAcceptedBullets([]);
    setUiStage("idle");
    setWorkflowSteps(buildInitialWorkflowSteps());
    trackJobSearchAgentUsage("analyze_start");
    await runFitAnalysis({
      resumeText: resumeText.trim(),
      jobDescriptionText: jobDescriptionText.trim(),
    });
  };

  const runPipeline = useCallback(async () => {
    if (!result) return;

    setUiStage("pipeline");
    const runBullets = wantsBullets && extractedBullets.length > 0;
    const runCover = wantsCover;

    if (!runBullets) {
      setWorkflowSteps((s) => patchStep(s, "bullets", "skipped"));
    }
    if (!runCover) {
      setWorkflowSteps((s) => patchStep(s, "cover", "skipped"));
    }

    let bulletsForCover = extractedBullets;

    if (runBullets) {
      setWorkflowSteps((s) => patchStep(s, "bullets", "running"));
      trackJobSearchAgentUsage("rewrite_start");
      const rewrite = await runBulletRewrite({
        bullets: extractedBullets,
        jobDescriptionText: jobDescriptionText.trim(),
        fitAnalysis: buildFitPayload(result),
      });
      setWorkflowSteps((s) => patchStep(s, "bullets", rewrite ? "done" : "error"));
      if (rewrite) {
        bulletsForCover = rewrite.rewrites.map((r) => (r.unchanged ? r.original : r.rewritten));
      }
    }

    if (runCover) {
      setWorkflowSteps((s) => patchStep(s, "cover", "running"));
      resetCover();
      trackJobSearchAgentUsage("cover_letter_start");
      const coverOutcome = await runCoverLetter({
        jobDescriptionText: jobDescriptionText.trim(),
        tone: coverTone,
        fitAnalysis: {
          matchedSkills: result.matchedSkills,
          missingSkills: result.missingSkills,
          highlights: result.highlights,
        },
        acceptedBullets: bulletsForCover.length > 0 ? bulletsForCover.slice(0, 8) : undefined,
      });
      setWorkflowSteps((s) =>
        patchStep(s, "cover", coverOutcome === "complete" ? "done" : coverOutcome === "error" ? "error" : "skipped")
      );
    }

    setUiStage("results");
  }, [
    result,
    wantsBullets,
    wantsCover,
    extractedBullets,
    jobDescriptionText,
    coverTone,
    runBulletRewrite,
    runCoverLetter,
    resetCover,
  ]);

  const handleReset = () => {
    resetFit();
    resetRewrite();
    resetCover();
    setAcceptedBullets([]);
    setErrors({});
    setUiStage("idle");
    setWorkflowSteps(buildInitialWorkflowSteps());
    setWantsBullets(true);
    setWantsCover(true);
  };

  const fitRunning = phase === "running";
  const rewriteRunning = rewritePhase === "running";
  const coverRunning = coverPhase === "running";
  const busy = fitRunning || rewriteRunning || coverRunning || uiStage === "pipeline";

  const showWorkflowStrip = phase !== "idle" || uiStage !== "idle";
  const showFitResults = phase === "complete" && result && !fitProgressVisible;
  const showDecision = uiStage === "decision" && meetsFitThreshold;
  const showLowFit = uiStage === "results" && result && !meetsFitThreshold;
  const showBulletsSection =
    (uiStage === "results" || uiStage === "pipeline") &&
    wantsBullets &&
    (rewriteRunning || rewritePhase === "complete" || rewritePhase === "error");
  const showCoverSection =
    (uiStage === "results" || uiStage === "pipeline") &&
    wantsCover &&
    (coverRunning || coverPhase === "complete" || coverPhase === "error");

  return (
    <div className="space-y-8">
      <FitAnalysisInputForm
        resumeText={resumeText}
        jobDescriptionText={jobDescriptionText}
        onResumeChange={setResumeText}
        onJobDescriptionChange={setJobDescriptionText}
        errors={errors}
        disabled={busy}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={busy}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary text-sm font-bold disabled:opacity-60 hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-lg">
            {fitRunning ? "hourglass_top" : "analytics"}
          </span>
          {fitRunning ? "Analyzing fit…" : "Analyze fit"}
        </button>

        {(phase === "complete" || phase === "error" || uiStage === "results") && (
          <button
            type="button"
            onClick={handleReset}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full border border-outline-variant/25 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            Start over
          </button>
        )}
      </div>

      {showWorkflowStrip && <WorkflowProgressStrip steps={workflowSteps} />}

      {fitProgressVisible && (
        <OptimizationProgress
          title="Analyzing fit"
          progressSteps={FIT_PROGRESS_STEPS}
          loadingTips={FIT_LOADING_TIPS}
          progress={{
            step: fitStep,
            progress: fitProgress,
            label: FIT_PROGRESS_STEPS.find((s) => s.id === fitStep)?.label ?? "Analyzing fit",
            detail: fitProgressDetail,
          }}
          estimateNote="Usually 10–20 seconds"
        />
      )}

      {showFitResults && <FitAnalysisPanel result={result} usage={usage} />}

      {showDecision && (
        <WorkflowDecisionPanel
          wantsBullets={wantsBullets}
          wantsCover={wantsCover}
          onWantsBulletsChange={setWantsBullets}
          onWantsCoverChange={setWantsCover}
          coverTone={coverTone}
          onCoverToneChange={setCoverTone}
          onContinue={runPipeline}
          disabled={busy}
          bulletCount={extractedBullets.length}
        />
      )}

      {showLowFit && <LowFitGuidance score={result.score} />}

      {rewriteRunning && (
        <OptimizationProgress
          title="Rewriting bullets"
          progressSteps={REWRITE_PROGRESS_STEPS}
          loadingTips={REWRITE_LOADING_TIPS}
          progress={{
            step: rewriteStep,
            progress: rewriteProgress,
            label: REWRITE_PROGRESS_STEPS.find((s) => s.id === rewriteStep)?.label ?? "Rewriting bullets",
            detail: rewriteProgressDetail,
          }}
          estimateNote="Usually 15–30 seconds"
        />
      )}

      {phase === "error" && error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
          <p className="text-sm font-bold text-rose-900">Analysis failed</p>
          <p className="text-sm text-rose-800/90 mt-1">{error.message}</p>
          {error.code === "RATE_LIMIT" && (
            <p className="text-xs text-rose-700 mt-2">
              You&apos;ve hit the limit of 5 fit scans per hour. Cached results for the same resume and job
              description don&apos;t count toward this limit.
            </p>
          )}
        </div>
      )}

      {rewritePhase === "error" && rewriteError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
          <p className="text-sm font-bold text-rose-900">Bullet rewrite failed</p>
          <p className="text-sm text-rose-800/90 mt-1">{rewriteError.message}</p>
        </div>
      )}

      {coverPhase === "error" && coverError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
          <p className="text-sm font-bold text-rose-900">Cover letter failed</p>
          <p className="text-sm text-rose-800/90 mt-1">{coverError.message}</p>
        </div>
      )}

      {showBulletsSection && rewritePhase === "complete" && rewriteResult && (
        <BulletRewritePanel
          rewrites={rewriteResult.rewrites}
          usage={rewriteUsage}
          usedFallback={rewriteResult.usedFallback}
          onAcceptedBulletsChange={setAcceptedBullets}
        />
      )}

      {showCoverSection && (coverRunning || coverPhase === "complete") && (
        <CoverLetterPanel
          text={streamedText}
          result={coverResult}
          usage={coverUsage}
          streaming={coverRunning}
        />
      )}
    </div>
  );
}
