/**
 * Crisis Arena — Drizzle-backed store
 *
 * All state is persisted to PostgreSQL via Drizzle ORM.
 * Proof-chain audit events are written to the canonical `audit_chain_events` table
 * (SHA-256 hash-chained, append-only).
 */

import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import { runScenarioSimulation } from '@szl-holdings/monte-carlo';
import type { ScenarioDefinition } from '@szl-holdings/monte-carlo';
import {
  auditChainEventsTable,
  crisisArenaArchitectProfilesTable,
  crisisArenaEngagementsTable,
  crisisArenaReputationEventsTable,
  crisisArenaSubmissionsTable,
  crisisArenaTriageEventsTable,
  db,
} from '@szl-holdings/db';
import { and, desc, eq, gte, sql } from 'drizzle-orm';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ThreatArchetype = 'ransomware' | 'insider' | 'supply_chain' | 'regulatory' | 'cascade' | 'black_swan';
export type EngagementStatus = 'open' | 'accepting' | 'closed' | 'archived';
export type SubmissionStatus = 'pending' | 'accepted' | 'duplicate' | 'out_of_scope' | 'rejected' | 'graduated';
export type ArchetypeBadge = 'Black Swan' | 'Cascade' | 'Insider' | 'Regulator';

export interface Engagement {
  id: string;
  tenantId: string;
  ownerId: number;
  title: string;
  description: string;
  scopedAssets: string[];
  scopedDomains: string[];
  archetypeFilter: ThreatArchetype[];
  payoutPool: number;
  deadline: string;
  status: EngagementStatus;
  createdAt: string;
  updatedAt: string;
  submissionCount: number;
  acceptedCount: number;
}

export interface KillChainStep {
  phase: string;
  technique: string;
  description: string;
}

export interface BusinessImpactEstimate {
  revenueAtRiskUsd: number;
  rtoBreach: number;
  rpoBreach: number;
  regulatoryExposureUsd: number;
  blastRadiusDomains: string[];
}

export interface Submission {
  id: string;
  engagementId: string;
  architectId: string;
  title: string;
  narrative: string;
  killChain: KillChainStep[];
  impactEstimate: BusinessImpactEstimate;
  evidenceNotes: string;
  archetype: ThreatArchetype;
  status: SubmissionStatus;
  businessImpactScore: number;
  reputationAwarded: number;
  payoutAwarded: number;
  triageJustification?: string;
  submittedAt: string;
  updatedAt: string;
  graduatedIncidentId?: string;
}

export interface TriageEvent {
  id: string;
  submissionId: string;
  engagementId: string;
  action: 'accept' | 'reject' | 'duplicate' | 'out_of_scope' | 'award' | 'graduate';
  actor: string;
  justification: string;
  payoutAmount?: number;
  timestamp: string;
}

export interface ArchetypeStat {
  archetype: ThreatArchetype;
  badge: ArchetypeBadge;
  count: number;
  totalScore: number;
}

export interface ArchitectProfile {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
  reputationScore: number;
  acceptedCount: number;
  submissionCount: number;
  totalImpactUsd: number;
  badges: ArchetypeBadge[];
  archetypeStats: ArchetypeStat[];
  joinedAt: string;
  topScenarioTitles: string[];
  isPublic: boolean;
}

export interface ReputationEvent {
  id: string;
  architectId: string;
  submissionId: string;
  delta: number;
  reason: string;
  createdAt: string;
}

