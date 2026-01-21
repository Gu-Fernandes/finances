"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "finances-app:v1";

export type AppData = {
  piggyBank: Record<string, string>;
  meta: {
    version: 1;
    updatedAt: string;
  };
};

const DEFAULT_DATA: AppData = {
  piggyBank: {},
  meta: {
    version: 1,
    updatedAt: new Date().toISOString(),
  },
};

function safeParse(raw: string | null): AppData | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<AppData> | null;

    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.meta || parsed.meta.version !== 1) return null;

    return {
      piggyBank:
        parsed.piggyBank && typeof parsed.piggyBank === "object"
          ? (parsed.piggyBank as Record<string, string>)
          : {},
      meta: {
        version: 1,
        updatedAt:
          typeof parsed.meta.updatedAt === "string"
            ? parsed.meta.updatedAt
            : new Date().toISOString(),
      },
    };
  } catch {
    return null;
  }
}

function loadFromStorage(): AppData {
  if (typeof window === "undefined") return DEFAULT_DATA;
  const parsed = safeParse(localStorage.getItem(STORAGE_KEY));
  return parsed ?? DEFAULT_DATA;
}

function saveToStorage(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

type AppStoreContextValue = {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  reset: () => void;
};

const AppStoreContext = createContext<AppStoreContextValue | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  // ✅ inicializa do storage sem useEffect (lint happy)
  const [data, setData] = useState<AppData>(() => loadFromStorage());

  // ✅ persiste sempre que mudar (isso o lint aceita)
  useEffect(() => {
    if (typeof window === "undefined") return;
    saveToStorage(data);
  }, [data]);

  const value = useMemo<AppStoreContextValue>(() => {
    return {
      data,
      setData,
      reset: () => setData(DEFAULT_DATA),
    };
  }, [data]);

  return (
    <AppStoreContext.Provider value={value}>
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}
