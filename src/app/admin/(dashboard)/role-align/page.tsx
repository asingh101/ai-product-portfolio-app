"use client";

import { useCallback, useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useContent } from "@/hooks/useContent";
import { ROLE_ALIGN_UI_INITIAL, ROLE_ALIGN_CONFIG_DEFAULTS } from "@/lib/role-align/constants";
import type { RoleAlignConfig } from "@/lib/role-align/types";
import { MarkdownTextField } from "@/components/admin/MarkdownTextField";

type Tab = "ui" | "prompts" | "settings";

export default function AdminRoleAlignPage() {
  const [tab, setTab] = useState<Tab>("ui");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const ui = useContent("role_align_ui", ROLE_ALIGN_UI_INITIAL);
  const [config, setConfig] = useState<RoleAlignConfig>(ROLE_ALIGN_CONFIG_DEFAULTS);
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "role_align_config", "active"));
        if (snap.exists()) {
          setConfig({ ...ROLE_ALIGN_CONFIG_DEFAULTS, ...snap.data() } as RoleAlignConfig);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setConfigLoading(false);
      }
    })();
  }, []);

  const saveUi = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    try {
      await ui.saveToFirestore();
      setMessage("UI copy saved.");
    } catch {
      setMessage("Failed to save UI copy.");
    } finally {
      setSaving(false);
    }
  }, [ui]);

  const saveConfig = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    try {
      await setDoc(
        doc(db, "role_align_config", "active"),
        { ...config, version: (config.version || 0) + 1, updatedAt: new Date().toISOString() },
        { merge: true }
      );
      setConfig((c) => ({ ...c, version: (c.version || 0) + 1 }));
      setMessage("Backend config saved. Cloud Functions pick up changes within ~5 minutes (cache TTL).");
    } catch {
      setMessage("Failed to save config.");
    } finally {
      setSaving(false);
    }
  }, [config]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "ui", label: "UI Copy" },
    { id: "prompts", label: "Prompts" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="max-w-4xl">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold font-[family-name:var(--font-headline)] tracking-tighter">
          LinkedIn Optimizer CMS
        </h1>
        <p className="text-sm text-on-surface-variant mt-2">
          Edit all visitor-facing copy, LLM prompts, limits, and model settings.
        </p>
      </header>

      <div className="flex gap-2 mb-8 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              tab === t.id
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {message && (
        <div className="mb-6 rounded-xl bg-primary-fixed/50 px-4 py-3 text-sm font-medium">{message}</div>
      )}

      {tab === "ui" && (
        <div className="space-y-6">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={ui.content.enabled}
              onChange={(e) => ui.setLocalContent({ enabled: e.target.checked })}
            />
            <span className="text-sm font-bold">Prototype enabled</span>
          </label>

          <Field
            label="Hero pill"
            value={ui.content.heroPill}
            onChange={(v) => ui.setLocalContent({ heroPill: v })}
          />
          <div className="grid md:grid-cols-2 gap-4">
            <Field
              label="Hero title"
              value={ui.content.heroTitle}
              onChange={(v) => ui.setLocalContent({ heroTitle: v })}
            />
            <Field
              label="Hero accent"
              value={ui.content.heroTitleAccent}
              onChange={(v) => ui.setLocalContent({ heroTitleAccent: v })}
            />
          </div>
          <TextArea
            label="Hero description"
            value={ui.content.heroDescription}
            onChange={(v) => ui.setLocalContent({ heroDescription: v })}
          />
          <TextArea
            label="Disclaimer"
            value={ui.content.disclaimer}
            onChange={(v) => ui.setLocalContent({ disclaimer: v })}
          />
          <TextArea
            label="Privacy note"
            value={ui.content.privacyNote}
            onChange={(v) => ui.setLocalContent({ privacyNote: v })}
          />
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-2">
              Case study body
            </label>
            <MarkdownTextField
              value={ui.content.caseStudyBody}
              onChange={(v) => ui.setLocalContent({ caseStudyBody: v })}
              rows={6}
            />
          </div>
          <button
            type="button"
            onClick={saveUi}
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm disabled:opacity-50"
          >
            Save UI copy
          </button>
        </div>
      )}

      {tab === "prompts" && !configLoading && (
        <div className="space-y-6">
          <TextArea
            label="Guardrails"
            value={config.prompts.guardrails}
            onChange={(v) =>
              setConfig({ ...config, prompts: { ...config.prompts, guardrails: v } })
            }
            rows={4}
          />
          <TextArea
            label="Extract system prompt"
            value={config.prompts.extractSystem}
            onChange={(v) =>
              setConfig({ ...config, prompts: { ...config.prompts, extractSystem: v } })
            }
            rows={8}
          />
          <TextArea
            label="Extract user template"
            value={config.prompts.extractUserTemplate}
            onChange={(v) =>
              setConfig({ ...config, prompts: { ...config.prompts, extractUserTemplate: v } })
            }
            rows={8}
          />
          <TextArea
            label="Analyze system prompt"
            value={config.prompts.analyzeSystem}
            onChange={(v) =>
              setConfig({ ...config, prompts: { ...config.prompts, analyzeSystem: v } })
            }
            rows={8}
          />
          <TextArea
            label="Analyze user template"
            value={config.prompts.analyzeUserTemplate}
            onChange={(v) =>
              setConfig({ ...config, prompts: { ...config.prompts, analyzeUserTemplate: v } })
            }
            rows={6}
          />
          <p className="text-xs text-on-surface-variant">
            Template slots: {"{{guardrails}}"}, {"{{target_role_label}}"}, {"{{section_status_json}}"},
            {" {{profile_json}}"}, {"{{jds_json}}"}, {"{{keyword_hints}}"}, {"{{extract_json}}"}
          </p>
          <button
            type="button"
            onClick={saveConfig}
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm disabled:opacity-50"
          >
            Publish prompts & config
          </button>
        </div>
      )}

      {tab === "settings" && !configLoading && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Field
              label="Extract model"
              value={config.models.extractModel}
              onChange={(v) =>
                setConfig({ ...config, models: { ...config.models, extractModel: v } })
              }
            />
            <Field
              label="Analyze model"
              value={config.models.analyzeModel}
              onChange={(v) =>
                setConfig({ ...config, models: { ...config.models, analyzeModel: v } })
              }
            />
          </div>
          <Field
            label="Max runs per hour (per IP)"
            value={String(config.rateLimit.maxRunsPerHourPerIp)}
            onChange={(v) =>
              setConfig({
                ...config,
                rateLimit: { maxRunsPerHourPerIp: parseInt(v, 10) || 10 },
              })
            }
          />
          <div className="grid md:grid-cols-2 gap-4">
            <Field
              label="JD max chars"
              value={String(config.limits.jdMaxChars)}
              onChange={(v) =>
                setConfig({
                  ...config,
                  limits: { ...config.limits, jdMaxChars: parseInt(v, 10) || 6000 },
                })
              }
            />
            <Field
              label="Max JDs"
              value={String(config.limits.maxJds)}
              onChange={(v) =>
                setConfig({
                  ...config,
                  limits: { ...config.limits, maxJds: parseInt(v, 10) || 3 },
                })
              }
            />
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={config.features.enableKeywordMatrix}
              onChange={(e) =>
                setConfig({
                  ...config,
                  features: { ...config.features, enableKeywordMatrix: e.target.checked },
                })
              }
            />
            <span className="text-sm">Enable keyword matrix (token-free pre-analysis)</span>
          </label>
          <button
            type="button"
            onClick={saveConfig}
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm disabled:opacity-50"
          >
            Save settings
          </button>
        </div>
      )}
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
        className="w-full rounded-xl border border-outline-variant/20 px-4 py-2.5 text-sm bg-surface-container-lowest font-mono text-xs"
      />
    </div>
  );
}
