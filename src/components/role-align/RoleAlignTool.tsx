"use client";

import { useMemo, useState, useEffect } from "react";
import { useRoleAlignAnalysis } from "@/hooks/useRoleAlignAnalysis";
import { useRoleAlignProfileFetch } from "@/hooks/useRoleAlignProfileFetch";
import type {
  AnalyzeRequest,
  JobDescriptionInput,
  ProfileInput,
  ProfileMeta,
  RoleAlignUI,
} from "@/lib/role-align/types";
import {
  emptyExperienceRole,
  mergeProfileWithOverrides,
  validateAnalyzeRequest,
  validateProfileStep,
} from "@/lib/role-align/validation";
import { ProfileLinkForm } from "./ProfileLinkForm";
import { JobDescriptionForm } from "./JobDescriptionForm";
import { OptimizationProgress } from "@/components/profile-optimization/OptimizationProgress";
import { AlignmentReportView } from "./AlignmentReport";
import { trackToolUsage } from "@/lib/profile-optimization/trackUsage";

type Props = {
  ui: RoleAlignUI;
  embedded?: boolean;
};

const INITIAL_PROFILE: ProfileInput = {
  linkedInUrl: "",
  targetRoleLabel: "",
  headline: "",
  about: "",
  experience: [emptyExperienceRole()],
  skills: [],
  additionalNotes: "",
  projects: [],
};

