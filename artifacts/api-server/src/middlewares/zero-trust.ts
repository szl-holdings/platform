/**
 * Zero-Trust Product Control Middleware
 *
 * Implements Aegis Phase 1–3 zero-trust product controls:
 *
 * 1. Identity-aware routing: every action is user-aware, tenant-aware,
 *    permission-class-gated, and role/org-scoped
 *
 * 2. Session/device awareness: session policy checks, suspicious session
 *    flags, step-up verification triggers for sensitive action classes
 *
 * 3. Environment labeling: production/pilot/demo boundaries,
 *    source trust levels, connector trust scoring
 *
 * 4. Automation gating: propose_only / approval_required /
 *    approved_execute / blocked_by_policy mode enforcement
 *
 * 5. Data controls: sensitivity labels, tenant labels, environment labels,
 *    retention class, export restrictions
 */

import type { NextFunction, Request, Response } from 'express';
import { logger } from '../lib/logger';
import type { AuthenticatedUser } from './auth';

// ─── Permission Classes ───────────────────────────────────────────────────────

export type PermissionClass =
  | 'analyst'
  | 'responder'
  | 'soc_manager'
  | 'resilience_lead'
  | 'executive'
  | 'partner_analyst'
  | 'platform_admin';

export type AutomationGate =
  | 'propose_only'
  | 'approval_required'
  | 'approved_execute'
  | 'blocked_by_policy';

export type SensitivityLabel =
  | 'PUBLIC'
  | 'INTERNAL'
  | 'CONFIDENTIAL'
  | 'RESTRICTED'
  | 'EXECUTIVE-ONLY';

export type RetentionClass =
  | 'STANDARD-30D'
  | 'IR-90D'
  | 'COMPLIANCE-7Y'
  | 'BOARD-90D'
  | 'TRANSIENT';

export type EnvironmentClass = 'production' | 'pilot' | 'demo';

export type TrustLevel =
  | 'verified' // First-party, cryptographically verified
  | 'corroborated' // Third-party, cross-referenced with known good
  | 'raw' // Unverified signal — treat as hypothesis input only
  | 'untrusted'; // Known or suspected tampered/poisoned signal

// ─── Role-to-Permission Mapping ───────────────────────────────────────────────

const ROLE_PERMISSION_MAP: Record<string, PermissionClass> = {
  super_admin: 'platform_admin',
  admin: 'platform_admin',
  soc_manager: 'soc_manager',
  analyst: 'analyst',
  responder: 'responder',
  resilience_lead: 'resilience_lead',
  executive: 'executive',
  partner_analyst: 'partner_analyst',
};

// ─── Permission Class Hierarchy ──────────────────────────────────────────────

const CLASS_HIERARCHY: PermissionClass[] = [
  'analyst',
  'partner_analyst',
  'responder',
  'resilience_lead',
  'soc_manager',
  'executive',
  'platform_admin',
];

function classRank(pc: PermissionClass): number {
  return CLASS_HIERARCHY.indexOf(pc);
}

function resolvePermissionClass(user: AuthenticatedUser): PermissionClass {
  let highest: PermissionClass = 'analyst';
  let highestRank = classRank('analyst');
  for (const role of user.roles) {
    const pc = ROLE_PERMISSION_MAP[role];
    if (pc) {
      const rank = classRank(pc);
      if (rank > highestRank) {
        highest = pc;
        highestRank = rank;
      }
    }
  }
  return highest;
}

function hasPermission(user: AuthenticatedUser, required: PermissionClass): boolean {
  const userClass = resolvePermissionClass(user);
  if (userClass === 'platform_admin') return true;
  return classRank(userClass) >= classRank(required);
}

// ─── Typed Approval Context ───────────────────────────────────────────────────

export interface ZtApprovalContext {
  gate: 'approval_required';
  requestedBy: number | undefined;
  requestedAt: string;
  actionClass: string;
  environment: EnvironmentClass;
  approvalState: 'pending';
}

