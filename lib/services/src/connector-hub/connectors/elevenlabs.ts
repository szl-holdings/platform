import { services } from '../../registry.js';
import { ToolConnector } from '../framework.js';
import type { AuthConfig, Capability, ConnectorCategory } from '../types.js';

export class ElevenLabsConnector extends ToolConnector {
  readonly id = 'elevenlabs';
  readonly name = 'ElevenLabs';
  readonly description =
    'ElevenLabs — AI voice synthesis and cloning: text-to-speech, voice selection, multilingual synthesis, and audio output generation';
  readonly category: ConnectorCategory = 'ai_voice';
  readonly version = '1.0.0';

  readonly authConfig: AuthConfig = {
    scheme: 'api_key',
    requiredEnvVars: ['ELEVENLABS_API_KEY'],
    description: 'API key from elevenlabs.io/app/settings > API',
  };

  readonly capabilities: Capability[] = [
    {
      id: 'text_to_speech',
      name: 'Text to Speech',
      description: 'Convert text to natural-sounding speech using ElevenLabs voice models',
      parameters: [
        {
          name: 'text',
          type: 'string',
          description: 'Text to synthesize (max 5000 characters)',
          required: true,
        },
        {
          name: 'voiceId',
          type: 'string',
          description: 'ElevenLabs voice ID (default: Rachel — 21m00Tcm4TlvDq8ikWAM)',
          required: false,
        },
      ],
      requiresAuth: true,
      tags: ['generate', 'voice', 'audio'],
      rateLimit: { requestsPerMinute: 20, requestsPerHour: 200 },
    },
    {
      id: 'list_voices',
      name: 'List Voices',
      description: 'Get all available ElevenLabs voices with metadata and sample audio URLs',
      parameters: [],
      requiresAuth: true,
      tags: ['read', 'voices'],
    },
  ];

  protected async performCapability(
    capabilityId: string,
    params: Record<string, unknown>,
  ): Promise<unknown> {
    const adapter = services.elevenlabs;
    switch (capabilityId) {
      case 'text_to_speech':
        return adapter.textToSpeech(
          String(params['text']),
          params['voiceId'] ? String(params['voiceId']) : undefined,
        );
      case 'list_voices':
        return adapter.listVoices();
      default:
        throw new Error(`Unknown capability: ${capabilityId}`);
    }
  }

  protected async performHealthCheck(): Promise<void> {
    await services.elevenlabs.testConnection();
  }
}
