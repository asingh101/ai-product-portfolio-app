# Agent-Gate: Agentic Eval - Complete Plan
**Last updated:** July 4, 2026
**Purpose:** PM portfolio piece
**Status:** Planning complete. Ready to build.
**Live URL (once deployed):** `ankitsingh.net/ai-prototypes/agentic-eval`

---

## Quick Orientation (for new sessions)

Read this file before writing a single line of code. Every design decision is captured here with reasoning. Do not re-derive - just execute.

**To resume building:** "Read src/agentic-eval-plan.md and continue from Session X."

---

## 1. What This Is

Agent-Gate is a multi-turn agentic evaluation harness that tests whether Claude can autonomously fix broken codebases - the way a real developer would. The model is given a failing test suite, a set of tools, and a turn limit. It explores, edits, runs tests, and iterates until the tests pass or it gives up.

This is fundamentally different from the single-shot coding eval we already built. That eval asked: "can the model write a correct fix in one shot?" This eval asks: "can the model figure out what's wrong, try something, learn from the test output, and keep going?"

That loop is what Claude Code actually does in practice. No major benchmark measures it cleanly at small scale.

---

## 2. Why This Exists

**The gap Agent-Gate fills:**

Single-shot evals (HumanEval, our coding eval) test one-shot correctness. SWE-bench tests agentic behavior but requires cloning 12 Python repos, setting up complex Docker environments, and running hundreds of tasks. It's hard to run, hard to explain, and hard to show on a portfolio page.

Agent-Gate is:
- Small enough to run in under 10 minutes
- Self-contained (no Docker, no external repos)
- Instrumented to show exactly what happened at every step
- Designed to produce findings about agentic failure modes

**What it proves to Anthropic:**
The JD asks for someone who has "personally built agentic evals (e.g. SWE-bench-style task suites)." This is that - built from scratch, with a real agent loop, real tool use, and real findings.

---

## 3. Core Concept: What Makes It "Agentic"

The model is not given a task and asked to return code. Instead, it gets:
- A task description ("the tests are failing, fix them")
- A set of tools it can call
- A turn limit (MAX_TURNS = 10)

Each turn the model decides: which tool should I call next?

**The three tools:**
1. `read_file(path)` - reads any file in the task workspace
2. `write_file(path, content)` - overwrites a file with new content
3. `run_tests()` - runs the test suite, returns stdout + exit code

The model sees the tool result, then decides the next action. This continues until:
- `run_tests()` returns exit code 0 (success), OR
- MAX_TURNS is hit (failure), OR
- The model calls a special `give_up()` tool explicitly

This is a real agentic loop. The model must plan, explore, act, observe, and recover - not just produce a one-shot answer.

---

## 4. The Model Cascade

Two-tier cascade. Starts cheap, escalates when stuck.

**Tier 1: Claude Haiku 4.5** (`claude-haiku-4-5-20251001`)
- Handles the first 4 turns of every task
- Fast and cheap - good for exploration and straightforward fixes
- If Haiku solves the task within 4 turns, Sonnet is never called

**Escalation triggers (any one of these):**
- Haiku fails a test 3 turns in a row with no change in the error output
- Haiku calls the same tool with the same arguments twice in a row (loop detection)
- Haiku calls `give_up()` explicitly

**Tier 2: Claude Sonnet 4.6** (`claude-sonnet-4-6`)
- Activated only when Haiku is stuck
- Receives the full Haiku history: every tool call, every result, every error
- System prompt includes: "Tier 1 failed to resolve this. Review the history below. Do not repeat the same actions. Try a different approach."
- Gets its own MAX_TURNS budget (6 more turns)

**Why this is interesting:**
The cascade demonstrates a production cost-optimization pattern. You don't burn Sonnet tokens on tasks Haiku can solve. The eval measures how often the cascade was needed, and whether Sonnet actually rescued tasks Haiku failed.

---

## 5. The Tasks

**10 tasks total.** Smaller set than the coding eval because each task runs for multiple turns (up to 10 API calls per task vs 1 in the coding eval).

**Task structure:**
Each task is a small self-contained Python workspace with:
- `starter/` - the starting state of the codebase (deliberately broken)
- `tests/test_task.py` - pytest test file (the model can read this)
- `task.md` - description of what the code is supposed to do (but NOT what the bug is)

**The agent is NOT told what the bug is.** It must find it by reading the code and running the tests.

**5 categories × 2 tasks each:**

**Category 1: Single Bug, Obvious Error**
Model reads the code, spots the bug, fixes it. Tests pass in 2-3 turns. Should always succeed. Sanity check.

