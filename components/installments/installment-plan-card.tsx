"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock4,
  MoreVertical,
  Pencil,
  ReceiptText,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  InstallmentPlan,
  useInstallmentsStore,
} from "@/store/installments.store";
import { cn } from "@/lib/utils";

import { EditInstallmentDialog } from "./edit-installment-dialog";

function formatBRL(cents: number) {
  return ((cents || 0) / 100).toLocaleString("pt-BR", {
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

function Stat({
  label,
  value,
  className,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn("rounded-lg border p-3", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-semibold tabular-nums text-sm sm:text-base leading-tight",
          valueClassName,
        )}
      >
        {value}
      </p>
    </div>
  );
}

type Props = { plan: InstallmentPlan };

export function InstallmentPlanCard({ plan }: Props) {
  const togglePaid = useInstallmentsStore((s) => s.togglePaid);
  const removePlan = useInstallmentsStore((s) => s.removePlan);

  const [expanded, setExpanded] = React.useState(false);

  // ações
  const [actionsOpen, setActionsOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const first = React.useMemo(
    () => new Date(plan.firstDueDateISO),
    [plan.firstDueDateISO],
  );

  const paidCount = React.useMemo(() => {
    let acc = 0;
    for (let i = 0; i < plan.paid.length; i++) if (plan.paid[i]) acc += 1;
    return acc;
  }, [plan.paid]);

  const remainingCount = Math.max(0, plan.count - paidCount);

  const installmentTotalCents = plan.installmentCents * plan.count;
  const paidCents = paidCount * plan.installmentCents;
  const remainingCents = Math.max(0, installmentTotalCents - paidCents);

  const progressPct =
    plan.count > 0 ? Math.round((paidCount / plan.count) * 100) : 0;

  const nextOpenIndex = React.useMemo(() => {
    for (let i = 0; i < plan.count; i++) {
      if (!(plan.paid[i] ?? false)) return i;
    }
    return null;
  }, [plan.count, plan.paid]);

  const nextDue = React.useMemo(() => {
    if (nextOpenIndex == null) return null;
    return dueDateFromFirst(first, nextOpenIndex);
  }, [first, nextOpenIndex]);

  const status = React.useMemo(() => {
    if (paidCount >= plan.count && plan.count > 0) {
      return {
        label: "Concluído",
        variant: "secondary" as const,
        Icon: CheckCircle2,
      };
    }

    if (nextDue) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const due = new Date(nextDue);
      due.setHours(0, 0, 0, 0);

      if (due < today) {
        return {
          label: "Atrasado",
          variant: "destructive" as const,
          Icon: AlertTriangle,
        };
      }
    }

    return { label: "Em dia", variant: "outline" as const, Icon: Clock4 };
  }, [paidCount, plan.count, nextDue]);

  const markNextAsPaid = React.useCallback(() => {
    if (nextOpenIndex == null) return;
    togglePaid(plan.id, nextOpenIndex);
  }, [nextOpenIndex, plan.id, togglePaid]);

  // mobile: mostra 4 e expande
  const mobileVisibleCount = expanded ? plan.count : Math.min(plan.count, 4);
  const canExpandMobile = plan.count > 4;

  const canMarkNext = nextOpenIndex != null && paidCount < plan.count;

  function openEdit() {
    setActionsOpen(false);
    setEditOpen(true);
  }

  function openDelete() {
    setActionsOpen(false);
    setDeleteOpen(true);
  }

  return (
    <>
      <Card className="h-full">
        <CardHeader className="space-y-4">
          {/* ✅ OPÇÃO 2: Título em cima, ações podem descer no mobile sem quebrar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            {/* ESQUERDA (flexível) */}
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <div className="shrink-0 rounded-md border bg-primary/5 p-1.5 text-primary">
                  <ReceiptText className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <CardTitle className="truncate text-lg">
                    {plan.name}
                  </CardTitle>
                </div>
              </div>

              <p className="mt-1 truncate text-xs text-muted-foreground">
                {plan.count}x de {formatBRL(plan.installmentCents)}
              </p>
            </div>

            {/* DIREITA (fixa) */}
            <div className="flex shrink-0 items-center justify-end gap-2 whitespace-nowrap">
              <Badge variant={status.variant} className="gap-1.5 max-w-[140px]">
                <status.Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{status.label}</span>
              </Badge>

              {/* Ações (sem dropdown-menu) */}
              <Popover open={actionsOpen} onOpenChange={setActionsOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon-sm" aria-label="Ações">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent align="end" className="w-44 p-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    onClick={openEdit}
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                    onClick={openDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </Button>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Progresso */}
          <div className="space-y-2">
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {paidCount}/{plan.count} pagas
              </span>
              <span>{progressPct}%</span>
            </div>
          </div>

          {/* Insights */}
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-xs">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Próximo:</span>
              <span className="font-medium text-foreground">
                {nextDue
                  ? format(nextDue, "dd/MM/yyyy", { locale: ptBR })
                  : "—"}
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-xs">
              <span className="text-muted-foreground">Restantes:</span>
              <span className="font-medium text-foreground">
                {remainingCount}
              </span>
            </div>
          </div>

          {/* CTA: marcar próxima como paga */}
          {canMarkNext ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={markNextAsPaid}
              className="w-full gap-2"
            >
              <Check className="h-4 w-4" />
              Marcar próxima ({parcelaLabel(nextOpenIndex!)}) como paga
            </Button>
          ) : null}

          {/* Resumo */}
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Pago" value={formatBRL(paidCents)} />
            <Stat label="Restante" value={formatBRL(remainingCents)} />

            <Stat
              label="Total"
              value={formatBRL(installmentTotalCents)}
              className="col-span-2 border-primary/20 bg-primary/5 text-center"
              valueClassName="text-base sm:text-lg"
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Desktop */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parcela</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-center">Pago</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {Array.from({ length: plan.count }).map((_, i) => {
                  const due = dueDateFromFirst(first, i);
                  const isPaid = plan.paid[i] ?? false;

                  return (
                    <TableRow
                      key={i}
                      className={isPaid ? "opacity-60" : undefined}
                    >
                      <TableCell className="font-medium">
                        {parcelaLabel(i)}
                      </TableCell>

                      <TableCell>
                        {format(due, "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>

                      <TableCell className="text-right">
                        {formatBRL(plan.installmentCents)}
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={isPaid}
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

          {/* Mobile */}
          <div className="space-y-4 md:hidden">
            {Array.from({ length: mobileVisibleCount }).map((_, i) => {
              const due = dueDateFromFirst(first, i);
              const isPaid = plan.paid[i] ?? false;

              return (
                <div key={i} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {parcelaLabel(i)} •{" "}
                        {format(due, "MMM 'de' yyyy", { locale: ptBR })}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Vence em {format(due, "dd/MM/yyyy", { locale: ptBR })}
                      </p>

                      <p className="text-sm font-semibold tabular-nums">
                        {formatBRL(plan.installmentCents)}
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-2 pr-1">
                      <p className="text-xs text-muted-foreground">Pago</p>
                      <Checkbox
                        checked={isPaid}
                        onCheckedChange={() => togglePaid(plan.id, i)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {canExpandMobile ? (
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

      {/* Editar */}
      <EditInstallmentDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        plan={plan}
      />

      {/* Confirmar exclusão */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir plano?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá{" "}
              <span className="font-medium text-foreground">{plan.name}</span> e
              todas as parcelas marcadas. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removePlan(plan.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
