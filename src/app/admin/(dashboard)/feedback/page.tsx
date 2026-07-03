"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, limit, orderBy, query, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

type FeedbackAnswer = {
  question?: string;
  answer?: string;
};

type FeedbackEntry = {
  id: string;
  rating: number;
  email: string | null;
  page: string;
  createdAt: Timestamp | null;
  answers: FeedbackAnswer[];
};

type HireInquiryEntry = {
  id: string;
  message: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  page: string;
  createdAt: Timestamp | null;
};

function formatDate(value: Timestamp | null) {
  const date = value?.toDate?.();
  if (!date) return "Pending timestamp";
  return date.toLocaleString();
}

type InboxTab = "feedback" | "hire";

export default function FeedbackPage() {
  const [tab, setTab] = useState<InboxTab>("feedback");
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [hireEntries, setHireEntries] = useState<HireInquiryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInbox = async () => {
      setLoading(true);
      setError(null);
      try {
        const feedbackRef = collection(db, "site_feedback");
        const feedbackQuery = query(feedbackRef, orderBy("createdAt", "desc"), limit(100));
        const hireRef = collection(db, "hire_inquiries");
        const hireQuery = query(hireRef, orderBy("createdAt", "desc"), limit(100));

        const [feedbackSnapshot, hireSnapshot] = await Promise.all([
          getDocs(feedbackQuery),
          getDocs(hireQuery),
        ]);

        const nextFeedback = feedbackSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            rating: typeof data.rating === "number" ? data.rating : 0,
            email: typeof data.email === "string" && data.email.trim() ? data.email.trim() : null,
            page: typeof data.page === "string" && data.page.trim() ? data.page.trim() : "unknown",
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt : null,
            answers: Array.isArray(data.answers) ? data.answers : [],
          } satisfies FeedbackEntry;
        });

        const nextHire = hireSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            message: typeof data.message === "string" ? data.message : "",
            name: typeof data.name === "string" && data.name.trim() ? data.name.trim() : null,
            email: typeof data.email === "string" && data.email.trim() ? data.email.trim() : null,
            phone: typeof data.phone === "string" && data.phone.trim() ? data.phone.trim() : null,
            page: typeof data.page === "string" && data.page.trim() ? data.page.trim() : "unknown",
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt : null,
          } satisfies HireInquiryEntry;
        });

        setEntries(nextFeedback);
        setHireEntries(nextHire);
      } catch (err) {
        console.error("[admin inbox]", err);
        setError("Could not load inbox right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchInbox();
  }, []);

  const feedbackSummary = useMemo(() => {
    if (!entries.length) {
      return { total: 0, average: "0.0", withEmail: 0 };
    }

    const totalRating = entries.reduce((sum, entry) => sum + entry.rating, 0);
    const withEmail = entries.filter((entry) => entry.email).length;

    return {
      total: entries.length,
      average: (totalRating / entries.length).toFixed(1),
      withEmail,
    };
  }, [entries]);

  const hireSummary = useMemo(() => {
    const withEmail = hireEntries.filter((entry) => entry.email).length;
    return {
      total: hireEntries.length,
      withEmail,
    };
  }, [hireEntries]);

  return (
    <div>
      <header className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter font-[family-name:var(--font-headline)]">
            Inbox
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Review site feedback and Hire Me inquiries from the homepage.
          </p>
        </div>
        <div className="text-xs text-on-surface-variant">
          Showing the latest 100 submissions per tab
        </div>
      </header>

      <div className="flex gap-2 mb-8">
        <button
          type="button"
          onClick={() => setTab("feedback")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            tab === "feedback"
              ? "bg-primary text-on-primary"
              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
          }`}
        >
          <span className="material-symbols-outlined text-base">rate_review</span>
          Feedback
          {feedbackSummary.total > 0 && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{feedbackSummary.total}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("hire")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            tab === "hire"
              ? "bg-primary text-on-primary"
              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
          }`}
        >
          <span className="material-symbols-outlined text-base">mail</span>
          Hire Me
          {hireSummary.total > 0 && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{hireSummary.total}</span>
          )}
        </button>
      </div>

      {tab === "feedback" ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-surface-container-lowest rounded-2xl p-6">
              <div className="text-2xl font-extrabold font-[family-name:var(--font-headline)]">
                {feedbackSummary.total}
              </div>
              <div className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mt-1">
                Responses
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl p-6">
              <div className="text-2xl font-extrabold font-[family-name:var(--font-headline)]">
                {feedbackSummary.average}/5
              </div>
              <div className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mt-1">
                Average rating
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl p-6">
              <div className="text-2xl font-extrabold font-[family-name:var(--font-headline)]">
                {feedbackSummary.withEmail}
              </div>
              <div className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mt-1">
                Included email
              </div>
            </div>
          </div>

          <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/10">
              <h2 className="font-bold tracking-tight font-[family-name:var(--font-headline)]">
                Feedback submissions
              </h2>
              <p className="text-xs text-on-surface-variant mt-1">
                Answers are grouped exactly as visitors submitted them.
              </p>
            </div>

            {loading ? (
              <div className="py-16 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="px-6 py-16 text-center text-sm text-red-600">{error}</div>
            ) : entries.length === 0 ? (
              <div className="px-6 py-16 text-center text-sm text-on-surface-variant">
                No feedback yet. New responses will appear here automatically.
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/10">
                {entries.map((entry) => (
                  <article key={entry.id} className="px-6 py-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold">
                          {entry.rating}/5 stars
                        </span>
                        <span className="inline-flex items-center rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                          {entry.page}
                        </span>
                        <span className="text-xs text-on-surface-variant">
                          {formatDate(entry.createdAt)}
                        </span>
                      </div>
                      <div className="text-sm text-on-surface">
                        {entry.email ? (
                          <a href={`mailto:${entry.email}`} className="font-medium text-primary hover:underline">
                            {entry.email}
                          </a>
                        ) : (
                          <span className="text-on-surface-variant">No email shared</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {entry.answers.length > 0 ? (
                        entry.answers.map((item, idx) => (
                          <div key={`${entry.id}-${idx}`} className="rounded-2xl bg-surface-container-low p-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                              {item.question || `Question ${idx + 1}`}
                            </p>
                            <p className="text-sm leading-relaxed text-on-surface whitespace-pre-wrap">
                              {item.answer?.trim() || "No response provided."}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
                          No written answers were submitted with this rating.
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div className="bg-surface-container-lowest rounded-2xl p-6">
              <div className="text-2xl font-extrabold font-[family-name:var(--font-headline)]">
                {hireSummary.total}
              </div>
              <div className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mt-1">
                Hire inquiries
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl p-6">
              <div className="text-2xl font-extrabold font-[family-name:var(--font-headline)]">
                {hireSummary.withEmail}
              </div>
              <div className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mt-1">
                Included email
              </div>
            </div>
          </div>

          <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/10">
              <h2 className="font-bold tracking-tight font-[family-name:var(--font-headline)]">
                Hire Me inquiries
              </h2>
              <p className="text-xs text-on-surface-variant mt-1">
                Captured from the homepage Hire Me form before the visitor&apos;s email app opens.
              </p>
            </div>

            {loading ? (
              <div className="py-16 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="px-6 py-16 text-center text-sm text-red-600">{error}</div>
            ) : hireEntries.length === 0 ? (
              <div className="px-6 py-16 text-center text-sm text-on-surface-variant">
                No hire inquiries yet. New messages will appear here automatically.
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/10">
                {hireEntries.map((entry) => (
                  <article key={entry.id} className="px-6 py-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold">
                          Hire Me
                        </span>
                        <span className="inline-flex items-center rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                          {entry.page}
                        </span>
                        <span className="text-xs text-on-surface-variant">
                          {formatDate(entry.createdAt)}
                        </span>
                      </div>
                      <div className="text-sm text-on-surface space-y-1 lg:text-right">
                        {entry.name && (
                          <p className="font-medium">{entry.name}</p>
                        )}
                        {entry.email ? (
                          <a href={`mailto:${entry.email}`} className="font-medium text-primary hover:underline block">
                            {entry.email}
                          </a>
                        ) : (
                          <span className="text-on-surface-variant block">No email shared</span>
                        )}
                        {entry.phone ? (
                          <a href={`tel:${entry.phone.replace(/\s/g, "")}`} className="text-on-surface-variant hover:text-primary block">
                            {entry.phone}
                          </a>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-surface-container-low p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                        Message
                      </p>
                      <p className="text-sm leading-relaxed text-on-surface whitespace-pre-wrap">
                        {entry.message.trim() || "No message provided."}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
