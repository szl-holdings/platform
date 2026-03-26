import { ServiceAdapter } from "../base.js";

export interface ElevenLabsVoice {
  id: string;
  name: string;
  category: string;
  previewUrl: string;
}

export interface TTSResult {
  audioUrl: string;
  characterCount: number;
  mock: boolean;
}

const MOCK_VOICES: ElevenLabsVoice[] = [
  {
    id: "voice_001",
    name: "Rachel",
    category: "premade",
    previewUrl: "https://api.elevenlabs.io/v1/voices/mock/preview",
  },
  {
    id: "voice_002",
    name: "Adam",
    category: "premade",
    previewUrl: "https://api.elevenlabs.io/v1/voices/mock/preview",
  },
];

export class ElevenLabsAdapter extends ServiceAdapter {
  readonly name = "elevenlabs";
  readonly description = "ElevenLabs AI voice synthesis and text-to-speech";
  readonly requiredEnvVars = ["ELEVENLABS_API_KEY"];

  private get apiKey(): string | undefined {
    return process.env["ELEVENLABS_API_KEY"];
  }

  protected async performHealthCheck(): Promise<void> {
    const result = await this.testConnection();
    if (!result.connected) throw new Error("ElevenLabs connection verification failed");
  }

  async testConnection(): Promise<{ connected: boolean; tier?: string }> {
    if (!this.isLive) return { connected: false };
    try {
      const response = await fetch("https://api.elevenlabs.io/v1/user", {
        headers: { "xi-api-key": this.apiKey! },
      });
      if (!response.ok) return { connected: false };
      const data = (await response.json()) as { subscription: { tier: string } };
      return { connected: true, tier: data.subscription?.tier };
    } catch {
      return { connected: false };
    }
  }

  async listVoices(): Promise<ElevenLabsVoice[]> {
    if (!this.isLive) return [...MOCK_VOICES];
    try {
      const response = await fetch("https://api.elevenlabs.io/v1/voices", {
        headers: { "xi-api-key": this.apiKey! },
      });
      if (!response.ok) return [...MOCK_VOICES];
      const data = (await response.json()) as {
        voices: Array<{
          voice_id: string;
          name: string;
          category: string;
          preview_url: string;
        }>;
      };
      return data.voices.map((v) => ({
        id: v.voice_id,
        name: v.name,
        category: v.category,
        previewUrl: v.preview_url,
      }));
    } catch {
      return [...MOCK_VOICES];
    }
  }

  async textToSpeech(text: string, voiceId?: string): Promise<TTSResult> {
    if (!this.isLive) {
      return {
        audioUrl: "https://api.elevenlabs.io/v1/mock/audio.mp3",
        characterCount: text.length,
        mock: true,
      };
    }
    return {
      audioUrl: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId ?? "default"}/stream`,
      characterCount: text.length,
      mock: false,
    };
  }

  async sync(): Promise<{ synced: number; timestamp: string }> {
    const voices = await this.listVoices();
    return { synced: voices.length, timestamp: new Date().toISOString() };
  }
}
