/**
 * Cross-Domain Constellation Demo Seed
 *
 * Populates Constellation with a coherent cross-domain scenario:
 *   • Terra:   A real-estate property — "Harbor View Tower" (San Francisco)
 *   • Vessels: A vessel charter linked to the property's cargo supply chain
 *   • PRISM:   A legal matter related to the property's title dispute
 *   • Aegis:   A security incident at the property site
 *   • Lyte:    A financial signal showing occupancy revenue trending down
 *
 * These five entities are cross-linked so every domain has something to
 * render against real Constellation data from day one.
 *
 * Usage:
 *   pnpm --filter @workspace/demo-seed run seed:constellation
 *   Or imported by the full seed runner via seedAllNarratives().
 *
 * Idempotent: nodes are upserted by alias; re-running is safe.
 */

import type { CreateCstNode } from '@szl-holdings/constellation';
import {
  addEdgeEvidence,
  lookupNodeByAlias,
  upsertEdge,
  upsertNode,
  upsertNodeAlias,
} from '@szl-holdings/constellation';

const SEED_VERSION = '1.0.0';
const SEED_SOURCE_ID = 'demo-constellation-seed';

function now() {
  return new Date().toISOString();
}

function provenance(label: string) {
  return {
    sourceId: SEED_SOURCE_ID,
    sourceType: 'seed' as const,
    sourceLabel: label,
  };
}

export interface ConstellationSeedResult {
  terraNodeId: string;
  vesselsNodeId: string;
  prismNodeId: string;
  aegisNodeId: string;
  lyteNodeId: string;
  edgeIds: string[];
  seedVersion: string;
  seededAt: string;
}

/**
 * Seed or return the cross-domain demo Constellation scenario.
 * Idempotent — safe to call multiple times.
 */
