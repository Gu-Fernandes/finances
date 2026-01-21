"use client";

import { useAppStore } from "./app-store";
import type { AppData, BudgetMonthData } from "./app-store";
import { DEFAULT_BUDGET_MONTH } from "./app-store";

function ensureMonthShape(month?: BudgetMonthData | null): BudgetMonthData {
  const m = month && typeof month === "object" ? (month as any) : {};

  return {
    incomes: Array.isArray(m.incomes)
      ? m.incomes
      : DEFAULT_BUDGET_MONTH.incomes,
    fixedBills: Array.isArray(m.fixedBills) ? m.fixedBills : [],
    cardExpenses: Array.isArray(m.cardExpenses) ? m.cardExpenses : [],
    invested:
      m.invested && typeof m.invested === "object"
        ? {
            amount:
              typeof m.invested.amount === "string" ? m.invested.amount : "",
          }
        : { amount: "" },
  };
}

export function useBudgetStore() {
  const { data, update, currentMonthKey } = useAppStore();

  const selectedMonthKey = data.budget.selectedMonthKey ?? currentMonthKey;

  const setSelectedMonthKey = (monthKey: string) => {
    update((prev: AppData) => ({
      ...prev,
      budget: {
        ...prev.budget,
        selectedMonthKey: monthKey,
      },
    }));
  };

  const getMonth = (monthKey: string): BudgetMonthData => {
    return ensureMonthShape(data.budget.months[monthKey]);
  };

  const updateMonth = (
    monthKey: string,
    updater: (prev: BudgetMonthData) => BudgetMonthData,
  ) => {
    update((prev: AppData) => {
      const prevBudget = prev.budget;
      const prevMonth = ensureMonthShape(prevBudget.months[monthKey]);

      const nextMonth = ensureMonthShape(updater(prevMonth));

      return {
        ...prev,
        budget: {
          ...prevBudget,
          months: {
            ...prevBudget.months,
            [monthKey]: nextMonth,
          },
        },
      };
    });
  };

  return { selectedMonthKey, setSelectedMonthKey, getMonth, updateMonth };
}
