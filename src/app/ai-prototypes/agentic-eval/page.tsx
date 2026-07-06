"use client";

import Link from "next/link";
import { AgenticEvalShowcase, HeroStatChips } from "@/components/agentic-eval/AgenticEvalShowcase";
import { IS_PLACEHOLDER } from "@/lib/agentic-eval/publicSnapshot";

export default function AgenticEvalPage() {
  return (
    <main className="pt-28 pb-24 px-6 md:px-12 max-w-7xl mx-auto">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <header className="mb-14 max-w-5xl">
        <div className="flex flex-col items-start gap-3 mb-6">
          <Link
            href="/ai-prototypes"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] leading-none">arrow_back</span>
            AI Prototypes
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-fixed text-on-primary-fixed text-xs font-bold tracking-widest uppercase rounded-full">
              <span className="material-symbols-outlined text-base leading-none">hub</span>
              agentic eval · research
            </span>
            <Link
              href="/ai-prototypes/agentic-eval/product-doc"
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-primary/30 text-primary text-xs font-bold tracking-wide rounded-full hover:bg-primary/5 transition-colors"
            >
              <span className="material-symbols-outlined text-sm leading-none">description</span>
              View Product Doc
            </Link>
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1.05] font-[family-name:var(--font-headline)] mb-6">
          Agent-Gate:{" "}
          <span className="text-gradient">Agentic Eval</span>
        </h1>

        <p className="text-xl md:text-2xl text-on-surface-variant leading-relaxed mb-8 max-w-3xl">
          Can Claude autonomously fix broken code without being told what&apos;s wrong?
          A 10-task harness measuring multi-turn tool use, cascade routing, and cost efficiency.
        </p>

        {/* Stat chips */}
        <HeroStatChips />

        <p className="text-sm text-on-surface-variant mt-4">
          {IS_PLACEHOLDER ? (
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-amber-600">hourglass_top</span>
              Placeholder data - harness not yet run
            </span>
          ) : (
            "Results from latest local run"
          )}
        </p>
      </header>

      {/* ── Why this exists ──────────────────────────────────────────────── */}
      <section className="mb-14 max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-5">
          Why this benchmark exists
        </p>
        <div className="grid sm:grid-cols-3 gap-5">
          {WHY_CARDS.map((c) => (
            <div
              key={c.title}
              className="rounded-xl border border-outline-variant/15 bg-surface-container-low/50 px-6 py-6"
            >
              <p className="text-lg font-bold text-on-surface mb-2">{c.title}</p>
              <p className="text-base text-on-surface-variant leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Main showcase ────────────────────────────────────────────────── */}
      <AgenticEvalShowcase />

    </main>
  );
}

const WHY_CARDS = [
  {
    title: "Single-shot evals miss the loop",
    body: "HumanEval asks: can the model write correct code once? Agent-Gate asks: can it figure out what's wrong, fix it, and keep going?",
  },
  {
    title: "SWE-bench is too heavy to run",
    body: "2,294 tasks, Docker, hours of compute. Agent-Gate runs end-to-end in under 10 minutes with no infrastructure.",
  },
  {
    title: "Cascade efficiency is unmeasured",
    body: "No benchmark directly measures whether routing easy tasks to cheap models actually pays off. This one does.",
  },
];
