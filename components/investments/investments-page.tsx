"use client";

import { InvestedTotalCard } from "./components/invested-total-card";
import { InvestmentsTabsCard } from "./investments-tabs-card";

export function InvestmentsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
      <InvestedTotalCard />
      <InvestmentsTabsCard />
    </div>
  );
}