**Category 2: Single Bug, Hidden in Logic**
The error message doesn't point to the root cause. Model must trace the logic. Requires 3-5 turns typically.

**Category 3: Two Bugs, Sequential**
Bug A is obvious. Bug B only appears after Bug A is fixed. Tests fail differently after the first fix. Tests whether the model keeps going after partial success.

**Category 4: Correct Code, Wrong Test Understanding**
The bug is a misaligned expectation between code behavior and test assertion. Model must read both the code AND the test carefully. Tests whether model explores before acting.

**Category 5: Red Herring**
The obvious-looking bug is not the real bug. If the model fixes the red herring, tests still fail. Tests whether the model recovers from a wrong first attempt.

**Difficulty distribution:**
- Easy (4 tasks): Categories 1 and some of Category 2. Model should always solve these.
- Medium (4 tasks): Categories 2, 3. Real signal.
- Hard (2 tasks): Categories 4 and 5. Frontier behavior. Cascade almost always triggers.

---

## 6. Grading

**Primary metric: Task solved (binary)**
Did `run_tests()` return exit code 0 before MAX_TURNS? Yes/No.

**Per-task metrics (recorded by harness, displayed in trace):**
- `turns_to_solve` - total turns used (lower = better; max is 10)
- `haiku_turns` - how many turns Haiku took
- `sonnet_turns` - how many turns Sonnet took (0 if cascade never triggered)
- `cascade_triggered` - did Haiku hand off to Sonnet? (boolean)
- `cascade_rescued` - if cascade triggered, did Sonnet succeed? (boolean)
- `self_corrections` - times the model wrote a file, ran tests, got a failure, then tried a different fix
- `first_attempt_passed` - did the very first write_file + run_tests pass? (measures one-shot accuracy within agentic loop)
- `cost_haiku_usd` - cost of Haiku turns only (input tokens × $0.80/M + output tokens × $4/M)
- `cost_sonnet_usd` - cost of Sonnet turns only (input tokens × $3/M + output tokens × $15/M)
- `cost_actual_usd` - total actual cost of the run
- `cost_haiku_only_estimate_usd` - what it would have cost if Haiku ran all 10 turns alone
- `cost_sonnet_only_estimate_usd` - what it would have cost if Sonnet ran all 10 turns alone
- `latency_ms_avg` - average latency per turn across the run
- `latency_haiku_avg_ms` - Haiku average latency per turn
- `latency_sonnet_avg_ms` - Sonnet average latency per turn
- `failure_type` - one of: gave_up / hit_turn_limit / loop / wrong_fix / red_herring_stuck

**Aggregate metrics (across all 10 tasks):**
- `overall_pass_rate` - tasks solved / 10
- `cascade_rate` - tasks where cascade triggered / 10
- `cascade_rescue_rate` - tasks where Sonnet rescued Haiku / tasks where cascade triggered
- `avg_turns_to_solve` - average across solved tasks only
- `total_cost_actual_usd` - total spend across all 10 tasks
- `total_cost_haiku_only_usd` - what all 10 tasks would have cost on Haiku alone
- `total_cost_sonnet_only_usd` - what all 10 tasks would have cost on Sonnet alone
- `cost_savings_vs_sonnet_pct` - (sonnet_only - actual) / sonnet_only × 100
- `cost_savings_vs_haiku_pct` - how much more reliable cascade was vs Haiku-only (quality-adjusted)
- `self_correction_rate` - avg self corrections per task
- `avg_latency_per_turn_ms` - across all turns all tasks

**Per-step trace (recorded for every single turn):**
- `step_number`
- `model` - haiku or sonnet
- `tool_called` - read_file / write_file / run_tests / give_up
- `tool_args` - the exact arguments passed
- `tool_result` - stdout/stderr output, exit code, file content
- `tokens_in` - input tokens this turn
- `tokens_out` - output tokens this turn
- `cost_usd` - cost of this single turn
- `latency_ms` - time for this turn
- `is_cascade_handoff` - boolean, true if this is the step where Sonnet takes over
- `test_status` - pass / fail / not_run (only set on run_tests steps)

**Cascade efficiency metric:**
```
cost_savings_pct = (sonnet_only_cost - actual_cost) / sonnet_only_cost × 100
```

**Failure taxonomy:**
1. `gave_up` - model called give_up() explicitly
2. `hit_turn_limit` - ran out of turns without passing
3. `loop` - repeated same action more than twice (caught by cascade trigger)
4. `wrong_fix` - fixed something, tests still fail, different error
5. `red_herring_stuck` - model committed to wrong diagnosis and could not recover

---

