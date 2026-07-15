import { Layout } from '../components/layout';
import {
  PageHeader, Card, SectionTitle, KpiCard, StatusBadge, CodeBlock,
  SeverityBadge, HashId, ProgressBar, InfoRow, VerdictBadge,
} from '../components/ui';
import {
  GLASSWING_TAGLINE, GLASSWING_THESIS, GLASSWING_FIELD_MAP, GLASSWING_CITATIONS,
  GLASSWING_AGENTS, SENTRA_POLICIES, SENTRA_VAULT,
  SAMPLE_FINDINGS, SAMPLE_PATCHES, SAMPLE_APPROVALS, SAMPLE_AUDIT,
  RL_STATE_NOW, ENGINEERING_LOOP_STAGES, COMPLIANCE_MAP, HARD_BOUNDARIES,
  GLASSWING_VERSION,
} from '../data/glasswingDoctrine';
import { REWARD_TABLE } from '../lib/glasswing-schemas';

const GOLD = '#c9b787';
const SUB = 'var(--color-a11oy-text-sub)';
const TEXT = 'var(--color-a11oy-text)';
const GHOST = 'var(--color-a11oy-text-ghost)';

const AGENT_STATE_STYLE: Record<string, { color: string; label: string }> = {
  idle:               { color: '#5e5e5e', label: 'IDLE' },
  running:            { color: GOLD,      label: 'RUNNING' },
  awaiting_approval:  { color: '#c9b787', label: 'AWAITING APPROVAL' },
  blocked:            { color: '#f5f5f5', label: 'BLOCKED' },
  learning:           { color: '#c9b787', label: 'LEARNING' },
};

const POLICY_DECISION_STYLE: Record<string, { color: string; bg: string }> = {
  allow:              { color: GOLD,      bg: 'rgba(201,183,135,0.10)' },
  warn:               { color: '#c9b787', bg: 'rgba(201,183,135,0.06)' },
  approval_required:  { color: '#f5f5f5', bg: 'rgba(245,245,245,0.06)' },
  deny:               { color: '#f5f5f5', bg: 'rgba(245,245,245,0.10)' },
};

