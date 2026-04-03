import type { DomainAgentConfig } from "./types.js";

export const MAX_TOOL_ROUNDS = 6;

export interface ConversationMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatInterface {
  chatCompletion(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    options?: { model?: string; maxTokens?: number },
  ): Promise<{ content: string }>;

  streamChatCompletion(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    options?: { model?: string; maxTokens?: number },
  ): AsyncIterable<string>;
}

const conversationStore = new Map<string, { messages: ConversationMessage[]; lastAccess: number }>();
const MAX_CONVERSATIONS = 200;
const CONVERSATION_TTL = 30 * 60 * 1000;

function cleanExpiredConversations() {
  const now = Date.now();
  for (const [id, conv] of conversationStore) {
    if (now - conv.lastAccess > CONVERSATION_TTL) {
      conversationStore.delete(id);
    }
  }
}

export function getOrCreateConversation(conversationId: string, systemPrompt: string): ConversationMessage[] {
  cleanExpiredConversations();

  const existing = conversationStore.get(conversationId);
  if (existing) {
    existing.lastAccess = Date.now();
    return existing.messages;
  }

  if (conversationStore.size >= MAX_CONVERSATIONS) {
    let oldestKey = "";
    let oldestTime = Infinity;
    for (const [k, v] of conversationStore) {
      if (v.lastAccess < oldestTime) {
        oldestTime = v.lastAccess;
        oldestKey = k;
      }
    }
    if (oldestKey) conversationStore.delete(oldestKey);
  }

  const messages: ConversationMessage[] = [{ role: "system", content: systemPrompt }];
  conversationStore.set(conversationId, { messages, lastAccess: Date.now() });
  return messages;
}

export class DomainAgentRunner {
  constructor(
    private readonly config: DomainAgentConfig,
    private readonly modelConfig: { model: string; maxCompletionTokens: number },
  ) {}

  async chat(
    userMessage: string,
    conversationId: string,
    ai: ChatInterface,
  ): Promise<string> {
    const messages = getOrCreateConversation(conversationId, this.config.systemPrompt);
    messages.push({ role: "user", content: userMessage });

    const toolDescriptions = this.config.tools.length > 0
      ? `\n\nYou have access to these tools:\n${this.config.tools.map(t => `- ${t.name}: ${t.description}`).join("\n")}\n\nTo use a tool, respond with JSON: {"tool": "tool_name", "args": {...}}\nAfter receiving tool results, provide your final answer to the user.`
      : "";

    const systemMessage = this.config.systemPrompt + toolDescriptions;
    const chatMessages = [
      { role: "system" as const, content: systemMessage },
      ...messages.filter(m => m.role !== "system").slice(-20).map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    let rounds = 0;
    while (rounds < MAX_TOOL_ROUNDS) {
      rounds++;

      const result = await ai.chatCompletion(chatMessages, {
        model: this.modelConfig.model,
        maxTokens: this.modelConfig.maxCompletionTokens,
      });

      const responseText = result.content.trim();

      let toolCall: { tool: string; args: Record<string, unknown> } | null = null;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*"tool"\s*:\s*"[^"]+"/);
        if (jsonMatch) {
          const braceStart = responseText.indexOf("{", jsonMatch.index);
          let depth = 0;
          let end = braceStart;
          for (let i = braceStart; i < responseText.length; i++) {
            if (responseText[i] === "{") depth++;
            if (responseText[i] === "}") depth--;
            if (depth === 0) { end = i + 1; break; }
          }
          const parsed = JSON.parse(responseText.slice(braceStart, end));
          if (parsed.tool && typeof parsed.tool === "string") {
            toolCall = { tool: parsed.tool, args: parsed.args || {} };
          }
        }
      } catch {
        toolCall = null;
      }

      if (!toolCall) {
        messages.push({ role: "assistant", content: responseText });
        return responseText;
      }

      const toolResult = await this.config.executeTool(toolCall.tool, toolCall.args);
      chatMessages.push({ role: "assistant", content: responseText });
      chatMessages.push({ role: "user", content: `Tool result for ${toolCall.tool}:\n${toolResult}` });
    }

    const fallback = "I've reached the maximum number of analysis steps. Here's what I've gathered so far based on the available data.";
    messages.push({ role: "assistant", content: fallback });
    return fallback;
  }
}
