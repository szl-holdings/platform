import { m } from 'framer-motion';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  Clock,
  Eye,
  Globe,
  Minus,
  RefreshCw,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { DistributionOsLayout } from './admin-dashboard';

const PLATFORMS = [
  { id: 'x', label: 'X / Twitter', color: '#1a8cd8', icon: '𝕏' },
  { id: 'linkedin', label: 'LinkedIn', color: '#0a66c2', icon: 'in' },
  { id: 'medium', label: 'Medium', color: '#e8e4de', icon: 'M' },
  { id: 'substack', label: 'Substack', color: '#f05a28', icon: 'S' },
  { id: 'reddit', label: 'Reddit', color: '#ff4500', icon: 'R' },
];

interface ContentPerformance {
  id: number;
  title: string;
  type: string;
  publishedAt: string;
  totalViews: number;
  totalEngagements: number;
  score: number;
  trend: 'up' | 'down' | 'flat';
  platforms: Record<string, { views: number; engagements: number; reach: number }>;
}

const CONTENT_PERFORMANCE: ContentPerformance[] = [
  {
    id: 1,
    title: 'Why Enterprise AI Adoption Fails (And How to Fix It)',
    type: 'flagship-essay',
    publishedAt: '2025-04-08',
    totalViews: 4_820,
    totalEngagements: 312,
    score: 94,
    trend: 'up',
    platforms: {
      x: { views: 1_840, engagements: 142, reach: 18_200 },
      linkedin: { views: 1_320, engagements: 98, reach: 8_900 },
      medium: { views: 980, engagements: 42, reach: 3_400 },
      substack: { views: 520, engagements: 28, reach: 2_100 },
      reddit: { views: 160, engagements: 2, reach: 980 },
    },
  },
  {
    id: 2,
    title: "The Operator's Checklist: 7 Things to Verify Before Any AI Initiative",
    type: 'carousel',
    publishedAt: '2025-04-05',
    totalViews: 3_140,
    totalEngagements: 208,
    score: 87,
    trend: 'up',
    platforms: {
      x: { views: 1_200, engagements: 94, reach: 12_400 },
      linkedin: { views: 1_640, engagements: 98, reach: 11_200 },
      medium: { views: 180, engagements: 12, reach: 800 },
      substack: { views: 120, engagements: 4, reach: 680 },
      reddit: { views: 0, engagements: 0, reach: 0 },
    },
  },
  {
    id: 3,
    title: 'Weekly Brief: Maritime Intelligence in the Age of AI',
    type: 'newsletter',
    publishedAt: '2025-04-01',
    totalViews: 2_450,
    totalEngagements: 148,
    score: 78,
    trend: 'flat',
    platforms: {
      x: { views: 420, engagements: 28, reach: 4_200 },
      linkedin: { views: 680, engagements: 52, reach: 4_800 },
      medium: { views: 320, engagements: 18, reach: 1_600 },
      substack: { views: 980, engagements: 48, reach: 4_200 },
      reddit: { views: 50, engagements: 2, reach: 200 },
    },
  },
  {
    id: 4,
    title: 'Contrarian Take: Enterprise Tech Consolidation Will Accelerate in H2 2025',
    type: 'x-thread',
    publishedAt: '2025-03-28',
    totalViews: 1_890,
    totalEngagements: 124,
    score: 71,
    trend: 'down',
    platforms: {
      x: { views: 1_440, engagements: 108, reach: 22_400 },
      linkedin: { views: 320, engagements: 14, reach: 2_100 },
      medium: { views: 80, engagements: 2, reach: 400 },
      substack: { views: 50, engagements: 0, reach: 280 },
      reddit: { views: 0, engagements: 0, reach: 0 },
    },
  },
];

