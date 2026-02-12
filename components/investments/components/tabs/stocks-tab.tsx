"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Separator } from "@/components/ui/separator";

import { cn } from "@/lib/utils";
import { useInvestmentsStore } from "@/store/investments.store";

import { formatBRLFromCents } from "../utils/money";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

function formatPercent(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function parseQty(raw: string) {
  const v = (raw ?? "").trim();
  if (!v) return 0;

  const hasComma = v.includes(",");
  const normalized = hasComma ? v.replace(/\./g, "").replace(",", ".") : v;
  const num = Number(normalized.replace(/[^\d.-]/g, ""));
  return Number.isFinite(num) ? num : 0;
}

function parseIntSafe(raw: string) {
  const v = (raw ?? "").trim();
  if (!v) return 0;
  const n = Number(v.replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function getProfitBadgeMeta(profitCents: number) {
  const isNegative = profitCents < 0;

  return {
    Icon: isNegative ? ArrowDown : ArrowUp,
    variant: (isNegative ? "destructive" : "default") as
      | "default"
      | "destructive",
  };
}

function getProfitPercentLabel(appliedCents: number, profitCents: number) {
  if (appliedCents <= 0) return "0,00%";

  const profitPercent = (profitCents / appliedCents) * 100;
  const sign = profitPercent > 0 ? "+" : "";
  return `${sign}${formatPercent(profitPercent)}%`;
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="w-44 sm:w-56">{children}</div>
    </div>
  );
}

export function StocksTab() {
  const {
    ready,
    stocks,
    ensureStocksSeeded,
    addStockItem,
    updateStockItem,
    removeStockItem,
  } = useInvestmentsStore();

  useEffect(() => {
    if (!ready) return;
    ensureStocksSeeded();
  }, [ready, ensureStocksSeeded]);

  const totals = useMemo(() => {
    const totalAppliedCents = stocks.reduce((acc, it) => {
      const qty = parseQty(it.quantity);
      const cost = Math.round((it.avgPriceCents || 0) * qty);
      return acc + cost;
    }, 0);

    const totalCurrentCents = stocks.reduce((acc, it) => {
      const qty = parseQty(it.quantity);
      const total = Math.round((it.currentQuoteCents || 0) * qty);
      return acc + total;
    }, 0);

    const totalProfitCents = totalCurrentCents - totalAppliedCents;

    return { totalAppliedCents, totalCurrentCents, totalProfitCents };
  }, [stocks]);

  const totalMeta = getProfitBadgeMeta(totals.totalProfitCents);
  const totalPercentLabel = getProfitPercentLabel(
    totals.totalAppliedCents,
    totals.totalProfitCents,
  );

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeIndexClamped = useMemo(() => {
    const max = Math.max(0, stocks.length - 1);
    return Math.min(activeIndex, max);
  }, [activeIndex, stocks.length]);

  const computeActiveIndex = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;

    const children = Array.from(el.children) as HTMLElement[];
    if (!children.length) return;

    const center = el.scrollLeft + el.clientWidth / 2;

    let bestIdx = 0;
    let bestDist = Number.POSITIVE_INFINITY;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const childCenter = child.offsetLeft + child.clientWidth / 2;
      const dist = Math.abs(childCenter - center);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    setActiveIndex(bestIdx);
  }, []);

  const onScroll = useCallback(() => {
    if (rafRef.current) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      computeActiveIndex();
    });
  }, [computeActiveIndex]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const scrollToIndex = useCallback((idx: number) => {
    const el = viewportRef.current;
    if (!el) return;

    const len = el.children.length;
    if (!len) return;

    const safeIdx = Math.max(0, Math.min(idx, len - 1));
    const target = el.children[safeIdx] as HTMLElement | undefined;

    target?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, []);

  const handleAdd = useCallback(() => {
    addStockItem();
    // garante que o DOM já renderizou o novo card antes do scroll
    requestAnimationFrame(() =>
      requestAnimationFrame(() => scrollToIndex(stocks.length)),
    );
  }, [addStockItem, scrollToIndex, stocks.length]);

  return (
    <div className="space-y-4">
      {/* Summary (mais “app”) */}
      {/* Summary (mobile-safe) */}
      <div className="rounded-2xl border bg-muted/20 p-4">
        <div className="space-y-2 text-center">
          <p className="text-sm text-muted-foreground">Ações</p>

          <p className="mx-auto max-w-full px-2 text-2xl font-semibold tracking-tight leading-tight break-words">
            {formatBRLFromCents(totals.totalCurrentCents)}
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant={totalMeta.variant} className="gap-1">
              <totalMeta.Icon className="h-4 w-4" />
              {formatBRLFromCents(totals.totalProfitCents)}
            </Badge>

            <Badge variant={totalMeta.variant} className="gap-1">
              <totalMeta.Icon className="h-4 w-4" />
              {totalPercentLabel}
            </Badge>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="space-y-3">
        {stocks.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum item adicionado ainda.
            </p>
            <div className="mt-4 flex justify-center">
              <Button
                type="button"
                onClick={handleAdd}
                disabled={!ready}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Carrossel full-bleed + sem scrollbar */}
            <div className="relative -mx-4 px-4 sm:-mx-6 sm:px-6">
              <div
                ref={viewportRef}
                onScroll={onScroll}
                className={cn(
                  "flex w-full gap-4 overflow-x-auto pb-3",
                  "snap-x snap-mandatory scroll-smooth",
                  "scroll-px-4 sm:scroll-px-6",
                  "[-webkit-overflow-scrolling:touch]",
                  // esconder scrollbar (cara de app)
                  "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
                )}
              >
                {stocks.map((it, idx) => {
                  const isActive = idx === activeIndexClamped;

                  const qty = parseQty(it.quantity);
                  const costCents = Math.round((it.avgPriceCents || 0) * qty);
                  const totalCents = Math.round(
                    (it.currentQuoteCents || 0) * qty,
                  );

                  const profitCents = totalCents - costCents;
                  const meta = getProfitBadgeMeta(profitCents);
                  const profitPercentLabel = getProfitPercentLabel(
                    costCents,
                    profitCents,
                  );

                  const months = parseIntSafe(it.dividendMonths ?? "");
                  const dividendTotalCents = (it.dividendCents || 0) * months;

                  const quoteCents = it.currentQuoteCents || 0;
                  const perShareCents = it.dividendPerShareCents || 0;

                  const yieldAm =
                    quoteCents > 0 ? (perShareCents / quoteCents) * 100 : 0;
                  const yieldAa = yieldAm * 12;

                  const stockName = (it.name ?? "").trim() || "Ação";

                  return (
                    <div
                      key={it.id}
                      className={cn(
                        "shrink-0 snap-center",
                        // largura consistente (fica bonito no carrossel)
                        "min-w-[88%] sm:min-w-[520px] md:min-w-[560px]",
                      )}
                    >
                      <Card
                        className={cn(
                          "rounded-2xl p-4 transition",
                          isActive
                            ? "shadow-md ring-1 ring-foreground/10"
                            : "shadow-sm",
                        )}
                      >
                        {/* Header do card */}
                        <div className="flex items-start justify-between gap-3">
                          <Input
                            value={it.name}
                            onChange={(e) =>
                              updateStockItem(it.id, { name: e.target.value })
                            }
                            placeholder="Nome"
                            className="h-10 border-0 bg-transparent px-0 text-center text-lg font-semibold shadow-none focus-visible:ring-0"
                            disabled={!ready}
                          />

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                className="text-destructive"
                                size="icon"
                                aria-label="Remover"
                                title="Remover"
                                disabled={!ready}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Excluir {stockName}?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Essa ação não pode ser desfeita. O item será
                                  removido do seu controle de investimentos.
                                </AlertDialogDescription>
                              </AlertDialogHeader>

                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>

                                <AlertDialogAction asChild>
                                  <Button
                                    variant="destructive"
                                    onClick={() => removeStockItem(it.id)}
                                  >
                                    Excluir
                                  </Button>
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>

                        {/* Totais do item */}
                        <div className="mt-2">
                          <p className="text-left text-base font-semibold">
                            {formatBRLFromCents(totalCents)}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge variant={meta.variant} className="gap-1">
                              <meta.Icon className="h-4 w-4" />
                              {formatBRLFromCents(profitCents)}
                            </Badge>

                            <Badge variant={meta.variant} className="gap-1">
                              <meta.Icon className="h-4 w-4" />
                              {profitPercentLabel}
                            </Badge>
                          </div>
                        </div>

                        <Separator className="my-4" />

                        {/* Posição */}
                        <div className="space-y-3">
                          <FieldRow label="Quantidade">
                            <Input
                              value={it.quantity}
                              onChange={(e) =>
                                updateStockItem(it.id, {
                                  quantity: e.target.value,
                                })
                              }
                              inputMode="decimal"
                              placeholder="0"
                              className="text-right"
                              disabled={!ready}
                            />
                          </FieldRow>

                          <FieldRow label="Preço médio">
                            <MoneyInput
                              value={formatInputFromCents(it.avgPriceCents)}
                              onChange={(e) =>
                                updateStockItem(it.id, {
                                  avgPriceCents: toCentsFromMasked(
                                    e.target.value,
                                  ),
                                })
                              }
                              inputMode="decimal"
                              disabled={!ready}
                            />
                          </FieldRow>

                          <FieldRow label="Custo médio">
                            <MoneyInput
                              value={formatInputFromCents(costCents)}
                              inputMode="decimal"
                              disabled
                            />
                          </FieldRow>

                          <FieldRow label="Cotação atual">
                            <MoneyInput
                              value={formatInputFromCents(it.currentQuoteCents)}
                              onChange={(e) =>
                                updateStockItem(it.id, {
                                  currentQuoteCents: toCentsFromMasked(
                                    e.target.value,
                                  ),
                                })
                              }
                              inputMode="decimal"
                              disabled={!ready}
                            />
                          </FieldRow>
                        </div>

                        <Separator className="my-4" />

                        {/* Dividendos */}
                        <div className="space-y-3">
                          <FieldRow label="Dividendos">
                            <MoneyInput
                              value={formatInputFromCents(
                                it.dividendCents || 0,
                              )}
                              onChange={(e) =>
                                updateStockItem(it.id, {
                                  dividendCents: toCentsFromMasked(
                                    e.target.value,
                                  ),
                                })
                              }
                              inputMode="decimal"
                              disabled={!ready}
                            />
                          </FieldRow>

                          <FieldRow label="Meses pagos">
                            <Input
                              value={it.dividendMonths ?? ""}
                              onChange={(e) =>
                                updateStockItem(it.id, {
                                  dividendMonths: e.target.value,
                                })
                              }
                              inputMode="numeric"
                              placeholder="0"
                              className="text-right"
                              disabled={!ready}
                            />
                          </FieldRow>

                          <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/30 px-3 py-2">
                            <p className="text-sm font-medium text-muted-foreground">
                              Total dividendos
                            </p>
                            <p className="text-sm font-semibold text-primary">
                              {formatBRLFromCents(dividendTotalCents)}
                            </p>
                          </div>

                          <Separator className="my-1" />

                          <FieldRow label="Dividendo por cota">
                            <MoneyInput
                              value={formatInputFromCents(perShareCents)}
                              onChange={(e) =>
                                updateStockItem(it.id, {
                                  dividendPerShareCents: toCentsFromMasked(
                                    e.target.value,
                                  ),
                                })
                              }
                              inputMode="decimal"
                              disabled={!ready}
                            />
                          </FieldRow>

                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="flex flex-col gap-1">
                              <p className="text-xs text-muted-foreground">
                                % a.m
                              </p>
                              <Badge variant="secondary" className="w-fit">
                                {formatPercent(yieldAm)}%
                              </Badge>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              <p className="text-xs text-muted-foreground">
                                % a.a
                              </p>
                              <Badge variant="secondary" className="w-fit">
                                {formatPercent(yieldAa)}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dots */}
            {stocks.length > 1 ? (
              <div className="flex justify-center gap-2 pt-1">
                {stocks.map((_, idx) => (
                  <button
                    key={`dot-${idx}`}
                    type="button"
                    aria-label={`Ir para ${idx + 1}`}
                    onClick={() => scrollToIndex(idx)}
                    className={cn(
                      "h-2 w-2 rounded-full transition",
                      idx === activeIndexClamped
                        ? "bg-foreground"
                        : "bg-muted-foreground/30",
                    )}
                  />
                ))}
              </div>
            ) : null}

            {/* CTA */}
            <div className="flex justify-end pt-3">
              <Button
                type="button"
                onClick={handleAdd}
                disabled={!ready}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
