"use client";

import Link from "next/link";
import { CompactMarkdown } from "@/components/CompactMarkdown";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { BlockRenderer } from "@/components/BlockRenderer";
import { ContentBlock } from "@/types/blocks";

interface Project {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  metrics: { value: string; label: string }[];
  blocks: ContentBlock[];
}

export default function ProjectDetailClient({ slug: fallbackSlug }: { slug: string }) {
  const pathname = usePathname();
  const slug = pathname?.split("/").filter(Boolean).pop() || fallbackSlug;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug || slug === "_") {
      setLoading(false);
      return;
    }
    async function load() {
      try {
        const q = query(collection(db, "projects"), where("slug", "==", slug));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const doc = snap.docs[0];
          setProject({ id: doc.id, ...doc.data() } as Project);
        }
      } catch (err) {
        console.error("Failed to load project:", err);
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

  if (!project) {
    return (
      <main className="pt-28 pb-24 px-6 max-w-4xl mx-auto text-center">
        <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-6 block">search_off</span>
        <h1 className="text-3xl font-extrabold tracking-tighter font-[family-name:var(--font-headline)] mb-4">Project Not Found</h1>
        <p className="text-on-surface-variant mb-8">The case study you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/portfolio" className="text-primary font-bold inline-flex items-center gap-2">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to Portfolio
        </Link>
      </main>
    );
  }

  return (
    <main className="pt-28 pb-24 px-6 md:px-12 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-10">
        <Link href="/portfolio" className="hover:text-primary transition-colors">Portfolio</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-on-surface font-medium">{project.title}</span>
      </div>

      <header className="mb-12">
        <span className="inline-block px-4 py-1.5 bg-primary-fixed text-on-primary-fixed text-xs font-bold tracking-widest uppercase rounded-full mb-6">{project.category}</span>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter leading-[1.1] font-[family-name:var(--font-headline)] mb-6">{project.title}</h1>
        <CompactMarkdown
          text={project.description}
          className="text-xl text-on-surface-variant leading-relaxed"
        />
      </header>

      {(project.metrics || []).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {project.metrics.map((m, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-2xl p-6 text-center">
              <div className="text-3xl font-extrabold text-primary font-[family-name:var(--font-headline)]">{m.value}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">{m.label}</div>
            </div>
          ))}
        </div>
      )}

      {(project.tags || []).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-12">
          {project.tags.map((tag) => (
            <span key={tag} className="px-4 py-1.5 bg-surface-container-high rounded-full text-xs font-bold uppercase tracking-tighter">{tag}</span>
          ))}
        </div>
      )}

      {project.blocks && project.blocks.length > 0 && (
        <section className="mb-16">
          <BlockRenderer blocks={project.blocks} projectSlug={project.slug} projectId={project.id} />
        </section>
      )}

      <div className="pt-8 border-t border-outline-variant/10">
        <Link href="/portfolio" className="text-primary font-bold inline-flex items-center gap-2 hover:gap-3 transition-all">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to All Projects
        </Link>
      </div>
    </main>
  );
}
