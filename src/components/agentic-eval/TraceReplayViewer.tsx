"use client";

import { useState } from "react";
import type { TaskResult, TraceStep, ToolName } from "@/lib/agentic-eval/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtCost(usd: number): string {
  if (usd < 0.001) return `$${(usd * 1000).toFixed(3)}m`;
  return `$${usd.toFixed(4)}`;
}

function fmtMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

function toolIcon(tool: ToolName): string {
  switch (tool) {
    case "read_file":   return "folder_open";
    case "write_file":  return "edit";
    case "run_tests":   return "science";
    case "give_up":     return "cancel";
    default:            return "terminal";
  }
}

function toolLabel(tool: ToolName): string {
  switch (tool) {
    case "read_file":   return "read_file";
    case "write_file":  return "write_file";
    case "run_tests":   return "run_tests";
    case "give_up":     return "give_up";
    default:            return "none";
  }
}

function stepSummary(step: TraceStep): string {
  switch (step.tool_called) {
    case "read_file":
      return `Read ${step.tool_args.path ?? "file"}`;
    case "write_file":
      return `Wrote fix to ${step.tool_args.path ?? "file"}`;
    case "run_tests": {
      if (step.test_status === "pass") return "Tests passed - task solved";
      if (step.test_status === "fail") return "Tests failed - iterating";
      return "Ran test suite";
    }
    case "give_up":
      return "Agent gave up";
    default:
      return "Step";
  }
}

// ── Model badge ───────────────────────────────────────────────────────────────

