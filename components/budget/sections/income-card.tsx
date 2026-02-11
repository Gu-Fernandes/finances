"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { cn } from "@/lib/utils";

import { formatBRL, parseMoneyBR } from "../budget.constants";

type Item = { id: string; label: string; amount: string };

type Props = {
  items?: Item[];
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

export function IncomeCard({ items = [], onAdd, onChange, onRemove }: Props) {
  const total = useMemo(
    () => items.reduce((sum, it) => sum + parseMoneyBR(it.amount), 0),
    [items],
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [focusField, setFocusField] = useState<"label" | "amount">("label");
  const [pendingAdd, setPendingAdd] = useState(false);

  const labelRef = useRef<HTMLInputElement | null>(null);
  const amountRef = useRef<HTMLInputElement | null>(null);

  function tryAutoRemove(it: Item) {
    const emptyLabel = (it.label ?? "").trim().length === 0;
    const emptyAmount = toCentsFromMasked(it.amount) === 0;
    if (emptyLabel && emptyAmount) onRemove(it.id);
  }

  const last = items[items.length - 1];
  const canAdd =
    items.length === 0 ||
    ((last.label ?? "").trim().length > 0 &&
      toCentsFromMasked(last.amount) > 0);

  function handleAdd() {
    if (!canAdd) return;
    onAdd();
    setPendingAdd(true);
  }

  // quando adicionar, coloca o último item em edição
  useEffect(() => {
    if (!pendingAdd) return;
    const newest = items[items.length - 1];
    if (!newest) return;

    setEditingId(newest.id);
    setFocusField("label");
    setPendingAdd(false);
  }, [pendingAdd, items]);

  // foca no campo certo quando entra em edição
  useEffect(() => {
    if (!editingId) return;

    const t = window.setTimeout(() => {
      if (focusField === "amount") amountRef.current?.focus();
      else labelRef.current?.focus();
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
          "bg-gradient-to-br from-emerald-500/15 via-transparent to-transparent",
        )}
      />

      <CardHeader className="relative space-y-2 pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-muted ring-1 ring-border">
              💰
            </span>
            <CardTitle className="text-base">Receitas</CardTitle>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            onClick={handleAdd}
            disabled={!canAdd}
            aria-label="Adicionar receita"
          >
            <Plus />
          </Button>
        </div>

        <div className="flex justify-center">
          <Badge variant="outline" className="border-primary/30 text-primary">
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
                  if (e.key === "Escape") {
                    setEditingId(null);
                  }
                }}
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    ref={labelRef}
                    value={it.label}
                    onChange={(e) => onChange(it.id, { label: e.target.value })}
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

          const label = (it.label ?? "").trim() || "Sem descrição";
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
                setFocusField(clickedAmount ? "amount" : "label");
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-medium">{label}</p>

                <p
                  data-field="amount"
                  className="shrink-0 text-sm font-semibold text-primary"
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
