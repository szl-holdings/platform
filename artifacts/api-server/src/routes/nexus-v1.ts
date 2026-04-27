/**
 * PRAXIS Unified Intelligence Protocol — v1 Routes
 *
 * Single-endpoint API that unifies all SZL domains (maritime, legal,
 * real estate, cyber, executive intelligence, governance) behind one
 * developer-facing protocol.
 *
 * Endpoints:
 *   POST   /nexus/v1/query          — cross-domain intelligence query (SSE streaming)
 *   POST   /nexus/v1/actions        — governed business action execution
 *   POST   /nexus/v1/sessions       — create a new session
 *   GET    /nexus/v1/sessions/:id   — retrieve session by ID
 *   GET    /nexus/v1/capabilities   — self-describing capabilities manifest
 *   GET    /nexus/v1/openapi.json   — standalone OpenAPI 3.1 spec
 *   GET    /nexus/v1/playground     — interactive developer playground
 */

import {
  type NexusV1SessionInsert,
  type NexusV1SessionRow,
  db,
  nexusV1SessionsTable,
} from '@szl-holdings/db';
import {
  NexusQueryRequestSchema,
  NexusActionRequestSchema,
  type NexusQueryRequest,
  type NexusActionRequest,
} from '@szl-holdings/api-zod';
import { submitPendingApprovalRequest } from '@workspace/approvals-inbox';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { gatewayInfer } from '../lib/ai-gateway';
import { handleRouteError, sendBadRequest, sendError, sendNotFound, sendSuccess } from '../lib/api-response';
import { logger } from '../lib/logger';
import { validateBody } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';
import { aiControlPlane } from '../middlewares/ai-control-plane';
import {
  perUserApiSlidingLimiter,
  perUserWriteSlidingLimiter,
} from '../middlewares/sliding-window-limiter';

const INTERNAL_API_BASE = `http://127.0.0.1:${process.env['PORT'] ?? '8080'}`;

// ─── Domain real-time data sources ────────────────────────────────────────────
// Maps each domain key to a read-only platform endpoint that returns live data.
// These endpoints are called before LLM synthesis to ground responses in actual
// platform state rather than purely model-inferred content.
const DOMAIN_DATA_SOURCES: Partial<Record<string, { path: string; label: string }>> = {
  maritime: { path: '/api/vessels/vessels?limit=5', label: 'Fleet Status' },
  sentra: { path: '/api/sentra/incidents?limit=5', label: 'Active Incidents' },
  terra: { path: '/api/terra/properties?limit=5', label: 'Property Portfolio' },
  pulse: { path: '/api/pulse/briefings?limit=3', label: 'Recent Briefings' },
  alloy: { path: '/api/alloy/agent/runs?limit=5', label: 'Agent Runs' },
};

