"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useContent } from "@/hooks/useContent";
import {
  JOB_APPLICATION_WORKFLOW_AGENT_PATH,
  JOB_SEARCH_AGENT_UI_INITIAL,
} from "@/lib/job-search-agent/constants";

export default function AdminJobApplicationWorkflowAgentPage() {
  const ui = useContent("job_search_agent_ui", JOB_SEARCH_AGENT_UI_INITIAL);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    try {
      await ui.saveToFirestore();
      setMessage("Job Application Workflow Agent copy saved.");
    } catch {
      setMessage("Failed to save.");
    } finally {
      setSaving(false);
    }
  }, [ui]);

  return (
    <div className="max-w-4xl">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold font-[family-name:var(--font-headline)] tracking-tighter">
          Job Application Workflow Agent CMS
        </h1>
        <p className="text-sm text-on-surface-variant mt-2">
          Hero copy for{" "}
          <Link href={JOB_APPLICATION_WORKFLOW_AGENT_PATH} className="text-primary font-bold underline" target="_blank">
            {JOB_APPLICATION_WORKFLOW_AGENT_PATH}
          </Link>
          .{" "}
          <Link href="/admin/job-application-workflow-agent/evals" className="text-primary font-bold underline">
            Fit analysis evals
          </Link>
        </p>
      </header>

      {message && (
        <div className="mb-6 rounded-xl bg-primary-fixed/50 px-4 py-3 text-sm font-medium">{message}</div>
      )}

      <div className="space-y-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={ui.content.enabled}
            onChange={(e) => ui.setLocalContent({ enabled: e.target.checked })}
            className="rounded border-outline-variant/30"
          />
          <span className="text-sm font-medium">Published (visible when AI Prototypes is unlocked)</span>
        </label>

        <Field label="Pill label" value={ui.content.heroPill} onChange={(v) => ui.setLocalContent({ heroPill: v })} />
        <div className="grid md:grid-cols-2 gap-4">
          <Field
            label="Hero title"
            value={ui.content.heroTitle}
            onChange={(v) => ui.setLocalContent({ heroTitle: v })}
          />
          <Field
            label="Hero title accent"
            value={ui.content.heroTitleAccent}
            onChange={(v) => ui.setLocalContent({ heroTitleAccent: v })}
          />
        </div>
        <TextArea
          label="Hero description"
          value={ui.content.heroDescription}
          onChange={(v) => ui.setLocalContent({ heroDescription: v })}
          rows={3}
        />

        <div className="space-y-4 border-t border-outline-variant/15 pt-6">
          <h2 className="text-lg font-bold">Workflow step cards</h2>
          {ui.content.workflowSteps.map((step, i) => (
            <div key={i} className="rounded-xl border border-outline-variant/15 p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Step {i + 1}</p>
              <Field
                label="Title"
                value={step.title}
                onChange={(v) => {
                  const workflowSteps = [...ui.content.workflowSteps];
                  workflowSteps[i] = { ...workflowSteps[i], title: v };
                  ui.setLocalContent({ workflowSteps });
                }}
              />
              <TextArea
                label="Description"
                value={step.description}
                onChange={(v) => {
                  const workflowSteps = [...ui.content.workflowSteps];
                  workflowSteps[i] = { ...workflowSteps[i], description: v };
                  ui.setLocalContent({ workflowSteps });
                }}
                rows={2}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm disabled:opacity-50"
        >
          Save copy
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-2">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-outline-variant/20 px-4 py-2.5 text-sm bg-surface-container-lowest"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-2">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-xl border border-outline-variant/20 px-4 py-2.5 text-sm bg-surface-container-lowest"
      />
    </div>
  );
}
