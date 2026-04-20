import { describe, expect, it } from 'vitest';
import {
  buildOpenUSDManifest,
  exportOpenUSDManifest,
  OpenUSDManifestAdapter,
} from '../adapters/openusd-manifest.js';
import {
  buildAegisRansomwareDemoScene,
  buildPrismCounselMatterDemoScene,
  buildTerraDistressDemoScene,
  buildVesselsSanctionsDemoScene,
  serializeDemoScene,
} from '../demo-serializer.js';
import type { OpenUSDManifest, SceneSnapshot } from '../types.js';

const baseManifest: OpenUSDManifest = {
  manifestVersion: '1.0',
  stage: '/ATLAS/security/INC-TEST-001',
  domain: 'security',
  layers: [
    { identifier: 'atlas_security_root.usda', layerType: 'root', documentation: 'Root layer' },
  ],
  prims: [
    {
      path: '/ATLAS/security/severity',
      typeName: 'Xform',
      attributes: {
        atlasKey: { type: 'string', value: 'severity' },
        atlasValue: { type: 'string', value: 'critical' },
      },
    },
  ],
  customLayerData: {
    szlAtlasVersion: '1.0.0',
    exportedAt: new Date().toISOString(),
    domain: 'security',
    entityId: 'INC-TEST-001',
    proofChainId: null,
    notice: '',
  },
};

describe('Replay Engine — OpenUSDManifestAdapter (Stub)', () => {
  it('validates a well-formed OpenUSD manifest', () => {
    const adapter = new OpenUSDManifestAdapter();
    expect(() => adapter.validate(baseManifest)).not.toThrow();
  });

  it('throws on missing stage', () => {
    const adapter = new OpenUSDManifestAdapter();
    expect(() => adapter.validate({ ...baseManifest, stage: '' })).toThrow('stage is required');
  });

  it('throws on missing domain', () => {
    const adapter = new OpenUSDManifestAdapter();
    expect(() => adapter.validate({ ...baseManifest, domain: '' })).toThrow('domain is required');
  });

  it('throws when layers is not an array', () => {
    const adapter = new OpenUSDManifestAdapter();
    expect(() => adapter.validate({ ...baseManifest, layers: null as unknown as [] })).toThrow(
      'layers must be an array',
    );
  });

  it('throws when prims is not an array', () => {
    const adapter = new OpenUSDManifestAdapter();
    expect(() => adapter.validate({ ...baseManifest, prims: null as unknown as [] })).toThrow(
      'prims must be an array',
    );
  });

  it('produces USDA text starting with #usda 1.0', () => {
    const adapter = new OpenUSDManifestAdapter();
    const output = adapter.serialize(baseManifest);
    expect(output.usdaText).toMatch(/^#usda 1\.0/);
  });

  it('includes integration notice in output', () => {
    const adapter = new OpenUSDManifestAdapter();
    const output = adapter.serialize(baseManifest);
    expect(output.integrationNotice).toContain('stub');
    expect(output.integrationNotice).toContain('OpenUSD SDK');
  });

  it('populates customLayerData with export timestamp', () => {
    const adapter = new OpenUSDManifestAdapter();
    const output = adapter.serialize(baseManifest);
    expect(output.manifest.customLayerData.exportedAt).toBeTruthy();
    expect(() => new Date(output.manifest.customLayerData.exportedAt)).not.toThrow();
  });

  it('returns warnings about stub limitations in ExportAdapterResult', () => {
    const adapter = new OpenUSDManifestAdapter();
    const result = adapter.toExportResult(baseManifest);
    expect(result.warnings).toBeDefined();
    expect(result.warnings!.length).toBeGreaterThan(0);
    expect(result.warnings!.some((w) => w.includes('stub'))).toBe(true);
  });

  it('buildOpenUSDManifest produces a valid manifest from scene state', () => {
    const manifest = buildOpenUSDManifest({
      stage: '/ATLAS/maritime/IMO-9876543',
      domain: 'maritime',
      entityId: 'IMO-9876543',
      proofChainId: 42,
      sceneState: { route: 'Strait of Hormuz', speed: 14.5 },
    });
    expect(manifest.stage).toBe('/ATLAS/maritime/IMO-9876543');
    expect(manifest.prims.length).toBe(2);
    expect(manifest.customLayerData.proofChainId).toBe(42);
  });
});

describe('Demo Serializer — canonical demo scene bundles', () => {
  it('serializeDemoScene produces a bundle with snapshot result', () => {
    const snapshot: SceneSnapshot = {
      sceneId: 'test-scene',
      domain: 'security',
      entityType: 'incident',
      entityId: 'INC-001',
      capturedAt: new Date().toISOString(),
      state: { status: 'active' },
      driftScore: 0.5,
      proofChainId: null,
      correlationId: null,
    };
    const bundle = serializeDemoScene({ snapshot });
    expect(bundle.snapshot.format).toBe('json_snapshot');
    expect(bundle.branch).toBeUndefined();
    expect(bundle.proof).toBeUndefined();
  });

  it('buildAegisRansomwareDemoScene produces a valid bundle with branch', () => {
    const bundle = buildAegisRansomwareDemoScene();
    expect(bundle.domain).toBe('security');
    expect(bundle.snapshot.format).toBe('json_snapshot');
    expect(bundle.branch).toBeDefined();
    expect(bundle.branch!.format).toBe('branch_package');
    expect(bundle.usdManifest).toBeUndefined();
  });

  it('buildVesselsSanctionsDemoScene produces a valid maritime bundle', () => {
    const bundle = buildVesselsSanctionsDemoScene();
    expect(bundle.domain).toBe('maritime');
    expect(bundle.branch).toBeDefined();
    expect(bundle.branch!.format).toBe('branch_package');
  });

  it('buildTerraDistressDemoScene produces a valid real_estate bundle', () => {
    const bundle = buildTerraDistressDemoScene();
    expect(bundle.domain).toBe('real_estate');
    expect(bundle.branch).toBeDefined();
  });

  it('buildPrismCounselMatterDemoScene produces a valid general domain bundle', () => {
    const bundle = buildPrismCounselMatterDemoScene();
    expect(bundle.domain).toBe('general');
    expect(bundle.branch).toBeDefined();
  });

  it('all demo scene bundles have a generatedAt timestamp', () => {
    const bundles = [
      buildAegisRansomwareDemoScene(),
      buildVesselsSanctionsDemoScene(),
      buildTerraDistressDemoScene(),
      buildPrismCounselMatterDemoScene(),
    ];
    for (const bundle of bundles) {
      expect(bundle.generatedAt).toBeTruthy();
      expect(() => new Date(bundle.generatedAt)).not.toThrow();
    }
  });
});
