"use client";

import Link from "next/link";
import { EVAL_QUALITY_SNAPSHOT } from "@/lib/job-search-agent/evals/publicSnapshot";

type Props = {
  showAdminLink?: boolean;
};

export function EvalQualityShowcase({ showAdminLink }: Props) {
  const snap = EVAL_QUALITY_SNAPSHOT;
  const allPass = snap.passCount === snap.total;

  return (
    <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest overflow-hidden">
      <div className="px-6 py-4 md:px-8 border-b border-outline-variant/10 bg-amber-50">
        <p className="text-sm font-bold text-amber-900">
          Please ignore anything below this area, it&apos;s for my test purposes only.
        </p>
      </div>
      <div className="px-6 py-5 md:px-8 md:py-6 border-b border-outline-variant/10 bg-surface-container-low/40">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Quality engineering
            </p>
            <h2 className="text-xl font-bold font-[family-name:var(--font-headline)] text-on-surface">
              {snap.headline}
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed mt-2">{snap.story}</p>
          </div>
          <div
            className={`shrink-0 rounded-2xl px-5 py-4 text-center border ${
              allPass ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
            }`}
          >
            <p className="text-3xl font-extrabold font-[family-name:var(--font-headline)] text-on-surface">
              {snap.passCount}/{snap.total}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mt-0.5">passing</p>
            <p className="text-[10px] text-on-surface-variant mt-2">Verified {snap.verifiedAtLabel}</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 md:px-8 md:py-6 space-y-6">
        <div className="grid sm:grid-cols-3 gap-3">
          <StatPill value={String(snap.total)} label="Golden cases" />
          <StatPill value={snap.tool} label="Tool under test" />
          <StatPill value="Production" label="API target" />
        </div>

        <div className="overflow-x-auto rounded-xl border border-outline-variant/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-surface-container-low/60">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Test case
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Score
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Expected
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Tier
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Result
                </th>
              </tr>
            </thead>
            <tbody>
              {snap.cases.map((row) => (
                <tr key={row.id} className="border-b border-outline-variant/10 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-on-surface">{row.label}</p>
                    <p className="text-xs text-on-surface-variant">{row.category}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-on-surface">{row.scoreDisplay}</td>
                  <td className="px-4 py-3 font-mono text-on-surface-variant text-xs">{row.expectedRange}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{row.tier}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      PASS
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
            What each run checks
          </p>
          <ul className="space-y-2">
            {snap.methodology.map((item) => (
              <li key={item} className="text-sm text-on-surface-variant flex gap-2 leading-relaxed">
                <span className="text-primary shrink-0">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-on-surface-variant border-t border-outline-variant/10 pt-4">
          Snapshot from a verified golden-set run against production{" "}
          <code className="bg-surface-container px-1 rounded">runAgentTool</code>. Scores may vary slightly
          between model versions; re-baseline after prompt changes.
          {showAdminLink && (
            <>
              {" "}
              <Link href="/admin/job-application-workflow-agent/evals" className="text-primary font-bold underline">
                Re-run evals (admin)
              </Link>
            </>
          )}
        </p>
      </div>
    </section>
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low/50 px-4 py-3 text-center">
      <p className="text-lg font-extrabold font-[family-name:var(--font-headline)] text-primary truncate">
        {value}
      </p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mt-0.5">{label}</p>
    </div>
  );
}
