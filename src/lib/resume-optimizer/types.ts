/** Resume Optimizer, shared types (report shape aligned with LinkedIn Optimizer) */

export type FitBand = "strong" | "moderate" | "needs_work";
export type ImpactLevel = "high" | "medium" | "low";
export type RecommendationAction = "add" | "rewrite" | "emphasize" | "keep";

export type JobDescriptionInput = {
  label: "primary" | "alternate";
  company?: string;
  text: string;
};

export type AnalyzeResumeRequest = {
  resumeText: string;
  jobDescriptions: JobDescriptionInput[];
};

export type ChecklistItem = {
  id: string;
  section: "basic" | "experience" | "skills" | "format" | "ai_readiness";
  label: string;
  status: "pass" | "fail";
  priority: ImpactLevel;
  reason: string;
};

export type SkillMatrixRow = {
  skill: string;
  profile_count: number;
  jd_count: number;
};

export type AlignmentByJd = {
  label: string;
  company?: string;
  score: number;
};

export type Recommendation = {
  id: string;
  section: string;
  action: RecommendationAction;
  impact: ImpactLevel;
  effort: ImpactLevel;
  issue: string;
  suggestion: string;
  jd_evidence: string[];
  current_snippet?: string | null;
};

export type ResumeReport = {
  fit_band: FitBand;
  alignment_score: number;
  alignment_by_jd: AlignmentByJd[];
  stats: { needs_improvement: number; well_done: number };
  checklist: ChecklistItem[];
  skill_matrix: SkillMatrixRow[];
  executive_summary: { top_gaps: string[]; quick_wins: string[] };
  cross_role_themes: string[];
  role_conflicts: string[];
  section_audit: { section: string; status: string; reason: string }[];
  recommendations: Recommendation[];
  input_summary: string;
};

export type AnalysisMeta = {
  tokens: { extract: number; analyze: number; total: number };
  durationMs: number;
  configVersion: number;
};

export type ProgressStepId =
  | "validate"
  | "normalize"
  | "extract"
  | "analyze"
  | "finalize";

export type ProgressEvent = {
  step: ProgressStepId;
  progress: number;
  label: string;
  detail?: string;
};

export type ProgressStepConfig = {
  id: ProgressStepId;
  label: string;
  progress: number;
  detailTemplates: string[];
};

export type ResumeOptimizerLimits = {
  resumeMaxChars: number;
  jdMaxChars: number;
  maxJds: number;
};

export type ResumeOptimizerUI = {
  enabled: boolean;
  heroTitle: string;
  heroSubtitle: string;
  formLabels: Record<string, string>;
  formHints: Record<string, string>;
  formPlaceholders: Record<string, string>;
  validationMessages: Record<string, string>;
  loadingTips: string[];
  progressSteps: ProgressStepConfig[];
  reportSectionTitles: Record<string, string>;
  impactLabels: Record<ImpactLevel, string>;
  actionLabels: Record<RecommendationAction, string>;
  fitBandLabels: Record<FitBand, string>;
  disclaimer: string;
  privacyNote: string;
  sessionOnlyNote: string;
  limits: ResumeOptimizerLimits;
  runButtonLabel: string;
  printReportLabel: string;
  printReportHint: string;
  analyzeEstimateNote: string;
};

export type ErrorEvent = {
  code: string;
  message: string;
  retryable: boolean;
};

export type CompleteEvent = {
  report: ResumeReport;
  meta: AnalysisMeta;
};

export type ResumeOptimizerConfig = {
  version: number;
  limits: ResumeOptimizerLimits;
  models: {
    extractModel: string;
    analyzeModel: string;
    extractTemperature: number;
    analyzeTemperature: number;
    extractMaxOutputTokens: number;
    analyzeMaxOutputTokens: number;
  };
  prompts: {
    extractSystem: string;
    extractUserTemplate: string;
    analyzeSystem: string;
    analyzeUserTemplate: string;
    guardrails: string;
  };
  rateLimit: { maxRunsPerHourPerIp: number };
  progressSteps: ProgressStepConfig[];
};