export interface ArenaProofChainEntry {
  eventType: string;
  entityId: string;
  entityType: string;
  actor: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

// ─── Scoring Engine ──────────────────────────────────────────────────────────

export function computeBusinessImpactScore(
  impact: BusinessImpactEstimate,
  archetype: ThreatArchetype,
): number {
  const archetypeMultiplier: Record<ThreatArchetype, number> = {
    black_swan: 1.25,
    cascade: 1.2,
    supply_chain: 1.15,
    regulatory: 1.1,
    insider: 1.05,
    ransomware: 1.0,
  };
  const multiplier = archetypeMultiplier[archetype] ?? 1.0;

  const revenueM = Math.max(0.01, impact.revenueAtRiskUsd / 1_000_000);
  const rtoH = Math.max(0.01, impact.rtoBreach);
  const rpoH = Math.max(0.01, impact.rpoBreach);
  const regM = Math.max(0.01, impact.regulatoryExposureUsd / 500_000);
  const blast = Math.max(1, impact.blastRadiusDomains.length);

  const scenario: ScenarioDefinition = {
    id: 'crisis-arena/business-impact-score',
    version: '1.0.0',
    title: 'Crisis Arena: Business Impact Score',
    description:
      'Monte Carlo simulation for BIS computation across revenue, operational, and regulatory impact dimensions.',
    domain: 'generic',
    tags: ['crisis-arena', 'bis', 'sentra'],
    inputs: [
      {
        id: 'revenueM',
        label: 'Revenue at Risk ($M)',
        distribution: { type: 'log_normal', mean: revenueM, stdDev: revenueM * 0.30 },
        format: 'currency',
      },
      {
        id: 'rtoH',
        label: 'RTO Breach (hours)',
        distribution: { type: 'normal', mean: rtoH, stdDev: Math.max(0.1, rtoH * 0.20) },
        format: 'number',
      },
      {
        id: 'rpoH',
        label: 'RPO Breach (hours)',
        distribution: { type: 'normal', mean: rpoH, stdDev: Math.max(0.1, rpoH * 0.20) },
        format: 'number',
      },
      {
        id: 'regM',
        label: 'Regulatory Exposure ($M)',
        distribution: { type: 'log_normal', mean: regM, stdDev: regM * 0.25 },
        format: 'currency',
      },
      {
        id: 'blast',
        label: 'Blast Radius (domains)',
        distribution: {
          type: 'uniform',
          min: Math.max(1, blast * 0.8),
          max: blast * 1.2 + 0.01,
        },
        format: 'number',
      },
    ],
    outputs: [
      {
        id: 'bis',
        label: 'Business Impact Score',
        format: 'number',
        higherIsBetter: false,
        thresholds: { excellent: 30, good: 55, poor: 75 },
      },
    ],
    calculate(inputs: Record<string, number>, _iteration: number): Record<string, number> {
      const revScore = Math.min(40, (inputs['revenueM'] ?? 0) * 4);
      const rtoScore = Math.min(20, ((inputs['rtoH'] ?? 0) / 60) * 2);
      const rpoScore = Math.min(15, ((inputs['rpoH'] ?? 0) / 60) * 1.5);
      const regScore = Math.min(15, (inputs['regM'] ?? 0) * 3.75);
      const blastScore = Math.min(10, (inputs['blast'] ?? 0) * 2.5);
      const raw = (revScore + rtoScore + rpoScore + regScore + blastScore) * multiplier;
      return { bis: Math.min(100, Math.max(0, raw)) };
    },
  };

  try {
    const result = runScenarioSimulation(scenario, 300);
    const bisMetric = result.metrics['bis'];
    return Math.round(Math.min(100, bisMetric?.p75 ?? 0));
  } catch {
    const raw =
      Math.min(40, revenueM * 4) +
      Math.min(20, (rtoH / 60) * 2) +
      Math.min(15, (rpoH / 60) * 1.5) +
      Math.min(15, regM * 3.75) +
      Math.min(10, blast * 2.5);
    return Math.round(Math.min(100, raw * multiplier));
  }
}

export function computeReputationDelta(
  score: number,
  action: 'accept' | 'reject' | 'duplicate' | 'out_of_scope',
): number {
  if (action === 'accept') return Math.round(score * 1.5);
  if (action === 'out_of_scope') return -5;
  if (action === 'duplicate') return 0;
  if (action === 'reject') return -2;
  return 0;
}

// ─── DB helpers ──────────────────────────────────────────────────────────────

function rowToEngagement(row: typeof crisisArenaEngagementsTable.$inferSelect): Engagement {
  return {
    id: row.id,
    tenantId: row.tenantId,
    ownerId: row.ownerId ?? 0,
    title: row.title,
    description: row.description,
    scopedAssets: (row.scopedAssets ?? []) as string[],
    scopedDomains: (row.scopedDomains ?? []) as string[],
    archetypeFilter: (row.archetypeFilter ?? []) as ThreatArchetype[],
    payoutPool: row.payoutPool,
    deadline: row.deadline.toISOString(),
    status: row.status as EngagementStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    submissionCount: row.submissionCount,
    acceptedCount: row.acceptedCount,
  };
}

function rowToSubmission(row: typeof crisisArenaSubmissionsTable.$inferSelect): Submission {
  const impact = (row.impactEstimate ?? {}) as Record<string, unknown>;
  return {
    id: row.id,
    engagementId: row.engagementId,
    architectId: row.architectId,
    title: row.title,
    narrative: row.narrative,
    killChain: (row.killChain ?? []) as KillChainStep[],
    impactEstimate: {
      revenueAtRiskUsd: (impact['revenueAtRiskUsd'] as number) ?? 0,
      rtoBreach: (impact['rtoBreach'] as number) ?? 0,
      rpoBreach: (impact['rpoBreach'] as number) ?? 0,
      regulatoryExposureUsd: (impact['regulatoryExposureUsd'] as number) ?? 0,
      blastRadiusDomains: (impact['blastRadiusDomains'] as string[]) ?? [],
    },
    evidenceNotes: '',
    archetype: row.archetype as ThreatArchetype,
    status: row.status as SubmissionStatus,
    businessImpactScore: row.businessImpactScore,
    reputationAwarded: row.reputationAwarded,
    payoutAwarded: row.payoutAwarded,
    triageJustification: row.triageJustification ?? undefined,
    submittedAt: row.submittedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    graduatedIncidentId: row.graduatedIncidentId ?? undefined,
  };
}

function rowToProfile(row: typeof crisisArenaArchitectProfilesTable.$inferSelect): ArchitectProfile {
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.displayName,
    bio: row.bio ?? '',
    reputationScore: row.reputationScore,
    acceptedCount: row.acceptedCount,
    submissionCount: row.submissionCount,
    totalImpactUsd: row.totalImpactUsd,
    badges: (row.badges ?? []) as ArchetypeBadge[],
    archetypeStats: (row.archetypeStats ?? []) as ArchetypeStat[],
    joinedAt: row.createdAt.toISOString(),
    topScenarioTitles: (row.topScenarioTitles ?? []) as string[],
    isPublic: row.isPublic,
  };
}

