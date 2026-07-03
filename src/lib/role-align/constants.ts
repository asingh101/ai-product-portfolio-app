import type { RoleAlignConfig, RoleAlignLimits, RoleAlignUI } from "./types";

export const DEFAULT_LINKEDIN_LOADING_TIPS = [
  "Recruiters scan LinkedIn in seconds, your headline is your hook.",
  "Mirror the job description keywords in headline, about, and experience.",
  "Quantified bullets in experience stop the scroll.",
  "A professional photo and banner increase profile views significantly.",
  "Featured section with projects or posts signals depth beyond the resume.",
  "Skills section helps LinkedIn search and recruiter filters find you.",
];

export const DEFAULT_LIMITS: RoleAlignLimits = {
  headlineMax: 220,
  aboutMax: 2600,
  maxRoles: 3,
  maxBulletsPerRole: 5,
  bulletMax: 500,
  maxSkills: 30,
  jdMaxChars: 6000,
  maxJds: 3,
  targetRoleLabelMax: 120,
};

export const ROLE_ALIGN_UI_INITIAL: RoleAlignUI = {
  enabled: true,
  heroPill: "AI Prototype",
  heroTitle: "LinkedIn",
  heroTitleAccent: "Optimizer",
  heroDescription:
    "Paste your LinkedIn URL, add target job descriptions, and get a visual alignment scan with prioritized recommendations to land more interviews.",
  howItWorksSteps: [
    {
      title: "Link your profile",
      description: "Enter your LinkedIn URL, we fetch your profile and let you add any overrides.",
    },
    {
      title: "Add target jobs",
      description: "Paste up to three job descriptions with company names for multi-role matching.",
    },
    {
      title: "Get your scan report",
      description: "Alignment score, skill gaps, and high-impact actions tailored to your target roles.",
    },
  ],
  wizardStepLabels: ["Your profile", "Target jobs"],
  formLabels: {
    linkedInUrl: "LinkedIn profile URL",
    targetRoleLabel: "Target role label",
    headline: "Headline",
    about: "About",
    additionalNotes: "Anything else to include",
    experience: "Experience",
    roleTitle: "Job title",
    company: "Company",
    bullets: "Bullet points",
    skills: "Skills",
    primaryJd: "Job 1: primary target",
    alternateJd: "Job",
    companyOptional: "Company (optional)",
    companyRequired: "Company",
  },
  formHints: {
    linkedInUrl: "We'll load your public profile sections automatically.",
    targetRoleLabel: "e.g. Senior Product Manager, B2B SaaS",
    headline: "Override your fetched headline if needed.",
    about: "Override or supplement your About section.",
    additionalNotes: "Certifications, projects, or context not on your profile.",
    skills: "Comma-separated or one per line",
    primaryJd: "Paste the full job posting you're targeting most.",
    alternateJd: "Optional, similar roles for cross-theme analysis.",
  },
  formPlaceholders: {
    linkedInUrl: "https://linkedin.com/in/your-profile",
    targetRoleLabel: "Senior PM, B2B SaaS",
    headline: "Your current LinkedIn headline",
    about: "Your About section text",
    additionalNotes: "e.g. side projects, certifications, portfolio links…",
    roleTitle: "Software Development Engineer II",
    company: "Amazon",
    bullet: "Built and scaled…",
    skills: "SQL, Product Discovery, Roadmap Prioritization",
    jd: "Paste job description text here…",
  },
  validationMessages: {
    linkedInUrl: "Enter a valid LinkedIn profile URL (linkedin.com/in/…).",
    headline: "Headline is required.",
    profileContent: "We couldn't load your profile. Add a headline or About text to continue.",
    experience: "Add at least one role with a title and company.",
    primaryJd: "Primary job description is required (min 100 characters).",
    primaryCompany: "Company name is required for the primary job.",
    targetRoleLabel: "Target role label helps tailor recommendations.",
  },
  loadingTips: DEFAULT_LINKEDIN_LOADING_TIPS,
  progressTitle: "Analyzing your profile",
  printReportLabel: "Print report",
  printReportHint: "Use Save as PDF in the print dialog.",
  progressSteps: [
    {
      id: "validate",
      label: "Validating your inputs",
      progress: 5,
      detailTemplates: ["Checking profile and job description fields…"],
    },
    {
      id: "fetch_profile",
      label: "Reading your LinkedIn profile",
      progress: 12,
      detailTemplates: ["Loading profile sections from your URL…"],
    },
    {
      id: "normalize",
      label: "Structuring your profile",
      progress: 22,
      detailTemplates: [
        "Auditing sections and compressing job descriptions…",
        "Preparing headline, experience, and skills for analysis…",
      ],
    },
    {
      id: "extract",
      label: "Extracting role requirements",
      progress: 48,
      detailTemplates: [
        "Identifying must-have skills across your target roles…",
        "Analyzing primary role requirements…",
      ],
    },
    {
      id: "analyze",
      label: "Cross-referencing gaps",
      progress: 78,
      detailTemplates: [
        "Comparing your profile signals to role requirements…",
        "Ranking recommendations by impact…",
      ],
    },
    {
      id: "finalize",
      label: "Building your scan report",
      progress: 95,
      detailTemplates: ["Calculating alignment score and action plan…"],
    },
  ],
  reportSectionTitles: {
    summary: "Executive summary",
    fit: "Role fit",
    basics: "Profile basics",
    experience: "Work experience",
    skills: "Key skills",
    themes: "Cross-role themes",
    conflicts: "Role positioning conflicts",
    audit: "Section audit",
    recommendations: "Prioritized action plan",
    quickWins: "Quick wins",
  },
  reportEmptyStates: {
    conflicts: "No major conflicts detected across your target roles.",
    themes: "Add alternate job descriptions to surface cross-role themes.",
  },
  impactLabels: { high: "High impact", medium: "Medium impact", low: "Low impact" },
  actionLabels: {
    add: "Add",
    rewrite: "Rewrite",
    emphasize: "Emphasize",
    keep: "Keep",
  },
  fitBandLabels: {
    strong: "Strong alignment",
    moderate: "Moderate alignment",
    needs_work: "Needs work",
  },
  disclaimer: "",
  privacyNote: "Your profile and job descriptions are processed in this session only, we do not store them.",
  sessionOnlyNote: "Session-only analysis · No account required",
  caseStudyTitle: "Why I built LinkedIn Optimizer",
  caseStudyBody:
    "Job seekers optimize one static LinkedIn profile against many similar roles. LinkedIn Optimizer fetches your profile via Proxycurl, cross-references it with target job descriptions, and returns a visual alignment scan with token-efficient, prioritized recommendations, built as a 2-step Gemini pipeline with CMS-editable prompts.",
  showCaseStudy: true,
  limits: DEFAULT_LIMITS,
  runButtonLabel: "Analyze",
  backButtonLabel: "Back",
  nextButtonLabel: "Continue",
  analyzeEstimateNote: "Usually takes 45–75 seconds",
};

