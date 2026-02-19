"use client";

import { cn } from "@/lib/utils";

function InsightCard({
  tone,
  title,
  description,
}: {
  tone: "primary" | "warning" | "danger";
  title: string;
  description: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        tone === "primary" && "border-primary/20 bg-primary/5",
        tone === "warning" && "border-amber-500/20 bg-amber-500/5",
        tone === "danger" && "border-destructive/20 bg-destructive/5",
      )}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function OverviewInsights({
  incomeTotal,
  expenseTotal,
  netTotal,
  cardTotal,
}: {
  incomeTotal: number;
  expenseTotal: number;
  netTotal: number;
  cardTotal: number;
}) {
  const items: Array<{
    tone: "primary" | "warning" | "danger";
    title: string;
    description: string;
  }> = [];

  if (incomeTotal > 0 && expenseTotal > incomeTotal) {
    items.push({
      tone: "danger",
      title: "Você está no vermelho",
      description:
        "As despesas passaram das receitas. Tente ajustar gastos ou registrar receitas pendentes.",
    });
  } else if (incomeTotal > 0 && expenseTotal / incomeTotal > 0.85) {
    items.push({
      tone: "warning",
      title: "Despesas altas neste mês",
      description:
        "Você já consumiu boa parte do que entrou. Vale revisar cartão e extras.",
    });
  } else if (incomeTotal > 0 && netTotal > 0) {
    items.push({
      tone: "primary",
      title: "Você está no azul",
      description:
        "Sobrou dinheiro após despesas e investido. Bora manter a consistência 😄",
    });
  }

  if (incomeTotal > 0 && cardTotal / incomeTotal > 0.45) {
    items.push({
      tone: "warning",
      title: "Cartão está pesado",
      description:
        "Gastos no cartão estão altos em relação à receita. Talvez impor limite ajude.",
    });
  }

  const insights = items.slice(0, 2);

  if (!insights.length) return null;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {insights.map((i) => (
        <InsightCard
          key={i.title}
          tone={i.tone}
          title={i.title}
          description={i.description}
        />
      ))}
    </div>
  );
}
