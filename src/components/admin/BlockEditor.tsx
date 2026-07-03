"use client";

import { useState } from "react";
import {
  ContentBlock,
  BlockType,
  BLOCK_META,
  createEmptyBlock,
} from "@/types/blocks";
import { ImageUploader } from "./ImageUploader";
import { GalleryUploader, GalleryImage } from "./GalleryUploader";
import { MarkdownTextField } from "./MarkdownTextField";
import { DocumentUploader } from "./DocumentUploader";

interface BlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  storagePath: string;
}

export function BlockEditor({ blocks, onChange, storagePath }: BlockEditorProps) {
  const [menuOpenIdx, setMenuOpenIdx] = useState<number | null>(null);

  const updateBlock = (idx: number, block: ContentBlock) => {
    const next = [...blocks];
    next[idx] = block;
    onChange(next);
  };

  const removeBlock = (idx: number) => {
    onChange(blocks.filter((_, i) => i !== idx));
  };

  const moveBlock = (from: number, to: number) => {
    if (to < 0 || to >= blocks.length) return;
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const insertBlock = (type: BlockType, afterIdx: number) => {
    const next = [...blocks];
    next.splice(afterIdx + 1, 0, createEmptyBlock(type));
    onChange(next);
    setMenuOpenIdx(null);
  };

  return (
    <div className="space-y-3">
      {blocks.length === 0 && (
        <div className="text-center py-12 text-on-surface-variant/50 border-2 border-dashed border-outline-variant/30 rounded-xl">
          <span className="material-symbols-outlined text-4xl mb-2 block">article</span>
          <p className="text-sm font-bold uppercase tracking-widest mb-4">No content blocks yet</p>
          <AddBlockMenu
            onSelect={(type) => insertBlock(type, -1)}
            open={menuOpenIdx === -1}
            onToggle={() => setMenuOpenIdx(menuOpenIdx === -1 ? null : -1)}
          />
        </div>
      )}

      {blocks.map((block, idx) => (
        <div key={idx} className="group relative">
          <div className="flex items-start gap-2">
            {/* Controls */}
            <div className="flex flex-col gap-0.5 pt-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button type="button" onClick={() => moveBlock(idx, idx - 1)} disabled={idx === 0} className="w-6 h-6 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container disabled:opacity-20">
                <span className="material-symbols-outlined text-sm">arrow_upward</span>
              </button>
              <button type="button" onClick={() => moveBlock(idx, idx + 1)} disabled={idx === blocks.length - 1} className="w-6 h-6 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container disabled:opacity-20">
                <span className="material-symbols-outlined text-sm">arrow_downward</span>
              </button>
              <button type="button" onClick={() => removeBlock(idx)} className="w-6 h-6 rounded flex items-center justify-center text-red-400 hover:bg-red-50">
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            </div>

            {/* Block content */}
            <div className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3 text-on-surface-variant/60">
                <span className="material-symbols-outlined text-sm">{BLOCK_META[block.type].icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">{BLOCK_META[block.type].label}</span>
              </div>
              <BlockField block={block} onChange={(b) => updateBlock(idx, b)} storagePath={storagePath} />
            </div>
          </div>

          {/* Add block between */}
          <div className="flex justify-center py-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <AddBlockMenu
              onSelect={(type) => insertBlock(type, idx)}
              open={menuOpenIdx === idx}
              onToggle={() => setMenuOpenIdx(menuOpenIdx === idx ? null : idx)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function AddBlockMenu({
  onSelect,
  open,
  onToggle,
}: {
  onSelect: (type: BlockType) => void;
  open: boolean;
  onToggle: () => void;
}) {
  const types = Object.entries(BLOCK_META) as [BlockType, { label: string; icon: string }][];

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={onToggle}
        className="w-7 h-7 rounded-full border border-outline-variant/40 flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-sm">add</span>
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-30 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-xl p-2 min-w-[180px]">
          {types.map(([type, meta]) => (
            <button
              key={type}
              type="button"
              onClick={() => onSelect(type)}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-base text-on-surface-variant">{meta.icon}</span>
              {meta.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BlockField({
  block,
  onChange,
  storagePath,
}: {
  block: ContentBlock;
  onChange: (block: ContentBlock) => void;
  storagePath: string;
}) {
  switch (block.type) {
    case "text":
      return (
        <MarkdownTextField
          rows={4}
          compactToolbar
          value={block.data.text}
          onChange={(v) => onChange({ ...block, data: { text: v } })}
          placeholder="Write a paragraph..."
          textareaClassName="w-full bg-transparent border border-outline-variant/20 rounded-lg px-3 py-2 focus:outline-none text-sm leading-relaxed resize-y"
        />
      );

    case "heading":
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            {([2, 3] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => onChange({ ...block, data: { ...block.data, level: lvl } })}
                className={`px-2 py-0.5 rounded text-xs font-bold ${block.data.level === lvl ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}
              >
                H{lvl}
              </button>
            ))}
          </div>
          <MarkdownTextField
            multiline={false}
            compactToolbar
            value={block.data.text}
            onChange={(v) => onChange({ ...block, data: { ...block.data, text: v } })}
            placeholder="Heading text..."
            textareaClassName={`w-full bg-transparent border border-outline-variant/20 rounded-lg px-3 py-2 focus:outline-none font-bold ${block.data.level === 2 ? "text-xl" : "text-lg"}`}
          />
        </div>
      );

    case "image":
      return (
        <div className="space-y-2">
          <ImageUploader
            value={block.data.url}
            onChange={(url) => onChange({ ...block, data: { ...block.data, url } })}
            storagePath={storagePath}
          />
          <MarkdownTextField
            multiline={false}
            compactToolbar
            value={block.data.caption || ""}
            onChange={(v) => onChange({ ...block, data: { ...block.data, caption: v } })}
            placeholder="Caption (optional)"
            textareaClassName="w-full bg-surface-container-low rounded-lg px-3 py-2 text-xs focus:outline-none border border-outline-variant/20"
          />
        </div>
      );

    case "gallery":
      return (
        <GalleryUploader
          value={block.data.images as GalleryImage[]}
          onChange={(images) => onChange({ ...block, data: { images } })}
          storagePath={storagePath}
        />
      );

    case "quote":
      return (
        <div className="space-y-2 pl-4 border-l-4 border-primary/30">
          <MarkdownTextField
            rows={3}
            compactToolbar
            value={block.data.text}
            onChange={(v) => onChange({ ...block, data: { ...block.data, text: v } })}
            placeholder="Quote text..."
            textareaClassName="w-full bg-transparent border border-outline-variant/20 rounded-lg px-3 py-2 focus:outline-none text-sm italic resize-y"
          />
          <MarkdownTextField
            multiline={false}
            compactToolbar
            value={block.data.attribution || ""}
            onChange={(v) => onChange({ ...block, data: { ...block.data, attribution: v } })}
            placeholder="Attribution (optional)"
            textareaClassName="w-full bg-surface-container-low rounded-lg px-3 py-1.5 text-xs focus:outline-none border border-outline-variant/20"
          />
        </div>
      );

    case "metrics": {
      const items = block.data.items;
      return (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                value={item.value}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...next[i], value: e.target.value };
                  onChange({ ...block, data: { items: next } });
                }}
                placeholder="Value"
                className="w-24 bg-surface-container-low rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none border border-outline-variant/20"
              />
              <MarkdownTextField
                className="flex-1 min-w-0"
                multiline={false}
                compactToolbar
                value={item.label}
                onChange={(v) => {
                  const next = [...items];
                  next[i] = { ...next[i], label: v };
                  onChange({ ...block, data: { items: next } });
                }}
                placeholder="Label"
                textareaClassName="w-full bg-surface-container-low rounded-lg px-3 py-1.5 text-xs focus:outline-none border border-outline-variant/20"
              />
              <button type="button" onClick={() => onChange({ ...block, data: { items: items.filter((_, j) => j !== i) } })} className="text-red-400 hover:text-red-600">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange({ ...block, data: { items: [...items, { value: "", label: "" }] } })}
            className="text-xs text-primary font-bold flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">add</span> Add metric
          </button>
        </div>
      );
    }

    case "list": {
      const listItems = block.data.items;
      return (
        <div className="space-y-2">
          <div className="flex gap-2 mb-1">
            {(["bullet", "numbered"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange({ ...block, data: { ...block.data, style: s } })}
                className={`px-2 py-0.5 rounded text-xs font-bold capitalize ${block.data.style === s ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}
              >
                {s}
              </button>
            ))}
          </div>
          {listItems.map((item, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-xs text-on-surface-variant w-4 text-right shrink-0">
                {block.data.style === "numbered" ? `${i + 1}.` : "•"}
              </span>
              <MarkdownTextField
                className="flex-1 min-w-0"
                multiline={false}
                compactToolbar
                value={item}
                onChange={(v) => {
                  const next = [...listItems];
                  next[i] = v;
                  onChange({ ...block, data: { ...block.data, items: next } });
                }}
                placeholder="List item..."
                textareaClassName="w-full bg-surface-container-low rounded-lg px-3 py-1.5 text-sm focus:outline-none border border-outline-variant/20"
              />
              <button type="button" onClick={() => onChange({ ...block, data: { ...block.data, items: listItems.filter((_, j) => j !== i) } })} className="text-red-400 hover:text-red-600">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange({ ...block, data: { ...block.data, items: [...listItems, ""] } })}
            className="text-xs text-primary font-bold flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">add</span> Add item
          </button>
        </div>
      );
    }

    case "divider":
      return <hr className="border-outline-variant/30 my-2" />;

    case "docs":
      return (
        <div className="space-y-4">
          <DocumentUploader
            label="Deck (PDF)"
            helpText="Upload your slide deck as a PDF."
            value={block.data.deckUrl || ""}
            onChange={(deckUrl) => onChange({ ...block, data: { ...block.data, deckUrl } })}
            storagePath={`${storagePath}/docs/deck`}
          />
          <DocumentUploader
            label="Detailed report (PDF)"
            helpText="This powers the “Download Report” button on the case study page."
            value={block.data.reportUrl || ""}
            onChange={(reportUrl) => onChange({ ...block, data: { ...block.data, reportUrl } })}
            storagePath={`${storagePath}/docs/report`}
          />
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Report button text
            </label>
            <input
              type="text"
              value={block.data.reportButtonText ?? "Download Report"}
              onChange={(e) =>
                onChange({ ...block, data: { ...block.data, reportButtonText: e.target.value } })
              }
              placeholder="Download Report"
              className="w-full bg-surface-container-low rounded-lg px-3 py-2 text-sm focus:outline-none border border-outline-variant/20"
            />
          </div>
        </div>
      );

    default:
      return null;
  }
}
