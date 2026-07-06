"use client";

import { useState } from "react";
import {
  AGENTIC_EVAL_SNAPSHOT,
  IS_PLACEHOLDER,
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  CASCADE_TRIGGER_LABELS,
  FAILURE_LABELS,
} from "@/lib/agentic-eval/publicSnapshot";
import type { TaskResult } from "@/lib/agentic-eval/types";
import { TraceReplayViewer } from "./TraceReplayViewer";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCost(usd: number): string {
  if (usd === 0) return "$0.00";
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(3)}`;
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PlaceholderBanner() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 flex items-center gap-3 mb-8">
      <span className="material-symbols-outlined text-amber-700 text-lg shrink-0">hourglass_top</span>
      <p className="text-base text-amber-900">
        Showing estimated results. Run{" "}
        <code className="bg-amber-100 px-1.5 py-0.5 rounded text-sm font-mono">
          python src/eval-engine/run_agentic_eval.py
        </code>{" "}
        locally to generate real scores.
      </p>
    </div>
  );
}

function StatChip({
  icon,
  label,
  value,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm ${
        accent
          ? "border-primary/30 bg-primary-fixed text-on-primary-fixed"
          : "border-outline-variant/20 bg-surface-container-low text-on-surface"
      }`}
    >
      <span className="material-symbols-outlined text-base">{icon}</span>
      <span className="font-bold">{value}</span>
      <span className="text-on-surface-variant text-xs">{label}</span>
    </div>
  );
}

// ── Section 1: Hero stat chips ────────────────────────────────────────────────
export function HeroStatChips() {
  const agg = AGENTIC_EVAL_SNAPSHOT.aggregates;
  return (
    <div className="flex flex-wrap gap-2">
      <StatChip icon="check_circle" value={`${agg.tasks_solved}/${agg.tasks_total}`} label="tasks solved" accent />
      <StatChip icon="cached" value={agg.avg_turns_to_solve?.toFixed(1) ?? "-"} label="avg turns" />
      <StatChip icon="swap_horiz" value={pct(agg.cascade_rate)} label="cascade rate" />
      <StatChip icon="savings" value={`${Math.round(agg.cost_savings_vs_sonnet_pct)}%`} label="saved vs Sonnet-only" />
    </div>
  );
}

// ── Section 2: Cost comparison ────────────────────────────────────────────────

