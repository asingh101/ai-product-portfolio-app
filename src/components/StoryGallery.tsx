"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import Link from "next/link";

export interface StoryImage {
  src: string;
  title: string;
  description?: string;
  link?: string;
}

const FALLBACK_IMAGES: StoryImage[] = [
  { src: "/images/story/IMG_1433.jpg", title: "Tech Hub Explore" },
  { src: "/images/story/IMG_1443.jpg", title: "AI Workshops" },
  { src: "/images/story/IMG_1445.jpg", title: "Immersive Learning" },
  { src: "/images/story/IMG_1470.jpg", title: "Bay Area Vibes" },
  { src: "/images/story/IMG_1476.jpg", title: "Hardware Insights" },
  { src: "/images/story/IMG_1477.jpg", title: "Data Center Visit" },
  { src: "/images/story/IMG_1479.jpg", title: "AI Infrastructure" },
  { src: "/images/story/IMG_1480.jpg", title: "Networking" },
  { src: "/images/story/IMG_1484.jpg", title: "Expert Panels" },
  { src: "/images/story/IMG_1487.jpg", title: "Hackathon Day" },
  { src: "/images/story/IMG_1489.jpg", title: "Collab Session" },
  { src: "/images/story/IMG_1491.jpg", title: "Visionary Talks" },
  { src: "/images/story/PHOTO-2026-03-23-11-38-44.jpg", title: "Mid-Day Brainstorm" },
  { src: "/images/story/PHOTO-2026-03-23-13-48-21.jpg", title: "Lab Explorations" },
  { src: "/images/story/PHOTO-2026-03-25-15-55-48.jpg", title: "Final Pitch" },
];

interface StoryGalleryProps {
  title?: string;
  subtitle?: string;
  images?: StoryImage[];
}

export function StoryGallery({
  title = "Bay Area AI Immersion",
  subtitle = "A chronological visual narrative of professional growth and tech immersion in the heart of the AI revolution.",
  images,
}: StoryGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const displayImages = images && images.length > 0 ? images : FALLBACK_IMAGES;

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="relative group">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-[family-name:var(--font-headline)] text-3xl font-bold tracking-tight">
            {title}
          </h2>
          <p className="text-neutral-700 dark:text-on-surface-variant mt-2 max-w-2xl font-[family-name:var(--font-body)] text-base leading-relaxed">
            {subtitle}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back_ios_new</span>
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide snap-x"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {displayImages.map((img, idx) => {
          const content = (
            <div className="flex-shrink-0 w-72 h-[450px] relative rounded-2xl overflow-hidden snap-start group/card cursor-pointer">
              <Image
                src={img.src}
                alt={img.title}
                fill
                className="object-cover transition-transform duration-700 group-hover/card:scale-110"
                sizes="300px"
                priority={idx <= 3}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover/card:opacity-80 transition-opacity" />
              <div className="absolute bottom-6 left-6 text-white">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1 block">
                  Immersion
                </span>
                <h4 className="font-bold text-lg font-[family-name:var(--font-headline)]">
                  {img.title}
                </h4>
                {img.description && (
                  <p className="text-white/70 text-xs mt-1 line-clamp-2">{img.description}</p>
                )}
              </div>
              {img.link && (
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-white text-sm">arrow_forward</span>
                </div>
              )}
            </div>
          );

          return img.link ? (
            <Link key={idx} href={img.link}>{content}</Link>
          ) : (
            <div key={idx}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
