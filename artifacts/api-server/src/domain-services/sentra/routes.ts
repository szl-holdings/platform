/**
 * Sentra domain HTTP routes — typed thin layer over the Python sentra-core
 * sidecar (see ./sentra-core-bridge.ts).
 *
 * Mounted at /api/sentra/core/* by routes/index.ts.
 *
 *   POST /api/sentra/core/threat-model      build threat graph
 *   POST /api/sentra/core/posture-drift     compute drift report
 *   POST /api/sentra/core/incident-response run runbook
 *   POST /api/sentra/core/evidence-pack     build signed pack
 *   POST /api/sentra/core/policy-gate       evaluate policy
 *   GET  /api/sentra/core/health            sidecar availability
 */

import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';

import { handleRouteError, sendSuccess } from '../../lib/api-response';
import { validateBody } from '../../lib/validation';
import { callSentraCore, probeSentraCore, SentraCoreInvocationError } from './sentra-core-bridge';

const router: IRouter = Router();

/**
 * SSRF guard: the sentra-core sidecar will issue outbound HTTP to any URL
 * supplied via `yawar_url`, `policy_runtime_url`, or policy-gate `runtime_url`.
 * To prevent callers from pointing those at arbitrary internal/external hosts,
 * we constrain them to an operator-curated allowlist.
 *
 * Allowed host sources, in order:
 *  1. SENTRA_OUTBOUND_ALLOWED_HOSTS — comma-separated hostnames (exact match
 *     or *.suffix for subdomain wildcards). Empty/unset = no extras.
 *  2. The hostnames of A11OY_RUNTIME_URL and SENTRA_YAWAR_URL when configured.
 *  3. Outside of production, localhost / 127.0.0.1 / ::1 / *.replit.dev are
 *     allowed automatically so dev/preview keeps working.
 *
 * Protocol is restricted to http/https. Anything else (file:, ftp:, gopher:,
 * data:) is rejected outright.
 */
function getAllowedOutboundHosts(): { exact: Set<string>; suffixes: string[] } {
  const exact = new Set<string>();
  const suffixes: string[] = [];

  const addEntry = (raw: string) => {
    const entry = raw.trim().toLowerCase();
    if (!entry) return;
    if (entry.startsWith('*.')) {
      suffixes.push(entry.slice(1)); // ".example.com"
    } else {
      exact.add(entry);
    }
  };

  for (const raw of (process.env.SENTRA_OUTBOUND_ALLOWED_HOSTS ?? '').split(',')) {
    addEntry(raw);
  }
  for (const envName of ['A11OY_RUNTIME_URL', 'SENTRA_YAWAR_URL']) {
    const value = process.env[envName];
    if (!value) continue;
    try {
      exact.add(new URL(value).hostname.toLowerCase());
    } catch {
      // ignore malformed env URLs
    }
  }
  if (process.env.NODE_ENV !== 'production') {
    exact.add('localhost');
    exact.add('127.0.0.1');
    exact.add('::1');
    suffixes.push('.replit.dev');
  }
  return { exact, suffixes };
}

function isOutboundUrlAllowed(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
  const host = parsed.hostname.toLowerCase();
  const { exact, suffixes } = getAllowedOutboundHosts();
  if (exact.has(host)) return true;
  return suffixes.some((suffix) => host.endsWith(suffix));
}

const allowedOutboundUrl = z
  .string()
  .url()
  .refine(isOutboundUrlAllowed, {
    message:
      'URL host is not in the Sentra outbound allowlist (set SENTRA_OUTBOUND_ALLOWED_HOSTS, A11OY_RUNTIME_URL, or SENTRA_YAWAR_URL)',
  });

const severity = z.enum(['critical', 'high', 'medium', 'low']);
const assetKind = z.enum(['endpoint', 'server', 'identity', 'cloud', 'network', 'data', 'saas']);

const assetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: assetKind,
  exposure: severity.optional().default('medium'),
  tags: z.array(z.string()).optional().default([]),
});

const sourceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  motivation: z.string().optional().default('unknown'),
  techniques: z.array(z.string()).optional().default([]),
  targets: z.array(assetKind).optional().default([]),
});

const threatModelBody = z.object({
  assets: z.array(assetSchema).min(1),
  sources: z.array(sourceSchema).min(1),
});

const controlSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  severity: severity.optional().default('medium'),
  state: z.string().optional().default('enabled'),
  metadata: z.record(z.string()).optional().default({}),
});

const snapshotSchema = z.object({
  snapshot_id: z.string().min(1),
  captured_at: z.string().min(1),
  controls: z.array(controlSchema),
});

const postureBody = z.object({ baseline: snapshotSchema, current: snapshotSchema });

const incidentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  severity,
  mitre_techniques: z.array(z.string()).optional().default([]),
  affected_assets: z.array(z.string()).optional().default([]),
  metadata: z.record(z.unknown()).optional().default({}),
});

const incidentBody = z.object({
  incident: incidentSchema,
  runbook_name: z.enum(['ransomware', 'credential-compromise', 'data-exfiltration']),
  approvals: z.record(z.boolean()).optional().default({}),
  yawar_url: allowedOutboundUrl.optional(),
  policy_runtime_url: allowedOutboundUrl.optional(),
  policy_fail_mode: z.enum(['closed', 'open']).optional(),
  policy_api_token: z.string().optional(),
});

const evidenceItemSchema = z.object({
  id: z.string().min(1),
  kind: z.string().min(1),
  description: z.string().optional().default(''),
  payload: z.string().optional(),
  payload_b64: z.string().optional(),
  collected_at: z.number().optional().default(0),
  metadata: z.record(z.unknown()).optional().default({}),
});