// ─── Canonical Proof Chain (audit_chain_events) ───────────────────────────────

function _computeHash(
  prevHash: string,
  action: string,
  actor: string,
  domain: string,
  actionType: string,
  entityId: string,
  createdAt: string,
): string {
  const data = [prevHash, action, actor, domain, actionType, entityId, createdAt].join('|');
  return createHash('sha256').update(data).digest('hex');
}

export async function appendArenaAuditEvent(entry: {
  eventType: string;
  entityId: string;
  entityType: string;
  actor: string;
  payload: Record<string, unknown>;
  orgId?: number | null;
}): Promise<void> {
  try {
    const orgId = entry.orgId ?? null;
    const now = new Date();
    const conditions = orgId != null ? [eq(auditChainEventsTable.orgId, orgId)] : [];
    const [last] = await db
      .select({ eventHash: auditChainEventsTable.eventHash })
      .from(auditChainEventsTable)
      .where(conditions.length > 0 ? and(...(conditions as Parameters<typeof and>)) : undefined)
      .orderBy(desc(auditChainEventsTable.id))
      .limit(1);
    const prevHash = last?.eventHash ?? 'genesis';
    const eventHash = _computeHash(
      prevHash,
      entry.eventType,
      entry.actor,
      'crisis-arena',
      'agent_action',
      entry.entityId,
      now.toISOString(),
    );
    await db.insert(auditChainEventsTable).values({
      orgId,
      actorUserId: null,
      actorLabel: entry.actor,
      action: entry.eventType,
      actionType: 'agent_action',
      domain: 'crisis-arena',
      entityId: entry.entityId,
      entityType: entry.entityType,
      riskLevel: 'low',
      complianceTags: [],
      outcome: 'success',
      details: JSON.stringify(entry.payload),
      metadata: entry.payload,
      prevHash,
      eventHash,
    });
  } catch (err) {
    // Non-fatal: audit logging should never block the primary operation
    console.warn('[crisis-arena] audit event append failed (non-fatal)', err);
  }
}

// ─── Engagement CRUD ─────────────────────────────────────────────────────────

export async function getEngagement(id: string): Promise<Engagement | null> {
  const [row] = await db
    .select()
    .from(crisisArenaEngagementsTable)
    .where(eq(crisisArenaEngagementsTable.id, id));
  return row ? rowToEngagement(row) : null;
}

export async function listEngagements(tenantId?: string): Promise<Engagement[]> {
  const conditions = tenantId ? [eq(crisisArenaEngagementsTable.tenantId, tenantId)] : [];
  const rows = await db
    .select()
    .from(crisisArenaEngagementsTable)
    .where(conditions.length > 0 ? and(...(conditions as Parameters<typeof and>)) : undefined)
    .orderBy(desc(crisisArenaEngagementsTable.createdAt));
  return rows.map(rowToEngagement);
}

export async function insertEngagement(eng: Engagement): Promise<void> {
  await db.insert(crisisArenaEngagementsTable).values({
    id: eng.id,
    tenantId: eng.tenantId,
    ownerId: eng.ownerId || null,
    title: eng.title,
    description: eng.description,
    scopedAssets: eng.scopedAssets,
    scopedDomains: eng.scopedDomains,
    archetypeFilter: eng.archetypeFilter,
    payoutPool: eng.payoutPool,
    deadline: new Date(eng.deadline),
    status: eng.status,
    submissionCount: eng.submissionCount,
    acceptedCount: eng.acceptedCount,
    createdAt: new Date(eng.createdAt),
    updatedAt: new Date(eng.updatedAt),
  });
}

