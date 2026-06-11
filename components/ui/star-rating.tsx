"use client";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  label?: string;
  readonly?: boolean;
}

export function StarRating({ value, onChange, label, readonly }: StarRatingProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-sm text-stone-600">{label}</span>}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            className={cn(
              "transition-colors",
              !readonly && "cursor-pointer hover:scale-110"
            )}
          >
            <Star
              className={cn(
                "w-5 h-5",
                star <= value ? "fill-amber-400 text-amber-400" : "text-stone-200 fill-stone-200"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
