"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import { BlockRenderer } from "@/components/BlockRenderer";
import { ContentBlock } from "@/types/blocks";
import { applyBundledEventOverlay } from "@/lib/bundledEventOverrides";

interface EventItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  date: string;
  location?: string;
  galleryIntro?: string;
  gallery: { url: string; caption?: string; alt?: string }[];
  blocks: ContentBlock[];
}

export default function EventDetailClient({ fallbackSlug }: { fallbackSlug: string }) {
  const pathname = usePathname();
  const slug = pathname?.split("/").filter(Boolean).pop() || fallbackSlug;

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!slug || slug === "_") {
      setLoading(false);
      return;
    }
    async function load() {
      try {
        const q = query(collection(db, "events"), where("slug", "==", slug));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const doc = snap.docs[0];
          const loaded = { id: doc.id, ...doc.data() } as EventItem;
          setEvent(applyBundledEventOverlay(loaded));
        }
      } catch (err) {
        console.error("Failed to load event:", err);
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

  if (!event) {
    return (
      <main className="pt-28 pb-24 px-6 max-w-4xl mx-auto text-center">
        <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-6 block">search_off</span>
        <h1 className="text-3xl font-extrabold tracking-tighter font-[family-name:var(--font-headline)] mb-4">Event Not Found</h1>
        <p className="text-on-surface-variant mb-8">The event you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/events" className="text-primary font-bold inline-flex items-center gap-2">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to Events
        </Link>
      </main>
    );
  }

  const gallery = event.gallery || [];

  return (
    <main className="pt-28 pb-24 px-6 md:px-12 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-10">
        <Link href="/events" className="hover:text-primary transition-colors">Events</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-on-surface font-medium">{event.title}</span>
      </div>

      <header className="mb-12">
        <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
          <span className="inline-block px-4 py-1.5 bg-primary-fixed text-on-primary-fixed text-xs font-bold tracking-widest uppercase rounded-full">{event.category}</span>
          {event.date && <span className="text-on-surface-variant">{event.date}</span>}
          {event.location && (
            <span className="text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">location_on</span>
              {event.location}
            </span>
          )}
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter leading-[1.1] font-[family-name:var(--font-headline)] mb-6">{event.title}</h1>
        <p className="text-xl text-on-surface-variant leading-relaxed">{event.description}</p>
      </header>

      {gallery.length > 0 && (
        <section className="mb-12">
          {event.galleryIntro && (
            <div className="mb-8 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 md:p-8">
              <p className="text-base md:text-lg text-on-surface-variant leading-relaxed font-[family-name:var(--font-body)]">
                {event.galleryIntro}
              </p>
            </div>
          )}
          <div className={`grid gap-3 ${gallery.length === 1 ? "grid-cols-1" : gallery.length === 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"}`}>
            {gallery.map((img, i) => (
              <figure key={i} className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group" onClick={() => setLightboxIdx(i)}>
                <img src={img.url} alt={img.alt || event.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {img.caption && (
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
                    <p className="text-white text-xs">{img.caption}</p>
                  </div>
                )}
              </figure>
            ))}
          </div>
        </section>
      )}

      {lightboxIdx !== null && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6" onClick={() => setLightboxIdx(null)}>
          <button onClick={(e) => { e.stopPropagation(); setLightboxIdx(null); }} className="absolute top-6 right-6 text-white/70 hover:text-white">
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
          {lightboxIdx > 0 && (
            <button onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }} className="absolute left-6 text-white/70 hover:text-white">
              <span className="material-symbols-outlined text-4xl">chevron_left</span>
            </button>
          )}
          {lightboxIdx < gallery.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }} className="absolute right-6 text-white/70 hover:text-white">
              <span className="material-symbols-outlined text-4xl">chevron_right</span>
            </button>
          )}
          <div className="relative w-full max-w-4xl aspect-video">
            <img src={gallery[lightboxIdx].url} alt={gallery[lightboxIdx].alt || ""} className="w-full h-full object-contain" />
          </div>
        </div>
      )}

      {event.blocks && event.blocks.length > 0 && (
        <section className="mb-16">
          <BlockRenderer blocks={event.blocks} />
        </section>
      )}

      <div className="pt-8 border-t border-outline-variant/10">
        <Link href="/events" className="text-primary font-bold inline-flex items-center gap-2 hover:gap-3 transition-all">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to All Events
        </Link>
      </div>
    </main>
  );
}
