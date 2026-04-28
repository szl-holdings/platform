import {
  type Invoice as BaseInvoice,
  type TimeEntry as BaseTimeEntry,
} from '@/data/operationalData';

export type TimeEntry = BaseTimeEntry & { invoiceId?: string };
export type Invoice = BaseInvoice & {
  entryIds?: string[];
  sentAt?: string;
  sentTo?: string;
  lastSendError?: string;
};

export const GOLD = 'var(--color-gold)';
export const GOLD_HEX: [number, number, number] = [201, 169, 97];
export const INK: [number, number, number] = [26, 26, 20];
export const MUTED: [number, number, number] = [138, 122, 96];
export const RULE: [number, number, number] = [232, 226, 214];

export const RATE_META: Record<TimeEntry['rateType'], { label: string; color: string }> = {
  standard: { label: 'Standard', color: '#0284C7' },
  premium: { label: 'Premium', color: '#7C3AED' },
  fixed: { label: 'Fixed Fee', color: '#D97706' },
  'non-billable': { label: 'Non-Billable', color: '#94A3B8' },
};

export const INVOICE_STATUS: Record<Invoice['status'], { label: string; color: string }> = {
  draft: { label: 'Draft', color: '#94A3B8' },
  sent: { label: 'Sent', color: '#0284C7' },
  paid: { label: 'Paid', color: '#059669' },
  overdue: { label: 'Overdue', color: '#DC2626' },
};

export const ENGAGEMENT_TO_CLIENT: Record<string, string> = {
  'Luminary Brands': 'Luminary Brands',
  'Vertex Capital': 'Vertex Capital Partners',
  'Vertex Capital Partners': 'Vertex Capital Partners',
  'Aurelius PE': 'Aurelius Private Equity',
  'Aurelius Private Equity': 'Aurelius Private Equity',
  'Oasis Wellness': 'Oasis Wellness',
  'Solaris Health': 'Solaris Health Systems',
  Internal: 'Internal',
};

export const CLIENT_EMAIL_KEY = 'carlota-jo:client-emails:v1';

export const DEFAULT_CLIENT_EMAILS: Record<string, string> = {
  'Luminary Brands': 'billing@luminarybrands.example.com',
  'Vertex Capital Partners': 'ap@vertexcapital.example.com',
  'Aurelius Private Equity': 'finance@aurelius-pe.example.com',
  'Oasis Wellness': 'accounts@oasiswellness.example.com',
  'Solaris Health Systems': 'ap@solarishealth.example.com',
};
