import { useEffect, useMemo, useState } from 'react';
import {
  computeLiveness,
  PERCEPTION_ENVELOPE_RECEIPT_CLASS,
  type FrameSignal,
  type LivenessSummary,
} from '@szl-holdings/perception-loop';

/**
 * Reviewer-presence gate — privacy-preserving.
 *
 * Only on-device feature-vector summaries (eyeAperture, irisMotion,
 * headPoseDelta) ever enter this component's state. Raw frame bytes
 * are never read, never buffered, never POSTed. The Λ-receipt below
 * is what would be appended to the approvals trail when a real
 * reviewer is present; the camera path is intentionally optional
 * and falls back to a typed second-factor.
 *
 * Backing package: `@szl-holdings/perception-loop` — see
 * `docs/research/perception-bio-synthesis-2026.md §1`.
 */

const GOLD = '#c9b787';

type Mode = 'idle' | 'simulated' | 'typed-second-factor' | 'camera-denied';

interface ReceiptSketch {
  receiptClass: typeof PERCEPTION_ENVELOPE_RECEIPT_CLASS;
  capturedAt: string;
  livenessConfidence: number;
  reasons: string[];
  fallbackUsed: 'none' | 'typed-second-factor';
  rawFrameBytesLeaked: false;
}

function simulateSignals(seed: number): FrameSignal[] {
  // Pure-numeric synthesised window — no DOM, no camera. The state machine
  // in computeLiveness needs blink/saccade/head-pose evidence; we emit a
  // realistic 2-second window so reviewers can see what a "present and
  // attentive" envelope looks like before deploying the real camera path.
  const out: FrameSignal[] = [];
  let t = 1_700_000_000_000;
  for (let i = 0; i < 40; i++) {
    const phase = (i + seed) % 20;
    out.push({
      tMs: t,
      irisMotion: 0.002 + ((phase * 13) % 7) * 0.0008,
      eyeAperture: phase < 2 ? 0.1 : 0.78 + ((phase * 7) % 5) * 0.03,
      headPoseDelta: 0.012 + ((phase * 11) % 6) * 0.009,
    });
    t += 50;
  }
  return out;
}

