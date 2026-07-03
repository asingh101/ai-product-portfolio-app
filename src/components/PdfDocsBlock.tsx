"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Strip any existing hash, then jump to a page (browser PDF viewer; avoids fetch/CORS). */
export function pdfUrlWithPage(raw: string, page: number): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const base = trimmed.split("#")[0];
  return `${base}#page=${Math.max(1, page)}`;
}

const SITE_ORIGINS = new Set([
  "https://www.ankitsingh.net",
  "https://ankitsingh.net",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

/** Same-origin paths work with pdf.js; Firebase Storage and other hosts need iframe. */
export function needsIframePdfFallback(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return false;
  if (trimmed.startsWith("./") || trimmed.startsWith("../")) return false;

  try {
    const parsed = new URL(
      trimmed,
      typeof window !== "undefined" ? window.location.origin : "https://www.ankitsingh.net"
    );
    if (typeof window !== "undefined") {
      return parsed.origin !== window.location.origin;
    }
    return !SITE_ORIGINS.has(parsed.origin);
  } catch {
    return true;
  }
}

export function PdfDocsBlock({
  deckUrl,
  reportUrl,
  reportButtonText,
  projectSlug = "",
  projectId = "",
}: {
  deckUrl?: string;
  reportUrl?: string;
  reportButtonText?: string;
  projectSlug?: string;
  projectId?: string;
}) {
  const [showReport, setShowReport] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [savingLead, setSavingLead] = useState(false);

  const handleDownloadReportClick = () => {
    if (!reportUrl) return;
    setEmailErr(null);
    setEmail("");
    setEmailModalOpen(true);
  };

  const submitEmailAndContinue = async () => {
    const e = email.trim();
    if (!EMAIL_RE.test(e)) {
      setEmailErr("Please enter a valid email address.");
      return;
    }
    if (!reportUrl) return;
    setSavingLead(true);
    setEmailErr(null);
    try {
      await addDoc(collection(db, "report_download_leads"), {
        email: e,
        projectSlug: projectSlug || "unknown",
        projectId: projectId || "unknown",
        reportUrl,
        createdAt: serverTimestamp(),
      });
      setEmailModalOpen(false);
      setShowReport(true);
      window.open(reportUrl, "_blank", "noopener,noreferrer");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setEmailErr(msg);
    } finally {
      setSavingLead(false);
    }
  };

  if (!deckUrl && !reportUrl) return null;

  return (
    <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-6 md:p-8 space-y-6 relative">
      <AnimatePresence>
        {emailModalOpen ? (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-email-title"
            onClick={() => !savingLead && setEmailModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-xl p-6"
              onClick={(ev) => ev.stopPropagation()}
            >
              <h2
                id="report-email-title"
                className="text-lg font-extrabold font-[family-name:var(--font-headline)] text-on-surface mb-1"
              >
                Get the report
              </h2>
              <p className="text-sm text-on-surface-variant mb-4">
                Enter your email to open the PDF. We&apos;ll save it so we know who downloaded the report.
              </p>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25 mb-3"
                disabled={savingLead}
              />
              {emailErr ? <p className="text-xs text-red-600 mb-3">{emailErr}</p> : null}
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  disabled={savingLead}
                  onClick={() => setEmailModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingLead}
                  onClick={() => void submitEmailAndContinue()}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold bg-primary text-on-primary hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {savingLead ? (
                    <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-base">check</span>
                  )}
                  Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {deckUrl ? <PdfViewer kind="slides" url={deckUrl} /> : null}

      {reportUrl ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadReportClick}
              className="inline-flex items-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              {reportButtonText?.trim() || "Download Report"}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {showReport ? (
              <motion.div
                key="report"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-outline-variant/20 bg-surface p-4">
                  <PdfViewer kind="report" url={reportUrl} />
                  <div className="mt-3 text-xs text-on-surface-variant/70">
                    If the preview doesn&apos;t show, try refreshing the page or another browser, the PDF still opened in a new tab when you continued.
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      ) : null}
    </section>
  );
}

function PdfViewer({ url, kind }: { url: string; kind: "slides" | "report" }) {
  const useIframe = useMemo(() => needsIframePdfFallback(url), [url]);
  if (useIframe) {
    return <IframePdfViewer url={url} kind={kind} />;
  }
  return <PdfJsPdfViewer url={url} kind={kind} />;
}

function IframePdfViewer({ url, kind }: { url: string; kind: "slides" | "report" }) {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const frameRef = useRef<HTMLDivElement>(null);

  const downloadHref = useMemo(() => url.trim(), [url]);
  const iframeSrc = useMemo(() => pdfUrlWithPage(url, page), [url, page]);

  const label = kind === "slides" ? "Slides" : "Report";
  const icon = kind === "slides" ? "slideshow" : "picture_as_pdf";

  useEffect(() => {
    setPage(1);
    setLoading(true);
  }, [url]);

  const goPrev = () => {
    if (page <= 1) return;
    setLoading(true);
    setPage((p) => Math.max(1, p - 1));
  };

  const goNext = () => {
    setLoading(true);
    setPage((p) => p + 1);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && page > 1) {
        e.preventDefault();
        setLoading(true);
        setPage((p) => Math.max(1, p - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setLoading(true);
        setPage((p) => p + 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [page]);

  const handleFullscreen = () => {
    const node = frameRef.current;
    if (!node) return;
    const anyNode = node as HTMLElement & { requestFullscreen?: () => Promise<void> };
    if (document.fullscreenElement) {
      void document.exitFullscreen?.();
      return;
    }
    void anyNode.requestFullscreen?.();
  };

  return (
    <div className="space-y-4">
      <PdfViewerToolbar
        label={label}
        icon={icon}
        page={page}
        numPages={null}
        canPrev={page > 1}
        canNext
        downloadHref={downloadHref}
        onPrev={goPrev}
        onNext={goNext}
        onFullscreen={handleFullscreen}
      />

      <div
        ref={frameRef}
        className="rounded-2xl border border-outline-variant/20 bg-white overflow-hidden shadow-[0_20px_40px_-24px_rgba(2,6,23,0.35)] [&:fullscreen]:rounded-none [&:fullscreen]:border-0 [&:fullscreen]:bg-black [&:fullscreen_.pdf-slide-inner]:min-h-screen [&:fullscreen_.pdf-slide-inner]:bg-black"
      >
        <div className="pdf-slide-inner relative w-full bg-surface-container-lowest min-h-[min(76vh,760px)]">
          <button
            type="button"
            onClick={goPrev}
            disabled={page <= 1}
            className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 md:w-12 md:h-12 rounded-full bg-black/55 text-white hover:bg-black/70 transition-colors disabled:opacity-35 disabled:hover:bg-black/55 flex items-center justify-center shadow-lg"
            title="Previous slide"
            aria-label="Previous slide"
          >
            <span className="material-symbols-outlined text-2xl">chevron_left</span>
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 md:w-12 md:h-12 rounded-full bg-black/55 text-white hover:bg-black/70 transition-colors flex items-center justify-center shadow-lg"
            title="Next slide"
            aria-label="Next slide"
          >
            <span className="material-symbols-outlined text-2xl">chevron_right</span>
          </button>
          <div className="absolute bottom-3 left-3 z-20 rounded-full bg-black/60 text-white text-sm font-semibold px-3 py-1.5 pointer-events-none">
            {page}
          </div>

          {loading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
              <div className="w-9 h-9 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : null}

          <iframe
            key={iframeSrc}
            title={`${label} preview`}
            src={iframeSrc}
            className="w-full min-h-[min(76vh,760px)] border-0 bg-white"
            onLoad={() => setLoading(false)}
          />
        </div>
      </div>

      <div className="text-xs text-on-surface-variant/70 text-right">
        Use left/right arrows or the buttons to navigate.
      </div>
    </div>
  );
}

function PdfViewerToolbar({
  label,
  icon,
  page,
  numPages,
  canPrev,
  canNext,
  downloadHref,
  onPrev,
  onNext,
  onFullscreen,
}: {
  label: string;
  icon: string;
  page: number;
  numPages: number | null;
  canPrev: boolean;
  canNext: boolean;
  downloadHref: string;
  onPrev: () => void;
  onNext: () => void;
  onFullscreen: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant inline-flex items-center gap-2">
        <span className="material-symbols-outlined text-base text-primary">{icon}</span>
        {label}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={!canPrev}
          className="w-10 h-10 rounded-xl border border-outline-variant/30 bg-surface hover:border-primary/40 disabled:opacity-40 disabled:hover:border-outline-variant/30 flex items-center justify-center"
          title="Previous"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className="w-10 h-10 rounded-xl border border-outline-variant/30 bg-surface hover:border-primary/40 disabled:opacity-40 disabled:hover:border-outline-variant/30 flex items-center justify-center"
          title="Next"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>

        <div className="px-3 py-2 rounded-xl border border-outline-variant/20 bg-surface text-xs font-bold text-on-surface-variant">
          {numPages != null ? `${page} / ${numPages}` : `${page}`}
        </div>

        <button
          type="button"
          onClick={onFullscreen}
          className="w-10 h-10 rounded-xl border border-outline-variant/30 bg-surface hover:border-primary/40 flex items-center justify-center"
          title="Fullscreen"
        >
          <span className="material-symbols-outlined text-[18px]">fullscreen</span>
        </button>

        <a
          href={downloadHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant/20 bg-surface hover:bg-surface-container-lowest text-xs font-bold text-on-surface"
        >
          <span className="material-symbols-outlined text-base">download</span>
          Download
        </a>
      </div>
    </div>
  );
}

function PdfJsPdfViewer({ url, kind }: { url: string; kind: "slides" | "report" }) {
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pdfComponents, setPdfComponents] = useState<null | {
    Document: any;
    Page: any;
  }>(null);

  const frameRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);

  useEffect(() => {
    let cancelled = false;
    // Avoid evaluating pdf.js in Node during prerender/build.
    if (typeof window === "undefined") return;

    void import("react-pdf").then(({ Document, Page, pdfjs }) => {
      if (cancelled) return;
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();
      setPdfComponents({ Document, Page });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;

    const ro = new ResizeObserver(() => {
      const w = node.clientWidth;
      setWidth(Math.max(320, Math.floor(w)));
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [url]);

  const canPrev = page > 1;
  const canNext = numPages != null ? page < numPages : true;

  const label = kind === "slides" ? "Slides" : "Report";
  const icon = kind === "slides" ? "slideshow" : "picture_as_pdf";

  const onDocLoad = ({ numPages: total }: { numPages: number }) => {
    setNumPages(total);
    setLoading(false);
    setLoadError(null);
    setPage((p) => Math.min(p, total));
  };

  const onDocError = (err: unknown) => {
    const msg = err instanceof Error ? err.message : "Failed to load PDF";
    setLoadError(msg);
    setLoading(false);
  };

  const onPageLoad = () => setLoading(false);

  const downloadHref = useMemo(() => url.trim(), [url]);

  const goPrev = () => {
    if (!canPrev) return;
    setLoading(true);
    setPage((p) => Math.max(1, p - 1));
  };

  const goNext = () => {
    if (!canNext) return;
    setLoading(true);
    setPage((p) => p + 1);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && page > 1) {
        e.preventDefault();
        setLoading(true);
        setPage((p) => Math.max(1, p - 1));
      } else if (e.key === "ArrowRight" && (numPages == null || page < numPages)) {
        e.preventDefault();
        setLoading(true);
        setPage((p) => p + 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [page, numPages]);

  const handleFullscreen = () => {
    const node = frameRef.current;
    if (!node) return;
    const anyNode = node as any;
    if (document.fullscreenElement) {
      void document.exitFullscreen?.();
      return;
    }
    void anyNode.requestFullscreen?.();
  };

  return (
    <div className="space-y-4">
      <PdfViewerToolbar
        label={label}
        icon={icon}
        page={page}
        numPages={numPages}
        canPrev={canPrev}
        canNext={canNext}
        downloadHref={downloadHref}
        onPrev={goPrev}
        onNext={goNext}
        onFullscreen={handleFullscreen}
      />

      <div
        ref={frameRef}
        className="rounded-2xl border border-outline-variant/20 bg-white overflow-hidden shadow-[0_20px_40px_-24px_rgba(2,6,23,0.35)] [&:fullscreen]:rounded-none [&:fullscreen]:border-0 [&:fullscreen]:bg-black [&:fullscreen_.pdf-slide-inner]:min-h-screen [&:fullscreen_.pdf-slide-inner]:bg-black"
      >
        <div className="pdf-slide-inner relative w-full flex items-center justify-center bg-surface-container-lowest min-h-[min(76vh,760px)] p-3 md:p-6">
          {!loadError && pdfComponents ? (
            <>
              <button
                type="button"
                onClick={goPrev}
                disabled={!canPrev}
                className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 md:w-12 md:h-12 rounded-full bg-black/55 text-white hover:bg-black/70 transition-colors disabled:opacity-35 disabled:hover:bg-black/55 flex items-center justify-center shadow-lg"
                title="Previous slide"
                aria-label="Previous slide"
              >
                <span className="material-symbols-outlined text-2xl">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={!canNext}
                className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 md:w-12 md:h-12 rounded-full bg-black/55 text-white hover:bg-black/70 transition-colors disabled:opacity-35 disabled:hover:bg-black/55 flex items-center justify-center shadow-lg"
                title="Next slide"
                aria-label="Next slide"
              >
                <span className="material-symbols-outlined text-2xl">chevron_right</span>
              </button>
              <div className="absolute bottom-3 left-3 z-20 rounded-full bg-black/60 text-white text-sm font-semibold px-3 py-1.5 pointer-events-none">
                {numPages != null ? `${page} / ${numPages}` : page}
              </div>
            </>
          ) : null}

          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
              <div className="w-9 h-9 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {loadError ? (
            <div className="w-full max-w-xl rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              <p className="font-bold mb-1">Couldn&apos;t load the PDF preview.</p>
              <p className="text-rose-800/90">{loadError}</p>
              <p className="text-rose-800/90 mt-2">
                Try the <a className="underline font-bold" href={downloadHref} target="_blank" rel="noopener noreferrer">download link</a>.
              </p>
            </div>
          ) : !pdfComponents ? (
            <div className="text-sm text-on-surface-variant">
              Loading viewer…
            </div>
          ) : (
            <pdfComponents.Document
              file={downloadHref}
              onLoadSuccess={onDocLoad}
              onLoadError={onDocError}
              loading={null}
              error={null}
              className="w-full flex items-center justify-center"
            >
              <pdfComponents.Page
                pageNumber={page}
                width={Math.min(width - 24, 980)}
                onLoadSuccess={onPageLoad}
                loading={null}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </pdfComponents.Document>
          )}
        </div>
      </div>

      <div className="text-xs text-on-surface-variant/70 text-right">
        Use left/right arrows or the buttons to navigate.
      </div>
    </div>
  );
}
