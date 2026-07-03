"use client";

import { useState } from "react";
import Link from "next/link";
import type { JobSearchAgentUi } from "@/lib/job-search-agent/constants";
import { AgentApiConnectionTest } from "./AgentApiConnectionTest";
import { EvalQualityShowcase } from "./EvalQualityShowcase";
import { JobSearchAgentTool } from "./JobSearchAgentTool";
import {
  buildInitialWorkflowSteps,
  WorkflowStepStatusIcon,
  type WorkflowStepState,
  type WorkflowStepStatus,
} from "./WorkflowProgressStrip";

const STEP_ICONS = ["analytics", "difference", "edit_note", "description"] as const;

function stepBadge(status: WorkflowStepStatus): { text: string; className: string } {
  switch (status) {
    case "done":
      return { text: "Complete", className: "text-emerald-700" };
    case "running":
      return { text: "Running", className: "text-primary" };
    case "skipped":
      return { text: "Skipped", className: "text-on-surface-variant" };
    case "error":
      return { text: "Failed", className: "text-rose-700" };
    default:
      return { text: "Live", className: "text-emerald-700" };
  }
}

export function JobSearchAgentShell({
  ui,
  showApiTest,
}: {
  ui: JobSearchAgentUi;
  showApiTest?: boolean;
}) {
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStepState[]>(buildInitialWorkflowSteps);

  return (
    <div className="space-y-10">
      <AgentApiConnectionTest />

      <section className="rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-5 py-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-emerald-700 text-xl shrink-0">check_circle</span>
        <div>
          <p className="text-sm font-bold text-emerald-900">Full workflow is live</p>
          <p className="text-sm text-emerald-800/90 mt-1">
            Fit analysis, bullet rewrites, and streamed cover letters, all grounded in your resume and job
            description.{" "}
            <Link href="/ai-prototypes/profile-optimization" className="text-primary font-bold underline">
              Profile Optimization
            </Link>{" "}
            remains available unchanged.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold font-[family-name:var(--font-headline)] mb-4">Application workflow</h2>
        <JobSearchAgentTool onWorkflowStepsChange={setWorkflowSteps} />
      </section>

      <section>
        <h2 className="text-lg font-bold font-[family-name:var(--font-headline)] mb-4">Workflow steps</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {ui.workflowSteps.map((step, i) => {
            const liveStatus = workflowSteps[i]?.status ?? "pending";
            const badge = stepBadge(liveStatus);
            const isDone = liveStatus === "done";

            return (
              <article
                key={step.title}
                className={`rounded-2xl border p-5 transition-colors ${
                  isDone
                    ? "border-emerald-200/80 bg-emerald-50/40"
                    : "border-outline-variant/15 bg-surface-container-lowest"
                }`}
              >
                <div className="flex items-start gap-3">
                  <WorkflowStepStatusIcon
                    status={liveStatus}
                    index={i}
                    fallbackIcon={STEP_ICONS[i] ?? "check_circle"}
                  />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Step {i + 1}
                      <span className={`ml-2 normal-case tracking-normal ${badge.className}`}>{badge.text}</span>
                    </p>
                    <h3 className="font-bold text-on-surface mb-2">{step.title}</h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <EvalQualityShowcase showAdminLink={showApiTest} />
    </div>
  );
}
