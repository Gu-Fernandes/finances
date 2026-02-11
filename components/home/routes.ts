import type { LucideIcon } from "lucide-react";
import { PieChart, PiggyBank, TrendingUp, Receipt } from "lucide-react";

export type HomeRoute = {
  title: string;
  description: string;
  href: string;
  cta: string;
  icon?: LucideIcon;
  hint?: string;
  accentClass?: string;

  iconBgClass?: string;
  iconColorClass?: string;
};

export const HOME_ROUTES: HomeRoute[] = [
  {
    title: "Orçamento",
    description: "Organizar finanças mensais",
    href: "/budget",
    cta: "Ver Orçamento",
    icon: PieChart,
    hint: "Mensal",
    accentClass: "from-emerald-500/15",
    iconBgClass: "bg-emerald-500/10",
    iconColorClass: "text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "Cofrinho",
    description: "Planejamento de metas financeiras",
    href: "/piggy-bank",
    cta: "Ir para Cofrinho",
    icon: PiggyBank,
    hint: "Metas",
    accentClass: "from-violet-500/15",
    iconBgClass: "bg-violet-500/10",
    iconColorClass: "text-violet-600 dark:text-violet-400",
  },
  {
    title: "Investimentos",
    description: "Acompanhar seus investimentos",
    href: "/investments",
    cta: "Abrir Investimentos",
    icon: TrendingUp,
    hint: "Carteira",
    accentClass: "from-sky-500/15",
    iconBgClass: "bg-sky-500/10",
    iconColorClass: "text-sky-600 dark:text-sky-400",
  },
  {
    title: "Parcelas",
    description: "Acompanhar parcelas de contas fixas",
    href: "/installments",
    cta: "Ir para Parcelas",
    icon: Receipt,
    hint: "Contas",
    accentClass: "from-amber-500/15",
    iconBgClass: "bg-amber-500/10",
    iconColorClass: "text-amber-700 dark:text-amber-400",
  },
];
