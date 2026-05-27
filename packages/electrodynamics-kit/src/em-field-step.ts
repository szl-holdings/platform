/**
 * EM field step with per-step energy bookkeeping — re-expressed from
 * mumax3's published LLG-on-a-grid discipline. See
 * docs/research/electrodynamics-synthesis-2026.md §10.3.
 *
 *   "Per-step energy bookkeeping — divergence (energy growing without
 *    source) is detectable per-step."
 *
 * This is a TOY 1-D scalar evolution; it does not solve micromagnetics.
 * The value it ships is the typed receipt shape (`em.field-step.v1`)
 * and the per-step energy breakdown discipline that downstream
 * consumers (Amaru ingest, ROSIE sim) get regardless of solver.
 */

export interface FieldGrid {
  readonly gridRef: string;
  /** 1-D scalar field values. */
  readonly values: readonly number[];
  /** Cell size in opaque units. */
  readonly dx: number;
}

export interface EnergyComponents {
  /** Exchange energy (gradient-squared). */
  readonly exchange: number;
  /** Zeeman / external-field energy. */
  readonly zeeman: number;
  /** Anisotropy (here: |v|² penalty). */
  readonly anisotropy: number;
}

export interface FieldStepResult {
  readonly stepIndex: number;
  readonly grid: FieldGrid;
  readonly energyComponents: EnergyComponents;
  readonly totalEnergy: number;
  readonly deltaEnergy: number;
}

export interface FieldStepOptions {
  /** External field. */
  readonly externalField?: number;
  /** Anisotropy weight ≥ 0. */
  readonly anisotropyWeight?: number;
  /** Exchange weight ≥ 0. */
  readonly exchangeWeight?: number;
  /** Damping ∈ [0, 1). */
  readonly damping?: number;
}

/** Pure: compute energy components for a given grid + parameters. */
export function computeEnergy(grid: FieldGrid, opts: FieldStepOptions = {}): EnergyComponents {
  const ext = opts.externalField ?? 0;
  const aw = opts.anisotropyWeight ?? 0;
  const ew = opts.exchangeWeight ?? 1;
  let exchange = 0;
  let zeeman = 0;
  let anisotropy = 0;
  for (let i = 0; i < grid.values.length; i++) {
    const v = grid.values[i]!;
    zeeman += -ext * v;
    anisotropy += aw * v * v;
    if (i + 1 < grid.values.length) {
      const dv = (grid.values[i + 1]! - v) / grid.dx;
      exchange += ew * dv * dv;
    }
  }
  return { exchange, zeeman, anisotropy };
}

/** Total energy = sum of components. */
export function totalEnergy(e: EnergyComponents): number {
  return e.exchange + e.zeeman + e.anisotropy;
}

/**
 * Take one toy step. Pure function of (grid, opts, dt, stepIndex,
 * priorTotalEnergy). Returns the new grid + the energy breakdown + the
 * delta — the receipt-bearing trio.
 *
 * The step is a damped gradient descent on the total energy with an
 * external-field pull. Stability is governed by `damping`; large dt
 * with no damping will diverge, and the per-step energy delta will
 * surface that immediately.
 */
export function stepField(
  grid: FieldGrid,
  dt: number,
  stepIndex: number,
  priorTotalEnergy: number,
  opts: FieldStepOptions = {},
): FieldStepResult {
  if (!Number.isFinite(dt) || dt <= 0) {
    throw new Error(`em-field-step: dt must be > 0, got ${dt}`);
  }
  const ext = opts.externalField ?? 0;
  const aw = opts.anisotropyWeight ?? 0;
  const ew = opts.exchangeWeight ?? 1;
  const damping = opts.damping ?? 0.1;
  if (damping < 0 || damping >= 1) {
    throw new Error(`em-field-step: damping must be in [0, 1), got ${damping}`);
  }
  const n = grid.values.length;
  const next = grid.values.slice();
  // dE/dv_i = -ext + 2*aw*v_i  - 2*ew*(v_{i+1} - 2*v_i + v_{i-1})/dx²  (interior)
  const dx2 = grid.dx * grid.dx;
  for (let i = 0; i < n; i++) {
    const v = grid.values[i]!;
    let lap = 0;
    if (i > 0 && i < n - 1) {
      lap = (grid.values[i + 1]! - 2 * v + grid.values[i - 1]!) / dx2;
    }
    const grad = -ext + 2 * aw * v - 2 * ew * lap;
    next[i] = v - dt * (1 - damping) * grad;
  }
  const nextGrid: FieldGrid = { gridRef: grid.gridRef, values: next, dx: grid.dx };
  const components = computeEnergy(nextGrid, opts);
  const total = totalEnergy(components);
  return {
    stepIndex,
    grid: nextGrid,
    energyComponents: components,
    totalEnergy: total,
    deltaEnergy: total - priorTotalEnergy,
  };
}
