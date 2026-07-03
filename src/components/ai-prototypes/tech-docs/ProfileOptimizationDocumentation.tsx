"use client";

import {
  DocCallout,
  DocCode,
  DocDiagram,
  DocSection,
  DocStatusBadge,
  DocTable,
  StatGrid,
} from "./DocPrimitives";
import {
  FlowDiagram,
  PipelineDiagram,
  ReportLayoutDiagram,
  SystemDiagram,
} from "./DocDiagrams";

const TOC = [
  { id: "executive-summary", label: "Executive summary" },
  { id: "problem", label: "Problem statement" },
  { id: "vision", label: "Vision & principles" },
  { id: "prd", label: "Product requirements" },
  { id: "ux", label: "User experience" },
  { id: "hld", label: "High-level design" },
  { id: "lld", label: "Low-level design" },
  { id: "outputs", label: "Outputs & reports" },
  { id: "impact", label: "Impact" },
  { id: "privacy", label: "Privacy & trust" },
  { id: "roadmap", label: "Roadmap" },
];

export function DocTableOfContents({ activeId }: { activeId?: string }) {
  return (
    <nav className="space-y-1" aria-label="Documentation sections">
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

export function ProfileOptimizationDocumentation() {
  return (
    <article className="max-w-3xl">
      <DocSection id="executive-summary" title="1. Executive summary">
        <p>
          <strong className="text-on-surface">Profile Optimization Tool</strong> is an AI product that
          helps job seekers tailor their <strong className="text-on-surface">resume</strong> and{" "}
          <strong className="text-on-surface">LinkedIn profile</strong> to a specific role before they
          apply.
        </p>
        <p>
          Users paste materials and a target job description. The system returns a visual match
          report: alignment score, keyword gaps, section checklist, and a prioritized action plan.
          No account required. Data is processed in-session only.
        </p>
        <StatGrid
          items={[
            { value: "2", label: "Tabs (Resume + LinkedIn)" },
            { value: "<60s", label: "Typical analysis" },
            { value: "0", label: "User data stored" },
          ]}
        />
        <DocCallout>
          Give every job seeker recruiter-grade profile feedback in under 60 seconds - grounded in
          their actual materials and the job they&apos;re targeting.
        </DocCallout>
      </DocSection>

      <DocSection id="problem" title="2. Problem statement">
        <DocTable
          headers={["Pain", "Reality"]}
          rows={[
            ["One resume, many jobs", "Same document reused; role-specific keywords missed"],
            ["LinkedIn ≠ resume", "Public profile is static; each application needs different emphasis"],
            ["No feedback loop", "Job boards don't explain why you weren't shortlisted"],
            ["ATS opacity", "Systems filter on structure and keywords before a human reads"],
            ["Time cost", "Tailoring per role takes 30-60 min; most people skip it"],
          ]}
        />
        <h3 className="text-lg font-bold text-on-surface mt-6 mb-3">Who feels this most</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong className="text-on-surface">Active job seekers</strong> applying to 5-20
            roles/month
          </li>
          <li>
            <strong className="text-on-surface">Career switchers</strong> reframing experience for a
            new domain
          </li>
          <li>
            <strong className="text-on-surface">Senior candidates</strong> signaling scope and
            outcomes in the first scan
          </li>
        </ul>
      </DocSection>

      <DocSection id="vision" title="3. Vision & design principles">
        <ol className="list-decimal pl-6 space-y-3">
          <li>
            <strong className="text-on-surface">Role-specific, not generic</strong> - Every
            suggestion ties to the pasted JD
          </li>
          <li>
            <strong className="text-on-surface">Scan-first UX</strong> - Score → gaps → quick wins →
            action plan
          </li>
          <li>
            <strong className="text-on-surface">Session-only privacy</strong> - No storage of resumes
            or profiles
          </li>
          <li>
            <strong className="text-on-surface">Evidence over hallucination</strong> - LLM
            guardrails forbid inventing facts
          </li>
          <li>
            <strong className="text-on-surface">Shippable prompts</strong> - CMS-editable without
            frontend redeploy
          </li>
          <li>
            <strong className="text-on-surface">Modular under one roof</strong> - One product;
            separate pipelines per input type
          </li>
        </ol>
      </DocSection>

      <DocSection id="prd" title="4. Product requirements (PRD)">
        <h3 className="text-lg font-bold text-on-surface mb-3">Scope</h3>
        <DocTable
          headers={["In scope (v1)", "Out of scope (v1)"]}
          rows={[
            [
              "Resume ↔ JD match; LinkedIn ↔ JD alignment; visual reports; print; admin CMS; usage analytics",
              "Auto-apply; PDF upload; user accounts; saved history; paid tiers; LinkedIn OAuth",
            ],
          ]}
        />
        <h3 className="text-lg font-bold text-on-surface mt-6 mb-3">Key user stories</h3>
        <DocTable
          headers={["ID", "Story"]}
          rows={[
            ["R1", "Paste resume + JD → see match % before applying"],
            ["R2", "Get keyword gaps and quantified bullet rewrites"],
            ["L1", "Link LinkedIn + target jobs → alignment scan"],
            ["L2", "Section audit: headline, about, experience, photo, banner"],
            ["H1", "Switch Resume | LinkedIn in one hub"],
            ["A1", "Admin edits prompts and loading tips in CMS"],
          ]}
        />
        <h3 className="text-lg font-bold text-on-surface mt-6 mb-3">Success metrics</h3>
        <DocTable
          headers={["Metric", "Target"]}
          rows={[
            ["Analyze completion rate", "> 85%"],
            ["Time to report (p50)", "< 60 seconds"],
            ["Tab engagement", "Resume vs LinkedIn mix"],
          ]}
        />
      </DocSection>

      <DocSection id="ux" title="5. User experience & flows">
        <DocDiagram title="Figure 1 - Information architecture & user flows">
          <FlowDiagram />
        </DocDiagram>
        <h3 className="text-lg font-bold text-on-surface mb-3">Report structure (shared visual language)</h3>
        <DocTable
          headers={["Section", "Resume", "LinkedIn"]}
          rows={[
            ["Hero score", "Match % + per-JD chips", "Alignment % + per-JD chips"],
            ["Summary", "Top gaps + quick wins", "+ cross-role themes"],
            ["Keywords", "Skill matrix table", "Skill matrix table"],
            ["Sections", "Experience + ATS checklist", "Basics + experience + skills"],
            ["Actions", "Prioritized recommendations", "+ role conflicts"],
            ["Export", "Print → Save as PDF", "Print → Save as PDF"],
          ]}
        />
      </DocSection>

      <DocSection id="hld" title="6. High-level design (HLD)">
        <p>
          <strong className="text-on-surface">Architecture pattern:</strong> Product monolith (one
          URL, one brand) + modular implementation (separate analyze pipelines, CMS configs, Cloud
          Functions).
        </p>
        <DocDiagram title="Figure 2 - System context diagram">
          <SystemDiagram />
        </DocDiagram>
        <DocDiagram title="Figure 3 - Analyze pipeline (2-step LLM + deterministic scoring)">
          <PipelineDiagram />
        </DocDiagram>
        <DocTable
          headers={["Layer", "Technology"]}
          rows={[
            ["Frontend", "Next.js 16, static export, Tailwind"],
            ["Hosting", "Firebase Hosting"],
            ["API", "Firebase Cloud Functions v2 (us-central1)"],
            ["LLM", "Gemini 3.1 Flash Lite (configurable via CMS)"],
            ["CMS", "Firestore site_content + *_config/active"],
            ["Admin auth", "Firebase Auth (email allowlist)"],
          ]}
        />
      </DocSection>

      <DocSection id="lld" title="7. Low-level design (LLD)">
        <h3 className="text-lg font-bold text-on-surface mb-3">Scoring formula (deterministic)</h3>
        <DocCode>{`alignment_score = round(
  0.45 × keyword_overlap_score +
  0.35 × checklist_pass_rate +
  0.20 × section_audit_score
)

Fit band:  ≥75% → strong  |  45-74% → moderate  |  <45% → needs_work`}</DocCode>
        <h3 className="text-lg font-bold text-on-surface mt-6 mb-3">API endpoints</h3>
        <DocTable
          headers={["Function", "Method", "Purpose"]}
          rows={[
            ["resumeOptimizerAnalyze", "POST (SSE)", "Resume + JD → Match report"],
            ["roleAlignAnalyze", "POST (SSE)", "Profile + JD(s) → Alignment report"],
            ["roleAlignFetchProfile", "POST", "LinkedIn URL → profile via Proxycurl"],
            ["recordToolUsage", "POST", "Analytics events → Firestore"],
          ]}
        />
        <h3 className="text-lg font-bold text-on-surface mt-6 mb-3">Firestore CMS model</h3>
        <DocTable
          headers={["Path", "Purpose"]}
          rows={[
            ["site_content/profile_optimization_hub", "Hub hero, tab labels"],
            ["site_content/resume_optimizer_ui", "Resume copy, loading tips"],
            ["site_content/role_align_ui", "LinkedIn copy, loading tips"],
            ["resume_optimizer_config/active", "Resume prompts, models, limits"],
            ["role_align_config/active", "LinkedIn prompts, models, limits"],
            ["tool_usage_daily/{YYYY-MM-DD}", "Usage counters"],
          ]}
        />
        <h3 className="text-lg font-bold text-on-surface mt-6 mb-3">LLM guardrails</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>Never invent employers, titles, skills, or JD requirements</li>
          <li>If uncertain, omit the recommendation</li>
          <li>Output valid JSON only</li>
          <li>On parse failure: retry at temperature 0, then deterministic fallback</li>
        </ul>
      </DocSection>

      <DocSection id="outputs" title="8. Outputs & reports">
        <DocDiagram title="Figure 4 - Match report layout (Resume & LinkedIn)">
          <ReportLayoutDiagram />
        </DocDiagram>
        <p>Each recommendation includes section, action (add/rewrite/emphasize/keep), impact, effort, issue, suggestion, JD evidence, and optional current snippet. Capped at 12 items, ranked by impact then effort.</p>
      </DocSection>

      <DocSection id="impact" title="9. Impact & outcomes">
        <DocTable
          headers={["Before", "After"]}
          rows={[
            ['Guess if resume "fits"', "See match % grounded in keywords + structure"],
            ["Generic advice blogs", "Role-specific fixes with JD evidence"],
            ["30+ min manual tailoring", "< 60s first pass; edit from action plan"],
            ["Resume and LinkedIn tuned separately", "One hub for both assets"],
          ]}
        />
        <h3 className="text-lg font-bold text-on-surface mt-6 mb-3">Portfolio signals demonstrated</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>0→1 AI product thinking - problem, scoped MVP, shippable UX</li>
          <li>Full-stack delivery - UI, serverless API, CMS, analytics</li>
          <li>Responsible AI - guardrails, fallbacks, session-only privacy</li>
          <li>Operable AI - prompts editable without redeploy</li>
          <li>Systems design - modular services under unified product surface</li>
        </ul>
      </DocSection>

      <DocSection id="privacy" title="10. Privacy, trust & safety">
        <DocTable
          headers={["Commitment", "Implementation"]}
          rows={[
            ["No account required", "Anonymous session"],
            ["No storage of content", "Analyze in memory only"],
            ["Rate limiting", "10 analyses/hour/IP"],
            ["Honest AI", "Disclaimer on every report"],
            ["Admin-only analytics", "Firestore rules restrict reads"],
          ]}
        />
      </DocSection>

      <DocSection id="roadmap" title="11. Limitations & roadmap">
        <DocTable
          headers={["Item", "Status"]}
          rows={[
            ["Resume scan E2E", <DocStatusBadge key="resume-live" variant="live">Live</DocStatusBadge>],
            [
              "LinkedIn analyze (manual profile)",
              <DocStatusBadge key="linkedin-live" variant="live">Live</DocStatusBadge>,
            ],
            [
              "LinkedIn auto-fetch (Proxycurl)",
              <DocStatusBadge key="proxycurl" variant="warning">Infra pending</DocStatusBadge>,
            ],
            [
              "Usage analytics function",
              <DocStatusBadge key="analytics" variant="warning">Deploy pending</DocStatusBadge>,
            ],
            ["PDF resume upload", <DocStatusBadge key="pdf" variant="neutral">v2</DocStatusBadge>],
            ["Eval harness for prompts", <DocStatusBadge key="eval" variant="neutral">v2</DocStatusBadge>],
          ]}
        />
      </DocSection>
    </article>
  );
}
