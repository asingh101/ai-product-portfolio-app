"use client";

import Link from "next/link";
import {
  DocSection,
  DocTable,
  DocCallout,
  StatGrid,
  DocDiagram,
} from "@/components/ai-prototypes/tech-docs/DocPrimitives";

const TOC = [
  { id: "problem",      label: "The problem" },
  { id: "architecture", label: "How it works" },
  { id: "task-design",  label: "Task design" },
  { id: "findings",     label: "Key findings" },
  { id: "decisions",    label: "Design decisions" },
  { id: "proof",        label: "PM signal" },
  { id: "next",         label: "What's next" },
];

function ProductDocTOC() {
  return (
    <nav className="space-y-1" aria-label="Product doc sections">
      {TOC.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className="block px-3 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

export default function AgenticEvalProductDocPage() {
  return (
    <main className="pt-28 pb-24 px-6 md:px-12 max-w-7xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="mb-12 max-w-5xl">
        <div className="flex flex-col items-start gap-3 mb-6">
          <Link
            href="/ai-prototypes/agentic-eval"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] leading-none">arrow_back</span>
            Agent-Gate: Agentic Eval
          </Link>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-fixed text-on-primary-fixed text-xs font-bold tracking-widest uppercase rounded-full">
            <span className="material-symbols-outlined text-base leading-none">hub</span>
            product doc · agentic eval
          </span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1.05] font-[family-name:var(--font-headline)] mb-6 whitespace-nowrap">
          The thinking behind{" "}
          <span className="text-gradient">Agent&#8209;Gate</span>
        </h1>
        <p className="text-lg text-on-surface-variant leading-relaxed mb-6">
          Every design decision - why this eval exists, how the cascade works,
          what 10/10 tasks solved at $0.29 actually means, and where it goes next.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/ai-prototypes/agentic-eval"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-base">hub</span>
            View live eval results
          </Link>
          <Link
            href="/ai-prototypes"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-sm font-bold hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-base">grid_view</span>
            All prototypes
          </Link>
        </div>
      </header>

      {/* ── Body: sidebar + content ─────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-12">

        {/* Sticky sidebar */}
        <aside className="lg:w-56 shrink-0">
          <div className="lg:sticky lg:top-28 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3 px-3">
              On this page
            </p>
            <ProductDocTOC />
          </div>
        </aside>

        {/* Main content */}
        <article className="max-w-3xl">

          {/* ── Problem ────────────────────────────────────────────────────── */}
          <DocSection id="problem" title="The problem">
            <p>
              The field has two dominant coding eval paradigms: single-shot benchmarks (HumanEval, MBPP,
              our own{" "}
              <Link href="/ai-prototypes/coding-eval" className="text-primary font-bold hover:underline">
                Coding Eval
              </Link>
              ) and large agentic benchmarks (SWE-bench). Both leave a gap.
            </p>
            <DocCallout>
              "Can the model write a correct fix in one try?" is a different question from "Can the model
              figure out what&apos;s broken, try something, learn from the failure, and keep going?"
            </DocCallout>
            <p>
              Single-shot evals are saturated - frontier models score 90%+ and the signal is gone.
              SWE-bench measures the right behavior but at the wrong scale: 2,294 tasks, Docker
              containers, hours of compute. It&apos;s hard to run, hard to iterate on, and hard to explain.
            </p>
            <DocTable
              headers={["Benchmark", "What it measures", "The gap"]}
              rows={[
                ["HumanEval / MBPP", "One-shot code correctness", "Saturated. Doesn't measure what happens after a wrong guess."],
                ["SWE-bench", "Multi-turn agentic repair on real repos", "2,294 tasks, Docker, hours of runtime. Hard to iterate and explain."],
                ["Agent-Gate", "Multi-turn tool-use loop at small scale", "Fills the middle: agentic behavior, no infrastructure, runs in 10 min."],
              ]}
            />
            <StatGrid
              items={[
                { value: "10", label: "Tasks" },
                { value: "154s", label: "Total runtime" },
                { value: "$0.29", label: "Total API cost" },
              ]}
            />
          </DocSection>

          {/* ── Architecture ───────────────────────────────────────────────── */}
          <DocSection id="architecture" title="How it works">
            <p>
              Agent-Gate is a two-tier cascade system. Every task starts with Haiku (fast, cheap).
              If Haiku gets stuck, the harness escalates to Sonnet (capable, expensive) with a compact
              handoff. This mirrors the tiered routing pattern used in production AI products to balance
              cost and capability.
            </p>

            <DocDiagram title="Agent loop · per task">
              <div className="space-y-0">
                {[
                  { n: "1", title: "Task loaded into isolated workspace", body: "Starter code + failing tests copied into a temp directory via Python's tempfile. No Docker required.", color: "bg-blue-100 text-blue-800" },
                  { n: "2", title: "Haiku runs up to 4 turns", body: "Haiku 4.5 gets the task description and 3 tools. Temperature 0.0. Tool output truncated to 50 lines.", color: "bg-blue-100 text-blue-800" },
                  { n: "3", title: "Cascade check after each turn", body: "Loop detected? Same failure 3× in a row? Explicit give_up? Turn limit hit? Any trigger fires escalation.", color: "bg-amber-100 text-amber-800" },
                  { n: "4", title: "Compact handoff to Sonnet", body: "Sonnet gets a ~200-token structured summary - not 2,000 tokens of raw Haiku history. Files touched + last test output.", color: "bg-emerald-100 text-emerald-800" },
                  { n: "5", title: "Sonnet runs up to 6 more turns", body: "Explicitly told: don't repeat what Haiku tried. Fresh approach, same 3 tools.", color: "bg-emerald-100 text-emerald-800" },
                ].map((s, i, arr) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${s.color}`}>{s.n}</div>
                      {i < arr.length - 1 && <div className="w-px flex-1 bg-outline-variant/20 my-1 min-h-[16px]" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-bold text-on-surface">{s.title}</p>
                      <p className="text-sm text-on-surface-variant mt-0.5 leading-relaxed">{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </DocDiagram>

            <p className="font-bold text-on-surface mb-2">The three tools</p>
            <DocTable
              headers={["Tool", "What it does", "Restriction"]}
              rows={[
                ["read_file", "Read any file in the workspace - code or tests", "None - model can read freely"],
                ["write_file", "Overwrite a file with new content", "Restricted to starter/ only - cannot touch tests"],
                ["run_tests", "Run pytest, return stdout + exit code", "Exit code 0 = task solved"],
              ]}
            />

            <p className="font-bold text-on-surface mt-6 mb-2">Cascade trigger conditions</p>
            <DocTable
              headers={["Trigger", "Condition", "Why"]}
              rows={[
                ["Loop detection", "Same tool + same args called twice in a row", "Model is spinning - force escalation"],
                ["Repeated failures", "Identical test output 3 turns straight", "No progress - escalation is correct"],
                ["Explicit give_up", "Model calls give_up() tool", "Honest signal - rare but respected"],
                ["Turn limit", "Haiku used all 4 turns", "Budget exhausted - Sonnet gets remaining turns"],
              ]}
            />
          </DocSection>

          {/* ── Task design ────────────────────────────────────────────────── */}
          <DocSection id="task-design" title="Task design">
            <p>
              Tasks are the heart of any eval. The 5 categories were designed to test specific failure
              modes - not just "can the model fix bugs" but "where does model reasoning break down?"
              Two tasks per category, 10 total. The model is told only that the tests are failing.
            </p>
            <DocCallout>
              The agent is never told what the bug is. It must explore, diagnose, fix, and verify -
              the same loop Claude Code runs in practice.
            </DocCallout>
            <DocTable
              headers={["Category", "Difficulty", "What it tests", "The trap"]}
              rows={[
                ["Single Bug - Obvious", "Easy", "Basic tool-use loop execution", "Error message points directly at the bug - sanity check"],
                ["Single Bug - Hidden", "Medium", "Exploration before acting", "Bug is a logic error; error message is misleading"],
                ["Two Bugs - Sequential", "Medium", "Persistence after partial success", "Bug B only surfaces after Bug A is fixed"],
                ["Test Understanding", "Hard", "Reading tests as requirements, not gates", "Code is correct by one reading; test expects different behavior"],
                ["Red Herring", "Hard", "Recovery from a wrong first diagnosis", "Obvious-looking issue isn't the real bug - fixing it changes nothing"],
              ]}
            />
          </DocSection>

          {/* ── Findings ───────────────────────────────────────────────────── */}
          <DocSection id="findings" title="Key findings">
            <p>
              Real run: July 5, 2026. 154 seconds. $0.2946 total. These findings reflect actual
              model behavior - not estimates.
            </p>
            <StatGrid
              items={[
                { value: "10/10", label: "Tasks solved" },
                { value: "90%",   label: "Cascade rate" },
                { value: "40.8%", label: "Cost saved vs Sonnet-only" },
              ]}
            />
            <DocTable
              headers={["Finding", "Detail"]}
              rows={[
                [
                  "10/10 solved - cascade worked perfectly",
                  "Every task was ultimately solved. Sonnet rescued all 9 tasks where Haiku hit its turn limit. The cascade trigger fired correctly every time.",
                ],
                [
                  "Haiku hit its turn limit on 9/10 tasks",
                  "Only task_01 (single bug, obvious) was solved by Haiku alone. This suggests the 4-turn budget is tight for most tasks, or Haiku needs a more directive initial exploration prompt.",
                ],
                [
                  "40.8% cost savings vs Sonnet-only",
                  "$0.29 actual vs $0.50 if everything ran on Sonnet from the start. The cascade saves money even with a 90% escalation rate - because Haiku's cheap exploration turns are far less expensive than Sonnet's.",
                ],
                [
                  "Self-correction rate: 0.0",
                  "The model committed to its first fix per phase rather than iterating in-phase. The cascade itself is doing the correction work - escalation replaces in-phase retry. Worth investigating in v3.",
                ],
                [
                  "Sonnet rescue rate: 100%",
                  "Every task that escalated to Sonnet was solved. The compact handoff summary was sufficient context - Sonnet didn't need raw Haiku history to take a different approach.",
                ],
              ]}
            />
            <DocCallout>
              The cascade saves 40.8% vs Sonnet-only - even with a 90% escalation rate. The math
              works because Haiku turns are ~6× cheaper than Sonnet turns.
            </DocCallout>
          </DocSection>

          {/* ── Design decisions ───────────────────────────────────────────── */}
          <DocSection id="decisions" title="Design decisions">
            <p>
              Every decision involved a real tradeoff. These are the six most important ones -
              what was chosen, why, and what was left on the table.
            </p>
            <DocTable
              headers={["Decision", "Choice", "Why", "Tradeoff"]}
              rows={[
                [
                  "No Docker",
                  "Python tempfile + subprocess",
                  "Sufficient isolation for single-file tasks. Runs anywhere Python and pytest are installed.",
                  "Doesn't scale to multi-file codebases that import across directories.",
                ],
                [
                  "Pre-computed results",
                  "Static publicSnapshot.ts",
                  "Live API calls on every page view would cost money and require server infrastructure. Pre-computed is instant and free to serve.",
                  "Results go stale as models update. Noted in methodology.",
                ],
                [
                  "Compact cascade handoff",
                  "~200-token summary to Sonnet",
                  "Sending raw Haiku history (2,000+ tokens) wastes money and risks Sonnet repeating Haiku's mistakes.",
                  "Sonnet loses visibility into Haiku's exact reasoning. In practice the summary is sufficient.",
                ],
                [
                  "Temperature 0.0",
                  "Fully deterministic",
                  "Agentic tool-use decisions need determinism for reproducible results.",
                  "Reduces model creativity - acceptable for tasks with clear correct answers.",
                ],
                [
                  "Single run per task",
                  "No majority vote",
                  "3× majority vote would triple cost ($0.90 vs $0.29). Variance mitigated by temperature 0.0.",
                  "Some run-to-run variance remains. Would address in v3.",
                ],
                [
                  "50-line tool output cap",
                  "Truncate pytest output",
                  "Model only needs the bottom of pytest output - that's where the error is. Saves tokens every turn.",
                  "Model can't see full test history. Last 50 lines always contain the relevant failure.",
                ],
              ]}
            />
          </DocSection>

          {/* ── PM signal ──────────────────────────────────────────────────── */}
          <DocSection id="proof" title="PM signal">
            <p>
              Agent-Gate was built to demonstrate PM fluency across the full stack of AI product work -
              not just writing prompts, but designing evals, understanding cost tradeoffs, and thinking
              about agentic failure modes at depth.
            </p>
            <DocTable
              headers={["JD requirement", "How Agent-Gate addresses it"]}
              rows={[
                ["Personally built agentic evals", "Built from scratch: real tool-use loop, real cascade logic, real pytest grading. Not a framework wrapper."],
                ["SWE-bench-style task suites", "Same concept - broken codebase, autonomous agent, test-driven grading - at a scale that's reproducible and explainable."],
                ["Model performance on coding tasks", "Direct comparison: Haiku vs cascade vs Sonnet-only. Per-task traces show exactly where each model succeeded or failed."],
                ["Cost and latency tradeoffs", "Cascade efficiency metric quantifies savings from tiered routing. Every turn logged with exact tokens, cost, and latency."],
                ["Eval design taste", "5 categories that test failure modes no existing benchmark isolates: loops, red herrings, sequential bugs, test misalignment."],
                ["PM + technical communication", "Same page serves a general visitor (cost comparison, headline numbers) and a technical reviewer (step-by-step trace replay with full token accounting)."],
              ]}
            />
            <DocCallout>
              Building and running this eval end-to-end cost less than a cup of coffee. That&apos;s the point -
              high-signal evals don&apos;t require massive infrastructure.
            </DocCallout>
          </DocSection>

          {/* ── What's next ────────────────────────────────────────────────── */}
          <DocSection id="next" title="What's next">
            <p>
              The current version proves the core concept. v3 would scale it toward something closer
              to production-grade agentic evaluation.
            </p>
            <DocTable
              headers={["Feature", "Why it matters"]}
              rows={[
                ["Multi-file codebases", "Real bugs span files - the agent needs to navigate a directory tree, not just one module."],
                ["TypeScript tasks", "Tests whether the cascade generalizes across languages beyond Python."],
                ["Web search tool", "Closer to real Claude Code usage - model looks up docs and error messages mid-task."],
                ["Live streaming demo", "User picks a task, watches the agent run in real time. Static results become interactive."],
                ["Tighter Haiku prompt", "Investigate whether a more directive initial prompt (read tests first, form hypothesis before writing) improves Haiku's close rate."],
                ["3× majority vote", "Run each task 3 times, take majority. Reduces remaining variance from single-run results."],
              ]}
            />
          </DocSection>

        </article>
      </div>

      {/* ── Footer nav ───────────────────────────────────────────────────────── */}
      <div className="mt-16 pt-8 border-t border-outline-variant/15 flex items-center justify-between flex-wrap gap-4 max-w-3xl lg:ml-[calc(14rem+3rem)]">
        <Link
          href="/ai-prototypes/agentic-eval"
          className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          View eval results
        </Link>
        <Link
          href="/ai-prototypes"
          className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
        >
          All prototypes
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </Link>
      </div>

    </main>
  );
}
