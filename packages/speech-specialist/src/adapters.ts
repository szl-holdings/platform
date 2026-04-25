/**
 * Speech Specialist — Provider Adapter Interfaces & Default Adapters
 *
 * Concrete provider adapters implement TTSAdapter, ASRAdapter, and
 * DiarizationAdapter. The specialist ships no-op default adapters that
 * are structurally correct and swap-ready for NIM/ElevenLabs/Azure/etc.
 *
 * Swap adapters at runtime via the SpeechSpecialist.setAdapters() API.
 */

import type {
  ASRRequest,
  ASRResult,
  DiarizationRequest,
  DiarizationResult,
  TTSRequest,
  TTSResult,
} from './types.js';

/**
 * Text-to-speech provider adapter.
 * Implement this interface to plug in ElevenLabs, Azure Cognitive Services,
 * NVIDIA Riva TTS, OpenAI TTS, etc.
 */
export interface TTSAdapter {
  readonly providerId: string;
  readonly supportedLocales: string[];
  synthesize(req: TTSRequest): Promise<TTSResult>;
  isAvailable(): boolean;
}

/**
 * Automatic speech recognition provider adapter.
 * Implement this interface to plug in Whisper, NVIDIA Riva ASR, Azure STT,
 * Deepgram, AssemblyAI, etc.
 */
export interface ASRAdapter {
  readonly providerId: string;
  readonly supportedLocales: string[];
  transcribe(req: ASRRequest): Promise<ASRResult>;
  isAvailable(): boolean;
}

/**
 * Speaker diarization + turn-detection provider adapter.
 * Implement this interface to plug in pyannote/speaker-diarization,
 * AWS Transcribe speaker labels, NVIDIA NIM diarization models, etc.
 */
export interface DiarizationAdapter {
  readonly providerId: string;
  diarize(req: DiarizationRequest): Promise<DiarizationResult>;
  isAvailable(): boolean;
}

/**
 * No-op TTS adapter — default safe fallback.
 * Returns a deterministically generated silence placeholder with correct
 * metadata so the rest of the pipeline can function without a live provider.
 * Replace via SpeechSpecialist.setTTSAdapter() in production.
 */
export class NoOpTTSAdapter implements TTSAdapter {
  readonly providerId = 'noop-tts';
  readonly supportedLocales = ['*'];

  synthesize(req: TTSRequest): Promise<TTSResult> {
    const enc = new TextEncoder();
    const audioData = enc.encode(`[AUDIO:${req.text.slice(0, 40)}]`);
    const charCount = req.text.length;
    const durationMs = Math.round(charCount * 60);
    return Promise.resolve({
      audioData,
      mimeType: 'audio/wav',
      durationMs,
      characterCount: charCount,
      provider: this.providerId,
      voiceId: req.voice.voiceId,
      locale: req.voice.locale,
      generatedAt: new Date().toISOString(),
      provenance: {
        adapterType: 'noop',
        segmentId: req.segmentId,
        domain: req.domain,
      },
    });
  }

  isAvailable(): boolean {
    return true;
  }
}

/**
 * No-op ASR adapter — default safe fallback.
 * Returns an empty transcript with correct metadata shape so callers can
 * operate without a live provider.
 */
export class NoOpASRAdapter implements ASRAdapter {
  readonly providerId = 'noop-asr';
  readonly supportedLocales = ['*'];

  transcribe(req: ASRRequest): Promise<ASRResult> {
    return Promise.resolve({
      transcript: '',
      words: [],
      confidence: 0,
      locale: req.locale,
      durationMs: 0,
      provider: this.providerId,
      generatedAt: new Date().toISOString(),
      provenance: {
        adapterType: 'noop',
        segmentId: req.segmentId,
        domain: req.domain,
      },
    });
  }

  isAvailable(): boolean {
    return true;
  }
}

/**
 * No-op diarization adapter — default safe fallback.
 * Returns a single-speaker segment containing the entire audio so the
 * diarization shape is valid without requiring a live model.
 */
export class NoOpDiarizationAdapter implements DiarizationAdapter {
  readonly providerId = 'noop-diarization';

  diarize(req: DiarizationRequest): Promise<DiarizationResult> {
    return Promise.resolve({
      segments: [
        {
          speakerId: 'SPEAKER_00',
          startMs: 0,
          endMs: 0,
          transcript: '',
          confidence: 0,
          words: [],
        },
      ],
      speakerCount: 1,
      totalDurationMs: 0,
      provider: this.providerId,
      generatedAt: new Date().toISOString(),
      provenance: {
        adapterType: 'noop',
        segmentId: req.segmentId,
        domain: req.domain,
      },
    });
  }

  isAvailable(): boolean {
    return true;
  }
}

/**
 * Multilingual TTS adapter slot.
 * Drop in a concrete multilingual TTS provider by implementing TTSAdapter.
 * Wire real locales in supportedLocales to enable locale-routing logic.
 */
export class MultilingualTTSAdapterSlot implements TTSAdapter {
  readonly providerId = 'multilingual-tts-slot';
  readonly supportedLocales: string[];
  private inner: TTSAdapter;

  constructor(inner: TTSAdapter = new NoOpTTSAdapter(), supportedLocales: string[] = ['*']) {
    this.inner = inner;
    this.supportedLocales = supportedLocales;
  }

  swap(adapter: TTSAdapter): void {
    this.inner = adapter;
  }

  synthesize(req: TTSRequest): Promise<TTSResult> {
    return this.inner.synthesize(req);
  }

  isAvailable(): boolean {
    return this.inner.isAvailable();
  }
}

/**
 * Multilingual ASR adapter slot.
 * Drop in a concrete multilingual ASR provider by calling swap().
 */
export class MultilingualASRAdapterSlot implements ASRAdapter {
  readonly providerId = 'multilingual-asr-slot';
  readonly supportedLocales: string[];
  private inner: ASRAdapter;

  constructor(inner: ASRAdapter = new NoOpASRAdapter(), supportedLocales: string[] = ['*']) {
    this.inner = inner;
    this.supportedLocales = supportedLocales;
  }

  swap(adapter: ASRAdapter): void {
    this.inner = adapter;
  }

  transcribe(req: ASRRequest): Promise<ASRResult> {
    return this.inner.transcribe(req);
  }

  isAvailable(): boolean {
    return this.inner.isAvailable();
  }
}
