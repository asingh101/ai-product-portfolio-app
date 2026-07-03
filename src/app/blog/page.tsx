"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { useContent } from "@/hooks/useContent";
import { useAuth } from "@/hooks/useAuth";

/** Blog landing, brand colors per spec (engineer-meets-MBA, no teal/green accents). */
const C = {
  bg: "#FFFFFF",
  text: "#111111",
  muted: "#555555",
  accent: "#432EDB",
  tint: "#F3F3F3",
  /** Hero banner (black + purple, no green) */
  heroBg: "#0a0a0a",
} as const;

const PLACEHOLDER_FEATURED = {
  title: "Make the switch: Bring your AI memories and chat history to Gemini.",
  excerpt:
    "A perspective on consolidating context across models, preserving what matters for product decisions, and why strategic memory design is the next layer of AI adoption.",
};

const ABOUT_SNAPSHOT = {
  headline: "Ankit Singh",
  subheadline: "",
  profileTag: "",
  headshotUrl: "/images/headshot.jpg",
};

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  thumbnail?: string;
  readTime?: string;
  date: string;
  featured: boolean;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const { content: about } = useContent("about", ABOUT_SNAPSHOT);
  const { isAdmin } = useAuth();

  useEffect(() => {
    const q = query(collection(db, "blog_posts"), where("status", "==", "published"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as BlogPost))
          .sort((a: BlogPost & { sortOrder?: number }, b: BlogPost & { sortOrder?: number }) =>
            (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
          );
        setPosts(docs);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  const fromPosts = [...new Set(posts.map((p) => p.category).filter(Boolean))];
  const filterOptions = ["All", "AI & Technology", ...fromPosts.filter((c) => c !== "AI & Technology")];

  const featuredFlagged = posts.find((p) => p.featured);
  /** Prefer flagged featured post; otherwise first published post for the hero card. */
  const featuredDisplay =
    activeCategory === "All" ? featuredFlagged ?? (posts.length > 0 ? posts[0] : null) : null;

  const allFiltered =
    activeCategory === "All"
      ? posts
      : posts.filter((p) => p.category === activeCategory);
  const otherPosts = allFiltered.filter((p) => p !== featuredDisplay);

  const showFeaturedSlot = activeCategory === "All";
  const usePlaceholderFeatured = showFeaturedSlot && posts.length === 0;

  const headshotSrc = (about.headshotUrl || "").trim() || "/images/headshot.jpg";

  if (loading) {
    return (
      <div
        className="flex min-h-[50vh] items-center justify-center"
        style={{ backgroundColor: C.bg }}
      >
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: `${C.accent}33`, borderTopColor: C.accent }}
          aria-label="Loading"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg, color: C.text }}>
      {isAdmin && (
        <div className="fixed bottom-4 left-4 sm:bottom-8 sm:left-8 z-50">
          <Link
            href="/admin/blog"
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105"
            style={{ backgroundColor: C.accent }}
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            Edit blog
          </Link>
        </div>
      )}

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-28 md:px-10 lg:px-12">
        {/* ── Part 1: Hero ── */}
        <header className="mb-12 md:mb-14">
          <span
            className="mb-6 inline-block rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.28em]"
            style={{ backgroundColor: C.accent, color: "#FFFFFF" }}
          >
            Thought Leadership
          </span>
          <h1
            className="mb-6 max-w-4xl font-[family-name:var(--font-headline)] text-4xl font-extrabold leading-[1.08] tracking-tighter md:text-6xl lg:text-7xl"
            style={{ color: C.text }}
          >
            Strategic{" "}
            <span style={{ color: C.accent }} className="whitespace-nowrap">
              Insights.
            </span>
          </h1>
          <p
            className="max-w-2xl text-lg leading-relaxed md:text-xl"
            style={{ color: C.muted }}
          >
            Perspectives on AI product management, strategic operations, and the intersection of
            engineering and business leadership.
          </p>
        </header>

        {/* ── Part 2: Filters ── */}
        <div className="mb-10 flex flex-wrap gap-2">
          {filterOptions.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className="rounded-full px-5 py-2.5 text-sm font-semibold transition-colors duration-200 font-[family-name:var(--font-headline)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                  isActive
                    ? {
                        backgroundColor: C.accent,
                        color: "#FFFFFF",
                        boxShadow: `0 0 0 2px ${C.bg}, 0 0 0 4px ${C.accent}`,
                      }
                    : {
                        backgroundColor: C.bg,
                        color: C.muted,
                        boxShadow: `inset 0 0 0 1px rgba(17,17,17,0.12)`,
                      }
                }
              >
                {cat}
              </button>
            );
          })}
        </div>

        {activeCategory !== "All" && allFiltered.length === 0 ? (
          <div className="py-20 text-center" style={{ color: C.muted }}>
            <span className="material-symbols-outlined mb-4 block text-5xl opacity-40">article</span>
            <p className="text-sm font-bold uppercase tracking-widest">No posts in this category</p>
          </div>
        ) : posts.length === 0 && !usePlaceholderFeatured ? (
          <div className="py-20 text-center" style={{ color: C.muted }}>
            <span className="material-symbols-outlined mb-4 block text-5xl opacity-40">article</span>
            <p className="text-sm font-bold uppercase tracking-widest">No posts yet</p>
          </div>
        ) : (
          <>
            {/* ── Featured (CMS, first post, or placeholder) ── */}
            {showFeaturedSlot && (featuredDisplay || usePlaceholderFeatured) && (
              <BlogFeaturedHero
                post={
                  featuredDisplay
                    ? featuredDisplay
                    : {
                        ...PLACEHOLDER_FEATURED,
                        id: "placeholder",
                        slug: "",
                        category: "Thought leadership",
                        date: "2026",
                        featured: true,
                      }
                }
                isPlaceholder={usePlaceholderFeatured}
                accent={C.accent}
                text={C.text}
                muted={C.muted}
                heroBg={C.heroBg}
                authorName={about.headline || "Ankit Singh"}
                authorRole={about.profileTag?.trim() || "MBA · AI Product & Strategy"}
                headshotSrc={headshotSrc}
              />
            )}

            {activeCategory !== "All" && allFiltered.length > 0 && (
              <div className="space-y-14">
                {allFiltered.map((post) => (
                  <BlogFeaturedHero
                    key={post.id}
                    post={post}
                    isPlaceholder={false}
                    accent={C.accent}
                    text={C.text}
                    muted={C.muted}
                    heroBg={C.heroBg}
                    authorName={about.headline || "Ankit Singh"}
                    authorRole={about.profileTag?.trim() || "MBA · AI Product & Strategy"}
                    headshotSrc={headshotSrc}
                  />
                ))}
              </div>
            )}

            {/* ── Additional posts (same full-width tile as featured) ── */}
            {showFeaturedSlot && otherPosts.length > 0 && (
              <div className="mt-14 space-y-14">
                {otherPosts.map((post) => (
                  <BlogFeaturedHero
                    key={post.id}
                    post={post}
                    isPlaceholder={false}
                    accent={C.accent}
                    text={C.text}
                    muted={C.muted}
                    heroBg={C.heroBg}
                    authorName={about.headline || "Ankit Singh"}
                    authorRole={about.profileTag?.trim() || "MBA · AI Product & Strategy"}
                    headshotSrc={headshotSrc}
                  />
                ))}
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}

/** Featured strip: dark hero + purple glow, then white band with circular avatar & byline. */
function BlogFeaturedHero({
  post,
  isPlaceholder,
  accent,
  text,
  muted,
  heroBg,
  authorName,
  authorRole,
  headshotSrc,
}: {
  post: BlogPost;
  isPlaceholder: boolean;
  accent: string;
  text: string;
  muted: string;
  heroBg: string;
  authorName: string;
  authorRole: string;
  headshotSrc: string;
}) {
  const metaLine = [post.category || "Article", post.date].filter(Boolean).join(" • ");
  const canLink = !isPlaceholder && Boolean(post.slug);
  const excerpt =
    (post.excerpt || "").trim() ||
    "Read the full article for insights on AI product strategy and leadership.";

  const shellClass =
    "group relative mb-14 block overflow-hidden rounded-2xl shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)] transition-transform duration-300 md:rounded-3xl";
  const shellStyle = { color: text };

  const inner = (
    <article className="relative">
      {/* ── Top: black hero + purple treatment ── */}
      <div
        className="relative min-h-[200px] overflow-hidden px-6 py-10 md:min-h-[240px] md:px-12 md:py-14 lg:px-16"
        style={{ backgroundColor: heroBg }}
      >
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-[55%] opacity-90 md:w-[48%]"
          style={{
            background: `radial-gradient(ellipse 80% 70% at 70% 50%, ${accent}55 0%, ${accent}18 45%, transparent 70%)`,
            filter: "blur(2px)",
          }}
        />
        <div
          className="pointer-events-none absolute -right-16 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full opacity-40 md:h-96 md:w-96"
          style={{ backgroundColor: accent, filter: "blur(80px)" }}
        />

        <div className="relative z-[1] flex gap-5 md:gap-7">
          <div
            className="mt-1 w-1 shrink-0 self-stretch rounded-full bg-white/90 md:w-[3px]"
            style={{ minHeight: "7rem" }}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="mb-4 text-sm font-medium text-white/75">{metaLine}</p>
            <h2 className="font-[family-name:var(--font-headline)] text-2xl font-extrabold leading-[1.12] tracking-tight text-white md:text-4xl lg:text-5xl">
              {post.title}
            </h2>
            {post.readTime ? (
              <p className="mt-4 text-xs font-medium text-white/50">{post.readTime} read</p>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Bottom: white, avatar + byline + repeated title + full-width bold excerpt ── */}
      <div className="border-t border-black/[0.06] bg-white px-6 py-9 md:px-12 md:py-11 lg:px-16">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-14">
          <div className="flex shrink-0 items-start gap-4">
            <div className="relative pt-2">
              <div
                className="pointer-events-none absolute -left-0.5 -top-0.5 h-3 w-3 border-l-2 border-t-2"
                style={{ borderColor: text }}
                aria-hidden
              />
              <div
                className="relative h-[4.25rem] w-[4.25rem] overflow-hidden rounded-full md:h-[4.5rem] md:w-[4.5rem]"
                style={{ boxShadow: `0 0 0 2px ${accent}40` }}
              >
                <Image
                  src={headshotSrc}
                  alt={authorName}
                  fill
                  className="object-cover"
                  sizes="72px"
                  unoptimized={headshotSrc.startsWith("http")}
                />
              </div>
            </div>
            <div className="min-w-0 pt-1">
              <p className="font-[family-name:var(--font-headline)] text-lg font-bold md:text-xl" style={{ color: text }}>
                By {authorName}
              </p>
              <p className="mt-1 text-sm font-medium leading-snug" style={{ color: muted }}>
                {authorRole}
              </p>
            </div>
          </div>

          <div
            className="min-w-0 flex-1 lg:border-l lg:pl-12"
            style={{ borderColor: "rgba(17,17,17,0.1)" }}
          >
            <p
              className="font-[family-name:var(--font-headline)] text-lg font-bold leading-snug md:text-2xl"
              style={{ color: muted }}
            >
              {post.title}
            </p>
          </div>
        </div>

        {post.thumbnail ? (
          <div className="relative mt-8 aspect-[21/9] overflow-hidden rounded-xl border border-black/[0.06] bg-[#F3F3F3]">
            <img
              src={post.thumbnail}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
            />
          </div>
        ) : null}

        <p
          className={`w-full max-w-none text-base font-semibold leading-relaxed md:text-lg ${
            post.thumbnail ? "mt-6" : "mt-8 border-t border-black/[0.06] pt-8"
          }`}
          style={{ color: text }}
        >
          {excerpt}
        </p>

        {canLink ? (
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <span
              className="inline-flex items-center gap-1 text-sm font-bold transition-all group-hover:gap-2"
              style={{ color: accent }}
            >
              Read full article
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </span>
          </div>
        ) : null}
      </div>
    </article>
  );

  if (canLink) {
    return (
      <Link href={`/blog/${post.slug}/`} className={shellClass} style={shellStyle}>
        {inner}
      </Link>
    );
  }

  return (
    <div className={shellClass} style={shellStyle}>
      {inner}
    </div>
  );
}

