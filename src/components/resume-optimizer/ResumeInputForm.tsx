import type { AnalyzeResumeRequest, JobDescriptionInput, ResumeOptimizerUI } from "@/lib/resume-optimizer/types";

type Props = {
  ui: ResumeOptimizerUI;
  resumeText: string;
  primaryJd: JobDescriptionInput;
  onResumeChange: (text: string) => void;
  onPrimaryChange: (jd: JobDescriptionInput) => void;
  errors: Record<string, string>;
};

export function ResumeInputForm({
  ui,
  resumeText,
  primaryJd,
  onResumeChange,
  onPrimaryChange,
  errors,
}: Props) {
  const limits = ui.limits;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="rounded-2xl border border-outline-variant/15 p-5 bg-surface-container-low/50 flex flex-col">
        <h3 className="text-sm font-bold text-on-surface mb-1">{ui.formLabels.resume}</h3>
        <p className="text-xs text-on-surface-variant mb-4">{ui.formHints.resume}</p>
        <textarea
          value={resumeText}
          onChange={(e) => onResumeChange(e.target.value)}
          placeholder={ui.formPlaceholders.resume}
          maxLength={limits.resumeMaxChars}
          rows={18}
          className="flex-1 w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[280px]"
        />
        <p className="text-[10px] text-on-surface-variant mt-1 text-right">
          {resumeText.length}/{limits.resumeMaxChars}
        </p>
        {errors.resume && <p className="text-xs text-red-600 mt-1">{errors.resume}</p>}
      </div>

      <div className="rounded-2xl border border-outline-variant/15 p-5 bg-surface-container-low/50 flex flex-col">
        <h3 className="text-sm font-bold text-on-surface mb-1">{ui.formLabels.primaryJd}</h3>
        <p className="text-xs text-on-surface-variant mb-4">{ui.formHints.primaryJd}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
          {ui.formLabels.company}
          <span className="text-red-500 ml-0.5">*</span>
        </p>
        <input
          type="text"
          value={primaryJd.company || ""}
          onChange={(e) => onPrimaryChange({ ...primaryJd, company: e.target.value })}
          placeholder={ui.formPlaceholders.company}
          className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-2.5 text-sm mb-3"
        />
        {errors.primaryCompany && (
          <p className="text-xs text-red-600 mb-2">{errors.primaryCompany}</p>
        )}
        <textarea
          value={primaryJd.text}
          onChange={(e) => onPrimaryChange({ ...primaryJd, text: e.target.value })}
          placeholder={ui.formPlaceholders.jd}
          maxLength={limits.jdMaxChars}
          rows={14}
          className="flex-1 w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[220px]"
        />
        <p className="text-[10px] text-on-surface-variant mt-1 text-right">
          {primaryJd.text.length}/{limits.jdMaxChars}
        </p>
        {errors.primaryJd && <p className="text-xs text-red-600 mt-1">{errors.primaryJd}</p>}
      </div>
    </div>
  );
}
