"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = React.ComponentPropsWithoutRef<typeof Input> & {
  currencyLabel?: string;
  onValueChange?: (formatted: string, cents: number) => void;
};

function formatFromCents(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((cents || 0) / 100);
}

function maskBRL(raw: string) {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return { formatted: "", cents: 0 };

  const cents = Number(digits);
  if (!Number.isFinite(cents)) return { formatted: "", cents: 0 };

  return { formatted: formatFromCents(cents), cents };
}

export const MoneyInput = React.forwardRef<HTMLInputElement, Props>(
  (
    {
      currencyLabel = "R$",
      className,
      inputMode,
      onChange,
      onValueChange,
      ...props
    },
    ref,
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onValueChange) {
        const { formatted, cents } = maskBRL(e.target.value);
        onValueChange(formatted, cents);
        return;
      }
      onChange?.(e);
    };

    const effectiveInputMode = onValueChange
      ? "numeric"
      : (inputMode ?? "decimal");

    return (
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {currencyLabel}
        </span>

        <Input
          ref={ref}
          inputMode={effectiveInputMode}
          className={cn("pl-10 text-right", className)}
          {...props}
          onChange={handleChange}
        />
      </div>
    );
  },
);

MoneyInput.displayName = "MoneyInput";
