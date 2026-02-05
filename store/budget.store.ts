"use client";

import {
  DEFAULT_BUDGET_MONTH,
  createBudgetMonth,
  type AppData,
  type BudgetMonthData,
  useAppStore,
} from "@/store/app-store";

function normalizeMonth(month?: BudgetMonthData): BudgetMonthData {
  const base = month ?? createBudgetMonth();

  return {
    ...base,
    incomes: base.incomes ?? [],
    fixedBills: base.fixedBills ?? [],
    cardExpenses: base.cardExpenses ?? [],
    miscExpenses: base.miscExpenses ?? [], // ✅ novo
    invested: base.invested ?? { amount: "" },
  };
}

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
    const raw = data.budget.months[monthKey] ?? DEFAULT_BUDGET_MONTH;
    return normalizeMonth(raw);
  };

  const updateMonth = (
    monthKey: string,
    updater: (prev: BudgetMonthData) => BudgetMonthData,
  ) => {
    update((prev: AppData) => {
      const currentRaw = prev.budget.months[monthKey] ?? createBudgetMonth();
      const current = normalizeMonth(currentRaw);

      const updated = updater(current);
      const nextMonth = normalizeMonth(updated);

      if (nextMonth === currentRaw) return prev; // no-op (bem raro)
      // melhor: comparar com current, já normalizado
      if (nextMonth === current) return prev;

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