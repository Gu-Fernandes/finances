"use client";

import * as React from "react";
import { SendHorizonal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  onSend: (text: string) => void;
  disabled?: boolean;
};

export function AssistantComposer({ onSend, disabled }: Props) {
  const [value, setValue] = React.useState("");

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;

    onSend(text);
    setValue("");
  };

  return (
    <div className="border-t bg-background p-3">
      <div className="flex items-end gap-2">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="min-h-[44px] max-h-36 resize-none"
          rows={1}
          disabled={disabled}
        />

        <Button
          type="button"
          size="icon"
          onClick={submit}
          disabled={disabled || !value.trim()}
          aria-label="Enviar mensagem"
          className="shrink-0 rounded-full"
        >
          <SendHorizonal className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
