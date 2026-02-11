"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatBRL } from "../budget.constants";
import { HandCoins, CreditCard, Wallet } from "lucide-react";

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
  subLabel,
  subValue,
  subValueClass,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  iconBgClass: string;
  iconColorClass: string;
  valueClass?: string;
  subLabel?: string;
  subValue?: string;
  subValueClass?: string;
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

      {subLabel ? (
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <p className="text-xs text-muted-foreground">{subLabel}</p>
          <p className={cn("text-sm font-medium", subValueClass)}>{subValue}</p>
        </div>
      ) : null}
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
      <CardContent className="grid gap-3 p-3 sm:grid-cols-3 sm:p-4">
        <Stat
          label="Receitas"
          value={formatBRL(incomeTotal)}
          icon={HandCoins}
          iconBgClass="bg-emerald-500/10"
          iconColorClass="text-emerald-600 dark:text-emerald-400"
          valueClass="text-primary"
          subLabel="Investido"
          subValue={formatBRL(investedTotal)}
          subValueClass="text-muted-foreground"
        />

        <Stat
          label="Despesas"
          value={formatBRL(expenseTotal)}
          icon={CreditCard}
          iconBgClass="bg-rose-500/10"
          iconColorClass="text-rose-600 dark:text-rose-400"
          valueClass="text-destructive"
          subLabel="—"
          subValue=" "
          subValueClass="text-transparent"
        />

        <Stat
          label="Líquido"
          value={formatBRL(netTotal)}
          icon={Wallet}
          iconBgClass="bg-sky-500/10"
          iconColorClass="text-sky-600 dark:text-sky-400"
          valueClass={netValueClass}
          subLabel=" "
          subValue=" "
          subValueClass="text-transparent"
        />
      </CardContent>
    </Card>
  );
}