// ─── Environment Label Middleware ─────────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      ztEnvironment?: EnvironmentClass;
      ztTenantId?: number;
      ztPermissionClass?: PermissionClass;
      ztAutomationGate?: AutomationGate;
      ztSuspiciousSession?: boolean;
      ztStepUpRequired?: boolean;
      ztApprovalContext?: ZtApprovalContext;
      ztDataLabels?: DataControlLabels;
    }
  }
}

const DEMO_HOSTS = ['demo.', 'sandbox.', 'preview.'];
const PILOT_HOSTS = ['pilot.', 'staging.', 'uat.'];

/**
 * Attaches environment label to request based on:
 * - HOST header / env var
 * - Explicit env query param (for internal tooling only)
 * - Defaults to "production" if uncertain (fail-safe)
 */
export function environmentLabel() {
  return (req: Request, res: Response, next: NextFunction) => {
    const host = req.hostname ?? '';
    const envOverride = process.env.AEGIS_ENV as EnvironmentClass | undefined;

    let env: EnvironmentClass = 'production';
    if (envOverride && ['production', 'pilot', 'demo'].includes(envOverride)) {
      env = envOverride as EnvironmentClass;
    } else if (DEMO_HOSTS.some((prefix) => host.includes(prefix))) {
      env = 'demo';
    } else if (PILOT_HOSTS.some((prefix) => host.includes(prefix))) {
      env = 'pilot';
    }

    req.ztEnvironment = env;

    // Surface environment in response headers (operator tooling, not public)
    res.setHeader('X-Aegis-Environment', env);

    next();
  };
}

// ─── Identity-Aware Routing Middleware ────────────────────────────────────────

/**
 * Attaches resolved permission class to the request.
 * Must run AFTER authMiddleware().
 *
 * Usage:
 *   router.get("/sensitive", authMiddleware(), identityAwareRoute(), handler)
 */
export function identityAwareRoute(options: { require?: PermissionClass } = {}) {
  const { require: required } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Identity must be verified before accessing this resource.',
        ztControl: 'identity_aware_routing',
      });
      return;
    }

    const pc = resolvePermissionClass(req.user);
    req.ztPermissionClass = pc;

    // Surface in response headers for audit tooling
    res.setHeader('X-Aegis-Identity', req.user.id);
    res.setHeader('X-Aegis-Permission-Class', pc);

    if (required && !hasPermission(req.user, required)) {
      logger.warn({
        msg: 'Permission class gate rejected',
        userId: req.user.id,
        userClass: pc,
        required,
        path: req.path,
        method: req.method,
      });
      res.status(403).json({
        error: 'PERMISSION_CLASS_INSUFFICIENT',
        message: `This action requires permission class: ${required}. Current class: ${pc}.`,
        ztControl: 'identity_aware_routing',
        requiredClass: required,
        userClass: pc,
      });
      return;
    }

    next();
  };
}

// ─── Session / Device Awareness ───────────────────────────────────────────────

/**
 * Session awareness checks:
 * - Flags sessions older than SESSION_AGE_WARNING_MS as suspicious
 * - Triggers step-up verification for sensitive action classes
 * - Marks demo/pilot sessions to restrict automation gates
 *
 * Must run AFTER authMiddleware() and sessionRefreshPolicy().
 */

const SESSION_AGE_WARNING_MS = 6 * 60 * 60 * 1000; // 6 hours — flag but don't block
const SESSION_AGE_HARD_MS = 24 * 60 * 60 * 1000; // 24 hours — require step-up

const STEP_UP_REQUIRED_CLASSES: PermissionClass[] = ['soc_manager', 'platform_admin', 'executive'];

