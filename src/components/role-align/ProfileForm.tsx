"use client";

import type { ExperienceRole, ProfileInput, RoleAlignUI } from "@/lib/role-align/types";
import { emptyExperienceRole } from "@/lib/role-align/validation";

type Props = {
  ui: RoleAlignUI;
  profile: ProfileInput;
  skillsText: string;
  onChange: (profile: ProfileInput) => void;
  onSkillsTextChange: (text: string) => void;
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

export function ProfileForm({
  ui,
  profile,
  skillsText,
  onChange,
  onSkillsTextChange,
  errors,
}: Props) {
  const L = ui.formLabels;
  const H = ui.formHints;
  const P = ui.formPlaceholders;
  const limits = ui.limits;

  const updateRole = (index: number, patch: Partial<ExperienceRole>) => {
    const experience = [...profile.experience];
    experience[index] = { ...experience[index], ...patch };
    onChange({ ...profile, experience });
  };

  const updateBullet = (roleIndex: number, bulletIndex: number, value: string) => {
    const experience = [...profile.experience];
    const bullets = [...(experience[roleIndex].bullets || [])];
    bullets[bulletIndex] = value;
    experience[roleIndex] = { ...experience[roleIndex], bullets };
    onChange({ ...profile, experience });
  };

  const addRole = () => {
    if (profile.experience.length >= limits.maxRoles) return;
    onChange({ ...profile, experience: [...profile.experience, emptyExperienceRole()] });
  };

  const removeRole = (index: number) => {
    onChange({
      ...profile,
      experience: profile.experience.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <FieldLabel label={L.linkedInUrl} hint={H.linkedInUrl} />
        <input
          type="url"
          value={profile.linkedInUrl}
          onChange={(e) => onChange({ ...profile, linkedInUrl: e.target.value })}
          placeholder={P.linkedInUrl}
          className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {errors.linkedInUrl && (
          <p className="text-xs text-red-600 mt-1">{errors.linkedInUrl}</p>
        )}
      </div>

      <div>
        <FieldLabel label={L.targetRoleLabel} hint={H.targetRoleLabel} />
        <input
          type="text"
          value={profile.targetRoleLabel}
          onChange={(e) => onChange({ ...profile, targetRoleLabel: e.target.value })}
          placeholder={P.targetRoleLabel}
          maxLength={limits.targetRoleLabelMax}
          className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {errors.targetRoleLabel && (
          <p className="text-xs text-red-600 mt-1">{errors.targetRoleLabel}</p>
        )}
      </div>

      <div>
        <FieldLabel label={L.headline} />
        <input
          type="text"
          value={profile.headline}
          onChange={(e) => onChange({ ...profile, headline: e.target.value })}
          placeholder={P.headline}
          maxLength={limits.headlineMax}
          className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <p className="text-[10px] text-on-surface-variant mt-1 text-right">
          {profile.headline.length}/{limits.headlineMax}
        </p>
        {errors.headline && <p className="text-xs text-red-600 mt-1">{errors.headline}</p>}
      </div>

      <div>
        <FieldLabel label={L.about} hint={H.about} />
        <textarea
          value={profile.about}
          onChange={(e) => onChange({ ...profile, about: e.target.value })}
          placeholder={P.about}
          maxLength={limits.aboutMax}
          rows={5}
          className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
        />
        <p className="text-[10px] text-on-surface-variant mt-1 text-right">
          {profile.about.length}/{limits.aboutMax}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <FieldLabel label={L.experience} />
          {profile.experience.length < limits.maxRoles && (
            <button
              type="button"
              onClick={addRole}
              className="text-xs font-bold text-primary flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add role
            </button>
          )}
        </div>
        {errors.experience && (
          <p className="text-xs text-red-600 mb-3">{errors.experience}</p>
        )}
        <div className="space-y-6">
          {profile.experience.map((role, ri) => (
            <div
              key={ri}
              className="rounded-2xl border border-outline-variant/15 p-5 bg-surface-container-low/50"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Role {ri + 1}
                </span>
                {profile.experience.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRole(ri)}
                    className="text-on-surface-variant hover:text-red-600"
                    aria-label="Remove role"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  value={role.title}
                  onChange={(e) => updateRole(ri, { title: e.target.value })}
                  placeholder={P.roleTitle}
                  className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-2.5 text-sm"
                />
                <input
                  type="text"
                  value={role.company}
                  onChange={(e) => updateRole(ri, { company: e.target.value })}
                  placeholder={P.company}
                  className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-2.5 text-sm"
                />
              </div>
              <p className="text-xs font-bold text-on-surface-variant mb-2">{L.bullets}</p>
              {(role.bullets.length ? role.bullets : [""]).map((bullet, bi) => (
                <textarea
                  key={bi}
                  value={bullet}
                  onChange={(e) => updateBullet(ri, bi, e.target.value)}
                  placeholder={P.bullet}
                  maxLength={limits.bulletMax}
                  rows={2}
                  className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-2.5 text-sm mb-2 resize-y"
                />
              ))}
              {(role.bullets.length || 0) < limits.maxBulletsPerRole && (
                <button
                  type="button"
                  onClick={() =>
                    updateRole(ri, { bullets: [...(role.bullets || []), ""] })
                  }
                  className="text-xs font-bold text-primary"
                >
                  + Add bullet
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <FieldLabel label={L.skills} hint={H.skills} />
        <textarea
          value={skillsText}
          onChange={(e) => onSkillsTextChange(e.target.value)}
          placeholder={P.skills}
          rows={3}
          className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
        />
      </div>
    </div>
  );
}
