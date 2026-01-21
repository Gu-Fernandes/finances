import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PiggyBankTable } from "@/components/piggy-bank/piggy-bank-table";
import { ArrowLeft } from "lucide-react";

export default function PiggyBankPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4">
      <header className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Cofrinho</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe quanto você guardou mês a mês.
          </p>
        </div>

        <Button variant="outline" size="icon-sm">
          <Link href="/">
            {" "}
            <ArrowLeft />
          </Link>
        </Button>
      </header>

      <PiggyBankTable />
    </main>
  );
}
