import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import {
  seedDemoWorkers,
  memoryWrite,
  EventPlane,
  createProofChain,
  checkOutputConstraints,
  decideCortexRoute,
} from '../a11oy/cognitive/index.js';
import {
  dbInsertWorker,
  dbInsertRouteDecision,
  dbInsertRuntimeEvent,
  dbInsertProofChain,
  dbInsertGuardrailRejection,
  dbInsertDeployment,
  dbInsertMemoryEvent,
} from '@szl-holdings/db';

const DEMO_TENANT = 'tenant-demo';
const DOMAIN = 'a11oy-cognitive';

function sha256(s: string) {
  return createHash('sha256').update(s).digest('hex').slice(0, 16);
}

function mkId(prefix: string) {
  return `${prefix}-${randomUUID().replace(/-/g, '').slice(0, 10)}`;
}

function ts(offsetMs = 0) {
  return new Date(Date.now() - offsetMs);
}

export async function seedA11oyCognitive(): Promise<void> {
  try {
    // -----------------------------------------------------------------------
    // 1. Workers — seed in-memory registry AND persist to DB
    // -----------------------------------------------------------------------
    const workers = seedDemoWorkers(DEMO_TENANT);

    for (const w of workers) {
      await dbInsertWorker({
        workerId: w.workerId,
        tenantId: w.tenantId,
        name: w.name,
        rolloutGroup: w.rolloutGroup,
        configChecksum: w.configChecksum,
        capabilities: w.capabilities,
        tags: w.tags ?? [],
        status: w.status,
        uptimeSeconds: w.uptimeSeconds,
        requestsHandled: w.requestsHandled,
        errorsCount: w.errorsCount,
        avgLatencyMs: w.avgLatencyMs ?? null,
        isDraining: w.isDraining ?? false,
        drainedAt: w.drainedAt ? new Date(w.drainedAt) : null,
        registeredAt: w.registeredAt ? new Date(w.registeredAt) : new Date(),
      }).catch(() => {});
    }

    // -----------------------------------------------------------------------
    // 2. Route decisions (20) — seed via decideCortexRoute AND persist to DB
    // -----------------------------------------------------------------------
    const routeDecisions = [];
    const scoringModes = ['latency', 'cost', 'confidence', 'balanced', 'sla'] as const;
    const tiers = ['public', 'internal', 'confidential'];

    for (let i = 0; i < 20; i++) {
      const requestId = mkId('req');
      const mode = scoringModes[i % scoringModes.length]!;
      const tier = tiers[i % tiers.length]!;
      const decision = decideCortexRoute({
        requestId,
        tenantId: DEMO_TENANT,
        scoringMode: mode,
        constraints: { sensitivityTier: tier },
        domain: DOMAIN,
        workers,
      });
      routeDecisions.push({ requestId, decision });

      await dbInsertRouteDecision({
        routeDecisionId: decision.routeDecisionId,
        requestId: decision.requestId,
        tenantId: decision.tenantId,
        selectedModel: decision.selectedModel,
        selectedProvider: decision.selectedProvider,
        workerId: decision.workerId ?? null,
        scoringMode: decision.scoringMode,
        latencyScore: decision.latencyScore ?? null,
        costScore: decision.costScore ?? null,
        confidenceScore: decision.confidenceScore ?? null,
        compositeScore: decision.compositeScore ?? null,
        isFallback: decision.isFallback,
        fallbackReason: decision.fallbackReason ?? null,
        candidatesEvaluated: decision.candidatesEvaluated,
        estimatedCostUsd: decision.estimatedCostUsd != null ? String(decision.estimatedCostUsd) : null,
        estimatedLatencyMs: decision.estimatedLatencyMs ?? null,
        domain: decision.domain ?? null,
        sensitivityTier: decision.sensitivityTier,
        slaConstraints: null,
        decidedAt: ts(i * 120000),
      }).catch(() => {});
    }

    // -----------------------------------------------------------------------
    // 3. Memory events (8) — write to in-memory store AND persist to DB
    // -----------------------------------------------------------------------
    const memKeys = [
      'ctx-vessel-positions',
      'ctx-legal-precedents',
      'ctx-property-covenants',
      'ctx-compliance-matrix',
      'ctx-threat-assessment',
      'ctx-financial-summary',
      'ctx-tenant-profile',
      'ctx-sla-config',
    ];

    for (const key of memKeys) {
      memoryWrite(
        { tenantId: DEMO_TENANT, domain: DOMAIN },
        key,
        { seeded: true, key, seedTime: Date.now() },
        { tags: ['seeded', 'demo', key.split('-')[1]!], tokenCount: Math.floor(80 + Math.random() * 400) },
      );
    }

    for (let i = 0; i < memKeys.length; i++) {
      const key = memKeys[i]!;
      const isHit = i < 5;
      const eventType = isHit ? 'hit' : 'miss';

      EventPlane.emit({
        tenantId: DEMO_TENANT,
        eventType: isHit ? 'memory.hit' : 'memory.miss',
        payload: {
          memoryKey: key,
          ...(isHit ? { contextReuseScore: 0.7 + Math.random() * 0.3 } : {}),
        },
      });

      await dbInsertMemoryEvent({
        eventId: mkId('mev'),
        tenantId: DEMO_TENANT,
        memoryKey: key,
        eventType,
        contextReuseScore: isHit ? 0.7 + Math.random() * 0.3 : null,
        overlapScore: isHit ? 0.6 + Math.random() * 0.4 : null,
        freshnessScore: 0.5 + Math.random() * 0.5,
        tokensSaved: isHit ? Math.floor(50 + Math.random() * 300) : null,
        domain: DOMAIN,
        occurredAt: ts(i * 180000),
      }).catch(() => {});
    }

    // -----------------------------------------------------------------------
    // 4. Runtime events (40) — emit to EventPlane AND persist to DB
    // -----------------------------------------------------------------------
    const runtimeEventTypes = [
      'route.decided', 'phase.started', 'phase.completed', 'phase.failed',
      'memory.hit', 'memory.miss', 'memory.reuse', 'memory.invalidated',
      'guard.rejected', 'worker.registered', 'worker.heartbeat',
      'proof.created', 'proof.sealed', 'deployment.created', 'sla.warning',
    ] as const;

    for (let i = 0; i < 40; i++) {
      const eventType = runtimeEventTypes[i % runtimeEventTypes.length]!;
      const rd = routeDecisions[i % routeDecisions.length];
      const ev = EventPlane.emit({
        tenantId: DEMO_TENANT,
        requestId: rd?.requestId,
        eventType,
        payload: { index: i, demo: true, seeded: true },
      });

      await dbInsertRuntimeEvent({
        eventId: ev.eventId,
        tenantId: ev.tenantId,
        requestId: ev.requestId ?? null,
        proofChainId: null,
        routeDecisionId: rd?.decision.routeDecisionId ?? null,
        workerId: null,
        correlationId: null,
        causationId: null,
        eventType: ev.eventType,
        payload: ev.payload,
        occurredAt: ts(i * 60000),
      }).catch(() => {});
    }

    // -----------------------------------------------------------------------
    // 5. Proof chains (10) — create via ProofChain module AND persist to DB
    // -----------------------------------------------------------------------
    const proofChains = [];
    for (let i = 0; i < 10; i++) {
      const rd = routeDecisions[i]!;
      const succeeded = i < 9;
      const proof = createProofChain({
        requestId: rd.requestId,
        tenantId: DEMO_TENANT,
        routeDecisionId: rd.decision.routeDecisionId,
        model: rd.decision.selectedModel,
        provider: rd.decision.selectedProvider,
        workerId: workers[i % workers.length]?.workerId,
        approvalStatus: i % 4 === 0 ? 'approved' : 'not_required',
        confidenceScore: 0.7 + Math.random() * 0.29,
        riskScore: Math.random() * 0.4,
        latencyMs: 800 + Math.floor(Math.random() * 4200),
        sourceCount: Math.floor(Math.random() * 12) + 1,
        memoryHitCount: Math.floor(Math.random() * 5),
        executionSucceeded: succeeded,
        failureReason: succeeded ? undefined : 'model_timeout',
      });
      proofChains.push(proof);

      await dbInsertProofChain({
        proofChainId: proof.proofChainId,
        requestId: proof.requestId,
        tenantId: proof.tenantId,
        routeDecisionId: proof.routeDecisionId ?? null,
        workerId: proof.workerId ?? null,
        model: proof.model ?? null,
        provider: proof.provider ?? null,
        approvalStatus: (proof.approvalStatus ?? 'not_required') as 'not_required' | 'pending' | 'approved' | 'rejected' | 'auto_approved',
        confidenceScore: proof.confidenceScore ?? null,
        riskScore: proof.riskScore ?? null,
        latencyMs: proof.latencyMs ?? null,
        sourceCount: proof.sourceCount,
        memoryHitCount: proof.memoryHitCount,
        phaseCount: proof.phaseCount,
        completedPhases: proof.completedPhases,
        auditHash: proof.auditHash,
        lineage: proof.lineage,
        executionSucceeded: proof.executionSucceeded,
        failureReason: proof.failureReason ?? null,
        sealedAt: proof.sealedAt ? new Date(proof.sealedAt) : ts(i * 300000),
        createdAt: ts(i * 300000),
      }).catch(() => {});

      const sealEv = EventPlane.emit({
        tenantId: DEMO_TENANT,
        requestId: rd.requestId,
        proofChainId: proof.proofChainId,
        eventType: 'proof.sealed',
        payload: { auditHash: proof.auditHash.slice(0, 12), succeeded: proof.executionSucceeded },
      });
      await dbInsertRuntimeEvent({
        eventId: sealEv.eventId,
        tenantId: sealEv.tenantId,
        requestId: sealEv.requestId ?? null,
        proofChainId: proof.proofChainId,
        routeDecisionId: rd.decision.routeDecisionId,
        workerId: null,
        correlationId: null,
        causationId: null,
        eventType: sealEv.eventType,
        payload: sealEv.payload,
        occurredAt: ts(i * 300000),
      }).catch(() => {});
    }

    // -----------------------------------------------------------------------
    // 6. Guardrail rejections (5) — fire guard check AND persist to DB
    // -----------------------------------------------------------------------
    const guardScenarios = [
      { regex: 'a'.repeat(33000) },
      { whitespacePattern: ' '.repeat(1100) },
      { grammar: 'rule ::= ' + '"x" '.repeat(17000) },
    ];

    for (let i = 0; i < 5; i++) {
      const constraints = guardScenarios[i % guardScenarios.length]!;
      const requestId = mkId('req');
      const result = checkOutputConstraints(constraints, {
        tenantId: DEMO_TENANT,
        requestId,
      });

      if (!result.passed) {
        const rejEv = EventPlane.emit({
          tenantId: DEMO_TENANT,
          eventType: 'guard.rejected',
          payload: {
            guardRule: result.rejections[0]?.guardRule,
            violatedLimit: result.rejections[0]?.violatedLimit,
            demo: true,
          },
        });

        for (const r of result.rejections) {
          await dbInsertGuardrailRejection({
            rejectionId: r.rejectionId,
            tenantId: DEMO_TENANT,
            requestId,
            guardRule: r.guardRule,
            violatedLimit: r.violatedLimit,
            actualSize: r.actualSize ?? null,
            maxAllowed: r.maxAllowed ?? null,
            redactedSnippet: r.redactedSnippet ?? null,
            domain: DOMAIN,
            rejectedAt: ts(i * 600000),
          }).catch(() => {});
        }

        await dbInsertRuntimeEvent({
          eventId: rejEv.eventId,
          tenantId: rejEv.tenantId,
          requestId,
          proofChainId: null,
          routeDecisionId: null,
          workerId: null,
          correlationId: null,
          causationId: null,
          eventType: rejEv.eventType,
          payload: rejEv.payload,
          occurredAt: ts(i * 600000),
        }).catch(() => {});
      }
    }

    // -----------------------------------------------------------------------
    // 7. Cognitive deployments (3) — emit events AND persist to DB
    // -----------------------------------------------------------------------
    const deploymentDefs = [
      { name: 'Claude Sonnet 4 → Claude Opus 4 (blue group)', type: 'model' as const, status: 'completed' as const },
      { name: 'Worker Registry v2.1 rollout (canary)', type: 'worker' as const, status: 'in_progress' as const },
      { name: 'Phase Engine timeout config (global)', type: 'config' as const, status: 'pending' as const },
    ];

    for (let i = 0; i < deploymentDefs.length; i++) {
      const d = deploymentDefs[i]!;
      const deploymentId = mkId('dep');

      await dbInsertDeployment({
        deploymentId,
        tenantId: DEMO_TENANT,
        name: d.name,
        deploymentType: d.type,
        targetRolloutGroup: 'default',
        newConfigChecksum: sha256(`${d.name}-new`),
        previousConfigChecksum: sha256(`${d.name}-prev`),
        status: d.status,
        approvalRequired: true,
        metadata: { demo: true, seeded: true },
        createdAt: ts(i * 3600000),
      }).catch(() => {});

      const depEv = EventPlane.emit({
        tenantId: DEMO_TENANT,
        eventType: 'deployment.created',
        payload: { deploymentId, ...d, demo: true },
      });
      await dbInsertRuntimeEvent({
        eventId: depEv.eventId,
        tenantId: depEv.tenantId,
        requestId: null,
        proofChainId: null,
        routeDecisionId: null,
        workerId: null,
        correlationId: null,
        causationId: null,
        eventType: depEv.eventType,
        payload: depEv.payload,
        occurredAt: ts(i * 3600000),
      }).catch(() => {});
    }

    console.log('[seed-a11oy-cognitive] Seeded cognitive runtime demo data into DB:', {
      workers: workers.length,
      routeDecisions: routeDecisions.length,
      memoryKeys: memKeys.length,
      runtimeEvents: 40 + proofChains.length + 5 + deploymentDefs.length,
      proofChains: proofChains.length,
      guardrailScenarios: 5,
      deployments: deploymentDefs.length,
    });
  } catch (err) {
    console.warn('[seed-a11oy-cognitive] Seeding skipped or partially failed:', String(err).slice(0, 200));
  }
}
