const { DEFAULT_LIMITS } = require("./defaults");
const {
  buildExcludedTerms,
  extractKeywordFreq,
} = require("../shared/keywordFilter");
const { validateAndRankRecommendations } = require("../shared/recommendationValidate");

const BOILERPLATE_PATTERNS = [
  /equal opportunity employer[\s\S]{0,500}/gi,
  /we are an equal opportunity[\s\S]{0,400}/gi,
  /benefits include[\s\S]{0,600}/gi,
  /apply now[\s\S]{0,200}/gi,
  /affirmative action[\s\S]{0,300}/gi,
];

const JD_SECTION_HEADERS =
  /(?:^|\n)\s*(?:requirements|qualifications|what you['']ll do|what we're looking for|responsibilities|must have|nice to have)\s*:?\s*/gi;

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

function extractJdRelevantSections(text, enabled) {
  if (!enabled || !text) return text;
  const parts = [];
  let lastIndex = 0;
  let match;
  const headerRe = new RegExp(JD_SECTION_HEADERS.source, "gi");
  while ((match = headerRe.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    lastIndex = match.index;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  const joined = parts.join("\n").trim();
  return joined.length > 200 ? joined : text;
}

function classifySection(value, rules) {
  if (rules.type === "text") {
    const len = (value || "").trim().length;
    if (len === 0) return "missing";
    if (len < (rules.weakBelow ?? 50)) return "weak";
    if (len >= (rules.strongAbove ?? 500)) return "strong";
    return "present";
  }
  if (rules.type === "array") {
    const arr = Array.isArray(value) ? value : [];
    if (arr.length === 0) return "missing";
    if (arr.length < (rules.weakBelow ?? 3)) return "weak";
    return "present";
  }
  if (rules.type === "experience") {
    const roles = Array.isArray(value) ? value : [];
    if (roles.length === 0) return "missing";
    const totalBullets = roles.reduce(
      (n, r) => n + (r.bullets || []).filter((b) => b?.trim()).length,
      0
    );
    if (totalBullets === 0) return "weak";
    return "present";
  }
  return "present";
}

function auditSections(profile) {
  return {
    headline: classifySection(profile.headline, { type: "text", weakBelow: 10 }),
    about: classifySection(profile.about, { type: "text", weakBelow: 100 }),
    experience: classifySection(profile.experience, { type: "experience" }),
    skills: classifySection(profile.skills, { type: "array", weakBelow: 5 }),
  };
}

function normalizeProfileMeta(meta = {}) {
  return {
    hasProfilePhoto: Boolean(meta.hasProfilePhoto),
    hasBannerPhoto: Boolean(meta.hasBannerPhoto),
    hasProjects: Boolean(meta.hasProjects),
    hasExperienceBullets: Boolean(meta.hasExperienceBullets),
    displayName: meta.displayName ? trim(meta.displayName, 120) : undefined,
    location: meta.location ? trim(meta.location, 120) : undefined,
    fetchSource: meta.fetchSource === "proxycurl" || meta.fetchSource === "hybrid" ? meta.fetchSource : "manual",
  };
}

function inferProfileMeta(profile, profileMeta = {}) {
  const experience = profile.experience || [];
  const hasExperienceBullets = experience.some((r) =>
    (r.bullets || []).some((b) => b?.trim())
  );
  const hasProjects = (profile.projects || []).length > 0 || profileMeta.hasProjects;

  return normalizeProfileMeta({
    ...profileMeta,
    hasExperienceBullets: profileMeta.hasExperienceBullets ?? hasExperienceBullets,
    hasProjects,
  });
}

function normalizeProfile(profile, limits = DEFAULT_LIMITS) {
  const experience = (profile.experience || [])
    .slice(0, limits.maxRoles)
    .map((r) => ({
      title: trim(r.title, 120),
      company: trim(r.company, 120),
      bullets: (r.bullets || [])
        .map((b) => trim(b, limits.bulletMax))
        .filter(Boolean)
        .slice(0, limits.maxBulletsPerRole),
    }))
    .filter((r) => r.title || r.company);

  let about = trim(profile.about, limits.aboutMax);
  const notes = trim(profile.additionalNotes || "", 1000);
  if (notes && about) about = `${about}\n\n${notes}`;
  else if (notes) about = notes;

  return {
    linkedInUrl: trim(profile.linkedInUrl, 200),
    targetRoleLabel: trim(profile.targetRoleLabel, limits.targetRoleLabelMax),
    headline: trim(profile.headline, limits.headlineMax),
    about,
    experience,
    skills: (profile.skills || []).map((s) => trim(s, 80)).filter(Boolean).slice(0, limits.maxSkills),
    projects: (profile.projects || [])
      .map((p) => ({
        title: trim(p.title, 120),
        url: p.url ? trim(p.url, 300) : undefined,
      }))
      .filter((p) => p.title)
      .slice(0, 10),
  };
}

function normalizeJobDescriptions(jds, limits, enableSectionExtraction) {
  return (jds || []).slice(0, limits.maxJds).map((jd) => {
    let text = jd.text || "";
    text = stripBoilerplate(text);
    if (enableSectionExtraction) {
      text = extractJdRelevantSections(text, true);
    }
    const charLimit =
      jd.label === "primary" ? limits.jdMaxChars : Math.min(limits.jdMaxChars, 2000);
    text = trim(text, charLimit);
    return {
      label: jd.label === "primary" ? "primary" : "alternate",
      company: jd.company ? trim(jd.company, 80) : undefined,
      text,
      _meta: { charsUsed: text.length },
    };
  });
}

function profileToCompactJson(profile, profileMeta) {
  const out = {
    headline: profile.headline,
    experience: (profile.experience || []).slice(0, 2).map((r) => ({
      title: r.title,
      company: r.company,
      bullets: (r.bullets || []).slice(0, 4),
    })),
    skills: profile.skills,
  };
  if (profile.about?.trim()) out.about = trim(profile.about, 1200);
  if (profile.projects?.length) out.projects = profile.projects;
  if (profileMeta) {
    out.visual = {
      has_profile_photo: profileMeta.hasProfilePhoto,
      has_banner_photo: profileMeta.hasBannerPhoto,
      has_projects_section: profileMeta.hasProjects,
      has_experience_bullets: profileMeta.hasExperienceBullets,
    };
  }
  return out;
}

function buildProfileText(profile) {
  const parts = [
    profile.headline,
    profile.about,
    ...(profile.experience || []).flatMap((r) => [
      r.title,
      r.company,
      ...(r.bullets || []),
    ]),
    ...(profile.skills || []),
    ...(profile.projects || []).map((p) => `${p.title} ${p.url || ""}`),
  ];
  return parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function extractKeywords(jds, maxTerms = 20) {
  const excluded = buildExcludedTerms(jds);
  const text = jds.map((j) => j.text).join(" ").toLowerCase();
  return extractKeywordFreq(text, maxTerms, excluded).map(([w]) => w);
}

function countTermInText(text, term) {
  if (!term || !text) return 0;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(escaped, "gi");
  return (text.match(re) || []).length;
}

function buildSkillMatrix(profile, jds, maxSkills = 15) {
  const profileText = buildProfileText(profile);
  const excluded = buildExcludedTerms(jds);
  const allJdText = jds.map((j) => j.text).join(" ").toLowerCase();
  const keywordEntries = extractKeywordFreq(allJdText, maxSkills, excluded);

  return keywordEntries.map(([skill, jdCount]) => ({
    skill,
    profile_count: countTermInText(profileText, skill),
    jd_count: jdCount,
  }));
}

function buildSkillMatrixRowsForJd(profile, jd, maxSkills = 15) {
  const profileText = buildProfileText(profile);
  const excluded = buildExcludedTerms([jd]);
  const jdText = (jd.text || "").toLowerCase();
  const keywordEntries = extractKeywordFreq(jdText, maxSkills, excluded);
  return keywordEntries.map(([skill, jdCount]) => ({
    skill,
    profile_count: countTermInText(profileText, skill),
    jd_count: jdCount,
  }));
}

function buildSkillMatrixForJd(profile, jd, maxSkills = 15) {
  const rows = buildSkillMatrixRowsForJd(profile, jd, maxSkills);
  const overlap = rows.filter((r) => r.profile_count > 0).length;
  return rows.length > 0 ? Math.round((overlap / rows.length) * 100) : 50;
}

function jdSuggestsTechnicalOrPm(jds) {
  const text = jds.map((j) => j.text).join(" ").toLowerCase();
  return /product manager|engineer|developer|software|technical|prototype|github|ai|ml|data/.test(
    text
  );
}

function buildChecklist(profile, profileMeta, jds) {
  const items = [];
  const add = (id, section, label, pass, priority, reason) => {
    items.push({ id, section, label, status: pass ? "pass" : "fail", priority, reason });
  };

  add(
    "profile_photo",
    "visual",
    "Profile photo",
    profileMeta.hasProfilePhoto,
    "high",
    profileMeta.hasProfilePhoto
      ? "A profile photo increases views and recruiter outreach."
      : "Add a professional profile photo, profiles with photos get significantly more views."
  );

  add(
    "banner_photo",
    "visual",
    "Background banner",
    profileMeta.hasBannerPhoto,
    "high",
    profileMeta.hasBannerPhoto
      ? "Your banner adds visual polish to your profile."
      : "Add a cover banner that reflects your brand or target role."
  );

  add(
    "headline",
    "basic",
    "Headline",
    Boolean(profile.headline?.trim()),
    "high",
    profile.headline?.trim()
      ? "Your headline is visible in search results, keep it role-targeted."
      : "Add a keyword-rich headline aligned to your target role."
  );

  const aboutLen = (profile.about || "").trim().length;
  add(
    "about",
    "basic",
    "About section",
    aboutLen >= 100,
    "high",
    aboutLen >= 100
      ? "Your About section tells your story beyond the headline."
      : "Expand your About section with outcomes, domain expertise, and role fit."
  );

  const roles = profile.experience || [];
  const rolesWithBullets = roles.filter((r) =>
    (r.bullets || []).some((b) => b?.trim())
  );
  add(
    "experience_bullets",
    "experience",
    "Experience bullet points",
    roles.length > 0 && rolesWithBullets.length === roles.length,
    "high",
    rolesWithBullets.length === roles.length
      ? "Your roles include quantified bullet points."
      : "Add 2–4 outcome-focused bullets per role with metrics and keywords from the JD."
  );

  if (jdSuggestsTechnicalOrPm(jds)) {
    add(
      "projects",
      "projects",
      "Projects / Featured section",
      profileMeta.hasProjects || (profile.projects || []).length > 0,
      "high",
      profileMeta.hasProjects || (profile.projects || []).length > 0
        ? "Projects showcase hands-on proof of your skills."
        : "Add a Projects or Featured section with links to GitHub, demos, or case studies."
    );
  }

  add(
    "skills",
    "skills",
    "Skills listed",
    (profile.skills || []).length >= 5,
    "medium",
    (profile.skills || []).length >= 5
      ? "Your skills section supports keyword matching."
      : "Add at least 5 relevant skills from your target job descriptions."
  );

  if (profileMeta.displayName) {
    add(
      "display_name",
      "basic",
      "Full name",
      true,
      "low",
      "Your name is set on your profile."
    );
  }

  if (profileMeta.location) {
    add(
      "location",
      "basic",
      "Location",
      true,
      "medium",
      "Location helps recruiters filter and discover your profile."
    );
  }

  return items;
}

function sectionStatusToScore(sectionAudit) {
  const weights = { strong: 100, present: 75, weak: 40, missing: 0 };
  const items = sectionAudit || [];
  if (!items.length) return 50;
  const total = items.reduce((sum, item) => sum + (weights[item.status] ?? 50), 0);
  return Math.round(total / items.length);
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

function computeAlignmentByJd(profile, jds, checklist, sectionAudit) {
  const checklistScore = checklistToScore(checklist);
  const sectionScore = sectionStatusToScore(sectionAudit);
  return jds.map((jd) => {
    const rows = buildSkillMatrixRowsForJd(profile, jd, 15);
    const keywordScore = keywordOverlapScore(rows);
    const score = Math.round(0.45 * keywordScore + 0.35 * checklistScore + 0.2 * sectionScore);
    return {
      label: jd.label,
      company: jd.company,
      score,
    };
  });
}

function buildProfileFacts(profile) {
  const experience = (profile.experience || []).slice(0, 4).map((r) => ({
    title: r.title,
    company: r.company,
    bullets: (r.bullets || []).slice(0, 3),
  }));
  return JSON.stringify({
    headline: profile.headline || null,
    skills: (profile.skills || []).slice(0, 12),
    experience,
    about_excerpt: profile.about ? trim(profile.about, 400) : null,
  });
}

function computeStats(checklist) {
  const needs_improvement = (checklist || []).filter((c) => c.status === "fail").length;
  const well_done = (checklist || []).filter((c) => c.status === "pass").length;
  return { needs_improvement, well_done };
}

function inferTargetRoleFromJd(jds) {
  const primary = jds.find((j) => j.label === "primary") || jds[0];
  if (!primary?.text) return "";
  const firstLine = primary.text.split("\n").find((l) => l.trim().length > 5);
  if (!firstLine) return "";
  return trim(firstLine.replace(/^#+\s*/, ""), 120);
}

function buildKeywordMatrix(profile, jds, enabled) {
  if (!enabled) return { overlap: [], missing: [] };
  const keywords = extractKeywords(jds);
  const profileText = buildProfileText(profile);
  const overlap = keywords.filter((k) => profileText.includes(k));
  const missing = keywords.filter((k) => !profileText.includes(k)).slice(0, 15);
  return { overlap, missing };
}

function buildInputSummary(profile, jds) {
  const sectionBits = [
    profile.headline?.trim() ? "Headline ✓" : "Headline ✗",
    profile.about?.trim() ? "About ✓" : "About ✗",
    `${profile.experience?.length || 0} role(s)`,
    profile.skills?.length ? `${profile.skills.length} skills` : "Skills ✗",
    `${jds.length} JD(s)`,
  ];
  return sectionBits.join(" · ");
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
        issue: `${item.section} section is ${item.status}`,
        suggestion:
          item.status === "missing"
            ? `Add a ${item.section} section highlighting role-relevant skills and outcomes.`
            : `Strengthen your ${item.section} with metrics and keywords from the target job descriptions.`,
        jd_evidence: (keywordHints?.missing || []).slice(0, 3),
        current_snippet: null,
      });
    }
  }
  for (const term of (keywordHints?.missing || []).slice(0, 4)) {
    recommendations.push({
      id: `rec-${recommendations.length + 1}`,
      section: "skills",
      action: "emphasize",
      impact: "medium",
      effort: "low",
      issue: `Target roles mention "${term}" but it is not prominent in your profile`,
      suggestion: `Add or emphasize "${term}" in skills, experience bullets, or about section.`,
      jd_evidence: [term],
      current_snippet: null,
    });
  }

  const topGaps = extract.profile_signals?.gaps_in_profile?.length
    ? extract.profile_signals.gaps_in_profile.slice(0, 3)
    : (keywordHints?.missing || []).slice(0, 3);

  return {
    fit_band: "moderate",
    executive_summary: {
      top_gaps: topGaps,
      quick_wins: recommendations.slice(0, 3).map((r) => r.suggestion),
    },
    cross_role_themes: keywordHints?.overlap || [],
    role_conflicts: [],
    recommendations: recommendations.slice(0, 10),
  };
}

function buildFallbackExtract({ profile, jds, sectionStatus, keywordHints }) {
  const missing = keywordHints?.missing || [];
  return {
    profile_signals: {
      seniority_inferred: profile.targetRoleLabel || "not specified",
      domains: [],
      proof_points: (profile.experience || [])
        .filter((r) => r.title || r.company)
        .map((r) => `${r.title || "Role"} at ${r.company || "Company"}`)
        .slice(0, 4),
      gaps_in_profile: missing.slice(0, 8),
    },
    jd_extracts: jds.map((jd) => ({
      label: jd.label,
      title_signals: profile.targetRoleLabel ? [profile.targetRoleLabel] : [],
      must_have: missing.slice(0, 10),
      nice_to_have: (keywordHints?.overlap || []).slice(0, 5),
      seniority: "unknown",
      domain: "unknown",
    })),
    section_audit: Object.entries(sectionStatus).map(([section, status]) => ({
      section,
      status,
      reason: `Detected from input (${status})`,
    })),
  };
}

function checklistToRecommendations(checklist) {
  const sectionMap = {
    profile_photo: "profile_photo",
    banner_photo: "banner",
    experience_bullets: "experience_bullets",
    projects: "projects",
  };
  return (checklist || [])
    .filter((c) => c.status === "fail" && (c.priority === "high" || c.priority === "medium"))
    .map((c, i) => ({
      id: `chk-${c.id}`,
      section: sectionMap[c.id] || c.section,
      action: "add",
      impact: c.priority === "high" ? "high" : "medium",
      effort: c.id === "profile_photo" || c.id === "banner_photo" ? "low" : "medium",
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
  normalizeProfile,
  normalizeProfileMeta,
  inferProfileMeta,
  normalizeJobDescriptions,
  auditSections,
  profileToCompactJson,
  buildKeywordMatrix,
  buildSkillMatrix,
  buildChecklist,
  computeAlignmentScore,
  computeAlignmentByJd,
  computeStats,
  inferTargetRoleFromJd,
  buildInputSummary,
  fillTemplate,
  parseJsonFromModel,
  buildFallbackExtract,
  buildFallbackAnalyze,
  checklistToRecommendations,
  validateAndRankRecommendations,
  buildProfileFacts,
  buildProfileText,
  getUsageTokens,
};
