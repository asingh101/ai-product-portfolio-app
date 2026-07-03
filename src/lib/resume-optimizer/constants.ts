import type { ResumeOptimizerConfig, ResumeOptimizerUI } from "./types";

export const DEFAULT_RESUME_LIMITS = {
  resumeMaxChars: 12000,
  jdMaxChars: 6000,
  maxJds: 3,
};

export const DEFAULT_LOADING_TIPS = [
  "Recruiters don't read your resume, they scan it in under 10 seconds. Put outcomes up front.",
  "Context beats prose. Lead with role, domain, and impact, not long paragraphs.",
  "Numbers stop the scan. %, $, scale, and time saved help you stand out.",
  "Mirror the job description, use the same keywords recruiters and ATS search for.",
  "A strong Professional Summary (3–4 lines) frames everything below it.",
  "Bullet points beat paragraphs, easier for humans and parsers to skim.",
  "Start bullets with Led, Shipped, Drove, Increased, not Responsible for.",
  "Tailor this resume to this job, generic resumes lose on keyword match.",
];

export const RESUME_OPTIMIZER_UI_INITIAL: ResumeOptimizerUI = {
  enabled: true,
  heroTitle: "Tailor your resume",
  heroSubtitle: "Paste your resume and target job description for a match score and actionable fixes.",
  formLabels: {
    resume: "Your resume",
    primaryJd: "Target job description",
    company: "Company",
    alternateJd: "Alternate job",
  },
  formHints: {
    resume: "Copy and paste your full resume text.",
    primaryJd: "Paste the job posting. Exclude benefits and legal disclaimers if possible.",
    company: "Company name for the primary role.",
    alternateJd: "Optional, similar roles for cross-theme analysis.",
  },
  formPlaceholders: {
    resume: "Copy and paste resume here…",
    jd: "Paste job description here…",
    company: "Acme Corp",
  },
  validationMessages: {
    resume: "Resume text is required (min 200 characters).",
    primaryJd: "Job description required (min 100 characters).",
    primaryCompany: "Company name is required for the primary job.",
  },
  loadingTips: DEFAULT_LOADING_TIPS,
  progressSteps: [
    { id: "validate", label: "Validating your inputs", progress: 5, detailTemplates: ["Checking resume and job description…"] },
    { id: "normalize", label: "Structuring your resume", progress: 18, detailTemplates: ["Scanning sections and keywords…"] },
    { id: "extract", label: "Extracting role requirements", progress: 45, detailTemplates: ["Identifying must-have skills from the JD…"] },
    { id: "analyze", label: "Matching resume to role", progress: 75, detailTemplates: ["Finding gaps and drafting suggestions…"] },
    { id: "finalize", label: "Building your match report", progress: 95, detailTemplates: ["Calculating match score…"] },
  ],
  reportSectionTitles: {
    summary: "Match summary",
    keywords: "Keyword match",
    experience: "Experience & outcomes",
    ai_readiness: "AI & ATS readiness",
    actions: "Action plan",
    quickWins: "Quick wins",
    themes: "Cross-role themes",
    conflicts: "Role conflicts",
  },
  impactLabels: { high: "High impact", medium: "Medium impact", low: "Low impact" },
  actionLabels: { add: "Add", rewrite: "Rewrite", emphasize: "Emphasize", keep: "Keep" },
  fitBandLabels: { strong: "Strong match", moderate: "Moderate match", needs_work: "Needs work" },
  disclaimer: "Suggestions are AI-generated guidance. Review all changes before submitting applications.",
  privacyNote: "Your resume and job descriptions are processed in this session only, we do not store them.",
  sessionOnlyNote: "Session-only analysis · No account required",
  limits: DEFAULT_RESUME_LIMITS,
  runButtonLabel: "Scan resume",
  printReportLabel: "Print report",
  printReportHint: "Use Save as PDF in the print dialog.",
  analyzeEstimateNote: "Usually takes 30–60 seconds",
};

export const RESUME_OPTIMIZER_CONFIG_DEFAULTS: ResumeOptimizerConfig = {
  version: 1,
  limits: DEFAULT_RESUME_LIMITS,
  models: {
    extractModel: "gemini-3.1-flash-lite-preview",
    analyzeModel: "gemini-3.1-flash-lite-preview",
    extractTemperature: 0.15,
    analyzeTemperature: 0.3,
    extractMaxOutputTokens: 1200,
    analyzeMaxOutputTokens: 1200,
  },
  prompts: {
    guardrails: `Never invent employers, titles, skills, or job requirements not present in the user data.
If uncertain, omit the recommendation. Output valid JSON only, no markdown.`,
    extractSystem: `You extract structured signals from a resume and job descriptions for match analysis.
{{guardrails}}
Return compact JSON only:
{"resume_signals":{"has_summary":true,"summary_strength":"weak|present|strong","bullet_count":0,"quantified_bullet_count":0,"skills_detected":["max 10"]},"jd_extracts":[{"label":"primary|alternate","title_signals":["max 3"],"must_have":["max 8"],"nice_to_have":["max 4"]}],"section_audit":[{"section":"summary|experience|skills|format","status":"missing|weak|present|strong","reason":"max 12 words"}]}
Primary JD is most important. must_have items must be concrete skills or requirements from the JD text.`,
    extractUserTemplate: `<resume>
{{resume_text}}
</resume>

<job_descriptions>
{{jds_json}}
</job_descriptions>

{{keyword_hints}}`,
    analyzeSystem: `You prioritize resume improvements aligned to target job descriptions.
{{guardrails}}
Checklist failures (summary, quantified bullets, format) and missing keywords are handled elsewhere, do NOT repeat them unless you provide paste-ready rewrite text.

Return JSON only:
{"fit_band":"strong|moderate|needs_work","executive_summary":{"top_gaps":["string"],"quick_wins":["string"]},"cross_role_themes":["string"],"role_conflicts":["string"],"recommendations":[{"id":"rec-N","section":"summary|experience|skills|keywords|ai_readiness|experience_bullets","action":"add|rewrite|emphasize|keep","impact":"high|medium|low","effort":"high|medium|low","issue":"string","suggestion":"string","jd_evidence":["string"],"current_snippet":"string|null"}]}

Rules:
- top_gaps: exactly 4. One sentence: [section] lacks [specific JD term/skill from jd_extracts].
- quick_wins: exactly 3. Each = one concrete edit doable in under 15 minutes.
- recommendations: max 8, high/medium impact only, sorted by impact.
- issue: max 20 words, name section + specific gap vs JD.
- suggestion: max 2 sentences; second sentence MUST be paste-ready draft text (summary line, bullet, or keyword phrase) using only facts from the resume.
- jd_evidence: quote or paraphrase exact JD phrase from jd_extracts.
- current_snippet: verbatim substring from resume_facts only; null if none exists.
- Every suggestion MUST cite a company, title, or bullet from resume_facts, never invent employers, years, or domains.
- Include 1 ai_readiness tip only if ATS parsing is at risk (dense paragraphs, missing section headers).
- Ban filler: no "consider", "you may want", "it's important to".`,
    analyzeUserTemplate: `<extract_output>
{{extract_json}}
</extract_output>

<resume_facts>
{{resume_facts}}
</resume_facts>

<keyword_hints>
{{keyword_hints}}
</keyword_hints>`,
  },
  rateLimit: { maxRunsPerHourPerIp: 10 },
  progressSteps: RESUME_OPTIMIZER_UI_INITIAL.progressSteps,
};
