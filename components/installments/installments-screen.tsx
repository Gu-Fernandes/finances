"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useInstallmentsStore } from "@/store/installments.store";
import { AddInstallmentDialog } from "./add-installment-dialog";
import { InstallmentPlanCard } from "./installment-plan-card";

function formatBRLFromCents(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((cents || 0) / 100);
}

import { Layers3, CalendarClock, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function SummaryItem({
  label,
  value,
  Icon,
}: {
  label: string;
  value: React.ReactNode;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg border bg-primary/5 p-2 text-primary">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={cn("mt-1 font-semibold tabular-nums", "whitespace-nowrap")}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function InstallmentsSummary({ plans }: { plans: Array<any> }) {
  const summary = useMemo(() => {
    const plansCount = plans.length;
    const monthlyCents = plans.reduce(
      (acc, p) => acc + (p.installmentCents ?? 0),
      0,
    );
    const totalCents = plans.reduce(
      (acc, p) => acc + (p.installmentCents ?? 0) * (p.count ?? 0),
      0,
    );

    return { plansCount, monthlyCents, totalCents };
  }, [plans]);

  return (
    <Card className="bg-background/60 backdrop-blur">
      <CardContent className="grid gap-4 p-4 sm:grid-cols-3">
        <SummaryItem
          label="Contas parceladas"
          value={summary.plansCount}
          Icon={Layers3}
        />
        <SummaryItem
          label="Total mensal"
          value={formatBRLFromCents(summary.monthlyCents)}
          Icon={CalendarClock}
        />
        <SummaryItem
          label="Total a pagar"
          value={formatBRLFromCents(summary.totalCents)}
          Icon={Wallet}
        />
      </CardContent>
    </Card>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhuma parcela cadastrada ainda.
        </p>

        <Button onClick={onAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar primeiro plano
        </Button>
      </CardContent>
    </Card>
  );
}

function Dots({
  total,
  active,
  onSelect,
}: {
  total: number;
  active: number;
  onSelect: (idx: number) => void;
}) {
  if (total <= 1) return null;

  return (
    <div className="flex justify-center gap-2 pt-1">
      {Array.from({ length: total }).map((_, idx) => (
        <button
          key={`dot-${idx}`}
          type="button"
          aria-label={`Ir para ${idx + 1}`}
          aria-current={idx === active ? "true" : "false"}
          onClick={() => onSelect(idx)}
          className={cn(
            "h-2 w-2 rounded-full transition",
            idx === active ? "bg-foreground" : "bg-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
}

export function InstallmentsScreen() {
  const plans = useInstallmentsStore((s) => s.plans);
  const [open, setOpen] = useState(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // ✅ Só clamp “na leitura” (sem setState em effect)
  const activeIndexClamped = Math.min(
    activeIndex,
    Math.max(0, plans.length - 1),
  );

  const computeActiveIndex = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;

    const children = Array.from(el.children) as HTMLElement[];
    if (!children.length) return;

    const center = el.scrollLeft + el.clientWidth / 2;

    let bestIdx = 0;
    let bestDist = Number.POSITIVE_INFINITY;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const childCenter = child.offsetLeft + child.clientWidth / 2;
      const dist = Math.abs(childCenter - center);

      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    setActiveIndex(bestIdx);
  }, []);

  const onScroll = useCallback(() => {
    if (rafRef.current) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      computeActiveIndex();
    });
  }, [computeActiveIndex]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const scrollToIndex = useCallback(
    (idx: number) => {
      const el = viewportRef.current;
      if (!el) return;

      const len = el.children.length;
      if (!len) return;

      const safeIdx = Math.max(0, Math.min(idx, len - 1));
      const target = el.children[safeIdx] as HTMLElement | undefined;

      target?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });

      requestAnimationFrame(() => computeActiveIndex());
    },
    [computeActiveIndex],
  );

  const prevLenRef = useRef(plans.length);
  useEffect(() => {
    if (plans.length > prevLenRef.current) {
      requestAnimationFrame(() => scrollToIndex(plans.length - 1));
    }
    prevLenRef.current = plans.length;
  }, [plans.length, scrollToIndex]);

  return (
    <div className="space-y-4">
      {/* Toolbar / Resumo + CTA */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <InstallmentsSummary plans={plans} />
        </div>

        <Button type="button" onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>

      {plans.length === 0 ? (
        <EmptyState onAdd={() => setOpen(true)} />
      ) : (
        <>
          {/* full-bleed no mobile */}
          <div className="-mx-4 sm:mx-0">
            <div
              ref={viewportRef}
              onScroll={onScroll}
              className={cn(
                "flex w-full gap-3 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]",
                "snap-x snap-mandatory scroll-smooth",
                "px-4 sm:px-0",
              )}
            >
              {plans.map((plan) => (
                <div key={plan.id} className="w-full shrink-0 snap-center">
                  <InstallmentPlanCard plan={plan} />
                </div>
              ))}
            </div>
          </div>

          <Dots
            total={plans.length}
            active={activeIndexClamped}
            onSelect={scrollToIndex}
          />
        </>
      )}

      <AddInstallmentDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
