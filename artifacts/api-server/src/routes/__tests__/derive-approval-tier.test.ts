import { describe, expect, it } from 'vitest';
import { deriveApprovalTier } from '../a11oy-runtime-api.js';

describe('deriveApprovalTier', () => {
  describe('numeric riskScore takes precedence over coarse band', () => {
    it('a low numeric score wins over a "critical" band', () => {
      // band "critical" alone would map to 0.95 → executive; numeric 0.05 → auto
      expect(deriveApprovalTier('critical', 0.05)).toBe('auto');
    });

    it('a high numeric score wins over a "low" band', () => {
      // band "low" alone would map to 0.1 → auto; numeric 0.9 → executive
      expect(deriveApprovalTier('low', 0.9)).toBe('executive');
    });

    it('a mid numeric score wins over a "low" band', () => {
      // band "low" → auto; numeric 0.35 → operator
      expect(deriveApprovalTier('low', 0.35)).toBe('operator');
    });

    it('numeric 0 returns auto even with no band', () => {
      expect(deriveApprovalTier(undefined, 0)).toBe('auto');
    });

    it('clamps numeric values above 1 to 1 → executive', () => {
      expect(deriveApprovalTier(undefined, 5)).toBe('executive');
    });

    it('clamps numeric values below 0 to 0 → auto', () => {
      expect(deriveApprovalTier('critical', -1)).toBe('auto');
    });
  });

  describe('falls back to coarse band when numeric is missing or non-finite', () => {
    it('low → auto', () => {
      expect(deriveApprovalTier('low')).toBe('auto');
    });

    it('medium → operator', () => {
      expect(deriveApprovalTier('medium')).toBe('operator');
    });

    it('high → executive', () => {
      expect(deriveApprovalTier('high')).toBe('executive');
    });

    it('critical → executive', () => {
      expect(deriveApprovalTier('critical')).toBe('executive');
    });

    it('is case-insensitive on the band', () => {
      expect(deriveApprovalTier('LOW')).toBe('auto');
      expect(deriveApprovalTier('Critical')).toBe('executive');
    });

    it('unknown band defaults to 0.5 → operator', () => {
      expect(deriveApprovalTier('mystery')).toBe('operator');
    });

    it('missing band and missing score defaults to 0.5 → operator', () => {
      expect(deriveApprovalTier()).toBe('operator');
    });

    it('NaN numeric falls back to band', () => {
      expect(deriveApprovalTier('low', Number.NaN)).toBe('auto');
    });

    it('Infinity numeric falls back to band', () => {
      expect(deriveApprovalTier('high', Number.POSITIVE_INFINITY)).toBe('executive');
    });
  });
});
