"use client";

import {
  useAppStore,
  type AppData,
  type FixedIncomeItem,
  type StockItem,
  type InvestmentsTabKey,
} from "@/store/app-store";

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
  };
}

function ensureInvestments(prev: AppData) {
  return (
    prev.investments ?? {
      fixedIncome: [],
      funds: [],
      treasuryDirect: [],
      crypto: [],
      stocks: [],
      ui: { activeTab: "fixedIncome" as InvestmentsTabKey },
    }
  );
}

type FixedListKey = "fixedIncome" | "funds" | "treasuryDirect" | "crypto";

const DEFAULT_NAMES: Record<FixedListKey, string> = {
  fixedIncome: "Renda fixa",
  funds: "Fundos",
  treasuryDirect: "Tesouro direto",
  crypto: "Cripto",
};

export function useInvestmentsStore() {
  const { data, update, ready } = useAppStore();

  const investments = data.investments ?? ensureInvestments(data);

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

  const setFixedList = (
    key: FixedListKey,
    next: FixedIncomeItem[] | ((prev: FixedIncomeItem[]) => FixedIncomeItem[]),
  ) => {
    setInvestments((prev) => {
      const inv = ensureInvestments(prev);
      const current = inv[key] ?? [];
      const updated = typeof next === "function" ? next(current) : next;

      if (updated === current) return prev;

      return { ...prev, investments: { ...inv, [key]: updated } };
    });
  };

  const ensureFixedListSeeded = (key: FixedListKey) =>
    setFixedList(key, (prev) =>
      prev.length > 0 ? prev : [createFixedIncomeItem(DEFAULT_NAMES[key])],
    );

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
    setFixedList(key, (prev) =>
      prev.length <= 1 ? prev : prev.filter((i) => i.id !== id),
    );

  const setStocks = (
    next: StockItem[] | ((prev: StockItem[]) => StockItem[]),
  ) => {
    setInvestments((prev) => {
      const inv = ensureInvestments(prev);
      const current = inv.stocks ?? [];
      const updated = typeof next === "function" ? next(current) : next;

      if (updated === current) return prev;

      return { ...prev, investments: { ...inv, stocks: updated } };
    });
  };

  const ensureStocksSeeded = () =>
    setStocks((prev) => (prev.length > 0 ? prev : [createStockItem("Ações")]));

  const addStockItem = () =>
    setStocks((prev) => [...prev, createStockItem("Ação")]);

  const updateStockItem = (id: string, patch: Partial<StockItem>) =>
    setStocks((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    );

  const removeStockItem = (id: string) =>
    setStocks((prev) =>
      prev.length <= 1 ? prev : prev.filter((i) => i.id !== id),
    );

  const setActiveTab = (tab: InvestmentsTabKey) => {
    setInvestments((prev) => {
      const inv = ensureInvestments(prev);
      const current = inv.ui?.activeTab ?? "fixedIncome";
      if (current === tab) return prev;

      return {
        ...prev,
        investments: {
          ...inv,
          ui: { ...(inv.ui ?? { activeTab: "fixedIncome" }), activeTab: tab },
        },
      };
    });
  };

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
    ensureFixedIncomeSeeded: () => ensureFixedListSeeded("fixedIncome"),

    funds,
    addFundItem: () => addFixedListItem("funds"),
    updateFundItem: (id: string, patch: Partial<FixedIncomeItem>) =>
      updateFixedListItem("funds", id, patch),
    removeFundItem: (id: string) => removeFixedListItem("funds", id),
    ensureFundsSeeded: () => ensureFixedListSeeded("funds"),

    treasuryDirect,
    addTreasuryDirectItem: () => addFixedListItem("treasuryDirect"),
    updateTreasuryDirectItem: (id: string, patch: Partial<FixedIncomeItem>) =>
      updateFixedListItem("treasuryDirect", id, patch),
    removeTreasuryDirectItem: (id: string) =>
      removeFixedListItem("treasuryDirect", id),
    ensureTreasuryDirectSeeded: () => ensureFixedListSeeded("treasuryDirect"),

    crypto,
    addCryptoItem: () => addFixedListItem("crypto"),
    updateCryptoItem: (id: string, patch: Partial<FixedIncomeItem>) =>
      updateFixedListItem("crypto", id, patch),
    removeCryptoItem: (id: string) => removeFixedListItem("crypto", id),
    ensureCryptoSeeded: () => ensureFixedListSeeded("crypto"),

    stocks,
    addStockItem,
    updateStockItem,
    removeStockItem,
    ensureStocksSeeded,
  };
}
