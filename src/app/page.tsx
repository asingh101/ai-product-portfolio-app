"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Chip } from "@/components/ui/Chip";
import { useContent } from "@/hooks/useContent";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_HOME_SUBTITLE } from "@/lib/homeSubtitle";
import { CompactMarkdown } from "@/components/CompactMarkdown";
import { PORTFOLIO_LANDING_INITIAL } from "@/lib/portfolioLandingContent";
import { CompetencyMatrix } from "@/components/CompetencyMatrix";
import { HeroImageCarousel } from "@/components/HeroImageCarousel";
import { DEFAULT_COMPETENCY_MATRIX, resolveCompetencyMatrix } from "@/data/skills";
import { resolveHeroImages } from "@/lib/homeHeroImages";

const ABOUT_FOR_HUB_INITIAL = {
  headline: "Ankit Singh",
  subheadline: "",
  profileTag: "",
};

const HOME_INITIAL_DATA = {
  heroTitle: "The Strategic Bridge: Engineering Foundations × Product Strategy",
  heroBioBefore: "",
  heroBioAfter: "",
  heroSubtitle: DEFAULT_HOME_SUBTITLE,
  aiConciergeTitle: "RAG AS Bot",
  aiConciergeDesc:
    "Skip the scrolling. AMA, not literally though, since not a LLM",
  competencyMatrix: DEFAULT_COMPETENCY_MATRIX,
  galleryTitle: "Bay Area AI Immersion",
  gallerySubtitle: "A chronological visual narrative of professional growth and tech immersion in the heart of the AI revolution.",
  gallery: [] as { src: string; title: string; description?: string; link?: string }[],
  heroCarousel: [] as { src: string; title: string; description?: string }[],
  bentoHighlightTag: "Achievement",
  bentoHighlightTitle: "2025 A10 Networks Hackathon Win",
  bentoHighlightDesc: "Leading the architecture for an automated incident response system using Agentic AI frameworks to reduce MTTR by 45%.",
  bentoHighlightLink: "/portfolio",
  bentoHighlightCta: "View Project Case Study",
  bentoCtaTitle: "Book a Career Strategy Chat",
  bentoCtaDesc: "Personalized 1:1 mentorship sessions focusing on Product Operations and Technical Strategy.",
  bentoCtaLink: "/contact",
  bentoInsightTitle: "The AI-First PM: Navigating 2025's Roadmap",
  bentoInsightDesc: "How generative agents are redefining product prioritization and foundational engineering...",
  bentoInsightLink: "/blog",
  homeBriefBio:
    "I’m an engineer turned Product Manager, and I build at the intersection of product, AI strategy, engineering, execution and proficient in executive communication.",
};

type HomeContent = typeof HOME_INITIAL_DATA;
type SnapshotCard = {
  title: string;
  description: string;
  href: string;
  icon: string;
  cta: string;
};

const HIRE_EMAIL = "ankit.singh101@gmail.com";

const SNAPSHOT_ACCENTS = [
  "from-indigo-500/10 to-violet-500/10",
  "from-blue-500/10 to-cyan-500/10",
  "from-fuchsia-500/10 to-pink-500/10",
  "from-emerald-500/10 to-teal-500/10",
  "from-amber-500/10 to-orange-500/10",
  "from-purple-500/10 to-indigo-500/10",
  "from-sky-500/10 to-blue-500/10",
];

