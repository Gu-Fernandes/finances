"use client";

import { DeltaPill } from "./ui";

type Props = {
  incomeTotal: number;
  expenseTotal: number;
  investedTotal: number;
  netTotal: number;

  prevIncome: number;
  prevExpense: number;
  prevInvested: number;
  prevNet: number;
};

export function OverviewComparisonGrid({
  incomeTotal,
  expenseTotal,
  investedTotal,
  netTotal,
  prevIncome,
  prevExpense,
  prevInvested,
  prevNet,
}: Props) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      <DeltaPill
        label="Receitas"
        current={incomeTotal}
        prev={prevIncome}
        goodWhenUp
      />
      <DeltaPill
        label="Despesas"
        current={expenseTotal}
        prev={prevExpense}
        goodWhenUp={false}
      />
      <DeltaPill
        label="Investido"
        current={investedTotal}
        prev={prevInvested}
        goodWhenUp
      />
      <DeltaPill label="Líquido" current={netTotal} prev={prevNet} goodWhenUp />
    </div>
  );
}
