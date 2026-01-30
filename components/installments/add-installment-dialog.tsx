"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useInstallmentsStore } from "@/store/installments.store";
import { MoneyInput } from "../ui/money-input";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatBRLFromCents(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((cents || 0) / 100);
}

function parseCount(raw: string) {
  const digits = (raw ?? "").replace(/[^\d]/g, "");
  const n = Number(digits);
  return Number.isFinite(n) ? n : 0;
}

export function AddInstallmentDialog({ open, onOpenChange }: Props) {
  const addPlan = useInstallmentsStore((s) => s.addPlan);

  const [name, setName] = React.useState("");
  const [installmentFormatted, setInstallmentFormatted] = React.useState("");
  const [installmentCents, setInstallmentCents] = React.useState(0);
  const [countRaw, setCountRaw] = React.useState("");
  const [firstDueDate, setFirstDueDate] = React.useState<Date | undefined>();

  const count = React.useMemo(() => parseCount(countRaw), [countRaw]);
  const totalCents = installmentCents * count;

  const canSave =
    name.trim().length > 0 &&
    installmentCents > 0 &&
    count >= 1 &&
    Boolean(firstDueDate);

  function reset() {
    setName("");
    setInstallmentFormatted("");
    setInstallmentCents(0);
    setCountRaw("");
    setFirstDueDate(undefined);
  }

  function handleClose(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) reset();
  }

  function handleSave() {
    if (!canSave || !firstDueDate) return;

    addPlan({
      name: name.trim(),
      installmentCents,
      count,
      firstDueDateISO: firstDueDate.toISOString(),
    });

    handleClose(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar parcelas</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Nome</p>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Internet, Celular, Academia..."
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Valor da parcela</p>
            <MoneyInput
              value={installmentFormatted}
              placeholder="0,00"
              onValueChange={(formatted, cents) => {
                setInstallmentFormatted(formatted);
                setInstallmentCents(cents);
              }}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Quantidade de parcelas
            </p>
            <Input
              inputMode="numeric"
              placeholder="Ex: 12"
              value={countRaw}
              onChange={(e) =>
                setCountRaw(e.target.value.replace(/[^\d]/g, ""))
              }
              className="text-right"
            />
          </div>

          <div className="space-y-3 rounded-lg border p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Valor total</span>
              <span className="font-medium">
                {formatBRLFromCents(totalCents)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="text-sm">
                <p className="font-medium">Vencimentos</p>
                <p className="text-xs text-muted-foreground">
                  Escolha o 1º vencimento. O dia será replicado nos próximos
                  meses.
                </p>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    {firstDueDate
                      ? format(firstDueDate, "dd/MM/yyyy", { locale: ptBR })
                      : "Escolher data"}
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={firstDueDate}
                    onSelect={setFirstDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
