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
    miscExpenses: base.miscExpenses ?? [],
    invested: base.invested ?? { amount: "" },
  };
}

function newId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

const pad2 = (n: number) => String(n).padStart(2, "0");

function prevMonthKey(monthKey: string) {
  const [yStr, mStr] = monthKey.split("-");
  const y = Number(yStr);
  const m = Number(mStr);

  if (!Number.isFinite(y) || !Number.isFinite(m)) return monthKey;

  const d = new Date(y, m - 1, 1);
  d.setMonth(d.getMonth() - 1);

  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
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

  // ✅ novo
  const getPreviousMonthKey = (monthKey: string) => prevMonthKey(monthKey);

  // ✅ novo: copia contas fixas do mês anterior (somente se o mês atual estiver vazio)
  const copyFixedBillsFromPrevious = (monthKey: string) => {
    const prevKey = prevMonthKey(monthKey);
    const prevBills = getMonth(prevKey).fixedBills;

    if (!prevBills.length) return;

    updateMonth(monthKey, (m) => {
      if (m.fixedBills.length) return m;

      return {
        ...m,
        fixedBills: prevBills.map((b) => ({
          id: newId(),
          description: b.description,
          amount: b.amount,
        })),
      };
    });
  };

  return {
    selectedMonthKey,
    setSelectedMonthKey,
    getMonth,
    updateMonth, 
    getPreviousMonthKey,
    copyFixedBillsFromPrevious,
  };
}
