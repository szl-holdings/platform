import { useStandardQuery } from '@szl-holdings/api-client-react';
import { EcosystemNav } from '@szl-holdings/shared-ui/ecosystem-nav';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Clapperboard,
  Clock,
  FlaskConical,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'wouter';
import { ACCENT, apiUrl, fetchJson } from './shared';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const BG = 'var(--gi-bg-base)';
const CARD = 'rgba(255,255,255,0.03)';
const BORDER = 'rgba(255,255,255,0.07)';
const FG = 'var(--gi-text-primary)';
const FG_MUT = 'var(--gi-text-muted)';

interface ApiEvalRun {
  runId: string;
  suiteId: string;
  suiteName: string;
  domain: string;
  passRate: number;
  totalCases: number;
  passed: number;
  startedAt?: string;
  regressionSeverity?: string;
}

interface ApiEvalSummary {
  recentRuns?: ApiEvalRun[];
}

interface ApiApproval {
  id: string;
  title?: string;
  domain?: string;
  requestedAt?: string;
  riskLevel?: string;
  status?: string;
}

interface ApiTrace {
  traceId: string;
  agent?: string;
  domain?: string;
  status?: string;
  startedAt?: string;
  errors?: unknown[];
}

const DEMO_RECENT_RUNS: ApiEvalRun[] = [
  {
    runId: 'run-eval-841',
    suiteId: 'aegis-threat-classify',
    suiteName: 'PARAGON Threat Classification',
    domain: 'aegis',
    passRate: 0.821,
    totalCases: 124,
    passed: 102,
    startedAt: '13:42',
    regressionSeverity: 'minor',
  },
  {
    runId: 'run-eval-839',
    suiteId: 'vessels-piracy-risk',
    suiteName: 'SEXTANT Piracy Risk',
    domain: 'vessels',
    passRate: 0.864,
    totalCases: 96,
    passed: 83,
    startedAt: '12:18',
    regressionSeverity: 'minor',
  },
  {
    runId: 'run-eval-836',
    suiteId: 'terra-portfolio-rollup',
    suiteName: 'DOMAINE Portfolio Rollup',
    domain: 'terra',
    passRate: 0.933,
    totalCases: 78,
    passed: 73,
    startedAt: '11:05',
    regressionSeverity: 'none',
  },
  {
    runId: 'run-eval-833',
    suiteId: 'prism-contract-review',
    suiteName: 'PRISM Contract Review',
    domain: 'prism',
    passRate: 0.964,
    totalCases: 142,
    passed: 137,
    startedAt: '10:22',
    regressionSeverity: 'none',
  },
];

const DEMO_PENDING_APPROVALS: ApiApproval[] = [
  {
    id: 'ap-101',
    title: 'Promote PARAGON threat-classify v2.4 to production',
    domain: 'aegis',
    requestedAt: '13:50',
    riskLevel: 'high',
    status: 'pending',
  },
  {
    id: 'ap-099',
    title: 'Raise Carlota CRM ops agent to TIER-2 (supervised)',
    domain: 'carlota',
    requestedAt: '12:34',
    riskLevel: 'medium',
    status: 'pending',
  },
  {
    id: 'ap-097',
    title: 'Allowlist new tool: data_export for DOMAINE',
    domain: 'terra',
    requestedAt: '11:48',
    riskLevel: 'high',
    status: 'pending',
  },
];

const DEMO_TRACES: ApiTrace[] = [
  {
    traceId: 'trc-2c4f',
    agent: 'AEGIS-Watch',
    domain: 'aegis',
    status: 'flagged',
    startedAt: '14:02',
    errors: [{}],
  },
  {
    traceId: 'trc-2c4d',
    agent: 'Maritime-AI',
    domain: 'vessels',
    status: 'flagged',
    startedAt: '13:51',
    errors: [{}],
  },
  {
    traceId: 'trc-2c4b',
    agent: 'ATLAS-Core',
    domain: 'cross-domain',
    status: 'complete',
    startedAt: '13:38',
  },
  {
    traceId: 'trc-2c49',
    agent: 'Terra-Intel',
    domain: 'terra',
    status: 'complete',
    startedAt: '13:25',
  },
];

const DOMAIN_COLOR: Record<string, string> = {
  aegis: '#ef4444',
  vessels: '#4d8fcc',
  terra: '#22c55e',
  prism: '#a855f7',
  pulse: '#f59e0b',
  carlota: '#8b7ac8',
  'cross-domain': '#94a3b8',
};

