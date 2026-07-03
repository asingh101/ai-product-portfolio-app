"use client";

import {
  CODING_EVAL_SNAPSHOT,
  IS_PLACEHOLDER,
  MODEL_LABELS,
  MODEL_SHORT,
} from "@/lib/coding-eval/publicSnapshot";
import type { ModelId } from "@/lib/coding-eval/types";

export function CodingEvalShowcase() {
  const snap = CODING_EVAL_SNAPSHOT;
  const models = snap.models as ModelId[];
  const topModel = models.reduce((best, m) =>
    snap.overallScores[m].pct > snap.overallScores[best].pct ? m : best
  );

  return (
    <div className="space-y-8">

      {/* Placeholder banner */}
      {IS_PLACEHOLDER && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 flex items-center gap-3">
          <span className="material-symbols-outlined text-amber-700 text-lg shrink-0">hourglass_top</span>
          <p className="text-sm text-amber-900">
            Showing estimated results. Run{" "}
            <code className="bg-amber-100 px-1 rounded text-xs">python src/scripts/run_coding_eval.py</code>{" "}
            locally to generate real scores.
          </p>
        </div>
      )}

      {/* ── Overall scoreboard ────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest overflow-hidden">
        <div className="px-6 py-5 md:px-8 md:py-6 border-b border-outline-variant/10 bg-surface-container-low/40">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
            Overall scores · {snap.totalTasks} tasks
          </p>
          <h2 className="text-xl font-bold font-[family-name:var(--font-headline)] text-on-surface">
            Three-model comparison
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Last run: {snap.runAtLabel}
          </p>
        </div>

        <div className="px-6 py-6 md:px-8 grid sm:grid-cols-3 gap-4">
          {models.map((model) => {
            const s = snap.overallScores[model];
            const isTop = model === topModel;
            return (
              <div
                key={model}
                className={`rounded-2xl border px-5 py-4 ${
                  isTop
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-outline-variant/15 bg-surface-container-low/50"
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  {MODEL_LABELS[model]}
                  {isTop && (
                    <span className="ml-2 text-emerald-700">↑ top</span>
                  )}
                </p>
                <p className="text-3xl font-extrabold font-[family-name:var(--font-headline)] text-on-surface">
                  {s.pct}%
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {s.passed} / {s.total} tasks
                </p>
                {/* Progress bar */}
                <div className="mt-3 h-2 rounded-full bg-outline-variant/20 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isTop ? "bg-emerald-500" : "bg-primary/60"
                    }`}
                    style={{ width: `${s.pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Category breakdown ────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest overflow-hidden">
        <div className="px-6 py-4 md:px-8 border-b border-outline-variant/10 bg-surface-container-low/40">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
            By category
          </p>
          <h2 className="text-xl font-bold font-[family-name:var(--font-headline)] text-on-surface">
            Where each model leads and lags
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-surface-container-low/60">
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Category
                </th>
                {models.map((m) => (
                  <th
                    key={m}
                    className="text-center px-4 py-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                  >
                    {MODEL_SHORT[m]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {snap.categoryScores.map((cat) => {
                const scores = models.map((m) => cat.scores[m]);
                const maxPassed = Math.max(...scores.map((s) => s.passed));
                return (
                  <tr
                    key={cat.category}
                    className="border-b border-outline-variant/10 last:border-0"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-on-surface">{cat.label}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        5 tasks
                      </p>
                    </td>
                    {models.map((m) => {
                      const s = cat.scores[m];
                      const isLeader = s.passed === maxPassed && maxPassed > 0;
                      const pct = Math.round((s.passed / s.total) * 100);
                      return (
                        <td key={m} className="px-4 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                              isLeader
                                ? "bg-emerald-100 text-emerald-800"
                                : s.passed < 3
                                ? "bg-rose-100 text-rose-800"
                                : "bg-surface-container text-on-surface-variant"
                            }`}
                          >
                            {s.passed}/{s.total}
                          </span>
                          <p className="text-[10px] text-on-surface-variant mt-1">
                            {pct}%
                          </p>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Headline finding ──────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-primary/20 bg-primary/5 px-6 py-5 md:px-8">
        <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
          Key finding
        </p>
        <p className="text-base font-medium text-on-surface leading-relaxed">
          {snap.headlineFinding}
        </p>
      </section>

      {/* ── Failure taxonomy ──────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest overflow-hidden">
        <div className="px-6 py-4 md:px-8 border-b border-outline-variant/10 bg-surface-container-low/40">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
            Failure analysis
          </p>
          <h2 className="text-xl font-bold font-[family-name:var(--font-headline)] text-on-surface">
            How models fail, not just that they fail
          </h2>
        </div>
        <div className="px-6 py-5 md:px-8 space-y-4">
          {FAILURE_TAXONOMY.map((f) => (
            <div key={f.type} className="flex gap-4 items-start">
              <span
                className={`shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${f.color}`}
              >
                {f.icon}
              </span>
              <div>
                <p className="text-sm font-bold text-on-surface">{f.label}</p>
                <p className="text-sm text-on-surface-variant leading-relaxed mt-0.5">
                  {f.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Methodology ───────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest overflow-hidden">
        <div className="px-6 py-4 md:px-8 border-b border-outline-variant/10 bg-surface-container-low/40">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
            Methodology
          </p>
          <h2 className="text-xl font-bold font-[family-name:var(--font-headline)] text-on-surface">
            How this was built
          </h2>
        </div>
        <div className="px-6 py-5 md:px-8 space-y-3">
          {snap.methodology.map((item) => (
            <div key={item} className="flex gap-2 items-start">
              <span className="text-primary shrink-0 mt-0.5">•</span>
              <p className="text-sm text-on-surface-variant leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── What's next ───────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest px-6 py-5 md:px-8">
        <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
          v2 — what I'd build next
        </p>
        <p className="text-base text-on-surface-variant leading-relaxed">
          This eval is single-shot: the model gets one attempt to answer and then stops.
          But that is not how real Claude Code usage works. Developers write code, run it,
          read the error, and try again until the tests pass. A version 2 would wrap these
          same 25 tasks in a feedback loop so the model can read files, execute code, see
          what broke, and keep trying. That is what SWE-bench tries to measure, but it
          requires a lot of infrastructure to run and conflates retrieval skill with coding
          skill. A lightweight agentic version of this eval would be a cleaner test of how
          coding agents actually behave in practice.
        </p>
        <p className="text-base text-on-surface-variant leading-relaxed mt-3">
          Other things worth adding: TypeScript tasks alongside Python, system prompt
          experiments to see if explicit instructions reduce silent assumptions on ambiguous
          tasks, and automatic difficulty scaling based on which model tier is being tested.
        </p>
      </section>

    </div>
  );
}

// ── Static failure taxonomy ────────────────────────────────────────────────

const FAILURE_TAXONOMY = [
  {
    type: "wrong-fix",
    label: "Wrong fix",
    icon: "✗",
    color: "bg-rose-100 text-rose-700",
    description:
      "Code was changed but the bug or requirement is still not met. The model diagnosed the symptom, not the cause.",
  },
  {
    type: "regression",
    label: "Regression",
    icon: "↩",
    color: "bg-amber-100 text-amber-700",
    description:
      "Fixed the target issue but broke something that was previously working. This is most common in refactor tasks.",
  },
  {
    type: "spec-misread",
    label: "Spec misread",
    icon: "⊘",
    color: "bg-purple-100 text-purple-700",
    description:
      "Solved a different problem than what was asked. Particularly common when instructions reference an error message.",
  },
  {
    type: "silent-assumption",
    label: "Silent assumption",
    icon: "?",
    color: "bg-blue-100 text-blue-700",
    description:
      "Made a judgment call on an ambiguous task without flagging it. The biggest differentiator between tiers: Sonnet 4.6 surfaces ambiguity more reliably than Haiku on these tasks.",
  },
  {
    type: "non-running",
    label: "Non-running",
    icon: "!",
    color: "bg-surface-container text-on-surface-variant",
    description:
      "Returned code that doesn't execute at all: syntax error, missing import, or malformed output.",
  },
];
