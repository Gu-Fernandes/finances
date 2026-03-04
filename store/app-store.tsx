"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

const STORAGE_KEY = "finances-app:v1";
const VERSION = 1 as const;

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
    description?: string;
    cardId?: string;
  }>;
  invested: { amount: string };
};

export type CreditCard = {
  id: string;
  name: string;
  createdAt: number;
};

export type BudgetData = {
  selectedMonthKey?: string; // "YYYY-MM"
  months: Record<string, BudgetMonthData>;
  creditCards?: CreditCard[]; // novo
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

function createDefaultBudgetMonth(): BudgetMonthData {
  return {
    incomes: [],
    fixedBills: [],
    cardExpenses: [],
    miscExpenses: [],
    invested: { amount: "" },
  };
}

export const DEFAULT_BUDGET_MONTH: BudgetMonthData = createDefaultBudgetMonth();

export function createBudgetMonth(): BudgetMonthData {
  return createDefaultBudgetMonth();
}

function createDefaultInvestmentsData(): InvestmentsData {
  return {
    fixedIncome: [],
    funds: [],
    treasuryDirect: [],
    crypto: [],
    stocks: [],
    ui: { activeTab: "fixedIncome" },
  };
}

function createDefaultAppData(): AppData {
  return {
    piggyBank: {},
    budget: { selectedMonthKey: undefined, months: {}, creditCards: [] },
    investments: createDefaultInvestmentsData(),
    meta: { version: VERSION, updatedAt: "" },
  };
}

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
    return {
      id: str(row["id"]) || `card-${idx + 1}`,
      category: str(row["category"]),
      amount: str(row["amount"]),
      description: str(row["description"]) || "",
      cardId: str(row["cardId"]) || "",
    };
  });

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

  const normalizeIncomes = (source: unknown) => {
    if (!Array.isArray(source)) return null;

    const incomes = source.map((it, idx) => {
      const row: UnknownRecord = isRecord(it) ? it : {};
      return {
        id: str(row["id"]) || `income-${idx + 1}`,
        label: str(row["label"]),
        amount: str(row["amount"]),
      };
    });

    return isOldDefaultIncomeRow(incomes) ? [] : incomes;
  };

  const directIncomes = normalizeIncomes(obj["incomes"]);
  if (directIncomes) {
    return {
      incomes: directIncomes,
      fixedBills,
      cardExpenses,
      miscExpenses,
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
    miscExpenses,
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

    return {
      id: str(row["id"]) || `st-${idx + 1}`,
      name: str(row["name"]),
      quantity: str(row["quantity"]),
      avgPriceCents: num(row["avgPriceCents"]),
      currentQuoteCents: num(row["currentQuoteCents"]),
      dividendCents: num(row["dividendCents"]),
      dividendMonths: str(row["dividendMonths"]),
      dividendPerShareCents: num(row["dividendPerShareCents"]),
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

    const creditCardsRaw = Array.isArray(budgetRaw["creditCards"])
      ? budgetRaw["creditCards"]
      : [];

    const creditCards = creditCardsRaw
      .map((it, idx) => {
        const row: UnknownRecord = isRecord(it) ? it : {};
        return {
          id: str(row["id"]) || `cc-${idx + 1}`,
          name: str(row["name"]),
          createdAt: num(row["createdAt"]),
        };
      })
      .filter((c) => c.name.trim().length > 0);

    const piggyBankRaw = isRecord(parsed["piggyBank"])
      ? (parsed["piggyBank"] as UnknownRecord)
      : {};

    const piggyBank = Object.fromEntries(
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
      ? uiRaw["activeTab"]
      : "fixedIncome";

    return {
      piggyBank,
      budget: {
        selectedMonthKey: str(budgetRaw["selectedMonthKey"]) || undefined,
        months,
        creditCards,
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
  if (typeof window === "undefined") return createDefaultAppData();
  return (
    safeParse(window.localStorage.getItem(STORAGE_KEY)) ??
    createDefaultAppData()
  );
}

function saveToStorage(data: AppData) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

type Snapshot = {
  data: AppData;
  ready: boolean;
  currentMonthKey: string;
};

const SERVER_SNAPSHOT: Snapshot = {
  data: createDefaultAppData(),
  ready: false,
  currentMonthKey: "",
};

let _data: AppData = createDefaultAppData();
let _ready = false;
let _currentMonthKey = "";
let _snapshot: Snapshot = SERVER_SNAPSHOT;

const _listeners = new Set<() => void>();

function emit() {
  for (const listener of _listeners) listener();
}

function initClientOnce() {
  if (_ready || typeof window === "undefined") return;

  _data = loadFromStorage();

  const now = new Date();
  _currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  _ready = true;
  _snapshot = {
    data: _data,
    ready: _ready,
    currentMonthKey: _currentMonthKey,
  };
}

function subscribe(listener: () => void) {
  _listeners.add(listener);
  return () => {
    _listeners.delete(listener);
  };
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

  _snapshot = {
    data: _data,
    ready: _ready,
    currentMonthKey: _currentMonthKey,
  };

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

  const value = useMemo<AppStoreContextValue>(
    () => ({
      data: snap.data,
      ready: snap.ready,
      currentMonthKey: snap.currentMonthKey,
      update: setStoreData,
      reset: () => setStoreData(() => createDefaultAppData()),
    }),
    [snap.data, snap.ready, snap.currentMonthKey],
  );

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
