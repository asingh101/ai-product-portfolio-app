"use client";

import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { uploadFile } from "@/lib/storage";

interface DocumentUploaderProps {
  value: string;
  onChange: (url: string) => void;
  storagePath: string;
  label: string;
  helpText?: string;
}

function fileNameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = decodeURIComponent(u.pathname);
    const base = path.split("/").pop() || "";
    return base.replace(/^\d+_/, "") || "document.pdf";
  } catch {
    return "document.pdf";
  }
}

export function DocumentUploader({ value, onChange, storagePath, label, helpText }: DocumentUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentName = useMemo(() => (value ? fileNameFromUrl(value) : ""), [value]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setUploading(true);
      setError(null);
      try {
        const path = `${storagePath}/${Date.now()}_${file.name}`;
        const url = await uploadFile(file, path);
        onChange(url);
      } catch (err: any) {
        setError(err?.message || "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onChange, storagePath]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{label}</div>
          {helpText ? <div className="text-[11px] text-on-surface-variant/70 mt-1">{helpText}</div> : null}
        </div>
        {value ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
            title="Open in new tab"
          >
            <span className="material-symbols-outlined text-sm">open_in_new</span>
            Open
          </a>
        ) : null}
      </div>

      <div
        {...getRootProps()}
        className={`rounded-xl border-2 border-dashed px-4 py-4 cursor-pointer transition-colors bg-surface-container-lowest ${
          isDragActive ? "border-primary bg-primary/5" : "border-outline-variant/30 hover:border-primary/40"
        } ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-on-surface-variant/70 text-xl">
            {uploading ? "hourglass_empty" : "upload_file"}
          </span>
          <div className="min-w-0">
            <div className="text-sm font-bold text-on-surface">
              {value ? currentName : isDragActive ? "Drop PDF here" : "Click or drag a PDF"}
            </div>
            <div className="text-[11px] text-on-surface-variant/70">
              {value ? "Click to replace." : "PDF only."}
            </div>
          </div>
          {uploading ? <div className="ml-auto w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : null}
        </div>
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