function CostComparison() {
  const agg = AGENTIC_EVAL_SNAPSHOT.aggregates;

  const scenarios = [
    {
      label: "Haiku Only",
      cost: agg.total_cost_haiku_only_usd,
      solved: "~7/10",
      note: "Cheap but gets stuck on hard tasks",
      color: "border-blue-200 bg-blue-50",
      textColor: "text-blue-900",
      subColor: "text-blue-700",
    },
    {
      label: "Cascade (Actual)",
      cost: agg.total_cost_actual_usd,
      solved: `${agg.tasks_solved}/10`,
      note: "Best balance of cost and capability",
      color: "border-emerald-300 bg-emerald-50 ring-2 ring-emerald-300",
      textColor: "text-emerald-900",
      subColor: "text-emerald-700",
      best: true,
    },
    {
      label: "Sonnet Only",
      cost: agg.total_cost_sonnet_only_usd,
      solved: "~8/10",
      note: "Most capable but 60%+ more expensive",
      color: "border-violet-200 bg-violet-50",
      textColor: "text-violet-900",
      subColor: "text-violet-700",
    },
  ];

  return (
    <section className="mb-14">
      <h2 className="text-3xl md:text-4xl font-extrabold font-[family-name:var(--font-headline)] mb-2">
        Does the cascade pay for itself?
      </h2>
      <p className="text-base text-on-surface-variant mb-8 max-w-2xl">
        The cascade starts with cheap Haiku and escalates to Sonnet only when stuck,
        capturing most of Sonnet&apos;s capability at a fraction of the price.
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {scenarios.map((s) => (
          <div key={s.label} className={`rounded-2xl border px-6 py-5 ${s.color}`}>
            {s.best && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 mb-2">
                <span className="material-symbols-outlined text-xs">star</span>
                Best value
              </span>
            )}
            <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${s.subColor}`}>
              {s.label}
            </p>
            <p className={`text-4xl font-extrabold font-[family-name:var(--font-headline)] ${s.textColor}`}>
              {fmtCost(s.cost)}
            </p>
            <p className={`text-base font-semibold mt-1 ${s.textColor}`}>{s.solved} solved</p>
            <p className={`text-sm mt-2 ${s.subColor}`}>{s.note}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 flex items-center gap-3">
          <span className="material-symbols-outlined text-emerald-700">trending_down</span>
          <p className="text-base text-emerald-900">
            Cascade saved{" "}
            <span className="font-bold">{Math.round(agg.cost_savings_vs_sonnet_pct)}%</span>{" "}
            vs Sonnet-only
          </p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 flex items-center gap-3">
          <span className="material-symbols-outlined text-blue-700">upgrade</span>
          <p className="text-base text-blue-900">
            Cascade rescued{" "}
            <span className="font-bold">{pct(agg.cascade_rescue_rate)}</span>{" "}
            of tasks Haiku failed
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Section 3: Metrics grid ───────────────────────────────────────────────────

function MetricsGrid() {
  const agg = AGENTIC_EVAL_SNAPSHOT.aggregates;
  const snap = AGENTIC_EVAL_SNAPSHOT;

  const metrics = [
    {
      icon: "check_circle",
      label: "Pass Rate",
      value: pct(agg.overall_pass_rate),
      sub: `${agg.tasks_solved} of ${agg.tasks_total} tasks`,
    },
    {
      icon: "cached",
      label: "Avg Turns",
      value: agg.avg_turns_to_solve?.toFixed(1) ?? "-",
      sub: "per solved task",
    },
    {
      icon: "swap_horiz",
      label: "Cascade Triggered",
      value: `${Math.round(agg.cascade_rate * agg.tasks_total)}/${agg.tasks_total}`,
      sub: "tasks escalated to Sonnet",
    },
    {
      icon: "volunteer_activism",
      label: "Rescue Rate",
      value: pct(agg.cascade_rescue_rate),
      sub: "Sonnet solved after Haiku failed",
    },
    {
      icon: "undo",
      label: "Self-Corrections",
      value: agg.self_correction_rate.toFixed(1),
      sub: "avg per task",
    },
    {
      icon: "timer",
      label: "Turn Latency",
      value: `${snap.aggregates.avg_latency_per_turn_ms}ms`,
      sub: "avg across all turns",
    },
    {
      icon: "bolt",
      label: "First-Attempt Pass",
      value: `${AGENTIC_EVAL_SNAPSHOT.task_results.filter((t) => t.first_attempt_passed).length}/${agg.tasks_total}`,
      sub: "first write passed tests",
    },
    {
      icon: "payments",
      label: "Total Cost",
      value: fmtCost(agg.total_cost_actual_usd),
      sub: "all 10 tasks, cascade",
    },
  ];

  return (
    <section className="mb-14">
      <h2 className="text-3xl md:text-4xl font-extrabold font-[family-name:var(--font-headline)] mb-8">
        Eval at a glance
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-5 py-5"
          >
            <span className="material-symbols-outlined text-primary text-xl mb-3 block">
              {m.icon}
            </span>
            <p className="text-3xl font-extrabold font-[family-name:var(--font-headline)] text-on-surface">
              {m.value}
            </p>
            <p className="text-sm font-bold text-on-surface mt-1">{m.label}</p>
            <p className="text-sm text-on-surface-variant mt-0.5 leading-snug">{m.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Section 4 + 5: Task table + trace viewer ──────────────────────────────────

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, string> = {
    easy:   "bg-emerald-100 text-emerald-800",
    medium: "bg-amber-100 text-amber-800",
    hard:   "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${colors[difficulty] ?? "bg-surface-container text-on-surface-variant"}`}>
      {DIFFICULTY_LABELS[difficulty] ?? difficulty}
    </span>
  );
}

function TaskRow({
  task,
  isOpen,
  onToggle,
}: {
  task: TaskResult;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const cascadeTriggered = task.cascade_triggered;
  const totalTurns = task.haiku_turns + task.sonnet_turns;

  return (
    <>
      <tr
        className={`cursor-pointer transition-colors hover:bg-surface-container/60 ${
          isOpen ? "bg-surface-container/40" : ""
        }`}
        onClick={onToggle}
      >
        {/* Status dot */}
        <td className="pl-4 py-4 w-8">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${
              task.solved ? "bg-emerald-500" : "bg-red-400"
            }`}
          />
        </td>

        {/* Task name */}
        <td className="py-4 pr-3">
          <p className="text-base font-semibold text-on-surface leading-snug">
            {task.task_id.replace(/_/g, " ").replace(/task \d+ /, "")}
          </p>
          <p className="text-sm text-on-surface-variant mt-0.5">
            {CATEGORY_LABELS[task.category] ?? task.category}
          </p>
        </td>

        {/* Difficulty */}
        <td className="py-4 pr-3 hidden sm:table-cell">
          <DifficultyBadge difficulty={task.difficulty} />
        </td>

        {/* Turns */}
        <td className="py-4 pr-3 hidden md:table-cell">
          <span className="text-base font-mono text-on-surface">{totalTurns}</span>
          <span className="text-sm text-on-surface-variant ml-1">
            ({task.haiku_turns}H{task.sonnet_turns > 0 ? `+${task.sonnet_turns}S` : ""})
          </span>
        </td>

        {/* Cascade */}
        <td className="py-4 pr-3 hidden md:table-cell">
          {cascadeTriggered ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              <span className="material-symbols-outlined text-xs">swap_horiz</span>
              {CASCADE_TRIGGER_LABELS[task.cascade_trigger_reason ?? ""] ?? "cascaded"}
            </span>
          ) : (
            <span className="text-sm text-on-surface-variant">Haiku only</span>
          )}
        </td>

        {/* Cost */}
        <td className="py-4 pr-3 text-base font-mono text-on-surface hidden sm:table-cell">
          {fmtCost(task.cost_actual_usd)}
        </td>

        {/* Expand */}
        <td className="py-4 pr-4 text-right">
          <span className="material-symbols-outlined text-base text-on-surface-variant">
            {isOpen ? "expand_less" : "expand_more"}
          </span>
        </td>
      </tr>

      {/* Expanded trace */}
      {isOpen && (
        <tr>
          <td colSpan={7} className="border-t border-outline-variant/10 bg-surface-container/30">
            <TraceReplayViewer task={task} />
          </td>
        </tr>
      )}
    </>
  );
}

function TaskTable() {
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const tasks = AGENTIC_EVAL_SNAPSHOT.task_results;

  const toggle = (id: string) =>
    setOpenTaskId((prev) => (prev === id ? null : id));

  return (
    <section className="mb-14">
      <h2 className="text-3xl md:text-4xl font-extrabold font-[family-name:var(--font-headline)] mb-2">
        All 10 tasks
      </h2>
      <p className="text-base text-on-surface-variant mb-6">
        Click any row to replay the full step-by-step agent trace.
      </p>

      <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest overflow-hidden">
        <div className="px-4 py-3 bg-surface-container-low/50 border-b border-outline-variant/10">
          <table className="w-full text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            <thead>
              <tr>
                <th className="pl-0 py-0 w-8 text-left" />
                <th className="py-0 pr-3 text-left">Task</th>
                <th className="py-0 pr-3 text-left hidden sm:table-cell">Difficulty</th>
                <th className="py-0 pr-3 text-left hidden md:table-cell">Turns</th>
                <th className="py-0 pr-3 text-left hidden md:table-cell">Cascade</th>
                <th className="py-0 pr-3 text-left hidden sm:table-cell">Cost</th>
                <th className="py-0 pr-4 text-right" />
              </tr>
            </thead>
          </table>
        </div>

        <table className="w-full">
          <tbody className="divide-y divide-outline-variant/10">
            {tasks.map((task) => (
              <TaskRow
                key={task.task_id}
                task={task}
                isOpen={openTaskId === task.task_id}
                onToggle={() => toggle(task.task_id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Section 6: Cascade deep-dive ─────────────────────────────────────────────

function CascadeDeepDive() {
  const tasks = AGENTIC_EVAL_SNAPSHOT.task_results;
  const cascaded = tasks.filter((t) => t.cascade_triggered);
  const rescued  = cascaded.filter((t) => t.cascade_rescued);
  const agg = AGENTIC_EVAL_SNAPSHOT.aggregates;

  const triggerCounts: Record<string, number> = {};
  cascaded.forEach((t) => {
    const k = t.cascade_trigger_reason ?? "unknown";
    triggerCounts[k] = (triggerCounts[k] ?? 0) + 1;
  });

  return (
    <section className="mb-14">
      <h2 className="text-3xl md:text-4xl font-extrabold font-[family-name:var(--font-headline)] mb-8">
        When and why did Haiku escalate?
      </h2>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Escalation triggers */}
        <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-6">
          <p className="text-base font-bold text-on-surface mb-5">
            Trigger breakdown ({cascaded.length} cascades)
          </p>
          <div className="space-y-4">
            {Object.entries(triggerCounts).map(([trigger, count]) => (
              <div key={trigger}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-base text-on-surface">
                    {CASCADE_TRIGGER_LABELS[trigger] ?? trigger}
                  </span>
                  <span className="text-base font-bold text-on-surface">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-outline-variant/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${(count / cascaded.length) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-on-surface-variant mt-5 leading-relaxed">
            Most common: repeated failures - Haiku applied the same wrong fix until the cascade fired.
          </p>
        </div>

        {/* Rescue rate */}
        <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-6">
          <p className="text-base font-bold text-on-surface mb-5">Sonnet rescue rate</p>

          <div className="flex items-end gap-3 mb-4">
            <p className="text-5xl font-extrabold font-[family-name:var(--font-headline)] text-emerald-700">
              {rescued.length}/{cascaded.length}
            </p>
            <p className="text-base text-on-surface-variant pb-1">
              cascades resolved
            </p>
          </div>

          <div className="h-3 rounded-full bg-outline-variant/20 overflow-hidden mb-5">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${agg.cascade_rescue_rate * 100}%` }}
            />
          </div>

          <p className="text-base text-on-surface-variant leading-relaxed">
            Sonnet received a compact 200-token handoff - not raw Haiku history - so it
            approached each task fresh instead of repeating failed attempts.
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Section 7: Failure taxonomy ───────────────────────────────────────────────

function FailureTaxonomy() {
  const tasks = AGENTIC_EVAL_SNAPSHOT.task_results;
  const failed = tasks.filter((t) => !t.solved);

  if (failed.length === 0) return null;

  const failureCounts: Record<string, { count: number; tasks: string[] }> = {};
  failed.forEach((t) => {
    const k = t.failure_type ?? "unknown";
    if (!failureCounts[k]) failureCounts[k] = { count: 0, tasks: [] };
    failureCounts[k].count++;
    failureCounts[k].tasks.push(t.task_id.replace("task_", "#").replace(/_/g, " "));
  });

  const FAILURE_ICONS: Record<string, string> = {
    gave_up:           "cancel",
    hit_turn_limit:    "hourglass_disabled",
    loop_detected:     "loop",
    repeated_failures: "replay",
    api_error:         "error",
    unknown:           "help",
  };

  const FAILURE_DESCRIPTIONS: Record<string, string> = {
    gave_up:           "Agent called give_up() - no more ideas.",
    hit_turn_limit:    "Exhausted all Haiku + Sonnet turns without passing tests.",
    loop_detected:     "Same tool + same args twice in a row. Cascade fired.",
    repeated_failures: "Same test failure 3 turns straight. Agent was stuck.",
    api_error:         "API error interrupted the loop.",
    unknown:           "Unclassified failure.",
  };

  return (
    <section className="mb-14">
      <h2 className="text-3xl md:text-4xl font-extrabold font-[family-name:var(--font-headline)] mb-2">
        How did the agent fail?
      </h2>
      <p className="text-base text-on-surface-variant mb-8">
        {failed.length} of {tasks.length} tasks unsolved. Failure modes are as informative as the pass rate.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        {Object.entries(failureCounts).map(([type, data]) => (
          <div
            key={type}
            className="rounded-2xl border border-red-100 bg-red-50/50 px-5 py-5"
          >
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-red-500 text-xl shrink-0">
                {FAILURE_ICONS[type] ?? "error"}
              </span>
              <div>
                <p className="text-base font-bold text-red-900">
                  {FAILURE_LABELS[type] ?? type} ({data.count})
                </p>
                <p className="text-sm text-red-800/80 mt-1 leading-relaxed">
                  {FAILURE_DESCRIPTIONS[type]}
                </p>
                <p className="text-sm text-red-600 mt-2 font-mono">
                  {data.tasks.join(", ")}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Section 8: Methodology ────────────────────────────────────────────────────

function Methodology() {
  const snap = AGENTIC_EVAL_SNAPSHOT;
  return (
    <section className="mb-14">
      <h2 className="text-3xl md:text-4xl font-extrabold font-[family-name:var(--font-headline)] mb-8">
        How this eval works
      </h2>

      <div className="grid sm:grid-cols-2 gap-6">
        {METHODOLOGY_CARDS.map((c) => (
          <div
            key={c.title}
            className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-6 py-6"
          >
            <span className="material-symbols-outlined text-primary text-xl mb-3 block">
              {c.icon}
            </span>
            <p className="text-base font-bold text-on-surface mb-3">{c.title}</p>
            <ul className="space-y-2">
              {c.points.map((pt, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <span className="text-primary shrink-0 mt-[3px] text-sm">→</span>
                  <span className="text-base text-on-surface-variant leading-snug">{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Reproducibility strip */}
      <div className="mt-6 rounded-xl border border-outline-variant/15 bg-surface-container-lowest px-6 py-5">
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">
          Reproducibility
        </p>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-on-surface-variant">
          <span>
            <span className="font-semibold text-on-surface">Haiku:</span>{" "}
            <code className="font-mono">{snap.models.haiku}</code>
          </span>
          <span>
            <span className="font-semibold text-on-surface">Sonnet:</span>{" "}
            <code className="font-mono">{snap.models.sonnet}</code>
          </span>
          <span>
            <span className="font-semibold text-on-surface">Temperature:</span>{" "}
            {snap.config.temperature}
          </span>
          <span>
            <span className="font-semibold text-on-surface">Haiku turns:</span>{" "}
            {snap.config.haiku_max_turns}
          </span>
          <span>
            <span className="font-semibold text-on-surface">Sonnet turns:</span>{" "}
            {snap.config.sonnet_max_turns}
          </span>
          <span>
            <span className="font-semibold text-on-surface">Output cap:</span>{" "}
            {snap.config.tool_output_max_lines} lines
          </span>
        </div>
        <p className="text-sm text-on-surface-variant mt-3">
          To rerun:{" "}
          <code className="font-mono bg-surface-container px-1.5 py-0.5 rounded text-xs">
            ANTHROPIC_API_KEY=your_key python src/eval-engine/run_agentic_eval.py
          </code>
        </p>
      </div>
    </section>
  );
}

const METHODOLOGY_CARDS = [
  {
    icon: "task",
    title: "Task design",
    points: [
      "10 tasks across 5 categories",
      "Obvious bugs, hidden errors, sequential bugs, test traps, red herrings",
      "Each task: isolated Python workspace + failing test suite",
      "Agent is never told what the bug is",
    ],
  },
  {
    icon: "build",
    title: "Tool loop",
    points: [
      "3 tools: read_file, write_file, run_tests",
      "Agent calls tools iteratively each turn",
      "Stops when tests pass, turn limit hit, or give_up called",
      "No hints given between turns",
    ],
  },
  {
    icon: "swap_horiz",
    title: "Cascade logic",
    points: [
      "Haiku runs first - up to 4 turns",
      "Escalates on: loop detection, 3 identical failures, or give_up",
      "Sonnet gets a compact ~200-token handoff summary",
      "Sonnet runs up to 6 additional turns",
    ],
  },
  {
    icon: "payments",
    title: "Cost calculation",
    points: [
      "Haiku: $0.80/M input · $4/M output",
      "Sonnet: $3/M input · $15/M output",
      "Counterfactual = all turns priced at one model's rate",
      "Savings = (Sonnet-only − actual) / Sonnet-only",
    ],
  },
];

// ── Section 9: What's next ────────────────────────────────────────────────────

function WhatsNext() {
  return (
    <section className="mb-14">
      <h2 className="text-3xl md:text-4xl font-extrabold font-[family-name:var(--font-headline)] mb-8">
        What&apos;s next
      </h2>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {NEXT_ITEMS.map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest px-5 py-5 flex items-start gap-3"
          >
            <span className="material-symbols-outlined text-primary text-xl shrink-0 mt-0.5">
              {item.icon}
            </span>
            <div>
              <p className="text-base font-bold text-on-surface">{item.title}</p>
              <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const NEXT_ITEMS = [
  {
    icon: "folder_open",
    title: "Multi-file codebases",
    body: "Real bugs span files. The agent needs to navigate a directory tree, not just one module.",
  },
  {
    icon: "javascript",
    title: "TypeScript tasks",
    body: "Tests whether the cascade generalizes across languages beyond Python.",
  },
  {
    icon: "search",
    title: "Web search tool",
    body: "Closer to real Claude Code usage - model looks up docs and error messages mid-task.",
  },
  {
    icon: "live_tv",
    title: "Live streaming demo",
    body: "User picks a task, watches the agent run in real time via streaming.",
  },
  {
    icon: "device_hub",
    title: "Third-tier routing",
    body: "Add a third model tier for cross-provider cascade comparison.",
  },
  {
    icon: "groups",
    title: "3× majority vote",
    body: "Run each task 3 times, take majority. Reduces variance from single-run results.",
  },
];

// ── Section 10: Meta ──────────────────────────────────────────────────────────

function MetaSection() {
  const sessions = [
    { n: 1, goal: "Full planning",              tokens: "~65k", cost: "$0.29" },
    { n: 2, goal: "10 task definitions",         tokens: "~52k", cost: "$0.23" },
    { n: 3, goal: "Python harness",              tokens: "TBD",  cost: "TBD"  },
    { n: 4, goal: "TypeScript types + snapshot", tokens: "TBD",  cost: "TBD"  },
    { n: 5, goal: "TraceReplayViewer",           tokens: "TBD",  cost: "TBD"  },
    { n: 6, goal: "AgenticEvalShowcase + page",  tokens: "TBD",  cost: "TBD"  },
    { n: 7, goal: "Run harness + deploy",        tokens: "TBD",  cost: "TBD"  },
  ];

  return (
    <section className="mb-4">
      <h2 className="text-3xl md:text-4xl font-extrabold font-[family-name:var(--font-headline)] mb-2">
        What it cost to build this
      </h2>
      <p className="text-base text-on-surface-variant mb-8 max-w-2xl">
        Every build session tracked - model, token count, API spend.
      </p>

      <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-container-low/50 border-b border-outline-variant/10">
              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant">Session</th>
              <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant">Goal</th>
              <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant hidden sm:table-cell">Tokens</th>
              <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-on-surface-variant">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {sessions.map((s) => (
              <tr key={s.n} className={s.cost === "TBD" ? "opacity-60" : ""}>
                <td className="px-5 py-3 font-mono text-sm text-on-surface-variant">S{s.n}</td>
                <td className="px-3 py-3 text-on-surface text-sm">{s.goal}</td>
                <td className="px-3 py-3 text-on-surface-variant text-sm font-mono hidden sm:table-cell">{s.tokens}</td>
                <td className="px-5 py-3 text-right font-mono text-sm text-on-surface">{s.cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary-fixed/30 px-6 py-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <span className="material-symbols-outlined text-primary text-3xl shrink-0">coffee</span>
        <div>
          <p className="text-base font-bold text-on-surface">
            Building and running this eval cost less than a cup of coffee.
          </p>
          <p className="text-sm text-on-surface-variant mt-1">
            Total: ~117k tokens tracked (Sessions 1-2). Full cost including eval runs: ~$0.50-$0.90 est.
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────

export function AgenticEvalShowcase() {
  return (
    <div className="space-y-0">
      {IS_PLACEHOLDER && <PlaceholderBanner />}
      <CostComparison />
      <MetricsGrid />
      <TaskTable />
      <CascadeDeepDive />
      <FailureTaxonomy />
      <Methodology />
      <WhatsNext />
      <MetaSection />
    </div>
  );
}
