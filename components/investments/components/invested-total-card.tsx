"use client";

import { useMemo } from "react";
import { ArrowDown, ArrowLeft, ArrowUp } from "lucide-react";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useInvestmentsStore } from "@/store/investments.store";

import { formatBRLFromCents } from "./utils/money";

function parseQty(raw: string) {
  const v = (raw ?? "").trim();
  if (!v) return 0;

  const hasComma = v.includes(",");
  const normalized = hasComma ? v.replace(/\./g, "").replace(",", ".") : v;
  const num = Number(normalized.replace(/[^\d.-]/g, ""));
  return Number.isFinite(num) ? num : 0;
}

function parseIntSafe(raw: string) {
  const v = (raw ?? "").trim();
  if (!v) return 0;
  const n = Number(v.replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function getProfitBadgeMeta(profitCents: number) {
  const isNegative = profitCents < 0;

  return {
    Icon: isNegative ? ArrowDown : ArrowUp,
    variant: (isNegative ? "destructive" : "default") as
      | "default"
      | "destructive",
  };
}

export function InvestedTotalCard() {
  const { ready, fixedIncome, funds, treasuryDirect, crypto, stocks } =
    useInvestmentsStore();

  const totals = useMemo(() => {
    const fixedApplied = fixedIncome.reduce(
      (acc, it) => acc + (it.appliedCents || 0),
      0,
    );
    const fixedCurrent = fixedIncome.reduce(
      (acc, it) => acc + (it.currentCents || 0),
      0,
    );

    const fundsApplied = funds.reduce(
      (acc, it) => acc + (it.appliedCents || 0),
      0,
    );
    const fundsCurrent = funds.reduce(
      (acc, it) => acc + (it.currentCents || 0),
      0,
    );

    const treasuryApplied = treasuryDirect.reduce(
      (acc, it) => acc + (it.appliedCents || 0),
      0,
    );
    const treasuryCurrent = treasuryDirect.reduce(
      (acc, it) => acc + (it.currentCents || 0),
      0,
    );

    const cryptoApplied = crypto.reduce(
      (acc, it) => acc + (it.appliedCents || 0),
      0,
    );
    const cryptoCurrent = crypto.reduce(
      (acc, it) => acc + (it.currentCents || 0),
      0,
    );

    const stocksApplied = stocks.reduce((acc, it) => {
      const qty = parseQty(it.quantity);
      return acc + Math.round((it.avgPriceCents || 0) * qty);
    }, 0);

    const stocksCurrent = stocks.reduce((acc, it) => {
      const qty = parseQty(it.quantity);
      return acc + Math.round((it.currentQuoteCents || 0) * qty);
    }, 0);

    // ✅ soma de dividendos (Total dividendos = dividendCents * meses)
    const stocksDividends = stocks.reduce((acc, it) => {
      const months = parseIntSafe(it.dividendMonths ?? "");
      return acc + (it.dividendCents || 0) * months;
    }, 0);

    const totalAppliedCents =
      fixedApplied +
      fundsApplied +
      treasuryApplied +
      cryptoApplied +
      stocksApplied;

    const totalCurrentCents =
      fixedCurrent +
      fundsCurrent +
      treasuryCurrent +
      cryptoCurrent +
      stocksCurrent;

    // ✅ lucro/perda incluindo dividendos recebidos
    const totalProfitCents =
      totalCurrentCents - totalAppliedCents + stocksDividends;

    return { totalCurrentCents, totalProfitCents };
  }, [fixedIncome, funds, treasuryDirect, crypto, stocks]);

  const meta = getProfitBadgeMeta(totals.totalProfitCents);

  return (
    <Card className="p-5">
      <div className="space-y-3">
        <div className="relative flex items-center">
          <Button asChild variant="outline" size="icon-sm">
            <Link href="/" aria-label="Voltar">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <p className="absolute left-1/2 -translate-x-1/2 text-sm text-muted-foreground">
            Total investido
          </p>
        </div>

        <div className="text-center">
          <p className="text-2xl font-semibold">
            {ready ? formatBRLFromCents(totals.totalCurrentCents) : "—"}
          </p>
        </div>

        {ready && (
          <div className="flex w-full items-center justify-between gap-3 px-6 sm:px-10">
            <p className="text-sm text-muted-foreground">Ganhos / Perdas</p>

            <Badge variant={meta.variant} className="gap-1">
              <meta.Icon className="h-4 w-4" />
              {formatBRLFromCents(totals.totalProfitCents)}
            </Badge>
          </div>
        )}
      </div>
    </Card>
  );
}
