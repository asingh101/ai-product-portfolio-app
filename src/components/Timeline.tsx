"use client";

import { Experience } from "@/data/experience";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useState, useRef, useEffect, useCallback } from "react";

type TimelineFilter = "all" | "work" | "education";

function AutoMarquee({ text, className }: { text: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [duration, setDuration] = useState(8);

  const measure = useCallback(() => {
    if (containerRef.current && textRef.current) {
      const cw = containerRef.current.clientWidth;
      const tw = textRef.current.scrollWidth;
      const doesOverflow = tw > cw + 2;
      setOverflows(doesOverflow);
      if (doesOverflow) {
        setDuration(Math.max(6, tw / 30));
      }
    }
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [text, measure]);

  if (!overflows) {
    return (
      <div ref={containerRef} className={`overflow-hidden ${className || ""}`}>
        <span ref={textRef} className="block truncate">{text}</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`overflow-hidden marquee-mask ${className || ""}`}>
      <span ref={textRef} className="sr-only">{text}</span>
      <div
        className="inline-flex whitespace-nowrap animate-marquee"
        style={{ animationDuration: `${duration}s` }}
      >
        <span className="pr-12">{text}</span>
        <span className="pr-12">{text}</span>
      </div>
    </div>
  );
}

function TimelineItem({
  exp,
  idx,
  isEven,
  isExpanded,
  onToggle,
}: {
  exp: Experience;
  idx: number;
  isEven: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { elementRef, isVisible } = useScrollReveal({ once: true, rootMargin: "-5% 0px" });
  const detailRef = useRef<HTMLDivElement>(null);
  const [detailHeight, setDetailHeight] = useState(0);

  useEffect(() => {
    if (detailRef.current) {
      setDetailHeight(detailRef.current.scrollHeight);
    }
  }, [isExpanded, exp]);

  const getEndYear = (period: string) => {
    const years = period.match(/\d{4}/g);
    return years ? years[years.length - 1] : period;
  };

  const getBranding = (company: string) => {
    const c = company.toLowerCase();
    if (c.includes("santa clara"))
      return { border: "border-[#B0171F]/50", glow: "shadow-[#B0171F]/20", accent: "bg-[#B0171F]", accentText: "text-[#B0171F]" };
    if (c.includes("beebizy"))
      return { border: "border-[#F9A826]/50", glow: "shadow-[#F9A826]/20", accent: "bg-[#F9A826]", accentText: "text-[#F9A826]" };
    if (c.includes("amazon"))
      return { border: "border-[#FF9900]/50", glow: "shadow-[#FF9900]/20", accent: "bg-[#FF9900]", accentText: "text-[#FF9900]" };
    if (c.includes("syracuse"))
      return { border: "border-[#F76900]/50", glow: "shadow-[#F76900]/20", accent: "bg-[#F76900]", accentText: "text-[#F76900]" };
    if (c.includes("atos") || c.includes("syntel"))
      return { border: "border-[#00549A]/50", glow: "shadow-[#00549A]/20", accent: "bg-[#00549A]", accentText: "text-[#00549A]" };
    return { border: "border-on-surface/20", glow: "shadow-on-surface/5", accent: "bg-on-surface/60", accentText: "text-on-surface/60" };
  };

  const getCompanyDomain = (company: string) => {
    const c = company.toLowerCase();
    if (c.includes("santa clara")) return "scu.edu";
    if (c.includes("beebizy")) return "beebizy.com";
    if (c.includes("aws") || c.includes("amazon web services")) return "aws.amazon.com";
    if (c.includes("amazon")) return "amazon.com";
    if (c.includes("syracuse")) return "syracuse.edu";
    if (c.includes("atos") || c.includes("syntel")) return "atos.net";
    return `${c.replace(/[^a-z0-9]/g, "")}.com`;
  };

  const branding = getBranding(exp.company);
  const domain = exp.domain || getCompanyDomain(exp.company);
  const endYear = getEndYear(exp.period);
  const hasDetails = exp.description || (exp.achievements && exp.achievements.length > 0) || (exp.techStack && exp.techStack.length > 0) || (exp.metrics && exp.metrics.length > 0);

  return (
    <div
      ref={elementRef}
      className={`relative z-10 group transition-all duration-1000 transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
      }`}
    >
      {/* Chrono Node */}
      <div className="absolute left-[8px] md:left-1/2 top-4 w-12 h-12 flex items-center justify-center transform md:-translate-x-1/2 -translate-y-1/2 z-20">
        <div
          className={`w-4 h-4 rounded-full ${branding.accent} ring-[6px] ring-white ring-offset-2 ring-offset-primary/10 transition-transform duration-500 ${
            isVisible ? "scale-100" : "scale-0"
          }`}
        />
        <div
          className={`absolute inset-0 rounded-full blur-xl transition-opacity ${branding.accent} ${
            isExpanded ? "opacity-40" : "opacity-0 group-hover:opacity-40"
          }`}
        />
      </div>

      <div
        className={`flex flex-col md:flex-row items-start md:items-center w-full gap-4 md:gap-24 ${
          isEven ? "" : "md:flex-row-reverse"
        }`}
      >
        {/* Year */}
        <div
          className={`hidden md:flex w-full md:w-1/2 transition-opacity duration-1000 delay-300 ${
            isEven ? "justify-end pr-10" : "justify-start pl-10"
          } ${isVisible ? "opacity-10" : "opacity-0"}`}
        >
          <span className="text-6xl md:text-8xl font-black tracking-tighter font-[family-name:var(--font-headline)] select-none">
            {endYear}
          </span>
        </div>

        {/* Card */}
        <div
          className={`w-full md:w-1/2 pl-14 pr-2 transition-all duration-1000 delay-500 transform ${
            isEven ? "md:pl-10 md:pr-0" : "md:pr-10 md:pl-0"
          } ${
            isVisible ? "translate-x-0 opacity-100" : (isEven ? "translate-x-20" : "-translate-x-20") + " opacity-0"
          }`}
        >
          <div
            onClick={hasDetails ? onToggle : undefined}
            className={`relative p-6 md:p-8 rounded-2xl md:rounded-[2rem] bg-white/40 backdrop-blur-2xl border-2 transition-all duration-500 shadow-xl ${
              branding.border
            } ${branding.glow} ${
              hasDetails ? "cursor-pointer hover:-translate-y-1 hover:shadow-2xl active:scale-[0.995]" : ""
            } ${isExpanded ? "-translate-y-1 shadow-2xl" : ""}`}
          >
            {/* Mobile year badge */}
            <div className="md:hidden absolute -top-3 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border border-outline-variant/20 shadow-sm">
              <span className="text-xs font-black tracking-tight text-on-surface/40">{endYear}</span>
            </div>

            <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
              <div
                className={`w-10 h-10 md:w-14 md:h-14 rounded-full bg-white shadow-sm border ${branding.border} flex-shrink-0 flex items-center justify-center overflow-hidden backdrop-blur-xl`}
              >
                <img
                  src={`https://img.logo.dev/${domain}?token=pk_bAP-diqtQzSaUsuVXbGGFQ`}
                  alt={`${exp.company} logo`}
                  className="w-full h-full object-contain filter drop-shadow-sm scale-90"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <AutoMarquee
                  text={exp.company}
                  className="text-[10px] md:text-xs font-black uppercase tracking-widest opacity-90 text-on-surface leading-tight font-[family-name:var(--font-label)]"
                />
                <span className="text-[10px] text-on-surface-variant/60 font-medium md:hidden">{exp.period}</span>
              </div>
            </div>

            <h3 className="text-xl md:text-3xl font-black tracking-tight leading-[1.1] mb-2 font-[family-name:var(--font-headline)] text-on-surface">
              {exp.role}
            </h3>

            {/* Collapsed preview */}
            {!isExpanded && exp.description && (
              <p className="text-xs md:text-sm text-on-surface-variant/60 line-clamp-2 leading-relaxed mt-2">
                {exp.description}
              </p>
            )}

            {/* Expanded detail panel */}
            <div
              ref={detailRef}
              className="overflow-hidden transition-all duration-500 ease-out"
              style={{ maxHeight: isExpanded ? `${detailHeight}px` : "0px", opacity: isExpanded ? 1 : 0 }}
            >
              <div className="pt-4 mt-3 border-t border-dashed border-on-surface/10 space-y-5">
                {exp.description && (
                  <p className="text-sm text-on-surface-variant leading-relaxed">{exp.description}</p>
                )}

                {exp.achievements && exp.achievements.length > 0 && (
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 mb-2">Key Achievements</h5>
                    <ul className="space-y-1.5">
                      {exp.achievements.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs md:text-sm text-on-surface/80 leading-relaxed">
                          <span className={`material-symbols-outlined text-sm mt-0.5 flex-shrink-0 ${branding.accentText}`}>check_circle</span>
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {exp.metrics && exp.metrics.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {exp.metrics.map((m, i) => (
                      <div key={i} className="bg-white/60 rounded-xl px-4 py-2.5 text-center border border-outline-variant/10">
                        <div className={`text-lg md:text-xl font-black font-[family-name:var(--font-headline)] ${branding.accentText}`}>{m.value}</div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/60">{m.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {exp.techStack && exp.techStack.length > 0 && (
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 mb-2">Tech Stack</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {exp.techStack.map((t) => (
                        <span key={t} className="px-2.5 py-1 bg-surface-container-high/60 rounded-md text-[10px] font-bold text-on-surface-variant">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Expand indicator */}
            {hasDetails && (
              <div className={`flex items-center justify-center mt-3 transition-all duration-300 ${isExpanded ? "pt-1" : ""}`}>
                <span
                  className={`material-symbols-outlined text-sm text-on-surface-variant/40 transition-transform duration-300 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                >
                  expand_more
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const FILTERS: { id: TimelineFilter; label: string; icon: string }[] = [
  { id: "all", label: "All", icon: "select_all" },
  { id: "work", label: "Career", icon: "work" },
  { id: "education", label: "Education", icon: "school" },
];

export function Timeline({ experiences }: { experiences: Experience[] }) {
  const [filter, setFilter] = useState<TimelineFilter>("all");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const filtered = filter === "all" ? experiences : experiences.filter((e) => e.type === filter);

  const handleToggle = (idx: number) => {
    setExpandedIdx((prev) => (prev === idx ? null : idx));
  };

  useEffect(() => {
    setExpandedIdx(null);
  }, [filter]);

  return (
    <div className="relative max-w-5xl mx-auto px-2 md:px-6 overflow-hidden">
      {/* Filter Toggle */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-white/60 backdrop-blur-xl border border-outline-variant/20 shadow-lg">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                filter === f.id
                  ? "bg-primary text-on-primary shadow-md shadow-primary/25 scale-[1.02]"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-white/80"
              }`}
            >
              <span className="material-symbols-outlined text-sm md:text-base">{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative py-16 md:py-32">
        {/* Vertical Beam */}
        <div className="absolute left-[30px] md:left-1/2 top-0 bottom-0 w-[4px] bg-gradient-to-b from-primary/0 via-primary/30 to-primary/0 transform md:-translate-x-1/2 overflow-hidden">
          <div className="absolute inset-0 w-full h-[300px] bg-gradient-to-b from-transparent via-white/50 to-transparent animate-beam" />
        </div>

        <div className="space-y-20 md:space-y-48">
          {filtered.map((exp, idx) => (
            <TimelineItem
              key={`${exp.company}-${exp.period}`}
              exp={exp}
              idx={idx}
              isEven={idx % 2 === 0}
              isExpanded={expandedIdx === idx}
              onToggle={() => handleToggle(idx)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-on-surface-variant/60">
            <span className="material-symbols-outlined text-5xl mb-4 block">search_off</span>
            <p className="text-sm font-bold uppercase tracking-widest">No entries in this category yet</p>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes beam {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(400%); }
        }
        .animate-beam {
          animation: beam 10s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 8s linear infinite;
        }
        .marquee-mask {
          -webkit-mask-image: linear-gradient(to right, transparent, black 4%, black 96%, transparent);
          mask-image: linear-gradient(to right, transparent, black 4%, black 96%, transparent);
        }
      `}</style>
    </div>
  );
}
