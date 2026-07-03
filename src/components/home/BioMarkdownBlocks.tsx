"use client";

import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cmsMarkdownRehypePlugins } from "@/lib/cmsMarkdownRehype";
import { subtitleParagraphs } from "@/lib/homeSubtitle";
import { stripOuterBoldFence } from "@/lib/markdownBio";

const mdComponents = {
  p: ({ children }: { children?: ReactNode }) => <p className="mb-0">{children}</p>,
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-bold text-neutral-900 dark:text-on-surface">{children}</strong>
  ),
  em: ({ children }: { children?: ReactNode }) => <em className="italic">{children}</em>,
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>
  ),
  li: ({ children }: { children?: ReactNode }) => <li>{children}</li>,
};

export function BioMarkdownBlocks({
  text,
  variant,
  className = "",
}: {
  text: string;
  /** `lead` = hero intro (stronger default weight); `body` = closing bio under chatbot. */
  variant: "lead" | "body";
  className?: string;
}) {
  const { text: fenced, blockBold } = stripOuterBoldFence(text);
  const paras = subtitleParagraphs(fenced);
  if (paras.length === 0) return null;

  const isLead = variant === "lead";
  /* Full-width hero intro: semibold/bold when user fenced the whole block or for lead emphasis. */
  const weightClass =
    blockBold || isLead
      ? "text-base md:text-lg font-semibold leading-[1.65] text-neutral-900 dark:text-on-surface [&_strong]:font-bold"
      : "text-base md:text-lg font-normal leading-[1.6] text-neutral-700 dark:text-on-surface-variant [&_strong]:font-bold [&_strong]:text-neutral-900 dark:[&_strong]:text-on-surface";

  return (
    <div
      className={`space-y-[1.1em] w-full max-w-none font-[family-name:var(--font-body)] ${weightClass} ${className}`}
    >
      {paras.map((para, i) => (
        <div key={i} className="w-full max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={cmsMarkdownRehypePlugins}
            components={mdComponents}
          >
            {para}
          </ReactMarkdown>
        </div>
      ))}
    </div>
  );
}
