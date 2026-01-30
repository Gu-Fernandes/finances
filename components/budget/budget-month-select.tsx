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
    <div className="flex items-center gap-5">
      <Label className="text-muted-foreground">Selecione um mês</Label>

      <div className="max-w-sm">
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
