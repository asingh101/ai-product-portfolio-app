const {
  buildExcludedTerms,
  extractKeywordFreq,
} = require("../shared/keywordFilter");
const { validateAndRankRecommendations } = require("../shared/recommendationValidate");

const BOILERPLATE_PATTERNS = [
  /equal opportunity employer[\s\S]{0,500}/gi,
  /benefits include[\s\S]{0,600}/gi,
  /apply now[\s\S]{0,200}/gi,
];

function trim(str, max) {
  if (typeof str !== "string") return "";
  const t = str.trim();
  if (!max || t.length <= max) return t;
  return t.slice(0, max) + "…";
}

function stripBoilerplate(text) {
  let out = text;
  for (const re of BOILERPLATE_PATTERNS) {
    out = out.replace(re, " ");
  }
  return out.replace(/\s+/g, " ").trim();
}

function normalizeJobDescriptions(jds, limits) {
  const maxJds = limits?.maxJds ?? 3;
  const jdMaxChars = limits?.jdMaxChars ?? 6000;
  return (jds || [])
    .slice(0, maxJds)
    .map((jd) => {
      const label = jd.label === "alternate" ? "alternate" : "primary";
      const charLimit = label === "primary" ? jdMaxChars : Math.min(jdMaxChars, 2000);
      return {
        label,
        company: jd.company ? trim(jd.company, 120) : undefined,
        text: trim(stripBoilerplate(jd.text || ""), charLimit),
      };
    })
    .filter((jd) => jd.text.length >= 50);
}

function normalizeResumeText(text, limits) {
  const max = limits?.resumeMaxChars ?? 12000;
  return trim((text || "").replace(/\r\n/g, "\n"), max);
}

function detectResumeSignals(resumeText) {
  const lower = resumeText.toLowerCase();
  const lines = resumeText.split("\n").map((l) => l.trim()).filter(Boolean);

  const summaryHeaders = /^(summary|professional summary|profile|about)\s*:?\s*$/i;
  let hasSummary = false;
  let summaryLines = 0;
  for (let i = 0; i < lines.length; i++) {
    if (summaryHeaders.test(lines[i])) {
      hasSummary = true;
      for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
        if (/^(experience|work experience|skills|education)/i.test(lines[j])) break;
        if (lines[j].length > 20) summaryLines++;
      }
      break;
    }
  }
  if (!hasSummary && lines[0]?.length > 40 && lines[0].length < 400) {
    hasSummary = true;
    summaryLines = 1;
  }

  const bullets = (resumeText.match(/^[\s]*[-•*]\s+.+/gm) || []).length;
  const quantified = (resumeText.match(/^[\s]*[-•*][^\n]*(\d+%|\$\d|\d+\+|increased|decreased|saved|grew)/gim) || []).length;

  const skillsMatch = resumeText.match(/(?:skills|technologies|tools)\s*:?\s*([^\n]+(?:\n[^\n]+)?)/i);
  const skillsDetected = skillsMatch
    ? skillsMatch[1].split(/[,|•]/).map((s) => s.trim()).filter((s) => s.length > 1).slice(0, 10)
    : [];

  let summaryStrength = "missing";
  if (hasSummary) {
    summaryStrength = summaryLines >= 2 ? "strong" : "weak";
  }

  return {
    has_summary: hasSummary,
    summary_strength: summaryStrength,
    bullet_count: bullets,
    quantified_bullet_count: quantified,
    skills_detected: skillsDetected,
  };
}

