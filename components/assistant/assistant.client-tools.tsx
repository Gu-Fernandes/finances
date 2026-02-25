"use client";

import { toast } from "sonner";
import type { BudgetMonthData } from "@/store/app-store";
import type { AssistantToolName } from "./assistant-tools";

type Router = {
  push: (href: string) => void;
};

type BudgetStore = {
  selectedMonthKey?: string;
  getMonth: (monthKey: string) => BudgetMonthData;
  updateMonth: (
    monthKey: string,
    updater: (prev: BudgetMonthData) => BudgetMonthData,
  ) => void;
};

type Ctx = {
  currentMonthKey: string;
  budget: BudgetStore;
  router: Router;
};

function resolveMonthKey(inputMonthKey: unknown, ctx: Ctx): string {
  if (
    typeof inputMonthKey === "string" &&
    /^\d{4}-\d{2}$/.test(inputMonthKey)
  ) {
    return inputMonthKey;
  }
  return ctx.budget.selectedMonthKey || ctx.currentMonthKey;
}

function createId() {
  try {
    return globalThis.crypto?.randomUUID?.() ?? fallbackId();
  } catch {
    return fallbackId();
  }
}

function fallbackId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function centsToBRText(cents: number) {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const dec = String(abs % 100).padStart(2, "0");
  return `${sign}${whole},${dec}`;
}

