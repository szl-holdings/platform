import { m } from 'framer-motion';
import {
  BarChart3,
  Clock,
  Download,
  Eye,
  FileText,
  Loader2,
  Megaphone,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { DistributionOsLayout } from './admin-dashboard';

const API = import.meta.env.VITE_API_URL || '';

interface WeeklyStats {
  visitsThisWeek: number;
  leadsThisWeek: number;
  publishedArticles: number;
  xQueued: number;
  xSentTotal: number;
  xFailed: number;
  newslettersReady: number;
  automationsCompletedThisWeek: number;
  conversionRate?: number;
  topCampaign?: string;
  topPage?: string;
  contentGenerated?: number;
  leadsNeedingFollowup?: number;
}

interface Lead {
  id: number;
  stage: string;
  source: string | null;
  campaign: string | null;
  score: number;
  createdAt: string;
}

type Period = 'weekly' | 'monthly';

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div
      style={{ height: 6, background: 'hsla(0,0%,100%,0.06)', borderRadius: 3, overflow: 'hidden' }}
    >
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 3,
          transition: 'width 0.5s ease',
        }}
      />
    </div>
  );
}

function MetricRow({
  label,
  value,
  max,
  color,
  unit = '',
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  unit?: string;
}) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.375rem',
        }}
      >
        <span style={{ fontSize: '0.8125rem', color: '#8b8579' }}>{label}</span>
        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e8e4de' }}>
          {value.toLocaleString()}
          {unit}
        </span>
      </div>
      <MiniBar value={value} max={max} color={color} />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  sub,
}: {
  icon: typeof Eye;
  label: string;
  value: number | string;
  color: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        padding: '1.25rem',
        background: 'hsla(0,0%,100%,0.03)',
        border: '1px solid hsla(0,0%,100%,0.06)',
        borderRadius: '10px',
      }}
    >
      <Icon size={16} style={{ color, marginBottom: '0.625rem' }} />
      <div
        style={{
          fontSize: '1.625rem',
          fontWeight: 700,
          color: '#e8e4de',
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: '0.75rem', color: '#8b8579', marginTop: '0.25rem' }}>{label}</div>
      {sub && (
        <div style={{ fontSize: '0.6875rem', color: '#4a4540', marginTop: '0.125rem' }}>{sub}</div>
      )}
    </div>
  );
}

function SourceChart({ leads }: { leads: Lead[] }) {
  const sourceCount: Record<string, number> = {};
  leads.forEach((l) => {
    const src = l.source || 'direct';
    sourceCount[src] = (sourceCount[src] || 0) + 1;
  });
  const sorted = Object.entries(sourceCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const max = sorted[0]?.[1] || 1;
  const colors = [
    '#d4a054',
    '#4a90b8',
    '#5a9c5a',
    '#8b7ac8',
    '#c45a4a',
    '#c8953c',
    '#4a90b8',
    '#8b8579',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {sorted.map(([source, count], i) => (
        <div key={source}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}
          >
            <span style={{ fontSize: '0.8125rem', color: '#8b8579', textTransform: 'capitalize' }}>
              {source}
            </span>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#e8e4de' }}>
              {count}
            </span>
          </div>
          <MiniBar value={count} max={max} color={colors[i % colors.length]} />
        </div>
      ))}
      {sorted.length === 0 && (
        <p style={{ fontSize: '0.8125rem', color: '#4a4540' }}>
          No lead source activity recorded for this period.
        </p>
      )}
    </div>
  );
}

function StageChart({ leads }: { leads: Lead[] }) {
  const stages = [
    'new',
    'qualified',
    'warm',
    'needs-followup',
    'proposal-candidate',
    'closed-won',
    'closed-lost',
  ];
  const stageColors: Record<string, string> = {
    'new': '#4a90b8',
    qualified: '#5a9c5a',
    warm: '#d4a054',
    'needs-followup': '#c8953c',
    'proposal-candidate': '#8b7ac8',
    'closed-won': '#5a9c5a',
    'closed-lost': '#4a4540',
  };
  const stageLabels: Record<string, string> = {
    'new': 'New',
    qualified: 'Qualified',
    warm: 'Warm',
    'needs-followup': 'Needs Follow-up',
    'proposal-candidate': 'Proposal',
    'closed-won': 'Won',
    'closed-lost': 'Lost',
  };
  const counts = stages.map((s) => ({
    stage: s,
    count: leads.filter((l) => l.stage === s).length,
  }));
  const max = Math.max(...counts.map((c) => c.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      {counts
        .filter((c) => c.count > 0)
        .map(({ stage, count }) => (
          <div key={stage}>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}
            >
              <span style={{ fontSize: '0.75rem', color: stageColors[stage], fontWeight: 600 }}>
                {stageLabels[stage]}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e8e4de' }}>
                {count}
              </span>
            </div>
            <MiniBar value={count} max={max} color={stageColors[stage]} />
          </div>
        ))}
      {counts.every((c) => c.count === 0) && (
        <p style={{ fontSize: '0.8125rem', color: '#4a4540' }}>
          No pipeline stages have leads yet — add contacts to get started.
        </p>
      )}
    </div>
  );
}

