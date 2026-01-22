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

export function CryptoTab() {
  const {
    ready,
    crypto,
    ensureCryptoSeeded,
    addCryptoItem,
    updateCryptoItem,
    removeCryptoItem,
  } = useInvestmentsStore();

  useEffect(() => {
    if (!ready) return;
    ensureCryptoSeeded();
  }, [ready, ensureCryptoSeeded]);

  const totals = useMemo(() => {
    const totalAppliedCents = crypto.reduce(
      (acc, it) => acc + (it.appliedCents || 0),
      0,
    );

    const totalCurrentCents = crypto.reduce(
      (acc, it) => acc + (it.currentCents || 0),
      0,
    );

    const totalProfitCents = totalCurrentCents - totalAppliedCents;

    return { totalAppliedCents, totalCurrentCents, totalProfitCents };
  }, [crypto]);

  const totalMeta = getProfitBadgeMeta(totals.totalProfitCents);
  const totalPercentLabel = getProfitPercentLabel(
    totals.totalAppliedCents,
    totals.totalProfitCents,
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-center text-muted-foreground">Cripto</p>

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
        {crypto.map((it) => {
          const profitCents = (it.currentCents || 0) - (it.appliedCents || 0);
          const meta = getProfitBadgeMeta(profitCents);

          const profitPercentLabel = getProfitPercentLabel(
            it.appliedCents || 0,
            profitCents,
          );

          return (
            <Card key={it.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <Input
                  value={it.name}
                  onChange={(e) =>
                    updateCryptoItem(it.id, { name: e.target.value })
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
                  onClick={() => removeCryptoItem(it.id)}
                  aria-label="Remover"
                  title="Remover"
                  disabled={!ready}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Valor aplicado
                  </p>

                  <div className="w-44 sm:w-56">
                    <MoneyInput
                      value={formatInputFromCents(it.appliedCents)}
                      onChange={(e) =>
                        updateCryptoItem(it.id, {
                          appliedCents: toCentsFromMasked(e.target.value),
                        })
                      }
                      inputMode="decimal"
                      disabled={!ready}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">Valor atual</p>

                  <div className="w-44 sm:w-56">
                    <MoneyInput
                      value={formatInputFromCents(it.currentCents)}
                      onChange={(e) =>
                        updateCryptoItem(it.id, {
                          currentCents: toCentsFromMasked(e.target.value),
                        })
                      }
                      inputMode="decimal"
                      disabled={!ready}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
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
            </Card>
          );
        })}

        <div className="flex justify-end py-5">
          <Button
            type="button"
            onClick={addCryptoItem}
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
