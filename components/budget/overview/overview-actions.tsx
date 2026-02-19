"use client";

import { CalendarCheck2, CreditCard, HandCoins, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  canCopyFixedBills: boolean;
  onCopyFixedBills: () => void;

  onAddIncome: () => void;
  onAddFixed: () => void;
  onAddCard: () => void;
  onAddMisc: () => void;
};

export function OverviewActions({
  canCopyFixedBills,
  onCopyFixedBills,
  onAddIncome,
  onAddFixed,
  onAddCard,
  onAddMisc,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={onAddIncome}>
        <HandCoins className="mr-2 size-4" />
        Receita
      </Button>

      <Button size="sm" variant="secondary" onClick={onAddFixed}>
        <CalendarCheck2 className="mr-2 size-4" />
        Conta fixa
      </Button>

      <Button size="sm" variant="secondary" onClick={onAddCard}>
        <CreditCard className="mr-2 size-4" />
        Cartão
      </Button>

      <Button size="sm" variant="secondary" onClick={onAddMisc}>
        <Wallet className="mr-2 size-4" />
        Extra
      </Button>

      {canCopyFixedBills ? (
        <Button size="sm" variant="outline" onClick={onCopyFixedBills}>
          <CalendarCheck2 className="mr-2 size-4" />
          Copiar fixas do mês anterior
        </Button>
      ) : null}
    </div>
  );
}
