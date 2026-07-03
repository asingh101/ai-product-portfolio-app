/** Default config, merged with Firestore role_align_config/active */

const DEFAULT_LIMITS = {
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

const ROLE_ALIGN_CONFIG_DEFAULTS = {
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
  progressSteps: [
    { id: "validate", label: "Validating your inputs", progress: 5, detailTemplates: ["Checking profile and job description fields…"] },
    { id: "fetch_profile", label: "Reading your LinkedIn profile", progress: 12, detailTemplates: ["Loading profile sections from your URL…"] },
    { id: "normalize", label: "Structuring your profile", progress: 22, detailTemplates: ["Auditing sections and compressing job descriptions…"] },
    { id: "extract", label: "Extracting role requirements", progress: 48, detailTemplates: ["Identifying must-have skills across your target roles…"] },
    { id: "analyze", label: "Cross-referencing gaps", progress: 78, detailTemplates: ["Comparing your profile signals to role requirements…"] },
    { id: "finalize", label: "Building your scan report", progress: 95, detailTemplates: ["Calculating alignment score and action plan…"] },
  ],
};

function deepMerge(target, source) {
  if (!source || typeof source !== "object") return target;
  const out = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      out[key] = deepMerge(target[key], source[key]);
    } else if (source[key] !== undefined) {
      out[key] = source[key];
    }
  }
  return out;
}

module.exports = { ROLE_ALIGN_CONFIG_DEFAULTS, DEFAULT_LIMITS, deepMerge };
