"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { BudgetMonthData } from "@/store/app-store";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { IncomeCard } from "./sections/income-card";
import { FixedBillsCard } from "./sections/fixed-bills-card";
import { CardExpensesCard } from "./sections/card-expenses-card";
import { InvestedCard } from "./sections/invested-card";
import { BudgetSummaryCard } from "./sections/budget-summary-card";
import { MiscExpensesCard } from "./sections/misc-expenses-card";
import { parseMoneyBR } from "./budget.constants";

export type BudgetSectionKey =
  | "income"
  | "fixed"
  | "card"
  | "misc"
  | "invested";

export type BudgetMonthCardRef = {
  scrollToSection: (key: BudgetSectionKey) => void;
};

type Props = {
  monthLabel: string;
  data: BudgetMonthData;

  showSummary?: boolean; // ✅ pra evitar duplicar no tab de Detalhes

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

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const m = window.matchMedia(query);
    const onChange = () => setMatches(m.matches);

    onChange();
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

export const BudgetMonthCard = forwardRef<BudgetMonthCardRef, Props>(
  function BudgetMonthCard(
    {
      monthLabel,
      data,
      showSummary = true,
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
    }: Props,
    ref,
  ) {
    // ✅ Totais
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
      () =>
        [
          {
            key: "income" as const,
            label: "Receitas",
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
            key: "fixed" as const,
            label: "Fixas",
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
            key: "card" as const,
            label: "Cartão",
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
            key: "misc" as const,
            label: "Extras",
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
            key: "invested" as const,
            label: "Investido",
            node: (
              <InvestedCard
                amount={data.invested?.amount ?? ""}
                onChangeAmount={onChangeInvestedAmount}
              />
            ),
          },
        ] as const,
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

    // ✅ Renderizar só um layout por vez (evita refs duplicadas)
    const isDesktop = useMediaQuery("(min-width: 1024px)");

    // ✅ Carrossel desktop
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    // ✅ refs por seção (pra Overview conseguir “pular” pra seção certa)
    const sectionRefs = useRef<Record<BudgetSectionKey, HTMLElement | null>>({
      income: null,
      fixed: null,
      card: null,
      misc: null,
      invested: null,
    });

    const setSectionRef = useCallback(
      (key: BudgetSectionKey) => (el: HTMLElement | null) => {
        sectionRefs.current[key] = el;
      },
      [],
    );

    const scrollToSection = useCallback(
      (key: BudgetSectionKey) => {
        const el = sectionRefs.current[key];
        if (!el) return;

        el.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "start",
        });

        const idx = sections.findIndex((s) => s.key === key);
        if (idx >= 0) setActiveIndex(idx);
      },
      [sections],
    );

    useImperativeHandle(ref, () => ({ scrollToSection }), [scrollToSection]);

    const computeActiveIndex = useCallback(() => {
      const el = viewportRef.current;
      if (!el) return;

      const children = Array.from(el.children) as HTMLElement[];
      if (!children.length) return;

      const left = el.scrollLeft;

      let bestIdx = 0;
      let bestDist = Number.POSITIVE_INFINITY;

      for (let i = 0; i < children.length; i++) {
        const dist = Math.abs(children[i]!.offsetLeft - left);
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
        inline: "start",
        block: "nearest",
      });

      setActiveIndex(safeIdx);
    }, []);

    return (
      <Card className="overflow-hidden rounded-2xl">
        <CardHeader className="pb-3 pt-4">
          <CardTitle className="text-base sm:text-lg">{monthLabel}</CardTitle>

          {/* ✅ Navegação rápida entre seções */}
          <div className="mt-3 flex flex-wrap gap-2">
            {sections.map((s, idx) => (
              <Button
                key={s.key}
                type="button"
                size="sm"
                variant={idx === activeIndex ? "secondary" : "ghost"}
                onClick={() =>
                  isDesktop ? scrollToIndex(idx) : scrollToSection(s.key)
                }
              >
                {s.label}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-3 sm:p-6">
          {showSummary ? (
            <BudgetSummaryCard
              incomeTotal={incomeTotal}
              expenseTotal={expenseTotal}
              investedTotal={investedTotal}
              netTotal={netTotal}
            />
          ) : null}

          {/* ✅ Mobile/Tablet */}
          {!isDesktop ? (
            <div className="grid gap-6 md:grid-cols-2">
              {sections.map((s) => (
                <div
                  key={s.key}
                  ref={setSectionRef(s.key)}
                  className="h-full scroll-mt-24"
                >
                  {s.node}
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* ✅ Desktop: carrossel 3 colunas */}
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
                    ref={setSectionRef(s.key)}
                    className={cn(
                      "shrink-0 snap-start",
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
                        idx === activeIndex
                          ? "bg-foreground"
                          : "bg-muted-foreground/30",
                      )}
                    />
                  ))}
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    );
  },
);
