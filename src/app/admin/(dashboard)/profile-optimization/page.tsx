"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, doc, getDoc, getDocs, setDoc, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useContent } from "@/hooks/useContent";
import { PROFILE_OPTIMIZATION_HUB_INITIAL } from "@/lib/profile-optimization/constants";
import { ROLE_ALIGN_UI_INITIAL } from "@/lib/role-align/constants";
import {
  RESUME_OPTIMIZER_UI_INITIAL,
  RESUME_OPTIMIZER_CONFIG_DEFAULTS,
} from "@/lib/resume-optimizer/constants";
import type { ResumeOptimizerConfig } from "@/lib/resume-optimizer/types";

import { PROFILE_OPTIMIZATION_DOCS_INITIAL } from "@/lib/profile-optimization/docs-constants";

type Tab = "usage" | "hub" | "resume" | "linkedin" | "docs";

type UsageRow = {
  date: string;
  hub: Record<string, number>;
  resume: Record<string, number>;
  linkedin: Record<string, number>;
};

const EVENT_LABELS: Record<string, string> = {
  view: "Page views",
  tab_view: "Tab views",
  analyze_start: "Analyze started",
  analyze_complete: "Analyze complete",
  analyze_fail: "Analyze failed",
  fetch_start: "Fetch started",
  fetch_complete: "Fetch complete",
  fetch_fail: "Fetch failed",
};

