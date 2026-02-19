"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBRL } from "../budget.constants";

export const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function pct(current: number, base: number) {
  if (base <= 0) return null;
  return (current / base) * 100;
}

export function deltaPct(current: number, prev: number) {
  if (prev === 0) return null;
  return ((current - prev) / Math.abs(prev)) * 100;
}

export function ProgressBar({
  value,
  tone = "primary",
}: {
  value: number; // 0..1
  tone?: "primary" | "destructive" | "muted";
}) {
  const v = clamp01(value);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn(
          "h-full rounded-full transition-[width]",
          tone === "destructive"
            ? "bg-destructive"
            : tone === "muted"
              ? "bg-muted-foreground/40"
              : "bg-primary",
        )}
        style={{ width: `${v * 100}%` }}
      />
    </div>
  );
}

export function DeltaPill({
  label,
  current,
  prev,
  goodWhenUp = true,
}: {
  label: string;
  current: number;
  prev: number;
  goodWhenUp?: boolean;
}) {
  const d = current - prev;
  const dp = deltaPct(current, prev);

  const isUp = d > 0;
  const isGood = goodWhenUp ? isUp : !isUp;

  const Icon = isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="rounded-2xl border bg-background/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold tracking-tight">
            {formatBRL(current)}
          </p>
          <p
            className={cn(
              "text-xs",
              isGood ? "text-primary" : "text-destructive",
            )}
          >
            <span className="inline-flex items-center gap-1">
              <Icon className="size-4" />
              {formatBRL(Math.abs(d))}{" "}
              {dp == null ? "" : `(${dp > 0 ? "+" : ""}${dp.toFixed(0)}%)`} vs.
              mês anterior
            </span>
          </p>
        </div>

        <span
          className={cn(
            "grid size-10 place-items-center rounded-xl ring-1 ring-border",
            isGood ? "bg-primary/10" : "bg-destructive/10",
          )}
        >
          {isGood ? (
            <TrendingUp className="size-5 text-primary" />
          ) : (
            <TrendingDown className="size-5 text-destructive" />
          )}
        </span>
      </div>
    </div>
  );
}
