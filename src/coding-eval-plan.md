# Coding Eval — Complete Plan
**Last updated:** July 3, 2026  
**Purpose:** Anthropic Claude Code PM interview portfolio piece  
**Status:** Planning complete. Ready to build.

---

## Quick Orientation (for new sessions)

Read this file top to bottom before writing a single line of code. Every design decision is here with reasoning. Do not re-derive — just execute.

**To resume building:** "Read coding-eval-plan.md and continue from [Session X / Step Y]."

---

## 1. What This Is

A 25-task coding benchmark that tests how Claude Sonnet 4.6, Claude Haiku 4.5, and GPT-4o handle real developer tasks — not toy puzzles. Built to fill the gaps that HumanEval, SWE-bench, and LiveCodeBench leave open (none of them test agentic behavior, ambiguity handling, or multi-step reasoning the way real developers encounter it).

**Primary audience:** Anthropic PM/researcher reviewing Ankit's portfolio for the Claude Code model performance PM role.

**Secondary audience:** AI researchers/developers evaluating coding agent behavior.

**Live URL (once deployed):** `ankitsingh.net/ai-prototypes/coding-eval`

---

## 2. Why This Exists (The Pitch)

Existing benchmarks have three blind spots:
1. They test single-shot answers. Real Claude Code usage is iterative.
2. They don't test whether a model asks for clarification vs. guesses silently.
3. They're Python-only, saturated (HumanEval >90%), or require complex infrastructure (SWE-bench).

This eval is small enough to run in minutes, focused on behaviors that matter to real developers, and designed to produce findings — not just scores.

---

## 3. The 25 Tasks

### Structure
- 5 categories × 5 tasks each
- Difficulty: 8 easy / 12 medium / 5 hard (distributed across categories, not per-category)
- Source: adapted from real GitHub issues in small/mid-sized Python repos (not Django/NumPy — too complex)
- Each task is self-contained: one starter code file + one instructions file + hidden test cases

### Categories

**Category 1 — Bug Fixing (with error messages)**
Give the model broken code + the exact error it throws. Does it fix the right thing?
Tests: targeted diagnosis, not surface-level pattern matching.
Example: function crashes on empty input — fix it given the TypeError output.

**Category 2 — Feature Addition**
Give the model working code + "add X feature." Does it add it without breaking existing behavior?
Tests: understanding intent, preserving existing contracts.
Example: add retry logic to an API client function.

**Category 3 — Refactor Without Breaking**
Give the model messy but working code + "clean this up." Does the refactored version pass the same tests?
Tests: whether the model understands behavior vs. surface form.
Example: nested if/else chain → early returns, same logic.

**Category 4 — Ambiguous Instructions**
Give the model a task where two valid interpretations exist. Does it ask, or guess silently?
Tests: the most important real-world behavior that no major benchmark measures.
Example: "improve the sorting in this function" — ascending? descending? by which field?
Grading: 3-point rubric (see Section 5).

**Category 5 — Multi-step Debugging**
Two bugs: Bug A is obvious. Bug B only appears after Bug A is fixed.
Tests: iterative reasoning, not single-shot correctness.
Example: off-by-one error masks a type error downstream.

### Difficulty Distribution
- Easy (8 tasks): Model should always solve these. Sanity checks. If model fails easy tasks, harness is broken.
- Medium (12 tasks): Real signal. Model gets most, fails some. This is where the interesting findings live.
- Hard (5 tasks): Frontier tasks. Model rarely gets all of these. Shows capability ceiling.

---

## 4. Models

**Three-way comparison:**
- Claude Haiku 4.5 — fast/cheap tier
- Claude Sonnet 4.6 — advanced tier  
- GPT-4o — competitor baseline

**Model cascade (for live demo only):**
Try Haiku first → if fails → escalate to Sonnet 4.6 → show which tier solved it.
This demonstrates cost-optimization thinking (production AI pattern).

**For pre-computed static snapshot:**
Run all three models independently offline. Show three-column results table.

---

## 5. Grading

