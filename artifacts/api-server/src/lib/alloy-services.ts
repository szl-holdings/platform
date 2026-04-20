import {
  type AlloySignal,
  alloyArtifacts,
  alloyAuditLog,
  alloyOwners,
  alloySignals,
  alloyWorkflowRuns,
  alloyWorkflows,
  db,
  type InsertAlloyArtifact,
  type InsertAlloySignal,
  type InsertAlloyWorkflow,
} from '@szl-holdings/db';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { logger as _logger } from './logger';

// ─── Signal Normalization ─────────────────────────────────────────────────────

const DOMAIN_CATEGORIES: Record<string, string> = {
  vessels: 'maritime',
  firestorm: 'security',
  lyte: 'observability',
  inca: 'research',
  terra: 'real-estate',
  msp: 'managed-services',
  alloy: 'orchestration',
  global: 'cross-domain',
};

const SEVERITY_KEYWORDS: Array<{
  keywords: string[];
  severity: NonNullable<InsertAlloySignal['severity']>;
}> = [
  {
    keywords: ['critical', 'emergency', 'fatal', 'breach', 'compromise', 'ransom'],
    severity: 'critical',
  },
  {
    keywords: ['high', 'severe', 'urgent', 'alert', 'failure', 'down', 'outage', 'incident'],
    severity: 'high',
  },
  {
    keywords: ['medium', 'warning', 'warn', 'degraded', 'slow', 'anomaly', 'unusual'],
    severity: 'medium',
  },
  { keywords: ['low', 'info', 'notice', 'minor', 'advisory'], severity: 'low' },
];

export interface RawSignalInput {
  source: string;
  sourceType: NonNullable<InsertAlloySignal['sourceType']>;
  domain: string;
  title: string;
  summary?: string;
  rawPayload?: Record<string, unknown>;
  tags?: string[];
  environment?: 'development' | 'staging' | 'production';
}

export interface NormalizedSignal {
  source: string;
  sourceType: NonNullable<InsertAlloySignal['sourceType']>;
  domain: string;
  title: string;
  summary?: string;
  rawPayload?: Record<string, unknown>;
  category: string;
  severity: NonNullable<InsertAlloySignal['severity']>;
  score: number;
  confidence: number;
  tags: string[];
  status: NonNullable<InsertAlloySignal['status']>;
  normalizedAt: Date;
  environment: NonNullable<InsertAlloySignal['environment']>;
}

export interface SeverityAssessment {
  severity: NonNullable<InsertAlloySignal['severity']>;
  score: number;
  confidence: number;
  valueAtRisk: number;
  anomalyFlag: boolean;
  escalationRequired: boolean;
  workflowType: NonNullable<InsertAlloyWorkflow['type']>;
  priority: NonNullable<InsertAlloyWorkflow['priority']>;
}

export interface OwnerResolution {
  ownerUserId?: number;
  ownerId?: number;
  ownerDomain?: string;
  resolved: boolean;
}

