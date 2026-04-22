import { ToolConnector } from '../framework.js';
import type { AuthConfig, Capability, ConnectorCategory } from '../types.js';

export class GroqConnector extends ToolConnector {
  readonly id = 'groq';
  readonly name = 'Groq';
  readonly description =
    'Groq — ultra-fast LLM inference via LPU hardware. Supports Llama 3, Mixtral, Gemma, and Whisper with industry-leading token throughput';
  readonly category: ConnectorCategory = 'ai_inference';
  readonly version = '1.0.0';

  readonly authConfig: AuthConfig = {
    scheme: 'api_key',
    requiredEnvVars: ['GROQ_API_KEY'],
    description: 'API key from console.groq.com/keys',
  };

  readonly capabilities: Capability[] = [
    {
      id: 'chat_completion',
      name: 'Chat Completion',
      description: 'Generate a chat completion using a Groq-hosted model',
      parameters: [
        {
          name: 'model',
          type: 'string',
          description:
            'Model ID: llama3-70b-8192, llama3-8b-8192, mixtral-8x7b-32768, gemma2-9b-it',
          required: false,
        },
        {
          name: 'messages',
          type: 'array',
          description: 'Array of {role, content} message objects',
          required: true,
        },
        {
          name: 'maxTokens',
          type: 'number',
          description: 'Maximum tokens to generate (default 1024)',
          required: false,
        },
        {
          name: 'temperature',
          type: 'number',
          description: 'Sampling temperature 0.0–2.0 (default 0.7)',
          required: false,
        },
        {
          name: 'stream',
          type: 'boolean',
          description: 'Enable streaming (not supported via connector hub — returns full response)',
          required: false,
        },
      ],
      requiresAuth: true,
      tags: ['inference', 'llm', 'chat'],
      rateLimit: { requestsPerMinute: 30, requestsPerHour: 500 },
    },
    {
      id: 'transcribe_audio',
      name: 'Transcribe Audio',
      description: "Transcribe audio using Whisper via Groq's API (fast inference)",
      parameters: [
        {
          name: 'audioUrl',
          type: 'string',
          description: 'URL of the audio file to transcribe',
          required: true,
        },
        {
          name: 'language',
          type: 'string',
          description: 'Language code (e.g. en, es, fr — default: auto-detect)',
          required: false,
        },
        {
          name: 'model',
          type: 'string',
          description: 'Whisper model: whisper-large-v3 (default)',
          required: false,
        },
      ],
      requiresAuth: true,
      tags: ['inference', 'audio', 'transcription'],
      rateLimit: { requestsPerMinute: 20 },
    },
    {
      id: 'list_models',
      name: 'List Models',
      description: 'List all available models on Groq',
      parameters: [],
      requiresAuth: true,
      tags: ['read', 'models'],
    },
  ];

  protected async performCapability(
    capabilityId: string,
    params: Record<string, unknown>,
  ): Promise<unknown> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY not configured');

    const baseUrl = 'https://api.groq.com/openai/v1';
    const headers = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    switch (capabilityId) {
      case 'chat_completion': {
        const resp = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: params.model ?? 'llama3-70b-8192',
            messages: params.messages,
            max_tokens: params.maxTokens ?? 1024,
            temperature: params.temperature ?? 0.7,
          }),
        });
        if (!resp.ok) throw new Error(`Groq API error ${resp.status}: ${await resp.text()}`);
        return resp.json();
      }
      case 'transcribe_audio': {
        const resp = await fetch(`${baseUrl}/audio/transcriptions`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            url: params.audioUrl,
            model: params.model ?? 'whisper-large-v3',
            language: params.language,
          }),
        });
        if (!resp.ok)
          throw new Error(`Groq transcription error ${resp.status}: ${await resp.text()}`);
        return resp.json();
      }
      case 'list_models': {
        const resp = await fetch(`${baseUrl}/models`, { headers });
        if (!resp.ok) throw new Error(`Groq API error ${resp.status}: ${await resp.text()}`);
        return resp.json();
      }
      default:
        throw new Error(`Unknown capability: ${capabilityId}`);
    }
  }

  protected override async performHealthCheck(): Promise<void> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY not configured');
    const resp = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) throw new Error(`Groq health check failed: ${resp.status}`);
  }
}