const BEST_TIMES: Record<string, { day: string; hour: string; engagement: string }[]> = {
  x: [
    { day: 'Tuesday', hour: '9:00 AM', engagement: '+38%' },
    { day: 'Thursday', hour: '12:00 PM', engagement: '+29%' },
    { day: 'Wednesday', hour: '5:00 PM', engagement: '+22%' },
  ],
  linkedin: [
    { day: 'Tuesday', hour: '8:00 AM', engagement: '+44%' },
    { day: 'Wednesday', hour: '10:00 AM', engagement: '+36%' },
    { day: 'Thursday', hour: '12:00 PM', engagement: '+28%' },
  ],
  medium: [
    { day: 'Monday', hour: '7:00 AM', engagement: '+52%' },
    { day: 'Wednesday', hour: '9:00 AM', engagement: '+34%' },
    { day: 'Friday', hour: '8:00 AM', engagement: '+21%' },
  ],
  substack: [
    { day: 'Tuesday', hour: '7:00 AM', engagement: '+61%' },
    { day: 'Thursday', hour: '7:30 AM', engagement: '+48%' },
    { day: 'Sunday', hour: '8:00 AM', engagement: '+35%' },
  ],
  reddit: [
    { day: 'Saturday', hour: '10:00 AM', engagement: '+28%' },
    { day: 'Sunday', hour: '11:00 AM', engagement: '+22%' },
    { day: 'Wednesday', hour: '2:00 PM', engagement: '+18%' },
  ],
};

const AUDIENCE_OVERLAP: Record<string, number> = {
  'x-linkedin': 28,
  'x-substack': 18,
  'x-medium': 22,
  'linkedin-substack': 35,
  'linkedin-medium': 24,
  'substack-medium': 42,
};

function TrendBadge({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'up')
    return (
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.2rem',
          fontSize: '0.6875rem',
          color: '#5a9c5a',
        }}
      >
        <ArrowUpRight size={12} />
        Trending
      </span>
    );
  if (trend === 'down')
    return (
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.2rem',
          fontSize: '0.6875rem',
          color: '#c45a4a',
        }}
      >
        <ArrowDownRight size={12} />
        Declining
      </span>
    );
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.2rem',
        fontSize: '0.6875rem',
        color: '#4a4540',
      }}
    >
      <Minus size={12} />
      Stable
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 90 ? '#5a9c5a' : score >= 75 ? '#d4a054' : score >= 60 ? '#4a90b8' : '#c45a4a';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: `${color}15`,
        border: `2px solid ${color}40`,
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: '0.75rem', fontWeight: 800, color }}>{score}</span>
    </div>
  );
}

