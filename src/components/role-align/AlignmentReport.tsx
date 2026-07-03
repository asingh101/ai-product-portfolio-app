"use client";

import type { AlignmentReport, RoleAlignUI } from "@/lib/role-align/types";
import type { AnalysisMeta } from "@/lib/role-align/types";
import { ReportLayout } from "./report/ReportLayout";
import { AlignmentScoreHero } from "./report/AlignmentScoreHero";
import { ChecklistSection } from "./report/ChecklistSection";
import { SkillMatrixTable } from "./report/SkillMatrixTable";
import { RecommendationsPanel } from "./report/RecommendationsPanel";

type Props = {
  ui: RoleAlignUI;
  report: AlignmentReport;
  meta?: AnalysisMeta;
  onStartOver: () => void;
};

const DEFAULT_CHECKLIST: AlignmentReport["checklist"] = [];
const DEFAULT_SKILL_MATRIX: AlignmentReport["skill_matrix"] = [];
const DEFAULT_STATS = { needs_improvement: 0, well_done: 0 };

export function AlignmentReportView({ ui, report, meta, onStartOver }: Props) {
  const t = ui.reportSectionTitles;
  const checklist = report.checklist ?? DEFAULT_CHECKLIST;
  const skillMatrix = report.skill_matrix ?? DEFAULT_SKILL_MATRIX;
  const stats = report.stats ?? DEFAULT_STATS;
  const alignmentScore = report.alignment_score ?? 0;

  const enrichedReport: AlignmentReport = {
    ...report,
    checklist,
    skill_matrix: skillMatrix,
    stats,
    alignment_score: alignmentScore,
    alignment_by_jd: report.alignment_by_jd ?? [],
  };

  const experienceRecs = report.recommendations.filter((r) =>
    ["experience", "experience_bullets", "projects"].includes(r.section)
  );

  return (
    <div className="print-report-root space-y-6">
      <div className="hidden print-report-header print:block">
        <h1 className="text-2xl font-extrabold">LinkedIn Alignment Report</h1>
        <p className="text-sm text-gray-600 mt-1">{report.input_summary}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 max-w-6xl mx-auto px-1 print:hidden">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            {report.input_summary}
          </p>
          <p className="text-sm text-on-surface-variant mt-1">{ui.sessionOnlyNote}</p>
        </div>
      </div>

      <ReportLayout
        onStartOver={onStartOver}
        printLabel={ui.printReportLabel}
        printHint={ui.printReportHint}
      >
        {(sectionId) => {
          switch (sectionId) {
            case "summary":
              return (
                <div className="space-y-6">
                  <AlignmentScoreHero report={enrichedReport} />
                  <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6 md:p-8">
                    <h3 className="text-lg font-extrabold font-[family-name:var(--font-headline)] mb-6">
                      {t.summary}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                          Top gaps
                        </h4>
                        <ul className="space-y-2">
                          {report.executive_summary.top_gaps.map((g, i) => (
                            <li key={i} className="text-sm text-on-surface-variant flex gap-2">
                              <span className="text-primary font-bold">{i + 1}.</span>
                              {g}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                          {t.quickWins}
                        </h4>
                        <ul className="space-y-2">
                          {report.executive_summary.quick_wins.map((w, i) => (
                            <li key={i} className="text-sm text-on-surface-variant flex gap-2">
                              <span className="material-symbols-outlined text-primary text-base shrink-0">
                                bolt
                              </span>
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    {report.cross_role_themes.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-outline-variant/10">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                          {t.themes}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {report.cross_role_themes.map((theme) => (
                            <span
                              key={theme}
                              className="px-3 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-bold"
                            >
                              {theme}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                </div>
              );
            case "basics":
              return (
                <ChecklistSection
                  title={t.basics}
                  items={checklist}
                  filterSection={["basic", "visual"]}
                />
              );
            case "experience":
              return (
                <div className="space-y-6">
                  <ChecklistSection
                    title={t.experience}
                    items={checklist}
                    filterSection={["experience", "projects"]}
                  />
                  {experienceRecs.length > 0 && (
                    <RecommendationsPanel
                      ui={ui}
                      recommendations={experienceRecs}
                      title="Experience recommendations"
                    />
                  )}
                </div>
              );
            case "skills":
              return (
                <SkillMatrixTable
                  title={t.skills}
                  subtitle="Keyword frequency in your profile vs job descriptions"
                  rows={skillMatrix}
                  alignmentByJd={report.alignment_by_jd}
                />
              );
            case "actions":
              return (
                <div className="space-y-6">
                  {report.role_conflicts.length > 0 && (
                    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                      <h3 className="text-lg font-extrabold text-amber-900 mb-3">{t.conflicts}</h3>
                      <ul className="space-y-2">
                        {report.role_conflicts.map((c, i) => (
                          <li key={i} className="text-sm text-amber-900/90">
                            {c}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  <RecommendationsPanel
                    ui={ui}
                    recommendations={report.recommendations}
                    title={t.recommendations}
                    variant="summary"
                  />
                </div>
              );
            default:
              return null;
          }
        }}
      </ReportLayout>

      {meta && (
        <p className="text-[10px] text-on-surface-variant/60 text-center max-w-6xl mx-auto print:hidden">
          {meta.durationMs}ms · {meta.tokens.total} tokens · config v{meta.configVersion}
        </p>
      )}

      <div className="hidden print-report-footer print:block">
        <p>Generated by Profile Optimization Tool · Session-only analysis</p>
      </div>

      <footer className="text-center text-xs text-on-surface-variant space-y-2 pt-4 border-t border-outline-variant/10 max-w-6xl mx-auto print:hidden">
        {ui.disclaimer?.trim() ? <p>{ui.disclaimer}</p> : null}
        <p>{ui.privacyNote}</p>
      </footer>
    </div>
  );
}