function CampaignChart({ leads }: { leads: Lead[] }) {
  const campCount: Record<string, number> = {};
  leads.forEach((l) => {
    if (!l.campaign) return;
    campCount[l.campaign] = (campCount[l.campaign] || 0) + 1;
  });
  const sorted = Object.entries(campCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const max = sorted[0]?.[1] || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {sorted.map(([campaign, count]) => (
        <div key={campaign}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}
          >
            <span style={{ fontSize: '0.8125rem', color: '#8b8579' }}>{campaign}</span>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#e8e4de' }}>
              {count} leads
            </span>
          </div>
          <MiniBar value={count} max={max} color="#d4a054" />
        </div>
      ))}
      {sorted.length === 0 && (
        <p style={{ fontSize: '0.8125rem', color: '#4a4540' }}>No campaign data yet.</p>
      )}
    </div>
  );
}

function FollowUpQueue({ leads }: { leads: Lead[] }) {
  const needsFollowup = leads.filter((l) => l.stage === 'needs-followup');
  if (needsFollowup.length === 0) {
    return <p style={{ fontSize: '0.8125rem', color: '#4a4540' }}>No leads awaiting follow-up.</p>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {needsFollowup.slice(0, 5).map((l) => (
        <div
          key={l.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.625rem 0.75rem',
            background: 'hsla(30,60%,50%,0.06)',
            border: '1px solid hsla(30,60%,50%,0.15)',
            borderRadius: '6px',
          }}
        >
          <Clock size={12} style={{ color: '#c8953c' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', color: '#e8e4de', fontWeight: 600 }}>
              Lead #{l.id}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#6b6560' }}>
              {l.source || 'direct'} · Score: {l.score}
            </div>
          </div>
          <a
            href="/admin/distribution/leads"
            style={{
              fontSize: '0.6875rem',
              color: '#c8953c',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            View →
          </a>
        </div>
      ))}
      {needsFollowup.length > 5 && (
        <p style={{ fontSize: '0.75rem', color: '#4a4540', textAlign: 'center' }}>
          +{needsFollowup.length - 5} more in the lead inbox
        </p>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const [location] = useLocation();
  const [period, setPeriod] = useState<Period>('weekly');
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/api/distribution-os/analytics/dashboard?period=${period}`).then((r) =>
        r.json(),
      ),
      fetch(`${API}/api/distribution-os/leads?period=${period}`).then((r) => r.json()),
    ])
      .then(([s, l]) => {
        setStats(s);
        setLeads(Array.isArray(l) ? l : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  const s = stats || {
    visitsThisWeek: 0,
    leadsThisWeek: 0,
    publishedArticles: 0,
    xQueued: 0,
    xSentTotal: 0,
    xFailed: 0,
    newslettersReady: 0,
    automationsCompletedThisWeek: 0,
  };
  const conversionRate =
    s.visitsThisWeek > 0 ? ((s.leadsThisWeek / s.visitsThisWeek) * 100).toFixed(1) : '0.0';
  const totalLeads = leads.length;
  const avgScore =
    totalLeads > 0 ? Math.round(leads.reduce((acc, l) => acc + l.score, 0) / totalLeads) : 0;
  const closedWon = leads.filter((l) => l.stage === 'closed-won').length;
  const needsFollowup = leads.filter((l) => l.stage === 'needs-followup').length;

  function downloadReport() {
    const report = {
      period,
      generated: new Date().toISOString(),
      overview: {
        ...s,
        conversionRate: `${conversionRate}%`,
        totalLeads,
        avgScore,
        closedWon,
        needsFollowup,
      },
      leads: leads.map((l) => ({
        id: l.id,
        stage: l.stage,
        source: l.source,
        campaign: l.campaign,
        score: l.score,
        createdAt: l.createdAt,
      })),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketing-report-${period}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e8e4de' }}>Reports</h1>
            <p style={{ fontSize: '0.8125rem', color: '#6b6560', marginTop: '0.25rem' }}>
              Visits, leads, sources, campaigns, and follow-up queue
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div
              style={{
                display: 'flex',
                background: 'hsla(0,0%,100%,0.04)',
                border: '1px solid hsla(0,0%,100%,0.08)',
                borderRadius: '6px',
                overflow: 'hidden',
              }}
            >
              {(['weekly', 'monthly'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    padding: '0.375rem 0.875rem',
                    background: period === p ? 'hsla(0,0%,100%,0.08)' : 'transparent',
                    border: 'none',
                    color: period === p ? '#e8e4de' : '#6b6560',
                    fontSize: '0.75rem',
                    fontWeight: period === p ? 600 : 400,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={downloadReport}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.375rem 0.75rem',
                background: 'hsla(0,0%,100%,0.05)',
                border: '1px solid hsla(0,0%,100%,0.08)',
                borderRadius: '6px',
                color: '#6b6560',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              <Download size={12} /> Export
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <Loader2 size={24} style={{ color: '#d4a054' }} className="animate-spin" />
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '0.875rem',
                marginBottom: '2rem',
              }}
            >
              <StatCard
                icon={Eye}
                label="Page Views"
                value={s.visitsThisWeek}
                color="#4a90b8"
                sub={`${period}`}
              />
              <StatCard
                icon={Users}
                label="New Leads"
                value={s.leadsThisWeek}
                color="#5a9c5a"
                sub={`${period}`}
              />
              <StatCard
                icon={TrendingUp}
                label="Conversion Rate"
                value={`${conversionRate}%`}
                color="#d4a054"
                sub="visits → leads"
              />
              <StatCard
                icon={Users}
                label="Total Leads"
                value={totalLeads}
                color="#8b7ac8"
                sub="all time"
              />
              <StatCard
                icon={BarChart3}
                label="Avg Lead Score"
                value={avgScore}
                color="#c8953c"
                sub="all leads"
              />
              <StatCard
                icon={FileText}
                label="Content Published"
                value={s.publishedArticles}
                color="#4a90b8"
                sub="articles"
              />
              <StatCard
                icon={Megaphone}
                label="Closed Won"
                value={closedWon}
                color="#5a9c5a"
                sub="total"
              />
              <StatCard
                icon={Clock}
                label="Needs Follow-up"
                value={needsFollowup}
                color="#c45a4a"
                sub="action required"
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <div
                style={{
                  padding: '1.5rem',
                  background: 'hsla(0,0%,100%,0.02)',
                  border: '1px solid hsla(0,0%,100%,0.06)',
                  borderRadius: '10px',
                }}
              >
                <h3
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#6b6560',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '1rem',
                  }}
                >
                  Leads by Source
                </h3>
                <SourceChart leads={leads} />
              </div>
              <div
                style={{
                  padding: '1.5rem',
                  background: 'hsla(0,0%,100%,0.02)',
                  border: '1px solid hsla(0,0%,100%,0.06)',
                  borderRadius: '10px',
                }}
              >
                <h3
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#6b6560',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '1rem',
                  }}
                >
                  Pipeline Breakdown
                </h3>
                <StageChart leads={leads} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div
                style={{
                  padding: '1.5rem',
                  background: 'hsla(0,0%,100%,0.02)',
                  border: '1px solid hsla(0,0%,100%,0.06)',
                  borderRadius: '10px',
                }}
              >
                <h3
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#6b6560',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '1rem',
                  }}
                >
                  Top Campaigns
                </h3>
                <CampaignChart leads={leads} />
              </div>
              <div
                style={{
                  padding: '1.5rem',
                  background: 'hsla(0,0%,100%,0.02)',
                  border: '1px solid hsla(0,0%,100%,0.06)',
                  borderRadius: '10px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#6b6560',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    Follow-up Queue
                  </h3>
                  {needsFollowup > 0 && (
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        color: '#c45a4a',
                        background: 'hsla(0,60%,50%,0.1)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '100px',
                      }}
                    >
                      {needsFollowup}
                    </span>
                  )}
                </div>
                <FollowUpQueue leads={leads} />
              </div>
            </div>

            <div
              style={{
                marginTop: '1.5rem',
                padding: '1.25rem',
                background: 'hsla(0,0%,100%,0.02)',
                border: '1px solid hsla(0,0%,100%,0.06)',
                borderRadius: '10px',
              }}
            >
              <h3
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#6b6560',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '1rem',
                }}
              >
                Distribution Pipeline
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                }}
              >
                <MetricRow
                  label="X Posts Queued"
                  value={s.xQueued}
                  max={Math.max(s.xQueued + s.xSentTotal, 1)}
                  color="#8b7ac8"
                />
                <MetricRow
                  label="X Posts Sent (Total)"
                  value={s.xSentTotal}
                  max={Math.max(s.xSentTotal, 1)}
                  color="#5a9c5a"
                />
                <MetricRow
                  label="X Posts Failed"
                  value={s.xFailed}
                  max={Math.max(s.xFailed + s.xSentTotal, 1)}
                  color="#c45a4a"
                />
                <MetricRow
                  label="Newsletters Ready"
                  value={s.newslettersReady}
                  max={Math.max(s.newslettersReady, 1)}
                  color="#c8953c"
                />
                <MetricRow
                  label="Automations (7d)"
                  value={s.automationsCompletedThisWeek}
                  max={Math.max(s.automationsCompletedThisWeek, 1)}
                  color="#4a90b8"
                />
              </div>
            </div>
          </>
        )}
      </m.div>
    </DistributionOsLayout>
  );
}
