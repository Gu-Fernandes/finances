"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { PIGGY_MONTHS } from "./piggy-bank.constants";
import {
  formatBRL,
  getCurrentKey,
  loadSavedMap,
  parseMoneyBR,
  saveSavedMap,
} from "./piggy-bank.utils";
import { PiggyBankSummary } from "./piggy-bank-summary";
import { Loading } from "../ui/loading";

type Row = {
  index: number;
  label: string;
  key: string;
  saved: number;
  total: number;
};

type ViewProps = {
  rows: Row[];
  values: Record<string, string>;
  currentKey: string;
  onChange: (key: string, value: string) => void;
};

function DesktopTable({ rows, values, currentKey, onChange }: ViewProps) {
  return (
    <div className="hidden md:block">
      <ScrollArea className="w-full rounded-lg border">
        <div className="min-w-[760px]">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Mês</TableHead>
                <TableHead className="text-right">Guardado</TableHead>
                <TableHead className="text-right">Montante</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((r) => {
                const isCurrent = r.key === currentKey;
                const inputId = `piggy-${r.key}`;

                return (
                  <TableRow
                    key={r.key}
                    className={cn(isCurrent && "bg-muted/30")}
                  >
                    <TableCell className="text-muted-foreground">
                      {r.index}º
                    </TableCell>

                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {r.label}
                        {isCurrent ? (
                          <Badge
                            variant="secondary"
                            className="h-5 px-2 text-[11px]"
                          >
                            Atual
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Label htmlFor={inputId} className="sr-only">
                          Guardado em {r.label}
                        </Label>

                        <MoneyInput
                          id={inputId}
                          currencyLabel="R$"
                          value={values[r.key] ?? ""}
                          onValueChange={(formatted) =>
                            onChange(r.key, formatted)
                          }
                          placeholder="0,00"
                          className="max-w-[160px]"
                        />
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-semibold">
                      {formatBRL(r.total)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

function MobileList({ rows, values, currentKey, onChange }: ViewProps) {
  return (
    <div className="space-y-5 md:hidden">
      {rows.map((r) => {
        const isCurrent = r.key === currentKey;
        const inputId = `piggy-mobile-${r.key}`;

        return (
          <div
            key={r.key}
            className={cn("rounded-lg border p-3", isCurrent && "bg-muted/30")}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="h-6 px-2">
                  {r.index}º
                </Badge>
                <p className="font-medium">{r.label}</p>
              </div>

              {isCurrent ? (
                <Badge variant="secondary" className="h-6 px-2">
                  Atual
                </Badge>
              ) : null}
            </div>

            <div className="mt-3 space-y-3">
              <div className="space-y-1">
                <Label
                  htmlFor={inputId}
                  className="text-xs text-muted-foreground"
                >
                  Guardado
                </Label>

                <MoneyInput
                  id={inputId}
                  currencyLabel="R$"
                  value={values[r.key] ?? ""}
                  onValueChange={(formatted) => onChange(r.key, formatted)}
                  placeholder="0,00"
                />
              </div>

              <Separator />

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Montante
                </Label>
                <p className="text-right text-primary text-base font-semibold">
                  {formatBRL(r.total)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Store simples em memória + localStorage, usando useSyncExternalStore
 * (resolve hydration e evita setState dentro de useEffect).
 */
type Snapshot = {
  values: Record<string, string>;
  ready: boolean;
  currentKey: string;
};

const SERVER_SNAPSHOT: Snapshot = { values: {}, ready: false, currentKey: "" };

let _values: Record<string, string> = {};
let _ready = false;
let _currentKey = "";
let _snapshot: Snapshot = SERVER_SNAPSHOT;
const _listeners = new Set<() => void>();

function _emit() {
  for (const l of _listeners) l();
}

function _initClientOnce() {
  if (_ready) return;
  if (typeof window === "undefined") return;

  _values = loadSavedMap();
  _currentKey = getCurrentKey();
  _ready = true;
  _snapshot = { values: _values, ready: _ready, currentKey: _currentKey };
}

function _subscribe(listener: () => void) {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

function _getSnapshot(): Snapshot {
  _initClientOnce();
  return _snapshot;
}

function _setValues(
  updater:
    | Record<string, string>
    | ((prev: Record<string, string>) => Record<string, string>),
) {
  _initClientOnce();
  const next = typeof updater === "function" ? updater(_values) : updater;

  _values = next;
  _snapshot = { values: _values, ready: _ready, currentKey: _currentKey };
  saveSavedMap(_values);
  _emit();
}

export function PiggyBankTable() {
  const { values, ready, currentKey } = useSyncExternalStore(
    _subscribe,
    _getSnapshot,
    () => SERVER_SNAPSHOT,
  );

  const rows: Row[] = useMemo(() => {
    return PIGGY_MONTHS.reduce(
      (acc, m) => {
        const saved = parseMoneyBR(values[m.key] ?? "");
        const total = acc.total + saved;

        return {
          total,
          rows: [
            ...acc.rows,
            {
              index: m.index,
              label: m.label,
              key: m.key,
              saved,
              total,
            },
          ],
        };
      },
      { total: 0, rows: [] as Row[] },
    ).rows;
  }, [values]);

  const total = rows.length ? rows[rows.length - 1].total : 0;
  const filledMonths = rows.filter((r) => r.saved > 0).length;

  const handleChange = useCallback((key: string, value: string) => {
    _setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  if (!ready) {
    return <Loading />;
  }

  return (
    <div className="space-y-4">
      <PiggyBankSummary total={total} filledMonths={filledMonths} />

      <Card>
        <CardHeader>
          <CardTitle>Controle mensal</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <MobileList
            rows={rows}
            values={values}
            currentKey={currentKey}
            onChange={handleChange}
          />

          <DesktopTable
            rows={rows}
            values={values}
            currentKey={currentKey}
            onChange={handleChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
