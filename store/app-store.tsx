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

type UnknownRecord = Record<string, unknown>;

function isRecord(v: unknown): v is UnknownRecord {
  return typeof v === "object" && v !== null && !Array.isArray(v);
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
  meta: { version: VERSION, updatedAt: "" },
};

function isOldDefaultIncomeRow(
  incomes: Array<{ label: string; amount: string }>,
) {
  return (
    incomes.length === 1 &&
    incomes[0]?.label === "Salário" &&
    (incomes[0]?.amount ?? "").trim() === ""
  );
}

function normalizeMonthData(input: unknown): BudgetMonthData {
  const obj: UnknownRecord = isRecord(input) ? input : {};

  const investedRaw = isRecord(obj["invested"])
    ? (obj["invested"] as UnknownRecord)
    : null;
  const invested = {
    amount:
      typeof investedRaw?.["amount"] === "string"
        ? (investedRaw["amount"] as string)
        : "",
  };

  const fixedBillsRaw = Array.isArray(obj["fixedBills"])
    ? obj["fixedBills"]
    : [];
  const fixedBills = fixedBillsRaw.map((it, idx) => {
    const row: UnknownRecord = isRecord(it) ? it : {};
    return {
      id:
        typeof row["id"] === "string"
          ? (row["id"] as string)
          : `fixed-${idx + 1}`,
      description:
        typeof row["description"] === "string"
          ? (row["description"] as string)
          : "",
      amount:
        typeof row["amount"] === "string" ? (row["amount"] as string) : "",
    };
  });

  const cardRaw = Array.isArray(obj["cardExpenses"]) ? obj["cardExpenses"] : [];
  const cardExpenses = cardRaw.map((it, idx) => {
    const row: UnknownRecord = isRecord(it) ? it : {};
    const rawCat = row["category"];

    const category: BudgetCategory | "" =
      rawCat === "" ? "" : isBudgetCategory(rawCat) ? rawCat : "";

    return {
      id:
        typeof row["id"] === "string"
          ? (row["id"] as string)
          : `card-${idx + 1}`,
      category,
      amount:
        typeof row["amount"] === "string" ? (row["amount"] as string) : "",
    };
  });

  // ✅ novo formato: incomes[]
  const incomesRaw = obj["incomes"];
  if (Array.isArray(incomesRaw)) {
    const incomes = incomesRaw.map((it, idx) => {
      const row: UnknownRecord = isRecord(it) ? it : {};
      return {
        id:
          typeof row["id"] === "string"
            ? (row["id"] as string)
            : `income-${idx + 1}`,
        label: typeof row["label"] === "string" ? (row["label"] as string) : "",
        amount:
          typeof row["amount"] === "string" ? (row["amount"] as string) : "",
      };
    });

    const incomesNormalized = isOldDefaultIncomeRow(incomes) ? [] : incomes;

    return {
      incomes: incomesNormalized,
      fixedBills,
      cardExpenses,
      invested,
    };
  }

  // ✅ legado: income {label, amount}
  const legacyIncomeRaw = isRecord(obj["income"])
    ? (obj["income"] as UnknownRecord)
    : null;

  const legacyAsArray = legacyIncomeRaw
    ? [
        {
          id: "income-1",
          label:
            typeof legacyIncomeRaw["label"] === "string"
              ? (legacyIncomeRaw["label"] as string)
              : "",
          amount:
            typeof legacyIncomeRaw["amount"] === "string"
              ? (legacyIncomeRaw["amount"] as string)
              : "",
        },
      ]
    : [];

  const incomesNormalized = isOldDefaultIncomeRow(legacyAsArray)
    ? []
    : legacyAsArray;

  return {
    incomes: incomesNormalized,
    fixedBills,
    cardExpenses,
    invested,
  };
}

function safeParse(raw: string | null): AppData | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return null;

    const meta = isRecord(parsed["meta"])
      ? (parsed["meta"] as UnknownRecord)
      : null;
    if (!meta || meta["version"] !== VERSION) return null;

    const budgetRaw = isRecord(parsed["budget"])
      ? (parsed["budget"] as UnknownRecord)
      : null;
    const monthsRaw =
      budgetRaw && isRecord(budgetRaw["months"])
        ? (budgetRaw["months"] as UnknownRecord)
        : {};

    const months = Object.fromEntries(
      Object.entries(monthsRaw).map(([k, v]) => [k, normalizeMonthData(v)]),
    ) as Record<string, BudgetMonthData>;

    const piggyBankRaw = isRecord(parsed["piggyBank"])
      ? (parsed["piggyBank"] as UnknownRecord)
      : {};
    const piggyBank: Record<string, string> = Object.fromEntries(
      Object.entries(piggyBankRaw).filter(([, v]) => typeof v === "string"),
    ) as Record<string, string>;

    return {
      piggyBank,
      budget: {
        selectedMonthKey:
          budgetRaw && typeof budgetRaw["selectedMonthKey"] === "string"
            ? (budgetRaw["selectedMonthKey"] as string)
            : undefined,
        months,
      },
      meta: {
        version: VERSION,
        updatedAt:
          typeof meta["updatedAt"] === "string"
            ? (meta["updatedAt"] as string)
            : "",
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
