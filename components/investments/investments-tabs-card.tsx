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
  iconClassName: string;
}> = [
  {
    key: "stocks",
    label: "Ações",
    icon: LineChart,
    iconClassName: "text-emerald-600 dark:text-emerald-500",
  },
  {
    key: "fixedIncome",
    label: "Renda fixa",
    icon: PiggyBank,
    iconClassName: "text-sky-600 dark:text-sky-500",
  },
  {
    key: "funds",
    label: "Fundos",
    icon: Briefcase,
    iconClassName: "text-violet-600 dark:text-violet-500",
  },
  {
    key: "treasury",
    label: "Tesouro direto",
    icon: Vault,
    iconClassName: "text-amber-600 dark:text-amber-500",
  },
  {
    key: "cripto",
    label: "Criptomoedas",
    icon: Bitcoin,
    iconClassName: "text-orange-600 dark:text-orange-500",
  },
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

// mini store (localStorage) + external store
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

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
  return DEFAULT_TAB;
}

function setActiveTab(next: TabKey) {
  try {
    localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, next);
  } catch {
    // sem crash
  }
  emit();
}

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
          className={[
            "flex gap-2 overflow-x-auto pb-2",
            "[-webkit-overflow-scrolling:touch]",
            // esconde scrollbar (cara de app)
            "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
          ].join(" ")}
        >
          {TABS.map((tab) => (
            <InvestmentsTabButton
              key={tab.key}
              active={tab.key === active}
              label={tab.label}
              icon={tab.icon}
              iconClassName={tab.iconClassName}
              onClick={() => setActiveTab(tab.key)}
            />
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">{ActiveView}</CardContent>
    </Card>
  );
}
