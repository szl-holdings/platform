/**
 * Verlet integrator with explicit damping and positional collision
 * resolution. Pure function — no engine state, no mutation of input.
 *
 * Re-expression of the spherepop sim loop
 * (docs/research/perception-bio-synthesis-2026.md §4).
 *
 *   position_{t+1} = position_t + (position_t - position_{t-1}) * (1 - damping)
 *                                 + acceleration * dt^2
 *
 * Collisions are resolved by projecting overlapping particles apart
 * along the contact normal; this is the stable, energy-bounded variant.
 */

export interface Particle {
  readonly id: string;
  readonly position: readonly [number, number];
  readonly prevPosition: readonly [number, number];
  readonly radius: number;
  /** Group label used by cluster-detect (e.g. colour, type). */
  readonly label: string;
}

export interface VerletOptions {
  /** Acceleration (e.g. gravity) `[ax, ay]`. */
  readonly acceleration?: readonly [number, number];
  /** Damping coefficient ∈ [0, 1]; 0 = no damping. */
  readonly damping?: number;
  /** Iterations of pairwise collision projection (default 1). */
  readonly collisionIterations?: number;
  /** Collision tolerance ε to avoid jitter (default 1e-6). */
  readonly epsilon?: number;
}

export function step(particles: readonly Particle[], dt: number, options: VerletOptions = {}): Particle[] {
  const ax = options.acceleration?.[0] ?? 0;
  const ay = options.acceleration?.[1] ?? 0;
  const damping = options.damping ?? 0;
  const iters = options.collisionIterations ?? 1;
  const eps = options.epsilon ?? 1e-6;

  if (!Number.isFinite(dt) || dt <= 0) {
    throw new Error(`sim-kit/verlet-step: dt must be > 0, got ${dt}`);
  }
  if (damping < 0 || damping > 1) {
    throw new Error(`sim-kit/verlet-step: damping must be in [0, 1], got ${damping}`);
  }

  const dt2 = dt * dt;
  const next: Array<{ id: string; position: [number, number]; prevPosition: [number, number]; radius: number; label: string }> =
    particles.map((p) => {
      const vx = (p.position[0] - p.prevPosition[0]) * (1 - damping);
      const vy = (p.position[1] - p.prevPosition[1]) * (1 - damping);
      return {
        id: p.id,
        position: [p.position[0] + vx + ax * dt2, p.position[1] + vy + ay * dt2],
        prevPosition: [p.position[0], p.position[1]],
        radius: p.radius,
        label: p.label,
      };
    });

  for (let iter = 0; iter < iters; iter++) {
    for (let i = 0; i < next.length; i++) {
      for (let j = i + 1; j < next.length; j++) {
        const a = next[i]!;
        const b = next[j]!;
        const dx = b.position[0] - a.position[0];
        const dy = b.position[1] - a.position[1];
        const dist2 = dx * dx + dy * dy;
        const minDist = a.radius + b.radius;
        if (dist2 >= minDist * minDist) continue;
        const dist = Math.sqrt(dist2) || eps;
        const overlap = minDist - dist;
        const nx = dx / dist;
        const ny = dy / dist;
        a.position = [a.position[0] - (nx * overlap) / 2, a.position[1] - (ny * overlap) / 2];
        b.position = [b.position[0] + (nx * overlap) / 2, b.position[1] + (ny * overlap) / 2];
      }
    }
  }

  return next.map((p) => ({
    id: p.id,
    position: p.position as readonly [number, number],
    prevPosition: p.prevPosition as readonly [number, number],
    radius: p.radius,
    label: p.label,
  }));
}
