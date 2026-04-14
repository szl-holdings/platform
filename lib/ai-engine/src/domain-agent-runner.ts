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

interface StoredConversation {
  messages: ConversationMessage[];
  lastAccess: number;
  agentId: string;
}

const conversationStore = new Map<string, StoredConversation>();
const MAX_CONVERSATIONS = 200;
const CONVERSATION_TTL = 30 * 60 * 1000;

async function generateConversationSummary(
  messages: ConversationMessage[],
  agentId: string,
): Promise<string | null> {
  try {
    const { openai } = await import("@szl-holdings/integrations-openai-ai-server");
    const dialogue = messages
      .filter(m => m.role !== "system")
      .slice(-20)
      .map(m => `${m.role.toUpperCase()}: ${m.content.slice(0, 300)}`)
      .join("\n");
    if (!dialogue.trim()) return null;

    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 400,
      messages: [
        { role: "system", content: "Summarize this conversation in 2-3 sentences, capturing the key topics, decisions made, and any unresolved questions. Be concise." },
        { role: "user", content: dialogue },
      ],
    });
    return result.choices[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

function extractTopics(messages: ConversationMessage[]): string[] {
  const text = messages.map(m => m.content).join(" ").toLowerCase();
  const topics: string[] = [];
  const domainKeywords: Record<string, string[]> = {
    security: ["threat", "vulnerability", "attack", "breach", "malware"],
    maritime: ["vessel", "ship", "fleet", "port", "ais"],
    infrastructure: ["azure", "kubernetes", "server", "deploy"],
    analytics: ["metric", "anomaly", "performance", "signal"],
  };
  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    if (keywords.some(kw => text.includes(kw))) topics.push(domain);
  }
  return topics;
}

async function persistConversationSummary(
  conversationId: string,
  agentId: string,
  summary: string,
  topics: string[],
  messageCount: number,
): Promise<void> {
  try {
    const { db, alloyConversationSummaries } = await import("@szl-holdings/db");
    await db.insert(alloyConversationSummaries).values({
      conversationId,
      agentId,
      summary,
      topics,
      messageCount,
    }).onConflictDoUpdate({
      target: alloyConversationSummaries.conversationId,
      set: { summary, topics, messageCount },
    });
  } catch {}
}

async function getRelevantConversationSummaries(agentId: string, query: string): Promise<string> {
  try {
    const { db, alloyConversationSummaries } = await import("@szl-holdings/db");
    const { eq, desc } = await import("drizzle-orm");
    const recent = await db
      .select()
      .from(alloyConversationSummaries)
      .where(eq(alloyConversationSummaries.agentId, agentId))
      .orderBy(desc(alloyConversationSummaries.createdAt))
      .limit(20);

    if (recent.length === 0) return "";

    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 3);
    const scored = recent
      .map(r => {
        const haystack = `${r.summary} ${r.topics.join(" ")}`.toLowerCase();
        const matches = queryTerms.filter(t => haystack.includes(t)).length;
        return { record: r, score: matches };
      })
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (scored.length === 0) return "";
    const lines = scored.map(s => `- ${s.record.summary}`).join("\n");
    return `## Related Past Conversations\n${lines}`;
  } catch {
    return "";
  }
}

async function cleanExpiredConversations(): Promise<void> {
  const now = Date.now();
  const expired: Array<{ id: string; conv: StoredConversation }> = [];

  for (const [id, conv] of conversationStore) {
    if (now - conv.lastAccess > CONVERSATION_TTL) {
      expired.push({ id, conv });
      conversationStore.delete(id);
    }
  }

  for (const { id, conv } of expired) {
    if (conv.messages.filter(m => m.role !== "system").length >= 2) {
      void (async () => {
        const summary = await generateConversationSummary(conv.messages, conv.agentId);
        if (summary) {
          const topics = extractTopics(conv.messages);
          await persistConversationSummary(
            id,
            conv.agentId,
            summary,
            topics,
            conv.messages.filter(m => m.role !== "system").length,
          );
        }
      })();
    }
  }
}

export function getOrCreateConversation(conversationId: string, systemPrompt: string, agentId = "unknown"): ConversationMessage[] {
  void cleanExpiredConversations();

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
    if (oldestKey) {
      const oldest = conversationStore.get(oldestKey);
      if (oldest && oldest.messages.filter(m => m.role !== "system").length >= 2) {
        void (async () => {
          const summary = await generateConversationSummary(oldest.messages, oldest.agentId);
          if (summary) {
            const topics = extractTopics(oldest.messages);
            await persistConversationSummary(
              oldestKey,
              oldest.agentId,
              summary,
              topics,
              oldest.messages.filter(m => m.role !== "system").length,
            );
          }
        })();
      }
      conversationStore.delete(oldestKey);
    }
  }

  const messages: ConversationMessage[] = [{ role: "system", content: systemPrompt }];
  conversationStore.set(conversationId, { messages, lastAccess: Date.now(), agentId });
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
    const agentId = (this.config as { agentId?: string }).agentId ?? "unknown";
    const messages = getOrCreateConversation(conversationId, this.config.systemPrompt, agentId);

    const pastContext = await getRelevantConversationSummaries(agentId, userMessage);

    messages.push({ role: "user", content: userMessage });

    const toolDescriptions = this.config.tools.length > 0
      ? `\n\nYou have access to these tools:\n${this.config.tools.map(t => `- ${t.name}: ${t.description}`).join("\n")}\n\nTo use a tool, respond with JSON: {"tool": "tool_name", "args": {...}}\nAfter receiving tool results, provide your final answer to the user.`
      : "";

    const systemMessage = this.config.systemPrompt + toolDescriptions + (pastContext ? `\n\n${pastContext}` : "");
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
