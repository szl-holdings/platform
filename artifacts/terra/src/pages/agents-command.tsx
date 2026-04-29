import { motion } from 'framer-motion';
import { useState } from 'react';

const TERRA_ACCENT = '#c87941';

const AGENTS = [
  {
    id: 'A001',
    firstName: 'Karla',
    lastName: 'Rivera',
    email: 'k.rivera@terra-commercial.com',
    specialty: 'office',
    status: 'active',
    activeListings: 8,
    closedDealsLtm: 14,
    closeRatePct: 68,
    avgDaysToContract: 44,
    inquiryConversionPct: 31,
    brokerage: 'TERRA Commercial',
    currentPipelineValue: 248000000,
    lastActivityLabel: 'Showing confirmed — 800 Fifth Ave',
    inquiriesOpen: 7,
  },
  {
    id: 'A002',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'm.chen@terra-commercial.com',
    specialty: 'mixed-use',
    status: 'active',
    activeListings: 6,
    closedDealsLtm: 9,
    closeRatePct: 52,
    avgDaysToContract: 62,
    inquiryConversionPct: 22,
    brokerage: 'TERRA Commercial',
    currentPipelineValue: 118000000,
    lastActivityLabel: 'Sent financials — 55 Water St',
    inquiriesOpen: 4,
  },
  {
    id: 'A003',
    firstName: 'Alejandro',
    lastName: 'Torres',
    email: 'a.torres@terra-commercial.com',
    specialty: 'office',
    status: 'active',
    activeListings: 11,
    closedDealsLtm: 18,
    closeRatePct: 74,
    avgDaysToContract: 38,
    inquiryConversionPct: 38,
    brokerage: 'TERRA Commercial',
    currentPipelineValue: 412000000,
    lastActivityLabel: 'Offer submitted — 340 Park Ave S',
    inquiriesOpen: 11,
  },
  {
    id: 'A004',
    firstName: 'Joyce',
    lastName: 'Williams',
    email: 'j.williams@terra-commercial.com',
    specialty: 'retail',
    status: 'active',
    activeListings: 4,
    closedDealsLtm: 6,
    closeRatePct: 45,
    avgDaysToContract: 78,
    inquiryConversionPct: 18,
    brokerage: 'TERRA Commercial',
    currentPipelineValue: 52000000,
    lastActivityLabel: 'Sent cap rate analysis — 620 Atlantic Ave',
    inquiriesOpen: 3,
  },
];

function formatValue(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

function RateBar({ value, max = 100 }: { value: number; max?: number }) {
  return (
    <div
      style={{
        width: '100%',
        height: '4px',
        borderRadius: '2px',
        background: 'hsla(0,0%,100%,0.08)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          borderRadius: '2px',
          width: `${(value / max) * 100}%`,
          background: value >= 70 ? '#4ade80' : value >= 50 ? TERRA_ACCENT : '#fbbf24',
          transition: 'width 0.6s ease',
        }}
      />
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.38, delay: i * 0.06 } }),
};

