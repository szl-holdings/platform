/**
 * Operator Calibration — sotopia-RL style per-operator policy nudges.
 *
 * Watches the stream of approval decisions and learns a per-(operator, domain)
 * Lutar Λ-Resonance weight that the UniRec scorer and downstream governance
 * surfaces consult. The weight is intentionally bounded to a narrow band
 * [0.80, 1.20] so a single operator can never collapse the rest of the
 * platform's prioritisation — only nudge it.
 *
 * Update rule (per decision):
 *   approve   → weight += +0.04 · (1 - weight/1.20)   (asymptotic toward 1.20)
 *   deny      → weight += -0.06 · (weight/0.80 - 1)   (asymptotic toward 0.80)
 *   escalate  → weight += -0.02                       (mild dampening)
 *
 * The store is in-memory by default (sufficient for the operator session and
 * for tests). A DB-backed swap-in is straightforward: implement
 * `OperatorCalibrationStore` with the same interface.
 *
 * Source: docs/research/agi-stack-synthesis-2026.md §9 (sotopia-rl).
 */

export type Verdict = 'approve' | 'deny' | 'escalate';

export interface CalibrationKey {
  operatorId: string;
  domain: string;
}

/**
 * Canonical domain key — folds approval-side keys (e.g. "maritime.standby",
 * "Legal.demurrage") and UI-side keys (e.g. "Maritime", "Legal") onto the
 * same bucket so a deny on "maritime.standby" still nudges the weight that
 * UniRec consults when ranking a "Maritime" briefing. Always:
 *   1. lowercase
 *   2. take the first dot-segment
 *   3. trim whitespace
 *
 * Centralising this here prevents calibration ↔ UniRec keyspace drift.
 */
export function canonicalDomain(raw: string): string {
  return (raw ?? '').toLowerCase().split('.')[0]!.trim();
}

export interface OperatorCalibrationEntry {
  operatorId: string;
  domain: string;
  weight: number;
  decisions: number;
  lastVerdict?: Verdict;
  lastUpdatedAt: number;
}

export interface OperatorCalibrationStore {
  read(key: CalibrationKey): OperatorCalibrationEntry | undefined;
  write(entry: OperatorCalibrationEntry): void;
  list(): OperatorCalibrationEntry[];
  clear(): void;
}

class InMemoryStore implements OperatorCalibrationStore {
  private readonly map = new Map<string, OperatorCalibrationEntry>();
  private k(k: CalibrationKey): string { return `${k.operatorId}::${k.domain}`; }
  read(k: CalibrationKey) { return this.map.get(this.k(k)); }
  write(e: OperatorCalibrationEntry) { this.map.set(this.k(e), e); }
  list() { return Array.from(this.map.values()); }
  clear() { this.map.clear(); }
}

const RESONANCE_FLOOR = 0.80;
const RESONANCE_CEILING = 1.20;
const STARTING_WEIGHT = 1.0;

let activeStore: OperatorCalibrationStore = new InMemoryStore();

export function setCalibrationStore(store: OperatorCalibrationStore): void {
  activeStore = store;
}

export function getCalibrationStore(): OperatorCalibrationStore {
  return activeStore;
}

function clampWeight(w: number): number {
  if (!Number.isFinite(w)) return STARTING_WEIGHT;
  return Math.max(RESONANCE_FLOOR, Math.min(RESONANCE_CEILING, w));
}

/**
 * Record an operator decision and return the new per-(operator, domain) weight.
 * Pure with respect to the active store — no side effects beyond the store.
 */
export function recordDecision(input: {
  operatorId: string;
  domain: string;
  verdict: Verdict;
}): OperatorCalibrationEntry {
  const key: CalibrationKey = {
    operatorId: input.operatorId,
    domain: canonicalDomain(input.domain),
  };
  const prev = activeStore.read(key);
  const prevWeight = prev?.weight ?? STARTING_WEIGHT;

  let nextWeight = prevWeight;
  switch (input.verdict) {
    case 'approve': {
      const headroom = 1 - prevWeight / RESONANCE_CEILING;
      nextWeight = prevWeight + 0.04 * Math.max(0, headroom);
      break;
    }
    case 'deny': {
      const drag = prevWeight / RESONANCE_FLOOR - 1;
      nextWeight = prevWeight - 0.06 * Math.max(0, drag);
      break;
    }
    case 'escalate': {
      nextWeight = prevWeight - 0.02;
      break;
    }
  }

  const entry: OperatorCalibrationEntry = {
    operatorId: input.operatorId,
    domain: key.domain,
    weight: clampWeight(nextWeight),
    decisions: (prev?.decisions ?? 0) + 1,
    lastVerdict: input.verdict,
    lastUpdatedAt: Date.now(),
  };
  activeStore.write(entry);
  return entry;
}

export function getOperatorResonance(operatorId: string, domain: string): number {
  return activeStore.read({ operatorId, domain: canonicalDomain(domain) })?.weight ?? STARTING_WEIGHT;
}

export function listCalibration(): OperatorCalibrationEntry[] {
  return activeStore.list();
}

export function resetCalibration(): void {
  activeStore.clear();
}

export const CALIBRATION_BAND = {
  floor: RESONANCE_FLOOR,
  ceiling: RESONANCE_CEILING,
  starting: STARTING_WEIGHT,
} as const;
