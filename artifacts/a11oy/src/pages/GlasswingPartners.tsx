import { useMemo, useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, StatusBadge, ActionButton, InfoRow, HashId } from '../components/ui';
import { GLASSWING_PARTNERS, type GlasswingPartner, type GlasswingPartnerStage, cavdRecordsForPartner } from '../data/hatunDoctrine';

const STAGES: GlasswingPartnerStage[] = ['apply', 'verify', 'vet', 'onboard', 'active', 'suspended', 'revoked'];

const STAGE_COLOR: Record<GlasswingPartnerStage, string> = {
  apply: '#5e5e5e', verify: '#8a8a8a', vet: '#8a8a8a',
  onboard: '#c9b787', active: '#c9b787', suspended: '#f5f5f5', revoked: '#f5f5f5',
};

const fmtDate = (s: string) => new Date(s).toISOString().slice(0, 10);
const fmtCurrency = (n: number) => `$${n.toLocaleString('en-US')}`;

export function GlasswingPartners() {
  const [stageFilter, setStageFilter] = useState<GlasswingPartnerStage | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string>(GLASSWING_PARTNERS[0].id);

  const filtered = useMemo(() => {
    if (stageFilter === 'all') return GLASSWING_PARTNERS;
    return GLASSWING_PARTNERS.filter(p => p.stage === stageFilter);
  }, [stageFilter]);

  const selected = GLASSWING_PARTNERS.find(p => p.id === selectedId) ?? filtered[0] ?? GLASSWING_PARTNERS[0];
  const totalCommitted = GLASSWING_PARTNERS.reduce((a, p) => a + p.defenderCreditAllocated, 0);
  const totalPaid = GLASSWING_PARTNERS.reduce((a, p) => a + p.defenderCreditPaid, 0);

  return (
    <Layout>
      <PageHeader
        label="DOCTRINE · GLASSWING PARTNERS"
        title="Glasswing Partner Lifecycle"
        subtitle="Four-stage Cyber Verification Program: APPLY → VERIFY → VET → ONBOARD. Active partners are dual-approval gated. Suspensions and revocations are public."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="TOTAL PARTNERS" value={GLASSWING_PARTNERS.length} accent="#c9b787" />
        <KpiCard label="ACTIVE" value={GLASSWING_PARTNERS.filter(p => p.stage === 'active').length} sub="dual-approved" accent="#c9b787" />
        <KpiCard label="DEFENDER CREDIT" value={fmtCurrency(totalCommitted)} sub={`${fmtCurrency(totalPaid)} paid`} accent="#c9b787" />
        <KpiCard label="SUSPENDED / REVOKED" value={GLASSWING_PARTNERS.filter(p => p.stage === 'suspended' || p.stage === 'revoked').length} sub="public" accent="#f5f5f5" />
      </div>

      <Card className="mb-6">
        <SectionTitle>Lifecycle stages</SectionTitle>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setStageFilter('all')}
            className="px-2 py-1 rounded text-xs font-mono"
            style={{
              backgroundColor: stageFilter === 'all' ? 'rgba(201,183,135,0.12)' : 'transparent',
              color: stageFilter === 'all' ? '#c9b787' : 'var(--color-a11oy-text-sub)',
              border: '1px solid var(--color-a11oy-border)', cursor: 'pointer',
            }}
          >
            ALL ({GLASSWING_PARTNERS.length})
          </button>
          {STAGES.map(s => {
            const count = GLASSWING_PARTNERS.filter(p => p.stage === s).length;
            return (
              <button
                key={s}
                onClick={() => setStageFilter(s)}
                className="px-2 py-1 rounded text-xs font-mono uppercase"
                style={{
                  backgroundColor: stageFilter === s ? `${STAGE_COLOR[s]}22` : 'transparent',
                  color: stageFilter === s ? STAGE_COLOR[s] : 'var(--color-a11oy-text-sub)',
                  border: `1px solid ${stageFilter === s ? STAGE_COLOR[s] : 'var(--color-a11oy-border)'}`,
                  cursor: 'pointer',
                }}
              >
                {s} ({count})
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid lg:grid-cols-[360px_1fr] gap-4">
        <div className="flex flex-col gap-2">
          {filtered.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className="text-left rounded-lg border p-3 transition-colors"
              style={{
                backgroundColor: selectedId === p.id ? 'rgba(201,183,135,0.06)' : 'var(--color-a11oy-card)',
                borderColor: selectedId === p.id ? 'rgba(201,183,135,0.3)' : 'var(--color-a11oy-border)',
                cursor: 'pointer',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{p.name}</span>
                <span className="px-1.5 py-0.5 rounded text-xs font-mono uppercase" style={{ backgroundColor: `${STAGE_COLOR[p.stage]}22`, color: STAGE_COLOR[p.stage] }}>{p.stage}</span>
              </div>
              <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{p.legalName} · applied {fmtDate(p.appliedAt)}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                Scope: {p.scope.allowlistedAgents.length} agents, {p.scope.allowlistedActions.length} actions
              </div>
            </button>
          ))}
        </div>

        <PartnerDetail partner={selected} />
      </div>
    </Layout>
  );
}

function PartnerDetail({ partner }: { partner: GlasswingPartner }) {
  const cavd = cavdRecordsForPartner(partner.id);
  const stageIdx = STAGES.indexOf(partner.stage);
  const lifecycleIdx = Math.min(stageIdx, 4);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base font-display font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{partner.name}</span>
              <span className="px-1.5 py-0.5 rounded text-xs font-mono uppercase" style={{ backgroundColor: `${STAGE_COLOR[partner.stage]}22`, color: STAGE_COLOR[partner.stage] }}>
                {partner.stage}
              </span>
            </div>
            <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{partner.legalName} · <a href={partner.homepage} className="font-mono" style={{ color: '#c9b787' }}>{partner.homepage}</a></div>
          </div>
          <div className="flex gap-2">
            {partner.stage === 'active' && <ActionButton variant="ghost" size="sm">Suspend</ActionButton>}
            {(partner.stage === 'verify' || partner.stage === 'vet') && <ActionButton variant="primary" size="sm">Advance</ActionButton>}
            {partner.stage === 'apply' && <ActionButton variant="primary" size="sm">Begin Verify</ActionButton>}
          </div>
        </div>

        <div className="text-xs font-mono mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>LIFECYCLE</div>
        <div className="flex items-center gap-1 mb-3">
          {STAGES.slice(0, 5).map((s, i) => {
            const reached = i <= lifecycleIdx && partner.stage !== 'suspended' && partner.stage !== 'revoked';
            return (
              <div key={s} className="flex items-center flex-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono flex-shrink-0"
                  style={{
                    backgroundColor: reached ? 'rgba(201,183,135,0.2)' : 'var(--color-a11oy-muted)',
                    border: `1px solid ${reached ? '#c9b787' : 'var(--color-a11oy-border)'}`,
                    color: reached ? '#c9b787' : 'var(--color-a11oy-text-ghost)',
                  }}
                >
                  {i + 1}
                </div>
                {i < 4 && <div className="flex-1 h-px mx-1" style={{ backgroundColor: i < lifecycleIdx ? '#c9b787' : 'var(--color-a11oy-border)' }} />}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-1 text-xs font-mono uppercase" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
          {STAGES.slice(0, 5).map(s => (<div key={s} className="flex-1 text-center">{s}</div>))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Verifications ({partner.verifications.length})</SectionTitle>
        <div className="flex flex-col">
          {partner.verifications.map((v, i) => (
            <InfoRow
              key={i}
              label={v.check}
              value={
                <span className="flex items-center gap-2">
                  <StatusBadge
                    status={v.outcome === 'pass' ? 'ok' : v.outcome === 'conditional' ? 'warn' : v.outcome === 'fail' ? 'error' : 'info'}
                    label={v.outcome.toUpperCase()}
                  />
                  <HashId id={v.evidenceHash} />
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>· {fmtDate(v.checkedAt)}</span>
                </span>
              }
            />
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Scope</SectionTitle>
        <InfoRow label="agents" value={<span className="font-mono">{partner.scope.allowlistedAgents.join(', ')}</span>} />
        <InfoRow label="actions" value={<span className="font-mono">{partner.scope.allowlistedActions.join(', ')}</span>} />
        <InfoRow label="denied" value={<span className="font-mono">{partner.scope.deniedActions.join(', ') || '—'}</span>} />
      </Card>

      <Card>
        <SectionTitle>Dual approval</SectionTitle>
        {partner.dualApproval.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>No approvals yet — partner has not advanced to ONBOARD.</p>
        ) : (
          partner.dualApproval.map((a, i) => (
            <InfoRow key={i} label={`approver ${i + 1}`} value={<><span className="font-mono">{a.actor}</span> · {fmtDate(a.approvedAt)}</>} />
          ))
        )}
      </Card>

      <Card>
        <SectionTitle>Defender Credit</SectionTitle>
        <InfoRow label="allocated" value={fmtCurrency(partner.defenderCreditAllocated)} />
        <InfoRow label="paid" value={fmtCurrency(partner.defenderCreditPaid)} />
        <InfoRow label="remaining" value={fmtCurrency(partner.defenderCreditAllocated - partner.defenderCreditPaid)} />
      </Card>

      {cavd.length > 0 && (
        <Card>
          <SectionTitle>CAVD records reported by this partner ({cavd.length})</SectionTitle>
          {cavd.map(r => (
            <InfoRow
              key={r.advisoryId}
              label={r.advisoryId}
              value={
                <span className="flex items-center gap-2">
                  <span style={{ color: 'var(--color-a11oy-text)' }}>{r.category}</span>
                  <StatusBadge status={r.severity === 'critical' || r.severity === 'high' ? 'error' : r.severity === 'medium' ? 'warn' : 'info'} label={r.severity.toUpperCase()} />
                  <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{r.stage}</span>
                </span>
              }
            />
          ))}
        </Card>
      )}

      <Card>
        <SectionTitle>Notes</SectionTitle>
        <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.7 }}>{partner.notes}</p>
      </Card>
    </div>
  );
}
