"use client";

import { useAppStore } from "@/store/app-store";

export function usePiggyBankStore() {
  const { data, setData } = useAppStore();

  const values = data.piggyBank;

  const setValues = (
    next:
      | Record<string, string>
      | ((prev: Record<string, string>) => Record<string, string>),
  ) => {
    setData((prev) => {
      const current = prev.piggyBank ?? {};
      const updated = typeof next === "function" ? next(current) : next;

      return {
        ...prev,
        piggyBank: updated,
        meta: {
          version: 1,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  return { values, setValues };
}
