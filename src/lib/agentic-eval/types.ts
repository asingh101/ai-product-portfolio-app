/**
 * Agent-Gate: Agentic Eval — TypeScript types
 *
 * These types mirror the shape of eval-engine/results.json produced by
 * run_agentic_eval.py. Keep in sync with the Python harness.
 */

// ── Per-step trace ──────────────────────────────────────────────────────────

export type ToolName = "read_file" | "write_file" | "run_tests" | "give_up" | "none";
export type TestStatus = "pass" | "fail" | "not_run";
export type ModelTier = "haiku" | "sonnet";

export interface TraceStep {
  step_number: number;
  model: ModelTier;
  tool_called: ToolName;
  tool_args: Record<string, string>;
  /** Truncated to 3000 chars — safe to render in UI */
  tool_result: string;
  /** Full untruncated result — use for detailed view */
  tool_result_full: string;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  latency_ms: number;
  /** True on the step where Haiku handed off to Sonnet */
  is_cascade_handoff: boolean;
  test_status: TestStatus;
}

// ── Per-task result ─────────────────────────────────────────────────────────

export type TaskCategory =
  | "single_bug_obvious"
  | "single_bug_hidden"
  | "two_bugs_sequential"
  | "test_understanding"
  | "red_herring";

export type Difficulty = "easy" | "medium" | "hard";

export type FailureType =
  | "gave_up"
  | "hit_turn_limit"
  | "loop_detected"
  | "repeated_failures"
  | "api_error"
  | null;

export type CascadeTriggerReason =
  | "gave_up"
  | "loop_detected"
  | "repeated_failures"
  | "haiku_turn_limit"
  | null;

export interface TaskResult {
  task_id: string;
  category: TaskCategory;
  difficulty: Difficulty;

  // Outcome
  solved: boolean;
  failure_type: FailureType;
  turns_to_solve: number | null;   // null if not solved

  // Model usage
  haiku_turns: number;
  sonnet_turns: number;
  cascade_triggered: boolean;
  cascade_trigger_reason: CascadeTriggerReason;
  cascade_rescued: boolean;         // true if Sonnet solved what Haiku couldn't

  // Behavior metrics
  self_corrections: number;
  first_attempt_passed: boolean;    // did first write_file → run_tests pass?

  // Cost (USD)
  cost_haiku_usd: number;
  cost_sonnet_usd: number;
  cost_actual_usd: number;
  cost_haiku_only_estimate_usd: number;   // counterfactual: all turns at Haiku price
  cost_sonnet_only_estimate_usd: number;  // counterfactual: all turns at Sonnet price

  // Latency (ms)
  latency_ms_avg: number;
  latency_haiku_avg_ms: number;
  latency_sonnet_avg_ms: number;

  // Full step-by-step trace
  trace: TraceStep[];
}

// ── Aggregate metrics ───────────────────────────────────────────────────────

export interface AggregatMetrics {
  overall_pass_rate: number;        // 0–1
  tasks_solved: number;
  tasks_total: number;
  cascade_rate: number;             // fraction of tasks that escalated
  cascade_rescue_rate: number;      // fraction of cascades that Sonnet rescued
  avg_turns_to_solve: number | null;

  // Costs
  total_cost_actual_usd: number;
  total_cost_haiku_only_usd: number;
  total_cost_sonnet_only_usd: number;
  cost_savings_vs_sonnet_pct: number;

  // Behavior
  self_correction_rate: number;
  avg_latency_per_turn_ms: number;
}

// ── Run config ──────────────────────────────────────────────────────────────

export interface RunConfig {
  haiku_max_turns: number;
  sonnet_max_turns: number;
  temperature: number;
  tool_output_max_lines: number;
}

// ── Top-level snapshot ──────────────────────────────────────────────────────

export interface AgenticEvalSnapshot {
  run_at: string;           // ISO timestamp
  run_at_label: string;     // "July 4, 2026"
  elapsed_sec: number;
  models: {
    haiku: string;
    sonnet: string;
  };
  config: RunConfig;
  aggregates: AggregatMetrics;
  task_results: TaskResult[];
}
