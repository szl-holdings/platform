/**
 * Counsel Obligation Mutations & Risk Score Unit Tests
 *
 * Tests the obligation snooze/resolve mutation logic and the risk score
 * computation used by the Risk Exposure Desk. These run without a live DB.
 */
import { describe, expect, it } from 'vitest';

type ObligationStatus = 'pending' | 'in-progress' | 'complete' | 'overdue' | 'at-risk';

interface Obligation {
  id: string;
  matterId: string;
  title: string;
  status: ObligationStatus;
  dueDate: string;
  filingRequired: boolean;
  consequence?: string;
  completedDate?: string;
}

interface Matter {
  id: string;
  name: string;
  status: string;
  pressureScore: number;
  complexityScore: number;
  estimatedExposure?: number;
  obligations: Obligation[];
}

function applySnooze(obl: Obligation): Obligation {
  return { ...obl, status: 'pending' };
}

function applyResolve(obl: Obligation): Obligation {
  return {
    ...obl,
    status: 'complete',
    completedDate: new Date().toISOString().split('T')[0]!,
  };
}

function computeRiskScore(matters: Matter[]): number {
  if (matters.length === 0) return 0;
  const avgPressure = matters.reduce((a, m) => a + m.pressureScore, 0) / matters.length;
  const escalatedFraction = matters.filter((m) => m.status === 'escalated').length / matters.length;
  const overdueObls = matters
    .flatMap((m) => m.obligations)
    .filter((o) => o.status === 'overdue' || o.status === 'at-risk').length;
  const obligationPressure = Math.min(overdueObls * 8, 40);
  return Math.min(100, Math.round(avgPressure * 0.4 + escalatedFraction * 30 + obligationPressure));
}

function computeExposureByType(matters: Matter[]): Record<string, number> {
  const buckets: Record<string, number> = {};
  for (const m of matters) {
    const key = m.status === 'escalated' ? 'Escalated' : 'Active';
    buckets[key] = (buckets[key] ?? 0) + (m.estimatedExposure ?? 0);
  }
  return buckets;
}

function isUpcoming(obl: Obligation, horizonDays = 30): boolean {
  const days = (new Date(obl.dueDate).getTime() - Date.now()) / 86400000;
  return days >= 0 && days <= horizonDays && obl.status !== 'complete';
}

describe('Obligation snooze action', () => {
  it('sets status to pending when obligation is overdue', () => {
    const obl: Obligation = {
      id: 'o1',
      matterId: 'm1',
      title: 'HSR Filing',
      status: 'overdue',
      dueDate: new Date(Date.now() - 5 * 86400000).toISOString(),
      filingRequired: true,
    };
    const result = applySnooze(obl);
    expect(result.status).toBe('pending');
    expect(result.id).toBe('o1');
  });

  it('sets status to pending when obligation is at-risk', () => {
    const obl: Obligation = {
      id: 'o2',
      matterId: 'm1',
      title: 'Expert Disclosure',
      status: 'at-risk',
      dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
      filingRequired: true,
    };
    const result = applySnooze(obl);
    expect(result.status).toBe('pending');
  });

  it('preserves all other fields after snooze', () => {
    const obl: Obligation = {
      id: 'o3',
      matterId: 'm2',
      title: 'Document Production',
      status: 'overdue',
      dueDate: '2024-01-15',
      filingRequired: false,
      consequence: 'Contempt of subpoena',
    };
    const result = applySnooze(obl);
    expect(result.consequence).toBe('Contempt of subpoena');
    expect(result.matterId).toBe('m2');
    expect(result.filingRequired).toBe(false);
  });
});

describe('Obligation resolve action', () => {
  it('sets status to complete', () => {
    const obl: Obligation = {
      id: 'o4',
      matterId: 'm1',
      title: 'Board Approval',
      status: 'in-progress',
      dueDate: new Date(Date.now() + 10 * 86400000).toISOString(),
      filingRequired: false,
    };
    const result = applyResolve(obl);
    expect(result.status).toBe('complete');
  });

  it('sets completedDate to today', () => {
    const obl: Obligation = {
      id: 'o5',
      matterId: 'm2',
      title: 'Merger Agreement',
      status: 'pending',
      dueDate: new Date(Date.now() + 20 * 86400000).toISOString(),
      filingRequired: true,
    };
    const today = new Date().toISOString().split('T')[0];
    const result = applyResolve(obl);
    expect(result.completedDate).toBe(today);
  });

  it('preserves id and matterId after resolve', () => {
    const obl: Obligation = {
      id: 'o6',
      matterId: 'm3',
      title: 'Wells Submission',
      status: 'at-risk',
      dueDate: '2024-06-30',
      filingRequired: true,
    };
    const result = applyResolve(obl);
    expect(result.id).toBe('o6');
    expect(result.matterId).toBe('m3');
  });
});

