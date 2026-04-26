import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowUpRight, Calendar, Mail, Phone, RefreshCw, Users } from 'lucide-react';
import { useState } from 'react';

const API_BASE = '/api';

interface Lead {
  id: string;
  type: 'inquiry' | 'reservation' | 'chat';
  name: string;
  email?: string | null;
  company?: string | null;
  phone?: string | null;
  service?: string | null;
  message?: string | null;
  status: string;
  source: string;
  amount?: string | null;
  confirmationId?: string | null;
  preferredDate?: string | null;
  qualificationScore?: number | null;
  signals?: string[] | null;
  messageCount?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface PipelineResponse {
  data: {
    leads: Lead[];
    summary: { inquiries: number; reservations: number; chats: number; total: number };
  };
  meta: { page: number; limit: number; total: number };
}

const T = {
  bg: '#0a0a0a',
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f0f0f0',
  textDim: '#888',
  accent: '#c9b787',
  accentDim: 'rgba(201,183,135,0.12)',
  gold: '#9A7D52',
};

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  new: { bg: 'rgba(99,179,237,0.12)', color: '#63b3ed', label: 'New' },
  pending: { bg: 'rgba(246,173,85,0.12)', color: '#f6ad55', label: 'Pending' },
  qualified: { bg: 'rgba(104,211,145,0.12)', color: '#68d391', label: 'Qualified' },
  booked: { bg: 'rgba(201,183,135,0.15)', color: '#c9b787', label: 'Booked' },
  contacted: { bg: 'rgba(99,179,237,0.12)', color: '#63b3ed', label: 'Contacted' },
  closed: { bg: 'rgba(104,211,145,0.12)', color: '#68d391', label: 'Closed' },
  declined: { bg: 'rgba(252,129,74,0.12)', color: '#fc814a', label: 'Declined' },
};

const SOURCE_LABELS: Record<string, string> = {
  'web-form': 'Web Form',
  'booking-flow': 'Booking Flow',
  'advisor-chat': 'AI Advisor',
};

const SERVICE_LABELS: Record<string, string> = {
  'residence-operations': 'Residence Operations',
  'property-coordination': 'Property Coordination',
  'household-systems': 'Household Systems',
  'vendor-management': 'Vendor Management',
  'lifestyle-admin': 'Lifestyle & Admin',
  'special-projects': 'Special Projects',
};

