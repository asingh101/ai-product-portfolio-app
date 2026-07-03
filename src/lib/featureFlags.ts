/**
 * Flip to `true` (or set NEXT_PUBLIC_AI_PROTOTYPES_ENABLED=true) when ready to launch the tab publicly.
 */
export const AI_PROTOTYPES_PUBLIC =
  process.env.NEXT_PUBLIC_AI_PROTOTYPES_ENABLED === "true";

export function isAiPrototypesLocked(): boolean {
  return !AI_PROTOTYPES_PUBLIC;
}
