// @vitest-environment happy-dom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SEED_SIGNALS } from '@workspace/a11oy-fabric';
import { classifyQueryEvidence } from '../lib/query-evidence';
import { NowBoard } from './NowBoard';
import { CommandSurface } from './CommandSurface';
import { useAlloyDashboard, useAlloySignals, useAlloyWorkflows, useAlloyApprovals } from '../graphql/hooks';
import type { AlloyDashboardStats, AlloySignal, AlloyWorkflow, AlloyApproval } from '../graphql/hooks';

const mock = vi.hoisted(() => ({
  queries: { dashboard: undefined as unknown, signals: undefined as unknown, workflows: undefined as unknown, approvals: undefined as unknown },
  raw: {} as Record<string, unknown>,
}));
vi.mock('../graphql', () => ({
  useAlloyDashboard: () => mock.queries.dashboard,
  useAlloySignals: () => mock.queries.signals,
  useAlloyWorkflows: () => mock.queries.workflows,
  useAlloyApprovals: () => mock.queries.approvals,
}));
vi.mock('urql', async importOriginal => ({
  ...await importOriginal<typeof import('urql')>(),
  useQuery: () => [mock.raw, () => undefined],
}));
vi.mock('../components/layout', () => ({ Layout: ({ children }: { children: ReactNode }) => <main>{children}</main> }));

const ZERO: AlloyDashboardStats = {
  totalWorkflows: 0, totalRuns: 0, runningRuns: 0, pendingApprovals: 0, failedRuns: 0,
  successRate: 0, avgDurationMs: 0, workflowsByStatus: [], recentActivity: [],
};
const SIGNAL: AlloySignal = {
  id: 'observed-signal', source: null, sourceType: null, domain: 'alloy-core', severity: 'critical', status: 'active',
  title: 'Observed critical signal', description: 'Returned by the test query.', confidence: null, ownerUserId: null,
  environment: null, createdAt: '2026-11-16T10:00:00Z', updatedAt: null,
};
const WORKFLOW: AlloyWorkflow = {
  id: 'observed-workflow', name: 'Observed workflow', description: 'Read-only returned workflow.', type: null,
  domain: 'alloy-core', status: 'running', priority: null, requiresApproval: true, approvalState: 'pending',
  confidenceScore: null, triggerId: SIGNAL.id, triggerType: null, environment: null, steps: [], currentStep: null,
  retryCount: null, ownerUserId: null, startedAt: null, completedAt: null, errorMessage: null, createdAt: null,
  updatedAt: null, canRun: false, canCancel: false, canRetry: false, allowedNextStates: [],
};
const APPROVAL: AlloyApproval = {
  id: 'observed-approval', workflowId: WORKFLOW.id, status: 'pending', reason: 'Independent review required.',
  reviewNote: null, requestedByUserId: null, reviewerUserId: null, requiredRoles: null, expiresAt: null, reviewedAt: null, createdAt: null,
};
const DEMO_SIGNAL = SEED_SIGNALS.find(s => s.severity === 'critical' || s.severity === 'high')!;

function response(value: unknown, extra: { fetching?: boolean; stale?: boolean; error?: unknown } = {}, list = false) {
  return {
    data: value ?? (list ? [] : null), fetching: extra.fetching ?? false, error: extra.error,
    source: classifyQueryEvidence({ value, ...extra }), refetch: () => undefined,
  };
}
function sourceState(container: HTMLElement, name: string) {
  return container.querySelector(`[data-source-name="${name}"]`)?.getAttribute('data-source-state');
}
function metricValue(label: string) {
  return screen.getByText(label).parentElement?.textContent ?? '';
}
beforeEach(() => {
  mock.queries.dashboard = response(ZERO);
  mock.queries.signals = response([], {}, true);
  mock.queries.workflows = response([], {}, true);
  mock.queries.approvals = response([], {}, true);
  mock.raw = { fetching: false, stale: false };
});
afterEach(cleanup);

