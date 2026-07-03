export type ProfileOptimizationDocs = {
  enabled: boolean;
  pillLabel: string;
  heroTitle: string;
  heroTitleAccent: string;
  heroSubtitle: string;
};

export const PROFILE_OPTIMIZATION_DOCS_INITIAL: ProfileOptimizationDocs = {
  enabled: true,
  pillLabel: "Tech Stuff & Docs",
  heroTitle: "Profile Optimization",
  heroTitleAccent: "Documentation",
  heroSubtitle:
    "Product requirements, architecture, and technical design for the Profile Optimization Tool - resume and LinkedIn matching built as a modular AI product on Firebase and Gemini.",
};
