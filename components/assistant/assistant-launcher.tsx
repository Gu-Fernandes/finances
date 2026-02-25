"use client";

import * as React from "react";
import { Bot } from "lucide-react";
import { AssistantSheet } from "./assistant-sheet";

const FAB_SIZE = 56; // px (w-14 h-14)
const RIGHT_MARGIN = 16; // px
const BOTTOM_MARGIN = 96; // px (deixa espaço para o Toaster bottom-right)
const STORAGE_KEY = "my-finances:assistant-fab-position:v1";

type Position = { x: number; y: number };

function getDefaultPosition(): Position {
  if (typeof window === "undefined") return { x: 0, y: 0 };

  return {
    x: window.innerWidth - FAB_SIZE - RIGHT_MARGIN,
    y: window.innerHeight - FAB_SIZE - BOTTOM_MARGIN,
  };
}

function clampPosition(pos: Position): Position {
  if (typeof window === "undefined") return pos;

  const maxX = window.innerWidth - FAB_SIZE - 8;
  const maxY = window.innerHeight - FAB_SIZE - 8;

  return {
    x: Math.min(Math.max(8, pos.x), Math.max(8, maxX)),
    y: Math.min(Math.max(8, pos.y), Math.max(8, maxY)),
  };
}

function loadSavedPosition(): Position | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<Position>;
    if (typeof parsed?.x !== "number" || typeof parsed?.y !== "number") {
      return null;
    }

    return clampPosition({ x: parsed.x, y: parsed.y });
  } catch {
    return null;
  }
}

function savePosition(pos: Position) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  } catch {
    // ignore
  }
}

export function AssistantLauncher() {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [position, setPosition] = React.useState<Position>({ x: 0, y: 0 });

  const buttonRef = React.useRef<HTMLButtonElement | null>(null);

  const dragRef = React.useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
    moved: boolean;
  } | null>(null);

  const suppressClickRef = React.useRef(false);

  React.useEffect(() => {
    setMounted(true);

    const initial = loadSavedPosition() ?? getDefaultPosition();
    setPosition(clampPosition(initial));

    const onResize = () => {
      setPosition((prev) => clampPosition(prev));
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    // apenas botão principal do mouse / toque
    if (e.button !== 0 && e.pointerType !== "touch") return;

    const rect = e.currentTarget.getBoundingClientRect();

    dragRef.current = {
      pointerId: e.pointerId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      moved: false,
    };

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    const next = clampPosition({
      x: e.clientX - drag.offsetX,
      y: e.clientY - drag.offsetY,
    });

    const dx = Math.abs(next.x - position.x);
    const dy = Math.abs(next.y - position.y);

    if (dx > 1 || dy > 1) {
      drag.moved = true;
      setPosition(next);
    }
  };

  const finishDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    if (buttonRef.current?.hasPointerCapture(e.pointerId)) {
      buttonRef.current.releasePointerCapture(e.pointerId);
    }

    if (drag.moved) {
      suppressClickRef.current = true;
      savePosition(position);
    }

    dragRef.current = null;
  };

  const onClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    setOpen(true);
  };

  if (!mounted) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Abrir assistente financeiro"
        title="Assistente Financeiro"
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        className="fixed z-50 inline-flex h-14 w-14 touch-none select-none items-center justify-center rounded-full border bg-muted-foreground text-primary-foreground shadow-lg transition hover:scale-[1.02] active:scale-[0.98]"
        style={{ left: position.x, top: position.y }}
      >
        <Bot className="h-6 w-6" />
      </button>

      <AssistantSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
