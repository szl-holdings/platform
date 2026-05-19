/**
 * Sentra Status Bridge — cross-device telemetry surface for A11oy SentraOps.
 *
 * The Sentra browser store also writes to `localStorage` under
 * `sentra:ops-status` for same-browser handoff. This route mirrors that
 * payload to the API server so A11oy operators viewing the orchestration
 * dashboard on a second device (or a fresh session) can still see live
 * Sentra telemetry instead of the "telemetry not yet available" placeholder.
 *
 * Storage is in-memory (process-local). This is acceptable because the
 * Sentra browser store re-broadcasts on every `notify()` mutation and the
 * A11oy view polls every few seconds — so any restart self-heals as soon
 * as a Sentra session is open anywhere.
 *
 * - GET  /api/sentra/status — last broadcast status, or null
 * - POST /api/sentra/status — Sentra pushes its store summary here
 *
 * Auth: anonymous reads/writes (same posture as `sentra-ops-core`).
 */

import { type IRouter, Router } from 'express';
import rateLimit from 'express-rate-limit';

interface AgentTelemetry {
  dispatches_today: number;
  last_dispatch: string | null;
}

interface SentraStatusPayload {
  activeIncidents: number;
  pendingApprovals: number;
  auditEntries: number;
  evidenceItems: number;
  policyDenials: number;
  totalAssets: number;
  ownedAssets: number;
  agents?: Record<string, AgentTelemetry>;
  lastUpdated: string;
}

let _latest: SentraStatusPayload | null = null;
let _receivedAt: string | null = null;

const router: IRouter = Router();

const writeLimiter = rateLimit({
  windowMs: 60_000,
  max: 240,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limit_exceeded', message: 'Too many sentra status writes' },
});

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function coerceAgents(input: unknown): Record<string, AgentTelemetry> | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const out: Record<string, AgentTelemetry> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (!v || typeof v !== 'object') continue;
    const obj = v as Record<string, unknown>;
    const dispatches = isNumber(obj.dispatches_today) ? obj.dispatches_today : 0;
    const last = typeof obj.last_dispatch === 'string' ? obj.last_dispatch : null;
    out[k] = { dispatches_today: dispatches, last_dispatch: last };
  }
  return out;
}

function coerce(body: unknown): SentraStatusPayload | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const payload: SentraStatusPayload = {
    activeIncidents: isNumber(b.activeIncidents) ? b.activeIncidents : 0,
    pendingApprovals: isNumber(b.pendingApprovals) ? b.pendingApprovals : 0,
    auditEntries: isNumber(b.auditEntries) ? b.auditEntries : 0,
    evidenceItems: isNumber(b.evidenceItems) ? b.evidenceItems : 0,
    policyDenials: isNumber(b.policyDenials) ? b.policyDenials : 0,
    totalAssets: isNumber(b.totalAssets) ? b.totalAssets : 0,
    ownedAssets: isNumber(b.ownedAssets) ? b.ownedAssets : 0,
    agents: coerceAgents(b.agents),
    lastUpdated: typeof b.lastUpdated === 'string' ? b.lastUpdated : new Date().toISOString(),
  };
  return payload;
}

router.get('/sentra/status', (_req, res) => {
  res.setHeader('cache-control', 'no-store');
  res.json({
    status: _latest,
    received_at: _receivedAt,
    source: _latest ? 'sentra-store-broadcast' : null,
  });
});

router.post('/sentra/status', writeLimiter, (req, res) => {
  const payload = coerce(req.body);
  if (!payload) {
    res.status(400).json({ error: 'invalid_payload', message: 'Sentra status payload missing required fields' });
    return;
  }
  _latest = payload;
  _receivedAt = new Date().toISOString();
  res.json({ ok: true, received_at: _receivedAt });
});

export default router;
