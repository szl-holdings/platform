/**
 * Speech Specialist — Type Definitions
 *
 * Interfaces for TTS, ASR, diarization/turn-detection, and the provider
 * adapter slot pattern. All concrete providers implement these interfaces;
 * the specialist ships safe no-op adapters by default and accepts drop-in
 * swaps at runtime for real NIM/cloud provider adapters.
 */

export type SpeechLocale =
  | 'en-US'
  | 'en-GB'
  | 'es-ES'
  | 'es-MX'
  | 'fr-FR'
  | 'de-DE'
  | 'zh-CN'
  | 'zh-TW'
  | 'ja-JP'
  | 'ko-KR'
  | 'pt-BR'
  | 'ar-SA'
  | (string & {});

export type AudioFormat = 'wav' | 'mp3' | 'ogg' | 'opus' | 'pcm';

export type TTSVoiceStyle =
  | 'neutral'
  | 'authoritative'
  | 'conversational'
  | 'formal'
  | 'analytical';

export interface TTSVoiceConfig {
  voiceId: string;
  locale: SpeechLocale;
  style: TTSVoiceStyle;
  speakingRate?: number;
  pitch?: number;
}

export interface TTSRequest {
  text: string;
  voice: TTSVoiceConfig;
  outputFormat: AudioFormat;
  /** SSML markup allowed when true */
  ssml?: boolean;
  /** Segment label for logging / provenance */
  segmentId?: string;
  /** Source domain (e.g. 'lyte', 'vessels', 'counsel') */
  domain?: string;
}

export interface TTSResult {
  audioData: Uint8Array;
  mimeType: string;
  durationMs: number;
  characterCount: number;
  provider: string;
  voiceId: string;
  locale: SpeechLocale;
  generatedAt: string;
  /** Provenance chain for downstream retrieval */
  provenance?: Record<string, unknown>;
}

export interface ASRWord {
  word: string;
  startMs: number;
  endMs: number;
  confidence: number;
}

export interface ASRRequest {
  audioData: Uint8Array;
  mimeType: string;
  locale: SpeechLocale;
  /** Enable word-level timestamps */
  wordTimestamps?: boolean;
  /** Speaker count hint for diarization pre-processing */
  speakerHint?: number;
  domain?: string;
  segmentId?: string;
}

export interface ASRResult {
  transcript: string;
  words: ASRWord[];
  confidence: number;
  locale: SpeechLocale;
  durationMs: number;
  provider: string;
  generatedAt: string;
  provenance?: Record<string, unknown>;
}

export interface DiarizationSegment {
  speakerId: string;
  startMs: number;
  endMs: number;
  transcript: string;
  confidence: number;
  words: ASRWord[];
}

export interface TurnDetectionHint {
  silenceThresholdMs: number;
  endpointingModelId?: string;
}

export interface DiarizationRequest {
  audioData: Uint8Array;
  mimeType: string;
  locale: SpeechLocale;
  expectedSpeakers?: number;
  turnDetection?: TurnDetectionHint;
  domain?: string;
  segmentId?: string;
}

export interface DiarizationResult {
  segments: DiarizationSegment[];
  speakerCount: number;
  totalDurationMs: number;
  provider: string;
  generatedAt: string;
  provenance?: Record<string, unknown>;
}

/**
 * Executive Briefing Audio Render Request
 *
 * Used by Lyte, Command Portal, and CORTEX to request an audio render
 * of a structured executive briefing. The specialist converts the brief
 * to natural speech and returns an audio blob URL + metadata.
 */
export interface BriefingAudioRequest {
  briefId: string;
  domain: string;
  headline: string;
  situation: string;
  beliefs?: string[];
  recommendations?: string[];
  /** Preferred locale for voice synthesis */
  locale?: SpeechLocale;
  voice?: Partial<TTSVoiceConfig>;
  outputFormat?: AudioFormat;
}

export interface BriefingAudioResult {
  briefId: string;
  domain: string;
  audioData: Uint8Array;
  mimeType: string;
  durationMs: number;
  scriptText: string;
  locale: SpeechLocale;
  provider: string;
  generatedAt: string;
  /** Provenance metadata for the proof-chain consumer */
  provenance: BriefingAudioProvenance;
}

export interface BriefingAudioProvenance {
  briefId: string;
  domain: string;
  voiceId: string;
  locale: SpeechLocale;
  characterCount: number;
  segmentCount: number;
  generatedAt: string;
  adapterProvider: string;
}
