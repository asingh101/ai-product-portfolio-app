"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import Link from "next/link";

interface QuickStat {
  label: string;
  value: string;
  icon: string;
  trend?: string;
}

interface ChatLog {
  visitorName: string;
  messageCount: number;
  lastActive: string;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<QuickStat[]>([
    { label: "Total Visitors", value: "—", icon: "group", trend: "+0%" },
    { label: "Chat Sessions", value: "—", icon: "chat", trend: "+0%" },
    { label: "Page Views", value: "—", icon: "visibility", trend: "+0%" },
    { label: "RAG Docs", value: "5", icon: "description" },
  ]);
  const [recentChats, setRecentChats] = useState<ChatLog[]>([]);

  useEffect(() => {
    // Fetch analytics counters from Firestore
    const fetchStats = async () => {
      try {
        const countersRef = collection(db, "analytics_counters");
        const snapshot = await getDocs(countersRef);
        const counters: Record<string, number> = {};
        snapshot.forEach((doc) => {
          counters[doc.id] = doc.data().count || 0;
        });

        setStats([
          {
            label: "Total Visitors",
            value: (counters["visitors"] || 0).toLocaleString(),
            icon: "group",
            trend: "+12%",
          },
          {
            label: "Chat Sessions",
            value: (counters["chat_sessions"] || 0).toLocaleString(),
            icon: "chat",
            trend: "+8%",
          },
          {
            label: "Page Views",
            value: (counters["page_views"] || 0).toLocaleString(),
            icon: "visibility",
            trend: "+15%",
          },
          { label: "RAG Docs", value: "5", icon: "description" },
        ]);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };

    const fetchRecentChats = async () => {
      try {
        const chatsRef = collection(db, "chat_sessions");
        const q = query(chatsRef, orderBy("updatedAt", "desc"), limit(5));
        const snapshot = await getDocs(q);
        const chats: ChatLog[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          chats.push({
            visitorName: data.visitorName || "Anonymous",
            messageCount: data.messageCount || 0,
            lastActive: data.updatedAt?.toDate?.()?.toLocaleDateString() || "—",
          });
        });
        setRecentChats(chats);
      } catch (err) {
        console.error("Failed to fetch chats:", err);
      }
    };

    fetchStats();
    fetchRecentChats();
  }, []);

  return (
    <div>
      <header className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tighter font-[family-name:var(--font-headline)]">
          Dashboard Overview
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Welcome back. Here&apos;s what&apos;s happening on your portfolio.
        </p>
      </header>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-surface-container-lowest rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-primary text-2xl">
                {stat.icon}
              </span>
              {stat.trend && (
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  {stat.trend}
                </span>
              )}
            </div>
            <div className="text-2xl font-extrabold font-[family-name:var(--font-headline)]">
              {stat.value}
            </div>
            <div className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mt-1">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
        {[
          {
            title: "LinkedIn Optimizer CMS",
            desc: "Edit prototype copy, prompts, limits, and model settings",
            href: "/admin/role-align",
            icon: "person_search",
          },
          {
            title: "Open LinkedIn Optimizer",
            desc: "Live AI prototype, profile ↔ job description alignment",
            href: "/ai-prototypes/role-align",
            icon: "rocket_launch",
          },
          {
            title: "Manage RAG Context",
            desc: "Upload and manage AI chatbot knowledge base",
            href: "/admin/rag",
            icon: "psychology",
          },
          {
            title: "Review Inbox",
            desc: "Read feedback ratings and Hire Me inquiries",
            href: "/admin/feedback",
            icon: "inbox",
          },
          {
            title: "View Analytics",
            desc: "Detailed traffic and engagement metrics",
            href: "/admin/analytics",
            icon: "monitoring",
          },
          {
            title: "Search Performance",
            desc: "Google Search Console insights",
            href: "/admin/search",
            icon: "travel_explore",
          },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="bg-surface-container-lowest rounded-2xl p-6 hover:scale-[1.02] transition-transform group"
          >
            <span className="material-symbols-outlined text-primary text-2xl mb-4 block group-hover:translate-x-1 transition-transform">
              {action.icon}
            </span>
            <h3 className="font-bold text-sm font-[family-name:var(--font-headline)] mb-1">
              {action.title}
            </h3>
            <p className="text-xs text-on-surface-variant">{action.desc}</p>
          </Link>
        ))}
      </div>

      {/* ── Recent Chat Sessions ── */}
      <div className="bg-surface-container-lowest rounded-2xl p-6">
        <h2 className="font-bold tracking-tight font-[family-name:var(--font-headline)] mb-4">
          Recent Chat Sessions
        </h2>
        {recentChats.length > 0 ? (
          <div className="space-y-3">
            {recentChats.map((chat, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-3 border-b border-outline-variant/10 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-fixed rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">
                      {chat.visitorName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold">{chat.visitorName}</p>
                    <p className="text-xs text-on-surface-variant">
                      {chat.messageCount} messages
                    </p>
                  </div>
                </div>
                <span className="text-xs text-on-surface-variant">
                  {chat.lastActive}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant py-8 text-center">
            No chat sessions yet. Conversations will appear here once visitors
            interact with the Strategist AI.
          </p>
        )}
      </div>
    </div>
  );
}
