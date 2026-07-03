const RESUME_OPTIMIZER_CONFIG_DEFAULTS = {
  version: 1,
  limits: {
    resumeMaxChars: 12000,
    jdMaxChars: 6000,
    maxJds: 3,
  },
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
  progressSteps: [
    { id: "validate", label: "Validating your inputs", progress: 5, detailTemplates: ["Checking resume and job description…"] },
    { id: "normalize", label: "Structuring your resume", progress: 18, detailTemplates: ["Scanning sections and keywords…"] },
    { id: "extract", label: "Extracting role requirements", progress: 45, detailTemplates: ["Identifying must-have skills from the JD…"] },
    { id: "analyze", label: "Matching resume to role", progress: 75, detailTemplates: ["Finding gaps and drafting suggestions…"] },
    { id: "finalize", label: "Building your match report", progress: 95, detailTemplates: ["Calculating match score…"] },
  ],
  sectionPriority: ["summary", "experience_bullets", "experience", "skills", "keywords", "ai_readiness", "format"],
};

function deepMerge(base, override) {
  if (!override || typeof override !== "object") return base;
  const out = { ...base };
  for (const [k, v] of Object.entries(override)) {
    if (v && typeof v === "object" && !Array.isArray(v) && base[k] && typeof base[k] === "object") {
      out[k] = deepMerge(base[k], v);
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out;
}

module.exports = { RESUME_OPTIMIZER_CONFIG_DEFAULTS, deepMerge };
