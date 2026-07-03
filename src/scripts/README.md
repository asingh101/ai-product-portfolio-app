# Claude Code Coding Eval

A 25-task benchmark comparing Claude Haiku 4.5 and Claude Sonnet 4.6 on real developer behaviors. Built by Ankit Singh as a learning project to experiment with how evals work in practice.

Live results: [ankitsingh.net/ai-prototypes/coding-eval](https://www.ankitsingh.net/ai-prototypes/coding-eval)

---

## Why I built this

Most coding benchmarks have blind spots:

**HumanEval** is saturated. Models score 90%+ so it no longer separates good models from great ones. It also tests isolated puzzle-solving, not how a developer actually works.

**SWE-bench** is more realistic but expensive to run. It requires cloning 12 Python repos and setting up complex environments. It also conflates retrieval skill (finding the right file) with coding skill (fixing the right thing).

**Neither benchmark tests judgment.** They don't measure whether a model asks for clarification on a vague instruction, handles ambiguous requirements, or catches a second bug hiding behind the first one.

This eval is a small attempt to fill that gap.

---

## What it tests

25 tasks across 5 categories, each adapted from real developer patterns rather than contest puzzles.

**Bug Fixing (5 tasks)**
Give the model broken code and the exact error it throws. Does it fix the root cause or just patch the symptom?

**Feature Addition (5 tasks)**
Give the model working code and ask it to add a feature. Does it add it without breaking existing behavior?

**Refactor (5 tasks)**
Give the model messy but working code and ask it to clean it up. Does the refactored version still pass the same tests?

**Ambiguous Instructions (5 tasks)**
Give the model a task where two valid interpretations exist. Does it ask for clarification, or silently pick one?

**Multi-step Debugging (5 tasks)**
Two bugs: the first is obvious. The second only appears after the first is fixed. Does the model catch both?

---

## Results

| Model | Score | Bug Fix | Feature Add | Refactor | Ambiguous | Multi-step |
|---|---|---|---|---|---|---|
| Claude Haiku 4.5 | 19/25 (76%) | 4/5 | 5/5 | 5/5 | 0/5 | 5/5 |
| Claude Sonnet 4.6 | 18/25 (72%) | 3/5 | 5/5 | 5/5 | 0/5 | 5/5 |

**Key finding:** Haiku slightly outperformed Sonnet on these tasks. Both models aced feature addition, refactoring, and multi-step debugging. The clearest finding was ambiguity handling: neither model asked a single clarifying question across all 5 ambiguous tasks. Both picked an interpretation and ran with it, every time.

This is the most practically important failure mode. A developer who silently assumes is harder to work with than one who asks.

---

## How to run it

**Requirements**
- Python 3.9+
- An Anthropic API key

**Setup**
```bash
pip install anthropic python-dotenv
```

Create a `.env` file in the project root:
```
ANTHROPIC_API_KEY=your_key_here
```

**Run**
```bash
python src/scripts/run_coding_eval.py
```

The script runs 25 tasks x 2 models x 3 runs each (150 total API calls). It takes about 5 to 10 minutes and costs roughly $2 to $3 in API credits.

Output is saved to `results.json` in the same directory.

---

## How tasks are graded

**Bug fix, feature addition, refactor, multi-step:** the model returns modified Python code. The harness runs that code against hidden test assertions. All tests must pass for the task to count as solved.

**Ambiguous tasks:** graded on whether the model acknowledged the ambiguity before proceeding. A model that states its assumption gets partial credit. A model that picks an interpretation silently gets none. The code output is not evaluated for these tasks.

**Reproducibility:** each task runs 3 times at temperature 0.2. A task is marked passed only if at least 2 out of 3 runs succeed (majority vote).

---

## What I would build next

This eval is single-shot: the model gets one attempt and stops. Real Claude Code usage is a loop where the developer writes code, runs it, reads the error, and tries again. A version 2 would wrap these same tasks in a feedback loop so the model can see what broke and keep trying. That would be a more honest test of how coding agents actually behave.

Other things worth adding: TypeScript tasks alongside Python, system prompt experiments to improve ambiguity handling, and automatic difficulty scaling based on which model tier is being tested.

---

## Project structure

```
src/
  scripts/
    run_coding_eval.py     # The eval harness (this file)
  lib/
    coding-eval/
      types.ts             # TypeScript types
      publicSnapshot.ts    # Pre-computed results for the portfolio site
  components/
    coding-eval/
      CodingEvalShowcase.tsx  # Results display component
  app/
    ai-prototypes/
      coding-eval/
        page.tsx           # Public portfolio page
```

---

Built by [Ankit Singh](https://www.ankitsingh.net) · [Portfolio](https://www.ankitsingh.net/ai-prototypes)
