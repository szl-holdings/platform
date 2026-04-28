import { AnimatePresence, motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { BarChart3, Clock, DollarSign, FileText, Loader2, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BILLING_DATA } from '@/data/operationalData';
import { usePageMeta } from '@/hooks/usePageMeta';
import { apiJson } from '@/lib/api';
import {
  ENGAGEMENT_TO_CLIENT,
  GOLD,
  GOLD_HEX,
  INK,
  INVOICE_STATUS,
  MUTED,
  RULE,
  type Invoice,
  type TimeEntry,
} from './time-tracking/constants';
import { EmailModal } from './time-tracking/email-modal';
import { EntriesTab } from './time-tracking/entries-tab';
import { InvoicesTab } from './time-tracking/invoices-tab';
import { RatesTab } from './time-tracking/rates-tab';

const CLIENT_EMAIL_KEY = 'carlota-jo:client-emails:v1';
const DEFAULT_CLIENT_EMAILS: Record<string, string> = {
  'Luminary Brands': 'billing@luminarybrands.example.com',
  'Vertex Capital Partners': 'ap@vertexcapital.example.com',
  'Aurelius Private Equity': 'finance@aurelius-pe.example.com',
  'Oasis Wellness': 'accounts@oasiswellness.example.com',
  'Solaris Health Systems': 'ap@solarishealth.example.com',
};

function loadClientEmails(): Record<string, string> {
  if (typeof window === 'undefined') return { ...DEFAULT_CLIENT_EMAILS };
  try {
    const raw = window.localStorage.getItem(CLIENT_EMAIL_KEY);
    if (!raw) return { ...DEFAULT_CLIENT_EMAILS };
    return { ...DEFAULT_CLIENT_EMAILS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CLIENT_EMAILS };
  }
}

function saveClientEmails(map: Record<string, string>) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(CLIENT_EMAIL_KEY, JSON.stringify(map)); } catch { /* ignore */ }
}

function formatToday(): string {
  return new Date().toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' });
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' });
}

function entryValue(e: TimeEntry): number {
  if (!e.billable) return 0;
  if (e.rateType === 'fixed') return e.rate;
  return e.hours * e.rate;
}

