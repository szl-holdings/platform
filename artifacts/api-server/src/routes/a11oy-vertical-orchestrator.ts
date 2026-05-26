/**
 * A11oy Vertical Orchestrator — domain pack lifecycle management.
 * Mounted at /api/a11oy/orchestrator. See docs/a11oy/VERTICAL_ORCHESTRATOR.md.
 */
import { randomUUID } from 'node:crypto';
import * as api from '@opentelemetry/api';
import { Router, type Request, type Response } from 'express';
import { pool } from '@szl-holdings/db';
import { adminGuard } from '../middlewares/admin-guard';
import { logger } from '../lib/logger';
import { sendError, sendForbidden } from '../lib/api-response';
import type { DomainPack, DomainPackLifecycle } from '@szl-holdings/domain-profiles';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrchestratorRequest extends Request {
  user?: { id?: number; roles?: string[]; orgs?: Array<{ orgId: number }> };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const router = Router();
const tracer = api.trace.getTracer('szl-a11oy-orchestrator', '1.0.0');
const PACK_WORKSPACE = 'ws-szl-orchestrator';

const IS_ENABLED = () =>
  process.env.A11OY_ORCHESTRATOR_ENABLED === 'true' ||
  (process.env.NODE_ENV !== 'production' &&
    process.env.APP_ENV !== 'production' &&
    process.env.A11OY_ORCHESTRATOR_ENABLED !== 'false');

// Evolve features (Task #5230): AI-Assisted Composer, Pack Library, Revisions+Rollback,
// Cross-Pack Capability Proposals, Live Readiness. Default off in prod, on in dev.
const IS_EVOLVE_ENABLED = () =>
  process.env.A11OY_ORCHESTRATOR_EVOLVE_ENABLED === 'true' ||
  (process.env.NODE_ENV !== 'production' &&
    process.env.APP_ENV !== 'production' &&
    process.env.A11OY_ORCHESTRATOR_EVOLVE_ENABLED !== 'false');

function evolveGuard(res: Response): boolean {
  if (!IS_EVOLVE_ENABLED()) {
    sendError(res, 'Orchestrator Evolve features are not enabled', 404, 'EVOLVE_DISABLED');
    return false;
  }
  return true;
}

const REQUIRED_FIELDS: (keyof DomainPack)[] = [
  'slug', 'name', 'description', 'industry', 'constitution', 'dataSources',
  'evaluators', 'approvalRules', 'selfOptimization', 'learningLoop',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function mutationGuard(res: Response): boolean {
  if (!IS_ENABLED()) {
    sendError(res, 'Vertical Orchestrator feature is not enabled', 404, 'FLAG_DISABLED');
    return false;
  }
  return true;
}

function getActor(req: OrchestratorRequest): string {
  return String(req.user?.id ?? 'anonymous');
}

function ok<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ ok: true, data });
}

function validatePack(body: Partial<DomainPack>): string[] {
  const errors: string[] = [];
  for (const f of REQUIRED_FIELDS) {
    if (body[f] == null) errors.push(`Missing required field: ${f}`);
  }
  if (body.slug && !/^[a-z0-9-]+$/.test(body.slug))
    errors.push('slug must be lowercase alphanumeric with hyphens only');
  if (body.constitution && Array.isArray(body.constitution) && body.constitution.length === 0)
    errors.push('constitution must reference at least one article');
  if (body.evaluators && Array.isArray(body.evaluators) && body.evaluators.length === 0)
    errors.push('evaluators must include at least one evaluator');
  return errors;
}

