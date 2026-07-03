const {
  normalizeProfile,
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
} = require("./normalize");
const { callGeminiJson, extractText, getFinishReason } = require("./gemini");

async function runExtractStep({
  apiKey,
  config,
  profile,
  profileMeta,
  jds,
  sectionStatus,
  keywordHints,
}) {
  const prompts = config.prompts;
  const guardrails = prompts.guardrails || "";
  const systemText = fillTemplate(prompts.extractSystem, { guardrails });

  const keywordBlock = keywordHints.missing?.length
    ? `Potential missing keywords from JDs (hints only): ${keywordHints.missing.join(", ")}`
    : "";

  const userText = fillTemplate(prompts.extractUserTemplate, {
    target_role_label: profile.targetRoleLabel || "Not specified",
    section_status_json: JSON.stringify(sectionStatus),
    profile_json: JSON.stringify(profileToCompactJson(profile, profileMeta)),
    jds_json: JSON.stringify(
      jds.map(({ label, company, text }) => ({
        label,
        company: company || null,
        text,
      }))
    ),
    keyword_hints: keywordBlock,
  });

  const data = await callGeminiJson({
    apiKey,
    model: config.models.extractModel,
    systemText,
    userText,
    temperature: config.models.extractTemperature,
    maxOutputTokens: Math.max(config.models.extractMaxOutputTokens || 0, 1200),
  });

  const rawText = extractText(data);
  const parsed = parseJsonFromModel(rawText);
  const tokens = getUsageTokens(data);
  return { parsed, tokens, raw: data, rawText, finishReason: getFinishReason(data) };
}

