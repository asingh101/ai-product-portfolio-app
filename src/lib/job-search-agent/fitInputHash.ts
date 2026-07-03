/** Stable hash for resume + JD pair (client-side cache key). */
export function hashFitInputs(resumeText: string, jobDescriptionText: string): string {
  const payload = `${resumeText.trim()}\n---\n${jobDescriptionText.trim()}`;
  let hash = 5381;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash * 33) ^ payload.charCodeAt(i);
  }
  return `fit-${(hash >>> 0).toString(16)}`;
}
