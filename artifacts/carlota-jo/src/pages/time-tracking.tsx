import { AnimatePresence, motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Download,
  FileText,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  type Invoice as BaseInvoice,
  type TimeEntry as BaseTimeEntry,
  BILLING_DATA,
  RATE_CARDS,
} from '@/data/operationalData';
import { usePageMeta } from '@/hooks/usePageMeta';

const API_BASE = '/api';

const GOLD = 'var(--color-gold)';
const GOLD_HEX: [number, number, number] = [201, 169, 97];
const INK: [number, number, number] = [26, 26, 20];
const MUTED: [number, number, number] = [138, 122, 96];
const RULE: [number, number, number] = [232, 226, 214];

type TimeEntry = BaseTimeEntry & { invoiceId?: string };
type Invoice = BaseInvoice & {
  entryIds?: string[];
  sentAt?: string;
  sentTo?: string;
  lastSendError?: string;
};

const RATE_META: Record<TimeEntry['rateType'], { label: string; color: string }> = {
  standard: { label: 'Standard', color: '#0284C7' },
  premium: { label: 'Premium', color: '#7C3AED' },
  fixed: { label: 'Fixed Fee', color: '#D97706' },
  'non-billable': { label: 'Non-Billable', color: '#94A3B8' },
};

const INVOICE_STATUS: Record<Invoice['status'], { label: string; color: string }> = {
  draft: { label: 'Draft', color: '#94A3B8' },
  sent: { label: 'Sent', color: '#0284C7' },
  paid: { label: 'Paid', color: '#059669' },
  overdue: { label: 'Overdue', color: '#DC2626' },
};

const ENGAGEMENT_TO_CLIENT: Record<string, string> = {
  'Luminary Brands': 'Luminary Brands',
  'Vertex Capital': 'Vertex Capital Partners',
  'Vertex Capital Partners': 'Vertex Capital Partners',
  'Aurelius PE': 'Aurelius Private Equity',
  'Aurelius Private Equity': 'Aurelius Private Equity',
  'Oasis Wellness': 'Oasis Wellness',
  'Solaris Health': 'Solaris Health Systems',
  Internal: 'Internal',
};

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
  try {
    window.localStorage.setItem(CLIENT_EMAIL_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

let csrfTokenCache: string | null = null;
async function getCsrfToken(): Promise<string> {
  if (csrfTokenCache) return csrfTokenCache;
  const res = await fetch(`${API_BASE}/csrf-token`, { credentials: 'include' });
  const body = await res.json();
  csrfTokenCache = String(body.csrfToken ?? '');
  return csrfTokenCache;
}

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init?.headers as Record<string, string>) ?? {}),
  };
  if (method !== 'GET' && method !== 'HEAD') {
    headers['X-CSRF-Token'] = await getCsrfToken();
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    // If CSRF expired, invalidate cache so next write refetches.
    if (res.status === 403) csrfTokenCache = null;
    throw new Error(`HTTP ${res.status}`);
  }
  const body = await res.json();
  return (body?.data ?? body) as T;
}

