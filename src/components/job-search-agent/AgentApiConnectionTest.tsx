"use client";

import { useState } from "react";
import { callTool } from "@/lib/job-search-agent/apiClient";
import type { PingResult } from "@/lib/job-search-agent/types";
import { AgentToolError } from "@/lib/job-search-agent/types";

export function AgentApiConnectionTest() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [detail, setDetail] = useState<string | null>(null);

  const runPing = async () => {
    setStatus("loading");
    setDetail(null);
    try {
      const { result, usage } = await callTool<PingResult>(
        "ping",
        { message: "connection test" },
        { feature: "job_search_agent", workflow: "api_verify" }
      );
      setStatus("ok");
      setDetail(
        `OK · ${usage.latencyMs}ms · tokens in=${usage.inputTokens} out=${usage.outputTokens} · ${result.serverTime}`
      );
    } catch (e) {
      setStatus("error");
      if (e instanceof AgentToolError) {
        setDetail(`${e.code}: ${e.message}`);
      } else {
        setDetail("Unexpected error");
      }
    }
  };

  return (
    <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 max-w-2xl">
      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Phase B · API</p>
      <h2 className="text-lg font-bold font-[family-name:var(--font-headline)] mb-2">Tool gateway</h2>
      <p className="text-sm text-on-surface-variant mb-4">
        Calls <code className="text-xs bg-surface-container px-1 rounded">runAgentTool</code> with zero-token{" "}
        <code className="text-xs bg-surface-container px-1 rounded">ping</code>.
      </p>
      <button
        type="button"
        onClick={runPing}
        disabled={status === "loading"}
        className="px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold disabled:opacity-50"
      >
        {status === "loading" ? "Pinging…" : "Test API connection"}
      </button>
      {detail && (
        <p
          className={`mt-3 text-sm font-mono ${
            status === "ok" ? "text-emerald-700" : status === "error" ? "text-rose-700" : ""
          }`}
        >
          {detail}
        </p>
      )}
    </section>
  );
}