export default function AdminProfileOptimizationPage() {
  const [tab, setTab] = useState<Tab>("usage");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [usageDays, setUsageDays] = useState(7);
  const [usageRows, setUsageRows] = useState<UsageRow[]>([]);
  const [usageLoading, setUsageLoading] = useState(true);

  const hub = useContent("profile_optimization_hub", PROFILE_OPTIMIZATION_HUB_INITIAL);
  const linkedInUi = useContent("role_align_ui", ROLE_ALIGN_UI_INITIAL);
  const resumeUi = useContent("resume_optimizer_ui", RESUME_OPTIMIZER_UI_INITIAL);
  const docs = useContent("profile_optimization_docs", PROFILE_OPTIMIZATION_DOCS_INITIAL);

  const [resumeConfig, setResumeConfig] = useState<ResumeOptimizerConfig>(RESUME_OPTIMIZER_CONFIG_DEFAULTS);
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const resumeSnap = await getDoc(doc(db, "resume_optimizer_config", "active"));
        if (resumeSnap.exists()) {
          setResumeConfig({ ...RESUME_OPTIMIZER_CONFIG_DEFAULTS, ...resumeSnap.data() } as ResumeOptimizerConfig);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setConfigLoading(false);
      }
    })();
  }, []);

  const loadUsage = useCallback(async () => {
    setUsageLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, "tool_usage_daily"), orderBy("__name__", "desc"), limit(usageDays))
      );
      const rows: UsageRow[] = snap.docs.map((d) => {
        const data = d.data();
        const parse = (prefix: string) => {
          const out: Record<string, number> = {};
          for (const [k, v] of Object.entries(data)) {
            if (k.startsWith(`${prefix}.`) && typeof v === "number") {
              out[k.slice(prefix.length + 1)] = v;
            }
          }
          return out;
        };
        return {
          date: d.id,
          hub: parse("hub"),
          resume: parse("resume"),
          linkedin: parse("linkedin"),
        };
      });
      setUsageRows(rows.reverse());
    } catch (e) {
      console.error(e);
      setUsageRows([]);
    } finally {
      setUsageLoading(false);
    }
  }, [usageDays]);

  useEffect(() => {
    if (tab === "usage") loadUsage();
  }, [tab, loadUsage]);

  const usageTotals = useMemo(() => {
    const sum = (tool: "hub" | "resume" | "linkedin", event: string) =>
      usageRows.reduce((acc, row) => acc + (row[tool][event] || 0), 0);
    return {
      hubViews: sum("hub", "view"),
      resumeAnalyzes: sum("resume", "analyze_complete"),
      linkedInAnalyzes: sum("linkedin", "analyze_complete"),
      linkedInFetches: sum("linkedin", "fetch_complete"),
    };
  }, [usageRows]);

  const saveHub = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    try {
      await hub.saveToFirestore();
      setMessage("Hub copy saved.");
    } catch {
      setMessage("Failed to save hub copy.");
    } finally {
      setSaving(false);
    }
  }, [hub]);

  const saveResumeUi = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    try {
      await resumeUi.saveToFirestore();
      setMessage("Resume UI copy saved.");
    } catch {
      setMessage("Failed to save resume UI.");
    } finally {
      setSaving(false);
    }
  }, [resumeUi]);

  const saveResumeConfig = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    try {
      await setDoc(
        doc(db, "resume_optimizer_config", "active"),
        {
          ...resumeConfig,
          version: (resumeConfig.version || 0) + 1,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setResumeConfig((c) => ({ ...c, version: (c.version || 0) + 1 }));
      setMessage("Resume backend config saved.");
    } catch {
      setMessage("Failed to save resume config.");
    } finally {
      setSaving(false);
    }
  }, [resumeConfig]);

  const saveLinkedInUi = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    try {
      await linkedInUi.saveToFirestore();
      setMessage("LinkedIn UI copy saved.");
    } catch {
      setMessage("Failed to save LinkedIn UI.");
    } finally {
      setSaving(false);
    }
  }, [linkedInUi]);

  const saveDocs = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    try {
      await docs.saveToFirestore();
      setMessage("Documentation saved.");
    } catch {
      setMessage("Failed to save documentation.");
    } finally {
      setSaving(false);
    }
  }, [docs]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "usage", label: "Usage" },
    { id: "hub", label: "Hub" },
    { id: "resume", label: "Resume" },
    { id: "linkedin", label: "LinkedIn" },
    { id: "docs", label: "Docs" },
  ];

  return (
    <div className="max-w-4xl">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold font-[family-name:var(--font-headline)] tracking-tighter">
          Profile Optimization CMS
        </h1>
        <p className="text-sm text-on-surface-variant mt-2">
          Hub copy, resume & LinkedIn optimizers, tech docs, prompts, and usage analytics.
        </p>
      </header>

      <div className="flex gap-2 mb-8 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              tab === t.id ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {message && (
        <div className="mb-6 rounded-xl bg-primary-fixed/50 px-4 py-3 text-sm font-medium">{message}</div>
      )}

      {tab === "usage" && (
        <div className="space-y-6">
          <div className="flex gap-2">
            {[7, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setUsageDays(d)}
                className={`px-4 py-2 rounded-xl text-sm font-bold ${
                  usageDays === d ? "bg-primary text-on-primary" : "bg-surface-container"
                }`}
              >
                Last {d} days
              </button>
            ))}
          </div>

          {usageLoading ? (
            <p className="text-sm text-on-surface-variant">Loading usage…</p>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Hub views" value={usageTotals.hubViews} />
                <StatCard label="Resume scans" value={usageTotals.resumeAnalyzes} />
                <StatCard label="LinkedIn scans" value={usageTotals.linkedInAnalyzes} />
                <StatCard label="Profile fetches" value={usageTotals.linkedInFetches} />
              </div>

              <div className="rounded-2xl border border-outline-variant/15 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-surface-container-low text-left">
                    <tr>
                      <th className="px-4 py-3 font-bold">Date</th>
                      <th className="px-4 py-3 font-bold">Hub</th>
                      <th className="px-4 py-3 font-bold">Resume</th>
                      <th className="px-4 py-3 font-bold">LinkedIn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {usageRows.map((row) => (
                      <tr key={row.date}>
                        <td className="px-4 py-3 font-mono text-xs">{row.date}</td>
                        <td className="px-4 py-3 text-on-surface-variant">
                          {formatEvents(row.hub)}
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant">
                          {formatEvents(row.resume)}
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant">
                          {formatEvents(row.linkedin)}
                        </td>
                      </tr>
                    ))}
                    {!usageRows.length && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-on-surface-variant">
                          No usage data yet. Events appear after visitors use the tool.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "hub" && (
        <div className="space-y-6">
          <Field
            label="Hero title"
            value={hub.content.heroTitle}
            onChange={(v) => hub.setLocalContent({ heroTitle: v })}
          />
          <Field
            label="Hero accent"
            value={hub.content.heroTitleAccent}
            onChange={(v) => hub.setLocalContent({ heroTitleAccent: v })}
          />
          <TextArea
            label="Hero description"
            value={hub.content.heroDescription}
            onChange={(v) => hub.setLocalContent({ heroDescription: v })}
          />
          <div className="grid md:grid-cols-2 gap-4">
            <Field
              label="Resume tab label"
              value={hub.content.resumeTabLabel}
              onChange={(v) => hub.setLocalContent({ resumeTabLabel: v })}
            />
            <Field
              label="LinkedIn tab label"
              value={hub.content.linkedInTabLabel}
              onChange={(v) => hub.setLocalContent({ linkedInTabLabel: v })}
            />
          </div>
          <button
            type="button"
            onClick={saveHub}
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm disabled:opacity-50"
          >
            Save hub copy
          </button>
        </div>
      )}

      {tab === "resume" && !configLoading && (
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-lg font-bold">UI copy</h2>
            <TextArea
              label="Loading tips (one per line)"
              value={resumeUi.content.loadingTips.join("\n")}
              onChange={(v) =>
                resumeUi.setLocalContent({
                  loadingTips: v.split("\n").map((l) => l.trim()).filter(Boolean),
                })
              }
              rows={8}
            />
            <TextArea
              label="Hero subtitle"
              value={resumeUi.content.heroSubtitle}
              onChange={(v) => resumeUi.setLocalContent({ heroSubtitle: v })}
            />
            <button
              type="button"
              onClick={saveResumeUi}
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm disabled:opacity-50"
            >
              Save resume UI
            </button>
          </section>

          <section className="space-y-4 border-t border-outline-variant/15 pt-8">
            <h2 className="text-lg font-bold">Prompts & backend</h2>
            <TextArea
              label="Extract system prompt"
              value={resumeConfig.prompts.extractSystem}
              onChange={(v) =>
                setResumeConfig({ ...resumeConfig, prompts: { ...resumeConfig.prompts, extractSystem: v } })
              }
              rows={6}
            />
            <TextArea
              label="Analyze system prompt"
              value={resumeConfig.prompts.analyzeSystem}
              onChange={(v) =>
                setResumeConfig({ ...resumeConfig, prompts: { ...resumeConfig.prompts, analyzeSystem: v } })
              }
              rows={6}
            />
            <button
              type="button"
              onClick={saveResumeConfig}
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm disabled:opacity-50"
            >
              Publish resume config
            </button>
          </section>
        </div>
      )}

      {tab === "linkedin" && (
        <div className="space-y-6">
          <p className="text-sm text-on-surface-variant">
            Full prompts and model settings live in{" "}
            <Link href="/admin/role-align" className="text-primary font-bold underline">
              LinkedIn Optimizer CMS
            </Link>
            . Edit progress tips and loading copy here.
          </p>
          <Field
            label="Progress title"
            value={linkedInUi.content.progressTitle}
            onChange={(v) => linkedInUi.setLocalContent({ progressTitle: v })}
          />
          <TextArea
            label="Loading tips (one per line)"
            value={linkedInUi.content.loadingTips.join("\n")}
            onChange={(v) =>
              linkedInUi.setLocalContent({
                loadingTips: v.split("\n").map((l) => l.trim()).filter(Boolean),
              })
            }
            rows={8}
          />
          <button
            type="button"
            onClick={saveLinkedInUi}
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm disabled:opacity-50"
          >
            Save LinkedIn UI
          </button>
        </div>
      )}

      {tab === "docs" && (
        <div className="space-y-6">
          <p className="text-sm text-on-surface-variant">
            Edit the page header for{" "}
            <Link href="/ai-prototypes/tech-docs" className="text-primary font-bold underline" target="_blank">
              /ai-prototypes/tech-docs
            </Link>
            . Documentation sections (1-11) are rendered from code for consistent layout, tables, and diagrams.
          </p>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={docs.content.enabled}
              onChange={(e) => docs.setLocalContent({ enabled: e.target.checked })}
              className="rounded border-outline-variant/30"
            />
            <span className="text-sm font-medium">Published (visible when AI Prototypes is unlocked)</span>
          </label>

          <Field
            label="Pill label"
            value={docs.content.pillLabel}
            onChange={(v) => docs.setLocalContent({ pillLabel: v })}
          />
          <div className="grid md:grid-cols-2 gap-4">
            <Field
              label="Hero title"
              value={docs.content.heroTitle}
              onChange={(v) => docs.setLocalContent({ heroTitle: v })}
            />
            <Field
              label="Hero title accent"
              value={docs.content.heroTitleAccent}
              onChange={(v) => docs.setLocalContent({ heroTitleAccent: v })}
            />
          </div>
          <TextArea
            label="Hero subtitle"
            value={docs.content.heroSubtitle}
            onChange={(v) => docs.setLocalContent({ heroSubtitle: v })}
            rows={3}
          />

          <button
            type="button"
            onClick={saveDocs}
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm disabled:opacity-50"
          >
            Save documentation header
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="text-3xl font-extrabold font-[family-name:var(--font-headline)] mt-2">{value}</p>
    </div>
  );
}

function formatEvents(events: Record<string, number>) {
  const entries = Object.entries(events).filter(([, v]) => v > 0);
  if (!entries.length) return "—";
  return entries
    .map(([k, v]) => `${EVENT_LABELS[k] || k}: ${v}`)
    .join(" · ");
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
        className="w-full rounded-xl border border-outline-variant/20 px-4 py-2.5 text-sm bg-surface-container-lowest font-mono text-xs"
      />
    </div>
  );
}
