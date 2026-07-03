/** Shared types for LinkedIn Optimizer, profile ↔ job description alignment tool */

export type SectionStatus = "missing" | "weak" | "present" | "strong";

export type FitBand = "strong" | "moderate" | "needs_work";

export type RecommendationAction = "add" | "rewrite" | "emphasize" | "keep";

export type ImpactLevel = "high" | "medium" | "low";

export type ExperienceRole = {
  title: string;
  company: string;
  bullets: string[];
};

export type ProfileProject = {
  title: string;
  url?: string;
};

export type ProfileMeta = {
  hasProfilePhoto: boolean;
  hasBannerPhoto: boolean;
  hasProjects: boolean;
  hasExperienceBullets: boolean;
  displayName?: string;
  location?: string;
  fetchSource: "proxycurl" | "manual" | "hybrid";
};

export type ProfileInput = {
  linkedInUrl: string;
  targetRoleLabel: string;
  headline: string;
  about: string;
  experience: ExperienceRole[];
  skills: string[];
  additionalNotes?: string;
  projects?: ProfileProject[];
};

export type JobDescriptionInput = {
  label: "primary" | "alternate";
  company?: string;
  text: string;
};

export type AnalyzeRequest = {
  profile: ProfileInput;
  profileMeta?: ProfileMeta;
  jobDescriptions: JobDescriptionInput[];
};

export type FetchProfileResponse = {
  ok: boolean;
  profile?: ProfileInput;
  profileMeta?: ProfileMeta;
  fetchMeta?: { source: string; partial: boolean };
  code?: string;
  message?: string;
  retryable?: boolean;
};

export type SectionAuditItem = {
  section: string;
  status: SectionStatus;
  reason: string;
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

export type ChecklistItem = {
  id: string;
  section: "basic" | "experience" | "skills" | "visual" | "projects";
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

export type AlignmentReport = {
  fit_band: FitBand;
  alignment_score: number;
  alignment_by_jd: AlignmentByJd[];
  stats: { needs_improvement: number; well_done: number };
  checklist: ChecklistItem[];
  skill_matrix: SkillMatrixRow[];
  executive_summary: {
    top_gaps: string[];
    quick_wins: string[];
  };
  cross_role_themes: string[];
  role_conflicts: string[];
  section_audit: SectionAuditItem[];
  recommendations: Recommendation[];
  input_summary: string;
  profileMeta?: ProfileMeta;
};

export type AnalysisMeta = {
  tokens: { extract: number; analyze: number; total: number };
  durationMs: number;
  configVersion: number;
};

export type ProgressStepId =
  | "validate"
  | "fetch_profile"
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

export type CompleteEvent = {
  report: AlignmentReport;
  meta: AnalysisMeta;
};

export type ErrorEvent = {
  code: string;
  message: string;
  retryable: boolean;
};

export type ProgressStepConfig = {
  id: ProgressStepId;
  label: string;
  progress: number;
  detailTemplates: string[];
};

export type RoleAlignLimits = {
  headlineMax: number;
  aboutMax: number;
  maxRoles: number;
  maxBulletsPerRole: number;
  bulletMax: number;
  maxSkills: number;
  jdMaxChars: number;
  maxJds: number;
  targetRoleLabelMax: number;
};

export type RoleAlignUI = {
  enabled: boolean;
  heroPill: string;
  heroTitle: string;
  heroTitleAccent: string;
  heroDescription: string;
  howItWorksSteps: { title: string; description: string }[];
  wizardStepLabels: [string, string];
  formLabels: Record<string, string>;
  formHints: Record<string, string>;
  formPlaceholders: Record<string, string>;
  validationMessages: Record<string, string>;
  progressSteps: ProgressStepConfig[];
  loadingTips: string[];
  progressTitle: string;
  printReportLabel: string;
  printReportHint: string;
  reportSectionTitles: Record<string, string>;
  reportEmptyStates: Record<string, string>;
  impactLabels: Record<ImpactLevel, string>;
  actionLabels: Record<RecommendationAction, string>;
  fitBandLabels: Record<FitBand, string>;
  disclaimer: string;
  privacyNote: string;
  sessionOnlyNote: string;
  caseStudyTitle: string;
  caseStudyBody: string;
  showCaseStudy: boolean;
  limits: RoleAlignLimits;
  runButtonLabel: string;
  backButtonLabel: string;
  nextButtonLabel: string;
  analyzeEstimateNote: string;
};

export type RoleAlignConfig = {
  version: number;
  limits: RoleAlignLimits;
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
  sectionPriority: string[];
  rateLimit: { maxRunsPerHourPerIp: number; maxFetchesPerHourPerIp?: number };
  features: {
    enableKeywordMatrix: boolean;
    enableJdSectionExtraction: boolean;
    enableProxycurlFetch?: boolean;
  };
};