export default function AgentsCommand() {
  const [selected, setSelected] = useState<string | null>(null);
  const [sort, setSort] = useState<'close_rate' | 'pipeline' | 'closed'>('close_rate');

  const sorted = [...AGENTS].sort((a, b) => {
    if (sort === 'close_rate') return b.closeRatePct - a.closeRatePct;
    if (sort === 'pipeline') return b.currentPipelineValue - a.currentPipelineValue;
    return b.closedDealsLtm - a.closedDealsLtm;
  });

  const brokerageStats = {
    totalActiveListings: AGENTS.reduce((s, a) => s + a.activeListings, 0),
    totalClosedLtm: AGENTS.reduce((s, a) => s + a.closedDealsLtm, 0),
    totalPipeline: AGENTS.reduce((s, a) => s + a.currentPipelineValue, 0),
    avgCloseRate: Math.round(AGENTS.reduce((s, a) => s + a.closeRatePct, 0) / AGENTS.length),
  };

  const selectedAgent = AGENTS.find((a) => a.id === selected);

  return (
    <div style={{ padding: '1.5rem', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1
          style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: 'hsl(38,12%,92%)',
            letterSpacing: '-0.015em',
            marginBottom: '0.25rem',
          }}
        >
          Agent & Brokerage View
        </h1>
        <p style={{ fontSize: '12.5px', color: 'hsl(210,5%,50%)' }}>
          Performance by agent and brokerage. No vanity metrics — only what moves deals.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        {[
          {
            label: 'Active Listings',
            value: String(brokerageStats.totalActiveListings),
            color: 'hsl(210,5%,62%)',
          },
          { label: 'Closed LTM', value: String(brokerageStats.totalClosedLtm), color: '#22d3ee' },
          {
            label: 'Pipeline Value',
            value: formatValue(brokerageStats.totalPipeline),
            color: TERRA_ACCENT,
          },
          { label: 'Avg Close Rate', value: `${brokerageStats.avgCloseRate}%`, color: '#4ade80' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '0.625rem',
              background: 'hsla(0,0%,100%,0.03)',
              border: '1px solid hsla(0,0%,100%,0.07)',
            }}
          >
            <p
              style={{
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'hsl(210,5%,38%)',
                marginBottom: '0.375rem',
              }}
            >
              {stat.label}
            </p>
            <p
              style={{
                fontSize: '1.375rem',
                fontWeight: '700',
                color: stat.color,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}
      >
        <span style={{ fontSize: '11px', color: 'hsl(210,5%,40%)' }}>Sort by:</span>
        {[
          { key: 'close_rate' as const, label: 'Close Rate' },
          { key: 'pipeline' as const, label: 'Pipeline' },
          { key: 'closed' as const, label: 'Closed LTM' },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            style={{
              fontSize: '11.5px',
              fontWeight: '500',
              padding: '3px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              border:
                sort === s.key ? `1px solid ${TERRA_ACCENT}50` : '1px solid hsla(0,0%,100%,0.08)',
              background: sort === s.key ? `${TERRA_ACCENT}18` : 'transparent',
              color: sort === s.key ? TERRA_ACCENT : 'hsl(210,5%,52%)',
              transition: 'all 0.15s ease',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selectedAgent ? '1fr 360px' : '1fr',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {sorted.map((agent, i) => {
            const isSelected = selected === agent.id;
            return (
              <motion.div
                key={agent.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                onClick={() => setSelected(isSelected ? null : agent.id)}
                style={{
                  padding: '1.25rem 1.375rem',
                  borderRadius: '0.75rem',
                  background: isSelected ? 'hsla(0,0%,100%,0.05)' : 'hsla(0,0%,100%,0.025)',
                  border: isSelected
                    ? `1px solid ${TERRA_ACCENT}35`
                    : '1px solid hsla(0,0%,100%,0.06)',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem',
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: '14.5px',
                        fontWeight: '700',
                        color: 'hsl(38,12%,92%)',
                        letterSpacing: '-0.008em',
                      }}
                    >
                      {agent.firstName} {agent.lastName}
                    </p>
                    <p
                      style={{
                        fontSize: '11.5px',
                        color: 'hsl(210,5%,46%)',
                        marginTop: '0.125rem',
                      }}
                    >
                      {agent.specialty} · {agent.brokerage}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: TERRA_ACCENT,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {formatValue(agent.currentPipelineValue)}
                    </p>
                    <p style={{ fontSize: '10px', color: 'hsl(210,5%,40%)', marginTop: '0.1rem' }}>
                      pipeline value
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '0.75rem',
                    marginBottom: '0.875rem',
                  }}
                >
                  {[
                    { label: 'Active', value: String(agent.activeListings) },
                    { label: 'Closed LTM', value: String(agent.closedDealsLtm) },
                    { label: 'Inquiries', value: String(agent.inquiriesOpen) },
                    { label: 'Avg DOM', value: `${agent.avgDaysToContract}d` },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <p
                        style={{
                          fontSize: '9.5px',
                          fontWeight: '600',
                          letterSpacing: '0.07em',
                          textTransform: 'uppercase',
                          color: 'hsl(210,5%,36%)',
                          marginBottom: '0.2rem',
                        }}
                      >
                        {stat.label}
                      </p>
                      <p
                        style={{
                          fontSize: '13px',
                          fontWeight: '700',
                          color: 'hsl(38,12%,82%)',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.25rem',
                      }}
                    >
                      <span
                        style={{ fontSize: '10px', fontWeight: '500', color: 'hsl(210,5%,40%)' }}
                      >
                        Close Rate
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          color:
                            agent.closeRatePct >= 70
                              ? '#4ade80'
                              : agent.closeRatePct >= 50
                                ? TERRA_ACCENT
                                : '#fbbf24',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {agent.closeRatePct}%
                      </span>
                    </div>
                    <RateBar value={agent.closeRatePct} />
                  </div>
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.25rem',
                      }}
                    >
                      <span
                        style={{ fontSize: '10px', fontWeight: '500', color: 'hsl(210,5%,40%)' }}
                      >
                        Inquiry Conversion
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          color: 'hsl(210,5%,62%)',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {agent.inquiryConversionPct}%
                      </span>
                    </div>
                    <RateBar value={agent.inquiryConversionPct} />
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '0.875rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    background: 'hsla(0,0%,100%,0.025)',
                    border: '1px solid hsla(0,0%,100%,0.05)',
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'hsl(210,5%,46%)' }}>
                    {agent.lastActivityLabel}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {selectedAgent && (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.28 }}
            style={{
              padding: '1.5rem',
              borderRadius: '0.875rem',
              background: 'hsla(0,0%,100%,0.03)',
              border: `1px solid ${TERRA_ACCENT}30`,
              height: 'fit-content',
              position: 'sticky',
              top: '1rem',
            }}
          >
            <p
              style={{
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: TERRA_ACCENT,
                marginBottom: '1rem',
              }}
            >
              Agent Detail
            </p>
            <p
              style={{
                fontSize: '15px',
                fontWeight: '700',
                color: 'hsl(38,12%,92%)',
                marginBottom: '0.125rem',
              }}
            >
              {selectedAgent.firstName} {selectedAgent.lastName}
            </p>
            <p style={{ fontSize: '12px', color: 'hsl(210,5%,48%)', marginBottom: '1.375rem' }}>
              {selectedAgent.email}
            </p>
            {[
              { label: 'Specialty', value: selectedAgent.specialty },
              { label: 'Status', value: selectedAgent.status },
              { label: 'Active Listings', value: String(selectedAgent.activeListings) },
              { label: 'Closed LTM', value: String(selectedAgent.closedDealsLtm) },
              { label: 'Close Rate', value: `${selectedAgent.closeRatePct}%` },
              { label: 'Avg Days to Contract', value: `${selectedAgent.avgDaysToContract} days` },
              { label: 'Inquiry Conversion', value: `${selectedAgent.inquiryConversionPct}%` },
              { label: 'Pipeline Value', value: formatValue(selectedAgent.currentPipelineValue) },
              { label: 'Open Inquiries', value: String(selectedAgent.inquiriesOpen) },
            ].map((row) => (
              <div
                key={row.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid hsla(0,0%,100%,0.05)',
                }}
              >
                <span style={{ fontSize: '11.5px', color: 'hsl(210,5%,42%)' }}>{row.label}</span>
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: '600',
                    color: 'hsl(38,12%,80%)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {row.value}
                </span>
              </div>
            ))}
            <div
              style={{
                marginTop: '1rem',
                padding: '0.875rem',
                borderRadius: '0.5rem',
                background: `${TERRA_ACCENT}10`,
                border: `1px solid ${TERRA_ACCENT}25`,
              }}
            >
              <p
                style={{
                  fontSize: '10px',
                  fontWeight: '600',
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  color: TERRA_ACCENT,
                  marginBottom: '0.375rem',
                }}
              >
                Last Activity
              </p>
              <p style={{ fontSize: '12px', color: 'hsl(38,12%,72%)' }}>
                {selectedAgent.lastActivityLabel}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
