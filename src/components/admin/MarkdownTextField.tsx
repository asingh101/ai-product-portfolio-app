"use client";

import { useRef, type RefObject } from "react";
import { CMS_SIZE_CLASS_NAMES } from "@/lib/cmsMarkdownRehype";

type FieldEl = HTMLTextAreaElement | HTMLInputElement;

function wrapSelection(
  el: FieldEl,
  value: string,
  onChange: (v: string) => void,
  before: string,
  after: string
) {
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  const selected = value.slice(start, end);
  const next = value.slice(0, start) + before + selected + after + value.slice(end);
  onChange(next);
  const innerStart = start + before.length;
  const innerEnd = innerStart + selected.length;
  requestAnimationFrame(() => {
    el.focus();
    if (selected.length === 0) {
      el.setSelectionRange(innerStart, innerStart);
    } else {
      el.setSelectionRange(innerStart, innerEnd);
    }
  });
}

/**
 * Bold uses HTML `<strong>` (not markdown `**`) so it still works inside CMS size `<span>`s;
 * CommonMark does not parse `**` inside raw HTML.
 */
function wrapBoldHtml(el: FieldEl, value: string, onChange: (v: string) => void) {
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  const selected = value.slice(start, end);
  const before = "<strong>";
  const after = "</strong>";
  if (selected.length > 0) {
    if (/^\*\*[\s\S]*\*\*$/.test(selected)) {
      const inner = selected.slice(2, -2);
      const next = value.slice(0, start) + inner + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start, start + inner.length);
      });
      return;
    }
    if (/^<strong>[\s\S]*<\/strong>$/i.test(selected)) {
      const inner = selected.replace(/^<strong>/i, "").replace(/<\/strong>$/i, "");
      const next = value.slice(0, start) + inner + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start, start + inner.length);
      });
      return;
    }
    wrapSelection(el, value, onChange, before, after);
    return;
  }
  const placeholder = "emphasized text";
  const insert = `${before}${placeholder}${after}`;
  const next = value.slice(0, start) + insert + value.slice(end);
  onChange(next);
  const selStart = start + before.length;
  const selEnd = selStart + placeholder.length;
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(selStart, selEnd);
  });
}

/** Italic uses `<em>` for the same reason as {@link wrapBoldHtml}. */
function wrapEmHtml(el: FieldEl, value: string, onChange: (v: string) => void) {
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  const selected = value.slice(start, end);
  const before = "<em>";
  const after = "</em>";
  if (selected.length > 0) {
    if (/^<em>[\s\S]*<\/em>$/i.test(selected)) {
      const inner = selected.replace(/^<em>/i, "").replace(/<\/em>$/i, "");
      const next = value.slice(0, start) + inner + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start, start + inner.length);
      });
      return;
    }
    if (
      selected.length >= 2 &&
      selected.startsWith("*") &&
      selected.endsWith("*") &&
      !selected.startsWith("**") &&
      !selected.slice(1, -1).includes("*")
    ) {
      const inner = selected.slice(1, -1);
      const next = value.slice(0, start) + inner + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start, start + inner.length);
      });
      return;
    }
    wrapSelection(el, value, onChange, before, after);
    return;
  }
  const placeholder = "emphasized text";
  const insert = `${before}${placeholder}${after}`;
  const next = value.slice(0, start) + insert + value.slice(end);
  onChange(next);
  const selStart = start + before.length;
  const selEnd = selStart + placeholder.length;
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(selStart, selEnd);
  });
}

function transformSelectedBlock(
  el: HTMLTextAreaElement,
  value: string,
  onChange: (v: string) => void,
  mapLine: (line: string, index: number) => string
) {
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  const from = value.lastIndexOf("\n", start - 1) + 1;
  let to = value.indexOf("\n", end);
  if (to === -1) to = value.length;
  const block = value.slice(from, to);
  const lines = block.split("\n");
  let i = 0;
  const out = lines.map((line) => mapLine(line, i++)).join("\n");
  const next = value.slice(0, from) + out + value.slice(to);
  onChange(next);
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(from + out.length, from + out.length);
  });
}