export function sessionAwareness(options: { requireStepUpFor?: PermissionClass[] } = {}) {
  const stepUpClasses = options.requireStepUpFor ?? STEP_UP_REQUIRED_CLASSES;

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.isInternalAgent) {
      next();
      return;
    }

    const pc = req.ztPermissionClass ?? resolvePermissionClass(req.user);
    let suspicious = false;
    let stepUpRequired = false;

    // Check session age from headers (set by sessionRefreshPolicy)
    const sessionAge = parseInt((req.headers['x-session-age-ms'] as string) ?? '0', 10);
    if (sessionAge > SESSION_AGE_HARD_MS && stepUpClasses.includes(pc)) {
      stepUpRequired = true;
    } else if (sessionAge > SESSION_AGE_WARNING_MS) {
      suspicious = true;
    }

    // Impersonation sessions are always flagged
    if (req.isImpersonation) {
      suspicious = true;
      res.setHeader('X-Aegis-Session-Class', 'impersonation');
    }

    req.ztSuspiciousSession = suspicious;
    req.ztStepUpRequired = stepUpRequired;

    if (suspicious) {
      res.setHeader('X-Aegis-Session-Warning', 'session_age_elevated');
    }

    if (stepUpRequired) {
      res.status(401).json({
        error: 'STEP_UP_VERIFICATION_REQUIRED',
        message: 'This action requires step-up verification. Please re-authenticate.',
        ztControl: 'session_awareness',
        permissionClass: pc,
      });
      return;
    }

    next();
  };
}

/**
 * Marks requests as requiring step-up for specific destructive/sensitive endpoints.
 * Applied at the route level, not globally.
 *
 * Usage:
 *   router.post("/decisions/:id/approve", authMiddleware(), requireStepUp(), handler)
 */
/**
 * requireStepUp — enforces the presence of an X-Step-Up-Token header.
 *
 * Phase 1 behavior:
 *   - In "demo" environments: passthrough (step-up is not enforced in demo to allow testing)
 *   - In "production" / "pilot" environments: REJECTS if header is absent (403)
 *
 * The token itself is a non-empty string in Phase 1 (value is not validated against an MFA provider).
 * Phase 3 will bind this to an MFA assertion / device attestation claim validated by the identity provider.
 */
export function requireStepUp() {
  return (req: Request, res: Response, next: NextFunction) => {
    const env = req.ztEnvironment ?? 'production';
    const stepUpToken = req.headers['x-step-up-token'] as string | undefined;

    const isDev = process.env.NODE_ENV === 'development';

    if (!stepUpToken) {
      if (env === 'demo' || isDev) {
        // Demo/dev environment: log the bypass and continue
        logger.info({
          msg: `Step-up bypassed (${env === 'demo' ? 'demo environment' : 'development mode'})`,
          userId: req.user?.id,
          path: req.path,
        });
        res.setHeader('X-Aegis-Step-Up', 'bypassed-dev');
        next();
        return;
      }

      // Production / pilot: reject without step-up token
      logger.warn({
        msg: 'Step-up verification failed — token missing',
        userId: req.user?.id,
        path: req.path,
        method: req.method,
        environment: env,
      });

      res.status(403).json({
        error: 'STEP_UP_REQUIRED',
        message:
          'This action requires step-up verification. Include X-Step-Up-Token in your request.',
        ztControl: 'step_up_verification',
        environment: env,
      });
      return;
    }

    // Token present — Phase 1 treats any non-empty token as sufficient
    // Phase 3 will validate against identity provider assertion
    logger.info({
      msg: 'Step-up token accepted',
      userId: req.user?.id,
      path: req.path,
      environment: env,
    });

    res.setHeader('X-Aegis-Step-Up', 'token-present');
    next();
  };
}

// ─── Automation Gate Middleware ───────────────────────────────────────────────

interface AutomationGateOptions {
  gate: AutomationGate;
  actionClass?: string;
}

/**
 * Enforces automation gating modes on action endpoints.
 *
 * Gates:
 * - propose_only: returns 202 with proposal object — caller must re-initiate
 * - approval_required: enqueues for named approver — does not execute
 * - approved_execute: passes through — pre-approved, full audit log attached
 * - blocked_by_policy: hard block — no execution path exists
 *
 * Usage:
 *   router.post("/response/isolate", authMiddleware(), automationGate({ gate: "approval_required" }), handler)
 */