function auditResumeSections(resumeText, signals) {
  const audit = [];
  audit.push({
    section: "summary",
    status: !signals.has_summary ? "missing" : signals.summary_strength === "strong" ? "strong" : "present",
    reason: !signals.has_summary
      ? "No professional summary detected, add 3–4 lines framing your fit."
      : signals.summary_strength === "weak"
        ? "Summary is brief, expand with role keywords and proof points."
        : "Professional summary present.",
  });
  audit.push({
    section: "experience",
    status: signals.bullet_count === 0 ? "missing" : signals.bullet_count < 4 ? "weak" : "present",
    reason:
      signals.bullet_count === 0
        ? "Use bullet points under each role for scannable impact."
        : signals.quantified_bullet_count < 2
          ? "Add quantified outcomes (% , $, scale) to experience bullets."
          : "Experience uses bullet format with some metrics.",
  });
  audit.push({
    section: "skills",
    status: signals.skills_detected.length === 0 ? "weak" : signals.skills_detected.length >= 5 ? "strong" : "present",
    reason:
      signals.skills_detected.length === 0
        ? "Add a dedicated Skills section with JD keywords."
        : "Skills section or inline skills detected.",
  });
  audit.push({
    section: "format",
    status: resumeText.length > 500 ? "present" : "weak",
    reason: "Use clear section headers and bullet points for ATS parsing.",
  });
  return audit;
}

function extractKeywords(jds, maxTerms = 20) {
  const excluded = buildExcludedTerms(jds);
  const text = jds.map((j) => j.text).join(" ").toLowerCase();
  return extractKeywordFreq(text, maxTerms, excluded).map(([w]) => w);
}

function countTermInText(text, term) {
  if (!term || !text) return 0;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (text.match(new RegExp(escaped, "gi")) || []).length;
}

function buildSkillMatrix(resumeText, jds, maxSkills = 15) {
  const resumeLower = resumeText.toLowerCase();
  const excluded = buildExcludedTerms(jds);
  const allJdText = jds.map((j) => j.text).join(" ").toLowerCase();
  return extractKeywordFreq(allJdText, maxSkills, excluded).map(([skill, jdCount]) => ({
    skill,
    profile_count: countTermInText(resumeLower, skill),
    jd_count: jdCount,
  }));
}

function buildSkillMatrixRowsForJd(resumeText, jd, maxSkills = 15) {
  const resumeLower = resumeText.toLowerCase();
  const excluded = buildExcludedTerms([jd]);
  const keywordEntries = extractKeywordFreq((jd.text || "").toLowerCase(), maxSkills, excluded);
  return keywordEntries.map(([skill, jdCount]) => ({
    skill,
    profile_count: countTermInText(resumeLower, skill),
    jd_count: jdCount,
  }));
}

function buildSkillMatrixForJd(resumeText, jd, maxSkills = 15) {
  const rows = buildSkillMatrixRowsForJd(resumeText, jd, maxSkills);
  const overlap = rows.filter((r) => r.profile_count > 0).length;
  return rows.length > 0 ? Math.round((overlap / rows.length) * 100) : 50;
}

function buildKeywordHints(resumeText, jds) {
  const keywords = extractKeywords(jds);
  const resumeLower = resumeText.toLowerCase();
  const overlap = keywords.filter((k) => resumeLower.includes(k));
  const missing = keywords.filter((k) => !resumeLower.includes(k)).slice(0, 15);
  return { overlap, missing };
}

function buildChecklist(resumeText, signals, keywordHints) {
  const items = [];
  const add = (id, section, label, pass, priority, reason) => {
    items.push({ id, section, label, status: pass ? "pass" : "fail", priority, reason });
  };

  add(
    "summary",
    "basic",
    "Professional summary",
    signals.has_summary && signals.summary_strength !== "weak",
    "high",
    signals.has_summary
      ? "Summary frames your fit for recruiters scanning in seconds."
      : "Add a 3–4 sentence Professional Summary with role keywords."
  );

  add(
    "quantified_bullets",
    "experience",
    "Quantified outcomes",
    signals.quantified_bullet_count >= 2,
    "high",
    signals.quantified_bullet_count >= 2
      ? "Metrics in bullets help you stand out in a quick scan."
      : "Rewrite bullets with %, $, scale, or time saved, numbers stop the scan."
  );

  add(
    "bullet_format",
    "format",
    "Bullet-point experience",
    signals.bullet_count >= 3,
    "medium",
    signals.bullet_count >= 3
      ? "Bullet format is easier for humans and ATS to parse."
      : "Convert dense paragraphs to bullet points under each role."
  );

  add(
    "skills_section",
    "skills",
    "Skills / keywords section",
    signals.skills_detected.length >= 3,
    "high",
    signals.skills_detected.length >= 3
      ? "Skills section supports keyword matching."
      : "Add a Skills section mirroring must-have JD terms."
  );

  const missingCount = keywordHints.missing?.length ?? 0;
  add(
    "keyword_match",
    "skills",
    "JD keyword coverage",
    missingCount <= 5,
    "high",
    missingCount <= 5
      ? "Strong overlap with job description keywords."
      : `${missingCount} JD keywords not found in resume, weave them into summary and bullets.`
  );

  add(
    "ats_format",
    "format",
    "ATS-friendly structure",
    resumeText.includes("\n") && !resumeText.includes("\t"),
    "medium",
    "Use standard headers, avoid tables/columns, and keep section labels clear for parsers."
  );

  add(
    "ai_readiness",
    "format",
    "Scannable layout",
    signals.bullet_count >= 2 && resumeText.length < 8000,
    "low",
    "Recruiters scan in under 10 seconds, lead with outcomes, not prose."
  );

  return items;
}

