"use client";

import { Plus } from "lucide-react";

import type { BudgetCategory } from "@/store/app-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { CARD_CATEGORIES, formatBRL, parseMoneyBR } from "../budget.constants";
import { MoneyInput } from "@/components/ui/money-input";

type Item = { id: string; category: BudgetCategory | ""; amount: string };

type Props = {
  items: Item[];
  onAdd: () => void;
  onChange: (id: string, patch: Partial<Item>) => void;
};

export function CardExpensesCard({ items, onAdd, onChange }: Props) {
  const total = items.reduce((sum, it) => sum + parseMoneyBR(it.amount), 0);

  const last = items[items.length - 1];
  const canAdd =
    items.length === 0 ||
    (last.category !== "" && parseMoneyBR(last.amount) > 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Cartão de crédito</CardTitle>

        <div className="flex items-center gap-5">
          <Badge variant="destructive">{formatBRL(total)}</Badge>
          <Button
            type="button"
            variant="default"
            size="icon-sm"
            onClick={() => {
              if (!canAdd) return;
              onAdd();
            }}
            disabled={!canAdd}
            aria-label="Adicionar gasto no cartão"
          >
            <Plus />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className="grid grid-cols-2 gap-2">
            <Select
              value={it.category}
              onValueChange={(v) =>
                onChange(it.id, { category: v as BudgetCategory })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>

              <SelectContent>
                {CARD_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <MoneyInput
              value={it.amount}
              onChange={(e) => onChange(it.id, { amount: e.target.value })}
              placeholder="0,00"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