function ModelBadge({ model }: { model: "haiku" | "sonnet" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
        model === "haiku"
          ? "bg-blue-100 text-blue-800"
          : "bg-emerald-100 text-emerald-800"
      }`}
    >
      <span className="material-symbols-outlined text-xs">
        {model === "haiku" ? "bolt" : "auto_awesome"}
      </span>
      {model === "haiku" ? "Haiku" : "Sonnet"}
    </span>
  );
}

// ── Test output renderer ──────────────────────────────────────────────────────

function TestOutput({ output, passed }: { output: string; passed: boolean }) {
  const lines = output.split("\n");
  return (
    <div
      className={`rounded-lg border text-xs font-mono overflow-auto max-h-48 p-3 ${
        passed
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-red-200 bg-red-50 text-red-900"
      }`}
    >
      {lines.map((line, i) => {
        const isPass   = /PASSED|passed|\d+ passed/.test(line);
        const isFail   = /FAILED|failed|ERROR|error/.test(line);
        const isAssert = /AssertionError|assert/.test(line);
        return (
          <div
            key={i}
            className={
              isPass   ? "text-emerald-700 font-semibold" :
              isFail   ? "text-red-700 font-semibold" :
              isAssert ? "text-orange-700" :
              "text-inherit"
            }
          >
            {line || " "}
          </div>
        );
      })}
    </div>
  );
}

// ── Write-file diff view ──────────────────────────────────────────────────────

function WrittenCode({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 text-xs font-mono overflow-auto max-h-48 p-3">
      {lines.map((line, i) => (
        <div key={i} className="flex gap-2">
          <span className="select-none text-blue-300 w-5 text-right shrink-0">{i + 1}</span>
          <span className="text-blue-900">{line || " "}</span>
        </div>
      ))}
    </div>
  );
}

// ── Single step card ──────────────────────────────────────────────────────────

function StepCard({
  step,
  isLast,
}: {
  step: TraceStep;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const testPassed = step.test_status === "pass";
  const testFailed = step.test_status === "fail";
  const isTestRun  = step.tool_called === "run_tests";
  const isWrite    = step.tool_called === "write_file";

  // Border accent by test status
  const borderClass = testPassed
    ? "border-emerald-300"
    : testFailed
    ? "border-red-200"
    : "border-outline-variant/20";

  return (
    <div className="relative flex gap-4">
      {/* Vertical connector line */}
      {!isLast && (
        <div className="absolute left-5 top-12 bottom-0 w-px bg-outline-variant/20" />
      )}

      {/* Step number pill */}
      <div
        className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 z-10 ${
          testPassed
            ? "border-emerald-400 bg-emerald-50 text-emerald-700"
            : testFailed
            ? "border-red-300 bg-red-50 text-red-700"
            : step.is_cascade_handoff
            ? "border-amber-400 bg-amber-50 text-amber-700"
            : "border-outline-variant/30 bg-surface-container-lowest text-on-surface-variant"
        }`}
      >
        {String(step.step_number).padStart(2, "0")}
      </div>

      {/* Card */}
      <div className={`flex-1 mb-4 rounded-xl border bg-surface-container-lowest overflow-hidden ${borderClass}`}>
        {/* Cascade handoff banner */}
        {step.is_cascade_handoff && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-200">
            <span className="material-symbols-outlined text-amber-700 text-base">swap_horiz</span>
            <p className="text-xs font-bold text-amber-900">
              Haiku escalated to Sonnet - context handed off
            </p>
          </div>
        )}

        {/* First passing test banner */}
        {testPassed && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border-b border-emerald-200">
            <span className="material-symbols-outlined text-emerald-700 text-base">check_circle</span>
            <p className="text-xs font-bold text-emerald-900">All tests passed - task solved</p>
          </div>
        )}

        {/* Main row */}
        <div className="px-4 py-3 flex items-center gap-3">
          {/* Tool icon */}
          <span
            className={`material-symbols-outlined text-lg shrink-0 ${
              testPassed ? "text-emerald-600" :
              testFailed ? "text-red-500" :
              "text-on-surface-variant"
            }`}
          >
            {toolIcon(step.tool_called)}
          </span>

          {/* Tool name + summary */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-0.5">
              <code className="text-xs font-mono font-bold text-on-surface bg-surface-container px-1.5 py-0.5 rounded">
                {toolLabel(step.tool_called)}
              </code>
              <ModelBadge model={step.model} />
            </div>
            <p className="text-sm text-on-surface-variant truncate">{stepSummary(step)}</p>
          </div>

          {/* Per-step stats */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-on-surface-variant shrink-0">
            <span title="Input tokens">{step.tokens_in.toLocaleString()}↓</span>
            <span title="Output tokens">{step.tokens_out.toLocaleString()}↑</span>
            <span title="Cost" className="font-mono">{fmtCost(step.cost_usd)}</span>
            <span title="Latency">{fmtMs(step.latency_ms)}</span>
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-container transition-colors"
            aria-label={expanded ? "Collapse step" : "Expand step"}
          >
            <span className="material-symbols-outlined text-base text-on-surface-variant">
              {expanded ? "expand_less" : "expand_more"}
            </span>
          </button>
        </div>

        {/* Mobile stats row */}
        <div className="sm:hidden flex items-center gap-3 text-xs text-on-surface-variant px-4 pb-2">
          <span>{step.tokens_in.toLocaleString()} in / {step.tokens_out.toLocaleString()} out</span>
          <span className="font-mono">{fmtCost(step.cost_usd)}</span>
          <span>{fmtMs(step.latency_ms)}</span>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="border-t border-outline-variant/10 px-4 py-4 space-y-3">
            {/* Tool args */}
            {Object.keys(step.tool_args).length > 0 && (
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5">
                  {isWrite ? "File written" : "Arguments"}
                </p>
                {isWrite && step.tool_args.content ? (
                  <WrittenCode content={step.tool_args.content} />
                ) : (
                  <div className="rounded-lg border border-outline-variant/15 bg-surface-container px-3 py-2 text-xs font-mono text-on-surface-variant">
                    {Object.entries(step.tool_args).map(([k, v]) => (
                      <div key={k}>
                        <span className="text-primary">{k}:</span>{" "}
                        <span>{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tool result */}
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5">
                {isTestRun ? "Test output" : "Result"}
              </p>
              {isTestRun ? (
                <TestOutput
                  output={step.tool_result}
                  passed={testPassed}
                />
              ) : (
                <div className="rounded-lg border border-outline-variant/15 bg-surface-container px-3 py-2 text-xs font-mono text-on-surface overflow-auto max-h-48 whitespace-pre-wrap">
                  {step.tool_result || "(empty)"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Task summary footer ───────────────────────────────────────────────────────

function TaskSummaryFooter({ task }: { task: TaskResult }) {
  const totalCost = task.cost_actual_usd;
  const totalTurns = task.haiku_turns + task.sonnet_turns;

  return (
    <div className="mt-2 rounded-xl border border-outline-variant/20 bg-surface-container-low/50 px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
        Task summary
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <p className="text-xs text-on-surface-variant">Status</p>
          <p className={`text-sm font-bold mt-0.5 ${task.solved ? "text-emerald-700" : "text-red-600"}`}>
            {task.solved ? "Solved" : "Failed"}
          </p>
        </div>
        <div>
          <p className="text-xs text-on-surface-variant">Total turns</p>
          <p className="text-sm font-bold mt-0.5 text-on-surface">{totalTurns}</p>
        </div>
        <div>
          <p className="text-xs text-on-surface-variant">Total cost</p>
          <p className="text-sm font-bold mt-0.5 text-on-surface font-mono">{fmtCost(totalCost)}</p>
        </div>
        <div>
          <p className="text-xs text-on-surface-variant">Avg latency</p>
          <p className="text-sm font-bold mt-0.5 text-on-surface">{fmtMs(task.latency_ms_avg)}/turn</p>
        </div>
      </div>

      {/* Cost comparison strip */}
      <div className="mt-3 pt-3 border-t border-outline-variant/10 flex flex-wrap gap-x-5 gap-y-1 text-xs text-on-surface-variant">
        <span>
          <span className="text-on-surface font-semibold">{fmtCost(task.cost_actual_usd)}</span>{" "}
          actual (cascade)
        </span>
        <span>
          <span className="text-on-surface font-semibold">{fmtCost(task.cost_haiku_only_estimate_usd)}</span>{" "}
          Haiku-only est.
        </span>
        <span>
          <span className="text-on-surface font-semibold">{fmtCost(task.cost_sonnet_only_estimate_usd)}</span>{" "}
          Sonnet-only est.
        </span>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface TraceReplayViewerProps {
  task: TaskResult;
}

export function TraceReplayViewer({ task }: TraceReplayViewerProps) {
  if (!task.trace || task.trace.length === 0) {
    return (
      <div className="px-4 py-10 text-center">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-3 block">
          history
        </span>
        <p className="text-sm text-on-surface-variant">
          Detailed trace not available for this task.
        </p>
        <p className="text-xs text-on-surface-variant/60 mt-1">
          Run the harness locally to generate full step-by-step traces.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-5">
      {/* Trace header */}
      <div className="flex items-center gap-2 mb-5">
        <span className="material-symbols-outlined text-base text-on-surface-variant">
          timeline
        </span>
        <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Step-by-step trace · {task.trace.length} steps
        </p>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Haiku
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Sonnet
          </span>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-0">
        {task.trace.map((step, i) => (
          <StepCard
            key={step.step_number}
            step={step}
            isLast={i === task.trace.length - 1}
          />
        ))}
      </div>

      {/* Task summary */}
      <TaskSummaryFooter task={task} />
    </div>
  );
}
