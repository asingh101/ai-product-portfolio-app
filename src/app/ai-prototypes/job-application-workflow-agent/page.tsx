"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useContent } from "@/hooks/useContent";
import { isAiPrototypesLocked } from "@/lib/featureFlags";
import {
  JOB_APPLICATION_WORKFLOW_AGENT_ADMIN_PATH,
  JOB_SEARCH_AGENT_UI_INITIAL,
} from "@/lib/job-search-agent/constants";
import { trackJobSearchAgentUsage } from "@/lib/job-search-agent/trackUsage";
import { JobSearchAgentShell } from "@/components/job-search-agent/JobSearchAgentShell";

export default function JobApplicationWorkflowAgentPage() {
  const { isAdmin } = useAuth();
  const locked = isAiPrototypesLocked();
  const ui = useContent("job_search_agent_ui", JOB_SEARCH_AGENT_UI_INITIAL);

  useEffect(() => {
    trackJobSearchAgentUsage("view");
  }, []);

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

  if (!ui.content.enabled && !isAdmin) {
    return (
      <main className="pt-28 pb-24 px-6 text-center max-w-lg mx-auto">
        <p className="text-on-surface-variant mb-6">This prototype is not available yet.</p>
        <Link href="/ai-prototypes" className="text-primary font-bold">
          Back to AI Prototypes
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
              <Link href={JOB_APPLICATION_WORKFLOW_AGENT_ADMIN_PATH} className="underline font-bold">
                Edit copy
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
            <span className="material-symbols-outlined text-base leading-none">smart_toy</span>
            {ui.content.heroPill}
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter leading-[1.1] font-[family-name:var(--font-headline)] mb-6">
          {ui.content.heroTitle}{" "}
          <span className="text-gradient">{ui.content.heroTitleAccent}</span>
        </h1>
        <p className="text-lg text-on-surface-variant leading-relaxed">{ui.content.heroDescription}</p>
      </header>

      <JobSearchAgentShell ui={ui.content} showApiTest={isAdmin} />
    </main>
  );
}
