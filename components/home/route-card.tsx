import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type RouteCardProps = {
  title: string;
  description: string;
  href: string;
  cta: string;
  icon?: string;
  hint?: string;
  accentClass?: string;
};

export function RouteCard({
  title,
  description,
  href,
  cta,
  icon,
  hint,
  accentClass,
}: RouteCardProps) {
  return (
    <Card
      className={cn(
        "group relative flex h-full flex-col overflow-hidden",
        "transition-all hover:-translate-y-0.5 hover:shadow-md",
        "hover:border-primary/20",
        "focus-within:ring-2 focus-within:ring-primary/20",
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

      <CardHeader className="relative gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              {icon ? (
                <span className="grid size-9 place-items-center rounded-xl bg-muted ring-1 ring-border">
                  {icon}
                </span>
              ) : null}
              <span>{title}</span>
            </CardTitle>

            <CardDescription className="text-sm">{description}</CardDescription>
          </div>

          {hint ? (
            <span className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground ring-1 ring-border">
              {hint}
            </span>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="relative mt-auto flex items-center justify-end p-4 pt-0">
        <Button size="sm" asChild>
          <Link href={href}>{cta}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
