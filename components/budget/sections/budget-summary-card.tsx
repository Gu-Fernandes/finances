"use client";

import type { LucideIcon } from "lucide-react";
import { CreditCard, HandCoins, Landmark, Wallet } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatBRL } from "../budget.constants";
import { BUDGET_UI } from "../budget.ui";

type Props = {
  incomeTotal: number;
  expenseTotal: number;
  investedTotal: number;
  netTotal: number;
};

function Stat({
  label,
  value,
  icon: Icon,
  iconBgClass,
  iconColorClass,
  valueClass,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  iconBgClass: string;
  iconColorClass: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border bg-background/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={cn("text-lg font-semibold tracking-tight", valueClass)}>
            {value}
          </p>
        </div>

        <span
          className={cn(
            "grid size-10 place-items-center rounded-xl ring-1 ring-border",
            iconBgClass,
          )}
        >
          <Icon className={cn("size-5", iconColorClass)} />
        </span>
      </div>
    </div>
  );
}

export function BudgetSummaryCard({
  incomeTotal,
  expenseTotal,
  investedTotal,
  netTotal,
}: Props) {
  const netValueClass =
    netTotal < 0
      ? "text-destructive"
      : netTotal > 0
        ? "text-primary"
        : "text-muted-foreground";

  return (
    <Card className="overflow-hidden rounded-2xl bg-muted/10 shadow-none">
      <CardContent className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-4 sm:p-4">
        <Stat
          label="Receitas"
          value={formatBRL(incomeTotal)}
          icon={HandCoins}
          iconBgClass={BUDGET_UI.income.iconBg}
          iconColorClass={BUDGET_UI.income.iconText}
          valueClass={BUDGET_UI.income.value}
        />

        <Stat
          label="Despesas"
          value={formatBRL(expenseTotal)}
          icon={CreditCard}
          iconBgClass={BUDGET_UI.expense.iconBg}
          iconColorClass={BUDGET_UI.expense.iconText}
          valueClass={BUDGET_UI.expense.value}
        />

        <Stat
          label="Investido"
          value={formatBRL(investedTotal)}
          icon={Landmark}
          iconBgClass={BUDGET_UI.invested.iconBg}
          iconColorClass={BUDGET_UI.invested.iconText}
          valueClass={BUDGET_UI.invested.value}
        />

        <Stat
          label="Líquido"
          value={formatBRL(netTotal)}
          icon={Wallet}
          iconBgClass={BUDGET_UI.net.iconBg}
          iconColorClass={BUDGET_UI.net.iconText}
          valueClass={netValueClass}
        />
      </CardContent>
    </Card>
  );
}
