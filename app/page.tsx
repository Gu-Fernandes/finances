import { RouteCard } from "@/components/home/route-card";
import { HOME_ROUTES } from "@/components/home/routes";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      <header className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8 shadow-sm">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            MyFinances App
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Escolha uma área para começar e organizar sua vida financeira.
          </p>
        </div>
      </header>

      <section>
        <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {HOME_ROUTES.map((r) => (
            <div key={r.href} className="h-full">
              <RouteCard {...r} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
