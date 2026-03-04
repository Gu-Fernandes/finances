"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  CARD_COLORS,
  type CardColorId,
} from "@/components/budget/budget.card-colors";

export function ColorSwatchPicker({
  value,
  onChange,
  className,
  size = "md",
}: {
  value: CardColorId;
  onChange: (v: CardColorId) => void;
  className?: string;
  size?: "sm" | "md";
}) {
  const dot = size === "sm" ? "size-7" : "size-8";
  const icon = size === "sm" ? "size-4" : "size-4.5";

  return (
    <div
      role="radiogroup"
      aria-label="Cor do cartão"
      className={cn("flex flex-wrap gap-1.5", className)}
    >
      {CARD_COLORS.map((c) => {
        const selected = c.id === value;

        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={selected}
            title={c.label}
            onClick={() => onChange(c.id)}
            className={cn(
              "relative rounded-full p-0 transition",

              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-foreground/40",
              "hover:scale-[1.05] active:scale-[0.98]",
              selected && "scale-[1.08]",
            )}
          >
            <span className={cn("block rounded-full", dot, c.dot)} />

            {selected && (
              <span className="pointer-events-none absolute inset-0 grid place-items-center">
                <Check
                  className={cn(
                    icon,

                    "text-white",

                    "drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]",
                  )}
                />
              </span>
            )}

            <span className="sr-only">{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
