export type TaskCategory =
  | "bug-fix"
  | "feature-add"
  | "refactor"
  | "ambiguous"
  | "multi-step";

export type TaskDifficulty = "easy" | "medium" | "hard";

export type FailureType =
  | "wrong-fix"
  | "regression"
  | "spec-misread"
  | "silent-assumption"
  | "non-running";

export type ModelId = "claude-haiku-4-5" | "claude-sonnet-4-6" | "gpt-4o";

export type CodingEvalTask = {
  id: string;
  label: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  description: string;      // shown on portfolio page
  instruction: string;      // actual instruction given to the model
  whatWeTest: string;       // one sentence on what this reveals about model behavior
};

export type TaskResult = {
  taskId: string;
  model: ModelId;
  passed: boolean;
  runs: boolean[];          // result of each of 3 runs
  failureType?: FailureType;
  failureNote?: string;
  latencyMs?: number;
};

export type CategoryScore = {
  category: TaskCategory;
  label: string;
  scores: Record<ModelId, { passed: number; total: number }>;
};

export type CodingEvalSnapshot = {
  runAt: string;
  runAtLabel: string;
  totalTasks: number;
  models: ModelId[];
  overallScores: Record<ModelId, { passed: number; total: number; pct: number }>;
  categoryScores: CategoryScore[];
  results: TaskResult[];
  headlineFinding: string;
  methodology: string[];
};
