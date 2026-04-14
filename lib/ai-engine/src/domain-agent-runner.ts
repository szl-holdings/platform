import type { DomainAgentConfig, StructuredToolCall, StructuredToolResult, ToolDefinition } from "./types.js";

export const MAX_TOOL_ROUNDS = 6;

export interface ConversationMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  toolName?: string;
}

export interface NativeToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface StructuredCompletionResult {
  content: string | null;
  toolCalls: NativeToolCall[];
  stopReason: "stop" | "tool_calls" | "max_tokens" | "other";
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

  chatCompletionWithTools?(
    messages: Array<{ role: "system" | "user" | "assistant" | "tool"; content: string; toolCallId?: string; name?: string }>,
    tools: Array<{
      type: "function";
      function: { name: string; description: string; parameters: Record<string, unknown> };
    }>,
    options?: { model?: string; maxTokens?: number },
  ): Promise<StructuredCompletionResult>;
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

function toOpenAIToolSchema(tools: ToolDefinition[]): Array<{
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
}> {
  return tools.map(t => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}

async function executeToolChain(
  toolCalls: NativeToolCall[],
  executeTool: DomainAgentConfig["executeTool"],
): Promise<StructuredToolResult[]> {
  const results: StructuredToolResult[] = [];
  for (const toolCall of toolCalls) {
    try {
      const output = await executeTool(toolCall.name, toolCall.arguments);
      results.push({
        toolCallId: toolCall.id,
        toolName: toolCall.name,
        content: output,
        success: true,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : `Tool ${toolCall.name} failed`;
      results.push({
        toolCallId: toolCall.id,
        toolName: toolCall.name,
        content: `Error executing ${toolCall.name}: ${errorMsg}`,
        success: false,
        error: errorMsg,
      });
    }
  }
  return results;
}

function textFallbackParseToolCalls(responseText: string): NativeToolCall[] {
  const calls: NativeToolCall[] = [];
  const trimmed = responseText.trim();

  try {
    if (trimmed.startsWith("[")) {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.every((p: unknown) => typeof (p as Record<string, unknown>).tool === "string")) {
        return parsed.map((p: Record<string, unknown>, idx: number) => ({
          id: `tc-${Date.now()}-${idx}`,
          name: p.tool as string,
          arguments: (p.args ?? p.arguments ?? {}) as Record<string, unknown>,
        }));
      }
    }
  } catch {}

  const jsonMatch = responseText.match(/\{[\s\S]*?"tool"\s*:\s*"[^"]+"/);
  if (jsonMatch) {
    try {
      const braceStart = responseText.indexOf("{", jsonMatch.index);
      let depth = 0;
      let end = braceStart;
      for (let i = braceStart; i < responseText.length; i++) {
        if (responseText[i] === "{") depth++;
        if (responseText[i] === "}") depth--;
        if (depth === 0) { end = i + 1; break; }
      }
      const parsed = JSON.parse(responseText.slice(braceStart, end)) as Record<string, unknown>;
      if (typeof parsed.tool === "string") {
        calls.push({
          id: `tc-${Date.now()}-0`,
          name: parsed.tool,
          arguments: (parsed.args ?? parsed.arguments ?? {}) as Record<string, unknown>,
        });
      }
    } catch {}
  }

  return calls;
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

    const hasTools = this.config.tools.length > 0;
    const supportsNativeTools = hasTools && typeof ai.chatCompletionWithTools === "function";

    if (supportsNativeTools) {
      return this._chatWithNativeTools(messages, ai, pastContext);
    }
    return this._chatWithTextFallback(messages, ai, pastContext);
  }

  private async _chatWithNativeTools(
    messages: ConversationMessage[],
    ai: ChatInterface,
    pastContext?: string,
  ): Promise<string> {
    const toolSchema = toOpenAIToolSchema(this.config.tools);
    const systemPrompt = this.config.systemPrompt + (pastContext ? `\n\n${pastContext}` : "");

    const buildNativeMessages = () => [
      { role: "system" as const, content: systemPrompt },
      ...messages
        .filter(m => m.role !== "system")
        .slice(-20)
        .map(m => {
          if (m.role === "tool") {
            return {
              role: "tool" as const,
              content: m.content,
              toolCallId: m.toolCallId,
              name: m.toolName,
            };
          }
          return {
            role: m.role as "user" | "assistant",
            content: m.content,
          };
        }),
    ];

    let rounds = 0;
    while (rounds < MAX_TOOL_ROUNDS) {
      rounds++;

      const result = await ai.chatCompletionWithTools!(
        buildNativeMessages(),
        toolSchema,
        { model: this.modelConfig.model, maxTokens: this.modelConfig.maxCompletionTokens },
      );

      if (result.toolCalls.length === 0) {
        const finalContent = result.content ?? "Analysis complete.";
        messages.push({ role: "assistant", content: finalContent });
        return finalContent;
      }

      if (result.content) {
        messages.push({ role: "assistant", content: result.content });
      }

      const toolResults = await executeToolChain(result.toolCalls, this.config.executeTool);

      for (const toolCall of result.toolCalls) {
        messages.push({
          role: "assistant",
          content: `[native_tool_call:${toolCall.name}]`,
          toolCallId: toolCall.id,
          toolName: toolCall.name,
        });
      }

      for (const toolResult of toolResults) {
        messages.push({
          role: "tool",
          content: toolResult.content,
          toolCallId: toolResult.toolCallId,
          toolName: toolResult.toolName,
        });
      }
    }

    const fallback = "I've reached the maximum number of analysis steps. Here's what I've gathered so far based on the available data.";
    messages.push({ role: "assistant", content: fallback });
    return fallback;
  }

  private async _chatWithTextFallback(
    messages: ConversationMessage[],
    ai: ChatInterface,
    pastContext?: string,
  ): Promise<string> {
    const toolDescriptions = this.config.tools.length > 0
      ? `\n\nYou have access to these tools:\n${this.config.tools.map(t =>
          `- ${t.name}: ${t.description}\n  Parameters: ${JSON.stringify(t.parameters)}`
        ).join("\n")}\n\nTo use a single tool: {"tool": "tool_name", "args": {...}}\nTo use multiple tools: [{"tool": "tool1", "args": {...}}, {"tool": "tool2", "args": {...}}]\nAfter tool results, provide your final answer.`
      : "";

    const systemMessage = this.config.systemPrompt + toolDescriptions + (pastContext ? `\n\n${pastContext}` : "");
    const buildChatMessages = () => [
      { role: "system" as const, content: systemMessage },
      ...messages
        .filter(m => m.role !== "system")
        .slice(-20)
        .map(m => ({
          role: (m.role === "tool" ? "user" : m.role) as "user" | "assistant",
          content: m.role === "tool"
            ? `[Tool Result - ${m.toolName ?? "unknown"}]: ${m.content}`
            : m.content,
        })),
    ];

    let rounds = 0;
    while (rounds < MAX_TOOL_ROUNDS) {
      rounds++;

      const result = await ai.chatCompletion(buildChatMessages(), {
        model: this.modelConfig.model,
        maxTokens: this.modelConfig.maxCompletionTokens,
      });

      const responseText = result.content.trim();
      const toolCalls = textFallbackParseToolCalls(responseText);

      if (toolCalls.length === 0) {
        messages.push({ role: "assistant", content: responseText });
        return responseText;
      }

      const toolResults = await executeToolChain(toolCalls, this.config.executeTool);

      messages.push({ role: "assistant", content: responseText });

      for (const toolResult of toolResults) {
        messages.push({
          role: "tool",
          content: toolResult.content,
          toolCallId: toolResult.toolCallId,
          toolName: toolResult.toolName,
        });
      }
    }

    const fallback = "I've reached the maximum number of analysis steps. Here's what I've gathered so far based on the available data.";
    messages.push({ role: "assistant", content: fallback });
    return fallback;
  }
}
