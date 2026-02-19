"use client";

import {
  InstallmentPlan,
  useInstallmentsStore,
} from "@/store/installments.store";
import { InstallmentPlanFormDialog } from "./installment-plan-form-dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: InstallmentPlan;
};

export function EditInstallmentDialog({ open, onOpenChange, plan }: Props) {
  const updatePlan = useInstallmentsStore((s) => s.updatePlan);

  return (
    <InstallmentPlanFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Editar parcelas"
      description="Atualize as informações do plano com segurança."
      submitLabel="Salvar alterações"
      initial={{
        name: plan.name,
        installmentCents: plan.installmentCents,
        count: plan.count,
        firstDueDateISO: plan.firstDueDateISO,
      }}
      helper="Ao alterar a quantidade, os pagamentos já marcados serão mantidos dentro do novo limite."
      onSubmit={(values) => {
        updatePlan(plan.id, values);
      }}
    />
  );
}
