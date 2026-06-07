import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';

const GOLD = '#c9b787';

interface SecurityAgent {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'investigating' | 'idle';
  model: string;
  trustScore: number;
  actionsToday: number;
  proofChainEntries: number;
  humanGateRequired: boolean;
  capabilities: string[];
  recentActions: { time: string; action: string; verdict?: string; proofHash?: string }[];
}

const SEC_AGENTS: SecurityAgent[] = [
  {
    id: 'sec-triage', name: 'Alert Triage Agent', role: 'Autonomous alert investigation — prioritizes, investigates, and renders verdicts on security alerts with full evidence trail.',
    status: 'investigating', model: 'claude-3.5-sonnet (air-gapped)', trustScore: 985, actionsToday: 47, proofChainEntries: 47, humanGateRequired: true,
    capabilities: ['alert-prioritization', 'ioc-correlation', 'false-positive-detection', 'evidence-assembly', 'verdict-rendering'],
    recentActions: [
      { time: '20:14', action: 'Investigating SIEM alert #4892 — anomalous DNS query pattern from host srv-db-04', verdict: 'IN PROGRESS' },
      { time: '19:45', action: 'Alert #4891 — brute force attempt on VPN gateway', verdict: 'TRUE POSITIVE', proofHash: 'sha256:f1a2b3' },
      { time: '18:30', action: 'Alert #4890 — port scan from 203.0.113.42', verdict: 'FALSE POSITIVE', proofHash: 'sha256:c4d5e6' },
      { time: '17:12', action: 'Alert #4889 — malware signature match on endpoint ws-eng-12', verdict: 'TRUE POSITIVE', proofHash: 'sha256:a7b8c9' },
      { time: '15:40', action: 'Alert #4888 — lateral movement indicator from compromised credential', verdict: 'TRUE POSITIVE', proofHash: 'sha256:d1e2f3' },
    ],
  },
  {
    id: 'sec-detection', name: 'Detection Engineering Agent', role: 'Auto-generates detection rules from threat intelligence, validates with synthetic data, and deploys to SIEM/EDR.',
    status: 'active', model: 'gpt-4o', trustScore: 960, actionsToday: 12, proofChainEntries: 12, humanGateRequired: true,
    capabilities: ['rule-generation', 'synthetic-validation', 'sigma-rule-authoring', 'yara-rule-authoring', 'coverage-gap-analysis'],
    recentActions: [
      { time: '20:00', action: 'Generated 3 Sigma rules for TG-Ember DNS-over-HTTPS exfiltration pattern', verdict: 'VALIDATED', proofHash: 'sha256:g1h2i3' },
      { time: '16:30', action: 'Coverage gap analysis — 2 MITRE ATT&CK techniques without detection rules', verdict: 'GAP IDENTIFIED', proofHash: 'sha256:j4k5l6' },
      { time: '14:00', action: 'Synthetic data test: 847 samples against new YARA rules — 0 false positives', verdict: 'VALIDATED', proofHash: 'sha256:m7n8o9' },
      { time: '10:15', action: 'Auto-updated 14 firewall signatures based on latest IOC feed', verdict: 'DEPLOYED', proofHash: 'sha256:p1q2r3' },
    ],
  },
  {
    id: 'sec-threat', name: 'Threat Analysis Agent', role: 'Deobfuscation, malware analysis, and threat verdicts — analyzes suspicious files, URLs, and behaviors with evidence-backed conclusions.',
    status: 'active', model: 'claude-3.5-sonnet (sandboxed)', trustScore: 975, actionsToday: 8, proofChainEntries: 8, humanGateRequired: true,
    capabilities: ['deobfuscation', 'static-analysis', 'behavioral-analysis', 'malware-classification', 'ioc-extraction'],
    recentActions: [
      { time: '19:30', action: 'Analyzed suspicious PowerShell payload from alert #4889 — multi-stage dropper identified', verdict: 'MALICIOUS', proofHash: 'sha256:s4t5u6' },
      { time: '17:45', action: 'Deobfuscated Base64-encoded C2 beacon — extracted 3 new IOCs', verdict: 'IOCS EXTRACTED', proofHash: 'sha256:v7w8x9' },
      { time: '14:20', action: 'URL reputation analysis: 12 suspicious URLs from phishing campaign — 8 confirmed malicious', verdict: 'MALICIOUS', proofHash: 'sha256:y1z2a3' },
      { time: '11:00', action: 'Binary analysis of ws-eng-12 sample — TG-Ember variant confirmed', verdict: 'CONFIRMED APT', proofHash: 'sha256:b4c5d6' },
    ],
  },
];

const STATUS_COLORS: Record<string, string> = { active: '#22c55e', investigating: '#f97316', idle: '#5e5e5e' };
const VERDICT_COLORS: Record<string, string> = {
  'TRUE POSITIVE': '#ef4444', 'FALSE POSITIVE': '#22c55e', 'IN PROGRESS': '#f97316',
  'VALIDATED': '#22c55e', 'GAP IDENTIFIED': GOLD, 'DEPLOYED': '#22c55e',
  'MALICIOUS': '#ef4444', 'IOCS EXTRACTED': GOLD, 'CONFIRMED APT': '#ef4444',
};