function rowToPackResponse(r: {
  slug: string; name: string; description: string; industry: string;
  ui_shell_template: string; lifecycle: string; activated_at: string | null;
  rejection_reason?: string | null; activation_decision_id?: string | null;
  created_at: string; updated_at: string; pack_json: DomainPack | null;
}) {
  return {
    ...(r.pack_json ?? {}),
    slug: r.slug, name: r.name, description: r.description, industry: r.industry,
    uiShellTemplate: r.ui_shell_template, lifecycle: r.lifecycle,
    activatedAt: r.activated_at,
    ...(r.rejection_reason != null ? { rejectionReason: r.rejection_reason } : {}),
    ...(r.activation_decision_id != null ? { activationDecisionId: r.activation_decision_id } : {}),
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

async function writeRevision(
  slug: string, lifecycle: DomainPackLifecycle,
  pack: DomainPack, actorId: string, note?: string,
): Promise<void> {
  await pool.query(
    `INSERT INTO domain_pack_revisions (slug, lifecycle, pack_json, actor_id, note)
     VALUES ($1, $2, $3, $4, $5)`,
    [slug, lifecycle, JSON.stringify(pack), actorId, note ?? null],
  ).catch(err => logger.error({ err, slug }, '[orchestrator] revision write failed'));
}

async function writeAuditEvent(
  slug: string, action: string, actorId: string,
  outcome: string, detail?: Record<string, unknown>,
): Promise<void> {
  await pool.query(
    `INSERT INTO domain_pack_audit_events (slug, action, actor_id, outcome, detail)
     VALUES ($1, $2, $3, $4, $5)`,
    [slug, action, actorId, outcome, detail ? JSON.stringify(detail) : null],
  ).catch(err => logger.error({ err, slug }, '[orchestrator] audit event write failed'));
}

async function fileApprovalRequest(
  slug: string, packName: string, industry: string, correlationId: string,
): Promise<number> {
  const r = await pool.query<{ id: number }>(
    `INSERT INTO approval_requests
       (resource_type, resource_id, title, description, action_class,
        priority, status, correlation_id, service_attribution)
     VALUES
       ('domain_pack', $1, $2, $3, 'domain_pack_activation',
        'high', 'pending', $4, 'a11oy-vertical-orchestrator')
     RETURNING id`,
    [slug,
     `Activate Domain Pack: ${packName}`,
     `Activation request for governed vertical "${packName}" (industry: ${industry}).`,
     correlationId],
  );
  const id = r.rows[0]?.id;
  if (!id) throw new Error('approval_requests INSERT returned no id');
  return id;
}

async function resolveApprovalRequest(
  slug: string, resolution: 'approved' | 'rejected',
): Promise<void> {
  const col = resolution === 'approved' ? 'approved_at' : 'rejected_at';
  await pool.query(
    `UPDATE approval_requests SET status = $2, ${col} = NOW(), updated_at = NOW()
     WHERE resource_type = 'domain_pack' AND resource_id = $1 AND status = 'pending'`,
    [slug, resolution],
  ).catch(err => logger.error({ err, slug }, '[orchestrator] approval resolve failed'));
}

// Creates a decisions_runtime card for pack activation — enables the approval
// to appear in and be resolved through the existing Decision Center UI.
async function createPackDecisionCard(
  slug: string, packName: string, correlationId: string,
): Promise<string> {
  const cardId = `pack-activation-${slug}-${Date.now()}`;
  await pool.query(
    `INSERT INTO decisions_runtime
       (card_id, workspace_id, domain, title, summary, severity,
        autonomy_mode, status, recommended_action, generated_at)
     VALUES ($1, $2, $3, $4, $5, 'high', 'execute-with-approval', 'pending_review', $6, NOW())
     ON CONFLICT (card_id) DO NOTHING`,
    [cardId, PACK_WORKSPACE, slug,
     `Activate Domain Pack: ${packName}`,
     `Governance activation request for "${packName}" — requires human approval before this pack governs any agent decisions.`,
     `Approve or reject activation of domain pack "${packName}". Correlation: ${correlationId}`],
  ).catch(err => logger.warn({ err, slug }, '[orchestrator] decisions_runtime card create skipped'));
  return cardId;
}

async function resolvePackDecisionCard(
  cardId: string, resolution: 'approved' | 'rejected', actorId: string, reason?: string,
): Promise<void> {
  await pool.query(
    `UPDATE decisions_runtime
     SET status = $2, reviewed_at = NOW(), reviewed_by = $3, review_note = $4, updated_at = NOW()
     WHERE card_id = $1`,
    [cardId, resolution, actorId, reason ?? null],
  ).catch(err => logger.warn({ err, cardId }, '[orchestrator] decisions_runtime resolve skipped'));
}

// ── GET /packs ────────────────────────────────────────────────────────────────

router.get('/packs', async (req: OrchestratorRequest, res: Response) => {
  const requestId = randomUUID();
  const actor = getActor(req);
  const span = tracer.startSpan('orchestrator.packs.list', {
    attributes: { 'orchestrator.action': 'list_packs', 'szl.request.id': requestId },
  });
  logger.info({ requestId, actor, action: 'list_packs' }, '[orchestrator] list packs');
  try {
    const result = await pool.query(
      `SELECT slug, name, description, industry, ui_shell_template, lifecycle,
              activated_at, created_at, updated_at, pack_json
       FROM domain_packs ORDER BY lifecycle = 'active' DESC, created_at DESC`,
    );
    const packs = result.rows.map(r => rowToPackResponse(r));
    span.setAttributes({ 'orchestrator.result.count': packs.length });
    span.setStatus({ code: api.SpanStatusCode.OK });
    logger.info({ requestId, actor, action: 'list_packs', outcome: 'success', count: packs.length }, '[orchestrator] list packs ok');
    ok(res, { packs, total: packs.length });
  } catch (err) {
    // 42P01 = undefined_table. The domain_packs migration (0163) may not be
    // applied yet in fresh environments; treat that as "registry empty" and
    // return 200 so the A11oy console can render its empty state instead of
    // a hard failure. Any other DB error is a real fault → 500.
    const pgCode = (err as { code?: string } | null)?.code;
    if (pgCode === '42P01') {
      span.setAttributes({ 'orchestrator.result.count': 0, 'orchestrator.registry.uninitialized': true });
      span.setStatus({ code: api.SpanStatusCode.OK });
      logger.warn({ requestId, actor, action: 'list_packs', outcome: 'uninitialized' }, '[orchestrator] domain_packs table missing — returning empty list');
      ok(res, { packs: [], total: 0 });
      return;
    }
    span.setStatus({ code: api.SpanStatusCode.ERROR, message: String(err) });
    span.recordException(err as Error);
    logger.error({ requestId, actor, action: 'list_packs', outcome: 'error', err }, '[orchestrator] list packs failed');
    sendError(res, 'Failed to list packs', 500, 'INTERNAL_ERROR');
  } finally { span.end(); }
});

// ── GET /packs/:slug ──────────────────────────────────────────────────────────

router.get('/packs/:slug', async (req: OrchestratorRequest, res: Response) => {
  const { slug } = req.params;
  const requestId = randomUUID();
  const actor = getActor(req);
  const span = tracer.startSpan('orchestrator.packs.get', {
    attributes: { 'orchestrator.slug': slug, 'orchestrator.action': 'get_pack', 'szl.request.id': requestId },
  });
  logger.info({ requestId, actor, slug, action: 'get_pack' }, '[orchestrator] get pack');
  try {
    const result = await pool.query(
      `SELECT slug, name, description, industry, ui_shell_template, lifecycle,
              activated_at, rejection_reason, activation_decision_id,
              created_at, updated_at, pack_json
       FROM domain_packs WHERE slug = $1`,
      [slug],
    );
    if (result.rows.length === 0) {
      span.setStatus({ code: api.SpanStatusCode.ERROR, message: 'PACK_NOT_FOUND' });
      logger.info({ requestId, actor, slug, action: 'get_pack', outcome: 'not_found' }, '[orchestrator] pack not found');
      sendError(res, `Pack not found: ${slug}`, 404, 'PACK_NOT_FOUND');
      return;
    }
    span.setAttributes({ 'orchestrator.result.lifecycle': result.rows[0].lifecycle });
    span.setStatus({ code: api.SpanStatusCode.OK });
    logger.info({ requestId, actor, slug, action: 'get_pack', outcome: 'success', lifecycle: result.rows[0].lifecycle }, '[orchestrator] get pack ok');
    ok(res, rowToPackResponse(result.rows[0]));
  } catch (err) {
    span.setStatus({ code: api.SpanStatusCode.ERROR, message: String(err) });
    span.recordException(err as Error);
    logger.error({ requestId, actor, slug, action: 'get_pack', outcome: 'error', err }, '[orchestrator] get pack failed');
    sendError(res, 'Failed to get pack', 500, 'INTERNAL_ERROR');
  } finally { span.end(); }
});

// ── GET /available-constitution-articles ──────────────────────────────────────
// Queries prompt-registry first; falls back to canonical static list.

router.get('/available-constitution-articles', async (req: OrchestratorRequest, res: Response) => {
  const requestId = randomUUID();
  const actor = getActor(req);
  const span = tracer.startSpan('orchestrator.available-constitution-articles', {
    attributes: { 'orchestrator.action': 'list_constitution_articles', 'szl.request.id': requestId },
  });
  logger.info({ requestId, actor, action: 'list_constitution_articles' }, '[orchestrator] list constitution articles');

  const CANONICAL = [
    { id: 'I',    title: 'Attribution is Non-Optional',          description: 'Every consequential action carries an unbroken attribution chain.',       version: 'v4.2.0' },
    { id: 'II',   title: 'Human Authority on Material Decisions', description: 'No agent executes a material decision without human approval.',             version: 'v4.2.0' },
    { id: 'III',  title: 'Bounded Capability',                   description: 'Every agent operates inside enforced capability compartments.',              version: 'v4.2.0' },
    { id: 'IV',   title: 'Truthful Self-Report',                 description: 'Agents report state, confidence, and provenance truthfully.',                version: 'v4.2.0' },
    { id: 'V',    title: 'Right to Audit',                       description: 'Customers and auditors hold standing audit access.',                         version: 'v4.2.0' },
    { id: 'VI',   title: 'Pre-Deployment Alignment Review',      description: 'No new agent class goes to production without passing the Review Gate.',     version: 'v4.2.0' },
    { id: 'VII',  title: 'Coordinated Disclosure',               description: 'Vulnerabilities are disclosed through the CAVD process.',                    version: 'v4.2.0' },
    { id: 'VIII', title: 'Mutability with a Public Trail',       description: 'This Constitution is versioned and every amendment is publicly recorded.',   version: 'v4.2.0' },
    { id: 'IX',   title: 'Adversarial Covenants',                description: 'The adversary swarm may only operate inside the sandboxed digital twin.',    version: 'v4.2.0' },
  ];

  try {
    const result = await pool.query<{ id: number; name: string; description: string | null; metadata: Record<string, unknown> | null }>(
      `SELECT id, name, description, metadata FROM prompts
       WHERE metadata->>'category' = 'constitution_article'
       ORDER BY metadata->>'article_id' ASC`,
    );
    if (result.rows.length > 0) {
      const articles = result.rows.map(r => ({
        id: (r.metadata?.article_id ?? String(r.id)) as string,
        title: r.name, description: r.description ?? '',
        promptId: r.id, version: (r.metadata?.version ?? 'v4.2.0') as string,
      }));
      span.setAttributes({ 'orchestrator.result.count': articles.length, 'orchestrator.result.source': 'prompt_registry' });
      span.setStatus({ code: api.SpanStatusCode.OK });
      logger.info({ requestId, actor, action: 'list_constitution_articles', outcome: 'success', count: articles.length, source: 'prompt_registry' }, '[orchestrator] constitution articles from registry');
      span.end();
      ok(res, { articles, source: 'prompt_registry' });
      return;
    }
  } catch { /* fallthrough */ }

  span.setAttributes({ 'orchestrator.result.count': CANONICAL.length, 'orchestrator.result.source': 'canonical_static' });
  span.setStatus({ code: api.SpanStatusCode.OK });
  logger.info({ requestId, actor, action: 'list_constitution_articles', outcome: 'success', count: CANONICAL.length, source: 'canonical_static' }, '[orchestrator] constitution articles (canonical fallback)');
  span.end();
  ok(res, { articles: CANONICAL, source: 'canonical_static' });
});

// ── GET /available-connectors ─────────────────────────────────────────────────
// connectorId = connectors.name so health KPI JOIN (c.name = ANY(...)) matches.

router.get('/available-connectors', async (req: OrchestratorRequest, res: Response) => {
  const requestId = randomUUID();
  const actor = getActor(req);
  const span = tracer.startSpan('orchestrator.available-connectors', {
    attributes: { 'orchestrator.action': 'list_available_connectors', 'szl.request.id': requestId },
  });
  logger.info({ requestId, actor, action: 'list_available_connectors' }, '[orchestrator] list available connectors');
  try {
    const result = await pool.query(
      `SELECT id, name, type, status, is_enabled FROM connectors
       WHERE is_enabled = true AND status = 'active' ORDER BY name ASC`,
    );
    const connectors = result.rows.map(r => ({
      connectorId: r.name, displayName: r.name, domain: r.type,
      riskLevel: 'medium' as const, isEnabled: r.is_enabled,
    }));
    span.setAttributes({ 'orchestrator.result.count': connectors.length });
    span.setStatus({ code: api.SpanStatusCode.OK });
    logger.info({ requestId, actor, action: 'list_available_connectors', outcome: 'success', count: connectors.length }, '[orchestrator] connectors ok');
    ok(res, { connectors });
  } catch (err) {
    span.recordException(err as Error);
    logger.warn({ requestId, actor, action: 'list_available_connectors', outcome: 'fallback', err }, '[orchestrator] connectors unavailable');
    ok(res, { connectors: [] });
  } finally { span.end(); }
});

// ── GET /available-evaluators ─────────────────────────────────────────────────

router.get('/available-evaluators', async (req: OrchestratorRequest, res: Response) => {
  const requestId = randomUUID();
  const actor = getActor(req);
  const span = tracer.startSpan('orchestrator.available-evaluators', {
    attributes: { 'orchestrator.action': 'list_available_evaluators', 'szl.request.id': requestId },
  });
  logger.info({ requestId, actor, action: 'list_available_evaluators' }, '[orchestrator] list available evaluators');
  const CANONICAL_EVALS = [
    { evaluatorId: 'mirroreval-standard', displayName: 'MirrorEval Standard', passThreshold: 0.85, dimensions: ['groundedness', 'evidence_coverage', 'hallucination_risk', 'policy_compliance', 'action_safety', 'approval_alignment'] },
    { evaluatorId: 'mirroreval-strict',   displayName: 'MirrorEval Strict',   passThreshold: 0.92, dimensions: ['groundedness', 'evidence_coverage', 'hallucination_risk', 'policy_compliance', 'action_safety', 'approval_alignment', 'proof_completeness', 'scope_adherence'] },
    { evaluatorId: 'mirroreval-legal',    displayName: 'MirrorEval Legal',    passThreshold: 0.90, dimensions: ['groundedness', 'policy_compliance', 'evidence_coverage', 'hallucination_risk', 'approval_alignment'] },
    { evaluatorId: 'mirroreval-defense',  displayName: 'MirrorEval Defense',  passThreshold: 0.95, dimensions: ['groundedness', 'action_safety', 'policy_compliance', 'scope_adherence', 'proof_completeness'] },
  ];
  try {
    const result = await pool.query(
      `SELECT DISTINCT recommendation_type AS evaluator_id, domain,
         AVG(eval_score::float)::numeric(6,4) AS avg_score,
         COUNT(*) FILTER (WHERE eval_passed = true)::int AS pass_count,
         COUNT(*)::int AS total_count
       FROM ai_traces WHERE eval_score IS NOT NULL
       GROUP BY recommendation_type, domain ORDER BY total_count DESC LIMIT 20`,
    );
    const liveEvals = result.rows.map(r => ({
      evaluatorId: `live-${r.evaluator_id}`, displayName: `Live — ${r.evaluator_id} (${r.domain})`,
      passThreshold: 0.85, dimensions: ['groundedness', 'policy_compliance'],
      liveStats: { avgScore: r.avg_score, passRate: r.total_count > 0 ? r.pass_count / r.total_count : null, totalTraces: r.total_count },
    }));
    const evaluators = [...CANONICAL_EVALS, ...liveEvals];
    span.setAttributes({ 'orchestrator.result.count': evaluators.length });
    span.setStatus({ code: api.SpanStatusCode.OK });
    logger.info({ requestId, actor, action: 'list_available_evaluators', outcome: 'success', count: evaluators.length }, '[orchestrator] evaluators ok');
    ok(res, { evaluators });
  } catch (err) {
    span.recordException(err as Error);
    logger.warn({ requestId, actor, action: 'list_available_evaluators', outcome: 'fallback', err }, '[orchestrator] evaluators fallback to canonical');
    ok(res, { evaluators: CANONICAL_EVALS });
  } finally { span.end(); }
});

// ── POST /packs — draft ───────────────────────────────────────────────────────

router.post('/packs', adminGuard, async (req: OrchestratorRequest, res: Response) => {
  if (!mutationGuard(res)) return;
  const body = req.body as Partial<DomainPack>;
  const requestId = randomUUID();
  const actor = getActor(req);
  const span = tracer.startSpan('orchestrator.packs.draft', {
    attributes: { 'orchestrator.slug': body.slug ?? 'unknown', 'orchestrator.action': 'draft_pack', 'szl.request.id': requestId },
  });
  logger.info({ requestId, actor, slug: body.slug, action: 'draft_pack' }, '[orchestrator] draft pack');

  const errors = validatePack(body);
  if (errors.length > 0) {
    span.setStatus({ code: api.SpanStatusCode.ERROR, message: 'PACK_VALIDATION_FAILED' });
    span.end();
    logger.info({ requestId, actor, slug: body.slug, action: 'draft_pack', outcome: 'validation_failed' }, '[orchestrator] draft validation failed');
    sendError(res, 'Pack validation failed', 400, 'PACK_VALIDATION_FAILED', { errors });
    return;
  }

  try {
    const existing = await pool.query('SELECT slug FROM domain_packs WHERE slug = $1', [body.slug]);
    if (existing.rows.length > 0) {
      span.setStatus({ code: api.SpanStatusCode.ERROR, message: 'PACK_ALREADY_EXISTS' });
      logger.info({ requestId, actor, slug: body.slug, action: 'draft_pack', outcome: 'conflict' }, '[orchestrator] slug conflict');
      sendError(res, `A pack with slug '${body.slug}' already exists`, 409, 'PACK_ALREADY_EXISTS');
      return;
    }
    const pack: DomainPack = {
      slug: body.slug!, name: body.name!, description: body.description ?? '',
      industry: body.industry ?? '', uiShellTemplate: body.uiShellTemplate ?? 'standard',
      constitution: body.constitution ?? [], dataSources: body.dataSources ?? [],
      evaluators: body.evaluators ?? [], approvalRules: body.approvalRules ?? [],
      selfOptimization: body.selfOptimization ?? { rewardSignals: [], lockedParameters: [] },
      learningLoop: body.learningLoop ?? { calibrationMetric: 'acceptance_rate', driftThresholdPct: 2.0, recalibrationTrigger: 'auto' },
      lifecycle: 'draft', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await pool.query(
      `INSERT INTO domain_packs (slug, name, description, industry, ui_shell_template, lifecycle, pack_json)
       VALUES ($1, $2, $3, $4, $5, 'draft', $6)`,
      [pack.slug, pack.name, pack.description, pack.industry, pack.uiShellTemplate, JSON.stringify(pack)],
    );
    await writeRevision(pack.slug, 'draft', pack, actor, 'Initial draft');
    await writeAuditEvent(pack.slug, 'drafted', actor, 'success', { requestId });
    span.setStatus({ code: api.SpanStatusCode.OK });
    logger.info({ requestId, actor, slug: pack.slug, action: 'draft_pack', outcome: 'success' }, '[orchestrator] pack drafted');
    res.status(201).json({ ok: true, data: pack });
  } catch (err) {
    span.setStatus({ code: api.SpanStatusCode.ERROR, message: String(err) });
    span.recordException(err as Error);
    logger.error({ requestId, actor, slug: body.slug, action: 'draft_pack', outcome: 'error', err }, '[orchestrator] draft failed');
    sendError(res, 'Failed to create pack draft', 500, 'INTERNAL_ERROR');
  } finally { span.end(); }
});

// ── POST /packs/:slug/validate ────────────────────────────────────────────────

router.post('/packs/:slug/validate', adminGuard, async (req: OrchestratorRequest, res: Response) => {
  if (!mutationGuard(res)) return;
  const { slug } = req.params;
  const requestId = randomUUID();
  const actor = getActor(req);
  const span = tracer.startSpan('orchestrator.packs.validate', {
    attributes: { 'orchestrator.slug': slug, 'orchestrator.action': 'validate_pack', 'szl.request.id': requestId },
  });
  logger.info({ requestId, actor, slug, action: 'validate_pack' }, '[orchestrator] validate pack');
  try {
    const result = await pool.query('SELECT pack_json, lifecycle FROM domain_packs WHERE slug = $1', [slug]);
    if (result.rows.length === 0) {
      span.setStatus({ code: api.SpanStatusCode.ERROR, message: 'PACK_NOT_FOUND' });
      sendError(res, `Pack not found: ${slug}`, 404, 'PACK_NOT_FOUND');
      return;
    }
    const errors = validatePack(result.rows[0].pack_json as DomainPack);
    const passed = errors.length === 0;
    await writeAuditEvent(slug, 'validated', actor, passed ? 'pass' : 'fail', { errors, requestId });
    span.setAttributes({ 'orchestrator.validation.passed': passed });
    span.setStatus({ code: api.SpanStatusCode.OK });
    logger.info({ requestId, actor, slug, action: 'validate_pack', outcome: passed ? 'pass' : 'fail' }, '[orchestrator] validate ok');
    ok(res, { slug, passed, errors, checkedAt: new Date().toISOString() });
  } catch (err) {
    span.setStatus({ code: api.SpanStatusCode.ERROR, message: String(err) });
    span.recordException(err as Error);
    logger.error({ requestId, actor, slug, action: 'validate_pack', outcome: 'error', err }, '[orchestrator] validate failed');
    sendError(res, 'Failed to validate pack', 500, 'INTERNAL_ERROR');
  } finally { span.end(); }
});

// ── POST /packs/:slug/request-activation ─────────────────────────────────────
// Files into approval_requests (FAILS HARD if INSERT fails) and creates a
// decisions_runtime card so activation appears in the Decision Center.

router.post('/packs/:slug/request-activation', adminGuard, async (req: OrchestratorRequest, res: Response) => {
  if (!mutationGuard(res)) return;
  const { slug } = req.params;
  const requestId = randomUUID();
  const actor = getActor(req);
  const span = tracer.startSpan('orchestrator.packs.request-activation', {
    attributes: { 'orchestrator.slug': slug, 'orchestrator.action': 'request_activation', 'szl.request.id': requestId },
  });
  logger.info({ requestId, actor, slug, action: 'request_activation' }, '[orchestrator] request activation');
  try {
    const result = await pool.query(
      'SELECT pack_json, lifecycle, name, industry FROM domain_packs WHERE slug = $1', [slug],
    );
    if (result.rows.length === 0) {
      span.setStatus({ code: api.SpanStatusCode.ERROR, message: 'PACK_NOT_FOUND' });
      sendError(res, `Pack not found: ${slug}`, 404, 'PACK_NOT_FOUND');
      return;
    }
    const { lifecycle, pack_json: pack, name, industry } = result.rows[0];
    if (lifecycle === 'active') {
      span.setStatus({ code: api.SpanStatusCode.ERROR, message: 'PACK_ALREADY_ACTIVE' });
      logger.info({ requestId, actor, slug, action: 'request_activation', outcome: 'already_active' }, '[orchestrator] already active');
      sendError(res, `Pack '${slug}' is already active`, 409, 'PACK_ALREADY_ACTIVE');
      return;
    }
    if (lifecycle === 'pending_activation') {
      span.setStatus({ code: api.SpanStatusCode.ERROR, message: 'PACK_ALREADY_PENDING' });
      logger.info({ requestId, actor, slug, action: 'request_activation', outcome: 'already_pending' }, '[orchestrator] already pending');
      sendError(res, `Pack '${slug}' already has a pending activation request`, 409, 'PACK_ALREADY_PENDING');
      return;
    }
    if (lifecycle === 'rejected') {
      span.setStatus({ code: api.SpanStatusCode.ERROR, message: 'ACTIVATION_REJECTED' });
      logger.info({ requestId, actor, slug, action: 'request_activation', outcome: 'previously_rejected' }, '[orchestrator] pack was rejected');
      sendError(res, `Pack '${slug}' was previously rejected — delete and re-draft to start a new activation flow`, 409, 'ACTIVATION_REJECTED');
      return;
    }
    const validationErrors = validatePack(pack as DomainPack);
    if (validationErrors.length > 0) {
      span.setStatus({ code: api.SpanStatusCode.ERROR, message: 'PACK_VALIDATION_FAILED' });
      sendError(res, 'Pack validation failed — fix errors before requesting activation', 400, 'PACK_VALIDATION_FAILED', { errors: validationErrors });
      return;
    }

    const correlationId = `orch-activation-${slug}-${Date.now()}`;
    let approvalId: number;
    try {
      approvalId = await fileApprovalRequest(slug, name as string, industry as string, correlationId);
    } catch (approvalErr) {
      logger.error({ requestId, actor, slug, outcome: 'approval_queue_failed', err: approvalErr }, '[orchestrator] approval INSERT failed');
      await writeAuditEvent(slug, 'activation_requested', actor, 'fail', { reason: 'approval_queue_insert_failed', requestId });
      span.setStatus({ code: api.SpanStatusCode.ERROR, message: 'APPROVAL_QUEUE_FAILED' });
      span.recordException(approvalErr as Error);
      sendError(res, 'Failed to file activation request in Approval Queue — pack remains in draft', 503, 'APPROVAL_QUEUE_FAILED');
      return;
    }

    // Also create a decision card in decisions_runtime so approval appears in Decision Center
    const cardId = await createPackDecisionCard(slug, name as string, correlationId);

    const updatedPack: DomainPack = { ...(pack as DomainPack), lifecycle: 'pending_activation' };
    await pool.query(
      `UPDATE domain_packs SET lifecycle = 'pending_activation', activation_decision_id = $2,
       pack_json = $3, updated_at = NOW() WHERE slug = $1`,
      [slug, correlationId, JSON.stringify(updatedPack)],
    );
    await writeRevision(slug, 'pending_activation', updatedPack, actor, 'Activation requested');
    await writeAuditEvent(slug, 'activation_requested', actor, 'success', { correlationId, approvalRequestId: approvalId, decisionCardId: cardId, requestId });

    span.setAttributes({ 'orchestrator.approval.id': approvalId });
    span.setStatus({ code: api.SpanStatusCode.OK });
    logger.info({ requestId, actor, slug, action: 'request_activation', outcome: 'success', correlationId, approvalId }, '[orchestrator] activation filed');
    ok(res, {
      slug, lifecycle: 'pending_activation', correlationId,
      approvalRequestId: approvalId, decisionCardId: cardId,
      approvalQueuePath: `/api/a11oy/orchestrator/packs/${slug}/activate`,
      requestedAt: new Date().toISOString(),
    });
  } catch (err) {
    span.setStatus({ code: api.SpanStatusCode.ERROR, message: String(err) });
    span.recordException(err as Error);
    logger.error({ requestId, actor, slug, action: 'request_activation', outcome: 'error', err }, '[orchestrator] request activation failed');
    sendError(res, 'Failed to request activation', 500, 'INTERNAL_ERROR');
  } finally { span.end(); }
});

// ── POST /packs/:slug/activate — human approval gate ─────────────────────────
// Resolves the approval_requests row and the decisions_runtime card.

router.post('/packs/:slug/activate', adminGuard, async (req: OrchestratorRequest, res: Response) => {
  if (!mutationGuard(res)) return;
  const { slug } = req.params;
  const requestId = randomUUID();
  const actor = getActor(req);
  const span = tracer.startSpan('orchestrator.packs.activate', {
    attributes: { 'orchestrator.slug': slug, 'orchestrator.action': 'activate', 'szl.request.id': requestId },
  });
  logger.info({ requestId, actor, slug, action: 'activate' }, '[orchestrator] activate pack');
  try {
    const result = await pool.query(
      'SELECT pack_json, lifecycle, activation_decision_id FROM domain_packs WHERE slug = $1', [slug],
    );
    if (result.rows.length === 0) {
      span.setStatus({ code: api.SpanStatusCode.ERROR, message: 'PACK_NOT_FOUND' });
      sendError(res, `Pack not found: ${slug}`, 404, 'PACK_NOT_FOUND');
      return;
    }
    const { lifecycle, pack_json: pack, activation_decision_id: correlationId } = result.rows[0];
    if (lifecycle === 'active') {
      span.setStatus({ code: api.SpanStatusCode.ERROR, message: 'PACK_ALREADY_ACTIVE' });
      logger.info({ requestId, actor, slug, action: 'activate', outcome: 'already_active' }, '[orchestrator] already active');
      sendError(res, `Pack '${slug}' is already active`, 409, 'PACK_ALREADY_ACTIVE');
      return;
    }
    if (lifecycle === 'rejected') {
      span.setStatus({ code: api.SpanStatusCode.ERROR, message: 'ACTIVATION_REJECTED' });
      logger.info({ requestId, actor, slug, action: 'activate', outcome: 'rejected' }, '[orchestrator] pack is rejected');
      sendError(res, `Pack '${slug}' was rejected — cannot activate a rejected pack`, 409, 'ACTIVATION_REJECTED');
      return;
    }
    if (lifecycle !== 'pending_activation') {
      span.setStatus({ code: api.SpanStatusCode.ERROR, message: 'PACK_INVALID_STATE' });
      logger.info({ requestId, actor, slug, action: 'activate', outcome: 'invalid_state', lifecycle }, '[orchestrator] invalid state');
      sendError(res, `Pack '${slug}' must be in pending_activation state (current: ${lifecycle})`, 400, 'PACK_INVALID_STATE');
      return;
    }
    const activatedAt = new Date().toISOString();
    const updatedPack: DomainPack = { ...(pack as DomainPack), lifecycle: 'active', activatedAt };
    await pool.query(
      `UPDATE domain_packs SET lifecycle = 'active', activated_at = NOW(), updated_at = NOW(), pack_json = $2
       WHERE slug = $1`,
      [slug, JSON.stringify(updatedPack)],
    );
    // Resolve via existing approval and decision-card machinery
    await resolveApprovalRequest(slug, 'approved');
    if (correlationId) {
      const cardId = `pack-activation-${slug}-`;
      const cardResult = await pool.query<{ card_id: string }>(
        `SELECT card_id FROM decisions_runtime WHERE card_id LIKE $1 AND workspace_id = $2 LIMIT 1`,
        [`${cardId}%`, PACK_WORKSPACE],
      ).catch(() => ({ rows: [] }));
      if (cardResult.rows[0]?.card_id) {
        await resolvePackDecisionCard(cardResult.rows[0].card_id, 'approved', actor, (req.body as { note?: string })?.note);
      }
    }
    await writeRevision(slug, 'active', updatedPack, actor, 'Approved by operator');
    await writeAuditEvent(slug, 'activated', actor, 'success', { requestId });
    span.setStatus({ code: api.SpanStatusCode.OK });
    logger.info({ requestId, actor, slug, action: 'activate', outcome: 'success' }, '[orchestrator] pack activated');
    ok(res, { slug, lifecycle: 'active', activatedAt });
  } catch (err) {
    span.setStatus({ code: api.SpanStatusCode.ERROR, message: String(err) });
    span.recordException(err as Error);
    logger.error({ requestId, actor, slug, action: 'activate', outcome: 'error', err }, '[orchestrator] activate failed');
    sendError(res, 'Failed to activate pack', 500, 'INTERNAL_ERROR');
  } finally { span.end(); }
});

// ── POST /packs/:slug/reject ──────────────────────────────────────────────────

router.post('/packs/:slug/reject', adminGuard, async (req: OrchestratorRequest, res: Response) => {
  if (!mutationGuard(res)) return;
  const { slug } = req.params;
  const { reason } = req.body as { reason?: string };
  const requestId = randomUUID();
  const actor = getActor(req);
  const span = tracer.startSpan('orchestrator.packs.reject', {
    attributes: { 'orchestrator.slug': slug, 'orchestrator.action': 'reject', 'szl.request.id': requestId },
  });
  logger.info({ requestId, actor, slug, action: 'reject', reason }, '[orchestrator] reject pack');
  try {
    const result = await pool.query('SELECT lifecycle, pack_json FROM domain_packs WHERE slug = $1', [slug]);
    if (result.rows.length === 0) {
      span.setStatus({ code: api.SpanStatusCode.ERROR, message: 'PACK_NOT_FOUND' });
      sendError(res, `Pack not found: ${slug}`, 404, 'PACK_NOT_FOUND');
      return;
    }
    const { lifecycle, pack_json: pack } = result.rows[0];
    if (lifecycle !== 'pending_activation') {
      span.setStatus({ code: api.SpanStatusCode.ERROR, message: 'PACK_INVALID_STATE' });
      logger.info({ requestId, actor, slug, action: 'reject', outcome: 'invalid_state', lifecycle }, '[orchestrator] invalid state for reject');
      sendError(res, `Pack '${slug}' must be in pending_activation state to reject (current: ${lifecycle})`, 400, 'PACK_INVALID_STATE');
      return;
    }
    const rejectionReason = reason ?? 'No reason provided';
    const updatedPack: DomainPack = { ...(pack as DomainPack), lifecycle: 'rejected' };
    await pool.query(
      `UPDATE domain_packs SET lifecycle = 'rejected', rejection_reason = $2, pack_json = $3, updated_at = NOW()
       WHERE slug = $1`,
      [slug, rejectionReason, JSON.stringify(updatedPack)],
    );
    // Resolve via existing approval and decision-card machinery
    await resolveApprovalRequest(slug, 'rejected');
    const cardResult = await pool.query<{ card_id: string }>(
      `SELECT card_id FROM decisions_runtime WHERE card_id LIKE $1 AND workspace_id = $2 LIMIT 1`,
      [`pack-activation-${slug}-%`, PACK_WORKSPACE],
    ).catch(() => ({ rows: [] }));
    if (cardResult.rows[0]?.card_id) {
      await resolvePackDecisionCard(cardResult.rows[0].card_id, 'rejected', actor, rejectionReason);
    }
    await writeRevision(slug, 'rejected', updatedPack, actor, `Rejected: ${rejectionReason}`);
    await writeAuditEvent(slug, 'rejected', actor, 'success', { reason: rejectionReason, requestId });
    span.setStatus({ code: api.SpanStatusCode.OK });
    logger.info({ requestId, actor, slug, action: 'reject', outcome: 'success', reason: rejectionReason }, '[orchestrator] pack rejected');
    ok(res, { slug, lifecycle: 'rejected', reason: rejectionReason });
  } catch (err) {
    span.setStatus({ code: api.SpanStatusCode.ERROR, message: String(err) });
    span.recordException(err as Error);
    logger.error({ requestId, actor, slug, action: 'reject', outcome: 'error', err }, '[orchestrator] reject failed');
    sendError(res, 'Failed to reject pack', 500, 'INTERNAL_ERROR');
  } finally { span.end(); }
});

// ── DELETE /packs/:slug ───────────────────────────────────────────────────────

router.delete('/packs/:slug', adminGuard, async (req: OrchestratorRequest, res: Response) => {
  if (!mutationGuard(res)) return;
  const { slug } = req.params;
  const requestId = randomUUID();
  const actor = getActor(req);
  const span = tracer.startSpan('orchestrator.packs.delete', {
    attributes: { 'orchestrator.slug': slug, 'orchestrator.action': 'delete', 'szl.request.id': requestId },
  });
  logger.info({ requestId, actor, slug, action: 'delete' }, '[orchestrator] delete pack');
  try {
    const result = await pool.query('SELECT lifecycle FROM domain_packs WHERE slug = $1', [slug]);
    if (result.rows.length === 0) {
      span.setStatus({ code: api.SpanStatusCode.ERROR, message: 'PACK_NOT_FOUND' });
      sendError(res, `Pack not found: ${slug}`, 404, 'PACK_NOT_FOUND');
      return;
    }
    const { lifecycle } = result.rows[0];
    if (lifecycle === 'active') {
      span.setStatus({ code: api.SpanStatusCode.ERROR, message: 'FORBIDDEN' });
      logger.info({ requestId, actor, slug, action: 'delete', outcome: 'forbidden' }, '[orchestrator] active pack cannot be deleted');
      sendForbidden(res, 'Active packs cannot be deleted — archive them first');
      return;
    }
    await pool.query('DELETE FROM domain_packs WHERE slug = $1', [slug]);
    await pool.query(
      `UPDATE approval_requests SET status = 'withdrawn', updated_at = NOW()
       WHERE resource_type = 'domain_pack' AND resource_id = $1 AND status = 'pending'`,
      [slug],
    );
    await writeAuditEvent(slug, 'deleted', actor, 'success', { requestId, previousLifecycle: lifecycle });
    span.setStatus({ code: api.SpanStatusCode.OK });
    logger.info({ requestId, actor, slug, action: 'delete', outcome: 'success', previousLifecycle: lifecycle }, '[orchestrator] pack deleted');
    res.status(204).send();
  } catch (err) {
    span.setStatus({ code: api.SpanStatusCode.ERROR, message: String(err) });
    span.recordException(err as Error);
    logger.error({ requestId, actor, slug, action: 'delete', outcome: 'error', err }, '[orchestrator] delete failed');
    sendError(res, 'Failed to delete pack', 500, 'INTERNAL_ERROR');
  } finally { span.end(); }
});

// ── GET /packs/:slug/health ───────────────────────────────────────────────────
// Per-pack KPIs. decisions24h counts from decisions_runtime (governed decisions),
// not audit events. Other KPIs scoped to pack slug/domain.

router.get('/packs/:slug/health', async (req: OrchestratorRequest, res: Response) => {
  const { slug } = req.params;
  const requestId = randomUUID();
  const actor = getActor(req);
  const span = tracer.startSpan('orchestrator.packs.health', {
    attributes: { 'orchestrator.slug': slug, 'orchestrator.action': 'health_kpis', 'szl.request.id': requestId },
  });
  logger.info({ requestId, actor, slug, action: 'health_kpis' }, '[orchestrator] pack health');
  try {
    const packResult = await pool.query('SELECT lifecycle, pack_json FROM domain_packs WHERE slug = $1', [slug]);
    if (packResult.rows.length === 0) {
      span.setStatus({ code: api.SpanStatusCode.ERROR, message: 'PACK_NOT_FOUND' });
      sendError(res, `Pack not found: ${slug}`, 404, 'PACK_NOT_FOUND');
      return;
    }
    const packJson = packResult.rows[0].pack_json as DomainPack;
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const since7d  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000).toISOString();
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const packConnectorIds: string[] = (packJson?.dataSources ?? [])
      .map((ds: { connectorId?: string }) => ds.connectorId).filter(Boolean) as string[];

    const [decisionsRes, evalRes, ttrRes, firewallRes, proofRes, tuneRes] = await Promise.all([
      // decisions24h — governed decision activity from decisions_runtime
      pool.query<{ cnt: number }>(
        `SELECT COUNT(*)::int AS cnt FROM decisions_runtime
         WHERE domain = $1 AND generated_at > $2`,
        [slug, since24h],
      ).catch(() => ({ rows: [{ cnt: 0 }] })),

      pool.query<{ passed: number; total: number }>(
        `SELECT COUNT(*) FILTER (WHERE eval_passed = true)::int AS passed,
                COUNT(*)::int AS total
         FROM ai_traces WHERE domain = $1 AND captured_at > $2`,
        [slug, since7d],
      ).catch(() => ({ rows: [{ passed: 0, total: 0 }] })),

      pool.query<{ median_ttr_ms: number | null }>(
        `SELECT AVG(EXTRACT(EPOCH FROM (COALESCE(approved_at, rejected_at) - created_at)) * 1000)::bigint AS median_ttr_ms
         FROM approval_requests
         WHERE resource_type = 'domain_pack' AND resource_id = $1 AND status IN ('approved', 'rejected')`,
        [slug],
      ).catch(() => ({ rows: [{ median_ttr_ms: null }] })),

      packConnectorIds.length > 0
        ? pool.query<{ cnt: number }>(
            `SELECT COUNT(cl.*)::int AS cnt
             FROM connector_logs cl JOIN connectors c ON cl.connector_id = c.id
             WHERE cl.level = 'error' AND cl.created_at > $1 AND c.name = ANY($2::text[])`,
            [since24h, packConnectorIds],
          ).catch(() => ({ rows: [{ cnt: 0 }] }))
        : Promise.resolve({ rows: [{ cnt: 0 }] }),

      pool.query<{ flagged: number; total: number }>(
        `SELECT COUNT(*) FILTER (WHERE review_state IN ('flagged','retracted'))::int AS flagged,
                COUNT(*)::int AS total
         FROM proof_chain WHERE id IN (
           SELECT proof_chain_id FROM ai_traces
           WHERE domain = $1 AND proof_chain_id IS NOT NULL AND captured_at > $2)`,
        [slug, since30d],
      ).catch(() => ({ rows: [{ flagged: 0, total: 0 }] })),

      pool.query<{ tuned_at: string | null }>(
        `SELECT MAX(created_at)::text AS tuned_at FROM domain_pack_audit_events
         WHERE slug = $1 AND action = 'self_optimization_tuned'`,
        [slug],
      ).catch(() => ({ rows: [{ tuned_at: null }] })),
    ]);

    const evalRow = evalRes.rows[0];
    const mirrorEvalPassRate = evalRow?.total > 0
      ? Math.round((evalRow.passed / evalRow.total) * 1000) / 10 : null;
    const proofRow = proofRes.rows[0];
    const proofLedgerIntegrity =
      !proofRow || proofRow.total === 0 ? 'no_data' :
      proofRow.flagged === 0 ? 'clean' :
      proofRow.flagged / proofRow.total < 0.02 ? 'minor_flags' : 'review_required';

    span.setAttributes({
      'orchestrator.health.lifecycle': packResult.rows[0].lifecycle,
      'orchestrator.health.decisions24h': decisionsRes.rows[0]?.cnt ?? 0,
      'orchestrator.health.proof_integrity': proofLedgerIntegrity,
    });
    span.setStatus({ code: api.SpanStatusCode.OK });
    logger.info({ requestId, actor, slug, action: 'health_kpis', outcome: 'success', lifecycle: packResult.rows[0].lifecycle }, '[orchestrator] health ok');
    ok(res, {
      slug, lifecycle: packResult.rows[0].lifecycle,
      decisions24h: decisionsRes.rows[0]?.cnt ?? 0,
      mirrorEvalPassRate, mirrorEvalSampleSize: evalRow?.total ?? 0,
      approvalQueueMedianTtrMs: ttrRes.rows[0]?.median_ttr_ms ?? null,
      connectorFirewallBlocks24h: firewallRes.rows[0]?.cnt ?? 0,
      proofLedgerIntegrity, proofLedgerFlaggedCount: proofRow?.flagged ?? 0,
      selfOptimizationLastTuneAt: tuneRes.rows[0]?.tuned_at ?? null,
      dataAsOf: new Date().toISOString(),
    });
  } catch (err) {
    span.setStatus({ code: api.SpanStatusCode.ERROR, message: String(err) });
    span.recordException(err as Error);
    logger.error({ requestId, actor, slug, action: 'health_kpis', outcome: 'error', err }, '[orchestrator] health failed');
    sendError(res, 'Failed to get pack health', 500, 'INTERNAL_ERROR');
  } finally { span.end(); }
});

// ── GET /packs/:slug/audit ────────────────────────────────────────────────────

router.get('/packs/:slug/audit', async (req: OrchestratorRequest, res: Response) => {
  const { slug } = req.params;
  const requestId = randomUUID();
  const actor = getActor(req);
  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const span = tracer.startSpan('orchestrator.packs.audit', {
    attributes: { 'orchestrator.slug': slug, 'orchestrator.action': 'audit_trail', 'szl.request.id': requestId },
  });
  logger.info({ requestId, actor, slug, action: 'audit_trail', limit }, '[orchestrator] audit trail');
  try {
    const result = await pool.query(
      `SELECT id, slug, action, actor_id, outcome, detail, created_at
       FROM domain_pack_audit_events WHERE slug = $1
       ORDER BY created_at DESC LIMIT $2`,
      [slug, limit],
    );
    span.setAttributes({ 'orchestrator.result.count': result.rows.length });
    span.setStatus({ code: api.SpanStatusCode.OK });
    logger.info({ requestId, actor, slug, action: 'audit_trail', outcome: 'success', count: result.rows.length }, '[orchestrator] audit ok');
    ok(res, { events: result.rows, total: result.rows.length });
  } catch (err) {
    span.setStatus({ code: api.SpanStatusCode.ERROR, message: String(err) });
    span.recordException(err as Error);
    logger.error({ requestId, actor, slug, action: 'audit_trail', outcome: 'error', err }, '[orchestrator] audit failed');
    sendError(res, 'Failed to get audit trail', 500, 'INTERNAL_ERROR');
  } finally { span.end(); }
});

// ── GET /status — readiness probe ─────────────────────────────────────────────

router.get('/status', async (req: OrchestratorRequest, res: Response) => {
  const requestId = randomUUID();
  const actor = getActor(req);
  const span = tracer.startSpan('orchestrator.status', {
    attributes: { 'orchestrator.action': 'status_probe', 'szl.request.id': requestId },
  });
  logger.info({ requestId, actor, action: 'status_probe' }, '[orchestrator] status probe');
  try {
    // Probe whether the registry table exists before SELECTing from it. If
    // migration 0163 hasn't been applied yet we still want to return a 200
    // (with ready:false / migrationsApplied:false) so the A11oy console can
    // render an honest "registry not yet seeded" state rather than treating
    // a healthy-but-uninitialized server as a hard 503 outage.
    const tableCheck = await pool.query<{ exists: boolean }>(
      `SELECT to_regclass('public.domain_packs') IS NOT NULL AS exists`,
    );
    const registryQueryable = tableCheck.rows[0]?.exists === true;

    if (!registryQueryable) {
      const payload = {
        ready: false, featureEnabled: IS_ENABLED(), evolveEnabled: IS_EVOLVE_ENABLED(),
        migrationsApplied: false, registryQueryable: false,
        activePacks: 0, draftPacks: 0, pendingPacks: 0, approvalQueuePending: 0,
      };
      span.setAttributes({ 'orchestrator.registry.uninitialized': true });
      span.setStatus({ code: api.SpanStatusCode.OK });
      logger.warn({ requestId, actor, action: 'status_probe', outcome: 'uninitialized' }, '[orchestrator] domain_packs table missing — registry uninitialized');
      ok(res, payload);
      return;
    }

    const [countsRes, queueRes] = await Promise.all([
      pool.query<{ active_packs: number; draft_packs: number; pending_packs: number }>(
        `SELECT COUNT(*) FILTER (WHERE lifecycle = 'active')::int AS active_packs,
                COUNT(*) FILTER (WHERE lifecycle = 'draft')::int AS draft_packs,
                COUNT(*) FILTER (WHERE lifecycle = 'pending_activation')::int AS pending_packs
         FROM domain_packs`,
      ),
      pool.query<{ cnt: number }>(
        `SELECT COUNT(*)::int AS cnt FROM approval_requests
         WHERE resource_type = 'domain_pack' AND status = 'pending'`,
      ).catch(() => ({ rows: [{ cnt: 0 }] })),
    ]);
    const row = countsRes.rows[0];
    const payload = {
      ready: true, featureEnabled: IS_ENABLED(), evolveEnabled: IS_EVOLVE_ENABLED(),
      migrationsApplied: true, registryQueryable: true,
      activePacks: row?.active_packs ?? 0, draftPacks: row?.draft_packs ?? 0,
      pendingPacks: row?.pending_packs ?? 0, approvalQueuePending: queueRes.rows[0]?.cnt ?? 0,
    };
    span.setAttributes({ 'orchestrator.active_packs': payload.activePacks });
    span.setStatus({ code: api.SpanStatusCode.OK });
    logger.info({ requestId, actor, action: 'status_probe', outcome: 'success', ...payload }, '[orchestrator] status ok');
    ok(res, payload);
  } catch (err) {
    span.setStatus({ code: api.SpanStatusCode.ERROR, message: String(err) });
    span.recordException(err as Error);
    logger.error({ requestId, actor, action: 'status_probe', outcome: 'error', err }, '[orchestrator] status failed');
    sendError(res, 'Orchestrator not ready — registry not queryable', 503, 'NOT_READY');
  } finally { span.end(); }
});

// ═══════════════════════════════════════════════════════════════════════════
// EVOLVE FEATURES (Task #5230) — gated by A11OY_ORCHESTRATOR_EVOLVE_ENABLED
// ═══════════════════════════════════════════════════════════════════════════

// ── GET /templates ────────────────────────────────────────────────────────────
// Public read of the pack-library blueprints. Returns empty list if the table
// hasn't been migrated yet (honest empty state — no fake fallbacks).

router.get('/templates', async (req: OrchestratorRequest, res: Response) => {
  const requestId = randomUUID();
  const actor = getActor(req);
  const span = tracer.startSpan('orchestrator.templates.list', {
    attributes: { 'orchestrator.action': 'list_templates', 'szl.request.id': requestId },
  });
  try {
    const result = await pool.query(
      `SELECT slug, name, description, industry, origin, tags, created_at, updated_at
       FROM domain_pack_templates ORDER BY name ASC`,
    );
    span.setAttributes({ 'orchestrator.result.count': result.rows.length });
    span.setStatus({ code: api.SpanStatusCode.OK });
    logger.info({ requestId, actor, action: 'list_templates', outcome: 'success', count: result.rows.length }, '[orchestrator] templates list ok');
    ok(res, { templates: result.rows, total: result.rows.length });
  } catch (err) {
    logger.warn({ requestId, actor, action: 'list_templates', outcome: 'unavailable', err }, '[orchestrator] templates table unavailable');
    ok(res, { templates: [], total: 0, note: 'Template library not initialized — run migration 0166_domain_pack_templates.sql' });
  } finally { span.end(); }
});

// ── GET /templates/:templateSlug ─────────────────────────────────────────────

router.get('/templates/:templateSlug', async (req: OrchestratorRequest, res: Response) => {
  const { templateSlug } = req.params;
  const requestId = randomUUID();
  const actor = getActor(req);
  const span = tracer.startSpan('orchestrator.templates.get', {
    attributes: { 'orchestrator.template.slug': templateSlug, 'szl.request.id': requestId },
  });
  try {
    const result = await pool.query(
      `SELECT slug, name, description, industry, origin, tags, template_json, created_at, updated_at
       FROM domain_pack_templates WHERE slug = $1`, [templateSlug],
    );
    if (result.rows.length === 0) {
      sendError(res, `Template not found: ${templateSlug}`, 404, 'TEMPLATE_NOT_FOUND');
      return;
    }
    span.setStatus({ code: api.SpanStatusCode.OK });
    logger.info({ requestId, actor, templateSlug, action: 'get_template', outcome: 'success' }, '[orchestrator] template get ok');
    ok(res, result.rows[0]);
  } catch (err) {
    span.setStatus({ code: api.SpanStatusCode.ERROR, message: String(err) });
    span.recordException(err as Error);
    logger.error({ requestId, actor, templateSlug, action: 'get_template', outcome: 'error', err }, '[orchestrator] template get failed');
    sendError(res, 'Failed to get template', 500, 'INTERNAL_ERROR');
  } finally { span.end(); }
});

// ── POST /templates/:templateSlug/instantiate ────────────────────────────────
// Materializes a template into a new DRAFT pack. Caller must provide a unique
// target slug. Never activates — the draft must go through the normal
// request-activation → approval flow. adminGuard + evolveGuard.

router.post('/templates/:templateSlug/instantiate', adminGuard, async (req: OrchestratorRequest, res: Response) => {
  if (!mutationGuard(res)) return;
  if (!evolveGuard(res)) return;
  const { templateSlug } = req.params;
  const { targetSlug, name: nameOverride } = req.body as { targetSlug?: string; name?: string };
  const requestId = randomUUID();
  const actor = getActor(req);
  const span = tracer.startSpan('orchestrator.templates.instantiate', {
    attributes: { 'orchestrator.template.slug': templateSlug, 'orchestrator.action': 'instantiate', 'szl.request.id': requestId },
  });
  logger.info({ requestId, actor, templateSlug, targetSlug, action: 'instantiate' }, '[orchestrator] instantiate template');
  try {
    if (!targetSlug || !/^[a-z0-9-]+$/.test(targetSlug)) {
      sendError(res, 'targetSlug is required (lowercase alphanumeric + hyphens)', 400, 'INVALID_TARGET_SLUG');
      return;
    }
    const tplRes = await pool.query(
      `SELECT name, industry, template_json FROM domain_pack_templates WHERE slug = $1`,
      [templateSlug],
    );
    if (tplRes.rows.length === 0) {
      sendError(res, `Template not found: ${templateSlug}`, 404, 'TEMPLATE_NOT_FOUND');
      return;
    }
    const existing = await pool.query('SELECT slug FROM domain_packs WHERE slug = $1', [targetSlug]);
    if (existing.rows.length > 0) {
      sendError(res, `A pack with slug '${targetSlug}' already exists`, 409, 'PACK_ALREADY_EXISTS');
      return;
    }
    const tpl = tplRes.rows[0];
    const tplBody = tpl.template_json as Partial<DomainPack>;
    const pack: DomainPack = {
      slug: targetSlug,
      name: nameOverride || (tpl.name as string),
      description: tplBody.description ?? '',
      industry: tplBody.industry ?? (tpl.industry as string),
      uiShellTemplate: tplBody.uiShellTemplate ?? 'standard',
      constitution: tplBody.constitution ?? [],
      dataSources: tplBody.dataSources ?? [],
      evaluators: tplBody.evaluators ?? [],
      approvalRules: tplBody.approvalRules ?? [],
      selfOptimization: tplBody.selfOptimization ?? { rewardSignals: [], lockedParameters: [] },
      learningLoop: tplBody.learningLoop ?? { calibrationMetric: 'acceptance_rate', driftThresholdPct: 2.0, recalibrationTrigger: 'auto' },
      lifecycle: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await pool.query(
      `INSERT INTO domain_packs (slug, name, description, industry, ui_shell_template, lifecycle, pack_json)
       VALUES ($1, $2, $3, $4, $5, 'draft', $6)`,
      [pack.slug, pack.name, pack.description, pack.industry, pack.uiShellTemplate, JSON.stringify(pack)],
    );
    await writeRevision(pack.slug, 'draft', pack, actor, `Instantiated from template ${templateSlug}`);
    await writeAuditEvent(pack.slug, 'instantiated_from_template', actor, 'success', { templateSlug, requestId });
    span.setStatus({ code: api.SpanStatusCode.OK });
    logger.info({ requestId, actor, templateSlug, targetSlug, action: 'instantiate', outcome: 'success' }, '[orchestrator] instantiate ok');
    res.status(201).json({ ok: true, data: pack });
  } catch (err) {
    span.setStatus({ code: api.SpanStatusCode.ERROR, message: String(err) });
    span.recordException(err as Error);
    logger.error({ requestId, actor, templateSlug, action: 'instantiate', outcome: 'error', err }, '[orchestrator] instantiate failed');
    sendError(res, 'Failed to instantiate template', 500, 'INTERNAL_ERROR');
  } finally { span.end(); }
});

// ── POST /ai-draft ────────────────────────────────────────────────────────────
// AI-Assisted Composer. Takes a {brief, industry?} body and returns a *draft*
// DomainPack object. Never auto-creates the pack — caller must POST /packs.
// If AI_INTEGRATIONS_OPENAI_BASE_URL + _API_KEY are set, calls the proxy;
// otherwise returns a deterministic structured stub built from the brief
// (marked source:'stub' so the UI shows it honestly).
// Cost (if any) recorded via @szl-holdings/ai-control-plane.

interface AiDraftBody { brief?: string; industry?: string; name?: string }

router.post('/ai-draft', adminGuard, async (req: OrchestratorRequest, res: Response) => {
  if (!mutationGuard(res)) return;
  if (!evolveGuard(res)) return;
  const { brief, industry, name } = req.body as AiDraftBody;
  const requestId = randomUUID();
  const actor = getActor(req);
  const span = tracer.startSpan('orchestrator.ai-draft', {
    attributes: { 'orchestrator.action': 'ai_draft', 'szl.request.id': requestId },
  });
  logger.info({ requestId, actor, action: 'ai_draft', briefLen: brief?.length ?? 0 }, '[orchestrator] AI draft request');
  try {
    if (!brief || brief.length < 10) {
      sendError(res, 'brief is required (min 10 chars)', 400, 'INVALID_BRIEF');
      return;
    }

    const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
    const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
    const useAi = Boolean(baseUrl && apiKey);

    const stubName = name || (industry ? `${industry} — Governed Vertical` : 'Untitled Vertical');
    const stubSlug = stubName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'untitled';

    const stubDraft: Partial<DomainPack> = {
      slug: stubSlug,
      name: stubName,
      description: brief.slice(0, 480),
      industry: industry ?? 'General',
      uiShellTemplate: 'standard',
      constitution: [
        { articleId: 'I', version: 'v4.2.0' },
        { articleId: 'II', version: 'v4.2.0' },
      ],
      dataSources: [],
      evaluators: [{
        evaluatorId: 'mirroreval-standard', displayName: 'MirrorEval Standard',
        passThreshold: 0.85,
        dimensions: ['groundedness', 'evidence_coverage', 'policy_compliance', 'approval_alignment'],
      }],
      approvalRules: [
        { riskTier: 'critical', requiresApprover: 'C-Suite' },
        { riskTier: 'high', requiresApprover: 'VP / Functional Lead' },
        { riskTier: 'medium', requiresApprover: 'Senior Operator' },
      ],
      selfOptimization: { rewardSignals: ['acceptance_rate', 'decision_accuracy'], lockedParameters: [] },
      learningLoop: { calibrationMetric: 'outcome_accuracy', driftThresholdPct: 2.0, recalibrationTrigger: 'auto' },
    };

    if (!useAi) {
      span.setAttributes({ 'orchestrator.ai_draft.source': 'stub' });
      span.setStatus({ code: api.SpanStatusCode.OK });
      logger.info({ requestId, actor, action: 'ai_draft', outcome: 'stub' }, '[orchestrator] AI draft via stub (proxy not configured)');
      ok(res, { draft: stubDraft, source: 'stub', note: 'AI proxy not configured — returned deterministic stub from brief. Set AI_INTEGRATIONS_OPENAI_* to enable LLM drafting.' });
      return;
    }

    // Call the AI integrations proxy (OpenAI-compatible).
    const systemPrompt =
      'You are A11oy\'s governance architect. Given a brief, propose a DomainPack JSON draft with: slug, name, description, industry, uiShellTemplate, constitution (articleIds from I-IX), dataSources (empty list ok), evaluators (one mirroreval entry), approvalRules (3 tiers), selfOptimization, learningLoop. Output ONLY a single JSON object — no prose. Never mark lifecycle:active. The draft will be human-reviewed before activation.';
    let aiDraft: Partial<DomainPack> = stubDraft;
    let source = 'stub-fallback';
    let costUsd = 0;
    try {
      const url = `${(baseUrl as string).replace(/\/$/, '')}/chat/completions`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: process.env.A11OY_ORCHESTRATOR_DRAFT_MODEL || 'gpt-5-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Brief:\n${brief}\n\nIndustry: ${industry ?? '(infer)'}\nTarget slug hint: ${stubSlug}` },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
          max_tokens: 1400,
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (resp.ok) {
        const body = await resp.json() as { choices?: Array<{ message?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number } };
        const content = body.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content) as Partial<DomainPack>;
          // Defensive merge: never trust LLM to set lifecycle.
          aiDraft = { ...stubDraft, ...parsed, slug: parsed.slug || stubDraft.slug };
          source = 'ai';
          // Crude cost estimate (gpt-5-mini-ish). Best-effort, never block.
          const inTok = body.usage?.prompt_tokens ?? 0;
          const outTok = body.usage?.completion_tokens ?? 0;
          costUsd = (inTok * 0.00015 + outTok * 0.0006) / 1000;
          try {
            const cc = await import('@szl-holdings/ai-control-plane') as { recordCost?: (entry: Record<string, unknown>) => void };
            cc.recordCost?.({
              orgId: actor, provider: 'openai',
              model: process.env.A11OY_ORCHESTRATOR_DRAFT_MODEL || 'gpt-5-mini',
              routeClass: 'orchestrator-ai-draft',
              inputTokens: inTok, outputTokens: outTok,
              inputCostPerToken: 0.00000015, outputCostPerToken: 0.0000006,
              fixedCostUsd: 0,
            });
          } catch { /* cost ledger optional */ }
        }
      } else {
        logger.warn({ requestId, status: resp.status }, '[orchestrator] AI draft proxy returned non-200, falling back to stub');
      }
    } catch (aiErr) {
      logger.warn({ requestId, err: aiErr }, '[orchestrator] AI draft proxy call failed, falling back to stub');
    }
    span.setAttributes({ 'orchestrator.ai_draft.source': source });
    span.setStatus({ code: api.SpanStatusCode.OK });
    logger.info({ requestId, actor, action: 'ai_draft', outcome: 'success', source, costUsd }, '[orchestrator] AI draft ok');
    ok(res, { draft: aiDraft, source, costUsd });
  } catch (err) {
    span.setStatus({ code: api.SpanStatusCode.ERROR, message: String(err) });
    span.recordException(err as Error);
    logger.error({ requestId, actor, action: 'ai_draft', outcome: 'error', err }, '[orchestrator] AI draft failed');
    sendError(res, 'Failed to generate AI draft', 500, 'INTERNAL_ERROR');
  } finally { span.end(); }
});

// ── GET /packs/:slug/revisions ────────────────────────────────────────────────

router.get('/packs/:slug/revisions', async (req: OrchestratorRequest, res: Response) => {
  const { slug } = req.params;
  const requestId = randomUUID();
  const actor = getActor(req);
  const limit = Math.min(Number(req.query.limit ?? 100), 500);
  const span = tracer.startSpan('orchestrator.packs.revisions', {
    attributes: { 'orchestrator.slug': slug, 'szl.request.id': requestId },
  });
  try {
    const result = await pool.query(
      `SELECT id, slug, lifecycle, actor_id, note, created_at
       FROM domain_pack_revisions WHERE slug = $1
       ORDER BY created_at DESC LIMIT $2`,
      [slug, limit],
    );
    span.setAttributes({ 'orchestrator.result.count': result.rows.length });
    span.setStatus({ code: api.SpanStatusCode.OK });
    logger.info({ requestId, actor, slug, action: 'list_revisions', outcome: 'success', count: result.rows.length }, '[orchestrator] revisions ok');
    ok(res, { revisions: result.rows, total: result.rows.length });
  } catch (err) {
    span.setStatus({ code: api.SpanStatusCode.ERROR, message: String(err) });
    span.recordException(err as Error);
    logger.error({ requestId, actor, slug, action: 'list_revisions', outcome: 'error', err }, '[orchestrator] revisions failed');
    sendError(res, 'Failed to list revisions', 500, 'INTERNAL_ERROR');
  } finally { span.end(); }
});

// ── GET /packs/:slug/revisions/:revA/diff/:revB ──────────────────────────────
// Field-level diff between two revisions of the same pack (or revA vs current
// when revB === 'current'). Returns { added, removed, changed } maps.

function diffPackJson(a: Record<string, unknown>, b: Record<string, unknown>) {
  const keys = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]);
  const added: Record<string, unknown> = {};
  const removed: Record<string, unknown> = {};
  const changed: Record<string, { from: unknown; to: unknown }> = {};
  for (const k of keys) {
    const va = a?.[k];
    const vb = b?.[k];
    const sa = JSON.stringify(va);
    const sb = JSON.stringify(vb);
    if (sa === sb) continue;
    if (va === undefined) added[k] = vb;
    else if (vb === undefined) removed[k] = va;
    else changed[k] = { from: va, to: vb };
  }
  return { added, removed, changed };
}

