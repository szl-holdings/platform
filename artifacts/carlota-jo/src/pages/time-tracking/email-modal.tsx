import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Loader2, Mail, X } from 'lucide-react';
import { GOLD, type Invoice } from './constants';

interface Props {
  emailModal: { invoiceId: string; mode: 'send' | 'resend' } | null;
  invoices: Invoice[];
  emailRecipient: string;
  ccAdmin: boolean;
  emailSending: boolean;
  emailError: string | null;
  onClose: () => void;
  onRecipientChange: (v: string) => void;
  onErrorChange: (v: string | null) => void;
  onCcAdminChange: (v: boolean) => void;
  onSubmit: () => void;
}

export function EmailModal({
  emailModal,
  invoices,
  emailRecipient,
  ccAdmin,
  emailSending,
  emailError,
  onClose,
  onRecipientChange,
  onErrorChange,
  onCcAdminChange,
  onSubmit,
}: Props) {
  return (
    <AnimatePresence>
      {emailModal &&
        (() => {
          const inv = invoices.find((i) => i.id === emailModal.invoiceId);
          if (!inv) return null;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(10, 15, 26, 0.55)',
                zIndex: 1100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  width: '100%',
                  maxWidth: 480,
                  padding: 28,
                  boxShadow: '0 30px 60px rgba(0,0,0,0.25)',
                  border: '1px solid #E8E2D6',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 20,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: `${GOLD}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Mail size={18} color={GOLD} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1A14' }}>
                        {emailModal.mode === 'resend' ? 'Resend Invoice' : 'Email Invoice'}
                      </div>
                      <div style={{ fontSize: 12, color: '#A89878' }}>
                        {inv.id} · {inv.client}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    disabled={emailSending}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 6,
                      cursor: emailSending ? 'not-allowed' : 'pointer',
                      color: '#A89878',
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div
                  style={{
                    background: '#FAFAF8',
                    border: '1px solid #F0EBE0',
                    borderRadius: 10,
                    padding: '12px 14px',
                    marginBottom: 18,
                    fontSize: 12,
                    color: '#6B5E47',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Engagement</span>
                    <span style={{ color: '#1A1A14', fontWeight: 500 }}>{inv.engagement}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Due</span>
                    <span style={{ color: '#1A1A14', fontWeight: 500 }}>{inv.dueDate}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Amount</span>
                    <span
                      style={{
                        color: '#1A1A14',
                        fontWeight: 700,
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 14,
                      }}
                    >
                      £{inv.amount.toLocaleString()}
                    </span>
                  </div>
                  {inv.sentAt && emailModal.mode === 'resend' && (
                    <div
                      style={{
                        marginTop: 8,
                        paddingTop: 8,
                        borderTop: '1px solid #F0EBE0',
                        fontSize: 11,
                        color: '#A89878',
                      }}
                    >
                      Last sent {new Date(inv.sentAt).toLocaleString()}
                      {inv.sentTo ? ` to ${inv.sentTo}` : ''}.
                    </div>
                  )}
                </div>

                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#6B5E47',
                    display: 'block',
                    marginBottom: 6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={emailRecipient}
                  onChange={(e) => {
                    onRecipientChange(e.target.value);
                    onErrorChange(null);
                  }}
                  placeholder="client@example.com"
                  disabled={emailSending}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${emailError ? '#DC2626' : '#E8E2D6'}`,
                    borderRadius: 10,
                    fontSize: 13,
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxSizing: 'border-box',
                    marginBottom: 12,
                  }}
                />

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    color: '#6B5E47',
                    cursor: 'pointer',
                    marginBottom: 12,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={ccAdmin}
                    onChange={(e) => onCcAdminChange(e.target.checked)}
                    disabled={emailSending}
                  />
                  Send a copy to the billing team
                </label>

                {emailError && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      padding: '10px 12px',
                      background: '#FEF2F2',
                      border: '1px solid #FCA5A5',
                      borderRadius: 8,
                      marginBottom: 12,
                    }}
                  >
                    <AlertCircle size={14} color="#DC2626" style={{ marginTop: 1, flexShrink: 0 }} />
                    <div style={{ fontSize: 12, color: '#991B1B', lineHeight: 1.5 }}>
                      {emailError}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button
                    onClick={onClose}
                    disabled={emailSending}
                    style={{
                      padding: '9px 18px',
                      background: 'transparent',
                      border: '1px solid #E8E2D6',
                      borderRadius: 8,
                      color: '#6B5E47',
                      fontSize: 12,
                      cursor: emailSending ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onSubmit}
                    disabled={emailSending}
                    style={{
                      padding: '9px 20px',
                      background: GOLD,
                      border: 'none',
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: emailSending ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      opacity: emailSending ? 0.8 : 1,
                    }}
                  >
                    {emailSending ? (
                      <>
                        <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Sending…
                      </>
                    ) : (
                      <>
                        <Mail size={12} />{' '}
                        {emailModal.mode === 'resend' ? 'Resend Invoice' : 'Send Invoice'}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
    </AnimatePresence>
  );
}
