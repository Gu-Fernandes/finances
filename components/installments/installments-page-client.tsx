"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { useAppStore } from "@/store/app-store";

import { InstallmentsScreen } from "@/components/installments/installments-screen";

export function InstallmentsPageClient() {
  const { ready } = useAppStore();

  if (!ready) return <Loading />;

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4">
      {/* Hero / Cabeçalho */}
      <header className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Parcelas</h1>
            <p className="text-sm text-muted-foreground">
              Controle as parcelas das suas contas fixas.
            </p>
          </div>

          <Button variant="outline" size="icon-sm" asChild>
            <Link href="/" aria-label="Voltar">
              <ArrowLeft />
            </Link>
          </Button>
        </div>
      </header>

      <InstallmentsScreen />
    </main>
  );
}
