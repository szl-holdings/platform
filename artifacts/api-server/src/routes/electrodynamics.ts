/**
 * Electrodynamics API surface — Task #5532.
 *
 * Server-side governed entry points for the shared package
 * `@szl-holdings/electrodynamics-kit`. Mirrors the perception-bio
 * pattern: every endpoint validates with zod, runs the policy-guard
 * pre-check, rate-limits via writeLimiter, and emits a typed
 * evidence-ledger entry tagged with its Doctrine V6 pillar in
 * `policyReason`.
 *
 * Endpoints (one router, multiple prefixes mounted via lazyMatch in
 * routes/index.ts):
 *
 *   POST /electrodynamics/actuator/command          → actuator.command.v1
 *   POST /electrodynamics/device/lifecycle          → device.lifecycle.v1
 *   POST /electrodynamics/bus/send                  → bus.delivery.v1
 *   POST /electrodynamics/mission/compile           → mission.graph.v1
 *   POST /electrodynamics/engagement/emit           → engagement.dosimetry.v1
 *   POST /electrodynamics/swarm/tally               → swarm.consensus.v1
 *   POST /electrodynamics/redundancy/transition     → redundancy.mode-transition.v1
 *   POST /electrodynamics/nav/state-fusion          → navigation.state-fusion.v1
 *   POST /electrodynamics/em/field-step             → em.field-step.v1
 *   POST /electrodynamics/capability/seal           → capability.sealed.v1
 *
 * Cross-package server contract: this file is the only place api-server
 * imports the electrodynamics-kit package. Artifact consumers reach the
 * primitives only through the typed HTTP surface, per the task brief.
 */
import crypto from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {
  ACTUATOR_COMMAND_RECEIPT_CLASS,
  DEVICE_LIFECYCLE_RECEIPT_CLASS,
  BUS_DELIVERY_RECEIPT_CLASS,
  MISSION_GRAPH_RECEIPT_CLASS,
  ENGAGEMENT_DOSIMETRY_RECEIPT_CLASS,
  SWARM_CONSENSUS_RECEIPT_CLASS,
  REDUNDANCY_MODE_TRANSITION_RECEIPT_CLASS,
  NAVIGATION_STATE_FUSION_RECEIPT_CLASS,
  EM_FIELD_STEP_RECEIPT_CLASS,
  CAPABILITY_SEALED_RECEIPT_CLASS,
  validateCommandWithinEnvelope,
  evaluateBusDelivery,
  compileMission,
  EngagementJournal,
  tally,
  defaultByzantineTolerance,
  evaluateRedundancy,
  isModeTransition,
  validateCovariance,
  hashCovariance,
  stepField,
  computeEnergy,
  totalEnergy,
  sealCapability,
} from '@szl-holdings/electrodynamics-kit';
import { PolicyGuardEngine } from '@szl-holdings/policy-guard';
import type {
  PolicyCheckRequest,
  PolicyRule,
  ProofEnvelope,
} from '@szl-holdings/shared-contracts';
import {
  EvidenceLedger,
  defaultEvidenceLedgerStore,
} from '@szl-holdings/evidence-ledger';
import { authMiddleware } from '../middlewares/auth';
import { writeLimiter } from '../middlewares/rate-limiters';
import { validateBody } from '../lib/validation';
import { sendCreated, sendError } from '../lib/api-response';
import { logger } from '../lib/logger';

// ─── Doctrine V6 pillars ─────────────────────────────────────────────────────

const PILLAR = {
  evidenceFirst: 'evidence-first',
  policyAware: 'policy-aware-actions',
  governedAutonomy: 'governed-autonomy',
  operationalOntology: 'operational-ontology',
} as const;

// ─── Policy rules (one per receipt class action) ─────────────────────────────