describe('query observation contract', () => {
  it.each([
    [{ value: undefined, fetching: true }, 'LOADING', 'loading', false],
    [{ value: undefined }, 'UNAVAILABLE', 'no_response', false],
    [{ value: null }, 'UNAVAILABLE', 'null_response', true],
    [{ value: [] }, 'EMPTY', 'empty_response', true],
    [{ value: [SIGNAL] }, 'API_DATA', 'response_received', true],
    [{ value: 0 }, 'API_DATA', 'response_received', true],
    [{ value: undefined, error: new Error('query failed') }, 'ERROR', 'error', false],
    [{ value: [SIGNAL], error: new Error('query failed') }, 'STALE', 'error_with_cache', true],
    [{ value: [], error: new Error('query failed') }, 'STALE', 'error_with_cache', true],
    [{ value: ZERO, fetching: true }, 'STALE', 'refreshing_cache', true],
    [{ value: [SIGNAL], stale: true }, 'STALE', 'stale_cache', true],
  ] as const)('classifies %o without treating cache or absence as data', (input, state, reason, received) => {
    const result = classifyQueryEvidence(input);
    expect(result).toMatchObject({ state, reason, received, usable: state === 'API_DATA' || state === 'EMPTY' });
  });

  it.each([
    ['alloyDashboard', useAlloyDashboard, ZERO, 'API_DATA'],
    ['alloySignals', useAlloySignals, [], 'EMPTY'],
    ['alloyWorkflows', useAlloyWorkflows, [], 'EMPTY'],
    ['alloyApprovals', useAlloyApprovals, [], 'EMPTY'],
  ] as const)('%s preserves raw response state before applying legacy data defaults', (field, hook, value, state) => {
    expect(hook().source.reason).toBe('no_response');
    mock.raw = { data: { [field]: null }, fetching: false, stale: false };
    expect(hook().source.reason).toBe('null_response');
    mock.raw = { data: { [field]: value }, fetching: false, stale: false };
    expect(hook().source).toMatchObject({ state, usable: true });
    mock.raw = { ...mock.raw, error: new Error('query failed') };
    expect(hook().source).toMatchObject({ state: 'STALE', usable: false });
  });
});