## 7. Backend Architecture (No Docker)

**The key simplification:** Instead of Docker, tasks run in isolated temp directories using Python's built-in `tempfile` module. Each task gets a fresh copy of its `starter/` directory written to a temp folder. The agent's `write_file` calls modify files in that temp folder. The `run_tests()` call runs `python -m pytest` via subprocess against that folder.

This is safe because:
- The agent can only write to the temp directory (path is enforced in the wrapper)
- Tests run in a subprocess (isolated from the harness process)
- Temp directory is deleted after each task run

**No cloud infrastructure needed.** The entire harness runs locally on your machine, same as the coding eval.

**Backend stack:**
- Python 3.9+
- `anthropic` SDK (tool use API)
- `pytest` for test execution
- `subprocess` for running tests
- `tempfile` for isolated workspaces
- `python-dotenv` for API key

---

## 8. File Structure

```
src/
  lib/
    agentic-eval/
      types.ts              ← TypeScript types for runs, steps, traces
      publicSnapshot.ts     ← Pre-computed results for portfolio display
  components/
    agentic-eval/
      AgenticEvalShowcase.tsx     ← Main results component
      TraceReplayViewer.tsx       ← Step-by-step trace timeline
  app/
    ai-prototypes/
      agentic-eval/
        page.tsx            ← Public portfolio page

eval-engine/
  run_agentic_eval.py       ← Main harness script (run locally, never deployed)
  tasks/
    task_01_single_bug_obvious/
      starter/
        module.py
      tests/
        test_task.py
      task.md
    task_02_... (× 10 tasks total)
```

---

## 9. What the Website Shows

The page is designed for two audiences simultaneously: a general visitor who wants the story, and a technical reviewer who wants to dig into the data. The layout leads with the story, then opens up into the data.

---

**Section 1: Hero header**
- Title: "Agent-Gate: Agentic Eval"
- One-line explanation: "Can Claude autonomously fix broken code - without being told what's wrong?"
- Contrast with single-shot eval in one sentence
- Four headline stat chips inline: tasks solved / avg turns / cascade rate / total cost
- Run timestamp + "placeholder" banner if not yet real data

---

**Section 2: Three-scenario cost comparison (the money shot)**
Three cards side by side:

| Haiku Only | Actual Cascade | Sonnet Only |
|---|---|---|
| $X.XX total | $X.XX total | $X.XX total |
| X/10 solved | X/10 solved | X/10 solved |
| Cheap but misses hard tasks | Best balance | Most capable but expensive |

Below the cards: two percentage callouts
- "Cascade saved X% vs running Sonnet-only"
- "Cascade solved X% more tasks than Haiku-only"

This section answers the core PM question: does the cascade pay for itself?

---

**Section 3: Summary metrics grid**
8 metric cards in a 2×4 or 4×2 grid. Each card has a large number, a label, and a one-line explanation.

1. **Pass Rate** - X/10 tasks solved
2. **Avg Turns to Solve** - X.X turns (solved tasks only)
3. **Cascade Triggered** - X/10 tasks needed Sonnet
4. **Cascade Rescued** - X/X tasks Sonnet saved after Haiku failed
5. **Self-Correction Rate** - avg X corrections per task
6. **Avg Turn Latency** - Xms (Haiku) vs Xms (Sonnet)
7. **First-Attempt Pass Rate** - X% of write attempts passed tests immediately
8. **Total API Cost** - $X.XX across all 10 tasks

---

**Section 4: Per-task table**
A compact table showing all 10 tasks at a glance. Each row is clickable to expand the full trace.

Columns: Task name | Difficulty | Status (solved/failed) | Turns | Model(s) used | Cascade | Cost | Expand button

Color coding:
- Green row = solved
- Red row = failed
- Yellow badge on row = cascade triggered

---

**Section 5: Trace Replay Viewer (the centrepiece)**
When a user clicks a task row in the table above, a full trace expands below it (accordion pattern).

The trace shows a vertical timeline. Each step is a card:
- Step number pill (01, 02, 03...)
- Model badge (blue pill = Haiku, green pill = Sonnet)
- Tool name (read_file / write_file / run_tests / give_up)
- One-line summary of what happened
- Token count + cost for this step + latency
- Expand button to see full detail

When expanded, a step shows:
- Tool arguments (file path, command, or file content written)
- Full tool result (test output, file content read, error message)
- If write_file: a simple before/after diff view
- If run_tests: test output with pass/fail highlighted

Special visual treatments:
- Cascade handoff step gets a prominent banner: "Haiku escalated to Sonnet - context handed off"
- First passing test_run step gets a green success banner
- Failed test_run steps show the specific error in red

