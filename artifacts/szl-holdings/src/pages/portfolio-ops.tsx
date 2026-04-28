import { m } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Brain,
  Building,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flag,
  Globe,
  Layers,
  Shield,
  Ship,
  Target,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteNav } from '@/components/SiteNav';

type Stage = 'Live' | 'Pilot' | 'Beta' | 'Internal' | 'Planning';

interface AppReadiness {
  name: string;
  slug: string;
  icon: typeof Shield;
  accent: string;
  stage: Stage;
  maturity: number;
  readinessScore: number;
  owner: string;
  team: string;
  blockers: string[];
  risks: string[];
  features: { shipped: number; planned: number };
  deployment: { region: string; lastRelease: string };
  confidence: 'High' | 'Medium' | 'Low';
}

const apps: AppReadiness[] = [
  {
    name: 'SZL Holdings',
    slug: 'szl-holdings',
    icon: Layers,
    accent: 'hsl(38,55%,60%)',
    stage: 'Live',
    maturity: 92,
    readinessScore: 94,
    owner: 'Stephen Lutar',
    team: 'Platform',
    blockers: [],
    risks: ['SEO indexing pending'],
    features: { shipped: 24, planned: 3 },
    deployment: { region: 'US-East', lastRelease: 'Mar 28' },
    confidence: 'High',
  },
  {
    name: 'Counsel',
    slug: 'continuum',
    icon: Zap,
    accent: 'hsl(222,68%,58%)',
    stage: 'Live',
    maturity: 88,
    readinessScore: 91,
    owner: 'Platform Engineering',
    team: 'Core',
    blockers: [],
    risks: ['Multi-agent orchestration at 60% rollout'],
    features: { shipped: 31, planned: 5 },
    deployment: { region: 'US-East', lastRelease: 'Mar 27' },
    confidence: 'High',
  },
  {
    name: 'Lyte',
    slug: 'command',
    icon: Activity,
    accent: 'hsl(192,80%,48%)',
    stage: 'Live',
    maturity: 85,
    readinessScore: 88,
    owner: 'Observability Team',
    team: 'Ops',
    blockers: [],
    risks: ['Advanced analytics export in development'],
    features: { shipped: 18, planned: 4 },
    deployment: { region: 'US-East', lastRelease: 'Mar 26' },
    confidence: 'High',
  },
  {
    name: 'Vessels',
    slug: 'vessels',
    icon: Ship,
    accent: 'hsl(210,78%,44%)',
    stage: 'Live',
    maturity: 90,
    readinessScore: 93,
    owner: 'Maritime Ops',
    team: 'Maritime',
    blockers: [],
    risks: [],
    features: { shipped: 22, planned: 2 },
    deployment: { region: 'US-East', lastRelease: 'Mar 29' },
    confidence: 'High',
  },
  {
    name: 'Aegis',
    slug: 'aegis',
    icon: Shield,
    accent: 'hsl(24,88%,52%)',
    stage: 'Live',
    maturity: 82,
    readinessScore: 86,
    owner: 'Security Engineering',
    team: 'Security',
    blockers: [],
    risks: ['Voice command interface in planning'],
    features: { shipped: 16, planned: 3 },
    deployment: { region: 'US-East', lastRelease: 'Mar 25' },
    confidence: 'High',
  },
  {
    name: 'SZL APEX',
    slug: 'inca',
    icon: Brain,
    accent: 'hsl(250,58%,58%)',
    stage: 'Live',
    maturity: 78,
    readinessScore: 82,
    owner: 'AI Research',
    team: 'Research',
    blockers: [],
    risks: ['Model registry expansion in progress'],
    features: { shipped: 14, planned: 6 },
    deployment: { region: 'US-East', lastRelease: 'Mar 24' },
    confidence: 'Medium',
  },
  {
    name: 'Terra',
    slug: 'terra',
    icon: Building,
    accent: 'hsl(140,56%,40%)',
    stage: 'Live',
    maturity: 80,
    readinessScore: 84,
    owner: 'Real Estate Ops',
    team: 'Real Estate',
    blockers: [],
    risks: ['Distress data feed latency optimization'],
    features: { shipped: 19, planned: 4 },
    deployment: { region: 'US-East', lastRelease: 'Mar 28' },
    confidence: 'High',
  },
  {
    name: 'Aegis Operations',
    slug: 'msp',
    icon: Activity,
    accent: 'hsl(356,70%,52%)',
    stage: 'Live',
    maturity: 76,
    readinessScore: 80,
    owner: 'MSP Engineering',
    team: 'MSP',
    blockers: [],
    risks: ['SLA prediction model calibration'],
    features: { shipped: 15, planned: 5 },
    deployment: { region: 'US-East', lastRelease: 'Mar 27' },
    confidence: 'Medium',
  },
  {
    name: 'Carlota Jo',
    slug: 'carlota-jo',
    icon: Globe,
    accent: 'hsl(36,52%,54%)',
    stage: 'Live',
    maturity: 86,
    readinessScore: 89,
    owner: 'Advisory Services',
    team: 'Advisory',
    blockers: [],
    risks: [],
    features: { shipped: 11, planned: 2 },
    deployment: { region: 'US-East', lastRelease: 'Mar 23' },
    confidence: 'High',
  },
  {
    name: 'SZL Leadership',
    slug: 'szl-leadership',
    icon: Users,
    accent: 'hsl(210,8%,56%)',
    stage: 'Live',
    maturity: 84,
    readinessScore: 87,
    owner: 'Stephen Lutar',
    team: 'Brand',
    blockers: [],
    risks: [],
    features: { shipped: 9, planned: 1 },
    deployment: { region: 'US-East', lastRelease: 'Mar 20' },
    confidence: 'High',
  },
];

