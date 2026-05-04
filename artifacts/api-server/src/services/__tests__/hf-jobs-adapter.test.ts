import { describe, it, expect } from 'vitest';
import {
  parseTimeout,
  serializeVolumeUrl,
  buildApiUrl,
  getFlavorCostPerMinute,
  HARDWARE_FLAVORS,
} from '../hf-jobs-adapter';

describe('parseTimeout', () => {
  it('returns default 3600 for undefined', () => {
    expect(parseTimeout(undefined)).toBe(3600);
  });

  it('passes through numeric seconds', () => {
    expect(parseTimeout(1800)).toBe(1800);
  });

  it('parses "30m" as 1800 seconds', () => {
    expect(parseTimeout('30m')).toBe(1800);
  });

  it('parses "1.5h" as 5400 seconds', () => {
    expect(parseTimeout('1.5h')).toBe(5400);
  });

  it('parses "2d" as 172800 seconds', () => {
    expect(parseTimeout('2d')).toBe(172800);
  });

  it('parses "90s" as 90 seconds', () => {
    expect(parseTimeout('90s')).toBe(90);
  });

  it('parses plain numeric string "7200" as 7200', () => {
    expect(parseTimeout('7200')).toBe(7200);
  });

  it('returns 3600 for unparseable string', () => {
    expect(parseTimeout('abc')).toBe(3600);
  });

  it('returns 3600 for empty string', () => {
    expect(parseTimeout('')).toBe(3600);
  });

  it('handles zero', () => {
    expect(parseTimeout(0)).toBe(0);
  });
});

describe('serializeVolumeUrl', () => {
  it('serializes a model volume', () => {
    expect(
      serializeVolumeUrl({ type: 'model', source: 'szl-threat-v3', mount: '/models' }),
    ).toBe('hf://model/szl-threat-v3:/models');
  });

  it('serializes a dataset volume with readOnly', () => {
    expect(
      serializeVolumeUrl({ type: 'dataset', source: 'sentra-corpus', mount: '/data', readOnly: true }),
    ).toBe('hf://dataset/sentra-corpus:/data:ro');
  });

  it('serializes a bucket volume', () => {
    expect(
      serializeVolumeUrl({ type: 'bucket', source: 'my-bucket', mount: '/storage' }),
    ).toBe('hf://bucket/my-bucket:/storage');
  });

  it('serializes a subfolder volume (no type prefix)', () => {
    expect(
      serializeVolumeUrl({ type: 'subfolder', source: 'checkpoints/v2', mount: '/out' }),
    ).toBe('hf://checkpoints/v2:/out');
  });

  it('appends :ro only when readOnly is true', () => {
    const vol = { type: 'model' as const, source: 'x', mount: '/m', readOnly: false };
    expect(serializeVolumeUrl(vol)).not.toContain(':ro');
  });
});

describe('buildApiUrl', () => {
  it('builds URL with namespace', () => {
    const url = buildApiUrl('docker', 'szl-holdings');
    expect(url).toMatch(/\/api\/jobs\/v1\/szl-holdings\/docker$/);
  });

  it('builds URL without namespace (uses empty default)', () => {
    const url = buildApiUrl('list');
    expect(url).toMatch(/\/api\/jobs\/v1\/list$/);
  });

  it('includes namespace in path', () => {
    const url = buildApiUrl('uv', 'my-org');
    expect(url).toContain('/my-org/uv');
  });
});

describe('getFlavorCostPerMinute', () => {
  it('returns cost for known flavor', () => {
    expect(getFlavorCostPerMinute('a10g-small')).toBe(0.50);
  });

  it('returns cost for cpu-basic', () => {
    expect(getFlavorCostPerMinute('cpu-basic')).toBe(0.03);
  });

  it('returns undefined for unknown flavor', () => {
    expect(getFlavorCostPerMinute('nonexistent')).toBeUndefined();
  });
});

describe('HARDWARE_FLAVORS', () => {
  it('contains at least 5 entries', () => {
    expect(HARDWARE_FLAVORS.length).toBeGreaterThanOrEqual(5);
  });

  it('each flavor has required fields', () => {
    for (const f of HARDWARE_FLAVORS) {
      expect(f.id).toBeTruthy();
      expect(f.label).toBeTruthy();
      expect(typeof f.gpus).toBe('number');
      expect(typeof f.costPerMinute).toBe('number');
      expect(f.costPerMinute).toBeGreaterThan(0);
    }
  });

  it('has unique IDs', () => {
    const ids = HARDWARE_FLAVORS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
