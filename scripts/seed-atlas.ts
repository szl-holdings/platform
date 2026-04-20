#!/usr/bin/env tsx
/**
 * seed-atlas.ts — ATLAS Spatial Runtime Demo Seed Script
 *
 * Seeds canonical demo scenes for all four domain verticals:
 *   - Aegis: Ransomware branch comparison (INC-2026-001)
 *   - Vessels: Sanctions/weather reroute (IMO-9876543)
 *   - Terra: Property distress stress test (PROP-BK-2026-0142)
 *   - Prism Counsel: Matter pressure & settlement (MTR-2026-0891)
 *
 * Usage:
 *   pnpm seed:atlas
 *   pnpm seed:atlas:aegis
 *   pnpm seed:atlas:vessels
 *   pnpm seed:atlas:terra
 *   pnpm seed:atlas:counsel
 */

import {
  type AtlasArtifactDomain,
  type AtlasTemplateType,
  atlasArtifactsTable,
  db,
} from '@szl-holdings/db';
import { eq } from 'drizzle-orm';

const DEMO_ORG_ID = 1;

type SectionType = 'text' | 'table' | 'chart' | 'image' | 'list' | 'kpi_grid';

interface Section {
  id: string;
  title: string;
  content: string;
  type: SectionType;
  order: number;
  data?: Record<string, unknown>;
}

async function upsertAtlasScene(params: {
  slug: string;
  title: string;
  templateType: AtlasTemplateType;
  domain: AtlasArtifactDomain;
  entityType: string;
  entityId: string;
  sections: Section[];
  metadata: Record<string, unknown>;
}) {
  const existing = await db
    .select()
    .from(atlasArtifactsTable)
    .where(eq(atlasArtifactsTable.slug, params.slug));

  if (existing.length > 0) {
    console.log(`  [skip] Scene already exists: ${params.slug}`);
    return existing[0];
  }

  const [artifact] = await db
    .insert(atlasArtifactsTable)
    .values({
      orgId: DEMO_ORG_ID,
      slug: params.slug,
      title: params.title,
      templateType: params.templateType,
      domain: params.domain,
      entityType: params.entityType,
      entityId: params.entityId,
      version: 1,
      status: 'ready',
      content: {},
      sections: params.sections,
      metadata: params.metadata,
      generatedBy: 'atlas-seed',
      isLatest: true,
    })
    .returning();

  console.log(`  [ok] Created ATLAS scene: ${params.slug} (id: ${artifact.id})`);
  return artifact;
}

async function seedAegisRansomware() {
  console.log('\n[ATLAS:Aegis] Seeding ransomware branch comparison scene...');

  await upsertAtlasScene({
    slug: 'atlas-aegis-ransomware-inc2026001',
    title: 'Ransomware Incident — Branch Comparison (INC-2026-001)',
    templateType: 'incident_packet',
    domain: 'security',
    entityType: 'incident',
    entityId: 'INC-2026-001',
    sections: [
      {
        id: 'incident_summary',
        title: 'Incident Summary',
        content:
          'LockBit 3.0 ransomware variant detected across 3 systems. 2.4TB encrypted. Drift score: 0.82 (critical). Containment: partial.',
        type: 'text',
        order: 0,
      },
      {
        id: 'branch_comparison',
        title: 'Response Branch Comparison',
        content:
          'Branch A (Network Isolation): 72% P(success), 48h recovery, $180K cost. Branch B (Monitor-Contain): 61% P(lateral movement contained), 96h recovery, $380K cost.',
        type: 'table',
        order: 1,
        data: {
          branches: [
            {
              id: 'branch-isolate',
              label: 'Network Isolation Path',
              probability: 0.72,
              recoveryHours: 48,
              estimatedCostUsd: 180000,
              riskLevel: 'high',
            },
            {
              id: 'branch-monitor',
              label: 'Monitor and Contain',
              probability: 0.61,
              recoveryHours: 96,
              estimatedCostUsd: 380000,
              riskLevel: 'critical',
            },
          ],
        },
      },
      {
        id: 'timeline',
        title: 'Incident Timeline',
        content:
          'T+0: Phishing email delivered. T+2h: Initial compromise (AD). T+4h: Lateral movement to ERP. T+6h: Ransomware payload deployed. T+8h: Detection triggered.',
        type: 'list',
        order: 2,
      },
      {
        id: 'mitre_mapping',
        title: 'MITRE ATT&CK Mapping',
        content:
          'T1566.001 (Spearphishing Attachment), T1078 (Valid Accounts), T1486 (Data Encrypted for Impact)',
        type: 'list',
        order: 3,
      },
    ],
    metadata: {
      demo: true,
      scenario: 'ransomware_branch_comparison',
      driftScore: 0.82,
      correlationId: 'demo-aegis-ransomware',
      ransomwareFamily: 'LockBit 3.0',
      encryptedVolumesGb: 2400,
      affectedSystems: ['AD Domain Controller', 'ERP Server', 'File Share'],
    },
  });
}

