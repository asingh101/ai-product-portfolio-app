"use client";

import { useMemo, useState } from "react";
import { useContent } from "@/hooks/useContent";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const FEATURED_MENTORSHIP_SERVICE = {
  icon: "smart_toy",
  title: "Got Ideas?",
  description: "Let's brainstorm and build Agentic workflows!",
  duration: "30 min",
  focus: ["Agentic AI", "Workflow Design", "Rapid Prototyping"],
};

const CONTACT_INITIAL_DATA = {
  pillLabel: "Mentorship & Contact",
  heroTitleLead: "Let's Connect &",
  heroTitleAccent: "Collaborate.",
  heroDescription:
    "Whether you're looking to discuss product management opportunities, need strategic mentorship, or want to collaborate on a new project, let's connect.",
  mentorshipSectionTitle: "Mentorship Sessions",
  services: [
    FEATURED_MENTORSHIP_SERVICE,
    {
      icon: "rocket_launch",
      title: "Career Pivot Strategy",
      description:
        "Navigate the transition from engineering to product management. Build a personalized roadmap for your career pivot with concrete milestones.",
      duration: "60 min",
      focus: ["Career Roadmap", "Skill Gap Analysis", "Personal Branding"],
    },
    {
      icon: "psychology",
      title: "Product Sense Session",
      description:
        "Sharpen your product instincts. Practice case studies, mock PM interviews, and develop frameworks for user-centered product thinking.",
      duration: "45 min",
      focus: ["Case Studies", "Mock Interviews", "Product Frameworks"],
    },
    {
      icon: "architecture",
      title: "Technical Strategy Review",
      description:
        "Review system design decisions, architecture trade-offs, and scalability strategies. Bridge the gap between engineering excellence and business impact.",
      duration: "60 min",
      focus: ["System Design", "Tech Roadmap", "Scale Strategy"],
    },
  ] as {
    icon: string;
    title: string;
    description: string;
    duration: string;
    focus: string[];
  }[],
  bookingCtaTitle: "Book a Free Intro Call",
  bookingCtaDescription:
    "15-minute intro to discuss your goals and find the right mentorship track.",
  bookingCtaUrl: "https://calendar.app.google/NqLqF8ACbseDJeTN6",
  bookingCtaButtonText: "Schedule on Google Calendar",
  directContactTitle: "Reach Out Directly",
  emailAddress: "ankit.singh101@gmail.com",
  linkedinUrl: "https://linkedin.com/in/ankitsingh",
  linkedinDisplay: "linkedin.com/in/ankitsingh",
  locationText: "San Francisco Bay Area, CA",
  feedbackBlockTitle: "Have any feedbacks, please share",
  feedbackBlockSubtitle: "Always open to feedbacks!",
  feedbackButtonText: "Share feedback",
  feedbackFormTitle: "Share your feedback",
  feedbackFormDescription:
    "A few quick questions to help improve the experience.",
  feedbackQuestions: [
    "What were you hoping to accomplish on this site today?",
    "What worked well for you?",
    "What felt confusing, missing, or hard to use?",
    "What would make this website more helpful?",
  ] as string[],
  feedbackSuccessMessage: "Thanks for the feedback!",
};

