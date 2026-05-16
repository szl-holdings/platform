import { describe, expect, it, vi } from 'vitest';
import {
  createDriftDetector,
  runRosieLoop,
  type FormulaInvocation,
  type SentraSignalForRosie,
} from '@szl-holdings/formulas';
import { formulaInvocationDriftBridge, _rosieEvolutionDetectorForTest } from '../../artifacts/api-server/src/jobs/rosie-evolution-loop.js';

describe('runRosieLoop (in-process fetch shim)', () => {
  it('drains drift-detector signals and posts proposals via fetchImpl', async () => {
    const detector = createDriftDetector({ gapMin: 0.1, samplesMin: 25 });
    for (let i = 0; i < 30; i++) {
      detector.record({
        formulaId: 'risk-score',
        parameter: 'wSeverity',
        observed: 1.3,
        baseline: 1.0,
        oldValue: 0.5,
        candidateValue: 0.65,
        fromVersion: '1.0.0',
        thesisCitation: 'v10-canonical.md §3.2',
      });
    }
    const signals: readonly SentraSignalForRosie[] = detector.drainSignals();
    expect(signals).toHaveLength(1);

    const fetchImpl = vi.fn(async (_url, init) => {
      const body = JSON.parse((init?.body as string) ?? '{}');
      return new Response(
        JSON.stringify({
          ok: true,
          data: {
            accepted: true,
            proposal: { id: 42, formulaId: body.formulaId, parameter: body.parameter },
          },
          meta: { timestamp: new Date().toISOString() },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as unknown as typeof fetch;

    const results = await runRosieLoop(signals, { apiBase: '/api', fetchImpl });
    expect(results).toHaveLength(1);
    expect(results[0].decision.kind).toBe('tuning');
    expect((fetchImpl as ReturnType<typeof vi.fn>)).toHaveBeenCalledOnce();
    const [calledUrl] = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(calledUrl).toBe('/api/a11oy/formulas/propose-tuning');
    expect(results[0].submitted).toMatchObject({ ok: true });
  });

  it('bridge propagates invocation version as fromVersion on emitted signal', () => {
    const detector = _rosieEvolutionDetectorForTest();
    detector.drainSignals();
    const baseInv: Omit<FormulaInvocation, 'meta'> = {
      formulaId: 'risk-score',
      version: '1.4.2',
      inputs: {},
      output: 0,
      startedAt: Date.now(),
      finishedAt: Date.now(),
      durationMs: 1,
    };
    for (let i = 0; i < 26; i++) {
      formulaInvocationDriftBridge({
        ...baseInv,
        meta: {
          observed: 1.4,
          baseline: 1.0,
          parameter: 'wSeverity',
          oldValue: 0.5,
          candidateValue: 0.7,
          thesisCitation: 'v10-canonical.md §3.2',
        },
      });
    }
    const signals = detector.drainSignals();
    expect(signals).toHaveLength(1);
    expect(signals[0].fromVersion).toBe('1.4.2');
    expect(signals[0].formulaId).toBe('risk-score');
    expect(signals[0].parameter).toBe('wSeverity');
  });
});