export default function CrossPlatformAnalyticsPage() {
  const [location] = useLocation();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [expandedContent, setExpandedContent] = useState<number | null>(null);

  const totalViews = CONTENT_PERFORMANCE.reduce((s, c) => s + c.totalViews, 0);
  const totalEngagements = CONTENT_PERFORMANCE.reduce((s, c) => s + c.totalEngagements, 0);
  const avgScore = Math.round(
    CONTENT_PERFORMANCE.reduce((s, c) => s + c.score, 0) / CONTENT_PERFORMANCE.length,
  );

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '2rem',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e8e4de' }}>
              Cross-Platform Analytics
            </h1>
            <p style={{ fontSize: '0.8125rem', color: '#6b6560', marginTop: '0.25rem' }}>
              Unified performance across all connected platforms — one essay, every channel.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: '0.375rem 0.75rem',
                  background: period === p ? 'hsla(40,60%,50%,0.12)' : 'hsla(0,0%,100%,0.04)',
                  color: period === p ? '#d4a054' : '#6b6560',
                  border: `1px solid ${period === p ? 'hsla(40,60%,50%,0.2)' : 'hsla(0,0%,100%,0.06)'}`,
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: period === p ? 700 : 400,
                  cursor: 'pointer',
                }}
              >
                {p}
              </button>
            ))}
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.375rem 0.75rem',
                background: 'hsla(0,0%,100%,0.04)',
                color: '#4a4540',
                border: '1px solid hsla(0,0%,100%,0.06)',
                borderRadius: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={12} /> Sync
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.75rem',
          }}
        >
          {[
            {
              label: 'Total Views',
              value: totalViews.toLocaleString(),
              color: '#4a90b8',
              icon: Eye,
              trend: '+18%',
            },
            {
              label: 'Engagements',
              value: totalEngagements.toLocaleString(),
              color: '#5a9c5a',
              icon: TrendingUp,
              trend: '+24%',
            },
            {
              label: 'Avg Content Score',
              value: `${avgScore}/100`,
              color: '#d4a054',
              icon: Target,
              trend: '+6pts',
            },
            {
              label: 'Active Platforms',
              value: '5',
              color: '#8b7ac8',
              icon: Globe,
              trend: '+2 new',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: '1.125rem 1.25rem',
                background: 'hsla(0,0%,100%,0.02)',
                border: '1px solid hsla(0,0%,100%,0.05)',
                borderRadius: '10px',
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
                  background: `linear-gradient(90deg, ${stat.color}60, transparent)`,
                }}
              />
              <stat.icon size={13} style={{ color: stat.color, marginBottom: '0.5rem' }} />
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: '#e8e4de',
                  letterSpacing: '-0.025em',
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#4a4540', marginTop: '0.125rem' }}>
                {stat.label}
              </div>
              <div
                style={{
                  fontSize: '0.6rem',
                  color: '#5a9c5a',
                  marginTop: '0.25rem',
                  fontWeight: 700,
                }}
              >
                {stat.trend} vs prev period
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.25rem',
            marginBottom: '1.75rem',
          }}
        >
          <div
            style={{
              background: 'hsla(0,0%,100%,0.02)',
              border: '1px solid hsla(0,0%,100%,0.06)',
              borderRadius: '10px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '0.875rem 1.25rem',
                borderBottom: '1px solid hsla(0,0%,100%,0.05)',
              }}
            >
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: '#4a4540',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Platform Performance Breakdown
              </span>
            </div>
            <div
              style={{
                padding: '1rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.875rem',
              }}
            >
              {PLATFORMS.map((platform) => {
                const totalForPlatform = CONTENT_PERFORMANCE.reduce(
                  (s, c) => s + (c.platforms[platform.id]?.views || 0),
                  0,
                );
                const totalReach = CONTENT_PERFORMANCE.reduce(
                  (s, c) => s + (c.platforms[platform.id]?.reach || 0),
                  0,
                );
                const pct = Math.round((totalForPlatform / totalViews) * 100);
                return (
                  <div
                    key={platform.id}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '6px',
                        background: `${platform.color}12`,
                        border: `1px solid ${platform.color}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{ fontSize: '0.625rem', fontWeight: 800, color: platform.color }}
                      >
                        {platform.icon}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '0.25rem',
                        }}
                      >
                        <span style={{ fontSize: '0.75rem', color: '#c8c2ba' }}>
                          {platform.label}
                        </span>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e8e4de' }}>
                            {totalForPlatform.toLocaleString()}
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: '#4a4540' }}>
                            reach: {(totalReach / 1000).toFixed(1)}K
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          height: 4,
                          background: `${platform.color}10`,
                          borderRadius: 2,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: platform.color,
                            borderRadius: 2,
                          }}
                        />
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        color: '#4a4540',
                        width: 32,
                        textAlign: 'right',
                      }}
                    >
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              background: 'hsla(0,0%,100%,0.02)',
              border: '1px solid hsla(0,0%,100%,0.06)',
              borderRadius: '10px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '0.875rem 1.25rem',
                borderBottom: '1px solid hsla(0,0%,100%,0.05)',
              }}
            >
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: '#4a4540',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Best Time to Post
              </span>
            </div>
            <div style={{ padding: '0.75rem 1rem' }}>
              <div
                style={{
                  display: 'flex',
                  gap: '0.25rem',
                  marginBottom: '0.875rem',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  onClick={() => setSelectedPlatform('all')}
                  style={{
                    padding: '0.25rem 0.625rem',
                    background: selectedPlatform === 'all' ? 'hsla(0,0%,100%,0.08)' : 'none',
                    border: `1px solid ${selectedPlatform === 'all' ? 'hsla(0,0%,100%,0.15)' : 'hsla(0,0%,100%,0.06)'}`,
                    borderRadius: '5px',
                    color: selectedPlatform === 'all' ? '#e8e4de' : '#4a4540',
                    fontSize: '0.6875rem',
                    cursor: 'pointer',
                    fontWeight: selectedPlatform === 'all' ? 700 : 400,
                  }}
                >
                  All
                </button>
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlatform(p.id)}
                    style={{
                      padding: '0.25rem 0.625rem',
                      background: selectedPlatform === p.id ? `${p.color}12` : 'none',
                      border: `1px solid ${selectedPlatform === p.id ? `${p.color}30` : 'hsla(0,0%,100%,0.06)'}`,
                      borderRadius: '5px',
                      color: selectedPlatform === p.id ? p.color : '#4a4540',
                      fontSize: '0.6875rem',
                      cursor: 'pointer',
                      fontWeight: selectedPlatform === p.id ? 700 : 400,
                    }}
                  >
                    {p.label.split(' ')[0]}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {(selectedPlatform === 'all'
                  ? BEST_TIMES.linkedin
                  : BEST_TIMES[selectedPlatform] || BEST_TIMES.x
                ).map((slot, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.625rem 0.75rem',
                      background: i === 0 ? 'hsla(38,65%,58%,0.06)' : 'hsla(0,0%,100%,0.02)',
                      border: `1px solid ${i === 0 ? 'hsla(38,65%,58%,0.15)' : 'hsla(0,0%,100%,0.04)'}`,
                      borderRadius: '6px',
                    }}
                  >
                    <Clock
                      size={13}
                      style={{ color: i === 0 ? '#d4a054' : '#4a4540', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#e8e4de' }}>
                        {slot.day}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#4a4540' }}> at {slot.hour}</span>
                    </div>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#5a9c5a' }}>
                      {slot.engagement} engagement
                    </span>
                    {i === 0 && <Zap size={12} style={{ color: '#d4a054', flexShrink: 0 }} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'hsla(0,0%,100%,0.02)',
            border: '1px solid hsla(0,0%,100%,0.06)',
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '1.75rem',
          }}
        >
          <div
            style={{
              padding: '0.875rem 1.25rem',
              borderBottom: '1px solid hsla(0,0%,100%,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: '#4a4540',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Content Performance — All Platforms
            </span>
            <span style={{ fontSize: '0.6875rem', color: '#4a4540' }}>
              Scored by cross-platform reach × engagement
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {CONTENT_PERFORMANCE.map((content, idx) => (
              <div key={content.id} style={{ borderBottom: '1px solid hsla(0,0%,100%,0.04)' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    cursor: 'pointer',
                  }}
                  onClick={() =>
                    setExpandedContent(expandedContent === content.id ? null : content.id)
                  }
                >
                  <ScoreBadge score={content.score} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#e8e4de',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {content.title}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.6875rem', color: '#4a4540' }}>
                        {content.type}
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: '#4a4540' }}>
                        {content.publishedAt}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem', flexShrink: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#e8e4de' }}>
                        {content.totalViews.toLocaleString()}
                      </div>
                      <div
                        style={{
                          fontSize: '0.5625rem',
                          color: '#4a4540',
                          textTransform: 'uppercase',
                        }}
                      >
                        Views
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#5a9c5a' }}>
                        {content.totalEngagements.toLocaleString()}
                      </div>
                      <div
                        style={{
                          fontSize: '0.5625rem',
                          color: '#4a4540',
                          textTransform: 'uppercase',
                        }}
                      >
                        Engmts
                      </div>
                    </div>
                  </div>
                  <TrendBadge trend={content.trend} />
                  <ChevronDown
                    size={14}
                    style={{
                      color: '#4a4540',
                      transform: expandedContent === content.id ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                      flexShrink: 0,
                    }}
                  />
                </div>

                {expandedContent === content.id && (
                  <m.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div
                      style={{
                        padding: '0 1.25rem 1.25rem 4.5rem',
                        borderTop: '1px solid hsla(0,0%,100%,0.04)',
                      }}
                    >
                      <div
                        style={{
                          paddingTop: '1rem',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(5, 1fr)',
                          gap: '0.625rem',
                        }}
                      >
                        {PLATFORMS.map((platform) => {
                          const pd = content.platforms[platform.id] || {
                            views: 0,
                            engagements: 0,
                            reach: 0,
                          };
                          return (
                            <div
                              key={platform.id}
                              style={{
                                padding: '0.75rem',
                                background: 'hsla(0,0%,100%,0.02)',
                                border: `1px solid ${platform.color}20`,
                                borderRadius: '8px',
                              }}
                            >
                              <div
                                style={{
                                  fontSize: '0.6875rem',
                                  fontWeight: 700,
                                  color: platform.color,
                                  marginBottom: '0.5rem',
                                }}
                              >
                                {platform.label}
                              </div>
                              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e8e4de' }}>
                                {pd.views.toLocaleString()}
                              </div>
                              <div
                                style={{
                                  fontSize: '0.5625rem',
                                  color: '#4a4540',
                                  marginBottom: '0.25rem',
                                }}
                              >
                                Views
                              </div>
                              <div
                                style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#5a9c5a' }}
                              >
                                {pd.engagements}
                              </div>
                              <div
                                style={{
                                  fontSize: '0.5625rem',
                                  color: '#4a4540',
                                  marginBottom: '0.25rem',
                                }}
                              >
                                Engagements
                              </div>
                              <div style={{ fontSize: '0.6875rem', color: '#4a4540' }}>
                                Reach: {pd.reach.toLocaleString()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </m.div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            background: 'hsla(0,0%,100%,0.02)',
            border: '1px solid hsla(0,0%,100%,0.06)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid hsla(0,0%,100%,0.05)' }}
          >
            <div
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: '#4a4540',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Audience Overlap Analysis
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#4a4540', marginTop: '0.25rem' }}>
              % of audience shared between platforms — lower = unique readers, higher = same readers
            </div>
          </div>
          <div
            style={{
              padding: '1.25rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
            }}
          >
            {Object.entries(AUDIENCE_OVERLAP).map(([pair, pct]) => {
              const [a, b] = pair.split('-');
              const pA = PLATFORMS.find((p) => p.id === a);
              const pB = PLATFORMS.find((p) => p.id === b);
              if (!pA || !pB) return null;
              const overlap = pct;
              const unique = 100 - overlap;
              return (
                <div
                  key={pair}
                  style={{
                    padding: '0.875rem',
                    background: 'hsla(0,0%,100%,0.02)',
                    border: '1px solid hsla(0,0%,100%,0.05)',
                    borderRadius: '8px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.625rem',
                    }}
                  >
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: pA.color }}>
                      {pA.label.split(' ')[0]}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: '#4a4540' }}>↔</span>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: pB.color }}>
                      {pB.label.split(' ')[0]}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: overlap > 35 ? '#c45a4a' : overlap > 25 ? '#d4a054' : '#5a9c5a',
                    }}
                  >
                    {overlap}% shared
                  </div>
                  <div
                    style={{
                      height: 4,
                      background: 'hsla(0,0%,100%,0.05)',
                      borderRadius: 2,
                      overflow: 'hidden',
                      marginTop: '0.375rem',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${overlap}%`,
                        background: overlap > 35 ? '#c45a4a' : overlap > 25 ? '#d4a054' : '#5a9c5a',
                        borderRadius: 2,
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '0.5625rem', color: '#4a4540' }}>
                    {unique}% unique readers per platform
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </m.div>
    </DistributionOsLayout>
  );
}
