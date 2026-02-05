"use client";

import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";

import { formatBRL, parseMoneyBR } from "../budget.constants";

type Item = { id: string; description: string; amount: string };

type Props = {
  items: Item[];
  onAdd: () => void;
  onChange: (id: string, patch: Partial<Item>) => void;
  onRemove: (id: string) => void;
};

function toCentsFromMasked(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

function formatInputFromCents(cents: number) {
  if (!cents) return "";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function normalizeMoney(raw: string) {
  const cents = toCentsFromMasked(raw);
  return formatInputFromCents(cents);
}

export function FixedBillsCard({ items, onAdd, onChange, onRemove }: Props) {
  const total = items.reduce((sum, it) => sum + parseMoneyBR(it.amount), 0);

  function tryAutoRemove(it: Item) {
    const emptyDesc = (it.description ?? "").trim().length === 0;
    const emptyAmount = toCentsFromMasked(it.amount) === 0;

    if (emptyDesc && emptyAmount) onRemove(it.id);
  }

  const last = items[items.length - 1];
  const canAdd =
    items.length === 0 ||
    ((last.description ?? "").trim().length > 0 &&
      toCentsFromMasked(last.amount) > 0);

  return (
    <Card className="border border-red-300">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Contas fixas</CardTitle>

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
            aria-label="Adicionar conta fixa"
          >
            <Plus />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className="grid grid-cols-2 gap-2">
            <Input
              value={it.description}
              onChange={(e) => onChange(it.id, { description: e.target.value })}
              onBlur={() => tryAutoRemove(it)}
              placeholder="Conta fixa"
            />

            <MoneyInput
              value={normalizeMoney(it.amount)}
              onChange={(e) =>
                onChange(it.id, { amount: normalizeMoney(e.target.value) })
              }
              onBlur={() => tryAutoRemove(it)}
              inputMode="decimal"
              placeholder="0,00"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}