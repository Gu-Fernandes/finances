import { PiggyBank } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { formatBRL } from "./piggy-bank.utils";

type Props = {
  total: number;
  filledMonths: number;
};

export function PiggyBankSummary({ total, filledMonths }: Props) {
  const monthsTotal = 12;
  const pct = Math.max(
    0,
    Math.min(100, Math.round((filledMonths / monthsTotal) * 100)),
  );

  const avg = filledMonths > 0 ? Math.round(total / filledMonths) : 0;
  const projection = avg * monthsTotal;
  const remaining = Math.max(0, monthsTotal - filledMonths);

  return (
    <Card className="overflow-hidden rounded-2xl">
      <CardHeader className="pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl ring-1 ring-border bg-muted/30">
              <PiggyBank className="size-5 text-muted-foreground" />
            </span>

            <div className="space-y-0.5">
              <CardTitle className="text-base">Cofrinho</CardTitle>
              <p className="text-xs text-muted-foreground">Progresso do ano</p>
            </div>
          </div>

          <Badge variant="secondary" className="tabular-nums">
            {filledMonths}/{monthsTotal} meses
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Montante acumulado</p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums break-words">
            {formatBRL(total)}
          </p>
        </div>

        <div className="space-y-2 sm:text-right">
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <p className="text-sm text-muted-foreground">Meses preenchidos</p>
            <p className="text-base font-semibold tabular-nums">
              {filledMonths}
            </p>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-muted sm:ml-auto sm:w-56">
            <div
              className={cn("h-full rounded-full bg-primary")}
              style={{ width: `${pct}%` }}
            />
          </div>

          <p className="text-xs text-muted-foreground tabular-nums sm:text-right">
            {pct}%
          </p>
        </div>

        {/* Insights rápidos (cara de produto) */}
        <div className="sm:col-span-2 flex flex-wrap gap-2">
          <Badge variant="outline" className="tabular-nums">
            Média {formatBRL(avg)}/mês
          </Badge>
          <Badge variant="outline" className="tabular-nums">
            Projeção {formatBRL(projection)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
