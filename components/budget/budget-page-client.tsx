"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { BudgetCategory } from "@/store/app-store";
import { useAppStore } from "@/store/app-store";
import { useBudgetStore } from "@/store/budget.store";

import { BudgetMonthSelect } from "@/components/budget/budget-month-select";
import {
  BudgetMonthCard,
  type BudgetMonthCardRef,
  type BudgetSectionKey,
} from "@/components/budget/budget-month-card";
import { BudgetOverviewPanel } from "@/components/budget/overview/budget-overview-panel";
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

  // ✅ Hooks SEMPRE antes do return condicional
  const [tab, setTab] = useState<"resumo" | "detalhes">("resumo");
  const monthCardRef = useRef<BudgetMonthCardRef | null>(null);

  // ✅ fallback para não quebrar deps antes do ready
  const monthKey = selectedMonthKey || currentMonthKey || "0000-00";

  const goToDetails = useCallback((key?: BudgetSectionKey) => {
    setTab("detalhes");
    if (!key) return;

    requestAnimationFrame(() => monthCardRef.current?.scrollToSection(key));
    setTimeout(() => monthCardRef.current?.scrollToSection(key), 80);
  }, []);

  const quickAdd = useCallback(
    (section: BudgetSectionKey, addFn: () => void) => {
      addFn();
      goToDetails(section);
    },
    [goToDetails],
  );

  const addIncome = useCallback(() => {
    updateMonth(monthKey, (prev) => ({
      ...prev,
      incomes: [...prev.incomes, { id: newId(), label: "", amount: "" }],
    }));
  }, [updateMonth, monthKey]);

  const addFixed = useCallback(() => {
    updateMonth(monthKey, (prev) => ({
      ...prev,
      fixedBills: [
        ...prev.fixedBills,
        { id: newId(), description: "", amount: "" },
      ],
    }));
  }, [updateMonth, monthKey]);

  const addCard = useCallback(() => {
    updateMonth(monthKey, (prev) => ({
      ...prev,
      cardExpenses: [
        ...prev.cardExpenses,
        { id: newId(), category: "", amount: "" },
      ],
    }));
  }, [updateMonth, monthKey]);

  const addMisc = useCallback(() => {
    updateMonth(monthKey, (prev) => ({
      ...prev,
      miscExpenses: [
        ...(prev.miscExpenses ?? []),
        { id: newId(), description: "", amount: "" },
      ],
    }));
  }, [updateMonth, monthKey]);

  // ✅ Agora sim pode retornar loading
  if (!ready) return <Loading />;

  const year = monthKey.slice(0, 4);
  const mm = monthKey.slice(5, 7);
  const monthLabel = MONTHS.find((m) => m.value === mm)?.label ?? "Mês";
  const data = getMonth(monthKey);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4">
      <header className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex items-start justify-between gap-4">
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
        </div>

        <div className="relative mt-6 rounded-2xl border bg-background/60 p-4 backdrop-blur">
          <BudgetMonthSelect
            value={monthKey}
            year={year}
            onChange={setSelectedMonthKey}
          />
        </div>
      </header>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "resumo" | "detalhes")}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2 sm:w-[360px]">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-4">
          <BudgetOverviewPanel
            monthKey={monthKey}
            monthLabel={`${monthLabel} / ${year}`}
            data={data}
            onAddIncome={() => quickAdd("income", addIncome)}
            onAddFixed={() => quickAdd("fixed", addFixed)}
            onAddCard={() => quickAdd("card", addCard)}
            onAddMisc={() => quickAdd("misc", addMisc)}
          />
        </TabsContent>

        <TabsContent value="detalhes" className="space-y-4">
          <BudgetMonthCard
            ref={monthCardRef}
            monthLabel={`${monthLabel} / ${year}`}
            data={data}
            showSummary={false}
            onAddIncome={addIncome}
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
            onAddFixed={addFixed}
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
            onAddCard={addCard}
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
            onAddMisc={addMisc}
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
                miscExpenses: (prev.miscExpenses ?? []).filter(
                  (it) => it.id !== id,
                ),
              }))
            }
            onChangeInvestedAmount={(v) =>
              updateMonth(monthKey, (prev) => ({
                ...prev,
                invested: { ...prev.invested, amount: v },
              }))
            }
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
