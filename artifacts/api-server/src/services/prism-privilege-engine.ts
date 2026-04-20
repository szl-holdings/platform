import {
  db,
  pcMattersTable,
  pcPrivilegeFlagsTable,
  pcReviewAuditEventsTable,
} from '@szl-holdings/db';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { logger } from '../lib/logger';

export type PrivilegeType =
  | 'attorney_client'
  | 'work_product'
  | 'joint_defense'
  | 'common_interest'
  | 'none';

export interface PrivilegeLogEntry {
  id: number;
  matterId: number;
  entityType: string;
  entityId: number | string;
  documentType: string;
  title: string;
  date: string;
  author: string;
  recipients: string[];
  subject: string;
  privilegeType: PrivilegeType;
  basis: string;
  reviewState: 'unreviewed' | 'confirmed' | 'waived' | 'disputed';
  clawbackStatus: 'none' | 'requested' | 'completed';
  taggedBy?: number;
  createdAt: string;
}

interface TagMeta {
  title?: string;
  date?: string;
  author?: string;
  recipients?: string[];
  subject?: string;
  documentType?: string;
}

const PRIVILEGE_BASIS_MAP: Record<string, string> = {
  attorney_client: 'Attorney-client privilege (Rule 1.6, FRE 502)',
  work_product: 'Work product doctrine (FRCP 26(b)(3))',
  joint_defense: 'Joint defense / common interest privilege',
  common_interest: 'Common interest doctrine',
  none: 'Not privileged',
};

async function getReviewStateForFlag(flagId: number): Promise<string> {
  try {
    const [latest] = await db
      .select({ toState: pcReviewAuditEventsTable.toState })
      .from(pcReviewAuditEventsTable)
      .where(
        and(
          eq(pcReviewAuditEventsTable.action, 'privilege.review_resolved'),
          sql`${pcReviewAuditEventsTable.details}->>'flagId' = ${String(flagId)}`,
        ),
      )
      .orderBy(desc(pcReviewAuditEventsTable.createdAt))
      .limit(1);
    return latest?.toState ?? 'unreviewed';
  } catch {
    return 'unreviewed';
  }
}

async function getClawbackStatusForFlag(
  flagId: number,
): Promise<'none' | 'requested' | 'completed'> {
  try {
    const [latest] = await db
      .select({ action: pcReviewAuditEventsTable.action })
      .from(pcReviewAuditEventsTable)
      .where(
        and(
          sql`${pcReviewAuditEventsTable.action} LIKE 'privilege.clawback%'`,
          sql`${pcReviewAuditEventsTable.details}->>'flagId' = ${String(flagId)}`,
        ),
      )
      .orderBy(desc(pcReviewAuditEventsTable.createdAt))
      .limit(1);
    if (!latest) return 'none';
    if (latest.action === 'privilege.clawback_completed') return 'completed';
    return 'requested';
  } catch {
    return 'none';
  }
}

function parseFlagMeta(flag: typeof pcPrivilegeFlagsTable.$inferSelect): TagMeta {
  try {
    return JSON.parse(flag.notes ?? '{}') as TagMeta;
  } catch {
    return {};
  }
}

async function toLogEntry(
  flag: typeof pcPrivilegeFlagsTable.$inferSelect,
): Promise<PrivilegeLogEntry> {
  const meta = parseFlagMeta(flag);
  const [reviewState, clawbackStatus] = await Promise.all([
    getReviewStateForFlag(flag.id),
    getClawbackStatusForFlag(flag.id),
  ]);
  return {
    id: flag.id,
    matterId: flag.matterId,
    entityType: flag.entityType,
    entityId: flag.entityId,
    documentType: meta.documentType ?? flag.entityType,
    title: meta.title ?? `${flag.entityType} ${flag.entityId}`,
    date: meta.date ?? flag.createdAt.toISOString().slice(0, 10),
    author: meta.author ?? 'Unknown',
    recipients: meta.recipients ?? [],
    subject: meta.subject ?? '',
    privilegeType: flag.flagType as PrivilegeType,
    basis: PRIVILEGE_BASIS_MAP[flag.flagType] ?? 'Privileged',
    reviewState: reviewState as PrivilegeLogEntry['reviewState'],
    clawbackStatus,
    taggedBy: flag.flaggedBy ?? undefined,
    createdAt: flag.createdAt.toISOString(),
  };
}

