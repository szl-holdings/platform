import { useState } from 'react';
import { Layout } from '../components/layout';
import {
  PageHeader,
  Card,
  SectionTitle,
  KpiCard,
  ApprovalGate,
  ActionButton,
} from '../components/ui';

type GateDecision = 'approved' | 'blocked' | 'info_requested';

const POLICIES = [
  {
    id: 'pol-maritime-002',
    name: 'Maritime Operational Threshold',
    domain: 'Maritime',
    enforcement: 'block_until_approved',
    trigger: 'Any vessel delay > 24h or cost exposure > $10k',
    gate: 'VP Operations approval required',
    status: 'active',
  },
  {
    id: 'pol-finance-001',
    name: 'Capex Variance Acknowledgment',
    domain: 'Finance',
    enforcement: 'require_acknowledgment',
    trigger: 'Capex variance > 5% of quarterly budget',
    gate: 'CFO-delegate acknowledgment required',
    status: 'active',
  },
  {
    id: 'pol-security-007',
    name: 'Threat Tier Escalation Gate',
    domain: 'Defense',
    enforcement: 'auto_escalate',
    trigger: 'Threat actor elevated to ORANGE or above',
    gate: 'Security Ops automated escalation + CISO notification',
    status: 'active',
  },
  {
    id: 'pol-legal-003',
    name: 'Discovery Deadline Guardrail',
    domain: 'Legal',
    enforcement: 'block_until_approved',
    trigger: 'Discovery deadline T-48h with outstanding docs',
    gate: 'General Counsel approval required',
    status: 'active',
  },
  {
    id: 'pol-revenue-001',
    name: 'Pipeline Intervention Gate',
    domain: 'Revenue',
    enforcement: 'require_approval',
    trigger: 'Pipeline velocity drop > 15%',
    gate: 'VP Revenue approval required',
    status: 'active',
  },
  {
    id: 'pol-global-001',
    name: 'No Silent Execution Policy',
    domain: 'All',
    enforcement: 'constitutional',
    trigger: 'Any material action across all domains',
    gate: 'No material action executes without human approval',
    status: 'constitutional',
  },
];

const PENDING = [
  {
    id: 'pg-001',
    policy: 'pol-maritime-002',
    action: 'MV Cascade port standby — 48h authorization',
    approver: 'VP Operations',
    deadline: 'T-2h',
  },
  {
    id: 'pg-002',
    policy: 'pol-legal-003',
    action: 'Talbot discovery escalation to lead counsel',
    approver: 'General Counsel',
    deadline: 'T-48h',
  },
];

const ENFORCEMENT_STYLES: Record<string, { color: string }> = {
  block_until_approved: { color: '#f5f5f5' },
  require_acknowledgment: { color: '#c9b787' },
  auto_escalate: { color: '#8a8a8a' },
  require_approval: { color: '#c9b787' },
  constitutional: { color: '#b08d52' },
};