export interface WorkflowStep {
  step: number;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

// ─── Service: signalNormalizer ────────────────────────────────────────────────

export const signalNormalizer = {
  normalize(input: RawSignalInput): NormalizedSignal {
    const severity = this._classifySeverity(input.title, input.summary);
    const category = this._classifyCategory(input.domain, input.title);
    const confidence = 0.75;
    const score = this._computeScore(severity, confidence);
    const tags = this._assignTags(input.domain, category, severity, input.tags ?? []);

    return {
      source: input.source,
      sourceType: input.sourceType,
      domain: input.domain,
      title: input.title,
      summary: input.summary,
      rawPayload: input.rawPayload,
      category,
      severity,
      score,
      confidence,
      tags,
      status: 'normalized',
      normalizedAt: new Date(),
      environment: input.environment ?? 'production',
    };
  },

  _classifySeverity(title: string, summary?: string): NonNullable<InsertAlloySignal['severity']> {
    const text = `${title} ${summary ?? ''}`.toLowerCase();
    for (const { keywords, severity } of SEVERITY_KEYWORDS) {
      if (keywords.some((k) => text.includes(k))) return severity;
    }
    return 'medium';
  },

  _classifyCategory(domain: string, title: string): string {
    const domainCategory = DOMAIN_CATEGORIES[domain] ?? 'general';
    const t = title.toLowerCase();
    if (t.includes('threat') || t.includes('attack') || t.includes('vuln')) return 'threat';
    if (t.includes('health') || t.includes('slo') || t.includes('latency')) return 'health';
    if (t.includes('anomaly') || t.includes('deviation')) return 'anomaly';
    if (t.includes('compliance') || t.includes('sanction')) return 'compliance';
    if (t.includes('performance') || t.includes('metric')) return 'performance';
    return domainCategory;
  },

  _computeScore(severity: NonNullable<InsertAlloySignal['severity']>, confidence: number): number {
    const weights: Record<string, number> = {
      critical: 1.0,
      high: 0.8,
      medium: 0.5,
      low: 0.25,
      info: 0.1,
    };
    return Math.min(1.0, (weights[severity] ?? 0.5) * confidence);
  },

  _assignTags(
    domain: string,
    category: string,
    severity: NonNullable<InsertAlloySignal['severity']>,
    existing: string[],
  ): string[] {
    const tags = new Set(existing.map((t) => t.toLowerCase().trim()).filter(Boolean));
    tags.add(domain);
    tags.add(category);
    if (severity === 'critical' || severity === 'high') tags.add('needs-attention');
    tags.add('normalized');
    return Array.from(tags);
  },
};

// ─── Service: severityAssigner ────────────────────────────────────────────────

export const severityAssigner = {
  assess(signal: Partial<InsertAlloySignal>): SeverityAssessment {
    const sev = signal.severity ?? 'medium';
    const conf = signal.confidence ?? 0.5;

    const severityScores: Record<string, number> = {
      critical: 1.0,
      high: 0.8,
      medium: 0.5,
      low: 0.25,
      info: 0.1,
    };
    const score = Math.min(1.0, (severityScores[sev] ?? 0.5) * conf);

    const varMap: Record<string, number> = {
      critical: 100000,
      high: 50000,
      medium: 10000,
      low: 1000,
      info: 0,
    };
    const valueAtRisk = varMap[sev] ?? 0;

    const anomalyFlag = ((signal.tags as string[]) ?? []).includes('anomaly') || sev === 'critical';
    const escalationRequired = sev === 'critical' || (sev === 'high' && conf > 0.8);

    const workflowType: NonNullable<InsertAlloyWorkflow['type']> = escalationRequired
      ? 'escalation'
      : sev === 'high'
        ? 'remediation'
        : sev === 'medium'
          ? 'investigation'
          : 'notification';

    const priorityMap: Record<string, NonNullable<InsertAlloyWorkflow['priority']>> = {
      critical: 'critical',
      high: 'high',
      medium: 'medium',
      low: 'low',
      info: 'low',
    };
    const priority = priorityMap[sev] ?? 'medium';

    return {
      severity: sev as NonNullable<InsertAlloySignal['severity']>,
      score,
      confidence: conf,
      valueAtRisk,
      anomalyFlag,
      escalationRequired,
      workflowType,
      priority,
    };
  },
};

// ─── Service: ownerResolver ───────────────────────────────────────────────────

export const ownerResolver = {
  async resolve(
    signal: Partial<AlloySignal>,
    options: { actorUserId?: number; domain?: string } = {},
  ): Promise<OwnerResolution> {
    if (signal.ownerUserId) {
      return { ownerUserId: signal.ownerUserId, resolved: true };
    }

    if (signal.ownerId) {
      return { ownerId: signal.ownerId, resolved: true };
    }

    const domain = signal.domain ?? options.domain;
    if (domain) {
      const [domainOwner] = await db
        .select()
        .from(alloyOwners)
        .where(eq(alloyOwners.domain, domain))
        .limit(1);

      if (domainOwner) {
        return { ownerId: domainOwner.id, ownerDomain: domain, resolved: true };
      }
    }

    if (options.actorUserId) {
      return { ownerUserId: options.actorUserId, resolved: true };
    }

    return { resolved: false };
  },
};

// ─── Service: valueAtRiskEstimator ────────────────────────────────────────────

export const valueAtRiskEstimator = {
  estimate(
    severity: NonNullable<InsertAlloySignal['severity']>,
    confidence: number,
    domain?: string,
  ): {
    valueAtRisk: number;
    adjustedValueAtRisk: number;
    currency: string;
  } {
    const baseMap: Record<string, number> = {
      critical: 100000,
      high: 50000,
      medium: 10000,
      low: 1000,
      info: 0,
    };
    const domainMultiplier: Record<string, number> = {
      vessels: 2.5,
      firestorm: 2.0,
      lyte: 1.5,
      msp: 1.5,
      terra: 1.8,
      inca: 1.2,
      alloy: 1.0,
    };

    const base = baseMap[severity] ?? 0;
    const multiplier = domain ? (domainMultiplier[domain] ?? 1.0) : 1.0;
    const valueAtRisk = base * multiplier;
    const adjustedValueAtRisk = Math.round(valueAtRisk * confidence);

    return { valueAtRisk, adjustedValueAtRisk, currency: 'USD' };
  },
};

// ─── Service: workflowPlanner ─────────────────────────────────────────────────

export const workflowPlanner = {
  buildSteps(type: NonNullable<InsertAlloyWorkflow['type']>): WorkflowStep[] {
    const base: WorkflowStep[] = [
      { step: 1, name: 'intake', description: 'Signal intake and validation', status: 'pending' },
      {
        step: 2,
        name: 'analysis',
        description: 'Signal analysis and classification',
        status: 'pending',
      },
    ];

    if (type === 'escalation') {
      return [
        ...base,
        {
          step: 3,
          name: 'escalation',
          description: 'Escalate to responsible owner',
          status: 'pending',
        },
        { step: 4, name: 'approval', description: 'Approval gate', status: 'pending' },
        { step: 5, name: 'resolution', description: 'Confirm resolution', status: 'pending' },
      ];
    }

    if (type === 'remediation') {
      return [
        ...base,
        { step: 3, name: 'planning', description: 'Build remediation plan', status: 'pending' },
        { step: 4, name: 'execution', description: 'Execute remediation steps', status: 'pending' },
        {
          step: 5,
          name: 'verification',
          description: 'Verify remediation success',
          status: 'pending',
        },
      ];
    }

    if (type === 'review') {
      return [
        ...base,
        { step: 3, name: 'review', description: 'Human review and assessment', status: 'pending' },
        { step: 4, name: 'decision', description: 'Decision and next action', status: 'pending' },
      ];
    }

    return [
      ...base,
      {
        step: 3,
        name: 'recommendation',
        description: 'Generate recommendations',
        status: 'pending',
      },
      { step: 4, name: 'output', description: 'Generate output artifact', status: 'pending' },
    ];
  },

  determinePriority(signal?: Partial<AlloySignal>): NonNullable<InsertAlloyWorkflow['priority']> {
    const sev = signal?.severity ?? 'medium';
    const priorityMap: Record<string, NonNullable<InsertAlloyWorkflow['priority']>> = {
      critical: 'critical',
      high: 'high',
      medium: 'medium',
      low: 'low',
      info: 'low',
    };
    return priorityMap[sev] ?? 'medium';
  },

  requiresApproval(signal?: Partial<AlloySignal>): boolean {
    const sev = signal?.severity ?? 'medium';
    return sev === 'critical' || sev === 'high';
  },
};

// ─── Service: artifactGenerator ──────────────────────────────────────────────

type AlloyArtifact = typeof alloyArtifacts.$inferSelect;

export const artifactGenerator = {
  async generate(params: {
    workflowId?: number;
    signalId?: number;
    type: NonNullable<InsertAlloyArtifact['type']>;
    title: string;
    content: string;
    domain: string;
    format?: NonNullable<InsertAlloyArtifact['format']>;
    confidenceScore?: number;
    requiresApproval?: boolean;
    tags?: string[];
    ownerId?: number;
    ownerUserId?: number;
  }): Promise<AlloyArtifact> {
    const [artifact] = await db
      .insert(alloyArtifacts)
      .values({
        workflowId: params.workflowId,
        signalId: params.signalId,
        type: params.type,
        title: params.title,
        content: params.content,
        domain: params.domain,
        format: params.format ?? 'markdown',
        confidenceScore: params.confidenceScore ?? 0.8,
        requiresApproval: params.requiresApproval ?? false,
        approvalState: params.requiresApproval ? 'pending' : 'none',
        tags: params.tags ?? [],
        ownerId: params.ownerId,
        ownerUserId: params.ownerUserId,
        publishedAt: params.requiresApproval ? null : new Date(),
      })
      .returning();

    await runLogger.log({
      entityType: 'artifact',
      entityId: artifact.id,
      action: 'generated',
      actorType: params.ownerUserId ? 'user' : 'system',
      actorUserId: params.ownerUserId,
      newState: { type: params.type, domain: params.domain },
    });

    return artifact;
  },

  buildSummaryContent(signal: AlloySignal, assessment: SeverityAssessment): string {
    return [
      `# Signal Summary: ${signal.title}`,
      ``,
      `**Domain:** ${signal.domain}`,
      `**Severity:** ${signal.severity}`,
      `**Score:** ${assessment.score.toFixed(2)}`,
      `**Value at Risk:** $${assessment.valueAtRisk.toLocaleString()}`,
      `**Escalation Required:** ${assessment.escalationRequired ? 'Yes' : 'No'}`,
      ``,
      signal.summary ? `## Summary\n${signal.summary}` : '',
      ``,
      `**Generated:** ${new Date().toISOString()}`,
    ]
      .filter(Boolean)
      .join('\n');
  },
};

// ─── Service: approvalRouter ─────────────────────────────────────────────────

export const approvalRouter = {
  async approve(artifactId: number, reviewerUserId: number, note?: string): Promise<AlloyArtifact> {
    const [artifact] = await db
      .update(alloyArtifacts)
      .set({
        approvalState: 'approved',
        approvedByUserId: reviewerUserId,
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(alloyArtifacts.id, artifactId))
      .returning();

    if (!artifact) throw new Error(`Artifact not found: ${artifactId}`);

    await runLogger.log({
      entityType: 'artifact',
      entityId: artifactId,
      action: 'artifact_approved',
      actorType: 'user',
      actorUserId: reviewerUserId,
      previousState: { approvalState: 'pending' },
      newState: { approvalState: 'approved' },
      notes: note,
    });

    return artifact;
  },

  async reject(artifactId: number, reviewerUserId: number, note?: string): Promise<AlloyArtifact> {
    const [artifact] = await db
      .update(alloyArtifacts)
      .set({
        approvalState: 'rejected',
        updatedAt: new Date(),
      })
      .where(eq(alloyArtifacts.id, artifactId))
      .returning();

    if (!artifact) throw new Error(`Artifact not found: ${artifactId}`);

    await runLogger.log({
      entityType: 'artifact',
      entityId: artifactId,
      action: 'artifact_rejected',
      actorType: 'user',
      actorUserId: reviewerUserId,
      previousState: { approvalState: 'pending' },
      newState: { approvalState: 'rejected' },
      notes: note,
    });

    return artifact;
  },

  determineApprovers(artifact: AlloyArtifact): string[] {
    const approvers: string[] = [];
    if (artifact.type === 'proposal' || artifact.type === 'action_queue') {
      approvers.push('ops', 'exec');
    } else if (artifact.type === 'report' || artifact.type === 'brief') {
      approvers.push('analyst', 'compliance');
    } else {
      approvers.push('ops');
    }
    return approvers;
  },
};

// ─── Service: runLogger ───────────────────────────────────────────────────────

type _AlloyAuditLogEntry = typeof alloyAuditLog.$inferSelect;

export const runLogger = {
  async log(params: {
    entityType: 'signal' | 'workflow' | 'action' | 'artifact' | 'approval' | 'owner';
    entityId: number;
    action: string;
    actorUserId?: number;
    actorType?: 'user' | 'system' | 'agent';
    previousState?: unknown;
    newState?: unknown;
    notes?: string;
    ipAddress?: string;
    userAgent?: string;
    correlationId?: string;
  }): Promise<void> {
    try {
      await db.insert(alloyAuditLog).values({
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        actorUserId: params.actorUserId,
        actorType: params.actorType ?? 'system',
        previousState: params.previousState as Record<string, unknown> | undefined,
        newState: params.newState as Record<string, unknown> | undefined,
        notes: params.notes,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        correlationId: params.correlationId,
      });
    } catch (err) {
      _logger.error(
        {
          err,
          params: {
            entityType: params.entityType,
            entityId: params.entityId,
            action: params.action,
          },
        },
        'runLogger: audit write failed',
      );
    }
  },

  async getAuditLog(
    filters: {
      entityType?: 'signal' | 'workflow' | 'action' | 'artifact' | 'approval' | 'owner';
      entityId?: number;
      actorUserId?: number;
      fromDate?: Date;
      toDate?: Date;
      limit?: number;
    } = {},
  ): Promise<(typeof alloyAuditLog.$inferSelect)[]> {
    const conditions = [];

    if (filters.entityType) conditions.push(eq(alloyAuditLog.entityType, filters.entityType));
    if (filters.entityId != null) conditions.push(eq(alloyAuditLog.entityId, filters.entityId));
    if (filters.actorUserId != null)
      conditions.push(eq(alloyAuditLog.actorUserId, filters.actorUserId));
    if (filters.fromDate) conditions.push(gte(alloyAuditLog.createdAt, filters.fromDate));
    if (filters.toDate) conditions.push(lte(alloyAuditLog.createdAt, filters.toDate));

    return db
      .select()
      .from(alloyAuditLog)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(alloyAuditLog.createdAt))
      .limit(filters.limit ?? 100);
  },
};

// ─── Service: retryHandler ────────────────────────────────────────────────────

type _AlloyWorkflowRun = typeof alloyWorkflowRuns.$inferSelect;

export const retryHandler = {
  computeDelay(attempt: number, baseMs = 1000): number {
    return Math.min(baseMs * 2 ** attempt, 30_000);
  },

  async markForRetry(workflowId: number, retryCount: number, errorMessage?: string): Promise<void> {
    const delayMs = this.computeDelay(retryCount);

    await db
      .update(alloyWorkflows)
      .set({
        status: 'pending',
        retryCount: retryCount + 1,
        updatedAt: new Date(),
        errorMessage: errorMessage ?? null,
      })
      .where(eq(alloyWorkflows.id, workflowId));

    await runLogger.log({
      entityType: 'workflow',
      entityId: workflowId,
      action: 'retry_scheduled',
      actorType: 'system',
      previousState: { status: 'failed', retryCount },
      newState: { status: 'pending', retryCount: retryCount + 1, delayMs },
      notes: `Retry #${retryCount + 1} scheduled after ${delayMs}ms`,
    });
  },

  async cancelRun(
    runId: number,
    actorUserId?: number,
  ): Promise<typeof alloyWorkflowRuns.$inferSelect | null> {
    const [run] = await db
      .select()
      .from(alloyWorkflowRuns)
      .where(eq(alloyWorkflowRuns.id, runId))
      .limit(1);
    if (!run) return null;

    if (!['started'].includes(run.status)) {
      return null;
    }

    const [updated] = await db
      .update(alloyWorkflowRuns)
      .set({ status: 'cancelled', completedAt: new Date() })
      .where(eq(alloyWorkflowRuns.id, runId))
      .returning();

    await db
      .update(alloyWorkflows)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(alloyWorkflows.id, run.workflowId));

    await runLogger.log({
      entityType: 'workflow',
      entityId: run.workflowId,
      action: 'run_cancelled',
      actorType: actorUserId ? 'user' : 'system',
      actorUserId,
      previousState: { runId, status: 'started' },
      newState: { runId, status: 'cancelled' },
    });

    return updated;
  },
};

export const alloyServicesBundle = {
  signalNormalizer,
  severityAssigner,
  ownerResolver,
  valueAtRiskEstimator,
  workflowPlanner,
  artifactGenerator,
  approvalRouter,
  runLogger,
  retryHandler,
};
