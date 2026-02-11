"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatBRL } from "../budget.constants";

type Props = {
  incomeTotal: number;
  expenseTotal: number;
  investedTotal: number;
  netTotal: number;
};

export function BudgetSummaryCard({
  incomeTotal,
  expenseTotal,
  investedTotal,
  netTotal,
}: Props) {
  const netClass =
    netTotal < 0
      ? "font-semibold text-destructive"
      : netTotal > 0
        ? "font-semibold text-primary"
        : "font-semibold text-muted-foreground";

  return (
    <Card className="overflow-hidden rounded-2xl bg-muted/15 shadow-none">
      <CardContent className="grid gap-4 p-4 sm:grid-cols-3">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Total em receitas</p>
          <p className="font-semibold text-primary">{formatBRL(incomeTotal)}</p>

          <div className="pt-2">
            <p className="text-sm text-muted-foreground">Total investido</p>
            <p className="font-semibold text-muted-foreground">
              {formatBRL(investedTotal)}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Total em despesas</p>
          <p className="font-semibold text-destructive">
            {formatBRL(expenseTotal)}
          </p>

          <div className="pt-2">
            <p className="text-sm text-muted-foreground">Líquido</p>
            <p className={cn(netClass)}>{formatBRL(netTotal)}</p>
          </div>
        </div>

        <div className="hidden sm:block" />
      </CardContent>
    </Card>
  );
}
