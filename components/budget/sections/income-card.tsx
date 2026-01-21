"use client";

import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";

import { formatBRL, parseMoneyBR } from "../budget.constants";

type Item = { id: string; label: string; amount: string };

type Props = {
  items?: Item[];
  onAdd: () => void;
  onChange: (id: string, patch: Partial<Item>) => void;
};

export function IncomeCard({ items = [], onAdd, onChange }: Props) {
  const total = items.reduce((sum, it) => sum + parseMoneyBR(it.amount), 0);

  const last = items[items.length - 1];
  const canAdd =
    items.length === 0 ||
    (last.label.trim().length > 0 && parseMoneyBR(last.amount) > 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Receitas</CardTitle>

        <div className="flex items-center gap-5">
          <Badge variant="default">{formatBRL(total)}</Badge>

          <Button
            type="button"
            variant="default"
            size="icon-sm"
            onClick={() => {
              if (!canAdd) return;
              onAdd();
            }}
            disabled={!canAdd}
            aria-label="Adicionar receita"
          >
            <Plus />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className="grid grid-cols-2 gap-2">
            <Input
              value={it.label}
              onChange={(e) => onChange(it.id, { label: e.target.value })}
              placeholder="Descrição"
            />

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
