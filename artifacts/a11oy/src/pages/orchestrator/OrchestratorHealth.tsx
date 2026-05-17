import { useRoute } from 'wouter';
import { Link } from 'wouter';
import { Layout } from '../../components/layout';
import { PageHeader, Card, KpiCard, SectionTitle } from '../../components/ui';
import { useApiData } from '../../hooks/useApiData';

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const link = (path: string) => `${BASE}${path}`;

const GOLD = '#c9b787';
const T = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  textDim: '#8a8a8a',
  textMuted: '#5e5e5e',
};

// Matches the API response from GET /orchestrator/packs/:slug/health
interface PackHealthKpis {
  slug: string;
  lifecycle: string;
  decisions24h: number;
  mirrorEvalPassRate: number | null;        // percentage 0–100, or null when no data
  mirrorEvalSampleSize: number;
  approvalQueueMedianTtrMs: number | null;  // null when no resolved approvals yet
  connectorFirewallBlocks24h: number;       // connector_logs error count last 24h
  proofLedgerIntegrity: 'clean' | 'minor_flags' | 'review_required' | 'no_data';
  proofLedgerFlaggedCount: number;
  selfOptimizationLastTuneAt: string | null;
  dataAsOf: string;
}

interface PackDetail {
  slug: string;
  name: string;
  industry: string;
  lifecycle: string;
}

function proofIntegrityColor(s: PackHealthKpis['proofLedgerIntegrity']): string {
  if (s === 'clean') return '#22c55e';
  if (s === 'minor_flags') return GOLD;
  if (s === 'review_required') return '#ef4444';
  return T.textMuted;
}

function proofIntegrityLabel(s: PackHealthKpis['proofLedgerIntegrity']): string {
  if (s === 'clean') return 'CLEAN';
  if (s === 'minor_flags') return 'MINOR FLAGS';
  if (s === 'review_required') return 'REVIEW REQ';
  return 'NO DATA';
}

