"use client";

import { BudgetSummaryCard } from "../sections/budget-summary-card";
import type { BudgetMonthData } from "@/store/app-store";
import { OverviewActions } from "./overview-actions";
import { OverviewProgressCard } from "./overview-progress-card";
import { OverviewTopCategories } from "./overview-top-categories";
import { OverviewComparisonGrid } from "./overview-comparison-grid";
import { OverviewInsights } from "./overview-insights";
import { useBudgetOverview } from "./use-budget-overview";

type Props = {
  monthKey: string;
  monthLabel: string;
  data: BudgetMonthData;

  onAddIncome: () => void;
  onAddFixed: () => void;
  onAddCard: () => void;
  onAddMisc: () => void;
};

export function BudgetOverviewPanel({
  monthKey,
  monthLabel,
  data,
  onAddIncome,
  onAddFixed,
  onAddCard,
  onAddMisc,
}: Props) {
  const ov = useBudgetOverview(monthKey, data);

  const { totals, prevTotals, topCardCats, canCopyFixedBills, copyFixedBills } =
    ov;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            Resumo do mês
          </h2>
          <p className="text-sm text-muted-foreground">{monthLabel}</p>
        </div>

        <OverviewActions
          canCopyFixedBills={canCopyFixedBills}
          onCopyFixedBills={copyFixedBills}
          onAddIncome={onAddIncome}
          onAddFixed={onAddFixed}
          onAddCard={onAddCard}
          onAddMisc={onAddMisc}
        />
      </div>

      <BudgetSummaryCard
        incomeTotal={totals.incomeTotal}
        expenseTotal={totals.expenseTotal}
        investedTotal={totals.investedTotal}
        netTotal={totals.netTotal}
      />

      <div className="grid gap-3 lg:grid-cols-3">
        <OverviewProgressCard
          incomeTotal={totals.incomeTotal}
          expenseTotal={totals.expenseTotal}
          investedTotal={totals.investedTotal}
        />

        <OverviewTopCategories
          expenseTotal={totals.expenseTotal}
          topCardCats={topCardCats}
          onAddCard={onAddCard}
        />
      </div>

      <OverviewComparisonGrid
        incomeTotal={totals.incomeTotal}
        expenseTotal={totals.expenseTotal}
        investedTotal={totals.investedTotal}
        netTotal={totals.netTotal}
        prevIncome={prevTotals.prevIncome}
        prevExpense={prevTotals.prevExpense}
        prevInvested={prevTotals.prevInvested}
        prevNet={prevTotals.prevNet}
      />

      <OverviewInsights
        incomeTotal={totals.incomeTotal}
        expenseTotal={totals.expenseTotal}
        netTotal={totals.netTotal}
        cardTotal={totals.cardTotal}
      />
    </section>
  );
}
