"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Bot } from "lucide-react";
import { AssistantChat } from "./assistant-chat";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AssistantSheet({ open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:max-w-md"
      >
        <SheetHeader className="shrink-0 border-b px-4 py-4 text-left">
          <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bot className="h-5 w-5" />
          </div>

          <SheetTitle>Assistente Financeiro</SheetTitle>
          <SheetDescription>
            Seu assistente de orçamento, gastos e investimentos.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1">
          <AssistantChat />
        </div>
      </SheetContent>
    </Sheet>
  );
}
