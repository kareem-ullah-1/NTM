"use client";

import * as React from "react";
import { ImagePlus, Loader2, RefreshCcw, X } from "lucide-react";
import { deleteImageFromR2, uploadImageToR2 } from "@/lib/api/uploads";
import { cn } from "@/lib/utils";

type PendingUpload = {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: "uploading" | "error";
  error?: string;
};

type ImageUploadFieldProps = {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
};

export function ImageUploadField({ value, onChange, maxImages = 10, disabled }: ImageUploadFieldProps) {
  const [pending, setPending] = React.useState<PendingUpload[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const remainingSlots = maxImages - value.length - pending.length;

  async function startUpload(file: File) {
    const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const previewUrl = URL.createObjectURL(file);
    setPending((current) => [...current, { id, file, previewUrl, progress: 0, status: "uploading" }]);

    try {
      const url = await uploadImageToR2(file, (percent) => {
        setPending((current) => current.map((item) => (item.id === id ? { ...item, progress: percent } : item)));
      });
      onChange([...value, url]);
      setPending((current) => current.filter((item) => item.id !== id));
      URL.revokeObjectURL(previewUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed. Please try again.";
      setPending((current) =>
        current.map((item) => (item.id === id ? { ...item, status: "error", error: message } : item))
      );
    }
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).slice(0, Math.max(remainingSlots, 0));
    files.forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      startUpload(file);
    });
    if (inputRef.current) inputRef.current.value = "";
  }

  function retry(item: PendingUpload) {
    setPending((current) => current.filter((entry) => entry.id !== item.id));
    startUpload(item.file);
  }

  function dismissError(id: string) {
    setPending((current) => {
      const target = current.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  }

  function removeUploaded(url: string) {
    onChange(value.filter((existing) => existing !== url));
    void deleteImageFromR2(url);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {value.map((url) => (
          <div key={url} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-charcoal/15">
            {}
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeUploaded(url)}
              disabled={disabled}
              aria-label="Remove image"
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-charcoal/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {pending.map((item) => (
          <div
            key={item.id}
            className={cn(
              "relative h-20 w-20 overflow-hidden rounded-lg border",
              item.status === "error" ? "border-red-400" : "border-charcoal/15"
            )}
          >
            {}
            <img src={item.previewUrl} alt="" className="h-full w-full object-cover opacity-60" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-charcoal/40 text-white">
              {item.status === "uploading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-[10px] font-medium">{item.progress}%</span>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => retry(item)} aria-label="Retry upload">
                    <RefreshCcw className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissError(item.id)}
                    aria-label="Remove failed upload"
                    className="text-[10px] underline"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {remainingSlots > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-charcoal/25 text-charcoal/50 hover:border-forest hover:text-forest disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ImagePlus className="h-5 w-5" />
            <span className="text-[10px]">Add</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        disabled={disabled}
        onChange={(event) => handleFiles(event.target.files)}
        className="hidden"
      />

      {pending.some((item) => item.status === "error") && (
        <p className="mt-2 text-xs text-red-500">
          {pending.find((item) => item.status === "error")?.error ?? "One or more uploads failed."}
        </p>
      )}
      <p className="mt-1.5 text-xs text-charcoal/45">
        {value.length + pending.length}/{maxImages} images
      </p>
    </div>
  );
}
