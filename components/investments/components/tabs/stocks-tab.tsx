"use client";

import { useEffect, useMemo } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { useInvestmentsStore } from "@/store/investments.store";

import { formatBRLFromCents } from "../utils/money";

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

  return (
    <div className="space-y-4">
      {/* Header do tab */}
      <div className="space-y-2">
        <p className="text-center text-muted-foreground">Ações</p>

        <p className="text-center text-2xl font-semibold">
          {formatBRLFromCents(totals.totalCurrentCents)}
        </p>

        <div className="flex justify-center gap-2">
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

      <div className="space-y-3">
        {stocks.map((it) => {
          const qty = parseQty(it.quantity);

          const costCents = Math.round((it.avgPriceCents || 0) * qty); // custo médio (calculado)
          const totalCents = Math.round((it.currentQuoteCents || 0) * qty); // valor total (calculado)

          const profitCents = totalCents - costCents;
          const meta = getProfitBadgeMeta(profitCents);
          const profitPercentLabel = getProfitPercentLabel(
            costCents,
            profitCents,
          );

          return (
            <Card key={it.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <Input
                  value={it.name}
                  onChange={(e) =>
                    updateStockItem(it.id, { name: e.target.value })
                  }
                  placeholder="Nome"
                  className="h-10 border-0 bg-transparent text-center text-lg font-semibold shadow-none focus-visible:ring-0"
                  disabled={!ready}
                />

                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive"
                  size="icon"
                  onClick={() => removeStockItem(it.id)}
                  aria-label="Remover"
                  title="Remover"
                  disabled={!ready}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Total do papel (abaixo do nome, à esquerda) */}
              <div className="mt-2">
                <p className="text-left text-base font-semibold">
                  {formatBRLFromCents(totalCents)}
                </p>

                {/* Badges do card (igual os outros) */}
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

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">Quantidade</p>

                  <div className="w-44 sm:w-56">
                    <Input
                      value={it.quantity}
                      onChange={(e) =>
                        updateStockItem(it.id, { quantity: e.target.value })
                      }
                      inputMode="decimal"
                      placeholder="0"
                      className="text-right"
                      disabled={!ready}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">Preço médio</p>

                  <div className="w-44 sm:w-56">
                    <MoneyInput
                      value={formatInputFromCents(it.avgPriceCents)}
                      onChange={(e) =>
                        updateStockItem(it.id, {
                          avgPriceCents: toCentsFromMasked(e.target.value),
                        })
                      }
                      inputMode="decimal"
                      disabled={!ready}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">Custo médio</p>

                  <div className="w-44 sm:w-56">
                    <MoneyInput
                      value={formatInputFromCents(costCents)}
                      inputMode="decimal"
                      disabled
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">Cotação atual</p>

                  <div className="w-44 sm:w-56">
                    <MoneyInput
                      value={formatInputFromCents(it.currentQuoteCents)}
                      onChange={(e) =>
                        updateStockItem(it.id, {
                          currentQuoteCents: toCentsFromMasked(e.target.value),
                        })
                      }
                      inputMode="decimal"
                      disabled={!ready}
                    />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        <div className="flex justify-end py-5">
          <Button
            type="button"
            onClick={addStockItem}
            disabled={!ready}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
}
