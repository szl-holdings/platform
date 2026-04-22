/**
 * ATLAS API Routes — Integration Contract Tests
 *
 * These tests verify that the scene-export adapters produce payloads that
 * conform to the contracts expected by the HTTP routes wired in
 * artifacts/api-server/src/routes/atlas-scene-export.ts.
 *
 * Route contract coverage:
 *   GET  /api/atlas/snapshot/:sceneId        → JsonSnapshotAdapter
 *   POST /api/atlas/branch/export            → BranchPackageAdapter
 *   POST /api/atlas/proof-bundle/export      → ProofBundleAdapter
 *   GET  /api/atlas/export/openusd/:sceneId  → OpenUSDManifestAdapter (stub)
 *
 * All routes require ENABLE_ATLAS_SPATIAL_RUNTIME to be enabled and
 * a user with role "operator" or above.
 */

import { describe, expect, it } from 'vitest';
import {
  buildOpenUSDManifest,
  exportBranchPackage,
  exportJsonSnapshot,
  exportOpenUSDManifest,
  exportProofBundle,
} from '../index.js';
import type { BranchPackage, ExportAdapterResult, ProofBundle, SceneSnapshot } from '../types.js';

function assertExportShape(result: ExportAdapterResult) {
  expect(typeof result.format).toBe('string');
  expect(result.format.length).toBeGreaterThan(0);
  expect(typeof result.adapterVersion).toBe('string');
  expect(typeof result.generatedAt).toBe('string');
  expect(new Date(result.generatedAt).getTime()).toBeGreaterThan(0);
  expect(result.payload).toBeDefined();
  expect(result.payload).not.toBeNull();
}

