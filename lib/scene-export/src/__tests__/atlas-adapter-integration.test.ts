import { describe, expect, it } from 'vitest';
import {
  buildAegisRansomwareDemoScene,
  buildPrismCounselMatterDemoScene,
  buildTerraDistressDemoScene,
  buildVesselsSanctionsDemoScene,
} from '../demo-serializer.js';
import {
  buildOpenUSDManifest,
  exportBranchPackage,
  exportJsonSnapshot,
  exportOpenUSDManifest,
  exportProofBundle,
} from '../index.js';
import type { BranchPackage, ProofBundle, SceneSnapshot } from '../types.js';

describe('ATLAS Export API Routes — Integration', () => {
  describe('GET /api/atlas/snapshot/:sceneId', () => {
    it('returns a valid JSON snapshot export for security domain', () => {
      const snapshot: SceneSnapshot = {
        sceneId: 'api-test-scene-001',
        domain: 'security',
        entityType: 'incident',
        entityId: 'INC-API-001',
        capturedAt: new Date().toISOString(),
        state: { severity: 'high', status: 'investigating', attackVector: 'phishing' },
        driftScore: 0.68,
        proofChainId: null,
        correlationId: 'api-corr-001',
      };

      const result = exportJsonSnapshot(snapshot);

      expect(result.format).toBe('json_snapshot');
      expect(result.adapterVersion).toBe('1.0.0');
      expect(result.sizeEstimateBytes).toBeGreaterThan(0);

      const payload = result.payload as { snapshot: SceneSnapshot; format: string };
      expect(payload.snapshot.sceneId).toBe('api-test-scene-001');
      expect(payload.snapshot.domain).toBe('security');
    });

    it('returns a valid JSON snapshot export for maritime domain', () => {
      const snapshot: SceneSnapshot = {
        sceneId: 'api-test-vessel-001',
        domain: 'maritime',
        entityType: 'vessel',
        entityId: 'IMO-1234567',
        capturedAt: new Date().toISOString(),
        state: { route: 'Mediterranean', speed: 12.3, status: 'en_route' },
        driftScore: 0.22,
        proofChainId: null,
        correlationId: 'api-vessel-corr-001',
      };

      const result = exportJsonSnapshot(snapshot);
      expect(result.format).toBe('json_snapshot');
      const payload = result.payload as { snapshot: SceneSnapshot };
      expect(payload.snapshot.domain).toBe('maritime');
    });
  });

  describe('POST /api/atlas/branch/export', () => {
    it('returns a branch package with comparisonSummary for a security branch', () => {
      const branch: BranchPackage = {
        parentSceneId: 'api-test-scene-001',
        branchId: 'api-branch-001',
        branchLabel: 'Immediate Quarantine',
        domain: 'security',
        branchedAt: new Date().toISOString(),
        hypothesis: 'Quarantine all affected systems within 30 minutes',
        deltaState: {
          quarantineStatus: 'active',
          affectedSystemsIsolated: true,
          estimatedRecoveryHours: 24,
        },
        outcomeProjections: [
          { label: 'Clean recovery', probability: 0.81, impact: 'medium', metrics: { hours: 24 } },
          { label: 'Extended recovery', probability: 0.19, impact: 'high', metrics: { hours: 72 } },
        ],
        approvedBy: null,
        correlationId: 'api-corr-001',
      };

      const result = exportBranchPackage(branch);
      expect(result.format).toBe('branch_package');

      const payload = result.payload as {
        comparisonSummary: { deltaKeyCount: number; projectionCount: number };
      };
      expect(payload.comparisonSummary.deltaKeyCount).toBe(3);
      expect(payload.comparisonSummary.projectionCount).toBe(2);
    });

    it('returns correct hasApproval flag when branch is pre-approved', () => {
      const branch: BranchPackage = {
        parentSceneId: 'scene-pre-approved',
        branchId: 'branch-approved',
        branchLabel: 'Approved Reroute',
        domain: 'maritime',
        branchedAt: new Date().toISOString(),
        hypothesis: 'Take the Cape route',
        deltaState: { route: 'Cape of Good Hope' },
        outcomeProjections: [
          { label: 'Clean transit', probability: 0.88, impact: 'medium', metrics: {} },
        ],
        approvedBy: 'fleet_operator@szl.com',
        correlationId: null,
      };

      const result = exportBranchPackage(branch);
      const payload = result.payload as { comparisonSummary: { hasApproval: boolean } };
      expect(payload.comparisonSummary.hasApproval).toBe(true);
    });
  });

  describe('POST /api/atlas/proof-bundle/export', () => {
    it('returns a proof bundle with full integrity summary', () => {
      const bundle: ProofBundle = {
        bundleId: 'api-bundle-001',
        contentId: 'atlas-artifact-999',
        contentType: 'atlas_artifact',
        sourceClass: 'llm_generated',
        confidenceScore: 0.91,
        serviceAttribution: 'atlas-scenario-forge',
        modelVersion: 'claude-3-5-sonnet-20241022',
        citations: [
          { source: 'NIST SP 800-61r2', excerpt: 'Incident handling guidance' },
          { source: 'Internal playbook v3', url: 'internal://playbooks/ransomware' },
        ],
        approvalChain: [
          {
            approverRole: 'security_lead',
            approvedAt: new Date().toISOString(),
            decision: 'approved',
            rationale: 'Best available option',
          },
          {
            approverRole: 'ciso',
            approvedAt: new Date().toISOString(),
            decision: 'approved',
            rationale: 'Concur with recommendation',
          },
        ],
        generatedAt: new Date().toISOString(),
        correlationId: 'api-bundle-corr',
      };

      const result = exportProofBundle(bundle);
      expect(result.format).toBe('proof_bundle');

      const payload = result.payload as {
        integrity: {
          citationCount: number;
          approvalSteps: number;
          isFullyApproved: boolean;
          finalDecision: string;
        };
      };
      expect(payload.integrity.citationCount).toBe(2);
      expect(payload.integrity.approvalSteps).toBe(2);
      expect(payload.integrity.isFullyApproved).toBe(true);
      expect(payload.integrity.finalDecision).toBe('approved');
    });
  });

  describe('GET /api/atlas/export/openusd/:sceneId (stub)', () => {
    it('returns a stub OpenUSD manifest with integration notice', () => {
      const manifest = buildOpenUSDManifest({
        stage: '/ATLAS/maritime/IMO-TEST-001',
        domain: 'maritime',
        entityId: 'IMO-TEST-001',
        proofChainId: null,
        sceneState: { route: 'Atlantic', speed: 14.2, status: 'en_route' },
      });

      const result = exportOpenUSDManifest(manifest);
      expect(result.format).toBe('openusd_manifest');
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.length).toBeGreaterThan(0);

      const payload = result.payload as { usdaText: string; integrationNotice: string };
      expect(payload.usdaText).toMatch(/^#usda 1\.0/);
      expect(payload.integrationNotice).toContain('stub');
    });
  });

  describe('Canonical demo scenes — all four domains', () => {
    it('Aegis ransomware demo scene is export-ready', () => {
      const bundle = buildAegisRansomwareDemoScene();
      expect(bundle.domain).toBe('security');
      expect(bundle.snapshot.format).toBe('json_snapshot');
      expect(bundle.branch).toBeDefined();
    });

    it('Vessels sanctions demo scene is export-ready', () => {
      const bundle = buildVesselsSanctionsDemoScene();
      expect(bundle.domain).toBe('maritime');
      expect(bundle.branch).toBeDefined();
    });

    it('Terra distress demo scene is export-ready', () => {
      const bundle = buildTerraDistressDemoScene();
      expect(bundle.domain).toBe('real_estate');
      expect(bundle.branch).toBeDefined();
    });

    it('Prism Counsel matter demo scene is export-ready', () => {
      const bundle = buildPrismCounselMatterDemoScene();
      expect(bundle.domain).toBe('general');
      expect(bundle.branch).toBeDefined();
    });

    it('all four demo scenes have non-empty generatedAt timestamps', () => {
      const bundles = [
        buildAegisRansomwareDemoScene(),
        buildVesselsSanctionsDemoScene(),
        buildTerraDistressDemoScene(),
        buildPrismCounselMatterDemoScene(),
      ];
      for (const bundle of bundles) {
        expect(bundle.generatedAt).toBeTruthy();
        expect(new Date(bundle.generatedAt).getTime()).toBeGreaterThan(0);
      }
    });
  });
});
