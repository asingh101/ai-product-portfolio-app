"use client";

import type { ResumeOptimizerUI, ResumeReport } from "@/lib/resume-optimizer/types";
import type { AnalysisMeta } from "@/lib/resume-optimizer/types";
import { AlignmentScoreHero } from "@/components/role-align/report/AlignmentScoreHero";
import { ChecklistSection } from "@/components/role-align/report/ChecklistSection";
import { SkillMatrixTable } from "@/components/role-align/report/SkillMatrixTable";
import { RecommendationsPanel } from "@/components/role-align/report/RecommendationsPanel";
import { ResumeReportLayout } from "./ResumeReportLayout";

type Props = {
  ui: ResumeOptimizerUI;
  report: ResumeReport;
  meta?: AnalysisMeta;
  onStartOver: () => void;
};

export function ResumeReportView({ ui, report, meta, onStartOver }: Props) {
  const t = ui.reportSectionTitles;
  const checklist = report.checklist ?? [];
  const skillMatrix = report.skill_matrix ?? [];
  const stats = report.stats ?? { needs_improvement: 0, well_done: 0 };

  const enrichedReport = {
    ...report,
    checklist,
    skill_matrix: skillMatrix,
    stats,
    alignment_score: report.alignment_score ?? 0,
    alignment_by_jd: report.alignment_by_jd ?? [],
    executive_summary: report.executive_summary ?? { top_gaps: [], quick_wins: [] },
    recommendations: report.recommendations ?? [],
  };

  const experienceRecs = report.recommendations.filter((r) =>
    ["experience", "experience_bullets", "summary"].includes(r.section)
  );
  const aiRecs = report.recommendations.filter((r) =>
    ["ai_readiness", "format", "keywords"].includes(r.section)
  );

  const labelUi = {
    actionLabels: ui.actionLabels,
    impactLabels: ui.impactLabels,
  };

  return (
    <div className="print-report-root space-y-6">
      <div className="hidden print-report-header print:block">
        <h1 className="text-2xl font-extrabold">Resume Match Report</h1>
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

      <ResumeReportLayout
        onStartOver={onStartOver}
        printLabel={ui.printReportLabel}
        printHint={ui.printReportHint}
      >
        {(sectionId) => {
          switch (sectionId) {
            case "summary":
              return (
                <div className="space-y-6">
                  <AlignmentScoreHero
                    report={enrichedReport as Parameters<typeof AlignmentScoreHero>[0]["report"]}
                    targetLabel={report.input_summary}
                  />
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
                  </section>
                </div>
              );
            case "keywords":
              return (
                <SkillMatrixTable
                  title={t.keywords}
                  subtitle="Terms from the job description vs. your resume"
                  rows={skillMatrix}
                  alignmentByJd={report.alignment_by_jd}
                />
              );
            case "experience":
              return (
                <div className="space-y-6">
                  <ChecklistSection
                    title={t.experience}
                    items={checklist}
                    filterSection={["experience", "basic"]}
                  />
                  {experienceRecs.length > 0 && (
                    <RecommendationsPanel
                      ui={labelUi}
                      recommendations={experienceRecs}
                      title="Experience & summary suggestions"
                    />
                  )}
                </div>
              );
            case "ai_readiness":
              return (
                <div className="space-y-6">
                  <ChecklistSection
                    title={t.ai_readiness}
                    items={checklist}
                    filterSection={["format"]}
                  />
                  {aiRecs.length > 0 && (
                    <RecommendationsPanel
                      ui={labelUi}
                      recommendations={aiRecs}
                      title="Formatting suggestions"
                    />
                  )}
                </div>
              );
            case "actions":
              return (
                <RecommendationsPanel
                  ui={labelUi}
                  recommendations={report.recommendations}
                  title={t.actions}
                  variant="summary"
                />
              );
            default:
              return null;
          }
        }}
      </ResumeReportLayout>

      <div className="hidden print-report-footer print:block">
        <p>Generated by Profile Optimization Tool · Session-only analysis</p>
      </div>

      <p className="text-xs text-on-surface-variant text-center max-w-2xl mx-auto print:hidden">
        {ui.disclaimer}
      </p>
    </div>
  );
}
