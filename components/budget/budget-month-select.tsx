"use client";

import { MONTHS } from "./budget.constants";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  value: string; // "YYYY-MM"
  year: string; // "YYYY"
  onChange: (monthKey: string) => void;
};

export function BudgetMonthSelect({ value, year, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <Label className="text-sm text-muted-foreground">Selecione um mês</Label>

      <div className="w-full sm:max-w-xs">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione o mês" />
          </SelectTrigger>

          <SelectContent>
            {MONTHS.map((m) => {
              const monthKey = `${year}-${m.value}`;
              return (
                <SelectItem key={monthKey} value={monthKey}>
                  {m.label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
