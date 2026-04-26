/**
 * APEX — Expo Speech TTS Adapter
 *
 * A mobile-native TTSAdapter backed by expo-speech. Implements the same
 * TTSAdapter interface as BrowserWebSpeechTTSAdapter so the APEX executive
 * briefing path runs through SpeechSpecialist.renderBriefing() rather than
 * calling expo-speech directly.
 *
 * Registers as providerId 'expo-speech' so provenance metadata clearly
 * identifies the runtime adapter in use.
 */

import * as Speech from 'expo-speech';

import type { TTSAdapter } from '@szl-holdings/speech-specialist';
import type { TTSRequest, TTSResult } from '@szl-holdings/speech-specialist';

export class ExpoSpeechTTSAdapter implements TTSAdapter {
  readonly providerId = 'expo-speech';
  readonly supportedLocales = ['*'];

  isAvailable(): boolean {
    return true;
  }

  async synthesize(req: TTSRequest): Promise<TTSResult> {
    const start = Date.now();

    await new Promise<void>((resolve) => {
      Speech.speak(req.text, {
        language: req.voice.locale ?? 'en-US',
        rate: req.voice.speakingRate ?? 0.9,
        pitch: req.voice.pitch ?? 1.0,
        onDone: resolve,
        onError: () => resolve(),
        onStopped: () => resolve(),
      });
    });

    const durationMs = Date.now() - start;

    return {
      audioData: new Uint8Array(0),
      mimeType: 'audio/wav',
      durationMs,
      characterCount: req.text.length,
      provider: this.providerId,
      voiceId: req.voice.voiceId,
      locale: req.voice.locale,
      generatedAt: new Date().toISOString(),
      provenance: {
        adapterType: 'expo-speech',
        segmentId: req.segmentId,
        domain: req.domain,
      },
    };
  }

  stop(): void {
    Speech.stop();
  }
}
