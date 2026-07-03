import type {
  AgentToolMetadata,
  AgentToolSuccess,
  AgentToolUsage,
  AgentToolErrorBody,
  CoverLetterResult,
} from "./types";
import { AgentToolError } from "./types";

function resolveAgentToolUrl(): string {
  return (
    process.env.NEXT_PUBLIC_JOB_SEARCH_AGENT_URL ||
    process.env.NEXT_PUBLIC_TOOL_USAGE_URL?.replace(/\/recordToolUsage\/?$/, "/runAgentTool") ||
    ""
  );
}

/**
 * Calls a server-side agent tool via `runAgentTool` Cloud Function.
 * Gemini keys stay on the server; usage tokens returned per call.
 */
export async function callTool<T = unknown>(
  tool: string,
  payload: Record<string, unknown> = {},
  metadata: AgentToolMetadata = {}
): Promise<AgentToolSuccess<T>> {
  const url = resolveAgentToolUrl();
  if (!url) {
    throw new AgentToolError(
      "CONFIG",
      "Agent API not configured. Set NEXT_PUBLIC_JOB_SEARCH_AGENT_URL."
    );
  }

  const started = typeof performance !== "undefined" ? performance.now() : Date.now();

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool,
        payload,
        metadata: {
          feature: metadata.feature ?? "job_search_agent",
          workflow: metadata.workflow,
          sessionId: metadata.sessionId,
        },
      }),
    });
  } catch {
    throw new AgentToolError("NETWORK", "Could not reach the agent API.");
  }

  const data = (await res.json().catch(() => ({}))) as {
    result?: T;
    usage?: AgentToolUsage;
    error?: AgentToolErrorBody;
  };

  const usage: AgentToolUsage = data.usage ?? {
    inputTokens: 0,
    outputTokens: 0,
    latencyMs: Math.round(
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - started
    ),
  };

  if (process.env.NODE_ENV === "development") {
    console.info(
      `[callTool] ${tool} · ${usage.latencyMs}ms · in=${usage.inputTokens} out=${usage.outputTokens}`
    );
  }

  if (!res.ok || data.error) {
    const errBody = data.error;
    throw new AgentToolError(
      errBody?.code ?? "API_ERROR",
      errBody?.message ?? `Request failed (${res.status})`,
      usage,
      errBody?.retryAfterSeconds
    );
  }

  return { result: data.result as T, usage };
}

export type CoverLetterStreamCallbacks = {
  onChunk?: (text: string) => void;
  onReplace?: (letter: string) => void;
  onComplete?: (result: CoverLetterResult, usage: AgentToolUsage) => void;
  onError?: (code: string, message: string) => void;
};

/**
 * Streams a tool response via SSE (used by draft_cover_letter).
 */
export async function callToolStream(
  tool: string,
  payload: Record<string, unknown> = {},
  metadata: AgentToolMetadata = {},
  callbacks: CoverLetterStreamCallbacks = {},
  signal?: AbortSignal
): Promise<void> {
  const url = resolveAgentToolUrl();
  if (!url) {
    callbacks.onError?.("CONFIG", "Agent API not configured. Set NEXT_PUBLIC_JOB_SEARCH_AGENT_URL.");
    return;
  }

  const started = typeof performance !== "undefined" ? performance.now() : Date.now();

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        tool,
        payload,
        stream: true,
        metadata: {
          feature: metadata.feature ?? "job_search_agent",
          workflow: metadata.workflow,
          sessionId: metadata.sessionId,
        },
      }),
      signal,
    });
  } catch (e) {
    if (signal?.aborted) return;
    callbacks.onError?.("NETWORK", "Could not reach the agent API.");
    return;
  }

  if (!res.ok && !res.headers.get("content-type")?.includes("text/event-stream")) {
    const errBody = await res.json().catch(() => ({}));
    callbacks.onError?.(
      (errBody as { error?: { code?: string; message?: string } }).error?.code ?? "API_ERROR",
      (errBody as { error?: { message?: string } }).error?.message ?? `Request failed (${res.status})`
    );
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    callbacks.onError?.("NETWORK", "No response stream");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let completed = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() || "";

    for (const chunk of chunks) {
      const lines = chunk.split("\n");
      let eventType = "message";
      let dataLine = "";

      for (const line of lines) {
        if (line.startsWith("event:")) eventType = line.slice(6).trim();
        if (line.startsWith("data:")) dataLine += line.slice(5).trim();
      }

      if (!dataLine) continue;

      try {
        const data = JSON.parse(dataLine) as Record<string, unknown>;
        if (eventType === "chunk" && typeof data.text === "string") {
          callbacks.onChunk?.(data.text);
        } else if (eventType === "replace" && typeof data.letter === "string") {
          callbacks.onReplace?.(data.letter);
        } else if (eventType === "complete") {
          completed = true;
          const usage: AgentToolUsage =
            (data.usage as AgentToolUsage) ?? {
              inputTokens: 0,
              outputTokens: 0,
              latencyMs: Math.round(
                (typeof performance !== "undefined" ? performance.now() : Date.now()) - started
              ),
            };
          callbacks.onComplete?.(data.result as CoverLetterResult, usage);
        } else if (eventType === "error") {
          completed = true;
          callbacks.onError?.(
            (data.code as string) ?? "INTERNAL",
            (data.message as string) ?? "Stream failed"
          );
        }
      } catch {
        /* ignore malformed chunk */
      }
    }
  }

  if (!completed) {
    callbacks.onError?.("STREAM_END", "Cover letter stream ended unexpectedly.");
  }
}
