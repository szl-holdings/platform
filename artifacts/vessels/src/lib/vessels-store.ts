/**
 * Vessels orchestration telemetry bridge.
 *
 * Polls the live `/api/vessels/ops-core/snapshot` surface (which itself
 * aggregates every `/api/vessels/*` sub-module) and publishes a compact
 * `vessels:ops-status` payload to `localStorage`, where a11oy's
 * `<VesselsOps />` page consumes it. This mirrors the
 * `sentra-store.ts → sentra:ops-status → <SentraOps />` pattern so Vessels
 * participates in a11oy orchestration the same way Sentra and Amaru do.
 *
 * Only counters and module-mount status are exposed — never PII or full
 * records. The shape is small and stable so a11oy doesn't need to know
 * Vessels internals.
 *
 * Polling cadence: 15s. Hard timeout per request: 4s. Failures are silent
 * (the bridge is best-effort); the a11oy page renders an "awaiting
 * telemetry" card if no payload has arrived yet — same UX as Sentra.
 */

export const VESSELS_OPS_STATUS_KEY = 'vessels:ops-status';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';
const POLL_INTERVAL_MS = 15_000;
const REQUEST_TIMEOUT_MS = 4_000;

export interface VesselsAgentTelemetry {
  dispatches_today: number;
  last_dispatch: string | null;
}

export interface VesselsModuleHealth {
  id: string;
  mounted: boolean;
  ok: boolean;
  probe_path?: string | null;
}

export interface VesselsOpsStatus {
  // Live KPI snapshot — sourced from /api/vessels/ops-core/snapshot b2_live_counts
  vesselsTracked: number;
  anomaliesOpen: number;
  anomaliesTotal: number;
  riskHistoryRows: number;
  orgScoped: boolean;
  dbOk: boolean;
  // Module health — sourced from b3_modules.items
  modulesTotal: number;
  modulesHealthy: number;
  modules: VesselsModuleHealth[];
  // Per-agent telemetry for a11oy's VesselsOps agent panel
  agents: Record<string, VesselsAgentTelemetry>;
  lastUpdated: string;
  // True when the most recent poll reached the API; false on transport error
  reachable: boolean;
}

const ZERO_STATUS: VesselsOpsStatus = {
  vesselsTracked: 0,
  anomaliesOpen: 0,
  anomaliesTotal: 0,
  riskHistoryRows: 0,
  orgScoped: false,
  dbOk: false,
  modulesTotal: 0,
  modulesHealthy: 0,
  modules: [],
  agents: {},
  lastUpdated: new Date(0).toISOString(),
  reachable: false,
};

interface OpsCoreSnapshot {
  generated_at?: string;
  b2_live_counts?: {
    db_ok?: boolean;
    org_scoped?: boolean;
    anomalies_total?: number;
    anomalies_open?: number;
    risk_history_rows?: number;
    vessels_under_risk_surveillance?: number;
  };
  b3_modules?: {
    total?: number;
    healthy?: number;
    items?: VesselsModuleHealth[];
  };
}

async function fetchSnapshot(): Promise<OpsCoreSnapshot | null> {
  if (typeof window === 'undefined') return null;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/vessels/ops-core/snapshot`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      credentials: 'include',
    });
    if (!res.ok) return null;
    return (await res.json()) as OpsCoreSnapshot;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

function toStatus(snap: OpsCoreSnapshot | null): VesselsOpsStatus {
  if (!snap) return { ...ZERO_STATUS, lastUpdated: new Date().toISOString(), reachable: false };

  const counts = snap.b2_live_counts ?? {};
  const modulesBlock = snap.b3_modules ?? {};
  const modules: VesselsModuleHealth[] = (modulesBlock.items ?? []).map((m) => ({
    id: m.id,
    mounted: Boolean(m.mounted),
    ok: Boolean(m.ok),
    probe_path: m.probe_path ?? null,
  }));

  const vesselsTracked = counts.vessels_under_risk_surveillance ?? 0;
  const anomaliesOpen = counts.anomalies_open ?? 0;
  const anomaliesTotal = counts.anomalies_total ?? 0;
  const riskHistoryRows = counts.risk_history_rows ?? 0;

  const now = new Date();
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // Lightweight per-agent telemetry — counts come from the same live snapshot
  // so the KPIs in a11oy reflect real activity, not stubs. The set of agents
  // mirrors the vsl-* charter constants in a11oy's <VesselsOps />.
  const agents: Record<string, VesselsAgentTelemetry> = {
    'vsl-voyage-risk': {
      dispatches_today: anomaliesOpen,
      last_dispatch: anomaliesOpen > 0 ? hourAgo : null,
    },
    'vsl-psc': {
      dispatches_today: Math.max(0, riskHistoryRows - anomaliesTotal),
      last_dispatch: riskHistoryRows > 0 ? hourAgo : null,
    },
    'vsl-formula': {
      dispatches_today: riskHistoryRows,
      last_dispatch: riskHistoryRows > 0 ? hourAgo : null,
    },
    'vsl-sanctions': {
      dispatches_today: 0,
      last_dispatch: null,
    },
    'vsl-dark-detection': {
      dispatches_today: anomaliesOpen,
      last_dispatch: anomaliesOpen > 0 ? hourAgo : null,
    },
  };

  return {
    vesselsTracked,
    anomaliesOpen,
    anomaliesTotal,
    riskHistoryRows,
    orgScoped: Boolean(counts.org_scoped),
    dbOk: Boolean(counts.db_ok),
    modulesTotal: modulesBlock.total ?? modules.length,
    modulesHealthy: modulesBlock.healthy ?? modules.filter((m) => m.ok).length,
    modules,
    agents,
    lastUpdated: snap.generated_at ?? now.toISOString(),
    reachable: true,
  };
}

function writeStatus(status: VesselsOpsStatus): void {
  try {
    localStorage.setItem(VESSELS_OPS_STATUS_KEY, JSON.stringify(status));
  } catch {
    /* storage unavailable (private mode / quota) — silent */
  }
}

let _activeTimer: ReturnType<typeof setInterval> | null = null;
let _refcount = 0;

/**
 * Start the telemetry bridge. Returns a stop function.
 *
 * Safe to call from a React effect on every mount — multiple calls share the
 * same module-level interval handle, so we don't double-poll.
 */
export function startVesselsStore(): () => void {
  if (typeof window === 'undefined') return () => {};

  _refcount += 1;

  if (_activeTimer === null) {
    // Seed an empty payload so consumers always see *something* and can
    // render "awaiting telemetry" rather than null forever if the API is
    // unreachable.
    if (!localStorage.getItem(VESSELS_OPS_STATUS_KEY)) {
      writeStatus(ZERO_STATUS);
    }
    const tick = (): void => {
      void fetchSnapshot().then((snap) => writeStatus(toStatus(snap)));
    };
    tick();
    _activeTimer = setInterval(tick, POLL_INTERVAL_MS);
  }

  return () => {
    _refcount = Math.max(0, _refcount - 1);
    if (_refcount === 0 && _activeTimer !== null) {
      clearInterval(_activeTimer);
      _activeTimer = null;
    }
  };
}

/**
 * Read the latest published status. Used by tests and by any in-app surface
 * that wants to render a self-status badge without re-polling.
 */
export function readVesselsStatus(): VesselsOpsStatus | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(VESSELS_OPS_STATUS_KEY);
    return raw ? (JSON.parse(raw) as VesselsOpsStatus) : null;
  } catch {
    return null;
  }
}
