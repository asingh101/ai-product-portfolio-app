"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { uploadImage } from "@/lib/storage";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  storagePath: string;
  className?: string;
  aspectRatio?: string;
}

export function ImageUploader({
  value,
  onChange,
  storagePath,
  className = "",
  aspectRatio = "aspect-video",
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setUploading(true);
      setError(null);
      try {
        const path = `${storagePath}/${Date.now()}_${file.name}`;
        const url = await uploadImage(file, path);
        onChange(url);
      } catch (err: any) {
        setError(err.message || "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [storagePath, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"], "image/gif": [".gif"], "image/webp": [".webp"] },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={`relative ${aspectRatio} rounded-xl border-2 border-dashed overflow-hidden cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-outline-variant/40 hover:border-primary/50"
        } ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input {...getInputProps()} />

        {value ? (
          <img
            src={value}
            alt="Uploaded"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-on-surface-variant/60 gap-2">
            <span className="material-symbols-outlined text-3xl">
              cloud_upload
            </span>
            <span className="text-xs font-bold uppercase tracking-widest">
              {isDragActive ? "Drop here" : "Click or drag"}
            </span>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-surface/80 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {value && !uploading && (
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
            <span className="material-symbols-outlined text-white text-2xl">
              swap_horiz
            </span>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}
