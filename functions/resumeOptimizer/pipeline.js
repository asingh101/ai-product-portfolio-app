const {
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
} = require("./normalize");
const { callGeminiJson, extractText, getFinishReason } = require("../roleAlign/gemini");

async function runExtractStep({ apiKey, config, resumeText, jds, sectionAudit, keywordHints, signals }) {
  const prompts = config.prompts;
  const guardrails = prompts.guardrails || "";
  const systemText = fillTemplate(prompts.extractSystem, { guardrails });

  const keywordBlock = keywordHints.missing?.length
    ? `Potential missing keywords from JDs (hints only): ${keywordHints.missing.join(", ")}`
    : "";

  const userText = fillTemplate(prompts.extractUserTemplate, {
    resume_text: resumeText.slice(0, 6000),
    jds_json: JSON.stringify(
      jds.map(({ label, company, text }) => ({
        label,
        company: company || null,
        text: text.slice(0, label === "primary" ? 6000 : 2000),
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

  return {
    parsed: parseJsonFromModel(extractText(data)),
    tokens: getUsageTokens(data),
    rawText: extractText(data),
    finishReason: getFinishReason(data),
  };
}

async function runAnalyzeStep({ apiKey, config, extractOutput, keywordHints, checklist, resumeText, signals }) {
  const prompts = config.prompts;
  const guardrails = prompts.guardrails || "";
  const systemText = fillTemplate(prompts.analyzeSystem, { guardrails });

  const keywordBlock = [
    keywordHints.overlap?.length ? `Overlapping terms in resume: ${keywordHints.overlap.join(", ")}` : "",
    keywordHints.missing?.length ? `Terms in JDs not found in resume: ${keywordHints.missing.join(", ")}` : "",
    checklist?.length
      ? `Checklist failures: ${checklist.filter((c) => c.status === "fail").map((c) => c.label).join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const userText = fillTemplate(prompts.analyzeUserTemplate, {
    extract_json: JSON.stringify(extractOutput),
    keyword_hints: keywordBlock || "None",
    resume_facts: buildResumeFacts(resumeText, signals),
  });

  const data = await callGeminiJson({
    apiKey,
    model: config.models.analyzeModel,
    systemText,
    userText,
    temperature: config.models.analyzeTemperature,
    maxOutputTokens: Math.max(config.models.analyzeMaxOutputTokens || 0, 1200),
  });

  return {
    parsed: parseJsonFromModel(extractText(data)),
    tokens: getUsageTokens(data),
    rawText: extractText(data),
    finishReason: getFinishReason(data),
  };
}

async function runPipeline({ apiKey, config, body, onProgress }) {
  const startMs = Date.now();
  const limits = config.limits;

  const resumeText = normalizeResumeText(body.resumeText || "", limits);
  const jds = normalizeJobDescriptions(body.jobDescriptions || [], limits);

  if (resumeText.length < 200) {
    throw Object.assign(new Error("Resume text too short"), { code: "VALIDATION" });
  }
  if (!jds.some((j) => j.label === "primary")) {
    throw Object.assign(new Error("Primary job description is required"), { code: "VALIDATION" });
  }

  const signals = detectResumeSignals(resumeText);
  const sectionAudit = auditResumeSections(resumeText, signals);
  const keywordHints = buildKeywordHints(resumeText, jds);
  const skillMatrix = buildSkillMatrix(resumeText, jds, 15);
  const checklist = buildChecklist(resumeText, signals, keywordHints);

  let extractResult = await runExtractStep({
    apiKey,
    config,
    resumeText,
    jds,
    sectionAudit,
    keywordHints,
    signals,
  });

  if (!extractResult.parsed) {
    extractResult = await runExtractStep({
      apiKey,
      config: { ...config, models: { ...config.models, extractTemperature: 0 } },
      resumeText,
      jds,
      sectionAudit,
      keywordHints,
      signals,
    });
  }

  if (!extractResult.parsed) {
    extractResult.parsed = buildFallbackExtract({
      resumeText,
      jds,
      sectionAudit,
      keywordHints,
      signals,
    });
  }

  await onProgress?.("extract");

  let analyzeResult = await runAnalyzeStep({
    apiKey,
    config,
    extractOutput: extractResult.parsed,
    keywordHints,
    checklist,
    resumeText,
    signals,
  });

  if (!analyzeResult.parsed) {
    analyzeResult = await runAnalyzeStep({
      apiKey,
      config: { ...config, models: { ...config.models, analyzeTemperature: 0 } },
      extractOutput: extractResult.parsed,
      keywordHints,
      checklist,
      resumeText,
      signals,
    });
  }

  if (!analyzeResult.parsed) {
    analyzeResult.parsed = buildFallbackAnalyze(extractResult.parsed, keywordHints);
  }

  await onProgress?.("analyze");

  const analyze = analyzeResult.parsed;
  const extract = extractResult.parsed;

  const section_audit = (extract.section_audit || []).length ? extract.section_audit : sectionAudit;

  const checklistRecs = checklistToRecommendations(checklist);
  const aiRecs = validateAndRankRecommendations(
    analyze.recommendations,
    extract,
    config.sectionPriority || ["summary", "experience", "skills", "keywords", "ai_readiness"],
    resumeText
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
  const alignment_by_jd = computeAlignmentByJd(resumeText, jds, checklist, section_audit).map((jd) => ({
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
    input_summary: buildInputSummary(resumeText, jds),
  };

  const meta = {
    tokens: {
      extract: extractResult.tokens.total,
      analyze: analyzeResult.tokens.total,
      total: extractResult.tokens.total + analyzeResult.tokens.total,
    },
    durationMs: Date.now() - startMs,
    configVersion: config.version || 1,
  };

  return { report, meta };
}

module.exports = { runPipeline };