router.get('/packs/:slug/revisions/:revA/diff/:revB', async (req: OrchestratorRequest, res: Response) => {
  const { slug, revA, revB } = req.params;
  const requestId = randomUUID();
  const actor = getActor(req);
  const span = tracer.startSpan('orchestrator.packs.revisions.diff', {
    attributes: { 'orchestrator.slug': slug, 'orchestrator.revA': revA, 'orchestrator.revB': revB, 'szl.request.id': requestId },
  });
  try {
    const aRes = await pool.query<{ pack_json: Record<string, unknown>; lifecycle: string; created_at: string }>(
      `SELECT pack_json, lifecycle, created_at FROM domain_pack_revisions WHERE id = $1 AND slug = $2`,
      [revA, slug],
    );
    if (aRes.rows.length === 0) {
      sendError(res, `Revision A not found: ${revA}`, 404, 'REVISION_NOT_FOUND');
      return;
    }
    let bPack: Record<string, unknown>;
    let bMeta: { lifecycle: string; created_at: string };
    if (revB === 'current') {
      const cur = await pool.query<{ pack_json: Record<string, unknown>; lifecycle: string; updated_at: string }>(
        `SELECT pack_json, lifecycle, updated_at FROM domain_packs WHERE slug = $1`, [slug],
      );
      if (cur.rows.length === 0) { sendError(res, `Pack not found: ${slug}`, 404, 'PACK_NOT_FOUND'); return; }
      bPack = cur.rows[0].pack_json;
      bMeta = { lifecycle: cur.rows[0].lifecycle, created_at: cur.rows[0].updated_at };
    } else {
      const bRes = await pool.query<{ pack_json: Record<string, unknown>; lifecycle: string; created_at: string }>(
        `SELECT pack_json, lifecycle, created_at FROM domain_pack_revisions WHERE id = $1 AND slug = $2`,
        [revB, slug],
      );
      if (bRes.rows.length === 0) { sendError(res, `Revision B not found: ${revB}`, 404, 'REVISION_NOT_FOUND'); return; }
      bPack = bRes.rows[0].pack_json;
      bMeta = { lifecycle: bRes.rows[0].lifecycle, created_at: bRes.rows[0].created_at };
    }
    const diff = diffPackJson(aRes.rows[0].pack_json, bPack);
    span.setStatus({ code: api.SpanStatusCode.OK });
    logger.info({ requestId, actor, slug, revA, revB, action: 'diff_revisions', outcome: 'success' }, '[orchestrator] diff ok');
    ok(res, {
      slug, revA: { id: revA, lifecycle: aRes.rows[0].lifecycle, at: aRes.rows[0].created_at },
      revB: { id: revB, lifecycle: bMeta.lifecycle, at: bMeta.created_at }, diff,
    });
  } catch (err) {
    span.setStatus({ code: api.SpanStatusCode.ERROR, message: String(err) });
    span.recordException(err as Error);
    logger.error({ requestId, actor, slug, action: 'diff_revisions', outcome: 'error', err }, '[orchestrator] diff failed');
    sendError(res, 'Failed to diff revisions', 500, 'INTERNAL_ERROR');
  } finally { span.end(); }
});

