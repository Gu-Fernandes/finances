export const CARD_COLORS = [
  {
    id: "slate",
    label: "Grafite",
    dot: "bg-slate-500",
    bar: "bg-slate-500/40",
    soft: "bg-slate-500/10",
    icon: "text-slate-600 dark:text-slate-300",
  },
  {
    id: "blue",
    label: "Azul",
    dot: "bg-blue-500",
    bar: "bg-blue-500/40",
    soft: "bg-blue-500/10",
    icon: "text-blue-600 dark:text-blue-300",
  },
  {
    id: "indigo",
    label: "Índigo",
    dot: "bg-indigo-500",
    bar: "bg-indigo-500/40",
    soft: "bg-indigo-500/10",
    icon: "text-indigo-600 dark:text-indigo-300",
  },
  {
    id: "violet",
    label: "Violeta",
    dot: "bg-violet-500",
    bar: "bg-violet-500/40",
    soft: "bg-violet-500/10",
    icon: "text-violet-600 dark:text-violet-300",
  },
  {
    id: "emerald",
    label: "Verde",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500/40",
    soft: "bg-emerald-500/10",
    icon: "text-emerald-600 dark:text-emerald-300",
  },
  {
    id: "teal",
    label: "Turquesa",
    dot: "bg-teal-500",
    bar: "bg-teal-500/40",
    soft: "bg-teal-500/10",
    icon: "text-teal-600 dark:text-teal-300",
  },
  {
    id: "amber",
    label: "Âmbar",
    dot: "bg-amber-500",
    bar: "bg-amber-500/40",
    soft: "bg-amber-500/10",
    icon: "text-amber-700 dark:text-amber-300",
  },
  {
    id: "rose",
    label: "Rosa",
    dot: "bg-rose-500",
    bar: "bg-rose-500/40",
    soft: "bg-rose-500/10",
    icon: "text-rose-600 dark:text-rose-300",
  },
] as const;

export type CardColorId = (typeof CARD_COLORS)[number]["id"];

export const DEFAULT_CARD_COLOR: CardColorId = "slate";

export const CARD_COLOR_BY_ID = Object.fromEntries(
  CARD_COLORS.map((c) => [c.id, c]),
) as Record<CardColorId, (typeof CARD_COLORS)[number]>;

export function normalizeCardColorId(v: unknown): CardColorId {
  if (typeof v !== "string") return DEFAULT_CARD_COLOR;
  const found = CARD_COLORS.find((c) => c.id === v);
  return (found?.id as CardColorId) ?? DEFAULT_CARD_COLOR;
}
