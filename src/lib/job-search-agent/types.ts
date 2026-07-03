export type AgentToolMetadata = {
  feature?: string;
  workflow?: string;
  sessionId?: string;
};

export type AgentToolUsage = {
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
};

export type AgentToolSuccess<T> = {
  result: T;
  usage: AgentToolUsage;
};

export type AgentToolErrorBody = {
  code: string;
  message: string;
  retryAfterSeconds?: number;
};

export class AgentToolError extends Error {
  readonly code: string;
  readonly usage?: AgentToolUsage;
  readonly retryAfterSeconds?: number;

  constructor(code: string, message: string, usage?: AgentToolUsage, retryAfterSeconds?: number) {
    super(message);
    this.name = "AgentToolError";
    this.code = code;
    this.usage = usage;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export type PingResult = {
  ok: boolean;
  tool: string;
  feature: string | null;
  workflow: string | null;
  echo: string | null;
  serverTime: string;
};

export type FitTier = "strong" | "reach" | "weak";

export type FitAnalysisResult = {
  score: number;
  tier: FitTier;
  matchedSkills: string[];
  missingSkills: string[];
  sourcedFrom: string[];
  redFlags: string[];
  highlights: string[];
  chunkCount?: number;
};

export type FitAnalysisPayload = {
  resumeText: string;
  jobDescriptionText: string;
};

export type FitAnalysisInput = {
  matchedSkills: string[];
  missingSkills: string[];
  highlights?: string[];
  sourcedFrom?: string[];
};

export type BulletRewriteItem = {
  original: string;
  rewritten: string;
  changedBecause: string;
  unchanged: boolean;
};

export type BulletRewriteResult = {
  rewrites: BulletRewriteItem[];
  changedCount: number;
  totalCount: number;
  usedFallback?: boolean;
};

export type CoverLetterTone = "confident" | "collaborative" | "concise";

export type CoverLetterFitInput = {
  matchedSkills: string[];
  missingSkills: string[];
  highlights: string[];
};

export type CoverLetterResult = {
  letter: string;
  wordCount: number;
  matchedSkillsUsed: string[];
  company: string;
  roleTitle: string;
  tone: CoverLetterTone;
  repaired?: boolean;
  validationWarning?: string;
};

export type CoverLetterPayload = {
  jobDescriptionText: string;
  fitAnalysis: CoverLetterFitInput;
  tone: CoverLetterTone;
  acceptedBullets?: string[];
};

export type BulletRewritePayload = {
  bullets: string[];
  jobDescriptionText: string;
  fitAnalysis: FitAnalysisInput;
};
