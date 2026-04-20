import {
  addEdgeEvidence,
  listAdapters,
  registerNodeTypes,
  upsertEdge,
  upsertNode,
  upsertNodeAlias,
} from '@szl-holdings/constellation';
import { logger } from './logger';

let _seeded = false;

export async function seedConstellationData(): Promise<void> {
  if (_seeded) return;
  _seeded = true;

  try {
    const adapters = listAdapters();
    const allTypes = adapters.flatMap((a) => a.nodeTypes);
    await registerNodeTypes(allTypes);
    logger.info({ typeCount: allTypes.length }, '[constellation-seed] Node types registered');

    const now = new Date().toISOString();

    const [prop1, prop2, vessel1, lender1, owner1, matter1, incident1, tenant1] = await Promise.all(
      [
        upsertNode({
          domain: 'terra',
          entityType: 'property',
          name: '550 Madison Avenue, New York, NY 10022',
          labels: ['commercial', 'office', 'manhattan'],
          description: 'Class-A office tower in Midtown Manhattan',
          provenance: {
            sourceId: 'terra-seed',
            sourceType: 'seed',
            sourceLabel: 'Constellation Demo Seed',
          },
          freshness: now,
          confidence: 0.95,
          sensitivityTier: 'internal',
          extensions: { externalId: 'TERRA-PROP-001', borough: 'Manhattan', zoning: 'C5-3' },
        }),
        upsertNode({
          domain: 'terra',
          entityType: 'property',
          name: '30 Hudson Yards, New York, NY 10001',
          labels: ['commercial', 'office', 'hudson_yards'],
          description: 'Mixed-use tower at Hudson Yards',
          provenance: {
            sourceId: 'terra-seed',
            sourceType: 'seed',
            sourceLabel: 'Constellation Demo Seed',
          },
          freshness: now,
          confidence: 0.92,
          sensitivityTier: 'internal',
          extensions: { externalId: 'TERRA-PROP-002', borough: 'Manhattan', zoning: 'M1-5' },
        }),
        upsertNode({
          domain: 'vessels',
          entityType: 'vessel',
          name: 'MV Horizon Star',
          labels: ['bulk_carrier', 'panamax'],
          description: 'Panamax bulk carrier, IMO 9876543',
          provenance: {
            sourceId: 'vessels-seed',
            sourceType: 'seed',
            sourceLabel: 'Constellation Demo Seed',
          },
          freshness: now,
          confidence: 0.98,
          sensitivityTier: 'internal',
          extensions: { imo: '9876543', mmsi: '338123456', flag: 'MH' },
        }),
        upsertNode({
          domain: 'terra',
          entityType: 'lender',
          name: 'Meridian Capital Group',
          labels: ['lender', 'commercial_mortgage'],
          description: 'Commercial real estate lender',
          provenance: {
            sourceId: 'terra-seed',
            sourceType: 'seed',
            sourceLabel: 'Constellation Demo Seed',
          },
          freshness: now,
          confidence: 0.9,
          sensitivityTier: 'confidential',
          extensions: { externalId: 'TERRA-LENDER-001' },
        }),
        upsertNode({
          domain: 'terra',
          entityType: 'owner',
          name: 'SZL Real Estate Holdings LLC',
          labels: ['owner', 'corporate'],
          description: 'Corporate property owner entity',
          provenance: {
            sourceId: 'terra-seed',
            sourceType: 'seed',
            sourceLabel: 'Constellation Demo Seed',
          },
          freshness: now,
          confidence: 0.99,
          sensitivityTier: 'confidential',
          extensions: { externalId: 'TERRA-OWNER-001' },
        }),
        upsertNode({
          domain: 'prism',
          entityType: 'matter',
          name: 'SZL v. AcmeCorp — Contract Dispute 2025',
          labels: ['litigation', 'contract'],
          description: 'Contract dispute matter filed in SDNY',
          provenance: {
            sourceId: 'prism-seed',
            sourceType: 'seed',
            sourceLabel: 'Constellation Demo Seed',
          },
          freshness: now,
          confidence: 0.88,
          sensitivityTier: 'confidential',
          extensions: { matterNumber: 'PRISM-2025-0042', jurisdiction: 'SDNY' },
        }),
        upsertNode({
          domain: 'aegis',
          entityType: 'incident',
          name: 'Phishing Campaign — Executive Team Q1-2026',
          labels: ['phishing', 'email', 'executive'],
          description: 'Targeted spear-phishing campaign against executive accounts',
          provenance: {
            sourceId: 'aegis-seed',
            sourceType: 'seed',
            sourceLabel: 'Constellation Demo Seed',
          },
          freshness: now,
          confidence: 0.97,
          sensitivityTier: 'restricted',
          relatedRiskIds: [],
          extensions: { assetId: 'AEGIS-INC-2026-001', severity: 'high' },
        }),
        upsertNode({
          domain: 'imperium',
          entityType: 'tenant',
          name: 'SZL Holdings Production',
          labels: ['production', 'enterprise'],
          description: 'Primary SZL Holdings production tenant',
          provenance: {
            sourceId: 'imperium-seed',
            sourceType: 'seed',
            sourceLabel: 'Constellation Demo Seed',
          },
          freshness: now,
          confidence: 1.0,
          sensitivityTier: 'confidential',
          extensions: { tenantId: 'szl-prod-001' },
        }),
      ],
    );

    await Promise.all([
      upsertNodeAlias(prop1.id, 'terra_external_id', 'TERRA-PROP-001', 'terra', true),
      upsertNodeAlias(prop2.id, 'terra_external_id', 'TERRA-PROP-002', 'terra', true),
      upsertNodeAlias(vessel1.id, 'imo_number', '9876543', 'vessels', true),
      upsertNodeAlias(vessel1.id, 'mmsi', '338123456', 'vessels'),
      upsertNodeAlias(matter1.id, 'prism_matter_number', 'PRISM-2025-0042', 'prism', true),
      upsertNodeAlias(tenant1.id, 'imperium_tenant_id', 'szl-prod-001', 'imperium', true),
    ]);

    const [edge1, edge2, edge3, edge4] = await Promise.all([
      upsertEdge({
        fromNodeId: owner1.id,
        toNodeId: prop1.id,
        relationshipType: 'owns',
        confidence: 0.99,
        source: { sourceId: 'terra-seed', sourceType: 'seed' },
        active: true,
      }),
      upsertEdge({
        fromNodeId: lender1.id,
        toNodeId: prop1.id,
        relationshipType: 'finances',
        confidence: 0.91,
        source: { sourceId: 'terra-seed', sourceType: 'seed' },
        active: true,
      }),
      upsertEdge({
        fromNodeId: owner1.id,
        toNodeId: matter1.id,
        relationshipType: 'party_in',
        confidence: 0.88,
        source: { sourceId: 'prism-seed', sourceType: 'seed' },
        active: true,
      }),
      upsertEdge({
        fromNodeId: incident1.id,
        toNodeId: tenant1.id,
        relationshipType: 'targets',
        confidence: 0.85,
        source: { sourceId: 'aegis-seed', sourceType: 'seed' },
        active: true,
      }),
    ]);

    await Promise.all([
      addEdgeEvidence({
        edgeId: edge1.id,
        evidenceType: 'deed_record',
        payload: { recordId: 'NYC-DEED-2019-8821', filedDate: '2019-04-15' },
        sourceId: 'nyc_property_records',
        sourceLabel: 'NYC Property Records API',
        confidence: 0.99,
        recordedBy: 'terra-ingestion',
      }),
      addEdgeEvidence({
        edgeId: edge2.id,
        evidenceType: 'mortgage_filing',
        payload: { loanAmount: 120000000, currency: 'USD', maturityDate: '2029-01-01' },
        sourceId: 'nyc_acris',
        sourceLabel: 'NYC ACRIS',
        confidence: 0.92,
        recordedBy: 'terra-ingestion',
      }),
      addEdgeEvidence({
        edgeId: edge3.id,
        evidenceType: 'court_filing',
        payload: { caseNumber: '25-cv-04421', court: 'SDNY', filedDate: '2025-03-01' },
        sourceId: 'pacer',
        sourceLabel: 'PACER Court Records',
        confidence: 0.95,
        recordedBy: 'prism-ingestion',
      }),
      addEdgeEvidence({
        edgeId: edge4.id,
        evidenceType: 'email_header_analysis',
        payload: { emailCount: 47, targetAccounts: ['ceo@szl.com', 'cfo@szl.com'] },
        sourceId: 'aegis-email-gateway',
        sourceLabel: 'Aegis Email Gateway',
        confidence: 0.91,
        recordedBy: 'aegis-detection',
      }),
    ]);

    logger.info(
      {
        nodes: 8,
        edges: 4,
        evidenceEntries: 4,
        domains: ['terra', 'vessels', 'prism', 'aegis', 'imperium'],
      },
      '[constellation-seed] Cross-domain demo graph seeded successfully',
    );
  } catch (err) {
    logger.warn({ err }, '[constellation-seed] Seed failed (non-fatal)');
  }
}
