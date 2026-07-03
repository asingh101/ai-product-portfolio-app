"use client";

import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cmsMarkdownRehypePlugins } from "@/lib/cmsMarkdownRehype";
import { normalizeMarkdownInput } from "@/lib/normalizeMarkdown";

function makeComponents(linkClassName: string) {
  return {
    p: ({ children }: { children?: ReactNode }) => <span className="block [&:not(:last-child)]:mb-2">{children}</span>,
    strong: ({ children }: { children?: ReactNode }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }: { children?: ReactNode }) => <em className="italic">{children}</em>,
    a: ({ href, children }: { href?: string; children?: ReactNode }) => (
      <a href={href} className={linkClassName} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
    ul: ({ children }: { children?: ReactNode }) => <ul className="list-disc pl-4 my-1 space-y-0.5">{children}</ul>,
    ol: ({ children }: { children?: ReactNode }) => <ol className="list-decimal pl-4 my-1 space-y-0.5">{children}</ol>,
    li: ({ children }: { children?: ReactNode }) => <li>{children}</li>,
  };
}

const defaultLinkClass = "underline font-medium text-primary/90 hover:text-primary";

/** Renders a short markdown string (bios, cards, captions). Inherits text color from parent. */
export function CompactMarkdown({
  text,
  className = "",
  linkClassName = defaultLinkClass,
  trim = true,
}: {
  text: string;
  className?: string;
  /** Use e.g. `text-white underline underline-offset-2` on dark backgrounds. */
  linkClassName?: string;
  /** When false, keeps leading/trailing whitespace inside the string (better for article blocks). */
  trim?: boolean;
}) {
  const raw = text ?? "";
  if (!raw.trim()) return null;
  const t = trim === false ? normalizeMarkdownInput(raw) : normalizeMarkdownInput(raw.trim());
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={cmsMarkdownRehypePlugins}
        components={makeComponents(linkClassName)}
      >
        {t}
      </ReactMarkdown>
    </div>
  );
}