const STAGE_CONFIG: Record<Stage, { color: string; bg: string; border: string }> = {
  Live: { color: 'hsl(152,50%,50%)', bg: 'hsla(152,50%,42%,0.1)', border: 'hsla(152,50%,42%,0.2)' },
  Pilot: {
    color: 'hsl(218,72%,62%)',
    bg: 'hsla(218,72%,52%,0.1)',
    border: 'hsla(218,72%,52%,0.2)',
  },
  Beta: { color: 'hsl(38,88%,55%)', bg: 'hsla(38,88%,50%,0.1)', border: 'hsla(38,88%,50%,0.2)' },
  Internal: {
    color: 'hsl(210,5%,54%)',
    bg: 'hsla(210,5%,50%,0.08)',
    border: 'hsla(210,5%,50%,0.15)',
  },
  Planning: {
    color: 'hsl(210,5%,42%)',
    bg: 'hsla(210,5%,40%,0.08)',
    border: 'hsla(210,5%,40%,0.12)',
  },
};

const CONFIDENCE_COLORS: Record<string, string> = {
  High: 'hsl(152,50%,42%)',
  Medium: 'hsl(38,88%,50%)',
  Low: 'hsl(0,72%,52%)',
};

function ScoreRing({ score, size = 48, accent }: { score: number; size?: number; accent: string }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="hsla(0,0%,100%,0.06)"
        strokeWidth={3}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={accent}
        strokeWidth={3}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
      <text
        x={size / 2}
        y={size / 2 + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fill="hsl(38,12%,92%)"
        fontSize="12"
        fontWeight="700"
        fontFamily="var(--font-mono)"
        style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
      >
        {score}
      </text>
    </svg>
  );
}