for (const [name, Page] of [['Now Board', NowBoard], ['Command Surface', CommandSurface]] as const) {
  describe(name, () => {
    it('retains empty lists and zero counts without seed rows or LIVE claims', () => {
      const { container } = render(<Page />);
      expect(sourceState(container, 'dashboard')).toBe('API_DATA');
      expect(sourceState(container, 'signals')).toBe('EMPTY');
      expect(sourceState(container, 'workflows')).toBe('EMPTY');
      expect(sourceState(container, 'approvals')).toBe('EMPTY');
      expect(metricValue('TOTAL RUNS')).toContain('0');
      expect(metricValue('PENDING APPROVALS')).toContain('0');
      expect(metricValue('SIGNALS RETURNED')).toContain('0');
      expect(screen.queryByText(DEMO_SIGNAL.title)).toBeNull();
      expect(container.querySelector('[data-status-pill="LIVE"]')).toBeNull();
      expect(container.textContent).not.toMatch(/All fabric layers operational|Governed Environment|1,204 of 1,324|91%|96%|VERIFIED ACTIONS|AGENT TRUST SCORE/);
      if (name === 'Now Board') {
        expect(metricValue('AVG DURATION')).toContain('0s');
        expect(metricValue('SUCCESS RATE')).toContain('0%');
      }
    });

    it('keeps no response, null response and empty response distinct', () => {
      mock.queries.dashboard = response(null);
      mock.queries.signals = response(undefined, {}, true);
      mock.queries.workflows = response(null, {}, true);
      const { container } = render(<Page />);
      expect(sourceState(container, 'signals')).toBe('UNAVAILABLE');
      expect(sourceState(container, 'workflows')).toBe('UNAVAILABLE');
      expect(sourceState(container, 'approvals')).toBe('EMPTY');
      expect(screen.getAllByText('This query has not returned a value.').length).toBeGreaterThan(0);
      expect(screen.getAllByText('This query returned null; no value is available.').length).toBeGreaterThan(0);
      expect(metricValue('TOTAL RUNS')).toContain('—');
      expect(screen.queryByText(DEMO_SIGNAL.title)).toBeNull();
    });

    it('shows initial loading instead of zero or demonstration data', () => {
      mock.queries.signals = response(undefined, { fetching: true }, true);
      const { container } = render(<Page />);
      expect(sourceState(container, 'signals')).toBe('LOADING');
      expect(metricValue('SIGNALS RETURNED')).toContain('—');
      expect(screen.queryByText(DEMO_SIGNAL.title)).toBeNull();
    });

    it('handles mixed query states independently and never fills dashboard zeros from another source', () => {
      mock.queries.signals = response([SIGNAL], {}, true);
      mock.queries.workflows = response(undefined, { error: new Error('unavailable') }, true);
      mock.queries.approvals = response([APPROVAL], {}, true);
      const { container } = render(<Page />);
      expect(sourceState(container, 'signals')).toBe('API_DATA');
      expect(sourceState(container, 'workflows')).toBe('ERROR');
      expect(sourceState(container, 'approvals')).toBe('API_DATA');
      expect(sourceState(container, 'dashboard')).toBe('API_DATA');
      expect(screen.getByText(SIGNAL.title!)).toBeTruthy();
      expect(metricValue('PENDING APPROVALS')).toContain('0');
      expect(screen.queryByText(DEMO_SIGNAL.title)).toBeNull();
    });

    it.each([{ error: new Error('failed') }, { fetching: true }, { stale: true }])('withholds old data for %o without suppressing other queries', extra => {
      mock.queries.signals = response([SIGNAL], extra, true);
      mock.queries.dashboard = response({ ...ZERO, totalRuns: 73 }, extra);
      mock.queries.workflows = response([WORKFLOW], {}, true);
      const { container } = render(<Page />);
      expect(sourceState(container, 'signals')).toBe('STALE');
      expect(sourceState(container, 'dashboard')).toBe('STALE');
      expect(sourceState(container, 'workflows')).toBe('API_DATA');
      expect(screen.queryByText(SIGNAL.title!)).toBeNull();
      expect(metricValue('TOTAL RUNS')).toContain('—');
      expect(metricValue('TOTAL RUNS')).not.toContain('73');
      expect(screen.queryByText(DEMO_SIGNAL.title)).toBeNull();
    });

    it('requires an explicit DEMO selection and clears fixture data on return to API mode', () => {
      render(<Page />);
      expect(screen.queryByText(DEMO_SIGNAL.title)).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: 'Use DEMO fixtures' }));
      expect(screen.getByRole('button', { name: 'Use DEMO fixtures' }).getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByText(DEMO_SIGNAL.title)).toBeTruthy();
      expect(screen.getAllByText(/DEMO — fictional fixtures selected explicitly/).length).toBe(1);
      if (name === 'Command Surface') {
        fireEvent.click(screen.getAllByRole('button', { name: 'Demo: approve' })[0]);
        expect(screen.getByText('Demo choice: approved')).toBeTruthy();
      }
      fireEvent.click(screen.getByRole('button', { name: 'API responses' }));
      expect(screen.queryByText(DEMO_SIGNAL.title)).toBeNull();
      expect(screen.queryByText('Demo choice: approved')).toBeNull();
      expect(screen.queryByRole('button', { name: /approve/i })).toBeNull();
    });
  });
}

describe('Command Surface approval boundary', () => {
  it('renders returned approvals read-only and does not expose local approval actions for API workflows', () => {
    mock.queries.signals = response([SIGNAL], {}, true);
    mock.queries.workflows = response([WORKFLOW], {}, true);
    mock.queries.approvals = response([APPROVAL], {}, true);
    render(<CommandSurface />);
    expect(screen.getByText(APPROVAL.reason!)).toBeTruthy();
    fireEvent.click(screen.getByText(SIGNAL.title!));
    expect(screen.getByText('Read-only observation. Approval submission is unavailable in this view.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /approve|defer|reject/i })).toBeNull();
    expect(screen.queryByText(/cryptographically signed and logged/)).toBeNull();
  });
});
