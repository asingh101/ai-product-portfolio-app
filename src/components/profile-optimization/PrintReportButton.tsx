"use client";

type Props = {
  label?: string;
  hint?: string;
};

export function PrintReportButton({
  label = "Print report",
  hint = "Use Save as PDF in the print dialog.",
}: Props) {
  return (
    <div className="print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="w-full px-4 py-3 rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-sm font-bold text-on-surface hover:bg-surface-container-low flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-base">print</span>
        {label}
      </button>
      {hint && <p className="text-[10px] text-on-surface-variant mt-2 text-center">{hint}</p>}
    </div>
  );
}
