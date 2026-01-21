"use client";

import {
  DEFAULT_BUDGET_MONTH,
  type AppData,
  type BudgetMonthData,
  useAppStore,
} from "@/store/app-store";

function createDefaultMonth(): BudgetMonthData {
  return {
    incomes: [],
    fixedBills: [],
    cardExpenses: [],
    invested: { amount: "" },
  };
}

export function useBudgetStore() {
  const { data, update } = useAppStore();

  const selectedMonthKey = data.budget.selectedMonthKey;

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
    return data.budget.months[monthKey] ?? DEFAULT_BUDGET_MONTH;
  };

  const updateMonth = (
    monthKey: string,
    updater: (prev: BudgetMonthData) => BudgetMonthData,
  ) => {
    update((prev: AppData) => {
      const current = prev.budget.months[monthKey] ?? createDefaultMonth();

      const nextMonth = updater(current);

      return {
        ...prev,
        budget: {
          ...prev.budget,
          months: {
            ...prev.budget.months,
            [monthKey]: nextMonth,
          },
        },
      };
    });
  };

  return {
    selectedMonthKey,
    setSelectedMonthKey,
    getMonth,
    updateMonth,
  };
}
