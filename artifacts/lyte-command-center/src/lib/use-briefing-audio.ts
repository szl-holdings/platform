/**
 * Lyte — Briefing Audio Hook
 *
 * Wires the executive briefing audio render path for Lyte Decision Twin.
 * Routes through SpeechSpecialist.renderBriefing() with BrowserWebSpeechTTSAdapter —
 * the same abstraction layer used by the speech-specialist backbone.
 * Swap to a real NIM/ElevenLabs/Azure adapter via specialist.setAdapters() when ready.
 */

import {
  BrowserWebSpeechTTSAdapter,
  SpeechSpecialist,
  type BriefingAudioProvenance,
} from '@szl-holdings/speech-specialist';
import { useCallback, useMemo, useState } from 'react';

export type AudioPlayerState = 'idle' | 'loading' | 'playing' | 'done' | 'error';
export type { BriefingAudioProvenance };

/**
 * Hook that wraps SpeechSpecialist.renderBriefing() for use in React components.
 * The specialist is created with the BrowserWebSpeechTTSAdapter so audio plays
 * through the browser's native speech synthesis engine.
 */
export function useBriefingAudio() {
  const [state, setState] = useState<AudioPlayerState>('idle');
  const [provenance, setProvenance] = useState<BriefingAudioProvenance | null>(null);

  const specialist = useMemo(
    () => new SpeechSpecialist({ tts: new BrowserWebSpeechTTSAdapter() }),
    [],
  );

  const isAvailable =
    typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined';

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
      setState('loading');
      try {
        setState('playing');
        const result = await specialist.renderBriefing({
          briefId: params.briefId,
          domain: params.domain,
          headline: params.headline,
          situation: params.situation ?? '',
          beliefs: params.beliefs,
          recommendations: params.recommendations,
          locale: 'en-US',
          outputFormat: 'wav',
        });
        setProvenance(result.provenance);
        setState('done');
      } catch {
        setState('error');
      }
    },
    [specialist, isAvailable],
  );

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setState('idle');
  }, []);

  return { state, provenance, play, stop, isAvailable };
}
