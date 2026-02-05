"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import type { BudgetCategory } from "@/store/app-store";
import { useAppStore } from "@/store/app-store";
import { useBudgetStore } from "@/store/budget.store";

import { BudgetMonthSelect } from "@/components/budget/budget-month-select";
import { BudgetMonthCard } from "@/components/budget/budget-month-card";
import { MONTHS } from "@/components/budget/budget.constants";

function newId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

export function BudgetPageClient() {
  const { ready, currentMonthKey } = useAppStore();
  const { selectedMonthKey, setSelectedMonthKey, getMonth, updateMonth } =
    useBudgetStore();

  if (!ready) return <Loading />;

  const monthKey = selectedMonthKey || currentMonthKey;
  const year = monthKey.slice(0, 4);
  const mm = monthKey.slice(5, 7);

  const monthLabel = MONTHS.find((m) => m.value === mm)?.label ?? "Mês";
  const data = getMonth(monthKey);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4">
      <header className="flex items-center justify-between gap-1">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Orçamento</h1>
          <p className="text-sm text-muted-foreground">
            Controle receitas, contas fixas e gastos com cartão.
          </p>
        </div>

        <Button variant="outline" size="icon-sm" asChild>
          <Link href="/" aria-label="Voltar">
            <ArrowLeft />
          </Link>
        </Button>
      </header>

      <BudgetMonthSelect
        value={monthKey}
        year={year}
        onChange={setSelectedMonthKey}
      />

      <BudgetMonthCard
        monthLabel={`${monthLabel} / ${year}`}
        data={data}
        onAddIncome={() =>
          updateMonth(monthKey, (prev) => ({
            ...prev,
            incomes: [...prev.incomes, { id: newId(), label: "", amount: "" }],
          }))
        }
        onChangeIncome={(id, patch) =>
          updateMonth(monthKey, (prev) => ({
            ...prev,
            incomes: prev.incomes.map((it) =>
              it.id === id ? { ...it, ...patch } : it,
            ),
          }))
        }
        onRemoveIncome={(id) =>
          updateMonth(monthKey, (prev) => ({
            ...prev,
            incomes: prev.incomes.filter((it) => it.id !== id),
          }))
        }
        onAddFixed={() =>
          updateMonth(monthKey, (prev) => ({
            ...prev,
            fixedBills: [
              ...prev.fixedBills,
              { id: newId(), description: "", amount: "" },
            ],
          }))
        }
        onChangeFixed={(id, patch) =>
          updateMonth(monthKey, (prev) => ({
            ...prev,
            fixedBills: prev.fixedBills.map((it) =>
              it.id === id ? { ...it, ...patch } : it,
            ),
          }))
        }
        onRemoveFixed={(id) =>
          updateMonth(monthKey, (prev) => ({
            ...prev,
            fixedBills: prev.fixedBills.filter((it) => it.id !== id),
          }))
        }
        onAddCard={() =>
          updateMonth(monthKey, (prev) => ({
            ...prev,
            cardExpenses: [
              ...prev.cardExpenses,
              { id: newId(), category: "", amount: "" },
            ],
          }))
        }
        onChangeCard={(id, patch) =>
          updateMonth(monthKey, (prev) => ({
            ...prev,
            cardExpenses: prev.cardExpenses.map((it) =>
              it.id === id
                ? {
                    ...it,
                    ...patch,
                    category:
                      (patch as Partial<{ category: BudgetCategory | "" }>)
                        .category ?? it.category,
                  }
                : it,
            ),
          }))
        }
        onRemoveCard={(id) =>
          updateMonth(monthKey, (prev) => ({
            ...prev,
            cardExpenses: prev.cardExpenses.filter((it) => it.id !== id),
          }))
        }
 
        onAddMisc={() =>
          updateMonth(monthKey, (prev) => ({
            ...prev,
            miscExpenses: [
              ...(prev.miscExpenses ?? []),
              { id: newId(), description: "", amount: "" },
            ],
          }))
        }
        onChangeMisc={(id, patch) =>
          updateMonth(monthKey, (prev) => ({
            ...prev,
            miscExpenses: (prev.miscExpenses ?? []).map((it) =>
              it.id === id ? { ...it, ...patch } : it,
            ),
          }))
        }
        onRemoveMisc={(id) =>
          updateMonth(monthKey, (prev) => ({
            ...prev,
            miscExpenses: (prev.miscExpenses ?? []).filter((it) => it.id !== id),
          }))
        }

        onChangeInvestedAmount={(v) =>
          updateMonth(monthKey, (prev) => ({
            ...prev,
            invested: { ...prev.invested, amount: v },
          }))
        }
      />
    </main>
  );
}