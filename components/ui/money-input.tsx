"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = React.ComponentPropsWithoutRef<typeof Input> & {
  currencyLabel?: string;
};

export const MoneyInput = React.forwardRef<HTMLInputElement, Props>(
  ({ currencyLabel = "R$", className, inputMode, ...props }, ref) => {
    return (
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {currencyLabel}
        </span>

        <Input
          ref={ref}
          inputMode={inputMode ?? "decimal"}
          className={cn("pl-10 text-right", className)}
          {...props}
        />
      </div>
    );
  },
);

MoneyInput.displayName = "MoneyInput";
