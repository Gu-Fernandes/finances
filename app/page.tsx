import { RouteCard } from "@/components/home/route-card";
import { HOME_ROUTES } from "@/components/home/routes";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-2 p-4">
      <h1 className="text-2xl font-semibold tracking-tight">MyFinances App</h1>
      <p className="text-sm text-muted-foreground">
        Escolha uma área para começar.
      </p>

      <section className="grid gap-4 py-3 sm:grid-cols-2">
        {HOME_ROUTES.map((r) => (
          <RouteCard
            key={r.href}
            title={r.title}
            description={r.description}
            href={r.href}
            cta={r.cta}
          />
        ))}
      </section>
    </div>
  );
}