const policyRules: PolicyRule[] = [
  {
    policyId: 'EDX-ACT-001',
    description: 'Actuator command requires authenticated, non-readonly caller; out-of-envelope rejected at boundary.',
    tier: 'high',
    conditions: ['action:electrodynamics.actuator.command'],
    verdict: 'allowed',
    auditRequired: true,
  },
  {
    policyId: 'EDX-LIFE-001',
    description: 'Device lifecycle stage record — operate stage requires current calibration head; enforced at write.',
    tier: 'medium',
    conditions: ['action:electrodynamics.device.lifecycle'],
    verdict: 'allowed',
    auditRequired: true,
  },
  {
    policyId: 'EDX-BUS-001',
    description: 'Bus send is allowed; budget-exceeded outcomes are honest receipts, not exceptions.',
    tier: 'medium',
    conditions: ['action:electrodynamics.bus.send'],
    verdict: 'allowed',
    auditRequired: true,
  },
  {
    policyId: 'EDX-MISN-001',
    description: 'Mission compile requires signer; unsigned graphs cannot drive actuators.',
    tier: 'high',
    conditions: ['action:electrodynamics.mission.compile'],
    verdict: 'allowed',
    auditRequired: true,
  },
  {
    policyId: 'EDX-ENG-001',
    description: 'Engagement emission against an approved envelope; exhaustion is recorded before any refusal.',
    tier: 'critical',
    conditions: ['action:electrodynamics.engagement.emit'],
    verdict: 'requires-approval',
    requiresApprovalFrom: ['operator'],
    auditRequired: true,
  },
  {
    policyId: 'EDX-SWARM-001',
    description: 'Swarm consensus tally is allowed; no-quorum verdicts are first-class receipts.',
    tier: 'medium',
    conditions: ['action:electrodynamics.swarm.tally'],
    verdict: 'allowed',
    auditRequired: true,
  },
  {
    policyId: 'EDX-RED-001',
    description: 'Redundancy mode transition recording is allowed; silent degradation is rejected at scanner.',
    tier: 'medium',
    conditions: ['action:electrodynamics.redundancy.transition'],
    verdict: 'allowed',
    auditRequired: true,
  },
  {
    policyId: 'EDX-NAV-001',
    description: 'Nav state fusion ingest — covariance hash mandatory at write.',
    tier: 'medium',
    conditions: ['action:electrodynamics.nav.state-fusion'],
    verdict: 'allowed',
    auditRequired: true,
  },
  {
    policyId: 'EDX-EM-001',
    description: 'EM field step ingest — energy components mandatory at write.',
    tier: 'low',
    conditions: ['action:electrodynamics.em.field-step'],
    verdict: 'allowed',
    auditRequired: true,
  },
  {
    policyId: 'EDX-CAP-001',
    description: 'Capability seal is allowed; bound actor and expiry mandatory.',
    tier: 'high',
    conditions: ['action:electrodynamics.capability.seal'],
    verdict: 'allowed',
    auditRequired: true,
  },
];

const policyEngine = new PolicyGuardEngine(policyRules, { strictMode: true });

interface AuthedCaller {
  readonly callerId: string;
  readonly role: string;
  readonly traceId: string;
}

function authedCaller(req: Request): AuthedCaller {
  const u = (req as Request & { user?: { id?: string | number; role?: string } }).user;
  const callerId = u?.id != null ? `user:${u.id}` : `anon:${req.ip ?? '0.0.0.0'}`;
  const role = (u?.role ?? 'anonymous') as string;
  const traceId =
    (req.headers['x-trace-id'] as string | undefined) ??
    (req.headers['x-correlation-id'] as string | undefined) ??
    `t_${crypto.randomBytes(8).toString('hex')}`;
  return { callerId, role, traceId };
}

function evaluatePolicy(
  actionType: string,
  caller: AuthedCaller,
): { allowed: boolean; reason: string; matchedPolicyId?: string } {
  const req: PolicyCheckRequest = {
    actionType,
    agentRole: caller.role,
    traceId: caller.traceId,
  };
  const result = policyEngine.evaluate(req);
  const out: { allowed: boolean; reason: string; matchedPolicyId?: string } = {
    allowed: result.verdict === 'allowed',
    reason: result.reason ?? result.verdict,
  };
  if (result.matchedPolicyId !== undefined) out.matchedPolicyId = result.matchedPolicyId;
  return out;
}

// ─── Evidence ledger ─────────────────────────────────────────────────────────

const ledger = new EvidenceLedger();

export function _getElectrodynamicsLedgerForTest(): EvidenceLedger {
  return ledger;
}