function getStatusStyle(status: string) {
  return STATUS_COLORS[status] ?? { bg: 'rgba(255,255,255,0.05)', color: '#888', label: status };
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function StatusBadge({ status }: { status: string }) {
  const s = getStatusStyle(status);
  return (
    <span
      style={{
        padding: '2px 8px',
        fontSize: '11px',
        fontWeight: 500,
        letterSpacing: '0.04em',
        background: s.bg,
        color: s.color,
        textTransform: 'capitalize',
      }}
    >
      {s.label}
    </span>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      style={{
        background: accent ? T.accentDim : T.surface,
        border: `1px solid ${accent ? 'rgba(201,183,135,0.2)' : T.border}`,
        padding: '20px 24px',
        flex: 1,
        minWidth: 0,
      }}
    >
      <p style={{ fontSize: '11px', color: T.textDim, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
        {label}
      </p>
      <p style={{ fontSize: '28px', fontWeight: 300, color: accent ? T.accent : T.text }}>
        {value}
      </p>
    </div>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <tr
        onClick={() => setExpanded((v) => !v)}
        style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer' }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)')
        }
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
      >
        <td style={{ padding: '14px 16px' }}>
          <div>
            <p style={{ fontSize: '13px', color: T.text, fontWeight: 400 }}>{lead.name}</p>
            {lead.email && (
              <p style={{ fontSize: '11px', color: T.textDim, marginTop: '2px' }}>{lead.email}</p>
            )}
            {lead.type === 'chat' && lead.messageCount != null && (
              <p style={{ fontSize: '10px', color: T.textDim, marginTop: '2px' }}>
                {lead.messageCount} messages
              </p>
            )}
          </div>
        </td>
        <td style={{ padding: '14px 16px' }}>
          <p style={{ fontSize: '12px', color: T.textDim }}>
            {lead.service ? SERVICE_LABELS[lead.service] ?? lead.service : '—'}
          </p>
        </td>
        <td style={{ padding: '14px 16px' }}>
          <StatusBadge status={lead.status} />
        </td>
        <td style={{ padding: '14px 16px' }}>
          <span
            style={{
              fontSize: '11px',
              color: T.textDim,
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${T.border}`,
              padding: '2px 7px',
            }}
          >
            {SOURCE_LABELS[lead.source] ?? lead.source}
          </span>
        </td>
        <td style={{ padding: '14px 16px' }}>
          <p style={{ fontSize: '12px', color: T.textDim }}>{formatDate(lead.createdAt)}</p>
        </td>
        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
          {lead.amount && (
            <p style={{ fontSize: '12px', color: T.accent, fontWeight: 500 }}>
              ${parseInt(lead.amount, 10).toLocaleString()}
            </p>
          )}
        </td>
      </tr>
      {expanded && (
        <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
          <td colSpan={6} style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
              {lead.message && (
                <div style={{ flex: 2, minWidth: 200 }}>
                  <p style={{ fontSize: '10px', color: T.textDim, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    {lead.type === 'chat' ? 'Last Message' : 'Message'}
                  </p>
                  <p style={{ fontSize: '12px', color: T.text, lineHeight: '1.6', fontWeight: 300 }}>
                    {lead.message}
                  </p>
                </div>
              )}
              {lead.type === 'chat' && (lead.qualificationScore != null || (lead.signals && lead.signals.length > 0)) && (
                <div style={{ flex: 1, minWidth: 180 }}>
                  {lead.qualificationScore != null && (
                    <div style={{ marginBottom: '12px' }}>
                      <p style={{ fontSize: '10px', color: T.textDim, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Qualification Score
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          flex: 1,
                          height: '4px',
                          background: 'rgba(255,255,255,0.08)',
                          borderRadius: '2px',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(100, lead.qualificationScore)}%`,
                            background: lead.qualificationScore >= 70 ? '#68d391' : lead.qualificationScore >= 40 ? T.accent : '#fc814a',
                          }} />
                        </div>
                        <p style={{ fontSize: '12px', color: T.text, fontWeight: 500, minWidth: '32px' }}>
                          {lead.qualificationScore}
                        </p>
                      </div>
                    </div>
                  )}
                  {lead.signals && lead.signals.length > 0 && (
                    <div>
                      <p style={{ fontSize: '10px', color: T.textDim, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Lead Signals
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {lead.signals.map((sig, i) => (
                          <span key={i} style={{
                            fontSize: '10px',
                            padding: '2px 7px',
                            background: T.accentDim,
                            color: T.accent,
                            border: `1px solid rgba(201,183,135,0.2)`,
                          }}>
                            {sig}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {lead.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={11} style={{ color: T.textDim }} />
                    <p style={{ fontSize: '12px', color: T.textDim }}>{lead.phone}</p>
                  </div>
                )}
                {lead.company && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={11} style={{ color: T.textDim }} />
                    <p style={{ fontSize: '12px', color: T.textDim }}>{lead.company}</p>
                  </div>
                )}
                {lead.preferredDate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={11} style={{ color: T.textDim }} />
                    <p style={{ fontSize: '12px', color: T.textDim }}>{lead.preferredDate}</p>
                  </div>
                )}
                {lead.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={11} style={{ color: T.textDim }} />
                    <a
                      href={`mailto:${lead.email}`}
                      style={{ fontSize: '12px', color: T.accent, textDecoration: 'none' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {lead.email}
                    </a>
                  </div>
                )}
                {lead.confirmationId && (
                  <p style={{ fontSize: '11px', color: T.textDim, fontFamily: 'monospace' }}>
                    {lead.confirmationId}
                  </p>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

const STATUS_FILTERS = ['all', 'new', 'pending', 'qualified', 'booked', 'contacted', 'closed'];
const TYPE_FILTERS = ['all', 'inquiry', 'reservation', 'chat'];

export default function CarlotaPipelinePage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data, isLoading, error, refetch, isFetching } = useQuery<PipelineResponse>({
    queryKey: ['carlota-pipeline'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/carlota/pipeline?limit=100`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    refetchInterval: 60_000,
  });

  const allLeads = data?.data?.leads ?? [];
  const summary = data?.data?.summary ?? { inquiries: 0, reservations: 0, chats: 0, total: 0 };

  const filtered = allLeads.filter((lead) => {
    if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
    if (typeFilter !== 'all' && lead.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !lead.name.toLowerCase().includes(q) &&
        !(lead.email ?? '').toLowerCase().includes(q) &&
        !(lead.company ?? '').toLowerCase().includes(q) &&
        !(lead.service ?? '').toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, padding: '32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '32px',
            gap: '16px',
          }}
        >
          <div>
            <p
              style={{
                fontSize: '10px',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: T.accent,
                marginBottom: '6px',
              }}
            >
              Carlota Jo
            </p>
            <h1 style={{ fontSize: '22px', fontWeight: 300, color: T.text, marginBottom: '4px' }}>
              Lead Pipeline
            </h1>
            <p style={{ fontSize: '13px', color: T.textDim }}>
              All inquiries, consultations, and AI advisor engagements
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <a
              href="/carlota-jo/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 14px',
                fontSize: '12px',
                color: T.accent,
                border: `1px solid rgba(201,183,135,0.25)`,
                background: T.accentDim,
                textDecoration: 'none',
              }}
            >
              View Site
              <ArrowUpRight size={11} />
            </a>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 14px',
                fontSize: '12px',
                color: T.textDim,
                border: `1px solid ${T.border}`,
                background: T.surface,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={11} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <SummaryCard label="Total Leads" value={summary.total} accent />
          <SummaryCard label="Inquiries" value={summary.inquiries} />
          <SummaryCard label="Consultations Booked" value={summary.reservations} />
          <SummaryCard label="AI Chat Sessions" value={summary.chats} />
        </div>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, service…"
            style={{
              flex: 1,
              minWidth: '200px',
              maxWidth: '320px',
              padding: '8px 12px',
              background: T.surface,
              border: `1px solid ${T.border}`,
              color: T.text,
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: '6px' }}>
            {TYPE_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  letterSpacing: '0.04em',
                  background: typeFilter === f ? T.accentDim : T.surface,
                  color: typeFilter === f ? T.accent : T.textDim,
                  border: `1px solid ${typeFilter === f ? 'rgba(201,183,135,0.25)' : T.border}`,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {f === 'all' ? 'All Types' : f === 'inquiry' ? 'Inquiries' : f === 'reservation' ? 'Bookings' : 'AI Chats'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  letterSpacing: '0.04em',
                  background: statusFilter === f ? T.accentDim : T.surface,
                  color: statusFilter === f ? T.accent : T.textDim,
                  border: `1px solid ${statusFilter === f ? 'rgba(201,183,135,0.25)' : T.border}`,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {f === 'all' ? 'All Statuses' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '64px',
              color: T.textDim,
              fontSize: '13px',
              gap: '10px',
            }}
          >
            <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
            Loading pipeline…
          </div>
        ) : error ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '20px 24px',
              background: 'rgba(252,129,74,0.08)',
              border: '1px solid rgba(252,129,74,0.15)',
              color: '#fc814a',
              fontSize: '13px',
            }}
          >
            <AlertCircle size={14} />
            Failed to load pipeline. Ensure you're signed in with an admin account.
          </div>
        ) : (
          <div
            style={{
              border: `1px solid ${T.border}`,
              background: T.surface,
              overflow: 'hidden',
            }}
          >
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: '48px',
                  textAlign: 'center',
                  color: T.textDim,
                  fontSize: '13px',
                }}
              >
                No leads match the current filters.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Contact', 'Service', 'Status', 'Source', 'Date', 'Value'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '10px 16px',
                          fontSize: '10px',
                          fontWeight: 500,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: T.textDim,
                          textAlign: 'left',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead) => (
                    <LeadRow key={lead.id} lead={lead} />
                  ))}
                </tbody>
              </table>
            )}
            <div
              style={{
                padding: '10px 16px',
                borderTop: `1px solid ${T.border}`,
                fontSize: '11px',
                color: T.textDim,
              }}
            >
              Showing {filtered.length} of {allLeads.length} leads
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