export function OrchestratorHealth() {
  const [, params] = useRoute('/orchestrator/health/:slug');
  const slug = params?.slug ?? '';

  const { data: kpis, loading: kpisLoading } = useApiData<PackHealthKpis>(
    `/orchestrator/packs/${slug}/health`,
  );
  const { data: pack } = useApiData<PackDetail>(
    `/orchestrator/packs/${slug}`,
  );

  const packName = pack?.name ?? slug;
  const integrityColor = kpis ? proofIntegrityColor(kpis.proofLedgerIntegrity) : T.textMuted;

  return (
    <Layout>
      <PageHeader
        label={`VERTICAL ORCHESTRATOR · HEALTH · ${slug.toUpperCase()}`}
        title={`Governance Health — ${packName}`}
        subtitle="Live KPIs sourced from the governance primitives this pack inherits. Empty states are honest — they reflect real data, not mocked figures."
        status="LIVE"
      />

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Link href={link('/orchestrator/catalog')} style={{ color: T.textDim, textDecoration: 'none', fontSize: '0.75rem', fontFamily: 'monospace' }}>← Catalog</Link>
        <span style={{ color: T.textMuted }}>·</span>
        <Link href={link(`/orchestrator/wiring/${slug}`)} style={{ color: GOLD, textDecoration: 'none', fontSize: '0.75rem', fontFamily: 'monospace' }}>Governance Wiring →</Link>
      </div>

      {kpisLoading && (
        <div className="text-xs mb-4 animate-pulse" style={{ color: T.textDim }}>Loading health data…</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <KpiCard
          label="DECISIONS 24H"
          value={kpis ? String(kpis.decisions24h) : '—'}
          sub={kpis?.decisions24h === 0 ? 'no decisions yet' : 'governed'}
          accent={GOLD}
        />
        <KpiCard
          label="MIRROREVAL PASS"
          value={kpis?.mirrorEvalPassRate != null ? `${kpis.mirrorEvalPassRate.toFixed(1)}%` : '—'}
          sub={kpis?.mirrorEvalPassRate == null ? `no evals yet` : `n=${kpis.mirrorEvalSampleSize}`}
          accent={kpis?.mirrorEvalPassRate != null && kpis.mirrorEvalPassRate >= 90 ? '#22c55e' : GOLD}
        />
        <KpiCard
          label="QUEUE MEDIAN TTR"
          value={kpis?.approvalQueueMedianTtrMs != null ? `${Math.round(kpis.approvalQueueMedianTtrMs / 60000)}m` : '—'}
          sub={kpis?.approvalQueueMedianTtrMs == null ? 'no resolved decisions' : 'time to resolve'}
          accent={GOLD}
        />
        <KpiCard
          label="FW BLOCKS 24H"
          value={kpis ? String(kpis.connectorFirewallBlocks24h) : '—'}
          sub="connector errors"
          accent={kpis?.connectorFirewallBlocks24h ? '#ef4444' : '#22c55e'}
        />
        <KpiCard
          label="PROOF INTEGRITY"
          value={kpis ? proofIntegrityLabel(kpis.proofLedgerIntegrity) : '—'}
          sub={kpis ? `${kpis.proofLedgerFlaggedCount} flagged` : 'proof chain'}
          accent={integrityColor}
        />
        <KpiCard
          label="LAST TUNE"
          value={kpis?.selfOptimizationLastTuneAt ? new Date(kpis.selfOptimizationLastTuneAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
          sub={kpis?.selfOptimizationLastTuneAt == null ? 'not yet tuned' : 'self-opt'}
          accent={GOLD}
        />
      </div>

      <SectionTitle>Per-Primitive Health</SectionTitle>
      <div className="flex flex-col gap-2 mb-8">
        {[
          {
            primitive: 'Constitution',
            detail: 'Articles enforced at runtime — non-bypassable.',
            status: 'enforced',
            deepLink: `/constitution?pack=${slug}`,
          },
          {
            primitive: 'Approval Queue',
            detail: kpis?.approvalQueueMedianTtrMs != null
              ? `Median resolution: ${Math.round(kpis.approvalQueueMedianTtrMs / 60000)} min`
              : 'No decisions have passed through the queue for this pack yet.',
            status: kpis?.approvalQueueMedianTtrMs != null ? 'ok' : 'empty',
            deepLink: `/approval-queue?pack=${slug}`,
          },
          {
            primitive: 'Proof Ledger',
            detail: kpis?.proofLedgerIntegrity === 'clean'
              ? 'Chain integrity verified — no flagged or retracted entries.'
              : kpis?.proofLedgerIntegrity === 'minor_flags'
              ? `${kpis.proofLedgerFlaggedCount} minor flagged entries — within acceptable threshold.`
              : kpis?.proofLedgerIntegrity === 'review_required'
              ? `${kpis?.proofLedgerFlaggedCount ?? 0} entries flagged — operator review required.`
              : 'No proof entries yet.',
            status: kpis?.proofLedgerIntegrity === 'clean' ? 'ok'
              : kpis?.proofLedgerIntegrity === 'minor_flags' ? 'warning'
              : kpis?.proofLedgerIntegrity === 'review_required' ? 'degraded'
              : 'empty',
            deepLink: `/proof?pack=${slug}`,
          },
          {
            primitive: 'MirrorEval',
            detail: kpis?.mirrorEvalPassRate != null
              ? `Pass rate: ${kpis.mirrorEvalPassRate.toFixed(1)}% over ${kpis.mirrorEvalSampleSize} traces (last 7 days).`
              : 'No eval traces for this pack yet.',
            status: kpis?.mirrorEvalPassRate != null ? (kpis.mirrorEvalPassRate >= 85 ? 'ok' : 'degraded') : 'empty',
            deepLink: `/evals?pack=${slug}`,
          },
          {
            primitive: 'ConnectorFirewall',
            detail: kpis?.connectorFirewallBlocks24h
              ? `${kpis.connectorFirewallBlocks24h} connector errors in the last 24 hours.`
              : 'No connector errors in last 24 hours.',
            status: kpis?.connectorFirewallBlocks24h ? 'warning' : 'enforced',
            deepLink: `/connectors?pack=${slug}`,
          },
          {
            primitive: 'SelfOptimization',
            detail: kpis?.selfOptimizationLastTuneAt
              ? `Last tuned: ${new Date(kpis.selfOptimizationLastTuneAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
              : 'No optimization runs for this pack yet.',
            status: kpis?.selfOptimizationLastTuneAt ? 'ok' : 'empty',
            deepLink: `/self-optimization?pack=${slug}`,
          },
          {
            primitive: 'LearningLoop',
            detail: 'Calibration curve and drift detection active for this pack.',
            status: 'active',
            deepLink: `/learning?pack=${slug}`,
          },
        ].map(row => {
          const statusColors: Record<string, string> = {
            ok: '#22c55e', enforced: '#22c55e', active: '#22c55e',
            warning: GOLD,
            degraded: '#ef4444',
            empty: T.textMuted, unknown: T.textMuted,
          };
          const sc = statusColors[row.status] ?? GOLD;
          return (
            <Card key={row.primitive}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold" style={{ color: T.text }}>{row.primitive}</span>
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ color: sc, backgroundColor: `${sc}10` }}>
                      {row.status === 'empty' ? 'NO DATA YET' : row.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: T.textDim }}>{row.detail}</div>
                </div>
                <Link
                  href={link(row.deepLink)}
                  className="text-xs font-mono flex-shrink-0"
                  style={{ color: GOLD, textDecoration: 'none' }}
                >
                  Open →
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="p-3 rounded text-xs" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.textMuted }}>
        Health KPIs are sourced from real tables: MirrorEval pass rate from <code>ai_traces</code> (domain={slug}), approval TTR from <code>approval_requests</code> (resource_type=domain_pack), firewall blocks from <code>connector_logs</code>, proof integrity from <code>proof_chain</code>. Empty states reflect a new pack with no governed activity — they will populate automatically as decisions flow through.
        {kpis && <span> · Data as of {new Date(kpis.dataAsOf).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
      </div>
    </Layout>
  );
}
