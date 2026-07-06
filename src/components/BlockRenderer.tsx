"use client";

import Image from "next/image";
import { ChartBlock, ContentBlock } from "@/types/blocks";
import { useState } from "react";
import { CompactMarkdown } from "@/components/CompactMarkdown";
import { PdfDocsBlock } from "@/components/PdfDocsBlock";

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

interface BlockRendererProps {
  blocks: ContentBlock[];
  /** Passed into Docs blocks for analytics / lead capture. */
  projectSlug?: string;
  projectId?: string;
}

export function BlockRenderer({ blocks, projectSlug, projectId }: BlockRendererProps) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="space-y-8">
      {blocks.map((block, idx) => (
        <RenderBlock key={idx} block={block} projectSlug={projectSlug} projectId={projectId} />
      ))}
    </div>
  );
}

function RenderBlock({
  block,
  projectSlug,
  projectId,
}: {
  block: ContentBlock;
  projectSlug?: string;
  projectId?: string;
}) {
  switch (block.type) {
    case "text":
      return (
        <CompactMarkdown
          text={block.data.text}
          trim={false}
          className="text-on-surface/85 text-lg leading-relaxed whitespace-pre-wrap"
        />
      );

    case "heading": {
      const id = slugifyHeading(block.data.text);
      return block.data.level === 2 ? (
        <h2
          id={id}
          className="scroll-mt-28 text-3xl md:text-4xl font-extrabold tracking-tight font-[family-name:var(--font-headline)]"
        >
          {block.data.text}
        </h2>
      ) : (
        <h3
          id={id}
          className="scroll-mt-28 text-2xl md:text-3xl font-bold tracking-tight font-[family-name:var(--font-headline)]"
        >
          {block.data.text}
        </h3>
      );
    }

    case "image":
      if (!block.data.url) return null;
      return (
        <figure className="rounded-2xl overflow-hidden">
          <div className="relative aspect-video">
            <Image
              src={block.data.url}
              alt={block.data.alt || ""}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>
          {block.data.caption && (
            <figcaption className="text-xs text-on-surface-variant/60 text-center mt-3 italic">
              <CompactMarkdown
                text={block.data.caption}
                className="text-inherit italic text-center"
              />
            </figcaption>
          )}
        </figure>
      );

    case "gallery":
      return <GalleryRenderer images={block.data.images} />;

    case "quote":
      return (
        <blockquote className="relative rounded-2xl border border-primary/20 bg-primary/5 px-8 py-7 overflow-hidden">
          <span
            className="pointer-events-none absolute -top-4 left-5 text-7xl font-serif text-primary/15 select-none leading-none"
            aria-hidden
          >
            &ldquo;
          </span>
          <p className="relative text-xl md:text-2xl font-medium text-on-surface leading-relaxed">
            {block.data.text}
          </p>
          {block.data.attribution && (
            <footer className="mt-4 text-sm text-on-surface-variant font-semibold tracking-wide">
              {block.data.attribution}
            </footer>
          )}
        </blockquote>
      );

    case "metrics":
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {block.data.items.map((item, i) => (
            <div
              key={i}
              className="bg-surface-container-lowest rounded-2xl p-6 text-center border border-outline-variant/10"
            >
              <div className="text-3xl font-extrabold text-primary font-[family-name:var(--font-headline)]">
                {item.value}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      );

    case "list": {
      const Tag = block.data.style === "numbered" ? "ol" : "ul";
      return (
        <Tag
          className={`space-y-3 pl-6 ${
            block.data.style === "numbered" ? "list-decimal" : "list-disc"
          }`}
        >
          {block.data.items.map((item, i) => (
            <li key={i} className="text-on-surface/80 text-lg leading-relaxed">
              <CompactMarkdown text={item} className="inline" />
            </li>
          ))}
        </Tag>
      );
    }

    case "divider":
      return <hr className="border-outline-variant/20 my-4" />;

    case "docs":
      if (!block.data.deckUrl && !block.data.reportUrl) return null;
      return (
        <PdfDocsBlock
          deckUrl={block.data.deckUrl}
          reportUrl={block.data.reportUrl}
          reportButtonText={block.data.reportButtonText}
          projectSlug={projectSlug}
          projectId={projectId}
        />
      );

    case "chart":
      return <ChartBlockRenderer data={block.data} />;

    default:
      return null;
  }
}

// ── Chart block ────────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  primary: "bg-primary",
  emerald: "bg-emerald-500",
  amber:   "bg-amber-500",
  rose:    "bg-rose-500",
  violet:  "bg-violet-500",
  blue:    "bg-blue-500",
  muted:   "bg-outline-variant/50",
};

const SERIES_COLORS = ["bg-primary", "bg-emerald-500", "bg-amber-500", "bg-violet-500"];

function ChartBlockRenderer({ data }: { data: ChartBlock["data"] }) {
  return (
    <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-outline-variant/10 bg-surface-container-low/40">
        {data.subtitle && (
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
            {data.subtitle}
          </p>
        )}
        <p className="text-xl font-extrabold font-[family-name:var(--font-headline)] text-on-surface">
          {data.title}
        </p>
        {/* Legend for grouped charts */}
        {data.chartType === "grouped" && (data.series ?? []).length > 0 && (
          <div className="flex flex-wrap gap-5 mt-3">
            {(data.series ?? []).map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${SERIES_COLORS[i] ?? "bg-primary"}`} />
                <span className="text-xs font-semibold text-on-surface-variant">{s.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-6 py-6">
        {data.chartType === "grouped"
          ? <GroupedBars data={data} />
          : <SimpleBars data={data} />}
      </div>
    </div>
  );
}

function SimpleBars({ data }: { data: ChartBlock["data"] }) {
  const items = data.items ?? [];
  const maxVal = Math.max(...items.map((i) => i.max ?? i.value), 1);

  return (
    <div className="space-y-5">
      {items.map((item, i) => {
        const pct = Math.round((item.value / maxVal) * 100);
        const colorClass = COLOR_MAP[item.color ?? "primary"] ?? "bg-primary";
        const displayVal =
          data.unit === "$"
            ? `$${item.value}`
            : `${item.value}${data.unit ?? "%"}`;

        return (
          <div key={i}>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-base font-semibold text-on-surface">{item.label}</span>
              <span className="text-sm font-bold text-on-surface tabular-nums ml-4 shrink-0">
                {displayVal}
              </span>
            </div>
            <div className="h-3 rounded-full bg-outline-variant/15 overflow-hidden">
              <div
                className={`h-full rounded-full ${colorClass} transition-all`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {item.sublabel && (
              <p className="text-xs text-on-surface-variant mt-1.5">{item.sublabel}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GroupedBars({ data }: { data: ChartBlock["data"] }) {
  const categories = data.categories ?? [];
  const series = data.series ?? [];

  return (
    <div className="space-y-6">
      {categories.map((cat, catIdx) => (
        <div key={catIdx}>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
            {cat}
          </p>
          <div className="space-y-2">
            {series.map((s, sIdx) => {
              const val = s.values[catIdx] ?? 0;
              const colorClass = SERIES_COLORS[sIdx] ?? "bg-primary";
              return (
                <div key={sIdx} className="flex items-center gap-3">
                  <span className="text-xs text-on-surface-variant w-24 shrink-0 text-right font-medium">
                    {s.name}
                  </span>
                  <div className="flex-1 h-2.5 rounded-full bg-outline-variant/15 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colorClass}`}
                      style={{ width: `${val}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-on-surface tabular-nums w-10 shrink-0">
                    {val}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Gallery ────────────────────────────────────────────────────────────────────

function GalleryRenderer({
  images,
}: {
  images: { url: string; caption?: string; alt?: string }[];
}) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  return (
    <>
      <div
        className={`grid gap-3 ${
          images.length === 1
            ? "grid-cols-1"
            : images.length === 2
            ? "grid-cols-2"
            : "grid-cols-2 md:grid-cols-3"
        }`}
      >
        {images.map((img, i) => (
          <figure
            key={i}
            className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
            onClick={() => setLightboxIdx(i)}
          >
            <Image
              src={img.url}
              alt={img.alt || ""}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="300px"
            />
            {img.caption && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
                <p className="text-white text-xs">{img.caption}</p>
              </div>
            )}
          </figure>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIdx(null); }}
            className="absolute top-6 right-6 text-white/70 hover:text-white"
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
          {lightboxIdx > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
              className="absolute left-6 text-white/70 hover:text-white"
            >
              <span className="material-symbols-outlined text-4xl">chevron_left</span>
            </button>
          )}
          {lightboxIdx < images.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
              className="absolute right-6 text-white/70 hover:text-white"
            >
              <span className="material-symbols-outlined text-4xl">chevron_right</span>
            </button>
          )}
          <div className="relative w-full max-w-4xl aspect-video">
            <Image
              src={images[lightboxIdx].url}
              alt={images[lightboxIdx].alt || ""}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
          {images[lightboxIdx].caption && (
            <p className="absolute bottom-8 text-white/80 text-sm text-center">
              {images[lightboxIdx].caption}
            </p>
          )}
        </div>
      )}
    </>
  );
}
