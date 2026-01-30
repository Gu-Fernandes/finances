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

type State = {
  plans: InstallmentPlan[];
  addPlan: (payload: Omit<InstallmentPlan, "id" | "paid">) => void;
  togglePaid: (planId: string, index: number) => void;
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

export const useInstallmentsStore = create<State>()(
  persist(
    (set, get) => ({
      plans: [],
      addPlan: (payload) => {
        const id = createId();

        set({
          plans: [
            ...get().plans,
            {
              id,
              ...payload,
              paid: Array.from({ length: payload.count }, () => false),
            },
          ],
        });
      },
      togglePaid: (planId, index) => {
        set({
          plans: get().plans.map((p) => {
            if (p.id !== planId) return p;

            const paid = [...p.paid];
            paid[index] = !paid[index];

            return { ...p, paid };
          }),
        });
      },
    }),
    { name: "my-finances.installments.v1" },
  ),
);
