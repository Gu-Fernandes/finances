"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

const STORAGE_KEY = "finances-app:v1";
const VERSION = 1 as const;

export const BUDGET_CATEGORIES = [
  "Mercado",
  "Uber",
  "iFood",
  "Inter",
  "Nubank",
  "Roupa",
  "Fármacia",
  "Gasolina",
  "Livro",
  "Shopee",
  "Presente",
  "Outros",
] as const;

export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

function isBudgetCategory(v: unknown): v is BudgetCategory {
  return (
    typeof v === "string" &&
    (BUDGET_CATEGORIES as readonly string[]).includes(v)
  );
}

export type BudgetMonthData = {
  incomes: Array<{ id: string; label: string; amount: string }>;
  fixedBills: Array<{ id: string; description: string; amount: string }>;
  cardExpenses: Array<{
    id: string;
    category: BudgetCategory | "";
    amount: string;
  }>;

  invested: { amount: string };
};

export type BudgetData = {
  selectedMonthKey?: string; // "YYYY-MM"
  months: Record<string, BudgetMonthData>;
};

export type AppData = {
  piggyBank: Record<string, string>;
  budget: BudgetData;
  meta: {
    version: typeof VERSION;
    updatedAt: string;
  };
};

export const DEFAULT_BUDGET_MONTH: BudgetMonthData = {
  incomes: [],
  fixedBills: [],
  cardExpenses: [],
  invested: { amount: "" },
};

const DEFAULT_DATA: AppData = {
  piggyBank: {},
  budget: { selectedMonthKey: undefined, months: {} },
  meta: { version: VERSION, updatedAt: new Date().toISOString() },
};

function normalizeMonthData(input: unknown): BudgetMonthData {
  const obj = input && typeof input === "object" ? (input as any) : {};

  const invested =
    obj.invested && typeof obj.invested === "object"
      ? {
          amount:
            typeof obj.invested.amount === "string" ? obj.invested.amount : "",
        }
      : { amount: "" };

  const fixedBills = Array.isArray(obj.fixedBills)
    ? obj.fixedBills.map((it: any, idx: number) => ({
        id: typeof it?.id === "string" ? it.id : `fixed-${idx + 1}`,
        description: typeof it?.description === "string" ? it.description : "",
        amount: typeof it?.amount === "string" ? it.amount : "",
      }))
    : [];

  const cardExpenses = Array.isArray(obj.cardExpenses)
    ? obj.cardExpenses.map((it: any, idx: number) => ({
        id: typeof it?.id === "string" ? it.id : `card-${idx + 1}`,
        category: isBudgetCategory(it?.category) ? it.category : "Mercado",
        amount: typeof it?.amount === "string" ? it.amount : "",
      }))
    : [];

  // ✅ novo formato: incomes[]
  if (Array.isArray(obj.incomes)) {
    const incomes = obj.incomes.map((it: any, idx: number) => ({
      id: typeof it?.id === "string" ? it.id : `income-${idx + 1}`,
      label: typeof it?.label === "string" ? it.label : "",
      amount: typeof it?.amount === "string" ? it.amount : "",
    }));

    return {
      incomes: incomes.length ? incomes : DEFAULT_BUDGET_MONTH.incomes,
      fixedBills,
      cardExpenses,
      invested,
    };
  }

  // ✅ legado: income {label, amount}
  const legacyIncome =
    obj.income && typeof obj.income === "object" ? obj.income : null;
  const incomes = legacyIncome
    ? [
        {
          id: "income-1",
          label:
            typeof legacyIncome.label === "string"
              ? legacyIncome.label
              : "Salário",
          amount:
            typeof legacyIncome.amount === "string" ? legacyIncome.amount : "",
        },
      ]
    : DEFAULT_BUDGET_MONTH.incomes;

  return { incomes, fixedBills, cardExpenses, invested };
}

function safeParse(raw: string | null): AppData | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<AppData> | null;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.meta || parsed.meta.version !== VERSION) return null;

    const budgetRaw =
      parsed.budget && typeof parsed.budget === "object"
        ? (parsed.budget as any)
        : undefined;

    const monthsRaw =
      budgetRaw?.months && typeof budgetRaw.months === "object"
        ? (budgetRaw.months as Record<string, unknown>)
        : {};

    const months = Object.fromEntries(
      Object.entries(monthsRaw).map(([k, v]) => [k, normalizeMonthData(v)]),
    ) as Record<string, BudgetMonthData>;

    const piggyBank =
      parsed.piggyBank && typeof parsed.piggyBank === "object"
        ? (parsed.piggyBank as Record<string, string>)
        : {};

    return {
      piggyBank,
      budget: {
        selectedMonthKey:
          typeof budgetRaw?.selectedMonthKey === "string"
            ? budgetRaw.selectedMonthKey
            : undefined,
        months,
      },
      meta: {
        version: VERSION,
        updatedAt:
          typeof parsed.meta.updatedAt === "string"
            ? parsed.meta.updatedAt
            : new Date().toISOString(),
      },
    };
  } catch {
    return null;
  }
}

function loadFromStorage(): AppData {
  if (typeof window === "undefined") return DEFAULT_DATA;
  return safeParse(localStorage.getItem(STORAGE_KEY)) ?? DEFAULT_DATA;
}

function saveToStorage(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // sem crash
  }
}

type Snapshot = {
  data: AppData;
  ready: boolean;
  currentMonthKey: string; // "YYYY-MM"
};

const SERVER_SNAPSHOT: Snapshot = {
  data: DEFAULT_DATA,
  ready: false,
  currentMonthKey: "",
};

let _data: AppData = DEFAULT_DATA;
let _ready = false;
let _currentMonthKey = "";
let _snapshot: Snapshot = SERVER_SNAPSHOT;
const _listeners = new Set<() => void>();

function emit() {
  for (const l of _listeners) l();
}

function initClientOnce() {
  if (_ready) return;
  if (typeof window === "undefined") return;

  _data = loadFromStorage();

  const now = new Date();
  _currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  _ready = true;
  _snapshot = { data: _data, ready: _ready, currentMonthKey: _currentMonthKey };
}

function subscribe(listener: () => void) {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

function getSnapshot(): Snapshot {
  initClientOnce();
  return _snapshot;
}

function setStoreData(updater: (prev: AppData) => AppData) {
  initClientOnce();

  const next = updater(_data);

  _data = {
    ...next,
    meta: {
      version: VERSION,
      updatedAt: new Date().toISOString(),
    },
  };

  _snapshot = { data: _data, ready: _ready, currentMonthKey: _currentMonthKey };
  saveToStorage(_data);
  emit();
}

type AppStoreContextValue = {
  data: AppData;
  ready: boolean;
  currentMonthKey: string;
  update: (updater: (prev: AppData) => AppData) => void;
  reset: () => void;
};

const AppStoreContext = createContext<AppStoreContextValue | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const snap = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => SERVER_SNAPSHOT,
  );

  const value = useMemo<AppStoreContextValue>(() => {
    return {
      data: snap.data,
      ready: snap.ready,
      currentMonthKey: snap.currentMonthKey,
      update: (updater) => setStoreData(updater),
      reset: () => setStoreData(() => DEFAULT_DATA),
    };
  }, [snap.data, snap.ready, snap.currentMonthKey]);

  return (
    <AppStoreContext.Provider value={value}>
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}
