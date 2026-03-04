"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CreditCard, Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ColorSwatchPicker } from "@/components/budget/color-swatch-picker";
import {
  CARD_COLOR_BY_ID,
  DEFAULT_CARD_COLOR,
  type CardColorId,
} from "@/components/budget/budget.card-colors";

import { useBudgetStore } from "@/store/budget.store";
import { formatBRL, parseMoneyBR } from "../budget.constants";
import { BUDGET_UI } from "../budget.ui";

/* ------------------------------- Types ------------------------------- */

type Item = {
  id: string;
  category: string;
  amount: string;
  cardId?: string;
};

type Props = {
  items: Item[];
  onAdd: () => void;
  onChange: (id: string, patch: Partial<Item>) => void;
  onRemove: (id: string) => void;
};

/* ------------------------------ Constants ---------------------------- */

const EDIT_LAST = "__EDIT_LAST__";
const UNASSIGNED = "__UNASSIGNED__";
const CREATE_CARD = "__CREATE_CARD__";

/* ------------------------------- Helpers ----------------------------- */

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

function keyOf(it: Item) {
  return (it.cardId ?? "").trim() || UNASSIGNED;
}

const isEmptyText = (s?: string) => (s ?? "").trim().length === 0;
const amountIsZero = (raw?: string) => toCentsFromMasked(raw ?? "") === 0;

const isBlankRow = (it: Pick<Item, "category" | "amount">) =>
  isEmptyText(it.category) && amountIsZero(it.amount);

