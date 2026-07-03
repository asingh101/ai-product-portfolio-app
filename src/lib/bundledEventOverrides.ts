export interface EventBundledOverride {
  slug: string;
  galleryIntro?: string;
}

export const BAY_AREA_AI_IMMERSION_GALLERY_INTRO =
  "In June 2026, I joined a select group of SCU Broncos for the annual Bay Area AI Immersion: four days of company visits and executive conversations across Google, SAP, Nutanix, LinkedIn, Western Digital, HP, Intuitive Surgical, and KLA. Organized by the SCU Career Center, the experience gave us direct access to C-suite leaders and senior practitioners across Product, Strategy, HR, and Marketing on how AI is reshaping their organizations and what they expect from the next generation of talent. The message was consistent across all eight stops: the professionals who thrive will not be the ones who talk about AI, they will be the ones who build with it. For me, that is not a warning. It is a confirmation.";

const BUNDLED_EVENT_OVERRIDES: EventBundledOverride[] = [
  {
    slug: "2026-bay-area-ai-immersion",
    galleryIntro: BAY_AREA_AI_IMMERSION_GALLERY_INTRO,
  },
];

export function getBundledEventOverride(slug: string): EventBundledOverride | undefined {
  return BUNDLED_EVENT_OVERRIDES.find((o) => o.slug === slug);
}

/** Apply repo-managed copy for bundled events; keeps Firestore id and media. */
export function applyBundledEventOverlay<T extends { slug: string; galleryIntro?: string }>(
  remote: T
): T {
  const bundled = getBundledEventOverride(remote.slug);
  if (!bundled) return remote;

  return {
    ...remote,
    ...(bundled.galleryIntro ? { galleryIntro: bundled.galleryIntro } : {}),
  };
}
