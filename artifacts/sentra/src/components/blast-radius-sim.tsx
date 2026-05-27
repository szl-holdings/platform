/**
 * Deterministic blast-radius sim viz (#5516).
 *
 * Uses `@szl-holdings/sim-kit` (verlet-step + cluster-detect) to render a
 * physics-driven, *deterministic* (same incident id → same animation)
 * blast-radius visualisation for an incident. Particles are seeded from
 * the affected-asset count + severity; the seeded RNG is a small SplitMix32
 * so the visual is reproducible across reloads, browsers, and recorded
 * demos.
 *
 * No network calls. Pure client-side, framework-agnostic — drop-in for any
 * incident page.
 */
import { useEffect, useMemo, useRef } from 'react';
import { Crosshair } from 'lucide-react';
import { step, type Particle } from '@szl-holdings/sim-kit/verlet-step';
import { detectClusters } from '@szl-holdings/sim-kit/cluster-detect';

export interface BlastRadiusSimProps {
  readonly incidentId: string;
  readonly affectedAssetCount: number;
  readonly severity: 'critical' | 'high' | 'medium' | 'low';
  readonly width?: number;
  readonly height?: number;
}

function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function splitMix32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x9e3779b9) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
    z = (z ^ (z >>> 16)) >>> 0;
    return z / 0x100000000;
  };
}

const SEV_MULT: Record<BlastRadiusSimProps['severity'], number> = {
  critical: 2.4,
  high: 1.8,
  medium: 1.3,
  low: 1.0,
};

const SEV_COLOR: Record<BlastRadiusSimProps['severity'], string> = {
  critical: '#e05252',
  high: '#f59e0b',
  medium: '#c9b787',
  low: '#60a5fa',
};

function seedParticles(
  incidentId: string,
  affectedAssetCount: number,
  severity: BlastRadiusSimProps['severity'],
  w: number,
  h: number,
): Particle[] {
  const rng = splitMix32(hashSeed(incidentId));
  const count = Math.max(6, Math.min(48, affectedAssetCount * 3 + 6));
  const mult = SEV_MULT[severity];
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const x = (rng() * 0.6 + 0.2) * w;
    const y = (rng() * 0.6 + 0.2) * h;
    const dx = (rng() - 0.5) * 2 * mult;
    const dy = (rng() - 0.5) * 2 * mult;
    const radius = 4 + rng() * 6 * mult;
    const label = i < affectedAssetCount ? 'compromised' : 'adjacent';
    particles.push({
      id: `p${i}`,
      position: [x, y],
      prevPosition: [x - dx, y - dy],
      radius,
      label,
    });
  }
  return particles;
}

export function BlastRadiusSim({
  incidentId,
  affectedAssetCount,
  severity,
  width = 320,
  height = 180,
}: BlastRadiusSimProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const initial = useMemo(
    () => seedParticles(incidentId, affectedAssetCount, severity, width, height),
    [incidentId, affectedAssetCount, severity, width, height],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = initial;
    let raf = 0;
    const start = performance.now();

    const draw = (now: number) => {
      const dtMs = 16;
      const elapsed = now - start;
      // Centripetal-ish damping holds particles loosely in frame.
      particles = step(particles, dtMs / 16, {
        acceleration: [0, 0.02 * SEV_MULT[severity]],
        damping: 0.04,
        collisionIterations: 2,
      }).map((p) => {
        const [x, y] = p.position;
        if (x < 0 || x > width || y < 0 || y > height) {
          return {
            ...p,
            position: [Math.max(0, Math.min(width, x)), Math.max(0, Math.min(height, y))],
            prevPosition: [x, y],
          };
        }
        return p;
      });

      const clusters = detectClusters(particles, { epsilon: 2 });

      ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
      ctx.fillRect(0, 0, width, height);

      for (const c of clusters) {
        ctx.beginPath();
        ctx.arc(c.centroid[0], c.centroid[1], 4 + c.size * 1.5, 0, Math.PI * 2);
        ctx.fillStyle =
          c.label === 'compromised' ? `${SEV_COLOR[severity]}22` : 'rgba(148,163,184,0.08)';
        ctx.fill();
      }
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.position[0], p.position[1], p.radius, 0, Math.PI * 2);
        ctx.fillStyle =
          p.label === 'compromised' ? SEV_COLOR[severity] : 'rgba(148,163,184,0.55)';
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      // Cap the demo loop at 6s of motion so it settles deterministically.
      if (elapsed < 6000) {
        raf = requestAnimationFrame(draw);
      }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [initial, width, height, severity]);

  const clusterCount = useMemo(
    () => detectClusters(initial, { epsilon: 2 }).length,
    [initial],
  );

  return (
    <div
      data-testid="blast-radius-sim"
      className="rounded-lg border p-3 space-y-2"
      style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Crosshair className="w-3.5 h-3.5" style={{ color: SEV_COLOR[severity] }} />
          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: SEV_COLOR[severity] }}>
            Blast-radius simulation
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500">
          {affectedAssetCount} affected · {clusterCount} cluster{clusterCount === 1 ? '' : 's'} · deterministic
        </span>
      </div>
      <canvas ref={canvasRef} style={{ width, height, display: 'block' }} className="rounded" />
      <p className="text-[10px] font-mono text-slate-600 leading-snug">
        Verlet-step + union-find cluster detect over a seeded particle set. Seed derived
        from incident id, so the same incident always renders the same animation —
        receipt-friendly visual evidence.
      </p>
    </div>
  );
}

export default BlastRadiusSim;