describe('ATLAS API Route Contracts — adapter-level integration', () => {
  describe('GET /api/atlas/snapshot/:sceneId', () => {
    it('adapter returns a well-formed ExportAdapterResult', () => {
      const snapshot: SceneSnapshot = {
        sceneId: 'route-test-scene-001',
        domain: 'default',
        entityType: 'scene',
        entityId: 'route-test-scene-001',
        capturedAt: new Date().toISOString(),
        state: {},
      };

      const result = exportJsonSnapshot(snapshot);
      assertExportShape(result);
      expect(result.format).toBe('json_snapshot');
      expect(result.sizeEstimateBytes).toBeGreaterThan(0);
    });

    it('route param sceneId is reflected in the snapshot payload', () => {
      const sceneId = 'my-test-scene-42';
      const snapshot: SceneSnapshot = {
        sceneId,
        domain: 'security',
        entityType: 'scene',
        entityId: sceneId,
        capturedAt: new Date().toISOString(),
        state: { level: 'critical' },
      };

      const result = exportJsonSnapshot(snapshot);
      const payload = result.payload as { snapshot: SceneSnapshot };
      expect(payload.snapshot.sceneId).toBe(sceneId);
      expect(payload.snapshot.domain).toBe('security');
    });

    it('adapter rejects snapshot missing required sceneId', () => {
      const bad = {
        sceneId: '',
        domain: 'default',
        entityType: 'scene',
        entityId: 'e1',
        capturedAt: new Date().toISOString(),
        state: {},
      } as SceneSnapshot;

      expect(() => exportJsonSnapshot(bad)).toThrow(/sceneId is required/);
    });

    it('adapter rejects snapshot missing domain', () => {
      const bad = {
        sceneId: 'scene-01',
        domain: '',
        entityType: 'scene',
        entityId: 'e1',
        capturedAt: new Date().toISOString(),
        state: {},
      } as SceneSnapshot;

      expect(() => exportJsonSnapshot(bad)).toThrow(/domain is required/);
    });
  });

  describe('POST /api/atlas/branch/export', () => {
    it('adapter returns a well-formed ExportAdapterResult', () => {
      const branch: BranchPackage = {
        parentSceneId: 'route-test-parent-001',
        branchId: 'route-test-branch-001',
        branchLabel: 'Route test branch',
        domain: 'maritime',
        branchedAt: new Date().toISOString(),
        hypothesis: 'Reroute through Cape of Good Hope',
        deltaState: { route: 'Cape of Good Hope', estimatedDelay: 3 },
        outcomeProjections: [
          { label: 'Safe transit', probability: 0.88, impact: 'low', metrics: { days: 3 } },
        ],
        approvedBy: null,
        correlationId: null,
      };

      const result = exportBranchPackage(branch);
      assertExportShape(result);
      expect(result.format).toBe('branch_package');
    });

    it('branchPackage payload exposes comparisonSummary with deltaKeyCount', () => {
      const branch: BranchPackage = {
        parentSceneId: 'parent-scene',
        branchId: 'branch-kv-test',
        branchLabel: 'KV test',
        domain: 'security',
        branchedAt: new Date().toISOString(),
        hypothesis: 'Isolate segment B',
        deltaState: { segmentB: 'isolated', firewall: 'active', alerts: 5 },
        outcomeProjections: [],
        approvedBy: null,
        correlationId: null,
      };

      const result = exportBranchPackage(branch);
      const payload = result.payload as { comparisonSummary: { deltaKeyCount: number } };
      expect(payload.comparisonSummary.deltaKeyCount).toBe(3);
    });

    it('hasApproval is true when approvedBy is set', () => {
      const branch: BranchPackage = {
        parentSceneId: 'parent',
        branchId: 'approved-branch',
        branchLabel: 'Approved branch',
        domain: 'security',
        branchedAt: new Date().toISOString(),
        hypothesis: 'Deploy patch',
        deltaState: { patched: true },
        outcomeProjections: [],
        approvedBy: 'ops_lead@szl.com',
        correlationId: null,
      };

      const result = exportBranchPackage(branch);
      const payload = result.payload as { comparisonSummary: { hasApproval: boolean } };
      expect(payload.comparisonSummary.hasApproval).toBe(true);
    });
  });

  describe('POST /api/atlas/proof-bundle/export', () => {
    it('adapter returns a well-formed ExportAdapterResult', () => {
      const bundle: ProofBundle = {
        bundleId: 'route-bundle-001',
        contentId: 'content-001',
        contentType: 'atlas_artifact',
        sourceClass: 'llm_generated',
        confidenceScore: 0.87,
        serviceAttribution: 'atlas',
        modelVersion: null,
        citations: [{ source: 'Internal policy v2' }],
        approvalChain: [
          { approverRole: 'ops_lead', approvedAt: new Date().toISOString(), decision: 'approved' },
        ],
        generatedAt: new Date().toISOString(),
        correlationId: null,
      };

      const result = exportProofBundle(bundle);
      assertExportShape(result);
      expect(result.format).toBe('proof_bundle');
    });

    it('integrity.isFullyApproved is false when any chain entry is rejected', () => {
      const bundle: ProofBundle = {
        bundleId: 'rejected-bundle',
        contentId: 'content-002',
        contentType: 'atlas_artifact',
        sourceClass: 'llm_generated',
        confidenceScore: 0.5,
        serviceAttribution: 'atlas',
        modelVersion: null,
        citations: [],
        approvalChain: [
          { approverRole: 'ops_lead', approvedAt: new Date().toISOString(), decision: 'approved' },
          {
            approverRole: 'ciso',
            approvedAt: new Date().toISOString(),
            decision: 'rejected',
            rationale: 'Too risky',
          },
        ],
        generatedAt: new Date().toISOString(),
        correlationId: null,
      };

      const result = exportProofBundle(bundle);
      const payload = result.payload as {
        integrity: { isFullyApproved: boolean; finalDecision: string };
      };
      expect(payload.integrity.isFullyApproved).toBe(false);
      expect(payload.integrity.finalDecision).toBe('rejected');
    });

    it('empty approvalChain results in isFullyApproved false', () => {
      const bundle: ProofBundle = {
        bundleId: 'empty-chain-bundle',
        contentId: 'content-003',
        contentType: 'atlas_artifact',
        sourceClass: 'llm_generated',
        confidenceScore: 0.6,
        serviceAttribution: 'atlas',
        modelVersion: null,
        citations: [],
        approvalChain: [],
        generatedAt: new Date().toISOString(),
        correlationId: null,
      };

      const result = exportProofBundle(bundle);
      const payload = result.payload as { integrity: { isFullyApproved: boolean } };
      expect(payload.integrity.isFullyApproved).toBe(false);
    });
  });

  describe('GET /api/atlas/export/openusd/:sceneId', () => {
    it('buildOpenUSDManifest + adapter returns a well-formed stub result', () => {
      const sceneId = 'route-openusd-scene-001';
      const manifest = buildOpenUSDManifest({
        stage: `/ATLAS/${sceneId}`,
        domain: 'default',
        entityId: sceneId,
        proofChainId: null,
        sceneState: {},
      });

      const result = exportOpenUSDManifest(manifest);
      assertExportShape(result);
      expect(result.format).toBe('openusd_manifest');
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.length).toBeGreaterThan(0);
    });

    it('USDA text stub begins with #usda 1.0 header', () => {
      const manifest = buildOpenUSDManifest({
        stage: '/ATLAS/maritime/IMO-ROUTE-TEST',
        domain: 'maritime',
        entityId: 'IMO-ROUTE-TEST',
        proofChainId: null,
        sceneState: { route: 'Atlantic', speed: 12 },
      });

      const result = exportOpenUSDManifest(manifest);
      const payload = result.payload as { usdaText: string };
      expect(payload.usdaText).toMatch(/^#usda 1\.0/);
    });

    it('adapter stage and domain are reflected in the manifest payload', () => {
      const manifest = buildOpenUSDManifest({
        stage: '/ATLAS/security/INC-001',
        domain: 'security',
        entityId: 'INC-001',
        proofChainId: 42,
        sceneState: { severity: 'critical' },
      });

      const result = exportOpenUSDManifest(manifest);
      const payload = result.payload as { manifest: { domain: string; stage: string } };
      expect(payload.manifest.domain).toBe('security');
      expect(payload.manifest.stage).toBe('/ATLAS/security/INC-001');
    });

    it('integrationNotice is included in the stub payload', () => {
      const manifest = buildOpenUSDManifest({
        stage: '/ATLAS/test',
        domain: 'test',
        sceneState: {},
      });

      const result = exportOpenUSDManifest(manifest);
      const payload = result.payload as { integrationNotice: string };
      expect(payload.integrationNotice).toBeTruthy();
      expect(payload.integrationNotice.toLowerCase()).toContain('stub');
    });
  });

  describe('Feature flag semantics', () => {
    it('all adapter names are consistent with ATLAS namespace', async () => {
      const { JsonSnapshotAdapter } = await import('../adapters/json-snapshot.js');
      const { BranchPackageAdapter } = await import('../adapters/branch-package.js');
      const { ProofBundleAdapter } = await import('../adapters/proof-bundle.js');
      const { OpenUSDManifestAdapter } = await import('../adapters/openusd-manifest.js');

      expect(new JsonSnapshotAdapter().adapterName).toBe('JsonSnapshotAdapter');
      expect(new BranchPackageAdapter().adapterName).toBe('BranchPackageAdapter');
      expect(new ProofBundleAdapter().adapterName).toBe('ProofBundleAdapter');
      expect(new OpenUSDManifestAdapter().adapterName).toBe('OpenUSDManifestAdapter');
    });

    it('all adapters report version 1.0.0', async () => {
      const { JsonSnapshotAdapter } = await import('../adapters/json-snapshot.js');
      const { BranchPackageAdapter } = await import('../adapters/branch-package.js');
      const { ProofBundleAdapter } = await import('../adapters/proof-bundle.js');
      const { OpenUSDManifestAdapter } = await import('../adapters/openusd-manifest.js');

      expect(new JsonSnapshotAdapter().adapterVersion).toBe('1.0.0');
      expect(new BranchPackageAdapter().adapterVersion).toBe('1.0.0');
      expect(new ProofBundleAdapter().adapterVersion).toBe('1.0.0');
      expect(new OpenUSDManifestAdapter().adapterVersion).toBe('1.0.0');
    });
  });
});
