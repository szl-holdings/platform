import { type ConnectorAuthConfig, type ConnectorRateLimitConfig, type ConnectorToolDefinition, BaseConnectorAdapter } from '../connector-interface.js';

export class HoneyHiveConnectorAdapter extends BaseConnectorAdapter {
  connectorId = 'honeyhive';
  displayName = 'HoneyHive';
  description = 'HoneyHive AI observability — trace LLM calls, track evaluations, log feedback';
  category = 'observability' as const;
  vendor = 'HoneyHive';
  version = '1.0.0';
  docsUrl = 'https://docs.honeyhive.ai/api-reference';

  authConfig: ConnectorAuthConfig = {
    type: 'bearer',
    envVarNames: ['HONEYHIVE_API_KEY'],
  };

  rateLimit: ConnectorRateLimitConfig = {
    requestsPerMinute: 120,
    requestsPerDay: 100000,
  };

  tools: ConnectorToolDefinition[] = [
    {
      name: 'log_event',
      description: 'Log an LLM call or AI event to HoneyHive for observability',
      inputSchema: {
        type: 'object',
        required: ['project', 'event'],
        properties: {
          project: { type: 'string' },
          event: {
            type: 'object',
            properties: {
              eventType: { type: 'string', enum: ['model', 'tool', 'chain', 'session'] },
              config: { type: 'object' },
              inputs: { type: 'object' },
              outputs: { type: 'object' },
              metrics: { type: 'object' },
              userProperties: { type: 'object' },
              metadata: { type: 'object' },
              latency: { type: 'number' },
            },
          },
        },
      },
      outputSchema: {
        type: 'object',
        properties: { eventId: { type: 'string' }, success: { type: 'boolean' } },
      },
      costEstimate: 'free',
    },
    {
      name: 'submit_feedback',
      description: 'Submit human feedback on an AI response to HoneyHive',
      inputSchema: {
        type: 'object',
        required: ['eventId', 'feedback'],
        properties: {
          eventId: { type: 'string' },
          feedback: {
            type: 'object',
            properties: {
              rating: { type: 'number' },
              label: { type: 'string' },
              comment: { type: 'string' },
            },
          },
        },
      },
      outputSchema: { type: 'object', properties: { success: { type: 'boolean' } } },
      costEstimate: 'free',
    },
    {
      name: 'get_evaluations',
      description: 'Retrieve evaluation results from HoneyHive',
      inputSchema: {
        type: 'object',
        properties: {
          project: { type: 'string' },
          limit: { type: 'number' },
          startDate: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: { evaluations: { type: 'array' }, total: { type: 'number' } },
      },
      costEstimate: 'free',
    },
  ];

  async execute(toolName: string, input: Record<string, unknown>): Promise<unknown> {
    const headers = { ...this.getAuthHeaders(), 'Content-Type': 'application/json' };

    if (toolName === 'log_event') {
      const resp = await fetch('https://api.honeyhive.ai/events', {
        method: 'POST',
        headers,
        body: JSON.stringify({ project: input.project, event: input.event }),
      });
      if (!resp.ok) return { success: false, error: resp.statusText };
      const data = (await resp.json()) as { event_id?: string };
      return { eventId: data.event_id, success: true };
    }

    if (toolName === 'submit_feedback') {
      const resp = await fetch(`https://api.honeyhive.ai/events/${input.eventId}/feedback`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ feedback: input.feedback }),
      });
      return { success: resp.ok };
    }

    if (toolName === 'get_evaluations') {
      const params = new URLSearchParams();
      if (input.project) params.set('project', input.project as string);
      if (input.limit) params.set('limit', String(input.limit));
      if (input.startDate) params.set('start_date', input.startDate as string);
      const resp = await fetch(`https://api.honeyhive.ai/evaluations?${params}`, { headers });
      const data = (await resp.json()) as { evaluations?: unknown[]; total?: number };
      return { evaluations: data.evaluations ?? [], total: data.total ?? 0 };
    }

    throw new Error(`Unknown tool: ${toolName}`);
  }
}
