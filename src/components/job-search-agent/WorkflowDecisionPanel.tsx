"use client";

import type { CoverLetterTone } from "@/lib/job-search-agent/types";
import { COVER_LETTER_TONES } from "@/hooks/useJobSearchCoverLetter";

type Props = {
  wantsBullets: boolean;
  wantsCover: boolean;
  onWantsBulletsChange: (v: boolean) => void;
  onWantsCoverChange: (v: boolean) => void;
  coverTone: CoverLetterTone;
  onCoverToneChange: (tone: CoverLetterTone) => void;
  onContinue: () => void;
  disabled?: boolean;
  bulletCount: number;
};

export function WorkflowDecisionPanel({
  wantsBullets,
  wantsCover,
  onWantsBulletsChange,
  onWantsCoverChange,
  coverTone,
  onCoverToneChange,
  onContinue,
  disabled,
  bulletCount,
}: Props) {
  const canContinue = wantsBullets || wantsCover;

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary-fixed/25 px-6 py-6 space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-bold font-[family-name:var(--font-headline)]">
          Next steps for this role
        </h3>
        <p className="text-sm text-on-surface-variant mt-1">
          Your fit score is strong enough to tailor application materials. Choose what to generate, we&apos;ll
          run each step automatically.
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-4">
          <p className="text-sm font-bold mb-3">Want tailored bullets for this role?</p>
          <div className="flex gap-2">
            <ChoiceButton
              active={wantsBullets}
              onClick={() => onWantsBulletsChange(true)}
              label="Yes"
              disabled={disabled || bulletCount === 0}
            />
            <ChoiceButton active={!wantsBullets} onClick={() => onWantsBulletsChange(false)} label="No" disabled={disabled} />
          </div>
          {bulletCount === 0 && (
            <p className="text-xs text-amber-800 mt-2">No resume bullets detected, add lines starting with - or •</p>
          )}
        </div>

        <div className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-4">
          <p className="text-sm font-bold mb-3">Want a role-specific cover letter?</p>
          <div className="flex gap-2 mb-3">
            <ChoiceButton active={wantsCover} onClick={() => onWantsCoverChange(true)} label="Yes" disabled={disabled} />
            <ChoiceButton active={!wantsCover} onClick={() => onWantsCoverChange(false)} label="No" disabled={disabled} />
          </div>
          {wantsCover && (
            <div className="flex flex-wrap gap-2">
              {COVER_LETTER_TONES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onCoverToneChange(t.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    coverTone === t.id
                      ? "bg-primary text-on-primary"
                      : "border border-outline-variant/25 text-on-surface-variant"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={disabled || !canContinue}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        <span className="material-symbols-outlined text-lg">play_arrow</span>
        Run selected steps
      </button>
    </div>
  );
}

function ChoiceButton({
  active,
  onClick,
  label,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${
        active
          ? "bg-primary text-on-primary"
          : "border border-outline-variant/25 text-on-surface-variant hover:border-primary/40"
      } disabled:opacity-50`}
    >
      {label}
    </button>
  );
}
