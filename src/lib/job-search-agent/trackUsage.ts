const ALLOWED_EVENTS = new Set([
  "view",
  "analyze_start",
  "analyze_complete",
  "analyze_fail",
  "rewrite_start",
  "rewrite_complete",
  "rewrite_fail",
  "cover_letter_start",
  "cover_letter_complete",
  "cover_letter_fail",
]);

export function trackJobSearchAgentUsage(event: string) {
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
    body: JSON.stringify({ tool: "job_search_agent", event }),
    keepalive: true,
  }).catch(() => {});
}
