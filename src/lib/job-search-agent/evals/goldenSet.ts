import type { EvalCase } from "./types";

export const GOLDEN_EVAL_SET: EvalCase[] = [
  {
    id: "strong-ai-pm",
    label: "Strong AI PM match",
    category: "strong",
    resumeSnippet: `Professional Summary
Senior Product Manager with 9 years in B2B SaaS and 3 years shipping LLM-powered features.

Experience
- Launched RAG-based copilot used by 40k monthly active users; improved task completion 28%
- Partnered with ML engineers on prompt evaluation, guardrails, and latency budgets
- Owned roadmap for analytics platform serving enterprise finance and ops teams
- Ran SQL-based funnel analysis and A/B tests across onboarding and activation flows

Skills: product management, LLM, RAG, SQL, experimentation, stakeholder management, Agile`,
    jobSnippet: `AI Product Manager, NovaMind

About NovaMind
NovaMind builds LLM copilots for enterprise operations teams.

Requirements
5+ years product management in B2B SaaS
Hands-on experience shipping LLM or AI features
SQL and experimentation discipline
Strong stakeholder management

Responsibilities
Own AI product roadmap and prioritization
Partner with engineering on model evaluation and guardrails
Define success metrics for copilot adoption`,
    expectedScoreRange: [78, 95],
    expectedTier: "strong",
    mustIncludeInMatched: ["product", "LLM"],
  },
  {
    id: "weak-engineer-pm",
    label: "Weak match: engineer → PM",
    category: "weak",
    resumeSnippet: `Professional Summary
Software engineer focused on backend APIs and infrastructure.

Experience
- Built microservices in Go and Python for payments platform
- Improved API p99 latency 35% via caching and query optimization
- On-call rotation for production incidents and postmortems
- Wrote unit and integration tests; participated in code reviews

Skills: Python, Go, Kubernetes, PostgreSQL, distributed systems, CI/CD`,
    jobSnippet: `Senior Product Manager, Horizon Apps

Requirements
5+ years product management experience
Own product roadmap and prioritization for B2B SaaS
Excellent stakeholder management across engineering, design, and sales
Define OKRs and success metrics

Responsibilities
Lead quarterly planning and roadmap tradeoffs
Translate customer research into prioritized backlog
Run discovery with enterprise buyers`,
    expectedScoreRange: [5, 45],
    expectedTier: "weak",
    mustIncludeInMissing: ["roadmap", "stakeholder"],
  },
  {
    id: "partial-saas-ai-pm",
    label: "Partial match: SaaS PM, no AI",
    category: "reach",
    resumeSnippet: `Professional Summary
Product Manager with 7 years in B2B SaaS growth and platform teams.

Experience
- Owned activation and onboarding roadmap; lifted trial-to-paid conversion 22%
- Partnered with design and engineering on self-serve analytics dashboards
- Ran customer interviews and win/loss analysis for mid-market segment
- Defined quarterly OKRs and reporting for executive staff meetings

Skills: product management, B2B SaaS, SQL, A/B testing, roadmapping, Agile, Jira`,
    jobSnippet: `AI Product Manager, Lattice ML

About Lattice ML
Lattice ML builds generative AI tools for revenue teams.

Requirements
Product management experience in B2B SaaS
Direct experience shipping LLM or generative AI products
Familiarity with prompt engineering and model evaluation
Strong analytical skills

Responsibilities
Define AI feature roadmap from research to launch
Collaborate with ML team on fine-tuning and eval harnesses`,
    expectedScoreRange: [45, 65],
    expectedTier: "reach",
    mustIncludeInMissing: ["LLM", "AI"],
  },
  {
    id: "overqualified-director",
    label: "Overqualified: Director → IC PM",
    category: "reach",
    resumeSnippet: `Professional Summary
Director of Product leading 4 PMs across platform and growth portfolios at a Series C SaaS company.

Experience
- Set multi-year platform strategy and annual planning for 12-engineer organization
- Managed hiring, performance reviews, and career development for product team
- Presented board-level metrics on ARR growth, retention, and expansion revenue
- Still hands-on with PRDs, roadmap reviews, and key enterprise deals

Skills: product leadership, strategy, B2B SaaS, OKRs, executive communication, hiring`,
    jobSnippet: `Product Manager, Core Workflow (IC)

Requirements
3-5 years product management experience
Own feature roadmap for workflow automation product
Write PRDs and partner with engineering on delivery
Comfortable with SQL and product analytics

Responsibilities
Ship incremental improvements to task automation
Run lightweight discovery with SMB customers`,
    expectedScoreRange: [35, 78],
    expectedTier: "reach",
    tierOneOf: ["weak", "reach"],
    mustIncludeInMatched: ["product"],
    mustIncludeInRedFlags: ["director", "senior"],
  },
  {
    id: "edge-short-resume",
    label: "Edge: minimal resume text",
    category: "edge",
    resumeSnippet: "See LinkedIn profile.",
    jobSnippet: `Product Manager

Requirements
3+ years product management
B2B SaaS experience
Strong communication skills`,
    expectedScoreRange: [0, 20],
    expectedTier: "weak",
    expectError: "VALIDATION",
  },
];
