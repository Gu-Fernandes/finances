"use client";

import React, { useMemo, useSyncExternalStore, type ElementType } from "react";
import { PiggyBank, LineChart, Briefcase, Vault, Bitcoin } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FixedIncomeTab } from "./components/tabs/fixed-income-tab";
import { FundsTab } from "./components/tabs/funds-tab";
import { TreasuryDirectTab } from "./components/tabs/treasury-direct-tab";
import { StocksTab } from "./components/tabs/stocks-tab";
import { CryptoTab } from "./components/tabs/crypto-tab";
import { InvestmentsTabButton } from "./investments-tab-button";

type TabKey = "fixedIncome" | "stocks" | "funds" | "treasury" | "cripto";

const ACTIVE_TAB_STORAGE_KEY = "finances-app:v1:active-investments-tab";
const DEFAULT_TAB: TabKey = "fixedIncome";

const TABS: Array<{
  key: TabKey;
  label: string;
  icon: ElementType;
}> = [
  { key: "stocks", label: "Ações", icon: LineChart },
  { key: "fixedIncome", label: "Renda fixa", icon: PiggyBank },
  { key: "funds", label: "Fundos", icon: Briefcase },
  { key: "treasury", label: "Tesouro direto", icon: Vault },
  { key: "cripto", label: "Criptomoedas", icon: Bitcoin },
];

function isTabKey(v: unknown): v is TabKey {
  return (
    v === "fixedIncome" ||
    v === "stocks" ||
    v === "funds" ||
    v === "treasury" ||
    v === "cripto"
  );
}

function safeGetStoredTab(): TabKey {
  try {
    const raw = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    return isTabKey(raw) ? raw : DEFAULT_TAB;
  } catch {
    return DEFAULT_TAB;
  }
}

// ------- mini store (localStorage) + external store -------
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  // se outra aba/janela mudar, atualiza também
  const onStorage = (e: StorageEvent) => {
    if (e.key === ACTIVE_TAB_STORAGE_KEY) emit();
  };

  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): TabKey {
  return safeGetStoredTab();
}

function getServerSnapshot(): TabKey {
  return DEFAULT_TAB; // SSR estável
}

function setActiveTab(next: TabKey) {
  try {
    localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, next);
  } catch {
    // sem crash
  }
  emit(); // mesma aba atualiza na hora
}
// ---------------------------------------------------------

export function InvestmentsTabsCard() {
  const active = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const ActiveView = useMemo(() => {
    switch (active) {
      case "stocks":
        return <StocksTab />;
      case "fixedIncome":
        return <FixedIncomeTab />;
      case "funds":
        return <FundsTab />;
      case "treasury":
        return <TreasuryDirectTab />;
      case "cripto":
        return <CryptoTab />;
      default:
        return <FixedIncomeTab />;
    }
  }, [active]);

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div
          role="tablist"
          aria-label="Categorias de investimentos"
          className="flex gap-2 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] md:overflow-visible md:pb-0"
        >
          {TABS.map((tab) => (
            <InvestmentsTabButton
              key={tab.key}
              active={tab.key === active}
              label={tab.label}
              icon={tab.icon}
              onClick={() => setActiveTab(tab.key)}
            />
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">{ActiveView}</CardContent>
    </Card>
  );
}
