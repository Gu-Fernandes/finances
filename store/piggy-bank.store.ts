"use client";

import { useAppStore, type AppData } from "@/store/app-store";

export function usePiggyBankStore() {
  const { data, update } = useAppStore();

  const values = data.piggyBank;

  const setValues = (
    next:
      | Record<string, string>
      | ((prev: Record<string, string>) => Record<string, string>),
  ) => {
    update((prev: AppData) => {
      const current = prev.piggyBank ?? {};
      const updated = typeof next === "function" ? next(current) : next;

      return {
        ...prev,
        piggyBank: updated,
      };
    });
  };

  return { values, setValues };
}