export default function PortfolioOpsPage() {
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  const avgReadiness = Math.round(apps.reduce((s, a) => s + a.readinessScore, 0) / apps.length);
  const avgMaturity = Math.round(apps.reduce((s, a) => s + a.maturity, 0) / apps.length);
  const totalShipped = apps.reduce((s, a) => s + a.features.shipped, 0);
  const totalPlanned = apps.reduce((s, a) => s + a.features.planned, 0);
  const liveCount = apps.filter((a) => a.stage === 'Live').length;

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(210,12%,5%)' }}>
      <SiteNav />
      <main className="pt-24">
        <section style={{ padding: '3rem 0 2rem' }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'hsl(218,72%,52%)',
                  }}
                />
                <p
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'hsl(210,5%,42%)',
                  }}
                >
                  Portfolio Command
                </p>
              </div>
              <h1
                style={{
                  fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  color: 'hsl(38,12%,94%)',
                  lineHeight: 1.1,
                  marginBottom: '0.75rem',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Portfolio Readiness
              </h1>
              <p
                style={{
                  fontSize: '0.9375rem',
                  lineHeight: 1.7,
                  color: 'hsl(210,5%,58%)',
                  maxWidth: '36rem',
                }}
              >
                Ecosystem-wide maturity assessment, deployment readiness, and operational confidence
                across all SZL platforms.
              </p>
            </m.div>
          </div>
        </section>

        <section style={{ padding: '0 0 2rem' }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Platforms Live', value: `${liveCount} / ${apps.length}`, icon: Flag },
                { label: 'Avg Readiness', value: `${avgReadiness}%`, icon: Target },
                { label: 'Avg Maturity', value: `${avgMaturity}%`, icon: BarChart3 },
                { label: 'Features Shipped', value: totalShipped, icon: CheckCircle2 },
                { label: 'In Pipeline', value: totalPlanned, icon: Clock },
              ].map((s, i) => (
                <m.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  style={{
                    padding: '1.125rem 1.25rem',
                    background: 'hsla(0,0%,100%,0.025)',
                    border: '1px solid hsla(0,0%,100%,0.06)',
                    borderRadius: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <s.icon size={13} style={{ color: 'hsl(210,5%,42%)' }} />
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'hsl(210,5%,42%)',
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      letterSpacing: '-0.025em',
                      color: 'hsl(38,12%,94%)',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {s.value}
                  </p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: '0 0 4rem' }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div className="space-y-2">
              {apps.map((app, i) => {
                const stageConf = STAGE_CONFIG[app.stage];
                const isExpanded = expandedSlug === app.slug;
                const Icon = app.icon;
                return (
                  <m.div
                    key={app.slug}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.4 }}
                  >
                    <button
                      onClick={() => setExpandedSlug(isExpanded ? null : app.slug)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem 1.25rem',
                        background: isExpanded ? 'hsla(0,0%,100%,0.04)' : 'hsla(0,0%,100%,0.025)',
                        border: `1px solid ${isExpanded ? 'hsla(0,0%,100%,0.10)' : 'hsla(0,0%,100%,0.06)'}`,
                        borderRadius: isExpanded ? '0.75rem 0.75rem 0 0' : '0.75rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: `${app.accent}15`,
                          border: `1px solid ${app.accent}25`,
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={15} style={{ color: app.accent }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{ fontSize: '13.5px', fontWeight: 600, color: 'hsl(38,12%,92%)' }}
                        >
                          {app.name}
                        </p>
                        <p style={{ fontSize: '11px', color: 'hsl(210,5%,44%)' }}>
                          {app.owner} · {app.team}
                        </p>
                      </div>
                      <div className="hidden sm:flex items-center gap-4">
                        <ScoreRing score={app.readinessScore} size={40} accent={app.accent} />
                        <div style={{ textAlign: 'right', minWidth: '64px' }}>
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: stageConf.bg,
                              border: `1px solid ${stageConf.border}`,
                              color: stageConf.color,
                            }}
                          >
                            {app.stage}
                          </span>
                        </div>
                        <div
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: CONFIDENCE_COLORS[app.confidence],
                            flexShrink: 0,
                          }}
                          title={`${app.confidence} confidence`}
                        />
                      </div>
                      <ChevronRight
                        size={14}
                        style={{
                          color: 'hsl(210,5%,32%)',
                          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                          flexShrink: 0,
                        }}
                      />
                    </button>
                    {isExpanded && (
                      <m.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.25 }}
                        style={{
                          padding: '1.25rem',
                          background: 'hsla(0,0%,100%,0.02)',
                          border: '1px solid hsla(0,0%,100%,0.06)',
                          borderTop: 'none',
                          borderRadius: '0 0 0.75rem 0.75rem',
                        }}
                      >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p
                              style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                color: 'hsl(210,5%,38%)',
                                marginBottom: '0.25rem',
                              }}
                            >
                              Readiness
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div
                                style={{
                                  flex: 1,
                                  height: '4px',
                                  borderRadius: '2px',
                                  background: 'hsla(0,0%,100%,0.06)',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    width: `${app.readinessScore}%`,
                                    height: '100%',
                                    borderRadius: '2px',
                                    background: app.accent,
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: 'hsl(38,12%,88%)',
                                  fontFamily: 'var(--font-mono)',
                                }}
                              >
                                {app.readinessScore}%
                              </span>
                            </div>
                          </div>
                          <div>
                            <p
                              style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                color: 'hsl(210,5%,38%)',
                                marginBottom: '0.25rem',
                              }}
                            >
                              Maturity
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div
                                style={{
                                  flex: 1,
                                  height: '4px',
                                  borderRadius: '2px',
                                  background: 'hsla(0,0%,100%,0.06)',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    width: `${app.maturity}%`,
                                    height: '100%',
                                    borderRadius: '2px',
                                    background: app.accent,
                                    opacity: 0.7,
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: 'hsl(38,12%,88%)',
                                  fontFamily: 'var(--font-mono)',
                                }}
                              >
                                {app.maturity}%
                              </span>
                            </div>
                          </div>
                          <div>
                            <p
                              style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                color: 'hsl(210,5%,38%)',
                                marginBottom: '0.25rem',
                              }}
                            >
                              Features
                            </p>
                            <p
                              style={{
                                fontSize: '13px',
                                fontWeight: 500,
                                color: 'hsl(38,12%,88%)',
                              }}
                            >
                              <span style={{ fontFamily: 'var(--font-mono)' }}>
                                {app.features.shipped}
                              </span>
                              <span style={{ color: 'hsl(210,5%,42%)' }}> shipped · </span>
                              <span style={{ fontFamily: 'var(--font-mono)' }}>
                                {app.features.planned}
                              </span>
                              <span style={{ color: 'hsl(210,5%,42%)' }}> planned</span>
                            </p>
                          </div>
                          <div>
                            <p
                              style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                color: 'hsl(210,5%,38%)',
                                marginBottom: '0.25rem',
                              }}
                            >
                              Deployment
                            </p>
                            <p style={{ fontSize: '12px', color: 'hsl(210,5%,54%)' }}>
                              {app.deployment.region} · {app.deployment.lastRelease}
                            </p>
                          </div>
                        </div>

                        {app.risks.length > 0 && (
                          <div style={{ marginBottom: '0.75rem' }}>
                            <p
                              style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                color: 'hsl(38,88%,50%)',
                                marginBottom: '0.375rem',
                              }}
                            >
                              Open Risks
                            </p>
                            {app.risks.map((r) => (
                              <div
                                key={r}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  marginBottom: '0.25rem',
                                }}
                              >
                                <AlertTriangle
                                  size={11}
                                  style={{ color: 'hsl(38,88%,50%)', flexShrink: 0 }}
                                />
                                <span style={{ fontSize: '12px', color: 'hsl(210,5%,54%)' }}>
                                  {r}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {app.blockers.length > 0 && (
                          <div>
                            <p
                              style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                color: 'hsl(0,72%,52%)',
                                marginBottom: '0.375rem',
                              }}
                            >
                              Blockers
                            </p>
                            {app.blockers.map((b) => (
                              <div
                                key={b}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                              >
                                <AlertCircle
                                  size={11}
                                  style={{ color: 'hsl(0,72%,52%)', flexShrink: 0 }}
                                />
                                <span style={{ fontSize: '12px', color: 'hsl(210,5%,54%)' }}>
                                  {b}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginTop: '0.75rem',
                            paddingTop: '0.75rem',
                            borderTop: '1px solid hsla(0,0%,100%,0.05)',
                          }}
                        >
                          <div
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: CONFIDENCE_COLORS[app.confidence],
                            }}
                          />
                          <span style={{ fontSize: '11px', color: 'hsl(210,5%,48%)' }}>
                            Confidence:{' '}
                            <span
                              style={{ fontWeight: 600, color: CONFIDENCE_COLORS[app.confidence] }}
                            >
                              {app.confidence}
                            </span>
                          </span>
                        </div>
                      </m.div>
                    )}
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
