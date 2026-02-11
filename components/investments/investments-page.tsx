"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { useInvestmentsStore } from "@/store/investments.store";

import { InvestedTotalCard } from "./components/invested-total-card";
import { InvestmentsTabsCard } from "./investments-tabs-card";

export function InvestmentsPage() {
  const { ready } = useInvestmentsStore();

  if (!ready) return <Loading />;

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4">
      {/* Hero / Cabeçalho */}
      <header className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Investimentos
            </h1>
            <p className="text-sm text-muted-foreground">
              Visão geral da carteira e performance por categoria.
            </p>
          </div>

          <Button variant="outline" size="icon-sm" asChild>
            <Link href="/" aria-label="Voltar">
              <ArrowLeft />
            </Link>
          </Button>
        </div>

        {/* Toolbar / Resumo */}
        <div className="relative mt-6 rounded-2xl border bg-background/60 p-4 backdrop-blur">
          <InvestedTotalCard variant="inline" />
        </div>
      </header>

      <InvestmentsTabsCard />
    </main>
  );
}
