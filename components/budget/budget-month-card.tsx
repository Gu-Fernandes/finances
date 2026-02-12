"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BudgetMonthData } from "@/store/app-store";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { IncomeCard } from "./sections/income-card";
import { FixedBillsCard } from "./sections/fixed-bills-card";
import { CardExpensesCard } from "./sections/card-expenses-card";
import { InvestedCard } from "./sections/invested-card";
import { BudgetSummaryCard } from "./sections/budget-summary-card";
import { MiscExpensesCard } from "./sections/misc-expenses-card";
import { parseMoneyBR } from "./budget.constants";

type Props = {
  monthLabel: string;
  data: BudgetMonthData;

  onAddIncome: () => void;
  onChangeIncome: (
    id: string,
    patch: Partial<{ id: string; label: string; amount: string }>,
  ) => void;
  onRemoveIncome: (id: string) => void;

  onAddFixed: () => void;
  onChangeFixed: (
    id: string,
    patch: Partial<{ id: string; description: string; amount: string }>,
  ) => void;
  onRemoveFixed: (id: string) => void;

  onAddCard: () => void;
  onChangeCard: (
    id: string,
    patch: Partial<{ id: string; category: string; amount: string }>,
  ) => void;
  onRemoveCard: (id: string) => void;

  onAddMisc: () => void;
  onChangeMisc: (
    id: string,
    patch: Partial<{ id: string; description: string; amount: string }>,
  ) => void;
  onRemoveMisc: (id: string) => void;

  onChangeInvestedAmount: (value: string) => void;
};

export function BudgetMonthCard({
  monthLabel,
  data,
  onAddIncome,
  onChangeIncome,
  onRemoveIncome,
  onAddFixed,
  onChangeFixed,
  onRemoveFixed,
  onAddCard,
  onChangeCard,
  onRemoveCard,
  onAddMisc,
  onChangeMisc,
  onRemoveMisc,
  onChangeInvestedAmount,
}: Props) {
  const incomeTotal = useMemo(
    () =>
      (data.incomes ?? []).reduce(
        (sum, it) => sum + parseMoneyBR(it.amount),
        0,
      ),
    [data.incomes],
  );

  const fixedTotal = useMemo(
    () =>
      (data.fixedBills ?? []).reduce(
        (sum, it) => sum + parseMoneyBR(it.amount),
        0,
      ),
    [data.fixedBills],
  );

  const cardTotal = useMemo(
    () =>
      (data.cardExpenses ?? []).reduce(
        (sum, it) => sum + parseMoneyBR(it.amount),
        0,
      ),
    [data.cardExpenses],
  );

  const miscTotal = useMemo(
    () =>
      (data.miscExpenses ?? []).reduce(
        (sum, it) => sum + parseMoneyBR(it.amount),
        0,
      ),
    [data.miscExpenses],
  );

  const investedTotal = useMemo(
    () => parseMoneyBR(data.invested?.amount ?? ""),
    [data.invested?.amount],
  );

  const expenseTotal = fixedTotal + cardTotal + miscTotal;
  const netTotal = incomeTotal - (expenseTotal + investedTotal);

  const sections = useMemo(
    () => [
      {
        key: "income",
        node: (
          <IncomeCard
            items={data.incomes}
            onAdd={onAddIncome}
            onChange={onChangeIncome}
            onRemove={onRemoveIncome}
          />
        ),
      },
      {
        key: "fixed",
        node: (
          <FixedBillsCard
            items={data.fixedBills}
            onAdd={onAddFixed}
            onChange={onChangeFixed}
            onRemove={onRemoveFixed}
          />
        ),
      },
      {
        key: "card",
        node: (
          <CardExpensesCard
            items={data.cardExpenses}
            onAdd={onAddCard}
            onChange={onChangeCard}
            onRemove={onRemoveCard}
          />
        ),
      },
      {
        key: "misc",
        node: (
          <MiscExpensesCard
            items={data.miscExpenses ?? []}
            onAdd={onAddMisc}
            onChange={onChangeMisc}
            onRemove={onRemoveMisc}
          />
        ),
      },
      {
        key: "invested",
        node: (
          <InvestedCard
            amount={data.invested?.amount ?? ""}
            onChangeAmount={onChangeInvestedAmount}
          />
        ),
      },
    ],
    [
      data.incomes,
      data.fixedBills,
      data.cardExpenses,
      data.miscExpenses,
      data.invested?.amount,
      onAddIncome,
      onChangeIncome,
      onRemoveIncome,
      onAddFixed,
      onChangeFixed,
      onRemoveFixed,
      onAddCard,
      onChangeCard,
      onRemoveCard,
      onAddMisc,
      onChangeMisc,
      onRemoveMisc,
      onChangeInvestedAmount,
    ],
  );

  // ✅ carrossel no desktop igual StocksTab
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeIndexClamped = useMemo(() => {
    const max = Math.max(0, sections.length - 1);
    return Math.min(activeIndex, max);
  }, [activeIndex, sections.length]);

  const computeActiveIndex = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;

    const children = Array.from(el.children) as HTMLElement[];
    if (!children.length) return;

    // como é 3 colunas, snap-start faz sentido:
    // usamos o scrollLeft (borda esquerda) para achar o card mais próximo do início
    const left = el.scrollLeft;

    let bestIdx = 0;
    let bestDist = Number.POSITIVE_INFINITY;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const dist = Math.abs(child.offsetLeft - left);
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
      inline: "start", // ✅ snap-start
      block: "nearest",
    });
  }, []);

  return (
    <Card className="overflow-hidden rounded-2xl">
      <CardHeader className="pb-3 pt-4">
        <CardTitle className="text-base sm:text-lg">{monthLabel}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 p-3 sm:p-6">
        <BudgetSummaryCard
          incomeTotal={incomeTotal}
          expenseTotal={expenseTotal}
          investedTotal={investedTotal}
          netTotal={netTotal}
        />

        {/* ✅ Mobile/Tablet: grid (fica limpo) */}
        <div className="grid gap-6 md:grid-cols-2 lg:hidden">
          {sections.map((s) => (
            <div key={s.key} className="h-full">
              {s.node}
            </div>
          ))}
        </div>

        {/* ✅ Desktop: carrossel 3 colunas (igual o padrão do StocksTab) */}
        <div className="hidden lg:block">
          <div
            ref={viewportRef}
            onScroll={onScroll}
            className={cn(
              "flex w-full gap-4 overflow-x-auto pb-2",
              "[-webkit-overflow-scrolling:touch] snap-x snap-mandatory scroll-smooth",
            )}
          >
            {sections.map((s) => (
              <div
                key={s.key}
                className={cn(
                  "shrink-0 snap-start",
                  // 3 cards visíveis no desktop
                  "w-[calc((100%-2rem)/3)]",
                )}
              >
                {s.node}
              </div>
            ))}
          </div>

          {sections.length > 1 ? (
            <div className="flex justify-center gap-2 pt-1">
              {sections.map((_, idx) => (
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
        </div>
      </CardContent>
    </Card>
  );
}