async function seedVesselsSanctions() {
  console.log('\n[ATLAS:Vessels] Seeding sanctions/weather reroute scene...');

  await upsertAtlasScene({
    slug: 'atlas-vessels-sanctions-imo9876543',
    title: 'MV Pacific Horizon — Sanctions & Weather Reroute',
    templateType: 'voyage_report',
    domain: 'maritime',
    entityType: 'vessel',
    entityId: 'IMO-9876543',
    sections: [
      {
        id: 'voyage_summary',
        title: 'Voyage Summary',
        content:
          'MV Pacific Horizon (IMO-9876543) operating Strait of Hormuz → Rotterdam route. OFAC SDN flag: positive (Bandar Abbas port call). Cargo value: $14.2M. Drift score: 0.61.',
        type: 'text',
        order: 0,
      },
      {
        id: 'route_data',
        title: 'Route Analysis',
        content:
          'Original route: Strait of Hormuz → Suez → Rotterdam (18 days). Cape reroute: Cape Town → Rotterdam (26 days, +$180K fuel). Sanctions risk on original: OFAC enforcement exposure.',
        type: 'table',
        order: 1,
        data: {
          routes: [
            {
              id: 'original',
              label: 'Original Route',
              etaDays: 18,
              sanctionsRisk: 'HIGH',
              additionalCostUsd: 0,
            },
            {
              id: 'cape-reroute',
              label: 'Cape of Good Hope Reroute',
              etaDays: 26,
              sanctionsRisk: 'NONE',
              additionalCostUsd: 180000,
            },
          ],
        },
      },
      {
        id: 'incidents',
        title: 'Risk Flags',
        content:
          '1. OFAC SDN — Bandar Abbas port call detected. 2. Arabian Sea storm system — severity moderate, track intersecting original route days 6–8.',
        type: 'list',
        order: 2,
      },
      {
        id: 'recommendations',
        title: 'Helmsman Recommendation',
        content:
          'Recommend Cape of Good Hope reroute. 88% P(clean transit). $180K additional fuel cost vs. $14.2M cargo exposure and OFAC enforcement risk on original route.',
        type: 'text',
        order: 3,
      },
    ],
    metadata: {
      demo: true,
      scenario: 'sanctions_weather_reroute',
      driftScore: 0.61,
      correlationId: 'demo-vessels-sanctions',
      vesselName: 'MV Pacific Horizon',
      imo: '9876543',
      cargoValueUsd: 14200000,
      sanctionsFlagged: true,
      sanctionsReason: 'OFAC SDN — Bandar Abbas port call',
    },
  });
}

async function seedTerraDistress() {
  console.log('\n[ATLAS:Terra] Seeding property distress stress test scene...');

  await upsertAtlasScene({
    slug: 'atlas-terra-distress-propbk2026-0142',
    title: '842 Atlantic Ave Brooklyn — Pre-Foreclosure Acquisition Analysis',
    templateType: 'property_brief',
    domain: 'real_estate',
    entityType: 'property',
    entityId: 'PROP-BK-2026-0142',
    sections: [
      {
        id: 'property_overview',
        title: 'Property Overview',
        content:
          '842 Atlantic Ave, Brooklyn, NY 11238. Distress score: 87/100. Lis pendens: active. Tax arrears: $142K. Days on market: 214. ARV: $2.8M. Current ask: $1.95M.',
        type: 'text',
        order: 0,
      },
      {
        id: 'market_analysis',
        title: 'Market Context',
        content:
          'Crown Heights/Prospect Heights sub-market. Median PSF: $1,180. Subject property at significant discount to ARV due to distress. Comparable sales: 3 comps within 0.3mi at $2.6–$3.1M.',
        type: 'text',
        order: 1,
      },
      {
        id: 'valuation',
        title: 'Acquisition Scenarios',
        content:
          'Scenario A (Base, 66%): Acquire at $1.82M, settle arrears, reposition. IRR: 24%, net gain $930K. Scenario B (Soft market, 28%): Extended hold, IRR: 14%, gain $560K. Scenario C (Structural, 6%): Post-acq issue, breakeven.',
        type: 'table',
        order: 2,
        data: {
          scenarios: [
            { label: 'Base case', probability: 0.66, irr: 0.24, netGainUsd: 930000 },
            { label: 'Soft market', probability: 0.28, irr: 0.14, netGainUsd: 560000 },
            { label: 'Structural risk', probability: 0.06, irr: 0.0, netGainUsd: 0 },
          ],
        },
      },
      {
        id: 'opportunity_score',
        title: 'ATLAS Opportunity Score',
        content:
          'Composite opportunity score: 84/100. Distress depth: high. Market timing: favorable. Structural risk: low-moderate. Comparable recovery: strong.',
        type: 'kpi_grid',
        order: 3,
      },
    ],
    metadata: {
      demo: true,
      scenario: 'property_distress_stress_test',
      driftScore: 0.74,
      correlationId: 'demo-terra-distress',
      address: '842 Atlantic Ave, Brooklyn, NY 11238',
      distressScore: 87,
      taxArrears: 142000,
      estimatedArv: 2800000,
      currentAskUsd: 1950000,
      lisPendens: true,
    },
  });
}

