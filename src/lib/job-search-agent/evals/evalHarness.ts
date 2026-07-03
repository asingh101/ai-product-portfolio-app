import { callTool } from "../apiClient";
import type { FitAnalysisResult, FitTier } from "../types";
import { AgentToolError } from "../types";
import { GOLDEN_EVAL_SET } from "./goldenSet";
import type { EvalCase, EvalCaseResult, EvalLastRunSnapshot, EvalRunResult } from "./types";

export const EVAL_LAST_RUN_KEY = "job_search_agent_eval_last_run";

function tierFromScore(score: number): FitTier {
  if (score >= 75) return "strong";
  if (score >= 50) return "reach";
  return "weak";
}

function combinedGapText(result: FitAnalysisResult): string {
  return [...result.missingSkills, ...result.sourcedFrom].join(" ").toLowerCase();
}

function missingRequiredTerms(text: string, required: string[]): string[] {
  const lower = text.toLowerCase();
  return required.filter((term) => !lower.includes(term.toLowerCase()));
}

function checkMustIncludeInMatched(result: FitAnalysisResult, required: string[]): string[] {
  const combined = [...result.matchedSkills, ...result.highlights].join(" ").toLowerCase();
  return required.filter((term) => !combined.includes(term.toLowerCase()));
}

function evaluateCase(caseDef: EvalCase, result: FitAnalysisResult | null, errorCode?: string): EvalCaseResult {
  const base: EvalCaseResult = {
    id: caseDef.id,
    label: caseDef.label,
    category: caseDef.category,
    passed: false,
    score: result?.score ?? null,
    tier: result?.tier ?? null,
    expectedRange: caseDef.expectedScoreRange,
    expectedTier: caseDef.expectedTier,
    failures: [],
    errorCode,
  };

  if (caseDef.expectError) {
    if (errorCode === caseDef.expectError) {
      return { ...base, passed: true };
    }
    if (errorCode) {
      base.failures.push(`Expected error ${caseDef.expectError}, got ${errorCode}`);
    } else if (result) {
      base.failures.push(`Expected error ${caseDef.expectError}, but call succeeded`);
    } else {
      base.failures.push(`Expected error ${caseDef.expectError}, got no result`);
    }
    return base;
  }

  if (!result) {
    base.failures.push(errorCode ? `Unexpected error: ${errorCode}` : "No result returned");
    return base;
  }

  const [minScore, maxScore] = caseDef.expectedScoreRange;
  if (result.score < minScore || result.score > maxScore) {
    base.failures.push(`Score ${result.score} outside expected range ${minScore}–${maxScore}`);
  }

  const tierOk = caseDef.tierOneOf
    ? caseDef.tierOneOf.includes(result.tier)
    : result.tier === caseDef.expectedTier;
  if (!tierOk) {
    const expected = caseDef.tierOneOf?.join(" | ") ?? caseDef.expectedTier;
    base.failures.push(`Tier "${result.tier}" (expected "${expected}")`);
  }

  const derivedTier = tierFromScore(result.score);
  const derivedOk = caseDef.tierOneOf
    ? caseDef.tierOneOf.includes(derivedTier)
    : derivedTier === caseDef.expectedTier;
  if (!derivedOk) {
    const expected = caseDef.tierOneOf?.join(" | ") ?? caseDef.expectedTier;
    base.failures.push(`Score-derived tier "${derivedTier}" does not match expected "${expected}"`);
  }

  if (caseDef.mustIncludeInMissing?.length) {
    const missing = missingRequiredTerms(combinedGapText(result), caseDef.mustIncludeInMissing);
    if (missing.length) {
      base.failures.push(`Missing gap terms not found: ${missing.join(", ")}`);
    }
  }

  if (caseDef.mustIncludeInMatched?.length) {
    const missing = checkMustIncludeInMatched(result, caseDef.mustIncludeInMatched);
    if (missing.length) {
      base.failures.push(`Matched terms not found: ${missing.join(", ")}`);
    }
  }

  if (caseDef.mustIncludeInRedFlags?.length) {
    const flagsText = result.redFlags.join(" ").toLowerCase();
    const anyMatch = caseDef.mustIncludeInRedFlags.some((term) =>
      flagsText.includes(term.toLowerCase())
    );
    if (!anyMatch) {
      base.failures.push(
        `Red flags should mention seniority (expected one of: ${caseDef.mustIncludeInRedFlags.join(", ")}; got: ${result.redFlags.join("; ") || "none"})`
      );
    }
  }

  return { ...base, passed: base.failures.length === 0 };
}

async function runSingleCase(caseDef: EvalCase): Promise<EvalCaseResult> {
  try {
    const { result, usage } = await callTool<FitAnalysisResult>(
      "analyze_fit",
      {
        resumeText: caseDef.resumeSnippet,
        jobDescriptionText: caseDef.jobSnippet,
      },
      { workflow: "eval_harness", feature: "job_search_agent" }
    );

    const evaluated = evaluateCase(caseDef, result);
    return { ...evaluated, latencyMs: usage.latencyMs };
  } catch (err) {
    const code = err instanceof AgentToolError ? err.code : "INTERNAL";
    const usage = err instanceof AgentToolError ? err.usage : undefined;
    const evaluated = evaluateCase(caseDef, null, code);
    return { ...evaluated, latencyMs: usage?.latencyMs };
  }
}

export async function runEvals(
  cases: EvalCase[] = GOLDEN_EVAL_SET,
  onProgress?: (completed: number, total: number, caseId: string) => void
): Promise<EvalRunResult> {
  const results: EvalCaseResult[] = [];

  for (let i = 0; i < cases.length; i++) {
    const caseDef = cases[i];
    onProgress?.(i, cases.length, caseDef.id);
    const result = await runSingleCase(caseDef);
    results.push(result);
    onProgress?.(i + 1, cases.length, caseDef.id);
  }

  const passCount = results.filter((r) => r.passed).length;
  const total = results.length;

  return {
    passRate: total ? passCount / total : 0,
    passCount,
    total,
    results,
    ranAt: new Date().toISOString(),
  };
}

export function loadLastEvalRun(): EvalLastRunSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(EVAL_LAST_RUN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EvalLastRunSnapshot;
  } catch {
    return null;
  }
}

export function saveLastEvalRun(run: EvalRunResult): void {
  if (typeof window === "undefined") return;
  const snapshot: EvalLastRunSnapshot = {
    passCount: run.passCount,
    total: run.total,
    passRate: run.passRate,
    ranAt: run.ranAt,
  };
  localStorage.setItem(EVAL_LAST_RUN_KEY, JSON.stringify(snapshot));
}

export function didEvalRegress(current: EvalRunResult, previous: EvalLastRunSnapshot | null): boolean {
  if (!previous) return false;
  return current.passCount < previous.passCount;
}
