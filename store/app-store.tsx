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

export const INVESTMENTS_TABS = [
  "fixedIncome",
  "stocks",
  "funds",
  "treasuryDirect",
  "crypto",
] as const;

export type InvestmentsTabKey = (typeof INVESTMENTS_TABS)[number];

type UnknownRecord = Record<string, unknown>;

const isRecord = (v: unknown): v is UnknownRecord =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isOneOf = <T extends readonly string[]>(
  arr: T,
  v: unknown,
): v is T[number] =>
  typeof v === "string" && (arr as readonly string[]).includes(v);

const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? v : 0;

export type BudgetMonthData = {
  miscExpenses?: Array<{ id: string; description: string; amount: string }>;
  incomes: Array<{ id: string; label: string; amount: string }>;
  fixedBills: Array<{ id: string; description: string; amount: string }>;
  cardExpenses: Array<{
    id: string;
    category: string;
    amount: string;
  }>;
  invested: { amount: string };
};

export type BudgetData = {
  selectedMonthKey?: string; // "YYYY-MM"
  months: Record<string, BudgetMonthData>;
};

export type FixedIncomeItem = {
  id: string;
  name: string;
  appliedCents: number;
  currentCents: number;
};

export type StockItem = {
  id: string;
  name: string;
  quantity: string; // número (não moeda)
  avgPriceCents: number; // preço médio
  currentQuoteCents: number; // cotação atual
  dividendCents: number;
  dividendMonths: string;
  dividendPerShareCents: number;
};

export type InvestmentsData = {
  fixedIncome: FixedIncomeItem[];
  funds: FixedIncomeItem[];
  treasuryDirect: FixedIncomeItem[];
  crypto: FixedIncomeItem[];
  stocks: StockItem[];
  ui: {
    activeTab: InvestmentsTabKey;
  };
};

export type AppData = {
  piggyBank: Record<string, string>;
  budget: BudgetData;
  investments: InvestmentsData;
  meta: {
    version: typeof VERSION;
    updatedAt: string;
  };
};

export const DEFAULT_BUDGET_MONTH: BudgetMonthData = {
  incomes: [],
  fixedBills: [],
  cardExpenses: [],
  miscExpenses: [], // ✅ novo
  invested: { amount: "" },
};

export function createBudgetMonth(): BudgetMonthData {
  return {
    incomes: [],
    fixedBills: [],
    cardExpenses: [],
    miscExpenses: [], // ✅ novo
    invested: { amount: "" },
  };
}

const DEFAULT_DATA: AppData = {
  piggyBank: {},
  budget: { selectedMonthKey: undefined, months: {} },
  investments: {
    fixedIncome: [],
    funds: [],
    treasuryDirect: [],
    crypto: [],
    stocks: [],
    ui: { activeTab: "fixedIncome" },
  },
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

  const investedObj = isRecord(obj["invested"])
    ? (obj["invested"] as UnknownRecord)
    : {};
  const invested = { amount: str(investedObj["amount"]) };

  const fixedBills = (
    Array.isArray(obj["fixedBills"]) ? obj["fixedBills"] : []
  ).map((it, idx) => {
    const row: UnknownRecord = isRecord(it) ? it : {};
    return {
      id: str(row["id"]) || `fixed-${idx + 1}`,
      description: str(row["description"]),
      amount: str(row["amount"]),
    };
  });

  const cardExpenses = (
    Array.isArray(obj["cardExpenses"]) ? obj["cardExpenses"] : []
  ).map((it, idx) => {
    const row: UnknownRecord = isRecord(it) ? it : {};
    const category = str(row["category"]);

    return {
      id: str(row["id"]) || `card-${idx + 1}`,
      category,
      amount: str(row["amount"]),
    };
  });

  // ✅ novo: miscExpenses
  const miscExpenses = (
    Array.isArray(obj["miscExpenses"]) ? obj["miscExpenses"] : []
  ).map((it, idx) => {
    const row: UnknownRecord = isRecord(it) ? it : {};
    return {
      id: str(row["id"]) || `misc-${idx + 1}`,
      description: str(row["description"]),
      amount: str(row["amount"]),
    };
  });

  if (Array.isArray(obj["incomes"])) {
    const incomes = obj["incomes"].map((it, idx) => {
      const row: UnknownRecord = isRecord(it) ? it : {};
      return {
        id: str(row["id"]) || `income-${idx + 1}`,
        label: str(row["label"]),
        amount: str(row["amount"]),
      };
    });

    return {
      incomes: isOldDefaultIncomeRow(incomes) ? [] : incomes,
      fixedBills,
      cardExpenses,
      miscExpenses, // ✅ novo
      invested,
    };
  }

  const legacyIncomeRaw = isRecord(obj["income"])
    ? (obj["income"] as UnknownRecord)
    : null;

  const legacyAsArray = legacyIncomeRaw
    ? [
        {
          id: "income-1",
          label: str(legacyIncomeRaw["label"]),
          amount: str(legacyIncomeRaw["amount"]),
        },
      ]
    : [];

  return {
    incomes: isOldDefaultIncomeRow(legacyAsArray) ? [] : legacyAsArray,
    fixedBills,
    cardExpenses,
    miscExpenses, // ✅ novo
    invested,
  };
}

