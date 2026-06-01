import { type ConnectorAuthConfig, type ConnectorRateLimitConfig, type ConnectorToolDefinition, BaseConnectorAdapter } from '../connector-interface.js';

export class ElevenLabsConnectorAdapter extends BaseConnectorAdapter {
  connectorId = 'elevenlabs';
  displayName = 'ElevenLabs';
  description = 'ElevenLabs voice AI — text-to-speech, voice cloning, and audio generation';
  category = 'ai_service' as const;
  vendor = 'ElevenLabs';
  version = '1.0.0';
  docsUrl = 'https://elevenlabs.io/docs/api-reference';

  authConfig: ConnectorAuthConfig = {
    type: 'api_key',
    envVarNames: ['ELEVENLABS_API_KEY'],
    headerName: 'xi-api-key',
  };

  rateLimit: ConnectorRateLimitConfig = {
    requestsPerMinute: 20,
    requestsPerDay: 200,
  };

  tools: ConnectorToolDefinition[] = [
    {
      name: 'text_to_speech',
      description: 'Convert text to speech using ElevenLabs voices',
      inputSchema: {
        type: 'object',
        required: ['text'],
        properties: {
          text: { type: 'string' },
          voiceId: { type: 'string', default: '21m00Tcm4TlvDq8ikWAM' },
          modelId: { type: 'string', default: 'eleven_monolingual_v1' },
          stability: { type: 'number' },
          similarityBoost: { type: 'number' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: { audioBase64: { type: 'string' }, contentType: { type: 'string' } },
      },
      costEstimate: 'medium',
    },
    {
      name: 'list_voices',
      description: 'List available ElevenLabs voices',
      inputSchema: { type: 'object', properties: {} },
      outputSchema: { type: 'object', properties: { voices: { type: 'array' } } },
      costEstimate: 'free',
    },
  ];

  async execute(toolName: string, input: Record<string, unknown>): Promise<unknown> {
    const headers = { ...this.getAuthHeaders(), 'Content-Type': 'application/json' };

    if (toolName === 'text_to_speech') {
      const voiceId = (input.voiceId as string) ?? '21m00Tcm4TlvDq8ikWAM';
      const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text: input.text,
          model_id: input.modelId ?? 'eleven_monolingual_v1',
          voice_settings: {
            stability: input.stability ?? 0.5,
            similarity_boost: input.similarityBoost ?? 0.75,
          },
        }),
      });
      if (!resp.ok) throw new Error(`ElevenLabs TTS failed: ${resp.status}`);
      const buffer = await resp.arrayBuffer();
      return {
        audioBase64: Buffer.from(buffer).toString('base64'),
        contentType: 'audio/mpeg',
      };
    }

    if (toolName === 'list_voices') {
      const resp = await fetch('https://api.elevenlabs.io/v1/voices', { headers });
      return resp.json();
    }

    throw new Error(`Unknown tool: ${toolName}`);
  }
}
