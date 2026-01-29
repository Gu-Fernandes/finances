"use client";

import { useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";

import { formatBRL, parseMoneyBR } from "../budget.constants";

type Props = {
  amount: string;
  onChangeAmount: (value: string) => void;
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

export function InvestedCard({ amount, onChangeAmount }: Props) {
  const normalizeMoney = useCallback((raw: string) => {
    const cents = toCentsFromMasked(raw);
    return formatInputFromCents(cents);
  }, []);

  const total = parseMoneyBR(amount);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Valor investido</CardTitle>
        <Badge variant="default">{formatBRL(total)}</Badge>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 items-center gap-2">
          <Label className="text-sm text-muted-foreground border p-2 rounded-md">
            Total guardado
          </Label>

          <MoneyInput
            value={normalizeMoney(amount)}
            onChange={(e) => onChangeAmount(normalizeMoney(e.target.value))}
            inputMode="decimal"
            placeholder="0,00"
          />
        </div>
      </CardContent>
    </Card>
  );
}