function normalizeFixedIncomeList(
  rawList: unknown,
  idPrefix: string,
): FixedIncomeItem[] {
  const arr = Array.isArray(rawList) ? rawList : [];
  return arr.map((it, idx) => {
    const row: UnknownRecord = isRecord(it) ? it : {};
    return {
      id: str(row["id"]) || `${idPrefix}-${idx + 1}`,
      name: str(row["name"]),
      appliedCents: num(row["appliedCents"]),
      currentCents: num(row["currentCents"]),
    };
  });
}

function normalizeStocksList(rawList: unknown): StockItem[] {
  const arr = Array.isArray(rawList) ? rawList : [];

  return arr.map((it, idx) => {
    const row: UnknownRecord = isRecord(it) ? it : {};

    const avgPrice = row["avgPriceCents"];
    const currentQuote = row["currentQuoteCents"];

    const dividendCents = row["dividendCents"];
    const dividendMonths = row["dividendMonths"];
    const dividendPerShareCents = row["dividendPerShareCents"];

    return {
      id:
        typeof row["id"] === "string" ? (row["id"] as string) : `st-${idx + 1}`,
      name: typeof row["name"] === "string" ? (row["name"] as string) : "",
      quantity:
        typeof row["quantity"] === "string" ? (row["quantity"] as string) : "",

      avgPriceCents:
        typeof avgPrice === "number" && Number.isFinite(avgPrice)
          ? avgPrice
          : 0,
      currentQuoteCents:
        typeof currentQuote === "number" && Number.isFinite(currentQuote)
          ? currentQuote
          : 0,

      dividendCents:
        typeof dividendCents === "number" && Number.isFinite(dividendCents)
          ? dividendCents
          : 0,
      dividendMonths:
        typeof dividendMonths === "string" ? (dividendMonths as string) : "",

      dividendPerShareCents:
        typeof dividendPerShareCents === "number" &&
        Number.isFinite(dividendPerShareCents)
          ? dividendPerShareCents
          : 0,
    };
  });
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
      : {};
    const monthsRaw = isRecord(budgetRaw["months"])
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

    const investmentsRaw = isRecord(parsed["investments"])
      ? (parsed["investments"] as UnknownRecord)
      : {};

    const fixedIncome = normalizeFixedIncomeList(
      investmentsRaw["fixedIncome"],
      "fi",
    );
    const funds = normalizeFixedIncomeList(investmentsRaw["funds"], "fund");
    const treasuryDirect = normalizeFixedIncomeList(
      investmentsRaw["treasuryDirect"],
      "td",
    );
    const crypto = normalizeFixedIncomeList(investmentsRaw["crypto"], "cr");
    const stocks = normalizeStocksList(investmentsRaw["stocks"]);

    const uiRaw = isRecord(investmentsRaw["ui"])
      ? (investmentsRaw["ui"] as UnknownRecord)
      : {};
    const activeTab: InvestmentsTabKey = isOneOf(
      INVESTMENTS_TABS,
      uiRaw["activeTab"],
    )
      ? (uiRaw["activeTab"] as InvestmentsTabKey)
      : "fixedIncome";

    return {
      piggyBank,
      budget: {
        selectedMonthKey: str(budgetRaw["selectedMonthKey"]) || undefined,
        months,
      },
      investments: {
        fixedIncome,
        funds,
        treasuryDirect,
        crypto,
        stocks,
        ui: { activeTab },
      },
      meta: {
        version: VERSION,
        updatedAt: str(meta["updatedAt"]),
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
  } catch {}
}

type Snapshot = {
  data: AppData;
  ready: boolean;
  currentMonthKey: string;
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
  if (next === _data) return;

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
