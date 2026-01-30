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
      <header className="flex items-center justify-between gap-3">
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
      </header>

      <InstallmentsScreen />
    </main>
  );
}
