"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import type { HeroCarouselImage } from "@/lib/homeHeroImages";

const SLIDE_DURATION_MS = 5500;
const FIRST_ADVANCE_MS = 3500;
const FADE_MS = 1200;

type HeroImageCarouselProps = {
  images: HeroCarouselImage[];
};

export function HeroImageCarousel({ images }: HeroImageCarouselProps) {
  const slides = images.length > 0 ? images : [];
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);

  const advance = useCallback(() => {
    if (slides.length <= 1) return;
    setIndex((current) => (current + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || slides.length <= 1) return;

    let intervalId: number | undefined;
    const firstId = window.setTimeout(() => {
      advance();
      intervalId = window.setInterval(advance, SLIDE_DURATION_MS);
    }, FIRST_ADVANCE_MS);

    return () => {
      window.clearTimeout(firstId);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [ready, advance, slides.length]);

  if (slides.length === 0) return null;

  const frameClassName =
    "relative w-full max-w-2xl aspect-[16/9] rounded-2xl overflow-hidden border border-outline-variant/20 shadow-[0_20px_40px_-18px_rgba(15,23,42,0.45)] bg-surface-container-lowest";

  const overlay = (
    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none z-10" />
  );

  if (slides.length === 1) {
    const slide = slides[0];
    return (
      <div className={frameClassName}>
        <Image
          src={slide.src}
          alt={slide.alt}
          fill
          className="object-contain"
          priority
          sizes="(max-width: 768px) 100vw, 900px"
        />
        {overlay}
      </div>
    );
  }

  return (
    <div className={frameClassName}>
      {slides.map((slide, slideIndex) => {
        const isActive = slideIndex === index;

        return (
          <div
            key={slide.src}
            className="absolute inset-0 transition-opacity ease-in-out"
            style={{
              opacity: isActive ? 1 : 0,
              transitionDuration: `${FADE_MS}ms`,
              zIndex: isActive ? 1 : 0,
            }}
            aria-hidden={!isActive}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              className="object-contain"
              priority={slideIndex === 0}
              sizes="(max-width: 768px) 100vw, 900px"
            />
          </div>
        );
      })}

      {overlay}

      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
        {slides.map((item, dotIndex) => (
          <button
            key={item.src}
            type="button"
            aria-label={`Show slide ${dotIndex + 1}`}
            aria-current={dotIndex === index ? "true" : undefined}
            onClick={() => setIndex(dotIndex)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              dotIndex === index ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
