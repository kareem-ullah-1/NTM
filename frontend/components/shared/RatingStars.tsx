import { Star } from "lucide-react";

type RatingStarsProps = {
  rating: number;
  reviewCount?: number;
  size?: number;
};

export function RatingStars({ rating, reviewCount, size = 14 }: RatingStarsProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5" role="img" aria-label={`Rated ${rating} out of 5`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            width={size}
            height={size}
            className={index < Math.round(rating) ? "fill-sand text-sand" : "fill-charcoal/10 text-charcoal/10"}
          />
        ))}
      </div>
      {typeof reviewCount === "number" && (
        <span className="text-xs text-charcoal/50">({reviewCount})</span>
      )}
    </div>
  );
}