function ConsoleCard({
  title,
  href,
  icon: Icon,
  accent,
  primaryStat,
  primaryLabel,
  secondaryStat,
  secondaryLabel,
  status,
}: {
  title: string;
  href: string;
  icon: typeof Brain;
  accent: string;
  primaryStat: string;
  primaryLabel: string;
  secondaryStat: string;
  secondaryLabel: string;
  status: { kind: 'ok' | 'warn' | 'alert'; label: string };
}) {
  const statusColor =
    status.kind === 'ok' ? '#22c55e' : status.kind === 'warn' ? '#f59e0b' : '#ef4444';
  return (
    <Link
      href={`${BASE}${href}`}
      style={{
        display: 'block',
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: '18px 20px',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color 0.15s, transform 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${accent}80`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = BORDER;
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `${accent}18`,
              border: `1px solid ${accent}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon style={{ width: 16, height: 16, color: accent }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: FG }}>{title}</div>
            <div style={{ fontSize: 10, color: statusColor, fontWeight: 600, marginTop: 2 }}>
              ● {status.label}
            </div>
          </div>
        </div>
        <ArrowRight style={{ width: 14, height: 14, color: FG_MUT }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: FG, lineHeight: 1 }}>
            {primaryStat}
          </div>
          <div
            style={{
              fontSize: 9,
              color: FG_MUT,
              marginTop: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {primaryLabel}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: FG, lineHeight: 1 }}>
            {secondaryStat}
          </div>
          <div
            style={{
              fontSize: 9,
              color: FG_MUT,
              marginTop: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {secondaryLabel}
          </div>
        </div>
      </div>
    </Link>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
  footerHref,
  footerLabel,
}: {
  title: string;
  icon: typeof Brain;
  children: React.ReactNode;
  footerHref?: string;
  footerLabel?: string;
}) {
  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <Icon style={{ width: 13, height: 13, color: ACCENT }} />
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: FG_MUT,
          }}
        >
          {title}
        </span>
      </div>
      <div>{children}</div>
      {footerHref && footerLabel && (
        <Link
          href={`${BASE}${footerHref}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '10px 16px',
            borderTop: `1px solid ${BORDER}`,
            fontSize: 10,
            fontWeight: 600,
            color: ACCENT,
            textDecoration: 'none',
            background: 'rgba(139,122,200,0.04)',
          }}
        >
          {footerLabel} <ArrowRight style={{ width: 11, height: 11 }} />
        </Link>
      )}
    </div>
  );
}

function DomainPill({ domain }: { domain: string }) {
  const color = DOMAIN_COLOR[domain] ?? ACCENT;
  return (
    <span
      style={{
        fontSize: 8,
        fontFamily: 'monospace',
        padding: '1px 6px',
        borderRadius: 3,
        background: `${color}18`,
        color,
        fontWeight: 700,
        textTransform: 'uppercase',
      }}
    >
      {domain}
    </span>
  );
}

export default function CognitiveConsolesOverview() {
  const evalsQuery = useStandardQuery<{ recentRuns?: ApiEvalRun[] } | undefined>({
    queryKey: ['cognitive-overview', 'evals-summary'],
    queryFn: () =>
      fetchJson<ApiEvalSummary>(apiUrl('/cognitive/evals/summary')).catch(() => ({
        recentRuns: DEMO_RECENT_RUNS,
      })),
    staleTime: 30_000,
  });

  const approvalsQuery = useStandardQuery<{ data?: ApiApproval[] }>({
    queryKey: ['cognitive-overview', 'approvals-pending'],
    queryFn: () =>
      fetchJson<{ data?: ApiApproval[] }>(apiUrl('/approvals?status=pending&limit=10')).catch(
        () => ({ data: DEMO_PENDING_APPROVALS }),
      ),
    staleTime: 30_000,
  });

  const tracesQuery = useStandardQuery<{ data?: ApiTrace[] }>({
    queryKey: ['cognitive-overview', 'traces-recent'],
    queryFn: () =>
      fetchJson<{ data?: ApiTrace[] }>(apiUrl('/cognitive/traces?limit=10')).catch(() => ({
        data: DEMO_TRACES,
      })),
    staleTime: 30_000,
  });

  const recentRuns = evalsQuery.data?.recentRuns ?? DEMO_RECENT_RUNS;
  const pendingApprovals = approvalsQuery.data?.data ?? DEMO_PENDING_APPROVALS;
  const recentTraces = tracesQuery.data?.data ?? DEMO_TRACES;

  const regressions = recentRuns.filter(
    (r) => r.regressionSeverity && r.regressionSeverity !== 'none',
  );
  const latestPassRate = recentRuns[0]?.passRate ?? 0;
  const avgPassRate =
    recentRuns.length > 0 ? recentRuns.reduce((s, r) => s + r.passRate, 0) / recentRuns.length : 0;
  const flaggedTraces = recentTraces.filter(
    (t) => t.status === 'flagged' || (t.errors && t.errors.length > 0),
  );

  const evalStatus =
    regressions.length === 0
      ? { kind: 'ok' as const, label: 'No regressions' }
      : regressions.length <= 2
        ? {
            kind: 'warn' as const,
            label: `${regressions.length} regression${regressions.length > 1 ? 's' : ''}`,
          }
        : { kind: 'alert' as const, label: `${regressions.length} regressions` };

  const policyStatus =
    pendingApprovals.length === 0
      ? { kind: 'ok' as const, label: 'No pending approvals' }
      : pendingApprovals.length <= 3
        ? { kind: 'warn' as const, label: `${pendingApprovals.length} awaiting review` }
        : { kind: 'alert' as const, label: `${pendingApprovals.length} awaiting review` };

  const traceStatus =
    flaggedTraces.length === 0
      ? { kind: 'ok' as const, label: 'No open flags' }
      : flaggedTraces.length <= 2
        ? { kind: 'warn' as const, label: `${flaggedTraces.length} flagged` }
        : { kind: 'alert' as const, label: `${flaggedTraces.length} flagged` };

  return (
    <div
      style={{ background: BG, minHeight: '100vh', color: FG, fontFamily: 'system-ui, sans-serif' }}
    >
      <EcosystemNav currentAppId="command" currentAppName="Unified Command" accentColor={ACCENT} />

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <Brain style={{ width: 18, height: 18, color: ACCENT }} />
            <span style={{ fontSize: 22, fontWeight: 700, color: FG }}>Cognitive Consoles</span>
            <span
              style={{
                fontSize: 11,
                color: ACCENT,
                background: `${ACCENT}18`,
                padding: '2px 10px',
                borderRadius: 20,
                border: `1px solid ${ACCENT}40`,
                fontWeight: 600,
              }}
            >
              OVERVIEW
            </span>
          </div>
          <p style={{ color: FG_MUT, fontSize: 13, margin: 0 }}>
            Combined health across Trace Replay, Eval Console, and Policy Console — one place to see
            regressions, pending approvals, and flagged runs.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 14,
            marginBottom: 24,
          }}
        >
          <ConsoleCard
            title="Trace Replay"
            href="/cognitive/traces"
            icon={Clapperboard}
            accent="#8b7ac8"
            primaryStat={String(recentTraces.length)}
            primaryLabel="Recent traces"
            secondaryStat={String(flaggedTraces.length)}
            secondaryLabel="Open flags"
            status={traceStatus}
          />
          <ConsoleCard
            title="Eval Console"
            href="/cognitive/evals"
            icon={FlaskConical}
            accent="#4d8fcc"
            primaryStat={`${(latestPassRate * 100).toFixed(1)}%`}
            primaryLabel="Latest pass rate"
            secondaryStat={String(regressions.length)}
            secondaryLabel="Active regressions"
            status={evalStatus}
          />
          <ConsoleCard
            title="Policy Console"
            href="/cognitive/policies"
            icon={ShieldCheck}
            accent="#22c55e"
            primaryStat={String(pendingApprovals.length)}
            primaryLabel="Pending approvals"
            secondaryStat={`${(avgPassRate * 100).toFixed(0)}%`}
            secondaryLabel="Avg pass rate"
            status={policyStatus}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <SectionCard
            title="Active Regressions"
            icon={regressions.length > 0 ? TrendingDown : TrendingUp}
            footerHref="/cognitive/evals"
            footerLabel="Open Eval Console"
          >
            {regressions.length === 0 ? (
              <div
                style={{
                  padding: '20px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#22c55e',
                  fontSize: 11,
                }}
              >
                <CheckCircle2 style={{ width: 13, height: 13 }} /> All recent suites passing
                baselines
              </div>
            ) : (
              regressions.slice(0, 5).map((r, i) => (
                <div
                  key={r.runId}
                  style={{
                    padding: '10px 16px',
                    borderBottom:
                      i < Math.min(regressions.length, 5) - 1 ? `1px solid ${BORDER}` : undefined,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <AlertTriangle
                      style={{
                        width: 11,
                        height: 11,
                        color:
                          r.regressionSeverity === 'critical' || r.regressionSeverity === 'major'
                            ? '#ef4444'
                            : '#f59e0b',
                      }}
                    />
                    <span style={{ fontSize: 11, fontWeight: 600, color: FG, flex: 1 }}>
                      {r.suiteName}
                    </span>
                    <DomainPill domain={r.domain} />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 12,
                      fontSize: 9,
                      color: FG_MUT,
                      fontFamily: 'monospace',
                    }}
                  >
                    <span>Pass {(r.passRate * 100).toFixed(1)}%</span>
                    <span>
                      {r.passed}/{r.totalCases}
                    </span>
                    {r.startedAt && (
                      <span>
                        <Clock style={{ width: 8, height: 8, display: 'inline', marginRight: 2 }} />
                        {r.startedAt}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </SectionCard>

          <SectionCard
            title="Pending Policy Approvals"
            icon={ShieldCheck}
            footerHref="/cognitive/policies"
            footerLabel="Open Policy Console"
          >
            {pendingApprovals.length === 0 ? (
              <div
                style={{
                  padding: '20px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#22c55e',
                  fontSize: 11,
                }}
              >
                <CheckCircle2 style={{ width: 13, height: 13 }} /> No pending approvals
              </div>
            ) : (
              pendingApprovals.slice(0, 5).map((a, i) => (
                <div
                  key={a.id}
                  style={{
                    padding: '10px 16px',
                    borderBottom:
                      i < Math.min(pendingApprovals.length, 5) - 1
                        ? `1px solid ${BORDER}`
                        : undefined,
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}
                  >
                    <span
                      style={{ fontSize: 11, fontWeight: 600, color: FG, flex: 1, lineHeight: 1.4 }}
                    >
                      {a.title ?? a.id}
                    </span>
                    {a.domain && <DomainPill domain={a.domain} />}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      fontSize: 9,
                      color: FG_MUT,
                      fontFamily: 'monospace',
                      alignItems: 'center',
                    }}
                  >
                    {a.riskLevel && (
                      <span
                        style={{
                          padding: '1px 5px',
                          borderRadius: 3,
                          background: a.riskLevel === 'high' ? '#ef444418' : '#f59e0b18',
                          color: a.riskLevel === 'high' ? '#ef4444' : '#f59e0b',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {a.riskLevel}
                      </span>
                    )}
                    {a.requestedAt && (
                      <span>
                        <Clock style={{ width: 8, height: 8, display: 'inline', marginRight: 2 }} />
                        {a.requestedAt}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </SectionCard>

          <SectionCard
            title="Latest Traces"
            icon={Activity}
            footerHref="/cognitive/traces"
            footerLabel="Open Trace Replay"
          >
            {recentTraces.length === 0 ? (
              <div style={{ padding: '20px 16px', color: FG_MUT, fontSize: 11 }}>
                No recent traces
              </div>
            ) : (
              recentTraces.slice(0, 5).map((t, i) => {
                const isFlagged = t.status === 'flagged' || (t.errors && t.errors.length > 0);
                return (
                  <div
                    key={t.traceId}
                    style={{
                      padding: '10px 16px',
                      borderBottom:
                        i < Math.min(recentTraces.length, 5) - 1
                          ? `1px solid ${BORDER}`
                          : undefined,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: isFlagged ? '#f59e0b' : '#22c55e',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 11, fontWeight: 600, color: FG, flex: 1 }}>
                        {t.agent ?? t.traceId}
                      </span>
                      {t.domain && <DomainPill domain={t.domain} />}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        fontSize: 9,
                        color: FG_MUT,
                        fontFamily: 'monospace',
                      }}
                    >
                      <span>{t.traceId}</span>
                      {isFlagged && (
                        <span style={{ color: '#f59e0b', fontWeight: 700 }}>FLAGGED</span>
                      )}
                      {t.startedAt && (
                        <span>
                          <Clock
                            style={{ width: 8, height: 8, display: 'inline', marginRight: 2 }}
                          />
                          {t.startedAt}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