describe('Risk score computation', () => {
  it('returns 0 for an empty matters array', () => {
    expect(computeRiskScore([])).toBe(0);
  });

  it('caps score at 100', () => {
    const matters: Matter[] = Array.from({ length: 5 }, (_, i) => ({
      id: `m${i}`,
      name: `Matter ${i}`,
      status: 'escalated',
      pressureScore: 100,
      complexityScore: 100,
      obligations: Array.from({ length: 10 }, (__, j) => ({
        id: `o${i}-${j}`,
        matterId: `m${i}`,
        title: `Obligation ${j}`,
        status: 'overdue' as ObligationStatus,
        dueDate: '2020-01-01',
        filingRequired: true,
      })),
    }));
    expect(computeRiskScore(matters)).toBeLessThanOrEqual(100);
  });

  it('higher pressure scores produce higher risk', () => {
    const low: Matter[] = [
      { id: 'm1', name: 'Low', status: 'active', pressureScore: 10, complexityScore: 10, obligations: [] },
    ];
    const high: Matter[] = [
      { id: 'm2', name: 'High', status: 'active', pressureScore: 90, complexityScore: 90, obligations: [] },
    ];
    expect(computeRiskScore(high)).toBeGreaterThan(computeRiskScore(low));
  });

  it('overdue obligations increase risk score', () => {
    const base: Matter[] = [
      { id: 'm1', name: 'Base', status: 'active', pressureScore: 50, complexityScore: 50, obligations: [] },
    ];
    const withOverdue: Matter[] = [
      {
        id: 'm1',
        name: 'With Overdue',
        status: 'active',
        pressureScore: 50,
        complexityScore: 50,
        obligations: [
          { id: 'o1', matterId: 'm1', title: 'Overdue', status: 'overdue', dueDate: '2020-01-01', filingRequired: true },
        ],
      },
    ];
    expect(computeRiskScore(withOverdue)).toBeGreaterThan(computeRiskScore(base));
  });

  it('escalated matters add to risk score', () => {
    const active: Matter[] = [
      { id: 'm1', name: 'Active', status: 'active', pressureScore: 60, complexityScore: 50, obligations: [] },
    ];
    const escalated: Matter[] = [
      { id: 'm1', name: 'Escalated', status: 'escalated', pressureScore: 60, complexityScore: 50, obligations: [] },
    ];
    expect(computeRiskScore(escalated)).toBeGreaterThan(computeRiskScore(active));
  });
});

describe('Obligation upcoming filter', () => {
  it('includes obligations due within 30 days that are not complete', () => {
    const obl: Obligation = {
      id: 'o1',
      matterId: 'm1',
      title: 'Expert Disclosure',
      status: 'in-progress',
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString(),
      filingRequired: true,
    };
    expect(isUpcoming(obl)).toBe(true);
  });

  it('excludes completed obligations', () => {
    const obl: Obligation = {
      id: 'o2',
      matterId: 'm1',
      title: 'Completed Task',
      status: 'complete',
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      filingRequired: false,
    };
    expect(isUpcoming(obl)).toBe(false);
  });

  it('excludes past obligations', () => {
    const obl: Obligation = {
      id: 'o3',
      matterId: 'm1',
      title: 'Past Task',
      status: 'overdue',
      dueDate: new Date(Date.now() - 5 * 86400000).toISOString(),
      filingRequired: true,
    };
    expect(isUpcoming(obl)).toBe(false);
  });

  it('excludes obligations beyond the horizon', () => {
    const obl: Obligation = {
      id: 'o4',
      matterId: 'm1',
      title: 'Far Future',
      status: 'pending',
      dueDate: new Date(Date.now() + 60 * 86400000).toISOString(),
      filingRequired: false,
    };
    expect(isUpcoming(obl)).toBe(false);
  });
});

describe('Exposure by type computation', () => {
  it('groups escalated vs active matters correctly', () => {
    const matters: Matter[] = [
      { id: 'm1', name: 'M1', status: 'active', pressureScore: 50, complexityScore: 50, estimatedExposure: 1_000_000, obligations: [] },
      { id: 'm2', name: 'M2', status: 'escalated', pressureScore: 80, complexityScore: 70, estimatedExposure: 2_000_000, obligations: [] },
    ];
    const result = computeExposureByType(matters);
    expect(result.Active).toBe(1_000_000);
    expect(result.Escalated).toBe(2_000_000);
  });

  it('handles missing estimatedExposure gracefully', () => {
    const matters: Matter[] = [
      { id: 'm1', name: 'M1', status: 'active', pressureScore: 50, complexityScore: 50, obligations: [] },
    ];
    const result = computeExposureByType(matters);
    expect(result.Active).toBe(0);
  });
});