class PrivilegeEngine {
  async tagEntity(opts: {
    matterId: number;
    orgId: number;
    entityType: string;
    entityId: number;
    flagType: Exclude<PrivilegeType, 'none'>;
    taggedBy?: number;
    meta?: TagMeta;
  }): Promise<{ tagId: number; flagType: string; basis: string }> {
    const notesJson = JSON.stringify({
      title: opts.meta?.title,
      date: opts.meta?.date ?? new Date().toISOString().slice(0, 10),
      author: opts.meta?.author,
      recipients: opts.meta?.recipients ?? [],
      subject: opts.meta?.subject ?? '',
      documentType: opts.meta?.documentType ?? opts.entityType,
    });

    const [inserted] = await db
      .insert(pcPrivilegeFlagsTable)
      .values({
        matterId: opts.matterId,
        entityType: opts.entityType,
        entityId: opts.entityId,
        flagType: opts.flagType as
          | 'attorney_client'
          | 'work_product'
          | 'joint_defense'
          | 'common_interest',
        flaggedBy: opts.taggedBy,
        notes: notesJson,
      })
      .returning({ id: pcPrivilegeFlagsTable.id });

    await db.insert(pcReviewAuditEventsTable).values({
      orgId: opts.orgId,
      matterId: opts.matterId,
      actorId: opts.taggedBy,
      action: 'privilege.tagged',
      toState: 'unreviewed',
      details: {
        flagId: inserted.id,
        flagType: opts.flagType,
        entityType: opts.entityType,
        entityId: opts.entityId,
      },
      proofChainPreserved: true,
    });

    return {
      tagId: inserted.id,
      flagType: opts.flagType,
      basis: PRIVILEGE_BASIS_MAP[opts.flagType] ?? 'Privileged',
    };
  }

  async resolveReview(
    flagId: number,
    decision: 'confirmed' | 'waived' | 'disputed',
    actorId: number,
    orgId: number,
  ): Promise<{ flagId: number; newState: string }> {
    const [row] = await db
      .select({
        id: pcPrivilegeFlagsTable.id,
        matterId: pcPrivilegeFlagsTable.matterId,
        matterOrgId: pcMattersTable.orgId,
      })
      .from(pcPrivilegeFlagsTable)
      .innerJoin(pcMattersTable, eq(pcMattersTable.id, pcPrivilegeFlagsTable.matterId))
      .where(eq(pcPrivilegeFlagsTable.id, flagId));

    if (!row) throw Object.assign(new Error('Privilege flag not found'), { statusCode: 404 });
    if (row.matterOrgId !== orgId) {
      throw Object.assign(
        new Error('Access denied — privilege flag belongs to a different organization'),
        { statusCode: 403 },
      );
    }

    await db.insert(pcReviewAuditEventsTable).values({
      orgId,
      matterId: row.matterId,
      actorId,
      action: 'privilege.review_resolved',
      fromState: 'unreviewed',
      toState: decision,
      details: { flagId: row.id, decision },
      proofChainPreserved: true,
    });

    return { flagId: row.id, newState: decision };
  }

  async requestClawback(
    flagId: number,
    reason: string,
    actorId: number,
    orgId: number,
  ): Promise<{ flagId: number; clawbackId: number }> {
    const [row] = await db
      .select({
        id: pcPrivilegeFlagsTable.id,
        matterId: pcPrivilegeFlagsTable.matterId,
        matterOrgId: pcMattersTable.orgId,
      })
      .from(pcPrivilegeFlagsTable)
      .innerJoin(pcMattersTable, eq(pcMattersTable.id, pcPrivilegeFlagsTable.matterId))
      .where(eq(pcPrivilegeFlagsTable.id, flagId));

    if (!row) throw Object.assign(new Error('Privilege flag not found'), { statusCode: 404 });
    if (row.matterOrgId !== orgId) {
      throw Object.assign(
        new Error('Access denied — privilege flag belongs to a different organization'),
        { statusCode: 403 },
      );
    }

    const [event] = await db
      .insert(pcReviewAuditEventsTable)
      .values({
        orgId,
        matterId: row.matterId,
        actorId,
        action: 'privilege.clawback_requested',
        toState: 'clawback_requested',
        details: { flagId: row.id, reason },
        proofChainPreserved: true,
      })
      .returning({ id: pcReviewAuditEventsTable.id });

    return { flagId: row.id, clawbackId: event.id };
  }