// Fetch live domain data for grounding. Forwards the caller's session cookie so
// authenticated domain routes (vessels, terra, pulse) serve real tenant data.
// Uses x-nexus-orchestrator to bypass CSRF on the internal loopback call.
// Returns null on timeout, auth failure, or any network error — callers fall
// back to model-only inference and annotate evidence accordingly.
async function fetchDomainGrounding(
  domain: string,
  userCookie: string | undefined,
): Promise<{ data: unknown; label: string; sourceType: 'real_data' } | null> {
  const source = DOMAIN_DATA_SOURCES[domain];
  if (!source) return null;

  const headers: Record<string, string> = { 'x-nexus-orchestrator': '1' };
  if (userCookie) headers['Cookie'] = userCookie;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(`${INTERNAL_API_BASE}${source.path}`, {
      headers,
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = await response.json().catch(() => null);
    if (!data) return null;
    // Return null for error envelopes (auth failures, etc.)
    if (data && typeof data === 'object' && 'error' in data) return null;
    return { data, label: source.label, sourceType: 'real_data' };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const router = Router();

// ─── Auth + rate limiting ──────────────────────────────────────────────────────

router.use(authMiddleware({ required: false }));
router.use('/nexus/v1/query', perUserWriteSlidingLimiter);
router.use('/nexus/v1/actions', authMiddleware({ required: true }));
router.use('/nexus/v1/actions', perUserWriteSlidingLimiter);
router.use(
  '/nexus/v1/query',
  aiControlPlane({ policyRouteClass: 'reasoning', costRouteClass: 'nexus_v1_query' }),
);
router.use(
  '/nexus/v1/actions',
  aiControlPlane({ costRouteClass: 'nexus_v1_action' }),
);

// ─── Domain registry ──────────────────────────────────────────────────────────

interface DomainConfig {
  displayName: string;
  description: string;
  systemPrompt: string;
  capabilities: string[];
  actions: Array<{
    id: string;
    name: string;
    description: string;
    requires_approval: boolean;
    params_schema: Record<string, unknown>;
  }>;
  tools: Array<{
    id: string;
    name: string;
    description: string;
    input_schema: Record<string, unknown>;
  }>;
  keywords: string[];
}

const DOMAIN_REGISTRY: Record<string, DomainConfig> = {
  vessels: {
    displayName: 'Vessels Maritime Intelligence',
    description: 'Fleet tracking, AIS signals, sanctions risk, route economics, and chokepoint monitoring.',
    systemPrompt:
      'You are a maritime intelligence analyst for Vessels. Analyze vessel data, AIS signals, sanctions risk, route economics, and chokepoint monitoring. Be precise and cite specific data points. Format findings as structured intelligence with confidence scores.',
    capabilities: ['fleet-tracking', 'sanctions-screening', 'route-analysis', 'chokepoint-monitoring'],
    actions: [
      {
        id: 'vessels.reroute',
        name: 'Reroute Vessel',
        description: 'Issue a rerouting recommendation for a tracked vessel',
        requires_approval: true,
        params_schema: {
          type: 'object',
          properties: {
            vessel_id: { type: 'string' },
            new_route: { type: 'string' },
            reason: { type: 'string' },
          },
          required: ['vessel_id', 'new_route', 'reason'],
        },
      },
      {
        id: 'vessels.flag_sanctions_risk',
        name: 'Flag Sanctions Risk',
        description: 'Flag a vessel or entity for sanctions risk review',
        requires_approval: false,
        params_schema: {
          type: 'object',
          properties: { vessel_id: { type: 'string' }, risk_level: { type: 'string' } },
          required: ['vessel_id', 'risk_level'],
        },
      },
    ],
    tools: [
      {
        id: 'vessels.ais_lookup',
        name: 'AIS Position Lookup',
        description: 'Retrieve real-time AIS position and heading for a vessel by MMSI or IMO',
        input_schema: {
          type: 'object',
          properties: {
            identifier: { type: 'string', description: 'MMSI or IMO number' },
          },
          required: ['identifier'],
        },
      },
    ],
    keywords: ['vessel', 'ship', 'maritime', 'fleet', 'ais', 'port', 'cargo', 'route', 'sanctions', 'chokepoint', 'straits'],
  },
  counsel: {
    displayName: 'Counsel Legal Matter Command',
    description: 'Legal matter analysis, contract review, regulatory compliance, and litigation risk.',
    systemPrompt:
      'You are a legal intelligence analyst for Counsel. Analyze legal matters, contracts, regulatory compliance, and litigation risk. Provide structured legal intelligence with confidence scores and source references. Flag matters requiring attorney review.',
    capabilities: ['matter-analysis', 'contract-review', 'compliance-monitoring', 'litigation-risk'],
    actions: [
      {
        id: 'counsel.flag_matter',
        name: 'Flag Legal Matter',
        description: 'Flag a legal matter for urgent review or escalation',
        requires_approval: true,
        params_schema: {
          type: 'object',
          properties: {
            matter_id: { type: 'string' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            reason: { type: 'string' },
          },
          required: ['matter_id', 'priority', 'reason'],
        },
      },
    ],
    tools: [
      {
        id: 'counsel.matter_search',
        name: 'Matter Search',
        description: 'Search active legal matters by keyword, party, or status',
        input_schema: {
          type: 'object',
          properties: { query: { type: 'string' }, status: { type: 'string' } },
          required: ['query'],
        },
      },
    ],
    keywords: ['legal', 'contract', 'litigation', 'compliance', 'regulation', 'law', 'court', 'counsel', 'matter', 'attorney'],
  },
  terra: {
    displayName: 'Terra Real Estate Intelligence',
    description: 'Property market analysis, distress signals, investment scoring, and portfolio monitoring.',
    systemPrompt:
      'You are a real estate market intelligence analyst for Terra. Evaluate property data, market trends, distress signals, and investment opportunities. Provide data-driven scoring with confidence levels and comparable references.',
    capabilities: ['market-analysis', 'property-scoring', 'distress-detection', 'investment-recommendation'],
    actions: [
      {
        id: 'terra.flag_distress',
        name: 'Flag Property Distress',
        description: 'Flag a property or portfolio for distress monitoring',
        requires_approval: false,
        params_schema: {
          type: 'object',
          properties: {
            property_id: { type: 'string' },
            distress_type: { type: 'string' },
          },
          required: ['property_id', 'distress_type'],
        },
      },
    ],
    tools: [
      {
        id: 'terra.market_scan',
        name: 'Market Scan',
        description: 'Scan a market area for properties matching investment criteria',
        input_schema: {
          type: 'object',
          properties: {
            location: { type: 'string' },
            asset_class: { type: 'string' },
            min_cap_rate: { type: 'number' },
          },
          required: ['location'],
        },
      },
    ],
    keywords: ['property', 'real estate', 'market', 'cap rate', 'noi', 'lease', 'portfolio', 'distress', 'investment', 'terra'],
  },
  sentra: {
    displayName: 'Sentra Cyber Resilience Command',
    description: 'Threat detection, incident response, vulnerability management, and cyber containment.',
    systemPrompt:
      'You are a cybersecurity threat analyst for Sentra. Assess vulnerabilities, attack surfaces, CVEs, and penetration test results. Prioritize by risk severity and provide structured incident response guidance with confidence scores.',
    capabilities: ['vulnerability-assessment', 'threat-detection', 'risk-scoring', 'incident-response'],
    actions: [
      {
        id: 'sentra.contain_threat',
        name: 'Contain Cyber Threat',
        description: 'Trigger containment procedures for a detected threat',
        requires_approval: true,
        params_schema: {
          type: 'object',
          properties: {
            threat_id: { type: 'string' },
            containment_level: { type: 'string', enum: ['isolate', 'quarantine', 'block'] },
          },
          required: ['threat_id', 'containment_level'],
        },
      },
      {
        id: 'sentra.escalate_incident',
        name: 'Escalate Incident',
        description: 'Escalate a cyber incident to the security operations center',
        requires_approval: false,
        params_schema: {
          type: 'object',
          properties: { incident_id: { type: 'string' }, severity: { type: 'string' } },
          required: ['incident_id', 'severity'],
        },
      },
    ],
    tools: [
      {
        id: 'sentra.threat_scan',
        name: 'Threat Scan',
        description: 'Scan for active threats and vulnerabilities in the monitored environment',
        input_schema: {
          type: 'object',
          properties: { scope: { type: 'string' }, depth: { type: 'string' } },
          required: ['scope'],
        },
      },
    ],
    keywords: ['cyber', 'threat', 'vulnerability', 'cve', 'incident', 'attack', 'breach', 'security', 'malware', 'ransomware', 'sentra', 'tenax'],
  },
  pulse: {
    displayName: 'Pulse Executive Intelligence',
    description: 'AI-powered executive briefings, signal synthesis, and cross-domain situational awareness.',
    systemPrompt:
      'You are an executive intelligence analyst for Pulse. Synthesize cross-domain signals into executive briefings. Identify critical patterns, emerging risks, and strategic opportunities. Format as structured executive intelligence.',
    capabilities: ['briefing-synthesis', 'signal-correlation', 'trend-detection', 'risk-horizon-scanning'],
    actions: [
      {
        id: 'pulse.generate_briefing',
        name: 'Generate Executive Briefing',
        description: 'Generate an on-demand executive intelligence briefing',
        requires_approval: false,
        params_schema: {
          type: 'object',
          properties: {
            domains: { type: 'array', items: { type: 'string' } },
            depth: { type: 'string', enum: ['summary', 'standard', 'deep'] },
          },
          required: [],
        },
      },
    ],
    tools: [
      {
        id: 'pulse.signal_feed',
        name: 'Signal Feed',
        description: 'Retrieve the latest cross-domain intelligence signals',
        input_schema: {
          type: 'object',
          properties: {
            limit: { type: 'number' },
            domains: { type: 'array', items: { type: 'string' } },
          },
          required: [],
        },
      },
    ],
    keywords: ['briefing', 'executive', 'signal', 'trend', 'risk', 'intelligence', 'pulse', 'lumina', 'situational'],
  },
  aegis: {
    displayName: 'Aegis Defense & Intelligence',
    description: 'Defense intelligence, threat modeling, PCAP analysis, and geospatial threat mapping.',
    systemPrompt:
      'You are a defense and intelligence analyst for Aegis. Assess defense posture, threat actors, geospatial risks, and intelligence assessments. Provide structured intelligence with confidence levels and source attribution.',
    capabilities: ['threat-modeling', 'pcap-analysis', 'geospatial-intelligence', 'defense-posture'],
    actions: [
      {
        id: 'aegis.flag_threat_actor',
        name: 'Flag Threat Actor',
        description: 'Flag a threat actor for tracking and monitoring',
        requires_approval: true,
        params_schema: {
          type: 'object',
          properties: {
            actor_id: { type: 'string' },
            threat_level: { type: 'string' },
            attribution_confidence: { type: 'number' },
          },
          required: ['actor_id', 'threat_level'],
        },
      },
    ],
    tools: [
      {
        id: 'aegis.threat_map',
        name: 'Threat Map Query',
        description: 'Query the geospatial threat map for a region or domain',
        input_schema: {
          type: 'object',
          properties: { region: { type: 'string' }, threat_type: { type: 'string' } },
          required: ['region'],
        },
      },
    ],
    keywords: ['defense', 'military', 'intelligence', 'threat actor', 'geospatial', 'pcap', 'aegis', 'paragon'],
  },
  alloy: {
    displayName: 'A11oy Brand Orchestration',
    description: 'AI brand governance, workflow automation, and cross-artifact intelligence orchestration.',
    systemPrompt:
      'You are an AI orchestration analyst for A11oy. Evaluate workflow execution, signal patterns, brand governance, and operational orchestration across the SZL ecosystem. Provide structured operational intelligence.',
    capabilities: ['workflow-analysis', 'brand-governance', 'signal-routing', 'orchestration-health'],
    actions: [
      {
        id: 'alloy.trigger_workflow',
        name: 'Trigger Workflow',
        description: 'Trigger an Alloy workflow by name or ID',
        requires_approval: true,
        params_schema: {
          type: 'object',
          properties: {
            workflow_id: { type: 'string' },
            params: { type: 'object' },
          },
          required: ['workflow_id'],
        },
      },
    ],
    tools: [
      {
        id: 'alloy.workflow_status',
        name: 'Workflow Status',
        description: 'Get the current status of Alloy workflows',
        input_schema: {
          type: 'object',
          properties: { workflow_id: { type: 'string' } },
          required: [],
        },
      },
    ],
    keywords: ['alloy', 'workflow', 'brand', 'automation', 'orchestration', 'fabric'],
  },
  command: {
    displayName: 'Unified Command',
    description: 'Cross-platform command center providing unified situational awareness across all SZL domains.',
    systemPrompt:
      'You are a unified command center analyst. Provide cross-platform situational awareness and command-level intelligence spanning all SZL domains. Synthesize signals from maritime, legal, real estate, cyber, and defense into unified command intelligence.',
    capabilities: ['unified-awareness', 'cross-domain-synthesis', 'command-intelligence', 'geo-intel'],
    actions: [
      {
        id: 'command.issue_alert',
        name: 'Issue Command Alert',
        description: 'Issue a cross-domain alert from the unified command center',
        requires_approval: false,
        params_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            severity: { type: 'string' },
            domains: { type: 'array', items: { type: 'string' } },
            message: { type: 'string' },
          },
          required: ['title', 'severity', 'message'],
        },
      },
    ],
    tools: [
      {
        id: 'command.geo_intel_query',
        name: 'Geo Intel Query',
        description: 'Query geospatial intelligence across all monitored assets',
        input_schema: {
          type: 'object',
          properties: {
            region: { type: 'string' },
            asset_types: { type: 'array', items: { type: 'string' } },
          },
          required: [],
        },
      },
    ],
    keywords: ['command', 'unified', 'situational', 'geo', 'geospatial', 'cross-domain', 'overview'],
  },
};

// ─── Schemas (shared from @szl-holdings/api-zod — no local duplicates) ────────

const CreateSessionSchema = z.object({
  org_id: z.number().optional(),
  context: z.string().optional(),
});

// ─── Session helpers ──────────────────────────────────────────────────────────

async function createSession(opts: {
  orgId?: number;
  userId?: number;
  contextSummary?: string;
}): Promise<NexusV1SessionRow> {
  const id = `sess_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const insert: NexusV1SessionInsert = {
    id,
    orgId: opts.orgId ?? null,
    userId: opts.userId ?? null,
    domainsTouched: [],
    contextSummary: opts.contextSummary ?? '',
    decisionGraph: [],
    turnCount: 0,
    metadata: {},
    expiresAt,
  };

  const [row] = await db.insert(nexusV1SessionsTable).values(insert).returning();
  if (!row) throw new Error('Failed to create session');
  return row;
}

async function getSession(id: string): Promise<NexusV1SessionRow | null> {
  const [row] = await db
    .select()
    .from(nexusV1SessionsTable)
    .where(eq(nexusV1SessionsTable.id, id))
    .limit(1);
  return row ?? null;
}

async function updateSession(
  id: string,
  patch: Partial<{
    domainsTouched: string[];
    contextSummary: string;
    decisionGraph: NexusV1SessionRow['decisionGraph'];
    turnCount: number;
  }>,
): Promise<void> {
  await db
    .update(nexusV1SessionsTable)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(nexusV1SessionsTable.id, id));
}

// ─── Session access control ───────────────────────────────────────────────────

/**
 * Check whether the requesting principal may access this session.
 *
 * - Anonymous sessions (no userId, no orgId): open bearer-token semantics
 * - User-scoped sessions: require authenticated user to match (admins exempt)
 * - Org-scoped sessions (orgId only): require org membership (admins exempt)
 */
function assertSessionAccess(session: NexusV1SessionRow, req: Request): 'ok' | 'unauthorized' | 'forbidden' {
  if (session.userId == null && session.orgId == null) return 'ok';

  const user = req.user as
    | { id?: number; roles?: string[]; orgs?: Array<{ orgId: number }> }
    | undefined;

  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('super_admin');

  if (session.userId != null) {
    if (!user) return 'unauthorized';
    if (isAdmin) return 'ok';
    return user.id === session.userId ? 'ok' : 'forbidden';
  }

  if (session.orgId != null) {
    if (!user) return 'unauthorized';
    if (isAdmin) return 'ok';
    const isMember = user.orgs?.some((o) => o.orgId === session.orgId);
    return isMember ? 'ok' : 'forbidden';
  }

  return 'ok';
}

// ─── Action delegation ────────────────────────────────────────────────────────

interface ActionDelegation {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT';
  buildPath: (params: Record<string, unknown>) => string;
  buildBody?: (params: Record<string, unknown>) => unknown;
}

const ACTION_DELEGATION_MAP: Partial<Record<string, ActionDelegation>> = {
  'sentra.contain_threat': {
    method: 'POST',
    buildPath: () => `/api/sentra/incidents`,
    buildBody: (p) => ({
      title: `PRAXIS Containment: ${String(p['threat_id'] ?? 'unknown')}`,
      description: `Containment initiated via PRAXIS v1 for threat ${String(p['threat_id'] ?? 'unknown')} — level: ${String(p['containment_level'] ?? 'isolate')}`,
      severity: 'critical',
    }),
  },
  'sentra.escalate_incident': {
    method: 'PATCH',
    buildPath: (p) => `/api/sentra/incidents/${encodeURIComponent(String(p['incident_id'] ?? ''))}`,
    buildBody: (p) => ({ status: 'escalated', severity: p['severity'] }),
  },
  'vessels.flag_sanctions_risk': {
    method: 'POST',
    buildPath: () => `/api/vessels/events`,
    buildBody: (p) => ({ type: 'sanctions_risk', vesselId: p['vessel_id'], riskLevel: p['risk_level'] }),
  },
  'pulse.generate_briefing': {
    method: 'POST',
    buildPath: () => `/api/pulse/briefings`,
    buildBody: (p) => ({ domains: p['domains'], depth: p['depth'] ?? 'standard' }),
  },
};

async function executeDomainDelegation(
  delegation: ActionDelegation,
  params: Record<string, unknown>,
  callerCookie?: string,
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const path = delegation.buildPath(params);
  const body = delegation.buildBody ? delegation.buildBody(params) : undefined;

  const internalToken = process.env['ALLOY_INTERNAL_TOKEN'];

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-nexus-orchestrator': '1',
  };
  if (internalToken) {
    headers['x-internal-token'] = internalToken;
  }
  // Forward the caller's session cookie so downstream domain endpoints can
  // authenticate the request as the real user/tenant rather than the
  // orchestrator service identity.
  if (callerCookie) {
    headers['cookie'] = callerCookie;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${INTERNAL_API_BASE}${path}`, {
      method: delegation.method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const data = await response.json().catch(() => null);
    return { ok: response.ok, status: response.status, data };
  } finally {
    clearTimeout(timer);
  }
}

// ─── Domain router ────────────────────────────────────────────────────────────

function routeDomains(input: string, hintDomains?: string[]): string[] {
  const lower = input.toLowerCase();

  if (hintDomains && hintDomains.length > 0) {
    return hintDomains.filter((d) => DOMAIN_REGISTRY[d]).slice(0, 5);
  }

  const scores: Record<string, number> = {};
  for (const [domain, config] of Object.entries(DOMAIN_REGISTRY)) {
    let score = 0;
    for (const kw of config.keywords) {
      if (lower.includes(kw)) score += 1;
    }
    if (score > 0) scores[domain] = score;
  }

  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([d]) => d);

  return sorted.length > 0 ? sorted : ['command'];
}

// ─── SSE helper ───────────────────────────────────────────────────────────────

function sseWrite(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ─── Evidence builder ─────────────────────────────────────────────────────────

function buildEvidence(domain: string, content: string, confidence: number) {
  return {
    id: `ev_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
    domain,
    type: 'tool_output' as const,
    summary: content.slice(0, 200),
    confidence,
    retrieved_at: new Date().toISOString(),
  };
}

// ─── Governance builder ───────────────────────────────────────────────────────

function buildGovernance(
  mode: string,
  requiresApproval: boolean,
): {
  mode: string;
  approval_required: boolean;
  approval_level: 'none' | 'operator' | 'admin' | 'board' | undefined;
  policy_checks_passed: boolean;
  proof_chain_ref: string | null;
  audit_trail_id: string | null;
} {
  const proofRef = `proof_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
  const auditId = `audit_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
  return {
    mode,
    approval_required: requiresApproval,
    // undefined (not null) keeps the shape within NexusGovernanceSchema (.optional(), not .nullable())
    approval_level: requiresApproval ? 'operator' : undefined,
    policy_checks_passed: true,
    proof_chain_ref: mode !== 'observe' ? proofRef : null,
    audit_trail_id: auditId,
  };
}

// ─── Synthesis prompt ─────────────────────────────────────────────────────────

const SYNTHESIS_SYSTEM_PROMPT = `You are the PRAXIS Unified Intelligence Synthesizer. Given analyses from multiple SZL domain agents, produce a unified intelligence response.

Structure your response as:
1. **Key Finding** — The single most important insight across all domains
2. **Cross-Domain Connections** — How findings relate across domains (if multiple domains)
3. **Risk Assessment** — Overall risk level and specific concerns
4. **Recommended Actions** — Concrete next steps, prioritized by urgency

Be concise (under 600 words), specific, and actionable. Reference domain names explicitly.`;

// ─── POST /nexus/v1/query ─────────────────────────────────────────────────────

router.post('/nexus/v1/query', validateBody(NexusQueryRequestSchema), async (req, res) => {
  const queryId = `qry_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const start = Date.now();

  try {
    const body = req.body as NexusQueryRequest;
    const { input, mode, domains: hintDomains, stream, depth, context } = body;
    let { session_id } = body;

    const userId = req.user?.id;
    const orgId = req.user?.orgs?.[0]?.orgId;

    let session: NexusV1SessionRow;
    if (session_id) {
      const existing = await getSession(session_id);
      if (!existing) {
        sendBadRequest(res, `Session not found: ${session_id}`);
        return;
      }
      const sessionAccess = assertSessionAccess(existing, req);
      if (sessionAccess === 'unauthorized') {
        res.status(401).json({ error: 'Authentication required to access this session', code: 'UNAUTHORIZED' });
        return;
      }
      if (sessionAccess === 'forbidden') {
        res.status(403).json({ error: 'Access denied — session belongs to a different user or organization', code: 'FORBIDDEN' });
        return;
      }
      session = existing;
    } else {
      session = await createSession({ orgId, userId });
      session_id = session.id;
    }

    const selectedDomains = routeDomains(input, hintDomains);
    const requiresApproval = mode === 'act' || mode === 'auto';

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();
    }

    const maxTokens = depth === 'deep' ? 1200 : depth === 'shallow' ? 400 : 700;

    const evidenceRefs: ReturnType<typeof buildEvidence>[] = [];
    const domainResults: Array<{ domain: string; content: string; confidence: number }> = [];

    const contextPrefix = context ? `Additional context: ${context}\n\n` : '';

    const userCookie = req.headers['cookie'];

    const domainPromises = selectedDomains.map(async (domain) => {
      const config = DOMAIN_REGISTRY[domain];
      if (!config) return;

      if (stream) sseWrite(res, 'domain_start', { domain, query_id: queryId });

      // Attempt to fetch live platform data for grounding. Falls back to
      // model-only inference if the domain endpoint is unavailable or requires
      // auth the caller doesn't have.
      const grounding = await fetchDomainGrounding(domain, userCookie as string | undefined);
      const groundingPrefix = grounding
        ? `Live ${grounding.label} data (source: real_data):\n${JSON.stringify(grounding.data, null, 2).slice(0, 1500)}\n\n`
        : '';
      const sourceType: 'real_data' | 'model_inference' = grounding ? 'real_data' : 'model_inference';

      try {
        const response = await gatewayInfer({
          messages: [
            { role: 'system', content: config.systemPrompt },
            {
              role: 'user',
              content: `${groundingPrefix}${contextPrefix}Query: ${input}\n\nProvide structured intelligence findings. Include confidence score (0.0–1.0) at the end as: CONFIDENCE: <number>`,
            },
          ],
          agentId: `nexus-v1-${domain}`,
          domain,
          strategy: 'fastest',
          maxTokens,
        });

        const confidenceMatch = response.content.match(/CONFIDENCE:\s*([\d.]+)/i);
        const confidence = confidenceMatch ? Math.min(1, parseFloat(confidenceMatch[1] ?? '0.7')) : 0.7;
        const cleanContent = response.content.replace(/CONFIDENCE:\s*[\d.]+\s*$/i, '').trim();

        const evidence = { ...buildEvidence(domain, cleanContent, confidence), source_type: sourceType };
        evidenceRefs.push(evidence);
        domainResults.push({ domain, content: cleanContent, confidence });

        if (stream) {
          sseWrite(res, 'domain_result', {
            domain,
            content: cleanContent,
            evidence: [evidence],
            confidence,
            source_type: sourceType,
          });
        }
      } catch (err) {
        logger.warn({ err, domain }, 'PRAXIS v1 domain agent failed');
        if (stream) {
          sseWrite(res, 'domain_result', {
            domain,
            content: `Intelligence unavailable for ${domain} at this time.`,
            evidence: [],
            confidence: 0,
            source_type: 'model_inference' as const,
          });
        }
      }
    });

    await Promise.allSettled(domainPromises);

    if (stream) {
      sseWrite(res, 'synthesis_start', { query_id: queryId, domains_count: domainResults.length });
    }

    let synthesisContent = '';
    let synthesisModel = 'unknown';

    if (domainResults.length > 0) {
      const analysesText = domainResults
        .map((r) => `## ${DOMAIN_REGISTRY[r.domain]?.displayName ?? r.domain}\n${r.content}`)
        .join('\n\n---\n\n');

      try {
        const synthResponse = await gatewayInfer({
          messages: [
            { role: 'system', content: SYNTHESIS_SYSTEM_PROMPT },
            {
              role: 'user',
              content: `Original Query: ${input}\n\n${analysesText}`,
            },
          ],
          agentId: 'nexus-v1-synthesizer',
          domain: 'nexus',
          strategy: 'preferred',
          preferredProvider: 'anthropic',
          maxTokens: depth === 'deep' ? 2000 : 1000,
        });
        synthesisContent = synthResponse.content;
        synthesisModel = synthResponse.model;
      } catch {
        synthesisContent = domainResults
          .map((r) => `**${r.domain}**: ${r.content.slice(0, 300)}`)
          .join('\n\n');
      }
    } else {
      synthesisContent = 'No domain intelligence could be retrieved for this query.';
    }

    if (stream) {
      sseWrite(res, 'synthesis_delta', { delta: synthesisContent });
    }

    const avgConfidence =
      domainResults.length > 0
        ? domainResults.reduce((s, r) => s + r.confidence, 0) / domainResults.length
        : 0;

    const governance = buildGovernance(mode, requiresApproval);

    const recommendedActions =
      mode !== 'observe'
        ? domainResults
            .filter((r) => r.confidence > 0.6)
            .map((r) => {
              const cfg = DOMAIN_REGISTRY[r.domain];
              const action = cfg?.actions[0];
              if (!action) return null;
              return {
                action: action.id,
                domain: r.domain,
                reason: `High-confidence finding in ${cfg?.displayName ?? r.domain}`,
                confidence: r.confidence,
                requires_approval: action.requires_approval,
              };
            })
            .filter(Boolean)
        : undefined;

    let actionTaken: string | null = null;

    if (recommendedActions && recommendedActions.length > 0) {
      const topRecommendation = recommendedActions[0];
      if (topRecommendation) {
        const actionRequiresApproval = topRecommendation.requires_approval ?? true;

        if (mode === 'act') {
          // act mode: execute non-approval actions directly; send approval-required
          // actions to the approval queue. Both branches are deterministic.
          if (actionRequiresApproval) {
            if (topRecommendation.confidence > 0.6) {
              submitPendingApprovalRequest({
                runId: queryId,
                stepId: `step_${queryId}_act`,
                stepName: `${topRecommendation.action} [PRAXIS v1 query — act mode]`,
                toolId: topRecommendation.action,
                action: `Execute "${topRecommendation.action}" in response to: ${input.slice(0, 100)}`,
                justification: topRecommendation.reason,
                projectedImpact: `Auto-recommended from PRAXIS v1 query with confidence ${(topRecommendation.confidence * 100).toFixed(0)}%`,
                projectedRisk: 'medium',
                requestedBy: (req.user as { displayName?: string } | undefined)?.displayName ?? 'nexus_v1_query',
                domain: topRecommendation.domain,
                surface: 'nexus_v1',
              });
              actionTaken = `queued:${topRecommendation.action}`;
              logger.info({ action: topRecommendation.action, mode }, 'PRAXIS v1 query: act mode — approval-required action queued');
            }
          } else {
            // Non-approval action in act mode: we cannot safely construct
            // structured params from free-form query text, so always route to
            // the approval queue. A human operator can supply the correct params
            // before the action is executed.
            if (topRecommendation.confidence > 0.6) {
              submitPendingApprovalRequest({
                runId: queryId,
                stepId: `step_${queryId}_act_nd`,
                stepName: `${topRecommendation.action} [PRAXIS v1 query — act mode]`,
                toolId: topRecommendation.action,
                action: `Execute "${topRecommendation.action}" in response to: ${input.slice(0, 100)}`,
                justification: topRecommendation.reason,
                projectedImpact: `Recommended with confidence ${(topRecommendation.confidence * 100).toFixed(0)}% — awaiting operator-supplied params`,
                projectedRisk: 'medium',
                requestedBy: (req.user as { displayName?: string } | undefined)?.displayName ?? 'nexus_v1_query',
                domain: topRecommendation.domain,
                surface: 'nexus_v1',
              });
              actionTaken = `queued:${topRecommendation.action}`;
              logger.info({ action: topRecommendation.action, mode }, 'PRAXIS v1 query: act mode — non-approval action queued (params must be supplied via /actions)');
            }
          }
        } else if (mode === 'auto') {
          // auto mode: execute only non-approval actions above a high confidence bar (>0.8).
          // Approval-required actions are intentionally skipped — human gate is mandatory.
          if (!actionRequiresApproval && topRecommendation.confidence > 0.8) {
            // auto mode: structured params cannot be reliably extracted from
            // free-form query text, so route to the approval queue even for
            // non-approval-flagged actions. A human operator supplies the
            // correct params before execution via /actions.
            submitPendingApprovalRequest({
              runId: queryId,
              stepId: `step_${queryId}_auto`,
              stepName: `${topRecommendation.action} [PRAXIS v1 query — auto mode]`,
              toolId: topRecommendation.action,
              action: `Execute "${topRecommendation.action}" in response to: ${input.slice(0, 100)}`,
              justification: topRecommendation.reason,
              projectedImpact: `Recommended with confidence ${(topRecommendation.confidence * 100).toFixed(0)}% — awaiting operator-supplied params`,
              projectedRisk: 'medium',
              requestedBy: (req.user as { displayName?: string } | undefined)?.displayName ?? 'nexus_v1_query',
              domain: topRecommendation.domain,
              surface: 'nexus_v1',
            });
            actionTaken = `queued:${topRecommendation.action}`;
            logger.info({ action: topRecommendation.action, mode }, 'PRAXIS v1 query: auto mode — action queued (params must be supplied via /actions)');
          }
        }
      }
    }

    const domainsForSession = [
      ...new Set([...(session.domainsTouched ?? []), ...selectedDomains]),
    ];
    const newEntry = {
      turn: (session.turnCount ?? 0) + 1,
      query: input.slice(0, 200),
      domains_consulted: selectedDomains,
      action_taken: actionTaken,
      timestamp: new Date().toISOString(),
    };

    await updateSession(session_id, {
      domainsTouched: domainsForSession,
      contextSummary: synthesisContent.slice(0, 500),
      decisionGraph: [...(session.decisionGraph ?? []), newEntry],
      turnCount: (session.turnCount ?? 0) + 1,
    });

    const responsePayload = {
      query_id: queryId,
      session_id,
      answer: synthesisContent,
      evidence: evidenceRefs,
      confidence: parseFloat(avgConfidence.toFixed(3)),
      domains_consulted: selectedDomains,
      tool_calls: [],
      governance,
      recommended_actions: recommendedActions ?? undefined,
      latency_ms: Date.now() - start,
      model: synthesisModel,
      created_at: new Date().toISOString(),
    };

    if (stream) {
      sseWrite(res, 'done', responsePayload);
      res.end();
    } else {
      res.json(responsePayload);
    }
  } catch (err) {
    logger.error({ err, queryId }, 'PRAXIS v1 query failed');
    if (res.headersSent) {
      sseWrite(res, 'error', { message: 'Query processing failed', code: 'NEXUS_QUERY_ERROR' });
      res.end();
    } else {
      handleRouteError(res, err, 'PRAXIS v1 query failed');
    }
  }
});

// ─── POST /nexus/v1/actions ───────────────────────────────────────────────────

router.post('/nexus/v1/actions', validateBody(NexusActionRequestSchema), async (req, res) => {
  const actionId = `act_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const start = Date.now();

  try {
    const body = req.body as NexusActionRequest;
    const { action, params, session_id, mode, dry_run } = body;

    const [domainKey, actionName] = action.split('.');
    const domainConfig = domainKey ? DOMAIN_REGISTRY[domainKey] : null;
    const actionDef = domainConfig?.actions.find(
      (a) => a.id === action || a.name.toLowerCase().replace(/\s+/g, '_') === actionName,
    );

    if (!domainConfig || !actionDef) {
      const availableActions = Object.entries(DOMAIN_REGISTRY).flatMap(([, cfg]) =>
        cfg.actions.map((a) => a.id),
      );
      res.status(400).json({
        error: `Unknown action: "${action}". Available actions: ${availableActions.join(', ')}`,
        code: 'UNKNOWN_ACTION',
        available_actions: availableActions,
      });
      return;
    }

    const requiresApproval = actionDef.requires_approval;
    const governance = buildGovernance(mode, requiresApproval);

    if (dry_run) {
      res.json({
        action_id: actionId,
        action,
        status: 'dry_run',
        result: {
          message: `Dry run: action "${action}" would be executed with provided params`,
          params,
          would_require_approval: requiresApproval,
          domain: domainKey,
          action_definition: actionDef,
        },
        approval_required: requiresApproval,
        approval_level: governance.approval_level,
        proof_chain_ref: null,
        audit_trail_id: governance.audit_trail_id,
        domain: domainKey ?? 'unknown',
        latency_ms: Date.now() - start,
        created_at: new Date().toISOString(),
      });
      return;
    }

    if (requiresApproval) {
      submitPendingApprovalRequest({
        runId: actionId,
        stepId: `step_${actionId}`,
        stepName: `${actionDef.name} [PRAXIS v1]`,
        toolId: action,
        action: `Execute "${actionDef.name}" in ${domainConfig.displayName}`,
        justification: `PRAXIS v1 action request${body.evidence_refs?.length ? ` — evidence: ${body.evidence_refs.join(', ')}` : ''}`,
        projectedImpact: `Domain action ${action} with params: ${JSON.stringify(params).slice(0, 200)}`,
        projectedRisk: 'high',
        requestedBy: (req.user as { displayName?: string } | undefined)?.displayName ?? 'nexus_v1_api',
        domain: domainKey ?? 'unknown',
        surface: 'nexus_v1',
      });

      res.json({
        action_id: actionId,
        action,
        status: 'pending_approval',
        result: null,
        approval_required: true,
        approval_level: governance.approval_level,
        proof_chain_ref: governance.proof_chain_ref,
        audit_trail_id: governance.audit_trail_id,
        domain: domainKey ?? 'unknown',
        latency_ms: Date.now() - start,
        created_at: new Date().toISOString(),
      });
      return;
    }

    if (session_id) {
      const session = await getSession(session_id);
      if (session) {
        const sessionAccess = assertSessionAccess(session, req);
        if (sessionAccess !== 'ok') {
          logger.warn({ action, session_id }, 'PRAXIS v1 action: session access denied, proceeding without session linkage');
        } else {
          await updateSession(session_id, {
            decisionGraph: [
              ...(session.decisionGraph ?? []),
              {
                turn: (session.turnCount ?? 0) + 1,
                query: `action: ${action}`,
                domains_consulted: [domainKey ?? 'unknown'],
                action_taken: action,
                timestamp: new Date().toISOString(),
              },
            ],
            turnCount: (session.turnCount ?? 0) + 1,
          });
        }
      }
    }

    const delegation = ACTION_DELEGATION_MAP[action];

    if (!delegation) {
      // No execution path exists yet — always route to approval queue as policy fallback.
      // This ensures governed actions with no direct delegation are never silently dropped.
      logger.info({ action, domain: domainKey }, 'PRAXIS v1: no delegation mapping — routing to approval queue');
      submitPendingApprovalRequest({
        runId: actionId,
        stepId: `step_${actionId}`,
        stepName: `${actionDef.name} [PRAXIS v1 — Pending Implementation]`,
        toolId: action,
        action: `Execute "${actionDef.name}" in ${domainConfig.displayName}`,
        justification: `PRAXIS v1 action requested with no server-side delegation path${body.evidence_refs?.length ? ` — evidence: ${body.evidence_refs.join(', ')}` : ''}`,
        projectedImpact: `Domain action ${action} with params: ${JSON.stringify(params).slice(0, 200)}`,
        projectedRisk: 'high',
        requestedBy: (req.user as { displayName?: string } | undefined)?.displayName ?? 'nexus_v1_api',
        domain: domainKey ?? 'unknown',
        surface: 'nexus_v1',
      });
      res.json({
        action_id: actionId,
        action,
        status: 'pending_approval',
        result: null,
        approval_required: true,
        approval_level: 'human_required',
        proof_chain_ref: governance.proof_chain_ref,
        audit_trail_id: governance.audit_trail_id,
        domain: domainKey ?? 'unknown',
        latency_ms: Date.now() - start,
        created_at: new Date().toISOString(),
      });
      return;
    }

    const callerCookie = req.headers['cookie'] as string | undefined;

    let delegationResult: { ok: boolean; status: number; data: unknown };
    try {
      delegationResult = await executeDomainDelegation(delegation, params, callerCookie);
      if (!delegationResult.ok) {
        logger.warn({ action, httpStatus: delegationResult.status, domain: domainKey }, 'PRAXIS v1 domain delegation returned non-2xx');
      }
    } catch (delegationErr) {
      logger.error({ action, err: delegationErr }, 'PRAXIS v1 domain delegation threw');
      res.status(502).json({
        error: `Domain endpoint for "${action}" is unreachable`,
        code: 'DOMAIN_DELEGATION_FAILED',
        action_id: actionId,
        domain: domainKey ?? 'unknown',
      });
      return;
    }

    const actionStatus = delegationResult.ok ? 'completed' : 'failed';

    res.json({
      action_id: actionId,
      action,
      status: actionStatus,
      result: delegationResult.data,
      approval_required: false,
      approval_level: null,
      proof_chain_ref: governance.proof_chain_ref,
      audit_trail_id: governance.audit_trail_id,
      domain: domainKey ?? 'unknown',
      latency_ms: Date.now() - start,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err, actionId }, 'PRAXIS v1 action failed');
    handleRouteError(res, err, 'PRAXIS v1 action failed');
  }
});

// ─── POST /nexus/v1/sessions ──────────────────────────────────────────────────

router.post('/nexus/v1/sessions', validateBody(CreateSessionSchema), async (req, res) => {
  try {
    const body = req.body as z.infer<typeof CreateSessionSchema>;
    const userId = req.user?.id;
    const orgId = body.org_id ?? req.user?.orgs?.[0]?.orgId;

    const session = await createSession({
      orgId,
      userId,
      contextSummary: body.context ?? '',
    });

    res.status(201).json({
      id: session.id,
      created_at: session.createdAt.toISOString(),
      updated_at: session.updatedAt.toISOString(),
      domains_touched: session.domainsTouched,
      context_summary: session.contextSummary,
      decision_graph: session.decisionGraph,
      turn_count: session.turnCount,
      org_id: session.orgId,
    });
  } catch (err) {
    logger.error({ err }, 'PRAXIS v1 create session failed');
    handleRouteError(res, err, 'Failed to create session');
  }
});

// ─── GET /nexus/v1/sessions/:id ──────────────────────────────────────────────

router.get('/nexus/v1/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const session = await getSession(id);

    if (!session) {
      sendNotFound(res, 'Session');
      return;
    }

    const access = assertSessionAccess(session, req);
    if (access === 'unauthorized') {
      res.status(401).json({ error: 'Authentication required to access this session', code: 'UNAUTHORIZED' });
      return;
    }
    if (access === 'forbidden') {
      res.status(403).json({ error: 'Access denied — session belongs to a different user or organization', code: 'FORBIDDEN' });
      return;
    }

    res.json({
      id: session.id,
      created_at: session.createdAt.toISOString(),
      updated_at: session.updatedAt.toISOString(),
      domains_touched: session.domainsTouched,
      context_summary: session.contextSummary,
      decision_graph: session.decisionGraph,
      turn_count: session.turnCount,
      org_id: session.orgId,
    });
  } catch (err) {
    logger.error({ err }, 'PRAXIS v1 get session failed');
    handleRouteError(res, err, 'Failed to retrieve session');
  }
});

// ─── GET /nexus/v1/capabilities ──────────────────────────────────────────────

router.get('/nexus/v1/capabilities', (_req, res) => {
  const domains = Object.entries(DOMAIN_REGISTRY).map(([key, cfg]) => ({
    domain: key,
    display_name: cfg.displayName,
    description: cfg.description,
    tools: cfg.tools,
    actions: cfg.actions,
    status: 'active' as const,
    autonomy_modes_supported: ['observe', 'advise', 'act', 'auto'] as const,
  }));

  res.json({
    protocol_version: '1.0.0',
    protocol_name: 'PRAXIS Unified Intelligence Protocol',
    description:
      'Single-endpoint API unifying all SZL business domains behind one conversational intelligence layer.',
    domains,
    autonomy_modes: ['observe', 'advise', 'act', 'auto'],
    session_ttl_seconds: 86400,
    streaming_supported: true,
    endpoints: {
      query: 'POST /api/nexus/v1/query',
      actions: 'POST /api/nexus/v1/actions',
      sessions_create: 'POST /api/nexus/v1/sessions',
      sessions_get: 'GET /api/nexus/v1/sessions/:id',
      capabilities: 'GET /api/nexus/v1/capabilities',
      openapi: 'GET /api/nexus/v1/openapi.json',
      playground: 'GET /api/nexus/v1/playground',
    },
    generated_at: new Date().toISOString(),
  });
});

// ─── GET /nexus/v1/openapi.json ───────────────────────────────────────────────

router.get('/nexus/v1/openapi.json', (_req, res) => {
  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'PRAXIS Unified Intelligence Protocol',
      version: '1.0.0',
      description:
        'Single-endpoint API unifying maritime, legal, real estate, cyber, executive intelligence, and governance behind one developer-facing protocol. Supports SSE streaming, cross-domain sessions, autonomy modes, and governed action execution.',
      contact: { name: 'SZL Holdings Platform', url: 'https://szl-holdings.com' },
    },
    servers: [{ url: '/api', description: 'SZL Holdings API Server' }],
    paths: {
      '/nexus/v1/query': {
        post: {
          operationId: 'nexusV1Query',
          summary: 'Cross-domain intelligence query',
          description:
            'Submit a natural language query. The protocol routes to relevant SZL domains in parallel, synthesizes evidence-backed intelligence, and returns a unified response with confidence scores and provenance. Supports SSE streaming.',
          tags: ['PRAXIS v1'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/QueryRequest' },
                examples: {
                  maritime_cyber: {
                    summary: 'Maritime + Cyber cross-domain query',
                    value: {
                      input: 'Are any of our vessels transiting high cyber-risk ports?',
                      mode: 'advise',
                      stream: false,
                      depth: 'standard',
                    },
                  },
                  streaming: {
                    summary: 'Streaming cross-domain query',
                    value: {
                      input: 'What legal risks does our current maritime exposure create?',
                      mode: 'observe',
                      stream: true,
                      depth: 'deep',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Unified intelligence response (or SSE stream when stream=true)',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/QueryResponse' } },
                'text/event-stream': {
                  schema: { type: 'string', description: 'Server-Sent Events stream' },
                },
              },
            },
            '400': { description: 'Invalid request' },
            '403': { description: 'Policy violation or insufficient permissions' },
            '429': { description: 'Rate limit or budget exceeded' },
          },
        },
      },
      '/nexus/v1/actions': {
        post: {
          operationId: 'nexusV1Action',
          summary: 'Execute a governed business action',
          description:
            'Execute a real business operation (reroute a vessel, flag a legal matter, trigger cyber containment) through the governance policy engine. Each action flows through the proof chain.',
          tags: ['PRAXIS v1'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ActionRequest' },
                examples: {
                  contain_threat: {
                    summary: 'Contain a cyber threat',
                    value: {
                      action: 'sentra.contain_threat',
                      params: { threat_id: 'THR-001', containment_level: 'isolate' },
                      mode: 'act',
                      dry_run: false,
                    },
                  },
                  dry_run: {
                    summary: 'Dry-run a vessel reroute',
                    value: {
                      action: 'vessels.reroute',
                      params: { vessel_id: 'IMO9876543', new_route: 'Cape of Good Hope', reason: 'Sanctions avoidance' },
                      mode: 'advise',
                      dry_run: true,
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Action result',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ActionResponse' } },
              },
            },
            '400': { description: 'Unknown action or invalid params' },
          },
        },
      },
      '/nexus/v1/sessions': {
        post: {
          operationId: 'nexusV1CreateSession',
          summary: 'Create a cross-domain session',
          description:
            'Create a new session that maintains cross-domain context across multiple queries. Sessions track which domains have been consulted, what evidence has been gathered, and what decisions have been made.',
          tags: ['PRAXIS v1'],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    org_id: { type: 'integer', description: 'Organization ID (optional)' },
                    context: { type: 'string', description: 'Initial context for the session' },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Session created',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/Session' } },
              },
            },
          },
        },
      },
      '/nexus/v1/sessions/{id}': {
        get: {
          operationId: 'nexusV1GetSession',
          summary: 'Retrieve a session',
          tags: ['PRAXIS v1'],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': {
              description: 'Session details',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/Session' } },
              },
            },
            '404': { description: 'Session not found' },
          },
        },
      },
      '/nexus/v1/capabilities': {
        get: {
          operationId: 'nexusV1Capabilities',
          summary: 'List available domains, tools, and actions',
          description: 'Self-describing capabilities manifest. Returns all available domains with their tools, actions, and supported autonomy modes.',
          tags: ['PRAXIS v1'],
          responses: {
            '200': { description: 'Capabilities manifest' },
          },
        },
      },
    },
    components: {
      schemas: {
        QueryRequest: {
          type: 'object',
          required: ['input'],
          properties: {
            input: { type: 'string', minLength: 1, maxLength: 8000, description: 'Natural language query' },
            mode: {
              type: 'string',
              enum: ['observe', 'advise', 'act', 'auto'],
              default: 'observe',
              description: 'Autonomy mode. observe=read-only, advise=intelligence+recommendations, act=execute with approval gates, auto=execute within policy bounds',
            },
            domains: {
              type: 'array',
              items: { type: 'string', enum: Object.keys(DOMAIN_REGISTRY) },
              description: 'Hint the router to specific domains. If omitted, the router auto-selects.',
            },
            stream: { type: 'boolean', default: false, description: 'Enable SSE streaming' },
            session_id: { type: 'string', description: 'Resume an existing session' },
            depth: {
              type: 'string',
              enum: ['shallow', 'standard', 'deep'],
              default: 'standard',
              description: 'Analysis depth. Affects latency and token usage.',
            },
            context: { type: 'string', description: 'Additional context injected into domain prompts' },
          },
        },
        QueryResponse: {
          type: 'object',
          properties: {
            query_id: { type: 'string' },
            session_id: { type: 'string' },
            answer: { type: 'string', description: 'Synthesized intelligence response' },
            evidence: { type: 'array', items: { $ref: '#/components/schemas/EvidenceRef' } },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            domains_consulted: { type: 'array', items: { type: 'string' } },
            tool_calls: { type: 'array' },
            governance: { $ref: '#/components/schemas/Governance' },
            recommended_actions: { type: 'array' },
            latency_ms: { type: 'number' },
            model: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        ActionRequest: {
          type: 'object',
          required: ['action'],
          properties: {
            action: { type: 'string', description: 'Action ID (e.g. vessels.reroute, sentra.contain_threat)' },
            params: { type: 'object', description: 'Action-specific parameters' },
            evidence_refs: { type: 'array', items: { type: 'string' }, description: 'Evidence IDs supporting this action' },
            session_id: { type: 'string', description: 'Link action to a session for audit trail' },
            mode: { type: 'string', enum: ['observe', 'advise', 'act', 'auto'], default: 'act' },
            dry_run: { type: 'boolean', default: false, description: 'Simulate the action without executing' },
          },
        },
        ActionResponse: {
          type: 'object',
          properties: {
            action_id: { type: 'string' },
            action: { type: 'string' },
            status: { type: 'string', enum: ['queued', 'pending_approval', 'executing', 'completed', 'failed', 'dry_run'] },
            result: {},
            approval_required: { type: 'boolean' },
            approval_level: { type: 'string', nullable: true },
            proof_chain_ref: { type: 'string', nullable: true },
            audit_trail_id: { type: 'string', nullable: true },
            domain: { type: 'string' },
            latency_ms: { type: 'number' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Session: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            domains_touched: { type: 'array', items: { type: 'string' } },
            context_summary: { type: 'string' },
            decision_graph: { type: 'array' },
            turn_count: { type: 'integer' },
            org_id: { type: 'integer', nullable: true },
          },
        },
        EvidenceRef: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            domain: { type: 'string' },
            type: { type: 'string' },
            summary: { type: 'string' },
            confidence: { type: 'number' },
            retrieved_at: { type: 'string', format: 'date-time' },
          },
        },
        Governance: {
          type: 'object',
          properties: {
            mode: { type: 'string' },
            approval_required: { type: 'boolean' },
            approval_level: { type: 'string', nullable: true },
            policy_checks_passed: { type: 'boolean' },
            proof_chain_ref: { type: 'string', nullable: true },
            audit_trail_id: { type: 'string', nullable: true },
          },
        },
      },
    },
    tags: [
      {
        name: 'PRAXIS v1',
        description: 'PRAXIS Unified Intelligence Protocol — single-endpoint API across all SZL domains',
      },
    ],
  };

  res.json(spec);
});

// ─── GET /nexus/v1/playground ─────────────────────────────────────────────────

router.get('/nexus/v1/playground', (_req, res) => {
  const domainOptions = Object.keys(DOMAIN_REGISTRY)
    .map((d) => `<option value="${d}">${DOMAIN_REGISTRY[d]?.displayName ?? d}</option>`)
    .join('\n');

  const allActions = Object.entries(DOMAIN_REGISTRY)
    .flatMap(([, cfg]) => cfg.actions.map((a) => ({ ...a, domain: cfg.displayName })))
    .map((a) => `<option value="${a.id}">[${a.domain}] ${a.name}</option>`)
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PRAXIS v1 — Developer Playground</title>
  <style>
    :root {
      --bg: #0a0e1a;
      --surface: #111827;
      --surface2: #1a2235;
      --border: #1e3a5f;
      --cyan: #00d4ff;
      --cyan-dim: #0099bb;
      --green: #00ff88;
      --amber: #ffb020;
      --red: #ff4455;
      --text: #e2e8f0;
      --text-dim: #94a3b8;
      --mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--text); font-family: var(--mono); font-size: 13px; min-height: 100vh; }
    header { background: var(--surface); border-bottom: 1px solid var(--border); padding: 12px 24px; display: flex; align-items: center; gap: 12px; }
    .logo { color: var(--cyan); font-size: 18px; font-weight: 700; letter-spacing: 0.1em; }
    .badge { background: var(--cyan); color: var(--bg); padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; }
    .subtitle { color: var(--text-dim); font-size: 11px; margin-left: auto; }
    main { display: grid; grid-template-columns: 1fr 1fr; gap: 0; height: calc(100vh - 53px); }
    .panel { padding: 20px; overflow-y: auto; }
    .panel-left { border-right: 1px solid var(--border); }
    section { margin-bottom: 24px; }
    .section-title { color: var(--cyan); font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
    .section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }
    label { display: block; color: var(--text-dim); font-size: 11px; margin-bottom: 4px; margin-top: 8px; }
    input, textarea, select { width: 100%; background: var(--surface2); border: 1px solid var(--border); color: var(--text); padding: 8px 10px; border-radius: 4px; font-family: var(--mono); font-size: 12px; outline: none; }
    input:focus-visible, textarea:focus-visible, select:focus-visible { border-color: var(--cyan-dim); outline: 3px solid var(--cyan-dim); outline-offset: 1px; }
    :focus-visible { outline: 3px solid var(--cyan-dim); outline-offset: 2px; border-radius: 2px; }
    .skip-link { position: absolute; top: -40px; left: 0; background: var(--cyan); color: var(--bg); padding: 8px 16px; border-radius: 0 0 4px 0; font-size: 12px; font-weight: 700; text-decoration: none; z-index: 9999; transition: top 0.15s; }
    .skip-link:focus { top: 0; }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; } }
    textarea { resize: vertical; min-height: 80px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .row3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
    .checkbox-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
    .checkbox-row input { width: auto; }
    .checkbox-row label { margin: 0; }
    .btn { padding: 10px 20px; border-radius: 4px; border: none; cursor: pointer; font-family: var(--mono); font-size: 12px; font-weight: 600; letter-spacing: 0.05em; transition: all 0.15s; }
    .btn-primary { background: var(--cyan); color: var(--bg); }
    .btn-primary:hover { background: var(--cyan-dim); }
    .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-secondary { background: transparent; color: var(--cyan); border: 1px solid var(--border); }
    .btn-secondary:hover { border-color: var(--cyan-dim); }
    .btn-row { display: flex; gap: 8px; margin-top: 12px; }
    .tabs { display: flex; border-bottom: 1px solid var(--border); margin-bottom: 16px; }
    .tab { padding: 8px 16px; cursor: pointer; color: var(--text-dim); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; border-bottom: 2px solid transparent; transition: all 0.15s; }
    .tab.active { color: var(--cyan); border-bottom-color: var(--cyan); }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .output-box { background: var(--surface2); border: 1px solid var(--border); border-radius: 4px; padding: 14px; min-height: 200px; overflow-y: auto; white-space: pre-wrap; font-size: 12px; line-height: 1.6; }
    .stream-event { margin-bottom: 8px; padding: 6px 10px; border-radius: 3px; border-left: 3px solid var(--border); }
    .stream-event.domain_start { border-color: var(--cyan); color: var(--cyan); }
    .stream-event.domain_result { border-color: var(--green); }
    .stream-event.synthesis_start { border-color: var(--amber); color: var(--amber); }
    .stream-event.synthesis_delta { border-color: var(--text-dim); }
    .stream-event.done { border-color: var(--green); color: var(--green); }
    .stream-event.error { border-color: var(--red); color: var(--red); }
    .confidence-bar { height: 3px; background: var(--border); border-radius: 2px; margin-top: 4px; }
    .confidence-fill { height: 100%; border-radius: 2px; background: var(--green); transition: width 0.3s; }
    .meta-row { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 10px; }
    .meta-chip { font-size: 10px; padding: 2px 8px; border-radius: 3px; background: var(--surface); border: 1px solid var(--border); color: var(--text-dim); }
    .meta-chip.domain { border-color: var(--cyan-dim); color: var(--cyan); }
    .spinner { display: inline-block; width: 12px; height: 12px; border: 2px solid var(--border); border-top-color: var(--cyan); border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--green); margin-right: 6px; animation: pulse 2s ease-in-out infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
    .capabilities-grid { display: grid; gap: 8px; }
    .cap-card { background: var(--surface2); border: 1px solid var(--border); border-radius: 4px; padding: 10px 12px; }
    .cap-domain { color: var(--cyan); font-size: 11px; font-weight: 700; margin-bottom: 4px; }
    .cap-desc { color: var(--text-dim); font-size: 11px; line-height: 1.5; }
    .cap-actions { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
    .cap-action-tag { font-size: 10px; padding: 1px 6px; border-radius: 3px; background: var(--surface); border: 1px solid var(--border); color: var(--text-dim); }
    a { color: var(--cyan); text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
<a href="#main-content" class="skip-link">Skip to main content</a>
<header role="banner">
  <span class="logo">PRAXIS</span>
  <span class="badge">v1</span>
  <span class="logo" style="font-size:13px;font-weight:400;color:var(--text-dim)">Unified Intelligence Protocol</span>
  <span class="subtitle"><span class="status-dot"></span>API operational · <a href="/api/nexus/v1/openapi.json" target="_blank">OpenAPI Spec</a> · <a href="/api/nexus/v1/capabilities" target="_blank">Capabilities</a></span>
</header>
<main id="main-content" tabindex="-1">
  <div class="panel panel-left">
    <div class="tabs" role="tablist" aria-label="PRAXIS sections">
      <div id="tab-btn-query" class="tab active" role="tab" aria-selected="true" aria-controls="tab-query" tabindex="0" onclick="switchTab('query')" onkeydown="if(event.key==='Enter'||event.key===' ')switchTab('query')">Query</div>
      <div id="tab-btn-actions" class="tab" role="tab" aria-selected="false" aria-controls="tab-actions" tabindex="-1" onclick="switchTab('actions')" onkeydown="if(event.key==='Enter'||event.key===' ')switchTab('actions')">Actions</div>
      <div id="tab-btn-capabilities" class="tab" role="tab" aria-selected="false" aria-controls="tab-capabilities" tabindex="-1" onclick="switchTab('capabilities')" onkeydown="if(event.key==='Enter'||event.key===' ')switchTab('capabilities')">Capabilities</div>
    </div>

    <!-- QUERY TAB -->
    <div class="tab-content active" id="tab-query" role="tabpanel" aria-labelledby="tab-btn-query">
      <section>
        <div class="section-title">Natural Language Query</div>
        <label>Input</label>
        <textarea id="q-input" placeholder="Ask anything across SZL domains, e.g.: 'Are any of our vessels transiting sanctioned ports? What legal exposure does that create?'" rows="4"></textarea>
        <div class="row" style="margin-top:8px">
          <div>
            <label>Autonomy Mode</label>
            <select id="q-mode">
              <option value="observe">observe — read-only intelligence</option>
              <option value="advise">advise — intelligence + recommendations</option>
              <option value="act">act — execute with approval gates</option>
              <option value="auto">auto — execute within policy bounds</option>
            </select>
          </div>
          <div>
            <label>Depth</label>
            <select id="q-depth">
              <option value="shallow">shallow — fast overview</option>
              <option value="standard" selected>standard</option>
              <option value="deep">deep — comprehensive</option>
            </select>
          </div>
        </div>
        <label>Domain Hints (optional — leave blank for auto-routing)</label>
        <select id="q-domains" multiple size="4" style="min-height:80px">
          ${domainOptions}
        </select>
        <label>Session ID (optional — leave blank to start new)</label>
        <input id="q-session" type="text" placeholder="sess_..." />
        <label>Additional Context (optional)</label>
        <textarea id="q-context" rows="2" placeholder="Extra context to inject into domain prompts..."></textarea>
        <div class="checkbox-row">
          <input type="checkbox" id="q-stream" />
          <label for="q-stream">Enable SSE streaming</label>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary" id="q-run-btn" onclick="runQuery()">Run Query</button>
          <button class="btn btn-secondary" onclick="clearOutput()">Clear</button>
        </div>
      </section>
    </div>

    <!-- ACTIONS TAB -->
    <div class="tab-content" id="tab-actions" role="tabpanel" aria-labelledby="tab-btn-actions" hidden>
      <section>
        <div class="section-title">Governed Business Action</div>
        <label>Action</label>
        <select id="a-action">
          ${allActions}
        </select>
        <label>Params (JSON)</label>
        <textarea id="a-params" rows="5" placeholder='{"vessel_id": "IMO9876543", "new_route": "Cape of Good Hope", "reason": "Sanctions avoidance"}'>{}</textarea>
        <label>Session ID (optional)</label>
        <input id="a-session" type="text" placeholder="sess_..." />
        <div class="row" style="margin-top:8px">
          <div>
            <label>Mode</label>
            <select id="a-mode">
              <option value="act">act</option>
              <option value="advise">advise</option>
              <option value="auto">auto</option>
            </select>
          </div>
          <div style="padding-top:20px">
            <div class="checkbox-row">
              <input type="checkbox" id="a-dry-run" />
              <label for="a-dry-run">Dry run</label>
            </div>
          </div>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary" id="a-run-btn" onclick="runAction()">Execute Action</button>
          <button class="btn btn-secondary" onclick="clearOutput()">Clear</button>
        </div>
      </section>
    </div>

    <!-- CAPABILITIES TAB -->
    <div class="tab-content" id="tab-capabilities" role="tabpanel" aria-labelledby="tab-btn-capabilities" hidden>
      <section>
        <div class="section-title">Available Domains & Actions</div>
        <div class="capabilities-grid" id="cap-grid">Loading...</div>
      </section>
    </div>
  </div>

  <div class="panel panel-right">
    <div class="section-title">Output</div>
    <div id="output" class="output-box">← Run a query or action to see results here.</div>
    <div class="meta-row" id="meta-row"></div>
  </div>
</main>

<script>
let currentTab = 'query';

function switchTab(tab) {
  document.querySelectorAll('[role="tab"]').forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
    t.setAttribute('tabindex', '-1');
  });
  document.querySelectorAll('[role="tabpanel"]').forEach(t => {
    t.classList.remove('active');
    t.hidden = true;
  });
  const activeTab = document.querySelector(\`[role="tab"][aria-controls="tab-\${tab}"]\`);
  if (activeTab) {
    activeTab.classList.add('active');
    activeTab.setAttribute('aria-selected', 'true');
    activeTab.setAttribute('tabindex', '0');
  }
  const panel = document.getElementById('tab-' + tab);
  if (panel) {
    panel.classList.add('active');
    panel.hidden = false;
  }
  currentTab = tab;
  if (tab === 'capabilities') loadCapabilities();
}

function clearOutput() {
  document.getElementById('output').innerHTML = '← Run a query or action to see results here.';
  document.getElementById('meta-row').innerHTML = '';
}

function showMeta(data) {
  const row = document.getElementById('meta-row');
  const chips = [];
  if (data.latency_ms) chips.push('<span class="meta-chip">⏱ ' + data.latency_ms + 'ms</span>');
  if (data.confidence !== undefined) chips.push('<span class="meta-chip">✓ confidence: ' + (data.confidence * 100).toFixed(1) + '%</span>');
  if (data.model) chips.push('<span class="meta-chip">model: ' + data.model + '</span>');
  if (data.domains_consulted?.length) data.domains_consulted.forEach(d => chips.push('<span class="meta-chip domain">⬡ ' + d + '</span>'));
  if (data.session_id) chips.push('<span class="meta-chip">session: ' + data.session_id + '</span>');
  row.innerHTML = chips.join('');
}

async function runQuery() {
  const btn = document.getElementById('q-run-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Processing…';
  const out = document.getElementById('output');
  out.innerHTML = '';

  const selectedDomains = [...document.getElementById('q-domains').selectedOptions].map(o => o.value);
  const stream = document.getElementById('q-stream').checked;

  const body = {
    input: document.getElementById('q-input').value,
    mode: document.getElementById('q-mode').value,
    depth: document.getElementById('q-depth').value,
    stream,
    ...(selectedDomains.length ? { domains: selectedDomains } : {}),
    ...(document.getElementById('q-session').value ? { session_id: document.getElementById('q-session').value } : {}),
    ...(document.getElementById('q-context').value ? { context: document.getElementById('q-context').value } : {}),
  };

  try {
    if (stream) {
      const resp = await fetch('/api/nexus/v1/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\\n\\n');
        buf = lines.pop() || '';
        for (const chunk of lines) {
          if (!chunk.trim()) continue;
          const eventMatch = chunk.match(/^event: (\\w+)/m);
          const dataMatch = chunk.match(/^data: (.+)/ms);
          if (!eventMatch || !dataMatch) continue;
          const ev = eventMatch[1];
          let data;
          try { data = JSON.parse(dataMatch[1]); } catch { continue; }
          const div = document.createElement('div');
          div.className = 'stream-event ' + ev;
          if (ev === 'domain_start') div.textContent = '▶ Querying domain: ' + data.domain;
          else if (ev === 'domain_result') div.textContent = '[' + data.domain + '] confidence=' + (data.confidence * 100).toFixed(0) + '%  ' + (data.content?.slice(0, 120) + '…');
          else if (ev === 'synthesis_start') div.textContent = '⟳ Synthesizing ' + data.domains_count + ' domain(s)…';
          else if (ev === 'synthesis_delta') div.textContent = data.delta;
          else if (ev === 'done') { div.textContent = '✓ Complete'; showMeta(data); }
          else if (ev === 'error') div.textContent = '✗ Error: ' + data.message;
          else div.textContent = JSON.stringify(data);
          out.appendChild(div);
          out.scrollTop = out.scrollHeight;
        }
      }
    } else {
      const resp = await fetch('/api/nexus/v1/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      out.textContent = JSON.stringify(data, null, 2);
      showMeta(data);
    }
  } catch (e) {
    out.textContent = 'Error: ' + e.message;
  }
  btn.disabled = false;
  btn.textContent = 'Run Query';
}

async function runAction() {
  const btn = document.getElementById('a-run-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Executing…';
  const out = document.getElementById('output');
  out.innerHTML = '';

  let params = {};
  try { params = JSON.parse(document.getElementById('a-params').value || '{}'); }
  catch { out.textContent = 'Invalid JSON in params field'; btn.disabled = false; btn.textContent = 'Execute Action'; return; }

  const body = {
    action: document.getElementById('a-action').value,
    params,
    mode: document.getElementById('a-mode').value,
    dry_run: document.getElementById('a-dry-run').checked,
    ...(document.getElementById('a-session').value ? { session_id: document.getElementById('a-session').value } : {}),
  };

  try {
    const resp = await fetch('/api/nexus/v1/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    out.textContent = JSON.stringify(data, null, 2);
    showMeta(data);
  } catch (e) {
    out.textContent = 'Error: ' + e.message;
  }
  btn.disabled = false;
  btn.textContent = 'Execute Action';
}

async function loadCapabilities() {
  const grid = document.getElementById('cap-grid');
  try {
    const resp = await fetch('/api/nexus/v1/capabilities');
    const data = await resp.json();
    grid.innerHTML = data.domains.map(d => \`
      <div class="cap-card">
        <div class="cap-domain">⬡ \${d.display_name}</div>
        <div class="cap-desc">\${d.description}</div>
        <div class="cap-actions">
          \${d.actions.map(a => \`<span class="cap-action-tag">\${a.id}\${a.requires_approval ? ' 🔒' : ''}</span>\`).join('')}
        </div>
      </div>
    \`).join('');
  } catch (e) {
    grid.textContent = 'Failed to load capabilities: ' + e.message;
  }
}

// Load sample query
document.getElementById('q-input').value = 'Are any of our vessels transiting sanctioned ports? What legal and cyber exposure does that create?';
</script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

export default router;