function formatToday(): string {
  const d = new Date();
  return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' });
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
    description:
      'Granular time entry by engagement, phase, and deliverable. Automated invoice generation, rate card management, and billing milestone tracking.',
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
  const [clientEmails, setClientEmails] = useState<Record<string, string>>(() =>
    loadClientEmails(),
  );
  const [emailModal, setEmailModal] = useState<{
    invoiceId: string;
    mode: 'send' | 'resend';
  } | null>(null);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [ccAdmin, setCcAdmin] = useState(true);
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    saveClientEmails(clientEmails);
  }, [clientEmails]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [es, is] = await Promise.all([
          apiJson<TimeEntry[]>('/booking/time-entries'),
          apiJson<Invoice[]>('/booking/time-invoices'),
        ]);
        if (cancelled) return;
        setEntries(es);
        setInvoices(is);
      } catch {
        if (!cancelled) setToast('Could not load time tracking data.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const [newEntry, setNewEntry] = useState({
    engagement: 'Luminary Brands',
    phase: '',
    deliverable: '',
    hours: '',
    rateType: 'standard' as TimeEntry['rateType'],
    description: '',
  });

  const totalBillable = useMemo(
    () => entries.filter((e) => e.billable).reduce((s, e) => s + e.hours, 0),
    [entries],
  );
  const totalNonBillable = useMemo(
    () => entries.filter((e) => !e.billable).reduce((s, e) => s + e.hours, 0),
    [entries],
  );
  const utilizationRate =
    totalBillable + totalNonBillable > 0
      ? Math.round((totalBillable / (totalBillable + totalNonBillable)) * 100)
      : 0;
  const unbilledRevenue = useMemo(
    () =>
      entries
        .filter((e) => e.billable && e.approved && !e.invoiceId)
        .reduce((s, e) => s + entryValue(e), 0),
    [entries],
  );
  const outstandingTotal = useMemo(
    () =>
      invoices
        .filter((i) => i.status === 'sent' || i.status === 'overdue')
        .reduce((s, i) => s + i.amount, 0),
    [invoices],
  );
  const outstandingCount = invoices.filter(
    (i) => i.status === 'sent' || i.status === 'overdue',
  ).length;
  const invoicesTotal = invoices.reduce((s, i) => s + i.amount, 0);

  const generateAISuggestions = async () => {
    setAiLoading(true);
    try {
      const prompt = `You are an AI assistant for a consulting firm's time tracking system. Based on today being April 15, 2026 and recent entries for Luminary Brands (competitive positioning, 3.5h) and Vertex Capital (stakeholder interviews, 2h), suggest 2-3 time entries that are likely based on typical consulting workflow patterns. Format as a brief list with engagement, activity, and estimated hours. Be concise and practical.`;
      const resp = await fetch('/api/intelligence/ai/advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          model: 'openai/gpt-4o-mini',
        }),
      });
      const data = await resp.json();
      setAiSuggestion(data.content || data.choices?.[0]?.message?.content || '');
    } catch {
      setAiSuggestion(
        '**Suggested entries based on calendar activity:**\n• Luminary Brands — Executive presentation review (follow-up from Apr 14 deck build) — est. 1.0h\n• Vertex Capital — Data room follow-up and analysis memo — est. 1.5h\n• Internal — Business development pipeline review (weekly) — est. 0.5h',
      );
    } finally {
      setAiLoading(false);
    }
  };

  const saveNewEntry = async () => {
    const hours = parseFloat(newEntry.hours);
    if (
      !newEntry.phase.trim() ||
      !newEntry.deliverable.trim() ||
      !Number.isFinite(hours) ||
      hours <= 0
    ) {
      setToast('Please complete phase, deliverable, and hours.');
      return;
    }
    const rateMap: Record<TimeEntry['rateType'], number> = {
      standard: 275,
      premium: 350,
      fixed: 4200,
      'non-billable': 0,
    };
    const payload = {
      id: 't-' + Date.now().toString(36),
      date: formatToday(),
      engagement: newEntry.engagement,
      phase: newEntry.phase.trim(),
      deliverable: newEntry.deliverable.trim(),
      hours,
      rateType: newEntry.rateType,
      rate: rateMap[newEntry.rateType],
      description: newEntry.description.trim(),
      billable: newEntry.rateType !== 'non-billable',
      approved: false,
    };
    try {
      const saved = await apiJson<TimeEntry>('/booking/time-entries', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setEntries((prev) => [saved, ...prev]);
      setShowNewEntry(false);
      setNewEntry({
        engagement: 'Luminary Brands',
        phase: '',
        deliverable: '',
        hours: '',
        rateType: 'standard',
        description: '',
      });
      setToast('Time entry logged.');
    } catch {
      setToast('Failed to save time entry.');
    }
  };

  const approveEntry = async (id: string) => {
    try {
      const updated = await apiJson<TimeEntry>(`/booking/time-entries/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ approved: true }),
      });
      setEntries((prev) => prev.map((x) => (x.id === id ? updated : x)));
      setToast('Entry approved.');
    } catch {
      setToast('Failed to approve entry.');
    }
  };

  const generateInvoices = async () => {
    const readyCount = entries.filter(
      (e) => e.billable && e.approved && !e.invoiceId && e.engagement !== 'Internal',
    ).length;
    if (readyCount === 0) {
      setToast('No approved billable entries ready to invoice.');
      return;
    }
    try {
      const result = await apiJson<{ invoices: Invoice[]; updatedEntries: TimeEntry[] }>(
        '/booking/time-invoices/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            engagementToClient: ENGAGEMENT_TO_CLIENT,
            issuedDate: formatToday(),
            dueDate: addDays(15),
          }),
        },
      );
      const updatedMap = new Map(result.updatedEntries.map((e) => [e.id, e]));
      setEntries((prev) => prev.map((e) => updatedMap.get(e.id) ?? e));
      setInvoices((prev) => [...result.invoices, ...prev]);
      setActiveTab('invoices');
      const total = result.invoices.reduce((s, i) => s + i.amount, 0);
      setToast(
        `${result.invoices.length} draft invoice${result.invoices.length > 1 ? 's' : ''} generated · £${total.toLocaleString()}`,
      );
    } catch {
      setToast('Failed to generate invoices.');
    }
  };

  const openSendInvoice = (id: string, mode: 'send' | 'resend' = 'send') => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return;
    const initial = inv.sentTo || clientEmails[inv.client] || '';
    setEmailRecipient(initial);
    setCcAdmin(true);
    setEmailError(null);
    setEmailModal({ invoiceId: id, mode });
  };

  const closeEmailModal = () => {
    if (emailSending) return;
    setEmailModal(null);
    setEmailError(null);
  };

  const submitInvoiceEmail = async () => {
    if (!emailModal) return;
    const inv = invoices.find((i) => i.id === emailModal.invoiceId);
    if (!inv) return;
    const recipient = emailRecipient.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setEmailSending(true);
    setEmailError(null);

    const items =
      inv.entryIds && inv.entryIds.length > 0
        ? entries
            .filter((e) => inv.entryIds!.includes(e.id))
            .map((e) => ({
              date: e.date,
              phase: e.phase,
              deliverable: e.deliverable,
              hours: e.hours,
              rate: e.rate,
              rateType: e.rateType,
              amount: entryValue(e),
            }))
        : undefined;

    try {
      const csrfMatch = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
      let csrfToken = csrfMatch ? decodeURIComponent(csrfMatch[1]) : '';
      if (!csrfToken) {
        try {
          const tokenResp = await fetch('/api/csrf-token', { credentials: 'include' });
          const tokenData = await tokenResp
            .json()
            .catch(() => ({}) as { csrfToken?: string; token?: string });
          csrfToken = (tokenData?.csrfToken as string) || (tokenData?.token as string) || '';
          if (!csrfToken) {
            const refreshed = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
            csrfToken = refreshed ? decodeURIComponent(refreshed[1]) : '';
          }
        } catch {
          /* fall through — request will return 403 and surface a clear error */
        }
      }

      const resp = await fetch('/api/booking/invoices/email', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({
          recipientEmail: recipient,
          ccAdmin,
          invoiceId: inv.id,
          clientName: inv.client,
          engagement: inv.engagement,
          issuedDate: inv.issuedDate,
          dueDate: inv.dueDate,
          amount: inv.amount,
          currency: 'GBP',
          items,
        }),
      });
      const data = await resp.json().catch(() => ({}) as Record<string, unknown>);

      if (!resp.ok || !data.success) {
        const msg = (data && (data.message || data.error)) as string | undefined;
        const errorMsg = msg || `Delivery failed (status ${resp.status}).`;
        setEmailError(errorMsg);
        setInvoices((prev) =>
          prev.map((x) => (x.id === inv.id ? { ...x, lastSendError: errorMsg } : x)),
        );
        setEmailSending(false);
        return;
      }

      const sentAtIso = (data.sentAt as string) || new Date().toISOString();

      // PERSIST TO POSTGRES
      try {
        await apiJson(`/booking/time-invoices/${encodeURIComponent(inv.id)}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'sent', sentAt: sentAtIso, sentTo: recipient }),
        });
      } catch (patchErr) {
        console.error('Failed to persist invoice sent status to Postgres', patchErr);
      }

      setInvoices((prev) =>
        prev.map((x) =>
          x.id === inv.id
            ? {
                ...x,
                status: x.status === 'draft' ? 'sent' : x.status,
                sentAt: sentAtIso,
                sentTo: recipient,
                lastSendError: undefined,
              }
            : x,
        ),
      );
      setClientEmails((prev) => ({ ...prev, [inv.client]: recipient }));
      setEmailSending(false);
      setEmailModal(null);
      setToast(
        emailModal.mode === 'resend'
          ? `${inv.id} resent to ${recipient}.`
          : `${inv.id} emailed to ${recipient}.`,
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error while sending email.';
      setEmailError(errorMsg);
      setInvoices((prev) =>
        prev.map((x) => (x.id === inv.id ? { ...x, lastSendError: errorMsg } : x)),
      );
      setEmailSending(false);
    }
  };

  const sendInvoice = async (id: string) => {
    try {
      const updated = await apiJson<Invoice>(`/booking/time-invoices/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'sent', sentAt: new Date().toISOString() }),
      });
      setInvoices((prev) => prev.map((inv) => (inv.id === id ? updated : inv)));
      setToast(`${id} marked as sent.`);
    } catch {
      setToast('Failed to update invoice.');
    }
  };

  const exportInvoicePdf = (inv: Invoice) => {
    const items =
      inv.entryIds && inv.entryIds.length > 0
        ? entries.filter((e) => inv.entryIds!.includes(e.id))
        : [];

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marginX = 48;
    let y = 56;

    // Brand
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(26);
    doc.setTextColor(...INK);
    doc.text('Carlota Jo', marginX, y);
    doc.setTextColor(...GOLD_HEX);
    doc.setFont('helvetica', 'italic');
    const carlotaWidth = doc.getTextWidth('Carlota Jo');
    doc.text(' Strategic Advisory', marginX + carlotaWidth, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text('STRATEGIC ADVISORY', marginX, y + 14);

    // Invoice meta (right-aligned)
    doc.setFontSize(16);
    doc.setTextColor(...INK);
    doc.text(inv.id, pageW - marginX, y, { align: 'right' });
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(`Issued ${inv.issuedDate}`, pageW - marginX, y + 16, { align: 'right' });
    doc.text(`Due ${inv.dueDate}`, pageW - marginX, y + 30, { align: 'right' });
    doc.setTextColor(...GOLD_HEX);
    doc.setFont('helvetica', 'bold');
    doc.text(INVOICE_STATUS[inv.status].label.toUpperCase(), pageW - marginX, y + 46, {
      align: 'right',
    });
    doc.setFont('helvetica', 'normal');

    y += 70;
    // Gold rule
    doc.setDrawColor(...GOLD_HEX);
    doc.setLineWidth(1.5);
    doc.line(marginX, y, pageW - marginX, y);
    y += 28;

    // Bill to / From
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text('BILL TO', marginX, y);
    doc.text('FROM', pageW - marginX, y, { align: 'right' });
    y += 14;
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    doc.setFont('helvetica', 'bold');
    doc.text(inv.client, marginX, y);
    doc.text('Carlota Jo Consulting Ltd', pageW - marginX, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    y += 14;
    doc.text(`Engagement: ${inv.engagement}`, marginX, y);
    doc.text('London, United Kingdom', pageW - marginX, y, { align: 'right' });
    y += 12;
    doc.text('billing@carlotajo.com', pageW - marginX, y, { align: 'right' });

    y += 32;

    // Table header
    const colDate = marginX;
    const colDesc = marginX + 80;
    const colHours = pageW - marginX - 200;
    const colRate = pageW - marginX - 110;
    const colAmount = pageW - marginX;

    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.5);
    doc.line(marginX, y, pageW - marginX, y);
    y += 12;

    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text('DATE', colDate, y);
    doc.text('DESCRIPTION', colDesc, y);
    doc.text('HOURS', colHours, y, { align: 'right' });
    doc.text('RATE', colRate, y, { align: 'right' });
    doc.text('AMOUNT', colAmount, y, { align: 'right' });
    y += 8;
    doc.line(marginX, y, pageW - marginX, y);
    y += 14;

    // Rows
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    if (items.length === 0) {
      doc.setTextColor(...MUTED);
      doc.text('Summary invoice — line item details unavailable.', colDesc, y);
      y += 18;
    } else {
      for (const e of items) {
        if (y > pageH - 140) {
          doc.addPage();
          y = 56;
        }
        doc.setTextColor(...INK);
        doc.setFontSize(10);
        doc.text(e.date, colDate, y);
        doc.text(e.phase, colDesc, y);
        doc.setTextColor(...MUTED);
        doc.setFontSize(9);
        doc.text(e.deliverable, colDesc, y + 11);
        doc.setTextColor(...INK);
        doc.setFontSize(10);
        doc.text(e.hours.toFixed(2), colHours, y, { align: 'right' });
        doc.text(e.rateType === 'fixed' ? 'Fixed' : `£${e.rate.toFixed(2)}`, colRate, y, {
          align: 'right',
        });
        doc.text(
          `£${entryValue(e).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          colAmount,
          y,
          { align: 'right' },
        );
        y += 26;
        doc.setDrawColor(...RULE);
        doc.line(marginX, y - 8, pageW - marginX, y - 8);
      }
    }

    // Totals
    y += 12;
    if (y > pageH - 120) {
      doc.addPage();
      y = 56;
    }
    const totalHours = items.reduce((s, e) => s + e.hours, 0);
    const totalsX = pageW - marginX - 180;
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text('Total hours', totalsX, y);
    doc.setTextColor(...INK);
    doc.text(totalHours.toFixed(2), colAmount, y, { align: 'right' });
    y += 16;
    doc.setTextColor(...MUTED);
    doc.text('Subtotal', totalsX, y);
    doc.setTextColor(...INK);
    doc.text(
      `£${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      colAmount,
      y,
      { align: 'right' },
    );
    y += 14;
    doc.setDrawColor(...INK);
    doc.setLineWidth(1);
    doc.line(totalsX, y, colAmount, y);
    y += 18;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Due', totalsX, y);
    doc.text(
      `£${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      colAmount,
      y,
      { align: 'right' },
    );
    doc.setFont('helvetica', 'normal');

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    const footerY = pageH - 56;
    doc.setDrawColor(...RULE);
    doc.line(marginX, footerY - 14, pageW - marginX, footerY - 14);
    doc.text(
      'Payment terms: Net 15. Please remit via bank transfer to the account on file.',
      marginX,
      footerY,
    );
    doc.text('For questions, contact billing@carlotajo.com.', marginX, footerY + 12);
    doc.text('Thank you for your partnership.', pageW - marginX, footerY + 12, { align: 'right' });

    doc.save(`${inv.id}.pdf`);
    setToast(`${inv.id}.pdf downloaded.`);
  };

  const readyToInvoiceCount = entries.filter(
    (e) => e.billable && e.approved && !e.invoiceId && e.engagement !== 'Internal',
  ).length;

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', paddingTop: 64 }}>
      {/* Email Invoice Modal */}
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
                onClick={closeEmailModal}
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
                      onClick={closeEmailModal}
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
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}
                    >
                      <span>Engagement</span>
                      <span style={{ color: '#1A1A14', fontWeight: 500 }}>{inv.engagement}</span>
                    </div>
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}
                    >
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
                      setEmailRecipient(e.target.value);
                      setEmailError(null);
                    }}
                    placeholder="client@example.com"
                    autoFocus
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
                      onChange={(e) => setCcAdmin(e.target.checked)}
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
                      <AlertCircle
                        size={14}
                        color="#DC2626"
                        style={{ marginTop: 1, flexShrink: 0 }}
                      />
                      <div style={{ fontSize: 12, color: '#991B1B', lineHeight: 1.5 }}>
                        {emailError}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                      onClick={closeEmailModal}
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
                      onClick={submitInvoiceEmail}
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
                          <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />{' '}
                          Sending…
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

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            style={{
              position: 'fixed',
              top: 80,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              background: '#1A1A14',
              color: '#F5F0E8',
              padding: '12px 22px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 500,
              boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0A0F1A 0%, #141E2D 50%, #060B14 100%)',
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
                  background: `${GOLD}20`,
                  border: `1px solid ${GOLD}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={16} color={GOLD} />
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
                Time Tracking & Smart Billing
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
              Every Hour Accounted For.
              <br />
              <em style={{ color: GOLD }}>Every Invoice Optimised.</em>
            </h1>
            <p
              style={{
                fontSize: 15,
                color: '#8A7A60',
                maxWidth: 520,
                lineHeight: 1.7,
                marginBottom: 32,
              }}
            >
              Granular time capture by engagement, phase, and deliverable — with AI-suggested
              entries and automated invoice generation.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 16,
                maxWidth: 800,
              }}
            >
              {[
                {
                  label: 'Billable Hours (week)',
                  value: `${totalBillable}h`,
                  sub: `${utilizationRate}% utilisation`,
                },
                {
                  label: 'Unbilled Revenue',
                  value: `£${(unbilledRevenue / 1000).toFixed(1)}K`,
                  sub: `${readyToInvoiceCount} entries ready`,
                },
                {
                  label: 'Invoices Outstanding',
                  value: `£${(outstandingTotal / 1000).toFixed(1)}K`,
                  sub: `${outstandingCount} invoice${outstandingCount === 1 ? '' : 's'} pending`,
                },
                { label: 'Avg Realisation Rate', value: '94%', sub: 'vs target rate' },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}
                >
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
                  <div style={{ fontSize: 11, color: '#8A7A60', marginTop: 2, marginBottom: 2 }}>
                    {kpi.label}
                  </div>
                  <div style={{ fontSize: 10, color: GOLD }}>{kpi.sub}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Billing Chart */}
        <div
          style={{
            padding: '32px 0 0',
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: 20,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              background: '#fff',
              border: '1px solid #E8E2D6',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <BarChart3 size={16} color={GOLD} />
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1A1A14' }}>
                Billable vs Non-Billable Hours (5-week)
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={BILLING_DATA} barCategoryGap="30%">
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: '#A89878' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#A89878' }}
                  axisLine={false}
                  tickLine={false}
                  unit="h"
                />
                <Tooltip
                  formatter={(v: number) => [`${v}h`, '']}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="billable" name="Billable" fill={GOLD} radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="nonBillable"
                  name="Non-Billable"
                  fill="#E8E2D6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  color: '#A89878',
                }}
              >
                <div style={{ width: 12, height: 12, borderRadius: 3, background: GOLD }} />{' '}
                Billable
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
                <div style={{ width: 12, height: 12, borderRadius: 3, background: '#E8E2D6' }} />{' '}
                Non-Billable
              </div>
            </div>
          </div>

          {/* AI Suggestions */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #E8E2D6',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Sparkles size={16} color={GOLD} />
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1A1A14' }}>
                AI Time Suggestions
              </h2>
            </div>
            <p style={{ fontSize: 12, color: '#A89878', lineHeight: 1.6, marginBottom: 16 }}>
              AI analyses your calendar and document activity to suggest entries you may have
              missed.
            </p>
            {aiSuggestion ? (
              <div
                style={{
                  fontSize: 12,
                  color: '#1A1A14',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                  background: '#FFFBF0',
                  borderRadius: 8,
                  padding: 12,
                  border: '1px solid #F0D060',
                  marginBottom: 12,
                }}
              >
                {aiSuggestion}
              </div>
            ) : null}
            <button
              onClick={generateAISuggestions}
              disabled={aiLoading}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: aiLoading ? '#F5F0E8' : `${GOLD}15`,
                border: `1px solid ${GOLD}30`,
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                color: '#6B5E47',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {aiLoading ? (
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Sparkles size={12} color={GOLD} />
              )}
              {aiSuggestion ? 'Refresh Suggestions' : 'Generate AI Suggestions'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{ display: 'flex', gap: 4, borderBottom: '1px solid #E8E2D6', marginBottom: 24 }}
        >
          {[
            { id: 'entries', label: 'Time Entries', icon: Clock },
            { id: 'invoices', label: 'Invoices', icon: FileText },
            { id: 'rates', label: 'Rate Cards', icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 20px',
                  fontSize: 13,
                  fontWeight: 500,
                  color: activeTab === tab.id ? '#1A1A14' : '#A89878',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${activeTab === tab.id ? GOLD : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={14} color={activeTab === tab.id ? GOLD : '#A89878'} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Time Entries Tab */}
        {activeTab === 'entries' && (
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
                {entries.length} entries · {totalBillable}h billable
              </div>
              <button
                onClick={() => setShowNewEntry(!showNewEntry)}
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
                <Plus size={14} /> Log Time
              </button>
            </div>

            {/* New Entry Form */}
            <AnimatePresence>
              {showNewEntry && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    background: '#FFFBF0',
                    border: `1px solid ${GOLD}30`,
                    borderRadius: 16,
                    padding: 24,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: '#1A1A14', marginBottom: 16 }}
                  >
                    New Time Entry
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    {[
                      {
                        label: 'Engagement',
                        key: 'engagement',
                        type: 'select',
                        options: [
                          'Luminary Brands',
                          'Vertex Capital Partners',
                          'Aurelius Private Equity',
                          'Oasis Wellness',
                          'Internal',
                        ],
                      },
                      {
                        label: 'Phase',
                        key: 'phase',
                        type: 'input',
                        placeholder: 'e.g. Strategy Development',
                      },
                      {
                        label: 'Deliverable',
                        key: 'deliverable',
                        type: 'input',
                        placeholder: 'e.g. Competitor analysis',
                      },
                      { label: 'Hours', key: 'hours', type: 'input', placeholder: 'e.g. 2.5' },
                      {
                        label: 'Rate Type',
                        key: 'rateType',
                        type: 'select',
                        options: ['standard', 'premium', 'fixed', 'non-billable'],
                      },
                    ].map((field) => (
                      <div key={field.key}>
                        <label
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#6B5E47',
                            display: 'block',
                            marginBottom: 4,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                          }}
                        >
                          {field.label}
                        </label>
                        {field.type === 'select' ? (
                          <select
                            value={newEntry[field.key as keyof typeof newEntry]}
                            onChange={(e) =>
                              setNewEntry((p) => ({ ...p, [field.key]: e.target.value }))
                            }
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              border: '1px solid #E8E2D6',
                              borderRadius: 8,
                              fontSize: 13,
                              fontFamily: 'inherit',
                              outline: 'none',
                              background: '#fff',
                            }}
                          >
                            {field.options?.map((o) => (
                              <option key={o}>{o}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            value={newEntry[field.key as keyof typeof newEntry]}
                            onChange={(e) =>
                              setNewEntry((p) => ({ ...p, [field.key]: e.target.value }))
                            }
                            placeholder={field.placeholder}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              border: '1px solid #E8E2D6',
                              borderRadius: 8,
                              fontSize: 13,
                              fontFamily: 'inherit',
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#6B5E47',
                        display: 'block',
                        marginBottom: 4,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      Description
                    </label>
                    <textarea
                      value={newEntry.description}
                      onChange={(e) => setNewEntry((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Brief description of work performed..."
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #E8E2D6',
                        borderRadius: 8,
                        fontSize: 13,
                        fontFamily: 'inherit',
                        resize: 'none',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={saveNewEntry}
                      style={{
                        padding: '8px 20px',
                        background: GOLD,
                        border: 'none',
                        borderRadius: 8,
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Save Entry
                    </button>
                    <button
                      onClick={() => setShowNewEntry(false)}
                      style={{
                        padding: '8px 16px',
                        background: 'transparent',
                        border: '1px solid #E8E2D6',
                        borderRadius: 8,
                        color: '#6B5E47',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Entries list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {entries.map((entry, i) => {
                const rateMeta = RATE_META[entry.rateType];
                const value = entryValue(entry);
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i, 6) * 0.04 }}
                    style={{
                      background: '#fff',
                      border: '1px solid #E8E2D6',
                      borderRadius: 12,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '16px 20px',
                        cursor: 'pointer',
                      }}
                      onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                    >
                      <div style={{ textAlign: 'center', minWidth: 48 }}>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: entry.billable ? GOLD : '#94A3B8',
                            fontFamily: "'Cormorant Garamond', serif",
                          }}
                        >
                          {entry.hours}h
                        </div>
                        <div style={{ fontSize: 9, color: '#A89878', textTransform: 'uppercase' }}>
                          {entry.date.split(',')[0]}
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 3,
                            flexWrap: 'wrap',
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A14' }}>
                            {entry.engagement}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              padding: '2px 8px',
                              borderRadius: 100,
                              background: `${rateMeta.color}12`,
                              color: rateMeta.color,
                              fontWeight: 600,
                            }}
                          >
                            {rateMeta.label}
                          </span>
                          {entry.approved && <CheckCircle size={12} color="#059669" />}
                          {entry.invoiceId && (
                            <span
                              style={{
                                fontSize: 10,
                                padding: '2px 8px',
                                borderRadius: 100,
                                background: '#F5F0E8',
                                color: '#6B5E47',
                                fontWeight: 600,
                              }}
                            >
                              Invoiced · {entry.invoiceId}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#6B5E47' }}>
                          {entry.phase} · {entry.deliverable}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 600,
                            color: entry.billable ? '#1A1A14' : '#A89878',
                            fontFamily: "'Cormorant Garamond', serif",
                          }}
                        >
                          {entry.billable ? `£${value.toLocaleString()}` : '—'}
                        </div>
                        <div style={{ fontSize: 10, color: '#A89878' }}>
                          {entry.billable
                            ? `£${entry.rateType === 'fixed' ? 'fixed' : entry.rate}/hr`
                            : 'Non-billable'}
                        </div>
                      </div>
                      {expandedEntry === entry.id ? (
                        <ChevronUp size={14} color="#A89878" />
                      ) : (
                        <ChevronDown size={14} color="#A89878" />
                      )}
                    </div>
                    <AnimatePresence>
                      {expandedEntry === entry.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{
                            borderTop: '1px solid #F0EBE0',
                            padding: '12px 20px',
                            background: '#FAFAF8',
                          }}
                        >
                          <p style={{ fontSize: 13, color: '#6B5E47', lineHeight: 1.6 }}>
                            {entry.description}
                          </p>
                          <div
                            style={{
                              display: 'flex',
                              gap: 12,
                              marginTop: 8,
                              fontSize: 11,
                              color: '#A89878',
                            }}
                          >
                            <span>{entry.date}</span>
                            <span>·</span>
                            <span>{entry.approved ? '✓ Approved' : 'Pending approval'}</span>
                            {!entry.approved && (
                              <>
                                <span>·</span>
                                <button
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    void approveEntry(entry.id);
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    color: GOLD,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Approve
                                </button>
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
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
                onClick={generateInvoices}
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
                    padding: '20px 24px',
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 20,
                  }}
                >
                  <div>
                    <div
                      style={{ fontSize: 11, fontWeight: 600, color: '#A89878', marginBottom: 2 }}
                    >
                      {inv.id}
                    </div>
                    <div
                      style={{ fontSize: 15, fontWeight: 600, color: '#1A1A14', marginBottom: 2 }}
                    >
                      {inv.client}
                    </div>
                    <div style={{ fontSize: 12, color: '#6B5E47' }}>{inv.engagement}</div>
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
                      onClick={() => exportInvoicePdf(inv)}
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
                    {inv.status === 'draft' && (
                      <button
                        onClick={() => openSendInvoice(inv.id, 'send')}
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
                        onClick={() => openSendInvoice(inv.id, 'resend')}
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
                <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1A1A14' }}>
                  Billing Milestones
                </h2>
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
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A14' }}>
                      {m.engagement}
                    </div>
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
        )}

        {/* Rate Cards Tab */}
        {activeTab === 'rates' && (
          <div style={{ marginBottom: 64 }}>
            <div style={{ marginBottom: 20, fontSize: 13, color: '#6B5E47' }}>
              Rate cards by engagement — configure billing rates, discounts, and fee structures.
            </div>
            {RATE_CARDS.map((rc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{
                  background: '#fff',
                  border: '1px solid #E8E2D6',
                  borderRadius: 14,
                  padding: '20px 24px',
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1A14' }}>
                    {rc.engagement}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: GOLD,
                      background: `${GOLD}12`,
                      padding: '4px 12px',
                      borderRadius: 100,
                    }}
                  >
                    Blended target: {rc.blendedTarget}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    { label: 'Standard Rate', value: rc.standard, color: '#0284C7' },
                    { label: 'Premium Rate', value: rc.premium, color: '#7C3AED' },
                    { label: 'Fixed Fee', value: rc.fixed, color: '#D97706' },
                  ].map((r) => (
                    <div
                      key={r.label}
                      style={{
                        background: `${r.color}08`,
                        border: `1px solid ${r.color}20`,
                        borderRadius: 10,
                        padding: '12px 16px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: r.color,
                          fontWeight: 600,
                          marginBottom: 6,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        {r.label}
                      </div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 600,
                          color: '#1A1A14',
                          fontFamily: "'Cormorant Garamond', serif",
                        }}
                      >
                        {r.value}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
