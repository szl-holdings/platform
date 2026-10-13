import {
  SEED_PCE_CONTRACTS,
  SEED_PROOF_PACKETS,
  SEED_SIGNALS,
  type Workcell,
} from '@workspace/a11oy-fabric';
import { useMemo, useState } from 'react';
import {
  evaluateWorkcellProofCoverage,
  type ProofCoverageChallenges,
  type ProofCoverageStatus,
} from '../lib/workcell-proof-coverage';
import { Card, SectionTitle } from './ui';

const STATUS_STYLE: Record<ProofCoverageStatus, { color: string; background: string }> = {
  SATISFIED: { color: '#c9b787', background: 'rgba(201,183,135,0.12)' },
  MISMATCH: { color: '#f5f5f5', background: 'rgba(245,245,245,0.1)' },
  UNAVAILABLE: { color: '#8a8a8a', background: 'rgba(138,138,138,0.12)' },
};

const CHALLENGES: Array<{
  key: keyof ProofCoverageChallenges;
  label: string;
  description: string;
}> = [
  {
    key: 'removeProofReference',
    label: 'Remove proof reference',
    description: 'Inspect the same fixture with its contract-to-packet reference omitted.',
  },
  {
    key: 'substituteActionId',
    label: 'Substitute action ID',
    description: 'Inspect a contract whose action no longer matches the ActionBrief.',
  },
  {
    key: 'removeApprovalReference',
    label: 'Omit approval reference',
    description: 'Inspect an approval-required contract without its approval-record reference.',
  },
];

