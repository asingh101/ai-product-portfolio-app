"use client";

import { useContent } from "@/hooks/useContent";
import { useState, useRef } from "react";
import { uploadImage } from "@/lib/storage";
import { experiences as initialExperiences } from "@/data/experience";
import { DEFAULT_COMPETENCY_MATRIX, type SkillCategory } from "@/data/skills";
import { searchCompanyDomain } from "@/app/actions/logo";
import { GalleryUploader, GalleryImage } from "@/components/admin/GalleryUploader";
import { syncResumeToRag, syncAboutToRag, syncHomeToRag } from "@/lib/ragSync";
import { DEFAULT_HOME_SUBTITLE, subtitleParagraphs } from "@/lib/homeSubtitle";
import { MarkdownTextField } from "@/components/admin/MarkdownTextField";
import Image from "next/image";
import Link from "next/link";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PORTFOLIO_LANDING_INITIAL } from "@/lib/portfolioLandingContent";

const HOME_INITIAL_DATA = {
  heroTitle: "The Strategic Bridge: Engineering Foundations × Product Strategy",
  homeBriefBio:
    "I’m an engineer turned Product Manager, and I build at the intersection of product, AI strategy, engineering, execution and proficient in executive communication.",
  heroBioBefore: "",
  heroBioAfter: "",
  heroSubtitle: DEFAULT_HOME_SUBTITLE,
  aiConciergeTitle: "RAG AS Bot",
  aiConciergeDesc: "Skip the scrolling. AMA, not literally though, since not a LLM",
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
  headshotUrl: "",
};

const ABOUT_INITIAL_DATA = {
  headline: "Ankit Singh",
  subheadline: "Synthesizing technical rigor with commercial intuition. A strategic bridge between high-scale Computer Science and market-defining Product Strategy.",
  profileTag: "Strategic Architect",
  headshotUrl: "/images/headshot.jpg",
};

const RESUME_INITIAL_DATA = {
  experiences: initialExperiences,
};

const LINKEDIN_INITIAL_DATA = {
  headerTitle: "Professional Insights",
  headerSubtitle: "A curated feed of my latest thoughts, frameworks, and discussions on Product Management, Operations, and AI Strategy.",
  posts: [] as { content: string; date: string; url: string; topic: string; likes: number; comments: number; reposts: number }[],
};

const FEATURED_MENTORSHIP_SERVICE = {
  icon: "smart_toy",
  title: "Got Ideas?",
  description: "Let's brainstorm and build Agentic workflows!",
  duration: "30 min",
  focus: ["Agentic AI", "Workflow Design", "Rapid Prototyping"],
};

const CONTACT_INITIAL_DATA = {
  pillLabel: "Mentorship & Contact",
  heroTitleLead: "Let's Connect &",
  heroTitleAccent: "Collaborate.",
  heroDescription:
    "Whether you're looking to discuss product management opportunities, need strategic mentorship, or want to collaborate on a new project, let's connect.",
  mentorshipSectionTitle: "Mentorship Sessions",
  services: [
    FEATURED_MENTORSHIP_SERVICE,
    {
      icon: "rocket_launch",
      title: "Career Pivot Strategy",
      description:
        "Navigate the transition from engineering to product management. Build a personalized roadmap for your career pivot with concrete milestones.",
      duration: "60 min",
      focus: ["Career Roadmap", "Skill Gap Analysis", "Personal Branding"],
    },
    {
      icon: "psychology",
      title: "Product Sense Session",
      description:
        "Sharpen your product instincts. Practice case studies, mock PM interviews, and develop frameworks for user-centered product thinking.",
      duration: "45 min",
      focus: ["Case Studies", "Mock Interviews", "Product Frameworks"],
    },
    {
      icon: "architecture",
      title: "Technical Strategy Review",
      description:
        "Review system design decisions, architecture trade-offs, and scalability strategies. Bridge the gap between engineering excellence and business impact.",
      duration: "60 min",
      focus: ["System Design", "Tech Roadmap", "Scale Strategy"],
    },
  ] as {
    icon: string;
    title: string;
    description: string;
    duration: string;
    focus: string[];
  }[],
  bookingCtaTitle: "Book a Free Intro Call",
  bookingCtaDescription:
    "15-minute intro to discuss your goals and find the right mentorship track.",
  bookingCtaUrl: "https://calendar.app.google/NqLqF8ACbseDJeTN6",
  bookingCtaButtonText: "Schedule on Google Calendar",
  directContactTitle: "Reach Out Directly",
  emailLabel: "Email",
  emailAddress: "ankit.singh101@gmail.com",
  linkedinLabel: "LinkedIn",
  linkedinUrl: "https://linkedin.com/in/ankitsingh",
  linkedinDisplay: "linkedin.com/in/ankitsingh",
  locationLabel: "Location",
  locationText: "San Francisco Bay Area, CA",
  feedbackBlockTitle: "Have any feedbacks, please share",
  feedbackBlockSubtitle: "Always open to feedbacks!",
  feedbackButtonText: "Share feedback",
  feedbackFormTitle: "Share your feedback",
  feedbackFormDescription:
    "A few quick questions to help improve the experience.",
  feedbackQuestions: [
    "What were you hoping to accomplish on this site today?",
    "What worked well for you?",
    "What felt confusing, missing, or hard to use?",
    "What would make this website more helpful?",
  ] as string[],
  feedbackSuccessMessage: "Thanks for the feedback. I really appreciate it.",
};

type TabType = "home" | "about" | "resume" | "linkedin" | "portfolio" | "contact";

