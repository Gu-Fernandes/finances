import Link from "next/link";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type RouteCardProps = {
  title: string;
  description: string;
  href: string;
  cta: string; // mantido por compatibilidade
  icon?: string;
  hint?: string;
  accentClass?: string;
};

export function RouteCard({
  title,
  description,
  href,
  icon,
  hint,
  accentClass,
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
                {icon ? (
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-xl bg-muted ring-1 ring-border",
                      "transition-transform group-hover:-translate-y-0.5",
                    )}
                  >
                    {icon}
                  </span>
                ) : null}

                <p className="line-clamp-1 font-semibold leading-none">
                  {title}
                </p>
              </div>

              <p className="line-clamp-2 text-sm text-muted-foreground">
                {description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {hint ? (
                <span className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground ring-1 ring-border">
                  {hint}
                </span>
              ) : null}

              <span className="text-primary/70 transition-all group-hover:text-primary group-hover:translate-x-1">
                →
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