const evidenceBody = z.object({
  incident_id: z.string().min(1),
  items: z.array(evidenceItemSchema).min(1),
  signer_secret: z.string().optional(),
  topic: z.string().optional().default('sentra.evidence'),
  // Publishing the pack hash to the yawar topic is the default behaviour
  // per spec; the gate-keeper / dry-run paths must opt out explicitly.
  publish: z.boolean().optional().default(true),
  yawar_url: allowedOutboundUrl.optional(),
  pack_id: z.string().optional(),
  policy_runtime_url: allowedOutboundUrl.optional(),
  policy_fail_mode: z.enum(['closed', 'open']).optional(),
  policy_api_token: z.string().optional(),
});

const policyBody = z.object({
  runtime_url: allowedOutboundUrl,
  action: z.string().min(1),
  subject: z.record(z.unknown()),
  fail_mode: z.enum(['closed', 'open']).optional().default('closed'),
  api_token: z.string().optional(),
});

/**
 * Inject the deployment-wide a11oy-runtime URL (and a dev-only allow-open
 * escape hatch) into state-changing op payloads so the sentra-core sidecar
 * enforces PolicyGate.guard() by default. In production, if neither the
 * request body nor A11OY_RUNTIME_URL is configured, the sidecar refuses with
 * PolicyDeniedError — fail-closed by construction.
 */
/**
 * Inject the deployment-wide yawar publisher URL so evidence-pack and
 * incident-response calls publish to the configured topic by default
 * (per the task spec — publication is the default behaviour, opt-out
 * only). Caller-supplied `yawar_url` always wins so test harnesses can
 * point at a stub.
 */
function applyYawarDefaults<T extends Record<string, unknown>>(body: T): T {
  const envUrl = process.env.SENTRA_YAWAR_URL;
  if (!envUrl) return body;
  if (typeof body.yawar_url === 'string' && body.yawar_url.length > 0) return body;
  return { ...body, yawar_url: envUrl };
}

function applyPolicyDefaults<T extends Record<string, unknown>>(body: T): T {
  const out: Record<string, unknown> = { ...body };
  const envUrl = process.env.A11OY_RUNTIME_URL;
  if (!out.policy_runtime_url && envUrl) {
    out.policy_runtime_url = envUrl;
  }
  if (!out.policy_runtime_url && process.env.NODE_ENV !== 'production') {
    // Dev / preview: no a11oy-runtime is wired, so explicitly opt-out so the
    // sidecar runs without a real gate. Production never reaches this branch
    // — the sidecar refuses the op instead.
    out.policy_allow_open = true;
  }
  return out as T;
}

/**
 * Outside of production we let the sentra-core sidecar fall back to a
 * clearly-marked dev signing key when ``SENTRA_EVIDENCE_SECRET`` is unset
 * and the caller hasn't supplied their own ``signer_secret``. Production
 * never opts in — the sidecar then raises ``RuntimeError`` rather than
 * signing with a predictable key.
 */
function applyEvidenceSignerDefaults<T extends Record<string, unknown>>(body: T): T {
  const out: Record<string, unknown> = { ...body };
  const hasSecret = typeof out.signer_secret === 'string' && out.signer_secret.length > 0;
  if (!hasSecret && !process.env.SENTRA_EVIDENCE_SECRET && process.env.NODE_ENV !== 'production') {
    out.allow_dev_signer = true;
  }
  return out as T;
}

function handleSidecarError(res: Response, err: unknown, defaultMessage: string): void {
  if (err instanceof SentraCoreInvocationError) {
    res.status(502).json({
      ok: false,
      error: { code: err.code, message: err.message, op: err.op },
    });
    return;
  }
  handleRouteError(res, err, defaultMessage);
}

router.get('/sentra/core/health', async (_req: Request, res: Response) => {
  const status = await probeSentraCore();
  sendSuccess(res, { sidecar: status, dataState: status.ok ? 'live' : 'stub' });
});

router.post(
  '/sentra/core/threat-model',
  validateBody(threatModelBody),
  async (req: Request, res: Response) => {
    try {
      const result = await callSentraCore('threat_model.build', req.body);
      sendSuccess(res, result);
    } catch (err) {
      handleSidecarError(res, err, 'Failed to build threat model');
    }
  },
);

router.post(
  '/sentra/core/posture-drift',
  validateBody(postureBody),
  async (req: Request, res: Response) => {
    try {
      const result = await callSentraCore('posture_drift.compute', req.body);
      sendSuccess(res, result);
    } catch (err) {
      handleSidecarError(res, err, 'Failed to compute posture drift');
    }
  },
);

router.post(
  '/sentra/core/incident-response',
  validateBody(incidentBody),
  async (req: Request, res: Response) => {
    try {
      const result = await callSentraCore(
        'incident_response.run',
        applyYawarDefaults(applyPolicyDefaults(req.body)),
      );
      sendSuccess(res, result);
    } catch (err) {
      handleSidecarError(res, err, 'Failed to execute incident runbook');
    }
  },
);

router.post(
  '/sentra/core/evidence-pack',
  validateBody(evidenceBody),
  async (req: Request, res: Response) => {
    try {
      const result = await callSentraCore(
        'evidence_pack.build',
        applyEvidenceSignerDefaults(applyYawarDefaults(applyPolicyDefaults(req.body))),
      );
      sendSuccess(res, result);
    } catch (err) {
      handleSidecarError(res, err, 'Failed to build evidence pack');
    }
  },
);

router.post(
  '/sentra/core/policy-gate',
  validateBody(policyBody),
  async (req: Request, res: Response) => {
    try {
      const result = await callSentraCore('policy_gate.evaluate', req.body);
      sendSuccess(res, result);
    } catch (err) {
      handleSidecarError(res, err, 'Failed to evaluate policy');
    }
  },
);

export default router;