  async getPrivilegeLog(matterId: number, orgId: number): Promise<PrivilegeLogEntry[]> {
    const [matter] = await db
      .select({ orgId: pcMattersTable.orgId })
      .from(pcMattersTable)
      .where(eq(pcMattersTable.id, matterId));

    if (!matter || matter.orgId !== orgId) return [];

    const flags = await db
      .select()
      .from(pcPrivilegeFlagsTable)
      .where(eq(pcPrivilegeFlagsTable.matterId, matterId))
      .orderBy(desc(pcPrivilegeFlagsTable.createdAt));

    return Promise.all(flags.map(toLogEntry));
  }

  async generatePrivilegeLogForProduction(
    matterId: number,
    orgId: number,
  ): Promise<{
    matterId: number;
    items: PrivilegeLogEntry[];
    withheldCount: number;
    producibleItems: PrivilegeLogEntry[];
    exportBlocked: boolean;
  }> {
    const all = await this.getPrivilegeLog(matterId, orgId);
    const withheld = all.filter((e) => e.reviewState !== 'waived');
    const producible = all.filter((e) => e.reviewState === 'waived');

    return {
      matterId,
      items: all,
      withheldCount: withheld.length,
      producibleItems: producible,
      exportBlocked: withheld.length > 0,
    };
  }

  async getReviewQueue(orgId: number, matterId?: number): Promise<PrivilegeLogEntry[]> {
    const matterIds = await this.getOrgMatterIds(orgId, matterId);
    if (matterIds.length === 0) return [];

    const flags = await db
      .select()
      .from(pcPrivilegeFlagsTable)
      .where(inArray(pcPrivilegeFlagsTable.matterId, matterIds))
      .orderBy(desc(pcPrivilegeFlagsTable.createdAt));

    const entries = await Promise.all(flags.map(toLogEntry));
    return entries.filter((e) => e.reviewState === 'unreviewed');
  }

  async filterForExport(
    items: Array<{ entityId: number | string; entityType: string; matterId?: number }>,
    orgId: number,
  ): Promise<{
    safe: typeof items;
    blocked: typeof items;
    blockedCount: number;
    blockedEntityIds: (number | string)[];
    exportSafe: boolean;
  }> {
    if (items.length === 0) {
      return { safe: [], blocked: [], blockedCount: 0, blockedEntityIds: [], exportSafe: true };
    }

    const entityIds = items
      .map((i) => (typeof i.entityId === 'number' ? i.entityId : parseInt(String(i.entityId), 10)))
      .filter((n) => !isNaN(n));

    const flags = await db
      .select({ id: pcPrivilegeFlagsTable.id, entityId: pcPrivilegeFlagsTable.entityId })
      .from(pcPrivilegeFlagsTable)
      .innerJoin(pcMattersTable, eq(pcMattersTable.id, pcPrivilegeFlagsTable.matterId))
      .where(
        and(eq(pcMattersTable.orgId, orgId), inArray(pcPrivilegeFlagsTable.entityId, entityIds)),
      );

    const blockedEntityIds = new Set<number>();
    for (const flag of flags) {
      const state = await getReviewStateForFlag(flag.id);
      if (state !== 'waived') {
        blockedEntityIds.add(flag.entityId);
      }
    }

    const toId = (i: (typeof items)[0]) =>
      typeof i.entityId === 'number' ? i.entityId : parseInt(String(i.entityId), 10);

    const safe = items.filter((i) => !blockedEntityIds.has(toId(i)));
    const blocked = items.filter((i) => blockedEntityIds.has(toId(i)));

    return {
      safe,
      blocked,
      blockedCount: blocked.length,
      blockedEntityIds: blocked.map((i) => i.entityId),
      exportSafe: blocked.length === 0,
    };
  }

