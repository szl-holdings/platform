import { services } from '../../registry.js';
import { ToolConnector } from '../framework.js';
import type { AuthConfig, Capability, ConnectorCategory } from '../types.js';

export class HuggingFaceConnector extends ToolConnector {
  readonly id = 'huggingface';
  readonly name = 'HuggingFace';
  readonly description =
    'HuggingFace — open-source model hub and Inference API: text generation, summarization, classification, NER, embeddings, translation, and image generation';
  readonly category: ConnectorCategory = 'ai_models';
  readonly version = '1.0.0';

  readonly authConfig: AuthConfig = {
    scheme: 'api_key',
    requiredEnvVars: ['HUGGINGFACE_API_KEY'],
    description: 'Access token from huggingface.co/settings/tokens',
  };

  readonly capabilities: Capability[] = [
    {
      id: 'text_generation',
      name: 'Text Generation',
      description:
        'Generate text using open-source LLMs (Mistral, Llama, Falcon, etc.) via HuggingFace Inference API',
      parameters: [
        {
          name: 'prompt',
          type: 'string',
          description: 'Input prompt for text generation',
          required: true,
        },
        {
          name: 'model',
          type: 'string',
          description: 'HuggingFace model ID (optional — uses tier-based selection)',
          required: false,
        },
        {
          name: 'maxTokens',
          type: 'number',
          description: 'Maximum new tokens to generate (default 512)',
          required: false,
        },
        {
          name: 'temperature',
          type: 'number',
          description: 'Sampling temperature 0.0–2.0',
          required: false,
        },
        {
          name: 'tier',
          type: 'string',
          description: 'Model tier: flagship, balanced, fast (default: balanced)',
          required: false,
          enum: ['flagship', 'balanced', 'fast'],
        },
      ],
      requiresAuth: true,
      tags: ['inference', 'llm', 'text'],
      rateLimit: { requestsPerMinute: 30 },
    },
    {
      id: 'summarize',
      name: 'Summarize',
      description: 'Summarize text using abstractive summarization models',
      parameters: [
        { name: 'text', type: 'string', description: 'Text to summarize', required: true },
        {
          name: 'maxLength',
          type: 'number',
          description: 'Maximum summary length (default 200)',
          required: false,
        },
        {
          name: 'minLength',
          type: 'number',
          description: 'Minimum summary length (default 30)',
          required: false,
        },
      ],
      requiresAuth: true,
      tags: ['inference', 'summarization'],
      rateLimit: { requestsPerMinute: 30 },
    },
    {
      id: 'classify_text',
      name: 'Classify Text',
      description: 'Classify text using fine-tuned or zero-shot classification models',
      parameters: [
        { name: 'text', type: 'string', description: 'Text to classify', required: true },
        {
          name: 'model',
          type: 'string',
          description: 'HuggingFace classifier model ID',
          required: false,
        },
      ],
      requiresAuth: true,
      tags: ['inference', 'classification'],
    },
    {
      id: 'zero_shot_classify',
      name: 'Zero-Shot Classification',
      description: 'Classify text into custom labels without fine-tuning',
      parameters: [
        { name: 'text', type: 'string', description: 'Text to classify', required: true },
        { name: 'labels', type: 'array', description: 'Candidate label strings', required: true },
        {
          name: 'multiLabel',
          type: 'boolean',
          description: 'Allow multiple labels (default false)',
          required: false,
        },
      ],
      requiresAuth: true,
      tags: ['inference', 'classification', 'zero-shot'],
    },
    {
      id: 'extract_entities',
      name: 'Extract Entities',
      description:
        'Extract named entities (people, places, organizations) from text using NER models',
      parameters: [
        {
          name: 'text',
          type: 'string',
          description: 'Text to extract entities from',
          required: true,
        },
        {
          name: 'model',
          type: 'string',
          description: 'HuggingFace NER model ID (optional)',
          required: false,
        },
      ],
      requiresAuth: true,
      tags: ['inference', 'ner'],
    },
    {
      id: 'get_embeddings',
      name: 'Get Embeddings',
      description: 'Generate vector embeddings for text using sentence transformers',
      parameters: [
        {
          name: 'texts',
          type: 'array',
          description: 'Array of text strings to embed',
          required: true,
        },
        {
          name: 'model',
          type: 'string',
          description: 'Embedding model ID (optional — default: BAAI/bge-small-en-v1.5)',
          required: false,
        },
      ],
      requiresAuth: true,
      tags: ['inference', 'embeddings', 'vectors'],
      rateLimit: { requestsPerMinute: 20 },
    },
    {
      id: 'get_health',
      name: 'Get Health Status',
      description:
        'Get HuggingFace Inference API health, model availability, and rate limit status',
      parameters: [],
      requiresAuth: true,
      tags: ['read', 'health'],
    },
  ];

  protected async performCapability(
    capabilityId: string,
    params: Record<string, unknown>,
  ): Promise<unknown> {
    const adapter = services.huggingface;
    switch (capabilityId) {
      case 'text_generation':
        return adapter.textGeneration(String(params['prompt']), {
          ...(params['model'] ? { model: String(params['model']) } : {}),
          maxTokens: params['maxTokens'] ? Number(params['maxTokens']) : 512,
        });
      case 'summarize':
        return adapter.summarization(String(params['text']), {
          ...(params['model'] ? { model: String(params['model']) } : {}),
          maxLength: params['maxLength'] ? Number(params['maxLength']) : 200,
        });
      case 'classify_text':
        return adapter.textClassification(String(params['text']), {
          ...(params['model'] ? { model: String(params['model']) } : {}),
        });
      case 'zero_shot_classify':
        return adapter.zeroShotClassification(
          String(params['text']),
          Array.isArray(params['labels']) ? params['labels'].map(String) : [],
          { ...(params['model'] ? { model: String(params['model']) } : {}) },
        );
      case 'extract_entities':
        return adapter.namedEntityRecognition(String(params['text']), {
          ...(params['model'] ? { model: String(params['model']) } : {}),
        });
      case 'get_embeddings':
        return adapter.embedding(
          Array.isArray(params['texts']) ? params['texts'].map(String) : [String(params['texts'])],
          { ...(params['model'] ? { model: String(params['model']) } : {}) },
        );
      case 'get_health':
        return adapter.getHealthStatus();
      default:
        throw new Error(`Unknown capability: ${capabilityId}`);
    }
  }

  protected override async performHealthCheck(): Promise<void> {
    services.huggingface.getHealthStatus();
  }
}
