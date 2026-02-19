"use client";

import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { formatBRL } from "../budget.constants";
import { ProgressBar } from "./ui";

type Props = {
  expenseTotal: number;
  topCardCats: Array<{ category: string; total: number }>;
  onAddCard: () => void;
};

export function OverviewTopCategories({
  expenseTotal,
  topCardCats,
  onAddCard,
}: Props) {
  return (
    <Card className="overflow-hidden rounded-2xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Cartão (Top categorias)</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {topCardCats.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/10 p-4">
            <p className="text-sm font-medium">Sem gastos no cartão</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Adicione despesas do cartão para ver onde seu dinheiro está indo.
            </p>
            <Button className="mt-3" size="sm" onClick={onAddCard}>
              <CreditCard className="mr-2 size-4" />
              Adicionar gasto
            </Button>
          </div>
        ) : (
          topCardCats.map((c) => {
            const share = expenseTotal <= 0 ? 0 : c.total / expenseTotal;
            return (
              <div key={c.category} className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-sm font-medium">
                    {c.category}
                  </p>
                  <p className="shrink-0 text-sm font-semibold">
                    {formatBRL(c.total)}
                  </p>
                </div>
                <ProgressBar value={share} tone="muted" />
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
