"use client";

import {
  DEFAULT_BUDGET_MONTH,
  createBudgetMonth,
  type AppData,
  type BudgetMonthData,
  useAppStore,
} from "@/store/app-store";

export function useBudgetStore() {
  const { data, update } = useAppStore();

  const selectedMonthKey = data.budget.selectedMonthKey;

  const setSelectedMonthKey = (monthKey: string) => {
    update((prev: AppData) => ({
      ...prev,
      budget: { ...prev.budget, selectedMonthKey: monthKey },
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
      const current = prev.budget.months[monthKey] ?? createBudgetMonth();
      const nextMonth = updater(current);

      if (nextMonth === current) return prev; // no-op

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

  return { selectedMonthKey, setSelectedMonthKey, getMonth, updateMonth };
}
