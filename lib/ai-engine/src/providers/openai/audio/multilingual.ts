import { Buffer } from 'node:buffer';
import { openai, ensureCompatibleFormat } from './client.js';
import { toFile } from 'openai';

interface VerboseJsonTranscription {
  text: string;
  language?: string;
  duration?: number;
  words?: Array<{ word: string; start: number; end: number }>;
}

interface AudioChatMessage {
  role: string;
  content: string | null;
  audio?: {
    id: string;
    data: string;
    transcript: string;
  };
}

export type SupportedLanguage = 'en' | 'es' | 'zh' | 'ar' | 'fr';

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  bcp47: string;
  whisperCode: string;
  ttsVoice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
}

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    bcp47: 'en-US',
    whisperCode: 'en',
    ttsVoice: 'alloy',
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    bcp47: 'es-ES',
    whisperCode: 'es',
    ttsVoice: 'nova',
  },
  zh: {
    code: 'zh',
    name: 'Mandarin Chinese',
    nativeName: '中文',
    bcp47: 'zh-CN',
    whisperCode: 'zh',
    ttsVoice: 'shimmer',
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    bcp47: 'ar-SA',
    whisperCode: 'ar',
    ttsVoice: 'onyx',
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    bcp47: 'fr-FR',
    whisperCode: 'fr',
    ttsVoice: 'fable',
  },
};

export interface LanguageDetectionResult {
  detectedLanguage: SupportedLanguage;
  confidence: number;
  allScores: Array<{ language: SupportedLanguage; confidence: number }>;
}

export async function detectLanguage(audioBuffer: Buffer): Promise<LanguageDetectionResult> {
  const { buffer, format } = await ensureCompatibleFormat(audioBuffer);
  const file = await toFile(buffer, `detect.${format}`);

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'gpt-4o-mini-transcribe',
    response_format: 'verbose_json',
  });

  const verboseResult = transcription as unknown as VerboseJsonTranscription;
  const detectedLang = verboseResult.language ?? 'en';
  const langMapping: Record<string, SupportedLanguage> = {
    english: 'en',
    spanish: 'es',
    chinese: 'zh',
    mandarin: 'zh',
    arabic: 'ar',
    french: 'fr',
    en: 'en',
    es: 'es',
    zh: 'zh',
    ar: 'ar',
    fr: 'fr',
  };

  const normalizedLang = detectedLang.toLowerCase();
  const matched = langMapping[normalizedLang] ?? 'en';
  const isSupported = matched in SUPPORTED_LANGUAGES;

  return {
    detectedLanguage: isSupported ? matched : 'en',
    confidence: isSupported ? 0.9 : 0.5,
    allScores: Object.keys(SUPPORTED_LANGUAGES).map((lang) => ({
      language: lang as SupportedLanguage,
      confidence: lang === matched ? 0.9 : 0.1,
    })),
  };
}

export interface MultilingualTranscriptionResult {
  text: string;
  language: SupportedLanguage;
  languageConfidence: number;
  durationMs: number;
}

export async function transcribeMultilingual(
  audioBuffer: Buffer,
  language?: SupportedLanguage,
): Promise<MultilingualTranscriptionResult> {
  const startMs = Date.now();
  const { buffer, format } = await ensureCompatibleFormat(audioBuffer);
  const file = await toFile(buffer, `audio.${format}`);

  const langConfig = language ? SUPPORTED_LANGUAGES[language] : undefined;

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'gpt-4o-mini-transcribe',
    ...(langConfig ? { language: langConfig.whisperCode } : {}),
    response_format: 'verbose_json',
  });

  const verboseResult = transcription as unknown as VerboseJsonTranscription;
  const detectedLang = verboseResult.language ?? language ?? 'en';
  const langMapping: Record<string, SupportedLanguage> = {
    english: 'en', spanish: 'es', chinese: 'zh', mandarin: 'zh',
    arabic: 'ar', french: 'fr', en: 'en', es: 'es', zh: 'zh', ar: 'ar', fr: 'fr',
  };

  const resolvedLang = langMapping[detectedLang.toLowerCase()] ?? 'en';

  return {
    text: transcription.text,
    language: resolvedLang,
    languageConfidence: language ? 1.0 : 0.85,
    durationMs: Date.now() - startMs,
  };
}

export interface MultilingualTTSResult {
  audioBuffer: Buffer;
  language: SupportedLanguage;
  voice: string;
  durationMs: number;
}

export async function synthesizeSpeech(
  text: string,
  language: SupportedLanguage = 'en',
  options?: {
    voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
    format?: 'wav' | 'mp3' | 'opus';
  },
): Promise<MultilingualTTSResult> {
  const startMs = Date.now();
  const langConfig = SUPPORTED_LANGUAGES[language];
  const voice = options?.voice ?? langConfig.ttsVoice;
  const format = options?.format ?? 'mp3';

  const response = await openai.chat.completions.create({
    model: 'gpt-audio',
    modalities: ['text', 'audio'],
    audio: { voice, format },
    messages: [
      {
        role: 'system',
        content: `You are a text-to-speech assistant. Speak in ${langConfig.name}. Repeat the following text verbatim with natural pronunciation.`,
      },
      { role: 'user', content: text },
    ],
  });

  const audioMessage = response.choices[0]?.message as unknown as AudioChatMessage;
  const audioData = audioMessage?.audio?.data ?? '';

  return {
    audioBuffer: Buffer.from(audioData, 'base64'),
    language,
    voice,
    durationMs: Date.now() - startMs,
  };
}

export interface MultilingualVoiceChatResult {
  inputTranscript: string;
  responseText: string;
  audioResponse: Buffer;
  detectedLanguage: SupportedLanguage;
  durationMs: number;
}

export async function multilingualVoiceChat(
  audioBuffer: Buffer,
  options?: {
    language?: SupportedLanguage;
    autoDetect?: boolean;
    voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
    systemPrompt?: string;
  },
): Promise<MultilingualVoiceChatResult> {
  const startMs = Date.now();
  const autoDetect = options?.autoDetect ?? true;
  let language = options?.language ?? 'en';

  if (autoDetect && !options?.language) {
    try {
      const detection = await detectLanguage(audioBuffer);
      language = detection.detectedLanguage;
    } catch {
      language = 'en';
    }
  }

  const langConfig = SUPPORTED_LANGUAGES[language];
  const voice = options?.voice ?? langConfig.ttsVoice;

  const { buffer, format } = await ensureCompatibleFormat(audioBuffer);
  const audioBase64 = buffer.toString('base64');

  const systemPrompt = options?.systemPrompt ??
    `You are a multilingual AI assistant for an enterprise command platform. Respond in ${langConfig.name}. Be concise and professional.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-audio',
    modalities: ['text', 'audio'],
    audio: { voice, format: 'mp3' },
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'input_audio', input_audio: { data: audioBase64, format: format as 'wav' | 'mp3' } },
        ],
      },
    ],
  });

  const audioMessage = response.choices[0]?.message as unknown as AudioChatMessage;
  const inputTranscript = audioMessage?.audio?.transcript ?? '';
  const responseText = audioMessage?.content ?? inputTranscript;
  const audioData = audioMessage?.audio?.data ?? '';

  return {
    inputTranscript,
    responseText,
    audioResponse: Buffer.from(audioData, 'base64'),
    detectedLanguage: language,
    durationMs: Date.now() - startMs,
  };
}

export function getSupportedLanguages(): LanguageConfig[] {
  return Object.values(SUPPORTED_LANGUAGES);
}

export function isLanguageSupported(code: string): code is SupportedLanguage {
  return code in SUPPORTED_LANGUAGES;
}
