import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCarlotaInquiryCreated } from '@szl-holdings/graphql-client';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Inbox,
  Loader2,
  Mail,
  RefreshCw,
  User,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { apiJson, apiJsonFull } from '@/lib/api';

const GOLD = 'var(--color-gold)';

type InquiryStatus = 'new' | 'in_review' | 'in_progress' | 'contacted' | 'closed';

interface Inquiry {
  id: number;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  service: string | null;
  message: string;
  status: InquiryStatus;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  data: Inquiry[];
  meta: { page: number; limit: number; total: number };
}

const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  new: {
    label: 'New',
    color: '#B8960C',
    bg: 'rgba(184,150,12,0.1)',
    border: 'rgba(184,150,12,0.3)',
  },
  in_review: {
    label: 'In Review',
    color: '#0284C7',
    bg: 'rgba(2,132,199,0.1)',
    border: 'rgba(2,132,199,0.3)',
  },
  in_progress: {
    label: 'In Review',
    color: '#0284C7',
    bg: 'rgba(2,132,199,0.1)',
    border: 'rgba(2,132,199,0.3)',
  },
  contacted: {
    label: 'Contacted',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.1)',
    border: 'rgba(124,58,237,0.3)',
  },
  closed: {
    label: 'Closed',
    color: '#6B7280',
    bg: 'rgba(107,114,128,0.1)',
    border: 'rgba(107,114,128,0.3)',
  },
};

const NEXT_STATUS: Record<string, InquiryStatus | null> = {
  new: 'in_review',
  in_review: 'closed',
  in_progress: 'closed',
  contacted: 'closed',
  closed: null,
};

const NEXT_STATUS_LABEL: Record<string, string> = {
  new: 'Mark In Review',
  in_review: 'Mark Closed',
  in_progress: 'Mark Closed',
  contacted: 'Mark Closed',
  closed: '',
};

async function fetchInquiries(page = 1, limit = 25): Promise<ApiResponse> {
  return apiJsonFull<ApiResponse>(`/booking/inquiries?page=${page}&limit=${limit}`);
}

