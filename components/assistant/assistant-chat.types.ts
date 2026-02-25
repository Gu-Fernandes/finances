export type AssistantMessageRole = "assistant" | "user";

export type AssistantMessage = {
  id: string;
  role: AssistantMessageRole;
  content: string;
  createdAt: string;
};
