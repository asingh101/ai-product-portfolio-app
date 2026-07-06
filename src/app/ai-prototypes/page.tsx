"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { SiteUserCounter } from "@/components/SiteUserCounter";
import { AI_PROTOTYPES_PUBLIC, isAiPrototypesLocked } from "@/lib/featureFlags";

const LIVE_PROTOTYPES = [
  {
    icon: "psychology",
    title: "Product Case Study",
    description:
      "The thinking behind both tools: problem, user, customer research, trade-offs, and metrics.",
    href: "/ai-prototypes/product-case-study",
    status: "live" as const,
    cta: "read" as const,
  },
  {
    icon: "tune",
    title: "Profile Optimization Tool",
    description:
      "Tailor your resume and align your LinkedIn profile to target roles, keyword matching, visual scans, and prioritized fixes.",
    href: "/ai-prototypes/profile-optimization",
    status: "live" as const,
    cta: "try" as const,
  },
  {
    icon: "smart_toy",
    title: "Job Application Workflow Agent",
    description:
      "Paste a job description and resume - fit score, skill gaps, bullet rewrites, and cover letter in one guided workflow.",
    href: "/ai-prototypes/job-application-workflow-agent",
    status: "live" as const,
    cta: "try" as const,
  },
  {
    icon: "menu_book",
    title: "Tech Stuff & Docs",
    description:
      "Full product documentation - PRD, architecture, API design, scoring model, and diagrams for Profile Optimization.",
    href: "/ai-prototypes/tech-docs",
    status: "live" as const,
    cta: "read" as const,
  },
  {
    icon: "analytics",
    title: "Claude Code Coding Eval",
    description:
      "25-task benchmark comparing Claude Haiku 4.5 and Sonnet 4.6 on real developer behaviors — bug fixing, ambiguity handling, and multi-step debugging.",
    href: "/ai-prototypes/coding-eval",
    status: "live" as const,
    cta: "try" as const,
  },
  {
    icon: "hub",
    title: "Agent-Gate: Agentic Eval",
    description:
      "10-task eval where Claude autonomously fixes broken codebases using tools in a loop. Measures cascade efficiency, self-correction rate, and cost vs capability tradeoffs.",
    href: "/ai-prototypes/agentic-eval",
    status: "live" as const,
    cta: "try" as const,
  },
];

const PLANNED_PROTOTYPES = [
  {
    icon: "database",
    title: "RAG knowledge assistant",
    description: "Grounded answers with citations, eval hooks, and freshness controls.",
    status: "planned" as const,
  },
  {
    icon: "monitoring",
    title: "AI product eval dashboard",
    description: "Offline tests, human rubrics, and release gates for AI features.",
    status: "planned" as const,
  },
];

export default function AiPrototypesPage() {
  const { isAdmin } = useAuth();
  const locked = isAiPrototypesLocked();
  const showPreview = isAdmin && locked;
  const showContent = !locked || showPreview;

  return (
    <main className="pt-28 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
      {showPreview && (
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-700 text-xl shrink-0">visibility</span>
          <div>
            <p className="text-sm font-bold text-amber-900">Admin preview</p>
            <p className="text-sm text-amber-800/90 mt-1">
              This tab is locked for visitors. Set{" "}
              <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-mono">
                NEXT_PUBLIC_AI_PROTOTYPES_ENABLED=true
              </code>{" "}
              when you are ready to announce and go live.
            </p>
          </div>
        </div>
      )}

      <header className="mb-16 max-w-4xl">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-fixed text-on-primary-fixed text-xs font-bold tracking-widest uppercase rounded-full mb-6">
          {locked ? (
            <>
              <span className="material-symbols-outlined text-sm">lock</span>
              Coming soon
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">rocket_launch</span>
              Live
            </>
          )}
        </span>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1.1] font-[family-name:var(--font-headline)] mb-6">
          AI{" "}
          <span className="text-gradient">Prototypes</span>
        </h1>
        <p className="text-xl text-on-surface-variant leading-relaxed">
          {locked
            ? "Interactive AI product experiments, agents, evals, and shipped demos. Profile Optimization Tool is live."
            : "Hands-on AI product builds: architecture, demos, evaluation, and lessons from shipping agentic features."}
        </p>
      </header>

      {locked && !showPreview ? (
        <section className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-10 md:p-14 text-center max-w-2xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>
          <h2 className="text-2xl font-extrabold font-[family-name:var(--font-headline)] mb-3">
            Locked for now
          </h2>
          <p className="text-on-surface-variant leading-relaxed mb-8">
            I&apos;m building AI prototypes to showcase fluency across product, engineering, and
            evaluation. Check back soon, I&apos;ll announce when this tab goes live.
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-base">article</span>
            Read AI insights on the blog
          </Link>
        </section>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-10 border-l-4 border-primary pl-6">
            <h2 className="text-3xl font-extrabold tracking-tighter font-[family-name:var(--font-headline)]">
              {locked ? "Prototypes" : "Prototype showcase"}
            </h2>
            <SiteUserCounter className="shrink-0 ml-1" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 xl:gap-5 mb-12">
            {LIVE_PROTOTYPES.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="rounded-2xl border border-primary/20 bg-surface-container-lowest p-6 xl:p-7 flex flex-col hover:shadow-md transition-shadow group"
              >
                <div className="w-12 h-12 xl:w-14 xl:h-14 rounded-xl bg-primary-fixed flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-primary text-xl xl:text-2xl">{item.icon}</span>
                </div>
                <h3 className="text-lg xl:text-xl font-bold font-[family-name:var(--font-headline)] mb-3 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed flex-1">
                  {item.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                  <span className="material-symbols-outlined text-sm">
                    {item.cta === "read" ? "menu_book" : "arrow_forward"}
                  </span>
                  {item.cta === "read"
                    ? item.href.includes("product-case-study")
                      ? locked
                        ? "Read case study"
                        : "Read case study"
                      : locked
                        ? "Read docs"
                        : "Read documentation"
                    : locked
                      ? "Admin preview"
                      : "Try it"}
                </span>
              </Link>
            ))}

            {PLANNED_PROTOTYPES.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-8 flex flex-col opacity-80"
              >
                <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-on-surface-variant text-2xl">
                    {item.icon}
                  </span>
                </div>
                <h3 className="text-xl font-bold font-[family-name:var(--font-headline)] mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed flex-1">
                  {item.description}
                </p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant/70">
                  <span className="material-symbols-outlined text-sm">hourglass_empty</span>
                  Planned
                </span>
              </article>
            ))}
          </div>

          {!AI_PROTOTYPES_PUBLIC && showContent && (
            <p className="text-center text-sm text-on-surface-variant max-w-xl mx-auto">
              Profile Optimization Tool is available on the live site.
            </p>
          )}
        </>
      )}
    </main>
  );
}
