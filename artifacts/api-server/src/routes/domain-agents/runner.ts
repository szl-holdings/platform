import {
  type AITrace,
  autoEnqueueTrace,
  captureTrace,
  type DomainEvalContext,
  enqueueForReview,
  type RecommendationType,
  resolveModelForAgent,
  runEvaluatorHooksForTrace,
  type TraceDomain,
  updateTraceStatus,
} from '@szl-holdings/ai-engine';
import { type ChatCompletionResult, type ChatMessage, services } from '@szl-holdings/services';
import type { Response } from 'express';
import { LRUCache } from 'lru-cache';
import { logger } from '../../lib/logger';
import { getModelConfig } from '../../lib/model-registry';
import { AGENT_CONFIGS, type AgentType } from './configs';

async function runAgentViaSdkIfOptIn(
  agentType: AgentType,
  userMessage: string,
  conversationId: string,
): Promise<string | null> {
  const config = AGENT_CONFIGS[agentType];
  if (!config.useAgentsSdk) return null;

  const startMs = Date.now();
  const domain = getAgentDomain(agentType);
  const recType = getAgentRecType(agentType);
  const evalCtx: DomainEvalContext = { domain };

  let output: string;
  try {
    const { runAgentViaSdk } = await import('@workspace/agents-sdk-bridge/sdk-runner');
    const result = await runAgentViaSdk(
      {
        id: agentType,
        name: config.name,
        domain: agentType,
        systemPrompt: config.systemPrompt,
        tools: config.tools.map((t) => t.name),
        useAgentsSdk: true,
      },
      userMessage,
      {
        conversationId,
        workflowName: `${config.name} chat`,
        domain: agentType,
        includeSensitiveData: false,
      },
    );
    output = result.output;
  } catch (err) {
    logger.warn({ err, agentType }, 'SDK runner failed, falling back to hand-rolled loop');
    return null;
  }

  const messages = getOrCreateConversation(conversationId, agentType);
  messages.push({ role: 'user', content: userMessage });
  messages.push({ role: 'assistant', content: output });
  void persistConversationMessages(conversationId, agentType, [
    { role: 'user', content: userMessage },
    { role: 'assistant', content: output },
  ]);

  const latencyMs = Date.now() - startMs;
  const confidence = computeConfidenceProxy(output, false);
  const trace = captureTrace({
    domain,
    recommendationType: recType,
    model: 'openai-agents-sdk',
    modelProvider: 'openai',
    agentId: agentType,
    promptText: userMessage.slice(0, 500),
    latencyMs,
    confidence,
    outputSummary: output.slice(0, 200),
  });
  autoEnqueueTrace(trace);
  void persistEvalAsync(trace, evalCtx);

  return output;
}

const AGENT_DOMAIN_MAP: Record<AgentType, TraceDomain> = {
  vessels: 'vessels',
  terra: 'terra',
  'carlota-jo': 'prism_counsel',
  inca: 'cortex',
  lyte: 'lyte',
  'szl-holdings': 'alloy',
  firestorm: 'aegis',
  dreamscape: 'alloy',
  'readiness-report': 'alloy',
  msp: 'alloy',
  admin: 'alloy',
  stephen: 'alloy',
};

const AGENT_REC_TYPE_MAP: Record<AgentType, RecommendationType> = {
  vessels: 'voyage_pnl',
  terra: 'deal_analysis',
  'carlota-jo': 'legal_matter',
  inca: 'risk_assessment',
  lyte: 'anomaly_detection',
  'szl-holdings': 'generic',
  firestorm: 'threat_triage',
  dreamscape: 'generic',
  'readiness-report': 'risk_assessment',
  msp: 'generic',
  admin: 'generic',
  stephen: 'generic',
};

function getAgentDomain(agentType: AgentType): TraceDomain {
  return AGENT_DOMAIN_MAP[agentType] ?? 'alloy';
}

function getAgentRecType(agentType: AgentType): RecommendationType {
  return AGENT_REC_TYPE_MAP[agentType] ?? 'generic';
}

