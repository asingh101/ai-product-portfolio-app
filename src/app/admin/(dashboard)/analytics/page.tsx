"use client";

import { useState } from "react";

type TimeRange = "7d" | "30d" | "90d";

interface PageMetric {
  page: string;
  views: number;
  avgTime: string;
  bounceRate: string;
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const summaryStats = [
    { label: "Total Sessions", value: "0", change: "0%", up: true },
    { label: "Unique Visitors", value: "0", change: "0%", up: true },
    { label: "Avg. Session Duration", value: "0m 0s", change: "0%", up: true },
    { label: "Bounce Rate", value: "0%", change: "0%", up: true },
  ];

  const topPages: PageMetric[] = [];

  const trafficSources: { source: string; sessions: number; pct: number }[] = [];

  return (
    <div>
      <header className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter font-[family-name:var(--font-headline)]">
            Analytics Dashboard
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Traffic, engagement, and performance metrics for your portfolio.
          </p>
        </div>
        <div className="flex bg-surface-container-lowest rounded-xl overflow-hidden">
          {(["7d", "30d", "90d"] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 text-xs font-bold transition-colors ${
                timeRange === range
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </header>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {summaryStats.map((stat) => (
          <div key={stat.label} className="bg-surface-container-lowest rounded-2xl p-6">
            <div className="text-2xl font-extrabold font-[family-name:var(--font-headline)]">
              {stat.value}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">
                {stat.label}
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  stat.up
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Top Pages ── */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl p-6">
          <h2 className="font-bold tracking-tight font-[family-name:var(--font-headline)] mb-4">
            Top Pages
          </h2>
          <div className="space-y-1">
            <div className="grid grid-cols-12 gap-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider py-2">
              <div className="col-span-4">Page</div>
              <div className="col-span-3 text-right">Views</div>
              <div className="col-span-3 text-right">Avg. Time</div>
              <div className="col-span-2 text-right">Bounce</div>
            </div>
            {topPages.length > 0 ? (
              topPages.map((page) => (
                <div
                  key={page.page}
                  className="grid grid-cols-12 gap-4 py-3 items-center hover:bg-surface-container-low rounded-lg px-2 transition-colors"
                >
                  <div className="col-span-4 text-sm font-medium truncate">
                    {page.page}
                  </div>
                  <div className="col-span-3 text-sm text-right font-bold">
                    {page.views.toLocaleString()}
                  </div>
                  <div className="col-span-3 text-sm text-right text-on-surface-variant">
                    {page.avgTime}
                  </div>
                  <div className="col-span-2 text-sm text-right text-on-surface-variant">
                    {page.bounceRate}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-on-surface-variant">
                No data available. Connect GA4 Data API to see top pages.
              </div>
            )}
          </div>
        </div>

        {/* ── Traffic Sources ── */}
        <div className="bg-surface-container-lowest rounded-2xl p-6">
          <h2 className="font-bold tracking-tight font-[family-name:var(--font-headline)] mb-4">
            Traffic Sources
          </h2>
          <div className="space-y-4">
            {trafficSources.length > 0 ? (
              trafficSources.map((src) => (
                <div key={src.source}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{src.source}</span>
                    <span className="text-on-surface-variant">
                      {src.sessions.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-high rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all duration-500"
                      style={{ width: `${src.pct}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-sm text-on-surface-variant">
                No traffic source data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Note ── */}
      <div className="mt-8 bg-surface-container-low rounded-xl p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-primary text-lg flex-shrink-0 mt-0.5">
          info
        </span>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Analytics data shown above is placeholder. Connect GA4 Data API with your{" "}
          <code className="text-primary font-mono">GA4_PROPERTY_ID</code> in{" "}
          <code className="text-primary font-mono">.env.local</code> to see live data.
          Firebase Analytics events are being tracked automatically.
        </p>
      </div>
    </div>
  );
}