// ── POST /packs/:slug/rollback/:revisionId ───────────────────────────────────
// Governed rollback: files an approval_requests row (action_class:
// domain_pack_rollback), writes a pending revision, and emits an audit event.
// The actual pack_json swap happens only when the approval is resolved
// (operator goes through the existing approval pathway). adminGuard + evolveGuard.

router.post('/packs/:slug/rollback/:revisionId', adminGuard, async (req: OrchestratorRequest, res: Response) => {
  if (!mutationGuard(res)) return;
  if (!evolveGuard(res)) return;
  const { slug, revisionId } = req.params;
  const { note } = req.body as { note?: string };
  const requestId = randomUUID();
  const actor = getActor(req);
  const span = tracer.startSpan('orchestrator.packs.rollback', {
    attributes: { 'orchestrator.slug': slug, 'orchestrator.revision.id': revisionId, 'szl.request.id': requestId },
  });
  logger.info({ requestId, actor, slug, revisionId, action: 'rollback_request', note }, '[orchestrator] rollback request');
  try {
    const packRes = await pool.query('SELECT name, industry, lifecycle FROM domain_packs WHERE slug = $1', [slug]);
    if (packRes.rows.length === 0) { sendError(res, `Pack not found: ${slug}`, 404, 'PACK_NOT_FOUND'); return; }
    if (packRes.rows[0].lifecycle !== 'active') {
      sendError(res, `Rollback only supported on active packs (current: ${packRes.rows[0].lifecycle})`, 400, 'PACK_INVALID_STATE');
      return;
    }
    const revRes = await pool.query<{ pack_json: Record<string, unknown>; created_at: string; lifecycle: string }>(
      `SELECT pack_json, created_at, lifecycle FROM domain_pack_revisions WHERE id = $1 AND slug = $2`,
      [revisionId, slug],
    );
    if (revRes.rows.length === 0) { sendError(res, `Revision not found: ${revisionId}`, 404, 'REVISION_NOT_FOUND'); return; }
    const targetPack = revRes.rows[0].pack_json;
    const correlationId = `orch-rollback-${slug}-${revisionId}-${Date.now()}`;
    let approvalId: number;
    try {
      const r = await pool.query<{ id: number }>(
        `INSERT INTO approval_requests
           (resource_type, resource_id, title, description, action_class,
            priority, status, correlation_id, service_attribution)
         VALUES
           ('domain_pack', $1, $2, $3, 'domain_pack_rollback',
            'high', 'pending', $4, 'a11oy-vertical-orchestrator')
         RETURNING id`,
        [slug,
         `Rollback Domain Pack: ${packRes.rows[0].name} → rev ${revisionId}`,
         `Operator-requested rollback of active pack "${packRes.rows[0].name}" to revision ${revisionId} (originally ${revRes.rows[0].lifecycle} on ${revRes.rows[0].created_at}). Reason: ${note ?? 'No reason provided'}.`,
         correlationId],
      );
      approvalId = r.rows[0]?.id;
      if (!approvalId) throw new Error('approval_requests INSERT returned no id');
    } catch (approvalErr) {
      logger.error({ requestId, actor, slug, revisionId, err: approvalErr }, '[orchestrator] rollback approval INSERT failed');
      await writeAuditEvent(slug, 'rollback_requested', actor, 'fail', { reason: 'approval_queue_insert_failed', revisionId, requestId });
      sendError(res, 'Failed to file rollback request in Approval Queue — pack unchanged', 503, 'APPROVAL_QUEUE_FAILED');
      return;
    }
    await writeRevision(slug, 'active', targetPack as DomainPack, actor, `Rollback proposed to revision ${revisionId} — pending approval`);
    await writeAuditEvent(slug, 'rollback_requested', actor, 'success', { revisionId, correlationId, approvalRequestId: approvalId, note, requestId });
    span.setStatus({ code: api.SpanStatusCode.OK });
    logger.info({ requestId, actor, slug, revisionId, action: 'rollback_request', outcome: 'success', approvalId }, '[orchestrator] rollback filed');
    ok(res, {
      slug, revisionId, status: 'pending_approval',
      approvalRequestId: approvalId, correlationId,
      note: 'Rollback filed in Approval Queue — pack_json unchanged until approval resolves.',
    }, 202);
  } catch (err) {
    span.setStatus({ code: api.SpanStatusCode.ERROR, message: String(err) });
    span.recordException(err as Error);
    logger.error({ requestId, actor, slug, action: 'rollback_request', outcome: 'error', err }, '[orchestrator] rollback failed');
    sendError(res, 'Failed to file rollback request', 500, 'INTERNAL_ERROR');
  } finally { span.end(); }
});

