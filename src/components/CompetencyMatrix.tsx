"use client";

import type { CSSProperties } from "react";
import type { CompetencyMatrixContent, SkillCategory } from "@/data/skills";
import { DEFAULT_COMPETENCY_MATRIX, resolveCompetencyMatrix } from "@/data/skills";

const ACCENT_STYLES: Record<
  SkillCategory["accent"],
  { ring: string; bg: string; label: string; pill: string }
> = {
  product: {
    ring: "border-primary/35",
    bg: "bg-primary/[0.07]",
    label: "text-primary",
    pill: "bg-primary/10 text-primary border-primary/15",
  },
  ai: {
    ring: "border-violet-400/40",
    bg: "bg-violet-500/[0.07]",
    label: "text-violet-700",
    pill: "bg-violet-500/10 text-violet-800 border-violet-400/20",
  },
  technical: {
    ring: "border-sky-400/40",
    bg: "bg-sky-500/[0.07]",
    label: "text-sky-800",
    pill: "bg-sky-500/10 text-sky-900 border-sky-400/20",
  },
  execution: {
    ring: "border-amber-400/40",
    bg: "bg-amber-500/[0.07]",
    label: "text-amber-900",
    pill: "bg-amber-500/10 text-amber-950 border-amber-400/20",
  },
};

const ORBIT_DURATION_S = 85;

/** Resting positions on the dashed path (for reduced-motion fallback). */
const ORBIT_ANGLES: Record<SkillCategory["accent"], number> = {
  product: 0,
  ai: 90,
  technical: -90,
  execution: 180,
};

/** Each circle trails the next by one quarter of the orbit cycle. */
const ORBIT_STAGGER_INDEX: Record<SkillCategory["accent"], number> = {
  product: 0,
  ai: 1,
  technical: 2,
  execution: 3,
};

function SkillPills({
  skills,
  pillClass,
  compact,
}: {
  skills: string[];
  pillClass: string;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-wrap justify-center gap-1.5 ${compact ? "px-1" : "px-2"}`}>
      {skills.map((skill, i) => (
        <span
          key={`${skill}-${i}`}
          className={`inline-block rounded-md border font-bold font-[family-name:var(--font-body)] leading-snug text-center antialiased ${pillClass} ${
            compact
              ? "px-2 py-0.5 text-[10px] sm:text-[11px]"
              : "px-2.5 py-1 text-[11px] sm:text-xs"
          }`}
        >
          {skill}
        </span>
      ))}
    </div>
  );
}

function VennCircle({ category }: { category: SkillCategory }) {
  const styles = ACCENT_STYLES[category.accent];
  const compact = category.skills.length >= 7;

  return (
    <div
      className={`competency-venn-circle w-[var(--venn-size)] h-[var(--venn-size)] rounded-full border-2 backdrop-blur-sm shadow-sm ${styles.ring} ${styles.bg}`}
    >
      <div className="flex h-full flex-col items-center justify-start pt-4 sm:pt-5 md:pt-6 px-2.5 sm:px-3.5 overflow-hidden">
        <h3
          className={`text-[11px] sm:text-xs md:text-sm font-black uppercase tracking-[0.18em] mb-1.5 sm:mb-2 shrink-0 ${styles.label}`}
        >
          {category.title}
        </h3>
        <div className="flex-1 min-h-0 w-full overflow-y-auto max-h-full scrollbar-none pb-2">
          <SkillPills skills={category.skills} pillClass={styles.pill} compact={compact} />
        </div>
      </div>
    </div>
  );
}

function OrbitRing({ categories }: { categories: SkillCategory[] }) {
  return (
    <div className="competency-orbit-ring absolute inset-0">
      {categories.map((category) => {
        const restingAngle = ORBIT_ANGLES[category.accent];
        const staggerIndex = ORBIT_STAGGER_INDEX[category.accent];
        const delayS = -(staggerIndex * (ORBIT_DURATION_S / 4));

        return (
          <div
            key={category.accent}
            className="competency-orbit-slot"
            style={
              {
                "--orbit-angle": "0deg",
                "--orbit-angle-neg": "0deg",
                "--orbit-rest-angle": `${restingAngle}deg`,
                "--orbit-rest-angle-neg": `${-restingAngle}deg`,
                "--orbit-delay": `${delayS}s`,
              } as CSSProperties
            }
          >
            <div className="competency-orbit-counter">
              <VennCircle category={category} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MobileCard({ category }: { category: SkillCategory }) {
  const styles = ACCENT_STYLES[category.accent];
  return (
    <div className={`rounded-2xl border-2 p-5 ${styles.ring} ${styles.bg}`}>
      <h3
        className={`text-xs sm:text-sm font-black uppercase tracking-[0.18em] mb-3 ${styles.label}`}
      >
        {category.title}
      </h3>
      <SkillPills skills={category.skills} pillClass={styles.pill} />
    </div>
  );
}

type Props = {
  data?: CompetencyMatrixContent;
};

export function CompetencyMatrix({ data }: Props) {
  const matrix = resolveCompetencyMatrix(data ?? DEFAULT_COMPETENCY_MATRIX);
  const categories = matrix.categories.map((c) => ({
    ...c,
    skills: (c.skills || []).filter((s) => s.trim()),
  }));

  return (
    <section>
      <div className="mb-6 md:mb-8 border-l-2 border-primary/70 pl-3">
        <h2 className="text-2xl md:text-[2rem] font-extrabold tracking-tight font-[family-name:var(--font-headline)]">
          {matrix.title}
        </h2>
        {matrix.subtitle && (
          <p className="text-sm text-on-surface-variant mt-2 max-w-xl">{matrix.subtitle}</p>
        )}
      </div>

      <div className="competency-matrix-orbit hidden sm:block relative mx-auto w-full max-w-4xl aspect-square min-h-[620px] md:min-h-[720px] py-4">
        <div
          className="competency-orbit-path absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-primary/20 pointer-events-none"
          aria-hidden
        />

        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-primary/15 via-violet-500/10 to-sky-500/10 border border-primary/20 flex flex-col items-center justify-center text-center z-10 shadow-sm backdrop-blur-md px-2"
          aria-hidden
        >
          <span className="material-symbols-outlined text-primary text-xl md:text-2xl mb-0.5">
            hub
          </span>
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-primary leading-tight">
            {matrix.centerLabel}
            <br />
            {matrix.centerSublabel}
          </span>
        </div>

        <OrbitRing categories={categories} />
      </div>

      <div className="sm:hidden grid grid-cols-1 gap-4">
        {categories.map((category) => (
          <MobileCard key={category.accent} category={category} />
        ))}
      </div>

      <div className="mt-6 md:mt-8 flex flex-wrap justify-center gap-4 sm:gap-6 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
        {categories.map((c) => (
          <span key={c.accent} className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full border ${ACCENT_STYLES[c.accent].ring} ${ACCENT_STYLES[c.accent].bg}`}
            />
            {c.title}
          </span>
        ))}
      </div>
    </section>
  );
}
