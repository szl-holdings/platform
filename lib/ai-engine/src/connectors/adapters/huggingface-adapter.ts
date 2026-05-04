import { type ConnectorAuthConfig, type ConnectorRateLimitConfig, type ConnectorToolDefinition, BaseConnectorAdapter } from '../connector-interface.js';
import { enforceInferenceGates } from '../../providers/inference-gates.js';

export class HuggingFaceConnectorAdapter extends BaseConnectorAdapter {
  connectorId = 'huggingface';
  displayName = 'HuggingFace';
  description = 'HuggingFace Inference API — run models for NLP, vision, audio, and more';
  category = 'ai_service' as const;
  vendor = 'HuggingFace';
  version = '1.0.0';
  docsUrl = 'https://huggingface.co/docs/api-inference';

  authConfig: ConnectorAuthConfig = {
    type: 'bearer',
    envVarNames: ['HUGGINGFACE_API_KEY'],
  };

  rateLimit: ConnectorRateLimitConfig = {
    requestsPerMinute: 60,
    requestsPerDay: 30000,
  };

  tools: ConnectorToolDefinition[] = [
    {
      name: 'text_classification',
      description: 'Run text classification using a HuggingFace model',
      inputSchema: {
        type: 'object',
        required: ['inputs'],
        properties: {
          model: { type: 'string', default: 'distilbert-base-uncased-finetuned-sst-2-english' },
          inputs: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: { label: { type: 'string' }, score: { type: 'number' } },
      },
      costEstimate: 'free',
    },
    {
      name: 'feature_extraction',
      description: 'Generate embeddings using HuggingFace sentence transformers',
      inputSchema: {
        type: 'object',
        required: ['inputs'],
        properties: {
          model: { type: 'string', default: 'sentence-transformers/all-MiniLM-L6-v2' },
          inputs: { type: 'string' },
        },
      },
      outputSchema: { type: 'object', properties: { embedding: { type: 'array' } } },
      costEstimate: 'free',
    },
    {
      name: 'search_models',
      description: 'Search HuggingFace Hub for models',
      inputSchema: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string' },
          task: { type: 'string' },
          limit: { type: 'number' },
        },
      },
      outputSchema: { type: 'object', properties: { models: { type: 'array' } } },
      costEstimate: 'free',
    },
  ];

  // Inference (text_classification, feature_extraction) is gated by the
  // shared 5-condition governance check used by the router and hf-client.
  // `search_models` hits the public Hub catalog and is NOT inference, so it
  // bypasses the gate.

  async execute(toolName: string, input: Record<string, unknown>): Promise<unknown> {
    const headers = { ...this.getAuthHeaders(), 'Content-Type': 'application/json' };

    if (toolName === 'text_classification') {
      const model = (input.model as string) ?? 'distilbert-base-uncased-finetuned-sst-2-english';
      enforceInferenceGates(model);
      const resp = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ inputs: input.inputs }),
      });
      if (!resp.ok) {
        throw new Error(`hf_classification_error:${resp.status}`);
      }
      const data = (await resp.json()) as Array<Array<{ label: string; score: number }>>;
      const top = data[0]?.[0];
      return { label: top?.label ?? 'unknown', score: top?.score ?? 0 };
    }

    if (toolName === 'feature_extraction') {
      const model = (input.model as string) ?? 'sentence-transformers/all-MiniLM-L6-v2';
      enforceInferenceGates(model);
      const resp = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ inputs: input.inputs }),
      });
      if (!resp.ok) {
        throw new Error(`hf_feature_extraction_error:${resp.status}`);
      }
      const data = (await resp.json()) as number[][];
      return { embedding: data[0] ?? [] };
    }

    if (toolName === 'search_models') {
      const params = new URLSearchParams({
        search: input.query as string,
        limit: String(input.limit ?? 10),
      });
      if (input.task) params.set('pipeline_tag', input.task as string);
      const resp = await fetch(`https://huggingface.co/api/models?${params}`, { headers });
      const data = (await resp.json()) as unknown[];
      return { models: data };
    }

    throw new Error(`Unknown tool: ${toolName}`);
  }
}
