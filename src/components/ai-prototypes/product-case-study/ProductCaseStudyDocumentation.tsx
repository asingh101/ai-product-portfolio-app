"use client";

import Link from "next/link";
import {
  DocCallout,
  DocSection,
  DocTable,
  StatGrid,
} from "@/components/ai-prototypes/tech-docs/DocPrimitives";

const TOC = [
  { id: "about", label: "About this study" },
  { id: "scope-problem", label: "Scope the problem" },
  { id: "segment-users", label: "Segment users" },
  { id: "target-segment", label: "Target segment" },
  { id: "persona-journey", label: "Persona & journey" },
  { id: "prioritize-pains", label: "Prioritize pains" },
  { id: "solutions", label: "Solutions & features" },
  { id: "prioritize-features", label: "Feature priority" },
  { id: "metrics", label: "Wireframes & metrics" },
  { id: "summary", label: "Summary" },
];

export function CaseStudyTableOfContents({ activeId }: { activeId?: string }) {
  return (
    <nav className="space-y-1" aria-label="Case study sections">
      {TOC.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeId === item.id
              ? "bg-primary text-on-primary font-bold"
              : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
          }`}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

export function ProductCaseStudyDocumentation() {
  return (
    <article className="max-w-3xl">
      <DocSection id="about" title="About this study">
        <p>
          This AI Product Case Study walks through two AI tools I built and shipped: the{" "}
          <Link href="/ai-prototypes/profile-optimization" className="text-primary font-bold hover:underline">
            Profile Optimization Tool
          </Link>{" "}
          and the{" "}
          <Link href="/ai-prototypes/job-application-workflow-agent" className="text-primary font-bold hover:underline">
            Job Application Workflow Agent
          </Link>
          . Rather than just describing what they do, it shows the product thinking behind them: how I scoped
          the problem, picked the right user, mapped their journey, prioritized what to build, and defined
          what success looks like.
        </p>
        <StatGrid
          items={[
            { value: "350+", label: "Coaching sessions" },
            { value: "2", label: "Shipped AI tools" },
            { value: "8", label: "Product sense steps" },
          ]}
        />
        <DocCallout>
          Both tools grew directly from 350+ career coaching sessions, direct user observation, and my own
          active job search. Not hypothetical personas.
        </DocCallout>
      </DocSection>

      <DocSection id="scope-problem" title="Step 1: Scope the problem">
        <p>
          It started with a deliberately vague observation: job seekers are struggling with their applications.
          That&apos;s too broad to build anything meaningful, so the first step was to get specific.
        </p>
        <DocTable
          headers={["Question", "Answer"]}
          rows={[
            ["What kind of struggling?", "Not finding roles. Job boards handle discovery. The real pain is converting applications: getting past the first filter."],
            ["Where in the process?", "Before applying (is my profile ready?) and while applying (how do I tailor for this JD?)."],
            ["What channel?", "Desktop web. Job seekers prep materials at a desk, not on their phone."],
            ["Core mechanism?", "Resumes and LinkedIn profiles evaluated against a job description. The gap is the problem worth solving."],
          ]}
        />
        <DocCallout>
          Job seekers don&apos;t know how well their profile matches a specific role, and they don&apos;t have a
          fast way to close those gaps before they apply.
        </DocCallout>
        <p className="text-sm font-bold text-on-surface mt-4 mb-2">Out of scope</p>
        <DocTable
          headers={["Not solving", "Why"]}
          rows={[
            ["Job discovery", "LinkedIn and Indeed already solve this"],
            ["Interview prep", "Different tools, different moment in the journey"],
            ["Salary negotiation", "Happens after application"],
            ["Auto-applying on behalf of users", "Trust and accuracy risks are too high"],
          ]}
        />
      </DocSection>

      <DocSection id="segment-users" title="Step 2: Segment the users">
        <DocTable
          headers={["Segment", "Who they are", "Application behavior", "Core challenge"]}
          rows={[
            [
              "Early-career (0-3 yrs)",
              "Recent grads, first or second job",
              "High volume, 20-50 apps/month",
              "Generic resumes; don't know which keywords matter to recruiters or ATS",
            ],
            [
              "Mid-career (3-10 yrs)",
              "Professionals pivoting roles or industries",
              "Selective, 5-15 apps/month",
              "Rich experience but struggle to translate it; bullets describe tasks not outcomes",
            ],
            [
              "Senior / career changers",
              "Directors, VPs, or major domain switches",
              "Very selective, 2-8 apps/month",
              "Hard to condense scope; risk of appearing over- or under-qualified",
            ],
          ]}
        />
        <p className="text-sm text-on-surface-variant italic">
          Segments based on behavioral patterns observed across 350+ career coaching sessions.
        </p>
      </DocSection>

      <DocSection id="target-segment" title="Step 3: Pick the target segment">
        <p>
          <strong className="text-on-surface">Target:</strong> Mid-career professionals with 3-10 years of
          experience who are pivoting into a new role or industry, e.g. an operations manager moving into
          product management.
        </p>
        <DocTable
          headers={["Reason", "Detail"]}
          rows={[
            ["Highest pain-to-value ratio", "Experience exists. It needs reframing. AI is strong at translation without inventing facts."],
            ["Most common in coaching", "This group came up most often for tailoring help and bullet rewrites."],
            ["Invests time per application", "Selective applicants who want real return on tailoring effort."],
            ["Outcomes are measurable", "Fit scores before/after, completion rates, acceptance rates."],
          ]}
        />
      </DocSection>

      <DocSection id="persona-journey" title="Step 4: Persona & journey">
        <p className="font-bold text-on-surface mb-2">Meet Kathy, the frustrated career pivoter</p>
        <DocTable
          headers={["Attribute", "Detail"]}
          rows={[
            ["Background", "Five years in operations at a SaaS company. Vendor workflows, cross-functional projects, JIRA and Notion"],
            ["Goal", "Move into a Product Manager role at a tech company"],
            ["Behavior", "8-12 PM roles/month; 30-45 min tailoring each application; rarely hears back"],
            ["In her own words", "\"I know I have the skills. I've done PM work. But I have no idea why I'm not getting calls.\""],
          ]}
        />
        <p className="font-bold text-on-surface mt-6 mb-2">Kathy&apos;s seven-stage journey</p>
        <DocTable
          headers={["Stage", "Pain point", "Severity"]}
          rows={[
            ["Discover role", "No quick way to validate fit before committing time", "High"],
            ["Assess fit", "Slow, subjective comparison; unsure which keywords matter to ATS", "High"],
            ["Tailor resume", "Bullets describe tasks not outcomes; gives up and sends same resume", "High"],
            ["Update LinkedIn", "Profile static and generic, not positioned for target roles", "Moderate"],
            ["Write cover letter", "Generic opening; no connection to specific JD", "Moderate"],
            ["Submit", "No confidence she put her best version forward", "Low"],
            ["Wait", "No feedback loop after rejection", "Low (out of scope)"],
          ]}
        />
      </DocSection>

      <DocSection id="prioritize-pains" title="Step 5: Prioritize pain points">
        <DocTable
          headers={["Pain point", "Priority", "AI suitability"]}
          rows={[
            ["Can't quickly tell if she's a fit before tailoring", "HIGH", "High. Keyword pattern-matching is core LLM strength"],
            ["Can't rewrite bullets in JD language", "HIGH", "High. Grounded in user's existing text, low hallucination risk"],
            ["LinkedIn not positioned for target role", "MODERATE", "High. Once per campaign, not every application"],
            ["Cover letter from scratch every time", "MODERATE", "High. Best after fit analysis and rewrites"],
            ["No feedback loop after rejection", "LOW", "Low. Outside our control"],
          ]}
        />
        <p className="mt-4">
          <strong className="text-on-surface">Top pains to solve:</strong> (1) Instant fit assessment with
          grounded JD citations, (2) Bullet reframing in outcome language, (3) LinkedIn audit as a
          complementary baseline check.
        </p>
      </DocSection>

      <DocSection id="solutions" title="Step 6: List the solutions">
        <DocTable
          headers={["Feature", "Pain it solves", "How it works"]}
          rows={[
            [
              "Fit score engine",
              "Can't tell if she's a fit",
              "0-100 score with tier, keyword breakdown, and JD line citations",
            ],
            [
              "Skill gap analysis",
              "Doesn't know what's missing",
              "Required skills from JD vs. resume with evidence attached",
            ],
            [
              "Bullet rewriter",
              "Can't reframe in JD language",
              "Rewrites each bullet; user accepts or rejects one by one",
            ],
            [
              "Cover letter generator",
              "Starts from scratch",
              "Streams a letter built from fit analysis and accepted rewrites",
            ],
            [
              "LinkedIn section audit",
              "Profile not positioned",
              "Scans headline, About, Experience, Skills with JD-tied fixes",
            ],
            [
              "Match report & print",
              "No record of submission",
              "Exportable report: score, keywords, actions, print to PDF",
            ],
          ]}
        />
      </DocSection>

      <DocSection id="prioritize-features" title="Step 7: Prioritize features">
        <DocTable
          headers={["Feature", "Ship priority"]}
          rows={[
            ["Fit score & gap analysis", "SHIP FIRST. Entry point; needs only resume + JD"],
            ["Bullet rewriter", "SHIP SECOND. Conversion step; grounded in user's text"],
            ["Cover letter generator", "v1. Downstream of fit + rewrites (Step 4)"],
            ["LinkedIn section audit", "v1 parallel. Separate moment, Profile Optimization Tool"],
            ["Match report & print", "v1 bundled. Needs score first"],
          ]}
        />
        <p className="mt-4">
          The cover letter ships in the Workflow Agent because it&apos;s downstream of fit analysis and
          rewrites. The LinkedIn audit lives in Profile Optimization because it serves a different trigger:
          baseline readiness, not active application.
        </p>
      </DocSection>

      <DocSection id="metrics" title="Step 8: Wireframes & success metrics">
        <p className="font-bold text-on-surface mb-2">Profile Optimization Tool</p>
        <p className="mb-4 text-sm">
          Solves LinkedIn/resume baseline readiness. Score-first layout: match %, then gaps, then actions. Nothing
          stored between sessions. A deliberate trust decision.
        </p>
        <DocTable
          headers={["Metric", "Type", "Target"]}
          rows={[
            ["Analysis completion rate", "Primary", "> 85%"],
            ["Time to report (p50)", "Primary", "< 60 seconds"],
            ["Action plan engagement", "Secondary", "> 60% scroll past score"],
            ["Print / export rate", "Secondary", "> 20% of sessions"],
            ["AI hallucination rate", "Guardrail", "0 per 100 analyses"],
          ]}
        />

        <p className="font-bold text-on-surface mt-8 mb-2">Job Application Workflow Agent</p>
        <p className="mb-4 text-sm">
          Four-step guided workflow: Analyze Fit, Surface Gaps, Rewrite Bullets, Draft Cover Letter.
          Accept/reject on every bullet. Streaming cover letter. Golden-set regression before every ship.
        </p>
        <DocTable
          headers={["Metric", "Type", "Target"]}
          rows={[
            ["Workflow completion (all 4 steps)", "Primary", "> 60%"],
            ["Fit score accuracy (golden set)", "Primary", "5/5 per deploy"],
            ["Bullet acceptance rate", "Secondary", "> 50% of rewrites accepted"],
            ["Cover letter generation rate", "Secondary", "> 40% who reach Step 3"],
            ["Step 1 to Step 2 drop-off", "Secondary", "< 20%"],
            ["Hallucination rate", "Guardrail", "0 per 100 analyses"],
          ]}
        />
      </DocSection>

      <DocSection id="summary" title="Summary: how I think about product">
        <DocTable
          headers={["Framework step", "Decision made"]}
          rows={[
            ["Scope the problem", "Narrowed to closing the gap between profile and a specific JD"],
            ["Segment users", "Three segments by experience level and application behavior"],
            ["Pick target segment", "Mid-career pivoters. Highest pain, best AI fit, largest in coaching data"],
            ["Persona & journey", "Kathy's seven-stage journey maps real pain at every touchpoint"],
            ["Prioritize pains", "Fit assessment and bullet rewriting ranked highest"],
            ["List solutions", "Six features, each tied to a specific pain. Nothing without justification"],
            ["Prioritize features", "Fit score first, bullet rewriter second, LinkedIn audit in parallel"],
            ["Wireframes & metrics", "Primary metrics per tool + hallucination guardrails"],
          ]}
        />
        <DocCallout>
          The persona, pain points, and feature priorities are not hypothetical. They come from 350+ career
          coaching sessions, direct observation, and my own active job search.
        </DocCallout>
        <div className="no-print flex flex-wrap gap-3 mt-8">
          <Link
            href="/ai-prototypes/profile-optimization"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-base">tune</span>
            Try Profile Optimization
          </Link>
          <Link
            href="/ai-prototypes/job-application-workflow-agent"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-sm font-bold hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-base">smart_toy</span>
            Try Workflow Agent
          </Link>
          <Link
            href="/ai-prototypes/tech-docs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-sm font-bold hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-base">menu_book</span>
            Technical docs
          </Link>
        </div>
      </DocSection>
    </article>
  );
}
