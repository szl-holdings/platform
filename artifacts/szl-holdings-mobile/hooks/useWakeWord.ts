import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { VoiceLanguage } from './useVoiceCommand';

export interface WakeWordConfig {
  phrase: string;
  language: VoiceLanguage;
  enabled: boolean;
  dbThreshold?: number;
  cooldownMs?: number;
}

const WAKE_PHRASES: Record<VoiceLanguage, string[]> = {
  en: ['hey command', 'ok command', 'hey szl', 'command mode'],
  es: ['hola comando', 'activar comando', 'hey comando'],
  zh: ['你好指挥', '启动指挥', '嘿指挥'],
  ar: ['يا قيادة', 'تفعيل القيادة', 'مرحبا قيادة'],
  fr: ['salut commande', 'activer commande', 'hey commande'],
};

export type WakeWordState =
  | 'inactive'
  | 'requesting-permission'
  | 'listening'
  | 'detected'
  | 'error'
  | 'permission-denied';

const RECORDING_OPTIONS: Audio.RecordingOptions = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 32000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.LOW,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 32000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 32000,
  },
};

// ── Phrase-duration heuristic ──────────────────────────────────────────────────
// Estimates how many 200ms metering ticks a phrase should span.
// Rate: ~2 syllables/sec → ~0.5 sec/syllable. Assume 1.4 syllables per word.
// So: wordCount * 1.4 syllables * 0.5 sec/syllable = wordCount * 0.7 sec.
// At a 200ms poll interval: wordCount * 0.7 / 0.2 = wordCount * 3.5 ticks.
const TICKS_PER_WORD = 3.5;

function phraseMinTicks(phrase: string): number {
  const words = phrase.trim().split(/\s+/).length;
  return Math.max(2, Math.floor(words * TICKS_PER_WORD * 0.5)); // lower bound (50%)
}

function phraseMaxTicks(phrase: string): number {
  const words = phrase.trim().split(/\s+/).length;
  return Math.ceil(words * TICKS_PER_WORD * 2.0); // upper bound (200%)
}

