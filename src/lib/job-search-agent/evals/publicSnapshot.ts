/**
 * Curated eval snapshot for public portfolio display.
 * Update after a verified admin/CLI golden-set run (node scripts/runJobSearchEvals.mjs).
 */
export type PublicEvalCaseResult = {
  id: string;
  label: string;
  category: string;
  scoreDisplay: string;
  expectedRange: string;
  tier: string;
  passed: boolean;
};

export type EvalQualitySnapshot = {
  tool: string;
  passCount: number;
  total: number;
  verifiedAt: string;
  verifiedAtLabel: string;
  headline: string;
  story: string;
  methodology: string[];
  cases: PublicEvalCaseResult[];
};

export const EVAL_QUALITY_SNAPSHOT: EvalQualitySnapshot = {
  tool: "analyze_fit",
  passCount: 5,
  total: 5,
  verifiedAt: "2026-06-06",
  verifiedAtLabel: "June 6, 2026",
  headline: "Regression-tested fit analysis",
  story:
    "Every prompt change runs through a five-case golden set before ship. Cases cover strong match, weak match, partial AI gap, overqualified seniority, and a minimal-resume edge case, so improvements are measured, not vibe-checked.",
  methodology: [
    "Fixed resume + JD pairs; no live user data in the suite.",
    "Asserts score bands, tier, required gap keywords, and seniority red flags.",
    "Edge case expects graceful validation instead of a crash.",
    "Full harness re-runs on demand in admin; CLI script for CI.",
  ],
  cases: [
    {
      id: "strong-ai-pm",
      label: "Strong AI PM match",
      category: "strong",
      scoreDisplay: "90",
      expectedRange: "78–95",
      tier: "strong",
      passed: true,
    },
    {
      id: "weak-engineer-pm",
      label: "Weak match: engineer → PM",
      category: "weak",
      scoreDisplay: "15",
      expectedRange: "5–45",
      tier: "weak",
      passed: true,
    },
    {
      id: "partial-saas-ai-pm",
      label: "Partial match: SaaS PM, no AI",
      category: "reach",
      scoreDisplay: "55",
      expectedRange: "45–65",
      tier: "reach",
      passed: true,
    },
    {
      id: "overqualified-director",
      label: "Overqualified: Director → IC PM",
      category: "reach",
      scoreDisplay: "45",
      expectedRange: "35–78",
      tier: "weak",
      passed: true,
    },
    {
      id: "edge-short-resume",
      label: "Edge: minimal resume text",
      category: "edge",
      scoreDisplay: "VALIDATION",
      expectedRange: "error expected",
      tier: "—",
      passed: true,
    },
  ],
};
