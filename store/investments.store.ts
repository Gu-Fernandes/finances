"use client";

import {
  useAppStore,
  type AppData,
  type FixedIncomeItem,
  type StockItem,
  type InvestmentsTabKey,
  type InvestmentsData,
} from "@/store/app-store";

type FixedListKey = "fixedIncome" | "funds" | "treasuryDirect" | "crypto";

const DEFAULT_NAMES: Record<FixedListKey, string> = {
  fixedIncome: "Renda fixa",
  funds: "Fundos",
  treasuryDirect: "Tesouro direto",
  crypto: "Cripto",
};

function createId() {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {}

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createEmptyInvestments(): InvestmentsData {
  return {
    fixedIncome: [],
    funds: [],
    treasuryDirect: [],
    crypto: [],
    stocks: [],
    ui: { activeTab: "fixedIncome" },
  };
}

function ensureInvestments(prev: AppData): InvestmentsData {
  return prev.investments ?? createEmptyInvestments();
}

function createFixedIncomeItem(defaultName: string): FixedIncomeItem {
  return {
    id: createId(),
    name: defaultName,
    appliedCents: 0,
    currentCents: 0,
  };
}

function createStockItem(defaultName = "Ação"): StockItem {
  return {
    id: createId(),
    name: defaultName,
    quantity: "",
    avgPriceCents: 0,
    currentQuoteCents: 0,
    dividendCents: 0,
    dividendMonths: "",
    dividendPerShareCents: 0,
  };
}

export function useInvestmentsStore() {
  const { data, update, ready } = useAppStore();

  const investments = data.investments ?? createEmptyInvestments();

  const fixedIncome = investments.fixedIncome ?? [];
  const funds = investments.funds ?? [];
  const treasuryDirect = investments.treasuryDirect ?? [];
  const crypto = investments.crypto ?? [];
  const stocks = investments.stocks ?? [];
  const activeTab = investments.ui?.activeTab ?? "fixedIncome";

  const setInvestments = (updater: (prev: AppData) => AppData) => {
    if (!ready) return;
    update(updater);
  };

  const updateInvestmentsState = (
    updater: (inv: InvestmentsData, prevApp: AppData) => InvestmentsData | null,
  ) => {
    setInvestments((prev) => {
      const currentInv = ensureInvestments(prev);
      const nextInv = updater(currentInv, prev);

      if (!nextInv || nextInv === currentInv) return prev;
      return { ...prev, investments: nextInv };
    });
  };

  const setFixedList = (
    key: FixedListKey,
    next: FixedIncomeItem[] | ((prev: FixedIncomeItem[]) => FixedIncomeItem[]),
  ) => {
    updateInvestmentsState((inv) => {
      const current = inv[key] ?? [];
      const updated = typeof next === "function" ? next(current) : next;

      if (updated === current) return null;
      return { ...inv, [key]: updated };
    });
  };

  const addFixedListItem = (key: FixedListKey) =>
    setFixedList(key, (prev) => [
      ...prev,
      createFixedIncomeItem(DEFAULT_NAMES[key]),
    ]);

  const updateFixedListItem = (
    key: FixedListKey,
    id: string,
    patch: Partial<FixedIncomeItem>,
  ) =>
    setFixedList(key, (prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    );

  const removeFixedListItem = (key: FixedListKey, id: string) =>
    setFixedList(key, (prev) => prev.filter((it) => it.id !== id));

  const setStocks = (
    next: StockItem[] | ((prev: StockItem[]) => StockItem[]),
  ) => {
    updateInvestmentsState((inv) => {
      const current = inv.stocks ?? [];
      const updated = typeof next === "function" ? next(current) : next;

      if (updated === current) return null;
      return { ...inv, stocks: updated };
    });
  };

  const ensureStocksSeeded = () =>
    updateInvestmentsState((inv) => {
      const current = inv.stocks ?? [];

      if (!inv.stocks) return { ...inv, stocks: [] };

      if (current.length === 0) return inv;

      const anyMissing = current.some((it) => it.dividendPerShareCents == null);
      if (!anyMissing) return inv;

      return {
        ...inv,
        stocks: current.map((it) => ({
          ...it,
          dividendPerShareCents: it.dividendPerShareCents ?? 0,
        })),
      };
    });

  const addStockItem = () =>
    setStocks((prev) => [...prev, createStockItem("Ação")]);

  const updateStockItem = (id: string, patch: Partial<StockItem>) =>
    setStocks((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    );

  const removeStockItem = (id: string) =>
    setStocks((prev) => prev.filter((it) => it.id !== id));

  const setActiveTab = (tab: InvestmentsTabKey) => {
    updateInvestmentsState((inv) => {
      const current = inv.ui?.activeTab ?? "fixedIncome";
      if (current === tab) return null;

      return {
        ...inv,
        ui: { ...(inv.ui ?? { activeTab: "fixedIncome" }), activeTab: tab },
      };
    });
  };

  const ensureFixedListKey = (key: FixedListKey) =>
    updateInvestmentsState((inv) => {
      if (inv[key]) return inv;
      return { ...inv, [key]: [] };
    });

  return {
    ready,

    activeTab,
    setActiveTab,

    fixedIncome,
    addFixedIncomeItem: () => addFixedListItem("fixedIncome"),
    updateFixedIncomeItem: (id: string, patch: Partial<FixedIncomeItem>) =>
      updateFixedListItem("fixedIncome", id, patch),
    removeFixedIncomeItem: (id: string) =>
      removeFixedListItem("fixedIncome", id),
    ensureFixedIncomeSeeded: () => ensureFixedListKey("fixedIncome"),

    funds,
    addFundItem: () => addFixedListItem("funds"),
    updateFundItem: (id: string, patch: Partial<FixedIncomeItem>) =>
      updateFixedListItem("funds", id, patch),
    removeFundItem: (id: string) => removeFixedListItem("funds", id),
    ensureFundsSeeded: () => ensureFixedListKey("funds"),

    treasuryDirect,
    addTreasuryDirectItem: () => addFixedListItem("treasuryDirect"),
    updateTreasuryDirectItem: (id: string, patch: Partial<FixedIncomeItem>) =>
      updateFixedListItem("treasuryDirect", id, patch),
    removeTreasuryDirectItem: (id: string) =>
      removeFixedListItem("treasuryDirect", id),
    ensureTreasuryDirectSeeded: () => ensureFixedListKey("treasuryDirect"),

    crypto,
    addCryptoItem: () => addFixedListItem("crypto"),
    updateCryptoItem: (id: string, patch: Partial<FixedIncomeItem>) =>
      updateFixedListItem("crypto", id, patch),
    removeCryptoItem: (id: string) => removeFixedListItem("crypto", id),
    ensureCryptoSeeded: () => ensureFixedListKey("crypto"),

    stocks,
    addStockItem,
    updateStockItem,
    removeStockItem,
    ensureStocksSeeded,
  };
}
