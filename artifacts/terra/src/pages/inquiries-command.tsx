import { EmptyState } from '@szl-holdings/shared-ui/EmptyState';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Clock,
  Filter,
} from 'lucide-react';
import { useState } from 'react';

const TERRA_ACCENT = '#c87941';

const INQUIRIES = [
  {
    id: 'I001',
    listingAddress: '340 Park Avenue South, NY 10010',
    listingType: 'Office',
    buyerName: 'Apex Partners LP',
    buyerType: 'investor',
    financingStatus: 'cash',
    qualificationScore: 92,
    status: 'qualified',
    source: 'referral',
    assignedAgent: 'Torres, A.',
    lastContact: '2026-03-27',
    daysOpen: 1,
    message: 'Interested in full-floor acquisition. Can close in 45 days.',
    routingReason: 'Cash buyer — high score. Matched to A003 by office specialty.',
    nextAction: 'Schedule showing for April 2nd.',
  },
  {
    id: 'I002',
    listingAddress: '800 Fifth Avenue, NY 10065',
    listingType: 'Office',
    buyerName: 'Midtown Capital Fund III',
    buyerType: 'family_office',
    financingStatus: 'pre_approved',
    qualificationScore: 84,
    status: 'showing_scheduled',
    source: 'portal',
    assignedAgent: 'Rivera, K.',
    lastContact: '2026-03-28',
    daysOpen: 2,
    message: 'Looking for 60,000+ sf contiguous for HQ relocation.',
    routingReason: 'Pre-approved buyer. Office need matched to A001.',
    nextAction: 'Showing confirmed April 4th at 10am.',
  },
  {
    id: 'I003',
    listingAddress: '55 Water Street, NY 10041',
    listingType: 'Office',
    buyerName: 'Cerberus RE Opportunities',
    buyerType: 'investor',
    financingStatus: 'cash',
    qualificationScore: 78,
    status: 'contacted',
    source: 'direct',
    assignedAgent: 'Chen, M.',
    lastContact: '2026-03-25',
    daysOpen: 5,
    message: 'Monitoring distressed office for debt play. Need financials.',
    routingReason: 'Distress signal listing — investor profile. Routed to M002.',
    nextAction: 'Send financials and schedule call.',
  },
  {
    id: 'I004',
    listingAddress: '1420 Harbor Blvd, Brooklyn, NY 11231',
    listingType: 'Mixed-Use',
    buyerName: 'Red Hook Development LLC',
    buyerType: 'developer',
    financingStatus: 'seeking_financing',
    qualificationScore: 56,
    status: 'new',
    source: 'web',
    assignedAgent: null,
    lastContact: null,
    daysOpen: 0,
    message: 'Mixed-use development interest. Need zoning details.',
    routingReason: 'Financing not secured — held for manual review.',
    nextAction: 'Verify buyer financing status before assignment.',
  },
  {
    id: 'I005',
    listingAddress: '620 Atlantic Ave, Brooklyn, NY 11217',
    listingType: 'Retail',
    buyerName: 'Atlantic Strip Partners',
    buyerType: 'investor',
    financingStatus: 'pre_approved',
    qualificationScore: 67,
    status: 'qualified',
    source: 'email',
    assignedAgent: 'Williams, J.',
    lastContact: '2026-03-26',
    daysOpen: 4,
    message: 'Interested in NNN retail. Currently hold 3 Brooklyn retail assets.',
    routingReason: 'Retail investor matched to J004 by retail specialty.',
    nextAction: 'Send comparable cap rate analysis.',
  },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  new: { color: 'hsl(210,5%,60%)', bg: 'hsla(210,5%,60%,0.1)', label: 'New' },
  contacted: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', label: 'Contacted' },
  qualified: { color: '#22d3ee', bg: 'rgba(34,211,238,0.12)', label: 'Qualified' },
  showing_scheduled: { color: '#c87941', bg: 'rgba(200,121,65,0.12)', label: 'Showing Scheduled' },
  offer_submitted: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', label: 'Offer Submitted' },
  converted: { color: '#4ade80', bg: 'rgba(74,222,128,0.12)', label: 'Converted' },
  lost: { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'Lost' },
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? '#4ade80' : score >= 65 ? TERRA_ACCENT : score >= 50 ? '#fbbf24' : '#f87171';
  return (
    <span
      style={{
        fontSize: '11px',
        fontWeight: '700',
        fontFamily: "'JetBrains Mono', monospace",
        padding: '2px 8px',
        borderRadius: '4px',
        background: `${color}18`,
        color,
        border: `1px solid ${color}30`,
      }}
    >
      {score}
    </span>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.38, delay: i * 0.05 } }),
};

