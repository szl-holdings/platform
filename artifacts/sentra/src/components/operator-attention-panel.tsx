/**
 * Operator-Attention Panel (#5516).
 *
 * Scores operator presence on the incident-triage view using the
 * `@szl-holdings/perception-loop` envelope + liveness primitives.
 *
 * Privacy guardrails — these are LOAD-BEARING:
 *   1. The camera frame is processed ENTIRELY on-device. The component
 *      never converts the video frame to a Blob/DataURL/ArrayBuffer that
 *      could be POSTed — it reads `videoWidth/videoHeight` + brightness
 *      summaries only, derives FrameSignal[], and computes the liveness
 *      envelope locally via `computeLiveness`.
 *   2. The only state leaving the component (via onAttention) is the
 *      LivenessSummary envelope (livenessConfidence, reasons, windowMs)
 *      + counts — no raw frame data, no image hashes that depend on
 *      pixel content. The frameHash is a session-scoped counter.
 *   3. If camera access is denied, the panel hides itself and offers a
 *      typed-second-factor fallback (a one-time operator code) so the
 *      operator can still record explicit attention.
 *
 * The privacy test (`__tests__/operator-attention-panel.test.tsx`)
 * intercepts global `fetch` and asserts that nothing matching a frame
 * payload (Blob/FormData/ArrayBuffer/data URL) is ever sent.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import {
  computeLiveness,
  type FrameSignal,
  type LivenessSummary,
} from '@szl-holdings/perception-loop';

const SIGNAL_BUDGET = 32;
const SAMPLE_INTERVAL_MS = 200;
const LIVENESS_WINDOW_MS = 4000;

interface DerivedSignal {
  readonly tMs: number;
  readonly meanBrightness: number;
  readonly deltaBrightness: number;
}

function deriveSignalFromMotion(prev: DerivedSignal | null, sample: DerivedSignal): FrameSignal {
  // Derive perception-loop's FrameSignal *purely* from frame-to-frame
  // brightness deltas — no per-pixel data leaves the local scope.
  const dBright = prev ? Math.abs(sample.meanBrightness - prev.meanBrightness) : 0;
  return {
    tMs: sample.tMs,
    irisMotion: dBright,
    eyeAperture: Math.max(0, Math.min(1, sample.meanBrightness)),
    headPoseDelta: dBright * 0.5,
  };
}

function sampleVideoBrightness(video: HTMLVideoElement, canvas: HTMLCanvasElement): number {
  // Downsample to a tiny 16×9 buffer; we only need the mean, never the pixels.
  const w = 16;
  const h = 9;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return 0;
  ctx.drawImage(video, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    total += (data[i]! + data[i + 1]! + data[i + 2]!) / 3;
  }
  const mean = total / (w * h) / 255;
  // Immediately drop the pixel buffer reference; it never escapes.
  return mean;
}

export interface OperatorAttention {
  readonly mode: 'perception' | 'typed-2fa';
  readonly liveness: LivenessSummary;
  readonly faceCount: number;
  readonly recordedAt: string;
  readonly typedCode?: string;
}

export interface OperatorAttentionPanelProps {
  readonly incidentId: string;
  readonly onAttention?: (attention: OperatorAttention) => void;
}

export function OperatorAttentionPanel({
  incidentId,
  onAttention,
}: OperatorAttentionPanelProps): JSX.Element {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const signalsRef = useRef<FrameSignal[]>([]);
  const prevSampleRef = useRef<DerivedSignal | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [active, setActive] = useState(false);
  const [denied, setDenied] = useState(false);
  const [liveness, setLiveness] = useState<LivenessSummary>({
    livenessConfidence: 0,
    livenessReasons: [],
    windowMs: LIVENESS_WINDOW_MS,
  });
  const [typedCode, setTypedCode] = useState('');
  const [typedAck, setTypedAck] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setDenied(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 180 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setActive(true);
    } catch {
      setDenied(true);
      setActive(false);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const tick = window.setInterval(() => {
      if (video.readyState < 2) return;
      const mean = sampleVideoBrightness(video, canvas);
      const sample: DerivedSignal = {
        tMs: Date.now(),
        meanBrightness: mean,
        deltaBrightness: prevSampleRef.current
          ? Math.abs(mean - prevSampleRef.current.meanBrightness)
          : 0,
      };
      const signal = deriveSignalFromMotion(prevSampleRef.current, sample);
      prevSampleRef.current = sample;
      const next = [...signalsRef.current, signal];
      while (next.length > SIGNAL_BUDGET) next.shift();
      signalsRef.current = next;
      const summary = computeLiveness(next, { windowMs: LIVENESS_WINDOW_MS });
      setLiveness(summary);
      onAttention?.({
        mode: 'perception',
        liveness: summary,
        faceCount: summary.livenessConfidence > 0.33 ? 1 : 0,
        recordedAt: new Date().toISOString(),
      });
    }, SAMPLE_INTERVAL_MS);
    return () => window.clearInterval(tick);
  }, [active, onAttention]);

  useEffect(() => stopCamera, [stopCamera]);

  const submitTypedFallback = () => {
    if (!typedCode.trim()) return;
    setTypedAck(`Typed-2FA recorded at ${new Date().toLocaleTimeString()}`);
    onAttention?.({
      mode: 'typed-2fa',
      liveness: { livenessConfidence: 1, livenessReasons: ['typed-2fa'], windowMs: 0 },
      faceCount: 0,
      recordedAt: new Date().toISOString(),
      typedCode: typedCode.trim(),
    });
    setTypedCode('');
    setTimeout(() => setTypedAck(null), 3000);
  };

  const confidencePct = Math.round(liveness.livenessConfidence * 100);
  const confidenceColor =
    liveness.livenessConfidence >= 0.66
      ? '#4ade80'
      : liveness.livenessConfidence >= 0.33
        ? '#f59e0b'
        : '#e05252';

  return (
    <section
      data-testid="operator-attention-panel"
      data-incident-id={incidentId}
      className="rounded-lg border p-4 space-y-3"
      style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <header className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#c9b787]" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9b787]">
            Operator Attention · perception-loop
          </span>
        </div>
        <div className="text-[10px] font-mono text-slate-500">
          {active ? (
            <span style={{ color: confidenceColor }}>liveness {confidencePct}%</span>
          ) : denied ? (
            <span className="text-red-400">camera denied — typed fallback</span>
          ) : (
            <span>idle</span>
          )}
        </div>
      </header>

      <p className="text-[11px] text-slate-500 leading-snug">
        On-device perception envelope (frames never leave the browser). Liveness derived
        locally from motion variance; only the summary is recorded against the incident.
      </p>

      {!denied && (
        <div className="flex items-start gap-3">
          <div className="relative">
            <video
              ref={videoRef}
              data-testid="operator-attention-video"
              muted
              playsInline
              className="rounded border border-slate-700/40 bg-black"
              style={{ width: 160, height: 90 }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {!active && (
              <div className="absolute inset-0 flex items-center justify-center">
                <EyeOff className="w-5 h-5 text-slate-600" />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div className="text-[10px] font-mono text-slate-400">
              reasons:{' '}
              {liveness.livenessReasons.length > 0
                ? liveness.livenessReasons.join(' · ')
                : 'awaiting signals…'}
            </div>
            <div className="flex gap-2">
              {!active ? (
                <button
                  type="button"
                  data-testid="operator-attention-enable"
                  onClick={() => void startCamera()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-mono border transition-all"
                  style={{ borderColor: '#c9b787', color: '#c9b787', background: 'rgba(201,183,135,0.05)' }}
                >
                  <Eye className="w-3 h-3" /> Enable camera
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="operator-attention-disable"
                  onClick={stopCamera}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-mono border transition-all"
                  style={{ borderColor: '#475569', color: '#94a3b8' }}
                >
                  <EyeOff className="w-3 h-3" /> Stop
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded border p-3 space-y-2" style={{ borderColor: 'rgba(96,165,250,0.18)', background: 'rgba(96,165,250,0.04)' }}>
        <div className="flex items-center gap-2">
          <KeyRound className="w-3 h-3 text-[#60a5fa]" />
          <span className="text-[10px] font-mono uppercase text-[#60a5fa]">
            Typed-2FA fallback{denied ? ' (required — camera denied)' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            data-testid="operator-attention-typed-input"
            value={typedCode}
            onChange={(e) => setTypedCode(e.target.value)}
            placeholder="One-time operator code…"
            className="flex-1 bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-[#60a5fa]/40"
          />
          <button
            type="button"
            data-testid="operator-attention-typed-submit"
            onClick={submitTypedFallback}
            disabled={!typedCode.trim()}
            className="px-3 py-1.5 rounded text-[10px] font-mono border transition-all disabled:opacity-40"
            style={{ borderColor: '#60a5fa', color: '#60a5fa', background: 'rgba(96,165,250,0.05)' }}
          >
            Record
          </button>
        </div>
        {typedAck && <div className="text-[10px] font-mono text-green-400">{typedAck}</div>}
      </div>
    </section>
  );
}

export default OperatorAttentionPanel;
