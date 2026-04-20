import type {
  ConnectorAuthConfig,
  ConnectorRateLimitConfig,
  ConnectorToolDefinition,
} from '../connector-interface.js';
import { BaseConnectorAdapter } from '../connector-interface.js';

export class GroqConnectorAdapter extends BaseConnectorAdapter {
  connectorId = 'groq';
  displayName = 'Groq';
  description = 'Groq LPU inference — ultra-fast LLM completions via Groq hardware';
  category = 'ai_service' as const;
  vendor = 'Groq';
  version = '1.0.0';
  docsUrl = 'https://console.groq.com/docs/openai';

  authConfig: ConnectorAuthConfig = {
    type: 'bearer',
    envVarNames: ['GROQ_API_KEY'],
  };

  rateLimit: ConnectorRateLimitConfig = {
    requestsPerMinute: 30,
    requestsPerDay: 14400,
  };

  tools: ConnectorToolDefinition[] = [
    {
      name: 'chat_completion',
      description: 'Run ultra-fast chat completions using Groq LPU',
      inputSchema: {
        type: 'object',
        required: ['messages'],
        properties: {
          messages: { type: 'array' },
          model: { type: 'string', default: 'llama-3.1-8b-instant' },
          maxTokens: { type: 'number' },
          temperature: { type: 'number' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          model: { type: 'string' },
          usage: { type: 'object' },
        },
      },
      costEstimate: 'low',
    },
    {
      name: 'fast_classification',
      description: 'Low-latency text classification using Groq',
      inputSchema: {
        type: 'object',
        required: ['text', 'categories'],
        properties: {
          text: { type: 'string' },
          categories: { type: 'array', items: { type: 'string' } },
          model: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: { category: { type: 'string' }, confidence: { type: 'number' } },
      },
      costEstimate: 'low',
    },
  ];

  async execute(toolName: string, input: Record<string, unknown>): Promise<unknown> {
    const headers = { ...this.getAuthHeaders(), 'Content-Type': 'application/json' };

    if (toolName === 'chat_completion') {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: input.model ?? 'llama-3.1-8b-instant',
          messages: input.messages,
          max_tokens: input.maxTokens ?? 1024,
          temperature: input.temperature ?? 0.7,
        }),
      });
      const data = (await resp.json()) as {
        choices: Array<{ message: { content: string } }>;
        model: string;
        usage: unknown;
      };
      return {
        content: data.choices[0]?.message?.content ?? '',
        model: data.model,
        usage: data.usage,
      };
    }

    if (toolName === 'fast_classification') {
      const systemPrompt = `You are a classifier. Classify the following text into one of these categories: ${(input.categories as string[]).join(', ')}. Respond with ONLY the category name and a confidence score 0-1 in format: CATEGORY: <name>\nCONFIDENCE: <score>`;
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: input.model ?? 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: input.text },
          ],
          max_tokens: 50,
        }),
      });
      const data = (await resp.json()) as { choices: Array<{ message: { content: string } }> };
      const text = data.choices[0]?.message?.content ?? '';
      const category = text.match(/CATEGORY:\s*(.+)/i)?.[1]?.trim() ?? 'unknown';
      const confidence = parseFloat(text.match(/CONFIDENCE:\s*([\d.]+)/i)?.[1] ?? '0.5');
      return { category, confidence };
    }

    throw new Error(`Unknown tool: ${toolName}`);
  }
}