function CardPicker({
  value,
  cards,
  ensureCard,
  onSelect,
  getCardColor,
}: {
  value: string;
  cards: Array<{ id: string; name: string }>;
  ensureCard: (name: string, opts?: { color?: CardColorId }) => string | null;
  onSelect: (id: string) => void;
  getCardColor: (id?: string) => CardColorId;
}) {
  const [createMode, setCreateMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<CardColorId>(DEFAULT_CARD_COLOR);

  const canCreate = newName.trim().length > 0;

  return (
    <div className="space-y-2">
      <Select
        value={value || undefined}
        onValueChange={(v) => {
          if (v === CREATE_CARD) {
            setCreateMode(true);
            return;
          }
          onSelect(v);
          setCreateMode(false);
        }}
      >
        <SelectTrigger
          size="sm"
          className="w-full border-0 bg-transparent px-0 py-1 shadow-none data-[size=sm]:h-auto"
        >
          <SelectValue placeholder="Selecionar cartão" />
        </SelectTrigger>

        <SelectContent align="start">
          {cards.map((c) => {
            const preset = CARD_COLOR_BY_ID[getCardColor(c.id)];
            return (
              <SelectItem key={c.id} value={c.id}>
                <div className="flex items-center gap-2">
                  <span className={cn("size-2.5 rounded-full", preset.dot)} />
                  <span>{c.name}</span>
                </div>
              </SelectItem>
            );
          })}

          <SelectSeparator />
          <SelectItem value={CREATE_CARD}>Adicionar novo cartão</SelectItem>
        </SelectContent>
      </Select>

      {createMode && (
        <div className="space-y-3 rounded-xl border bg-muted/10 p-3">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome do cartão"
          />

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Cor do cartão
            </p>
            <ColorSwatchPicker value={newColor} onChange={setNewColor} />
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              disabled={!canCreate}
              onClick={() => {
                const id = ensureCard(newName.trim(), { color: newColor });
                if (!id) return;

                onSelect(id);
                setNewName("");
                setNewColor(DEFAULT_CARD_COLOR);
                setCreateMode(false);
              }}
            >
              Adicionar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Main Card ---------------------------- */

export function CardExpensesCard({ items, onAdd, onChange, onRemove }: Props) {
  const ui = BUDGET_UI.expense;

  const {
    creditCards,
    ensureCreditCard,
    getCreditCardName,
    getCreditCardColor,
  } = useBudgetStore();

  const catRef = useRef<HTMLInputElement | null>(null);
  const amountRef = useRef<HTMLInputElement | null>(null);
  const editingWrapRef = useRef<HTMLDivElement | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [focusField, setFocusField] = useState<"cat" | "amount">("cat");

  // true = expandido; undefined/false = recolhido
  const [expandedByCard, setExpandedByCard] = useState<Record<string, boolean>>(
    {},
  );

  // "+" do cartão cria gasto e seta o cardId automaticamente
  const [pendingAssignCardId, setPendingAssignCardId] = useState<string | null>(
    null,
  );

  const lastItem = items[items.length - 1];
  const lastItemId = lastItem?.id;
  const editingRealId = useMemo(() => {
    if (!editingId) return null;
    return editingId === EDIT_LAST ? (lastItemId ?? null) : editingId;
  }, [editingId, lastItemId]);

  const total = useMemo(
    () =>
      items.reduce(
        (sum, it) => (isBlankRow(it) ? sum : sum + parseMoneyBR(it.amount)),
        0,
      ),
    [items],
  );

  const lastCardOk = ((lastItem?.cardId ?? "") as string).trim().length > 0;

  const canAdd =
    !lastItem ||
    ((lastItem.category ?? "").trim().length > 0 &&
      toCentsFromMasked(lastItem.amount) > 0 &&
      lastCardOk);

  const editingItem = useMemo(() => {
    if (!editingId) return null;

    const id = editingId === EDIT_LAST ? lastItemId : editingId;
    if (!id) return null;

    return items.find((x) => x.id === id) ?? null;
  }, [editingId, items, lastItemId]);

  const editingGroupKey = useMemo(() => {
    if (!editingId) return null;

    const it =
      editingItem ?? (editingId === EDIT_LAST ? (lastItem ?? null) : null);

    return it ? keyOf(it) : null;
  }, [editingId, editingItem, lastItem]);

  const tryAutoRemove = (it: Item) => {
    if (isBlankRow(it)) onRemove(it.id);
  };

  const openEditor = (id: string, focus: "cat" | "amount") => {
    setEditingId(id);
    setFocusField(focus);
  };

  const addNew = () => {
    if (!canAdd) return;

    setPendingAssignCardId(null);
    onAdd();
    openEditor(EDIT_LAST, "cat");
  };

  const addForCard = (cardId: string) => {
    if (!canAdd) return;

    setPendingAssignCardId(cardId);
    onAdd();
    openEditor(EDIT_LAST, "cat");
  };

  // aplica o cardId automaticamente na NOVA linha (vinda do "+" do cartão)
  useEffect(() => {
    if (!pendingAssignCardId) return;
    if (!lastItem) return;

    if (!(lastItem.cardId ?? "").trim()) {
      onChange(lastItem.id, { cardId: pendingAssignCardId });
    }

    setPendingAssignCardId(null);
  }, [pendingAssignCardId, lastItem, onChange]);

  // fecha edição ao clicar fora (sem fechar ao interagir com o Select Portal)
  useEffect(() => {
    if (!editingId) return;

    const onPointerDown = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const wrap = editingWrapRef.current;
      if (wrap && wrap.contains(target)) return;
      if (target.closest('[data-slot="select-content"]')) return;

      if (editingItem) tryAutoRemove(editingItem);
      setEditingId(null);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [editingId, editingItem]);

  // foco automático
  useEffect(() => {
    if (!editingId) return;

    const t = window.setTimeout(() => {
      if (focusField === "amount") amountRef.current?.focus();
      else catRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(t);
  }, [editingId, focusField, items.length]);

  const groups = useMemo(() => {
    const map = new Map<string, Item[]>();

    for (const it of items) {
      const isEditingRow = editingRealId === it.id;

      if (!isEditingRow && isBlankRow(it)) continue;

      const k = keyOf(it);
      const arr = map.get(k) ?? [];
      arr.push(it);
      map.set(k, arr);
    }

    const list = Array.from(map.entries()).map(([cardId, list]) => {
      const count = list.reduce((n, it) => n + (isBlankRow(it) ? 0 : 1), 0);
      const total = list.reduce(
        (s, it) => (isBlankRow(it) ? s : s + parseMoneyBR(it.amount)),
        0,
      );

      return {
        cardId,
        name:
          cardId === UNASSIGNED
            ? "Sem cartão"
            : getCreditCardName(cardId) || "Cartão",
        items: list,
        count,
        total,
      };
    });

    list.sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
    );

    return list;
  }, [items, creditCards, getCreditCardName, editingRealId]);

  const toggleGroup = (cardId: string) => {
    setExpandedByCard((p) => ({ ...p, [cardId]: !(p[cardId] ?? false) }));
  };

  const renderRow = (it: Item) => {
    const isEditing =
      editingId === it.id || (editingId === EDIT_LAST && it.id === lastItemId);

    if (isEditing) {
      const effectiveCardId =
        (it.cardId ?? "").trim() ||
        (it.id === lastItemId ? (pendingAssignCardId ?? "") : "");

      return (
        <div
          key={it.id}
          ref={editingWrapRef}
          className="rounded-xl border-b bg-background/50 p-3 shadow-sm"
          onBlurCapture={(e) => {
            const nextEl = e.relatedTarget as HTMLElement | null;

            if (nextEl && e.currentTarget.contains(nextEl)) return;

            if (nextEl?.closest?.('[data-slot="select-content"]')) return;

            tryAutoRemove(editingItem ?? it);
            setEditingId(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setEditingId(null);
          }}
        >
          <div className="space-y-2">
            <CardPicker
              value={effectiveCardId}
              cards={creditCards}
              ensureCard={ensureCreditCard}
              getCardColor={getCreditCardColor}
              onSelect={(id) => onChange(it.id, { cardId: id })}
            />

            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
              <Input
                ref={catRef}
                className="font-medium"
                value={it.category}
                onChange={(e) => onChange(it.id, { category: e.target.value })}
                placeholder="Descrição"
              />

              <MoneyInput
                ref={amountRef}
                className={cn("font-semibold caret-current", ui.value)}
                value={normalizeMoney(it.amount)}
                onChange={(e) =>
                  onChange(it.id, { amount: normalizeMoney(e.target.value) })
                }
                inputMode="decimal"
                placeholder="0,00"
              />

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="sm:ml-1"
                aria-label="Excluir gasto no cartão"
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
        </div>
      );
    }

    const title = (it.category ?? "").trim() || "Sem descrição";
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
          openEditor(it.id, clickedAmount ? "amount" : "cat");
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-sm font-medium">{title}</p>
          <p
            data-field="amount"
            className={cn("shrink-0 text-sm font-semibold", ui.value)}
          >
            {value}
          </p>
        </div>
      </button>
    );
  };

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
              <CreditCard className={cn("size-5", ui.iconText)} />
            </span>
            <CardTitle className="text-base">Cartão de crédito</CardTitle>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            onClick={addNew}
            disabled={!canAdd}
            aria-label="Adicionar gasto no cartão"
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

      <CardContent className="relative space-y-3 pb-4">
        {groups.map((g) => {
          const count = g.count;

          const forceExpanded = editingGroupKey === g.cardId;
          const expanded = forceExpanded || expandedByCard[g.cardId] === true;

          const colorId =
            g.cardId === UNASSIGNED
              ? DEFAULT_CARD_COLOR
              : getCreditCardColor(g.cardId);

          const preset = CARD_COLOR_BY_ID[colorId];

          const header = (
            <div
              role="button"
              tabIndex={0}
              className={cn(
                "w-full rounded-xl border p-3 text-left transition",
                "bg-muted/10 hover:bg-muted/20",
                "shadow-none",
              )}
              onClick={() => {
                if (forceExpanded) return;
                toggleGroup(g.cardId);
              }}
              onKeyDown={(e) => {
                if (forceExpanded) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleGroup(g.cardId);
                }
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "h-8 w-0.5 shrink-0 rounded-full",
                      preset.bar,
                    )}
                  />

                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-lg ring-1 ring-border",
                      "bg-background/60",
                      preset.soft,
                    )}
                  >
                    <CreditCard className={cn("size-4", preset.icon)} />
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold leading-tight">
                      {g.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {count} lançamento{count === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 whitespace-nowrap",
                      "bg-background/60 px-3 py-1.5",
                      "font-semibold tabular-nums tracking-tight",
                      ui.value,
                    )}
                  >
                    {formatBRL(g.total)}
                  </Badge>

                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-sm"
                    aria-label="Adicionar gasto neste cartão"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      if (g.cardId === UNASSIGNED) addNew();
                      else addForCard(g.cardId);
                    }}
                    disabled={!canAdd}
                  >
                    <Plus />
                  </Button>
                </div>
              </div>
            </div>
          );

          if (!expanded) return <div key={g.cardId}>{header}</div>;

          return (
            <div key={g.cardId} className="space-y-2">
              {header}
              <div className="space-y-2 pl-3">{g.items.map(renderRow)}</div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
