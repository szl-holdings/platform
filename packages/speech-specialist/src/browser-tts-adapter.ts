/**
 * Speech Specialist — Browser Web Speech TTS Adapter
 *
 * A concrete TTSAdapter backed by the browser's Web Speech API
 * (speechSynthesis). Works out-of-the-box in all modern browsers without
 * requiring any external API key. Intended as the default live adapter for
 * web artifacts (KORA, Command Portal). Replace with NIM/ElevenLabs/Azure
 * for production voice quality.
 *
 * This adapter produces no Uint8Array audio data — instead it synthesizes
 * directly through the browser speaker. The audioData field contains a
 * placeholder marker so callers receive a valid TTSResult.
 */

import type { TTSAdapter } from './adapters.js';
import type { TTSRequest, TTSResult } from './types.js';

export class BrowserWebSpeechTTSAdapter implements TTSAdapter {
  readonly providerId = 'browser-web-speech';
  readonly supportedLocales = ['*'];

  isAvailable(): boolean {
    return (
      typeof globalThis !== 'undefined' &&
      typeof (globalThis as unknown as Window).speechSynthesis !== 'undefined'
    );
  }

  async synthesize(req: TTSRequest): Promise<TTSResult> {
    const enc = new TextEncoder();
    const start = Date.now();

    if (this.isAvailable()) {
      speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(req.text);
      utter.lang = req.voice.locale ?? 'en-US';
      utter.rate = req.voice.speakingRate ?? 0.95;
      utter.pitch = req.voice.pitch ?? 1.0;

      await new Promise<void>((resolve) => {
        utter.onend = () => resolve();
        utter.onerror = () => resolve();
        speechSynthesis.speak(utter);
      });
    }

    const durationMs = Date.now() - start;

    return {
      audioData: enc.encode(`[BROWSER-SPEECH:${req.text.slice(0, 40)}]`),
      mimeType: 'audio/wav',
      durationMs,
      characterCount: req.text.length,
      provider: this.providerId,
      voiceId: req.voice.voiceId,
      locale: req.voice.locale,
      generatedAt: new Date().toISOString(),
      provenance: {
        adapterType: 'browser-web-speech',
        segmentId: req.segmentId,
        domain: req.domain,
      },
    };
  }
}
