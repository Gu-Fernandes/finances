"use client";
import type { CardColorId } from "@/components/budget/budget.card-colors";
import { DEFAULT_CARD_COLOR } from "@/components/budget/budget.card-colors";
import {
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
  try {
    return globalThis.crypto?.randomUUID?.() ?? fallbackId();
  } catch {
    return fallbackId();
  }
}

function fallbackId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

  const creditCards = data.budget.creditCards ?? [];

  const ensureCreditCard = (
    name: string,
    opts?: { color?: CardColorId },
  ): string | null => {
    const clean = (name ?? "").trim();
    if (!clean) return null;

    const found = creditCards.find(
      (c) => c.name.trim().toLowerCase() === clean.toLowerCase(),
    );
    if (found) return found.id;

    const id = newId();
    const color = opts?.color ?? DEFAULT_CARD_COLOR;

    update((prev: AppData) => {
      const list = prev.budget.creditCards ?? [];

      const again = list.find(
        (c) => (c.name ?? "").trim().toLowerCase() === clean.toLowerCase(),
      );
      if (again) return prev;

      return {
        ...prev,
        budget: {
          ...prev.budget,
          creditCards: [
            ...list,
            { id, name: clean, createdAt: Date.now(), color },
          ],
        },
      };
    });

    return id;
  };

  const getCreditCardColor = (id?: string) => {
    const key = (id ?? "").trim();
    if (!key) return DEFAULT_CARD_COLOR;
    return creditCards.find((c) => c.id === key)?.color ?? DEFAULT_CARD_COLOR;
  };

  const setCreditCardColor = (id: string, color: CardColorId) => {
    const key = (id ?? "").trim();
    if (!key) return;

    update((prev: AppData) => {
      const list = prev.budget.creditCards ?? [];
      const idx = list.findIndex((c) => c.id === key);
      if (idx < 0) return prev;

      const current = list[idx];
      if ((current.color ?? DEFAULT_CARD_COLOR) === color) return prev;

      const next = [...list];
      next[idx] = { ...current, color };

      return {
        ...prev,
        budget: { ...prev.budget, creditCards: next },
      };
    });
  };

  const getCreditCardName = (id?: string) => {
    const key = (id ?? "").trim();
    if (!key) return "";
    return creditCards.find((c) => c.id === key)?.name ?? "";
  };

  const selectedMonthKey = data.budget.selectedMonthKey;

  const setSelectedMonthKey = (monthKey: string) => {
    update((prev: AppData) => {
      if (prev.budget.selectedMonthKey === monthKey) return prev;

      return {
        ...prev,
        budget: { ...prev.budget, selectedMonthKey: monthKey },
      };
    });
  };

  const getMonth = (monthKey: string): BudgetMonthData => {
    const raw = data.budget.months[monthKey];
    return normalizeMonth(raw ?? createBudgetMonth());
  };

  const updateMonth = (
    monthKey: string,
    updater: (prev: BudgetMonthData) => BudgetMonthData,
  ) => {
    update((prev: AppData) => {
      const current = normalizeMonth(prev.budget.months[monthKey]);
      const nextMonth = normalizeMonth(updater(current));

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

  const getPreviousMonthKey = (monthKey: string) => prevMonthKey(monthKey);

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
    creditCards,
    ensureCreditCard,
    getCreditCardName,
    getCreditCardColor,
    setCreditCardColor,
    selectedMonthKey,
    setSelectedMonthKey,
    getMonth,
    updateMonth,
    getPreviousMonthKey,
    copyFixedBillsFromPrevious,
  };
}