// ── GET /packs/:slug/readiness ────────────────────────────────────────────────
// Live readiness score 0–100 with breakdown. Always available (no evolve gate)
// so the catalog can show it for *all* packs, but score is computed from
// existing data — no synthetic numbers.

router.get('/packs/:slug/readiness', async (req: OrchestratorRequest, res: Response) => {
  const { slug } = req.params;
  const requestId = randomUUID();
  const actor = getActor(req);
  const span = tracer.startSpan('orchestrator.packs.readiness', {
    attributes: { 'orchestrator.slug': slug, 'szl.request.id': requestId },
  });
  try {
    const packRes = await pool.query(
      `SELECT pack_json, lifecycle FROM domain_packs WHERE slug = $1`, [slug],
    );
    if (packRes.rows.length === 0) { sendError(res, `Pack not found: ${slug}`, 404, 'PACK_NOT_FOUND'); return; }
    const pack = packRes.rows[0].pack_json as DomainPack;
    const lifecycle = packRes.rows[0].lifecycle as string;

    // Component scores (each 0..1).
    const validationErrors = validatePack(pack);
    const validationScore = validationErrors.length === 0 ? 1.0 : Math.max(0, 1 - validationErrors.length * 0.15);
    const evaluatorScore = (pack.evaluators?.length ?? 0) > 0 ? 1.0 : 0.0;
    const approvalRulesScore = Math.min(1.0, (pack.approvalRules?.length ?? 0) / 3);

    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [evalRes, proofRes] = await Promise.all([
      pool.query<{ passed: number; total: number }>(
        `SELECT COUNT(*) FILTER (WHERE eval_passed = true)::int AS passed,
                COUNT(*)::int AS total
         FROM ai_traces WHERE domain = $1 AND captured_at > $2`,
        [slug, since7d],
      ).catch(() => ({ rows: [{ passed: 0, total: 0 }] })),
      pool.query<{ flagged: number; total: number }>(
        `SELECT COUNT(*) FILTER (WHERE review_state IN ('flagged','retracted'))::int AS flagged,
                COUNT(*)::int AS total
         FROM proof_chain WHERE id IN (
           SELECT proof_chain_id FROM ai_traces
           WHERE domain = $1 AND proof_chain_id IS NOT NULL AND captured_at > $2)`,
        [slug, since30d],
      ).catch(() => ({ rows: [{ flagged: 0, total: 0 }] })),
    ]);

    const evalRow = evalRes.rows[0];
    const evalPassRate = evalRow?.total > 0 ? evalRow.passed / evalRow.total : null;
    const evalScore = evalPassRate == null ? 0.5 : evalPassRate; // unknown = neutral

    const proofRow = proofRes.rows[0];
    const proofScore = !proofRow || proofRow.total === 0
      ? 0.5
      : proofRow.flagged === 0
        ? 1.0
        : Math.max(0, 1 - (proofRow.flagged / proofRow.total) * 5);

    // Weighted composite (sums to 100).
    const score = Math.round(
      validationScore * 40 +
      evaluatorScore * 10 +
      approvalRulesScore * 15 +
      evalScore * 20 +
      proofScore * 15,
    );
    const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 65 ? 'C' : score >= 50 ? 'D' : 'F';

    span.setAttributes({ 'orchestrator.readiness.score': score, 'orchestrator.readiness.grade': grade });
    span.setStatus({ code: api.SpanStatusCode.OK });
    logger.info({ requestId, actor, slug, action: 'readiness', outcome: 'success', score, grade }, '[orchestrator] readiness ok');
    ok(res, {
      slug, lifecycle, score, grade,
      breakdown: {
        validation:    { weight: 40, score: Math.round(validationScore * 100), errors: validationErrors.length },
        evaluators:    { weight: 10, score: Math.round(evaluatorScore * 100), count: pack.evaluators?.length ?? 0 },
        approvalRules: { weight: 15, score: Math.round(approvalRulesScore * 100), count: pack.approvalRules?.length ?? 0 },
        evalPassRate:  { weight: 20, score: Math.round(evalScore * 100), passRate: evalPassRate, sampleSize: evalRow?.total ?? 0 },
        proofLedger:   { weight: 15, score: Math.round(proofScore * 100), flagged: proofRow?.flagged ?? 0, total: proofRow?.total ?? 0 },
      },
      computedAt: new Date().toISOString(),
    });
  } catch (err) {
    span.setStatus({ code: api.SpanStatusCode.ERROR, message: String(err) });
    span.recordException(err as Error);
    logger.error({ requestId, actor, slug, action: 'readiness', outcome: 'error', err }, '[orchestrator] readiness failed');
    sendError(res, 'Failed to compute readiness', 500, 'INTERNAL_ERROR');
  } finally { span.end(); }
});