**Categories 1, 2, 3, 5 — Test execution (pass/fail)**
- Model returns modified code
- Harness runs hidden test cases against returned code
- All tests pass = task solved
- Partial passes do NOT count (binary)

**Category 4 — 3-point rubric (ambiguous tasks)**
- 2 points: Model asks a clarifying question before proceeding
- 1 point: Model states its assumption explicitly, then implements it
- 0 points: Model picks an interpretation and implements silently (no mention of ambiguity)
- Pass threshold: ≥ 1 point (stating assumption counts as acceptable behavior)

**Reproducibility**
- Temperature: 0.2
- Runs per task: 3
- Grading: majority vote (2 of 3 runs must pass)

---

## 6. Failure Taxonomy

Every failed task maps to exactly one of these five categories:

1. **Wrong fix** — Code was changed but the bug/requirement is still not met
2. **Regression** — Fixed the target issue but broke something that was previously working
3. **Spec misread** — Solved a different problem than what was asked
4. **Silent assumption** — Made a judgment call on an ambiguous task without flagging it (Category 4 specific)
5. **Non-running** — Returned code that doesn't execute at all (syntax error, import failure)

---

## 7. Files to Build

All files live inside the existing Next.js portfolio app. Match existing patterns exactly.

```
src/
├── lib/
│   └── coding-eval/
│       ├── types.ts              ← TypeScript types for tasks + results
│       ├── tasks.ts              ← The 25 task definitions (static data)
│       └── publicSnapshot.ts     ← Pre-computed results (filled after running harness)
│
├── components/
│   └── coding-eval/
│       └── CodingEvalShowcase.tsx  ← Public results component
│
└── app/
    └── ai-prototypes/
        └── coding-eval/
            └── page.tsx          ← Public portfolio page

scripts/
└── run_coding_eval.py            ← Offline Python harness (not deployed)
```

### Existing patterns to mirror (READ THESE before building)
- Types pattern: `src/lib/job-search-agent/evals/types.ts`
- Task definitions pattern: `src/lib/job-search-agent/evals/goldenSet.ts`
- Public snapshot pattern: `src/lib/job-search-agent/evals/publicSnapshot.ts`
- Showcase component pattern: `src/components/job-search-agent/EvalQualityShowcase.tsx`
- Page pattern: `src/app/ai-prototypes/job-application-workflow-agent/page.tsx`

### Design system (use exactly these — no deviations)
- Icons: `material-symbols-outlined` (check_circle, cancel, play_arrow, analytics, etc.)
- Text colors: `text-on-surface`, `text-on-surface-variant`, `text-primary`
- Backgrounds: `bg-surface-container-low`, `bg-surface-container-lowest`
- Success: `bg-emerald-50`, `border-emerald-200`, `text-emerald-800`
- Failure: `bg-rose-50`, `border-rose-200`, `text-rose-800`
- Warning: `bg-amber-50`, `border-amber-200`, `text-amber-900`
- Borders: `rounded-2xl`, `border-outline-variant/15`
- Font headline: `font-[family-name:var(--font-headline)]`
- Accent text: `text-gradient`
- Section labels: `text-xs font-bold uppercase tracking-wider text-on-surface-variant`
- Badges: `inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold`

---

## 8. UX Flow (What Visitors Experience)

**Section 1 — Hero header**
- Back link → AI Prototypes
- Pill badge: `eval · research`
- Title: "Claude Code Coding Eval"
- Subtitle: explains what this is and why existing benchmarks miss it
- One-line stat: overall scores upfront

**Section 2 — Scoreboard (static, pre-computed)**
Three models side by side: Haiku / Sonnet 4.6 / GPT-4o
Overall score + per-category breakdown with visual bars.
Headline finding surfaced immediately (e.g., "Claude's only underperformance vs GPT-4o: ambiguous instructions").

**Section 3 — Live Demo (optional, build last)**
Dropdown to pick a sample task. Run button calls the model cascade (Haiku → Sonnet).
Shows starter code, model output, test results. 
Note: requires Firebase Function extension. Build after static page is live.

