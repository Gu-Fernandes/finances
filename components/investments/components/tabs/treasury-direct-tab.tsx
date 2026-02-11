"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
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

export function TreasuryDirectTab() {
  const {
    ready,
    treasuryDirect,
    addTreasuryDirectItem,
    updateTreasuryDirectItem,
    removeTreasuryDirectItem,
    ensureTreasuryDirectSeeded,
  } = useInvestmentsStore();

  useEffect(() => {
    if (!ready) return;
    ensureTreasuryDirectSeeded();
  }, [ready, ensureTreasuryDirectSeeded]);

  const totals = useMemo(() => {
    const totalAppliedCents = treasuryDirect.reduce(
      (acc, it) => acc + (it.appliedCents || 0),
      0,
    );

    const totalCurrentCents = treasuryDirect.reduce(
      (acc, it) => acc + (it.currentCents || 0),
      0,
    );

    const totalProfitCents = totalCurrentCents - totalAppliedCents;

    return { totalAppliedCents, totalCurrentCents, totalProfitCents };
  }, [treasuryDirect]);

  const totalMeta = getProfitBadgeMeta(totals.totalProfitCents);
  const totalPercentLabel = getProfitPercentLabel(
    totals.totalAppliedCents,
    totals.totalProfitCents,
  );

  // ---- read-only -> edit (igual orçamento/renda fixa) ----
  const [editingId, setEditingId] = useState<string | null>(null);
  const [focusField, setFocusField] = useState<"applied" | "current">(
    "applied",
  );

  const appliedRef = useRef<HTMLInputElement | null>(null);
  const currentRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editingId) return;

    const t = window.setTimeout(() => {
      if (focusField === "current") currentRef.current?.focus();
      else appliedRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(t);
  }, [editingId, focusField]);
  // --------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Summary (mobile-safe + padrão do app) */}
      <div className="rounded-2xl border bg-muted/20 p-4">
        <div className="space-y-2 text-center">
          <p className="text-sm text-muted-foreground">Tesouro direto</p>

          <p className="mx-auto max-w-full px-2 text-2xl font-semibold tracking-tight leading-tight break-words tabular-nums">
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
      <div className="space-y-5 pb-10 sm:pb-0">
        {treasuryDirect.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum título adicionado ainda.
            </p>

            <div className="mt-4 flex justify-center">
              <Button
                type="button"
                onClick={addTreasuryDirectItem}
                disabled={!ready}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </div>
        ) : null}

        {treasuryDirect.length > 0 ? (
          <div className="space-y-5">
            {treasuryDirect.map((it) => {
              const profitCents =
                (it.currentCents || 0) - (it.appliedCents || 0);
              const meta = getProfitBadgeMeta(profitCents);

              const profitPercentLabel = getProfitPercentLabel(
                it.appliedCents || 0,
                profitCents,
              );

              const itemName = (it.name ?? "").trim() || "Tesouro direto";
              const isEditing = editingId === it.id;

              const appliedLabel = formatBRLFromCents(it.appliedCents || 0);
              const currentLabel = formatBRLFromCents(it.currentCents || 0);

              return (
                <Card key={it.id} className="rounded-2xl p-4 shadow-sm">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <Input
                      value={it.name}
                      onChange={(e) =>
                        updateTreasuryDirectItem(it.id, {
                          name: e.target.value,
                        })
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
                            Excluir {itemName}?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Essa ação não pode ser desfeita. O item será
                            removido da sua lista de Tesouro Direto.
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>

                          <AlertDialogAction asChild>
                            <Button
                              variant="destructive"
                              onClick={() => removeTreasuryDirectItem(it.id)}
                            >
                              Excluir
                            </Button>
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {/* Applied/Current (read-only -> edit) */}
                  <div className="mt-4 space-y-3">
                    {isEditing ? (
                      <div
                        className="rounded-xl border bg-background/50 p-3 shadow-sm"
                        onBlurCapture={(e) => {
                          const next = e.relatedTarget as Node | null;
                          if (next && e.currentTarget.contains(next)) return;
                          setEditingId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      >
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              Valor aplicado
                            </p>
                            <MoneyInput
                              ref={appliedRef}
                              value={formatInputFromCents(it.appliedCents || 0)}
                              onChange={(e) =>
                                updateTreasuryDirectItem(it.id, {
                                  appliedCents: toCentsFromMasked(
                                    e.target.value,
                                  ),
                                })
                              }
                              inputMode="decimal"
                              disabled={!ready}
                            />
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              Valor atual
                            </p>
                            <MoneyInput
                              ref={currentRef}
                              value={formatInputFromCents(it.currentCents || 0)}
                              onChange={(e) =>
                                updateTreasuryDirectItem(it.id, {
                                  currentCents: toCentsFromMasked(
                                    e.target.value,
                                  ),
                                })
                              }
                              inputMode="decimal"
                              disabled={!ready}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="w-full rounded-xl border bg-background/50 p-3 text-left shadow-sm transition hover:bg-muted/30"
                        onClick={(e) => {
                          const clickedCurrent = Boolean(
                            (e.target as HTMLElement).closest(
                              '[data-field="current"]',
                            ),
                          );

                          setEditingId(it.id);
                          setFocusField(clickedCurrent ? "current" : "applied");
                        }}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm text-muted-foreground">
                              Valor aplicado
                            </p>
                            <p
                              data-field="applied"
                              className="text-sm font-semibold tabular-nums break-words"
                            >
                              {appliedLabel}
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm text-muted-foreground">
                              Valor atual
                            </p>
                            <p
                              data-field="current"
                              className="text-sm font-semibold tabular-nums break-words"
                            >
                              {currentLabel}
                            </p>
                          </div>
                        </div>
                      </button>
                    )}

                    {/* Badges */}
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
          </div>
        ) : null}

        {/* CTA sticky (só quando já tem itens) */}
        {treasuryDirect.length > 0 ? (
          <div className="sticky bottom-0 -mx-4 border-t bg-background/80 px-4 pb-4 pt-3 backdrop-blur sm:static sm:-mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0">
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={addTreasuryDirectItem}
                disabled={!ready}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
