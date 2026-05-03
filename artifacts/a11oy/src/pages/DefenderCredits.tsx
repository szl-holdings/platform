import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, InfoRow, ProgressBar } from '../components/ui';
import { useDefenderCreditPool, usePartners, DoctrineLoader } from '../hooks/useDoctrine';

const fmtCurrency = (n: number) => `$${n.toLocaleString('en-US')}`;
const fmtDate = (s: string) => new Date(s).toISOString().slice(0, 10);

export function DefenderCredits() {
  const { data: pool, loading: loadingPool, error: errorPool } = useDefenderCreditPool();
  const { data: partners } = usePartners();
  const partnerItems = partners ?? [];

  const partnerById = (id: string) => partnerItems.find((p: any) => p.partnerId === id);

  if (!pool) {
    return (
      <Layout>
        <DoctrineLoader loading={loadingPool} error={errorPool}>
          <div />
        </DoctrineLoader>
      </Layout>
    );
  }

  const totalCommitted = Number(pool.totalCommitted);
  const totalAllocated = Number(pool.totalAllocated);
  const totalPaid = Number(pool.totalPaid);
  const allocPct = (totalAllocated / totalCommitted) * 100;
  const paidPct = (totalPaid / totalCommitted) * 100;
  const rubric = pool.rubric as any[];
  const perPartner = pool.perPartner as any[];
  const ledger = pool.ledger as any[];

  return (
    <Layout>
      <DoctrineLoader loading={loadingPool} error={errorPool}>
      <PageHeader
        label="DOCTRINE · DEFENDER CREDIT POOL"
        title="Defender Credit Pool"
        subtitle="Funded posture for independent reporters. Allocations and payouts are public. Sample governance ledger — figures shown as published, not real billing settlement."
        status="LIVE"
      />

      <Card className="mb-4" style={{ backgroundColor: 'rgba(201,183,135,0.04)', borderColor: 'rgba(201,183,135,0.2)' }}>
        <p className="text-xs font-mono" style={{ color: '#c9b787' }}>{pool.poolNameDisclaimer}</p>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="COMMITTED" value={fmtCurrency(totalCommitted)} accent="#c9b787" />
        <KpiCard label="ALLOCATED" value={fmtCurrency(totalAllocated)} sub={`${allocPct.toFixed(0)}% of pool`} accent="#c9b787" />
        <KpiCard label="PAID" value={fmtCurrency(totalPaid)} sub={`${paidPct.toFixed(0)}% of pool`} accent="#c9b787" />
        <KpiCard label="REMAINING" value={fmtCurrency(totalCommitted - totalAllocated)} accent="#c9b787" />
      </div>

      <Card className="mb-4">
        <SectionTitle>Pool utilization</SectionTitle>
        <div className="flex flex-col gap-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span style={{ color: 'var(--color-a11oy-text-sub)' }}>Allocated</span>
              <span className="font-mono" style={{ color: '#c9b787' }}>{fmtCurrency(totalAllocated)} / {fmtCurrency(totalCommitted)}</span>
            </div>
            <ProgressBar value={totalAllocated} max={totalCommitted} />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span style={{ color: 'var(--color-a11oy-text-sub)' }}>Paid</span>
              <span className="font-mono" style={{ color: '#c9b787' }}>{fmtCurrency(totalPaid)} / {fmtCurrency(totalCommitted)}</span>
            </div>
            <ProgressBar value={totalPaid} max={totalCommitted} />
          </div>
        </div>
      </Card>

      <Card className="mb-4">
        <SectionTitle>Allocation rubric</SectionTitle>
        {rubric?.map((r: any, i: number) => (
          <InfoRow key={i} label={r.factor} value={
            <span className="flex items-center gap-2">
              <span className="font-mono" style={{ color: '#c9b787' }}>weight {(r.weight * 100).toFixed(0)}%</span>
              <span style={{ color: 'var(--color-a11oy-text-sub)' }}>· {r.description}</span>
            </span>
          } />
        ))}
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <SectionTitle>Per-partner allocation</SectionTitle>
          {perPartner?.map((p: any) => {
            const partner = partnerById(p.partnerId);
            return (
              <InfoRow
                key={p.partnerId}
                label={partner?.name ?? p.partnerId}
                value={
                  <span className="flex items-center gap-3">
                    <span className="font-mono" style={{ color: 'var(--color-a11oy-text)' }}>{fmtCurrency(p.allocated)}</span>
                    <span className="font-mono" style={{ color: '#c9b787' }}>paid {fmtCurrency(p.paid)}</span>
                  </span>
                }
              />
            );
          })}
        </Card>

        <Card>
          <SectionTitle>Ledger</SectionTitle>
          {ledger?.map((e: any, i: number) => {
            const partner = partnerById(e.partnerId);
            return (
              <InfoRow
                key={i}
                label={fmtDate(e.at)}
                value={
                  <span className="flex flex-col">
                    <span className="flex items-center gap-2">
                      <span className="font-mono" style={{ color: '#c9b787' }}>{fmtCurrency(e.amount)}</span>
                      <span className="font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{e.advisoryId}</span>
                      <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>· {partner?.name ?? e.partnerId}</span>
                    </span>
                    <span className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{e.note}</span>
                  </span>
                }
              />
            );
          })}
        </Card>
      </div>
      </DoctrineLoader>
    </Layout>
  );
}
