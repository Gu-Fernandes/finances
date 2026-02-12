"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

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
      <ScrollArea className="w-full rounded-2xl border">
        <div className="min-w-[760px]">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/50 backdrop-blur">
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
                    className={cn(
                      "transition-colors",
                      "hover:bg-muted/20",
                      "even:bg-muted/5",
                      isCurrent && "bg-muted/30",
                    )}
                  >
                    <TableCell className="text-muted-foreground tabular-nums">
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
                          className="max-w-[170px] text-right tabular-nums"
                        />
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-semibold tabular-nums">
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
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editingKey) return;

    const t = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(t);
  }, [editingKey]);

  return (
    <div className="space-y-4 md:hidden">
      {rows.map((r) => {
        const isCurrent = r.key === currentKey;
        const isEditing = editingKey === r.key;

        const inputId = `piggy-mobile-${r.key}`;
        const savedLabel = formatBRL(r.saved);
        const totalLabel = formatBRL(r.total);

        return (
          <div
            key={r.key}
            className={cn(
              "rounded-2xl border bg-background/50 p-4 shadow-sm",
              isCurrent && "bg-muted/20 ring-1 ring-foreground/10",
            )}
          >
            {/* Header */}
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

            {/* Body */}
            <div className="mt-3">
              {isEditing ? (
                <div
                  className="rounded-xl border bg-background/60 p-3 shadow-sm"
                  onBlurCapture={(e) => {
                    const next = e.relatedTarget as Node | null;
                    if (next && e.currentTarget.contains(next)) return;
                    setEditingKey(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setEditingKey(null);
                  }}
                >
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label
                        htmlFor={inputId}
                        className="text-xs text-muted-foreground"
                      >
                        Guardado
                      </Label>

                      <MoneyInput
                        ref={inputRef}
                        id={inputId}
                        currencyLabel="R$"
                        value={values[r.key] ?? ""}
                        onValueChange={(formatted) =>
                          onChange(r.key, formatted)
                        }
                        placeholder="0,00"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <Label className="text-xs text-muted-foreground">
                        Montante
                      </Label>
                      <p className="text-sm font-semibold text-primary tabular-nums">
                        {totalLabel}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="w-full rounded-xl border bg-background/60 p-3 text-left shadow-sm transition hover:bg-muted/30"
                  onClick={() => setEditingKey(r.key)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">Guardado</p>
                      <p className="text-sm font-semibold tabular-nums">
                        {savedLabel}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">Montante</p>
                      <p className="text-sm font-semibold text-primary tabular-nums">
                        {totalLabel}
                      </p>
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

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

  if (!ready) return <Loading />;

  return (
    <div className="space-y-4">
      <PiggyBankSummary total={total} filledMonths={filledMonths} />

      <Card className="group relative overflow-hidden rounded-2xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        <CardHeader className="relative pb-3 pt-4">
          <CardTitle className="text-base">Controle mensal</CardTitle>
          <p className="text-sm text-muted-foreground">
            Preencha o valor guardado por mês e acompanhe o montante acumulado.
          </p>
        </CardHeader>

        <CardContent className="relative space-y-4 pb-4">
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
