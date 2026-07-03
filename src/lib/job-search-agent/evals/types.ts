import type { FitTier } from "../types";

export type EvalCase = {
  id: string;
  label: string;
  category: string;
  resumeSnippet: string;
  jobSnippet: string;
  expectedScoreRange: [number, number];
  expectedTier: FitTier;
  tierOneOf?: FitTier[];
  mustIncludeInMissing?: string[];
  mustIncludeInMatched?: string[];
  mustIncludeInRedFlags?: string[];
  /** If set, a VALIDATION (or other) error is the expected outcome, no score check. */
  expectError?: string;
};

export type EvalCaseResult = {
  id: string;
  label: string;
  category: string;
  passed: boolean;
  score: number | null;
  tier: FitTier | null;
  expectedRange: [number, number];
  expectedTier: FitTier;
  failures: string[];
  errorCode?: string;
  latencyMs?: number;
};

export type EvalRunResult = {
  passRate: number;
  passCount: number;
  total: number;
  results: EvalCaseResult[];
  ranAt: string;
};

export type EvalLastRunSnapshot = {
  passCount: number;
  total: number;
  passRate: number;
  ranAt: string;
};
