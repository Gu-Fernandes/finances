"use client";

import type { ElementType } from "react";
import { cn } from "@/lib/utils";

type Props = {
  active: boolean;
  label: string;
  icon: ElementType;
  iconClassName?: string;
  onClick: () => void;
};

export function InvestmentsTabButton({
  active,
  label,
  icon: Icon,
  iconClassName,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      className={cn(
        "group inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium",
        "transition-colors",
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          iconClassName,
          "opacity-90 group-hover:opacity-100",
        )}
      />
      <span>{label}</span>

      {active && (
        <span
          aria-hidden="true"
          className="ml-1 h-1.5 w-1.5 rounded-full bg-primary"
        />
      )}
    </button>
  );
}
