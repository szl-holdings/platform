// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import {
  FRAMEWORKS, CONTROL_MAPPINGS, getControlFreshness, LOG_RETENTION_STATUS,
  type FrameworkId,
} from '../data/complianceFabric';

const GOLD = '#c9b787';

const STATUS_COLORS: Record<string, string> = {
  fresh: '#22c55e',
  warning: '#f97316',
  stale: '#ef4444',
  critical: '#ef4444',
};

function fmt(ts: string) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function FreshnessBar({ daysStale, thresholdDays, status }: { daysStale: number; thresholdDays: number; status: string }) {
  const pct = Math.min((daysStale / thresholdDays) * 100, 100);
  const color = STATUS_COLORS[status];
  return (
    <div className="h-1.5 rounded-full w-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

const FRIA_SECTIONS = [
  { title: 'System Description', source: 'System Cards', desc: 'Intended purpose, capabilities, limitations, deployment context, and risk classification for each agent.' },
  { title: 'Affected Populations', source: 'Agent Registry', desc: 'Identification of groups affected by agent decisions — employees, customers, partners, regulated entities.' },
  { title: 'Risk Assessment', source: 'Risk Reports + Behavioral Audit', desc: 'Known risks, residual risks, mitigation measures, and ongoing monitoring commitments per agent.' },
  { title: 'Oversight Mechanisms', source: 'Covenant Layer + Approval Queue', desc: 'Human oversight structure — approval tiers, named approvers, escalation paths, override protections.' },
  { title: 'Data Protection', source: 'Connector Firewall + Data Handling', desc: 'PII handling, data minimization, consent gating, retention policies, and privacy impact.' },
  { title: 'Bias and Fairness', source: 'MirrorEval + Code Behaviors', desc: 'Bias detection scoring, demographic fairness checks, sycophancy resistance, and fairness-relevant eval dimensions.' },
  { title: 'Transparency Measures', source: 'Pillpintu Mode + Public Trust Portal', desc: 'Public disclosure commitments — transparency reports, CAVD, constitution publication, robustness wall.' },
  { title: 'Remediation Plan', source: 'CARE Engine + ARG', desc: 'Procedures for addressing identified risks, updating constitutions, and re-evaluating agents post-remediation.' },
];

export function CareEngine() {
  const [activeFramework, setActiveFramework] = useState<FrameworkId | 'all'>('all');
  const [showFria, setShowFria] = useState(false);

  const freshness = getControlFreshness();
  const filtered = activeFramework === 'all' ? freshness : freshness.filter(f => f.framework === activeFramework);

  const freshCount = freshness.filter(f => f.status === 'fresh').length;
  const warningCount = freshness.filter(f => f.status === 'warning').length;
  const staleCount = freshness.filter(f => f.status === 'stale' || f.status === 'critical').length;

  return (
    <Layout>
      <PageHeader
        label="CARE — CONTINUOUS AUDIT READINESS"
        title="Continuous Audit Readiness Engine"
        subtitle="Always-on monitoring that tracks evidence freshness for every mapped regulatory control. Auto-flags stale evidence, verifies 6-month log retention per EU AI Act Article 12, and generates on-demand audit packages."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <KpiCard label="CONTROLS MONITORED" value={String(CONTROL_MAPPINGS.length)} sub="across 4 frameworks" accent={GOLD} />
        <KpiCard label="FRESH" value={String(freshCount)} sub="evidence current" accent="#22c55e" />
        <KpiCard label="WARNING" value={String(warningCount)} sub="approaching threshold" accent="#f97316" />
        <KpiCard label="STALE" value={String(staleCount)} sub="needs refresh" accent="#ef4444" />
        <KpiCard label="LOG RETENTION" value={`${LOG_RETENTION_STATUS.currentRetentionMonths}mo`} sub={`required: ${LOG_RETENTION_STATUS.requiredMonths}mo`} accent="#22c55e" />
        <KpiCard label="ART. 12 COMPLIANT" value={LOG_RETENTION_STATUS.compliant ? 'YES' : 'NO'} sub="6-month retention" accent={LOG_RETENTION_STATUS.compliant ? '#22c55e' : '#ef4444'} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>Control Freshness Timeline</SectionTitle>
            <div className="flex gap-1">
              <button
                onClick={() => setActiveFramework('all')}
                className="text-xs px-2 py-0.5 rounded font-mono"
                style={{
                  backgroundColor: activeFramework === 'all' ? 'rgba(201,183,135,0.15)' : 'var(--color-a11oy-muted)',
                  color: activeFramework === 'all' ? GOLD : 'var(--color-a11oy-text-ghost)',
                  border: 'none', cursor: 'pointer',
                }}
              >
                All
              </button>
              {FRAMEWORKS.map(fw => (
                <button
                  key={fw.id}
                  onClick={() => setActiveFramework(fw.id)}
                  className="text-xs px-2 py-0.5 rounded font-mono"
                  style={{
                    backgroundColor: activeFramework === fw.id ? `${fw.color}18` : 'var(--color-a11oy-muted)',
                    color: activeFramework === fw.id ? fw.color : 'var(--color-a11oy-text-ghost)',
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  {fw.shortName}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-a11oy-border)' }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-a11oy-deep)' }}>
                  {['Control', 'Framework', 'Last Refreshed', 'Days', 'Threshold', 'Freshness', 'Status'].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-mono uppercase tracking-wide" style={{ color: 'var(--color-a11oy-text-ghost)', fontSize: '10px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((f, i) => {
                  const fw = FRAMEWORKS.find(fw => fw.id === f.framework);
                  const color = STATUS_COLORS[f.status];
                  return (
                    <tr key={f.controlId} style={{ backgroundColor: i % 2 === 0 ? 'var(--color-a11oy-card)' : 'var(--color-a11oy-deep)', borderBottom: '1px solid var(--color-a11oy-border)' }}>
                      <td className="px-3 py-2 font-mono" style={{ color: 'var(--color-a11oy-text)' }}>{f.controlRef}</td>
                      <td className="px-3 py-2 font-mono" style={{ color: fw?.color ?? GOLD }}>{fw?.shortName}</td>
                      <td className="px-3 py-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>{fmt(f.lastRefreshedAt)}</td>
                      <td className="px-3 py-2 font-mono" style={{ color }}>{f.daysStale}d</td>
                      <td className="px-3 py-2 font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{f.thresholdDays}d</td>
                      <td className="px-3 py-2 w-24"><FreshnessBar daysStale={f.daysStale} thresholdDays={f.thresholdDays} status={f.status} /></td>
                      <td className="px-3 py-2">
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${color}15`, color }}>{f.status.toUpperCase()}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <SectionTitle>EU AI Act Article 12 — Log Retention</SectionTitle>
          <Card>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Required Retention</span>
                <span className="font-mono font-bold" style={{ color: 'var(--color-a11oy-text)' }}>{LOG_RETENTION_STATUS.requiredMonths} months</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Current Retention</span>
                <span className="font-mono font-bold" style={{ color: '#22c55e' }}>{LOG_RETENTION_STATUS.currentRetentionMonths} months</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Oldest Log</span>
                <span className="font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{fmt(LOG_RETENTION_STATUS.oldestLogDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Next Purge</span>
                <span className="font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{fmt(LOG_RETENTION_STATUS.nextPurgeDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Compliance</span>
                <span className="font-mono font-bold" style={{ color: LOG_RETENTION_STATUS.compliant ? '#22c55e' : '#ef4444' }}>
                  {LOG_RETENTION_STATUS.compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                </span>
              </div>
              <div className="pt-2 border-t" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>HIGH-RISK AGENTS ({LOG_RETENTION_STATUS.highRiskAgents.length})</div>
                <div className="flex flex-wrap gap-1">
                  {LOG_RETENTION_STATUS.highRiskAgents.map(a => (
                    <span key={a} className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)', color: GOLD }}>{a}</span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <div className="mt-4">
            <SectionTitle>FRIA Generator</SectionTitle>
            <Card>
              <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                Generate a pre-populated Fundamental Rights Impact Assessment drawing from System Cards, Risk Reports,
                Behavioral Audit history, and agent constitutions.
              </p>
              <button
                onClick={() => setShowFria(!showFria)}
                className="w-full text-xs font-medium py-2 rounded-lg mb-3"
                style={{
                  backgroundColor: 'rgba(201,183,135,0.12)',
                  color: GOLD,
                  border: '1px solid rgba(201,183,135,0.25)',
                  cursor: 'pointer',
                }}
              >
                {showFria ? 'Hide FRIA Template' : 'Generate FRIA Template'}
              </button>
              {showFria && (
                <div className="space-y-2">
                  {FRIA_SECTIONS.map(section => (
                    <div key={section.title} className="p-2 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{section.title}</span>
                        <span className="text-xs font-mono" style={{ color: GOLD }}>{section.source}</span>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{section.desc}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="mt-4">
            <SectionTitle>Auto-Remediation</SectionTitle>
            <Card>
              <div className="space-y-2 text-xs">
                {[
                  { trigger: 'Evidence > 80% of threshold', action: 'Warning notification sent to control owner' },
                  { trigger: 'Evidence exceeds threshold', action: 'Remediation task auto-created' },
                  { trigger: 'Log retention < 6 months', action: 'Alert sent to compliance team' },
                  { trigger: 'New control mapping added', action: 'Evidence collection initiated' },
                ].map(r => (
                  <div key={r.trigger} className="flex items-start gap-2">
                    <span style={{ color: GOLD, flexShrink: 0 }}>→</span>
                    <div>
                      <span style={{ color: 'var(--color-a11oy-text)' }}>{r.trigger}</span>
                      <br />
                      <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{r.action}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div className="p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-blue)] flex-shrink-0" /> CARE Engine — continuous audit readiness monitoring. Evidence freshness is tracked per control. FRIA templates are pre-populated from live governance data. EU AI Act Article 12 retention is verified.
      </div>
    </Layout>
  );
}
