"use client";

import * as React from "react";
import { Film, Loader2, RefreshCcw, X } from "lucide-react";
import { uploadMediaToR2 } from "@/lib/api/uploads";
import { cn } from "@/lib/utils";

type PendingUpload = {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: "uploading" | "error";
  error?: string;
};

type VideoUploadFieldProps = {
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
};

const ACCEPTED_TYPES = ["video/mp4", "video/webm"];
const DEFAULT_MAX_SIZE_MB = 50;

export function VideoUploadField({
  value,
  onChange,
  disabled,
  label = "Video",
  accept = "video/mp4,video/webm",
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
}: VideoUploadFieldProps) {
  const [pending, setPending] = React.useState<PendingUpload | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function startUpload(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setPending({
        id: `${file.name}-${Date.now()}`,
        file,
        previewUrl: "",
        progress: 0,
        status: "error",
        error: `Invalid file type. Only MP4 and WebM videos are accepted.`,
      });
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setPending({
        id: `${file.name}-${Date.now()}`,
        file,
        previewUrl: "",
        progress: 0,
        status: "error",
        error: `Video must be smaller than ${maxSizeMB}MB.`,
      });
      return;
    }

    const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const previewUrl = URL.createObjectURL(file);
    setPending({ id, file, previewUrl, progress: 0, status: "uploading" });

    try {
      const url = await uploadMediaToR2(file, (percent) => {
        setPending((current) =>
          current && current.id === id ? { ...current, progress: percent } : current
        );
      });
      onChange(url);
      setPending(null);
      URL.revokeObjectURL(previewUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed. Please try again.";
      setPending((current) =>
        current && current.id === id ? { ...current, status: "error", error: message } : current
      );
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) startUpload(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  function retry() {
    if (pending) {
      const file = pending.file;
      setPending(null);
      startUpload(file);
    }
  }

  function remove() {
    if (pending?.previewUrl) URL.revokeObjectURL(pending.previewUrl);
    setPending(null);
    onChange(null);
  }

  function dismissError() {
    if (pending?.previewUrl) URL.revokeObjectURL(pending.previewUrl);
    setPending(null);
  }

  const isUploading = pending?.status === "uploading";
  const hasError = pending?.status === "error";

  return (
    <div>
      <label className="text-[12px] font-medium text-charcoal/70">{label}</label>
      <div className="mt-1.5">
        {value && !pending && (
          <div className="group relative overflow-hidden rounded-lg border border-charcoal/15">
            <video
              src={value}
              className="h-32 w-full object-cover"
              controls
              preload="metadata"
            />
            <button
              type="button"
              onClick={remove}
              disabled={disabled}
              aria-label="Remove video"
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-charcoal/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {pending && (
          <div
            className={cn(
              "relative overflow-hidden rounded-lg border",
              hasError ? "border-red-400" : "border-charcoal/15"
            )}
          >
            {pending.previewUrl ? (
              <video
                src={pending.previewUrl}
                className="h-32 w-full object-cover opacity-60"
                preload="metadata"
              />
            ) : (
              <div className="flex h-32 items-center justify-center bg-charcoal/5">
                <Film className="h-8 w-8 text-charcoal/20" />
              </div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-charcoal/50">
              {isUploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                  <span className="text-[11px] font-medium text-white">{pending.progress}%</span>
                  <div className="h-1 w-24 overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-white transition-all duration-300"
                      style={{ width: `${pending.progress}%` }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className="max-w-[200px] text-center text-[11px] text-red-200">
                    {pending.error}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={retry}
                      aria-label="Retry upload"
                      className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-[11px] text-white hover:bg-white/30"
                    >
                      <RefreshCcw className="h-3 w-3" /> Retry
                    </button>
                    <button
                      type="button"
                      onClick={dismissError}
                      className="rounded-full bg-white/20 px-3 py-1 text-[11px] text-white hover:bg-white/30"
                    >
                      Remove
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {!value && !pending && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-charcoal/25 text-charcoal/50 transition-colors hover:border-forest hover:text-forest disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Film className="h-6 w-6" />
            <span className="text-[11px] font-medium">Upload Video</span>
            <span className="text-[10px] text-charcoal/35">MP4 or WebM, max {maxSizeMB}MB</span>
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