export async function updateEngagement(id: string, fields: Partial<Engagement>): Promise<void> {
  const values: Record<string, unknown> = { updatedAt: new Date() };
  if (fields.status !== undefined) values['status'] = fields.status;
  if (fields.submissionCount !== undefined) values['submissionCount'] = fields.submissionCount;
  if (fields.acceptedCount !== undefined) values['acceptedCount'] = fields.acceptedCount;
  if (fields.payoutPool !== undefined) values['payoutPool'] = fields.payoutPool;
  await db
    .update(crisisArenaEngagementsTable)
    .set(values)
    .where(eq(crisisArenaEngagementsTable.id, id));
}

// ─── Submission CRUD ──────────────────────────────────────────────────────────

export async function getSubmission(id: string): Promise<Submission | null> {
  const [row] = await db
    .select()
    .from(crisisArenaSubmissionsTable)
    .where(eq(crisisArenaSubmissionsTable.id, id));
  return row ? rowToSubmission(row) : null;
}

export async function listSubmissionsByEngagement(engagementId: string): Promise<Submission[]> {
  const rows = await db
    .select()
    .from(crisisArenaSubmissionsTable)
    .where(eq(crisisArenaSubmissionsTable.engagementId, engagementId))
    .orderBy(desc(crisisArenaSubmissionsTable.businessImpactScore));
  return rows.map(rowToSubmission);
}

export async function listSubmissionsByArchitect(architectId: string): Promise<Submission[]> {
  const rows = await db
    .select()
    .from(crisisArenaSubmissionsTable)
    .where(eq(crisisArenaSubmissionsTable.architectId, architectId))
    .orderBy(desc(crisisArenaSubmissionsTable.submittedAt));
  return rows.map(rowToSubmission);
}

export async function insertSubmission(sub: Submission): Promise<void> {
  await db.insert(crisisArenaSubmissionsTable).values({
    id: sub.id,
    engagementId: sub.engagementId,
    architectId: sub.architectId,
    title: sub.title,
    narrative: sub.narrative,
    archetype: sub.archetype,
    businessImpactScore: sub.businessImpactScore,
    status: sub.status,
    reputationAwarded: sub.reputationAwarded,
    payoutAwarded: sub.payoutAwarded,
    triageJustification: sub.triageJustification ?? null,
    graduatedIncidentId: sub.graduatedIncidentId ?? null,
    impactEstimate: sub.impactEstimate as Record<string, unknown>,
    killChain: sub.killChain as unknown[],
    submittedAt: new Date(sub.submittedAt),
    updatedAt: new Date(sub.updatedAt),
  });
}

export async function updateSubmission(
  id: string,
  fields: Partial<Submission> & { updatedAt?: string },
): Promise<void> {
  const values: Record<string, unknown> = { updatedAt: new Date() };
  if (fields.status !== undefined) values['status'] = fields.status;
  if (fields.reputationAwarded !== undefined) values['reputationAwarded'] = fields.reputationAwarded;
  if (fields.payoutAwarded !== undefined) values['payoutAwarded'] = fields.payoutAwarded;
  if (fields.triageJustification !== undefined) values['triageJustification'] = fields.triageJustification;
  if (fields.graduatedIncidentId !== undefined) values['graduatedIncidentId'] = fields.graduatedIncidentId;
  await db
    .update(crisisArenaSubmissionsTable)
    .set(values)
    .where(eq(crisisArenaSubmissionsTable.id, id));
}

// ─── Architect Profile CRUD ───────────────────────────────────────────────────

export async function getArchitectProfile(id: string): Promise<ArchitectProfile | null> {
  const [row] = await db
    .select()
    .from(crisisArenaArchitectProfilesTable)
    .where(eq(crisisArenaArchitectProfilesTable.id, id));
  return row ? rowToProfile(row) : null;
}

export async function getArchitectProfileByHandle(handle: string): Promise<ArchitectProfile | null> {
  const [row] = await db
    .select()
    .from(crisisArenaArchitectProfilesTable)
    .where(eq(crisisArenaArchitectProfilesTable.handle, handle));
  return row ? rowToProfile(row) : null;
}

export async function listPublicProfiles(): Promise<ArchitectProfile[]> {
  const rows = await db
    .select()
    .from(crisisArenaArchitectProfilesTable)
    .where(eq(crisisArenaArchitectProfilesTable.isPublic, true))
    .orderBy(desc(crisisArenaArchitectProfilesTable.reputationScore));
  return rows.map(rowToProfile);
}