**Section 4 — Failure Analysis**
Failures grouped by taxonomy type (wrong fix, regression, etc.).
Written finding for the most interesting pattern (e.g., silent assumptions).
Concrete example with model output shown.

**Section 5 — Methodology**
Short bullets: task source (real GitHub issues), grading approach, reproducibility settings.
Link to GitHub repo.

**Section 6 — What I'd Build Next (v2)**
3-4 sentences. Shows PM thinking. Mentions: multi-language tasks, agentic loop testing, system prompt experiments for ambiguity improvement.

---

## 9. Python Harness (run_coding_eval.py)

Runs offline on Ankit's local machine. Never deployed.

**What it does:**
1. Reads task definitions from a `/tasks/` folder (25 subfolders, each with starter_code.py + instructions.txt + tests.py)
2. For each task × each model (Haiku, Sonnet, GPT-4o):
   - Sends starter code + instructions to model API
   - Receives modified code
   - Runs `tests.py` against returned code using Python subprocess
   - Records pass/fail + which tests failed + latency
3. Runs each task 3 times, takes majority vote
4. Outputs `results.json`
5. Ankit pastes results into `publicSnapshot.ts`

**APIs used:**
- Anthropic Python SDK (`pip install anthropic`) — for Haiku + Sonnet
- OpenAI Python SDK (`pip install openai`) — for GPT-4o
- Keys stored in local `.env` file, never committed

**Estimated cost per full run:** $2–5 depending on task length.

---

## 10. Hosting & Deployment

**Stack:** Next.js (app router) + Firebase Hosting  
**Deploy command:** `npm run build && firebase deploy --only hosting --project=asinghpm101`  
**IDE:** Cursor  

**What gets deployed:** Static Next.js build. The publicSnapshot.ts data bakes into the build.  
**What does NOT get deployed:** Python harness script, raw task files, API keys.

**Live demo (future):** Would require a new Firebase Function `run_coding_task` added to the existing `runAgentTool` Cloud Function at `https://us-central1-asinghpm101.cloudfunctions.net/runAgentTool`. Not blocking the initial launch.

---

## 11. Build Sessions

| Session | Goal | Key files produced |
|---|---|---|
| Session 1 (done) | Full planning | `coding-eval-plan.md` |
| Session 2 | Write 25 task definitions | `lib/coding-eval/tasks.ts` + `/tasks/` folder structure |
| Session 3 | Build types + public snapshot skeleton | `lib/coding-eval/types.ts`, `lib/coding-eval/publicSnapshot.ts` |
| Session 4 | Build showcase component | `components/coding-eval/CodingEvalShowcase.tsx` |
| Session 5 | Build page + wire everything | `app/ai-prototypes/coding-eval/page.tsx` |
| Session 6 | Write Python harness | `scripts/run_coding_eval.py` |
| Session 7 | Run harness, fill snapshot, deploy | Update `publicSnapshot.ts`, deploy to Firebase |

**Start each session with:** "Read `src/coding-eval-plan.md` and continue from Session X."

---

## 12. What This Proves to Anthropic

The eval demonstrates in miniature exactly what the Claude Code PM role requires:

- **Problem identification** — articulating what's missing in HumanEval/SWE-bench/LiveCodeBench
- **Eval taste** — choosing task categories that test behaviors that actually matter
- **Engineering credibility** — building the harness and grading infrastructure
- **Model taste** — analyzing what the failures mean about model behavior
- **PM communication** — writing up findings clearly with a v2 roadmap

---

## 13. Open Questions / Decisions for Later

- [ ] Which 25 specific GitHub issues to adapt tasks from (decide in Session 2)
- [ ] Whether to include any JavaScript tasks or keep Python-only for simplicity
- [ ] Exact wording of the ambiguous instruction tasks (needs care — ambiguity must be genuine, not contrived)
- [ ] Whether to add the live demo section before or after the Anthropic interview
- [ ] GitHub repo name and whether to make it public before the interview

---

*End of plan. All decisions above are final unless explicitly revisited.*
