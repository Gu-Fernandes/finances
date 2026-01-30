"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  InstallmentPlan,
  useInstallmentsStore,
} from "@/store/installments.store";

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dueDateFromFirst(first: Date, monthOffset: number) {
  const day = first.getDate();
  const year = first.getFullYear();
  const month = first.getMonth() + monthOffset;

  const firstOfTarget = new Date(year, month, 1);
  const lastDay = new Date(
    firstOfTarget.getFullYear(),
    firstOfTarget.getMonth() + 1,
    0,
  ).getDate();

  const finalDay = Math.min(day, lastDay);
  return new Date(
    firstOfTarget.getFullYear(),
    firstOfTarget.getMonth(),
    finalDay,
  );
}

function parcelaLabel(i: number) {
  return `${i + 1}ª`;
}

type Props = { plan: InstallmentPlan };

export function InstallmentPlanCard({ plan }: Props) {
  const togglePaid = useInstallmentsStore((s) => s.togglePaid);
  const [expanded, setExpanded] = React.useState(false);

  const first = React.useMemo(
    () => new Date(plan.firstDueDateISO),
    [plan.firstDueDateISO],
  );

  const installmentTotalCents = plan.installmentCents * plan.count;

  const paidCents = React.useMemo(() => {
    let acc = 0;
    for (let i = 0; i < plan.paid.length; i++) {
      if (plan.paid[i]) acc += plan.installmentCents;
    }
    return acc;
  }, [plan.installmentCents, plan.paid]);

  const remainingCents = Math.max(0, installmentTotalCents - paidCents);

  const mobileVisibleCount = expanded ? plan.count : Math.min(plan.count, 4);

  return (
    <Card className="h-full">
      <CardHeader className="space-y-3">
        <CardTitle className="truncate text-lg">{plan.name}</CardTitle>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-md border p-2">
            <p className="text-xs text-muted-foreground">Pago</p>
            <p className="font-medium">{formatBRL(paidCents)}</p>
          </div>

          <div className="rounded-md border p-2">
            <p className="text-xs text-muted-foreground">Restante</p>
            <p className="font-medium">{formatBRL(remainingCents)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {plan.count}x de {formatBRL(plan.installmentCents)}
          </span>
          <span className="font-medium">
            {formatBRL(installmentTotalCents)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parcela</TableHead>
                <TableHead>Mês</TableHead>
                <TableHead className="text-right">Valor</TableHead>

                <TableHead className="text-center">Pago</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {Array.from({ length: plan.count }).map((_, i) => {
                const due = dueDateFromFirst(first, i);

                return (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      {parcelaLabel(i)}
                    </TableCell>

                    <TableCell>
                      {format(due, "MMM 'de' yyyy", { locale: ptBR })}
                    </TableCell>

                    <TableCell className="text-right">
                      {formatBRL(plan.installmentCents)}
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={plan.paid[i] ?? false}
                          onCheckedChange={() => togglePaid(plan.id, i)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-5 md:hidden">
          {Array.from({ length: mobileVisibleCount }).map((_, i) => {
            const due = dueDateFromFirst(first, i);

            return (
              <div key={i} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {parcelaLabel(i)} -{" "}
                      {format(due, "MMM 'de' yyyy", { locale: ptBR })}
                    </p>

                    <p className="text-sm">
                      {formatBRL(plan.installmentCents)}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-2 pr-1">
                    <p className="text-xs text-muted-foreground">Pago</p>
                    <Checkbox
                      checked={plan.paid[i] ?? false}
                      onCheckedChange={() => togglePaid(plan.id, i)}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {plan.count > 6 ? (
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Mostrar menos" : `Mostrar todas (${plan.count})`}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
