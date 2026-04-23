import { db } from '@szl-holdings/db';
import { approvalRequestsTable } from '@szl-holdings/db';
import { sql } from 'drizzle-orm';
import { logger } from './logger.js';

const DEMO_APPROVALS = [
  {
    resourceType: 'wire_transfer',
    resourceId: 'wire-demo-001',
    title: 'Wire Transfer Authorization — Cascade Partners',
    description: 'CFO-initiated $2.4M wire to Cascade Partners LP closing account. Requires exec sign-off per treasury policy T-12.',
    actionClass: 'authorize',
    priority: 'critical' as const,
    requestedByRole: 'cfo',
    requiredApproverRole: 'exec',
    correlationId: 'demo-wire-001',
    serviceAttribution: 'demo-seed',
    payload: { amount: '$2,400,000', recipient: 'Cascade Partners LP', account: '****4821', currency: 'USD' },
    metadata: { seeded: true, domain: 'portfolio' },
  },
  {
    resourceType: 'vessel_diversion',
    resourceId: 'vessel-demo-002',
    title: 'Route Diversion — MV Meridian Star',
    description: 'Port Kavkaz congestion requires rerouting via Bosporus. 18hr delay projected. Cargo SLA at risk.',
    actionClass: 'acknowledge',
    priority: 'high' as const,
    requestedByRole: 'fleet-ops',
    requiredApproverRole: 'ops',
    correlationId: 'demo-vessel-002',
    serviceAttribution: 'demo-seed',
    payload: { vessel: 'MV Meridian Star', cargo: 'Class B Petroleum', delay: '18hr', alternateRoute: 'Bosporus Strait' },
    metadata: { seeded: true, domain: 'fleet' },
  },
  {
    resourceType: 'security_patch',
    resourceId: 'patch-demo-003',
    title: 'Critical Patch Deployment — CVE-2025-8847',
    description: 'CVSS 9.1 authentication bypass affecting API gateway cluster. Zero-day exploit detected in the wild. Immediate patching required.',
    actionClass: 'authorize',
    priority: 'critical' as const,
    requestedByRole: 'ciso',
    requiredApproverRole: 'exec',
    correlationId: 'demo-patch-003',
    serviceAttribution: 'demo-seed',
    payload: { cve: 'CVE-2025-8847', cvss: '9.1', affectedSystems: ['api-gateway', 'auth-svc'], deployWindow: '2h' },
    metadata: { seeded: true, domain: 'defense' },
  },
  {
    resourceType: 'property_loi',
    resourceId: 'loi-demo-004',
    title: 'LOI Sign-Off — 450 Park Ave South',
    description: 'Letter of Intent for 450 Park Ave South — 22,000 sqft office at $112/sqft NNN. Offer expires in 48 hours.',
    actionClass: 'schedule',
    priority: 'high' as const,
    requestedByRole: 'acquisitions',
    requiredApproverRole: 'exec',
    correlationId: 'demo-loi-004',
    serviceAttribution: 'demo-seed',
    payload: { property: '450 Park Ave South', sqft: 22000, pricePerSqft: '$112', leaseType: 'NNN', expiresIn: '48hr' },
    metadata: { seeded: true, domain: 'properties' },
  },
  {
    resourceType: 'lp_capital_call',
    resourceId: 'capital-demo-005',
    title: 'LP Capital Call — Q2 2026 Draw',
    description: 'Scheduled Q2 capital call to 14 limited partners. Total draw: $8.2M across Fund III.',
    actionClass: 'authorize',
    priority: 'medium' as const,
    requestedByRole: 'ir-ops',
    requiredApproverRole: 'gp',
    correlationId: 'demo-capital-005',
    serviceAttribution: 'demo-seed',
    payload: { fund: 'Fund III', totalDraw: '$8,200,000', lpCount: 14, drawDate: '2026-04-30' },
    metadata: { seeded: true, domain: 'portfolio' },
  },
];

export async function seedQuickActions(): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  for (const approval of DEMO_APPROVALS) {
    try {
      const existing = await db
        .select({ id: approvalRequestsTable.id })
        .from(approvalRequestsTable)
        .where(sql`${approvalRequestsTable.correlationId} = ${approval.correlationId}`)
        .limit(1);

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await db.insert(approvalRequestsTable).values({
        orgId: null,
        resourceType: approval.resourceType,
        resourceId: approval.resourceId,
        title: approval.title,
        description: approval.description,
        actionClass: approval.actionClass,
        priority: approval.priority,
        status: 'pending',
        requestedByRole: approval.requestedByRole,
        requiredApproverRole: approval.requiredApproverRole,
        correlationId: approval.correlationId,
        serviceAttribution: approval.serviceAttribution,
        payload: approval.payload,
        metadata: approval.metadata,
        expiresAt,
      });
      inserted++;
    } catch (err) {
      logger.warn({ err, correlationId: approval.correlationId }, '[seed-quick-actions] Failed to insert approval');
    }
  }

  logger.info({ inserted, skipped }, '[seed-quick-actions] Quick action seed complete');
  return { inserted, skipped };
}
