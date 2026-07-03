"use client";

import { useCallback, useState, type ReactNode } from "react";
import { PrintReportButton } from "@/components/profile-optimization/PrintReportButton";

const SECTIONS = [
  { id: "summary", label: "Summary" },
  { id: "keywords", label: "Keywords" },
  { id: "experience", label: "Experience" },
  { id: "ai_readiness", label: "AI & ATS" },
  { id: "actions", label: "Action plan" },
] as const;

type Props = {
  onStartOver: () => void;
  printLabel?: string;
  printHint?: string;
  children: (sectionId: string) => ReactNode;
};

export function ResumeReportLayout({ onStartOver, printLabel, printHint, children }: Props) {
  const [active, setActive] = useState("summary");

  const scrollTo = useCallback((id: string) => {
    setActive(id);
    document.getElementById(`report-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
      <aside className="lg:w-56 shrink-0 print:hidden">
        <div className="lg:sticky lg:top-28 space-y-4">
          <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
              Match report
            </p>
            <nav className="space-y-1">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollTo(s.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                    active === s.id
                      ? "bg-primary text-on-primary"
                      : "text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </nav>
          </div>
          <PrintReportButton label={printLabel} hint={printHint} />
          <button
            type="button"
            onClick={onStartOver}
            className="w-full px-4 py-3 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            New scan
          </button>
        </div>
      </aside>
      <div className="flex-1 min-w-0 space-y-10">
        {SECTIONS.map((s) => (
          <div key={s.id} id={`report-${s.id}`}>
            {children(s.id)}
          </div>
        ))}
      </div>
    </div>
  );
}
