"use client";

import Image from "next/image";
import { useContent } from "@/hooks/useContent";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { resolveHomeBioParts, DEFAULT_HOME_SUBTITLE } from "@/lib/homeSubtitle";
import { BioMarkdownBlocks } from "@/components/home/BioMarkdownBlocks";

const ABOUT_INITIAL_DATA = {
  headline: "Ankit Singh",
  subheadline: "Synthesizing technical rigor with commercial intuition. A strategic bridge between high-scale Computer Science and market-defining Product Strategy.",
  profileTag: "Strategic Architect",
  headshotUrl: "/images/headshot.jpg",
};

const HOME_BIO_FALLBACK = {
  heroBioBefore: "",
  heroBioAfter: "",
  heroSubtitle: DEFAULT_HOME_SUBTITLE,
};

export default function AboutPage() {
  const { content } = useContent("about", ABOUT_INITIAL_DATA);
  const { content: homeContent } = useContent("home", HOME_BIO_FALLBACK);
  const { isAdmin } = useAuth();
  const { before, after } = resolveHomeBioParts(homeContent);

  return (
    <main className="pt-28 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
      {isAdmin && (
        <div className="fixed bottom-4 left-4 sm:bottom-8 sm:left-8 z-50">
          <Link
            href="/admin/content"
            className="bg-primary text-on-primary px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs sm:text-sm font-bold hover:scale-105 transition-transform"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            Edit Website
          </Link>
        </div>
      )}
      {/* ── Hero Section ── */}
      <header className="mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-8">
            <span className="inline-block px-4 py-1.5 bg-primary-fixed text-on-primary-fixed text-xs font-bold tracking-widest uppercase rounded-full mb-6">
              {content.profileTag}
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface leading-[1.1] mb-8 font-[family-name:var(--font-headline)]">
              {content.headline}
            </h1>
            <p className="text-xl md:text-2xl text-on-surface-variant font-[family-name:var(--font-body)] leading-relaxed max-w-2xl">
              {content.subheadline}
            </p>
          </div>
          <div className="lg:col-span-4 flex flex-col items-start lg:items-end">
            <div className="w-full aspect-square rounded-xl bg-surface-container overflow-hidden max-w-[320px]">
              <Image
                src={content.headshotUrl}
                alt={`${content.headline} Professional Portrait`}
                width={640}
                height={640}
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                priority
              />
            </div>
          </div>
        </div>
      </header>

      {/* ── About me ── */}
      <section className="mb-24 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-8 md:p-10">
        <div className="flex items-baseline justify-between mb-8 border-l-4 border-primary pl-5">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tighter font-[family-name:var(--font-headline)]">
            About me
          </h2>
        </div>
        <div className="space-y-8">
          <BioMarkdownBlocks text={before} variant="lead" />
          <BioMarkdownBlocks text={after} variant="body" />
        </div>
      </section>

      {/* ── Leadership & Impact ── */}
      <section>
        <div className="flex items-baseline justify-between mb-12 border-l-4 border-primary pl-6">
          <h2 className="text-4xl font-extrabold tracking-tighter font-[family-name:var(--font-headline)]">
            Impact Through Leadership
          </h2>
          <p className="text-outline font-[family-name:var(--font-label)] text-sm uppercase tracking-widest hidden md:block">
            Influence Portfolio
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6">
          {/* SCU Net Impact */}
          <div className="md:col-span-2 md:row-span-2 bg-surface-container-lowest p-10 rounded-xl flex flex-col justify-between hover:scale-[1.003] transition-all duration-300">
            <div>
              <div className="w-16 h-16 bg-primary-fixed rounded-xl flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-primary text-3xl">
                  public
                </span>
              </div>
              <h3 className="text-3xl font-bold tracking-tighter mb-4 font-[family-name:var(--font-headline)]">
                President, SCU Net Impact Club
              </h3>
              <p className="text-on-surface-variant leading-relaxed mb-6">
                Leading a cohort of 100+ purpose-driven professionals. Bridging
                the gap between corporate profitability and social
                sustainability, fostering conscious capitalism through strategic
                workshops and industry partnerships.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-8">
              {[
                { value: "100+", label: "Members" },
                { value: "12", label: "Events/Yr" },
                { value: "4.9/5", label: "Engagement" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-black text-primary font-[family-name:var(--font-headline)]">
                    {stat.value}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-outline">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Amazon GiveHub */}
          <div className="md:col-span-2 md:row-span-2 bg-inverse-surface text-inverse-on-surface p-8 rounded-xl flex flex-col justify-between overflow-hidden relative group">
            <div className="relative z-10">
              <h3 className="text-2xl font-bold tracking-tight mb-2 font-[family-name:var(--font-headline)]">
                Amazon GiveHub
              </h3>
              <p className="text-inverse-on-surface/60 text-sm leading-relaxed max-w-sm">
                I participated in the Amazon GiveHub initiatives while working at
                Amazon. As part of the community, I coordinated multiple food
                distribution initiatives to serve the underprivileged population
                in the vicinity of Seattle.
              </p>
            </div>
            <div className="relative z-10 flex items-center space-x-2 text-primary-fixed mt-4">
              <span className="text-xs font-bold uppercase tracking-widest">
                Global Operations
              </span>
              <span className="material-symbols-outlined text-sm">
                trending_up
              </span>
            </div>
            <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/40 transition-all duration-500" />
          </div>
        </div>
      </section>

      {/* ── Quote / Philosophy ── */}
      <section className="mt-32 text-center max-w-4xl mx-auto">
        <span className="material-symbols-outlined text-5xl text-outline-variant mb-8">
          format_quote
        </span>
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight italic leading-tight text-on-surface font-[family-name:var(--font-headline)]">
          &ldquo;Vibe coding gets you to quick starting point. Problem discovery gets
          you to{" "}
          <span className="text-primary underline decoration-primary-fixed underline-offset-8">
            product-market fit
          </span>
          .&rdquo;
        </h2>
      </section>
    </main>
  );
}
