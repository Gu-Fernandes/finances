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

type UpdatePayload = Partial<
  Pick<InstallmentPlan, "name" | "installmentCents" | "count" | "firstDueDateISO">
>;

type State = {
  plans: InstallmentPlan[];

  addPlan: (payload: Omit<InstallmentPlan, "id" | "paid">) => void;
  togglePaid: (planId: string, index: number) => void;

  updatePlan: (planId: string, patch: UpdatePayload) => void;
  removePlan: (planId: string) => void;

  // útil pra "desfazer" exclusão via toast
  restorePlan: (plan: InstallmentPlan, index?: number) => void;
};

function createId() {
  try {
    const c = globalThis.crypto as Crypto | undefined;
    if (c?.randomUUID) return c.randomUUID();
  } catch {
    // ignore
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function clampCount(n: number) {
  return Number.isFinite(n) ? Math.max(1, Math.floor(n)) : 1;
}

function normalizePaid(prev: boolean[], nextCount: number) {
  const safeCount = clampCount(nextCount);

  if (prev.length === safeCount) return prev;

  if (prev.length > safeCount) return prev.slice(0, safeCount);

  // prev.length < safeCount -> completa com false
  return [...prev, ...Array.from({ length: safeCount - prev.length }, () => false)];
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

            if (index < 0 || index >= p.count) return p;

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

            const nextCount = patch.count != null ? clampCount(patch.count) : p.count;

            const next: InstallmentPlan = {
              ...p,
              ...patch,
              count: nextCount,
              paid: normalizePaid(p.paid, nextCount),
            };

            return next;
          }),
        });
      },

      removePlan: (planId) => {
        set({ plans: get().plans.filter((p) => p.id !== planId) });
      },

      restorePlan: (plan, index) => {
        const current = get().plans.filter((p) => p.id !== plan.id);

        const next = [...current];
        const i =
          index == null ? next.length : Math.max(0, Math.min(index, next.length));

        next.splice(i, 0, plan);
        set({ plans: next });
      },
    }),
    { name: "my-finances.installments.v1" },
  ),
);
