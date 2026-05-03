import { useMemo, useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, StatusBadge, ActionButton, InfoRow, HashId } from '../components/ui';
import type { GlasswingPartnerStage } from '../data/mythosDoctrine';
import { usePartners, useCavdRecords, DoctrineLoader } from '../hooks/useDoctrine';

const STAGES: GlasswingPartnerStage[] = ['apply', 'verify', 'vet', 'onboard', 'active', 'suspended', 'revoked'];

const STAGE_COLOR: Record<GlasswingPartnerStage, string> = {
  apply: '#5e5e5e', verify: '#8a8a8a', vet: '#8a8a8a',
  onboard: '#c9b787', active: '#c9b787', suspended: '#f5f5f5', revoked: '#f5f5f5',
};

const fmtDate = (s: string) => new Date(s).toISOString().slice(0, 10);
const fmtCurrency = (n: number) => `$${n.toLocaleString('en-US')}`;

export function GlasswingPartners() {
  const { data: partners, loading: loadingP, error: errorP } = usePartners();
  const { data: cavd } = useCavdRecords();
  const items = partners ?? [];
  const cavdItems = cavd ?? [];
  const [stageFilter, setStageFilter] = useState<GlasswingPartnerStage | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string>('');

  const filtered = useMemo(() => {
    if (stageFilter === 'all') return items;
    return items.filter((p: any) => p.stage === stageFilter);
  }, [stageFilter, items]);

  const selId = selectedId || items[0]?.partnerId || '';
  const selected = items.find((p: any) => p.partnerId === selId) ?? filtered[0] ?? items[0];
  const totalCommitted = items.reduce((a: number, p: any) => a + Number(p.defenderCreditAllocated), 0);
  const totalPaid = items.reduce((a: number, p: any) => a + Number(p.defenderCreditPaid), 0);

  const cavdForPartner = (partnerId: string) =>
    cavdItems.filter((r: any) => r.reporterPartnerId === partnerId);

  return (
    <Layout>
      <DoctrineLoader loading={loadingP} error={errorP}>
      <PageHeader
        label="DOCTRINE · GLASSWING PARTNERS"
        title="Glasswing Partner Lifecycle"
        subtitle="Four-stage Cyber Verification Program: APPLY → VERIFY → VET → ONBOARD. Active partners are dual-approval gated. Suspensions and revocations are public."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="TOTAL PARTNERS" value={items.length} accent="#c9b787" />
        <KpiCard label="ACTIVE" value={items.filter((p: any) => p.stage === 'active').length} sub="dual-approved" accent="#c9b787" />
        <KpiCard label="DEFENDER CREDIT" value={fmtCurrency(totalCommitted)} sub={`${fmtCurrency(totalPaid)} paid`} accent="#c9b787" />
        <KpiCard label="SUSPENDED / REVOKED" value={items.filter((p: any) => p.stage === 'suspended' || p.stage === 'revoked').length} sub="public" accent="#f5f5f5" />
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
            ALL ({items.length})
          </button>
          {STAGES.map(s => {
            const count = items.filter((p: any) => p.stage === s).length;
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
          {filtered.map((p: any) => (
            <button
              key={p.partnerId}
              onClick={() => setSelectedId(p.partnerId)}
              className="text-left rounded-lg border p-3 transition-colors"
              style={{
                backgroundColor: selId === p.partnerId ? 'rgba(201,183,135,0.06)' : 'var(--color-a11oy-card)',
                borderColor: selId === p.partnerId ? 'rgba(201,183,135,0.3)' : 'var(--color-a11oy-border)',
                cursor: 'pointer',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{p.name}</span>
                <span className="px-1.5 py-0.5 rounded text-xs font-mono uppercase" style={{ backgroundColor: `${STAGE_COLOR[p.stage as GlasswingPartnerStage]}22`, color: STAGE_COLOR[p.stage as GlasswingPartnerStage] }}>{p.stage}</span>
              </div>
              <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{p.legalName} · applied {fmtDate(p.appliedAt)}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                Scope: {(p.scope as any)?.allowlistedAgents?.length ?? 0} agents, {(p.scope as any)?.allowlistedActions?.length ?? 0} actions
              </div>
            </button>
          ))}
        </div>

        {selected && <PartnerDetail partner={selected} cavdForPartner={cavdForPartner} />}
      </div>
      </DoctrineLoader>
    </Layout>
  );
}

function PartnerDetail({ partner, cavdForPartner }: { partner: any; cavdForPartner: (id: string) => any[] }) {
  const cavd = cavdForPartner(partner.partnerId);
  const stageIdx = STAGES.indexOf(partner.stage);
  const lifecycleIdx = Math.min(stageIdx, 4);
  const scope = partner.scope as any;
  const verifications = partner.verifications as any[];
  const dualApproval = partner.dualApproval as any[];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base font-display font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{partner.name}</span>
              <span className="px-1.5 py-0.5 rounded text-xs font-mono uppercase" style={{ backgroundColor: `${STAGE_COLOR[partner.stage as GlasswingPartnerStage]}22`, color: STAGE_COLOR[partner.stage as GlasswingPartnerStage] }}>
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
        <SectionTitle>Verifications ({verifications?.length ?? 0})</SectionTitle>
        <div className="flex flex-col">
          {verifications?.map((v: any, i: number) => (
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
        <InfoRow label="agents" value={<span className="font-mono">{scope?.allowlistedAgents?.join(', ')}</span>} />
        <InfoRow label="actions" value={<span className="font-mono">{scope?.allowlistedActions?.join(', ')}</span>} />
        <InfoRow label="denied" value={<span className="font-mono">{scope?.deniedActions?.join(', ') || '—'}</span>} />
      </Card>

      <Card>
        <SectionTitle>Dual approval</SectionTitle>
        {!dualApproval?.length ? (
          <p className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>No approvals yet — partner has not advanced to ONBOARD.</p>
        ) : (
          dualApproval.map((a: any, i: number) => (
            <InfoRow key={i} label={`approver ${i + 1}`} value={<><span className="font-mono">{a.actor}</span> · {fmtDate(a.approvedAt)}</>} />
          ))
        )}
      </Card>

      <Card>
        <SectionTitle>Defender Credit</SectionTitle>
        <InfoRow label="allocated" value={fmtCurrency(Number(partner.defenderCreditAllocated))} />
        <InfoRow label="paid" value={fmtCurrency(Number(partner.defenderCreditPaid))} />
        <InfoRow label="remaining" value={fmtCurrency(Number(partner.defenderCreditAllocated) - Number(partner.defenderCreditPaid))} />
      </Card>

      {cavd.length > 0 && (
        <Card>
          <SectionTitle>CAVD records reported by this partner ({cavd.length})</SectionTitle>
          {cavd.map((r: any) => (
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
