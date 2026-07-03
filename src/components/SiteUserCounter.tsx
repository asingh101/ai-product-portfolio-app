"use client";

import { useEffect, useState } from "react";
import { fetchSiteUserCount } from "@/lib/analytics/siteVisit";

type SiteUserCounterProps = {
  className?: string;
};

export function SiteUserCounter({ className = "" }: SiteUserCounterProps) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchSiteUserCount().then((value) => {
      if (!cancelled && value !== null) setCount(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-primary/20 bg-surface-container-lowest px-4 py-2 shadow-sm ${className}`}
      aria-label={count !== null ? `${count.toLocaleString()} total visitors` : "Total visitors"}
    >
      <span className="material-symbols-outlined text-primary text-lg">group</span>
      <span className="text-sm font-bold text-on-surface tabular-nums">
        {count !== null ? count.toLocaleString() : "—"}
      </span>
      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        visitors
      </span>
    </div>
  );
}
