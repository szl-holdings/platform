/**
 * @szl-holdings/speech-specialist
 *
 * Multilingual voice capability for the agent backbone.
 * Exposes TTS, ASR, and diarization/turn-detection through clean service
 * abstractions with provider-adapter slots that are swap-ready for real
 * NIM/cloud providers.
 *
 * Usage:
 *   import { defaultSpeechSpecialist } from '@szl-holdings/speech-specialist';
 *
 *   // Render an executive briefing as audio (uses no-op adapter by default)
 *   const result = await defaultSpeechSpecialist.renderBriefing({ ... });
 *
 *   // Swap in a real TTS adapter at startup
 *   defaultSpeechSpecialist.setAdapters({ tts: myElevenLabsAdapter });
 */

export * from './types.js';
export * from './adapters.js';
export * from './briefing-audio.js';
export * from './specialist.js';
export * from './browser-tts-adapter.js';

export const SPEECH_SPECIALIST_VERSION = '0.1.0' as const;
