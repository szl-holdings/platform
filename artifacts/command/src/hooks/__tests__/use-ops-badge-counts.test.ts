import { describe, expect, it } from 'vitest';
import {
  deriveAlertSeverity,
  hasAnyAlert,
  totalBadgeCount,
  type OpsBadgeCounts,
} from '../use-ops-badge-counts';

describe('deriveAlertSeverity', () => {
  it('returns loading when all counts are null', () => {
    const counts: OpsBadgeCounts = {
      alerts: null,
      slaBreaches: null,
      governancePending: null,
      costOverBudget: null,
    };
    expect(deriveAlertSeverity(counts)).toBe('loading');
  });

  it('returns none when all counts are zero', () => {
    const counts: OpsBadgeCounts = {
      alerts: 0,
      slaBreaches: 0,
      governancePending: 0,
      costOverBudget: 0,
    };
    expect(deriveAlertSeverity(counts)).toBe('none');
  });

  it('returns critical when both alerts and slaBreaches are non-zero', () => {
    const counts: OpsBadgeCounts = {
      alerts: 3,
      slaBreaches: 1,
      governancePending: 0,
      costOverBudget: 0,
    };
    expect(deriveAlertSeverity(counts)).toBe('critical');
  });

  it('returns high when only alerts are non-zero', () => {
    const counts: OpsBadgeCounts = {
      alerts: 5,
      slaBreaches: 0,
      governancePending: 0,
      costOverBudget: 0,
    };
    expect(deriveAlertSeverity(counts)).toBe('high');
  });

  it('returns high when only slaBreaches are non-zero', () => {
    const counts: OpsBadgeCounts = {
      alerts: 0,
      slaBreaches: 2,
      governancePending: 0,
      costOverBudget: 0,
    };
    expect(deriveAlertSeverity(counts)).toBe('high');
  });

  it('returns medium when only governance or cost issues exist', () => {
    const counts: OpsBadgeCounts = {
      alerts: 0,
      slaBreaches: 0,
      governancePending: 4,
      costOverBudget: 1,
    };
    expect(deriveAlertSeverity(counts)).toBe('medium');
  });

  it('partial null counts (not all null) do not count as loading', () => {
    const counts: OpsBadgeCounts = {
      alerts: 0,
      slaBreaches: null,
      governancePending: 0,
      costOverBudget: 0,
    };
    expect(deriveAlertSeverity(counts)).toBe('none');
  });
});

describe('totalBadgeCount', () => {
  it('sums all non-null counts', () => {
    const counts: OpsBadgeCounts = {
      alerts: 3,
      slaBreaches: 2,
      governancePending: 1,
      costOverBudget: 4,
    };
    expect(totalBadgeCount(counts)).toBe(10);
  });

  it('treats null as zero', () => {
    const counts: OpsBadgeCounts = {
      alerts: null,
      slaBreaches: 2,
      governancePending: null,
      costOverBudget: 1,
    };
    expect(totalBadgeCount(counts)).toBe(3);
  });
});

describe('hasAnyAlert', () => {
  it('returns false when all counts are zero', () => {
    const counts: OpsBadgeCounts = {
      alerts: 0,
      slaBreaches: 0,
      governancePending: 0,
      costOverBudget: 0,
    };
    expect(hasAnyAlert(counts)).toBe(false);
  });

  it('returns true when alerts are non-zero', () => {
    const counts: OpsBadgeCounts = {
      alerts: 3,
      slaBreaches: 1,
      governancePending: 0,
      costOverBudget: 0,
    };
    expect(hasAnyAlert(counts)).toBe(true);
  });

  it('returns true when only governance is non-zero', () => {
    const counts: OpsBadgeCounts = {
      alerts: 0,
      slaBreaches: 0,
      governancePending: 4,
      costOverBudget: 1,
    };
    expect(hasAnyAlert(counts)).toBe(true);
  });
});
