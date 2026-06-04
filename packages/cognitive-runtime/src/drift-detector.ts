/**
 * Semantic Drift Detector
 *
 * Tracks per-agent action histograms over rolling windows (1h, 24h, 7d).
 * On each agent action, updates the histogram and computes a drift score
 * using Jensen-Shannon divergence from the agent's baseline distribution.
 *
 * When drift exceeds a configurable threshold, fires an alert with a
 * visual breakdown of what changed. The governance-posture page shows
 * per-agent drift status.
 */

export type DriftWindow = '1h' | '24h' | '7d';

export interface ActionHistogram {
  [action: string]: number;
}

export interface DriftAlert {
  agentId: string;
  driftScore: number;
  window: DriftWindow;
  threshold: number;
  topShifts: Array<{ action: string; baselineRatio: number; currentRatio: number; delta: number }>;
  firedAt: number;
}

export interface AgentDriftStatus {
  agentId: string;
  driftScore1h: number;
  driftScore24h: number;
  driftScore7d: number;
  alert: DriftAlert | null;
  lastUpdatedAt: number;
  totalActions: number;
}

const WINDOW_MS: Record<DriftWindow, number> = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};

interface AgentRecord {
  agentId: string;
  events: Array<{ action: string; recordedAt: number }>;
  baseline: ActionHistogram;
  alerts: DriftAlert[];
  totalActions: number;
}

const DEFAULT_DRIFT_THRESHOLD = 0.15;

class DriftDetectorStore {
  private agents = new Map<string, AgentRecord>();
  private driftThreshold: number;

  constructor(threshold: number = DEFAULT_DRIFT_THRESHOLD) {
    this.driftThreshold = threshold;
  }

  recordAction(agentId: string, action: string, recordedAt: number = Date.now()): DriftAlert | null {
    let record = this.agents.get(agentId);
    if (!record) {
      record = { agentId, events: [], baseline: {}, alerts: [], totalActions: 0 };
      this.agents.set(agentId, record);
    }

    record.events.push({ action, recordedAt });
    record.totalActions++;

    // Prune events older than 7d
    const cutoff7d = Date.now() - WINDOW_MS['7d'];
    record.events = record.events.filter((e) => e.recordedAt >= cutoff7d);

    // Update baseline from 7d window
    if (record.totalActions >= 20) {
      record.baseline = buildHistogram(record.events);
    }

    if (record.totalActions < 10) return null;

    // Compute drift for each window; fire alert on worst window
    let worstAlert: DriftAlert | null = null;
    for (const win of ['1h', '24h', '7d'] as DriftWindow[]) {
      const cutoff = Date.now() - WINDOW_MS[win];
      const windowEvents = record.events.filter((e) => e.recordedAt >= cutoff);
      if (windowEvents.length < 3) continue;

      const current = buildHistogram(windowEvents);
      const drift = jensenShannonDivergence(record.baseline, current);

      if (drift >= this.driftThreshold) {
        const topShifts = computeTopShifts(record.baseline, current, 5);
        const alert: DriftAlert = {
          agentId,
          driftScore: Math.round(drift * 1000) / 1000,
          window: win,
          threshold: this.driftThreshold,
          topShifts,
          firedAt: Date.now(),
        };
        if (!worstAlert || alert.driftScore > worstAlert.driftScore) {
          worstAlert = alert;
        }
      }
    }

    if (worstAlert) {
      record.alerts.push(worstAlert);
      if (record.alerts.length > 100) record.alerts.shift();
    }

    return worstAlert;
  }

  getDriftStatus(agentId: string): AgentDriftStatus | null {
    const record = this.agents.get(agentId);
    if (!record) return null;

    const now = Date.now();
    const getScore = (win: DriftWindow): number => {
      const cutoff = now - WINDOW_MS[win];
      const ev = record.events.filter((e) => e.recordedAt >= cutoff);
      if (ev.length < 3) return 0;
      const current = buildHistogram(ev);
      return Math.round(jensenShannonDivergence(record.baseline, current) * 1000) / 1000;
    };

    const recentAlert = record.alerts.at(-1) ?? null;
    return {
      agentId,
      driftScore1h: getScore('1h'),
      driftScore24h: getScore('24h'),
      driftScore7d: getScore('7d'),
      alert: recentAlert,
      lastUpdatedAt: record.events.at(-1)?.recordedAt ?? now,
      totalActions: record.totalActions,
    };
  }

  getAllDriftStatuses(): AgentDriftStatus[] {
    return Array.from(this.agents.keys())
      .map((id) => this.getDriftStatus(id))
      .filter((s): s is AgentDriftStatus => s !== null)
      .sort((a, b) => b.driftScore24h - a.driftScore24h);
  }

  setThreshold(t: number): void {
    this.driftThreshold = t;
  }
}

function buildHistogram(events: Array<{ action: string }>): ActionHistogram {
  const counts: ActionHistogram = {};
  for (const e of events) {
    counts[e.action] = (counts[e.action] ?? 0) + 1;
  }
  const total = events.length;
  for (const k of Object.keys(counts)) {
    counts[k] = (counts[k] ?? 0) / total;
  }
  return counts;
}

function jensenShannonDivergence(p: ActionHistogram, q: ActionHistogram): number {
  const keys = new Set([...Object.keys(p), ...Object.keys(q)]);
  const eps = 1e-10;
  let jsd = 0;
  for (const k of keys) {
    const pi = (p[k] ?? 0) + eps;
    const qi = (q[k] ?? 0) + eps;
    const mi = (pi + qi) / 2;
    jsd += 0.5 * pi * Math.log(pi / mi) + 0.5 * qi * Math.log(qi / mi);
  }
  return Math.min(1, Math.max(0, jsd));
}

function computeTopShifts(
  baseline: ActionHistogram,
  current: ActionHistogram,
  topN: number,
): DriftAlert['topShifts'] {
  const keys = new Set([...Object.keys(baseline), ...Object.keys(current)]);
  const shifts = Array.from(keys).map((action) => {
    const b = baseline[action] ?? 0;
    const c = current[action] ?? 0;
    return { action, baselineRatio: b, currentRatio: c, delta: c - b };
  });
  shifts.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return shifts.slice(0, topN);
}

export const globalDriftDetector = new DriftDetectorStore();
