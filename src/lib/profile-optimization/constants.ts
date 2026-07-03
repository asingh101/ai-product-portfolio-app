export type ProfileOptimizationHub = {
  enabled: boolean;
  heroPill: string;
  heroTitle: string;
  heroTitleAccent: string;
  heroDescription: string;
  resumeTabLabel: string;
  linkedInTabLabel: string;
  resumeTabDescription: string;
  linkedInTabDescription: string;
};

export const PROFILE_OPTIMIZATION_HUB_INITIAL: ProfileOptimizationHub = {
  enabled: true,
  heroPill: "AI Prototype",
  heroTitle: "Profile",
  heroTitleAccent: "Optimization",
  heroDescription:
    "Tailor your resume and align your LinkedIn profile to target roles, keyword matching, visual scans, and prioritized fixes.",
  resumeTabLabel: "Resume",
  linkedInTabLabel: "LinkedIn",
  resumeTabDescription: "Paste your resume and a job description to get a match score and tailored suggestions.",
  linkedInTabDescription: "Link your LinkedIn profile and target jobs for a visual alignment scan.",
};
