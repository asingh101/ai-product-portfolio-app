"use client";

import { useContent } from "@/hooks/useContent";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useEffect, useState } from "react";

interface LinkedInPost {
  content: string;
  date: string;
  url: string;
  topic: string;
  likes: number;
  comments: number;
  reposts: number;
}

const LINKEDIN_INITIAL_DATA = {
  headerTitle: "Professional Insights",
  headerSubtitle: "A curated feed of my latest thoughts, frameworks, and discussions on Product Management, Operations, and AI Strategy.",
  posts: [
    {
      content: "",
      date: "2025",
      url: "https://www.linkedin.com/posts/activity-7443737880986038272-0Osv",
      topic: "Product Management",
      likes: 0,
      comments: 0,
      reposts: 0
    }
  ] as LinkedInPost[]
};

export default function LinkedInPage() {
  const { content } = useContent("linkedin", LINKEDIN_INITIAL_DATA);
  const { isAdmin } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const topicColors: Record<string, { bg: string; text: string; border: string }> = {
    "Product Management": { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
    "AI & Technology": { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
    "Strategy": { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
    "Leadership": { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
    "Career": { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200" },
    "Marketing": { bg: "bg-cyan-50", text: "text-cyan-600", border: "border-cyan-200" },
  };

  const getTopicStyle = (topic: string) =>
    topicColors[topic] || { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" };

  return (
    <main className="min-h-screen pt-32 pb-24 px-6 md:px-12 max-w-5xl mx-auto">
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

      {/* Hero Section */}
      <header className="mb-20 text-center max-w-3xl mx-auto">
        <div className="flex justify-center items-center gap-2 mb-6">
           <span className="material-symbols-outlined text-primary text-xl">share</span>
           <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black tracking-[0.3em] uppercase rounded-full">
             LinkedIn Feed
           </span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-on-surface leading-[1.1] mb-6 font-[family-name:var(--font-headline)]">
          {content.headerTitle}
        </h1>
        <p className="text-on-surface-variant text-lg">
          {content.headerSubtitle}
        </p>
      </header>

      {/* LinkedIn Profile CTA */}
      <div className="flex justify-center mb-16">
        <a
          href="https://www.linkedin.com/in/as01/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-6 py-3.5 bg-[#0077B5] hover:bg-[#006097] text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 group"
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          Check out my LinkedIn
          <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">open_in_new</span>
        </a>
      </div>

      {/* Posts Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl mx-auto">
        {content.posts && content.posts.length > 0 ? (
          content.posts
            .filter((post: any) => typeof post === 'object' ? post.content?.trim() : false)
            .map((post: any, index: number) => {
            const style = getTopicStyle(post.topic || "Product Management");
            return (
              <article
                key={index}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden hover:-translate-y-1 flex flex-col h-full"
              >
                {/* Card Header */}
                <div className="px-8 pt-8 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-black text-lg shadow-md">
                      AS
                    </div>
                    <div>
                      <h3 className="font-bold text-on-surface text-sm">Ankit Singh</h3>
                      <p className="text-on-surface-variant text-xs">MBA Candidate | Product | Strategy | Ex Amazon</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {post.topic && (
                      <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${style.bg} ${style.text} border ${style.border}`}>
                        {post.topic}
                      </span>
                    )}
                    {/* LinkedIn icon */}
                    <svg className="w-5 h-5 text-[#0077B5]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </div>
                </div>

                {/* Card Content (flex-grow) */}
                <div className="px-8 pb-6 flex-grow">
                  <p className="text-on-surface text-[15px] leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>
                </div>

                {/* Engagement Stats */}
                {(post.likes > 0 || post.comments > 0 || post.reposts > 0) && (
                  <div className="px-8 py-3 border-t border-gray-100 flex items-center gap-4">
                    {post.likes > 0 && (
                      <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-1">
                          <span className="w-[18px] h-[18px] rounded-full bg-[#0a66c2] flex items-center justify-center text-white text-[10px]">👍</span>
                          <span className="w-[18px] h-[18px] rounded-full bg-[#df704d] flex items-center justify-center text-white text-[10px]">❤️</span>
                        </div>
                        <span className="text-xs text-on-surface-variant">{post.likes.toLocaleString()}</span>
                      </div>
                    )}
                    {post.comments > 0 && (
                      <span className="text-xs text-on-surface-variant">{post.comments.toLocaleString()} comments</span>
                    )}
                    {post.reposts > 0 && (
                      <span className="text-xs text-on-surface-variant">{post.reposts.toLocaleString()} reposts</span>
                    )}
                  </div>
                )}

                {/* Card Footer */}
                <div className="px-8 pb-6 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant font-medium">{post.date}</span>
                  {post.url && (
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs font-bold text-[#0077B5] hover:text-blue-700 transition-colors group/link"
                    >
                      View on LinkedIn
                      <span className="material-symbols-outlined text-sm group-hover/link:translate-x-0.5 transition-transform">arrow_forward</span>
                    </a>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <div className="text-center py-20 bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant/30">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/50 mb-4">
              post_add
            </span>
            <p className="text-on-surface-variant">
              No posts added yet. Go to Admin → LinkedIn tab to add your post content!
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
