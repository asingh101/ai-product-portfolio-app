"use client";

const RESUME_MAX = 8000;
const JD_MAX = 6000;

type Props = {
  resumeText: string;
  jobDescriptionText: string;
  onResumeChange: (text: string) => void;
  onJobDescriptionChange: (text: string) => void;
  errors: Record<string, string>;
  disabled?: boolean;
};

export function FitAnalysisInputForm({
  resumeText,
  jobDescriptionText,
  onResumeChange,
  onJobDescriptionChange,
  errors,
  disabled,
}: Props) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="rounded-2xl border border-outline-variant/15 p-5 bg-surface-container-low/50 flex flex-col">
        <h3 className="text-sm font-bold text-on-surface mb-1">Your resume</h3>
        <p className="text-xs text-on-surface-variant mb-4">
          Paste plain text from your resume, experience bullets and skills matter most.
        </p>
        <textarea
          value={resumeText}
          onChange={(e) => onResumeChange(e.target.value)}
          placeholder="Paste resume text here…"
          maxLength={RESUME_MAX}
          rows={18}
          disabled={disabled}
          className="flex-1 w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[280px] disabled:opacity-60"
        />
        <p className="text-[10px] text-on-surface-variant mt-1 text-right">
          {resumeText.length}/{RESUME_MAX}
        </p>
        {errors.resume && <p className="text-xs text-red-600 mt-1">{errors.resume}</p>}
      </div>

      <div className="rounded-2xl border border-outline-variant/15 p-5 bg-surface-container-low/50 flex flex-col">
        <h3 className="text-sm font-bold text-on-surface mb-1">Job description</h3>
        <p className="text-xs text-on-surface-variant mb-4">
          Paste the full posting, requirements and responsibilities help surface cited gaps.
        </p>
        <textarea
          value={jobDescriptionText}
          onChange={(e) => onJobDescriptionChange(e.target.value)}
          placeholder="Paste job description here…"
          maxLength={JD_MAX}
          rows={18}
          disabled={disabled}
          className="flex-1 w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[280px] disabled:opacity-60"
        />
        <p className="text-[10px] text-on-surface-variant mt-1 text-right">
          {jobDescriptionText.length}/{JD_MAX}
        </p>
        {errors.jobDescription && (
          <p className="text-xs text-red-600 mt-1">{errors.jobDescription}</p>
        )}
      </div>
    </div>
  );
}

export function validateFitInputs(resumeText: string, jobDescriptionText: string) {
  const errors: Record<string, string> = {};
  if (resumeText.trim().length < 200) {
    errors.resume = "Resume must be at least 200 characters.";
  }
  if (jobDescriptionText.trim().length < 50) {
    errors.jobDescription = "Job description must be at least 50 characters.";
  }
  return errors;
}
