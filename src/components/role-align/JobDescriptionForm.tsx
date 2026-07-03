"use client";

import type { JobDescriptionInput, RoleAlignUI } from "@/lib/role-align/types";

type Props = {
  ui: RoleAlignUI;
  primary: JobDescriptionInput;
  alternates: JobDescriptionInput[];
  showAlternates: boolean;
  onToggleAlternates: () => void;
  onPrimaryChange: (jd: JobDescriptionInput) => void;
  onAlternateChange: (index: number, jd: JobDescriptionInput) => void;
  errors: Record<string, string>;
};

function JdBlock({
  title,
  hint,
  jd,
  placeholder,
  companyLabel,
  companyPlaceholder,
  companyRequired,
  maxChars,
  onChange,
  error,
  companyError,
}: {
  title: string;
  hint?: string;
  jd: JobDescriptionInput;
  placeholder: string;
  companyLabel: string;
  companyPlaceholder: string;
  companyRequired?: boolean;
  maxChars: number;
  onChange: (jd: JobDescriptionInput) => void;
  error?: string;
  companyError?: string;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant/15 p-5 bg-surface-container-low/50">
      <h3 className="text-sm font-bold text-on-surface mb-1">{title}</h3>
      {hint && <p className="text-xs text-on-surface-variant mb-4">{hint}</p>}
      <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
        {companyLabel}
        {companyRequired && <span className="text-red-500 ml-0.5">*</span>}
      </p>
      <input
        type="text"
        value={jd.company || ""}
        onChange={(e) => onChange({ ...jd, company: e.target.value })}
        placeholder={companyPlaceholder}
        className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-2.5 text-sm mb-1"
      />
      {companyError && <p className="text-xs text-red-600 mb-2">{companyError}</p>}
      <textarea
        value={jd.text}
        onChange={(e) => onChange({ ...jd, text: e.target.value })}
        placeholder={placeholder}
        maxLength={maxChars}
        rows={10}
        className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 mt-2"
      />
      <p className="text-[10px] text-on-surface-variant mt-1 text-right">
        {jd.text.length}/{maxChars}
      </p>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export function JobDescriptionForm({
  ui,
  primary,
  alternates,
  showAlternates,
  onToggleAlternates,
  onPrimaryChange,
  onAlternateChange,
  errors,
}: Props) {
  const L = ui.formLabels;
  const H = ui.formHints;
  const P = ui.formPlaceholders;
  const max = ui.limits.jdMaxChars;

  return (
    <div className="space-y-6">
      <JdBlock
        title={L.primaryJd}
        hint={H.primaryJd}
        jd={primary}
        placeholder={P.jd}
        companyLabel={L.companyRequired}
        companyPlaceholder="Apple"
        companyRequired
        maxChars={max}
        onChange={onPrimaryChange}
        error={errors.primaryJd}
        companyError={errors.primaryCompany}
      />

      <button
        type="button"
        onClick={onToggleAlternates}
        className="text-sm font-bold text-primary hover:opacity-80 flex items-center gap-1"
      >
        <span className="material-symbols-outlined text-base">
          {showAlternates ? "expand_less" : "expand_more"}
        </span>
        {showAlternates ? "Hide alternate jobs" : "Add up to 2 more jobs (optional)"}
      </button>

      {showAlternates &&
        alternates.map((alt, i) => (
          <JdBlock
            key={i}
            title={`${L.alternateJd} ${i + 1}`}
            hint={H.alternateJd}
            jd={alt}
            placeholder={P.jd}
            companyLabel={L.companyOptional}
            companyPlaceholder="Optional"
            maxChars={max}
            onChange={(jd) => onAlternateChange(i, jd)}
          />
        ))}
    </div>
  );
}
