type Tool = "hub" | "resume" | "linkedin";

const ALLOWED_EVENTS = new Set([
  "view",
  "tab_view",
  "analyze_start",
  "analyze_complete",
  "analyze_fail",
  "fetch_start",
  "fetch_complete",
  "fetch_fail",
]);

export function trackToolUsage(tool: Tool, event: string) {
  if (typeof window === "undefined") return;
  if (!ALLOWED_EVENTS.has(event)) return;

  const url =
    process.env.NEXT_PUBLIC_TOOL_USAGE_URL ||
    process.env.NEXT_PUBLIC_ROLE_ALIGN_API_URL?.replace(
      /\/roleAlignAnalyze\/?$/,
      "/recordToolUsage"
    );

  if (!url) return;

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool, event }),
    keepalive: true,
  }).catch(() => {});
}