At the bottom of each trace:
- Task summary card: total turns, total cost, final status, time elapsed

---

**Section 6: Cascade deep-dive**
Two sub-sections:

A. Escalation trigger breakdown - what caused each cascade:
- Pie or bar chart: loop detected / test failed 3 times / gave up
- Written finding for the most common trigger

B. Sonnet rescue rate - when Sonnet took over, what happened:
- X/X cascades resulted in success
- Avg additional turns Sonnet needed to finish what Haiku started

---

**Section 7: Failure taxonomy**
Same pattern as coding eval. Each failure type with icon, label, description, and which tasks hit it.

---

**Section 8: Methodology**
- How tasks were designed
- How the tool loop works
- How cascade logic fires
- How cost is calculated (exact token prices used)
- Reproducibility: temperature, run count, how to rerun

---

**Section 9: What's next (v3)**
- Multi-file codebases (currently single-file)
- TypeScript tasks alongside Python
- Web search tool (closer to real Claude Code usage)
- Live demo: user picks a task, watches it run in real time
- More escalation tiers (add GPT-4o as a third tier)

---

## 10. Key Findings to Highlight (anticipated)

These are the findings we expect - and that will be most compelling to an Anthropic audience:

1. **Haiku solves easy tasks cleanly.** On Category 1 tasks, Haiku finishes in 2-3 turns at ~$0.001 per task. No need for Sonnet.

2. **The cascade earns its cost.** On Category 3-5 tasks, Haiku gets stuck. Sonnet rescues most of them. Cost-per-solved-task is lower with cascade than Sonnet-only.

3. **Loop detection matters.** Without the loop detector, Haiku would repeat the same wrong fix indefinitely. The cascade trigger is what makes the system intelligent vs. brute-force.

4. **Red herrings are hard.** Category 5 tasks expose the hardest failure mode: the model commits to a wrong diagnosis and can't self-correct even with Sonnet. This is the most interesting finding for an AI PM - it shows where the current generation of models hits a wall.

---

## 11. Build Sessions

| Session | Goal | Key files |
|---|---|---|
| Session 1 (done) | Full planning | `agentic-eval-plan.md` |
| Session 2 | Write 10 task definitions + test files | `eval-engine/tasks/` |
| Session 3 | Build Python harness with tool loop + cascade | `eval-engine/run_agentic_eval.py` |
| Session 4 | Build TypeScript types + publicSnapshot skeleton | `src/lib/agentic-eval/` |
| Session 5 | Build TraceReplayViewer component | `src/components/agentic-eval/` |
| Session 6 | Build AgenticEvalShowcase + page | `src/components/agentic-eval/AgenticEvalShowcase.tsx`, page.tsx |
| Session 7 | Run harness, fill snapshot, deploy | Update publicSnapshot.ts, deploy |

**Start each session with:** "Read src/agentic-eval-plan.md and continue from Session X."

---

## 12. What This Proves to Anthropic

| JD requirement | How Agent-Gate addresses it |
|---|---|
| "Personally built agentic evals" | Built from scratch: real tool-use loop, real cascade, real grading |
| "SWE-bench-style task suites" | Same concept: broken codebase, autonomous agent, test-driven grading |
| "Model performance on coding tasks" | Direct comparison: Haiku vs cascade vs Sonnet-only |
| "Cost and latency tradeoffs" | Cascade efficiency metric shows cost savings from tiered routing |
| "Eval taste" | Task design specifically tests failure modes no existing benchmark captures |

---

## 13. Token Optimization Strategy

Two separate problems: tokens spent running the harness (API cost), and tokens spent in our build sessions (context efficiency).

### Harness token optimization (API cost during eval runs)

**Truncate tool outputs.**
Pytest output can exceed 200 lines. The model only needs the bottom - that's where the actual error is. Truncate all tool results to the last 50 lines before adding to conversation history. Store the full output in the trace for display purposes only.

**Strip file content from history after turn 1.**
If the model reads a 100-line file on turn 1, that content sits in the history for every turn after. After a `read_file` call, replace the content in older history entries with a short placeholder: `"[file content omitted from history - already read]"`. The model has it in context from turn 1; it doesn't need it repeated.

**Compact cascade handoff.**
When Sonnet takes over, don't send it Haiku's raw turn-by-turn history verbatim. Build a structured summary: what files were read, what edits were attempted, what the current test error is, what Haiku tried that failed. This can be 200 tokens instead of 2000.

