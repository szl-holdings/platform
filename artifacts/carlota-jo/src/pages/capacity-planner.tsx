import { motion } from 'framer-motion';
import {
  AlertCircle,
  BarChart3,
  Calendar,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import {
  CAPACITY_ALERTS as ALERTS,
  FORWARD_CAPACITY,
  SKILL_GAPS,
  TEAM,
  type TeamMember,
} from '@/data/operationalData';
import { useCarlotaApiData } from '@/hooks/useCarlotaApiData';
import { usePageMeta } from '@/hooks/usePageMeta';

interface KpiItem {
  label: string;
  value: string;
  sub: string;
  live?: boolean;
}

const GOLD = 'var(--color-gold)';

const STATUS_META: Record<TeamMember['status'], { label: string; color: string; bg: string }> = {
  optimal: { label: 'Optimal', color: '#059669', bg: '#ECFDF5' },
  over: { label: 'Over-allocated', color: '#DC2626', bg: '#FEF2F2' },
  under: { label: 'Under-utilised', color: '#D97706', bg: '#FFF7ED' },
  bench: { label: 'Bench', color: '#0284C7', bg: '#EFF6FF' },
};

export default function CapacityPlanner() {
  usePageMeta({
    title: 'Resource & Capacity Planner | Carlota Jo',
    description:
      'Visual team allocation heatmap, utilisation tracking, skill-gap analysis, and forward capacity planning across engagements.',
    canonical: 'https://szlholdings.com/carlota-jo/capacity-planner',
  });

  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const apiData = useCarlotaApiData();

  const avgUtilisation = Math.round(TEAM.reduce((s, m) => s + m.utilisation, 0) / TEAM.length);
  const benchCount = TEAM.filter((m) => m.status === 'bench' || m.status === 'under').length;

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', paddingTop: 64 }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #0A1A14 0%, #142D20 50%, #061408 100%)',
          padding: '48px 0 40px',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(5,150,105,0.2)',
                  border: '1px solid rgba(5,150,105,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={16} color="#34D399" />
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  color: '#34D399',
                  textTransform: 'uppercase',
                }}
              >
                Resource & Capacity Planner
              </span>
            </div>
            <h1
              style={{
                fontSize: 'clamp(28px, 4vw, 44px)',
                fontWeight: 300,
                color: '#F5F0E8',
                fontFamily: "'Cormorant Garamond', serif",
                lineHeight: 1.1,
                marginBottom: 12,
              }}
            >
              The Right People.
              <br />
              <em style={{ color: '#34D399' }}>On Every Engagement.</em>
            </h1>
            <p
              style={{
                fontSize: 15,
                color: '#4A7A63',
                maxWidth: 520,
                lineHeight: 1.7,
                marginBottom: 32,
              }}
            >
              Real-time team allocation, bench analysis, skill-gap detection, and forward capacity
              planning — so you never over-commit or leave capability idle.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 16,
                maxWidth: 900,
              }}
            >
              {(
                [
                  {
                    label: 'Team Utilisation',
                    value: `${avgUtilisation}%`,
                    sub: 'Current average',
                  },
                  {
                    label: 'Capacity Available',
                    value: `${benchCount} members`,
                    sub: 'Partially or fully available',
                  },
                  {
                    label: 'Active Engagements',
                    value: apiData.isLive ? apiData.reservationsTotal.toString() : '—',
                    sub: apiData.isLive ? 'Active reservations' : 'Awaiting data',
                    live: apiData.isLive,
                  },
                  {
                    label: 'Skill Gaps Identified',
                    value: SKILL_GAPS.length.toString(),
                    sub: 'Require action',
                  },
                  ...(apiData.isLive
                    ? [
                        {
                          label: 'Client Inquiries',
                          value: apiData.inquiriesTotal.toString(),
                          sub: 'from live CRM',
                          live: true,
                        },
                      ]
                    : []),
                ] as KpiItem[]
              ).map((kpi) => (
                <div
                  key={kpi.label}
                  style={{
                    background: kpi.live ? 'rgba(5,150,105,0.08)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${kpi.live ? 'rgba(5,150,105,0.25)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 600,
                        color: '#F5F0E8',
                        fontFamily: "'Cormorant Garamond', serif",
                      }}
                    >
                      {kpi.value}
                    </div>
                    {kpi.live && (
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: '#34D399',
                          background: 'rgba(52,211,153,0.12)',
                          padding: '2px 5px',
                          borderRadius: 4,
                        }}
                      >
                        Live
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#4A7A63', marginTop: 2 }}>{kpi.label}</div>
                  <div style={{ fontSize: 10, color: '#2A5040', marginTop: 2 }}>{kpi.sub}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Alerts */}
        {ALERTS.length > 0 && (
          <div style={{ padding: '28px 0 0', marginBottom: 28 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ALERTS.map((alert, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '12px 16px',
                    background:
                      alert.type === 'critical'
                        ? '#FEF2F2'
                        : alert.type === 'warning'
                          ? '#FFF7ED'
                          : '#EFF6FF',
                    border: `1px solid ${alert.type === 'critical' ? '#FCA5A5' : alert.type === 'warning' ? '#FED7AA' : '#BFDBFE'}`,
                    borderRadius: 10,
                  }}
                >
                  <AlertCircle
                    size={14}
                    color={
                      alert.type === 'critical'
                        ? '#DC2626'
                        : alert.type === 'warning'
                          ? '#D97706'
                          : '#0284C7'
                    }
                    style={{ marginTop: 2, flexShrink: 0 }}
                  />
                  <p style={{ fontSize: 13, color: '#1A1A14', lineHeight: 1.5, margin: 0 }}>
                    {alert.message}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Allocation Heatmap */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <BarChart3 size={16} color={GOLD} />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1A1A14' }}>
              Team Allocation Heatmap
            </h2>
            <span style={{ fontSize: 11, color: '#A89878', marginLeft: 'auto' }}>
              Click a team member for details
            </span>
          </div>

          <div
            style={{
              background: '#fff',
              border: '1px solid #E8E2D6',
              borderRadius: 20,
              overflow: 'hidden',
            }}
          >
            {TEAM.map((member, _i) => {
              const statusMeta = STATUS_META[member.status];
              const isSelected = selectedMember?.id === member.id;
              return (
                <div key={member.id}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '16px 24px',
                      borderBottom: '1px solid #F0EBE0',
                      cursor: 'pointer',
                      background: isSelected ? '#FFFBF0' : 'transparent',
                    }}
                    onClick={() => setSelectedMember(isSelected ? null : member)}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        background: `${GOLD}15`,
                        border: `2px solid ${GOLD}30`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 600,
                        color: GOLD,
                        flexShrink: 0,
                      }}
                    >
                      {member.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div style={{ minWidth: 180 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A14' }}>
                        {member.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#A89878' }}>{member.title}</div>
                    </div>

                    {/* Utilisation bar */}
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 4,
                        }}
                      >
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {member.allocations.map((alloc, j) => (
                            <span
                              key={j}
                              style={{
                                fontSize: 10,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: `${alloc.color}15`,
                                color: alloc.color,
                                fontWeight: 500,
                              }}
                            >
                              {alloc.client} {alloc.pct}%
                            </span>
                          ))}
                        </div>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color:
                              member.utilisation > 90
                                ? '#DC2626'
                                : member.utilisation > 75
                                  ? '#059669'
                                  : '#D97706',
                            fontFamily: "'Cormorant Garamond', serif",
                            whiteSpace: 'nowrap',
                            marginLeft: 12,
                          }}
                        >
                          {member.utilisation}%
                        </span>
                      </div>
                      <div
                        style={{
                          height: 8,
                          background: '#F0EBE0',
                          borderRadius: 4,
                          overflow: 'hidden',
                        }}
                      >
                        <div style={{ display: 'flex', height: '100%' }}>
                          {member.allocations.map((alloc, j) => (
                            <div
                              key={j}
                              style={{
                                width: `${alloc.pct}%`,
                                background: alloc.color,
                                transition: 'width 0.3s',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '3px 10px',
                        borderRadius: 100,
                        background: statusMeta.bg,
                        color: statusMeta.color,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {statusMeta.label}
                    </span>
                  </div>

                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        padding: '20px 24px',
                        background: '#FFFBF0',
                        borderBottom: '1px solid #F0EBE0',
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#6B5E47',
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              marginBottom: 10,
                            }}
                          >
                            Active Allocations
                          </div>
                          {member.allocations.map((alloc, j) => (
                            <div
                              key={j}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                marginBottom: 8,
                                padding: '8px 12px',
                                background: '#fff',
                                borderRadius: 8,
                                border: '1px solid #E8E2D6',
                              }}
                            >
                              <div
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  background: alloc.color,
                                  flexShrink: 0,
                                }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1A14' }}>
                                  {alloc.client}
                                </div>
                                <div style={{ fontSize: 11, color: '#A89878' }}>
                                  {alloc.engagement} · {alloc.weeks}
                                </div>
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 700, color: alloc.color }}>
                                {alloc.pct}%
                              </span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#6B5E47',
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              marginBottom: 10,
                            }}
                          >
                            Skills
                          </div>
                          <div
                            style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}
                          >
                            {member.skills.map((skill) => (
                              <span
                                key={skill}
                                style={{
                                  fontSize: 11,
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                  background: `${GOLD}10`,
                                  color: '#6B5E47',
                                  border: `1px solid ${GOLD}20`,
                                }}
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                          <div style={{ fontSize: 13, color: '#6B5E47' }}>
                            Day rate:{' '}
                            <strong style={{ color: '#1A1A14' }}>
                              £{member.dayRate.toLocaleString()}
                            </strong>
                          </div>
                          <div style={{ fontSize: 13, color: '#6B5E47', marginTop: 4 }}>
                            Bench capacity:{' '}
                            <strong style={{ color: '#1A1A14' }}>
                              {100 - member.utilisation}%
                            </strong>{' '}
                            ({Math.round(((100 - member.utilisation) / 100) * 5)} days/week)
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Forward Capacity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
          <div
            style={{
              background: '#fff',
              border: '1px solid #E8E2D6',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Calendar size={16} color={GOLD} />
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1A1A14' }}>
                Forward Capacity (Days/Month)
              </h2>
            </div>
            {FORWARD_CAPACITY.map((m, _i) => (
              <div key={m.month} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: '#6B5E47', fontWeight: 600 }}>{m.month} 2026</span>
                  <span style={{ color: '#A89878' }}>
                    {m.available} days available of {m.total}
                  </span>
                </div>
                <div
                  style={{ height: 10, background: '#F0EBE0', borderRadius: 5, overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', height: '100%' }}>
                    <div
                      style={{
                        width: `${(m.committed / m.total) * 100}%`,
                        background: GOLD,
                        borderRadius: '5px 0 0 5px',
                      }}
                    />
                    <div
                      style={{ width: `${(m.available / m.total) * 100}%`, background: '#E8E2D6' }}
                    />
                  </div>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  color: '#A89878',
                }}
              >
                <div style={{ width: 12, height: 8, borderRadius: 2, background: GOLD }} />{' '}
                Committed
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  color: '#A89878',
                }}
              >
                <div style={{ width: 12, height: 8, borderRadius: 2, background: '#E8E2D6' }} />{' '}
                Available
              </div>
            </div>
          </div>

          {/* Skill Gaps */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #E8E2D6',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Zap size={16} color={GOLD} />
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1A1A14' }}>
                Skill Gap Analysis
              </h2>
            </div>
            {SKILL_GAPS.map((gap, i) => (
              <div
                key={i}
                style={{
                  marginBottom: 16,
                  padding: '14px 16px',
                  background: '#FFF7ED',
                  border: '1px solid #FED7AA',
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A14' }}>{gap.skill}</div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 100,
                      background: gap.gap === 'Critical' ? '#FEE2E2' : '#FFF7ED',
                      color: gap.gap === 'Critical' ? '#DC2626' : '#D97706',
                    }}
                  >
                    {gap.gap} Gap
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#6B5E47', marginBottom: 4 }}>
                  Demand: <strong>{gap.demand}</strong>
                </div>
                <div style={{ fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>
                  → {gap.suggestion}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