function HubChatPanel({
  content,
  hubInput,
  setHubInput,
  openChatWith,
}: {
  content: HomeContent;
  hubInput: string;
  setHubInput: (v: string) => void;
  openChatWith: (prompt: string) => void;
}) {
  return (
    <div className="border border-outline-variant/10 rounded-2xl bg-surface-container-low/90 dark:bg-surface-container/60 px-4 py-10 sm:px-8 md:px-12 md:py-12 lg:px-14 relative overflow-hidden">
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <h2 className="font-[family-name:var(--font-headline)] text-3xl md:text-4xl font-bold mb-4">
          {content.aiConciergeTitle}
        </h2>
        <CompactMarkdown
          text={(content.aiConciergeDesc || "").replace(/,?\s*lol!?/gi, "").trim()}
          className="text-on-surface-variant font-[family-name:var(--font-body)] text-base md:text-xl mb-8"
        />

        <div className="bg-surface-container-lowest p-2 rounded-xl flex items-center shadow-sm ghost-border">
          <input
            className="w-full bg-transparent border-none focus:outline-none px-4 py-1.5 font-[family-name:var(--font-body)] text-base md:text-lg text-on-surface placeholder:text-on-surface-variant/50"
            placeholder="e.g. 'Tell me about Ankit's experience'..."
            type="text"
            value={hubInput}
            onChange={(e) => setHubInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && hubInput.trim()) {
                openChatWith(hubInput.trim());
                setHubInput("");
              }
            }}
          />
          <button
            type="button"
            className="bg-primary text-on-primary p-3.5 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center"
            onClick={() => {
              if (hubInput.trim()) {
                openChatWith(hubInput.trim());
                setHubInput("");
              }
            }}
          >
            <span className="material-symbols-outlined text-xl">send</span>
          </button>
        </div>

        <div className="flex gap-2 mt-4 flex-wrap justify-center">
          {["Career Path", "Tech Stack", "Contact"].map((chip) => (
            <button key={chip} type="button" onClick={() => openChatWith(`Tell me about Ankit's ${chip.toLowerCase()}`)}>
              <Chip variant="filter">{chip}</Chip>
            </button>
          ))}
        </div>
      </div>
      <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-primary/3 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}

