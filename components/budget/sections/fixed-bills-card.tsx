"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarCheck2, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { cn } from "@/lib/utils";

import { useAppStore } from "@/store/app-store";
import { useBudgetStore } from "@/store/budget.store";

import { formatBRL, parseMoneyBR } from "../budget.constants";
import { BUDGET_UI } from "../budget.ui";

type Item = { id: string; description: string; amount: string };

type Props = {
  items: Item[];
  onAdd: () => void;
  onChange: (id: string, patch: Partial<Item>) => void;
  onRemove: (id: string) => void;
};

const EDIT_LAST = "__EDIT_LAST__";

const toCentsFromMasked = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
};

const normalizeMoney = (raw: string) => {
  const cents = toCentsFromMasked(raw);
  if (!cents) return "";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
};

export function FixedBillsCard({ items, onAdd, onChange, onRemove }: Props) {
  const ui = BUDGET_UI.expense;

  const total = useMemo(
    () => items.reduce((sum, it) => sum + parseMoneyBR(it.amount), 0),
    [items],
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [focusField, setFocusField] = useState<"desc" | "amount">("desc");

  const descRef = useRef<HTMLInputElement | null>(null);
  const amountRef = useRef<HTMLInputElement | null>(null);

  const last = items.at(-1);
  const lastId = last?.id;

  const canAdd =
    !last ||
    ((last.description ?? "").trim().length > 0 &&
      toCentsFromMasked(last.amount) > 0);

  const tryAutoRemove = (it: Item) => {
    const emptyDesc = (it.description ?? "").trim().length === 0;
    const emptyAmount = toCentsFromMasked(it.amount) === 0;
    if (emptyDesc && emptyAmount) onRemove(it.id);
  };

  const addAndEditLast = () => {
    onAdd();
    setEditingId(EDIT_LAST);
    setFocusField("desc");
  };

  const { currentMonthKey } = useAppStore();
  const {
    selectedMonthKey,
    getMonth,
    getPreviousMonthKey,
    copyFixedBillsFromPrevious,
  } = useBudgetStore();

  const monthKey = selectedMonthKey || currentMonthKey;

  const prevKey = getPreviousMonthKey(monthKey);
  const prevHasFixedBills = getMonth(prevKey).fixedBills.length > 0;

  const [askCopyFor, setAskCopyFor] = useState<string | null>(null);
  const [dismissCopyFor, setDismissCopyFor] = useState<string | null>(null);

  const askCopy = askCopyFor === monthKey;
  const dismissCopy = dismissCopyFor === monthKey;

  const handleAdd = () => {
    if (!canAdd) return;

    const shouldAsk = !dismissCopy && items.length === 0 && prevHasFixedBills;

    if (shouldAsk) {
      setAskCopyFor(monthKey);
      return;
    }

    addAndEditLast();
  };

  useEffect(() => {
    if (!editingId) return;

    const t = window.setTimeout(() => {
      if (focusField === "amount") amountRef.current?.focus();
      else descRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(t);
  }, [editingId, focusField, items.length]);

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
              <CalendarCheck2 className={cn("size-5", ui.iconText)} />
            </span>

            <CardTitle className="text-base">Contas fixas</CardTitle>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            onClick={handleAdd}
            disabled={!canAdd || askCopy}
            aria-label="Adicionar conta fixa"
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
        {askCopy ? (
          <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/10 p-3 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Deseja adicionar as mesmas contas fixas do último mês?
            </p>

            <div className="mt-3 flex justify-center gap-3">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  copyFixedBillsFromPrevious(monthKey);
                  setAskCopyFor(null);
                  setDismissCopyFor(monthKey);
                }}
              >
                Sim, copiar
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setAskCopyFor(null);
                  setDismissCopyFor(monthKey);
                  addAndEditLast();
                }}
              >
                Não
              </Button>
            </div>
          </div>
        ) : null}

        {items.map((it) => {
          const isEditing =
            editingId === it.id ||
            (editingId === EDIT_LAST && it.id === lastId);

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
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                  <Input
                    ref={descRef}
                    className="font-medium"
                    value={it.description}
                    onChange={(e) =>
                      onChange(it.id, { description: e.target.value })
                    }
                    placeholder="Conta fixa"
                  />

                  <MoneyInput
                    ref={amountRef}
                    className={cn("font-semibold caret-current", ui.value)}
                    value={normalizeMoney(it.amount)}
                    onChange={(e) =>
                      onChange(it.id, {
                        amount: normalizeMoney(e.target.value),
                      })
                    }
                    inputMode="decimal"
                    placeholder="0,00"
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="sm:ml-1"
                    aria-label="Excluir conta fixa"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onRemove(it.id);
                      setEditingId(null);
                    }}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
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
                const clickedAmount = !!(e.target as HTMLElement).closest(
                  '[data-field="amount"]',
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
