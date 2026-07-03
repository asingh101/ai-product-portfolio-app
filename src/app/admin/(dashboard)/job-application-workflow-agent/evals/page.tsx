"use client";

import Link from "next/link";
import { EvalDashboard } from "@/components/job-search-agent/EvalDashboard";
import { JOB_APPLICATION_WORKFLOW_AGENT_ADMIN_PATH } from "@/lib/job-search-agent/constants";

export default function JobApplicationWorkflowAgentEvalsPage() {
  return (
    <div className="max-w-5xl">
      <header className="mb-8">
        <Link
          href={JOB_APPLICATION_WORKFLOW_AGENT_ADMIN_PATH}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-on-surface-variant hover:text-primary mb-4"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Job Application Workflow Agent CMS
        </Link>
        <h1 className="text-3xl font-extrabold font-[family-name:var(--font-headline)] tracking-tighter">
          Fit analysis evals
        </h1>
        <p className="text-sm text-on-surface-variant mt-2">
          Admin-only regression harness for <code className="text-xs bg-surface-container px-1 rounded">analyze_fit</code>.
          Screenshot a passing run for portfolio / tech docs.
        </p>
      </header>

      <EvalDashboard />
    </div>
  );
}
