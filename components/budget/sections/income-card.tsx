"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, HandCoins, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

import { formatBRL, parseMoneyBR } from "../budget.constants";
import { BUDGET_UI } from "../budget.ui";

type Item = { id: string; label: string; amount: string };

type Props = {
  items?: Item[];
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

export function IncomeCard({ items = [], onAdd, onChange, onRemove }: Props) {
  const ui = BUDGET_UI.income;

  const total = useMemo(
    () => items.reduce((sum, it) => sum + parseMoneyBR(it.amount), 0),
    [items],
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [focusField, setFocusField] = useState<"label" | "amount">("label");

  // 🔽 recolhido por padrão
  const [open, setOpen] = useState(false);

  // enquanto edita, mantem aberto (pra não “sumir” inputs)
  const isOpen = open || editingId !== null;

  const labelRef = useRef<HTMLInputElement | null>(null);
  const amountRef = useRef<HTMLInputElement | null>(null);

  const tryAutoRemove = (it: Item) => {
    const emptyLabel = (it.label ?? "").trim().length === 0;
    const emptyAmount = toCentsFromMasked(it.amount) === 0;
    if (emptyLabel && emptyAmount) onRemove(it.id);
  };

  const last = items.at(-1);
  const lastId = last?.id;
  const handleOpenChange = (next: boolean) => {
    if (editingId && !next) return;
    setOpen(next);
  };
  const canAdd =
    !last ||
    ((last.label ?? "").trim().length > 0 &&
      toCentsFromMasked(last.amount) > 0);

  const handleAdd = () => {
    if (!canAdd) return;

    // abre o card pra mostrar o lançamento novo
    setOpen(true);

    onAdd();
    setEditingId(EDIT_LAST);
    setFocusField("label");
  };

  useEffect(() => {
    if (!editingId) return;

    const t = window.setTimeout(() => {
      if (focusField === "amount") amountRef.current?.focus();
      else labelRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(t);
  }, [editingId, focusField, items.length]);

  return (
    <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
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
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex flex-1 items-center justify-between gap-3 rounded-xl p-1 text-left",
                  "transition hover:bg-muted/30",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                )}
                aria-label={isOpen ? "Recolher receitas" : "Expandir receitas"}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-xl ring-1 ring-border",
                      ui.iconBg,
                    )}
                  >
                    <HandCoins className={cn("size-5", ui.iconText)} />
                  </span>

                  <div className="min-w-0">
                    <CardTitle className="text-base">Receitas</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {items.length === 0
                        ? "Nenhum lançamento"
                        : `${items.length} lançamento${items.length > 1 ? "s" : ""}`}
                    </p>
                  </div>
                </div>

                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
            </CollapsibleTrigger>

            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              onClick={(e) => {
                // não disparar o trigger do Collapsible
                e.stopPropagation();
                handleAdd();
              }}
              disabled={!canAdd}
              aria-label="Adicionar receita"
            >
              <Plus />
            </Button>
          </div>

          <CollapsibleTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex w-full justify-center rounded-xl py-1",
                "transition hover:bg-muted/30",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              )}
              aria-label={isOpen ? "Recolher receitas" : "Expandir receitas"}
            >
              <Badge variant="outline" className={cn(ui.badgeOutline)}>
                {formatBRL(total)}
              </Badge>
            </button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="relative space-y-4 pb-4">
            {items.length === 0 ? (
              <div className="rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground">
                Clique em <span className="font-medium">+</span> para adicionar
                uma receita.
              </div>
            ) : (
              items.map((it) => {
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
                          ref={labelRef}
                          className="font-medium"
                          value={it.label}
                          onChange={(e) =>
                            onChange(it.id, { label: e.target.value })
                          }
                          placeholder="Descrição"
                        />

                        <MoneyInput
                          ref={amountRef}
                          className={cn(
                            "font-semibold caret-current",
                            ui.value,
                          )}
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
                          aria-label="Excluir receita"
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

                const label = (it.label ?? "").trim() || "Sem descrição";
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
                      setFocusField(clickedAmount ? "amount" : "label");
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="min-w-0 truncate text-sm font-medium">
                        {label}
                      </p>

                      <p
                        data-field="amount"
                        className={cn(
                          "shrink-0 text-sm font-semibold",
                          ui.value,
                        )}
                      >
                        {value}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