export function GovernedSecurityAgents() {
  const [selectedAgent, setSelectedAgent] = useState<string>(SEC_AGENTS[0].id);
  const agent = SEC_AGENTS.find(a => a.id === selectedAgent)!;

  const totalActions = SEC_AGENTS.reduce((a, s) => a + s.actionsToday, 0);
  const totalProofs = SEC_AGENTS.reduce((a, s) => a + s.proofChainEntries, 0);
  const avgTrust = Math.round(SEC_AGENTS.reduce((a, s) => a + s.trustScore, 0) / SEC_AGENTS.length);

  return (
    <Layout>
      <PageHeader
        label="GOVERNED SECURITY AGENTS"
        title="AI Security Operations"
        subtitle="Three AI security agents — Alert Triage, Detection Engineering, and Threat Analysis — modeled on Google's Unified Security agents but governed by A11oy's proof chain and human gate."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <KpiCard label="SECURITY AGENTS" value={SEC_AGENTS.length} sub="all governed" accent={GOLD} />
        <KpiCard label="ACTIONS TODAY" value={totalActions} sub="across all agents" accent={GOLD} />
        <KpiCard label="PROOF ENTRIES" value={totalProofs} sub="100% attested" accent="#22c55e" />
        <KpiCard label="AVG TRUST" value={avgTrust} sub="out of 1000" accent={GOLD} />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {SEC_AGENTS.map(a => {
          const sc = STATUS_COLORS[a.status];
          return (
            <button
              key={a.id}
              onClick={() => setSelectedAgent(a.id)}
              className="px-4 py-2 rounded-lg text-xs font-mono transition-all"
              style={{
                background: selectedAgent === a.id ? `${sc}15` : 'rgba(255,255,255,0.025)',
                border: `1px solid ${selectedAgent === a.id ? sc + '40' : 'rgba(255,255,255,0.08)'}`,
                color: selectedAgent === a.id ? sc : '#5e5e5e',
                cursor: 'pointer',
              }}
            >
              {a.name}
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card style={{ borderLeft: `3px solid ${STATUS_COLORS[agent.status]}` }}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{agent.name}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: STATUS_COLORS[agent.status], backgroundColor: `${STATUS_COLORS[agent.status]}15` }}>{agent.status}</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{agent.role}</p>
              </div>
              <div className="text-right text-xs flex-shrink-0">
                <div className="font-mono" style={{ color: GOLD }}>Trust: {agent.trustScore}</div>
                <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>{agent.model}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
              {agent.capabilities.map(c => (
                <span key={c} className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>{c}</span>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
              <div className="p-2 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)' }}>
                <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Actions Today</div>
                <div className="font-mono font-bold text-lg" style={{ color: GOLD }}>{agent.actionsToday}</div>
              </div>
              <div className="p-2 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)' }}>
                <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Proof Entries</div>
                <div className="font-mono font-bold text-lg" style={{ color: '#22c55e' }}>{agent.proofChainEntries}</div>
              </div>
              <div className="p-2 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)' }}>
                <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Human Gate</div>
                <div className="font-mono font-bold text-lg" style={{ color: agent.humanGateRequired ? '#f97316' : '#22c55e' }}>{agent.humanGateRequired ? 'Required' : 'Auto'}</div>
              </div>
            </div>

            <SectionTitle>Recent Actions</SectionTitle>
            <div className="flex flex-col gap-2">
              {agent.recentActions.map((action, i) => {
                const verdictColor = VERDICT_COLORS[action.verdict ?? ''] ?? '#8a8a8a';
                return (
                  <div key={i} className="flex gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)' }}>
                    <div className="text-[9px] font-mono flex-shrink-0 pt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{action.time}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs mb-1" style={{ color: 'var(--color-a11oy-text-sub)' }}>{action.action}</div>
                      <div className="flex items-center gap-2">
                        {action.verdict && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: verdictColor, backgroundColor: `${verdictColor}15` }}>{action.verdict}</span>
                        )}
                        {action.proofHash && (
                          <span className="text-[9px] font-mono" style={{ color: '#22c55e' }}>{action.proofHash}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <SectionTitle>Agent Overview</SectionTitle>
          {SEC_AGENTS.map(a => {
            const sc = STATUS_COLORS[a.status];
            return (
              <div
                key={a.id}
                className="rounded-lg border p-3 cursor-pointer transition-all"
                onClick={() => setSelectedAgent(a.id)}
                style={{
                  backgroundColor: selectedAgent === a.id ? 'rgba(201,183,135,0.03)' : 'var(--color-a11oy-card)',
                  borderColor: selectedAgent === a.id ? GOLD : 'var(--color-a11oy-border)',
                  borderLeft: `3px solid ${sc}`,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{a.name}</span>
                  <span className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ color: sc, backgroundColor: `${sc}15` }}>{a.status}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{a.actionsToday} actions</span>
                  <span className="font-mono" style={{ color: GOLD }}>Trust: {a.trustScore}</span>
                </div>
              </div>
            );
          })}

          <Card>
            <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>GOVERNANCE MODEL</div>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Proof Chain', value: 'Every action attested', color: '#22c55e' },
                { label: 'Human Gate', value: 'Required for escalation', color: '#f97316' },
                { label: 'Model Isolation', value: 'Air-gapped / sandboxed', color: GOLD },
                { label: 'Covenant Layer', value: 'All actions policy-checked', color: GOLD },
                { label: 'Audit Trail', value: 'Immutable, append-only', color: '#22c55e' },
              ].map(g => (
                <div key={g.label} className="flex items-center justify-between">
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{g.label}</span>
                  <span className="font-mono" style={{ color: g.color }}>{g.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--color-a11oy-text-sub)' }}>
            <div className="font-semibold mb-1" style={{ color: '#ef4444' }}>A11oy Difference</div>
            All three agents operate under A11oy's proof-carrying governance — unlike industry equivalents, every verdict, rule, and analysis is cryptographically attested and subject to human override.
          </div>
        </div>
      </div>

      <div className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-blue)] flex-shrink-0" /> Security agents are modeled on Google's Unified Security (GUS) architecture but governed by A11oy's proof chain — proving not just what was detected, but how the reasoning was conducted.
      </div>
    </Layout>
  );
}
