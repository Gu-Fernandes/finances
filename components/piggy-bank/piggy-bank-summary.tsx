import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "./piggy-bank.utils";

type Props = {
  total: number;
  filledMonths: number;
};

export function PiggyBankSummary({ total, filledMonths }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Cofrinho</CardTitle>
      </CardHeader>

      <CardContent className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">Montante acumulado</p>
          <p className="text-2xl font-semibold">{formatBRL(total)}</p>
        </div>

        <div className="sm:text-right">
          <p className="text-sm text-muted-foreground">Meses preenchidos</p>
          <p className="text-2xl font-semibold">{filledMonths}</p>
        </div>
      </CardContent>
    </Card>
  );
}