export default function ContactPage() {
  const contact = useContent("contact", CONTACT_INITIAL_DATA);
  const c = contact.content;
  const mentorshipServices = useMemo(() => {
    const fromCms = c.services || [];
    const hasFeatured = fromCms.some((s) => s.title === FEATURED_MENTORSHIP_SERVICE.title);
    return hasFeatured ? fromCms : [FEATURED_MENTORSHIP_SERVICE, ...fromCms];
  }, [c.services]);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [answers, setAnswers] = useState<string[]>(["", "", "", ""]);
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const questions = useMemo(() => {
    const next = (c.feedbackQuestions || [])
      .map((q) => (typeof q === "string" ? q.trim() : ""))
      .filter(Boolean);
    return next.length ? next : CONTACT_INITIAL_DATA.feedbackQuestions;
  }, [c.feedbackQuestions]);

  const resetFeedbackForm = () => {
    setRating(0);
    setHoverRating(0);
    setAnswers(questions.map(() => ""));
    setFeedbackEmail("");
    setSubmitting(false);
    setSubmitted(false);
    setSubmitError(null);
  };

  const openFeedback = () => {
    resetFeedbackForm();
    setIsFeedbackOpen(true);
  };

  const closeFeedback = () => {
    setIsFeedbackOpen(false);
  };

  const handleAnswerChange = (idx: number, value: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || rating < 1) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await addDoc(collection(db, "site_feedback"), {
        rating,
        email: feedbackEmail.trim() || null,
        questions,
        answers: questions.map((question, idx) => ({
          question,
          answer: answers[idx] || "",
        })),
        page: "contact",
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
      setShowSuccessPopup(true);
      setTimeout(() => {
        setShowSuccessPopup(false);
        setIsFeedbackOpen(false);
      }, 1800);
    } catch (error) {
      console.error("[feedback submit]", error);
      setSubmitError("Feedback could not be submitted. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <>
    <main className="pt-28 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
      {/* Hero */}
      <header className="mb-20 max-w-4xl">
        <span className="inline-block px-4 py-1.5 bg-primary-fixed text-on-primary-fixed text-xs font-bold tracking-widest uppercase rounded-full mb-6">
          {c.pillLabel || "Mentorship & Contact"}
        </span>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1.1] font-[family-name:var(--font-headline)] mb-8">
          {c.heroTitleLead || "Let's Connect &"}{" "}
          <span className="text-gradient">{c.heroTitleAccent || "Collaborate."}</span>
        </h1>
        <p className="text-xl text-on-surface-variant leading-relaxed">
          {c.heroDescription ||
            "Whether you're looking to discuss product management opportunities, need strategic mentorship, or want to collaborate on a new project, let's connect."}
        </p>
      </header>

      {/* Mentorship Service Cards */}
      <section className="mb-24">
        <div className="flex items-baseline justify-between mb-12 border-l-4 border-primary pl-6">
          <h2 className="text-3xl font-extrabold tracking-tighter font-[family-name:var(--font-headline)]">
            {c.mentorshipSectionTitle || "Mentorship Sessions"}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 xl:gap-5">
          {mentorshipServices.map((service) => (
            <div key={service.title} className="bg-surface-container-lowest rounded-2xl p-6 xl:p-8 flex flex-col justify-between hover:scale-[1.005] transition-transform duration-300 group">
              <div>
                <div className="w-14 h-14 bg-primary-fixed rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors duration-300">
                  <span className="material-symbols-outlined text-primary text-2xl group-hover:text-on-primary transition-colors duration-300">{service.icon}</span>
                </div>
                <h3 className="text-xl font-bold tracking-tight mb-3 font-[family-name:var(--font-headline)]">{service.title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-6">{service.description}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {service.focus.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-surface-container-high rounded-full text-[10px] font-bold uppercase tracking-tighter">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                <span className="text-xs text-on-surface-variant font-bold">{service.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Info + CTA */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
        {/* Booking CTA */}
        <div className="cta-gradient rounded-2xl p-10 md:p-12 text-center flex flex-col justify-center">
          <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-white text-3xl">calendar_today</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tighter text-white mb-4 font-[family-name:var(--font-headline)]">
            {c.bookingCtaTitle || "Book a Free Intro Call"}
          </h2>
          <p className="text-white/80 text-lg max-w-md mx-auto mb-8">
            {c.bookingCtaDescription ||
              "15-minute intro to discuss your goals and find the right mentorship track."}
          </p>
          <a
            href={c.bookingCtaUrl || "https://calendar.app.google/NqLqF8ACbseDJeTN6"}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-primary px-10 py-4 rounded-xl font-[family-name:var(--font-headline)] font-bold text-lg hover:bg-surface-container-lowest transition-colors shadow-xl shadow-primary/20 inline-flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined text-xl">calendar_today</span>
            {c.bookingCtaButtonText || "Schedule on Google Calendar"}
          </a>
        </div>

        {/* Direct Contact */}
        <div className="bg-surface-container-lowest rounded-2xl p-10 md:p-12 flex flex-col justify-center">
          <h2 className="text-2xl font-extrabold tracking-tighter mb-8 font-[family-name:var(--font-headline)]">
            {c.directContactTitle || "Reach Out Directly"}
          </h2>
          <div className="space-y-6">
            <a href={`mailto:${c.emailAddress || "ankit.singh101@gmail.com"}`} className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-primary-fixed rounded-xl flex items-center justify-center group-hover:bg-primary transition-colors">
                <span className="material-symbols-outlined text-primary group-hover:text-on-primary transition-colors">mail</span>
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Email</p>
                <p className="font-bold text-on-surface group-hover:text-primary transition-colors">{c.emailAddress || "ankit.singh101@gmail.com"}</p>
              </div>
            </a>
            <a href={c.linkedinUrl || "https://linkedin.com/in/ankitsingh"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-primary-fixed rounded-xl flex items-center justify-center group-hover:bg-primary transition-colors">
                <span className="material-symbols-outlined text-primary group-hover:text-on-primary transition-colors">share</span>
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">LinkedIn</p>
                <p className="font-bold text-on-surface group-hover:text-primary transition-colors">{c.linkedinDisplay || "linkedin.com/in/ankitsingh"}</p>
              </div>
            </a>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-fixed rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">location_on</span>
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Location</p>
                <p className="font-bold text-on-surface">{c.locationText || "San Francisco Bay Area, CA"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-16">
        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-sm">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary text-[10px] font-black tracking-[0.22em] uppercase rounded-full mb-4">
              <span className="material-symbols-outlined text-sm">forum</span>
              Feedback
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tighter font-[family-name:var(--font-headline)] mb-3">
              {c.feedbackBlockTitle || "Have any feedbacks, please share"}
            </h2>
            <p className="text-on-surface-variant text-lg leading-relaxed">
              {c.feedbackBlockSubtitle || "Always open to feedbacks!"}
            </p>
          </div>
          <button
            type="button"
            onClick={openFeedback}
            className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-6 py-4 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-lg self-start md:self-center"
          >
            <span className="material-symbols-outlined text-base">rate_review</span>
            {c.feedbackButtonText || "Share feedback"}
          </button>
        </div>
      </section>
    </main>
    {showSuccessPopup && (
      <div className="fixed top-6 right-6 z-[110] rounded-2xl border border-green-200 bg-green-50 shadow-2xl px-5 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-lg">check</span>
        </div>
        <div>
          <p className="font-bold text-green-800">Thanks for the feedback!</p>
        </div>
      </div>
    )}
    {isFeedbackOpen && (
      <div className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-sm flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-2xl bg-surface-container-lowest rounded-3xl shadow-2xl overflow-hidden border border-outline-variant/10 max-h-[90vh] flex flex-col">
          <div className="px-6 py-5 md:px-8 border-b border-outline-variant/10 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-extrabold tracking-tight font-[family-name:var(--font-headline)]">
                {c.feedbackFormTitle || "Share your feedback"}
              </h3>
              <p className="text-on-surface-variant text-sm mt-2">
                {c.feedbackFormDescription ||
                  "A few quick questions to help improve the experience."}
              </p>
            </div>
            <button
              type="button"
              onClick={closeFeedback}
              className="w-10 h-10 rounded-full bg-surface-container-high hover:bg-surface-container-highest transition-colors flex items-center justify-center"
              aria-label="Close feedback form"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="overflow-y-auto px-6 py-6 md:px-8">
            {submitted ? (
              <div className="rounded-2xl bg-primary/8 border border-primary/10 p-6">
                <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined">check</span>
                </div>
                <h4 className="text-xl font-bold font-[family-name:var(--font-headline)] mb-2">
                  Thank you
                </h4>
                <p className="text-on-surface-variant">
                  {c.feedbackSuccessMessage ||
                    "Thanks for the feedback!"}
                </p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                    Rate your experience
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = (hoverRating || rating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          className={`w-11 h-11 rounded-full border transition-colors flex items-center justify-center ${
                            active
                              ? "bg-primary text-on-primary border-primary"
                              : "bg-surface-container-high text-on-surface-variant border-outline-variant/20 hover:border-primary/50"
                          }`}
                          aria-label={`Rate ${star} out of 5`}
                        >
                          <span className="material-symbols-outlined text-lg">
                            star
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {questions.map((question, idx) => (
                  <div key={question}>
                    <label className="block text-sm font-bold mb-2">
                      {question}
                    </label>
                    <textarea
                      rows={idx === questions.length - 1 ? 4 : 3}
                      value={answers[idx] || ""}
                      onChange={(e) => handleAnswerChange(idx, e.target.value)}
                      className="w-full resize-y rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Type your answer here..."
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={feedbackEmail}
                    onChange={(e) => setFeedbackEmail(e.target.value)}
                    className="w-full rounded-xl bg-surface-container-low border border-outline-variant/20 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="you@example.com"
                  />
                </div>

                {submitError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {submitError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeFeedback}
                    className="px-5 py-3 rounded-xl bg-surface-container-high text-on-surface font-bold text-sm hover:bg-surface-container-highest transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || rating < 1}
                    className="px-5 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit feedback"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
