"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { uploadImage } from "@/lib/storage";

export interface GalleryImage {
  url: string;
  caption?: string;
  alt?: string;
}

interface GalleryUploaderProps {
  value: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  storagePath: string;
}

export function GalleryUploader({
  value,
  onChange,
  storagePath,
}: GalleryUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setUploading(true);
      try {
        const uploads = await Promise.all(
          acceptedFiles.map(async (file) => {
            const path = `${storagePath}/${Date.now()}_${file.name}`;
            const url = await uploadImage(file, path);
            return { url, caption: "", alt: file.name } as GalleryImage;
          })
        );
        onChange([...value, ...uploads]);
      } finally {
        setUploading(false);
      }
    },
    [value, onChange, storagePath]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"], "image/gif": [".gif"], "image/webp": [".webp"] },
    disabled: uploading,
  });

  const removeImage = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const updateCaption = (idx: number, caption: string) => {
    const next = [...value];
    next[idx] = { ...next[idx], caption };
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {/* Thumbnails */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {value.map((img, idx) => (
            <div key={`${img.url}-${idx}`} className="relative group rounded-xl overflow-hidden border border-outline-variant/30">
              <div className="aspect-square relative">
                <img src={img.url} alt={img.alt || ""} className="absolute inset-0 w-full h-full object-cover" />
              </div>
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => moveImage(idx, idx - 1)}
                  disabled={idx === 0}
                  className="w-6 h-6 rounded bg-black/60 text-white flex items-center justify-center disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-xs">arrow_back</span>
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(idx, idx + 1)}
                  disabled={idx === value.length - 1}
                  className="w-6 h-6 rounded bg-black/60 text-white flex items-center justify-center disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="w-6 h-6 rounded bg-red-600/80 text-white flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </div>
              <input
                type="text"
                value={img.caption || ""}
                onChange={(e) => updateCaption(idx, e.target.value)}
                placeholder="Caption..."
                className="w-full text-[10px] px-2 py-1.5 bg-surface-container-lowest border-t border-outline-variant/30 focus:outline-none"
              />
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`flex items-center justify-center gap-2 py-4 px-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-outline-variant/30 hover:border-primary/40"
        } ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        ) : (
          <>
            <span className="material-symbols-outlined text-on-surface-variant/60 text-lg">add_photo_alternate</span>
            <span className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest">
              {isDragActive ? "Drop images" : "Add images"}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
