/**
 * Speech Specialist — Main Orchestrator
 *
 * The SpeechSpecialist wires TTS, ASR, and diarization adapters together
 * and exposes the executive briefing audio render path. Adapters can be
 * swapped at any time without restarting.
 */

import type { ASRAdapter, DiarizationAdapter, TTSAdapter } from './adapters.js';
import {
  MultilingualASRAdapterSlot,
  MultilingualTTSAdapterSlot,
  NoOpDiarizationAdapter,
} from './adapters.js';
import { renderBriefingAudio } from './briefing-audio.js';
import type {
  ASRRequest,
  ASRResult,
  BriefingAudioRequest,
  BriefingAudioResult,
  DiarizationRequest,
  DiarizationResult,
  SpeechLocale,
  TTSRequest,
  TTSResult,
} from './types.js';

export interface SpeechSpecialistAdapters {
  tts: TTSAdapter;
  asr: ASRAdapter;
  diarization: DiarizationAdapter;
}

export interface SpeechSpecialistConfig {
  defaultLocale?: SpeechLocale;
  defaultOutputFormat?: TTSRequest['outputFormat'];
}

export class SpeechSpecialist {
  private ttsAdapter: TTSAdapter;
  private asrAdapter: ASRAdapter;
  private diarizationAdapter: DiarizationAdapter;
  private readonly config: Required<SpeechSpecialistConfig>;

  constructor(
    adapters: Partial<SpeechSpecialistAdapters> = {},
    config: SpeechSpecialistConfig = {},
  ) {
    this.ttsAdapter = adapters.tts ?? new MultilingualTTSAdapterSlot();
    this.asrAdapter = adapters.asr ?? new MultilingualASRAdapterSlot();
    this.diarizationAdapter = adapters.diarization ?? new NoOpDiarizationAdapter();
    this.config = {
      defaultLocale: config.defaultLocale ?? 'en-US',
      defaultOutputFormat: config.defaultOutputFormat ?? 'wav',
    };
  }

  /** Hot-swap one or more adapters without recreating the specialist */
  setAdapters(adapters: Partial<SpeechSpecialistAdapters>): void {
    if (adapters.tts) this.ttsAdapter = adapters.tts;
    if (adapters.asr) this.asrAdapter = adapters.asr;
    if (adapters.diarization) this.diarizationAdapter = adapters.diarization;
  }

  getAdapters(): SpeechSpecialistAdapters {
    return {
      tts: this.ttsAdapter,
      asr: this.asrAdapter,
      diarization: this.diarizationAdapter,
    };
  }

  /** Text-to-speech synthesis */
  synthesize(req: TTSRequest): Promise<TTSResult> {
    return this.ttsAdapter.synthesize({
      ...req,
      voice: {
        ...req.voice,
        locale: req.voice.locale ?? this.config.defaultLocale,
      },
      outputFormat: req.outputFormat ?? this.config.defaultOutputFormat,
    });
  }

  /** Automatic speech recognition */
  transcribe(req: ASRRequest): Promise<ASRResult> {
    return this.asrAdapter.transcribe({
      ...req,
      locale: req.locale ?? this.config.defaultLocale,
    });
  }

  /** Speaker diarization + turn detection */
  diarize(req: DiarizationRequest): Promise<DiarizationResult> {
    return this.diarizationAdapter.diarize({
      ...req,
      locale: req.locale ?? this.config.defaultLocale,
    });
  }

  /**
   * Executive Briefing Audio Render
   * Called by KORA, Command Portal, and APEX to produce audio from
   * a structured brief. Returns audio bytes + provenance metadata.
   */
  renderBriefing(req: BriefingAudioRequest): Promise<BriefingAudioResult> {
    return renderBriefingAudio(
      {
        ...req,
        locale: req.locale ?? this.config.defaultLocale,
        outputFormat: req.outputFormat ?? this.config.defaultOutputFormat,
      },
      this.ttsAdapter,
    );
  }

  /** Check availability of all adapters */
  status(): {
    tts: { providerId: string; available: boolean };
    asr: { providerId: string; available: boolean };
    diarization: { providerId: string; available: boolean };
  } {
    return {
      tts: { providerId: this.ttsAdapter.providerId, available: this.ttsAdapter.isAvailable() },
      asr: { providerId: this.asrAdapter.providerId, available: this.asrAdapter.isAvailable() },
      diarization: {
        providerId: this.diarizationAdapter.providerId,
        available: this.diarizationAdapter.isAvailable(),
      },
    };
  }
}

/** Singleton speech specialist with no-op adapters by default */
export const defaultSpeechSpecialist = new SpeechSpecialist();
