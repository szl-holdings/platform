/**
 * Speech Specialist — Executive Briefing Audio Render
 *
 * Converts a structured executive briefing into a natural-language script
 * and invokes the TTS adapter to produce an audio render.
 * Called by Lyte, Command Portal, and APEX.
 */

import type { TTSAdapter } from './adapters.js';
import { NoOpTTSAdapter } from './adapters.js';
import type { BriefingAudioProvenance, BriefingAudioRequest, BriefingAudioResult } from './types.js';

const DEFAULT_VOICE_ID = 'executive-neutral-v1';

/**
 * Build the spoken script from a briefing request.
 * Produces a natural-language narration suitable for TTS synthesis.
 */
export function buildBriefingScript(req: BriefingAudioRequest): string {
  const parts: string[] = [];

  parts.push(`Executive briefing for ${req.domain}. ${req.headline}.`);
  parts.push(req.situation);

  if (req.beliefs && req.beliefs.length > 0) {
    parts.push('Key beliefs:');
    for (const [i, b] of req.beliefs.entries()) {
      parts.push(`${i + 1}. ${b}`);
    }
  }

  if (req.recommendations && req.recommendations.length > 0) {
    parts.push('Recommended actions:');
    for (const [i, r] of req.recommendations.entries()) {
      parts.push(`${i + 1}. ${r}`);
    }
  }

  parts.push(`End of briefing. Generated at ${new Date().toUTCString()}.`);
  return parts.join(' ');
}

/**
 * Render an executive briefing as audio via the TTS adapter.
 * Returns a BriefingAudioResult with audio bytes and full provenance metadata.
 */
export async function renderBriefingAudio(
  req: BriefingAudioRequest,
  ttsAdapter: TTSAdapter = new NoOpTTSAdapter(),
): Promise<BriefingAudioResult> {
  const locale = req.locale ?? 'en-US';
  const voiceId = req.voice?.voiceId ?? DEFAULT_VOICE_ID;
  const script = buildBriefingScript(req);

  const ttsResult = await ttsAdapter.synthesize({
    text: script,
    voice: {
      voiceId,
      locale,
      style: req.voice?.style ?? 'authoritative',
      speakingRate: req.voice?.speakingRate,
      pitch: req.voice?.pitch,
    },
    outputFormat: req.outputFormat ?? 'wav',
    ssml: false,
    segmentId: `brief-${req.briefId}`,
    domain: req.domain,
  });

  const segmentCount = (script.match(/[.!?]/g) ?? []).length || 1;

  const provenance: BriefingAudioProvenance = {
    briefId: req.briefId,
    domain: req.domain,
    voiceId,
    locale,
    characterCount: script.length,
    segmentCount,
    generatedAt: ttsResult.generatedAt,
    adapterProvider: ttsAdapter.providerId,
  };

  return {
    briefId: req.briefId,
    domain: req.domain,
    audioData: ttsResult.audioData,
    mimeType: ttsResult.mimeType,
    durationMs: ttsResult.durationMs,
    scriptText: script,
    locale,
    provider: ttsAdapter.providerId,
    generatedAt: ttsResult.generatedAt,
    provenance,
  };
}
