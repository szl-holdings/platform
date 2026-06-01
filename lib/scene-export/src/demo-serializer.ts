import { exportBranchPackage } from './adapters/branch-package.js';
import { exportJsonSnapshot } from './adapters/json-snapshot.js';
import { buildOpenUSDManifest, exportOpenUSDManifest } from './adapters/openusd-manifest.js';
import { exportProofBundle } from './adapters/proof-bundle.js';
import type { BranchPackage, ExportAdapterResult, ProofBundle, SceneSnapshot } from './types.js';

export interface DemoSceneBundle {
  domain: string;
  label: string;
  snapshot: ExportAdapterResult;
  branch?: ExportAdapterResult;
  proof?: ExportAdapterResult;
  usdManifest?: ExportAdapterResult;
  generatedAt: string;
}

export function serializeDemoScene(params: {
  snapshot: SceneSnapshot;
  branch?: BranchPackage;
  proof?: ProofBundle;
  includeUSD?: boolean;
}): DemoSceneBundle {
  const snapshot = exportJsonSnapshot(params.snapshot);
  const branch = params.branch ? exportBranchPackage(params.branch) : undefined;
  const proof = params.proof ? exportProofBundle(params.proof) : undefined;

  let usdManifest: ExportAdapterResult | undefined;
  if (params.includeUSD) {
    const manifest = buildOpenUSDManifest({
      stage: `/ATLAS/${params.snapshot.domain}/${params.snapshot.entityId}`,
      domain: params.snapshot.domain,
      entityId: params.snapshot.entityId,
      proofChainId: params.snapshot.proofChainId,
      sceneState: params.snapshot.state,
    });
    usdManifest = exportOpenUSDManifest(manifest);
  }

  return {
    domain: params.snapshot.domain,
    label: `${params.snapshot.domain}::${params.snapshot.entityId}`,
    snapshot,
    branch,
    proof,
    usdManifest,
    generatedAt: new Date().toISOString(),
  };
}

export function buildAegisRansomwareDemoScene(): DemoSceneBundle {
  const snapshot: SceneSnapshot = {
    sceneId: 'aegis-ransomware-branch-demo',
    domain: 'security',
    entityType: 'incident',
    entityId: 'INC-2026-001',
    capturedAt: new Date().toISOString(),
    driftScore: 0.82,
    proofChainId: null,
    correlationId: 'demo-aegis-ransomware',
    state: {
      incidentId: 'INC-2026-001',
      severity: 'critical',
      attackVector: 'phishing',
      affectedSystems: ['AD Domain Controller', 'ERP Server', 'File Share'],
      ransomwareFamily: 'LockBit 3.0',
      encryptedVolumesGb: 2400,
      containmentStatus: 'partial',
      mitreTechniques: ['T1566.001', 'T1078', 'T1486'],
      driftFromBaseline: 0.82,
    },
    metadata: { demo: true, scenario: 'ransomware_branch_comparison' },
  };

  const branch: BranchPackage = {
    parentSceneId: 'aegis-ransomware-branch-demo',
    branchId: 'aegis-isolate-branch',
    branchLabel: 'Network Isolation Path',
    domain: 'security',
    branchedAt: new Date().toISOString(),
    hypothesis:
      'If we isolate the ERP Server immediately, can we prevent lateral movement to financial systems?',
    deltaState: {
      containmentStatus: 'full',
      isolatedSystems: ['ERP Server'],
      estimatedRecoveryHours: 48,
      financialSystemsCompromised: false,
    },
    outcomeProjections: [
      {
        label: 'Successful isolation before financial breach',
        probability: 0.72,
        impact: 'high — prevents $2.4M ransomware payout',
        metrics: { recoveryHours: 48, dataLossGb: 200, estimatedCostUsd: 180000 },
      },
      {
        label: 'Isolation fails, lateral movement succeeds',
        probability: 0.28,
        impact: 'critical — financial system breach',
        metrics: { recoveryHours: 120, dataLossGb: 2400, estimatedCostUsd: 2400000 },
      },
    ],
    approvedBy: null,
    correlationId: 'demo-aegis-ransomware',
    metadata: { demo: true },
  };

  return serializeDemoScene({ snapshot, branch, includeUSD: false });
}

export function buildVesselsSanctionsDemoScene(): DemoSceneBundle {
  const snapshot: SceneSnapshot = {
    sceneId: 'vessels-sanctions-reroute-demo',
    domain: 'maritime',
    entityType: 'vessel',
    entityId: 'IMO-9876543',
    capturedAt: new Date().toISOString(),
    driftScore: 0.61,
    proofChainId: null,
    correlationId: 'demo-vessels-sanctions',
    state: {
      vesselName: 'MV Pacific Horizon',
      imo: '9876543',
      currentRoute: 'Strait of Hormuz → Rotterdam',
      sanctionsFlagged: true,
      sanctionsReason: 'OFAC SDN — port call at Bandar Abbas',
      weatherSeverity: 'moderate',
      voyageEtaDays: 18,
      cargoValueUsd: 14200000,
      driftFromBaseline: 0.61,
    },
    metadata: { demo: true, scenario: 'sanctions_weather_reroute' },
  };

  const branch: BranchPackage = {
    parentSceneId: 'vessels-sanctions-reroute-demo',
    branchId: 'vessels-cape-reroute',
    branchLabel: 'Cape of Good Hope Reroute',
    domain: 'maritime',
    branchedAt: new Date().toISOString(),
    hypothesis:
      'Reroute via Cape of Good Hope to avoid OFAC-flagged port and storm system in Arabian Sea.',
    deltaState: {
      alternateRoute: 'Cape Town → Rotterdam',
      sanctionsFlagged: false,
      weatherSeverity: 'low',
      voyageEtaDays: 26,
      additionalFuelCostUsd: 180000,
    },
    outcomeProjections: [
      {
        label: 'Clean transit, cargo delivered',
        probability: 0.88,
        impact: 'medium — +8 day delay, +$180K fuel',
        metrics: { etaDays: 26, additionalCostUsd: 180000, sanctionsRisk: 0 },
      },
      {
        label: 'Cape reroute, Cape Town port delay',
        probability: 0.12,
        impact: 'medium — additional 4-day delay at Cape Town',
        metrics: { etaDays: 30, additionalCostUsd: 280000, sanctionsRisk: 0 },
      },
    ],
    approvedBy: null,
    correlationId: 'demo-vessels-sanctions',
    metadata: { demo: true },
  };

  return serializeDemoScene({ snapshot, branch });
}

