"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyInput } from "@/components/ui/money-input";
import { cn } from "@/lib/utils";

import { formatBRL, parseMoneyBR } from "../budget.constants";
import { Landmark } from "lucide-react";

type Props = {
  amount: string;
  onChangeAmount: (value: string) => void;
};

function toCentsFromMasked(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

function formatInputFromCents(cents: number) {
  if (!cents) return "";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function normalizeMoney(raw: string) {
  const cents = toCentsFromMasked(raw);
  return formatInputFromCents(cents);
}

export function InvestedCard({ amount, onChangeAmount }: Props) {
  const total = useMemo(() => parseMoneyBR(amount), [amount]);

  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editing) return;

    const t = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(t);
  }, [editing]);

  function finishEdit() {
    // se ficou "zero", mantém vazio (fica mais clean)
    if (toCentsFromMasked(amount) === 0) onChangeAmount("");
    setEditing(false);
  }

  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-2xl",
        "transition-all hover:-translate-y-0.5 hover:shadow-md",
        "hover:border-primary/20",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 opacity-0 transition-opacity",
          "group-hover:opacity-100",
          "bg-gradient-to-br from-violet-500/15 via-transparent to-transparent",
        )}
      />

      <CardHeader className="relative space-y-2 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-muted ring-1 ring-border">
            <Landmark className="size-5 text-muted-foreground" />
          </span>
          <CardTitle className="text-base">Valor investido</CardTitle>
        </div>

        <div className="flex justify-center">
          <Badge variant="outline" className="border-primary/30 text-primary">
            {formatBRL(total)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4 pb-4">
        {editing ? (
          <div
            className="rounded-xl border-b bg-background/50 p-3 shadow-sm"
            onBlurCapture={(e) => {
              const next = e.relatedTarget as Node | null;
              if (next && e.currentTarget.contains(next)) return;
              finishEdit();
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setEditing(false);
              if (e.key === "Enter") finishEdit();
            }}
          >
            <div className="grid gap-2 sm:grid-cols-2 sm:items-center">
              <p className="text-sm text-muted-foreground">Total guardado</p>

              <MoneyInput
                ref={inputRef}
                value={normalizeMoney(amount)}
                onChange={(e) => onChangeAmount(normalizeMoney(e.target.value))}
                inputMode="decimal"
                placeholder="0,00"
              />
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="w-full rounded-xl border-b bg-background/50 p-3 text-left shadow-sm transition hover:bg-muted/30"
            onClick={() => setEditing(true)}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-medium">
                Total guardado
              </p>

              <p className="shrink-0 text-sm font-semibold text-primary">
                {formatBRL(total)}
              </p>
            </div>
          </button>
        )}
      </CardContent>
    </Card>
  );
}