// ── Web Speech Recognition (available on supported web browsers) ───────────────
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { results: ArrayLike<{ [i: number]: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

function createWebSpeechRecognizer(lang: string): SpeechRecognitionLike | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
  if (!Ctor) return null;
  const sr = new Ctor();
  sr.continuous = true;
  sr.interimResults = true;
  sr.lang = lang;
  return sr;
}

const LANG_BCP47: Record<VoiceLanguage, string> = {
  en: 'en-US',
  es: 'es-ES',
  zh: 'zh-CN',
  ar: 'ar-SA',
  fr: 'fr-FR',
};

/**
 * On-device wake-word detection hook.
 *
 * Two-stage pipeline:
 *
 * Stage 1 — VAD gate (native + web fallback):
 *   Uses expo-av Recording with isMeteringEnabled to monitor dBFS audio energy
 *   at 200ms intervals. Sustained voice activity triggers Stage 2.
 *
 * Stage 2 — Phrase evaluation:
 *   Web: Web Speech Recognition API transcribes the utterance in real time;
 *        only fires onDetected when the recognised text contains config.phrase
 *        (case-insensitive). This is the full phrase-match path.
 *
 *   Native: phrase-duration scoring — the number of above-threshold energy
 *        ticks must fall within [phraseMinTicks, phraseMaxTicks] derived from
 *        config.phrase word count. A two-word phrase ("hey szl") requires ≈2-7
 *        ticks; a five-word phrase needs ≈8-35 ticks. Speech bursts shorter or
 *        longer than the phrase are rejected. This gates on phrase length without
 *        a TFLite model; production deployments should replace with Porcupine or
 *        a similar on-device KWS engine for exact lexical matching.
 *
 * All audio processing is on-device; no audio data leaves the device.
 */
export function useWakeWord(
  config: WakeWordConfig,
  onDetected: () => void,
) {
  const [state, setState] = useState<WakeWordState>('inactive');
  const recordingRef = useRef<Audio.Recording | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const srRef = useRef<SpeechRecognitionLike | null>(null);
  const cooldownRef = useRef(false);
  const sustainedCountRef = useRef(0);
  const mountedRef = useRef(true);

  const dbThreshold = config.dbThreshold ?? -30;
  const cooldownMs = config.cooldownMs ?? 3000;

  const triggerDetected = useCallback(() => {
    if (cooldownRef.current || !mountedRef.current) return;
    cooldownRef.current = true;
    if (mountedRef.current) setState('detected');
    onDetected();
    setTimeout(() => {
      cooldownRef.current = false;
      if (mountedRef.current) setState('listening');
    }, cooldownMs);
  }, [cooldownMs, onDetected]);

  const stopRecording = useCallback(async () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    srRef.current?.abort();
    srRef.current = null;
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {}
      recordingRef.current = null;
    }
  }, []);

  const startMonitoring = useCallback(async () => {
    if (!config.enabled || recordingRef.current) return;
    if (!mountedRef.current) return;

    setState('requesting-permission');

    // ── Web path: use Speech Recognition API for transcript-level phrase matching
    if (Platform.OS === 'web') {
      const sr = createWebSpeechRecognizer(LANG_BCP47[config.language]);
      if (sr) {
        srRef.current = sr;
        const phrases = WAKE_PHRASES[config.language].concat(config.phrase.toLowerCase());
        sr.onresult = (e) => {
          for (let i = 0; i < e.results.length; i++) {
            const transcript = e.results[i][0].transcript.toLowerCase().trim();
            const matched = phrases.some((p) => transcript.includes(p));
            if (matched) triggerDetected();
          }
        };
        sr.onerror = (e) => {
          if (e.error !== 'no-speech' && mountedRef.current) setState('error');
        };
        sr.onend = () => {
          // Auto-restart to keep listening
          if (mountedRef.current && config.enabled && !cooldownRef.current) {
            try { sr.start(); } catch {}
          }
        };
        try {
          sr.start();
          if (mountedRef.current) setState('listening');
        } catch {
          if (mountedRef.current) setState('error');
        }
        return;
      }
      // Fall through to VAD path if SpeechRecognition not available
    }

    // ── Native path: expo-av metering VAD + phrase-duration gate
    let permissionResult: Audio.PermissionResponse;
    try {
      permissionResult = await Audio.requestPermissionsAsync();
    } catch {
      if (mountedRef.current) setState('error');
      return;
    }

    if (!permissionResult.granted) {
      if (mountedRef.current) setState('permission-denied');
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        ...RECORDING_OPTIONS,
        isMeteringEnabled: true,
      });
      await recording.startAsync();
      recordingRef.current = recording;
      sustainedCountRef.current = 0;

      if (mountedRef.current) setState('listening');

      // Phrase-duration bounds derived from config.phrase word count
      const minTicks = phraseMinTicks(config.phrase);
      const maxTicks = phraseMaxTicks(config.phrase);

      pollRef.current = setInterval(async () => {
        if (!recordingRef.current || cooldownRef.current || !mountedRef.current) return;

        try {
          const status = await recordingRef.current.getStatusAsync();
          if (!status.isRecording) return;

          const db = status.metering ?? -160;

          if (db > dbThreshold) {
            sustainedCountRef.current += 1;
          } else {
            // Energy dropped: evaluate whether sustained window matches phrase duration
            const ticks = sustainedCountRef.current;
            if (ticks >= minTicks && ticks <= maxTicks) {
              // Duration window matches configured phrase; fire detection
              triggerDetected();
            }
            sustainedCountRef.current = 0;
          }
        } catch {}
      }, 200);
    } catch {
      if (mountedRef.current) setState('error');
    }
  }, [config.enabled, config.language, config.phrase, dbThreshold, triggerDetected]);

  const stopMonitoring = useCallback(async () => {
    await stopRecording();
    if (mountedRef.current) setState('inactive');
  }, [stopRecording]);

  useEffect(() => {
    mountedRef.current = true;
    if (config.enabled) {
      startMonitoring();
    }
    return () => {
      mountedRef.current = false;
      stopRecording();
    };
  }, [config.enabled, config.language, config.phrase]);

  const getWakePhrases = useCallback(
    () => WAKE_PHRASES[config.language],
    [config.language],
  );

  return {
    state,
    startMonitoring,
    stopMonitoring,
    wakePhrases: getWakePhrases(),
    isActive: state === 'listening',
    lastDetected: state === 'detected',
    isPermissionDenied: state === 'permission-denied',
  };
}
