"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useContent } from "@/hooks/useContent";
import { isAiPrototypesLocked } from "@/lib/featureFlags";
import { PROFILE_OPTIMIZATION_DOCS_INITIAL } from "@/lib/profile-optimization/docs-constants";
import {
  DocTableOfContents,
  ProfileOptimizationDocumentation,
} from "@/components/ai-prototypes/tech-docs/ProfileOptimizationDocumentation";

export default function TechDocsPage() {
  const { isAdmin } = useAuth();
  const locked = isAiPrototypesLocked();
  const docs = useContent("profile_optimization_docs", PROFILE_OPTIMIZATION_DOCS_INITIAL);

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

  if (!docs.content.enabled && !isAdmin) {
    return (
      <main className="pt-28 pb-24 px-6 text-center max-w-lg mx-auto">
        <p className="text-on-surface-variant mb-6">This documentation is not published yet.</p>
        <Link href="/ai-prototypes" className="text-primary font-bold">
          Back to AI Prototypes
        </Link>
      </main>
    );
  }

  return (
    <main className="pt-28 pb-24 px-6 md:px-12 max-w-7xl mx-auto tech-docs-print">
      {isAdmin && locked && (
        <div className="no-print mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-700 text-xl shrink-0">visibility</span>
          <div>
            <p className="text-sm font-bold text-amber-900">Admin preview</p>
            <p className="text-sm text-amber-800/90 mt-1">This documentation is visible to admins while AI Prototypes is locked.</p>
          </div>
        </div>
      )}

      {!docs.content.enabled && isAdmin && (
        <div className="no-print mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-700 text-xl shrink-0">edit_note</span>
          <div>
            <p className="text-sm font-bold text-amber-900">Draft mode</p>
            <p className="text-sm text-amber-800/90 mt-1">
              Docs are disabled in CMS. Only admins can see this page.{" "}
              <Link href="/admin/profile-optimization" className="text-primary font-bold underline">
                Edit in CMS
              </Link>
            </p>
          </div>
        </div>
      )}

      <header className="mb-12 max-w-3xl">
        <div className="no-print flex flex-col items-start gap-3 mb-6">
          <Link
            href="/ai-prototypes"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-on-surface-variant hover:text-primary"
          >
            <span className="material-symbols-outlined text-[18px] leading-none">arrow_back</span>
            AI Prototypes
          </Link>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-fixed text-on-primary-fixed text-xs font-bold tracking-widest uppercase rounded-full">
            <span className="material-symbols-outlined text-base leading-none">menu_book</span>
            {docs.content.pillLabel}
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter leading-[1.1] font-[family-name:var(--font-headline)] mb-6">
          {docs.content.heroTitle}{" "}
          <span className="text-gradient">{docs.content.heroTitleAccent}</span>
        </h1>
        <p className="text-lg text-on-surface-variant leading-relaxed mb-6">{docs.content.heroSubtitle}</p>
        <div className="no-print flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-sm font-bold hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-base">print</span>
            Print / Save as PDF
          </button>
          <Link
            href="/ai-prototypes/profile-optimization"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-base">rocket_launch</span>
            Try the live tool
          </Link>
          {isAdmin && (
            <Link
              href="/admin/profile-optimization"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-sm font-bold hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-base">edit</span>
              Edit docs
            </Link>
          )}
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-12">
        <aside className="no-print lg:w-56 shrink-0">
          <div className="lg:sticky lg:top-28 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3 px-3">
              On this page
            </p>
            <DocTableOfContents />
          </div>
        </aside>
        <ProfileOptimizationDocumentation />
      </div>
    </main>
  );
}
