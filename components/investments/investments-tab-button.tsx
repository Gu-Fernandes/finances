"use client";

import type React from "react";
import { cn } from "@/lib/utils";

type Props = {
  active: boolean;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
};

export function InvestmentsTabButton({
  active,
  label,
  icon: Icon,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm transition",
        "hover:bg-accent hover:text-accent-foreground",
        active && "bg-accent text-accent-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}
