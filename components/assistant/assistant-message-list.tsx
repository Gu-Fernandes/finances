"use client";

import * as React from "react";
import type { AssistantMessage } from "./assistant-chat.types";
import { AssistantMessageBubble } from "./assistant-message-bubble";

type Props = {
  messages: AssistantMessage[];
};

export function AssistantMessageList({ messages }: Props) {
  const endRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="space-y-3">
        {messages.map((message) => (
          <AssistantMessageBubble key={message.id} message={message} />
        ))}

        <div ref={endRef} />
      </div>
    </div>
  );
}
