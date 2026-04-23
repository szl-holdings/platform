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
    resourceType: 'client_engagement',
    resourceId: 'advisory-demo-005',
    title: 'Client Onboarding — Meridian Capital Partners (AUM $2.1B)',
    description: 'New family office seeking advisory mandate. KYC/AML clearance received. Engagement letter and fee schedule require partner sign-off before services commence.',
    actionClass: 'authorize',
    priority: 'medium' as const,
    requestedByRole: 'business-development',
    requiredApproverRole: 'partner',
    correlationId: 'demo-advisory-005',
    serviceAttribution: 'demo-seed',
    payload: { client: 'Meridian Capital Partners', aum: '$2.1B', engagementType: 'Family Office Advisory', kycStatus: 'cleared' },
    metadata: { seeded: true, domain: 'advisory' },
  },
  {
    resourceType: 'ops_latency_alert',
    resourceId: 'ops-demo-006',
    title: 'SLO Breach — Production API P99 Latency > 8s (23% of Requests)',
    description: 'API gateway P99 response time has exceeded SLO threshold for 18 consecutive minutes. Auto-remediation paused pending operator acknowledgment. Rollback or scale-out approval needed.',
    actionClass: 'acknowledge',
    priority: 'critical' as const,
    requestedByRole: 'platform-engineering',
    requiredApproverRole: 'engineer',
    correlationId: 'demo-ops-006',
    serviceAttribution: 'demo-seed',
    payload: { metric: 'P99 Latency', value: '8.4s', sloThreshold: '2s', affectedRequests: '23%' },
    metadata: { seeded: true, domain: 'operations' },
  },
];

export async function seedQuickActions(
  demoOrgId?: number | null,
): Promise<{ inserted: number; skipped: number }> {
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
        orgId: demoOrgId ?? null,
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
