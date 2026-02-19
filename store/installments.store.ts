import { create } from "zustand";
import { persist } from "zustand/middleware";

export type InstallmentPlan = {
  id: string;
  name: string;
  installmentCents: number; // valor da parcela em centavos
  count: number; // quantidade de parcelas
  firstDueDateISO: string; // data do primeiro vencimento (ISO)
  paid: boolean[]; // tamanho = count
};

type UpdatePlanPatch = Partial<
  Pick<InstallmentPlan, "name" | "installmentCents" | "count" | "firstDueDateISO">
>;

type State = {
  plans: InstallmentPlan[];
  addPlan: (payload: Omit<InstallmentPlan, "id" | "paid">) => void;
  togglePaid: (planId: string, index: number) => void;

  // ✅ novos
  updatePlan: (planId: string, patch: UpdatePlanPatch) => void;
  removePlan: (planId: string) => void;
};

function createId() {
  // tenta UUID nativo se existir (nem todo mobile/WebView tem)
  try {
    const c = globalThis.crypto as Crypto | undefined;
    if (c?.randomUUID) return c.randomUUID();
  } catch {
    // ignore
  }

  // fallback simples (sem deps)
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function clampCount(n: number) {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.floor(n));
}

export const useInstallmentsStore = create<State>()(
  persist(
    (set, get) => ({
      plans: [],

      addPlan: (payload) => {
        const id = createId();
        const count = clampCount(payload.count);

        set({
          plans: [
            ...get().plans,
            {
              id,
              ...payload,
              count,
              paid: Array.from({ length: count }, () => false),
            },
          ],
        });
      },

      togglePaid: (planId, index) => {
        set({
          plans: get().plans.map((p) => {
            if (p.id !== planId) return p;

            // segurança: index inválido não faz nada
            if (index < 0 || index >= p.paid.length) return p;

            const paid = [...p.paid];
            paid[index] = !paid[index];

            return { ...p, paid };
          }),
        });
      },

      updatePlan: (planId, patch) => {
        set({
          plans: get().plans.map((p) => {
            if (p.id !== planId) return p;

            // aplica patch
            const next: InstallmentPlan = { ...p, ...patch };

            // se count mudou, ajusta paid mantendo o que já estava pago
            if (patch.count != null && patch.count !== p.count) {
              const target = clampCount(patch.count);

              const paid = (p.paid ?? []).slice(0, target);
              while (paid.length < target) paid.push(false);

              next.count = target;
              next.paid = paid;
            } else {
              // garantia extra: paid sempre do tamanho do count atual
              const target = clampCount(next.count);
              const paid = (next.paid ?? []).slice(0, target);
              while (paid.length < target) paid.push(false);

              next.count = target;
              next.paid = paid;
            }

            return next;
          }),
        });
      },

      removePlan: (planId) => {
        set({
          plans: get().plans.filter((p) => p.id !== planId),
        });
      },
    }),
    { name: "my-finances.installments.v1" },
  ),
);
