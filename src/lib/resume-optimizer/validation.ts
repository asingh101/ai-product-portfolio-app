import type { AnalyzeResumeRequest, ResumeOptimizerLimits } from "./types";
import { DEFAULT_RESUME_LIMITS } from "./constants";

export type ValidationResult = { ok: true } | { ok: false; errors: Record<string, string> };

export function validateResumeAnalyzeRequest(
  req: AnalyzeResumeRequest,
  messages: Record<string, string>,
  limits: ResumeOptimizerLimits = DEFAULT_RESUME_LIMITS
): ValidationResult {
  const errors: Record<string, string> = {};
  const text = req.resumeText?.trim() ?? "";

  if (text.length < 200) {
    errors.resume = messages.resume ?? "Resume text required (min 200 characters)";
  }
  if (text.length > limits.resumeMaxChars) {
    errors.resume = `Resume exceeds ${limits.resumeMaxChars} characters.`;
  }

  const primary = req.jobDescriptions?.find((j) => j.label === "primary");
  if (!primary?.text?.trim() || primary.text.trim().length < 100) {
    errors.primaryJd = messages.primaryJd ?? "Primary JD required (min 100 characters)";
  }
  if (!primary?.company?.trim()) {
    errors.primaryCompany = messages.primaryCompany ?? "Company name required";
  }

  if ((req.jobDescriptions?.length ?? 0) > limits.maxJds) {
    errors.jobDescriptions = `Maximum ${limits.maxJds} job descriptions.`;
  }

  return Object.keys(errors).length === 0 ? { ok: true } : { ok: false, errors };
}
