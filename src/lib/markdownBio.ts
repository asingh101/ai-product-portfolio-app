/**
 * CommonMark does not treat `** ... **` as bold when the span contains blank lines.
 * CMS users often wrap a whole multi-paragraph block once; strip a single outer fence
 * so inner markdown still parses, then we apply block-level emphasis in the UI.
 */
export function stripOuterBoldFence(text: string): { text: string; blockBold: boolean } {
  const t = text.trim();
  if (t.length < 4 || !t.startsWith("**") || !t.endsWith("**")) {
    return { text, blockBold: false };
  }
  const inner = t.slice(2, -2);
  // If there are more `**` inside, assume real inline bold, let react-markdown handle it.
  if (inner.includes("**")) {
    return { text, blockBold: false };
  }
  return { text: inner.trim(), blockBold: true };
}