export function buildTerraDistressDemoScene(): DemoSceneBundle {
  const snapshot: SceneSnapshot = {
    sceneId: 'terra-property-distress-demo',
    domain: 'real_estate',
    entityType: 'property',
    entityId: 'PROP-BK-2026-0142',
    capturedAt: new Date().toISOString(),
    driftScore: 0.74,
    proofChainId: null,
    correlationId: 'demo-terra-distress',
    state: {
      propertyId: 'PROP-BK-2026-0142',
      address: '842 Atlantic Ave, Brooklyn, NY 11238',
      ownerId: 'LLC-Redacted',
      distressScore: 87,
      lisPendens: true,
      taxArrears: 142000,
      estimatedArv: 2800000,
      currentAskUsd: 1950000,
      daysOnMarket: 214,
      driftFromBaseline: 0.74,
    },
    metadata: { demo: true, scenario: 'property_distress_stress_test' },
  };

  const branch: BranchPackage = {
    parentSceneId: 'terra-property-distress-demo',
    branchId: 'terra-direct-acquisition',
    branchLabel: 'Direct Acquisition — Pre-Foreclosure',
    domain: 'real_estate',
    branchedAt: new Date().toISOString(),
    hypothesis:
      'Acquire pre-foreclosure at 65% ARV, settle tax arrears, reposition within 18 months.',
    deltaState: {
      acquisitionPriceUsd: 1820000,
      taxArrearsSettled: true,
      projectedExitUsd: 2750000,
      holdPeriodMonths: 18,
      projectedIrr: 0.24,
    },
    outcomeProjections: [
      {
        label: 'Successful repositioning at target price',
        probability: 0.66,
        impact: 'high — 24% IRR, $930K net gain',
        metrics: { exitPriceUsd: 2750000, netGainUsd: 930000, irr: 0.24 },
      },
      {
        label: 'Market softens, 12-month hold extension',
        probability: 0.28,
        impact: 'medium — 14% IRR, $560K net gain',
        metrics: { exitPriceUsd: 2380000, netGainUsd: 560000, irr: 0.14 },
      },
      {
        label: 'Structural issue discovered post-acquisition',
        probability: 0.06,
        impact: 'high — $280K remediation, IRR breakeven',
        metrics: { exitPriceUsd: 2100000, netGainUsd: 0, irr: 0.0 },
      },
    ],
    approvedBy: null,
    correlationId: 'demo-terra-distress',
    metadata: { demo: true },
  };

  return serializeDemoScene({ snapshot, branch });
}

export function buildPrismCounselMatterDemoScene(): DemoSceneBundle {
  const snapshot: SceneSnapshot = {
    sceneId: 'prism-matter-pressure-demo',
    domain: 'general',
    entityType: 'matter',
    entityId: 'MTR-2026-0891',
    capturedAt: new Date().toISOString(),
    driftScore: 0.55,
    proofChainId: null,
    correlationId: 'demo-prism-matter',
    state: {
      matterId: 'MTR-2026-0891',
      matterTitle: 'Holloway v. Meridian Capital Group',
      matterType: 'commercial_dispute',
      totalExposureUsd: 8400000,
      discoveryStatus: 'ongoing',
      keyDeadlineDays: 34,
      settlementOfferUsd: 3200000,
      clientPressureScore: 78,
      driftFromBaseline: 0.55,
    },
    metadata: { demo: true, scenario: 'matter_pressure_settlement_branch' },
  };

  const branch: BranchPackage = {
    parentSceneId: 'prism-matter-pressure-demo',
    branchId: 'prism-settlement-path',
    branchLabel: 'Accelerated Settlement Path',
    domain: 'general',
    branchedAt: new Date().toISOString(),
    hypothesis: 'Accept modified settlement at $4.2M to avoid prolonged discovery and trial risk.',
    deltaState: {
      settlementTargetUsd: 4200000,
      discoveryTerminated: true,
      estimatedTrialRisk: 'avoided',
      netSavingsVsTrial: 2800000,
    },
    outcomeProjections: [
      {
        label: 'Settlement accepted at $4.2M',
        probability: 0.71,
        impact: 'medium — avoids $8.4M trial exposure',
        metrics: { settlementUsd: 4200000, totalCostUsd: 4200000, trialRiskAvoided: 1 },
      },
      {
        label: 'Counterparty rejects, trial proceeds',
        probability: 0.29,
        impact: 'high — full trial, outcome uncertain',
        metrics: { settlementUsd: 0, totalCostUsd: 8400000, trialRiskAvoided: 0 },
      },
    ],
    approvedBy: null,
    correlationId: 'demo-prism-matter',
    metadata: { demo: true },
  };

  return serializeDemoScene({ snapshot, branch });
}
