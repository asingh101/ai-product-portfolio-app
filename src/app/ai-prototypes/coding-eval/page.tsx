"use client";

import Link from "next/link";
import { CodingEvalShowcase } from "@/components/coding-eval/CodingEvalShowcase";
import { CODING_EVAL_SNAPSHOT } from "@/lib/coding-eval/publicSnapshot";

export default function CodingEvalPage() {
  const snap = CODING_EVAL_SNAPSHOT;
  const sonnet = snap.overallScores["claude-sonnet-4-6"];
  const haiku = snap.overallScores["claude-haiku-4-5"];

  return (
    <main className="pt-28 pb-24 px-6 md:px-12 max-w-7xl mx-auto">

      {/* ── Hero header ─────────────────────────────────────────────────── */}
      <header className="mb-12 max-w-5xl">
        <div className="flex flex-col items-start gap-3 mb-6">
          <Link
            href="/ai-prototypes"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-on-surface-variant hover:text-primary"
          >
            <span className="material-symbols-outlined text-[18px] leading-none">arrow_back</span>
            AI Prototypes
          </Link>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-fixed text-on-primary-fixed text-xs font-bold tracking-widest uppercase rounded-full">
            <span className="material-symbols-outlined text-base leading-none">analytics</span>
            eval · research
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter leading-[1.1] font-[family-name:var(--font-headline)] mb-6">
          Claude Code{" "}
          <span className="text-gradient">Coding Eval</span>
        </h1>

        <p className="text-xl text-on-surface-variant leading-relaxed mb-6">
          I built a 25-task benchmark to test how Claude models handle real developer work:
          fixing bugs, adding features, refactoring code, following vague instructions, and
          tracing multi-step errors. Most coding benchmarks test whether a model can solve
          puzzles. This one tests whether it behaves like a thoughtful developer.
        </p>

        {/* Quick stat */}
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-surface-container-low border border-outline-variant/15 text-sm">
          <span className="material-symbols-outlined text-primary text-base">leaderboard</span>
          <span className="text-on-surface-variant">
            Sonnet 4.6{" "}
            <span className="font-bold text-on-surface">
              {sonnet.passed}/{sonnet.total} ({sonnet.pct}%)
            </span>
            {" · "}Haiku 4.5{" "}
            <span className="font-bold text-on-surface">
              {haiku.passed}/{haiku.total} ({haiku.pct}%)
            </span>
          </span>
        </div>
      </header>

      {/* ── Why this exists ──────────────────────────────────────────────── */}
      <section className="mb-12 max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-4">
          Why this benchmark exists
        </p>
        <div className="grid sm:grid-cols-3 gap-6">
          {WHY_CARDS.map((c) => (
            <div
              key={c.title}
              className="rounded-xl border border-outline-variant/15 bg-surface-container-low/50 px-6 py-6"
            >
              <p className="text-base font-bold text-on-surface mb-2">{c.title}</p>
              <p className="text-sm text-on-surface-variant leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Main showcase ────────────────────────────────────────────────── */}
      <CodingEvalShowcase />

    </main>
  );
}

const WHY_CARDS = [
  {
    title: "HumanEval is saturated",
    body: "Models score 90%+ — it can't discriminate between frontier models anymore. Also likely contaminated.",
  },
  {
    title: "SWE-bench is complex",
    body: "2,294 tasks across 12 Python repos. Useful but expensive to run and conflates retrieval skill with coding skill.",
  },
  {
    title: "None test the loop",
    body: "No major benchmark tests whether a model asks for clarification, handles ambiguity, or catches multi-step bugs.",
  },
];
