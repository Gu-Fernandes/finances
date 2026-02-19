"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, Hash, ReceiptText, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { MoneyInput } from "@/components/ui/money-input";
import { cn } from "@/lib/utils";

type FormValues = {
  name: string;
  installmentCents: number;
  count: number;
  firstDueDateISO: string;
};

type Initial = Partial<FormValues>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title: string;
  description?: string;
  submitLabel: string;

  initial?: Initial;
  onSubmit: (values: FormValues) => void;

  // opcional: texto de ajuda no rodapé do resumo
  helper?: string;
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

function SummaryItem({
  icon,
  label,
  value,
  strong,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg border bg-primary/5 p-2 text-primary">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={cn(
            "mt-1 tabular-nums whitespace-nowrap",
            strong ? "text-base font-semibold" : "text-sm font-medium",
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export function InstallmentPlanFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  initial,
  onSubmit,
  helper,
}: Props) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const [name, setName] = React.useState("");
  const [installmentFormatted, setInstallmentFormatted] = React.useState("");
  const [installmentCents, setInstallmentCents] = React.useState(0);
  const [countRaw, setCountRaw] = React.useState("");
  const [firstDueDate, setFirstDueDate] = React.useState<Date | undefined>();

  // Prefill sempre que abrir (tanto add quanto edit)
  React.useEffect(() => {
    if (!open) return;

    const initName = initial?.name ?? "";
    const initCents = initial?.installmentCents ?? 0;
    const initCount = initial?.count ?? 0;
    const initDate = initial?.firstDueDateISO
      ? new Date(initial.firstDueDateISO)
      : undefined;

    setName(initName);
    setInstallmentCents(initCents);
    setInstallmentFormatted(initCents ? formatBRLFromCents(initCents) : "");
    setCountRaw(initCount ? String(initCount) : "");
    setFirstDueDate(initDate);
  }, [
    open,
    initial?.name,
    initial?.installmentCents,
    initial?.count,
    initial?.firstDueDateISO,
  ]);

  const count = React.useMemo(() => parseCount(countRaw), [countRaw]);
  const totalCents = installmentCents * count;

  const canSave =
    name.trim().length > 0 &&
    installmentCents > 0 &&
    count >= 1 &&
    Boolean(firstDueDate);

  function handleClose(nextOpen: boolean) {
    onOpenChange(nextOpen);
  }

  function handleSave() {
    if (!canSave || !firstDueDate) return;

    onSubmit({
      name: name.trim(),
      installmentCents,
      count,
      firstDueDateISO: firstDueDate.toISOString(),
    });

    handleClose(false);
  }

  // Enter salva (se válido)
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-lg"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
      >
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-xl border bg-primary/5 p-2 text-primary">
              <ReceiptText className="h-5 w-5" />
            </div>

            <div className="space-y-1">
              <DialogTitle>{title}</DialogTitle>
              {description ? (
                <DialogDescription>{description}</DialogDescription>
              ) : null}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5" onKeyDown={onKeyDown}>
          {/* Nome */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Nome</p>
            <Input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Internet, Celular, Academia..."
            />
          </div>

          {/* Valor */}
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

          {/* Quantidade */}
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
              className="text-right tabular-nums"
            />
          </div>

          {/* Resumo / Preview */}
          <div className="rounded-xl border bg-muted/20 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <SummaryItem
                icon={<Wallet className="h-4 w-4" />}
                label="Total"
                value={formatBRLFromCents(totalCents)}
                strong
              />

              <SummaryItem
                icon={<Hash className="h-4 w-4" />}
                label="Parcelas"
                value={count ? `${count}x` : "—"}
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-sm">
                <p className="font-medium">1º vencimento</p>
                <p className="text-xs text-muted-foreground">
                  O dia será replicado nos próximos meses.
                </p>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start gap-2">
                    <CalendarDays className="h-4 w-4" />
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

            {helper ? (
              <p className="mt-3 text-xs text-muted-foreground">{helper}</p>
            ) : null}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
