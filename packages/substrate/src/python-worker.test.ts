import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type StageResultMessage, SubstratePythonWorkerChannel } from './python-worker.js';

const ORIGINAL_ENV = { ...process.env };
const TEST_CREDENTIAL = 'unit-test-worker-credential';

function dispatchOptions() {
  return {
    runId: 'run-auth-test',
    workflowId: 'workflow-auth-test',
    tenantId: 'tenant-governed',
    stageId: 'stage-auth-test',
    stageType: 'Retrieve',
    stageConfig: { stageKind: 'retrieval' },
    input: { query: 'auth contract' },
    budgetConfig: { escalateAt: 0.9, requireHumanBelow: 0.3 },
    traceId: 'trace-auth-test',
    mode: 'live' as const,
  };
}

function workerResult(): StageResultMessage {
  return {
    protocolVersion: '1.0',
    messageId: 'worker-response',
    timestamp: '2026-10-06T00:00:00Z',
    type: 'stage.result',
    workerId: 'worker-test',
    runId: 'run-auth-test',
    stageId: 'stage-auth-test',
    output: { ok: true },
    confidence: 0.9,
    durationMs: 1,
  };
}

describe('Python worker HTTP admission', () => {
  beforeEach(() => {
    process.env.SUBSTRATE_PYTHON_WORKER_URL = 'http://worker.internal';
    process.env.SUBSTRATE_PYTHON_WORKER_ENV = 'production';
    process.env.SUBSTRATE_PYTHON_WORKER_API_KEY = TEST_CREDENTIAL;
    process.env.SUBSTRATE_PYTHON_WORKER_TENANT_ID = 'tenant-governed';
    delete process.env.SUBSTRATE_PYTHON_WORKER_AUTH_BYPASS;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  it('derives bearer and tenant headers from protected configuration and claim context', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(workerResult()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await new SubstratePythonWorkerChannel().dispatch(dispatchOptions());

    expect(result.type).toBe('stage.result');
    expect(fetchMock).toHaveBeenCalledOnce();
    const firstCall = fetchMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    const [, init] = firstCall ?? [];
    expect(init?.headers).toMatchObject({
      Authorization: `Bearer ${TEST_CREDENTIAL}`,
      'X-Tenant-ID': 'tenant-governed',
      'X-Protocol-Version': '1.0',
    });
    expect(init?.redirect).toBe('error');
    expect(JSON.parse(String(init?.body))).toMatchObject({ tenantId: 'tenant-governed' });
  });

  it('sends one mutating claim and fails closed on an ambiguous transport outcome', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('connection closed after request upload'));

    await expect(new SubstratePythonWorkerChannel().dispatch(dispatchOptions())).rejects.toThrow(
      'The mutating claim was not retried and simulation was not used',
    );
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('does not replace an attempted non-live claim with simulation', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('timeout'));

    await expect(
      new SubstratePythonWorkerChannel().dispatch({
        ...dispatchOptions(),
        mode: 'dry-run',
      }),
    ).rejects.toThrow('HTTP dispatch outcome is ambiguous');
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('rejects a mismatched worker response without retrying', async () => {
    const mismatched = { ...workerResult(), stageId: 'stage-from-another-claim' };
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mismatched), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(new SubstratePythonWorkerChannel().dispatch(dispatchOptions())).rejects.toThrow(
      'invalid or mismatched protocol response',
    );
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('preserves an explicitly unassessed null confidence', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ...workerResult(), confidence: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await new SubstratePythonWorkerChannel().dispatch(dispatchOptions());

    expect(result.confidence).toBeNull();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('fails before network access when production credential injection is missing', async () => {
    delete process.env.SUBSTRATE_PYTHON_WORKER_API_KEY;
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    await expect(new SubstratePythonWorkerChannel().dispatch(dispatchOptions())).rejects.toThrow(
      'SUBSTRATE_PYTHON_WORKER_API_KEY must be injected',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects production auth bypass before network access', async () => {
    delete process.env.SUBSTRATE_PYTHON_WORKER_API_KEY;
    process.env.SUBSTRATE_PYTHON_WORKER_AUTH_BYPASS = '1';
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    await expect(new SubstratePythonWorkerChannel().dispatch(dispatchOptions())).rejects.toThrow(
      'permitted only in development or test environments',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('lets canonical RUNTIME_MODE production dominate conflicting test markers', async () => {
    process.env.RUNTIME_MODE = 'production';
    process.env.SUBSTRATE_PYTHON_WORKER_ENV = 'test';
    process.env.NODE_ENV = 'test';
    process.env.SUBSTRATE_PYTHON_WORKER_AUTH_BYPASS = '1';
    delete process.env.SUBSTRATE_PYTHON_WORKER_API_KEY;
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    await expect(new SubstratePythonWorkerChannel().dispatch(dispatchOptions())).rejects.toThrow(
      'permitted only in development or test environments',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    'prod',
    'staging',
    'sandbox',
    'unknown',
  ])('rejects invalid canonical RUNTIME_MODE=%s before network access', async (runtimeMode) => {
    process.env.RUNTIME_MODE = runtimeMode;
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    await expect(new SubstratePythonWorkerChannel().dispatch(dispatchOptions())).rejects.toThrow(
      'RUNTIME_MODE must be one of',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid bypass value before network access', async () => {
    process.env.SUBSTRATE_PYTHON_WORKER_AUTH_BYPASS = 'maybe';
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    await expect(new SubstratePythonWorkerChannel().dispatch(dispatchOptions())).rejects.toThrow(
      'must be an explicit boolean value',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a missing governed tenant before network access', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const opts = dispatchOptions();

    await expect(
      new SubstratePythonWorkerChannel().dispatch({ ...opts, tenantId: '' }),
    ).rejects.toThrow('valid governed tenantId');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects non-canonical tenant whitespace before network access', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    await expect(
      new SubstratePythonWorkerChannel().dispatch({
        ...dispatchOptions(),
        tenantId: ' tenant-governed',
      }),
    ).rejects.toThrow('valid governed tenantId');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fails before network access when a production credential has no tenant binding', async () => {
    delete process.env.SUBSTRATE_PYTHON_WORKER_TENANT_ID;
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    await expect(new SubstratePythonWorkerChannel().dispatch(dispatchOptions())).rejects.toThrow(
      'SUBSTRATE_PYTHON_WORKER_TENANT_ID must bind the worker credential',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a governed tenant outside the credential binding before network access', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    await expect(
      new SubstratePythonWorkerChannel().dispatch({
        ...dispatchOptions(),
        tenantId: 'tenant-cross-boundary',
      }),
    ).rejects.toThrow('claim tenant is not authorized for this worker credential');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