export default function TimeTracking() {
  usePageMeta({
    title: 'Time Tracking & Smart Billing | Carlota Jo',
    description: 'Granular time entry by engagement, phase, and deliverable. Automated invoice generation, rate card management, and billing milestone tracking.',
    canonical: 'https://szlholdings.com/carlota-jo/time-tracking',
  });

  const [activeTab, setActiveTab] = useState<'entries' | 'invoices' | 'rates'>('entries');
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clientEmails, setClientEmails] = useState<Record<string, string>>(() => loadClientEmails());
  const [emailModal, setEmailModal] = useState<{ invoiceId: string; mode: 'send' | 'resend' } | null>(null);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [ccAdmin, setCcAdmin] = useState(true);
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [historyExpandedId, setHistoryExpandedId] = useState<string | null>(null);
  const [emailLogsByInvoice, setEmailLogsByInvoice] = useState<Record<string, Array<{ id: number; status: string; recipient: string; sentAt: string; error?: string; messageId?: string }>>>({});
  const [emailLogsLoading, setEmailLogsLoading] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState({ engagement: 'Luminary Brands', phase: '', deliverable: '', hours: '', rateType: 'standard' as TimeEntry['rateType'], description: '' });

  useEffect(() => { saveClientEmails(clientEmails); }, [clientEmails]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [es, is] = await Promise.all([apiJson<TimeEntry[]>('/booking/time-entries'), apiJson<Invoice[]>('/booking/time-invoices')]);
        if (cancelled) return;
        setEntries(es);
        setInvoices(is);
      } catch { if (!cancelled) setToast('Could not load time tracking data.'); }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const totalBillable = useMemo(() => entries.filter((e) => e.billable).reduce((s, e) => s + e.hours, 0), [entries]);
  const totalNonBillable = useMemo(() => entries.filter((e) => !e.billable).reduce((s, e) => s + e.hours, 0), [entries]);
  const utilizationRate = totalBillable + totalNonBillable > 0 ? Math.round((totalBillable / (totalBillable + totalNonBillable)) * 100) : 0;
  const unbilledRevenue = useMemo(() => entries.filter((e) => e.billable && e.approved && !e.invoiceId).reduce((s, e) => s + entryValue(e), 0), [entries]);
  const outstandingTotal = useMemo(() => invoices.filter((i) => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + i.amount, 0), [invoices]);
  const outstandingCount = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue').length;
  const invoicesTotal = invoices.reduce((s, i) => s + i.amount, 0);
  const readyToInvoiceCount = entries.filter((e) => e.billable && e.approved && !e.invoiceId && e.engagement !== 'Internal').length;

  const generateAISuggestions = async () => {
    setAiLoading(true);
    try {
      const prompt = `You are an AI assistant for a consulting firm's time tracking system. Based on today being April 15, 2026 and recent entries for Luminary Brands (competitive positioning, 3.5h) and Vertex Capital (stakeholder interviews, 2h), suggest 2-3 time entries that are likely based on typical consulting workflow patterns. Format as a brief list with engagement, activity, and estimated hours. Be concise and practical.`;
      const resp = await fetch('/api/intelligence/ai/advisory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], model: 'openai/gpt-4o-mini' }) });
      const data = await resp.json();
      setAiSuggestion(data.content || data.choices?.[0]?.message?.content || '');
    } catch {
      setAiSuggestion('**Suggested entries based on calendar activity:**\n• Luminary Brands — Executive presentation review (follow-up from Apr 14 deck build) — est. 1.0h\n• Vertex Capital — Data room follow-up and analysis memo — est. 1.5h\n• Internal — Business development pipeline review (weekly) — est. 0.5h');
    } finally { setAiLoading(false); }
  };

  const saveNewEntry = async () => {
    const hours = parseFloat(newEntry.hours);
    if (!newEntry.phase.trim() || !newEntry.deliverable.trim() || !Number.isFinite(hours) || hours <= 0) { setToast('Please complete phase, deliverable, and hours.'); return; }
    const rateMap: Record<TimeEntry['rateType'], number> = { standard: 275, premium: 350, fixed: 4200, 'non-billable': 0 };
    const payload = { id: `t-${Date.now().toString(36)}`, date: formatToday(), engagement: newEntry.engagement, phase: newEntry.phase.trim(), deliverable: newEntry.deliverable.trim(), hours, rateType: newEntry.rateType, rate: rateMap[newEntry.rateType], description: newEntry.description.trim(), billable: newEntry.rateType !== 'non-billable', approved: false };
    try {
      const saved = await apiJson<TimeEntry>('/booking/time-entries', { method: 'POST', body: JSON.stringify(payload) });
      setEntries((prev) => [saved, ...prev]);
      setShowNewEntry(false);
      setNewEntry({ engagement: 'Luminary Brands', phase: '', deliverable: '', hours: '', rateType: 'standard', description: '' });
      setToast('Time entry logged.');
    } catch { setToast('Failed to save time entry.'); }
  };

  const approveEntry = async (id: string) => {
    try {
      const updated = await apiJson<TimeEntry>(`/booking/time-entries/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ approved: true }) });
      setEntries((prev) => prev.map((x) => (x.id === id ? updated : x)));
      setToast('Entry approved.');
    } catch { setToast('Failed to approve entry.'); }
  };

  const generateInvoices = async () => {
    if (readyToInvoiceCount === 0) { setToast('No approved billable entries ready to invoice.'); return; }
    try {
      const result = await apiJson<{ invoices: Invoice[]; updatedEntries: TimeEntry[] }>('/booking/time-invoices/generate', { method: 'POST', body: JSON.stringify({ engagementToClient: ENGAGEMENT_TO_CLIENT, issuedDate: formatToday(), dueDate: addDays(15) }) });
      const updatedMap = new Map(result.updatedEntries.map((e) => [e.id, e]));
      setEntries((prev) => prev.map((e) => updatedMap.get(e.id) ?? e));
      setInvoices((prev) => [...result.invoices, ...prev]);
      setActiveTab('invoices');
      const total = result.invoices.reduce((s, i) => s + i.amount, 0);
      setToast(`${result.invoices.length} draft invoice${result.invoices.length > 1 ? 's' : ''} generated · £${total.toLocaleString()}`);
    } catch { setToast('Failed to generate invoices.'); }
  };

  const openSendInvoice = (id: string, mode: 'send' | 'resend' = 'send') => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return;
    setEmailRecipient(inv.sentTo || clientEmails[inv.client] || '');
    setCcAdmin(true);
    setEmailError(null);
    setEmailModal({ invoiceId: id, mode });
  };

  const closeEmailModal = () => { if (emailSending) return; setEmailModal(null); setEmailError(null); };

  const toggleSendHistory = async (invoiceId: string) => {
    if (historyExpandedId === invoiceId) { setHistoryExpandedId(null); return; }
    setHistoryExpandedId(invoiceId);
    if (emailLogsByInvoice[invoiceId]) return;
    setEmailLogsLoading(invoiceId);
    try {
      const logs = await apiJson<Array<{ id: number; status: string; recipient: string; sentAt: string; error?: string; messageId?: string }>>(`/booking/invoices/email-log/${encodeURIComponent(invoiceId)}`);
      setEmailLogsByInvoice((prev) => ({ ...prev, [invoiceId]: logs }));
    } catch { setEmailLogsByInvoice((prev) => ({ ...prev, [invoiceId]: [] })); }
    finally { setEmailLogsLoading(null); }
  };

  const submitInvoiceEmail = async () => {
    if (!emailModal) return;
    const inv = invoices.find((i) => i.id === emailModal.invoiceId);
    if (!inv) return;
    const recipient = emailRecipient.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) { setEmailError('Please enter a valid email address.'); return; }
    setEmailSending(true);
    setEmailError(null);
    const items = inv.entryIds?.length ? entries.filter((e) => inv.entryIds?.includes(e.id)).map((e) => ({ date: e.date, phase: e.phase, deliverable: e.deliverable, hours: e.hours, rate: e.rate, rateType: e.rateType, amount: entryValue(e) })) : undefined;
    try {
      const csrfMatch = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
      let csrfToken = csrfMatch ? decodeURIComponent(csrfMatch[1]) : '';
      if (!csrfToken) {
        try {
          const tokenResp = await fetch('/api/csrf-token', { credentials: 'include' });
          const tokenData = await tokenResp.json().catch(() => ({}) as { csrfToken?: string; token?: string });
          csrfToken = (tokenData?.csrfToken as string) || (tokenData?.token as string) || '';
          if (!csrfToken) { const refreshed = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/); csrfToken = refreshed ? decodeURIComponent(refreshed[1]) : ''; }
        } catch { /* fall through */ }
      }
      const resp = await fetch('/api/booking/invoices/email', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken }, body: JSON.stringify({ recipientEmail: recipient, ccAdmin, invoiceId: inv.id, clientName: inv.client, engagement: inv.engagement, issuedDate: inv.issuedDate, dueDate: inv.dueDate, amount: inv.amount, currency: 'GBP', items }) });
      const data = await resp.json().catch(() => ({}) as Record<string, unknown>);
      if (!resp.ok || !data.success) {
        const msg = (data && (data.message || data.error)) as string | undefined;
        const errorMsg = msg || `Delivery failed (status ${resp.status}).`;
        setEmailError(errorMsg);
        setInvoices((prev) => prev.map((x) => (x.id === inv.id ? { ...x, lastSendError: errorMsg } : x)));
        setEmailSending(false);
        return;
      }
      const sentAtIso = (data.sentAt as string) || new Date().toISOString();
      try { await apiJson(`/booking/time-invoices/${encodeURIComponent(inv.id)}`, { method: 'PATCH', body: JSON.stringify({ status: 'sent', sentAt: sentAtIso, sentTo: recipient }) }); } catch { /* ignore patch failure */ }
      setInvoices((prev) => prev.map((x) => x.id === inv.id ? { ...x, status: x.status === 'draft' ? 'sent' : x.status, sentAt: sentAtIso, sentTo: recipient, lastSendError: undefined } : x));
      setClientEmails((prev) => ({ ...prev, [inv.client]: recipient }));
      setEmailSending(false);
      setEmailModal(null);
      setToast(emailModal.mode === 'resend' ? `${inv.id} resent to ${recipient}.` : `${inv.id} emailed to ${recipient}.`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error while sending email.';
      setEmailError(errorMsg);
      setInvoices((prev) => prev.map((x) => (x.id === inv.id ? { ...x, lastSendError: errorMsg } : x)));
      setEmailSending(false);
    }
  };

  const exportInvoicePdf = (inv: Invoice) => {
    const items = inv.entryIds?.length ? entries.filter((e) => inv.entryIds?.includes(e.id)) : [];
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marginX = 48;
    let y = 56;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(26); doc.setTextColor(...INK); doc.text('Carlota Jo', marginX, y);
    doc.setTextColor(...GOLD_HEX); doc.setFont('helvetica', 'italic');
    doc.text(' Strategic Advisory', marginX + doc.getTextWidth('Carlota Jo'), y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED); doc.text('STRATEGIC ADVISORY', marginX, y + 14);
    doc.setFontSize(16); doc.setTextColor(...INK); doc.text(inv.id, pageW - marginX, y, { align: 'right' });
    doc.setFontSize(10); doc.setTextColor(...MUTED);
    doc.text(`Issued ${inv.issuedDate}`, pageW - marginX, y + 16, { align: 'right' });
    doc.text(`Due ${inv.dueDate}`, pageW - marginX, y + 30, { align: 'right' });
    doc.setTextColor(...GOLD_HEX); doc.setFont('helvetica', 'bold');
    doc.text(INVOICE_STATUS[inv.status].label.toUpperCase(), pageW - marginX, y + 46, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += 70;
    doc.setDrawColor(...GOLD_HEX); doc.setLineWidth(1.5); doc.line(marginX, y, pageW - marginX, y); y += 28;
    doc.setFontSize(8); doc.setTextColor(...MUTED); doc.text('BILL TO', marginX, y); doc.text('FROM', pageW - marginX, y, { align: 'right' }); y += 14;
    doc.setFontSize(12); doc.setTextColor(...INK); doc.setFont('helvetica', 'bold');
    doc.text(inv.client, marginX, y); doc.text('Carlota Jo Consulting Ltd', pageW - marginX, y, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...MUTED); y += 14;
    doc.text(`Engagement: ${inv.engagement}`, marginX, y); doc.text('London, United Kingdom', pageW - marginX, y, { align: 'right' }); y += 12;
    doc.text('billing@carlotajo.com', pageW - marginX, y, { align: 'right' }); y += 32;
    const colDate = marginX, colDesc = marginX + 80, colHours = pageW - marginX - 200, colRate = pageW - marginX - 110, colAmount = pageW - marginX;
    doc.setDrawColor(...RULE); doc.setLineWidth(0.5); doc.line(marginX, y, pageW - marginX, y); y += 12;
    doc.setFontSize(8); doc.setTextColor(...MUTED);
    doc.text('DATE', colDate, y); doc.text('DESCRIPTION', colDesc, y); doc.text('HOURS', colHours, y, { align: 'right' }); doc.text('RATE', colRate, y, { align: 'right' }); doc.text('AMOUNT', colAmount, y, { align: 'right' }); y += 8;
    doc.line(marginX, y, pageW - marginX, y); y += 14;
    doc.setFontSize(10); doc.setTextColor(...INK);
    if (items.length === 0) { doc.setTextColor(...MUTED); doc.text('Summary invoice — line item details unavailable.', colDesc, y); y += 18; }
    else {
      for (const e of items) {
        if (y > pageH - 140) { doc.addPage(); y = 56; }
        doc.setTextColor(...INK); doc.setFontSize(10);
        doc.text(e.date, colDate, y); doc.text(e.phase, colDesc, y);
        doc.setTextColor(...MUTED); doc.setFontSize(9); doc.text(e.deliverable, colDesc, y + 11);
        doc.setTextColor(...INK); doc.setFontSize(10);
        doc.text(e.hours.toFixed(2), colHours, y, { align: 'right' });
        doc.text(e.rateType === 'fixed' ? 'Fixed' : `£${e.rate.toFixed(2)}`, colRate, y, { align: 'right' });
        doc.text(`£${entryValue(e).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, colAmount, y, { align: 'right' });
        y += 26; doc.setDrawColor(...RULE); doc.line(marginX, y - 8, pageW - marginX, y - 8);
      }
    }
    y += 12; if (y > pageH - 120) { doc.addPage(); y = 56; }
    const totalHours = items.reduce((s, e) => s + e.hours, 0);
    const totalsX = pageW - marginX - 180;
    doc.setFontSize(10); doc.setTextColor(...MUTED); doc.text('Total hours', totalsX, y); doc.setTextColor(...INK); doc.text(totalHours.toFixed(2), colAmount, y, { align: 'right' }); y += 16;
    doc.setTextColor(...MUTED); doc.text('Subtotal', totalsX, y); doc.setTextColor(...INK); doc.text(`£${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, colAmount, y, { align: 'right' }); y += 14;
    doc.setDrawColor(...INK); doc.setLineWidth(1); doc.line(totalsX, y, colAmount, y); y += 18;
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text('Total Due', totalsX, y); doc.text(`£${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, colAmount, y, { align: 'right' }); doc.setFont('helvetica', 'normal');
    const footerY = pageH - 56;
    doc.setFontSize(9); doc.setTextColor(...MUTED); doc.setDrawColor(...RULE); doc.line(marginX, footerY - 14, pageW - marginX, footerY - 14);
    doc.text('Payment terms: Net 15. Please remit via bank transfer to the account on file.', marginX, footerY);
    doc.text('For questions, contact billing@carlotajo.com.', marginX, footerY + 12);
    doc.text('Thank you for your partnership.', pageW - marginX, footerY + 12, { align: 'right' });
    doc.save(`${inv.id}.pdf`);
    setToast(`${inv.id}.pdf downloaded.`);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', paddingTop: 64 }}>
      <EmailModal
        emailModal={emailModal}
        invoices={invoices}
        emailRecipient={emailRecipient}
        ccAdmin={ccAdmin}
        emailSending={emailSending}
        emailError={emailError}
        onClose={closeEmailModal}
        onRecipientChange={setEmailRecipient}
        onErrorChange={setEmailError}
        onCcAdminChange={setCcAdmin}
        onSubmit={submitInvoiceEmail}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: '#1A1A14', color: '#F5F0E8', padding: '12px 22px', borderRadius: 10, fontSize: 13, fontWeight: 500, boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0A0F1A 0%, #141E2D 50%, #060B14 100%)', padding: '48px 0 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${GOLD}20`, border: `1px solid ${GOLD}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={16} color={GOLD} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', color: GOLD, textTransform: 'uppercase' }}>Time Tracking & Smart Billing</span>
            </div>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 300, color: '#F5F0E8', fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.1, marginBottom: 12 }}>
              Every Hour Accounted For.<br /><em style={{ color: GOLD }}>Every Invoice Optimised.</em>
            </h1>
            <p style={{ fontSize: 15, color: '#8A7A60', maxWidth: 520, lineHeight: 1.7, marginBottom: 32 }}>
              Granular time capture by engagement, phase, and deliverable — with AI-suggested entries and automated invoice generation.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, maxWidth: 800 }}>
              {[
                { label: 'Billable Hours (week)', value: `${totalBillable}h`, sub: `${utilizationRate}% utilisation` },
                { label: 'Unbilled Revenue', value: `£${(unbilledRevenue / 1000).toFixed(1)}K`, sub: `${readyToInvoiceCount} entries ready` },
                { label: 'Invoices Outstanding', value: `£${(outstandingTotal / 1000).toFixed(1)}K`, sub: `${outstandingCount} invoice${outstandingCount === 1 ? '' : 's'} pending` },
                { label: 'Avg Realisation Rate', value: '94%', sub: 'vs target rate' },
              ].map((kpi) => (
                <div key={kpi.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontSize: 22, fontWeight: 600, color: '#F5F0E8', fontFamily: "'Cormorant Garamond', serif" }}>{kpi.value}</div>
                  <div style={{ fontSize: 11, color: '#8A7A60', marginTop: 2, marginBottom: 2 }}>{kpi.label}</div>
                  <div style={{ fontSize: 10, color: GOLD }}>{kpi.sub}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Billing Chart + AI Suggestions */}
        <div style={{ padding: '32px 0 0', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 32 }}>
          <div style={{ background: '#fff', border: '1px solid #E8E2D6', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <BarChart3 size={16} color={GOLD} />
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1A1A14' }}>Billable vs Non-Billable Hours (5-week)</h2>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={BILLING_DATA} barCategoryGap="30%">
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#A89878' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#A89878' }} axisLine={false} tickLine={false} unit="h" />
                <Tooltip formatter={(v: number) => [`${v}h`, '']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="billable" name="Billable" fill={GOLD} radius={[4, 4, 0, 0]} />
                <Bar dataKey="nonBillable" name="Non-Billable" fill="#E8E2D6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              {[{ label: 'Billable', color: GOLD }, { label: 'Non-Billable', color: '#E8E2D6' }].map((l) => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#A89878' }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color }} /> {l.label}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #E8E2D6', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Sparkles size={16} color={GOLD} />
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1A1A14' }}>AI Time Suggestions</h2>
            </div>
            <p style={{ fontSize: 12, color: '#A89878', lineHeight: 1.6, marginBottom: 16 }}>AI analyses your calendar and document activity to suggest entries you may have missed.</p>
            {aiSuggestion && (
              <div style={{ fontSize: 12, color: '#1A1A14', lineHeight: 1.7, whiteSpace: 'pre-wrap', background: '#FFFBF0', borderRadius: 8, padding: 12, border: '1px solid #F0D060', marginBottom: 12 }}>{aiSuggestion}</div>
            )}
            <button
              onClick={generateAISuggestions}
              disabled={aiLoading}
              style={{ width: '100%', padding: '10px 16px', background: aiLoading ? '#F5F0E8' : `${GOLD}15`, border: `1px solid ${GOLD}30`, borderRadius: 10, fontSize: 12, fontWeight: 600, color: '#6B5E47', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {aiLoading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={12} color={GOLD} />}
              {aiSuggestion ? 'Refresh Suggestions' : 'Generate AI Suggestions'}
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #E8E2D6', marginBottom: 24 }}>
          {[{ id: 'entries', label: 'Time Entries', icon: Clock }, { id: 'invoices', label: 'Invoices', icon: FileText }, { id: 'rates', label: 'Rate Cards', icon: DollarSign }].map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', fontSize: 13, fontWeight: 500, color: activeTab === tab.id ? '#1A1A14' : '#A89878', background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === tab.id ? GOLD : 'transparent'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                <Icon size={14} color={activeTab === tab.id ? GOLD : '#A89878'} /> {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'entries' && (
          <EntriesTab
            entries={entries}
            showNewEntry={showNewEntry}
            newEntry={newEntry}
            expandedEntry={expandedEntry}
            aiLoading={aiLoading}
            aiSuggestion={aiSuggestion}
            totalBillable={totalBillable}
            onToggleNewEntry={() => setShowNewEntry(!showNewEntry)}
            onNewEntryChange={(u) => setNewEntry((prev) => ({ ...prev, ...u }))}
            onSave={saveNewEntry}
            onCancelNew={() => setShowNewEntry(false)}
            onToggleExpand={(id) => setExpandedEntry(expandedEntry === id ? null : id)}
            onApprove={approveEntry}
            onGenerateAI={generateAISuggestions}
            entryValue={entryValue}
          />
        )}
        {activeTab === 'invoices' && (
          <InvoicesTab
            invoices={invoices}
            invoicesTotal={invoicesTotal}
            readyToInvoiceCount={readyToInvoiceCount}
            historyExpandedId={historyExpandedId}
            emailLogsByInvoice={emailLogsByInvoice}
            emailLogsLoading={emailLogsLoading}
            onGenerate={generateInvoices}
            onOpenSend={openSendInvoice}
            onToggleHistory={toggleSendHistory}
            onExportPdf={exportInvoicePdf}
          />
        )}
        {activeTab === 'rates' && <RatesTab />}
      </div>
    </div>
  );
}
