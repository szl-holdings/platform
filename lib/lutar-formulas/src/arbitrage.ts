/**
 * Language Arbitrage A_lang — the porting-decision formula from the A11oy
 * Ultra/Chat payloads.
 *
 *     A_lang = (T_py / T_ts) · (M_ts / M_py) · L4_lib · cos θ_role − κ
 *
 * Each component is a runtime asset (a service, a kernel, an io edge) and
 * the formula scores how worthwhile it is to port that asset from its
 * current language to a target (Python, Rust, …).
 *
 *   T_py / T_ts  — runtime speed-up vs the TypeScript baseline (>1 = faster)
 *   M_ts / M_py  — memory ratio (>1 = lower memory in target)
 *   L4_lib       — library-fit score, in [0,1]
 *   cos θ_role   — role-alignment with target ecosystem, in [-1, 1]
 *   κ            — port cost penalty (engineering hours, risk)
 *
 * Recommendation: PORT_PY if A_py > 0; RUST if A_rust > max(A_py, 0).
 */

export type PortTarget = 'py' | 'rust';

export interface Component {
  name: string;
  /** Current implementation language */
  current: 'ts' | 'py' | 'rust' | 'node' | 'mixed' | 'deferred';
  /** Coarse role tag */
  role: 'io' | 'compute' | 'kernel' | 'mixed';
  /** Runtime ratio T_py / T_ts (1.0 = tie; <1 = python faster) */
  t_py: number;
  t_ts: number;
  /** Memory factor relative to TS baseline (1.0 = tie; >1 = more memory) */
  m: number;
  /** Library-fit score for Python target, in [0,1] */
  lib: number;
  /** Role alignment for Python target, in [-1,1] */
  cos: number;
  /** Port cost penalty κ for the Python target */
  k: number;

  // Optional Rust-target columns
  rust_t?: number;
  rust_m?: number;
  rust_lib?: number;
  rust_cos?: number;
  rust_k?: number;
}

export function aLang(c: Component, target: PortTarget = 'py'): number {
  if (target === 'py') {
    const speed = 1 / Math.max(c.t_py / c.t_ts, 1e-6);
    return speed * c.m * c.lib * c.cos - c.k;
  }
  if (
    target === 'rust' &&
    c.rust_t !== undefined &&
    c.rust_m !== undefined &&
    c.rust_lib !== undefined &&
    c.rust_cos !== undefined &&
    c.rust_k !== undefined
  ) {
    const speed = 1 / Math.max(c.rust_t / c.t_ts, 1e-6);
    const memInv = 1 / Math.max(c.rust_m, 1e-6);
    return speed * memInv * c.rust_lib * c.rust_cos - c.rust_k;
  }
  return -Infinity;
}

export type PortRecommendation = 'PORT_PY' | 'RUST' | 'KEEP';

export interface PortAdvice {
  recommend: PortRecommendation;
  score: number;
}

export function portRecommendation(c: Component): PortAdvice {
  const apy = aLang(c, 'py');
  const aru = aLang(c, 'rust');
  if (Number.isFinite(aru) && aru > Math.max(apy, 0)) {
    return { recommend: 'RUST', score: Math.round(aru * 1000) / 1000 };
  }
  if (apy > 0) {
    return { recommend: 'PORT_PY', score: Math.round(apy * 1000) / 1000 };
  }
  return { recommend: 'KEEP', score: 0 };
}

export function meanALang(components: readonly Component[]): number {
  if (!components.length) return 0;
  const total = components.reduce((acc, c) => acc + aLang(c, 'py'), 0);
  return total / components.length;
}
