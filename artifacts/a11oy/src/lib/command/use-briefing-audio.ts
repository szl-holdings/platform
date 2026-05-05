/**
 * Command Portal — Briefing Audio Hook (OpenAI TTS)
 *
 * Streams high-quality TTS audio from the OpenAI gpt-5-mini model
 * via the /api/openai/briefing-audio endpoint. Replaces the former
 * BrowserWebSpeechTTSAdapter with a real AI voice.
 *
 * Provenance from the response headers is captured and exposed
 * to consumers for display alongside the audio player.
 */

import { useCallback, useRef, useState } from 'react';

export type AudioPlayerState = 'idle' | 'loading' | 'playing' | 'done' | 'error';

export interface BriefingAudioProvenance {
  model: string;
  voice: string;
  generatedAt: string;
  briefId?: string;
}

function getApiBase() {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
  return `${base}/api`;
}

/**
 * Hook that streams TTS audio for an executive briefing from the OpenAI
 * /openai/briefing-audio endpoint. Audio is played through a browser <audio>
 * element via a streaming object URL for low-latency playback.
 */
export function useBriefingAudio() {
  const [state, setState] = useState<AudioPlayerState>('idle');
  const [provenance, setProvenance] = useState<BriefingAudioProvenance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isAvailable = typeof window !== 'undefined';

  const play = useCallback(
    async (params: {
      briefId: string;
      domain: string;
      headline: string;
      situation?: string;
      beliefs?: string[];
      recommendations?: string[];
    }) => {
      if (!isAvailable) return;

      abortRef.current?.abort();
      const abort = new AbortController();
      abortRef.current = abort;

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      audioRef.current?.pause();

      setState('loading');

      const parts: string[] = [];
      if (params.headline) parts.push(params.headline);
      if (params.situation) parts.push(params.situation);
      if (params.beliefs?.length) {
        parts.push('Key beliefs: ' + params.beliefs.join('. '));
      }
      if (params.recommendations?.length) {
        parts.push('Recommendations: ' + params.recommendations.join('. '));
      }
      const text = parts.join('\n\n');

      try {
        const res = await fetch(`${getApiBase()}/openai/briefing-audio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            briefId: params.briefId,
            voice: 'nova',
          }),
          credentials: 'include',
          signal: abort.signal,
        });

        if (!res.ok) throw new Error('Audio generation failed');

        const data = await res.json() as {
          audioBase64: string;
          mimeType: string;
          provenance?: { model?: string; voice?: string; generatedAt?: string };
        };
        if (abort.signal.aborted) return;

        const prov = data.provenance ?? {};
        setProvenance({
          model: prov.model ?? 'gpt-4o-mini-tts',
          voice: prov.voice ?? 'nova',
          generatedAt: prov.generatedAt ?? new Date().toISOString(),
          briefId: params.briefId,
        });

        const binaryStr = atob(data.audioBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        const blob = new Blob([bytes], { type: data.mimeType || 'audio/mpeg' });

        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;

        setState('playing');

        await new Promise<void>((resolve, reject) => {
          audio.onended = () => resolve();
          audio.onerror = () => reject(new Error('Audio playback failed'));
          if (abort.signal) {
            abort.signal.addEventListener('abort', () => {
              audio.pause();
              resolve();
            });
          }
          audio.play().catch(reject);
        });

        setState('done');
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          setState('idle');
          return;
        }
        setState('error');
      }
    },
    [isAvailable],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    audioRef.current?.pause();
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setState('idle');
  }, []);

  return { state, provenance, play, stop, isAvailable };
}