async function runAnalyzeStep({ apiKey, config, profile, extractOutput, keywordHints, checklist }) {
  const prompts = config.prompts;
  const guardrails = prompts.guardrails || "";
  const systemText = fillTemplate(prompts.analyzeSystem, { guardrails });

  const keywordBlock = [
    keywordHints.overlap?.length
      ? `Overlapping terms in profile: ${keywordHints.overlap.join(", ")}`
      : "",
    keywordHints.missing?.length
      ? `Terms in JDs not found in profile: ${keywordHints.missing.join(", ")}`
      : "",
    checklist?.length
      ? `Checklist failures: ${checklist.filter((c) => c.status === "fail").map((c) => c.label).join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const userText = fillTemplate(prompts.analyzeUserTemplate, {
    target_role_label: profile.targetRoleLabel || "Not specified",
    extract_json: JSON.stringify(extractOutput),
    keyword_hints: keywordBlock || "None",
    profile_facts: buildProfileFacts(profile),
  });

  const data = await callGeminiJson({
    apiKey,
    model: config.models.analyzeModel,
    systemText,
    userText,
    temperature: config.models.analyzeTemperature,
    maxOutputTokens: Math.max(config.models.analyzeMaxOutputTokens || 0, 1200),
  });

  const rawText = extractText(data);
  const parsed = parseJsonFromModel(rawText);
  const tokens = getUsageTokens(data);
  return { parsed, tokens, raw: data, rawText, finishReason: getFinishReason(data) };
}

async function runPipeline({ apiKey, config, body, onProgress }) {
  const startMs = Date.now();
  const limits = config.limits;

  const profile = normalizeProfile(body.profile || {}, limits);
  const jds = normalizeJobDescriptions(
    body.jobDescriptions || [],
    limits,
    config.features?.enableJdSectionExtraction !== false
  );

  if (!jds.some((j) => j.label === "primary")) {
    throw Object.assign(new Error("Primary job description is required"), { code: "VALIDATION" });
  }

  if (!profile.targetRoleLabel?.trim()) {
    profile.targetRoleLabel = inferTargetRoleFromJd(jds);
  }

  const profileMeta = inferProfileMeta(profile, body.profileMeta || {});

  const sectionStatus = auditSections(profile);
  const keywordHints = buildKeywordMatrix(
    profile,
    jds,
    config.features?.enableKeywordMatrix !== false
  );
  const skillMatrix = buildSkillMatrix(profile, jds, 15);
  const checklist = buildChecklist(profile, profileMeta, jds);

  let extractTokens = { input: 0, output: 0, total: 0 };
  let analyzeTokens = { input: 0, output: 0, total: 0 };

  let extractResult = await runExtractStep({
    apiKey,
    config,
    profile,
    profileMeta,
    jds,
    sectionStatus,
    keywordHints,
  });

  if (!extractResult.parsed) {
    extractResult = await runExtractStep({
      apiKey,
      config: {
        ...config,
        models: { ...config.models, extractTemperature: 0 },
      },
      profile,
      profileMeta,
      jds,
      sectionStatus,
      keywordHints,
    });
  }

  if (!extractResult.parsed) {
    console.warn("[RoleAlign] extract parse failed", {
      finishReason: extractResult.finishReason,
      preview: (extractResult.rawText || "").slice(0, 300),
    });
    extractResult.parsed = buildFallbackExtract({
      profile,
      jds,
      sectionStatus,
      keywordHints,
    });
  }

  extractTokens = extractResult.tokens;
  await onProgress?.("extract");

  let analyzeResult = await runAnalyzeStep({
    apiKey,
    config,
    profile,
    extractOutput: extractResult.parsed,
    keywordHints,
    checklist,
  });

  if (!analyzeResult.parsed) {
    analyzeResult = await runAnalyzeStep({
      apiKey,
      config: {
        ...config,
        models: { ...config.models, analyzeTemperature: 0 },
      },
      profile,
      extractOutput: extractResult.parsed,
      keywordHints,
      checklist,
    });
  }

  if (!analyzeResult.parsed) {
    console.warn("[RoleAlign] analyze parse failed", {
      finishReason: analyzeResult.finishReason,
      preview: (analyzeResult.rawText || "").slice(0, 300),
    });
    analyzeResult.parsed = buildFallbackAnalyze(extractResult.parsed, keywordHints);
  }

  analyzeTokens = analyzeResult.tokens;
  await onProgress?.("analyze");

  const analyze = analyzeResult.parsed;
  const extract = extractResult.parsed;

  const section_audit = (extract.section_audit || []).length
    ? extract.section_audit
    : Object.entries(sectionStatus).map(([section, status]) => ({
        section,
        status,
        reason: `Detected from input (${status})`,
      }));

  const profileSourceText = buildProfileText(profile);
  const checklistRecs = checklistToRecommendations(checklist);
  const aiRecs = validateAndRankRecommendations(
    analyze.recommendations,
    extract,
    [
      ...(config.sectionPriority || ["headline", "about", "experience", "skills"]),
      "profile_photo",
      "banner",
      "projects",
      "experience_bullets",
    ],
    profileSourceText
  );

  const seen = new Set();
  const recommendations = [...checklistRecs, ...aiRecs]
    .filter((r) => {
      const key = `${r.section}:${r.issue}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 10);

  const alignment_score = computeAlignmentScore(checklist, skillMatrix, section_audit);
  const alignment_by_jd = computeAlignmentByJd(profile, jds, checklist, section_audit).map((jd) => ({
    ...jd,
    score: alignment_score,
  }));
  const stats = computeStats(checklist);

  let fit_band = analyze.fit_band || "moderate";
  if (alignment_score >= 75) fit_band = "strong";
  else if (alignment_score < 45) fit_band = "needs_work";

  const report = {
    fit_band,
    alignment_score,
    alignment_by_jd,
    stats,
    checklist,
    skill_matrix: skillMatrix,
    executive_summary: {
      top_gaps: analyze.executive_summary?.top_gaps?.length
        ? analyze.executive_summary.top_gaps
        : checklist.filter((c) => c.status === "fail" && c.priority === "high").map((c) => c.reason).slice(0, 3),
      quick_wins: analyze.executive_summary?.quick_wins?.length
        ? analyze.executive_summary.quick_wins
        : recommendations.filter((r) => r.impact === "high").map((r) => r.suggestion).slice(0, 3),
    },
    cross_role_themes: analyze.cross_role_themes || [],
    role_conflicts: analyze.role_conflicts || [],
    section_audit,
    recommendations,
    input_summary: buildInputSummary(profile, jds),
    profileMeta,
  };

  const meta = {
    tokens: {
      extract: extractTokens.total,
      analyze: analyzeTokens.total,
      total: extractTokens.total + analyzeTokens.total,
    },
    durationMs: Date.now() - startMs,
    configVersion: config.version || 1,
  };

  return { report, meta };
}

module.exports = { runPipeline };