export default function InquiriesCommand() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered =
    statusFilter === 'all' ? INQUIRIES : INQUIRIES.filter((i) => i.status === statusFilter);
  const selectedInquiry = INQUIRIES.find((i) => i.id === selected);

  const stats = [
    { label: 'Total', value: INQUIRIES.length, color: 'hsl(210,5%,60%)' },
    {
      label: 'Unassigned',
      value: INQUIRIES.filter((i) => !i.assignedAgent).length,
      color: '#fbbf24',
    },
    {
      label: 'Qualified',
      value: INQUIRIES.filter((i) => i.status === 'qualified' || i.status === 'showing_scheduled')
        .length,
      color: TERRA_ACCENT,
    },
    {
      label: 'Avg Score',
      value: Math.round(INQUIRIES.reduce((s, i) => s + i.qualificationScore, 0) / INQUIRIES.length),
      color: '#22d3ee',
    },
  ];

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
          Inquiry Routing
        </h1>
        <p style={{ fontSize: '12.5px', color: 'hsl(210,5%,50%)' }}>
          Every inquiry scored, classified, and routed. Nothing falls through.
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
        {stats.map((stat) => (
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
                fontSize: '1.5rem',
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
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
        }}
      >
        <Filter size={11} style={{ color: 'hsl(210,5%,42%)' }} />
        {['all', 'new', 'contacted', 'qualified', 'showing_scheduled'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              fontSize: '11.5px',
              fontWeight: '500',
              padding: '3px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              border:
                statusFilter === s
                  ? `1px solid ${TERRA_ACCENT}50`
                  : '1px solid hsla(0,0%,100%,0.08)',
              background: statusFilter === s ? `${TERRA_ACCENT}18` : 'transparent',
              color: statusFilter === s ? TERRA_ACCENT : 'hsl(210,5%,52%)',
              transition: 'all 0.15s ease',
            }}
          >
            {s === 'all' ? 'All' : (STATUS_CONFIG[s]?.label ?? s)}
          </button>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selectedInquiry ? '1fr 380px' : '1fr',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {filtered.length === 0 &&
            (statusFilter === 'all' ? (
              <EmptyState
                icon={CheckCircle}
                headline="No inquiries waiting"
                description="Every inquiry has been routed and assigned — the inbox is clear."
                accentColor="#10b981"
              />
            ) : (
              <EmptyState
                icon={Filter}
                headline={`No ${statusFilter.replace(/_/g, ' ')} inquiries`}
                description="Switch to a different status to see other inquiries in the routing queue."
                accentColor={TERRA_ACCENT}
                action={{ label: 'Show all inquiries', onClick: () => setStatusFilter('all') }}
              />
            ))}
          {filtered.map((inquiry, i) => {
            const sc = STATUS_CONFIG[inquiry.status];
            const isSelected = selected === inquiry.id;
            return (
              <motion.div
                key={inquiry.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                onClick={() => setSelected(isSelected ? null : inquiry.id)}
                style={{
                  padding: '1.125rem 1.25rem',
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
                    marginBottom: '0.625rem',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.25rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      {sc && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: '600',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            background: sc.bg,
                            border: `1px solid ${sc.color}30`,
                            color: sc.color,
                          }}
                        >
                          {sc.label}
                        </span>
                      )}
                      <span style={{ fontSize: '10px', color: 'hsl(210,5%,44%)' }}>
                        {inquiry.source}
                      </span>
                      {!inquiry.assignedAgent && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: '600',
                            color: '#fbbf24',
                            background: 'rgba(251,191,36,0.1)',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            border: '1px solid rgba(251,191,36,0.2)',
                          }}
                        >
                          Unassigned
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: '13.5px',
                        fontWeight: '600',
                        color: 'hsl(38,12%,90%)',
                        letterSpacing: '-0.005em',
                      }}
                    >
                      {inquiry.buyerName}
                    </p>
                    <p
                      style={{
                        fontSize: '11.5px',
                        color: 'hsl(210,5%,46%)',
                        marginTop: '0.125rem',
                      }}
                    >
                      {inquiry.listingAddress} · {inquiry.listingType}
                    </p>
                  </div>
                  <ScoreBadge score={inquiry.qualificationScore} />
                </div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <span style={{ fontSize: '11px', color: 'hsl(210,5%,44%)' }}>
                      {inquiry.financingStatus.replace(/_/g, ' ')}
                    </span>
                    {inquiry.assignedAgent && (
                      <span style={{ fontSize: '11px', color: 'hsl(210,5%,44%)' }}>
                        → {inquiry.assignedAgent}
                      </span>
                    )}
                  </div>
                  {inquiry.lastContact && (
                    <span
                      style={{
                        fontSize: '10.5px',
                        color: 'hsl(210,5%,36%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <Clock size={10} /> {inquiry.lastContact}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {selectedInquiry && (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
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
              Inquiry Detail
            </p>
            <p
              style={{
                fontSize: '14px',
                fontWeight: '700',
                color: 'hsl(38,12%,92%)',
                marginBottom: '0.25rem',
              }}
            >
              {selectedInquiry.buyerName}
            </p>
            <p style={{ fontSize: '12px', color: 'hsl(210,5%,48%)', marginBottom: '1.25rem' }}>
              {selectedInquiry.listingAddress}
            </p>
            {[
              { label: 'Buyer Type', value: selectedInquiry.buyerType.replace(/_/g, ' ') },
              { label: 'Financing', value: selectedInquiry.financingStatus.replace(/_/g, ' ') },
              { label: 'Source', value: selectedInquiry.source },
              { label: 'Agent', value: selectedInquiry.assignedAgent ?? 'Unassigned' },
              { label: 'Days Open', value: String(selectedInquiry.daysOpen) },
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
                <span style={{ fontSize: '11.5px', fontWeight: '500', color: 'hsl(38,12%,80%)' }}>
                  {row.value}
                </span>
              </div>
            ))}
            <div
              style={{
                marginTop: '1rem',
                padding: '0.875rem',
                borderRadius: '0.5rem',
                background: 'hsla(0,0%,100%,0.03)',
                border: '1px solid hsla(0,0%,100%,0.06)',
              }}
            >
              <p
                style={{
                  fontSize: '10px',
                  fontWeight: '600',
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  color: 'hsl(210,5%,38%)',
                  marginBottom: '0.5rem',
                }}
              >
                Message
              </p>
              <p style={{ fontSize: '12px', lineHeight: '1.6', color: 'hsl(210,5%,56%)' }}>
                {selectedInquiry.message}
              </p>
            </div>
            <div
              style={{
                marginTop: '0.875rem',
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
                Next Action
              </p>
              <p style={{ fontSize: '12px', lineHeight: '1.55', color: 'hsl(38,12%,70%)' }}>
                {selectedInquiry.nextAction}
              </p>
            </div>
            <div
              style={{
                marginTop: '0.875rem',
                padding: '0.875rem',
                borderRadius: '0.5rem',
                background: 'hsla(0,0%,100%,0.02)',
                border: '1px solid hsla(0,0%,100%,0.05)',
              }}
            >
              <p
                style={{
                  fontSize: '10px',
                  fontWeight: '600',
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  color: 'hsl(210,5%,36%)',
                  marginBottom: '0.375rem',
                }}
              >
                Routing Reason
              </p>
              <p style={{ fontSize: '12px', lineHeight: '1.55', color: 'hsl(210,5%,48%)' }}>
                {selectedInquiry.routingReason}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
