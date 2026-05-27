/**
 * PerceptionGate — reviewer-presence gate for the Approvals Center.
 *
 * Wraps `@szl-holdings/perception-loop` (Human.js-derived operator
 * loop primitive). The camera-bearing path samples a webcam-only
 * frame, derives a feature-vector liveness summary, and emits a
 * `ReviewerPresenceAttestation` that the api-server folds into the
 * AMI gate (`ChatAmiSignals.reviewerPresence`).
 *
 * Privacy invariant (enforced by tests on the perception-loop
 * package): the raw frame `payload` never leaves this component.
 * Only the feature-vector summary (`livenessConfidence` + reasons)
 * is forwarded.
 *
 * When the browser lacks camera access (denied, unsupported, or the
 * user opts out), the component falls back to a typed second-factor
 * code which still produces an attestation — but with `mode:
 * 'second-factor'`, which the AMI gate dampens by ×0.85.
 */

import { useCallback, useEffect, useRef, useState, type JSX } from 'react';
import {
  computeLiveness,
  type FrameSignal,
  type LivenessSummary,
} from '@szl-holdings/perception-loop';

export type ReviewerPresenceMode = 'perception' | 'second-factor' | 'absent';

export interface ReviewerPresenceAttestation {
  readonly mode: ReviewerPresenceMode;
  readonly confidence: number;
  readonly reasons: readonly string[];
  readonly attestedAt: string;
}

interface PerceptionGateProps {
  /** Called when the reviewer attests; consumer should attach the result to the approve POST body. */
  onAttest: (attestation: ReviewerPresenceAttestation) => void;
  /** When true, only the typed-second-factor path is shown. */
  forceFallback?: boolean;
  /** Optional minimum confidence for the perception path to count (default 0.5). */
  minConfidence?: number;
}

const SAMPLE_INTERVAL_MS = 100;
const SAMPLE_WINDOW = 24;
const DEFAULT_MIN_CONF = 0.5;

function pixelLuminance(data: Uint8ClampedArray): number {
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
  }
  return sum / (data.length / 4) / 255;
}

/**
 * Browser perception adapter: samples a 32×32 region from the video
 * element, derives motion / aperture / pose proxies from
 * frame-to-frame deltas. No model required — sufficient signal for
 * a presence gate. Frame bytes never leave this closure.
 */
function deriveFrameSignal(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  prev: { luminance: number; centroidX: number; centroidY: number } | null,
  tMs: number,
): { signal: FrameSignal; state: { luminance: number; centroidX: number; centroidY: number } } {
  ctx.drawImage(video, 0, 0, 32, 32);
  const img = ctx.getImageData(0, 0, 32, 32).data;
  const luminance = pixelLuminance(img);
  let sumX = 0, sumY = 0, mass = 0;
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const i = (y * 32 + x) * 4;
      const l = 0.299 * img[i]! + 0.587 * img[i + 1]! + 0.114 * img[i + 2]!;
      sumX += x * l;
      sumY += y * l;
      mass += l;
    }
  }
  const centroidX = mass > 0 ? sumX / mass : 16;
  const centroidY = mass > 0 ? sumY / mass : 16;
  const lumDelta = prev ? Math.abs(luminance - prev.luminance) : 0;
  const centDelta = prev
    ? Math.hypot(centroidX - prev.centroidX, centroidY - prev.centroidY) / 32
    : 0;
  return {
    signal: {
      tMs,
      // Iris motion proxy: high-frequency centroid jitter normalised to ~[0, 0.1].
      irisMotion: Math.min(0.1, centDelta * 2),
      // Eye-aperture proxy: luminance crossing band ~[0.1, 0.9].
      eyeAperture: Math.max(0, Math.min(1, luminance)),
      // Head-pose proxy: low-frequency luminance change.
      headPoseDelta: Math.min(0.5, lumDelta * 5),
    },
    state: { luminance, centroidX, centroidY },
  };
}