// ── POST /packs/:slug/emit-capability-proposal ────────────────────────────────
// Cross-pack learning loop. Materializes a proposal into the existing
// frontier pipeline (#4385): writes a synthetic frontier_artifacts row tagged
// `capability-proposal` and a frontier_inbox row in pending state, then
// records the orchestrator-side reference in capability_proposal_log.
// The proposal is then reviewed via the existing frontier inbox UI —
// no new approval path is created. adminGuard + evolveGuard.

interface ProposalBody {
  title?: string;
  summary?: string;
  proposalKind?: string;
  evidence?: Record<string, unknown>;
}

router.post('/packs/:slug/emit-capability-proposal', adminGuard, async (req: OrchestratorRequest, res: Response) => {
  if (!mutationGuard(res)) return;
  if (!evolveGuard(res)) return;
  const { slug } = req.params;
  const { title, summary, proposalKind, evidence } = req.body as ProposalBody;
  const requestId = randomUUID();
  const actor = getActor(req);
  const span = tracer.startSpan('orchestrator.packs.emit-capability-proposal', {
    attributes: { 'orchestrator.slug': slug, 'szl.request.id': requestId },
  });
  logger.info({ requestId, actor, slug, action: 'emit_capability_proposal', proposalKind }, '[orchestrator] emit proposal');
  try {
    if (!title || title.length < 3) {
      sendError(res, 'title is required (min 3 chars)', 400, 'INVALID_TITLE');
      return;
    }
    const packRes = await pool.query('SELECT name FROM domain_packs WHERE slug = $1', [slug]);
    if (packRes.rows.length === 0) { sendError(res, `Pack not found: ${slug}`, 404, 'PACK_NOT_FOUND'); return; }
    const packName = packRes.rows[0].name as string;
    const artifactId = `cap-prop-${slug}-${randomUUID()}`;
    const inboxId = `inbox-${artifactId}`;
    const url = `internal://a11oy-orchestrator/packs/${slug}/capability-proposals/${artifactId}`;
    const tags = ['capability-proposal', `pack:${slug}`, proposalKind ? `kind:${proposalKind}` : 'kind:cross_pack_learning'];

    // Step 1: synthetic frontier_artifacts row (so the existing inbox UI can render it).
    let frontierWritten = false;
    try {
      await pool.query(
        `INSERT INTO frontier_artifacts (id, provider, kind, external_id, title, url, summary, tags, raw)
         VALUES ($1, 'a11oy-orchestrator', 'capability-proposal', $1, $2, $3, $4, $5::jsonb, $6::jsonb)
         ON CONFLICT (id) DO NOTHING`,
        [artifactId, `${packName}: ${title}`, url, summary ?? null,
         JSON.stringify(tags),
         JSON.stringify({ sourcePackSlug: slug, sourcePackName: packName, proposalKind: proposalKind ?? 'cross_pack_learning', evidence: evidence ?? {} })],
      );
      await pool.query(
        `INSERT INTO frontier_inbox (id, artifact_id, status) VALUES ($1, $2, 'pending')
         ON CONFLICT (id) DO NOTHING`,
        [inboxId, artifactId],
      );
      frontierWritten = true;
    } catch (frontierErr) {
      logger.warn({ requestId, slug, err: frontierErr }, '[orchestrator] frontier_inbox write failed — proposal recorded locally only');
    }

    // Step 2: orchestrator-side log row (always succeeds even if frontier tables are missing).
    let logId: number | null = null;
    try {
      const r = await pool.query<{ id: number }>(
        `INSERT INTO capability_proposal_log
           (source_pack_slug, artifact_id, inbox_id, title, summary, evidence, actor_id)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7) RETURNING id`,
        [slug, artifactId, frontierWritten ? inboxId : null, title, summary ?? null,
         JSON.stringify({ proposalKind: proposalKind ?? 'cross_pack_learning', evidence: evidence ?? {} }),
         actor],
      );
      logId = r.rows[0]?.id ?? null;
    } catch (logErr) {
      logger.warn({ requestId, slug, err: logErr }, '[orchestrator] capability_proposal_log write failed — run migration 0166');
    }

    await writeAuditEvent(slug, 'capability_proposal_emitted', actor, frontierWritten ? 'success' : 'partial', {
      artifactId, inboxId: frontierWritten ? inboxId : null, logId, title, proposalKind, requestId,
    });
    span.setAttributes({ 'orchestrator.proposal.artifact_id': artifactId, 'orchestrator.proposal.frontier_written': frontierWritten });
    span.setStatus({ code: api.SpanStatusCode.OK });
    logger.info({ requestId, actor, slug, action: 'emit_capability_proposal', outcome: 'success', artifactId, frontierWritten }, '[orchestrator] proposal emitted');
    ok(res, {
      slug, artifactId, inboxId: frontierWritten ? inboxId : null, logId,
      title, summary, frontierInboxQueued: frontierWritten,
      reviewPath: frontierWritten ? '/api/a11oy/frontier/inbox' : null,
      note: frontierWritten
        ? 'Proposal queued in frontier inbox (#4385) — review via /api/a11oy/frontier/inbox.'
        : 'Frontier tables unavailable — proposal recorded in capability_proposal_log only.',
    }, 201);
  } catch (err) {
    span.setStatus({ code: api.SpanStatusCode.ERROR, message: String(err) });
    span.recordException(err as Error);
    logger.error({ requestId, actor, slug, action: 'emit_capability_proposal', outcome: 'error', err }, '[orchestrator] proposal emit failed');
    sendError(res, 'Failed to emit capability proposal', 500, 'INTERNAL_ERROR');
  } finally { span.end(); }
});