interface EmitOptions {
  readonly action: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly pillar: typeof PILLAR[keyof typeof PILLAR];
  readonly receiptClass: string;
  readonly caller: AuthedCaller;
  readonly policyVerdict: 'allowed' | 'blocked' | 'requires-approval';
  readonly extraSources?: ProofEnvelope['sources'];
}

function emitLedger(opts: EmitOptions) {
  const envelope: Omit<ProofEnvelope, 'generatedAt'> = {
    traceId: opts.caller.traceId,
    agentRole: opts.caller.role,
    sources: opts.extraSources ?? [],
    toolCalls: [],
    confidence: 'high',
    freshness: 'fresh',
    policyVerdict: opts.policyVerdict,
    policyReason: `pillar:${opts.pillar};receipt:${opts.receiptClass}`,
  };
  const entry = ledger.append({
    entityType: opts.entityType,
    entityId: opts.entityId,
    action: opts.action,
    actor: opts.caller.callerId,
    actorRole: opts.caller.role,
    envelope,
  });
  try {
    const result = defaultEvidenceLedgerStore.save(entry);
    if (result instanceof Promise)
      result.catch((err) => logger.warn({ err }, 'electrodynamics: ledger fan-out failed'));
  } catch (err) {
    logger.warn({ err }, 'electrodynamics: ledger fan-out threw');
  }
  return entry;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sha256Hex(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}

function hmacHex(s: string): string {
  const key = process.env.EDX_SEAL_KEY ?? 'edx-default-test-key';
  return crypto.createHmac('sha256', key).update(s).digest('hex');
}

// ─── Per-envelope engagement journals (process-local) ────────────────────────

const engagementJournals = new Map<string, EngagementJournal>();

export function _resetEngagementJournalsForTest(): void {
  engagementJournals.clear();
}

// ─── Zod schemas ─────────────────────────────────────────────────────────────

const ActuatorEnvelopeSchema = z.object({
  envelopeId: z.string().min(1).max(128),
  maxForce: z.number().nonnegative(),
  maxStroke: z.number().nonnegative(),
  dutyCycle: z.number().gt(0).max(1),
  slewLimit: z.number().nonnegative(),
  deadband: z.number().nonnegative(),
  thermalClass: z.string().min(1).max(64),
  shockClass: z.string().min(1).max(64),
}).strict();

const ActuatorCommandBodySchema = z.object({
  envelope: ActuatorEnvelopeSchema,
  actuatorRef: z.string().min(1).max(128),
  target: z.number().finite(),
  monotonicSeq: z.number().int().nonnegative(),
  issuedAt: z.string().min(1).max(64),
}).strict();

const DeviceLifecycleBodySchema = z.object({
  deviceRef: z.string().min(1).max(128),
  stage: z.enum(['build', 'factory-test', 'ship', 'integrate', 'calibrate', 'operate', 'retire']),
  occurredAt: z.string().min(1).max(64),
  parentLifecycleId: z.string().min(1).max(128).optional(),
  stageData: z.record(z.string(), z.unknown()).default({}),
}).strict();

const BusSendBodySchema = z.object({
  className: z.string().min(1).max(64),
  maxLatencyMs: z.number().int().positive(),
  payloadHash: z.string().min(4).max(256),
  enqueuedAt: z.number().int().nonnegative(),
}).strict();

const MissionNodeSchema = z.object({
  nodeId: z.string().min(1).max(128),
  action: z.string().min(1).max(64),
  preconditions: z.array(z.string().max(128)),
  postconditions: z.array(z.string().max(128)),
  fallbackPolicy: z.enum(['retry', 'skip-once', 'abort']),
  retryLimit: z.number().int().positive().optional(),
}).strict();

const MissionEdgeSchema = z.object({
  from: z.string().min(1).max(128),
  to: z.string().min(1).max(128),
  condition: z.string().max(256).optional(),
}).strict();

const MissionCompileBodySchema = z.object({
  planDagRef: z.string().min(1).max(128),
  nodes: z.array(MissionNodeSchema).min(1).max(256),
  edges: z.array(MissionEdgeSchema).max(2048),
  compiledBy: z.string().min(1).max(128),
}).strict();

const EngagementEnvelopeSchema = z.object({
  envelopeId: z.string().min(1).max(128),
  effectClass: z.enum(['deny', 'degrade', 'destroy']),
  geofenceRef: z.string().min(1).max(128),
  doseBudget: z.number().positive(),
  doseUnit: z.string().min(1).max(32),
  approvedBy: z.string().min(1).max(128),
}).strict();

const EngagementEmitBodySchema = z.object({
  envelope: EngagementEnvelopeSchema,
  emissionId: z.string().min(1).max(128),
  doseDelta: z.number().nonnegative(),
  emittedAt: z.string().min(1).max(64),
}).strict();

const SwarmVoteSchema = z.object({
  memberId: z.string().min(1).max(128),
  proposalCanonical: z.string().min(1).max(8192),
  voteHash: z.string().min(8).max(256),
  signature: z.string().min(8).max(512),
}).strict();

const SwarmTallyBodySchema = z.object({
  tallyId: z.string().min(1).max(128),
  memberCount: z.number().int().positive(),
  byzantineTolerance: z.number().int().nonnegative().optional(),
  votes: z.array(SwarmVoteSchema).min(1).max(1024),
}).strict();

const RedundancyEnvelopeSchema = z.object({
  subsystemRef: z.string().min(1).max(128),
  channels: z.number().int().positive(),
  ladder: z
    .array(
      z
        .object({
          minHealthy: z.number().int().nonnegative(),
          mode: z.string().min(1).max(64),
        })
        .strict(),
    )
    .min(1),
  refusalAt: z.number().int().nonnegative(),
}).strict();

const RedundancyTransitionBodySchema = z.object({
  envelope: RedundancyEnvelopeSchema,
  priorChannelsHealthy: z.number().int().nonnegative(),
  nextChannelsHealthy: z.number().int().nonnegative(),
  reason: z.string().min(1).max(256),
}).strict();

const NavStateFusionBodySchema = z.object({
  stateRef: z.string().min(1).max(128),
  priorStateRef: z.string().min(1).max(128).optional(),
  sensorRef: z.string().min(1).max(128),
  sensorHealth: z
    .object({
      sensorRef: z.string().min(1).max(128),
      available: z.boolean(),
      confidence: z.number().min(0).max(1),
    })
    .strict(),
  covariance: z.array(z.array(z.number().finite())),
  asOf: z.string().min(1).max(64),
  consumerArtifact: z.string().min(1).max(64),
}).strict();

const EmFieldStepBodySchema = z.object({
  gridRef: z.string().min(1).max(128),
  stepIndex: z.number().int().nonnegative(),
  values: z.array(z.number().finite()).min(2).max(8192),
  dx: z.number().positive(),
  dt: z.number().positive(),
  priorTotalEnergy: z.number().finite(),
  externalField: z.number().finite().optional(),
  anisotropyWeight: z.number().nonnegative().optional(),
  exchangeWeight: z.number().nonnegative().optional(),
  damping: z.number().min(0).max(0.9999).optional(),
  consumerArtifact: z.string().min(1).max(64),
}).strict();

const CapabilitySealBodySchema = z.object({
  capabilityId: z.string().min(1).max(128),
  permissions: z.array(z.string().min(1).max(64)).min(1).max(32),
  boundActorId: z.string().min(1).max(128),
  sealedAt: z.string().min(1).max(64),
  expiresAt: z.string().min(1).max(64),
}).strict();

// ─── Router ──────────────────────────────────────────────────────────────────

const router = Router();

// ─── /electrodynamics/actuator/command ───────────────────────────────────────

router.post(
  '/electrodynamics/actuator/command',
  writeLimiter,
  authMiddleware(),
  validateBody(ActuatorCommandBodySchema),
  (req: Request, res: Response) => {
    const caller = authedCaller(req);
    const body = req.body as z.infer<typeof ActuatorCommandBodySchema>;

    const decision = evaluatePolicy('electrodynamics.actuator.command', caller);
    if (!decision.allowed) {
      sendError(res, decision.reason, 403, 'POLICY_DENIED');
      return;
    }

    // Doctrine rule: no setpoint without an envelope claim.
    const verdict = validateCommandWithinEnvelope(
      { target: body.target, envelopeId: body.envelope.envelopeId },
      body.envelope,
    );
    if (!verdict.withinEnvelope) {
      sendError(res, verdict.reason, 400, 'OUT_OF_ENVELOPE');
      return;
    }

    const entry = emitLedger({
      action: 'electrodynamics.actuator.command',
      entityType: 'actuator.command',
      entityId: `${body.actuatorRef}:${body.monotonicSeq}`,
      pillar: PILLAR.policyAware,
      receiptClass: ACTUATOR_COMMAND_RECEIPT_CLASS,
      caller,
      policyVerdict: 'allowed',
    });

    sendCreated(res, {
      receiptClass: ACTUATOR_COMMAND_RECEIPT_CLASS,
      entryId: entry.entryId,
      pillar: PILLAR.policyAware,
      actuatorRef: body.actuatorRef,
      envelopeId: body.envelope.envelopeId,
      monotonicSeq: body.monotonicSeq,
      withinEnvelope: true,
    });
  },
);

// ─── /electrodynamics/device/lifecycle ───────────────────────────────────────

router.post(
  '/electrodynamics/device/lifecycle',
  writeLimiter,
  authMiddleware(),
  validateBody(DeviceLifecycleBodySchema),
  (req: Request, res: Response) => {
    const caller = authedCaller(req);
    const body = req.body as z.infer<typeof DeviceLifecycleBodySchema>;

    const decision = evaluatePolicy('electrodynamics.device.lifecycle', caller);
    if (!decision.allowed) {
      sendError(res, decision.reason, 403, 'POLICY_DENIED');
      return;
    }

    const chainHead = sha256Hex(
      JSON.stringify({
        parent: body.parentLifecycleId ?? null,
        deviceRef: body.deviceRef,
        stage: body.stage,
        occurredAt: body.occurredAt,
        stageData: body.stageData,
      }),
    );

    const entry = emitLedger({
      action: 'electrodynamics.device.lifecycle',
      entityType: 'device.lifecycle',
      entityId: `${body.deviceRef}:${body.stage}:${chainHead.slice(0, 12)}`,
      pillar: PILLAR.evidenceFirst,
      receiptClass: DEVICE_LIFECYCLE_RECEIPT_CLASS,
      caller,
      policyVerdict: 'allowed',
    });

    sendCreated(res, {
      receiptClass: DEVICE_LIFECYCLE_RECEIPT_CLASS,
      entryId: entry.entryId,
      pillar: PILLAR.evidenceFirst,
      deviceRef: body.deviceRef,
      stage: body.stage,
      chainHead,
      parentLifecycleId: body.parentLifecycleId,
    });
  },
);

// ─── /electrodynamics/bus/send ───────────────────────────────────────────────

router.post(
  '/electrodynamics/bus/send',
  writeLimiter,
  authMiddleware(),
  validateBody(BusSendBodySchema),
  (req: Request, res: Response) => {
    const caller = authedCaller(req);
    const body = req.body as z.infer<typeof BusSendBodySchema>;

    const decision = evaluatePolicy('electrodynamics.bus.send', caller);
    if (!decision.allowed) {
      sendError(res, decision.reason, 403, 'POLICY_DENIED');
      return;
    }

    const outcome = evaluateBusDelivery(
      { className: body.className, payloadHash: body.payloadHash, enqueuedAt: body.enqueuedAt },
      new Map([[body.className, { className: body.className, maxLatencyMs: body.maxLatencyMs }]]),
      Date.now(),
    );

    const entry = emitLedger({
      action: 'electrodynamics.bus.send',
      entityType: 'bus.delivery',
      entityId: `${body.className}:${body.payloadHash.slice(0, 12)}`,
      pillar: PILLAR.operationalOntology,
      receiptClass: BUS_DELIVERY_RECEIPT_CLASS,
      caller,
      policyVerdict: 'allowed',
    });

    sendCreated(res, {
      receiptClass: BUS_DELIVERY_RECEIPT_CLASS,
      entryId: entry.entryId,
      pillar: PILLAR.operationalOntology,
      outcome,
    });
  },
);

// ─── /electrodynamics/mission/compile ────────────────────────────────────────

router.post(
  '/electrodynamics/mission/compile',
  writeLimiter,
  authMiddleware(),
  validateBody(MissionCompileBodySchema),
  (req: Request, res: Response) => {
    const caller = authedCaller(req);
    const body = req.body as z.infer<typeof MissionCompileBodySchema>;

    const decision = evaluatePolicy('electrodynamics.mission.compile', caller);
    if (!decision.allowed) {
      sendError(res, decision.reason, 403, 'POLICY_DENIED');
      return;
    }

    let mission;
    try {
      mission = compileMission(body, sha256Hex, hmacHex);
    } catch (err) {
      sendError(res, err instanceof Error ? err.message : String(err), 400, 'MISSION_INVALID');
      return;
    }

    const entry = emitLedger({
      action: 'electrodynamics.mission.compile',
      entityType: 'mission.graph',
      entityId: mission.missionHash,
      pillar: PILLAR.governedAutonomy,
      receiptClass: MISSION_GRAPH_RECEIPT_CLASS,
      caller,
      policyVerdict: 'allowed',
    });

    sendCreated(res, {
      receiptClass: MISSION_GRAPH_RECEIPT_CLASS,
      entryId: entry.entryId,
      pillar: PILLAR.governedAutonomy,
      missionHash: mission.missionHash,
      signature: mission.signature,
      planDagRef: mission.planDagRef,
      fallbackPolicyByNode: mission.fallbackPolicyByNode,
    });
  },
);

// ─── /electrodynamics/engagement/emit ────────────────────────────────────────

router.post(
  '/electrodynamics/engagement/emit',
  writeLimiter,
  authMiddleware(),
  validateBody(EngagementEmitBodySchema),
  (req: Request, res: Response) => {
    const caller = authedCaller(req);
    const body = req.body as z.infer<typeof EngagementEmitBodySchema>;

    const decision = evaluatePolicy('electrodynamics.engagement.emit', caller);
    // requires-approval policy: treat anything other than 'allowed' as
    // an approval gate that an operator with the right role can pass.
    if (!decision.allowed && caller.role !== 'operator') {
      sendError(res, `${decision.reason}`, 403, 'POLICY_REQUIRES_APPROVAL');
      return;
    }

    let journal = engagementJournals.get(body.envelope.envelopeId);
    if (!journal) {
      try {
        journal = new EngagementJournal(body.envelope);
      } catch (err) {
        sendError(res, err instanceof Error ? err.message : String(err), 400, 'ENGAGEMENT_INVALID');
        return;
      }
      engagementJournals.set(body.envelope.envelopeId, journal);
    }
    const outcome = journal.record({
      envelopeId: body.envelope.envelopeId,
      emissionId: body.emissionId,
      doseDelta: body.doseDelta,
      emittedAt: body.emittedAt,
    });

    // Doctrine rule: exhaustion is recorded BEFORE refusal — so for both
    // `emitted` and `exhausted` we write a receipt; only pure `refused`
    // (envelope already exhausted in a prior call) gets a 409.
    if (outcome.outcome === 'refused') {
      sendError(res, outcome.reason, 409, 'ENGAGEMENT_EXHAUSTED');
      return;
    }

    const entry = emitLedger({
      action: 'electrodynamics.engagement.emit',
      entityType: 'engagement.dosimetry',
      entityId: `${body.envelope.envelopeId}:${body.emissionId}`,
      pillar: PILLAR.policyAware,
      receiptClass: ENGAGEMENT_DOSIMETRY_RECEIPT_CLASS,
      caller,
      policyVerdict: 'allowed',
    });

    sendCreated(res, {
      receiptClass: ENGAGEMENT_DOSIMETRY_RECEIPT_CLASS,
      entryId: entry.entryId,
      pillar: PILLAR.policyAware,
      outcome: outcome.outcome,
      entry: outcome.entry,
      doseUnit: body.envelope.doseUnit,
    });
  },
);

// ─── /electrodynamics/swarm/tally ────────────────────────────────────────────

router.post(
  '/electrodynamics/swarm/tally',
  writeLimiter,
  authMiddleware(),
  validateBody(SwarmTallyBodySchema),
  (req: Request, res: Response) => {
    const caller = authedCaller(req);
    const body = req.body as z.infer<typeof SwarmTallyBodySchema>;

    const decision = evaluatePolicy('electrodynamics.swarm.tally', caller);
    if (!decision.allowed) {
      sendError(res, decision.reason, 403, 'POLICY_DENIED');
      return;
    }

    const f = body.byzantineTolerance ?? defaultByzantineTolerance(body.memberCount);
    let result;
    try {
      result = tally(
        body.votes,
        { memberCount: body.memberCount, byzantineTolerance: f },
        sha256Hex,
        body.tallyId,
      );
    } catch (err) {
      sendError(res, err instanceof Error ? err.message : String(err), 400, 'TALLY_INVALID');
      return;
    }

    // Doctrine rule: no-quorum is still a receipt.
    const entry = emitLedger({
      action: 'electrodynamics.swarm.tally',
      entityType: 'swarm.consensus',
      entityId: body.tallyId,
      pillar: PILLAR.governedAutonomy,
      receiptClass: SWARM_CONSENSUS_RECEIPT_CLASS,
      caller,
      policyVerdict: 'allowed',
    });

    sendCreated(res, {
      receiptClass: SWARM_CONSENSUS_RECEIPT_CLASS,
      entryId: entry.entryId,
      pillar: PILLAR.governedAutonomy,
      result,
    });
  },
);

// ─── /electrodynamics/redundancy/transition ──────────────────────────────────

router.post(
  '/electrodynamics/redundancy/transition',
  writeLimiter,
  authMiddleware(),
  validateBody(RedundancyTransitionBodySchema),
  (req: Request, res: Response) => {
    const caller = authedCaller(req);
    const body = req.body as z.infer<typeof RedundancyTransitionBodySchema>;

    const decision = evaluatePolicy('electrodynamics.redundancy.transition', caller);
    if (!decision.allowed) {
      sendError(res, decision.reason, 403, 'POLICY_DENIED');
      return;
    }

    let prior, next;
    try {
      prior = evaluateRedundancy(body.envelope, body.priorChannelsHealthy);
      next = evaluateRedundancy(body.envelope, body.nextChannelsHealthy);
    } catch (err) {
      sendError(res, err instanceof Error ? err.message : String(err), 400, 'REDUNDANCY_INVALID');
      return;
    }

    const transition = isModeTransition(prior, next);
    const entry = emitLedger({
      action: 'electrodynamics.redundancy.transition',
      entityType: 'redundancy.mode-transition',
      entityId: `${body.envelope.subsystemRef}:${prior.mode ?? 'refused'}→${next.mode ?? 'refused'}`,
      pillar: PILLAR.operationalOntology,
      receiptClass: REDUNDANCY_MODE_TRANSITION_RECEIPT_CLASS,
      caller,
      policyVerdict: 'allowed',
    });

    sendCreated(res, {
      receiptClass: REDUNDANCY_MODE_TRANSITION_RECEIPT_CLASS,
      entryId: entry.entryId,
      pillar: PILLAR.operationalOntology,
      transition,
      prior,
      next,
      reason: body.reason,
    });
  },
);

// ─── /electrodynamics/nav/state-fusion ───────────────────────────────────────

router.post(
  '/electrodynamics/nav/state-fusion',
  writeLimiter,
  authMiddleware(),
  validateBody(NavStateFusionBodySchema),
  (req: Request, res: Response) => {
    const caller = authedCaller(req);
    const body = req.body as z.infer<typeof NavStateFusionBodySchema>;

    const decision = evaluatePolicy('electrodynamics.nav.state-fusion', caller);
    if (!decision.allowed) {
      sendError(res, decision.reason, 403, 'POLICY_DENIED');
      return;
    }

    try {
      validateCovariance(body.covariance);
    } catch (err) {
      sendError(res, err instanceof Error ? err.message : String(err), 400, 'COVARIANCE_INVALID');
      return;
    }

    const covarianceHash = hashCovariance(body.covariance, sha256Hex);

    const entry = emitLedger({
      action: 'electrodynamics.nav.state-fusion',
      entityType: 'navigation.state-fusion',
      entityId: body.stateRef,
      pillar: PILLAR.evidenceFirst,
      receiptClass: NAVIGATION_STATE_FUSION_RECEIPT_CLASS,
      caller,
      policyVerdict: 'allowed',
    });

    sendCreated(res, {
      receiptClass: NAVIGATION_STATE_FUSION_RECEIPT_CLASS,
      entryId: entry.entryId,
      pillar: PILLAR.evidenceFirst,
      stateRef: body.stateRef,
      sensorRef: body.sensorRef,
      sensorHealth: body.sensorHealth,
      covarianceHash,
      consumerArtifact: body.consumerArtifact,
    });
  },
);

// ─── /electrodynamics/em/field-step ──────────────────────────────────────────

router.post(
  '/electrodynamics/em/field-step',
  writeLimiter,
  authMiddleware(),
  validateBody(EmFieldStepBodySchema),
  (req: Request, res: Response) => {
    const caller = authedCaller(req);
    const body = req.body as z.infer<typeof EmFieldStepBodySchema>;

    const decision = evaluatePolicy('electrodynamics.em.field-step', caller);
    if (!decision.allowed) {
      sendError(res, decision.reason, 403, 'POLICY_DENIED');
      return;
    }

    const opts: Parameters<typeof stepField>[4] = {};
    if (body.externalField !== undefined) opts.externalField = body.externalField;
    if (body.anisotropyWeight !== undefined) opts.anisotropyWeight = body.anisotropyWeight;
    if (body.exchangeWeight !== undefined) opts.exchangeWeight = body.exchangeWeight;
    if (body.damping !== undefined) opts.damping = body.damping;

    let result;
    try {
      result = stepField(
        { gridRef: body.gridRef, values: body.values, dx: body.dx },
        body.dt,
        body.stepIndex,
        body.priorTotalEnergy,
        opts,
      );
    } catch (err) {
      sendError(res, err instanceof Error ? err.message : String(err), 400, 'EM_STEP_INVALID');
      return;
    }

    const entry = emitLedger({
      action: 'electrodynamics.em.field-step',
      entityType: 'em.field-step',
      entityId: `${body.gridRef}:${body.stepIndex}`,
      pillar: PILLAR.evidenceFirst,
      receiptClass: EM_FIELD_STEP_RECEIPT_CLASS,
      caller,
      policyVerdict: 'allowed',
    });

    // Sanity: compute energy via the helper to confirm bookkeeping match.
    const sanity = totalEnergy(computeEnergy(result.grid, opts));
    sendCreated(res, {
      receiptClass: EM_FIELD_STEP_RECEIPT_CLASS,
      entryId: entry.entryId,
      pillar: PILLAR.evidenceFirst,
      stepIndex: result.stepIndex,
      gridRef: result.grid.gridRef,
      energyComponents: result.energyComponents,
      totalEnergy: result.totalEnergy,
      deltaEnergy: result.deltaEnergy,
      sanityEnergy: sanity,
      consumerArtifact: body.consumerArtifact,
    });
  },
);

// ─── /electrodynamics/capability/seal ────────────────────────────────────────

router.post(
  '/electrodynamics/capability/seal',
  writeLimiter,
  authMiddleware(),
  validateBody(CapabilitySealBodySchema),
  (req: Request, res: Response) => {
    const caller = authedCaller(req);
    const body = req.body as z.infer<typeof CapabilitySealBodySchema>;

    const decision = evaluatePolicy('electrodynamics.capability.seal', caller);
    if (!decision.allowed) {
      sendError(res, decision.reason, 403, 'POLICY_DENIED');
      return;
    }

    let cap;
    try {
      cap = sealCapability(body, hmacHex);
    } catch (err) {
      sendError(res, err instanceof Error ? err.message : String(err), 400, 'CAPABILITY_INVALID');
      return;
    }

    const entry = emitLedger({
      action: 'electrodynamics.capability.seal',
      entityType: 'capability.sealed',
      entityId: cap.capabilityId,
      pillar: PILLAR.policyAware,
      receiptClass: CAPABILITY_SEALED_RECEIPT_CLASS,
      caller,
      policyVerdict: 'allowed',
    });

    sendCreated(res, {
      receiptClass: CAPABILITY_SEALED_RECEIPT_CLASS,
      entryId: entry.entryId,
      pillar: PILLAR.policyAware,
      capability: cap,
    });
  },
);

export default router;