export async function upsertArchitectProfile(profile: ArchitectProfile): Promise<void> {
  await db
    .insert(crisisArenaArchitectProfilesTable)
    .values({
      id: profile.id,
      handle: profile.handle,
      displayName: profile.displayName,
      bio: profile.bio,
      reputationScore: profile.reputationScore,
      acceptedCount: profile.acceptedCount,
      submissionCount: profile.submissionCount,
      totalImpactUsd: profile.totalImpactUsd,
      badges: profile.badges,
      archetypeStats: profile.archetypeStats as unknown[],
      topScenarioTitles: profile.topScenarioTitles,
      isPublic: profile.isPublic,
    })
    .onConflictDoUpdate({
      target: crisisArenaArchitectProfilesTable.id,
      set: {
        reputationScore: profile.reputationScore,
        acceptedCount: profile.acceptedCount,
        submissionCount: profile.submissionCount,
        totalImpactUsd: profile.totalImpactUsd,
        badges: profile.badges,
        archetypeStats: profile.archetypeStats as unknown[],
        topScenarioTitles: profile.topScenarioTitles,
        isPublic: profile.isPublic,
        updatedAt: new Date(),
      },
    });
}

// ─── Reputation Events ────────────────────────────────────────────────────────

export async function insertReputationEvent(
  evt: Omit<ReputationEvent, 'id'>,
): Promise<void> {
  await db.insert(crisisArenaReputationEventsTable).values({
    architectId: evt.architectId,
    delta: evt.delta,
    reason: evt.reason,
    submissionId: evt.submissionId || null,
    createdAt: new Date(evt.createdAt),
  });
}

export async function listReputationEvents(since?: Date): Promise<ReputationEvent[]> {
  const conditions = since ? [gte(crisisArenaReputationEventsTable.createdAt, since)] : [];
  const rows = await db
    .select()
    .from(crisisArenaReputationEventsTable)
    .where(conditions.length > 0 ? and(...(conditions as Parameters<typeof and>)) : undefined)
    .orderBy(desc(crisisArenaReputationEventsTable.createdAt));
  return rows.map((r) => ({
    id: String(r.id),
    architectId: r.architectId,
    submissionId: r.submissionId ?? '',
    delta: r.delta,
    reason: r.reason,
    createdAt: r.createdAt.toISOString(),
  }));
}

// ─── Triage Events ────────────────────────────────────────────────────────────

export async function insertTriageEvent(evt: TriageEvent): Promise<void> {
  await db.insert(crisisArenaTriageEventsTable).values({
    id: evt.id,
    submissionId: evt.submissionId,
    engagementId: evt.engagementId,
    action: evt.action,
    actor: evt.actor,
    justification: evt.justification,
    payoutAmount: evt.payoutAmount ?? null,
    createdAt: new Date(evt.timestamp),
  });
}

// ─── Update Architect Stats from DB ──────────────────────────────────────────

export async function updateArchitectStats(architectId: string): Promise<void> {
  const profile = await getArchitectProfile(architectId);
  if (!profile) return;

  const mySubmissions = await listSubmissionsByArchitect(architectId);
  const accepted = mySubmissions.filter((s) => ['accepted', 'graduated'].includes(s.status));

  const archetypeMap: Record<string, ArchetypeStat> = {};
  const badgeSet = new Set<ArchetypeBadge>(profile.badges);
  for (const s of accepted) {
    const badge: ArchetypeBadge =
      s.archetype === 'black_swan' ? 'Black Swan' :
      s.archetype === 'cascade' ? 'Cascade' :
      s.archetype === 'insider' ? 'Insider' :
      s.archetype === 'regulatory' ? 'Regulator' :
      s.archetype === 'supply_chain' ? 'Cascade' :
      'Black Swan';
    badgeSet.add(badge);
    if (!archetypeMap[s.archetype]) {
      archetypeMap[s.archetype] = { archetype: s.archetype as ThreatArchetype, badge, count: 0, totalScore: 0 };
    }
    archetypeMap[s.archetype]!.count++;
    archetypeMap[s.archetype]!.totalScore += s.businessImpactScore;
  }

  const updated: ArchitectProfile = {
    ...profile,
    submissionCount: mySubmissions.length,
    acceptedCount: accepted.length,
    totalImpactUsd: accepted.reduce(
      (sum, s) => sum + s.impactEstimate.revenueAtRiskUsd + s.impactEstimate.regulatoryExposureUsd,
      0,
    ),
    badges: [...badgeSet],
    archetypeStats: Object.values(archetypeMap),
    topScenarioTitles: accepted
      .sort((a, b) => b.businessImpactScore - a.businessImpactScore)
      .slice(0, 3)
      .map((s) => s.title),
  };
  await upsertArchitectProfile(updated);
}

// ─── Seed Data (idempotent) ───────────────────────────────────────────────────

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000);
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);
const daysFromNow = (d: number) => new Date(Date.now() + d * 86_400_000);

