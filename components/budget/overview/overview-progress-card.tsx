"use client";

import { CreditCard, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { formatBRL } from "../budget.constants";
import { BUDGET_UI } from "../budget.ui";
import { pct, ProgressBar } from "./ui";

type Props = {
  incomeTotal: number;
  expenseTotal: number;
  investedTotal: number;
};

export function OverviewProgressCard({
  incomeTotal,
  expenseTotal,
  investedTotal,
}: Props) {
  const uiExpense = BUDGET_UI.expense;
  const uiInvested = BUDGET_UI.invested;

  const spendPct = pct(expenseTotal, incomeTotal);
  const invPct = pct(investedTotal, incomeTotal);

  return (
    <Card className="overflow-hidden rounded-2xl shadow-sm lg:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Progresso do mês</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-xl ring-1 ring-border",
                  uiExpense.iconBg,
                )}
              >
                <CreditCard className={cn("size-4", uiExpense.iconText)} />
              </span>
              <p className="text-sm font-medium">Despesas / Receitas</p>
            </div>

            <Badge variant="outline" className={cn(uiExpense.badgeOutline)}>
              {spendPct == null ? "—" : `${spendPct.toFixed(0)}%`}
            </Badge>
          </div>

          <ProgressBar
            value={incomeTotal <= 0 ? 0 : expenseTotal / incomeTotal}
            tone={
              incomeTotal > 0 && expenseTotal > incomeTotal
                ? "destructive"
                : "primary"
            }
          />

          <p className="text-xs text-muted-foreground">
            {incomeTotal <= 0
              ? "Adicione receitas para acompanhar o progresso."
              : `Você gastou ${formatBRL(expenseTotal)} de ${formatBRL(incomeTotal)}.`}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-xl ring-1 ring-border",
                  uiInvested.iconBg,
                )}
              >
                <Landmark className={cn("size-4", uiInvested.iconText)} />
              </span>
              <p className="text-sm font-medium">Investido / Receitas</p>
            </div>

            <Badge variant="outline" className={cn(uiInvested.badgeOutline)}>
              {invPct == null ? "—" : `${invPct.toFixed(0)}%`}
            </Badge>
          </div>

          <ProgressBar
            value={incomeTotal <= 0 ? 0 : investedTotal / incomeTotal}
            tone="primary"
          />

          <p className="text-xs text-muted-foreground">
            {incomeTotal <= 0
              ? "Adicione receitas para ver a proporção investida."
              : `Você investiu ${formatBRL(investedTotal)} neste mês.`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
