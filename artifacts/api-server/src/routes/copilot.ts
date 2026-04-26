import { anthropic } from '@szl-holdings/ai-engine/providers/anthropic';
import { createResponse, createResponseStream } from '@szl-holdings/ai-engine/providers/openai';
import { type RequestHandler, type IRouter, type Request, type Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { validateBody } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';

const copilotRouter: IRouter = Router();
copilotRouter.use(tenantScope({ required: true }));

const copilotLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

type ModelProvider = 'openai' | 'anthropic';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const DOMAIN_SYSTEM_PROMPTS: Record<string, string> = {
  command: `You are Command AI, the cross-ecosystem intelligence analyst for the SZL Holdings Ecosystem Command Portal. You synthesise intelligence from maritime (Vessels), security (Aegis), real estate (Terra), legal (Counsel), operations (Lyte), and the family office (SZL Holdings). Surface cross-domain risks, correlated events, and executive-level insights. Be strategic and concise.`,
  vessels: `You are Helmsman, the AI copilot for Vessels Maritime Intelligence. You specialize in fleet tracking, AIS data, voyage economics, route risk, dark vessel detection, and maritime compliance. Be operational and nautical in your analysis.`,
  firestorm: `You are Sentinel, the AI copilot for Aegis Defense & Intelligence Command. You specialize in cybersecurity threat analysis, incident response, vulnerability assessment, MITRE ATT&CK, and security compliance. Be direct and technical.`,
  aegis: `You are Sentinel, the AI copilot for Aegis Defense & Intelligence Command. You specialize in cybersecurity threat analysis, incident response, vulnerability assessment, MITRE ATT&CK, and security compliance. Be direct and technical.`,
  terra: `You are Terrain, the AI copilot for Terra Real Estate Intelligence. You specialize in portfolio management, property analytics, deal pipeline, market intelligence, and distress detection. Be analytical and data-driven.`,
  lyte: `You are Lyte Ops, the AI copilot for Lyte Command Center. You specialize in signal analysis, incident triage, operational recommendations, and AIOps. Be operational and action-oriented.`,
  prism: `You are Counsel, the AI copilot for Counsel. You specialize in legal matter intelligence, discovery management, deadline tracking, and litigation risk assessment. All outputs are advisory and require attorney review.`,
  carlota: `You are Carlota, the AI assistant for Carlota Jo Consulting. You specialize in capability development, strategic transformation, and engagement advisory. Be warm, professional, and precise.`,
  stephen: `You are Stephen AI, the AI assistant for Stephen Lutar's career and identity site. You help visitors understand Stephen's work, the SZL Holdings platform, and the strategic thesis. Be precise and authoritative.`,
  szl: `You are Navigator, the AI guide for the SZL Holdings platform ecosystem. You help users understand the platform architecture, products, and strategic thesis. Be informative and measured.`,
  beacon: `You are Lyte Ops, an operations intelligence specialist. You specialize in signal processing, incident triage, and operational optimization. Be operational and action-oriented.`,
};

function routeModel(content: string, agentId?: string): { provider: ModelProvider; model: string } {
  const lower = content.toLowerCase();
  const analysisKeywords = [
    'analyze',
    'analyse',
    'explain',
    'why',
    'how does',
    'debug',
    'diagnose',
    'review',
    'assess',
    'reason',
    'root cause',
    'investigate',
    'compare',
    'synthesize',
    'synthesise',
    'cross',
  ];
  if (analysisKeywords.some((k) => lower.includes(k)) || agentId === 'command') {
    return { provider: 'anthropic', model: 'claude-sonnet-4-6' };
  }
  return { provider: 'openai', model: 'gpt-5.2' };
}

function buildSystemPrompt(
  agentId?: string,
  baseSystemPrompt?: string,
  context?: Record<string, unknown>,
): string {
  const domainPrompt = agentId ? (DOMAIN_SYSTEM_PROMPTS[agentId] ?? '') : '';
  const base = baseSystemPrompt ?? domainPrompt;

  let contextSection = '';
  if (context && Object.keys(context).length > 0) {
    contextSection = `\n\n## Current Context\n`;
    if (context.currentPage) contextSection += `- Current page: ${context.currentPage}\n`;
    if (context.selectedEntity)
      contextSection += `- Selected entity: ${JSON.stringify(context.selectedEntity)}\n`;
    if (context.userRole) contextSection += `- User role: ${context.userRole}\n`;
    if (context.additionalContext)
      contextSection += `- Additional context: ${context.additionalContext}\n`;
  }

  const footer = `\n\nToday's date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;

  return base + contextSection + footer;
}

const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(50000),
});

const copilotChatSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(100),
  agentId: z.string().max(100).optional(),
  context: z.record(z.unknown()).optional(),
  stream: z.boolean().optional().default(true),
});

copilotRouter.post(
  '/copilot/chat',
  copilotLimit,
  authMiddleware(),
  validateBody(copilotChatSchema),
  async (req: Request, res: Response) => {
    const {
      messages,
      agentId,
      context,
      stream = true,
    } = req.body as z.infer<typeof copilotChatSchema>;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'messages array is required' });
      return;
    }

    const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
    const baseSystemPrompt = messages.find((m) => m.role === 'system')?.content;
    const chatMessages = messages.filter((m) => m.role !== 'system');

    const systemPrompt = buildSystemPrompt(agentId, baseSystemPrompt, context);
    const { provider, model } = routeModel(lastUserMessage?.content ?? '', agentId);

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      try {
        if (provider === 'anthropic') {
          const anthropicMessages = chatMessages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }));

          const streamResult = anthropic.messages.stream({
            model,
            max_tokens: 4096,
            system: systemPrompt,
            messages: anthropicMessages,
          });

          for await (const event of streamResult) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
            }
          }
        } else {
          const openaiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
            { role: 'system', content: systemPrompt },
            ...chatMessages.map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
          ];

          for await (const chunk of createResponseStream(openaiMessages, {
            model,
            maxOutputTokens: 4096,
          })) {
            res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
          }
        }

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`);
        res.end();
      }
    } else {
      try {
        let content = '';
        if (provider === 'anthropic') {
          const anthropicMessages = chatMessages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }));
          const result = await anthropic.messages.create({
            model,
            max_tokens: 4096,
            system: systemPrompt,
            messages: anthropicMessages,
          });
          content = result.content[0]?.type === 'text' ? result.content[0].text : '';
        } else {
          const openaiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
            { role: 'system', content: systemPrompt },
            ...chatMessages.map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
          ];
          const result = await createResponse(openaiMessages, {
            model,
            maxOutputTokens: 4096,
          });
          content = result.content ?? '';
        }

        res.json({ content });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({ error: errorMsg });
      }
    }
  },
);

export default copilotRouter;
