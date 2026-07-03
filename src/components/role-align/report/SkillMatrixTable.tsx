"use client";

import { useState } from "react";
import type { AlignmentByJd, SkillMatrixRow } from "@/lib/role-align/types";

type Props = {
  title: string;
  subtitle?: string;
  rows: SkillMatrixRow[];
  alignmentByJd?: AlignmentByJd[];
};

export function SkillMatrixTable({ title, subtitle, rows, alignmentByJd }: Props) {
  const [jdIndex, setJdIndex] = useState(0);

  if (!rows?.length) {
    return (
      <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6">
        <h3 className="text-lg font-extrabold font-[family-name:var(--font-headline)] mb-2">
          {title}
        </h3>
        <p className="text-sm text-on-surface-variant">No skill keywords extracted from job descriptions.</p>
      </section>
    );
  }

  const activeJd = alignmentByJd?.[jdIndex];

  return (
    <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest overflow-hidden">
      <div className="px-6 py-4 border-b border-outline-variant/10 bg-surface-container-low/50 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold font-[family-name:var(--font-headline)]">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-on-surface-variant mt-1">{subtitle}</p>
          )}
        </div>
        {alignmentByJd && alignmentByJd.length > 1 && (
          <div className="flex gap-1">
            {alignmentByJd.map((jd, i) => (
              <button
                key={`${jd.label}-${jd.company}-${i}`}
                type="button"
                onClick={() => setJdIndex(i)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  i === jdIndex
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {jd.company || `Job ${i + 1}`}
              </button>
            ))}
          </div>
        )}
      </div>
      {activeJd && alignmentByJd && alignmentByJd.length > 1 && (
        <p className="px-6 py-2 text-xs text-on-surface-variant bg-primary-fixed/20">
          Showing keywords vs <strong>{activeJd.company || activeJd.label}</strong>
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-container-low text-left">
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Skill
              </th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-center w-28">
                Your profile
              </th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-center w-28">
                Job description
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {rows.map((row) => (
              <tr key={row.skill} className="hover:bg-surface-container-low/30">
                <td className="px-6 py-3 font-medium text-on-surface capitalize">{row.skill}</td>
                <td className="px-4 py-3 text-center">
                  {row.profile_count > 0 ? (
                    <span className="font-bold text-on-surface">{row.profile_count}</span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-600">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </span>
                  )}
                </td>
                <td className="px-6 py-3 text-center font-bold text-on-surface-variant">
                  {row.jd_count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