**Per-call `max_tokens` ceiling.**
- Tool selection turns (model deciding next action): `max_tokens=512`
- `write_file` turns (model writing code): `max_tokens=2048`
- Never use a flat ceiling across all turn types.

**Temperature 0.0, not 0.2.**
Agentic tasks need determinism. Random variation in tool call decisions across runs makes results unstable. 0.0 throughout.

**Tight system prompt.**
One paragraph. No fluff. The model knows Python and pytest.

**Single run per task (not 3x majority vote).**
The coding eval ran each task 3 times for reproducibility. Agentic runs are expensive (up to 10 turns each). One run per task. Accept that results have some variance - note this in methodology.

### Build session token optimization (context efficiency)

**Tasks live in files, not in the harness script.**
Each task is its own folder under `eval-engine/tasks/`. The harness loads them at runtime. We never paste all 10 task definitions into a conversation.

**One component per session.**
TraceReplayViewer in Session 5, AgenticEvalShowcase in Session 6. Never both in the same session. Large components in context burn tokens fast.

**Never paste results.json into a conversation.**
The trace data is large. When we need to review it, read specific task results by task ID - not the whole file.

**Start every session with exactly:**
`"Read src/agentic-eval-plan.md and continue from Session X."`
Nothing else. No re-explaining context that is already in this file.

---

## 14. Decisions Locked

- **No Docker.** Python subprocess + tempfile. Same isolation, zero infrastructure.
- **Pre-computed, not live.** Harness runs locally. Results baked into publicSnapshot.ts.
- **10 tasks.** Smaller than coding eval but more turns per task.
- **Python tasks only.** Consistent with coding eval. TypeScript is v3.
- **Cascade: Haiku → Sonnet.** Same models as coding eval for continuity.
- **MAX_TURNS = 10.** 4 Haiku turns before escalation check, 6 Sonnet turns if escalated.
- **Public page at `/ai-prototypes/agentic-eval`.** Not admin-only.
- **Temperature 0.0.** Determinism over variance.
- **Single run per task.** Cost control. Variance noted in methodology.
- **Tool output truncated to 50 lines.** Full output stored in trace, not sent to model repeatedly.
- **Per-call max_tokens.** 512 for tool selection, 2048 for write_file.
- **Compact cascade handoff.** Structured summary, not raw history dump.

---

## 15. Token Usage Dashboard (Build Metrics)

This section tracks tokens consumed across every build session. It feeds into Section 10 of the website ("Meta: what it cost to build this eval") — the final section of the portfolio page.

**Why display this:** Most portfolio pieces show the output. This one shows the cost of the thinking. Displaying build-session token consumption is a concrete demonstration of AI resource awareness — relevant signal for a PM role at Anthropic.

---

### Per-session token log

Update this table at the end of each session using the token tracker skill.

| Session | Goal | Model | Est. tokens | Est. cost (USD) | Notes |
|---|---|---|---|---|---|
| Session 1 | Planning + plan doc | Sonnet 4.6 | ~65k | ~$0.29 | Long iterative planning, multiple doc revisions |
| Session 2 | 10 task definitions | Sonnet 4.6 | ~52k | ~$0.23 | Included context summary reload |
| Session 3 | Python harness | Sonnet 4.6 | TBD | TBD | |
| Session 4 | TS types + snapshot | Sonnet 4.6 | TBD | TBD | |
| Session 5 | TraceReplayViewer | Sonnet 4.6 | TBD | TBD | |
| Session 6 | AgenticEvalShowcase + page | Sonnet 4.6 | TBD | TBD | |
| Session 7 | Run harness + deploy | Sonnet 4.6 | TBD | TBD | |

**Running total (sessions 1-2):** ~117k tokens | ~$0.52

---

### Token pricing used

Claude Sonnet 4.6: $3.00 / 1M input tokens, $15.00 / 1M output tokens.
Blended estimate: ~$4.50 / 1M tokens (assuming ~70% input, ~30% output mix in build sessions).

Formula: `est_cost = (total_tokens / 1,000,000) × 4.50`

---

### What the website shows (Section 10: Meta)

A clean summary card at the bottom of the agentic-eval portfolio page:

**"What it cost to build this"**

- Total build sessions: 7
- Total tokens consumed: ~Xk
- Estimated API cost: ~$X.XX
- Models used: Claude Sonnet 4.6 (build sessions) + Haiku 4.5 / Sonnet 4.6 (eval runs)
- Avg tokens per session: ~Xk

One-line callout:
> "Building and running this eval end-to-end cost less than a cup of coffee."

This section is honest about the economics of AI-assisted development — and that honesty is the point.

---

*End of plan. All decisions above are final unless explicitly revisited.*