export function RoleAlignTool({ ui, embedded }: Props) {
  const [step, setStep] = useState(0);
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [headline, setHeadline] = useState("");
  const [about, setAbout] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [fetchedProfile, setFetchedProfile] = useState<ProfileInput | null>(null);
  const [storedMeta, setStoredMeta] = useState<ProfileMeta | null>(null);
  const [fetchSucceeded, setFetchSucceeded] = useState(false);

  const [primaryJd, setPrimaryJd] = useState<JobDescriptionInput>({
    label: "primary",
    text: "",
    company: "",
  });
  const [alternates, setAlternates] = useState<JobDescriptionInput[]>([
    { label: "alternate", text: "", company: "" },
    { label: "alternate", text: "", company: "" },
  ]);
  const [showAlternateJds, setShowAlternateJds] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const {
    phase: fetchPhase,
    fetchProfile,
    error: fetchError,
    reset: resetFetch,
  } = useRoleAlignProfileFetch();
  const { phase, progress, result, error, runAnalysis, reset } = useRoleAlignAnalysis();

  useEffect(() => {
    if (phase === "complete") trackToolUsage("linkedin", "analyze_complete");
    if (phase === "error") trackToolUsage("linkedin", "analyze_fail");
  }, [phase]);

  const mergedProfile = useMemo(() => {
    const base = fetchedProfile ?? {
      ...INITIAL_PROFILE,
      linkedInUrl,
    };
    const { profile, profileMeta } = mergeProfileWithOverrides(
      base,
      { headline, about, additionalNotes },
      storedMeta ?? undefined
    );
    return { profile, profileMeta };
  }, [fetchedProfile, linkedInUrl, headline, about, additionalNotes, storedMeta]);

  const payload: AnalyzeRequest = useMemo(() => {
    const jobDescriptions = [
      primaryJd,
      ...alternates.filter((a) => a.text.trim().length > 50),
    ];
    return {
      profile: mergedProfile.profile,
      profileMeta: mergedProfile.profileMeta,
      jobDescriptions,
    };
  }, [mergedProfile, primaryJd, alternates]);

  const handleContinue = async () => {
    const partialProfile = {
      ...INITIAL_PROFILE,
      linkedInUrl,
      headline,
      about,
      additionalNotes,
    };

    const v = validateProfileStep(
      partialProfile,
      storedMeta ?? undefined,
      fetchSucceeded,
      ui.validationMessages
    );
    if (!v.ok) {
      setErrors(v.errors);
      return;
    }

    setErrors({});
    trackToolUsage("linkedin", "fetch_start");
    const result = await fetchProfile(linkedInUrl);

    if (result.ok && result.profile) {
      trackToolUsage("linkedin", "fetch_complete");
      setFetchedProfile(result.profile);
      setStoredMeta(result.profileMeta ?? null);
      setFetchSucceeded(true);
      if (!headline.trim()) setHeadline(result.profile.headline);
      if (!about.trim()) setAbout(result.profile.about);
    } else {
      trackToolUsage("linkedin", "fetch_fail");
      setFetchSucceeded(false);
      setFetchedProfile({
        ...INITIAL_PROFILE,
        linkedInUrl,
      });

      const manualCheck = validateProfileStep(
        { ...partialProfile, linkedInUrl },
        undefined,
        false,
        ui.validationMessages
      );
      if (!manualCheck.ok) {
        setErrors(manualCheck.errors);
        return;
      }
    }

    setStep(1);
  };

  const handleRun = () => {
    const v = validateAnalyzeRequest(payload, ui.validationMessages, ui.limits);
    if (!v.ok) {
      setErrors(v.errors);
      return;
    }
    setErrors({});
    trackToolUsage("linkedin", "analyze_start");
    runAnalysis(payload);
  };

  const handleStartOver = () => {
    reset();
    resetFetch();
    setStep(0);
    setLinkedInUrl("");
    setHeadline("");
    setAbout("");
    setAdditionalNotes("");
    setFetchedProfile(null);
    setStoredMeta(null);
    setFetchSucceeded(false);
    setPrimaryJd({ label: "primary", text: "", company: "" });
    setAlternates([
      { label: "alternate", text: "", company: "" },
      { label: "alternate", text: "", company: "" },
    ]);
    setShowAlternateJds(false);
    setErrors({});
  };

  if (phase === "running") {
    return (
      <OptimizationProgress
        title={ui.progressTitle}
        progressSteps={ui.progressSteps}
        loadingTips={ui.loadingTips}
        progress={progress}
        estimateNote={ui.analyzeEstimateNote}
      />
    );
  }

  if (phase === "complete" && result) {
    return (
      <AlignmentReportView
        ui={ui}
        report={result.report}
        meta={result.meta}
        onStartOver={handleStartOver}
      />
    );
  }

  return (
    <div className={embedded ? "max-w-2xl mx-auto" : "max-w-2xl mx-auto"}>
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

      <div className="flex items-center gap-2 mb-10">
        {ui.wizardStepLabels.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                i <= step
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`text-xs font-bold hidden sm:block ${
                i === step ? "text-on-surface" : "text-on-surface-variant"
              }`}
            >
              {label}
            </span>
            {i < ui.wizardStepLabels.length - 1 && (
              <span className="flex-1 h-px bg-outline-variant/20 mx-1" />
            )}
          </div>
        ))}
      </div>

      {step === 0 && (
        <ProfileLinkForm
          ui={ui}
          linkedInUrl={linkedInUrl}
          headline={headline}
          about={about}
          additionalNotes={additionalNotes}
          fetchPhase={fetchPhase}
          profileMeta={storedMeta}
          fetchError={fetchError?.message ?? null}
          onLinkedInUrlChange={setLinkedInUrl}
          onHeadlineChange={setHeadline}
          onAboutChange={setAbout}
          onAdditionalNotesChange={setAdditionalNotes}
          errors={errors}
        />
      )}

      {step === 1 && (
        <JobDescriptionForm
          ui={ui}
          primary={primaryJd}
          alternates={alternates}
          showAlternates={showAlternateJds}
          onToggleAlternates={() => setShowAlternateJds((s) => !s)}
          onPrimaryChange={setPrimaryJd}
          onAlternateChange={(i, jd) => {
            const next = [...alternates];
            next[i] = jd;
            setAlternates(next);
          }}
          errors={errors}
        />
      )}

      <div className="flex justify-between mt-10 gap-4">
        <button
          type="button"
          onClick={() => (step > 0 ? setStep(step - 1) : undefined)}
          disabled={step === 0}
          className="px-6 py-3 rounded-xl text-sm font-bold text-on-surface-variant disabled:opacity-40"
        >
          {ui.backButtonLabel}
        </button>
        {step === 0 ? (
          <button
            type="button"
            onClick={handleContinue}
            disabled={fetchPhase === "fetching"}
            className="px-8 py-3 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
          >
            {fetchPhase === "fetching" && (
              <span className="material-symbols-outlined text-base animate-spin">
                progress_activity
              </span>
            )}
            {ui.nextButtonLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleRun}
            className="px-8 py-3 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">auto_awesome</span>
            {ui.runButtonLabel}
          </button>
        )}
      </div>
    </div>
  );
}