function sectionStatusToScore(sectionAudit) {
  const weights = { strong: 100, present: 75, weak: 40, missing: 0 };
  const items = sectionAudit || [];
  if (!items.length) return 50;
  return Math.round(items.reduce((sum, item) => sum + (weights[item.status] ?? 50), 0) / items.length);
}

function checklistToScore(checklist) {
  const priorityWeight = { high: 3, medium: 2, low: 1 };
  let earned = 0;
  let max = 0;
  for (const item of checklist || []) {
    const w = priorityWeight[item.priority] ?? 1;
    max += w;
    if (item.status === "pass") earned += w;
  }
  return max > 0 ? Math.round((earned / max) * 100) : 50;
}

function keywordOverlapScore(skillMatrix) {
  if (!skillMatrix?.length) return 50;
  const withProfile = skillMatrix.filter((r) => r.profile_count > 0).length;
  return Math.round((withProfile / skillMatrix.length) * 100);
}

function computeAlignmentScore(checklist, skillMatrix, sectionAudit) {
  const keywordScore = keywordOverlapScore(skillMatrix);
  const checklistScore = checklistToScore(checklist);
  const sectionScore = sectionStatusToScore(sectionAudit);
  return Math.round(0.45 * keywordScore + 0.35 * checklistScore + 0.2 * sectionScore);
}

function computeAlignmentByJd(resumeText, jds, checklist, sectionAudit) {
  const checklistScore = checklistToScore(checklist);
  const sectionScore = sectionStatusToScore(sectionAudit);
  return jds.map((jd) => {
    const rows = buildSkillMatrixRowsForJd(resumeText, jd, 15);
    const keywordScore = keywordOverlapScore(rows);
    const score = Math.round(0.45 * keywordScore + 0.35 * checklistScore + 0.2 * sectionScore);
    return {
      label: jd.label,
      company: jd.company,
      score,
    };
  });
}

function buildResumeFacts(resumeText, signals) {
  const bullets = (resumeText.match(/^[\s]*[-•*]\s+(.+)$/gm) || [])
    .map((m) => m.replace(/^[\s]*[-•*]\s+/, "").trim())
    .filter((b) => b.length > 10)
    .slice(0, 8);
  const roleLines = resumeText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 5 && l.length < 140)
    .filter((l) => /\d{4}|present|manager|engineer|director|lead|analyst|specialist/i.test(l))
    .slice(0, 6);
  return JSON.stringify({
    skills_detected: signals.skills_detected?.slice(0, 10) || [],
    recent_bullets: bullets,
    role_lines: roleLines,
    quantified_bullet_count: signals.quantified_bullet_count ?? 0,
  });
}

function computeStats(checklist) {
  return {
    needs_improvement: (checklist || []).filter((c) => c.status === "fail").length,
    well_done: (checklist || []).filter((c) => c.status === "pass").length,
  };
}

function buildInputSummary(resumeText, jds) {
  const words = resumeText.split(/\s+/).filter(Boolean).length;
  const primary = jds.find((j) => j.label === "primary");
  return `${words} words · ${jds.length} JD(s) · ${primary?.company || "Target role"}`;
}

