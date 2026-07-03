"use client";

import { useState } from "react";

type TimeRange = "7d" | "28d" | "90d";

interface SearchQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: string;
  position: string;
}

export default function SearchConsolePage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("28d");

  const summaryStats = [
    { label: "Total Clicks", value: "0", icon: "ads_click" },
    { label: "Total Impressions", value: "0", icon: "visibility" },
    { label: "Avg. CTR", value: "0%", icon: "percent" },
    { label: "Avg. Position", value: "-", icon: "format_list_numbered" },
  ];

  const topQueries: SearchQuery[] = [];
  const topPages: any[] = [];

  return (
    <div>
      <header className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter font-[family-name:var(--font-headline)]">
            Search Performance
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Google Search Console data, SEO &amp; GEO performance tracking.
          </p>
        </div>
        <div className="flex bg-surface-container-lowest rounded-xl overflow-hidden">
          {(["7d", "28d", "90d"] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 text-xs font-bold transition-colors ${
                timeRange === range
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {range === "7d" ? "7 Days" : range === "28d" ? "28 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </header>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {summaryStats.map((stat) => (
          <div key={stat.label} className="bg-surface-container-lowest rounded-2xl p-6">
            <span className="material-symbols-outlined text-primary text-2xl mb-3 block">
              {stat.icon}
            </span>
            <div className="text-2xl font-extrabold font-[family-name:var(--font-headline)]">
              {stat.value}
            </div>
            <div className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mt-1">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Top Queries ── */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 mb-8">
        <h2 className="font-bold tracking-tight font-[family-name:var(--font-headline)] mb-4">
          Top Search Queries
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                <th className="text-left py-2 pr-4">Query</th>
                <th className="text-right py-2 px-4">Clicks</th>
                <th className="text-right py-2 px-4">Impressions</th>
                <th className="text-right py-2 px-4">CTR</th>
                <th className="text-right py-2 pl-4">Position</th>
              </tr>
            </thead>
            <tbody>
              {topQueries.length > 0 ? (
                topQueries.map((q) => (
                  <tr
                    key={q.query}
                    className="hover:bg-surface-container-low transition-colors"
                  >
                    <td className="py-3 pr-4 font-medium">{q.query}</td>
                    <td className="py-3 px-4 text-right font-bold">{q.clicks.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-on-surface-variant">
                      {q.impressions.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-on-surface-variant">{q.ctr}</td>
                    <td className="py-3 pl-4 text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          parseFloat(q.position) <= 5
                            ? "bg-green-50 text-green-700"
                            : parseFloat(q.position) <= 10
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {q.position}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-on-surface-variant">
                    No data available. Connect GSC API to see top queries.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Top Pages by Search ── */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 mb-8">
        <h2 className="font-bold tracking-tight font-[family-name:var(--font-headline)] mb-4">
          Top Pages (Search Performance)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                <th className="text-left py-2 pr-4">Page</th>
                <th className="text-right py-2 px-4">Clicks</th>
                <th className="text-right py-2 px-4">Impressions</th>
                <th className="text-right py-2 px-4">CTR</th>
                <th className="text-right py-2 pl-4">Position</th>
              </tr>
            </thead>
            <tbody>
              {topPages.length > 0 ? (
                topPages.map((p) => (
                  <tr
                    key={p.page}
                    className="hover:bg-surface-container-low transition-colors"
                  >
                    <td className="py-3 pr-4 font-medium">{p.page}</td>
                    <td className="py-3 px-4 text-right font-bold">{p.clicks.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-on-surface-variant">
                      {p.impressions.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-on-surface-variant">{p.ctr}</td>
                    <td className="py-3 pl-4 text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          parseFloat(p.position) <= 5
                            ? "bg-green-50 text-green-700"
                            : parseFloat(p.position) <= 10
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {p.position}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-on-surface-variant">
                    No data available. Connect GSC API to see top pages.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Connection Note ── */}
      <div className="bg-surface-container-low rounded-xl p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-primary text-lg flex-shrink-0 mt-0.5">
          info
        </span>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Search Console data shown above is placeholder. To connect live data, set up a Google Cloud
          service account with Search Console API access and configure{" "}
          <code className="text-primary font-mono">GSC_SERVICE_ACCOUNT_KEY</code> and{" "}
          <code className="text-primary font-mono">GSC_SITE_URL</code> in your{" "}
          <code className="text-primary font-mono">.env.local</code>.
        </p>
      </div>
    </div>
  );
}