export async function seedCrisisArenaData(): Promise<void> {
  // Check if already seeded
  const existing = await db
    .select({ id: crisisArenaEngagementsTable.id })
    .from(crisisArenaEngagementsTable)
    .limit(1);
  if (existing.length > 0) return;

  // Architect profiles
  const architects: ArchitectProfile[] = [
    {
      id: 'arch-001', handle: 'BlackSwan_KR', displayName: 'K. Reeves',
      bio: 'Former Fortune 500 CISO. Specializes in quarter-close ransomware cascade scenarios with multi-regulator blast radius.',
      reputationScore: 4820, acceptedCount: 7, submissionCount: 9, totalImpactUsd: 47_000_000,
      badges: ['Black Swan', 'Cascade', 'Regulator'],
      archetypeStats: [
        { archetype: 'ransomware', badge: 'Black Swan', count: 4, totalScore: 312 },
        { archetype: 'cascade', badge: 'Cascade', count: 2, totalScore: 198 },
        { archetype: 'regulatory', badge: 'Regulator', count: 1, totalScore: 88 },
      ],
      joinedAt: daysAgo(120).toISOString(),
      topScenarioTitles: [
        'Ransomware on Billing Cluster — Q4 Close Friday',
        'Supply Chain Cascade: SaaS Vendor MFA Breach',
        'Insider + Regulator Double-Bind: HIPAA + SOX',
      ],
      isPublic: true,
    },
    {
      id: 'arch-002', handle: 'CascadeEngine', displayName: 'M. Alvarado',
      bio: 'OT/ICS security researcher. Models industrial cascade failures and their downstream financial and regulatory blast radius.',
      reputationScore: 3615, acceptedCount: 5, submissionCount: 7, totalImpactUsd: 31_500_000,
      badges: ['Cascade', 'Black Swan'],
      archetypeStats: [
        { archetype: 'cascade', badge: 'Cascade', count: 3, totalScore: 241 },
        { archetype: 'black_swan', badge: 'Black Swan', count: 2, totalScore: 189 },
      ],
      joinedAt: daysAgo(90).toISOString(),
      topScenarioTitles: [
        'OT Segment Cascade to ERP — 72h Operational Halt',
        'Cloud Provider Outage: Multi-AZ Data Corruption',
      ],
      isPublic: true,
    },
    {
      id: 'arch-003', handle: 'RegWatch_EU', displayName: 'S. Fischer',
      bio: 'EU regulatory specialist. Focuses on DORA, NIS2, and GDPR cross-trigger scenarios that generate compound regulatory penalties.',
      reputationScore: 2890, acceptedCount: 4, submissionCount: 5, totalImpactUsd: 22_800_000,
      badges: ['Regulator', 'Insider'],
      archetypeStats: [
        { archetype: 'regulatory', badge: 'Regulator', count: 3, totalScore: 210 },
        { archetype: 'insider', badge: 'Insider', count: 1, totalScore: 75 },
      ],
      joinedAt: daysAgo(60).toISOString(),
      topScenarioTitles: [
        'DORA + GDPR Double-Breach: 72h Notification Clock',
        'NIS2 ICT Third-Party: Vendor Breach Cascade',
      ],
      isPublic: true,
    },
    {
      id: 'arch-004', handle: 'InsiderThreat_X', displayName: 'A. Patel',
      bio: 'Red team lead. Insider threat simulations combining privileged access abuse with supply chain touchpoints.',
      reputationScore: 2240, acceptedCount: 3, submissionCount: 6, totalImpactUsd: 14_500_000,
      badges: ['Insider'],
      archetypeStats: [{ archetype: 'insider', badge: 'Insider', count: 3, totalScore: 186 }],
      joinedAt: daysAgo(45).toISOString(),
      topScenarioTitles: ['Privileged Admin Exfil — Undetected 30 Days'],
      isPublic: true,
    },
    {
      id: 'arch-005', handle: 'SupplyChain_Red', displayName: 'T. Nakamura',
      bio: 'Supply chain attack specialist. Models SaaS vendor compromise propagation across tenant ecosystems.',
      reputationScore: 1780, acceptedCount: 2, submissionCount: 4, totalImpactUsd: 9_200_000,
      badges: ['Cascade'],
      archetypeStats: [{ archetype: 'supply_chain', badge: 'Cascade', count: 2, totalScore: 142 }],
      joinedAt: daysAgo(30).toISOString(),
      topScenarioTitles: ['MFA Provider Compromise: 3,000 Tenant Blast Radius'],
      isPublic: true,
    },
  ];

  for (const a of architects) {
    await upsertArchitectProfile(a);
  }

  // Engagements
  await insertEngagement({
    id: 'eng-001', tenantId: 'tenant-demo', ownerId: 0,
    title: 'Q4 Billing Cluster Resilience',
    description: 'Model the 72-hour cash, customer, and regulatory blast radius of a ransomware event on the billing cluster during quarter-close. Focus on RTO/RPO breach, revenue recognition delay, and regulatory notification timelines.',
    scopedAssets: ['billing-cluster-prod', 'erp-system', 'data-warehouse'],
    scopedDomains: ['Sentra', 'Counsel', 'Terra'],
    archetypeFilter: ['ransomware', 'cascade', 'black_swan'],
    payoutPool: 25000, deadline: daysFromNow(14).toISOString(),
    status: 'accepting', createdAt: daysAgo(7).toISOString(), updatedAt: daysAgo(2).toISOString(),
    submissionCount: 3, acceptedCount: 1,
  });
  await insertEngagement({
    id: 'eng-002', tenantId: 'tenant-demo', ownerId: 0,
    title: 'OT/ICS Supply Chain Attack Modeling',
    description: 'Simulate a supply chain compromise targeting OT/ICS firmware update channels. Model operational downtime, environmental liability, and insurance policy clause triggers.',
    scopedAssets: ['ot-segment', 'plc-controllers', 'scada-server'],
    scopedDomains: ['Sentra', 'Vessels'],
    archetypeFilter: ['supply_chain', 'cascade'],
    payoutPool: 18000, deadline: daysFromNow(21).toISOString(),
    status: 'accepting', createdAt: daysAgo(3).toISOString(), updatedAt: daysAgo(1).toISOString(),
    submissionCount: 1, acceptedCount: 0,
  });
  await insertEngagement({
    id: 'eng-003', tenantId: 'tenant-demo', ownerId: 0,
    title: 'EU DORA Compliance Stress Test',
    description: 'Identify scenarios that simultaneously trigger DORA ICT incident notification, GDPR breach disclosure, and NIS2 reporting obligations. Model compound regulatory penalty exposure.',
    scopedAssets: ['core-banking-api', 'customer-data-lake', 'iam-system'],
    scopedDomains: ['Sentra', 'Counsel'],
    archetypeFilter: ['regulatory', 'insider'],
    payoutPool: 15000, deadline: daysFromNow(10).toISOString(),
    status: 'open', createdAt: daysAgo(1).toISOString(), updatedAt: hoursAgo(6).toISOString(),
    submissionCount: 0, acceptedCount: 0,
  });

  // Submissions
  await insertSubmission({
    id: 'sub-001', engagementId: 'eng-001', architectId: 'arch-001',
    title: 'Ransomware on Billing Cluster — Q4 Close Friday 17:00',
    narrative: 'At 17:00 on a quarter-close Friday, a LockBit-adjacent payload encrypts the billing cluster. Revenue recognition for $14M in Q4 contracts is blocked. Finance cannot close books, triggering a material weakness disclosure risk. The 72-hour window overlaps with three customer SLA breach points and a SEC reporting deadline.',
    killChain: [
      { phase: 'Initial Access', technique: 'T1566.001 Spearphishing', description: 'CFO assistant email compromise via weaponized invoice PDF' },
      { phase: 'Privilege Escalation', technique: 'T1078 Valid Accounts', description: 'Lateral movement to billing admin via stolen SAML token' },
      { phase: 'Impact', technique: 'T1486 Data Encryption', description: 'Ransomware payload deployed to billing cluster and ERP backup shadow copies' },
    ],
    impactEstimate: { revenueAtRiskUsd: 14_000_000, rtoBreach: 4320, rpoBreach: 2880, regulatoryExposureUsd: 2_500_000, blastRadiusDomains: ['Sentra', 'Counsel', 'Terra'] },
    evidenceNotes: 'Based on real Q4 close ransomware incidents at comparably sized SaaS firms. RTO breach assumes 72h TTR from forensics.',
    archetype: 'ransomware', status: 'accepted', businessImpactScore: 98,
    reputationAwarded: 147, payoutAwarded: 8000,
    triageJustification: 'Highest-scoring submission. Scenario is immediately playable in Incident Commander. Business impact model validated against Monte Carlo run.',
    submittedAt: daysAgo(5).toISOString(), updatedAt: daysAgo(4).toISOString(),
  });
  await insertSubmission({
    id: 'sub-002', engagementId: 'eng-001', architectId: 'arch-002',
    title: 'ERP Cascade from Billing Ransomware — Accounts Payable Freeze',
    narrative: 'Secondary cascade from the billing cluster ransomware into the ERP system causes accounts payable to freeze. Supplier contracts contain 48-hour payment clauses with penalty exposure.',
    killChain: [
      { phase: 'Initial Access', technique: 'T1486 Ransomware Spread', description: 'Ransomware propagates from billing cluster to ERP via shared network segment' },
      { phase: 'Impact', technique: 'T1657 Financial Theft', description: 'A/P system unavailability triggers 14 supplier penalty clauses' },
    ],
    impactEstimate: { revenueAtRiskUsd: 4_200_000, rtoBreach: 2880, rpoBreach: 1440, regulatoryExposureUsd: 800_000, blastRadiusDomains: ['Sentra', 'Counsel'] },
    evidenceNotes: 'Supplier penalty exposure derived from standard NET-30 clause with 2% penalty at 48h.',
    archetype: 'cascade', status: 'pending', businessImpactScore: 71,
    reputationAwarded: 0, payoutAwarded: 0,
    submittedAt: daysAgo(3).toISOString(), updatedAt: daysAgo(3).toISOString(),
  });
  await insertSubmission({
    id: 'sub-003', engagementId: 'eng-001', architectId: 'arch-003',
    title: 'Regulatory Double-Bind: SOX + GDPR Simultaneous Trigger',
    narrative: 'The billing cluster ransomware triggers simultaneous SOX material weakness and GDPR Article 33 notification obligations. The 72-hour GDPR clock conflicts with the SEC 4-day material disclosure window, creating a regulatory collision scenario.',
    killChain: [
      { phase: 'Initial Access', technique: 'T1486 Ransomware', description: 'Billing cluster encryption exposes PII in payment records' },
      { phase: 'Regulatory', technique: 'Dual Notification', description: 'GDPR 72h and SEC 4-day clocks run simultaneously with conflicting disclosure obligations' },
    ],
    impactEstimate: { revenueAtRiskUsd: 2_100_000, rtoBreach: 1440, rpoBreach: 720, regulatoryExposureUsd: 4_800_000, blastRadiusDomains: ['Sentra', 'Counsel'] },
    evidenceNotes: 'GDPR Article 83 penalties modeled at 2% of global annual turnover. SOX material weakness modeled at restatement cost.',
    archetype: 'regulatory', status: 'pending', businessImpactScore: 83,
    reputationAwarded: 0, payoutAwarded: 0,
    submittedAt: daysAgo(2).toISOString(), updatedAt: daysAgo(2).toISOString(),
  });
  await insertSubmission({
    id: 'sub-004', engagementId: 'eng-002', architectId: 'arch-005',
    title: 'Firmware Supply Chain Compromise — OT Segment Operational Halt',
    narrative: 'A compromised firmware update from a trusted ICS vendor pushes a dormant backdoor to PLC controllers. Triggered during a maintenance window, it causes a 4-day operational halt. Insurance clause 8.3 requires verified backup cadence — which is already breached.',
    killChain: [
      { phase: 'Supply Chain', technique: 'T1195.002 Compromise Hardware Supply Chain', description: 'ICS vendor firmware update poisoned with persistent backdoor' },
      { phase: 'Execution', technique: 'T1059 Command and Scripting', description: 'Backdoor triggered during maintenance window, causing PLC controller halt' },
      { phase: 'Impact', technique: 'T1498 Operational Disruption', description: '4-day plant operational halt, triggering insurance and environmental liability clauses' },
    ],
    impactEstimate: { revenueAtRiskUsd: 8_400_000, rtoBreach: 5760, rpoBreach: 2880, regulatoryExposureUsd: 1_800_000, blastRadiusDomains: ['Sentra', 'Vessels'] },
    evidenceNotes: 'Operational downtime cost modeled at $2.1M/day for manufacturing context. Insurance clause breach adds $1.8M exposure.',
    archetype: 'supply_chain', status: 'pending', businessImpactScore: 79,
    reputationAwarded: 0, payoutAwarded: 0,
    submittedAt: hoursAgo(18).toISOString(), updatedAt: hoursAgo(18).toISOString(),
  });

  // Triage event for sub-001
  await insertTriageEvent({
    id: randomUUID(), submissionId: 'sub-001', engagementId: 'eng-001',
    action: 'accept', actor: 'SOC Lead',
    justification: 'Highest-scoring submission. Immediately playable in Incident Commander.',
    payoutAmount: 8000, timestamp: daysAgo(4).toISOString(),
  });

  // Reputation event for arch-001
  await insertReputationEvent({
    architectId: 'arch-001', submissionId: 'sub-001',
    delta: 147, reason: 'Accepted submission — BIS 98',
    createdAt: daysAgo(4).toISOString(),
  });

  // Proof chain entry for sub-001 acceptance
  await appendArenaAuditEvent({
    eventType: 'submission.accepted',
    entityId: 'sub-001',
    entityType: 'arena_submission',
    actor: 'SOC Lead',
    payload: { engagementId: 'eng-001', architectId: 'arch-001', score: 98, payoutAwarded: 8000 },
    orgId: null,
  });
}

// Bootstrap seed on module load
seedCrisisArenaData().catch((err) => console.warn('[crisis-arena] seed failed:', err));
