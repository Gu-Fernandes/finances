"use client";

import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { cn } from "@/lib/utils";

import { formatBRL, parseMoneyBR } from "../budget.constants";

type Item = { id: string; description: string; amount: string };

type Props = {
  items: Item[];
  onAdd: () => void;
  onChange: (id: string, patch: Partial<Item>) => void;
  onRemove: (id: string) => void;
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

export function MiscExpensesCard({ items, onAdd, onChange, onRemove }: Props) {
  const total = items.reduce((sum, it) => sum + parseMoneyBR(it.amount), 0);

  function tryAutoRemove(it: Item) {
    const emptyDesc = (it.description ?? "").trim().length === 0;
    const emptyAmount = toCentsFromMasked(it.amount) === 0;
    if (emptyDesc && emptyAmount) onRemove(it.id);
  }

  const last = items[items.length - 1];
  const canAdd =
    items.length === 0 ||
    ((last.description ?? "").trim().length > 0 &&
      toCentsFromMasked(last.amount) > 0);

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
          "bg-gradient-to-br from-amber-500/15 via-transparent to-transparent",
        )}
      />

      <CardHeader className="relative space-y-2 pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-muted ring-1 ring-border">
              🧯
            </span>
            <CardTitle className="text-base">Gastos diversos</CardTitle>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            onClick={() => {
              if (!canAdd) return;
              onAdd();
            }}
            disabled={!canAdd}
            aria-label="Adicionar gasto diverso"
          >
            <Plus />
          </Button>
        </div>

        <div className="flex justify-center">
          <Badge
            variant="outline"
            className="border-destructive/30 text-destructive"
          >
            {formatBRL(total)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-8 pb-4">
        {items.map((it) => (
          <div
            key={it.id}
            className="rounded-xl border-b bg-background/50 p-3 shadow-sm"
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                value={it.description}
                onChange={(e) =>
                  onChange(it.id, { description: e.target.value })
                }
                onBlur={() => tryAutoRemove(it)}
                placeholder="Descrição"
              />

              <MoneyInput
                value={normalizeMoney(it.amount)}
                onChange={(e) =>
                  onChange(it.id, { amount: normalizeMoney(e.target.value) })
                }
                onBlur={() => tryAutoRemove(it)}
                inputMode="decimal"
                placeholder="0,00"
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
