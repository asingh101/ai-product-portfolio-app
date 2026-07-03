# Agentic Job Search, tool gateway

HTTP Cloud Function: `runAgentTool`

## Request

```json
POST { "tool": "ping", "payload": {}, "metadata": { "feature": "job_search_agent", "workflow": "api_verify" } }
```

## Response

```json
{ "result": { "ok": true, ... }, "usage": { "inputTokens": 0, "outputTokens": 0, "latencyMs": 12 } }
```

## Tools

| Tool | Status | Tokens |
|------|--------|--------|
| `ping` | Live | 0 (no Gemini) |
| `analyze_fit` | Live | ~1200 max output |
| `rewrite_bullets` | Live | ~1400 max output |
| `draft_cover_letter` | Live | ~900 max output, SSE stream |

Eval harness: admin `/admin/job-search-agent/evals`, 5-case golden set for `analyze_fit` regression.

Shared Gemini client: `functions/shared/geminiClient.js` (Flash Lite, capped `maxOutputTokens` per tool in `config.js`).