// ── GET /capability-proposals ─────────────────────────────────────────────────
// Lists proposals emitted by the orchestrator (from capability_proposal_log).
// Source of truth for the proposal *itself* remains frontier_inbox.

router.get('/capability-proposals', async (req: OrchestratorRequest, res: Response) => {
  const requestId = randomUUID();
  const actor = getActor(req);
  const limit = Math.min(Number(req.query.limit ?? 100), 500);
  const span = tracer.startSpan('orchestrator.capability-proposals.list', {
    attributes: { 'orchestrator.action': 'list_capability_proposals', 'szl.request.id': requestId },
  });
  try {
    const result = await pool.query(
      `SELECT cpl.id, cpl.source_pack_slug, cpl.artifact_id, cpl.inbox_id, cpl.title,
              cpl.summary, cpl.actor_id, cpl.created_at,
              fi.status AS frontier_status, fi.reviewed_at, fi.reviewed_by
       FROM capability_proposal_log cpl
       LEFT JOIN frontier_inbox fi ON fi.id = cpl.inbox_id
       ORDER BY cpl.created_at DESC LIMIT $1`,
      [limit],
    );
    span.setAttributes({ 'orchestrator.result.count': result.rows.length });
    span.setStatus({ code: api.SpanStatusCode.OK });
    logger.info({ requestId, actor, action: 'list_capability_proposals', outcome: 'success', count: result.rows.length }, '[orchestrator] proposals list ok');
    ok(res, { proposals: result.rows, total: result.rows.length });
  } catch (err) {
    logger.warn({ requestId, actor, action: 'list_capability_proposals', outcome: 'unavailable', err }, '[orchestrator] capability_proposal_log unavailable');
    ok(res, { proposals: [], total: 0, note: 'capability_proposal_log table missing — run migration 0166_domain_pack_templates.sql' });
  } finally { span.end(); }
});

export default router;