  async getStats(orgId: number): Promise<{
    totalTagged: number;
    byType: Record<string, number>;
    pendingReview: number;
    clawbackActive: number;
  }> {
    const matterIds = await this.getOrgMatterIds(orgId);
    if (matterIds.length === 0) {
      return { totalTagged: 0, byType: {}, pendingReview: 0, clawbackActive: 0 };
    }

    const flags = await db
      .select()
      .from(pcPrivilegeFlagsTable)
      .where(inArray(pcPrivilegeFlagsTable.matterId, matterIds));

    const byType: Record<string, number> = {};
    let pendingReview = 0;
    let clawbackActive = 0;

    for (const flag of flags) {
      byType[flag.flagType] = (byType[flag.flagType] ?? 0) + 1;
      const state = await getReviewStateForFlag(flag.id);
      if (state === 'unreviewed') pendingReview++;
      const cb = await getClawbackStatusForFlag(flag.id);
      if (cb === 'requested') clawbackActive++;
    }

    return { totalTagged: flags.length, byType, pendingReview, clawbackActive };
  }

  async classifyContent(
    content: string,
    context: { authorRole?: string; recipientRoles?: string[]; subject?: string } = {},
  ): Promise<{ suggestedType: PrivilegeType; confidence: number; reasoning: string }> {
    const lower = content.toLowerCase();
    const subject = (context.subject ?? '').toLowerCase();
    const authorRole = (context.authorRole ?? '').toLowerCase();
    const recipientRoles = context.recipientRoles?.map((r) => r.toLowerCase()) ?? [];
    const isAttorneyInvolved =
      authorRole.includes('attorney') ||
      authorRole.includes('counsel') ||
      authorRole.includes('lawyer') ||
      recipientRoles.some(
        (r) => r.includes('attorney') || r.includes('counsel') || r.includes('lawyer'),
      );

    const signals: string[] = [];
    let type: PrivilegeType = 'none';
    let confidence = 0.3;

    if (
      lower.includes('privileged') ||
      lower.includes('attorney-client') ||
      lower.includes('work product')
    ) {
      signals.push('Explicit privilege marking detected');
      type = 'attorney_client';
      confidence = 0.92;
    } else if (
      isAttorneyInvolved &&
      (lower.includes('legal advice') ||
        lower.includes('confidential') ||
        lower.includes('strategy'))
    ) {
      signals.push('Attorney involvement with legal advice content');
      type = 'attorney_client';
      confidence = 0.85;
    } else if (
      lower.includes('trial') ||
      lower.includes('litigation') ||
      lower.includes('prepared in anticipation')
    ) {
      signals.push('Work product indicators present');
      type = 'work_product';
      confidence = 0.78;
    } else if (lower.includes('joint defense') || lower.includes('common interest')) {
      signals.push('Joint defense indicators detected');
      type = 'joint_defense';
      confidence = 0.82;
    } else if (isAttorneyInvolved) {
      signals.push('Attorney in communication chain');
      type = 'attorney_client';
      confidence = 0.55;
    }

    return {
      suggestedType: type,
      confidence,
      reasoning:
        signals.length > 0
          ? signals.join('; ')
          : 'No privilege indicators detected; document appears non-privileged',
    };
  }

  private async getOrgMatterIds(orgId: number, specificMatterId?: number): Promise<number[]> {
    if (specificMatterId) {
      const [m] = await db
        .select({ id: pcMattersTable.id, orgId: pcMattersTable.orgId })
        .from(pcMattersTable)
        .where(eq(pcMattersTable.id, specificMatterId));
      if (!m || m.orgId !== orgId) return [];
      return [m.id];
    }
    const matters = await db
      .select({ id: pcMattersTable.id })
      .from(pcMattersTable)
      .where(eq(pcMattersTable.orgId, orgId));
    return matters.map((m) => m.id);
  }
}

export const privilegeEngine = new PrivilegeEngine();