// aceita strings tipo "50", "50,00", "R$ 1.234,56"
function brTextToCents(text: string) {
  const s = text
    .replace(/\s/g, "")
    .replace("R$", "")
    .replace(/\./g, "")
    .replace(",", ".");

  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

// ✅ robusto: aceita amountCents ou amountBRL (se você adicionar no schema)
function readAmountCents(input: any): number {
  const cents = Number(input?.amountCents);
  if (Number.isFinite(cents) && cents >= 0) return Math.round(cents);

  const brl = Number(input?.amountBRL);
  if (Number.isFinite(brl) && brl >= 0) return Math.round(brl * 100);

  return 0;
}

function requireText(value: unknown, label: string) {
  const s = String(value ?? "").trim();
  if (!s) throw new Error(`${label} é obrigatório.`);
  return s;
}

function requirePositiveCents(cents: number) {
  if (!Number.isFinite(cents) || cents <= 0) {
    throw new Error("Valor inválido. Informe um valor maior que zero.");
  }
  return cents;
}

export async function runAssistantTool(
  tool: AssistantToolName,
  input: unknown, // ✅ padroniza com toolCall.input
  ctx: Ctx,
) {
  const args: any = input ?? {}; // compat

  switch (tool) {
    case "addCardExpense": {
      const monthKey = resolveMonthKey(args.monthKey, ctx);

      const category = requireText(args.category, "Categoria");
      const amountCents = requirePositiveCents(readAmountCents(args));
      const amount = centsToBRText(amountCents);

      const id = createId();

      ctx.budget.updateMonth(monthKey, (m) => ({
        ...m,
        cardExpenses: [...(m.cardExpenses ?? []), { id, category, amount }],
      }));

      toast.success("Gasto no cartão adicionado");

      return {
        ok: true,
        monthKey,
        item: { id, category, amountCents },
      };
    }

    case "addFixedBill": {
      const monthKey = resolveMonthKey(args.monthKey, ctx);

      const description = requireText(args.description, "Descrição");
      const amountCents = requirePositiveCents(readAmountCents(args));
      const amount = centsToBRText(amountCents);

      const id = createId();

      ctx.budget.updateMonth(monthKey, (m) => ({
        ...m,
        fixedBills: [...(m.fixedBills ?? []), { id, description, amount }],
      }));

      toast.success("Conta fixa adicionada");

      return {
        ok: true,
        monthKey,
        item: { id, description, amountCents },
      };
    }

    case "addMiscExpense": {
      const monthKey = resolveMonthKey(args.monthKey, ctx);

      const description = requireText(args.description, "Descrição");
      const amountCents = requirePositiveCents(readAmountCents(args));
      const amount = centsToBRText(amountCents);

      const id = createId();

      ctx.budget.updateMonth(monthKey, (m) => ({
        ...m,
        miscExpenses: [...(m.miscExpenses ?? []), { id, description, amount }],
      }));

      toast.success("Despesa adicionada");

      return {
        ok: true,
        monthKey,
        item: { id, description, amountCents },
      };
    }

    case "addIncome": {
      const monthKey = resolveMonthKey(args.monthKey, ctx);

      const label = requireText(args.label, "Nome da receita");
      const amountCents = requirePositiveCents(readAmountCents(args));
      const amount = centsToBRText(amountCents);

      const id = createId();

      ctx.budget.updateMonth(monthKey, (m) => ({
        ...m,
        incomes: [...(m.incomes ?? []), { id, label, amount }],
      }));

      toast.success("Receita adicionada");

      return {
        ok: true,
        monthKey,
        item: { id, label, amountCents },
      };
    }

    case "getLargestExpense": {
      const monthKey = resolveMonthKey(args.monthKey, ctx);
      const m = ctx.budget.getMonth(monthKey);

      const candidates: Array<{
        kind: "fixedBills" | "cardExpenses" | "miscExpenses";
        label: string;
        amountCents: number;
      }> = [];

      for (const b of m.fixedBills ?? []) {
        candidates.push({
          kind: "fixedBills",
          label: b.description,
          amountCents: brTextToCents(b.amount),
        });
      }
      for (const c of m.cardExpenses ?? []) {
        candidates.push({
          kind: "cardExpenses",
          label: c.category,
          amountCents: brTextToCents(c.amount),
        });
      }
      for (const x of m.miscExpenses ?? []) {
        candidates.push({
          kind: "miscExpenses",
          label: x.description,
          amountCents: brTextToCents(x.amount),
        });
      }

      const top = candidates.reduce(
        (best, cur) => (cur.amountCents > best.amountCents ? cur : best),
        { kind: "miscExpenses" as const, label: "", amountCents: 0 },
      );

      return { ok: true, monthKey, top };
    }

    case "getMonthOverview": {
      const monthKey = resolveMonthKey(args.monthKey, ctx);
      const m = ctx.budget.getMonth(monthKey);

      const incomesCents = (m.incomes ?? []).reduce(
        (acc, it) => acc + brTextToCents(it.amount),
        0,
      );
      const fixedBillsCents = (m.fixedBills ?? []).reduce(
        (acc, it) => acc + brTextToCents(it.amount),
        0,
      );
      const cardCents = (m.cardExpenses ?? []).reduce(
        (acc, it) => acc + brTextToCents(it.amount),
        0,
      );
      const miscCents = (m.miscExpenses ?? []).reduce(
        (acc, it) => acc + brTextToCents(it.amount),
        0,
      );

      const investedCents = brTextToCents(m.invested?.amount ?? "0");

      return {
        ok: true,
        monthKey,
        totals: {
          incomesCents,
          expensesCents: fixedBillsCents + cardCents + miscCents,
          byType: { fixedBillsCents, cardCents, miscCents },
          investedCents,
        },
      };
    }

    case "sumSavedMonths": {
      const monthKeys = Array.isArray(args?.monthKeys) ? args.monthKeys : [];
      if (!monthKeys.length) throw new Error("Informe os meses para somar.");

      const sum = monthKeys.reduce((acc: number, key: string) => {
        const m = ctx.budget.getMonth(key);
        return acc + brTextToCents(m.invested?.amount ?? "0");
      }, 0);

      return { ok: true, monthKeys, sumCents: sum };
    }

    case "navigate": {
      const path = String(args?.path ?? "").trim();
      if (!path) throw new Error("Path vazio.");

      ctx.router.push(path);
      toast.message("Abrindo tela…");

      return { ok: true, path };
    }

    default: {
      // deixa claro pra IA que não rolou
      throw new Error("Tool não suportada.");
    }
  }
}