function fillTemplate(template, vars) {
  return Object.entries(vars).reduce(
    (acc, [key, val]) => acc.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val),
    template
  );
}

function parseJsonFromModel(text) {
  if (!text) return null;
  let trimmed = text
    .trim()
    .replace(/^\uFEFF/, "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    if (start < 0) return null;
    let json = trimmed.slice(start);
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        return JSON.parse(json);
      } catch {
        if (json.endsWith(",")) json = json.slice(0, -1);
        const open = (json.match(/\{/g) || []).length;
        const close = (json.match(/\}/g) || []).length;
        const openB = (json.match(/\[/g) || []).length;
        const closeB = (json.match(/\]/g) || []).length;
        json += "]".repeat(Math.max(0, openB - closeB));
        json += "}".repeat(Math.max(0, open - close));
      }
    }
    return null;
  }
}

function buildFallbackExtract({ resumeText, jds, sectionAudit, keywordHints, signals }) {
  const missing = keywordHints?.missing || [];
  return {
    resume_signals: signals,
    jd_extracts: jds.map((jd) => ({
      label: jd.label,
      title_signals: [],
      must_have: missing.slice(0, 8),
      nice_to_have: (keywordHints?.overlap || []).slice(0, 5),
    })),
    section_audit: sectionAudit,
  };
}

function buildFallbackAnalyze(extract, keywordHints) {
  const recommendations = [];
  for (const item of extract.section_audit || []) {
    if (item.status === "missing" || item.status === "weak") {
      recommendations.push({
        id: `rec-${recommendations.length + 1}`,
        section: item.section,
        action: item.status === "missing" ? "add" : "rewrite",
        impact: "high",
        effort: "medium",
        issue: `${item.section} needs improvement`,
        suggestion: item.reason,
        jd_evidence: (keywordHints?.missing || []).slice(0, 3),
        current_snippet: null,
      });
    }
  }
  for (const term of (keywordHints?.missing || []).slice(0, 4)) {
    recommendations.push({
      id: `rec-${recommendations.length + 1}`,
      section: "keywords",
      action: "emphasize",
      impact: "medium",
      effort: "low",
      issue: `JD mentions "${term}" but it is not prominent in your resume`,
      suggestion: `Add "${term}" to your summary, skills, or a relevant experience bullet.`,
      jd_evidence: [term],
      current_snippet: null,
    });
  }
  return {
    fit_band: "moderate",
    executive_summary: {
      top_gaps: (keywordHints?.missing || []).slice(0, 3),
      quick_wins: recommendations.slice(0, 3).map((r) => r.suggestion),
    },
    cross_role_themes: keywordHints?.overlap || [],
    role_conflicts: [],
    recommendations: recommendations.slice(0, 10),
  };
}

function checklistToRecommendations(checklist) {
  return (checklist || [])
    .filter((c) => c.status === "fail" && (c.priority === "high" || c.priority === "medium"))
    .map((c) => ({
      id: `chk-${c.id}`,
      section: c.section === "basic" ? "summary" : c.section,
      action: "add",
      impact: c.priority === "high" ? "high" : "medium",
      effort: "medium",
      issue: c.label,
      suggestion: c.reason,
      jd_evidence: [],
      current_snippet: null,
    }))
    .slice(0, 6);
}

function getUsageTokens(apiResponse) {
  const meta = apiResponse?.usageMetadata;
  return {
    input: meta?.promptTokenCount ?? 0,
    output: meta?.candidatesTokenCount ?? 0,
    total: meta?.totalTokenCount ?? 0,
  };
}

module.exports = {
  normalizeResumeText,
  normalizeJobDescriptions,
  detectResumeSignals,
  auditResumeSections,
  buildSkillMatrix,
  buildKeywordHints,
  buildChecklist,
  computeAlignmentScore,
  computeAlignmentByJd,
  computeStats,
  buildInputSummary,
  fillTemplate,
  parseJsonFromModel,
  buildFallbackExtract,
  buildFallbackAnalyze,
  checklistToRecommendations,
  validateAndRankRecommendations,
  buildResumeFacts,
  getUsageTokens,
};
