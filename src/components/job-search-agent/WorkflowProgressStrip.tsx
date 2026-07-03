"use client";

export type WorkflowStepId = "fit" | "gaps" | "bullets" | "cover";
export type WorkflowStepStatus = "pending" | "running" | "done" | "skipped" | "error";

export type WorkflowStepState = {
  id: WorkflowStepId;
  label: string;
  status: WorkflowStepStatus;
};

const STEP_META: { id: WorkflowStepId; label: string }[] = [
  { id: "fit", label: "Analyze fit" },
  { id: "gaps", label: "Surface gaps" },
  { id: "bullets", label: "Rewrite bullets" },
  { id: "cover", label: "Draft cover letter" },
];

export function buildInitialWorkflowSteps(): WorkflowStepState[] {
  return STEP_META.map((s) => ({ ...s, status: "pending" as const }));
}

type Props = {
  steps: WorkflowStepState[];
};

export function WorkflowProgressStrip({ steps }: Props) {
  const allDone = steps.every((s) => s.status === "done" || s.status === "skipped");

  return (
    <div
      className={`rounded-2xl border px-5 py-4 ${
        allDone ? "border-emerald-200/80 bg-emerald-50/60" : "border-outline-variant/15 bg-surface-container-lowest"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
        Workflow progress
      </p>
      <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((step, i) => (
          <li key={step.id} className="flex items-center gap-2.5">
            <StepIcon status={step.status} index={i} />
            <span
              className={`text-sm font-bold ${
                step.status === "pending" ? "text-on-surface-variant/60" : "text-on-surface"
              }`}
            >
              {step.label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function WorkflowStepStatusIcon({
  status,
  index,
  fallbackIcon,
}: {
  status: WorkflowStepStatus;
  index: number;
  fallbackIcon?: string;
}) {
  if (status === "done") {
    return (
      <span className="material-symbols-outlined text-emerald-600 text-xl shrink-0">check_circle</span>
    );
  }
  if (status === "running") {
    return (
      <span className="material-symbols-outlined text-primary text-xl shrink-0 animate-spin">progress_activity</span>
    );
  }
  if (status === "error") {
    return <span className="material-symbols-outlined text-rose-600 text-xl shrink-0">error</span>;
  }
  if (status === "skipped") {
    return (
      <span className="material-symbols-outlined text-on-surface-variant/40 text-xl shrink-0">remove_circle_outline</span>
    );
  }
  if (fallbackIcon) {
    return (
      <span className="material-symbols-outlined text-primary text-xl shrink-0">{fallbackIcon}</span>
    );
  }
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-outline-variant/30 text-[10px] font-bold text-on-surface-variant">
      {index + 1}
    </span>
  );
}

function StepIcon({ status, index }: { status: WorkflowStepStatus; index: number }) {
  return <WorkflowStepStatusIcon status={status} index={index} />;
}
