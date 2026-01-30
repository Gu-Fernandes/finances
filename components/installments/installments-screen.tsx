"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useInstallmentsStore } from "@/store/installments.store";
import { AddInstallmentDialog } from "./add-installment-dialog";
import { InstallmentPlanCard } from "./installment-plan-card";

export function InstallmentsScreen() {
  const plans = useInstallmentsStore((s) => s.plans);
  const [open, setOpen] = useState(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeIndexClamped = useMemo(() => {
    const max = Math.max(0, plans.length - 1);
    return Math.min(activeIndex, max);
  }, [activeIndex, plans.length]);

  useEffect(() => {
    setActiveIndex(activeIndexClamped);
  }, [activeIndexClamped]);

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
    <div className="space-y-3">
      {plans.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Nenhum item adicionado ainda.
        </p>
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

          {plans.length > 1 ? (
            <div className="flex justify-center gap-2 pt-1">
              {plans.map((_, idx) => (
                <button
                  key={`dot-${idx}`}
                  type="button"
                  aria-label={`Ir para ${idx + 1}`}
                  onClick={() => scrollToIndex(idx)}
                  className={cn(
                    "h-2 w-2 rounded-full transition",
                    idx === activeIndexClamped
                      ? "bg-foreground"
                      : "bg-muted-foreground/30",
                  )}
                />
              ))}
            </div>
          ) : null}
        </>
      )}

      <div className="flex justify-end py-5">
        <Button type="button" onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>

      <AddInstallmentDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
