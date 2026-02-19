"use client";

import { useInstallmentsStore } from "@/store/installments.store";
import { InstallmentPlanFormDialog } from "./installment-plan-form-dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddInstallmentDialog({ open, onOpenChange }: Props) {
  const addPlan = useInstallmentsStore((s) => s.addPlan);

  return (
    <InstallmentPlanFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Adicionar parcelas"
      description="Crie um plano com vencimento recorrente mensal."
      submitLabel="Salvar"
      onSubmit={(values) => {
        addPlan(values);
      }}
    />
  );
}
