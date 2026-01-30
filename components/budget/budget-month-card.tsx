"use client";

import type { BudgetMonthData } from "@/store/app-store";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { IncomeCard } from "./sections/income-card";
import { FixedBillsCard } from "./sections/fixed-bills-card";
import { CardExpensesCard } from "./sections/card-expenses-card";
import { InvestedCard } from "./sections/invested-card";
import { BudgetSummaryCard } from "./sections/budget-summary-card";
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
    patch: Partial<{
      id: string;
      category: string; // ✅ agora é string
      amount: string;
    }>,
  ) => void;
  onRemoveCard: (id: string) => void;

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
  onChangeInvestedAmount,
}: Props) {
  const incomeTotal = (data.incomes ?? []).reduce(
    (sum, it) => sum + parseMoneyBR(it.amount),
    0,
  );

  const fixedTotal = (data.fixedBills ?? []).reduce(
    (sum, it) => sum + parseMoneyBR(it.amount),
    0,
  );

  const cardTotal = (data.cardExpenses ?? []).reduce(
    (sum, it) => sum + parseMoneyBR(it.amount),
    0,
  );

  const investedTotal = parseMoneyBR(data.invested?.amount ?? "");

  const expenseTotal = fixedTotal + cardTotal + investedTotal;
  const netTotal = incomeTotal - expenseTotal;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{monthLabel}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <BudgetSummaryCard
          incomeTotal={incomeTotal}
          expenseTotal={expenseTotal}
          netTotal={netTotal}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <IncomeCard
            items={data.incomes}
            onAdd={onAddIncome}
            onChange={onChangeIncome}
            onRemove={onRemoveIncome}
          />

          <FixedBillsCard
            items={data.fixedBills}
            onAdd={onAddFixed}
            onChange={onChangeFixed}
            onRemove={onRemoveFixed}
          />

          <div className="space-y-4">
            <CardExpensesCard
              items={data.cardExpenses}
              onAdd={onAddCard}
              onChange={onChangeCard}
              onRemove={onRemoveCard}
            />

            <InvestedCard
              amount={data.invested?.amount ?? ""}
              onChangeAmount={onChangeInvestedAmount}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