export default function ReviewerPresence() {
  const [mode, setMode] = useState<Mode>('idle');
  const [seed, setSeed] = useState(0);
  const [secondFactor, setSecondFactor] = useState('');

  const liveness: LivenessSummary | null = useMemo(() => {
    if (mode !== 'simulated') return null;
    return computeLiveness(simulateSignals(seed));
  }, [mode, seed]);

  const receipt: ReceiptSketch | null = useMemo(() => {
    if (mode === 'simulated' && liveness) {
      return {
        receiptClass: PERCEPTION_ENVELOPE_RECEIPT_CLASS,
        capturedAt: new Date().toISOString(),
        livenessConfidence: liveness.confidence,
        reasons: liveness.reasons,
        fallbackUsed: 'none',
        rawFrameBytesLeaked: false,
      };
    }
    if (mode === 'typed-second-factor' && secondFactor.trim().length >= 6) {
      return {
        receiptClass: PERCEPTION_ENVELOPE_RECEIPT_CLASS,
        capturedAt: new Date().toISOString(),
        livenessConfidence: 0.5,
        reasons: ['fallback:typed-second-factor'],
        fallbackUsed: 'typed-second-factor',
        rawFrameBytesLeaked: false,
      };
    }
    return null;
  }, [mode, liveness, secondFactor]);

  // Detect camera-denied / unavailable up-front so the UI can route the
  // reviewer to the typed-second-factor path without first asking.
  useEffect(() => {
    const md = (globalThis as { navigator?: { mediaDevices?: unknown } }).navigator?.mediaDevices;
    if (!md && mode === 'idle') setMode('camera-denied');
  }, [mode]);

  return (
    <div style={{ padding: '32px 40px', maxWidth: 920, color: '#e8e6df' }}>
      <header style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8b8775' }}>
          A11oy · Approvals · Reviewer-presence gate
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginTop: 4 }}>
          Reviewer-presence verification
        </h1>
        <p style={{ marginTop: 8, color: '#a8a48f', fontSize: 14, lineHeight: 1.55 }}>
          High-autonomy approvals require a verified attentive reviewer. Only
          feature-vector summaries (eye aperture, iris motion, head-pose delta)
          ever leave the device-local buffer — raw camera frames are{' '}
          <strong style={{ color: GOLD }}>never read, buffered, or transmitted</strong>.
          When camera is denied or unavailable, the typed second-factor path
          is used instead and the Λ-receipt records the fallback explicitly.
        </p>
      </header>

      <section
        style={{
          background: '#15140f',
          border: '1px solid #2a2820',
          borderRadius: 8,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            data-testid="reviewer-mode-simulated"
            onClick={() => { setMode('simulated'); setSeed((s) => s + 1); }}
            style={btn(mode === 'simulated')}
          >
            Run simulated presence window
          </button>
          <button
            data-testid="reviewer-mode-typed"
            onClick={() => setMode('typed-second-factor')}
            style={btn(mode === 'typed-second-factor')}
          >
            Use typed second-factor
          </button>
          <button
            data-testid="reviewer-mode-reset"
            onClick={() => { setMode('idle'); setSecondFactor(''); }}
            style={btn(false)}
          >
            Reset
          </button>
        </div>

        {mode === 'camera-denied' && (
          <div style={{ marginTop: 16, fontSize: 13, color: '#f0a868' }}>
            Camera is unavailable in this environment — falling back to typed
            second-factor.
          </div>
        )}

        {mode === 'typed-second-factor' && (
          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 12, color: '#8b8775', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Typed second-factor (≥ 6 chars)
            </label>
            <input
              data-testid="reviewer-second-factor"
              value={secondFactor}
              onChange={(e) => setSecondFactor(e.target.value)}
              style={{
                marginTop: 6,
                width: '100%',
                padding: '8px 10px',
                background: '#0d0c08',
                border: '1px solid #2a2820',
                borderRadius: 4,
                color: '#e8e6df',
                fontFamily: 'monospace',
                fontSize: 14,
              }}
              placeholder="e.g. reviewer-code-7F2A"
            />
          </div>
        )}
      </section>

      {liveness && (
        <section
          style={{
            background: '#15140f',
            border: '1px solid #2a2820',
            borderRadius: 8,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8b8775' }}>
            Liveness envelope (on-device)
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 12, alignItems: 'baseline' }}>
            <div>
              <div style={{ fontSize: 36, fontWeight: 600, color: GOLD }}>
                {(liveness.confidence * 100).toFixed(0)}%
              </div>
              <div style={{ fontSize: 11, color: '#8b8775' }}>liveness confidence</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#a8a48f', marginBottom: 6 }}>Reasons</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7 }}>
                {liveness.reasons.length === 0 ? (
                  <li style={{ color: '#8b8775' }}>—</li>
                ) : (
                  liveness.reasons.map((r) => <li key={r}>{r}</li>)
                )}
              </ul>
            </div>
          </div>
        </section>
      )}

      {receipt && (
        <section
          data-testid="reviewer-receipt"
          style={{
            background: '#0e0d08',
            border: '1px solid #3a3625',
            borderRadius: 8,
            padding: 20,
            fontFamily: 'monospace',
            fontSize: 12,
            lineHeight: 1.7,
          }}
        >
          <div style={{ color: GOLD, marginBottom: 8 }}>
            Λ-receipt sketch — class {receipt.receiptClass}
          </div>
          <pre style={{ margin: 0, color: '#e8e6df', whiteSpace: 'pre-wrap' }}>
{JSON.stringify(receipt, null, 2)}
          </pre>
          <div style={{ marginTop: 12, color: '#7a8a5a' }}>
            ✓ rawFrameBytesLeaked = false (enforced by construction — this
            component never accepts a Frame, ImageData, or Blob)
          </div>
        </section>
      )}
    </div>
  );
}

function btn(active: boolean): React.CSSProperties {
  return {
    padding: '8px 14px',
    background: active ? GOLD : '#0d0c08',
    color: active ? '#0d0c08' : GOLD,
    border: `1px solid ${GOLD}`,
    borderRadius: 4,
    fontSize: 13,
    fontFamily: 'inherit',
    cursor: 'pointer',
    fontWeight: 500,
  };
}
