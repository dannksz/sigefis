"use client";

import { Star } from "lucide-react";

type StarRatingProps = {
  rating: number;
  size?: number;
  showValue?: boolean;
};

export default function StarRating({ rating, size = 20, showValue = true }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      {/* Estrelas cheias */}
      {[...Array(fullStars)].map((_, i) => (
        <Star
          key={`full-${i}`}
          size={size}
          className="fill-yellow-400 text-yellow-400"
        />
      ))}
      
      {/* Meia estrela */}
      {hasHalfStar && (
        <div className="relative" style={{ width: size, height: size }}>
          <Star
            size={size}
            className="absolute text-gray-300"
          />
          <div className="absolute overflow-hidden" style={{ width: size / 2 }}>
            <Star
              size={size}
              className="fill-yellow-400 text-yellow-400"
            />
          </div>
        </div>
      )}
      
      {/* Estrelas vazias */}
      {[...Array(emptyStars)].map((_, i) => (
        <Star
          key={`empty-${i}`}
          size={size}
          className="text-gray-300"
        />
      ))}

      {showValue && (
        <span className="ml-2 text-sm font-medium text-gray-700">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
