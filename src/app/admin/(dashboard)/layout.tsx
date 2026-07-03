"use client";

import { AdminGuard } from "@/components/auth/AdminGuard";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

const adminNav = [
  { href: "/admin", label: "Overview", icon: "dashboard" },
  { href: "/admin/analytics", label: "Analytics", icon: "monitoring" },
  { href: "/admin/feedback", label: "Inbox", icon: "inbox" },
  { href: "/admin/content", label: "Site Content", icon: "edit_note" },
  { href: "/admin/portfolio", label: "Portfolio", icon: "work" },
  { href: "/admin/events", label: "Events", icon: "event" },
  { href: "/admin/blog", label: "Blog", icon: "article" },
  { href: "/admin/rag", label: "RAG Context", icon: "psychology" },
  { href: "/admin/profile-optimization", label: "Profile Optimization", icon: "tune" },
  { href: "/admin/job-application-workflow-agent", label: "Job Application Workflow Agent", icon: "smart_toy" },
  { href: "/admin/job-application-workflow-agent/evals", label: "Workflow Agent Evals", icon: "science" },
  { href: "/admin/role-align", label: "LinkedIn Optimizer", icon: "person_search" },
  { href: "/admin/search", label: "Search Console", icon: "travel_explore" },
];

function AdminShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-surface flex">
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-surface-container-lowest flex flex-col flex-shrink-0">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="material-symbols-outlined text-primary text-xl">
              arrow_back
            </span>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest group-hover:text-primary transition-colors">
              Back to Site
            </span>
          </Link>
        </div>

        <div className="px-6 pb-6">
          <h2 className="text-lg font-extrabold tracking-tighter font-[family-name:var(--font-headline)]">
            Admin Console
          </h2>
          <p className="text-xs text-on-surface-variant mt-1 truncate">
            {user?.email}
          </p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {adminNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary-fixed text-on-primary-fixed font-bold"
                    : "text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <span
                  className="material-symbols-outlined text-lg"
                  style={
                    isActive
                      ? { fontVariationSettings: "'FILL' 1" }
                      : undefined
                  }
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4">
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}
