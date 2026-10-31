"use client";

import * as React from "react";
import { Star, Trash2, ImagePlus, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RatingStars } from "@/components/shared/RatingStars";
import { useAdminAuthStore } from "@/store/use-admin-auth-store";
import { useToastStore } from "@/store/use-toast-store";
import {
  deleteMyReview,
  fetchMyReview,
  fetchProductReviews,
  submitProductReview
} from "@/lib/api/reviews";
import { uploadReviewImage } from "@/lib/api/review-uploads";
import type { ApiReview } from "@/lib/api/types";
import { ApiRequestError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const MAX_REVIEW_PHOTOS = 5;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

type ProductReviewsProps = {
  slug: string;
  initialRating: number;
  initialReviewCount: number;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function StarPicker({
  value,
  onChange
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const [hovered, setHovered] = React.useState<number | null>(null);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1;
        const filled = (hovered ?? value) >= starValue;
        return (
          <button
            key={starValue}
            type="button"
            onClick={() => onChange(starValue)}
            onMouseEnter={() => setHovered(starValue)}
            onMouseLeave={() => setHovered(null)}
            aria-label={`Rate ${starValue} out of 5 stars`}
            className="p-0.5"
          >
            <Star
              className={cn(
                "h-6 w-6 transition-colors",
                filled
                  ? "fill-sand text-sand"
                  : "fill-charcoal/10 text-charcoal/10"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

function ReviewPhotoPicker({
  value,
  onChange,
  disabled
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
}) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const remaining = MAX_REVIEW_PHOTOS - value.length;
    if (remaining <= 0) {
      setError(`You can upload up to ${MAX_REVIEW_PHOTOS} photos.`);
      return;
    }

    const rawFiles = Array.from(fileList).slice(0, remaining);

    const validFiles: File[] = [];
    for (const file of rawFiles) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setError(`"${file.name}" is not a supported format. Use JPEG, PNG, or WEBP.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`"${file.name}" exceeds the 5 MB size limit.`);
        return;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setUploading(true);
    try {
      const urls = await Promise.all(
        validFiles.map((file) => uploadReviewImage(file))
      );
      onChange([...value, ...urls]);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not upload photo. Try again."
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.map((url) => (
          <div
            key={url}
            className="relative h-16 w-16 overflow-hidden rounded-[6px] border border-charcoal/10"
          >
            <img src={url} alt="" className="h-full w-full object-cover" />
            {!disabled && (
              <button
                type="button"
                onClick={() =>
                  onChange(value.filter((existing) => existing !== url))
                }
                aria-label="Remove photo"
                className="absolute right-0.5 top-0.5 rounded-full bg-charcoal/70 p-0.5 text-white"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}

        {value.length < MAX_REVIEW_PHOTOS && !disabled && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-[6px] border border-dashed border-charcoal/20 text-charcoal/40 hover:border-forest/40 hover:text-forest disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            <span className="text-[10px]">Add photo</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function ReviewPhotoGallery({ images }: { images: string[] }) {
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  if (images.length === 0) return null;

  function openLightbox(index: number) {
    setLightboxIndex(index);
  }

  function closeLightbox() {
    setLightboxIndex(null);
  }

  function prevImage() {
    setLightboxIndex((i) =>
      i !== null ? (i - 1 + images.length) % images.length : null
    );
  }

  function nextImage() {
    setLightboxIndex((i) =>
      i !== null ? (i + 1) % images.length : null
    );
  }

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2">
        {images.map((url, index) => (
          <button
            key={url}
            type="button"
            onClick={() => openLightbox(index)}
            className="block h-16 w-16 overflow-hidden rounded-[6px] border border-charcoal/10 transition-opacity hover:opacity-80"
          >
            <img
              src={url}
              alt="Customer photo"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
          >
            <X className="h-5 w-5" />
          </button>

          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-4 z-10 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          <img
            src={images[lightboxIndex]}
            alt="Review photo"
            className="max-h-[80vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-4 z-10 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>
      )}
    </>
  );
}


function RatingSummaryBar({
  reviews,
  summary
}: {
  reviews: ApiReview[];
  summary: { averageRating: number; reviewCount: number };
}) {
  const distribution = React.useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    for (const r of reviews) {
      if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1]++;
    }
    return counts;
  }, [reviews]);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-10">
      {/* Average */}
      <div className="flex flex-col items-center">
        <span className="text-4xl font-medium tracking-tight text-charcoal">
          {summary.averageRating.toFixed(1)}
        </span>
        <RatingStars rating={summary.averageRating} size={14} />
        <span className="mt-1 text-[11px] text-charcoal/40">
          {summary.reviewCount} {summary.reviewCount === 1 ? "review" : "reviews"}
        </span>
      </div>

      {/* Distribution */}
      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = distribution[star - 1];
          const pct = summary.reviewCount > 0 ? (count / summary.reviewCount) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="w-3 text-[11px] text-charcoal/40">{star}</span>
              <Star className="h-3 w-3 fill-sand/60 text-sand/60" />
              <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-charcoal/[0.06]">
                <div
                  className="h-full rounded-full bg-sand/70 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-6 text-right text-[11px] text-charcoal/30">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}


export function ProductReviews({
  slug,
  initialRating,
  initialReviewCount
}: ProductReviewsProps) {
  const { isAuthenticated, user, hasHydrated } = useAdminAuthStore();
  const showToast = useToastStore((state) => state.showToast);

  const [reviews, setReviews] = React.useState<ApiReview[]>([]);
  const [summary, setSummary] = React.useState({
    averageRating: initialRating,
    reviewCount: initialReviewCount
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [myReview, setMyReview] = React.useState<ApiReview | null | undefined>(
    undefined
  );

  const [isWriting, setIsWriting] = React.useState(false);
  const [guestName, setGuestName] = React.useState("");
  const [guestEmail, setGuestEmail] = React.useState("");
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [images, setImages] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const loadReviews = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, meta } = await fetchProductReviews(slug);
      setReviews(data);
      if (meta) {
        setSummary({
          averageRating:
            (meta.averageRating as number | undefined) ?? initialRating,
          reviewCount:
            (meta.reviewCount as number | undefined) ?? initialReviewCount
        });
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [slug, initialRating, initialReviewCount]);

  React.useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  React.useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      setMyReview(null);
      return;
    }
    fetchMyReview(slug)
      .then((review) => setMyReview(review))
      .catch(() => setMyReview(null));
  }, [slug, isAuthenticated, hasHydrated]);

  function startWriting() {
    setRating(myReview?.rating ?? 0);
    setComment(myReview?.comment ?? "");
    setImages(myReview?.images ?? []);
    setGuestName("");
    setGuestEmail("");
    setFormError(null);
    setIsWriting(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isAuthenticated) {
      const trimmedName = guestName.trim();
      const trimmedEmail = guestEmail.trim();

      if (trimmedName.length < 2) {
        setFormError("Please enter your name (at least 2 characters).");
        return;
      }
      if (!trimmedEmail) {
        setFormError("Email address is required.");
        return;
      }
      const emailRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!emailRegex.test(trimmedEmail)) {
        setFormError("Please enter a valid email address.");
        return;
      }
    }
    if (rating < 1 || rating > 5) {
      setFormError("Please select a star rating.");
      return;
    }
    if (comment.trim().length < 3) {
      setFormError("Please write a few words about the product.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const review = await submitProductReview(slug, {
        rating,
        comment: comment.trim(),
        images,
        ...(isAuthenticated
          ? {}
          : {
              name: guestName.trim(),
              email: guestEmail.trim().toLowerCase()
            })
      });
      if (isAuthenticated) {
        setMyReview(review);
      }
      setIsWriting(false);
      showToast(
        myReview
          ? "Your review has been published."
          : "Your review has been published."
      );
      await loadReviews();
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError
          ? error.message
          : "Could not submit your review. Try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!myReview) return;
    try {
      await deleteMyReview(slug, myReview.id);
      setMyReview(null);
      showToast("Your review was deleted");
      await loadReviews();
    } catch (error) {
      showToast(
        error instanceof ApiRequestError
          ? error.message
          : "Could not delete your review.", "error"
      );
    }
  }

  const otherReviews = reviews.filter((review) => review.userId !== user?.id);

  return (
    <section id="reviews" className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-12 scroll-mt-24">
      {/* Section Header */}
      <div className="flex flex-col gap-6 border-b border-charcoal/[0.06] pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-4">
          <h2 className="font-serif text-display-md text-charcoal">
            Customer Reviews
          </h2>
          <RatingSummaryBar reviews={reviews} summary={summary} />
        </div>

        {hasHydrated &&
          (!isAuthenticated || myReview !== undefined) &&
          !isWriting && (
            <Button
              variant="outline"
              onClick={startWriting}
              className="shrink-0 rounded-full"
            >
              {myReview ? "Edit your review" : "Write a Review"}
            </Button>
          )}
      </div>

      {/* Review Form */}
      {isWriting && (
        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-[10px] border border-charcoal/[0.06] bg-white p-6"
        >
          {!isAuthenticated && (
            <>
              <label className="mb-2 block text-[13px] font-medium text-charcoal">
                Your name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                placeholder="e.g. Sara Khan"
                maxLength={120}
                required
                className="mb-4"
              />
              <label className="mb-2 block text-[13px] font-medium text-charcoal">
                Email address <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={guestEmail}
                onChange={(event) => setGuestEmail(event.target.value)}
                placeholder="e.g. sara@example.com"
                maxLength={160}
                required
                className="mb-4"
              />
            </>
          )}

          <label className="mb-2 block text-[13px] font-medium text-charcoal">
            Your rating <span className="text-red-500">*</span>
          </label>
          <StarPicker value={rating} onChange={setRating} />

          <label className="mb-2 mt-4 block text-[13px] font-medium text-charcoal">
            Your review <span className="text-red-500">*</span>
          </label>
          <Textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Share your experience with this product..."
            maxLength={2000}
          />

          <label className="mb-2 mt-4 block text-[13px] font-medium text-charcoal">
            Add photos{" "}
            <span className="font-normal text-charcoal/40">
              (optional, up to {MAX_REVIEW_PHOTOS})
            </span>
          </label>
          <p className="mb-2 text-[11px] text-charcoal/40">
            JPEG, PNG, or WEBP. Max 5 MB each.
          </p>
          <ReviewPhotoPicker
            value={images}
            onChange={setImages}
            disabled={isSubmitting}
          />

          {formError && (
            <p className="mt-2 text-sm text-red-500">{formError}</p>
          )}

          <div className="mt-4 flex gap-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full"
            >
              {isSubmitting
                ? "Submitting..."
                : myReview
                  ? "Update Review"
                  : "Submit Review"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsWriting(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Current User's Review */}
      {myReview && !isWriting && (
        <div className="mt-8 flex items-start justify-between gap-4 rounded-[10px] border border-forest/15 bg-forest/[0.03] p-6">
          <div>
            <p className="mb-1 text-overline uppercase text-forest">
              Your review
            </p>
            <RatingStars rating={myReview.rating} size={14} />
            <p className="mt-2 text-[13px] leading-relaxed text-charcoal/75">
              {myReview.comment}
            </p>
            <ReviewPhotoGallery images={myReview.images} />
          </div>
          <button
            type="button"
            onClick={handleDelete}
            aria-label="Delete your review"
            className="shrink-0 rounded-full p-2 text-charcoal/35 transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Review List */}
      <div className="mt-8 space-y-6">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-charcoal/30" />
          </div>
        )}

        {!isLoading && otherReviews.length === 0 && (
          <p className="py-8 text-center text-[13px] text-charcoal/40">
            No reviews yet. Be the first to review this product.
          </p>
        )}

        {otherReviews.map((review) => (
          <div
            key={review.id}
            className="border-b border-charcoal/[0.04] pb-6 last:border-none"
          >
            <div className="flex gap-4">
              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sand/20 text-sm font-medium text-charcoal/70">
                {review.userAvatarUrl ? (
                  <img
                    src={review.userAvatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  review.userName.slice(0, 1).toUpperCase()
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-medium text-charcoal">
                    {review.userName}
                  </span>
                  <span className="text-[11px] text-charcoal/30">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                <div className="mt-1">
                  <RatingStars rating={review.rating} size={12} />
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-charcoal/65">
                  {review.comment}
                </p>
                <ReviewPhotoGallery images={review.images} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