export function PerceptionGate({
  onAttest,
  forceFallback = false,
  minConfidence = DEFAULT_MIN_CONF,
}: PerceptionGateProps): JSX.Element {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mode, setMode] = useState<'idle' | 'perception' | 'fallback' | 'attested'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<LivenessSummary | null>(null);
  const [fallbackCode, setFallbackCode] = useState('');
  const [busy, setBusy] = useState(false);
  const signalsRef = useRef<FrameSignal[]>([]);

  // Stop the camera stream on unmount / re-mode.
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const startPerception = useCallback(async () => {
    setError(null);
    setBusy(true);
    setMode('perception');
    signalsRef.current = [];
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('camera-unsupported');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) throw new Error('dom-unavailable');
      video.srcObject = stream;
      await video.play();
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas-unavailable');

      let prev: { luminance: number; centroidX: number; centroidY: number } | null = null;
      const t0 = performance.now();
      for (let i = 0; i < SAMPLE_WINDOW; i++) {
        await new Promise((r) => setTimeout(r, SAMPLE_INTERVAL_MS));
        if (!streamRef.current) break;
        const { signal, state } = deriveFrameSignal(ctx, video, prev, performance.now() - t0);
        signalsRef.current.push(signal);
        prev = state;
      }
      const liveness = computeLiveness(signalsRef.current);
      setSummary(liveness);
      stopCamera();

      if (liveness.livenessConfidence >= minConfidence) {
        const attestation: ReviewerPresenceAttestation = {
          mode: 'perception',
          confidence: liveness.livenessConfidence,
          reasons: liveness.livenessReasons,
          attestedAt: new Date().toISOString(),
        };
        setMode('attested');
        onAttest(attestation);
      } else {
        // Liveness too low — fall through to second-factor.
        setMode('fallback');
        setError(
          `Liveness ${liveness.livenessConfidence.toFixed(2)} below ${minConfidence.toFixed(2)} — use second-factor code.`,
        );
      }
    } catch (e) {
      stopCamera();
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg === 'camera-unsupported' ? 'Camera unavailable on this device.' : `Camera error: ${msg}`);
      setMode('fallback');
    } finally {
      setBusy(false);
    }
  }, [minConfidence, onAttest, stopCamera]);

  const submitFallback = useCallback(() => {
    const code = fallbackCode.trim();
    if (code.length < 6) {
      setError('Second-factor code must be at least 6 characters.');
      return;
    }
    const attestation: ReviewerPresenceAttestation = {
      mode: 'second-factor',
      // Typed-code path is binary: present / absent; surface as 1.0 confidence
      // because the user *is* present, while the AMI gate dampens G by ×0.85.
      confidence: 1.0,
      reasons: ['typed-second-factor'],
      attestedAt: new Date().toISOString(),
    };
    setMode('attested');
    setError(null);
    onAttest(attestation);
  }, [fallbackCode, onAttest]);

  if (mode === 'attested') {
    return (
      <div
        className="rounded-lg border p-3 text-[11px]"
        style={{
          borderColor: 'rgba(107,143,113,0.3)',
          background: 'rgba(107,143,113,0.08)',
          color: '#9bc4a0',
        }}
      >
        Reviewer attested ({summary ? `liveness ${summary.livenessConfidence.toFixed(2)}` : 'second-factor'}).
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border p-3 space-y-2"
      style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
    >
      <div className="text-[10px] uppercase tracking-widest" style={{ color: '#d4a054' }}>
        Reviewer Presence Gate
      </div>
      {mode === 'idle' && !forceFallback && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Attest by camera (feature-vector only, no frames leave the device) or by typed second-factor.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={startPerception}
              className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80 disabled:opacity-40"
              style={{
                color: '#d4a054',
                background: 'rgba(212,160,84,0.1)',
                border: '1px solid rgba(212,160,84,0.25)',
              }}
            >
              {busy ? 'Sampling…' : 'Camera attest'}
            </button>
            <button
              type="button"
              onClick={() => setMode('fallback')}
              className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80"
              style={{
                color: 'rgba(255,255,255,0.6)',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              Use second-factor
            </button>
          </div>
        </div>
      )}

      {mode === 'perception' && (
        <div className="flex items-center gap-3">
          <video
            ref={videoRef}
            muted
            playsInline
            className="rounded"
            style={{ width: 96, height: 72, background: '#000', objectFit: 'cover' }}
          />
          <canvas ref={canvasRef} width={32} height={32} style={{ display: 'none' }} />
          <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Sampling… do not navigate away.
          </div>
        </div>
      )}

      {(mode === 'fallback' || forceFallback) && mode !== 'attested' && (
        <div className="space-y-1.5">
          <label
            className="block text-[10px] uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            Second-factor code (≥ 6 chars)
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={fallbackCode}
              onChange={(e) => setFallbackCode(e.target.value)}
              autoComplete="one-time-code"
              className="flex-1 text-[11px] px-2 py-1.5 rounded"
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
              }}
            />
            <button
              type="button"
              onClick={submitFallback}
              className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80"
              style={{
                color: '#8b7ac8',
                background: 'rgba(139,122,200,0.1)',
                border: '1px solid rgba(139,122,200,0.25)',
              }}
            >
              Attest
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="text-[10px]" style={{ color: '#c45a4a' }}>
          {error}
        </div>
      )}
    </div>
  );
}

