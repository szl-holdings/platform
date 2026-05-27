import { useMemo, useState } from 'react';
import {
  StagedPipeline,
  PIPELINE_STAGE_RECEIPT_CLASS,
  wilsonInterval,
  type StageArtefact,
} from '@szl-holdings/sequence-pipeline';

/**
 * Sequence-pipeline auditing for A11oy brand orchestration.
 *
 * Re-expresses the four-stage orchestration loop (drift → evaluate →
 * approve → publish) as a `StagedPipeline` so each stage emits an
 * (inputsHash, paramsHash, outputsHash) triple plus a per-stage
 * Λ-receipt of class `pipeline.stage.v1`. Surfaces tabulated-statistic
 * Wilson CIs for the approve rate so reviewers can see uncertainty.
 *
 * Backing package: `@szl-holdings/sequence-pipeline`.
 */

const GOLD = '#c9b787';

interface RunSummary {
  stages: StageArtefact[];
  approveRate: number;
  approveCI: { low: number; high: number };
  hash: string;
}

async function runOrchestration(seed: number): Promise<RunSummary> {
  const pipeline = new StagedPipeline({ runId: `orch-${seed}` });

  pipeline.stage({
    name: 'drift',
    params: { window: '24h', kThreshold: 0.18 },
    run: () => ({ driftScore: 0.14 + ((seed * 7) % 11) / 100, signals: 12 + (seed % 5) }),
  });

  pipeline.stage({
    name: 'evaluate',
    params: { evaluator: 'sotopia-judge', scenarios: 3 },
    run: ({ prior }) => {
      const drift = (prior?.outputs as { driftScore?: number } | undefined)?.driftScore ?? 0.15;
      return { reward: Math.max(0, 0.85 - drift), matches: 2, mismatches: drift > 0.18 ? 1 : 0 };
    },
  });

  pipeline.stage({
    name: 'approve',
    params: { operatorId: 'demo-operator', band: [0.8, 1.2] },
    run: ({ prior }) => {
      const reward = (prior?.outputs as { reward?: number } | undefined)?.reward ?? 0;
      const verdict = reward > 0.6 ? 'approve' : reward > 0.4 ? 'escalate' : 'deny';
      return { verdict, resonance: 1.0 + (verdict === 'approve' ? 0.05 : -0.05) };
    },
  });

  pipeline.stage({
    name: 'publish',
    params: { surface: 'brand-fabric', target: 'maritime.briefing' },
    run: ({ prior }) => {
      const v = (prior?.outputs as { verdict?: string } | undefined)?.verdict;
      return { published: v === 'approve', target: 'maritime.briefing' };
    },
  });

  const result = await pipeline.run();
  const stages = result.stages;
  const approves = stages.filter(
    (s) => s.name === 'approve' && (s.outputs as { verdict?: string } | undefined)?.verdict === 'approve',
  ).length;
  const approveCount = approves;
  const totalApprovalDecisions = stages.filter((s) => s.name === 'approve').length;
  const ci = wilsonInterval({
    successes: approveCount,
    trials: Math.max(totalApprovalDecisions, 1),
    level: '95',
  });
  return {
    stages,
    approveRate: approveCount / Math.max(totalApprovalDecisions, 1),
    approveCI: { low: ci.low, high: ci.high },
    hash: result.runHash,
  };
}

