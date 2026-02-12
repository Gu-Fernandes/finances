"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loading } from "@/components/ui/loading";
import { cn } from "@/lib/utils";

import { useAppStore } from "@/store/app-store";
import { useBudgetStore } from "@/store/budget.store";

import {
  MONTHS,
  formatBRL,
  parseMoneyBR,
} from "@/components/budget/budget.constants";
import { PiggyBankSummary } from "./piggy-bank-summary";

type Row = {
  index: number;
  label: string;
  monthKey: string; // YYYY-MM
  amount: string; // invested.amount (string formatada)
  saved: number;
  total: number;
};

function keepFocusInside(e: React.FocusEvent) {
  const next = e.relatedTarget as Node | null;
  return Boolean(next && e.currentTarget.contains(next));
}

function useAutoFocus(
  enabled: boolean,
  ref: React.RefObject<HTMLInputElement | null>,
) {
  useEffect(() => {
    if (!enabled) return;
    const t = window.setTimeout(() => ref.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [enabled, ref]);
}

function DesktopTable({
  rows,
  currentKey,
  onChange,
}: {
  rows: Row[];
  currentKey: string;
  onChange: (monthKey: string, value: string) => void;
}) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useAutoFocus(Boolean(editingKey), inputRef);

  return (
    <div className="hidden md:block">
      <ScrollArea className="w-full rounded-2xl border">
        <div className="min-w-[760px]">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/50 backdrop-blur">
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Mês</TableHead>
                <TableHead className="text-right">Guardado</TableHead>
                <TableHead className="text-right">Montante</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((r) => {
                const isCurrent = r.monthKey === currentKey;
                const isEditing = editingKey === r.monthKey;
                const inputId = `piggy-${r.monthKey}`;

                return (
                  <TableRow
                    key={r.monthKey}
                    className={cn(
                      "transition-colors hover:bg-muted/20 even:bg-muted/5",
                      isCurrent && "bg-muted/30",
                    )}
                  >
                    <TableCell className="text-muted-foreground tabular-nums">
                      {r.index}º
                    </TableCell>

                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {r.label}
                        {isCurrent ? (
                          <Badge
                            variant="secondary"
                            className="h-5 px-2 text-[11px]"
                          >
                            Atual
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div
                        className="flex justify-end"
                        onBlurCapture={(e) => {
                          if (!isEditing) return;
                          if (keepFocusInside(e)) return;
                          setEditingKey(null);
                        }}
                        onKeyDown={(e) => {
                          if (!isEditing) return;
                          if (e.key === "Enter" || e.key === "Escape") {
                            setEditingKey(null);
                          }
                        }}
                      >
                        <Label htmlFor={inputId} className="sr-only">
                          Guardado em {r.label}
                        </Label>

                        {isEditing ? (
                          <MoneyInput
                            ref={inputRef}
                            id={inputId}
                            currencyLabel="R$"
                            value={r.amount}
                            onValueChange={(formatted) =>
                              onChange(r.monthKey, formatted)
                            }
                            placeholder="0,00"
                            className="max-w-[170px] tabular-nums"
                          />
                        ) : (
                          <button
                            type="button"
                            className="rounded-lg px-2 py-1 tabular-nums transition hover:bg-muted/30 hover:underline"
                            onClick={() => setEditingKey(r.monthKey)}
                            aria-label={`Editar guardado de ${r.label}`}
                          >
                            {formatBRL(r.saved)}
                          </button>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatBRL(r.total)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

function MobileList({
  rows,
  currentKey,
  onChange,
}: {
  rows: Row[];
  currentKey: string;
  onChange: (monthKey: string, value: string) => void;
}) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useAutoFocus(Boolean(editingKey), inputRef);

  return (
    <div className="space-y-4 md:hidden">
      {rows.map((r) => {
        const isCurrent = r.monthKey === currentKey;
        const isEditing = editingKey === r.monthKey;

        const inputId = `piggy-mobile-${r.monthKey}`;
        const savedLabel = formatBRL(r.saved);
        const totalLabel = formatBRL(r.total);

        return (
          <div
            key={r.monthKey}
            className={cn(
              "rounded-2xl border bg-background/50 p-4 shadow-sm",
              isCurrent && "bg-muted/20 ring-1 ring-foreground/10",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="h-6 px-2">
                  {r.index}º
                </Badge>
                <p className="font-medium">{r.label}</p>
              </div>

              {isCurrent ? (
                <Badge variant="secondary" className="h-6 px-2">
                  Atual
                </Badge>
              ) : null}
            </div>

            <div className="mt-3">
              {isEditing ? (
                <div
                  className="rounded-xl border bg-background/60 p-3 shadow-sm"
                  onBlurCapture={(e) => {
                    if (keepFocusInside(e)) return;
                    setEditingKey(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "Escape") {
                      setEditingKey(null);
                    }
                  }}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <Label
                        htmlFor={inputId}
                        className="text-sm text-muted-foreground"
                      >
                        Guardado
                      </Label>

                      <MoneyInput
                        ref={inputRef}
                        id={inputId}
                        currencyLabel="R$"
                        value={r.amount}
                        onValueChange={(formatted) =>
                          onChange(r.monthKey, formatted)
                        }
                        placeholder="0,00"
                        className="max-w-[180px] tabular-nums"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">Montante</p>
                      <p className="text-sm font-semibold text-primary tabular-nums">
                        {totalLabel}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="w-full rounded-xl border bg-background/60 p-3 text-left shadow-sm transition hover:bg-muted/30"
                  onClick={() => setEditingKey(r.monthKey)}
                  aria-label={`Editar guardado de ${r.label}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">Guardado</p>
                      <p className="text-sm font-semibold tabular-nums underline-offset-4 group-hover:underline">
                        {savedLabel}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">Montante</p>
                      <p className="text-sm font-semibold text-primary tabular-nums">
                        {totalLabel}
                      </p>
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PiggyBankTable() {
  const { ready, currentMonthKey } = useAppStore();
  const { selectedMonthKey, getMonth, updateMonth } = useBudgetStore();

  const baseKey = selectedMonthKey || currentMonthKey;
  const year = baseKey.slice(0, 4);

  const { rows, total, filledMonths } = useMemo(() => {
    return MONTHS.reduce(
      (acc, m, idx) => {
        const monthKey = `${year}-${m.value}`;
        const amount = getMonth(monthKey).invested.amount ?? "";

        const saved = parseMoneyBR(amount);
        const nextTotal = acc.total + saved;

        const row: Row = {
          index: idx + 1,
          label: m.label,
          monthKey,
          amount,
          saved,
          total: nextTotal,
        };

        return {
          total: nextTotal,
          filledMonths: acc.filledMonths + (saved > 0 ? 1 : 0),
          rows: [...acc.rows, row],
        };
      },
      { total: 0, filledMonths: 0, rows: [] as Row[] },
    );
  }, [getMonth, year]);

  const handleChange = useCallback(
    (monthKey: string, value: string) => {
      updateMonth(monthKey, (prev) => ({
        ...prev,
        invested: { ...prev.invested, amount: value },
      }));
    },
    [updateMonth],
  );

  if (!ready) return <Loading />;

  return (
    <div className="space-y-4">
      <PiggyBankSummary total={total} filledMonths={filledMonths} />

      <Card className="overflow-hidden rounded-2xl">
        <CardHeader className="pb-3 pt-4">
          <CardTitle className="text-base">Controle mensal</CardTitle>
          <p className="text-sm text-muted-foreground">
            Toque no valor de <span className="font-medium">Guardado</span> para
            editar. O montante é calculado automaticamente.
          </p>
        </CardHeader>

        <CardContent className="space-y-4 pb-4">
          <MobileList
            rows={rows}
            currentKey={currentMonthKey}
            onChange={handleChange}
          />

          <DesktopTable
            rows={rows}
            currentKey={currentMonthKey}
            onChange={handleChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