export default function HubPage() {
  const { content } = useContent("home", HOME_INITIAL_DATA);
  const { content: aboutContent } = useContent("about", ABOUT_FOR_HUB_INITIAL);
  const { content: portfolioContent } = useContent(
    "portfolio_landing",
    PORTFOLIO_LANDING_INITIAL
  );
  const { content: linkedinContent } = useContent("linkedin", {
    headerTitle: "Professional Insights",
    headerSubtitle:
      "A curated feed of my latest thoughts, frameworks, and discussions on Product Management, Operations, and AI Strategy.",
    posts: [],
  });
  const { content: contactContent } = useContent("contact", {
    heroDescription:
      "Whether you're looking to discuss product management opportunities, need strategic mentorship, or want to collaborate on a new project, let's connect.",
    mentorshipSectionTitle: "Mentorship Sessions",
  });
  const { isAdmin } = useAuth();
  const [hubInput, setHubInput] = useState("");
  const [isHireOpen, setIsHireOpen] = useState(false);
  const [hireMessage, setHireMessage] = useState("");
  const [hireName, setHireName] = useState("");
  const [hireSenderEmail, setHireSenderEmail] = useState("");
  const [hirePhone, setHirePhone] = useState("");
  const [hireSubmitting, setHireSubmitting] = useState(false);
  const [hireSubmitError, setHireSubmitError] = useState<string | null>(null);

  const openHireModal = () => {
    setHireMessage("");
    setHireName("");
    setHireSenderEmail("");
    setHirePhone("");
    setHireSubmitError(null);
    setHireSubmitting(false);
    setIsHireOpen(true);
  };

  const closeHireModal = () => {
    setIsHireOpen(false);
  };

  const handleHireSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = hireMessage.trim();
    if (!message || hireSubmitting) return;

    setHireSubmitting(true);
    setHireSubmitError(null);

    const sender = hireSenderEmail.trim();
    const name = hireName.trim();
    const phone = hirePhone.trim();

    try {
      await addDoc(collection(db, "hire_inquiries"), {
        message,
        name: name || null,
        email: sender || null,
        phone: phone || null,
        page: "home",
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("[hire inquiry submit]", error);
      setHireSubmitError("Message could not be saved. Please try again.");
      setHireSubmitting(false);
      return;
    }

    const lines: string[] = [];
    if (name) lines.push(`Name: ${name}`);
    if (sender) lines.push(`Email: ${sender}`);
    if (phone) lines.push(`Phone: ${phone}`);
    lines.push("", `Message:\n${message}`);

    const subject = encodeURIComponent("Hire inquiry from ankitsingh.net");
    const body = encodeURIComponent(lines.join(""));
    window.location.href = `mailto:${HIRE_EMAIL}?subject=${subject}&body=${body}`;
    closeHireModal();
  };

  const snapshotCards: SnapshotCard[] = [
    {
      title: "About",
      description:
        aboutContent.subheadline ||
        "Learn about Ankit's background, leadership approach, and operating philosophy.",
      href: "/about",
      icon: "person",
      cta: "Read full story",
    },
    {
      title: "Resume",
      description:
        "View role progression, outcomes, and core strengths across engineering and product strategy.",
      href: "/resume",
      icon: "history_edu",
      cta: "Open resume",
    },
    {
      title: "Portfolio",
      description:
        portfolioContent.heroDescription ||
        "Explore case studies spanning product, GTM strategy, and business impact.",
      href: "/portfolio",
      icon: "work",
      cta: "View projects",
    },
    {
      title: "Events",
      description:
        "Catch conferences, hackathons, speaking sessions, and notable milestones.",
      href: "/events",
      icon: "event",
      cta: "See events",
    },
    {
      title: "Blog",
      description:
        "Read strategic insights on AI, product management, and execution frameworks.",
      href: "/blog",
      icon: "article",
      cta: "Read insights",
    },
    {
      title: "LinkedIn",
      description:
        linkedinContent.headerSubtitle ||
        "Browse thought leadership posts and practical takes from current projects.",
      href: "/linkedin",
      icon: "share",
      cta: "Open LinkedIn feed",
    },
    {
      title: "Contact",
      description:
        contactContent.heroDescription ||
        "Book mentorship or reach out for collaboration opportunities.",
      href: "/contact",
      icon: "call",
      cta: "Get in touch",
    },
  ];

  const briefBio =
    (content.homeBriefBio || "").trim() ||
    (aboutContent.subheadline || "").trim() ||
    "Strategic operator bridging technical execution and product outcomes.";

  // Ensure the homepage always reflects the latest intended positioning,
  // even if Firestore `site_content/home` has older copy saved.
  const canonicalBriefBio =
    "I’m an engineer turned Product Manager, and I build at the intersection of product, AI strategy, engineering, execution and proficient in executive communication.";

  const canonicalAiConciergeDesc =
    "Skip the scrolling. AMA, not literally though, since not a LLM";

  const openChatWith = (prompt: string) => {
    if ((window as any).__openChat) {
      (window as any).__openChat(prompt);
    }
  };

  const heroImages = useMemo(
    () => resolveHeroImages(content.heroCarousel),
    [content.heroCarousel]
  );

  return (
    <>
    <main className="pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {isAdmin && (
        <div className="fixed bottom-4 left-4 sm:bottom-8 sm:left-8 z-50">
          <Link
            href="/admin/content"
            className="bg-primary text-on-primary px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs sm:text-sm font-bold hover:scale-105 transition-transform"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            Edit Website
          </Link>
        </div>
      )}

      <div className="space-y-16 md:space-y-20">
      {/* ── Brief hero snapshot ── */}
      <section>
        <article className="relative rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-7 md:p-10 overflow-hidden">
          <div className="absolute -right-16 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-24 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
          <div className="mb-8 flex justify-center">
            <HeroImageCarousel images={heroImages} />
          </div>

          <h1 className="font-[family-name:var(--font-headline)] text-4xl sm:text-5xl md:text-[3.5rem] font-extrabold tracking-tight leading-[1.06] mb-5">
            {content.heroTitle}
          </h1>
          <CompactMarkdown
            text={canonicalBriefBio || briefBio}
            className="text-on-surface-variant text-lg md:text-xl leading-relaxed max-w-3xl"
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-sm">person</span>
              Explore About me
            </Link>
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 bg-surface-container-high text-on-surface px-5 py-3 rounded-xl font-bold text-sm hover:bg-surface-container-highest transition-colors"
            >
              <span className="material-symbols-outlined text-sm">work</span>
              View portfolio
            </Link>
            <button
              type="button"
              onClick={openHireModal}
              className="inline-flex items-center gap-2 bg-surface-container-high text-on-surface px-5 py-3 rounded-xl font-bold text-sm hover:bg-surface-container-highest transition-colors"
            >
              <span className="material-symbols-outlined text-sm">mail</span>
              Hire Me?
            </button>
          </div>
          </div>
        </article>
      </section>

      <section>
        <HubChatPanel
          content={{ ...content, aiConciergeDesc: canonicalAiConciergeDesc }}
          hubInput={hubInput}
          setHubInput={setHubInput}
          openChatWith={openChatWith}
        />
      </section>

      <CompetencyMatrix data={resolveCompetencyMatrix(content.competencyMatrix)} />

      {/* ── Snapshot cards linking to full sections ── */}
      <section>
        <div className="mb-6 md:mb-8 border-l-2 border-primary/70 pl-3">
          <h2 className="text-2xl md:text-[2rem] font-extrabold tracking-tight font-[family-name:var(--font-headline)]">
            Quick snapshots
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {snapshotCards.map((card, idx) => (
            <Link
              key={card.title}
              href={card.href}
              className={`group rounded-2xl border border-outline-variant/10 bg-gradient-to-br ${SNAPSHOT_ACCENTS[idx % SNAPSHOT_ACCENTS.length]} p-5 md:p-6 hover:translate-y-[-2px] transition-transform`}
            >
              <div className="flex items-center justify-between mb-5">
                <span className="text-[10px] font-black tracking-[0.2em] text-on-surface-variant/70">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="w-11 h-11 bg-primary-fixed rounded-xl flex items-center justify-center group-hover:bg-primary transition-colors">
                <span className="material-symbols-outlined text-primary group-hover:text-on-primary transition-colors text-lg">
                  {card.icon}
                </span>
              </div>
              </div>
              <h3 className="font-[family-name:var(--font-headline)] text-xl font-bold mb-2">
                {card.title}
              </h3>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-5 line-clamp-4">
                {card.description}
              </p>
              <span className="inline-flex items-center gap-1 text-primary font-bold text-sm bg-white/60 dark:bg-surface-container px-2.5 py-1.5 rounded-lg">
                {card.cta}
                <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
      </div>
    </main>

    {isHireOpen && (
      <div className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-sm flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-lg bg-surface-container-lowest rounded-3xl shadow-2xl overflow-hidden border border-outline-variant/10">
          <div className="px-6 py-5 md:px-8 border-b border-outline-variant/10 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-extrabold tracking-tight font-[family-name:var(--font-headline)]">
                Hire Me?
              </h3>
              <p className="text-on-surface-variant text-sm mt-2">
                Send a message and I&apos;ll get back within 24 hours.
              </p>
            </div>
            <button
              type="button"
              onClick={closeHireModal}
              className="w-10 h-10 rounded-full bg-surface-container-high hover:bg-surface-container-highest transition-colors flex items-center justify-center shrink-0"
              aria-label="Close"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleHireSend} className="px-6 py-6 md:px-8 space-y-5">
            <div>
              <label
                htmlFor="hire-name"
                className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3"
              >
                Your name
              </label>
              <input
                id="hire-name"
                type="text"
                value={hireName}
                onChange={(e) => setHireName(e.target.value)}
                className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Jane Doe"
                autoComplete="name"
              />
            </div>

            <div>
              <label
                htmlFor="hire-email"
                className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3"
              >
                Your email <span className="font-normal normal-case tracking-normal">(optional)</span>
              </label>
              <input
                id="hire-email"
                type="email"
                value={hireSenderEmail}
                onChange={(e) => setHireSenderEmail(e.target.value)}
                className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="hire-phone"
                className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3"
              >
                Phone number <span className="font-normal normal-case tracking-normal">(optional)</span>
              </label>
              <input
                id="hire-phone"
                type="tel"
                value={hirePhone}
                onChange={(e) => setHirePhone(e.target.value)}
                className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="555-0123"
                autoComplete="tel"
              />
            </div>

            <div>
              <label
                htmlFor="hire-message"
                className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3"
              >
                Your message
              </label>
              <textarea
                id="hire-message"
                required
                rows={5}
                value={hireMessage}
                onChange={(e) => setHireMessage(e.target.value)}
                className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y min-h-[120px]"
                placeholder="Tell me about the role, team, or how I can help..."
              />
            </div>

            {hireSubmitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {hireSubmitError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={closeHireModal}
                disabled={hireSubmitting}
                className="px-5 py-3 rounded-xl bg-surface-container-high text-on-surface font-bold text-sm hover:bg-surface-container-highest transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!hireMessage.trim() || hireSubmitting}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">send</span>
                {hireSubmitting ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}