export function Governance() {
  const [gateDecisions, setGateDecisions] = useState<Record<string, GateDecision>>({});
  const [simulationRuns, setSimulationRuns] = useState(0);
  const pendingCount = PENDING.length - Object.keys(gateDecisions).length;
  const displayedReviewCount = Object.keys(gateDecisions).length;

  const decideGate = (id: string, decision: GateDecision) =>
    setGateDecisions((prev) => ({ ...prev, [id]: decision }));

  return (
    <Layout>
      <PageHeader
        label="COVENANT GOVERNANCE"
        title="Policy Gates & Approvals"
        subtitle="Deterministic policy and approval fixtures demonstrate the intended Covenant Layer behavior without contacting an operational service."
        status="DEMO"
      />

      <div
        className="p-4 rounded-lg mb-8 border text-sm"
        style={{
          backgroundColor: 'rgba(229,210,158,0.05)',
          borderColor: 'rgba(229,210,158,0.22)',
          color: 'var(--color-a11oy-text-sub)',
        }}
      >
        Evidence boundary: policy records and approval counts below are deterministic local
        fixtures. This page makes no approval API or subscription request. Decisions remain local UI
        state and do not authorize or evidence an external action.
      </div>

      <div
        className="p-4 rounded-lg mb-8 border"
        style={{ backgroundColor: 'rgba(176,141,82,0.06)', borderColor: 'rgba(176,141,82,0.25)' }}
      >
        <div className="text-sm font-semibold mb-1" style={{ color: '#b08d52' }}>
          Constitutional Principle
        </div>
        <div className="text-sm" style={{ color: 'var(--color-a11oy-text-sub)' }}>
          Design invariant: material actions are intended to require explicit human authorization.
          The prototype demonstrates the gate shape; it does not prove deployed enforcement.
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="POLICY FIXTURES" value="5" sub="+1 design invariant" accent="#c9b787" />
        <KpiCard
          label="DISPLAYED PENDING"
          value={String(pendingCount)}
          sub="local demo records"
          accent="#c9b787"
        />
        <KpiCard
          label="DISPLAYED REVIEWS"
          value={String(displayedReviewCount)}
          sub="not execution evidence"
          accent="#c9b787"
        />
        <KpiCard label="EXTERNAL ACTIONS" value="0" sub="not authorized by demo" accent="#b08d52" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <SectionTitle>Demo Policy Gates</SectionTitle>
          <div className="flex flex-col gap-3 mb-6">
            {PENDING.map((p) => {
              const decision = gateDecisions[p.id];
              const DECISION_META: Record<GateDecision, { color: string; label: string }> = {
                approved: { color: '#22c55e', label: '✓ Demo approved — no execution' },
                blocked: { color: '#ef4444', label: '✕ Demo blocked locally' },
                info_requested: { color: '#c9b787', label: '⏸ Demo info requested' },
              };
              return (
                <Card key={p.id}>
                  <div
                    className="text-xs font-mono mb-1"
                    style={{ color: 'var(--color-a11oy-text-ghost)' }}
                  >
                    {p.policy}
                  </div>
                  <div
                    className="text-sm font-medium mb-2"
                    style={{ color: 'var(--color-a11oy-text)' }}
                  >
                    {p.action}
                  </div>
                  <div className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    Seed approver: {p.approver} · Fixture deadline: {p.deadline}
                  </div>
                  {decision ? (
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs font-mono px-3 py-1.5 rounded"
                        style={{
                          backgroundColor: `${DECISION_META[decision].color}18`,
                          color: DECISION_META[decision].color,
                          border: `1px solid ${DECISION_META[decision].color}30`,
                        }}
                      >
                        {DECISION_META[decision].label}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setGateDecisions((prev) => {
                            const n = { ...prev };
                            delete n[p.id];
                            return n;
                          })
                        }
                        className="min-h-11 px-2 text-xs"
                        style={{
                          color: 'var(--color-a11oy-text-ghost)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Undo demo decision
                      </button>
                    </div>
                  ) : (
                    <>
                      <ApprovalGate />
                      <div className="flex gap-2 mt-2">
                        <ActionButton
                          variant="primary"
                          onClick={() => decideGate(p.id, 'approved')}
                        >
                          Approve demo
                        </ActionButton>
                        <ActionButton
                          variant="ghost"
                          onClick={() => decideGate(p.id, 'info_requested')}
                        >
                          Request demo info
                        </ActionButton>
                        <ActionButton variant="danger" onClick={() => decideGate(p.id, 'blocked')}>
                          Block demo
                        </ActionButton>
                      </div>
                    </>
                  )}
                </Card>
              );
            })}
          </div>

          <SectionTitle>Policy Registry</SectionTitle>
          <div className="flex flex-col gap-2">
            {POLICIES.map((p) => {
              const style = ENFORCEMENT_STYLES[p.enforcement] ?? { color: '#5e5e5e' };
              return (
                <Card key={p.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-xs font-mono" style={{ color: style.color }}>
                          {p.enforcement}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: 'var(--color-a11oy-text-ghost)' }}
                        >
                          {p.domain}
                        </span>
                      </div>
                      <div
                        className="text-sm font-medium"
                        style={{ color: 'var(--color-a11oy-text)' }}
                      >
                        {p.name}
                      </div>
                      <div
                        className="text-xs mt-0.5"
                        style={{ color: 'var(--color-a11oy-text-sub)' }}
                      >
                        {p.gate}
                      </div>
                    </div>
                    <span
                      className="text-xs font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{
                        backgroundColor:
                          p.status === 'constitutional'
                            ? 'rgba(176,141,82,0.1)'
                            : 'rgba(201,183,135,0.1)',
                        color: p.status === 'constitutional' ? '#b08d52' : '#c9b787',
                      }}
                    >
                      DEMO {p.status}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <SectionTitle>Covenant Simulator</SectionTitle>
          <Card>
            <div className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
              Test a fixture action against the displayed demo policies.
            </div>
            <div className="space-y-3">
              <div>
                <div
                  className="text-xs font-mono block mb-1"
                  style={{ color: 'var(--color-a11oy-text-ghost)' }}
                >
                  ACTION DOMAIN
                </div>
                <div
                  className="text-xs px-3 py-2 rounded border"
                  style={{
                    backgroundColor: 'var(--color-a11oy-deep)',
                    borderColor: 'var(--color-a11oy-border)',
                    color: 'var(--color-a11oy-text-sub)',
                  }}
                >
                  Maritime — vessel operations
                </div>
              </div>
              <div>
                <div
                  className="text-xs font-mono block mb-1"
                  style={{ color: 'var(--color-a11oy-text-ghost)' }}
                >
                  PROPOSED ACTION
                </div>
                <div
                  className="text-xs px-3 py-2 rounded border"
                  style={{
                    backgroundColor: 'var(--color-a11oy-deep)',
                    borderColor: 'var(--color-a11oy-border)',
                    color: 'var(--color-a11oy-text-sub)',
                  }}
                >
                  Authorize port standby — $14,200/day
                </div>
              </div>
              {simulationRuns > 0 ? (
                <div
                  className="p-3 rounded"
                  aria-live="polite"
                  style={{
                    backgroundColor: 'rgba(201,183,135,0.06)',
                    border: '1px solid rgba(201,183,135,0.2)',
                  }}
                >
                  <div className="text-xs font-mono mb-1" style={{ color: '#c9b787' }}>
                    DEMO SIMULATION RESULT · LOCAL RUN {simulationRuns}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                    Fixture policy pol-maritime-002 matched · Displayed outcome:
                    block_until_approved · Intended reviewer: VP Operations · No external action
                    occurred
                  </div>
                </div>
              ) : (
                <div
                  className="p-3 rounded text-xs"
                  style={{
                    backgroundColor: 'var(--color-a11oy-deep)',
                    border: '1px solid var(--color-a11oy-border)',
                    color: 'var(--color-a11oy-text-ghost)',
                  }}
                >
                  Demo simulation has not run. The proposed action remains local fixture text.
                </div>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <ActionButton variant="ghost" onClick={() => setSimulationRuns((runs) => runs + 1)}>
                {simulationRuns > 0 ? 'Run demo again' : 'Run demo simulation'}
              </ActionButton>
            </div>
            <div className="mt-2 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0 inline-block mr-1"
                style={{ backgroundColor: '#c9b787' }}
              />{' '}
              Simulation runs against the displayed demo policy registry; no external action occurs.
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
