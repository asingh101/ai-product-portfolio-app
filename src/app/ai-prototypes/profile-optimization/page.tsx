"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useContent } from "@/hooks/useContent";
import { useAuth } from "@/hooks/useAuth";
import { isAiPrototypesLocked } from "@/lib/featureFlags";
import { PROFILE_OPTIMIZATION_HUB_INITIAL } from "@/lib/profile-optimization/constants";
import { ROLE_ALIGN_UI_INITIAL } from "@/lib/role-align/constants";
import { RESUME_OPTIMIZER_UI_INITIAL } from "@/lib/resume-optimizer/constants";
import { RoleAlignTool } from "@/components/role-align/RoleAlignTool";
import { ResumeOptimizerTool } from "@/components/resume-optimizer/ResumeOptimizerTool";
import { trackToolUsage } from "@/lib/profile-optimization/trackUsage";

type Tab = "resume" | "linkedin";

export default function ProfileOptimizationPage() {
  const [tab, setTab] = useState<Tab>("resume");

  const hub = useContent("profile_optimization_hub", PROFILE_OPTIMIZATION_HUB_INITIAL);
  const linkedInUi = useContent("role_align_ui", ROLE_ALIGN_UI_INITIAL);
  const resumeUi = useContent("resume_optimizer_ui", RESUME_OPTIMIZER_UI_INITIAL);
  const { isAdmin } = useAuth();
  const locked = isAiPrototypesLocked();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t === "linkedin" || t === "resume") setTab(t);
  }, []);

  useEffect(() => {
    trackToolUsage("hub", "view");
  }, []);

  const selectTab = useCallback((next: Tab) => {
    setTab(next);
    trackToolUsage(next, "tab_view");
  }, []);

  const loading = hub.loading || linkedInUi.loading || resumeUi.loading;
  const enabled =
    hub.content.enabled &&
    (resumeUi.content.enabled || linkedInUi.content.enabled);

  if (loading) {
    return (
      <main className="pt-28 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
        <p className="text-on-surface-variant">Loading…</p>
      </main>
    );
  }

  if (!enabled && !isAdmin) {
    return (
      <main className="pt-28 pb-24 px-6 text-center">
        <p className="text-on-surface-variant">This prototype is not available.</p>
        <Link href="/ai-prototypes" className="text-primary font-bold mt-4 inline-block">
          Back to AI Prototypes
        </Link>
      </main>
    );
  }

  if (locked && !isAdmin) {
    return (
      <main className="pt-28 pb-24 px-6 text-center max-w-lg mx-auto">
        <p className="text-on-surface-variant mb-6">AI Prototypes are not public yet.</p>
        <Link href="/" className="text-primary font-bold">
          Return home
        </Link>
      </main>
    );
  }

  return (
    <main className="pt-28 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
      {isAdmin && locked && (
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-700 text-xl shrink-0">visibility</span>
          <div>
            <p className="text-sm font-bold text-amber-900">Admin preview</p>
            <p className="text-sm text-amber-800/90 mt-1">
              Visitors cannot reach this page until AI Prototypes is public.{" "}
              <Link href="/admin/profile-optimization" className="underline font-bold">
                Edit copy & prompts
              </Link>
            </p>
          </div>
        </div>
      )}

      <header className="mb-10 max-w-3xl">
        <div className="flex flex-col items-start gap-3 mb-6">
          <Link
            href="/ai-prototypes"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-on-surface-variant hover:text-primary"
          >
            <span className="material-symbols-outlined text-[18px] leading-none">arrow_back</span>
            AI Prototypes
          </Link>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-fixed text-on-primary-fixed text-xs font-bold tracking-widest uppercase rounded-full">
            {hub.content.heroPill}
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter leading-[1.1] font-[family-name:var(--font-headline)] mb-6">
          {hub.content.heroTitle}{" "}
          <span className="text-gradient">{hub.content.heroTitleAccent}</span>
        </h1>
        <p className="text-lg text-on-surface-variant leading-relaxed">{hub.content.heroDescription}</p>
      </header>

      <div className="mb-10 flex flex-col sm:flex-row gap-3 max-w-2xl">
        <button
          type="button"
          onClick={() => selectTab("resume")}
          className={`flex-1 rounded-2xl border-2 p-5 text-left transition-all ${
            tab === "resume"
              ? "border-primary bg-primary-fixed/30 shadow-sm"
              : "border-outline-variant/15 bg-surface-container-lowest hover:border-primary/30"
          }`}
        >
          <span className="material-symbols-outlined text-2xl text-primary mb-2 block">description</span>
          <span className="text-lg font-extrabold font-[family-name:var(--font-headline)] block">
            {hub.content.resumeTabLabel}
          </span>
          <span className="text-xs text-on-surface-variant mt-1 block leading-relaxed">
            {hub.content.resumeTabDescription}
          </span>
        </button>
        <button
          type="button"
          onClick={() => selectTab("linkedin")}
          className={`flex-1 rounded-2xl border-2 p-5 text-left transition-all ${
            tab === "linkedin"
              ? "border-primary bg-primary-fixed/30 shadow-sm"
              : "border-outline-variant/15 bg-surface-container-lowest hover:border-primary/30"
          }`}
        >
          <span className="material-symbols-outlined text-2xl text-primary mb-2 block">person_search</span>
          <span className="text-lg font-extrabold font-[family-name:var(--font-headline)] block">
            {hub.content.linkedInTabLabel}
          </span>
          <span className="text-xs text-on-surface-variant mt-1 block leading-relaxed">
            {hub.content.linkedInTabDescription}
          </span>
        </button>
      </div>

      {tab === "resume" && resumeUi.content.enabled && (
        <ResumeOptimizerTool ui={resumeUi.content} />
      )}
      {tab === "resume" && !resumeUi.content.enabled && isAdmin && (
        <p className="text-sm text-amber-800 bg-amber-50 rounded-xl px-4 py-3">
          Resume optimizer is disabled in CMS. Enable it in{" "}
          <Link href="/admin/profile-optimization" className="underline font-bold">
            admin
          </Link>
          .
        </p>
      )}

      {tab === "linkedin" && linkedInUi.content.enabled && (
        <RoleAlignTool ui={linkedInUi.content} embedded />
      )}
      {tab === "linkedin" && !linkedInUi.content.enabled && isAdmin && (
        <p className="text-sm text-amber-800 bg-amber-50 rounded-xl px-4 py-3">
          LinkedIn optimizer is disabled in CMS.
        </p>
      )}
    </main>
  );
}
