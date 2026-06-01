/**
 * Primitive 58 — Vanishing-point coherence
 *
 * The Last Supper uses a single vanishing point. A projective scene
 * declares orthogonal lines; we verify they pass within tolerance ε
 * of a declared vanishing point. Lines that miss are reported, not
 * silently ignored.
 *
 * Each line is given as two distinct 2D points (p,q). Distance from
 * a 2D point V=(vx,vy) to line through (p,q) is computed as
 *   d = |(qy-py)*vx - (qx-px)*vy + qx*py - qy*px| / |q-p|.
 */

export interface Line2D {
  id: string;
  p: [number, number];
  q: [number, number];
}

export interface VPReceipt {
  vanishingPoint: [number, number];
  perLine: { id: string; distance: number; passes: boolean }[];
  maxDistance: number;
  tolerance: number;
  coherent: boolean;
  rationale: string;
}

function distancePointToLine(
  v: [number, number],
  p: [number, number],
  q: [number, number],
): number {
  const [vx, vy] = v;
  const [px, py] = p;
  const [qx, qy] = q;
  const num = Math.abs(
    (qy - py) * vx - (qx - px) * vy + qx * py - qy * px,
  );
  const len = Math.hypot(qx - px, qy - py);
  if (len === 0) {
    throw new Error("degenerate line: p === q");
  }
  return num / len;
}

export function checkVanishingPoint(
  vp: [number, number],
  lines: Line2D[],
  tolerance = 0.5,
): VPReceipt {
  if (lines.length < 2) {
    throw new Error("need at least 2 orthogonals");
  }
  const perLine = lines.map((l) => {
    const d = distancePointToLine(vp, l.p, l.q);
    return { id: l.id, distance: d, passes: d <= tolerance };
  });
  const maxDistance = Math.max(...perLine.map((r) => r.distance));
  const coherent = perLine.every((r) => r.passes);
  return {
    vanishingPoint: vp,
    perLine,
    maxDistance,
    tolerance,
    coherent,
    rationale: coherent
      ? "all orthogonals converge at vanishing point within tolerance"
      : "scene incoherent: at least one orthogonal misses vanishing point",
  };
}
