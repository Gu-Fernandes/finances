import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type RouteCardProps = {
  title: string;
  description: string;
  href: string;
  cta: string;
  icon?: LucideIcon;
  hint?: string;
  accentClass?: string;
  iconBgClass?: string;
  iconColorClass?: string;
};

export function RouteCard({
  title,
  description,
  href,
  icon: Icon,
  hint,
  accentClass,
  iconBgClass,
  iconColorClass,
}: RouteCardProps) {
  return (
    <Link
      href={href}
      className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
    >
      <Card
        className={cn(
          "group relative h-full overflow-hidden rounded-2xl",
          "transition-all hover:-translate-y-0.5 hover:shadow-md",
          "hover:border-primary/20",
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100",
            "bg-gradient-to-br",
            accentClass ?? "from-primary/10",
            "via-transparent to-transparent",
          )}
        />

        <div className="relative p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {Icon ? (
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-xl ring-1 ring-border",
                      "transition-all duration-200",
                      "group-hover:scale-[1.04] group-hover:-translate-y-[1px]",
                      "motion-reduce:transition-none motion-reduce:transform-none",
                      iconBgClass ?? "bg-muted",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-5 text-muted-foreground transition-all duration-200",
                        "group-hover:rotate-3 group-hover:scale-[1.06]",
                        "motion-reduce:transition-none motion-reduce:transform-none",
                        iconColorClass,
                        "group-hover:text-foreground/80",
                      )}
                    />
                  </span>
                ) : null}

                <p className="font-semibold leading-none">{title}</p>
              </div>

              <p className="text-sm text-muted-foreground">{description}</p>
            </div>

            <div className="flex items-center gap-2">
              {hint ? (
                <span className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground ring-1 ring-border">
                  {hint}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
