"use client";

import { Star } from "lucide-react";

type StarInputProps = {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: number;
};

export default function StarInput({ rating, onRatingChange, size = 32 }: StarInputProps) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-2">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          className="transition-transform hover:scale-110 focus:outline-none"
          aria-label={`Avaliar com ${star} estrela${star > 1 ? 's' : ''}`}
        >
          <Star
            size={size}
            className={
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 hover:text-yellow-200"
            }
          />
        </button>
      ))}
      <span className="ml-2 text-lg font-medium text-gray-700">
        {rating > 0 ? rating.toFixed(1) : ""}
      </span>
    </div>
  );
}