async function updateStatus(id: number, status: InquiryStatus): Promise<Inquiry> {
  return apiJson<Inquiry>(`/booking/inquiries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function InquiryRow({ inquiry }: { inquiry: Inquiry }) {
  const [expanded, setExpanded] = useState(false);
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: InquiryStatus }) =>
      updateStatus(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['carlota-inquiries-inbox'] });
      void qc.invalidateQueries({ queryKey: ['carlota-inquiries-count'] });
    },
  });

  const sm = STATUS_META[inquiry.status] ?? STATUS_META['new'];
  const nextStatus = NEXT_STATUS[inquiry.status];
  const nextLabel = NEXT_STATUS_LABEL[inquiry.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: '#fff',
        border: '1px solid #E8E2D6',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 8,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto auto',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 2,
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a' }}>
              {inquiry.name}
            </span>
            {inquiry.company && (
              <span style={{ fontSize: 12, color: '#A89878' }}>{inquiry.company}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                fontSize: 12,
                color: '#6B5E47',
              }}
            >
              <Mail size={10} /> {inquiry.email}
            </span>
            {inquiry.service && (
              <span
                style={{
                  fontSize: 11,
                  background: 'rgba(184,150,12,0.08)',
                  border: '1px solid rgba(184,150,12,0.2)',
                  borderRadius: 4,
                  padding: '1px 6px',
                  color: '#B8960C',
                  fontWeight: 500,
                }}
              >
                {inquiry.service}
              </span>
            )}
          </div>
        </div>

        <span
          style={{
            fontSize: 11,
            color: '#A89878',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            whiteSpace: 'nowrap',
          }}
        >
          <Clock size={10} /> {formatDate(inquiry.createdAt)}
        </span>

        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: 20,
            background: sm.bg,
            color: sm.color,
            border: `1px solid ${sm.border}`,
            whiteSpace: 'nowrap',
          }}
        >
          {sm.label}
        </span>

        <span style={{ color: '#A89878' }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </div>

      {expanded && (
        <div
          style={{
            borderTop: '1px solid #F0EAE0',
            padding: '14px 18px 18px',
            background: '#FAFAF8',
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: '#4B3E2A',
              lineHeight: 1.65,
              marginBottom: 14,
              whiteSpace: 'pre-wrap',
            }}
          >
            {inquiry.message}
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            {nextStatus && (
              <button
                disabled={mutation.isPending}
                onClick={(e) => {
                  e.stopPropagation();
                  mutation.mutate({ id: inquiry.id, status: nextStatus });
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '6px 14px',
                  borderRadius: 8,
                  background: GOLD,
                  color: '#fff',
                  border: 'none',
                  cursor: mutation.isPending ? 'not-allowed' : 'pointer',
                  opacity: mutation.isPending ? 0.6 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {mutation.isPending ? (
                  <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <CheckCircle size={11} />
                )}
                {nextLabel}
              </button>
            )}
            {inquiry.status === 'closed' && (
              <span style={{ fontSize: 12, color: '#6B7280', fontStyle: 'italic' }}>
                Inquiry closed
              </span>
            )}
            {mutation.isError && (
              <span style={{ fontSize: 11, color: '#DC2626' }}>
                Update failed — please try again
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'in_review', label: 'In Review' },
  { value: 'closed', label: 'Closed' },
] as const;

export default function InquiryInbox() {
  usePageMeta({
    title: 'Inquiry Inbox | Carlota Jo',
    description: 'Review and manage incoming client inquiries.',
    canonical: 'https://szlholdings.com/carlota-jo/inquiries',
  });

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page] = useState(1);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['carlota-inquiries-inbox', page],
    queryFn: () => fetchInquiries(page, 50),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const qc = useQueryClient();
  const { data: newInquiry } = useCarlotaInquiryCreated();
  useEffect(() => {
    if (!newInquiry) return;
    void qc.invalidateQueries({ queryKey: ['carlota-inquiries-inbox'] });
    void qc.invalidateQueries({ queryKey: ['carlota-inquiries-count'] });
  }, [newInquiry, qc]);

  const inquiries = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const filtered =
    statusFilter === ''
      ? inquiries
      : inquiries.filter((i) => {
          if (statusFilter === 'in_review') {
            return i.status === 'in_review' || i.status === 'in_progress';
          }
          return i.status === statusFilter;
        });

  const countByStatus = {
    new: inquiries.filter((i) => i.status === 'new').length,
    in_review: inquiries.filter(
      (i) => i.status === 'in_review' || i.status === 'in_progress',
    ).length,
    closed: inquiries.filter((i) => i.status === 'closed' || i.status === 'contacted').length,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', paddingTop: 64 }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #0F0F0D 0%, #1A1A14 50%, #0A0A08 100%)',
          padding: '48px 0 40px',
        }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(184,150,12,0.12)',
                  border: '1px solid rgba(184,150,12,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Inbox size={16} color={GOLD} />
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  color: GOLD,
                  textTransform: 'uppercase',
                }}
              >
                Inquiry Inbox
              </span>
            </div>
            <h1
              style={{
                fontSize: 'clamp(24px, 3vw, 36px)',
                fontWeight: 300,
                color: '#F5F0E8',
                fontFamily: "'Cormorant Garamond', serif",
                lineHeight: 1.2,
                marginBottom: 10,
              }}
            >
              Client Inquiries
            </h1>
            <p style={{ fontSize: 14, color: '#A89878', maxWidth: 480, lineHeight: 1.6 }}>
              Review, track, and respond to incoming private inquiries from prospective clients.
            </p>

            <div
              style={{
                display: 'flex',
                gap: 16,
                marginTop: 24,
                flexWrap: 'wrap',
              }}
            >
              {[
                { label: 'Total', value: total },
                { label: 'New', value: countByStatus.new, highlight: countByStatus.new > 0 },
                { label: 'In Review', value: countByStatus.in_review },
                { label: 'Closed', value: countByStatus.closed },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    background: stat.highlight ? 'rgba(184,150,12,0.12)' : 'rgba(255,255,255,0.04)',
                    border: stat.highlight
                      ? '1px solid rgba(184,150,12,0.3)'
                      : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    padding: '10px 18px',
                    minWidth: 80,
                  }}
                >
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 600,
                      color: stat.highlight ? GOLD : '#F5F0E8',
                      fontFamily: "'Cormorant Garamond', serif",
                    }}
                  >
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 11, color: '#A89878', marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px 48px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', gap: 6 }}>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  padding: '5px 14px',
                  borderRadius: 20,
                  border:
                    statusFilter === f.value
                      ? `1px solid ${GOLD}`
                      : '1px solid #E8E2D6',
                  background: statusFilter === f.value ? 'rgba(184,150,12,0.1)' : '#fff',
                  color: statusFilter === f.value ? GOLD : '#6B5E47',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => void refetch()}
            disabled={isFetching}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              padding: '5px 12px',
              border: '1px solid #E8E2D6',
              borderRadius: 8,
              background: '#fff',
              color: '#A89878',
              cursor: isFetching ? 'not-allowed' : 'pointer',
              opacity: isFetching ? 0.6 : 1,
            }}
          >
            <RefreshCw size={11} style={isFetching ? { animation: 'spin 1s linear infinite' } : {}} />
            Refresh
          </button>
        </div>

        {isLoading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 0',
              gap: 10,
              color: '#A89878',
            }}
          >
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 13 }}>Loading inquiries…</span>
          </div>
        )}

        {isError && (
          <div
            style={{
              padding: '24px',
              border: '1px solid rgba(220,38,38,0.2)',
              borderRadius: 12,
              background: 'rgba(220,38,38,0.05)',
              color: '#DC2626',
              fontSize: 13,
              textAlign: 'center',
            }}
          >
            Unable to load inquiries. Please check your session and try again.
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              color: '#A89878',
            }}
          >
            <User size={32} color="#D4C8B0" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 14, margin: 0 }}>
              {statusFilter ? `No ${STATUS_FILTERS.find((f) => f.value === statusFilter)?.label.toLowerCase()} inquiries` : 'No inquiries yet'}
            </p>
          </div>
        )}

        {!isLoading &&
          !isError &&
          filtered.map((inquiry, i) => (
            <motion.div
              key={inquiry.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <InquiryRow inquiry={inquiry} />
            </motion.div>
          ))}
      </div>
    </div>
  );
}