export function MarkdownToolbar({
  inputRef,
  value,
  onChange,
  multiline = true,
  compact = false,
}: {
  inputRef: RefObject<FieldEl | null>;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  compact?: boolean;
}) {
  const run = (action: (el: FieldEl) => void) => {
    const el = inputRef.current;
    if (!el) return;
    action(el);
  };

  const chip = (label: string, title: string, action: (el: FieldEl) => void) => (
    <button
      type="button"
      key={label}
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => run(action)}
      className={`rounded-md border border-outline-variant/50 bg-surface-container-low text-on-surface hover:border-primary/50 hover:bg-surface-container transition-colors font-bold ${
        compact ? "px-2 py-0.5 text-[10px] min-h-[26px]" : "px-2.5 py-1 text-xs min-h-[30px]"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-2">
      <span
        className={`text-on-surface-variant/80 font-bold uppercase tracking-wider ${compact ? "text-[9px] w-full" : "text-[10px]"}`}
        title="Select text, then B/I. Size wraps HTML spans; bold/italic use HTML so they work inside those spans. Toolbar clicks keep your selection."
      >
        Markdown
      </span>
      <span
        className={`text-on-surface-variant/80 font-bold uppercase tracking-wider ${compact ? "text-[9px]" : "text-[10px]"}`}
        title={`Font size: wraps selection in <span class="…"> (allowed: ${CMS_SIZE_CLASS_NAMES.join(", ")}).`}
      >
        Size
      </span>
      {chip("S", "Small", (el) =>
        wrapSelection(el, value, onChange, '<span class="cms-size-sm">', "</span>")
      )}
      {chip("M", "Base", (el) =>
        wrapSelection(el, value, onChange, '<span class="cms-size-base">', "</span>")
      )}
      {chip("L", "Large", (el) =>
        wrapSelection(el, value, onChange, '<span class="cms-size-lg">', "</span>")
      )}
      {chip("XL", "Extra large", (el) =>
        wrapSelection(el, value, onChange, '<span class="cms-size-xl">', "</span>")
      )}
      {chip("2XL", "Display size", (el) =>
        wrapSelection(el, value, onChange, '<span class="cms-size-2xl">', "</span>")
      )}
      <span className={`text-on-surface-variant/40 ${compact ? "px-0.5" : "px-1"}`} aria-hidden>
        |
      </span>
      {chip("B", "Bold, HTML strong (works inside size spans)", (el) => wrapBoldHtml(el, value, onChange))}
      {chip("I", "Italic, HTML em (works inside size spans)", (el) => wrapEmHtml(el, value, onChange))}
      {chip("<>", "Inline code", (el) => wrapSelection(el, value, onChange, "`", "`"))}
      {chip("Link", "Link [text](url)", (el) => {
        const url = typeof window !== "undefined" ? window.prompt("Link URL (https://…)", "https://") : null;
        if (url === null || url === "") return;
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? 0;
        const selected = value.slice(start, end);
        const label = selected || "link text";
        const insert = `[${label}](${url})`;
        const next = value.slice(0, start) + insert + value.slice(end);
        onChange(next);
        requestAnimationFrame(() => {
          el.focus();
          const pos = start + insert.length;
          el.setSelectionRange(pos, pos);
        });
      })}
      {multiline && (
        <>
          {chip("• List", "Bullet list", (el) => {
            if (el instanceof HTMLTextAreaElement) {
              transformSelectedBlock(el, value, onChange, (line) => {
                const t = line.trim();
                if (!t) return line;
                if (/^[-*]\s/.test(t)) return line;
                return `- ${t}`;
              });
            }
          })}
          {chip("1. List", "Numbered list", (el) => {
            if (el instanceof HTMLTextAreaElement) {
              let n = 1;
              transformSelectedBlock(el, value, onChange, (line) => {
                const t = line.trim();
                if (!t) return line;
                const stripped = t.replace(/^\d+\.\s+/, "");
                return `${n++}. ${stripped}`;
              });
            }
          })}
          {chip("##", "Heading", (el) => {
            if (el instanceof HTMLTextAreaElement) {
              const ta = el;
              const start = ta.selectionStart ?? 0;
              const lineStart = value.lastIndexOf("\n", start - 1) + 1;
              const lineEnd = value.indexOf("\n", start);
              const endLine = lineEnd === -1 ? value.length : lineEnd;
              const line = value.slice(lineStart, endLine);
              const nextLine = line.startsWith("##") ? line : `## ${line}`;
              const next = value.slice(0, lineStart) + nextLine + value.slice(endLine);
              onChange(next);
              requestAnimationFrame(() => {
                ta.focus();
                ta.setSelectionRange(lineStart + nextLine.length, lineStart + nextLine.length);
              });
            }
          })}
        </>
      )}
    </div>
  );
}

export function MarkdownTextField({
  value,
  onChange,
  multiline = true,
  rows = 4,
  className = "",
  textareaClassName = "",
  placeholder,
  disabled,
  compactToolbar = false,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  className?: string;
  textareaClassName?: string;
  placeholder?: string;
  disabled?: boolean;
  compactToolbar?: boolean;
  id?: string;
}) {
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  return (
    <div className={className}>
      <MarkdownToolbar
        inputRef={ref}
        value={value}
        onChange={onChange}
        multiline={multiline}
        compact={compactToolbar}
      />
      {multiline ? (
        <textarea
          id={id}
          ref={ref as RefObject<HTMLTextAreaElement>}
          rows={rows}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={textareaClassName}
        />
      ) : (
        <input
          id={id}
          ref={ref as RefObject<HTMLInputElement>}
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={textareaClassName}
        />
      )}
    </div>
  );
}