export function Glasswing() {
  const openP1 = SAMPLE_FINDINGS.filter(f => f.riskBand === 'P1' && f.status !== 'verified').length;
  const pendingApprovals = SAMPLE_APPROVALS.filter(a => a.status === 'pending').length;
  const chainDepth = SAMPLE_AUDIT.length;

  return (
    <Layout>
      <PageHeader
        label="DOCTRINE · GLASSWING COMMAND"
        title="A11oy × TENAX — Glasswing"
        subtitle={GLASSWING_TAGLINE}
        status="LIVE"
      />

      {/* Persistent defensive-use banner */}
      <div
        className="mb-5 px-3 py-2 rounded border flex items-center gap-2 text-xs"
        style={{
          borderColor: 'rgba(245,245,245,0.20)',
          backgroundColor: 'rgba(245,245,245,0.03)',
          color: SUB,
        }}
        role="note"
        aria-label="Defensive use boundary"
      >
        <span className="font-mono px-1.5 py-0.5 rounded" style={{ color: '#f5f5f5', backgroundColor: 'rgba(245,245,245,0.10)' }}>
          DEFENSIVE-ONLY
        </span>
        <span>
          Owned and authorized code only · No exploit, payload, or offensive generation · Cerberus enforces hard boundaries at the action layer.
        </span>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <KpiCard label="Risk Posture" value={RL_STATE_NOW.riskPosture} sub={`commit ${RL_STATE_NOW.commitSha.slice(0,7)}`} accent={GOLD} trend="down" />
        <KpiCard label="Open P1" value={openP1} sub="critical, awaiting approval" accent="#f5f5f5" />
        <KpiCard label="Approval Queue" value={pendingApprovals} sub="TENAX-gated" accent={GOLD} />
        <KpiCard label="RL Avg Reward" value={`+${RL_STATE_NOW.historicalContext.avgReward.toFixed(1)}`} sub={`${RL_STATE_NOW.historicalContext.episodesCompleted} episodes`} accent={GOLD} trend="up" />
        <KpiCard label="Audit Chain" value={chainDepth} sub="hash-linked, immutable" accent={GOLD} />
      </div>

      {/* RISK-AS-REWARD THESIS */}
      <Card className="mb-6" style={{ borderColor: 'rgba(201,183,135,0.30)' }}>
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
          <div>
            <div className="text-xs font-mono mb-1" style={{ color: GOLD }}>POSITIONING THESIS</div>
            <h2 className="text-xl font-display font-semibold" style={{ color: TEXT }}>
              {GLASSWING_THESIS.headline}
            </h2>
            <p className="text-sm mt-1" style={{ color: SUB }}>{GLASSWING_THESIS.oneLine}</p>
          </div>
          <span className="font-mono text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.12)', color: GOLD }}>
            v{GLASSWING_VERSION}
          </span>
        </div>
        <p className="text-xs mb-3" style={{ color: SUB, lineHeight: 1.7 }}>{GLASSWING_THESIS.body}</p>
        <div className="text-xs font-mono mb-2" style={{ color: GOLD }}>WHAT THIS INTEGRATES</div>
        <ul className="text-xs flex flex-col gap-1.5">
          {GLASSWING_THESIS.differentiators.map((w, i) => (
            <li key={i} className="flex gap-2" style={{ color: SUB }}>
              <span style={{ color: GOLD, fontFamily: 'var(--font-mono)' }}>{String(i + 1).padStart(2, '0')}</span>
              <span>{w}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* FIELD MAP */}
      <SectionTitle>Field Map · how comparable systems differ</SectionTitle>
      <Card className="mb-6 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left" style={{ color: GHOST }}>
              <th className="font-mono uppercase pb-2 pr-3">System</th>
              <th className="font-mono uppercase pb-2 pr-3">Capability</th>
              <th className="font-mono uppercase pb-2 pr-3">Closes Loop</th>
              <th className="font-mono uppercase pb-2 pr-3">Governance</th>
              <th className="font-mono uppercase pb-2 pr-3">Learning</th>
              <th className="font-mono uppercase pb-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {GLASSWING_FIELD_MAP.map((row) => {
              const us = row.name.startsWith('A11oy');
              return (
                <tr key={row.name} className="border-t" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                  <td className="py-2 pr-3 font-medium" style={{ color: us ? GOLD : TEXT }}>
                    {us && <span className="font-mono mr-1.5" style={{ color: GOLD }}>★</span>}
                    {row.name}
                  </td>
                  <td className="py-2 pr-3" style={{ color: SUB }}>{row.capability}</td>
                  <td className="py-2 pr-3">
                    <VerdictBadge verdict={row.closesLoop ? 'pass' : 'fail'} />
                  </td>
                  <td className="py-2 pr-3" style={{ color: SUB }}>{row.governance}</td>
                  <td className="py-2 pr-3" style={{ color: SUB }}>{row.learning}</td>
                  <td className="py-2" style={{ color: GHOST }}>{row.note}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* 10-AGENT CONSTELLATION */}
      <SectionTitle>The Ten · agent constellation</SectionTitle>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
        {GLASSWING_AGENTS.map((a) => {
          const stateStyle = AGENT_STATE_STYLE[a.state];
          return (
            <Card key={a.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="font-display text-sm font-semibold" style={{ color: TEXT }}>{a.codename}</div>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ color: stateStyle.color, backgroundColor: 'rgba(201,183,135,0.06)' }}>
                  {stateStyle.label}
                </span>
              </div>
              <div className="text-xs font-mono" style={{ color: GOLD }}>{a.role}</div>
              <p className="text-xs italic" style={{ color: GHOST, lineHeight: 1.6 }}>"{a.myth}"</p>
              <p className="text-xs" style={{ color: SUB, lineHeight: 1.55 }}>{a.responsibility}</p>
              <div className="border-t pt-2 mt-1 flex items-center justify-between gap-2" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                <span className="text-[10px] font-mono" style={{ color: GHOST }}>
                  {a.blockOnly ? `${a.episodesContributed === 0 ? '—' : a.episodesContributed} ep · block-only` : `${a.episodesContributed} eps`}
                </span>
                <span className="text-[10px]" style={{ color: GHOST }}>{new Date(a.lastActionAt).toLocaleTimeString()}</span>
              </div>
              <p className="text-[11px]" style={{ color: SUB }}>{a.lastAction}</p>
            </Card>
          );
        })}
      </div>

      {/* TENAX CONTROL PLANE */}
      <SectionTitle>TENAX · the security control plane</SectionTitle>
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Policy Engine */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-mono" style={{ color: GOLD }}>TENAX POLICY ENGINE</div>
            <StatusBadge status="ok" label={`${SENTRA_POLICIES.length} rules`} />
          </div>
          <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto pr-1">
            {SENTRA_POLICIES.map((p) => {
              const ds = POLICY_DECISION_STYLE[p.decision];
              return (
                <div key={p.id} className="flex items-start gap-2 text-xs py-1 border-b last:border-0" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                  <span className="font-mono px-1.5 py-0.5 rounded text-[10px] flex-shrink-0" style={{ color: ds.color, backgroundColor: ds.bg }}>
                    {p.decision.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <div className="flex-1">
                    <div style={{ color: TEXT }}><span className="font-mono" style={{ color: GHOST }}>{p.scope}</span> · {p.action}</div>
                    <div style={{ color: GHOST }}>{p.rationale}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Secrets Vault */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-mono" style={{ color: GOLD }}>TENAX SECRETS VAULT</div>
            <StatusBadge status="ok" label="fingerprint-only" />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <KpiCard label="Redacted (24h)" value={SENTRA_VAULT.redactedSecrets24h} accent={GOLD} />
            <KpiCard label="Fingerprints" value={SENTRA_VAULT.fingerprintsTracked} accent={GOLD} />
            <KpiCard label="Rotations Due" value={SENTRA_VAULT.rotationsSuggested} accent="#c9b787" />
            <KpiCard label="Last Redaction" value={new Date(SENTRA_VAULT.lastRedactionAt).toLocaleTimeString()} accent={GOLD} />
          </div>
          <p className="text-xs" style={{ color: SUB, lineHeight: 1.6 }}>{SENTRA_VAULT.vaultPolicy}</p>
        </Card>

        {/* Approval Gate */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-mono" style={{ color: GOLD }}>TENAX APPROVAL GATE</div>
            <StatusBadge status={pendingApprovals > 0 ? 'warn' : 'ok'} label={`${pendingApprovals} pending`} />
          </div>
          <div className="flex flex-col gap-2">
            {SAMPLE_APPROVALS.map((a) => (
              <div key={a.id} className="border rounded p-2.5" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <HashId id={a.id} />
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ color: GOLD, backgroundColor: 'rgba(201,183,135,0.10)' }}>
                    {a.actionType.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-xs mb-1" style={{ color: TEXT }}>{a.description}</div>
                <div className="text-[11px]" style={{ color: GHOST }}>by <span style={{ color: GOLD }}>{a.requestedByAgent}</span> · {a.riskSummary}</div>
                <div className="text-[11px] mt-1" style={{ color: SUB }}>↪ rollback: {a.rollbackPlan}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Audit Ledger */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-mono" style={{ color: GOLD }}>TENAX AUDIT LEDGER</div>
            <StatusBadge status="ok" label="hash-chained" />
          </div>
          <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
            {SAMPLE_AUDIT.map((e) => {
              const ds = POLICY_DECISION_STYLE[e.policyDecision];
              return (
                <div key={e.id} className="border rounded p-2.5 text-xs" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      <HashId id={e.id} />
                      <span className="font-mono text-[10px] px-1 py-0.5 rounded" style={{ color: ds.color, backgroundColor: ds.bg }}>
                        {e.policyDecision.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="font-mono text-[10px]" style={{ color: GHOST }}>{new Date(e.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div style={{ color: TEXT }}><span style={{ color: GOLD }}>{e.agent}</span> · {e.action} → <span className="font-mono" style={{ color: GHOST }}>{e.resource}</span></div>
                  <div className="font-mono text-[10px] mt-1" style={{ color: GHOST }}>
                    in {e.inputHash.slice(0, 16)}…  out {e.outputHash.slice(0, 16)}…
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* SILVER — RL PLANNER */}
      <SectionTitle>Silver · the experience-era planner</SectionTitle>
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-1">
          <div className="text-xs font-mono mb-3" style={{ color: GOLD }}>RL STATE · current</div>
          <div className="flex flex-col gap-2">
            <InfoRow label="repo" value={RL_STATE_NOW.repoId} mono />
            <InfoRow label="commit" value={RL_STATE_NOW.commitSha.slice(0, 12)} mono />
            <InfoRow label="P1/P2/P3/P4" value={`${RL_STATE_NOW.findingsSummary.p1} / ${RL_STATE_NOW.findingsSummary.p2} / ${RL_STATE_NOW.findingsSummary.p3} / ${RL_STATE_NOW.findingsSummary.p4}`} mono />
            <InfoRow label="tests" value={`${RL_STATE_NOW.testsStatus.passing} pass · ${(RL_STATE_NOW.testsStatus.coverage * 100).toFixed(0)}% cov`} mono />
            <InfoRow label="policy" value={RL_STATE_NOW.policyStatus} mono />
            <InfoRow label="risk" value={`${RL_STATE_NOW.riskPosture} / 100`} mono />
            <div className="mt-1">
              <ProgressBar value={RL_STATE_NOW.riskPosture} color={GOLD} />
            </div>
          </div>
          <div className="border-t pt-3 mt-4" style={{ borderColor: 'var(--color-a11oy-border)' }}>
            <div className="text-xs font-mono mb-2" style={{ color: GOLD }}>HISTORICAL</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <InfoRow label="episodes" value={RL_STATE_NOW.historicalContext.episodesCompleted} mono />
              <InfoRow label="avg reward" value={`+${RL_STATE_NOW.historicalContext.avgReward.toFixed(1)}`} mono />
              <InfoRow label="FP rate" value={`${(RL_STATE_NOW.historicalContext.falsePositiveRate * 100).toFixed(1)}%`} mono />
              <InfoRow label="patch accept" value={`${(RL_STATE_NOW.historicalContext.patchAcceptanceRate * 100).toFixed(0)}%`} mono />
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-mono" style={{ color: GOLD }}>REWARD TABLE · calibrated risk delta</div>
            <span className="text-[10px] font-mono" style={{ color: GHOST }}>verified post-patch by re-scan + new tests</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
            {REWARD_TABLE.map((r) => (
              <div key={r.outcome} className="flex items-start gap-3 text-xs py-1 border-b last:border-0" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                <span
                  className="font-mono font-semibold flex-shrink-0 w-10 text-right"
                  style={{ color: r.value > 0 ? GOLD : '#f5f5f5' }}
                >
                  {r.value > 0 ? '+' : ''}{r.value}
                </span>
                <div className="flex-1">
                  <div className="font-mono text-[10px]" style={{ color: GHOST }}>{r.outcome.replace(/_/g, ' ')}</div>
                  <div style={{ color: SUB }}>{r.description}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 mt-3" style={{ borderColor: 'var(--color-a11oy-border)' }}>
            <CodeBlock language="state-machine">
{`STATE  →  ACTION  →  POLICY GATE  →  EXECUTE  →  VERIFY  →  REWARD  →  REPLAY
  ↓         ↓           ↓               ↓          ↓         ↓         ↓
findings  scan      TENAX            scanner    re-scan   delta    buffer
patches   patch     PolicyEngine      run-ledger new tests  vs       value-fn
posture   verify    ApprovalGate      approval   diff       baseline  update
                    Cerberus(deny)    (or block)`}
            </CodeBlock>
          </div>
        </Card>
      </div>

      {/* PATCH COMMAND CENTER */}
      <SectionTitle>Patch Command Center · awaiting approval</SectionTitle>
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {SAMPLE_PATCHES.map((p) => {
          const delta = p.riskBefore - p.riskAfterEstimate;
          return (
            <Card key={p.id}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <HashId id={p.id} />
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ color: GOLD, backgroundColor: 'rgba(201,183,135,0.10)' }}>
                  {p.status.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: TEXT }}>{p.title}</h3>
              <p className="text-xs mb-2" style={{ color: SUB }}>{p.summary}</p>

              <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
                <div>
                  <div className="font-mono text-[10px]" style={{ color: GHOST }}>RISK BEFORE</div>
                  <div className="font-display font-semibold" style={{ color: '#f5f5f5' }}>{p.riskBefore}</div>
                </div>
                <div>
                  <div className="font-mono text-[10px]" style={{ color: GHOST }}>RISK AFTER</div>
                  <div className="font-display font-semibold" style={{ color: GOLD }}>{p.riskAfterEstimate}</div>
                </div>
                <div>
                  <div className="font-mono text-[10px]" style={{ color: GHOST }}>Δ DELTA</div>
                  <div className="font-display font-semibold" style={{ color: GOLD }}>−{delta}</div>
                </div>
              </div>

              <CodeBlock language="diff">{p.diffPreview}</CodeBlock>

              <div className="mt-2 text-[11px]" style={{ color: SUB }}>
                <div><span style={{ color: GHOST }}>files:</span> {p.filesChanged.join(', ')}</div>
                <div className="mt-0.5"><span style={{ color: GHOST }}>tests:</span> {p.testsAdded.join(' · ')}</div>
                <div className="mt-0.5"><span style={{ color: GHOST }}>rollback:</span> {p.rollbackPlan}</div>
                <div className="mt-0.5"><span style={{ color: GHOST }}>approval:</span> <HashId id={p.approvalId ?? '—'} /></div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ENGINEERING LOOP */}
      <SectionTitle>Engineering Loop · understand → learn</SectionTitle>
      <Card className="mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {ENGINEERING_LOOP_STAGES.map((s, i) => (
            <div key={s.stage} className="flex flex-col gap-1 p-3 rounded border" style={{ borderColor: 'var(--color-a11oy-border)' }}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px]" style={{ color: GHOST }}>{String(i + 1).padStart(2, '0')}</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ color: GOLD, backgroundColor: 'rgba(201,183,135,0.08)' }}>
                  {s.agent}
                </span>
              </div>
              <div className="text-sm font-display font-semibold" style={{ color: TEXT }}>{s.stage}</div>
              <p className="text-[11px]" style={{ color: SUB, lineHeight: 1.55 }}>{s.detail}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* FINDINGS */}
      <SectionTitle>Live Findings · top of P1–P4 backlog</SectionTitle>
      <Card className="mb-6 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left" style={{ color: GHOST }}>
              <th className="font-mono uppercase pb-2 pr-3">ID</th>
              <th className="font-mono uppercase pb-2 pr-3">Severity</th>
              <th className="font-mono uppercase pb-2 pr-3">Band</th>
              <th className="font-mono uppercase pb-2 pr-3">Title</th>
              <th className="font-mono uppercase pb-2 pr-3">CWE</th>
              <th className="font-mono uppercase pb-2 pr-3">Risk</th>
              <th className="font-mono uppercase pb-2 pr-3">Source</th>
              <th className="font-mono uppercase pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_FINDINGS.map((f) => (
              <tr key={f.id} className="border-t" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                <td className="py-2 pr-3"><HashId id={f.id} /></td>
                <td className="py-2 pr-3"><SeverityBadge severity={f.severity} /></td>
                <td className="py-2 pr-3 font-mono" style={{ color: f.riskBand === 'P1' ? '#f5f5f5' : GOLD }}>{f.riskBand}</td>
                <td className="py-2 pr-3" style={{ color: TEXT }}>{f.title}</td>
                <td className="py-2 pr-3 font-mono" style={{ color: GHOST }}>{f.cwe ?? '—'}</td>
                <td className="py-2 pr-3 font-mono" style={{ color: GOLD }}>{f.riskScore}</td>
                <td className="py-2 pr-3 font-mono" style={{ color: GHOST }}>{f.source}</td>
                <td className="py-2 font-mono" style={{ color: SUB }}>{f.status.replace(/_/g, ' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* COMPLIANCE MAP */}
      <SectionTitle>Compliance · bidirectional mapping</SectionTitle>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {COMPLIANCE_MAP.map((c) => (
          <Card key={c.framework}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-display font-semibold" style={{ color: TEXT }}>{c.framework}</div>
              <span className="font-mono text-xs" style={{ color: GOLD }}>{(c.coverage * 100).toFixed(0)}%</span>
            </div>
            <ProgressBar value={c.coverage * 100} color={GOLD} />
            <p className="text-[11px] mt-2 font-mono" style={{ color: GHOST }}>{c.sample}</p>
          </Card>
        ))}
      </div>

      {/* HARD BOUNDARIES */}
      <Card className="mb-6" style={{ borderColor: 'rgba(245,245,245,0.18)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="text-xs font-mono" style={{ color: '#f5f5f5' }}>CERBERUS · HARD BOUNDARIES</div>
          <StatusBadge status="ok" label="enforced at action layer" />
        </div>
        <ul className="text-xs flex flex-col gap-1.5">
          {HARD_BOUNDARIES.map((b, i) => (
            <li key={i} className="flex gap-2" style={{ color: SUB }}>
              <span style={{ color: '#f5f5f5' }}>✕</span><span>{b}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* CITATIONS */}
      <SectionTitle>Provenance · the research this is anchored to</SectionTitle>
      <div className="grid md:grid-cols-2 gap-3 mb-2">
        {GLASSWING_CITATIONS.map((c) => (
          <Card key={c.label}>
            <a
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono hover:underline"
              style={{ color: GOLD }}
            >
              {c.label} ↗
            </a>
            <p className="text-[11px] mt-1.5" style={{ color: SUB, lineHeight: 1.55 }}>{c.relevance}</p>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
