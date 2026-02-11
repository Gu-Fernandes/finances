"use client";

import { useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import { cn } from "@/lib/utils";

import { formatBRL, parseMoneyBR } from "../budget.constants";

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

export function InvestedCard({ amount, onChangeAmount }: Props) {
  const normalizeMoney = useCallback((raw: string) => {
    const cents = toCentsFromMasked(raw);
    return formatInputFromCents(cents);
  }, []);

  const total = parseMoneyBR(amount);

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
            🏦
          </span>
          <CardTitle className="text-base">Valor investido</CardTitle>
        </div>

        <div className="flex justify-center">
          <Badge variant="outline" className="border-primary/30 text-primary">
            {formatBRL(total)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative pb-4">
        <div className="grid gap-2 sm:grid-cols-2 sm:items-center">
          <Label className="text-sm text-muted-foreground">
            Total guardado
          </Label>

          <MoneyInput
            value={normalizeMoney(amount)}
            onChange={(e) => onChangeAmount(normalizeMoney(e.target.value))}
            inputMode="decimal"
            placeholder="0,00"
          />
        </div>
      </CardContent>
    </Card>
  );
}
