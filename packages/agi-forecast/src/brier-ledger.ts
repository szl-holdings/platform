export interface BrierEntry {
  readonly date: string;
  readonly variable: string;
  readonly predicted: number;
  readonly actual: number;
}

const RING_CAPACITY = 365;

function validateProb(name: string, p: number): void {
  if (!Number.isFinite(p) || p < 0 || p > 1) {
    throw new Error(`brierLedger: ${name} must be a finite number in [0,1] (got ${p})`);
  }
}

export interface BrierLedger {
  record(entry: BrierEntry): void;
  score(): number;
  size(): number;
  entries(): readonly BrierEntry[];
  clear(): void;
}

export function createBrierLedger(capacity: number = RING_CAPACITY): BrierLedger {
  if (!Number.isInteger(capacity) || capacity <= 0) {
    throw new Error('createBrierLedger: capacity must be a positive integer');
  }
  const buf: BrierEntry[] = [];
  let head = 0;

  return {
    record(entry) {
      validateProb('predicted', entry.predicted);
      validateProb('actual', entry.actual);
      if (buf.length < capacity) {
        buf.push(entry);
      } else {
        buf[head] = entry;
        head = (head + 1) % capacity;
      }
    },
    score() {
      if (buf.length === 0) return 0;
      let sum = 0;
      for (const e of buf) {
        const d = e.predicted - e.actual;
        sum += d * d;
      }
      return sum / buf.length;
    },
    size() {
      return buf.length;
    },
    entries() {
      return buf.slice();
    },
    clear() {
      buf.length = 0;
      head = 0;
    },
  };
}

/** Module-level default ledger used by {@link recordPrediction}/{@link score}. */
const defaultLedger = createBrierLedger();

export function recordPrediction(entry: BrierEntry): void {
  defaultLedger.record(entry);
}

export function score(): number {
  return defaultLedger.score();
}

export const brierLedger = defaultLedger;