export function WorkcellProofCoverage({ workcell }: { workcell: Workcell }) {
  const [challenges, setChallenges] = useState<ProofCoverageChallenges>({});
  const coverage = useMemo(
    () =>
      evaluateWorkcellProofCoverage({
        workcell,
        signals: SEED_SIGNALS,
        pceContracts: SEED_PCE_CONTRACTS,
        proofPackets: SEED_PROOF_PACKETS,
        challenges,
      }),
    [challenges, workcell],
  );
  const activeChallenges = Object.values(challenges).filter(Boolean).length;
  const activeChallengeLabels = CHALLENGES.filter(({ key }) => challenges[key]).map(
    ({ label }) => label,
  );
  const liveMessage = `${coverage.state}. ${coverage.satisfied} of ${coverage.total} obligations satisfied. ${
    activeChallengeLabels.length > 0
      ? `Active challenges: ${activeChallengeLabels.join(', ')}.`
      : 'No active challenges.'
  }`;

  const toggleChallenge = (key: keyof ProofCoverageChallenges) => {
    setChallenges((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <section
      className="mt-8"
      aria-labelledby="proof-coverage-heading"
      data-screenshot-reveal="true"
    >
      <SectionTitle>Workcell Proof Coverage Inspector</SectionTitle>
      <Card className="overflow-hidden">
        <div
          className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between"
          style={{ borderColor: 'var(--color-a11oy-border)' }}
        >
          <div className="max-w-3xl">
            <div className="font-mono text-xs tracking-[0.16em]" style={{ color: '#e5d29e' }}>
              DEMO · CONTRACT-TO-EVIDENCE JOIN
            </div>
            <h2
              id="proof-coverage-heading"
              className="mt-2 text-lg font-semibold"
              style={{ color: 'var(--color-a11oy-text)' }}
            >
              Does the declared run resolve to the evidence it names?
            </h2>
            <p className="mt-2 text-sm leading-6" style={{ color: 'var(--color-a11oy-text-sub)' }}>
              This deterministic check attempts to resolve unique repository fixture records across
              the Workcell, PCE contract, signals, policy and approval references, ExecutionTrace,
              and Proof Packet. Any absent, ambiguous, or mismatched obligation keeps the result
              incomplete.
            </p>
          </div>
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="flex min-w-40 flex-col items-start gap-1 rounded-lg border p-3 sm:items-end"
            style={{
              borderColor: 'var(--color-a11oy-border)',
              backgroundColor: 'var(--color-a11oy-deep)',
            }}
          >
            <span className="sr-only" data-proof-live-message>
              {liveMessage}
            </span>
            <span
              data-status-pill
              className="rounded px-2 py-1 font-mono text-xs"
              style={{
                color: coverage.state === 'COMPLETE' ? '#c9b787' : '#f5f5f5',
                backgroundColor:
                  coverage.state === 'COMPLETE'
                    ? 'rgba(201,183,135,0.12)'
                    : 'rgba(245,245,245,0.1)',
                whiteSpace: 'nowrap',
              }}
            >
              {coverage.state}
            </span>
            <span className="font-mono text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
              {coverage.satisfied}/{coverage.total} obligations satisfied
            </span>
          </div>
        </div>

        <div className="py-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--color-a11oy-text)' }}>
                Local challenge controls
              </div>
              <div className="mt-1 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                Change only the inspector input. No fixture, approval, connector, or ledger is
                mutated.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setChallenges({})}
              disabled={activeChallenges === 0}
              className="min-h-11 rounded border px-3 text-xs disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                color: 'var(--color-a11oy-text-sub)',
                borderColor: 'var(--color-a11oy-border)',
              }}
            >
              Reset challenges
            </button>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {CHALLENGES.map((challenge) => {
              const active = Boolean(challenges[challenge.key]);
              return (
                <button
                  type="button"
                  key={challenge.key}
                  aria-pressed={active}
                  onClick={() => toggleChallenge(challenge.key)}
                  className="min-h-11 rounded-lg border p-3 text-left transition-colors"
                  style={{
                    borderColor: active ? '#c9b787' : 'var(--color-a11oy-border)',
                    backgroundColor: active ? 'rgba(201,183,135,0.08)' : 'var(--color-a11oy-deep)',
                  }}
                >
                  <span
                    className="block text-xs font-semibold"
                    style={{ color: active ? '#e5d29e' : 'var(--color-a11oy-text)' }}
                  >
                    {active ? 'ACTIVE · ' : ''}
                    {challenge.label}
                  </span>
                  <span
                    className="mt-1 block text-xs leading-5"
                    style={{ color: 'var(--color-a11oy-text-ghost)' }}
                  >
                    {challenge.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <ul className="grid min-w-0 gap-3 lg:grid-cols-2" aria-label="Proof obligations">
          {coverage.obligations.map((item) => {
            const style = STATUS_STYLE[item.status];
            return (
              <li
                key={item.id}
                data-proof-obligation={item.id}
                className="min-w-0 rounded-lg border p-4 text-xs"
                style={{
                  borderColor: 'var(--color-a11oy-border)',
                  backgroundColor: 'var(--color-a11oy-deep)',
                }}
              >
                <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:justify-between">
                  <h3 className="font-medium" style={{ color: 'var(--color-a11oy-text)' }}>
                    {item.label}
                  </h3>
                  <span
                    data-status-pill
                    className="shrink-0 rounded px-2 py-1 font-mono"
                    style={{
                      color: style.color,
                      backgroundColor: style.background,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.status}
                  </span>
                </div>
                <p
                  data-proof-detail
                  className="mt-3 leading-5"
                  style={{ color: 'var(--color-a11oy-text-sub)' }}
                >
                  {item.detail}
                </p>
                <div
                  className="mt-3 border-t pt-3 font-mono leading-5"
                  style={{
                    borderColor: 'var(--color-a11oy-border)',
                    color: 'var(--color-a11oy-text-ghost)',
                    overflowWrap: 'anywhere',
                  }}
                >
                  <span className="block text-[10px] tracking-[0.14em]">REFERENCES</span>
                  <span className="mt-1 block">
                    {item.refs.length > 0 ? item.refs.join(' · ') : 'none'}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        <div
          className="mt-4 rounded-lg border p-3 text-xs leading-5"
          style={{
            borderColor: 'rgba(229,210,158,0.24)',
            backgroundColor: 'rgba(229,210,158,0.05)',
            color: 'var(--color-a11oy-text-sub)',
          }}
        >
          <strong style={{ color: '#e5d29e' }}>Evidence boundary:</strong> this inspector verifies
          deterministic fixture-record coverage only. Even COMPLETE would not verify signatures,
          durable storage, operator identity, external attestation, or production execution.
        </div>
      </Card>
    </section>
  );
}
