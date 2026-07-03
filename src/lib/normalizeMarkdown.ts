/**
 * Fixes common CMS mistakes so markdown parses as authors expect.
 * e.g. Bold clicked twice with no selection yields `****` + typed text → broken emphasis.
 */
export function normalizeMarkdownInput(raw: string): string {
  let s = raw;
  // Line-start `****` immediately followed by real content → single `**` open (pair with a later `**` or user adds one)
  s = s.replace(/(^|\n)(\*{4})(?=[^\s*\n#])/g, "$1**");
  return s;
}
