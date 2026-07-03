"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import { BlockRenderer } from "@/components/BlockRenderer";
import { CompactMarkdown } from "@/components/CompactMarkdown";
import { ContentBlock } from "@/types/blocks";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  thumbnail?: string;
  readTime?: string;
  date: string;
  blocks: ContentBlock[];
}

export default function BlogPostClient({ fallbackSlug }: { fallbackSlug: string }) {
  const pathname = usePathname();
  const slug = pathname?.split("/").filter(Boolean).pop() || fallbackSlug;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  const toc = useMemo(() => {
    if (!post?.blocks?.length) return [];
    return post.blocks
      .filter((b): b is Extract<ContentBlock, { type: "heading" }> => b.type === "heading")
      .map((b) => ({
        level: b.data.level,
        text: b.data.text,
        id: b.data.text
          .toLowerCase()
          .trim()
          .replace(/['"]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "")
          .slice(0, 80),
      }))
      .filter((h) => h.id && h.text);
  }, [post?.blocks]);

  useEffect(() => {
    if (!slug || slug === "_") {
      setLoading(false);
      return;
    }
    async function load() {
      try {
        const q = query(collection(db, "blog_posts"), where("slug", "==", slug));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const doc = snap.docs[0];
          setPost({ id: doc.id, ...doc.data() } as BlogPost);
        }
      } catch (err) {
        console.error("Failed to load post:", err);
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <main className="pt-28 pb-24 px-6 max-w-4xl mx-auto text-center">
        <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-6 block">search_off</span>
        <h1 className="text-3xl font-extrabold tracking-tighter font-[family-name:var(--font-headline)] mb-4">Post Not Found</h1>
        <p className="text-on-surface-variant mb-8">The article you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/blog" className="text-primary font-bold inline-flex items-center gap-2">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to Blog
        </Link>
      </main>
    );
  }

  return (
    <main className="pt-28 pb-24 px-6 md:px-12 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-10">
        <Link href="/blog" className="hover:text-primary transition-colors">
          Blog
        </Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-on-surface font-medium truncate">{post.title}</span>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr),20rem] gap-10 items-start">
        <div className="min-w-0">
          <header className="mb-12 max-w-4xl">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="inline-block px-4 py-1.5 bg-primary-fixed text-on-primary-fixed text-xs font-bold tracking-widest uppercase rounded-full">
                {post.category}
              </span>
              <span className="text-sm text-on-surface-variant">{post.date}</span>
              {post.readTime && <span className="text-sm text-on-surface-variant">&middot; {post.readTime}</span>}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter leading-[1.1] font-[family-name:var(--font-headline)] mb-6">
              {post.title}
            </h1>
            {post.excerpt && (
              <CompactMarkdown text={post.excerpt} className="text-xl text-on-surface-variant leading-relaxed" />
            )}
          </header>

          {post.thumbnail && (
            <div className="aspect-video rounded-2xl overflow-hidden mb-12 max-w-4xl">
              <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          {post.blocks && post.blocks.length > 0 && (
            <article className="mb-16 prose-custom max-w-4xl">
              <BlockRenderer blocks={post.blocks} />
            </article>
          )}

          <div className="pt-8 border-t border-outline-variant/10 max-w-4xl">
            <Link href="/blog" className="text-primary font-bold inline-flex items-center gap-2 hover:gap-3 transition-all">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back to All Posts
            </Link>
          </div>
        </div>

        <aside className="hidden lg:block sticky top-28">
          <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">On this page</p>
            {toc.length > 0 ? (
              <nav className="space-y-2">
                {toc.map((h) => (
                  <a
                    key={h.id}
                    href={`#${h.id}`}
                    className={`block text-sm font-medium hover:text-primary transition-colors ${
                      h.level === 3 ? "pl-3 text-on-surface-variant" : "text-on-surface"
                    }`}
                  >
                    {h.text}
                  </a>
                ))}
              </nav>
            ) : (
              <p className="text-sm text-on-surface-variant">Add headings in the editor to generate a table of contents.</p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
