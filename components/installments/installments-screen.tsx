"use client";

import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  CalendarClock,
  Layers3,
  Plus,
  Search,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type { InstallmentPlan } from "@/store/installments.store";
import { useInstallmentsStore } from "@/store/installments.store";

import { AddInstallmentDialog } from "./add-installment-dialog";
import { InstallmentPlanCard } from "./installment-plan-card";

/* ----------------------------- helpers ----------------------------- */

type PlanStatus = "overdue" | "ok" | "done";
type FilterKey = "all" | PlanStatus;

function formatBRLFromCents(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((cents || 0) / 100);
}

function startOfDayLocal(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
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

function computePaidCount(plan: InstallmentPlan) {
  let acc = 0;
  for (let i = 0; i < plan.paid.length; i++) if (plan.paid[i]) acc += 1;
  return acc;
}

function computeNextOpenIndex(plan: InstallmentPlan) {
  for (let i = 0; i < plan.count; i++) if (!(plan.paid[i] ?? false)) return i;
  return null;
}

function planMeta(plan: InstallmentPlan) {
  const today = startOfDayLocal(new Date());
  const paidCount = computePaidCount(plan);

  const isDone = plan.count > 0 && paidCount >= plan.count;
  const nextOpenIndex = isDone ? null : computeNextOpenIndex(plan);

  const first = new Date(plan.firstDueDateISO);
  const nextDue =
    nextOpenIndex == null ? null : dueDateFromFirst(first, nextOpenIndex);

  let status: PlanStatus = "ok";
  if (isDone) status = "done";
  else if (nextDue && startOfDayLocal(nextDue).getTime() < today.getTime())
    status = "overdue";

  const remainingCount = Math.max(0, plan.count - paidCount);

  const contractedCents = (plan.installmentCents ?? 0) * (plan.count ?? 0);
  const remainingCents = remainingCount * (plan.installmentCents ?? 0);
  const monthlyCents = remainingCount > 0 ? (plan.installmentCents ?? 0) : 0;

  return {
    status,
    paidCount,
    remainingCount,
    nextDue,
    contractedCents,
    remainingCents,
    monthlyCents,
  };
}

function statusPriority(s: PlanStatus) {
  // menor = vem primeiro
  if (s === "overdue") return 0;
  if (s === "ok") return 1;
  return 2; // done
}

/* ----------------------------- UI bits ----------------------------- */

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
        active
          ? "border-primary/20 bg-primary/10 text-foreground"
          : "bg-background hover:bg-muted/40 text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

function StatLine({
  label,
  value,
  Icon,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  Icon: React.ComponentType<{ className?: string }>;
  valueClassName?: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="shrink-0 rounded-lg border bg-primary/5 p-2 text-primary">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={cn(
            "mt-1 truncate font-semibold tabular-nums",
            valueClassName,
          )}
        >
          {value}
        </p>
      </div>
    </div>
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

function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhum resultado com os filtros atuais.
        </p>

        <Button variant="outline" onClick={onClear}>
          Limpar filtros
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

/* ----------------------------- dashboard ----------------------------- */

function InstallmentsDashboard({
  plans,
  filter,
  onFilter,
  query,
  onQuery,
}: {
  plans: InstallmentPlan[];
  filter: FilterKey;
  onFilter: (k: FilterKey) => void;
  query: string;
  onQuery: (v: string) => void;
}) {
  const dash = useMemo(() => {
    let overdue = 0;
    let done = 0;
    let ok = 0;

    let overdueCents = 0;
    let monthlyCents = 0;
    let remainingCents = 0;

    let nextDue: Date | null = null;
    const today = startOfDayLocal(new Date());

    for (const p of plans) {
      const m = planMeta(p);

      if (m.status === "overdue") {
        overdue += 1;
        // soma do plano em aberto (não só uma parcela) dá “peso” financeiro real
        overdueCents += m.remainingCents;
      } else if (m.status === "done") done += 1;
      else ok += 1;

      monthlyCents += m.monthlyCents;
      remainingCents += m.remainingCents;

      // próximo vencimento global (entre qualquer parcela em aberto)
      if (m.status !== "done" && m.nextDue) {
        const d = startOfDayLocal(m.nextDue);
        if (!nextDue || d.getTime() < startOfDayLocal(nextDue).getTime()) {
          nextDue = m.nextDue;
        }
      }
    }

    const active = overdue + ok;

    return {
      total: plans.length,
      active,
      overdue,
      ok,
      done,
      overdueCents,
      monthlyCents,
      remainingCents,
      nextDue,
      today,
    };
  }, [plans]);

  return (
    <Card className="bg-background/60 backdrop-blur">
      <CardContent className="space-y-4 p-4">
        {/* Top metrics */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatLine
            label="Contas parceladas"
            value={dash.active}
            Icon={Layers3}
          />

          <StatLine
            label="Total mensal (ativas)"
            value={formatBRLFromCents(dash.monthlyCents)}
            Icon={CalendarClock}
          />

          <StatLine
            label="Restante total"
            value={formatBRLFromCents(dash.remainingCents)}
            Icon={Wallet}
            valueClassName="text-primary"
          />
        </div>

        {/* Secondary row: next due + overdue */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl border bg-muted/10 p-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                Próximo vencimento
              </p>
              <p className="mt-1 truncate font-semibold tabular-nums">
                {dash.nextDue
                  ? format(dash.nextDue, "dd/MM/yyyy", { locale: ptBR })
                  : "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border bg-muted/10 p-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg border bg-destructive/10 p-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Atrasados</p>
                <p className="mt-1 font-semibold tabular-nums">
                  {dash.overdue} plano(s)
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-muted-foreground">Em aberto</p>
              <p className="mt-1 font-semibold tabular-nums text-destructive">
                {formatBRLFromCents(dash.overdueCents)}
              </p>
            </div>
          </div>
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Chip active={filter === "all"} onClick={() => onFilter("all")}>
              Todos{" "}
              <span className="text-muted-foreground">({dash.total})</span>
            </Chip>

            <Chip
              active={filter === "overdue"}
              onClick={() => onFilter("overdue")}
            >
              Atrasados{" "}
              <span className="text-muted-foreground">({dash.overdue})</span>
            </Chip>

            <Chip active={filter === "ok"} onClick={() => onFilter("ok")}>
              Em dia <span className="text-muted-foreground">({dash.ok})</span>
            </Chip>

            <Chip active={filter === "done"} onClick={() => onFilter("done")}>
              Concluídos{" "}
              <span className="text-muted-foreground">({dash.done})</span>
            </Chip>
          </div>

          <div className="relative w-full sm:w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Buscar..."
              className="pl-9"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ----------------------------- screen ----------------------------- */

export function InstallmentsScreen() {
  const plans = useInstallmentsStore((s) => s.plans);

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();

    const list = plans
      .map((p) => {
        const m = planMeta(p);
        return { plan: p, meta: m };
      })
      .filter(({ plan, meta }) => {
        if (filter !== "all" && meta.status !== filter) return false;
        if (!q) return true;
        return (plan.name ?? "").toLowerCase().includes(q);
      })
      .sort((a, b) => {
        // prioridade: overdue -> ok -> done
        const pa = statusPriority(a.meta.status);
        const pb = statusPriority(b.meta.status);
        if (pa !== pb) return pa - pb;

        // dentro da categoria: por próximo vencimento (null por último)
        const da = a.meta.nextDue
          ? startOfDayLocal(a.meta.nextDue).getTime()
          : Number.POSITIVE_INFINITY;
        const db = b.meta.nextDue
          ? startOfDayLocal(b.meta.nextDue).getTime()
          : Number.POSITIVE_INFINITY;
        if (da !== db) return da - db;

        // fallback estável
        return (a.plan.name ?? "").localeCompare(b.plan.name ?? "");
      });

    return list.map((x) => x.plan);
  }, [plans, filter, query]);

  const activeIndexClamped = Math.min(
    activeIndex,
    Math.max(0, visible.length - 1),
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

  // ao adicionar novo plano: se estiver em "Todos" e sem busca, rola pro fim
  const prevLenRef = useRef(plans.length);
  useEffect(() => {
    if (plans.length > prevLenRef.current) {
      const canAutoScroll = filter === "all" && query.trim().length === 0;
      if (canAutoScroll) {
        requestAnimationFrame(() =>
          scrollToIndex(Math.max(0, visible.length - 1)),
        );
      }
    }
    prevLenRef.current = plans.length;
  }, [plans.length, filter, query, scrollToIndex, visible.length]);

  function handleFilter(next: FilterKey) {
    setFilter(next);
    setActiveIndex(0);
    requestAnimationFrame(() => scrollToIndex(0));
  }

  function handleQuery(next: string) {
    setQuery(next);
    setActiveIndex(0);
    requestAnimationFrame(() => scrollToIndex(0));
  }

  function clearFilters() {
    setFilter("all");
    setQuery("");
    setActiveIndex(0);
    requestAnimationFrame(() => scrollToIndex(0));
  }

  return (
    <div className="space-y-4">
      {/* Dashboard + CTA */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <InstallmentsDashboard
            plans={plans}
            filter={filter}
            onFilter={handleFilter}
            query={query}
            onQuery={handleQuery}
          />
        </div>

        <Button type="button" onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>

      {plans.length === 0 ? (
        <EmptyState onAdd={() => setOpen(true)} />
      ) : visible.length === 0 ? (
        <NoResults onClear={clearFilters} />
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
              {visible.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    "shrink-0 snap-center",
                    "w-[calc(100vw-2rem)] sm:w-[520px] lg:w-[560px]",
                  )}
                >
                  <InstallmentPlanCard plan={plan} />
                </div>
              ))}
            </div>
          </div>

          <Dots
            total={visible.length}
            active={activeIndexClamped}
            onSelect={scrollToIndex}
          />
        </>
      )}

      <AddInstallmentDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