export const ROLE_ALIGN_CONFIG_DEFAULTS: RoleAlignConfig = {
  version: 2,
  limits: DEFAULT_LIMITS,
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
    extractSystem: `You extract structured signals from a LinkedIn profile and job descriptions for role-alignment analysis.
{{guardrails}}
Return compact JSON only:
{"profile_signals":{"seniority_inferred":"string","domains":["max 3"],"proof_points":["max 4"],"gaps_in_profile":["max 6"]},"jd_extracts":[{"label":"primary|alternate","title_signals":["max 3"],"must_have":["max 8"],"nice_to_have":["max 4"],"seniority":"string","domain":"string"}],"section_audit":[{"section":"headline|about|experience|skills|profile_photo|banner|projects|experience_bullets","status":"missing|weak|present|strong","reason":"max 12 words"}]}
Primary JD is most important. Use user_profile.visual for photo/banner/projects/bullets. Each gap_in_profile must name a specific JD must_have missing from the profile.`,
    extractUserTemplate: `Target role label: {{target_role_label}}

<section_status>
{{section_status_json}}
</section_status>

<user_profile>
{{profile_json}}
</user_profile>

<job_descriptions>
{{jds_json}}
</job_descriptions>

{{keyword_hints}}`,
    analyzeSystem: `You prioritize LinkedIn profile improvements aligned to target job descriptions.
{{guardrails}}
Checklist failures (photo, banner, projects flag) and missing keywords are handled elsewhere, do NOT repeat them unless you provide paste-ready rewrite text.

Return JSON only:
{"fit_band":"strong|moderate|needs_work","executive_summary":{"top_gaps":["string"],"quick_wins":["string"]},"cross_role_themes":["string"],"role_conflicts":["string"],"recommendations":[{"id":"rec-N","section":"headline|about|experience|skills|profile_photo|banner|projects|experience_bullets","action":"add|rewrite|emphasize|keep","impact":"high|medium|low","effort":"high|medium|low","issue":"string","suggestion":"string","jd_evidence":["string"],"current_snippet":"string|null"}]}

Rules:
- top_gaps: exactly 4. One sentence: [section] lacks [specific JD term/skill from jd_extracts].
- quick_wins: exactly 3. Each = one concrete edit doable in under 15 minutes.
- recommendations: max 8, high/medium impact only, sorted by impact.
- issue: max 20 words, name section + specific gap vs JD.
- suggestion: max 2 sentences; second sentence MUST be paste-ready draft text (headline, about phrase, or bullet) using only facts from the profile.
- jd_evidence: quote or paraphrase exact JD phrase from jd_extracts.
- current_snippet: verbatim substring from profile_facts only; null if none exists.
- Every suggestion MUST cite a company, title, or bullet from profile_facts, never invent employers, years, or domains.
- Ban filler: no "consider", "you may want", "it's important to".`,
    analyzeUserTemplate: `Target role label: {{target_role_label}}

<extract_output>
{{extract_json}}
</extract_output>

<profile_facts>
{{profile_facts}}
</profile_facts>

<keyword_hints>
{{keyword_hints}}
</keyword_hints>`,
  },
  sectionPriority: [
    "profile_photo",
    "banner",
    "headline",
    "about",
    "experience_bullets",
    "experience",
    "projects",
    "skills",
  ],
  rateLimit: { maxRunsPerHourPerIp: 10, maxFetchesPerHourPerIp: 15 },
  features: {
    enableKeywordMatrix: true,
    enableJdSectionExtraction: true,
    enableProxycurlFetch: true,
  },
};