export default function OrchestrationTrace() {
  const [seed, setSeed] = useState(0);
  const [run, setRun] = useState<RunSummary | null>(null);
  const [pending, setPending] = useState(false);

  const ranAt = useMemo(() => (run ? new Date().toISOString() : null), [run]);

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1080, color: '#e8e6df' }}>
      <header style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8b8775' }}>
          A11oy · Reliquary · Orchestration trace
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginTop: 4 }}>
          Sequence-pipeline orchestration trace
        </h1>
        <p style={{ marginTop: 8, color: '#a8a48f', fontSize: 14, lineHeight: 1.55 }}>
          Every brand-orchestration run emits per-stage Λ-receipts of class{' '}
          <span style={{ color: GOLD, fontFamily: 'monospace' }}>
            {PIPELINE_STAGE_RECEIPT_CLASS}
          </span>{' '}
          with an (inputsHash, paramsHash, outputsHash) triple. The
          approve-rate is reported with a Wilson 95% confidence interval so
          reviewers see uncertainty, not just a point estimate.
        </p>
      </header>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button
          data-testid="run-orchestration"
          onClick={async () => {
            setPending(true);
            try {
              const next = seed + 1;
              setSeed(next);
              const r = await runOrchestration(next);
              setRun(r);
            } finally {
              setPending(false);
            }
          }}
          disabled={pending}
          style={{
            padding: '8px 14px',
            background: GOLD,
            color: '#0d0c08',
            border: `1px solid ${GOLD}`,
            borderRadius: 4,
            fontSize: 13,
            cursor: pending ? 'wait' : 'pointer',
            fontWeight: 600,
          }}
        >
          {pending ? 'Running…' : 'Run orchestration'}
        </button>
        {ranAt && (
          <span style={{ alignSelf: 'center', fontSize: 12, color: '#8b8775' }}>
            last run: {ranAt}
          </span>
        )}
      </div>

      {run && (
        <>
          <section
            style={{
              background: '#15140f',
              border: '1px solid #2a2820',
              borderRadius: 8,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8b8775' }}>
              Approve rate (Wilson 95% CI)
            </div>
            <div style={{ display: 'flex', gap: 32, alignItems: 'baseline', marginTop: 8 }}>
              <div style={{ fontSize: 36, fontWeight: 600, color: GOLD }}>
                {(run.approveRate * 100).toFixed(0)}%
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#a8a48f' }}>
                [ {(run.approveCI.low * 100).toFixed(1)}% , {(run.approveCI.high * 100).toFixed(1)}% ]
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#7a7860', marginLeft: 'auto' }}>
                runHash: {run.hash.slice(0, 16)}…
              </div>
            </div>
          </section>

          <section
            data-testid="orchestration-stages"
            style={{ display: 'grid', gap: 10 }}
          >
            {run.stages.map((s, i) => (
              <div
                key={i}
                style={{
                  background: '#15140f',
                  border: '1px solid #2a2820',
                  borderRadius: 8,
                  padding: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 4,
                      background: 'rgba(201,183,135,0.12)',
                      border: `1px solid ${GOLD}`,
                      color: GOLD,
                      fontFamily: 'monospace',
                      fontSize: 12,
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    {i + 1}
                  </span>
                  <strong style={{ fontSize: 15 }}>{s.name}</strong>
                  <span style={{ fontSize: 11, color: '#7a7860', fontFamily: 'monospace' }}>
                    {PIPELINE_STAGE_RECEIPT_CLASS}
                  </span>
                </div>
                <div
                  style={{
                    marginTop: 10,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 8,
                    fontFamily: 'monospace',
                    fontSize: 11,
                  }}
                >
                  <Hash label="inputsHash" hash={s.inputsHash} />
                  <Hash label="paramsHash" hash={s.paramsHash} />
                  <Hash label="outputsHash" hash={s.outputsHash} />
                </div>
                <pre
                  style={{
                    marginTop: 10,
                    padding: 10,
                    background: '#0d0c08',
                    border: '1px solid #2a2820',
                    borderRadius: 4,
                    fontSize: 11,
                    overflow: 'auto',
                    color: '#c4c1ad',
                  }}
                >
{JSON.stringify(s.outputs, null, 2)}
                </pre>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}

function Hash({ label, hash }: { label: string; hash: string }) {
  return (
    <div style={{ background: '#0d0c08', padding: '6px 8px', borderRadius: 4 }}>
      <div style={{ color: '#7a7860', fontSize: 10, marginBottom: 2 }}>{label}</div>
      <div style={{ color: '#e8e6df' }}>{hash.slice(0, 22)}…</div>
    </div>
  );
}
