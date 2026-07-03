import type { AnalyzeRequest, ProfileMeta, RoleAlignLimits } from "./types";
import { DEFAULT_LIMITS } from "./constants";

const LINKEDIN_URL_RE = /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w%-]+\/?$/i;

export type ValidationResult = { ok: true } | { ok: false; errors: Record<string, string> };

export function validateLinkedInUrl(
  url: string,
  messages: Record<string, string>
): ValidationResult {
  if (!url?.trim() || !LINKEDIN_URL_RE.test(url.trim())) {
    return { ok: false, errors: { linkedInUrl: messages.linkedInUrl ?? "Invalid LinkedIn URL" } };
  }
  return { ok: true };
}

export function validateProfileStep(
  profile: AnalyzeRequest["profile"],
  profileMeta: ProfileMeta | undefined,
  fetchSucceeded: boolean,
  messages: Record<string, string>
): ValidationResult {
  const urlCheck = validateLinkedInUrl(profile.linkedInUrl, messages);
  if (!urlCheck.ok) return urlCheck;

  const hasContent =
    profile.headline?.trim() ||
    profile.about?.trim() ||
    profile.additionalNotes?.trim() ||
    (profile.experience || []).some((r) => r.title?.trim() || r.company?.trim()) ||
    (profile.skills || []).length > 0;

  if (!fetchSucceeded && !hasContent) {
    return {
      ok: false,
      errors: {
        profileContent:
          messages.profileContent ??
          "We couldn't load your profile. Add a headline or About text to continue.",
      },
    };
  }

  return { ok: true };
}

export function validateAnalyzeRequest(
  req: AnalyzeRequest,
  messages: Record<string, string>,
  limits: RoleAlignLimits = DEFAULT_LIMITS
): ValidationResult {
  const errors: Record<string, string> = {};
  const { profile, jobDescriptions } = req;

  const urlCheck = validateLinkedInUrl(profile.linkedInUrl, messages);
  if (!urlCheck.ok) Object.assign(errors, urlCheck.errors);

  const roles = profile.experience?.filter((r) => r.title?.trim() || r.company?.trim()) ?? [];
  const hasText =
    profile.headline?.trim() ||
    profile.about?.trim() ||
    profile.additionalNotes?.trim() ||
    roles.length > 0;

  if (!hasText) {
    errors.profileContent = messages.profileContent ?? "Profile content is required for analysis.";
  }

  const primary = jobDescriptions?.find((j) => j.label === "primary");
  if (!primary?.text?.trim() || primary.text.trim().length < 100) {
    errors.primaryJd = messages.primaryJd ?? "Primary job description required (min 100 characters)";
  }

  if (!primary?.company?.trim()) {
    errors.primaryCompany = messages.primaryCompany ?? "Company name is required for the primary job.";
  }

  if ((jobDescriptions?.length ?? 0) > limits.maxJds) {
    errors.jobDescriptions = `Maximum ${limits.maxJds} job descriptions allowed.`;
  }

  return Object.keys(errors).length === 0 ? { ok: true } : { ok: false, errors };
}

export function parseSkillsInput(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, DEFAULT_LIMITS.maxSkills);
}

export function emptyExperienceRole() {
  return { title: "", company: "", bullets: [""] };
}

export function mergeProfileWithOverrides(
  fetched: AnalyzeRequest["profile"],
  overrides: {
    headline: string;
    about: string;
    additionalNotes: string;
  },
  profileMeta?: ProfileMeta
): { profile: AnalyzeRequest["profile"]; profileMeta: ProfileMeta } {
  const headline = overrides.headline.trim() || fetched.headline;
  const about = overrides.about.trim() || fetched.about;

  const fetchSource: ProfileMeta["fetchSource"] =
    profileMeta?.fetchSource === "proxycurl"
      ? overrides.headline.trim() || overrides.about.trim()
        ? "hybrid"
        : "proxycurl"
      : "manual";

  return {
    profile: {
      ...fetched,
      headline,
      about,
      additionalNotes: overrides.additionalNotes.trim(),
    },
    profileMeta: {
      hasProfilePhoto: profileMeta?.hasProfilePhoto ?? false,
      hasBannerPhoto: profileMeta?.hasBannerPhoto ?? false,
      hasProjects: profileMeta?.hasProjects ?? (fetched.projects?.length ?? 0) > 0,
      hasExperienceBullets:
        profileMeta?.hasExperienceBullets ??
        (fetched.experience || []).some((r) => r.bullets?.some((b) => b.trim())),
      displayName: profileMeta?.displayName,
      location: profileMeta?.location,
      fetchSource,
    },
  };
}
