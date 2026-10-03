import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';

const GOLD = '#c9b787';

interface SecurityWorkflow {
  id: string;
  name: string;
  intent: string;
  capabilities: string[];
  proposedGate: string;
}

const SEC_WORKFLOWS: SecurityWorkflow[] = [
  {
    id: 'sec-triage',
    name: 'Alert Triage Agent',
    intent: 'Proposed workflow for organizing alerts and preparing an evidence bundle for a human reviewer.',
    capabilities: ['alert prioritization', 'indicator correlation', 'evidence assembly', 'review queue'],
    proposedGate: 'A reviewer would approve any escalation or external action.',
  },
  {
    id: 'sec-detection',
    name: 'Detection Engineering Agent',
    intent: 'Proposed workflow for drafting detection rules and testing them with synthetic data.',
    capabilities: ['rule drafting', 'synthetic validation', 'coverage analysis', 'review queue'],
    proposedGate: 'A reviewer would approve any rule deployment.',
  },
  {
    id: 'sec-threat',
    name: 'Threat Analysis Agent',
    intent: 'Proposed workflow for analyzing suspicious files or URLs in an isolated test environment.',
    capabilities: ['static analysis', 'behavior review', 'indicator extraction', 'review queue'],
    proposedGate: 'A reviewer would approve any verdict or downstream action.',
  },
];

const EVIDENCE_GAPS = [
  { label: 'Running agent or model binding', detail: 'UNAVAILABLE — no source-bound runtime observation.' },
  { label: 'Actions and external effects', detail: 'UNAVAILABLE — no execution or target-system receipt.' },
  { label: 'Cryptographic proof', detail: 'UNAVAILABLE — no verified receipt chain for these workflows.' },
  { label: 'Isolation and human approval', detail: 'UNAVAILABLE — no current environment or approval evidence.' },
];

export function GovernedSecurityAgents() {
  const [selectedAgent, setSelectedAgent] = useState<string>(SEC_WORKFLOWS[0].id);
  const workflow = SEC_WORKFLOWS.find(item => item.id === selectedAgent)!;

  return (
    <Layout>
      <PageHeader
        label="GOVERNED SECURITY · DESIGN SURFACE"
        title="AI Security Operations"
        subtitle="Three modeled security workflows. This page does not connect to a SIEM, EDR, running agent, approval system, or proof ledger."
        status="DEMO"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-8">
        <KpiCard label="WORKFLOWS" value="MODELED" sub="Local source definitions" accent={GOLD} />
        <KpiCard label="ACTIONS TODAY" value="UNAVAILABLE" sub="No runtime feed" accent={GOLD} />
        <KpiCard label="VERIFIED RECEIPTS" value="UNAVAILABLE" sub="No bound proof chain" accent={GOLD} />
        <KpiCard label="TRUST SCORE" value="UNAVAILABLE" sub="No measured evaluation" accent={GOLD} />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {SEC_WORKFLOWS.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedAgent(item.id)}
            aria-pressed={selectedAgent === item.id}
            className="px-4 py-2 rounded-lg text-xs font-mono transition-all"
            style={{
              background: selectedAgent === item.id ? 'rgba(201,183,135,0.12)' : 'rgba(255,255,255,0.025)',
              border: '1px solid ' + (selectedAgent === item.id ? 'rgba(201,183,135,0.4)' : 'rgba(255,255,255,0.08)'),
              color: selectedAgent === item.id ? GOLD : '#8a8a8a',
              cursor: 'pointer',
            }}
          >
            {item.name}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card style={{ borderLeft: '3px solid ' + GOLD }}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{workflow.name}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: GOLD, backgroundColor: 'rgba(201,183,135,0.12)' }}>DEMO</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{workflow.intent}</p>
              </div>
            </div>

            <SectionTitle>Proposed Capabilities</SectionTitle>
            <div className="flex flex-wrap gap-1 mb-5">
              {workflow.capabilities.map(capability => (
                <span key={capability} className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>
                  {capability}
                </span>
              ))}
            </div>

            <SectionTitle>Governance Design</SectionTitle>
            <p className="text-xs mb-5" style={{ color: 'var(--color-a11oy-text-sub)' }}>
              {workflow.proposedGate} This is a design requirement; enforcement has not been verified on this page.
            </p>

            <SectionTitle>Operational Evidence</SectionTitle>
            <div className="flex flex-col gap-2">
              {EVIDENCE_GAPS.map(gap => (
                <div key={gap.label} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)' }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: 'var(--color-a11oy-text)' }}>{gap.label}</div>
                  <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{gap.detail}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <SectionTitle>Workflow Overview</SectionTitle>
          {SEC_WORKFLOWS.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedAgent(item.id)}
              aria-pressed={selectedAgent === item.id}
              className="rounded-lg border p-3 text-left cursor-pointer transition-all"
              style={{
                backgroundColor: selectedAgent === item.id ? 'rgba(201,183,135,0.03)' : 'var(--color-a11oy-card)',
                borderColor: selectedAgent === item.id ? GOLD : 'var(--color-a11oy-border)',
                borderLeft: '3px solid ' + GOLD,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{item.name}</span>
                <span className="text-[9px] font-mono" style={{ color: GOLD }}>MODELED</span>
              </div>
              <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>No running status or action count is available.</span>
            </button>
          ))}

          <Card>
            <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>GOVERNANCE TARGETS</div>
            <div className="space-y-2 text-xs">
              {[
                'Approval before external action',
                'Policy check on each proposed action',
                'Source-bound evidence receipt',
                'Verified isolation for analysis',
              ].map(target => (
                <div key={target} className="flex items-center justify-between gap-3">
                  <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{target}</span>
                  <span className="font-mono" style={{ color: GOLD }}>UNVERIFIED</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6 p-3 rounded-lg text-xs" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-sub)' }}>
        These workflows are local design examples. Agent operation, model choice, air-gap status, verdicts, and attestations require separate runtime and external-system evidence.
      </div>
    </Layout>
  );
}