async function seedPrismCounselMatter() {
  console.log('\n[ATLAS:Counsel] Seeding matter pressure & settlement scene...');

  await upsertAtlasScene({
    slug: 'atlas-counsel-matter-mtr2026-0891',
    title: 'Holloway v. Meridian Capital Group — Settlement Branch Analysis',
    templateType: 'approval_packet',
    domain: 'general',
    entityType: 'matter',
    entityId: 'MTR-2026-0891',
    sections: [
      {
        id: 'request_overview',
        title: 'Matter Overview',
        content:
          'Holloway v. Meridian Capital Group. Commercial dispute. Total exposure: $8.4M. Key deadline: 34 days. Discovery: ongoing. Settlement offer on table: $3.2M. Client pressure score: 78/100.',
        type: 'text',
        order: 0,
      },
      {
        id: 'justification',
        title: 'Settlement Rationale',
        content:
          'Outside counsel recommends modified settlement at $4.2M. Avoids extended discovery cost ($280K est.) and trial exposure ($8.4M). Net savings vs. trial: $2.8M.',
        type: 'text',
        order: 1,
      },
      {
        id: 'risk_assessment',
        title: 'Branch Outcome Analysis',
        content:
          'Path A (Settle at $4.2M, 71%): Total cost $4.2M, trial risk avoided. Path B (Trial, 29%): Full $8.4M exposure + $480K litigation cost.',
        type: 'table',
        order: 2,
        data: {
          paths: [
            {
              label: 'Accelerated settlement at $4.2M',
              probability: 0.71,
              totalCostUsd: 4200000,
              trialRiskAvoided: true,
            },
            {
              label: 'Trial proceeds',
              probability: 0.29,
              totalCostUsd: 8880000,
              trialRiskAvoided: false,
            },
          ],
        },
      },
      {
        id: 'approval_chain',
        title: 'Required Approvals',
        content:
          '1. Outside counsel recommendation (attached). 2. Partner review. 3. Client sign-off. All three gates required before settlement execution via Alloy.',
        type: 'list',
        order: 3,
      },
    ],
    metadata: {
      demo: true,
      scenario: 'matter_pressure_settlement_branch',
      driftScore: 0.55,
      correlationId: 'demo-prism-matter',
      matterTitle: 'Holloway v. Meridian Capital Group',
      matterType: 'commercial_dispute',
      totalExposureUsd: 8400000,
      keyDeadlineDays: 34,
      clientPressureScore: 78,
    },
  });
}

async function main() {
  const args = process.argv.slice(2);
  const target = args[0] ?? 'all';

  console.log(`[seed:atlas] Starting ATLAS demo scene seed (target: ${target})`);

  try {
    if (target === 'all' || target === 'aegis') await seedAegisRansomware();
    if (target === 'all' || target === 'vessels') await seedVesselsSanctions();
    if (target === 'all' || target === 'terra') await seedTerraDistress();
    if (target === 'all' || target === 'counsel') await seedPrismCounselMatter();

    console.log('\n[seed:atlas] ATLAS demo seed complete.');
  } catch (err) {
    console.error('[seed:atlas] Seed failed:', err);
    process.exit(1);
  }
}

main();
