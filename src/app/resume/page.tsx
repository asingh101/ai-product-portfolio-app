"use client";

import { useMemo } from "react";
import {
  experiences as initialExperiences,
  normalizeResumeExperiences,
} from "@/data/experience";
import { Timeline } from "@/components/Timeline";
import { useContent } from "@/hooks/useContent";

import Link from "next/link";

const RESUME_INITIAL = {
  experiences: initialExperiences,
};

export default function ResumePage() {
  const { content, loading } = useContent("resume", RESUME_INITIAL);

  const experiences = useMemo(
    () => normalizeResumeExperiences(content.experiences ?? initialExperiences),
    [content.experiences]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-surface selection:bg-primary/20 relative overflow-hidden">
      {/* ── Premium Aurora Background ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-50">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
         <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 pt-28 pb-24 px-6 md:px-12 max-w-7xl mx-auto">

        
        {/* ── Hero ── */}
        <header className="mb-12 md:mb-24 relative py-12 md:py-20 px-6 md:px-8 rounded-2xl md:rounded-[3rem] overflow-hidden border border-white/20 bg-white/5 backdrop-blur-sm group">
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] opacity-10" />
          
          <div className="relative z-10 text-center">
            <div className="flex justify-center items-center gap-2 mb-4 md:mb-6">
               <span className="material-symbols-outlined text-primary text-lg md:text-xl">history_edu</span>
               <span className="inline-block px-3 md:px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black tracking-[0.3em] uppercase rounded-full">
                 Professional Evolution
               </span>
            </div>
            
            <h1 className="text-3xl md:text-7xl font-extrabold tracking-tight text-on-surface leading-[1.1] font-[family-name:var(--font-headline)]">
              Career Roadmap
            </h1>
          </div>

          <div className="absolute top-4 left-4 md:top-8 md:left-8 text-primary/20 pointer-events-none">
            <span className="material-symbols-outlined text-2xl md:text-4xl">auto_awesome</span>
          </div>
          <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 text-primary/20 pointer-events-none">
            <span className="material-symbols-outlined text-2xl md:text-4xl">favorite</span>
          </div>
        </header>

        {/* ── Professional Timeline ── */}
        <section className="mb-16 md:mb-32">
          <Timeline experiences={experiences} />
        </section>

        {/* ── Key Highlight ── */}
        <section className="mb-16 md:mb-32">
          <div className="bg-surface-container-low rounded-2xl p-6 md:p-12 relative overflow-hidden group border border-outline-variant/10 shadow-lg">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="max-w-2xl text-center md:text-left">
                <span className="inline-block px-4 py-1.5 bg-primary-fixed text-on-primary-fixed text-[10px] font-black tracking-widest uppercase rounded-full mb-6">
                  Core Specialization
                </span>
                <h3 className="text-2xl md:text-4xl font-black tracking-tight mb-4 font-[family-name:var(--font-headline)] leading-tight">
                  Pioneering Agentic AI in Operational Workflows
                </h3>
                <p className="text-on-surface-variant text-lg leading-relaxed mb-8">
                  Exploring how autonomous AI agents can transform enterprise
                  operations, from incident response automation to intelligent
                  resource allocation and strategic roadmap generation.
                </p>
                <Link
                  href="/ai-prototypes"
                  className="inline-flex items-center gap-2 text-primary font-bold group/link bg-surface-container-lowest px-6 py-3 rounded-xl shadow-ambient hover:scale-105 transition-all"
                >
                  Explore Agentic Architecture
                  <span className="material-symbols-outlined group-hover/link:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </Link>
              </div>
              
              <div className="w-48 h-48 bg-primary/10 rounded-full flex items-center justify-center p-8 group-hover:scale-110 transition-transform duration-700 relative">
                 <span className="material-symbols-outlined text-7xl text-primary animate-pulse">hub</span>
                 <div className="absolute inset-0 border-2 border-dashed border-primary/20 rounded-full animate-[spin_10s_linear_infinite]" />
              </div>
            </div>
            
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />
          </div>
        </section>
      </div>
    </main>
  );
}
