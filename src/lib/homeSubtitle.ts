/** Split CMS hero subtitle (textarea) into paragraph blocks for rendering. */
export function subtitleParagraphs(text: string | undefined): string[] {
  const raw = (text ?? "").trim();
  if (!raw) return [];
  const byBlank = raw
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (byBlank.length > 1) return byBlank;
  const single = raw
    .split(/\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return single.length ? single : [];
}

/** Default multi-paragraph home bio (legacy single field). */
export const DEFAULT_HOME_SUBTITLE = [
  `I've been a builder since I was a kid, disassembling my PC just to see if I could bring it back to life with a bit more RAM and processing speed. For years, my world was defined by the "how", the architecture, the deployments, and the satisfying hum of a 0-to-1 product finally going live.`,
  `I still remember my first code review at Amazon. I pushed the code, received 22+ comments doubting my skills, and promptly broke production. It was a humbling masterclass in scale: when you're serving millions of customers, you have to think and design every detail before writing a single line of code. I adapted quickly, eventually leading initiatives to launch enterprise SaaS products and migrate B2B clients to AWS with zero downtime.`,
  `But somewhere between the Kubernetes clusters and the quarterly OKRs, I started asking a different question, not just *how* to build, but *why* it mattered. That question led me to Santa Clara University's MBA program, where I traded sprint planning for GTM strategy and system design docs for competitive positioning frameworks.`,
  `Today I operate at the intersection of both worlds. I speak engineer and I speak executive, and I use that fluency to build products that are technically sound and commercially decisive. Whether it's shipping an AI-powered ADC that cuts incident response time by 45%, or coaching aspiring PMs through their career pivots, the mission is the same: close the gap between what's possible and what's essential.`,
].join("\n\n");

const _defaultParas = subtitleParagraphs(DEFAULT_HOME_SUBTITLE);

/** Shown above the hub chatbot (default: first two paragraphs). */
export const DEFAULT_HOME_BIO_BEFORE = _defaultParas.slice(0, 2).join("\n\n");

/** Shown below the hub chatbot (default: remaining paragraphs). */
export const DEFAULT_HOME_BIO_AFTER = _defaultParas.slice(2).join("\n\n");

export type HomeBioContent = {
  heroBioBefore?: string;
  heroBioAfter?: string;
  heroSubtitle?: string;
};

/**
 * Resolves split bio fields. Prefers heroBioBefore / heroBioAfter; falls back to
 * splitting legacy heroSubtitle after paragraph 2.
 */
export function resolveHomeBioParts(content: HomeBioContent): { before: string; after: string } {
  const b = (content.heroBioBefore ?? "").trim();
  const a = (content.heroBioAfter ?? "").trim();
  if (b !== "" || a !== "") {
    return { before: b, after: a };
  }
  const legacy = subtitleParagraphs(content.heroSubtitle);
  if (legacy.length === 0) {
    return { before: DEFAULT_HOME_BIO_BEFORE, after: DEFAULT_HOME_BIO_AFTER };
  }
  if (legacy.length <= 2) {
    return { before: legacy.join("\n\n"), after: "" };
  }
  return {
    before: legacy.slice(0, 2).join("\n\n"),
    after: legacy.slice(2).join("\n\n"),
  };
}
