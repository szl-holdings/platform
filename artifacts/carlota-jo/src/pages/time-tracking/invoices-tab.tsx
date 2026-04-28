import { motion } from 'framer-motion';
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { GOLD, INVOICE_STATUS, type Invoice } from './constants';

interface EmailLog {
  id: number;
  status: string;
  recipient: string;
  sentAt: string;
  error?: string;
  messageId?: string;
}

interface Props {
  invoices: Invoice[];
  invoicesTotal: number;
  readyToInvoiceCount: number;
  historyExpandedId: string | null;
  emailLogsByInvoice: Record<string, EmailLog[]>;
  emailLogsLoading: string | null;
  onGenerate: () => void;
  onOpenSend: (id: string, mode: 'send' | 'resend') => void;
  onToggleHistory: (id: string) => void;
  onExportPdf: (inv: Invoice) => void;
}

export function InvoicesTab({
  invoices,
  invoicesTotal,
  readyToInvoiceCount,
  historyExpandedId,
  emailLogsByInvoice,
  emailLogsLoading,
  onGenerate,
  onOpenSend,
  onToggleHistory,
  onExportPdf,
}: Props) {
  return (
    <div style={{ marginBottom: 64 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 13, color: '#6B5E47' }}>
          {invoices.length} invoice{invoices.length === 1 ? '' : 's'} · £
          {invoicesTotal.toLocaleString()} total · {readyToInvoiceCount} entries ready
        </div>
        <button
          onClick={onGenerate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 18px',
            background: GOLD,
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={14} /> Generate Invoice
        </button>
      </div>

      {invoices.map((inv, i) => {
        const statusMeta = INVOICE_STATUS[inv.status];
        const historyOpen = historyExpandedId === inv.id;
        const logs = emailLogsByInvoice[inv.id];
        const logsLoading = emailLogsLoading === inv.id;
        const hasSendHistory = !!(inv.sentAt || inv.lastSendError);
        return (
          <motion.div
            key={inv.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 6) * 0.06 }}
            style={{
              background: '#fff',
              border: `1px solid ${inv.status === 'overdue' ? '#DC262620' : '#E8E2D6'}`,
              borderRadius: 14,
              marginBottom: 10,
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#A89878', marginBottom: 2 }}>
                  {inv.id}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1A14', marginBottom: 2 }}>
                  {inv.client}
                </div>
                <div style={{ fontSize: 12, color: '#6B5E47' }}>{inv.engagement}</div>
                {inv.lastSendError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <AlertCircle size={11} color="#DC2626" />
                    <span style={{ fontSize: 11, color: '#DC2626' }}>Last send failed</span>
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#A89878', marginBottom: 2 }}>Issued</div>
                <div style={{ fontSize: 12, color: '#6B5E47' }}>{inv.issuedDate}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#A89878', marginBottom: 2 }}>Due</div>
                <div
                  style={{
                    fontSize: 12,
                    color: inv.status === 'overdue' ? '#DC2626' : '#6B5E47',
                  }}
                >
                  {inv.dueDate}
                </div>
              </div>
              <div style={{ textAlign: 'right', minWidth: 80 }}>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: '#1A1A14',
                    fontFamily: "'Cormorant Garamond', serif",
                  }}
                >
                  £{inv.amount.toLocaleString()}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 100,
                    background: `${statusMeta.color}12`,
                    color: statusMeta.color,
                  }}
                >
                  {statusMeta.label}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => onExportPdf(inv)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #E8E2D6',
                    borderRadius: 8,
                    background: '#F5F0E8',
                    fontSize: 11,
                    color: '#6B5E47',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Download size={11} /> PDF
                </button>
                {hasSendHistory && (
                  <button
                    onClick={() => onToggleHistory(inv.id)}
                    title="View send history"
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #E8E2D6',
                      borderRadius: 8,
                      background: historyOpen ? '#F5F0E8' : 'transparent',
                      fontSize: 11,
                      color: '#6B5E47',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Clock size={11} />
                    {historyOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  </button>
                )}
                {inv.status === 'draft' && (
                  <button
                    onClick={() => onOpenSend(inv.id, 'send')}
                    style={{
                      padding: '6px 12px',
                      background: GOLD,
                      border: 'none',
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Mail size={11} /> Email
                  </button>
                )}
                {(inv.status === 'sent' || inv.status === 'overdue') && (
                  <button
                    onClick={() => onOpenSend(inv.id, 'resend')}
                    title={
                      inv.sentTo
                        ? `Last sent to ${inv.sentTo}${inv.sentAt ? ` on ${new Date(inv.sentAt).toLocaleDateString()}` : ''}`
                        : 'Resend invoice'
                    }
                    style={{
                      padding: '6px 12px',
                      background: 'transparent',
                      border: `1px solid ${GOLD}`,
                      borderRadius: 8,
                      color: '#6B5E47',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <RefreshCw size={11} color={GOLD} /> Resend
                  </button>
                )}
              </div>
            </div>
            {historyOpen && (
              <div
                style={{
                  borderTop: '1px solid #E8E2D6',
                  padding: '12px 24px 16px',
                  background: '#FDFAF5',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#A89878',
                    marginBottom: 10,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Send History
                </div>
                {logsLoading ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: '#A89878',
                      fontSize: 12,
                    }}
                  >
                    <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
                  </div>
                ) : !logs || logs.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#A89878', fontStyle: 'italic' }}>
                    No server-side send records yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12 }}
                      >
                        {log.status === 'sent' ? (
                          <AlertCircle
                            size={13}
                            color="#059669"
                            style={{ flexShrink: 0, marginTop: 1 }}
                          />
                        ) : (
                          <AlertCircle
                            size={13}
                            color="#DC2626"
                            style={{ flexShrink: 0, marginTop: 1 }}
                          />
                        )}
                        <div>
                          <span
                            style={{
                              color: log.status === 'sent' ? '#059669' : '#DC2626',
                              fontWeight: 600,
                            }}
                          >
                            {log.status === 'sent' ? 'Sent' : 'Failed'}
                          </span>
                          {' · '}
                          <span style={{ color: '#6B5E47' }}>{log.recipient}</span>
                          {' · '}
                          <span style={{ color: '#A89878' }}>
                            {new Date(log.sentAt).toLocaleString()}
                          </span>
                          {log.error && (
                            <div style={{ color: '#DC2626', fontSize: 11, marginTop: 2 }}>
                              {log.error}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        );
      })}

      {/* Milestone billing */}
      <div
        style={{
          marginTop: 32,
          background: '#fff',
          border: '1px solid #E8E2D6',
          borderRadius: 16,
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Calendar size={16} color={GOLD} />
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1A1A14' }}>Billing Milestones</h2>
        </div>
        {[
          {
            engagement: 'Vertex Capital Partners',
            milestone: 'Phase 1 Completion',
            amount: '£8,250',
            due: 'Apr 30, 2026',
            status: 'upcoming',
          },
          {
            engagement: 'Luminary Brands',
            milestone: 'Strategy Delivery',
            amount: '£14,875',
            due: 'Apr 22, 2026',
            status: 'due',
          },
          {
            engagement: 'Solaris Health Systems',
            milestone: 'Engagement Kickoff (50%)',
            amount: '£22,000',
            due: 'Jul 1, 2026',
            status: 'future',
          },
        ].map((m, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '12px 0',
              borderBottom: i < 2 ? '1px solid #F0EBE0' : 'none',
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background:
                  m.status === 'due' ? '#D97706' : m.status === 'upcoming' ? GOLD : '#E8E2D6',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A14' }}>{m.engagement}</div>
              <div style={{ fontSize: 12, color: '#6B5E47' }}>{m.milestone}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: GOLD,
                  fontFamily: "'Cormorant Garamond', serif",
                }}
              >
                {m.amount}
              </div>
              <div style={{ fontSize: 11, color: '#A89878' }}>Due {m.due}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
