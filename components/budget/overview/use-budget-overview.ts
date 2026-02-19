"use client";

import type { BudgetCategory, BudgetMonthData } from "@/store/app-store";
import { useBudgetStore } from "@/store/budget.store";
import { parseMoneyBR } from "../budget.constants";

function sumMoney(items: Array<{ amount: string }> | undefined) {
  return (items ?? []).reduce((sum, it) => sum + parseMoneyBR(it.amount), 0);
}

export function useBudgetOverview(monthKey: string, data: BudgetMonthData) {
  const { getMonth, getPreviousMonthKey, copyFixedBillsFromPrevious } =
    useBudgetStore();

  // atuais
  const incomeTotal = sumMoney(data.incomes);
  const fixedTotal = sumMoney(data.fixedBills);
  const cardTotal = sumMoney(data.cardExpenses);
  const miscTotal = sumMoney(data.miscExpenses);
  const expenseTotal = fixedTotal + cardTotal + miscTotal;
  const investedTotal = parseMoneyBR(data.invested?.amount ?? "");
  const netTotal = incomeTotal - expenseTotal - investedTotal;

  // anterior
  const prevKey = getPreviousMonthKey(monthKey);
  const prev = getMonth(prevKey);

  const prevIncome = sumMoney(prev.incomes);
  const prevExpense =
    sumMoney(prev.fixedBills) + sumMoney(prev.cardExpenses) + sumMoney(prev.miscExpenses);
  const prevInvested = parseMoneyBR(prev.invested?.amount ?? "");
  const prevNet = prevIncome - prevExpense - prevInvested;

  // top categorias do cartão
  const map = new Map<string, number>();
  for (const it of data.cardExpenses ?? []) {
    const key = (it.category as BudgetCategory | "") || "Sem categoria";
    map.set(key, (map.get(key) ?? 0) + parseMoneyBR(it.amount));
  }
  const topCardCats = Array.from(map.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  const canCopyFixedBills =
    (data.fixedBills ?? []).length === 0 && (prev.fixedBills ?? []).length > 0;

  const copyFixedBills = () => copyFixedBillsFromPrevious(monthKey);

  return {
    totals: {
      incomeTotal,
      fixedTotal,
      cardTotal,
      miscTotal,
      expenseTotal,
      investedTotal,
      netTotal,
    },
    prevTotals: {
      prevIncome,
      prevExpense,
      prevInvested,
      prevNet,
    },
    topCardCats,
    canCopyFixedBills,
    copyFixedBills,
  };
}
