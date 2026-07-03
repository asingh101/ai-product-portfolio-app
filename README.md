# AI Product Portfolio

This is the codebase behind [ankitsingh.net](https://www.ankitsingh.net) — a portfolio I built to learn and experiment with AI products, evals, and agentic workflows using Claude and the Anthropic API.

---

## What's in here

### Claude Code Coding Eval
A 25-task benchmark I built to test how Claude Haiku 4.5 and Claude Sonnet 4.6 handle real developer work — fixing bugs, adding features, refactoring code, following vague instructions, and tracing multi-step errors.

Most coding benchmarks test whether a model can solve puzzles. This one tests whether it behaves like a thoughtful developer.

- Live page: [ankitsingh.net/ai-prototypes/coding-eval](https://www.ankitsingh.net/ai-prototypes/coding-eval)
- Eval harness: `src/scripts/run_coding_eval.py`
- Detailed write-up: `src/scripts/README.md`

**Results snapshot**

| Model | Score | Bug Fix | Feature Add | Refactor | Ambiguous | Multi-step |
|---|---|---|---|---|---|---|
| Claude Haiku 4.5 | 19/25 (76%) | 4/5 | 5/5 | 5/5 | 0/5 | 5/5 |
| Claude Sonnet 4.6 | 18/25 (72%) | 3/5 | 5/5 | 5/5 | 0/5 | 5/5 |

The most interesting finding: both models scored 0 out of 5 on ambiguous instructions. Neither asked a clarifying question. Both picked an interpretation and ran with it every time.

---

### Job Application Workflow Agent
An agentic workflow that takes a job description and resume, then produces a fit score, skill gap analysis, bullet rewrites, and a cover letter in one guided flow.

- Live page: [ankitsingh.net/ai-prototypes/job-application-workflow-agent](https://www.ankitsingh.net/ai-prototypes/job-application-workflow-agent)

---

### Profile Optimization Tool
Paste a job description and your resume. Get keyword matching, visual scan tips, and prioritized fixes to align your profile to the role.

- Live page: [ankitsingh.net/ai-prototypes/profile-optimization](https://www.ankitsingh.net/ai-prototypes/profile-optimization)

---

## Stack

- **Frontend:** Next.js (app router), TypeScript, Tailwind CSS
- **Backend:** Firebase Cloud Functions, Gemini API
- **Hosting:** Firebase Hosting
- **Eval harness:** Python, Anthropic SDK

---

## Running the eval locally

```bash
pip install anthropic python-dotenv
```

Create a `.env` file at the project root:
```
ANTHROPIC_API_KEY=your_key_here
```

Then run:
```bash
python src/scripts/run_coding_eval.py
```

Takes about 5 to 10 minutes and costs roughly $2 to $3 in API credits. Results are saved to `results.json`.

---

## Running the site locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

Built by [Ankit Singh](https://www.ankitsingh.net)
