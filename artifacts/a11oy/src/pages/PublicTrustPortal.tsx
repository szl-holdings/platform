// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, InfoRow, StatusBadge } from '../components/ui';
import { AGENT_LABEL, KHIPU_SPEC_VERSION } from '../data/khipuDoctrine';
import { Link } from 'wouter';
import {
  useConstitutions, useCavdRecords, useRobustnessSnapshots,
  useTransparencyReports, useDefenderCreditPool, DoctrineLoader,
} from '../hooks/useDoctrine';

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const link = (path: string) => `${BASE}${path}`;
const fmtDate = (s: string) => new Date(s).toISOString().slice(0, 10);
const fmtCurrency = (n: number) => `$${n.toLocaleString('en-US')}`;

export function PublicTrustPortal() {
  const { data: constitutions, loading: loadingC, error: errorC } = useConstitutions();
  const { data: cavd } = useCavdRecords();
  const { data: robustness } = useRobustnessSnapshots();
  const { data: reports } = useTransparencyReports();
  const { data: pool } = useDefenderCreditPool();

  const cstItems = constitutions ?? [];
  const cavdItems = cavd ?? [];
  const robustnessItems = robustness ?? [];
  const reportItems = reports ?? [];

  const disclosed = cavdItems.filter((r: any) => r.stage === 'disclosed');
  const intakeAnchored = cavdItems.filter((r: any) => r.stage !== 'disclosed' && r.stage !== 'withdrawn');
  const publicSnapshots = robustnessItems.filter((s: any) => s.visibility === 'public');

  return (
    <Layout>
      <DoctrineLoader loading={loadingC} error={errorC}>
      <PageHeader
        label="TRUST · PUBLIC PORTAL"
        title="Public Trust Portal"
        subtitle="No login. Every artifact below is permalinked. Modeled on Cloudflare Trust Hub and GitHub Trust Center."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="OPEN SPEC" value={KHIPU_SPEC_VERSION} sub="CC-BY-4.0" accent="#c9b787" />
        <KpiCard label="PILLPINTU AGENTS" value={publicSnapshots.length} sub="public scores" accent="#c9b787" />
        <KpiCard label="CAVD DISCLOSED" value={disclosed.length} sub={`${intakeAnchored.length} anchored`} accent="#c9b787" />
        <KpiCard label="DEFENDER POOL" value={pool ? fmtCurrency(Number(pool.totalCommitted)) : '—'} sub={pool ? `${fmtCurrency(Number(pool.totalPaid))} paid` : ''} accent="#c9b787" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <SectionTitle>Open Spec</SectionTitle>
          <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.7 }}>
            The Khipu Doctrine Open Spec is the format every artifact below conforms to. Version pinned to{' '}
            <span className="font-mono" style={{ color: '#c9b787' }}>{KHIPU_SPEC_VERSION}</span>.
          </p>
          <Link href={link('/khipu-spec')} className="text-xs font-mono" style={{ color: '#c9b787' }}>
            View spec ›
          </Link>
        </Card>

        <Card>
          <SectionTitle>90-Day Transparency Reports</SectionTitle>
          {reportItems.map((r: any) => (
            <InfoRow
              key={r.reportId}
              label={r.label}
              value={
                <span className="flex items-center gap-2">
                  <StatusBadge status="ok" label={r.visibility.toUpperCase()} />
                  <Link href={link('/transparency-report')} className="font-mono" style={{ color: '#c9b787' }}>view ›</Link>
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>· {fmtDate(r.publishedAt)}</span>
                </span>
              }
            />
          ))}
        </Card>
      </div>

      <Card className="mb-4">
        <SectionTitle>Per-agent disclosure (Pillpintu-Mode agents)</SectionTitle>
        {cstItems.map((c: any) => {
          const snap = publicSnapshots.find((s: any) => s.agentId === c.agentId);
          return (
            <InfoRow
              key={c.agentId}
              label={AGENT_LABEL[c.agentId]}
              value={
                <span className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono" style={{ color: 'var(--color-a11oy-text)' }}>cst v{c.version}</span>
                  <Link href={link(`/system-card/${c.agentId}`)} className="font-mono" style={{ color: '#c9b787' }}>system card</Link>
                  {snap ? (
                    <>
                      <Link href={link('/robustness-wall')} className="font-mono" style={{ color: '#c9b787' }}>robustness {snap.composite}</Link>
                      <StatusBadge status="ok" label="PUBLIC" />
                    </>
                  ) : (
                    <StatusBadge status="info" label="PARTNER" />
                  )}
                </span>
              }
            />
          );
        })}
      </Card>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <SectionTitle>CAVD ledger — disclosed</SectionTitle>
          {disclosed.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>None yet.</p>
          ) : (
            disclosed.map((r: any) => (
              <InfoRow
                key={r.advisoryId}
                label={r.advisoryId}
                value={
                  <span className="flex items-center gap-2">
                    <span style={{ color: 'var(--color-a11oy-text)' }}>{r.category}</span>
                    <StatusBadge status={r.severity === 'high' || r.severity === 'critical' ? 'error' : r.severity === 'medium' ? 'warn' : 'info'} label={r.severity.toUpperCase()} />
                    <Link href={link('/cavd')} className="font-mono" style={{ color: '#c9b787' }}>view ›</Link>
                  </span>
                }
              />
            ))
          )}
        </Card>

        <Card>
          <SectionTitle>CAVD ledger — intake-anchored (embargoed)</SectionTitle>
          {intakeAnchored.map((r: any) => (
            <InfoRow
              key={r.advisoryId}
              label={r.advisoryId}
              value={
                <span className="flex items-center gap-2">
                  <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{r.findingHash.slice(0, 14)}…</span>
                  <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{r.stage}</span>
                  <StatusBadge status="info" label={`embargo → ${fmtDate(r.embargoExpiresAt)}`} />
                </span>
              }
            />
          ))}
        </Card>
      </div>

      {pool && (
      <Card className="mb-4">
        <SectionTitle>Defender Credit Pool</SectionTitle>
        <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-ghost)', lineHeight: 1.7 }}>{pool.poolNameDisclaimer}</p>
        <InfoRow label="total committed" value={fmtCurrency(Number(pool.totalCommitted))} />
        <InfoRow label="allocated" value={fmtCurrency(Number(pool.totalAllocated))} />
        <InfoRow label="paid" value={fmtCurrency(Number(pool.totalPaid))} />
        <InfoRow label="ledger" value={<Link href={link('/defender-credits')} className="font-mono" style={{ color: '#c9b787' }}>view full ledger ›</Link>} />
      </Card>
      )}

      <Card>
        <SectionTitle>Notes</SectionTitle>
        <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.7 }}>
          Every claim on this portal maps to a published artifact under the Khipu Doctrine Open Spec. If a claim cannot be backed by an artifact,
          it is not posted here. Retractions are published next to originals; originals are never edited or deleted.
        </p>
      </Card>
      </DoctrineLoader>
    </Layout>
  );
}
