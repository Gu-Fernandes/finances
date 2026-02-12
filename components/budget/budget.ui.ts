export const BUDGET_UI = {
  income: {
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-600 dark:text-emerald-400",
    gradientFrom: "from-emerald-500/15",
    badgeOutline: "border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
    value: "text-primary",
  },
  expense: {
    iconBg: "bg-rose-500/10",
    iconText: "text-rose-600 dark:text-rose-400",
    gradientFrom: "from-rose-500/15",
    badgeOutline: "border-rose-500/30 text-rose-600 dark:text-rose-400",
    value: "text-destructive",
  },
  invested: {
    iconBg: "bg-violet-500/10",
    iconText: "text-violet-600 dark:text-violet-400",
    gradientFrom: "from-violet-500/15",
    badgeOutline: "border-violet-500/30 text-violet-600 dark:text-violet-400",
    value: "text-muted-foreground",
  },
  net: {
    iconBg: "bg-sky-500/10",
    iconText: "text-sky-600 dark:text-sky-400",
    gradientFrom: "from-sky-500/15",
    badgeOutline: "border-sky-500/30 text-sky-600 dark:text-sky-400",
  },
} as const;
