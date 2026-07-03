"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { CompactMarkdown } from "@/components/CompactMarkdown";
import { useContent } from "@/hooks/useContent";
import { PORTFOLIO_LANDING_INITIAL } from "@/lib/portfolioLandingContent";
import { DEPRECATED_PORTFOLIO_SLUGS } from "@/lib/bundledPortfolioProjects";

interface Project {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  metrics: { value: string; label: string }[];
  thumbnail?: string;
  status: string;
  sortOrder?: number;
}

export default function PortfolioPage() {
  const landing = useContent("portfolio_landing", PORTFOLIO_LANDING_INITIAL);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    const q = query(
      collection(db, "projects"),
      where("status", "==", "published")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Project))
          .filter((p) => !DEPRECATED_PORTFOLIO_SLUGS.has(p.slug))
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        setProjects(docs);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const categories = ["All", ...new Set(projects.map((p) => p.category))];
  const filtered = activeCategory === "All" ? projects : projects.filter((p) => p.category === activeCategory);

  const pill = (landing.content.heroPill ?? "").trim() || PORTFOLIO_LANDING_INITIAL.heroPill;
  const lead = (landing.content.heroLead ?? "").trim();
  const accent = (landing.content.heroAccent ?? "").trim();
  const description =
    (landing.content.heroDescription ?? "").trim() || PORTFOLIO_LANDING_INITIAL.heroDescription;

  return (
    <main className="pt-28 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
      {/* Hero, copy from Site Content → Portfolio tab (Firestore site_content/portfolio_landing) */}
      <header className="mb-16">
        <span className="inline-block px-4 py-1.5 bg-primary-fixed text-on-primary-fixed text-xs font-bold tracking-widest uppercase rounded-full mb-6">
          {pill}
        </span>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface leading-[1.1] font-[family-name:var(--font-headline)] mb-6">
          {lead || accent ? (
            <>
              {lead ? <span>{lead}</span> : null}
              {lead && accent ? " " : null}
              {accent ? <span className="text-gradient">{accent}</span> : null}
            </>
          ) : (
            <span>Portfolio</span>
          )}
        </h1>
        <CompactMarkdown
          text={description}
          className="text-xl text-on-surface-variant max-w-2xl leading-relaxed"
        />
      </header>

      {/* Category Chips */}
      <div className="flex flex-wrap gap-2 mb-12">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-[family-name:var(--font-headline)] font-medium transition-colors duration-200 ${
              activeCategory === cat
                ? "bg-primary text-on-primary font-bold"
                : "bg-surface-container-highest text-on-surface-variant hover:bg-primary-fixed hover:text-on-primary-fixed"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Project Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-on-surface-variant/50">
          <span className="material-symbols-outlined text-5xl mb-4 block">folder_open</span>
          <p className="text-sm font-bold uppercase tracking-widest">No projects in this category yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filtered.map((project) => (
            <Link
              key={project.id}
              href={`/portfolio/${project.slug}`}
              className="block group"
            >
              <article className="bg-surface-container-lowest rounded-2xl overflow-hidden hover:scale-[1.003] transition-transform duration-300 h-full flex flex-col">
                {project.thumbnail && (
                  <div
                    className={`relative aspect-[16/9] ${
                      project.slug === "tesla-marketing-strategy-positioning"
                        ? "bg-white"
                        : "bg-surface-container"
                    }`}
                  >
                    <img
                      src={project.thumbnail}
                      alt={project.title}
                      className={`absolute inset-0 w-full h-full ${
                        project.slug === "tesla-marketing-strategy-positioning"
                          ? "object-contain p-8 md:p-10"
                          : "object-cover group-hover:scale-105 transition-transform duration-500"
                      }`}
                    />
                  </div>
                )}
                <div className="p-8 md:p-10 flex flex-col justify-between flex-1">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">
                      {project.category}
                    </span>
                    <h3 className="text-2xl font-bold tracking-tight mb-4 font-[family-name:var(--font-headline)] group-hover:text-primary transition-colors">
                      {project.title}
                    </h3>
                    <CompactMarkdown
                      text={project.description}
                      className="text-on-surface-variant text-sm leading-relaxed mb-6"
                    />
                    <div className="flex flex-wrap gap-2 mb-6">
                      {(project.tags || []).map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-surface-container-high rounded-full text-[10px] font-bold uppercase tracking-tighter"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    {(project.metrics || []).length > 0 && (
                      <div className="flex gap-4">
                        {project.metrics.map((m, mIdx) => (
                          <div key={mIdx} className="text-center">
                            <div className="font-[family-name:var(--font-headline)] font-extrabold text-lg text-primary">
                              {m.value}
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                              {m.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <span className="inline-flex items-center gap-2 text-primary font-bold text-sm group-hover:gap-3 transition-all">
                      View Details
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
