export const STORAGE_KEY = "piggy-bank:v1";

export function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Aceita: "1234.56", "1.234,56", "R$ 1.234,56", "1234,56"
 */
export function parseMoneyBR(input: string) {
  const raw = (input ?? "").trim();
  if (!raw) return 0;

  const cleaned = raw.replace(/\s/g, "").replace("R$", "");

  let normalized = cleaned;
  if (cleaned.includes(",")) {
    // remove separador de milhar e troca decimal para ponto
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  }

  const n = Number(normalized);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, n);
}

export function getCurrentKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function loadSavedMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveSavedMap(values: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  } catch {
    // sem crash
  }
}