async function persistEvalAsync(trace: AITrace, ctx: DomainEvalContext): Promise<void> {
  try {
    const results = await runEvaluatorHooksForTrace(trace, ctx);
    if (results.length === 0) return;
    const avgScore = results.reduce((s, r) => s + r.score, 0) / results.length;
    const allPassed = results.every((r) => r.passed);
    if (allPassed) {
      updateTraceStatus(trace.traceId, 'evaluated', avgScore, true);
    } else {
      updateTraceStatus(trace.traceId, 'flagged', avgScore, false);
      if (!trace.requiresReview) {
        enqueueForReview({ trace, overrideReason: 'eval_failed' });
      }
    }
  } catch {}
}

function computeConfidenceProxy(responseText: string, isFallback: boolean): number {
  if (isFallback) return 0.4;
  const len = responseText.trim().length;
  if (len < 80) return 0.62;
  return Math.min(0.92, 0.72 + (Math.min(len, 2000) / 2000) * 0.2);
}

const MAX_TOOL_ROUNDS = 6;

interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const conversationStore = new LRUCache<
  string,
  { messages: ConversationMessage[]; lastAccess: number; dbConversationId?: number }
>({ max: 200 });
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

async function ensureDbConversation(conversationId: string, agentType: AgentType): Promise<number | undefined> {
  try {
    const { db } = await import('@szl-holdings/db');
    const { conversations } = await import('@szl-holdings/db/schema');
    const { eq } = await import('drizzle-orm');

    const existing = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.title, `agent:${agentType}:${conversationId}`))
      .limit(1);

    if (existing.length > 0) return existing[0]!.id;

    const inserted = await db.insert(conversations).values({
      title: `agent:${agentType}:${conversationId}`,
    }).returning({ id: conversations.id });

    return inserted[0]?.id;
  } catch {
    return undefined;
  }
}

async function persistConversationMessages(
  conversationId: string,
  agentType: AgentType,
  newMessages: Array<{ role: string; content: string }>,
): Promise<void> {
  try {
    const { db } = await import('@szl-holdings/db');
    const { messages } = await import('@szl-holdings/db/schema');

    const cached = conversationStore.get(conversationId);
    let dbConversationId = cached?.dbConversationId;

    if (!dbConversationId) {
      dbConversationId = await ensureDbConversation(conversationId, agentType);
      if (cached && dbConversationId) {
        cached.dbConversationId = dbConversationId;
        conversationStore.set(conversationId, cached);
      }
    }

    if (!dbConversationId) return;

    for (const msg of newMessages) {
      await db.insert(messages).values({
        conversationId: dbConversationId,
        role: msg.role,
        content: msg.content,
      });
    }
  } catch { /* non-fatal */ }
}

function getOrCreateConversation(
  conversationId: string,
  agentType: AgentType,
): ConversationMessage[] {
  cleanExpiredConversations();

  const existing = conversationStore.get(conversationId);
  if (existing) {
    existing.lastAccess = Date.now();
    return existing.messages;
  }

  if (conversationStore.size >= MAX_CONVERSATIONS) {
    let oldestKey = '';
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
  const messages: ConversationMessage[] = [{ role: 'system', content: config.systemPrompt }];
  conversationStore.set(conversationId, { messages, lastAccess: Date.now() });

  // Load history from DB asynchronously
  void loadConversationFromDb(conversationId, agentType);

  return messages;
}

async function loadConversationFromDb(conversationId: string, agentType: AgentType): Promise<void> {
  try {
    const { db } = await import('@szl-holdings/db');
    const { conversations, messages: messagesTable } = await import('@szl-holdings/db/schema');
    const { eq, asc } = await import('drizzle-orm');

    const conv = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.title, `agent:${agentType}:${conversationId}`))
      .limit(1);

    if (conv.length === 0) return;
    const dbConvId = conv[0]!.id;

    const dbMessages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, dbConvId))
      .orderBy(asc(messagesTable.createdAt))
      .limit(50);

    if (dbMessages.length === 0) return;

    const cached = conversationStore.get(conversationId);
    if (!cached) return;

    // Only restore from DB if no user messages have been added during the async gap.
    // If the caller already pushed a user message, overwriting would drop it.
    const hasUserMessages = cached.messages.some((m) => m.role === 'user');
    if (hasUserMessages) {
      cached.dbConversationId = dbConvId;
      conversationStore.set(conversationId, cached);
      return;
    }

    const config = AGENT_CONFIGS[agentType];
    const history: ConversationMessage[] = [
      { role: 'system', content: config.systemPrompt },
      ...dbMessages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role as ConversationMessage['role'], content: m.content })),
    ];

    cached.messages.length = 0;
    history.forEach((m) => cached.messages.push(m));
    cached.dbConversationId = dbConvId;
    conversationStore.set(conversationId, cached);
  } catch { /* non-fatal */ }
}

