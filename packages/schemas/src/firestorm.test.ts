import { describe, expect, it } from 'vitest';
import {
  incidentSchema,
  playbookRunSchema,
  severitySchema,
  threatSchema,
  vulnerabilitySchema,
} from './firestorm';

describe('severitySchema', () => {
  it('accepts the four levels', () => {
    expect(severitySchema.parse('low')).toBe('low');
    expect(severitySchema.parse('critical')).toBe('critical');
  });
  it('rejects unknown severity', () => {
    expect(() => severitySchema.parse('info')).toThrow();
  });
});

describe('threatSchema', () => {
  const valid = {
    id: 1,
    source: 'edr',
    severity: 'high' as const,
    status: 'active' as const,
    detectedAt: new Date(),
  };
  it('accepts a minimal threat', () => {
    expect(threatSchema.parse(valid)).toBeTruthy();
  });
  it('rejects empty source', () => {
    expect(() => threatSchema.parse({ ...valid, source: '' })).toThrow();
  });
  it('rejects unknown status', () => {
    expect(() => threatSchema.parse({ ...valid, status: 'ignored' })).toThrow();
  });
  it('accepts a null resolvedAt', () => {
    expect(threatSchema.parse({ ...valid, resolvedAt: null }).resolvedAt).toBeNull();
  });
});

describe('incidentSchema', () => {
  const valid = {
    id: 1,
    title: 'Breach',
    severity: 'critical' as const,
    status: 'open' as const,
    openedAt: new Date(),
  };
  it('accepts a minimal incident', () => {
    expect(incidentSchema.parse(valid)).toBeTruthy();
  });
  it('rejects empty title', () => {
    expect(() => incidentSchema.parse({ ...valid, title: '' })).toThrow();
  });
  it('rejects unknown status', () => {
    expect(() => incidentSchema.parse({ ...valid, status: 'archived' })).toThrow();
  });
});

describe('vulnerabilitySchema', () => {
  const valid = {
    id: 1,
    title: 'RCE in lib',
    severity: 'high' as const,
    status: 'open' as const,
    discoveredAt: new Date(),
  };
  it('accepts a minimal vulnerability', () => {
    expect(vulnerabilitySchema.parse(valid)).toBeTruthy();
  });
  it('accepts a valid CVE id', () => {
    expect(vulnerabilitySchema.parse({ ...valid, cveId: 'CVE-2024-12345' }).cveId).toBe(
      'CVE-2024-12345',
    );
  });
  it('rejects malformed CVE id', () => {
    expect(() => vulnerabilitySchema.parse({ ...valid, cveId: 'CVE-24-1' })).toThrow();
  });
  it('rejects cvssScore outside [0,10]', () => {
    expect(() => vulnerabilitySchema.parse({ ...valid, cvssScore: 11 })).toThrow();
    expect(() => vulnerabilitySchema.parse({ ...valid, cvssScore: -1 })).toThrow();
  });
  it('rejects unknown status', () => {
    expect(() => vulnerabilitySchema.parse({ ...valid, status: 'deferred' })).toThrow();
  });
});

describe('playbookRunSchema', () => {
  const valid = {
    id: 1,
    playbookId: 1,
    status: 'running' as const,
    startedAt: new Date(),
  };
  it('accepts a minimal run', () => {
    expect(playbookRunSchema.parse(valid)).toBeTruthy();
  });
  it('accepts null completedAt', () => {
    expect(playbookRunSchema.parse({ ...valid, completedAt: null }).completedAt).toBeNull();
  });
  it('rejects unknown status', () => {
    expect(() => playbookRunSchema.parse({ ...valid, status: 'stopped' })).toThrow();
  });
});
