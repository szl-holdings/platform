import {
  ArrowUpRight,
  Award,
  BookOpen,
  Lightbulb,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { CARLOTA_JO_RETENTION, metricDisplay } from '@/lib/claims';

const ACCENT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

const advisoryMetrics = [
  {
    label: 'Active Engagements',
    value: '12',
    change: '+3 this quarter',
    icon: Users,
    accent: '#3b82f6',
  },
  {
    label: 'Client Retention',
    value: metricDisplay(CARLOTA_JO_RETENTION),
    change: 'Industry leading',
    icon: Star,
    accent: '#10b981',
  },
  {
    label: 'Avg Engagement Score',
    value: '9.4/10',
    change: '+0.3 vs last quarter',
    icon: Award,
    accent: '#f59e0b',
  },
  {
    label: 'Revenue Growth',
    value: '+34%',
    change: 'Year over year',
    icon: TrendingUp,
    accent: '#8b5cf6',
  },
];

const caseStudies = [
  {
    client: 'Fortune 500 Tech Co.',
    challenge: 'Digital transformation of legacy CRM system',
    outcome: '40% increase in customer retention, $2.3M annual savings',
    duration: '6 months',
    methodology: 'Agile transformation with phased rollout',
    score: 9.8,
  },
  {
    client: 'Healthcare Network',
    challenge: 'Leadership alignment across 12 hospital locations',
    outcome: 'Unified executive vision, 28% improvement in operational efficiency',
    duration: '4 months',
    methodology: 'Stakeholder mapping and facilitated alignment workshops',
    score: 9.5,
  },
  {
    client: 'FinTech Startup',
    challenge: 'Scaling team from 15 to 120 while maintaining culture',
    outcome: '3x growth achieved with 92% employee satisfaction maintained',
    duration: '12 months',
    methodology: 'Organizational design with embedded coaching',
    score: 9.7,
  },
  {
    client: 'Manufacturing Corp',
    challenge: 'C-suite succession planning and leadership development',
    outcome: 'Seamless CEO transition, zero leadership attrition during transition',
    duration: '8 months',
    methodology: 'Executive assessment, development plans, and shadowing program',
    score: 9.2,
  },
];

const insightCategories = [
  {
    name: 'Leadership Intelligence',
    insights: 24,
    trending: 'Emotional intelligence in remote-first organizations',
    accent: '#3b82f6',
  },
  {
    name: 'Strategic Advisory',
    insights: 18,
    trending: 'AI-augmented decision making frameworks',
    accent: '#10b981',
  },
  {
    name: 'Organizational Design',
    insights: 15,
    trending: 'Hybrid work architecture patterns',
    accent: '#f59e0b',
  },
  {
    name: 'Change Management',
    insights: 21,
    trending: 'Resistance reduction through co-creation',
    accent: '#8b5cf6',
  },
];

function ScoreBar({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color = score >= 9.5 ? '#10b981' : score >= 9.0 ? '#3b82f6' : '#f59e0b';
  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span
          style={{
            fontSize: '9px',
            color: '#6b7280',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Client satisfaction
        </span>
        <span style={{ fontSize: '11px', fontWeight: 700, color }}>{score}/10</span>
      </div>
      <div
        style={{
          height: '4px',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${color}aa, ${color})`,
            borderRadius: '2px',
            transition: 'width 0.8s ease',
          }}
        />
      </div>
    </div>
  );
}

export default function AdvisoryIntel() {
  usePageMeta({
    title: 'Strategic Advisory Intelligence | Carlota Jo Consulting',
    description:
      'Real-time advisory analytics, active engagement tracking, and strategic intelligence for Carlota Jo Consulting clients.',
    canonical: 'https://szlholdings.com/carlota-jo/advisory',
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'cases' | 'insights'>('overview');

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '5%',
            width: '45vw',
            height: '45vw',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(59,130,246,0.04) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '-5%',
            width: '35vw',
            height: '35vw',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(139,92,246,0.04) 0%, transparent 70%)',
          }}
        />
      </div>
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '3rem 1.5rem 5rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ marginBottom: '2.5rem' }}>
          <p
            style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#6b7280',
              marginBottom: '0.5rem',
            }}
          >
            Strategic Intelligence
          </p>
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              marginBottom: '0.5rem',
            }}
          >
            Advisory Intelligence
          </h1>
          <p style={{ fontSize: '13.5px', color: '#6b7280' }}>
            Data-driven consulting insights and leadership intelligence
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '4px',
            marginBottom: '2rem',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            paddingBottom: '1px',
          }}
        >
          {(['overview', 'cases', 'insights'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px 6px 0 0',
                fontSize: '12px',
                fontWeight: 600,
                background: activeTab === tab ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: activeTab === tab ? '#fff' : '#6b7280',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.18s',
                borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
              }}
            >
              {advisoryMetrics.map((m) => (
                <div
                  key={m.label}
                  style={{
                    borderRadius: '14px',
                    border: `1px solid ${m.accent}20`,
                    background: `radial-gradient(ellipse at top left, ${m.accent}08 0%, rgba(255,255,255,0.02) 60%)`,
                    padding: '1.25rem',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: `linear-gradient(90deg, ${m.accent}60, transparent)`,
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '7px',
                        background: `${m.accent}15`,
                        border: `1px solid ${m.accent}25`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <m.icon size={13} style={{ color: m.accent }} />
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: '1.875rem',
                      fontWeight: 800,
                      color: m.accent,
                      letterSpacing: '-0.04em',
                      lineHeight: 1,
                      marginBottom: '0.3rem',
                    }}
                  >
                    {m.value}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.75)',
                      marginBottom: '0.2rem',
                    }}
                  >
                    {m.label}
                  </div>
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>{m.change}</div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem',
              }}
            >
              {insightCategories.map((cat) => (
                <div
                  key={cat.name}
                  style={{
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.02)',
                    padding: '1.25rem',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: '3px',
                      background: `linear-gradient(180deg, ${cat.accent}80, transparent)`,
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.625rem',
                    }}
                  >
                    <h3
                      style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}
                    >
                      {cat.name}
                    </h3>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: cat.accent,
                        background: `${cat.accent}15`,
                        border: `1px solid ${cat.accent}25`,
                        borderRadius: '20px',
                        padding: '2px 8px',
                      }}
                    >
                      {cat.insights}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Lightbulb size={10} style={{ color: cat.accent, flexShrink: 0 }} />
                    <p style={{ fontSize: '11px', color: '#6b7280', lineHeight: 1.5 }}>
                      Trending: {cat.trending}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'cases' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {caseStudies.map((cs, i) => (
              <div
                key={cs.client}
                style={{
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.02)',
                  padding: '1.5rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: `linear-gradient(90deg, ${ACCENT_COLORS[i % 4]}50, transparent)`,
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem',
                  }}
                >
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                    {cs.client}
                  </h3>
                  <ScoreBar score={cs.score} />
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginTop: '0.75rem',
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 600,
                        color: '#6b7280',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Challenge
                    </span>
                    <p
                      style={{
                        fontSize: '12.5px',
                        color: 'rgba(255,255,255,0.7)',
                        marginTop: '0.3rem',
                        lineHeight: 1.6,
                      }}
                    >
                      {cs.challenge}
                    </p>
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 600,
                        color: '#10b981',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Outcome
                    </span>
                    <p
                      style={{
                        fontSize: '12.5px',
                        color: '#10b981',
                        marginTop: '0.3rem',
                        lineHeight: 1.6,
                      }}
                    >
                      {cs.outcome}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.875rem' }}>
                  <span style={{ fontSize: '10px', color: '#6b7280' }}>
                    Duration: <span style={{ color: 'rgba(255,255,255,0.5)' }}>{cs.duration}</span>
                  </span>
                  <span style={{ fontSize: '10px', color: '#6b7280' }}>
                    Method: <span style={{ color: 'rgba(255,255,255,0.5)' }}>{cs.methodology}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'insights' && (
          <div
            style={{
              borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <BookOpen size={14} style={{ color: '#3b82f6' }} />
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                Leadership Intelligence Feed
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {[
                {
                  title: 'The ROI of Emotional Intelligence in Executive Teams',
                  date: 'Mar 2026',
                  reads: 1240,
                  category: 'Leadership',
                  accent: '#3b82f6',
                },
                {
                  title: 'AI-Augmented Strategic Planning: A Framework',
                  date: 'Mar 2026',
                  reads: 890,
                  category: 'Strategy',
                  accent: '#8b5cf6',
                },
                {
                  title: 'Building Anti-Fragile Organizations in Uncertain Markets',
                  date: 'Feb 2026',
                  reads: 2100,
                  category: 'Organizational Design',
                  accent: '#10b981',
                },
                {
                  title: 'From Resistance to Co-Creation: Modern Change Management',
                  date: 'Feb 2026',
                  reads: 1560,
                  category: 'Change Management',
                  accent: '#f59e0b',
                },
                {
                  title: 'The Succession Planning Playbook for Mid-Market Companies',
                  date: 'Jan 2026',
                  reads: 980,
                  category: 'Leadership',
                  accent: '#3b82f6',
                },
              ].map((insight, i, arr) => (
                <div
                  key={insight.title}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.875rem 0.5rem',
                    borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    transition: 'background 0.18s',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = '';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: insight.accent,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <h3
                        style={{
                          fontSize: '12.5px',
                          fontWeight: 500,
                          color: 'rgba(255,255,255,0.8)',
                          marginBottom: '2px',
                        }}
                      >
                        {insight.title}
                      </h3>
                      <span style={{ fontSize: '10px', color: '#6b7280' }}>
                        {insight.date} ·{' '}
                        <span style={{ color: insight.accent, fontWeight: 600 }}>
                          {insight.category}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      flexShrink: 0,
                      marginLeft: '1rem',
                    }}
                  >
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>
                      {insight.reads.toLocaleString()} reads
                    </span>
                    <ArrowUpRight size={12} style={{ color: '#6b7280' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