export async function runDomainAgentChat(
  agentType: AgentType,
  userMessage: string,
  conversationId: string,
): Promise<string> {
  const sdkResult = await runAgentViaSdkIfOptIn(agentType, userMessage, conversationId);
  if (sdkResult !== null) return sdkResult;

  const config = AGENT_CONFIGS[agentType];
  const modelConfig = getModelConfig(agentType);
  const messages = getOrCreateConversation(conversationId, agentType);

  let effectiveModel = modelConfig.model;
  try {
    const resolution = await resolveModelForAgent(agentType, modelConfig.model, {
      preferFineTuned: true,
      minLifecycle: 'canary',
    });
    if (resolution.isFineTuned) effectiveModel = resolution.model;
  } catch {}

  messages.push({ role: 'user', content: userMessage });
  void persistConversationMessages(conversationId, agentType, [{ role: 'user', content: userMessage }]);

  const ai = services.ai;
  const startMs = Date.now();
  const toolsUsed: string[] = [];

  const toolDescriptions =
    config.tools.length > 0
      ? `\n\nYou have access to these tools:\n${config.tools.map((t) => `- ${t.name}: ${t.description}`).join('\n')}\n\nTo use a tool, respond with JSON: {"tool": "tool_name", "args": {...}}\nAfter receiving tool results, provide your final answer to the user.`
      : '';

  const systemMessage = config.systemPrompt + toolDescriptions;
  const chatMessages: ChatMessage[] = [
    { role: 'system', content: systemMessage },
    ...messages
      .filter((m) => m.role !== 'system')
      .slice(-20)
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
  ];

  const domain = getAgentDomain(agentType);
  const recType = getAgentRecType(agentType);
  const evalCtx: DomainEvalContext = { domain };

  function emitTrace(
    responseText: string,
    completion: ChatCompletionResult,
    isFallback: boolean,
  ): void {
    const latencyMs = Date.now() - startMs;
    const confidence = computeConfidenceProxy(responseText, isFallback);
    const trace = captureTrace({
      domain,
      recommendationType: recType,
      model: completion.model,
      modelProvider: completion.provider,
      agentId: agentType,
      promptText: userMessage.slice(0, 500),
      latencyMs,
      promptTokens: completion.usage.promptTokens,
      completionTokens: completion.usage.completionTokens,
      confidence,
      toolsUsed: toolsUsed.length > 0 ? [...toolsUsed] : undefined,
      outputSummary: responseText.slice(0, 200),
    });
    autoEnqueueTrace(trace);
    void persistEvalAsync(trace, evalCtx);
  }

  let lastCompletion: ChatCompletionResult | null = null;
  let rounds = 0;
  while (rounds < MAX_TOOL_ROUNDS) {
    rounds++;

    const result = await ai.chatCompletion(chatMessages, {
      model: effectiveModel,
      maxTokens: modelConfig.maxCompletionTokens,
    });
    lastCompletion = result;

    const responseText = result.content.trim();

    let toolCall: { tool: string; args: Record<string, unknown> } | null = null;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*"tool"\s*:\s*"[^"]+"/);
      if (jsonMatch) {
        const braceStart = responseText.indexOf('{', jsonMatch.index);
        let depth = 0;
        let end = braceStart;
        for (let i = braceStart; i < responseText.length; i++) {
          if (responseText[i] === '{') depth++;
          if (responseText[i] === '}') depth--;
          if (depth === 0) {
            end = i + 1;
            break;
          }
        }
        const parsed = JSON.parse(responseText.slice(braceStart, end));
        if (parsed.tool && typeof parsed.tool === 'string') {
          toolCall = { tool: parsed.tool, args: parsed.args || {} };
        }
      }
    } catch {
      toolCall = null;
    }

    if (!toolCall) {
      messages.push({ role: 'assistant', content: responseText });
      void persistConversationMessages(conversationId, agentType, [{ role: 'assistant', content: responseText }]);
      emitTrace(responseText, result, false);
      return responseText;
    }

    logger.info({ agentType, tool: toolCall.tool, round: rounds }, 'Domain agent tool call');
    toolsUsed.push(toolCall.tool);

    const toolResult = await config.executeTool(toolCall.tool, toolCall.args);

    chatMessages.push({ role: 'assistant', content: responseText });
    chatMessages.push({
      role: 'user',
      content: `Tool result for ${toolCall.tool}:\n${toolResult}`,
    });
  }

  const fallback =
    "I've reached the maximum number of analysis steps. Here's what I've gathered so far based on the available data.";
  messages.push({ role: 'assistant', content: fallback });
  void persistConversationMessages(conversationId, agentType, [{ role: 'assistant', content: fallback }]);
  if (lastCompletion) {
    emitTrace(fallback, lastCompletion, true);
  }
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

  let effectiveStreamModel = modelConfig.model;
  try {
    const resolution = await resolveModelForAgent(agentType, modelConfig.model, {
      preferFineTuned: true,
      minLifecycle: 'canary',
    });
    if (resolution.isFineTuned) effectiveStreamModel = resolution.model;
  } catch {}

  messages.push({ role: 'user', content: userMessage });
  void persistConversationMessages(conversationId, agentType, [{ role: 'user', content: userMessage }]);

  const ai = services.ai;
  const startMs = Date.now();

  const toolDescriptions =
    config.tools.length > 0
      ? `\n\nYou have access to these tools:\n${config.tools.map((t) => `- ${t.name}: ${t.description}`).join('\n')}\n\nTo use a tool, respond with JSON: {"tool": "tool_name", "args": {...}}\nAfter receiving tool results, provide your final answer to the user.`
      : '';

  const systemMessage = config.systemPrompt + toolDescriptions;
  const chatMessages: ChatMessage[] = [
    { role: 'system', content: systemMessage },
    ...messages
      .filter((m) => m.role !== 'system')
      .slice(-20)
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
  ];

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let fullResponse = '';

  const domain = getAgentDomain(agentType);
  const recType = getAgentRecType(agentType);
  const evalCtx: DomainEvalContext = { domain };

  try {
    const stream = ai.streamChatCompletion(chatMessages, {
      model: effectiveStreamModel,
      maxTokens: modelConfig.maxCompletionTokens,
    });

    for await (const chunk of stream) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }

    messages.push({ role: 'assistant', content: fullResponse });
    void persistConversationMessages(conversationId, agentType, [{ role: 'assistant', content: fullResponse }]);

    const streamTrace = captureTrace({
      domain,
      recommendationType: recType,
      model: effectiveStreamModel,
      modelProvider: ai.isProviderConfigured('replit-proxy')
        ? 'replit-proxy'
        : ai.isProviderConfigured('anthropic')
          ? 'anthropic'
          : 'openai',
      agentId: agentType,
      promptText: userMessage.slice(0, 500),
      latencyMs: Date.now() - startMs,
      confidence: computeConfidenceProxy(fullResponse, false),
      outputSummary: fullResponse.slice(0, 200),
    });
    autoEnqueueTrace(streamTrace);
    void persistEvalAsync(streamTrace, evalCtx);

    res.write(`data: [DONE]\n\n`);
  } catch (err) {
    logger.error({ err, agentType }, 'Stream error');
    res.write(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`);
  }

  res.end();
}