export default function ContentEditorPage() {
  const home = useContent("home", HOME_INITIAL_DATA);
  const about = useContent("about", ABOUT_INITIAL_DATA);
  const resume = useContent("resume", RESUME_INITIAL_DATA);
  const linkedin = useContent("linkedin", LINKEDIN_INITIAL_DATA);
  const portfolioLanding = useContent("portfolio_landing", PORTFOLIO_LANDING_INITIAL);
  const contact = useContent("contact", CONTACT_INITIAL_DATA);

  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resolvingIdx, setResolvingIdx] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDomainResolve = async (companyName: string, idx: number) => {
    const trimmed = companyName.trim();
    if (!trimmed || trimmed === "New Entry") return;
    setResolvingIdx(idx);
    try {
      const { domain } = await searchCompanyDomain(trimmed);
      if (domain) {
        const newList = [...resume.content.experiences];
        newList[idx] = { ...newList[idx], domain };
        resume.setLocalContent({ experiences: newList });
      }
    } finally {
      setResolvingIdx(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    setErrorMsg(null);
    try {
      const saveWithTimeout = (savePromise: Promise<void>, label: string) =>
        Promise.race([savePromise, new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} save timed out (30s)`)), 30000))]);
      const mergedHomeSubtitle = [home.content.heroBioBefore, home.content.heroBioAfter]
        .map((x) => (typeof x === "string" ? x.trim() : ""))
        .filter(Boolean)
        .join("\n\n");
      const headshotUrl = (about.content.headshotUrl || home.content.headshotUrl || "").trim();
      const homePayload = {
        ...home.content,
        heroSubtitle: mergedHomeSubtitle || (home.content.heroSubtitle ?? "").trim() || "",
        headshotUrl,
      };
      await Promise.all([
        saveWithTimeout(home.saveToFirestore(homePayload), "Home"),
        saveWithTimeout(about.saveToFirestore(), "About"),
        saveWithTimeout(resume.saveToFirestore(), "Resume"),
        saveWithTimeout(linkedin.saveToFirestore(), "LinkedIn"),
        saveWithTimeout(portfolioLanding.saveToFirestore(), "Portfolio landing"),
        saveWithTimeout(contact.saveToFirestore(), "Contact"),
      ]);
      home.setLocalContent({ heroSubtitle: homePayload.heroSubtitle, headshotUrl: homePayload.headshotUrl });
      // Auto-sync RAG context (fire-and-forget)
      syncHomeToRag(homePayload).catch(() => {});
      syncAboutToRag(about.content).catch(() => {});
      syncResumeToRag(resume.content.experiences).catch(() => {});
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setErrorMsg(`Error: ${err.message || "The save operation failed."}`);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErrorMsg(null);
    try {
      const url = await uploadImage(file, `site/headshot_${Date.now()}.jpg`);
      const merged = { ...about.content, headshotUrl: url };
      about.setLocalContent({ headshotUrl: url });
      await about.saveToFirestore(merged);
      await setDoc(doc(db, "site_content", "home"), { headshotUrl: url }, { merge: true });
      home.setLocalContent({ headshotUrl: url });
      syncAboutToRag(merged).catch(() => {});
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setErrorMsg(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  if (home.loading || about.loading || resume.loading || linkedin.loading || portfolioLanding.loading || contact.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl pb-20">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter font-[family-name:var(--font-headline)]">Site Content Editor</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Manage page content for Home, About, Resume, LinkedIn, and Portfolio.
          </p>
        </div>
        <button onClick={handleSave} disabled={saving} className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
          {saving ? <div className="w-4 h-4 border-2 border-on-primary/20 border-t-on-primary rounded-full animate-spin" /> : <span className="material-symbols-outlined text-lg">save</span>}
          {saving ? "Saving All..." : "Save All Changes"}
        </button>
      </header>

      {(success || errorMsg) && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 border ${success ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
          <span className="material-symbols-outlined text-lg">{success ? "check_circle" : "error"}</span>
          {success ? "Changes saved successfully!" : errorMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-outline-variant mb-8 gap-4 md:gap-8 overflow-x-auto no-scrollbar">
        {([
          { id: "home" as const, label: "Home", icon: "home" },
          { id: "about" as const, label: "About", icon: "person" },
          { id: "resume" as const, label: "Resume", icon: "history" },
          { id: "linkedin" as const, label: "LinkedIn", icon: "share" },
          { id: "portfolio" as const, label: "Portfolio", icon: "work" },
          { id: "contact" as const, label: "Contact", icon: "call" },
        ]).map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 pb-4 text-xs font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === tab.id ? "text-primary" : "text-on-surface-variant hover:text-on-surface"}`}>
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {/* ── HOME TAB ── */}
        {activeTab === "home" && (
          <>
            {/* Hero */}
            <section className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/5 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-primary">campaign</span>
                <h2 className="font-bold font-[family-name:var(--font-headline)]">Hero Section</h2>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Headline</label>
                <MarkdownTextField
                  multiline={false}
                  compactToolbar
                  value={home.content.heroTitle}
                  onChange={(v) => home.setLocalContent({ heroTitle: v })}
                  textareaClassName="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  Brief bio (Home teaser)
                </label>
                <MarkdownTextField
                  rows={4}
                  value={home.content.homeBriefBio ?? ""}
                  onChange={(v) => home.setLocalContent({ homeBriefBio: v })}
                  textareaClassName="w-full min-h-[88px] resize-y bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-[family-name:var(--font-body)] text-sm leading-relaxed"
                  placeholder="2-4 lines for Home. Detailed story should live on About."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  Bio: above chatbot
                </label>
                <p className="text-xs text-on-surface-variant mb-2">
                  Shown under the headline, before the RAG chatbot. Blank line between paragraphs. Markdown: **bold**, *italic*, lists.
                </p>
                <textarea
                  rows={10}
                  value={home.content.heroBioBefore ?? ""}
                  onChange={(e) => home.setLocalContent({ heroBioBefore: e.target.value })}
                  className="w-full min-h-[160px] resize-y bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-[family-name:var(--font-body)] text-sm leading-relaxed"
                  placeholder="Opening paragraphs..."
                />
              </div>
              {home.content.heroSubtitle?.trim() &&
                !(home.content.heroBioBefore ?? "").trim() &&
                !(home.content.heroBioAfter ?? "").trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      const p = subtitleParagraphs(home.content.heroSubtitle || "");
                      home.setLocalContent({
                        heroBioBefore: p.slice(0, 2).join("\n\n"),
                        heroBioAfter: p.slice(2).join("\n\n"),
                      });
                    }}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Split legacy subtitle into intro + closing fields (first 2 / rest)
                  </button>
                )}
              <div className="pt-4 border-t border-outline-variant/10 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                    Hero slideshow
                  </label>
                  <p className="text-xs text-on-surface-variant mb-3">
                    Top-of-page crossfade (7s per slide). Leave empty to use the built-in fountain + Bronco
                    images. Upload <strong>2 or more</strong> here to replace them. This is separate from Story
                    Gallery below.
                  </p>
                  <GalleryUploader
                    value={(home.content.heroCarousel || []).map((img: { src: string; title?: string; description?: string }) => ({
                      url: img.src,
                      caption: img.title || "",
                      alt: img.description || "",
                    }))}
                    onChange={(images: GalleryImage[]) => {
                      home.setLocalContent({
                        heroCarousel: images.map((img) => ({
                          src: img.url,
                          title: img.caption || "",
                          description: img.alt || "",
                        })),
                      });
                    }}
                    storagePath="hero-carousel"
                  />
                </div>
              </div>
            </section>

            {/* AI Concierge */}
            <section className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/5 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-primary">smart_toy</span>
                <h2 className="font-bold font-[family-name:var(--font-headline)]">AI Concierge (RAG)</h2>
              </div>
              <p className="text-xs text-on-surface-variant -mt-2">
                On the Hub, this block sits between the intro bio and the closing bio.
              </p>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Title</label>
                <MarkdownTextField
                  multiline={false}
                  compactToolbar
                  value={home.content.aiConciergeTitle}
                  onChange={(v) => home.setLocalContent({ aiConciergeTitle: v })}
                  textareaClassName="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Description</label>
                <MarkdownTextField
                  rows={4}
                  value={home.content.aiConciergeDesc}
                  onChange={(v) => home.setLocalContent({ aiConciergeDesc: v })}
                  textareaClassName="w-full min-h-[88px] resize-y bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-[family-name:var(--font-body)] text-sm leading-relaxed"
                  placeholder="Short line under the chatbot title..."
                />
              </div>
            </section>

            {/* Competency Matrix (canonical on Home) */}
            {(() => {
              const matrix = home.content.competencyMatrix ?? DEFAULT_COMPETENCY_MATRIX;
              const categories = matrix.categories?.length
                ? matrix.categories
                : DEFAULT_COMPETENCY_MATRIX.categories;

              const setMatrix = (next: typeof matrix) => {
                home.setLocalContent({ competencyMatrix: next });
              };

              const updateCategory = (catIdx: number, patch: Partial<SkillCategory>) => {
                const nextCategories = [...categories];
                nextCategories[catIdx] = { ...nextCategories[catIdx], ...patch };
                setMatrix({ ...matrix, categories: nextCategories });
              };

              const ACCENT_LABELS: Record<SkillCategory["accent"], string> = {
                product: "Product (top)",
                ai: "AI Fluency (right)",
                technical: "Technical (left)",
                execution: "Execution (bottom)",
              };

              return (
                <section className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/5 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-primary">hub</span>
                    <h2 className="font-bold font-[family-name:var(--font-headline)]">Competency Matrix</h2>
                  </div>
                  <p className="text-xs text-on-surface-variant -mt-2">
                    This is the canonical Competency Matrix. Changes appear on the Hub (Home) page after you save.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                        Section title
                      </label>
                      <input
                        type="text"
                        value={matrix.title}
                        onChange={(e) => setMatrix({ ...matrix, title: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                        Subtitle
                      </label>
                      <input
                        type="text"
                        value={matrix.subtitle}
                        onChange={(e) => setMatrix({ ...matrix, subtitle: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                        Center label (line 1)
                      </label>
                      <input
                        type="text"
                        value={matrix.centerLabel}
                        onChange={(e) => setMatrix({ ...matrix, centerLabel: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                        Center label (line 2)
                      </label>
                      <input
                        type="text"
                        value={matrix.centerSublabel}
                        onChange={(e) => setMatrix({ ...matrix, centerSublabel: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {categories.map((cat, catIdx) => (
                      <div
                        key={cat.accent}
                        className="p-5 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-4"
                      >
                        <div>
                          <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                            {ACCENT_LABELS[cat.accent]}
                          </label>
                          <input
                            type="text"
                            value={cat.title}
                            onChange={(e) => updateCategory(catIdx, { title: e.target.value })}
                            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                            Skills (one per line)
                          </label>
                          <textarea
                            rows={7}
                            value={(cat.skills || []).join("\n")}
                            onChange={(e) =>
                              updateCategory(catIdx, {
                                skills: e.target.value.split("\n").map((l) => l.trim()).filter(Boolean),
                              })
                            }
                            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-xs focus:outline-none resize-y"
                            placeholder="One skill per line..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })()}

            {/* Bio below chatbot */}
            <section className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/5 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-primary">subject</span>
                <h2 className="font-bold font-[family-name:var(--font-headline)]">Bio: below chatbot</h2>
              </div>
              <p className="text-xs text-on-surface-variant">
                Continues your story after the chatbot, then the Resume / Portfolio buttons.
              </p>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Closing paragraphs</label>
                <MarkdownTextField
                  rows={10}
                  value={home.content.heroBioAfter ?? ""}
                  onChange={(v) => home.setLocalContent({ heroBioAfter: v })}
                  textareaClassName="w-full min-h-[160px] resize-y bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-[family-name:var(--font-body)] text-sm leading-relaxed"
                  placeholder="Remaining paragraphs..."
                />
              </div>
            </section>

            {/* Gallery */}
            <section className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/5 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-primary">photo_library</span>
                <h2 className="font-bold font-[family-name:var(--font-headline)]">Story Gallery</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Gallery Title</label>
                  <MarkdownTextField
                    multiline={false}
                    compactToolbar
                    value={home.content.galleryTitle || ""}
                    onChange={(v) => home.setLocalContent({ galleryTitle: v })}
                    textareaClassName="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Gallery Subtitle</label>
                  <MarkdownTextField
                    multiline={false}
                    compactToolbar
                    value={home.content.gallerySubtitle || ""}
                    onChange={(v) => home.setLocalContent({ gallerySubtitle: v })}
                    textareaClassName="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <p className="text-xs text-on-surface-variant">
                Horizontal scroll gallery for story snapshots, not the hero slideshow at the top of the Hub.
                Add a link field to make images clickable (e.g. /events/my-event).
              </p>
              <GalleryUploader
                value={(home.content.gallery || []).map((img: any) => ({ url: img.src, caption: img.title, alt: img.description || "" }))}
                onChange={(images: GalleryImage[]) => {
                  home.setLocalContent({
                    gallery: images.map((img) => ({ src: img.url, title: img.caption || "", description: img.alt || "", link: "" })),
                  });
                }}
                storagePath="gallery"
              />
              {/* Per-image link editing */}
              {(home.content.gallery || []).length > 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest">Image Links & Descriptions</label>
                  {(home.content.gallery || []).map((img: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-[1fr_1fr_1fr] gap-2">
                      <input type="text" value={img.title || ""} onChange={(e) => { const g = [...(home.content.gallery || [])]; g[idx] = { ...g[idx], title: e.target.value }; home.setLocalContent({ gallery: g }); }} placeholder="Title" className="bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-xs focus:outline-none" />
                      <input type="text" value={img.description || ""} onChange={(e) => { const g = [...(home.content.gallery || [])]; g[idx] = { ...g[idx], description: e.target.value }; home.setLocalContent({ gallery: g }); }} placeholder="Description" className="bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-xs focus:outline-none" />
                      <input type="text" value={img.link || ""} onChange={(e) => { const g = [...(home.content.gallery || [])]; g[idx] = { ...g[idx], link: e.target.value }; home.setLocalContent({ gallery: g }); }} placeholder="Link (e.g. /events/slug)" className="bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-xs focus:outline-none" />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Bento Cards */}
            <section className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/5 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-primary">dashboard</span>
                <h2 className="font-bold font-[family-name:var(--font-headline)]">Bento Cards</h2>
              </div>
              <div className="p-4 bg-surface-container-low rounded-xl space-y-4">
                <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Highlight Card (Large)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={home.content.bentoHighlightTag || ""} onChange={(e) => home.setLocalContent({ bentoHighlightTag: e.target.value })} placeholder="Tag (e.g. Achievement)" className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-xs focus:outline-none" />
                  <input type="text" value={home.content.bentoHighlightLink || ""} onChange={(e) => home.setLocalContent({ bentoHighlightLink: e.target.value })} placeholder="Link (e.g. /portfolio)" className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-xs focus:outline-none" />
                </div>
                <MarkdownTextField
                  multiline={false}
                  compactToolbar
                  value={home.content.bentoHighlightTitle || ""}
                  onChange={(v) => home.setLocalContent({ bentoHighlightTitle: v })}
                  placeholder="Title"
                  textareaClassName="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none"
                />
                <MarkdownTextField
                  rows={4}
                  compactToolbar
                  value={home.content.bentoHighlightDesc || ""}
                  onChange={(v) => home.setLocalContent({ bentoHighlightDesc: v })}
                  placeholder="Description"
                  textareaClassName="w-full min-h-[88px] resize-y bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:outline-none leading-relaxed"
                />
                <input type="text" value={home.content.bentoHighlightCta || ""} onChange={(e) => home.setLocalContent({ bentoHighlightCta: e.target.value })} placeholder="CTA Text" className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-xs focus:outline-none" />
              </div>
              <div className="p-4 bg-surface-container-low rounded-xl space-y-4">
                <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">CTA Card (Booking)</h3>
                <MarkdownTextField
                  multiline={false}
                  compactToolbar
                  value={home.content.bentoCtaTitle || ""}
                  onChange={(v) => home.setLocalContent({ bentoCtaTitle: v })}
                  placeholder="Title"
                  textareaClassName="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none"
                />
                <MarkdownTextField
                  rows={4}
                  compactToolbar
                  value={home.content.bentoCtaDesc || ""}
                  onChange={(v) => home.setLocalContent({ bentoCtaDesc: v })}
                  placeholder="Description"
                  textareaClassName="w-full min-h-[88px] resize-y bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:outline-none leading-relaxed"
                />
                <input type="text" value={home.content.bentoCtaLink || ""} onChange={(e) => home.setLocalContent({ bentoCtaLink: e.target.value })} placeholder="Link (e.g. /contact)" className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-xs focus:outline-none" />
              </div>
              <div className="p-4 bg-surface-container-low rounded-xl space-y-4">
                <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Insight Card</h3>
                <MarkdownTextField
                  multiline={false}
                  compactToolbar
                  value={home.content.bentoInsightTitle || ""}
                  onChange={(v) => home.setLocalContent({ bentoInsightTitle: v })}
                  placeholder="Title"
                  textareaClassName="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none"
                />
                <MarkdownTextField
                  rows={4}
                  compactToolbar
                  value={home.content.bentoInsightDesc || ""}
                  onChange={(v) => home.setLocalContent({ bentoInsightDesc: v })}
                  placeholder="Description"
                  textareaClassName="w-full min-h-[88px] resize-y bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:outline-none leading-relaxed"
                />
                <input type="text" value={home.content.bentoInsightLink || ""} onChange={(e) => home.setLocalContent({ bentoInsightLink: e.target.value })} placeholder="Link (e.g. /blog)" className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-xs focus:outline-none" />
              </div>
            </section>
          </>
        )}

        {/* ── ABOUT TAB ── */}
        {activeTab === "about" && (
          <section className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/5 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary">person_outline</span>
              <h2 className="font-bold font-[family-name:var(--font-headline)]">About Header</h2>
            </div>
            <div className="flex flex-col md:flex-row gap-10">
              <div className="flex-1 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Full Name</label>
                  <MarkdownTextField
                    multiline={false}
                    compactToolbar
                    value={about.content.headline}
                    onChange={(v) => about.setLocalContent({ headline: v })}
                    textareaClassName="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Professional Tag</label>
                  <MarkdownTextField
                    multiline={false}
                    compactToolbar
                    value={about.content.profileTag}
                    onChange={(v) => about.setLocalContent({ profileTag: v })}
                    textareaClassName="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Subheadline</label>
                  <MarkdownTextField
                    rows={6}
                    value={about.content.subheadline || ""}
                    onChange={(v) => about.setLocalContent({ subheadline: v })}
                    textareaClassName="w-full min-h-[140px] resize-y bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-[family-name:var(--font-body)] text-sm leading-relaxed"
                    placeholder="Subheadline and supporting copy. Use line breaks as needed."
                  />
                </div>
              </div>
              <div className="w-full md:w-56 shrink-0">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Profile Photo</label>
                <div className="relative group aspect-square rounded-2xl bg-surface-container overflow-hidden border-2 border-dashed border-outline-variant hover:border-primary transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <Image
                    src={(about.content.headshotUrl || "").trim() || "/images/headshot.jpg"}
                    alt="Profile"
                    fill
                    className={`object-cover ${uploading ? "opacity-30 blur-sm" : ""} transition-all`}
                  />
                  {uploading && <div className="absolute inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><span className="material-symbols-outlined text-white text-3xl">add_a_photo</span></div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>
                <p className="text-[11px] text-on-surface-variant/80 mt-2 leading-snug">
                  Choosing a photo saves it to your site right away (no need to press Save).
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ── RESUME TAB ── */}
        {activeTab === "resume" && (
          <section className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/5 shadow-sm space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">history</span>
                <h2 className="font-bold font-[family-name:var(--font-headline)]">Experience Milestones</h2>
              </div>
              <button
                onClick={() => {
                  const newItem = { company: "New Entry", role: "Role", period: "2024", type: "work" as const, description: "Description...", metrics: [] };
                  resume.setLocalContent({ experiences: [newItem, ...resume.content.experiences] });
                }}
                className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">add</span> Add Entry
              </button>
            </div>
            <div className="space-y-6">
              {resume.content.experiences.map((exp: any, idx: number) => (
                <div key={idx} className="p-6 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start">
                    <div className="relative">
                      <input type="text" value={exp.company} onChange={(e) => { const newList = [...resume.content.experiences]; newList[idx] = { ...newList[idx], company: e.target.value, domain: undefined }; resume.setLocalContent({ experiences: newList }); }} onBlur={(e) => handleDomainResolve(e.target.value, idx)} className="font-bold text-primary bg-transparent border-b border-transparent focus:border-primary focus:outline-none w-full pr-6" placeholder="Company Name" />
                      {resolvingIdx === idx && <div className="absolute right-0 top-1/2 -translate-y-1/2"><div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}
                      {exp.domain && resolvingIdx !== idx && <div className="flex items-center gap-1 mt-1"><span className="material-symbols-outlined text-green-600 text-xs">check_circle</span><span className="text-[10px] text-green-700 font-medium">Matched: {exp.domain}</span></div>}
                    </div>
                    <input type="text" value={exp.period} onChange={(e) => { const newList = [...resume.content.experiences]; newList[idx] = { ...newList[idx], period: e.target.value }; resume.setLocalContent({ experiences: newList }); }} className="text-right text-xs font-bold text-on-surface bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 focus:outline-none focus:border-primary w-full md:w-32" placeholder="Year / Period" />
                  </div>
                  <div className="grid grid-cols-[1fr_auto] gap-3">
                    <input type="text" value={exp.role} onChange={(e) => { const newList = [...resume.content.experiences]; newList[idx] = { ...newList[idx], role: e.target.value }; resume.setLocalContent({ experiences: newList }); }} className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="Role / Title" />
                    <select value={exp.type || "work"} onChange={(e) => { const newList = [...resume.content.experiences]; newList[idx] = { ...newList[idx], type: e.target.value as "work" | "education" }; resume.setLocalContent({ experiences: newList }); }} className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-primary">
                      <option value="work">Career</option>
                      <option value="education">Education</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Description</label>
                    <MarkdownTextField
                      rows={4}
                      compactToolbar
                      value={exp.description || ""}
                      onChange={(v) => {
                        const newList = [...resume.content.experiences];
                        newList[idx] = { ...newList[idx], description: v };
                        resume.setLocalContent({ experiences: newList });
                      }}
                      textareaClassName="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-xs focus:outline-none resize-y"
                      placeholder="Brief description of the role..."
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Key Achievements (one per line)</label>
                    <MarkdownTextField
                      rows={4}
                      compactToolbar
                      value={(exp.achievements || []).join("\n")}
                      onChange={(v) => {
                        const newList = [...resume.content.experiences];
                        newList[idx] = { ...newList[idx], achievements: v.split("\n").filter((l: string) => l.trim()) };
                        resume.setLocalContent({ experiences: newList });
                      }}
                      textareaClassName="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-xs focus:outline-none resize-y"
                      placeholder="One achievement per line..."
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Impact metrics</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(exp.metrics || []).map((metric: { value: string; label: string }, mIdx: number) => (
                        <div key={mIdx} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={metric.value}
                            onChange={(e) => {
                              const newList = [...resume.content.experiences];
                              const metrics = [...(newList[idx].metrics || [])];
                              metrics[mIdx] = { ...metrics[mIdx], value: e.target.value };
                              newList[idx] = { ...newList[idx], metrics };
                              resume.setLocalContent({ experiences: newList });
                            }}
                            className="w-20 bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-2 py-2 text-sm font-bold focus:outline-none focus:border-primary"
                            placeholder="30+"
                          />
                          <input
                            type="text"
                            value={metric.label}
                            onChange={(e) => {
                              const newList = [...resume.content.experiences];
                              const metrics = [...(newList[idx].metrics || [])];
                              metrics[mIdx] = { ...metrics[mIdx], label: e.target.value };
                              newList[idx] = { ...newList[idx], metrics };
                              resume.setLocalContent({ experiences: newList });
                            }}
                            className="flex-1 bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-primary"
                            placeholder="User Interviews"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newList = [...resume.content.experiences];
                              const metrics = [...(newList[idx].metrics || [])];
                              metrics.splice(mIdx, 1);
                              newList[idx] = { ...newList[idx], metrics };
                              resume.setLocalContent({ experiences: newList });
                            }}
                            className="p-1.5 text-red-400 hover:text-red-600"
                            title="Remove metric"
                          >
                            <span className="material-symbols-outlined text-base">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newList = [...resume.content.experiences];
                        const metrics = [...(newList[idx].metrics || []), { value: "", label: "" }];
                        newList[idx] = { ...newList[idx], metrics };
                        resume.setLocalContent({ experiences: newList });
                      }}
                      className="mt-2 text-xs font-bold text-primary hover:opacity-80"
                    >
                      + Add metric
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
                    <div className="flex items-center gap-1">
                      <button disabled={idx === 0} onClick={() => { const newList = [...resume.content.experiences]; const temp = newList[idx - 1]; newList[idx - 1] = newList[idx]; newList[idx] = temp; resume.setLocalContent({ experiences: newList }); }} className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 disabled:opacity-30 transition-colors" title="Move up">
                        <span className="material-symbols-outlined text-lg">arrow_upward</span>
                      </button>
                      <button disabled={idx === resume.content.experiences.length - 1} onClick={() => { const newList = [...resume.content.experiences]; const temp = newList[idx + 1]; newList[idx + 1] = newList[idx]; newList[idx] = temp; resume.setLocalContent({ experiences: newList }); }} className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 disabled:opacity-30 transition-colors" title="Move down">
                        <span className="material-symbols-outlined text-lg">arrow_downward</span>
                      </button>
                      <span className="text-[10px] text-on-surface-variant/50 ml-2">{idx + 1} of {resume.content.experiences.length}</span>
                    </div>
                    <button onClick={() => { const newList = [...resume.content.experiences]; newList.splice(idx, 1); resume.setLocalContent({ experiences: newList }); }} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete entry">
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-10 border-t border-outline-variant/20">
              <p className="text-xs text-on-surface-variant">
                Competency Matrix is now managed under the <span className="font-bold">Home</span> tab (single canonical source).
              </p>
            </div>
          </section>
        )}

        {/* ── LINKEDIN TAB ── */}
        {activeTab === "linkedin" && (
          <section className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/5 shadow-sm space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">share</span>
                <h2 className="font-bold font-[family-name:var(--font-headline)]">LinkedIn Posts</h2>
              </div>
              <button onClick={() => { const newPost = { content: "", date: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }), url: "", topic: "Product Management", likes: 0, comments: 0, reposts: 0 }; linkedin.setLocalContent({ posts: [newPost, ...(linkedin.content.posts || [])] }); }} className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">add</span> Add Post
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Header Title</label>
                <MarkdownTextField
                  multiline={false}
                  compactToolbar
                  value={linkedin.content.headerTitle}
                  onChange={(v) => linkedin.setLocalContent({ headerTitle: v })}
                  textareaClassName="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Header Subtitle</label>
                <MarkdownTextField
                  rows={4}
                  value={linkedin.content.headerSubtitle}
                  onChange={(v) => linkedin.setLocalContent({ headerSubtitle: v })}
                  textareaClassName="w-full min-h-[96px] resize-y bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm leading-relaxed"
                  placeholder="Subtitle under the LinkedIn page header"
                />
              </div>
              <div className="space-y-4 mt-8">
                <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4 border-t border-outline-variant/30 pt-6">Posts</h3>
                {(linkedin.content.posts || []).map((post: any, idx: number) => (
                  <div key={idx} className="relative group/card p-6 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-4">
                    <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity bg-surface-container-low px-2 py-1 rounded-lg border border-outline-variant/50">
                      <button disabled={idx === 0} onClick={() => { const newPosts = [...linkedin.content.posts]; const temp = newPosts[idx - 1]; newPosts[idx - 1] = newPosts[idx]; newPosts[idx] = temp; linkedin.setLocalContent({ posts: newPosts }); }} className="text-on-surface-variant hover:text-primary disabled:opacity-30"><span className="material-symbols-outlined text-[20px]">arrow_upward</span></button>
                      <button disabled={idx === (linkedin.content.posts || []).length - 1} onClick={() => { const newPosts = [...linkedin.content.posts]; const temp = newPosts[idx + 1]; newPosts[idx + 1] = newPosts[idx]; newPosts[idx] = temp; linkedin.setLocalContent({ posts: newPosts }); }} className="text-on-surface-variant hover:text-primary disabled:opacity-30"><span className="material-symbols-outlined text-[20px]">arrow_downward</span></button>
                      <div className="w-px h-4 bg-outline-variant/30 mx-1"></div>
                      <button onClick={() => { const newPosts = [...linkedin.content.posts]; newPosts.splice(idx, 1); linkedin.setLocalContent({ posts: newPosts }); }} className="text-red-400 hover:text-red-600"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Topic</label>
                        <select value={post.topic || "Product Management"} onChange={(e) => { const newPosts = [...linkedin.content.posts]; newPosts[idx] = { ...newPosts[idx], topic: e.target.value }; linkedin.setLocalContent({ posts: newPosts }); }} className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                          <option>Product Management</option><option>AI &amp; Technology</option><option>Strategy</option><option>Leadership</option><option>Career</option><option>Marketing</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Date</label>
                        <input type="text" value={post.date || ""} onChange={(e) => { const newPosts = [...linkedin.content.posts]; newPosts[idx] = { ...newPosts[idx], date: e.target.value }; linkedin.setLocalContent({ posts: newPosts }); }} placeholder="e.g. March 2025" className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">LinkedIn URL</label>
                        <input type="text" value={post.url || ""} onChange={(e) => { const newPosts = [...linkedin.content.posts]; newPosts[idx] = { ...newPosts[idx], url: e.target.value }; linkedin.setLocalContent({ posts: newPosts }); }} placeholder="Paste LinkedIn post URL here" className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Likes</label><input type="number" min="0" value={post.likes || 0} onChange={(e) => { const np = [...linkedin.content.posts]; np[idx] = { ...np[idx], likes: parseInt(e.target.value) || 0 }; linkedin.setLocalContent({ posts: np }); }} className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" /></div>
                      <div><label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Comments</label><input type="number" min="0" value={post.comments || 0} onChange={(e) => { const np = [...linkedin.content.posts]; np[idx] = { ...np[idx], comments: parseInt(e.target.value) || 0 }; linkedin.setLocalContent({ posts: np }); }} className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" /></div>
                      <div><label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Reposts</label><input type="number" min="0" value={post.reposts || 0} onChange={(e) => { const np = [...linkedin.content.posts]; np[idx] = { ...np[idx], reposts: parseInt(e.target.value) || 0 }; linkedin.setLocalContent({ posts: np }); }} className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" /></div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Post Content</label>
                      <MarkdownTextField
                        rows={6}
                        value={typeof post === "string" ? post : (post.content || "")}
                        onChange={(v) => {
                          const np = [...linkedin.content.posts];
                          np[idx] =
                            typeof post === "string"
                              ? { content: v, date: "", url: "", topic: "Product Management", likes: 0, comments: 0, reposts: 0 }
                              : { ...np[idx], content: v };
                          linkedin.setLocalContent({ posts: np });
                        }}
                        placeholder="Paste the full text of your LinkedIn post here..."
                        textareaClassName="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary resize-y leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── PORTFOLIO TAB ── */}
        {activeTab === "portfolio" && (
          <section className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/5 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary">work</span>
              <h2 className="font-bold font-[family-name:var(--font-headline)]">Portfolio page hero</h2>
            </div>
            <p className="text-xs text-on-surface-variant -mt-2">
              For the <span className="font-mono text-[11px]">/portfolio</span> hero: the main line is dark, the accent line uses the gradient. If both headline fields are empty, the page shows {"\"Portfolio\""}.
            </p>
            <p className="text-xs text-on-surface-variant bg-surface-container-low rounded-xl px-4 py-3 border border-outline-variant/20">
              To edit project cards and case study pages (title, description, blocks), use{" "}
              <Link href="/admin/portfolio" className="font-bold text-primary hover:underline">
                Admin → Portfolio
              </Link>
              .
            </p>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Pill label</label>
              <input
                type="text"
                value={portfolioLanding.content.heroPill ?? ""}
                onChange={(e) => portfolioLanding.setLocalContent({ heroPill: e.target.value })}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Headline: main (dark)</label>
              <input
                type="text"
                value={portfolioLanding.content.heroLead ?? ""}
                onChange={(e) => portfolioLanding.setLocalContent({ heroLead: e.target.value })}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Headline: accent (gradient)</label>
              <input
                type="text"
                value={portfolioLanding.content.heroAccent ?? ""}
                onChange={(e) => portfolioLanding.setLocalContent({ heroAccent: e.target.value })}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Intro paragraph</label>
              <MarkdownTextField
                rows={5}
                value={portfolioLanding.content.heroDescription ?? ""}
                onChange={(v) => portfolioLanding.setLocalContent({ heroDescription: v })}
                textareaClassName="w-full min-h-[96px] resize-y bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm leading-relaxed"
                placeholder="Intro under the portfolio hero..."
              />
            </div>
          </section>
        )}

        {/* ── CONTACT TAB ── */}
        {activeTab === "contact" && (
          <div className="space-y-8">
            <section className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/5 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-primary">call</span>
                <h2 className="font-bold font-[family-name:var(--font-headline)]">Contact Page</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Pill label</label>
                  <input
                    type="text"
                    value={contact.content.pillLabel || ""}
                    onChange={(e) => contact.setLocalContent({ pillLabel: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Section title (mentorship)</label>
                  <input
                    type="text"
                    value={contact.content.mentorshipSectionTitle || ""}
                    onChange={(e) => contact.setLocalContent({ mentorshipSectionTitle: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Hero title (lead)</label>
                  <input
                    type="text"
                    value={contact.content.heroTitleLead || ""}
                    onChange={(e) => contact.setLocalContent({ heroTitleLead: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Hero title (accent)</label>
                  <input
                    type="text"
                    value={contact.content.heroTitleAccent || ""}
                    onChange={(e) => contact.setLocalContent({ heroTitleAccent: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Hero description</label>
                <MarkdownTextField
                  rows={4}
                  value={contact.content.heroDescription || ""}
                  onChange={(v) => contact.setLocalContent({ heroDescription: v })}
                  textareaClassName="w-full min-h-[88px] resize-y bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm leading-relaxed"
                />
              </div>
            </section>

            <section className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/5 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">school</span>
                  <h2 className="font-bold font-[family-name:var(--font-headline)]">Mentorship Sessions</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = [
                      ...(contact.content.services || []),
                      { icon: "lightbulb", title: "New Session", description: "", duration: "60 min", focus: [] },
                    ];
                    contact.setLocalContent({ services: next });
                  }}
                  className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">add</span> Add Session
                </button>
              </div>

              <div className="space-y-6">
                {(contact.content.services || []).map((svc: any, idx: number) => (
                  <div key={idx} className="p-6 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={svc.icon || ""}
                        onChange={(e) => {
                          const next = [...(contact.content.services || [])];
                          next[idx] = { ...next[idx], icon: e.target.value };
                          contact.setLocalContent({ services: next });
                        }}
                        placeholder="Material icon name (e.g. rocket_launch)"
                        className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-xs focus:outline-none"
                      />
                      <input
                        type="text"
                        value={svc.duration || ""}
                        onChange={(e) => {
                          const next = [...(contact.content.services || [])];
                          next[idx] = { ...next[idx], duration: e.target.value };
                          contact.setLocalContent({ services: next });
                        }}
                        placeholder="Duration (e.g. 60 min)"
                        className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...(contact.content.services || [])];
                          next.splice(idx, 1);
                          contact.setLocalContent({ services: next });
                        }}
                        className="ml-auto text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1"
                        title="Delete session"
                      >
                        <span className="material-symbols-outlined text-base">delete</span> Delete
                      </button>
                    </div>

                    <MarkdownTextField
                      multiline={false}
                      compactToolbar
                      value={svc.title || ""}
                      onChange={(v) => {
                        const next = [...(contact.content.services || [])];
                        next[idx] = { ...next[idx], title: v };
                        contact.setLocalContent({ services: next });
                      }}
                      textareaClassName="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none"
                      placeholder="Session title"
                    />

                    <MarkdownTextField
                      rows={4}
                      value={svc.description || ""}
                      onChange={(v) => {
                        const next = [...(contact.content.services || [])];
                        next[idx] = { ...next[idx], description: v };
                        contact.setLocalContent({ services: next });
                      }}
                      textareaClassName="w-full min-h-[88px] resize-y bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:outline-none leading-relaxed"
                      placeholder="Session description"
                    />

                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Focus tags (one per line)</label>
                      <MarkdownTextField
                        rows={3}
                        value={(svc.focus || []).join("\n")}
                        onChange={(v) => {
                          const next = [...(contact.content.services || [])];
                          next[idx] = { ...next[idx], focus: v.split("\n").map((l: string) => l.trim()).filter(Boolean) };
                          contact.setLocalContent({ services: next });
                        }}
                        textareaClassName="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-xs focus:outline-none resize-y"
                        placeholder="e.g. Career Roadmap"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/5 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-primary">calendar_today</span>
                <h2 className="font-bold font-[family-name:var(--font-headline)]">Booking CTA</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Title</label>
                  <input type="text" value={contact.content.bookingCtaTitle || ""} onChange={(e) => contact.setLocalContent({ bookingCtaTitle: e.target.value })} className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Button text</label>
                  <input type="text" value={contact.content.bookingCtaButtonText || ""} onChange={(e) => contact.setLocalContent({ bookingCtaButtonText: e.target.value })} className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Description</label>
                <MarkdownTextField rows={3} value={contact.content.bookingCtaDescription || ""} onChange={(v) => contact.setLocalContent({ bookingCtaDescription: v })} textareaClassName="w-full min-h-[72px] resize-y bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm leading-relaxed" />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Booking URL</label>
                <input type="text" value={contact.content.bookingCtaUrl || ""} onChange={(e) => contact.setLocalContent({ bookingCtaUrl: e.target.value })} className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              </div>
            </section>

            <section className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/5 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-primary">alternate_email</span>
                <h2 className="font-bold font-[family-name:var(--font-headline)]">Direct Contact</h2>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Section title</label>
                <input type="text" value={contact.content.directContactTitle || ""} onChange={(e) => contact.setLocalContent({ directContactTitle: e.target.value })} className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Email address</label>
                  <input type="email" value={contact.content.emailAddress || ""} onChange={(e) => contact.setLocalContent({ emailAddress: e.target.value })} className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Location</label>
                  <input type="text" value={contact.content.locationText || ""} onChange={(e) => contact.setLocalContent({ locationText: e.target.value })} className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">LinkedIn URL</label>
                  <input type="text" value={contact.content.linkedinUrl || ""} onChange={(e) => contact.setLocalContent({ linkedinUrl: e.target.value })} className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">LinkedIn display</label>
                  <input type="text" value={contact.content.linkedinDisplay || ""} onChange={(e) => contact.setLocalContent({ linkedinDisplay: e.target.value })} className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                </div>
              </div>
            </section>

            <section className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/5 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-primary">rate_review</span>
                <h2 className="font-bold font-[family-name:var(--font-headline)]">Feedback Form</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Feedback block title</label>
                  <input type="text" value={contact.content.feedbackBlockTitle || ""} onChange={(e) => contact.setLocalContent({ feedbackBlockTitle: e.target.value })} className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Button text</label>
                  <input type="text" value={contact.content.feedbackButtonText || ""} onChange={(e) => contact.setLocalContent({ feedbackButtonText: e.target.value })} className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Feedback block subtitle</label>
                <MarkdownTextField
                  rows={3}
                  value={contact.content.feedbackBlockSubtitle || ""}
                  onChange={(v) => contact.setLocalContent({ feedbackBlockSubtitle: v })}
                  textareaClassName="w-full min-h-[72px] resize-y bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm leading-relaxed"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Form title</label>
                  <input type="text" value={contact.content.feedbackFormTitle || ""} onChange={(e) => contact.setLocalContent({ feedbackFormTitle: e.target.value })} className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Success message</label>
                  <input type="text" value={contact.content.feedbackSuccessMessage || ""} onChange={(e) => contact.setLocalContent({ feedbackSuccessMessage: e.target.value })} className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Form description</label>
                <MarkdownTextField
                  rows={3}
                  value={contact.content.feedbackFormDescription || ""}
                  onChange={(v) => contact.setLocalContent({ feedbackFormDescription: v })}
                  textareaClassName="w-full min-h-[72px] resize-y bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm leading-relaxed"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest">Feedback questions</label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...(contact.content.feedbackQuestions || []), "New feedback question"];
                      contact.setLocalContent({ feedbackQuestions: next });
                    }}
                    className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">add</span> Add Question
                  </button>
                </div>
                {(contact.content.feedbackQuestions || []).map((question: string, idx: number) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <textarea
                      rows={2}
                      value={question || ""}
                      onChange={(e) => {
                        const next = [...(contact.content.feedbackQuestions || [])];
                        next[idx] = e.target.value;
                        contact.setLocalContent({ feedbackQuestions: next });
                      }}
                      className="flex-1 resize-y bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...(contact.content.feedbackQuestions || [])];
                        next.splice(idx, 1);
                        contact.setLocalContent({ feedbackQuestions: next });
                      }}
                      className="mt-1 text-red-500 hover:text-red-700"
                      title="Delete question"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
