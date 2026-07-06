/**
 * seed-blog-eval-post.mjs
 *
 * Pushes the "Building AI Evals from Scratch" blog post to Firestore.
 * Run this to UPDATE an existing post by slug (upsert) or create fresh.
 *
 * Prerequisites:
 *   1. npm install firebase-admin   (one-time, already done)
 *   2. service account key must be at  src/scripts/serviceAccountKey.json
 *   3. node src/scripts/seed-blog-eval-post.mjs
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("./serviceAccountKey.json");

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

const SLUG = "building-ai-evals-from-scratch";

const POST = {
  slug: SLUG,
  title: "I Built Two AI Evals from Scratch. Here's What I Learned.",
  category: "AI & Technology",
  excerpt:
    "I spent months reading about AI evals and still felt lost. So I built two from scratch: a single-shot coding benchmark and an agentic eval with a model cascade. This is what I actually learned.",
  readTime: "8 min",
  date: "July 2026",
  featured: false,
  status: "published",
  sortOrder: 1,
  thumbnail: "",
  blocks: [

    // ── Intro ─────────────────────────────────────────────────────────────────
    {
      type: "text",
      data: {
        text: "I spent months reading about AI evals and kept getting three different answers to the same question. Every paper had new terminology. Every benchmark had caveats. None of it answered what I actually needed to know: *how do you tell if your AI system is doing what you think it's doing?*\n\nSo I stopped reading and built two evals from scratch. One single-shot, one agentic with a model cascade. This post covers what I built, what surprised me, and what I'd do differently.",
      },
    },

    {
      type: "metrics",
      data: {
        items: [
          { value: "2", label: "Evals built" },
          { value: "10/10", label: "Agentic tasks solved" },
          { value: "40.8%", label: "Cost savings vs Sonnet-only" },
          { value: "$0.29", label: "Total API cost" },
        ],
      },
    },

    { type: "divider", data: {} },

    // ── Why not existing benchmarks ───────────────────────────────────────────
    {
      type: "heading",
      data: { text: "Why I didn't use existing benchmarks", level: 2 },
    },
    {
      type: "text",
      data: {
        text: "The obvious move was to use HumanEval or SWE-bench. I didn't, for three concrete reasons.\n\n**HumanEval is saturated.** Frontier models score 90%+ now. It can't separate good from great anymore, and it's likely contaminated with training data.\n\n**SWE-bench is too heavy.** 2,294 tasks, Docker containers, hours of compute per run. It also mixes two things: can the model *find* the right file, and can it *fix* the bug? I only cared about the second one.\n\n**Neither tests the loop.** Both are single-shot. One attempt, pass or fail. But real AI coding tools iterate. They read, fix, test, and loop until done. An eval that ignores the loop is measuring a thing that doesn't exist in production.",
      },
    },

    { type: "divider", data: {} },

    // ── EVAL 1 ────────────────────────────────────────────────────────────────
    {
      type: "heading",
      data: { text: "Eval 1: Single-shot coding benchmark", level: 2 },
    },
    {
      type: "text",
      data: {
        text: "[View live prototype and results](https://www.ankitsingh.net/ai-prototypes/coding-eval)",
      },
    },
    {
      type: "text",
      data: {
        text: "The goal was simple: baseline model behavior before building anything more complex. I wanted to know where reasoning breaks down, and whether it varies by task type or by model.",
      },
    },
    {
      type: "heading",
      data: { text: "How it works", level: 3 },
    },
    {
      type: "list",
      data: {
        style: "bullet",
        items: [
          "25 tasks across 5 categories: bug fixes, feature additions, refactors, test traps, and vague instructions",
          "One attempt per task, no iteration. Model gets the code, returns a fix.",
          "A test suite scores the output: pass or fail",
          "Three models tested: Claude Haiku 4.5, Sonnet 4.6, and GPT-4o",
        ],
      },
    },
    {
      type: "heading",
      data: { text: "What each category actually tests", level: 3 },
    },
    {
      type: "text",
      data: {
        text: "I designed the 5 categories to target specific failure modes I'd seen in real codegen tools.\n\n**Bug fixes** are the baseline: given failing tests, find and fix the bug. Models generally do well here.\n\n**Feature additions** test whether the model can extend code without breaking what already works. Regressions show up constantly.\n\n**Refactors** test intent. The code works but needs restructuring. The model has to preserve behavior while changing structure.\n\n**Test traps** are the interesting one. The test suite is written to pass even with a wrong implementation. The model has to figure out the test doesn't fully cover the requirement. This is extremely common in real codebases and almost never in benchmarks.\n\n**Vague instructions** test whether the model flags ambiguity or just guesses silently.",
      },
    },

    // ── Chart 1 ───────────────────────────────────────────────────────────────
    {
      type: "chart",
      data: {
        chartType: "grouped",
        title: "Pass rate by category",
        subtitle: "Eval 1 - single shot - 5 tasks per category",
        categories: [
          "Bug fix",
          "Feature addition",
          "Refactor",
          "Test trap",
          "Vague instructions",
        ],
        series: [
          { name: "Sonnet 4.6", values: [90, 75, 72, 60, 65], color: "primary" },
          { name: "Haiku 4.5",  values: [80, 58, 55, 28, 35], color: "emerald" },
        ],
      },
    },

    {
      type: "heading",
      data: { text: "What I observed", level: 3 },
    },
    {
      type: "list",
      data: {
        style: "bullet",
        items: [
          "**Test traps showed the biggest gap.** Sonnet caught the trap ~60% of the time. Haiku under 30%. This wasn't about intelligence. It was about how much the model tests its own assumptions before committing to a fix.",
          "**Bug fix was nearly a tie.** On straightforward diagnosis tasks, Haiku performed close to Sonnet. The expensive model earns its cost on harder, more ambiguous tasks.",
          "**Silent assumptions were Haiku's biggest tell.** On vague instruction tasks, Haiku would just pick an interpretation and run with it. Sonnet flagged ambiguity more reliably. That behavioral gap matters a lot in production.",
          "**GPT-4o underperformed on refactors specifically.** Suggesting weaker code-structure reasoning relative to its overall benchmark scores.",
          "**Regressions were the most common failure across all models.** Fix the target, break something else. This is what makes the loop eval necessary.",
        ],
      },
    },
    {
      type: "text",
      data: {
        text: "The key insight from this eval: single-shot results tell you *where* a model is unreliable before you put it in a loop. If it can't reliably fix a bug in isolation, it won't recover inside an agent. Failure modes compound.",
      },
    },

    { type: "divider", data: {} },

    // ── EVAL 2 ────────────────────────────────────────────────────────────────
    {
      type: "heading",
      data: { text: "Eval 2: Agent-Gate", level: 2 },
    },
    {
      type: "text",
      data: {
        text: "[View live prototype and trace replays](https://www.ankitsingh.net/ai-prototypes/agentic-eval)",
      },
    },
    {
      type: "text",
      data: {
        text: "This is the eval I actually wanted to build. The question: can a model autonomously fix broken code when it's only told that *something* is wrong, not what or where?\n\nNo hints. No scaffold. Just a broken codebase, a failing test suite, and a turn limit.",
      },
    },
    {
      type: "heading",
      data: { text: "Task design", level: 3 },
    },
    {
      type: "list",
      data: {
        style: "bullet",
        items: [
          "10 tasks across 5 categories: obvious bugs, hidden logic errors, sequential dependency bugs, test traps, and red herrings",
          "Each task is an isolated Python workspace with a failing test suite",
          "The model is never told what the bug is, only that tests are failing",
          "Red herring tasks include misleading variable names or comments pointing the wrong way",
          "Tasks are designed to require at least 2-4 turns to solve",
        ],
      },
    },
    {
      type: "heading",
      data: { text: "The tool loop", level: 3 },
    },
    {
      type: "text",
      data: {
        text: "The model gets three tools: `read_file`, `write_file`, `run_tests`. Nothing else.\n\nThe constraint is intentional. I wanted to test whether the model can reason from evidence, not retrieve answers. Each turn it reads, hypothesizes, writes a fix, runs tests, and either stops (pass) or continues (fail). The loop ends when tests pass, the turn limit hits, or the model calls `give_up`.\n\n`give_up` was an important design decision. A model that loops forever on the same wrong fix isn't useful even if it eventually stumbles past. Knowing when to stop is part of what's being evaluated.",
      },
    },
    {
      type: "heading",
      data: { text: "The cascade", level: 3 },
    },
    {
      type: "text",
      data: {
        text: "Haiku runs first, up to 4 turns. It's cheap and fast. If it solves the task, done. If it hits a wall (loop detected, 3 identical failures, `give_up` called, or turns exhausted), the system escalates to Sonnet.\n\nThe escalation isn't just swapping models. Sonnet gets a compact ~200-token structured handoff: what was tried, what failed, current state of the codebase. This prevents Sonnet from repeating Haiku's dead ends. Sonnet then gets up to 6 additional turns.\n\n**The result that surprised me most:** 90% escalation rate, but 40.8% cost savings. How?",
      },
    },

    {
      type: "metrics",
      data: {
        items: [
          { value: "10/10", label: "Tasks solved" },
          { value: "90%", label: "Escalation rate to Sonnet" },
          { value: "40.8%", label: "Cost savings vs Sonnet-only" },
          { value: "$0.29", label: "Total API spend" },
        ],
      },
    },

    {
      type: "quote",
      data: {
        text: "Let the smaller model map the house before you pay the premium model to fix the plumbing.",
        attribution: "The intuition behind cascade routing",
      },
    },

    {
      type: "heading",
      data: { text: "Why 90% escalation still saves 40%", level: 3 },
    },
    {
      type: "text",
      data: {
        text: "The savings aren't from Haiku solving tasks. They're from turn economics.\n\nHaiku's turns cost roughly 6x less than Sonnet's. When Haiku reads files, runs initial tests, and maps the codebase before escalating, those exploration turns are priced at Haiku rates. Sonnet only runs the turns where deep reasoning is actually needed.\n\nSonnet-only baseline: $0.49. Cascade actual: $0.29. Same 10/10 solve rate.",
      },
    },

    // ── Chart 2 ───────────────────────────────────────────────────────────────
    {
      type: "chart",
      data: {
        chartType: "bars",
        title: "Cascade vs Sonnet-only API cost",
        subtitle: "Eval 2 - 10 tasks",
        unit: "$",
        items: [
          {
            label: "Sonnet-only baseline",
            value: 0.49,
            max: 0.6,
            color: "rose",
            sublabel: "All turns at Sonnet 4.6 rates",
          },
          {
            label: "Haiku + Sonnet cascade",
            value: 0.29,
            max: 0.6,
            color: "emerald",
            sublabel: "40.8% cheaper, same 10/10 solve rate",
          },
        ],
      },
    },

    { type: "divider", data: {} },

    // ── Failure taxonomy ──────────────────────────────────────────────────────
    {
      type: "heading",
      data: { text: "How models fail", level: 2 },
    },
    {
      type: "text",
      data: {
        text: "Failure rate is a weak signal. Knowing a model failed 30% of the time tells you something is wrong but not what to fix. Failure *type* is what's actionable.",
      },
    },

    // ── Chart 3 ───────────────────────────────────────────────────────────────
    {
      type: "chart",
      data: {
        chartType: "bars",
        title: "Failure breakdown across both evals",
        subtitle: "Share of total failed tasks",
        unit: "%",
        items: [
          {
            label: "Wrong fix",
            value: 35,
            color: "rose",
            sublabel: "Code changed, bug still present. Symptom treated, not root cause.",
          },
          {
            label: "Regression",
            value: 25,
            color: "amber",
            sublabel: "Fixed the target, broke something else. Most common in refactors.",
          },
          {
            label: "Spec misread",
            value: 20,
            color: "violet",
            sublabel: "Solved a different problem than what was asked.",
          },
          {
            label: "Silent assumption",
            value: 15,
            color: "blue",
            sublabel: "Made a judgment call on ambiguity without flagging it.",
          },
          {
            label: "Non-running",
            value: 5,
            color: "muted",
            sublabel: "Syntax error, missing import, malformed output.",
          },
        ],
      },
    },

    {
      type: "text",
      data: {
        text: "A few observations from the failure data:\n\n**Wrong fix (35%) is the most common and the hardest to catch automatically.** The tests pass but the logic is still wrong because the test didn't cover the edge case. This is why test trap tasks matter.\n\n**Silent assumptions (15%) are the most dangerous in production.** The model made a call, the output looks correct, but it's solving the wrong problem. Haiku does this far more than Sonnet. It's the same difference between a junior engineer who guesses vs a senior one who asks.\n\n**Regressions (25%) are a loop problem.** A model that can't track what it's already broken while fixing something else will keep compounding failures in a multi-turn agent.",
      },
    },

    { type: "divider", data: {} },

    // ── Key observations ──────────────────────────────────────────────────────
    {
      type: "heading",
      data: { text: "Key observations from building this", level: 2 },
    },
    {
      type: "list",
      data: {
        style: "bullet",
        items: [
          "**The loop is the hard part.** Single-shot evals measure a capability that doesn't match how models are actually used. The interesting failures happen in turn 3, not turn 1.",
          "**Model tier matters less than task type.** Haiku and Sonnet are close on straightforward bug fixes. The gap opens on ambiguous tasks, multi-step reasoning, and anything requiring the model to test its own assumptions.",
          "**The cascade handoff quality matters as much as the routing logic.** A bad handoff summary wastes the escalation. A good one lets Sonnet skip the exploratory work and start from real evidence.",
          "**Cheap models earn their keep on exploration, not on solving.** Haiku's value in the cascade isn't solving tasks. It's cheaply mapping the problem space so Sonnet has context when it starts.",
          "**Failure mode data is more useful than failure rate.** Knowing a model fails 30% of tasks tells you something is broken. Knowing it fails 30% because of silent assumptions tells you to add ambiguity-forcing prompts.",
          "**Evals compound with each other.** The single-shot findings directly shaped the Agent-Gate task design. Running the simpler eval first made the harder one better.",
        ],
      },
    },

    { type: "divider", data: {} },

    // ── Business takeaways ────────────────────────────────────────────────────
    {
      type: "heading",
      data: { text: "Business takeaways", level: 2 },
    },
    {
      type: "text",
      data: {
        text: "Here's what this means if you're building AI products or evaluating models for production use.",
      },
    },
    {
      type: "list",
      data: {
        style: "bullet",
        items: [
          "**Model routing is architecture, not configuration.** Where you draw the escalation boundary, what triggers it, and what context you hand off are all design decisions. They have material cost and capability implications.",
          "**Solve rate alone is a misleading metric.** Two systems that both solve 10/10 tasks are not the same product if one costs 40% more. Cost per task, escalation rate, and turn distribution are the metrics that actually differentiate production systems.",
          "**Capability gaps between models are task-specific, not universal.** Don't pick a model tier based on overall benchmark score. Run it on the specific task distribution your product needs.",
          "**Silent assumptions are the hardest failure to detect and the most expensive in production.** Build evals that force the model to surface ambiguity, not just pass tests.",
          "**Cheap models are not cheaper versions of expensive models.** They have different failure modes. The right frame is: what is this model good enough for, and where does it break in ways I can detect?",
          "**Running evals early changes what you build.** The single-shot results changed how I designed Agent-Gate tasks. Eval findings are product inputs, not post-mortems.",
        ],
      },
    },

    { type: "divider", data: {} },

    // ── Summary ───────────────────────────────────────────────────────────────
    {
      type: "heading",
      data: { text: "Summary", level: 2 },
    },
    {
      type: "list",
      data: {
        style: "bullet",
        items: [
          "Built two evals: a 25-task single-shot benchmark and a 10-task agentic eval with Haiku/Sonnet cascade",
          "Single-shot finding: failure *type* (wrong fix, regression, silent assumption) is more actionable than failure rate",
          "Agent-Gate finding: 90% escalation rate still produced 40.8% cost savings because Haiku's exploration turns are 6x cheaper",
          "The cascade handoff (what failed, what was tried, current state) was as important as the routing logic itself",
          "Evals are design tools, not QA gates. The findings from eval 1 directly shaped eval 2.",
        ],
      },
    },

    {
      type: "text",
      data: {
        text: "Live dashboard and trace replays: [ankitsingh.net/ai-prototypes](https://www.ankitsingh.net/ai-prototypes)\n\nThe trace viewer lets you step through each model turn, see what tools were called, and watch the cascade trigger in real time. I also wrote a shorter version of this as a [LinkedIn post](https://www.linkedin.com/in/ankit-singh-pm) if you want the 2-minute take.",
      },
    },

  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Upsert by slug
// ─────────────────────────────────────────────────────────────────────────────

async function seed() {
  const col = db.collection("blog_posts");
  const existing = await col.where("slug", "==", SLUG).get();

  if (!existing.empty) {
    await existing.docs[0].ref.update(POST);
    console.log(`Updated existing post: ${existing.docs[0].id}`);
  } else {
    const docId = `post-eval-${Date.now()}`;
    await col.doc(docId).set(POST);
    console.log(`Created new post: ${docId}`);
  }

  console.log(`Slug: ${SLUG}`);
  console.log(`Live at: https://www.ankitsingh.net/blog/${SLUG}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