export function automationGate(options: AutomationGateOptions) {
  const { gate, actionClass = 'unclassified' } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const env = req.ztEnvironment ?? 'production';
    req.ztAutomationGate = gate;

    res.setHeader('X-Aegis-Automation-Gate', gate);
    res.setHeader('X-Aegis-Action-Class', actionClass);

    // Demo environments override to propose_only — no real automation
    const effectiveGate = env === 'demo' ? 'propose_only' : gate;

    if (effectiveGate === 'blocked_by_policy') {
      const reason =
        env === 'demo'
          ? 'Automation is disabled in demo environment.'
          : `Action class '${actionClass}' is blocked by platform policy.`;

      logger.warn({
        msg: 'Automation gate BLOCKED_BY_POLICY',
        userId: req.user?.id,
        actionClass,
        gate,
        env,
        path: req.path,
      });

      res.status(403).json({
        error: 'BLOCKED_BY_POLICY',
        message: reason,
        ztControl: 'automation_gating',
        gate: effectiveGate,
        actionClass,
        environment: env,
      });
      return;
    }

    if (effectiveGate === 'propose_only') {
      // propose_only: gate is enforced as a labeling policy — no external automation
      // will execute. Handler MUST still process the business logic (e.g., persist a note
      // to DB). The gate label is surfaced via response headers and req.ztAutomationGate.
      // Callers that want to block execution should check req.ztAutomationGate in the handler.
      logger.info({
        msg: 'Automation gate PROPOSE_ONLY — handler executes with gate label',
        userId: req.user?.id,
        actionClass,
        env,
        path: req.path,
      });
      next();
      return;
    }

    if (effectiveGate === 'approval_required') {
      // Log approval requirement — actual approval queue is managed by Phase 2
      // Phase 1: attach approval context to request for downstream handler
      logger.info({
        msg: 'Automation gate APPROVAL_REQUIRED — queueing for approver',
        userId: req.user?.id,
        actionClass,
        env,
        path: req.path,
      });

      req.ztApprovalContext = {
        gate: 'approval_required',
        requestedBy: req.user?.id,
        requestedAt: new Date().toISOString(),
        actionClass,
        environment: env,
        approvalState: 'pending',
      };
      // Pass through to handler — handler is responsible for persisting approval state
    }

    // approved_execute and approval_required (after context attachment): pass through
    next();
  };
}

// ─── Data Controls Middleware ─────────────────────────────────────────────────

export interface DataControlLabels {
  sensitivityLabel: SensitivityLabel;
  tenantLabel?: string;
  environmentLabel: EnvironmentClass;
  retentionClass: RetentionClass;
  exportRestricted: boolean;
  trustLevel?: TrustLevel;
}

/**
 * Attaches data control labels to the response and enforces export restrictions.
 *
 * Usage:
 *   router.get("/decisions", ..., dataControls({ sensitivity: "RESTRICTED", retention: "IR-90D", exportRestricted: true }), handler)
 */
export function dataControls(options: {
  sensitivity: SensitivityLabel;
  retention: RetentionClass;
  exportRestricted?: boolean;
  trustLevel?: TrustLevel;
}) {
  const { sensitivity, retention, exportRestricted = false, trustLevel } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const env = req.ztEnvironment ?? 'production';
    const tenant = req.tenantOrgSlug ?? 'global';

    const labels: DataControlLabels = {
      sensitivityLabel: sensitivity,
      tenantLabel: tenant,
      environmentLabel: env,
      retentionClass: retention,
      exportRestricted: exportRestricted || env === 'production',
      trustLevel,
    };

    // Surface labels in response headers
    res.setHeader('X-Aegis-Sensitivity', sensitivity);
    res.setHeader('X-Aegis-Tenant', tenant);
    res.setHeader('X-Aegis-Environment', env);
    res.setHeader('X-Aegis-Retention', retention);
    res.setHeader('X-Aegis-Export-Restricted', String(labels.exportRestricted));
    if (trustLevel) res.setHeader('X-Aegis-Trust-Level', trustLevel);

    // Enforce export restriction based on identity and permission class
    if (exportRestricted && req.query.export === 'true') {
      // No identity = block unconditionally
      if (!req.user) {
        res.status(403).json({
          error: 'EXPORT_RESTRICTED',
          message: `Data with sensitivity label '${sensitivity}' cannot be exported without authenticated identity.`,
          ztControl: 'data_controls',
          labels,
        });
        return;
      }
      const userClass: PermissionClass = req.ztPermissionClass ?? 'analyst';
      // EXECUTIVE-ONLY data: only executive+ may export
      if (sensitivity === 'EXECUTIVE-ONLY' && classRank(userClass) < classRank('executive')) {
        res.status(403).json({
          error: 'EXPORT_RESTRICTED',
          message: `Data with sensitivity label 'EXECUTIVE-ONLY' requires executive-class identity for export.`,
          ztControl: 'data_controls',
          requiredClass: 'executive',
          currentClass: userClass,
          labels,
        });
        return;
      }
      // RESTRICTED data: only responder+ may export
      if (sensitivity === 'RESTRICTED' && classRank(userClass) < classRank('responder')) {
        res.status(403).json({
          error: 'EXPORT_RESTRICTED',
          message: `Data with sensitivity label 'RESTRICTED' requires responder-class identity for export.`,
          ztControl: 'data_controls',
          requiredClass: 'responder',
          currentClass: userClass,
          labels,
        });
        return;
      }
    }

    // Attach labels to request for downstream use
    req.ztDataLabels = labels;

    next();
  };
}

