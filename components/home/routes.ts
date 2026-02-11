export type HomeRoute = {
  title: string;
  description: string;
  href: string;
  cta: string;
  icon?: string;
  hint?: string;
  accentClass?: string;
};

export const HOME_ROUTES: HomeRoute[] = [
  {
    title: "Orçamento",
    description: "Organizar finanças mensais",
    href: "/budget",
    cta: "Ver Orçamento",
    icon: "📊",
    hint: "Mensal",
    accentClass: "from-emerald-500/15",
  },
  {
    title: "Cofrinho",
    description: "Planejamento de metas financeiras",
    href: "/piggy-bank",
    cta: "Ir para Cofrinho",
    icon: "🐷",
    hint: "Metas",
    accentClass: "from-violet-500/15",
  },
  {
    title: "Investimentos",
    description: "Acompanhar seus investimentos",
    href: "/investments",
    cta: "Abrir Investimentos",
    icon: "📈",
    hint: "Carteira",
    accentClass: "from-sky-500/15",
  },
  {
    title: "Parcelas",
    description: "Acompanhar parcelas de contas fixas",
    href: "/installments",
    cta: "Ir para Parcelas",
    icon: "🧾",
    hint: "Contas",
    accentClass: "from-amber-500/15",
  },
];
