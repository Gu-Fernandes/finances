"use client";

import * as React from "react";
import { AssistantComposer } from "./assistant-composer";
import { AssistantMessageList } from "./assistant-message-list";
import type { AssistantMessage } from "./assistant-chat.types";

const STORAGE_KEY = "my-finances:assistant-chat-messages:v1";

function createId() {
  try {
    return globalThis.crypto?.randomUUID?.() ?? fallbackId();
  } catch {
    return fallbackId();
  }
}

function fallbackId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nowISO() {
  return new Date().toISOString();
}

const INITIAL_MESSAGES: AssistantMessage[] = [
  {
    id: "welcome-1",
    role: "assistant",
    content:
      "Olá! 👋 Eu sou seu Assistente Financeiro.\n\nEm breve vou te ajudar com orçamento, gastos e investimentos.",
    createdAt: nowISO(),
  },
];

function isValidMessage(v: unknown): v is AssistantMessage {
  if (!v || typeof v !== "object") return false;
  const m = v as Partial<AssistantMessage>;

  return (
    typeof m.id === "string" &&
    (m.role === "assistant" || m.role === "user") &&
    typeof m.content === "string" &&
    typeof m.createdAt === "string"
  );
}

function loadMessages(): AssistantMessage[] | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;

    const messages = parsed.filter(isValidMessage);
    return messages.length ? messages : null;
  } catch {
    return null;
  }
}

function saveMessages(messages: AssistantMessage[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // ignore
  }
}

export function AssistantChat() {
  const [messages, setMessages] = React.useState<AssistantMessage[]>([]);
  const [isReplying, setIsReplying] = React.useState(false);

  // 1) hidrata ao montar
  React.useEffect(() => {
    const stored = loadMessages();
    setMessages(stored ?? INITIAL_MESSAGES);
  }, []);

  // 2) persiste sempre que mensagens mudarem
  React.useEffect(() => {
    if (!messages.length) return;
    saveMessages(messages);
  }, [messages]);

  const handleSend = (text: string) => {
    const userMessage: AssistantMessage = {
      id: createId(),
      role: "user",
      content: text,
      createdAt: nowISO(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsReplying(true);

    // Mock de resposta (temporário)
    window.setTimeout(() => {
      const botMessage: AssistantMessage = {
        id: createId(),
        role: "assistant",
        content:
          "Perfeito ✅\nRecebi sua mensagem.\nEm breve aqui entraremos com IA para otimização nas tarefas e análise financeira.",
        createdAt: nowISO(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsReplying(false);
    }, 500);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-muted/20">
      <AssistantMessageList messages={messages} />
      <AssistantComposer onSend={handleSend} disabled={isReplying} />
    </div>
  );
}
