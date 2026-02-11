"use client";

import { Card, CardContent } from "@/components/ui/card";
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
    <Card>
      <CardContent className="grid gap-3 px-5 sm:grid-cols-3">
        {/* Receitas + Investido (embaixo) */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Total em receitas</p>
          <p className="font-semibold text-primary">{formatBRL(incomeTotal)}</p>

          <div className="pt-1">
            <p className="text-sm text-muted-foreground">Total investido</p>
            <p className="font-semibold text-muted-foreground">
              {formatBRL(investedTotal)}
            </p>
          </div>
        </div>

        {/* Despesas + Líquido (embaixo) */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Total em despesas</p>
          <p className="font-semibold text-destructive">
            {formatBRL(expenseTotal)}
          </p>

          <div className="pt-1">
            <p className="text-sm text-muted-foreground">Líquido</p>
            <p className={netClass}>{formatBRL(netTotal)}</p>
          </div>
        </div>

        {/* Mantém o layout 3 colunas (igual antes) */}
        <div className="hidden sm:block" />
      </CardContent>
    </Card>
  );
}