export async function seedConstellationDemo(): Promise<ConstellationSeedResult> {
  console.log('[constellation-seed] Starting cross-domain Constellation seed…');

  // ── 1. Terra — Harbor View Tower property ─────────────────────────────────
  const TERRA_ALIAS = { type: 'demo_key', value: 'demo-terra-harbor-view-tower' };
  let terraNode = await lookupNodeByAlias(TERRA_ALIAS.type, TERRA_ALIAS.value);
  if (!terraNode) {
    const input: CreateCstNode = {
      domain: 'terra',
      entityType: 'property',
      labels: ['real-estate', 'commercial', 'demo'],
      name: 'Harbor View Tower',
      description:
        'Mixed-use commercial tower in SF Financial District. Subject of active title dispute and occupancy revenue decline signal.',
      provenance: provenance('terra-demo-seed'),
      confidence: 0.92,
      sensitivityTier: 'confidential',
      extensions: {
        externalId: 'TERRA-PROP-2024-0081',
        address: 'One Market Street, San Francisco, CA 94105',
        valuationUsd: 142_000_000,
        squareFeet: 312_000,
        occupancyRate: 0.71,
        acquisitionDate: '2021-03-15',
        demo: true,
        seedVersion: SEED_VERSION,
      },
    };
    terraNode = await upsertNode(input);
    await upsertNodeAlias(terraNode.id, TERRA_ALIAS.type, TERRA_ALIAS.value, 'demo-seed', true);
    console.log(`[constellation-seed] ✓ Terra node: ${terraNode.id}`);
  } else {
    console.log(`[constellation-seed] ↩ Terra node exists: ${terraNode.id}`);
  }

  // ── 2. Vessels — MV Pacific Carrier charter ───────────────────────────────
  const VESSEL_ALIAS = { type: 'demo_key', value: 'demo-vessels-mv-pacific-carrier' };
  let vesselsNode = await lookupNodeByAlias(VESSEL_ALIAS.type, VESSEL_ALIAS.value);
  if (!vesselsNode) {
    const input: CreateCstNode = {
      domain: 'vessels',
      entityType: 'vessel',
      labels: ['bulk-carrier', 'charter', 'demo'],
      name: 'MV Pacific Carrier',
      description:
        'Bulk carrier vessel on charter supplying construction materials to Harbor View Tower renovation. Currently under sanctions screening review.',
      provenance: provenance('vessels-demo-seed'),
      confidence: 0.88,
      sensitivityTier: 'internal',
      extensions: {
        externalId: 'VESSEL-IMO-9823471',
        imo: '9823471',
        flag: 'Panama',
        vesselType: 'Bulk Carrier',
        grossTonnage: 45_200,
        charterRate: 18_500,
        charterCurrency: 'USD',
        charterPeriodDays: 90,
        linkedPropertyId: 'TERRA-PROP-2024-0081',
        demo: true,
        seedVersion: SEED_VERSION,
      },
    };
    vesselsNode = await upsertNode(input);
    await upsertNodeAlias(vesselsNode.id, VESSEL_ALIAS.type, VESSEL_ALIAS.value, 'demo-seed', true);
    console.log(`[constellation-seed] ✓ Vessels node: ${vesselsNode.id}`);
  } else {
    console.log(`[constellation-seed] ↩ Vessels node exists: ${vesselsNode.id}`);
  }

  // ── 3. PRISM — Title Dispute Matter ───────────────────────────────────────
  const PRISM_ALIAS = { type: 'demo_key', value: 'demo-prism-harbor-view-title-dispute' };
  let prismNode = await lookupNodeByAlias(PRISM_ALIAS.type, PRISM_ALIAS.value);
  if (!prismNode) {
    const input: CreateCstNode = {
      domain: 'prism',
      entityType: 'matter',
      labels: ['real-estate-law', 'title-dispute', 'demo'],
      name: 'Harbor View Tower — Title Dispute',
      description:
        'Active legal matter challenging chain of title for Harbor View Tower. Filed by Meridian Development LLC in SF Superior Court. PRISM tracking discovery deadlines and settlement pressure.',
      provenance: provenance('prism-demo-seed'),
      confidence: 0.97,
      sensitivityTier: 'confidential',
      extensions: {
        externalId: 'PRISM-MATTER-2024-7734',
        caseNumber: 'CGC-24-621891',
        court: 'San Francisco County Superior Court',
        filingDate: '2024-01-22',
        nextDeadline: '2026-05-15',
        estimatedExposureUsd: 28_500_000,
        settlementPressureScore: 0.74,
        linkedPropertyId: 'TERRA-PROP-2024-0081',
        demo: true,
        seedVersion: SEED_VERSION,
      },
    };
    prismNode = await upsertNode(input);
    await upsertNodeAlias(prismNode.id, PRISM_ALIAS.type, PRISM_ALIAS.value, 'demo-seed', true);
    console.log(`[constellation-seed] ✓ PRISM node: ${prismNode.id}`);
  } else {
    console.log(`[constellation-seed] ↩ PRISM node exists: ${prismNode.id}`);
  }

  // ── 4. Aegis — Physical Security Incident ─────────────────────────────────
  const AEGIS_ALIAS = { type: 'demo_key', value: 'demo-aegis-harbor-view-incident' };
  let aegisNode = await lookupNodeByAlias(AEGIS_ALIAS.type, AEGIS_ALIAS.value);
  if (!aegisNode) {
    const input: CreateCstNode = {
      domain: 'aegis',
      entityType: 'incident',
      labels: ['physical-security', 'access-control', 'demo'],
      name: 'Harbor View Tower — Unauthorized Access Incident',
      description:
        'Security breach: unauthorized personnel accessed server room on Floor 12 during the title dispute discovery period. Aegis flagged correlation with litigation timeline as a potential evidence-tampering risk.',
      provenance: provenance('aegis-demo-seed'),
      confidence: 0.85,
      sensitivityTier: 'restricted',
      extensions: {
        externalId: 'AEGIS-INC-2026-0341',
        severity: 'high',
        incidentDate: '2026-02-14',
        location: 'Harbor View Tower, Floor 12, Server Room',
        riskCorrelation: 'title-dispute-evidence',
        containmentStatus: 'contained',
        linkedMatterId: 'PRISM-MATTER-2024-7734',
        demo: true,
        seedVersion: SEED_VERSION,
      },
    };
    aegisNode = await upsertNode(input);
    await upsertNodeAlias(aegisNode.id, AEGIS_ALIAS.type, AEGIS_ALIAS.value, 'demo-seed', true);
    console.log(`[constellation-seed] ✓ Aegis node: ${aegisNode.id}`);
  } else {
    console.log(`[constellation-seed] ↩ Aegis node exists: ${aegisNode.id}`);
  }

  // ── 5. Lyte — Revenue Signal ───────────────────────────────────────────────
  const LYTE_ALIAS = { type: 'demo_key', value: 'demo-lyte-harbor-view-occupancy-signal' };
  let lyteNode = await lookupNodeByAlias(LYTE_ALIAS.type, LYTE_ALIAS.value);
  if (!lyteNode) {
    const input: CreateCstNode = {
      domain: 'lyte',
      entityType: 'signal',
      labels: ['revenue', 'occupancy', 'real-estate', 'demo'],
      name: 'Harbor View Tower — Occupancy Revenue Decline',
      description:
        'Lyte detected a 23% QoQ occupancy revenue decline at Harbor View Tower. Correlated with the ongoing title dispute uncertainty and the physical security incident. AI recommendation: engage distressed asset advisory.',
      provenance: provenance('lyte-demo-seed'),
      confidence: 0.91,
      sensitivityTier: 'internal',
      extensions: {
        externalId: 'LYTE-SIG-2026-HVT-0019',
        signalType: 'revenue_decline',
        magnitude: -0.23,
        period: 'Q1-2026',
        revenueAtRiskUsd: 6_400_000,
        anomalyScore: 0.89,
        recommendationId: 'LYTE-REC-2026-0142',
        linkedPropertyId: 'TERRA-PROP-2024-0081',
        demo: true,
        seedVersion: SEED_VERSION,
      },
    };
    lyteNode = await upsertNode(input);
    await upsertNodeAlias(lyteNode.id, LYTE_ALIAS.type, LYTE_ALIAS.value, 'demo-seed', true);
    console.log(`[constellation-seed] ✓ Lyte node: ${lyteNode.id}`);
  } else {
    console.log(`[constellation-seed] ↩ Lyte node exists: ${lyteNode.id}`);
  }

  // ── 6. Cross-domain edges ─────────────────────────────────────────────────
  const edgeIds: string[] = [];

  async function ensureEdge(
    fromId: string,
    toId: string,
    relType: string,
    label: string,
    conf = 0.9,
  ) {
    try {
      const edge = await upsertEdge({
        fromNodeId: fromId,
        toNodeId: toId,
        relationshipType: relType,
        confidence: conf,
        source: provenance(label),
        active: true,
        extensions: { demo: true, seedVersion: SEED_VERSION },
      });
      edgeIds.push(edge.id);
      console.log(
        `[constellation-seed] ✓ Edge: ${relType} (${fromId.slice(0, 8)}→${toId.slice(0, 8)})`,
      );
    } catch (err) {
      console.warn(
        `[constellation-seed] ⚠ Edge ${relType} may already exist or failed:`,
        (err as Error).message,
      );
    }
  }

  // Terra → Vessels: property charter (supply chain link)
  await ensureEdge(terraNode.id, vesselsNode.id, 'depends-on', 'terra-vessels-charter', 0.87);
  // Terra → PRISM: property is the subject of the matter
  await ensureEdge(terraNode.id, prismNode.id, 'affects', 'terra-prism-matter', 0.97);
  // Aegis → PRISM: security incident correlates with litigation risk
  await ensureEdge(aegisNode.id, prismNode.id, 'relates-to', 'aegis-prism-correlation', 0.82);
  // Lyte → Terra: signal derives from the property
  await ensureEdge(lyteNode.id, terraNode.id, 'derived-from', 'lyte-terra-signal', 0.91);
  // Aegis → Terra: incident is at the property
  await ensureEdge(aegisNode.id, terraNode.id, 'affects', 'aegis-terra-incident', 0.85);
  // Lyte → PRISM: revenue decline amplifies legal exposure
  await ensureEdge(lyteNode.id, prismNode.id, 'triggers', 'lyte-prism-exposure', 0.76);

  const result: ConstellationSeedResult = {
    terraNodeId: terraNode.id,
    vesselsNodeId: vesselsNode.id,
    prismNodeId: prismNode.id,
    aegisNodeId: aegisNode.id,
    lyteNodeId: lyteNode.id,
    edgeIds,
    seedVersion: SEED_VERSION,
    seededAt: now(),
  };

  console.log(
    `[constellation-seed] ✓ Done. 5 nodes + ${edgeIds.length} cross-domain edges seeded.`,
  );
  return result;
}

/**
 * Clear all demo Constellation nodes/edges (tagged demo=true in extensions).
 * Used by the demo reset flow.
 */
export async function clearConstellationDemo(): Promise<void> {
  console.log('[constellation-seed] Clearing Constellation demo data…');
  const { db, cstNodes, cstEdges } = await import('@szl-holdings/db');
  const { sql } = await import('drizzle-orm');

  await db.delete(cstEdges).where(sql`extensions->>'demo' = 'true'`);
  await db.delete(cstNodes).where(sql`extensions->>'demo' = 'true'`);
  console.log('[constellation-seed] ✓ Constellation demo data cleared');
}
