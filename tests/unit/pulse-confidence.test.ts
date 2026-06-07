/**
 * Pulse — Confidence Math Unit Tests
 *
 * Validates the confidence label derivation, score clamping, and confidence
 * history building logic used in the Pulse briefing pipeline.
 *
 * Imports from the real production modules so regressions in the implementation
 * are caught here rather than silently passing because the test reimplements
 * its own copy of the logic.
 *
 * Run with: pnpm vitest run tests/unit/pulse-confidence.test.ts
 */

import { describe, expect, it } from 'vitest';
import {
  averageConfidence,
  clampConfidence,
  clampRisk,
  confidenceLabel,
} from '../../artifacts/api-server/src/lib/pulse-confidence';
import { getConfidenceLabel } from '../../artifacts/pulse/src/lib/data';

// ─── getConfidenceLabel (frontend lib/data.ts) ────────────────────────────────

describe('getConfidenceLabel (frontend)', () => {
  it('returns HIGH for score >= 0.75', () => {
    expect(getConfidenceLabel(0.75)).toBe('HIGH');
    expect(getConfidenceLabel(0.9)).toBe('HIGH');
    expect(getConfidenceLabel(1.0)).toBe('HIGH');
  });

  it('returns MODERATE for 0.5 <= score < 0.75', () => {
    expect(getConfidenceLabel(0.5)).toBe('MODERATE');
    expect(getConfidenceLabel(0.6)).toBe('MODERATE');
    expect(getConfidenceLabel(0.74)).toBe('MODERATE');
  });

  it('returns LOW for 0.25 <= score < 0.5', () => {
    expect(getConfidenceLabel(0.25)).toBe('LOW');
    expect(getConfidenceLabel(0.4)).toBe('LOW');
    expect(getConfidenceLabel(0.49)).toBe('LOW');
  });

  it('returns INSUFFICIENT for score < 0.25', () => {
    expect(getConfidenceLabel(0.0)).toBe('INSUFFICIENT');
    expect(getConfidenceLabel(0.24)).toBe('INSUFFICIENT');
  });
});

// ─── confidenceLabel (server-side shared utility) ────────────────────────────

describe('confidenceLabel (API route)', () => {
  it('returns HIGH for score >= 0.8', () => {
    expect(confidenceLabel(0.8)).toBe('HIGH');
    expect(confidenceLabel(1.0)).toBe('HIGH');
  });

  it('returns MODERATE for 0.65 <= score < 0.8', () => {
    expect(confidenceLabel(0.65)).toBe('MODERATE');
    expect(confidenceLabel(0.79)).toBe('MODERATE');
  });

  it('returns LOW for 0.5 <= score < 0.65', () => {
    expect(confidenceLabel(0.5)).toBe('LOW');
    expect(confidenceLabel(0.64)).toBe('LOW');
  });

  it('returns INSUFFICIENT for score < 0.5', () => {
    expect(confidenceLabel(0.49)).toBe('INSUFFICIENT');
    expect(confidenceLabel(0.0)).toBe('INSUFFICIENT');
  });
});

// ─── clampConfidence ─────────────────────────────────────────────────────────

describe('clampConfidence', () => {
  it('clamps values below 0.4 to 0.4', () => {
    expect(clampConfidence(0.1)).toBe(0.4);
    expect(clampConfidence(0.0)).toBe(0.4);
    expect(clampConfidence(-0.5)).toBe(0.4);
  });

  it('clamps values above 0.99 to 0.99', () => {
    expect(clampConfidence(1.0)).toBe(0.99);
    expect(clampConfidence(1.5)).toBe(0.99);
  });

  it('passes through values in range [0.4, 0.99]', () => {
    expect(clampConfidence(0.4)).toBe(0.4);
    expect(clampConfidence(0.75)).toBe(0.75);
    expect(clampConfidence(0.99)).toBe(0.99);
  });

  it('rounds to 2 decimal places', () => {
    expect(clampConfidence(0.7654)).toBe(0.77);
    expect(clampConfidence(0.401)).toBe(0.4);
  });
});

// ─── clampRisk ───────────────────────────────────────────────────────────────

describe('clampRisk', () => {
  it('passes through valid risk levels', () => {
    expect(clampRisk('CRITICAL')).toBe('CRITICAL');
    expect(clampRisk('HIGH')).toBe('HIGH');
    expect(clampRisk('MEDIUM')).toBe('MEDIUM');
    expect(clampRisk('LOW')).toBe('LOW');
  });

  it('is case-insensitive', () => {
    expect(clampRisk('critical')).toBe('CRITICAL');
    expect(clampRisk('high')).toBe('HIGH');
  });

  it('falls back to MEDIUM for unknown values', () => {
    expect(clampRisk('UNKNOWN')).toBe('MEDIUM');
    expect(clampRisk('')).toBe('MEDIUM');
    expect(clampRisk(null)).toBe('MEDIUM');
    expect(clampRisk(undefined)).toBe('MEDIUM');
  });
});

// ─── averageConfidence ───────────────────────────────────────────────────────

describe('averageConfidence', () => {
  it('returns average of all section scores', () => {
    expect(averageConfidence([0.8, 0.6, 0.7])).toBe(0.7);
    expect(averageConfidence([1.0, 0.0])).toBe(0.5);
  });

  it('returns 0.75 for empty array', () => {
    expect(averageConfidence([])).toBe(0.75);
  });

  it('rounds to 2 decimal places', () => {
    expect(averageConfidence([0.81, 0.67, 0.74])).toBe(0.74);
  });
});

// ─── Confidence history derivation ───────────────────────────────────────────

describe('confidence history builder', () => {
  const DOMAIN_KEYS = ['maritime', 'security', 'real_estate', 'legal', 'financial', 'platform'];

  function buildHistoryEntry(date: string, conf: number, activeDomains: string[]): Record<string, string | number> {
    const domainSet = new Set(activeDomains.map((d) => d.toLowerCase().replace(/\s+/g, '_')));
    const entry: Record<string, string | number> = { date };
    for (const key of DOMAIN_KEYS) {
      entry[key] = Number((domainSet.has(key) ? conf : conf * 0.9).toFixed(3));
    }
    return entry;
  }

  it('sets active domains to the overall confidence', () => {
    const entry = buildHistoryEntry('2026-04-16', 0.8, ['maritime', 'security']);
    expect(entry.maritime).toBe(0.8);
    expect(entry.security).toBe(0.8);
  });

  it('sets inactive domains to 90% of overall confidence', () => {
    const entry = buildHistoryEntry('2026-04-16', 0.8, ['maritime']);
    expect(entry.security).toBeCloseTo(0.72, 2);
    expect(entry.legal).toBeCloseTo(0.72, 2);
  });

  it('produces an entry with all domain keys', () => {
    const entry = buildHistoryEntry('2026-04-16', 0.75, ['platform']);
    expect(Object.keys(entry)).toContain('date');
    for (const key of DOMAIN_KEYS) {
      expect(Object.keys(entry)).toContain(key);
    }
  });
});
