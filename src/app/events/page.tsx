"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import Link from "next/link";

interface EventItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  date: string;
  location?: string;
  thumbnail?: string;
  gallery: { url: string; caption?: string }[];
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    const q = query(
      collection(db, "events"),
      where("status", "==", "published")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as EventItem))
          .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        setEvents(docs);
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

  const categories = ["All", ...new Set(events.map((e) => e.category))];
  const filtered = activeCategory === "All" ? events : events.filter((e) => e.category === activeCategory);

  return (
    <main className="pt-28 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
      {/* Hero */}
      <header className="mb-16">
        <span className="inline-block px-4 py-1.5 bg-primary-fixed text-on-primary-fixed text-xs font-bold tracking-widest uppercase rounded-full mb-6">
          Experiences &amp; Recaps
        </span>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface leading-[1.1] font-[family-name:var(--font-headline)] mb-6">
          Events &amp; <span className="text-gradient">Immersions.</span>
        </h1>
        <p className="text-xl text-on-surface-variant max-w-2xl leading-relaxed">
          Conferences, hackathons, workshops, and deep-dives into the world of technology, product, and AI.
        </p>
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

      {/* Events Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-on-surface-variant/50">
          <span className="material-symbols-outlined text-5xl mb-4 block">event</span>
          <p className="text-sm font-bold uppercase tracking-widest">No events in this category yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="block group"
            >
              <article className="bg-surface-container-lowest rounded-2xl overflow-hidden hover:scale-[1.005] transition-transform duration-300">
                <div className="relative aspect-[4/3] bg-surface-container">
                  {event.thumbnail ? (
                    <img
                      src={event.thumbnail}
                      alt={event.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (event.gallery || []).length > 0 ? (
                    <img
                      src={event.gallery[0].url}
                      alt={event.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">event</span>
                    </div>
                  )}
                  {(event.gallery || []).length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">photo_library</span>
                      {event.gallery.length}
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3 text-xs text-on-surface-variant">
                    <span className="font-bold uppercase tracking-widest text-primary">{event.category}</span>
                    {event.date && <><span>&middot;</span><span>{event.date}</span></>}
                  </div>
                  <h3 className="text-xl font-bold tracking-tight mb-2 font-[family-name:var(--font-headline)] group-hover:text-primary transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-2">
                    {event.description}
                  </p>
                  {event.location && (
                    <div className="flex items-center gap-1 mt-3 text-xs text-on-surface-variant/60">
                      <span className="material-symbols-outlined text-xs">location_on</span>
                      {event.location}
                    </div>
                  )}
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
