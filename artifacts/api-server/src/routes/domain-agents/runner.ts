import { services, type ChatMessage } from "@szl-holdings/services";
import type { Response } from "express";
import { AGENT_CONFIGS, type AgentType } from "./configs";
import { getModelConfig } from "../../lib/model-registry";
import { logger } from "../../lib/logger";

const MAX_TOOL_ROUNDS = 6;

interface ConversationMessage {
  role: "system" | "user" | "assistant";
  content: string;
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

function getOrCreateConversation(conversationId: string, agentType: AgentType): ConversationMessage[] {
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

  const config = AGENT_CONFIGS[agentType];
  const messages: ConversationMessage[] = [
    { role: "system", content: config.systemPrompt },
  ];
  conversationStore.set(conversationId, { messages, lastAccess: Date.now() });
  return messages;
}

export async function runDomainAgentChat(
  agentType: AgentType,
  userMessage: string,
  conversationId: string,
): Promise<string> {
  const config = AGENT_CONFIGS[agentType];
  const modelConfig = getModelConfig(agentType);
  const messages = getOrCreateConversation(conversationId, agentType);

  messages.push({ role: "user", content: userMessage });

  const ai = services.ai;

  const toolDescriptions = config.tools.length > 0
    ? `\n\nYou have access to these tools:\n${config.tools.map(t => `- ${t.name}: ${t.description}`).join("\n")}\n\nTo use a tool, respond with JSON: {"tool": "tool_name", "args": {...}}\nAfter receiving tool results, provide your final answer to the user.`
    : "";

  const systemMessage = config.systemPrompt + toolDescriptions;
  const chatMessages: ChatMessage[] = [
    { role: "system", content: systemMessage },
    ...messages.filter(m => m.role !== "system").slice(-20).map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  let rounds = 0;
  while (rounds < MAX_TOOL_ROUNDS) {
    rounds++;

    const result = await ai.chatCompletion(chatMessages, {
      model: modelConfig.model,
      maxTokens: modelConfig.maxCompletionTokens,
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

    logger.info({ agentType, tool: toolCall.tool, round: rounds }, "Domain agent tool call");

    const toolResult = await config.executeTool(toolCall.tool, toolCall.args);

    chatMessages.push({ role: "assistant", content: responseText });
    chatMessages.push({ role: "user", content: `Tool result for ${toolCall.tool}:\n${toolResult}` });
  }

  const fallback = "I've reached the maximum number of analysis steps. Here's what I've gathered so far based on the available data.";
  messages.push({ role: "assistant", content: fallback });
  return fallback;
}

export async function streamDomainAgentChat(
  agentType: AgentType,
  userMessage: string,
  conversationId: string,
  res: Response,
): Promise<void> {
  const config = AGENT_CONFIGS[agentType];
  const modelConfig = getModelConfig(agentType);
  const messages = getOrCreateConversation(conversationId, agentType);

  messages.push({ role: "user", content: userMessage });

  const ai = services.ai;

  const toolDescriptions = config.tools.length > 0
    ? `\n\nYou have access to these tools:\n${config.tools.map(t => `- ${t.name}: ${t.description}`).join("\n")}\n\nTo use a tool, respond with JSON: {"tool": "tool_name", "args": {...}}\nAfter receiving tool results, provide your final answer to the user.`
    : "";

  const systemMessage = config.systemPrompt + toolDescriptions;
  const chatMessages: ChatMessage[] = [
    { role: "system", content: systemMessage },
    ...messages.filter(m => m.role !== "system").slice(-20).map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  try {
    const stream = ai.streamChatCompletion(chatMessages, {
      model: modelConfig.model,
      maxTokens: modelConfig.maxCompletionTokens,
    });

    for await (const chunk of stream) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }

    messages.push({ role: "assistant", content: fullResponse });
    res.write(`data: [DONE]\n\n`);
  } catch (err) {
    logger.error({ err, agentType }, "Stream error");
    res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
  }

  res.end();
}
