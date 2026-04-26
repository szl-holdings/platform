/**
 * net30-collections-pdf.ts
 *
 * Generates a collections packet PDF for a NET-30 invoice flagged for collections.
 * The packet includes: invoice cover, line items, payment history, credit memos,
 * dunning communication log, and customer detail.
 * Uses the existing report-engine brand system (neutral theme).
 */

import type {
  Net30CreditMemo,
  Net30DunningLog,
  Net30Invoice,
  Net30LineItem,
  Net30Payment,
} from '@szl-holdings/db';
import PDFDocument from 'pdfkit';

function fmt(amount: string | number, currency = 'USD'): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(n);
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export interface CollectionsPacketOptions {
  invoice: Net30Invoice;
  orgName: string;
  lineItems: Net30LineItem[];
  payments: Net30Payment[];
  creditMemos: Net30CreditMemo[];
  dunningLog: Net30DunningLog[];
}

export async function generateNet30CollectionsPacket(
  opts: CollectionsPacketOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const { invoice, orgName, lineItems, payments, creditMemos, dunningLog } = opts;

    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const primary = '#1e3a5f';
    const muted = '#64748b';
    const danger = '#dc2626';
    const text = '#0f172a';
    const w = doc.page.width - 100;

    function rule(y: number): void {
      doc.moveTo(50, y).lineTo(50 + w, y).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
    }

    function sectionHeader(title: string): void {
      doc.moveDown(1);
      doc.fontSize(8).fillColor(muted).font('Helvetica').text(title.toUpperCase(), { characterSpacing: 1.5 });
      rule(doc.y + 4);
      doc.moveDown(0.5);
    }

    function kv(label: string, value: string): void {
      doc.fontSize(9).fillColor(muted).font('Helvetica').text(label, { continued: true, width: 160 });
      doc.fillColor(text).font('Helvetica').text(value);
    }

    // ── Cover ───────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 8).fill(danger);

    doc.fontSize(9).fillColor(muted).font('Helvetica').text(orgName.toUpperCase(), 50, 30, { characterSpacing: 2 });

    doc.fontSize(22).fillColor(text).font('Helvetica-Bold').text('COLLECTIONS PACKET', 50, 55);
    doc.fontSize(11).fillColor(muted).font('Helvetica').text(`Invoice ${invoice.invoiceNumber}  ·  Generated ${fmtDate(new Date())}`, 50, 82);

    rule(105);
    doc.moveDown(1.2);

    // ── Invoice Summary ──────────────────────────────────────────────────────
    sectionHeader('Invoice Summary');

    kv('Customer', invoice.customerName);
    if (invoice.customerEmail) kv('Email', invoice.customerEmail);
    kv('Invoice Number', invoice.invoiceNumber);
    if (invoice.poNumber) kv('PO Number', invoice.poNumber);
    kv('Terms', invoice.terms + (invoice.customTermsDays ? ` (${invoice.customTermsDays} days)` : ''));
    kv('Issued Date', fmtDate(invoice.issuedDate));
    kv('Due Date', fmtDate(invoice.dueDate));
    kv('Sent Date', fmtDate(invoice.sentAt));
    kv('Collections Date', fmtDate(invoice.collectionsAt));
    kv('Status', invoice.status.toUpperCase());

    doc.moveDown(0.5);
    kv('Invoice Total', fmt(invoice.totalAmount, invoice.currency));
    kv('Paid Amount', fmt(invoice.paidAmount, invoice.currency));
    kv('Credits Applied', fmt(invoice.creditApplied, invoice.currency));

    doc.fontSize(10).fillColor(danger).font('Helvetica-Bold').text(
      `Outstanding Balance: ${fmt(invoice.outstandingBalance, invoice.currency)}`,
      { align: 'left' },
    );

    // ── Line Items ────────────────────────────────────────────────────────────
    sectionHeader('Line Items');
    const colW = [w * 0.42, w * 0.12, w * 0.18, w * 0.15, w * 0.13];
    const headers = ['Description', 'Qty', 'Unit Price', 'Total', 'Taxable'];

    let lx = 50;
    doc.fontSize(7.5).fillColor(muted).font('Helvetica-Bold');
    headers.forEach((h, i) => {
      doc.text(h.toUpperCase(), lx, doc.y, { width: colW[i], continued: i < headers.length - 1 });
      lx += colW[i];
    });
    doc.moveDown(0.3);
    rule(doc.y);

    for (const item of lineItems) {
      lx = 50;
      doc.fontSize(8.5).fillColor(text).font('Helvetica');
      const rowY = doc.y + 4;
      const cols = [
        item.description,
        String(item.quantity),
        fmt(item.unitPrice, invoice.currency),
        fmt(item.lineTotal, invoice.currency),
        item.taxable ? 'Yes' : 'No',
      ];
      cols.forEach((c, i) => {
        doc.text(c, lx, rowY, { width: colW[i], continued: i < cols.length - 1 });
        lx += colW[i];
      });
      doc.moveDown(0.2);
    }

    // ── Payment History ───────────────────────────────────────────────────────
    sectionHeader('Payment History');

    if (payments.length === 0) {
      doc.fontSize(9).fillColor(muted).font('Helvetica').text('No payments recorded.');
    } else {
      for (const p of payments) {
        kv(`${fmtDate(p.paidAt)} — ${p.method.toUpperCase()}`, fmt(p.amount, p.currency));
        if (p.reference) doc.fontSize(8).fillColor(muted).font('Helvetica').text(`   Reference: ${p.reference}`);
      }
    }

    // ── Credit Memos ──────────────────────────────────────────────────────────
    sectionHeader('Credit Memos');

    if (creditMemos.length === 0) {
      doc.fontSize(9).fillColor(muted).font('Helvetica').text('No credit memos applied.');
    } else {
      for (const cm of creditMemos) {
        kv(`${cm.memoNumber} — ${fmtDate(cm.appliedAt)}`, fmt(cm.amount, cm.currency));
        if (cm.description) doc.fontSize(8).fillColor(muted).font('Helvetica').text(`   ${cm.description}`);
      }
    }

    // ── Dunning Communication Log ─────────────────────────────────────────────
    sectionHeader('Dunning Communication Log');

    if (dunningLog.length === 0) {
      doc.fontSize(9).fillColor(muted).font('Helvetica').text('No dunning reminders dispatched.');
    } else {
      for (const entry of dunningLog) {
        const status = entry.success ? '✓ Delivered' : '✗ Failed';
        doc.fontSize(8.5).fillColor(text).font('Helvetica').text(
          `Step ${entry.step}  ·  ${fmtDate(entry.dispatchedAt)}  ·  ${entry.daysOverdue}d overdue  →  ${entry.recipient}  [${status}]`,
        );
        if (!entry.success && entry.error) {
          doc.fontSize(7.5).fillColor(danger).text(`   Error: ${entry.error}`);
        }
        doc.moveDown(0.15);
      }
    }

    // ── Notes ─────────────────────────────────────────────────────────────────
    if (invoice.notes) {
      sectionHeader('Invoice Notes');
      doc.fontSize(9).fillColor(text).font('Helvetica').text(invoice.notes);
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 55;
    rule(footerY - 10);
    doc.fontSize(7.5).fillColor(muted).font('Helvetica').text(
      `Collections Packet · ${orgName} · Generated ${new Date().toISOString()}  ·  CONFIDENTIAL`,
      50,
      footerY,
      { width: w, align: 'center' },
    );

    doc.end();
  });
}