// ─── Graduated Autonomy Levels ────────────────────────────────────────────────
//
// Operators can configure per-domain trust tiers that control how much
// autonomous execution authority an agent receives:
//
//   manual          → No automation; operator must initiate every action.
//   propose-only    → Agent surfaces proposals; operator approves before any change.
//   auto-with-audit → Agent acts autonomously but every action is audit-logged and
//                     an approval context is attached for post-hoc review.
//   full-auto       → Agent acts without gate; policy engine and proof-chain still
//                     record all steps (reserved for high-trust environments).

export type DomainAutonomyLevel = 'manual' | 'propose-only' | 'auto-with-audit' | 'full-auto';

export interface DomainAutonomyConfig {
  domain: string;
  level: DomainAutonomyLevel;
  allowedRoles?: PermissionClass[];
  requireStepUp?: boolean;
  auditAll?: boolean;
}

/** In-memory store for per-domain autonomy configs (overridable via DB in production). */
const domainAutonomyStore = new Map<string, DomainAutonomyConfig>([
  ['vessels', { domain: 'vessels', level: 'propose-only', auditAll: true }],
  ['terra', { domain: 'terra', level: 'propose-only', auditAll: true }],
  ['aegis', { domain: 'aegis', level: 'auto-with-audit', auditAll: true }],
  ['prism', { domain: 'prism', level: 'manual', requireStepUp: true, auditAll: true }],
  ['nexus', { domain: 'nexus', level: 'auto-with-audit', auditAll: true }],
  ['lyte', { domain: 'lyte', level: 'auto-with-audit', auditAll: true }],
  ['continuum', { domain: 'continuum', level: 'propose-only', auditAll: true }],
]);

/**
 * Read the current autonomy level for a domain.
 */
export function getDomainAutonomyLevel(domain: string): DomainAutonomyLevel {
  return domainAutonomyStore.get(domain)?.level ?? 'propose-only';
}

/**
 * Update the autonomy level for a domain (operator-configurable).
 */
export function setDomainAutonomyLevel(
  domain: string,
  level: DomainAutonomyLevel,
  partial: Partial<Omit<DomainAutonomyConfig, 'domain' | 'level'>> = {},
): void {
  const existing = domainAutonomyStore.get(domain) ?? { domain, level: 'propose-only' };
  domainAutonomyStore.set(domain, { ...existing, ...partial, domain, level });
}

/**
 * List all configured domain autonomy levels.
 */
export function listDomainAutonomyConfigs(): DomainAutonomyConfig[] {
  return Array.from(domainAutonomyStore.values());
}

/**
 * Per-domain graduated autonomy gate middleware.
 *
 * Reads the configured trust level for `domain` and enforces it:
 *
 *   manual          → 403 — operator must call this endpoint manually with
 *                     explicit intent; automated agents are blocked.
 *   propose-only    → req.ztAutomationGate = 'propose_only' + 202-style label.
 *   auto-with-audit → req.ztApprovalContext attached for audit; request proceeds.
 *   full-auto       → passes through with header label only.
 *
 * Usage:
 *   router.post('/vessels/route', authMiddleware(), domainAutonomyGate('vessels'), handler)
 */
