"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { cn } from "@/lib/utils";

import { formatBRL, parseMoneyBR } from "../budget.constants";
import { BUDGET_UI } from "../budget.ui";

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
  const ui = BUDGET_UI.expense;

  const total = useMemo(
    () => items.reduce((sum, it) => sum + parseMoneyBR(it.amount), 0),
    [items],
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [focusField, setFocusField] = useState<"desc" | "amount">("desc");
  const [pendingAdd, setPendingAdd] = useState(false);

  const descRef = useRef<HTMLInputElement | null>(null);
  const amountRef = useRef<HTMLInputElement | null>(null);

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

  function handleAdd() {
    if (!canAdd) return;
    onAdd();
    setPendingAdd(true);
  }

  useEffect(() => {
    if (!pendingAdd) return;
    const newest = items[items.length - 1];
    if (!newest) return;

    setEditingId(newest.id);
    setFocusField("desc");
    setPendingAdd(false);
  }, [pendingAdd, items]);

  useEffect(() => {
    if (!editingId) return;

    const t = window.setTimeout(() => {
      if (focusField === "amount") amountRef.current?.focus();
      else descRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(t);
  }, [editingId, focusField]);

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
          "bg-gradient-to-br",
          ui.gradientFrom,
          "via-transparent to-transparent",
        )}
      />

      <CardHeader className="relative space-y-2 pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "grid size-9 place-items-center rounded-xl ring-1 ring-border",
                ui.iconBg,
              )}
            >
              <Sparkles className={cn("size-5", ui.iconText)} />
            </span>

            <CardTitle className="text-base">Gastos diversos</CardTitle>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            onClick={handleAdd}
            disabled={!canAdd}
            aria-label="Adicionar gasto diverso"
          >
            <Plus />
          </Button>
        </div>

        <div className="flex justify-center">
          <Badge variant="outline" className={cn(ui.badgeOutline)}>
            {formatBRL(total)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4 pb-4">
        {items.map((it) => {
          const isEditing = editingId === it.id;

          if (isEditing) {
            return (
              <div
                key={it.id}
                className="rounded-xl border-b bg-background/50 p-3 shadow-sm"
                onBlurCapture={(e) => {
                  const next = e.relatedTarget as Node | null;
                  if (next && e.currentTarget.contains(next)) return;

                  tryAutoRemove(it);
                  setEditingId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setEditingId(null);
                }}
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    ref={descRef}
                    value={it.description}
                    onChange={(e) =>
                      onChange(it.id, { description: e.target.value })
                    }
                    placeholder="Descrição"
                  />

                  <MoneyInput
                    ref={amountRef}
                    value={normalizeMoney(it.amount)}
                    onChange={(e) =>
                      onChange(it.id, {
                        amount: normalizeMoney(e.target.value),
                      })
                    }
                    inputMode="decimal"
                    placeholder="0,00"
                  />
                </div>
              </div>
            );
          }

          const desc = (it.description ?? "").trim() || "Sem descrição";
          const value = formatBRL(parseMoneyBR(it.amount));

          return (
            <button
              key={it.id}
              type="button"
              className="w-full rounded-xl border-b bg-background/50 p-3 text-left shadow-sm transition hover:bg-muted/30"
              onClick={(e) => {
                const clickedAmount = Boolean(
                  (e.target as HTMLElement).closest('[data-field="amount"]'),
                );

                setEditingId(it.id);
                setFocusField(clickedAmount ? "amount" : "desc");
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-medium">{desc}</p>

                <p
                  data-field="amount"
                  className={cn("shrink-0 text-sm font-semibold", ui.value)}
                >
                  {value}
                </p>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
