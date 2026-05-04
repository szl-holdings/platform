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

  /**
   * Returns the active HF credential (HUGGINGFACE_API_KEY preferred, then
   * HF_TOKEN), or undefined when neither is set. Used by both the credential
   * presence check and the per-call Authorization header so the two paths can
   * never disagree about whether the adapter has credentials.
   */
  private hfToken(): string | undefined {
    return process.env.HUGGINGFACE_API_KEY ?? process.env.HF_TOKEN;
  }

  /** Demo-fallback gate: only when no HF credential is set at all. */
  private credentialsAbsent(): boolean {
    return !this.hfToken();
  }

  /**
   * Override the base bearer-header builder so the Authorization header is
   * always derived from the same source as `credentialsAbsent()`. The base
   * class only inspects `envVarNames[0]`, which would silently drop
   * `HF_TOKEN`-only configurations.
   */
  protected override getAuthHeaders(): Record<string, string> {
    const token = this.hfToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Normalise HF text-classification responses into a single
   * Array<{label, score}>. The Inference API returns a nested array
   * `[[{label, score}, ...]]` for some models and a flat `[{label, score}, ...]`
   * for others depending on whether the input is batched. Callers must not
   * have to guess.
   */
  private flattenClassification(
    raw: unknown,
  ): Array<{ label: string; score: number }> {
    if (!Array.isArray(raw)) return [];
    const first = raw[0];
    if (Array.isArray(first)) return first as Array<{ label: string; score: number }>;
    return raw as Array<{ label: string; score: number }>;
  }

  async execute(toolName: string, input: Record<string, unknown>): Promise<unknown> {
    const headers = { ...this.getAuthHeaders(), 'Content-Type': 'application/json' };

    if (toolName === 'text_classification') {
      const model = (input.model as string) ?? 'distilbert-base-uncased-finetuned-sst-2-english';
      if (this.credentialsAbsent()) {
        return {
          label: 'demo',
          score: 0,
          mode: 'MOCKED_DEMO_MODE',
          reason: 'HUGGINGFACE_API_KEY/HF_TOKEN not configured — set credentials to enable live inference',
          model,
        };
      }
      enforceInferenceGates(model);
      const resp = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ inputs: input.inputs }),
      });
      if (!resp.ok) {
        throw new Error(`hf_classification_error:${resp.status}`);
      }
      const flat = this.flattenClassification(await resp.json());
      const top = flat[0];
      return { label: top?.label ?? 'unknown', score: top?.score ?? 0 };
    }

    if (toolName === 'feature_extraction') {
      const model = (input.model as string) ?? 'sentence-transformers/all-MiniLM-L6-v2';
      if (this.credentialsAbsent()) {
        return {
          embedding: [],
          mode: 'MOCKED_DEMO_MODE',
          reason: 'HUGGINGFACE_API_KEY not configured — set credentials to enable live inference',
          model,
        };
      }
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