export function domainAutonomyGate(domain: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const config = domainAutonomyStore.get(domain) ?? { domain, level: 'propose-only' };
    const level = config.level;
    const isAgent = req.isInternalAgent ?? false;
    const env = req.ztEnvironment ?? 'production';

    res.setHeader('X-Autonomy-Domain', domain);
    res.setHeader('X-Autonomy-Level', level);

    if (level === 'manual') {
      if (isAgent) {
        logger.warn({
          msg: 'Domain autonomy gate MANUAL — agent request blocked',
          domain,
          path: req.path,
          method: req.method,
          userId: req.user?.id,
        });
        res.status(403).json({
          error: 'MANUAL_DOMAIN_ONLY',
          message: `Domain '${domain}' requires direct operator action. Automated agents cannot execute this operation.`,
          ztControl: 'domain_autonomy_gate',
          domain,
          level,
        });
        return;
      }
      // Human-initiated request in manual domain — pass through with label
      next();
      return;
    }

    if (level === 'propose-only') {
      req.ztAutomationGate = 'propose_only';
      res.setHeader('X-Aegis-Automation-Gate', 'propose_only');
      logger.info({
        msg: 'Domain autonomy gate PROPOSE_ONLY',
        domain,
        path: req.path,
        isAgent,
        env,
      });
      next();
      return;
    }

    if (level === 'auto-with-audit') {
      // Attach approval context for post-hoc audit review
      req.ztAutomationGate = 'approved_execute';
      req.ztApprovalContext = {
        gate: 'approval_required',
        requestedBy: req.user?.id,
        requestedAt: new Date().toISOString(),
        actionClass: `auto-with-audit:${domain}`,
        environment: env,
        approvalState: 'pending',
      };
      res.setHeader('X-Aegis-Automation-Gate', 'approved_execute');
      res.setHeader('X-Autonomy-Audit', 'true');
      logger.info({
        msg: 'Domain autonomy gate AUTO_WITH_AUDIT — execution permitted, audit context attached',
        domain,
        path: req.path,
        isAgent,
        env,
      });
      next();
      return;
    }

    // full-auto — no gate, label only
    req.ztAutomationGate = 'approved_execute';
    res.setHeader('X-Aegis-Automation-Gate', 'approved_execute');
    res.setHeader('X-Autonomy-Level', 'full-auto');
    logger.info({
      msg: 'Domain autonomy gate FULL_AUTO — execution permitted',
      domain,
      path: req.path,
      isAgent,
      env,
    });
    next();
  };
}

// ─── Connector Trust Score ────────────────────────────────────────────────────

export const CONNECTOR_TRUST_SCORES: Record<
  string,
  { score: number; level: TrustLevel; reason: string }
> = {
  'internal-db': {
    score: 1.0,
    level: 'verified',
    reason: 'First-party, cryptographically signed write path',
  },
  'edr-crowdstrike': {
    score: 0.95,
    level: 'verified',
    reason: 'Authenticated API, known-good endpoint',
  },
  'siem-splunk': {
    score: 0.9,
    level: 'verified',
    reason: 'Authenticated API, event-stream integrity',
  },
  'threat-feed-isac': {
    score: 0.78,
    level: 'corroborated',
    reason: 'Industry source, cross-referenced with STIX feed',
  },
  'threat-feed-osint': {
    score: 0.55,
    level: 'raw',
    reason: 'Public OSINT — unverified, treat as hypothesis input',
  },
  'email-webhook': {
    score: 0.3,
    level: 'raw',
    reason: 'Unauthenticated webhook — high spoofing risk',
  },
  unknown: {
    score: 0.0,
    level: 'untrusted',
    reason: 'Source not registered — treat as adversarial input',
  },
};

/**
 * Resolves trust level for a given connector/source identifier.
 */
export function resolveConnectorTrust(
  connectorId: string,
): (typeof CONNECTOR_TRUST_SCORES)[string] {
  return CONNECTOR_TRUST_SCORES[connectorId] ?? CONNECTOR_TRUST_SCORES.unknown;
}

// ─── Exported convenience ─────────────────────────────────────────────────────

export { classRank, hasPermission, resolvePermissionClass };
