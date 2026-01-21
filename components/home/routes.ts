export type HomeRoute = {
  title: string;
  description: string;
  href: string;
  cta: string;
};

export const HOME_ROUTES: HomeRoute[] = [
  {
    title: "Orçamento",
    description: "Ir para finanças mensais",
    href: "/budget",
    cta: "Ver Orçamento",
  },
  {
    title: "Cofrinho",
    description: "Planejamento de metas financeiras",
    href: "/piggy-bank",
    cta: "Ir para Cofrinho",
  },
  {
    title: "Investimentos",
    description: "Acompanhar seus investimentos",
    href: "/investments",
    cta: "Abrir Investimentos",
  },
  {
    title: "Parcelas",
    description: "Acompanhar parcelas de contas fixas",
    href: "/installments",
    cta: "Ir para Parcelas",
  },
];
