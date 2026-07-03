"use client";

import type { ProfileMeta, RoleAlignUI } from "@/lib/role-align/types";
import type { FetchPhase } from "@/hooks/useRoleAlignProfileFetch";

type Props = {
  ui: RoleAlignUI;
  linkedInUrl: string;
  headline: string;
  about: string;
  additionalNotes: string;
  fetchPhase: FetchPhase;
  profileMeta: ProfileMeta | null;
  fetchError: string | null;
  onLinkedInUrlChange: (v: string) => void;
  onHeadlineChange: (v: string) => void;
  onAboutChange: (v: string) => void;
  onAdditionalNotesChange: (v: string) => void;
  errors: Record<string, string>;
};

function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="mb-2">
      <label className="text-sm font-bold text-on-surface">{label}</label>
      {hint && <p className="text-xs text-on-surface-variant mt-0.5">{hint}</p>}
    </div>
  );
}

export function ProfileLinkForm({
  ui,
  linkedInUrl,
  headline,
  about,
  additionalNotes,
  fetchPhase,
  profileMeta,
  fetchError,
  onLinkedInUrlChange,
  onHeadlineChange,
  onAboutChange,
  onAdditionalNotesChange,
  errors,
}: Props) {
  const L = ui.formLabels;
  const H = ui.formHints;
  const P = ui.formPlaceholders;
  const limits = ui.limits;

  return (
    <div className="space-y-6">
      <div>
        <FieldLabel label={L.linkedInUrl} hint={H.linkedInUrl} />
        <input
          type="url"
          value={linkedInUrl}
          onChange={(e) => onLinkedInUrlChange(e.target.value)}
          placeholder={P.linkedInUrl}
          className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {errors.linkedInUrl && (
          <p className="text-xs text-red-600 mt-1">{errors.linkedInUrl}</p>
        )}
      </div>

      {fetchPhase === "fetching" && (
        <div className="rounded-xl border border-primary/20 bg-primary-fixed/30 px-4 py-3 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary animate-spin text-xl">
            progress_activity
          </span>
          <p className="text-sm text-on-surface-variant">Loading your LinkedIn profile…</p>
        </div>
      )}

      {fetchPhase === "success" && profileMeta && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-bold text-emerald-900">
            Profile loaded
            {profileMeta.displayName ? ` · ${profileMeta.displayName}` : ""}
          </p>
          <p className="text-xs text-emerald-800/80 mt-1">
            {(profileMeta.location ? `${profileMeta.location} · ` : "")}
            Review or override fields below before continuing.
          </p>
        </div>
      )}

      {fetchError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-bold text-amber-900">Could not auto-load profile</p>
          <p className="text-xs text-amber-800/90 mt-1">{fetchError}</p>
          <p className="text-xs text-amber-800/80 mt-1">
            Add a headline or About text below to continue manually.
          </p>
        </div>
      )}

      {errors.profileContent && (
        <p className="text-xs text-red-600">{errors.profileContent}</p>
      )}

      <div>
        <FieldLabel label={L.headline} hint={H.headline} />
        <input
          type="text"
          value={headline}
          onChange={(e) => onHeadlineChange(e.target.value)}
          placeholder={P.headline}
          maxLength={limits.headlineMax}
          className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div>
        <FieldLabel label={L.about} hint={H.about} />
        <textarea
          value={about}
          onChange={(e) => onAboutChange(e.target.value)}
          placeholder={P.about}
          maxLength={limits.aboutMax}
          rows={5}
          className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div>
        <FieldLabel label={L.additionalNotes} hint={H.additionalNotes} />
        <textarea
          value={additionalNotes}
          onChange={(e) => onAdditionalNotesChange(e.target.value)}
          placeholder={P.additionalNotes}
          rows={3}
          className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
    </div>
  );
}
