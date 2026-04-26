/**
 * tax-engine.ts
 *
 * Tax automation layer that extends Stripe Tax defaults.
 *
 * Decision pipeline (highest priority first):
 *  1. Manual invoice override       → source = 'override'
 *  2. Product/invoice category override → source = 'override'
 *  3. Valid exemption certificate   → source = 'exempt'
 *  4. B2B reverse-charge VAT        → source = 'reverse_charge'
 *  5. Stripe Tax (pass-through)     → source = 'stripe_tax'
 *
 * Every decision is persisted to billing_tax_calculations with a
 * tamper-detection SHA-256 hash over the input snapshot.
 */

import crypto from 'node:crypto';
import { and, desc, eq, gt, inArray, isNull, lte, or } from 'drizzle-orm';
import {
  billingTaxCalculationsTable,
  db,
  taxCategoryOverridesTable,
  taxExemptionCertificatesTable,
  taxIdsTable,
} from '@szl-holdings/db';
import { logger } from './logger';

// ─── EU / UK VAT jurisdictions for reverse-charge detection ──────────────────

const EU_MEMBER_STATES = new Set([
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR',
  'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO',
  'SE', 'SI', 'SK',
]);

const UK_CODE = 'GB';

function isEuOrUk(countryCode: string): boolean {
  return EU_MEMBER_STATES.has(countryCode.toUpperCase()) || countryCode.toUpperCase() === UK_CODE;
}

// ─── Per-jurisdiction tax ID format validation ────────────────────────────────
// Patterns and rules enforced before any record is persisted.  The goal is to
// catch obvious typos early rather than let VIES or downstream systems reject
// them silently.  Each entry may include a regex for the raw value and an
// optional description that surfaces to API callers.

interface TaxIdFormatSpec {
  /** Regex the raw taxIdValue must satisfy (after normalising whitespace/dashes). */
  pattern: RegExp;
  description: string;
}

const TAX_ID_FORMAT_SPECS: Record<string, TaxIdFormatSpec> = {
  // EU VAT: 2-letter country prefix + 2–12 alphanumeric chars (VIES format)
  eu_vat: { pattern: /^[A-Z]{2}[0-9A-Z]{2,12}$/, description: '2-letter country code + 2–12 alphanumeric (e.g. DE123456789)' },
  // GB VAT: GB + 9 digits (standard) or 12 digits (branch), or GD/HA + 3 digits
  gb_vat: { pattern: /^GB([0-9]{9}([0-9]{3})?|[A-Z]{2}[0-9]{3})$/, description: 'GB followed by 9 or 12 digits (e.g. GB304764220)' },
  // Australian Business Number: 11 digits
  au_gst: { pattern: /^[0-9]{11}$/, description: '11-digit Australian Business Number (e.g. 51824753556)' },
  // US Employer Identification Number: XX-XXXXXXX
  us_ein: { pattern: /^[0-9]{2}-?[0-9]{7}$/, description: 'XX-XXXXXXX format (e.g. 12-3456789)' },
  // US resale certificate: at least 4 alphanumeric chars (state-specific formats vary widely)
  us_resale: { pattern: /^[0-9A-Z-]{4,50}$/i, description: 'Alphanumeric, 4–50 chars (state-specific format)' },
  // Canadian Business Number: 9 digits optionally followed by RT + 4 digits
  ca_gst: { pattern: /^[0-9]{9}(RT[0-9]{4})?$/, description: '9-digit BN, optionally followed by RT0001 (e.g. 123456789RT0001)' },
  ca_hst: { pattern: /^[0-9]{9}(RT[0-9]{4})?$/, description: '9-digit BN, optionally followed by RT0001 (e.g. 123456789RT0001)' },
  // Generic "other" — minimal check: 2–50 printable non-whitespace chars
  other: { pattern: /^\S{2,50}$/, description: '2–50 non-whitespace characters' },
};

/**
 * Returns an error string if `value` does not satisfy the format rules for
 * `taxIdType`, or `null` if the value is valid.  Strips surrounding whitespace
 * and converts to upper-case before checking.
 */
export function validateTaxIdFormat(taxIdType: string, value: string): string | null {
  const normalised = value.trim().toUpperCase().replace(/\s+/g, '');
  const spec = TAX_ID_FORMAT_SPECS[taxIdType];
  if (!spec) return null; // unknown type — allow, VIES will reject if invalid
  if (!spec.pattern.test(normalised)) {
    return `Invalid format for ${taxIdType}: expected ${spec.description}`;
  }
  return null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type TaxSource = 'stripe_tax' | 'override' | 'reverse_charge' | 'exempt' | 'demo';

export interface TaxInput {
  orgId: number;
  invoiceId?: string;
  productId?: string;
  sellerCountry: string;
  customerCountry: string;
  customerIsB2B?: boolean;
  amountExclusive?: number;
  currency?: string;
  manualOverride?: {
    taxRate: number;
    reasonCode: string;
    description?: string;
  };
}

export interface TaxDecision {
  source: TaxSource;
  taxRate: number;
  taxAmountExclusive: number;
  currency: string;
  jurisdiction: string;
  taxType: string;
  reverseCharge: boolean;
  exemptionApplied?: string;
  overrideReason?: string;
  lineItemDescriptor?: string;
}

// ─── Tamper hash ──────────────────────────────────────────────────────────────

export function computeTamperHash(input: TaxInput, decision: TaxDecision): string {
  // Hash is deterministic from the persisted calculation fields only.
  // No timestamp in the payload — reproducibility from stored fields is required for audit.
  const payload = JSON.stringify({ input, decision });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

// ─── Core decision logic ──────────────────────────────────────────────────────

export async function computeTaxDecision(input: TaxInput): Promise<TaxDecision> {
  const {
    orgId,
    invoiceId,
    productId,
    sellerCountry,
    customerCountry,
    customerIsB2B = false,
    amountExclusive = 0,
    currency = 'usd',
    manualOverride,
  } = input;

  const jurisdiction = customerCountry.toUpperCase();

  // Step 1 — Manual invoice override (highest priority)
  if (manualOverride) {
    const tax = amountExclusive * manualOverride.taxRate;
    return {
      source: 'override',
      taxRate: manualOverride.taxRate,
      taxAmountExclusive: Math.round(tax * 100) / 100,
      currency,
      jurisdiction,
      taxType: 'override',
      reverseCharge: false,
      overrideReason: manualOverride.reasonCode,
      lineItemDescriptor: `Tax override — ${manualOverride.reasonCode}`,
    };
  }

  // Step 2 — Product or invoice-level tax category override
  if (invoiceId || productId) {
    const scopeConditions = [];
    if (invoiceId) {
      scopeConditions.push(
        and(
          eq(taxCategoryOverridesTable.scope, 'invoice'),
          eq(taxCategoryOverridesTable.scopeRef, invoiceId),
        ),
      );
    }
    if (productId) {
      scopeConditions.push(
        and(
          eq(taxCategoryOverridesTable.scope, 'product'),
          eq(taxCategoryOverridesTable.scopeRef, productId),
        ),
      );
    }

    const overrides = await db
      .select()
      .from(taxCategoryOverridesTable)
      .where(
        and(
          eq(taxCategoryOverridesTable.orgId, orgId),
          eq(taxCategoryOverridesTable.isActive, true),
          eq(taxCategoryOverridesTable.jurisdiction, jurisdiction),
          or(...scopeConditions),
        ),
      )
      .limit(1);

    const override = overrides[0];
    if (override) {
      if (override.taxBehavior === 'exempt') {
        return {
          source: 'override',
          taxRate: 0,
          taxAmountExclusive: 0,
          currency,
          jurisdiction,
          taxType: 'exempt',
          reverseCharge: false,
          overrideReason: override.reasonCode,
          lineItemDescriptor: `Tax-exempt — ${override.reasonCode}`,
        };
      }
      if (override.taxBehavior === 'reverse_charge') {
        return {
          source: 'reverse_charge',
          taxRate: 0,
          taxAmountExclusive: 0,
          currency,
          jurisdiction,
          taxType: 'reverse_charge',
          reverseCharge: true,
          overrideReason: override.reasonCode,
          lineItemDescriptor: 'Reverse charge — VAT to be accounted by recipient',
        };
      }
      const rate = override.taxRate ? Number(override.taxRate) : 0;
      const tax = amountExclusive * rate;
      return {
        source: 'override',
        taxRate: rate,
        taxAmountExclusive: Math.round(tax * 100) / 100,
        currency,
        jurisdiction,
        taxType: override.taxCode ?? 'override',
        reverseCharge: false,
        overrideReason: override.reasonCode,
        lineItemDescriptor: `Tax override (${override.reasonCode}) — ${jurisdiction}`,
      };
    }
  }

  // Step 3 — Valid exemption certificate check
  const now = new Date();
  const certs = await db
    .select()
    .from(taxExemptionCertificatesTable)
    .where(
      and(
        eq(taxExemptionCertificatesTable.orgId, orgId),
        eq(taxExemptionCertificatesTable.jurisdiction, jurisdiction),
        eq(taxExemptionCertificatesTable.status, 'active'),
        or(
          gt(taxExemptionCertificatesTable.expiresAt, now),
          isNull(taxExemptionCertificatesTable.expiresAt),
        ),
      ),
    )
    .orderBy(desc(taxExemptionCertificatesTable.createdAt))
    .limit(1);

  const validCert = certs[0];
  if (validCert) {
    return {
      source: 'exempt',
      taxRate: 0,
      taxAmountExclusive: 0,
      currency,
      jurisdiction,
      taxType: 'exempt',
      reverseCharge: false,
      exemptionApplied: validCert.certificateNumber ?? `cert:${validCert.id}`,
      lineItemDescriptor: `Tax-exempt — ${validCert.exemptionType} (cert ${validCert.certificateNumber ?? validCert.id})`,
    };
  }

  // Step 4 — B2B reverse-charge VAT
  // Applies when: seller is in EU/UK, customer is in a different EU/UK
  // jurisdiction, and the customer has provided a valid VAT ID.
  if (
    customerIsB2B &&
    isEuOrUk(sellerCountry) &&
    isEuOrUk(customerCountry) &&
    sellerCountry.toUpperCase() !== customerCountry.toUpperCase()
  ) {
    const vatIds = await db
      .select()
      .from(taxIdsTable)
      .where(
        and(
          eq(taxIdsTable.orgId, orgId),
          eq(taxIdsTable.jurisdiction, jurisdiction),
          inArray(taxIdsTable.taxIdType, ['eu_vat', 'gb_vat']),
          eq(taxIdsTable.validationStatus, 'valid'),
          eq(taxIdsTable.isActive, true),
        ),
      )
      .limit(1);

    if (vatIds.length > 0) {
      return {
        source: 'reverse_charge',
        taxRate: 0,
        taxAmountExclusive: 0,
        currency,
        jurisdiction,
        taxType: 'reverse_charge',
        reverseCharge: true,
        lineItemDescriptor: 'Reverse charge — VAT to be accounted by recipient',
      };
    }
  }

  // Step 5 — Fall through to Stripe Tax
  return {
    source: 'stripe_tax',
    taxRate: 0,
    taxAmountExclusive: 0,
    currency,
    jurisdiction,
    taxType: 'stripe_tax',
    reverseCharge: false,
    lineItemDescriptor: 'Tax calculated by Stripe Tax',
  };
}

// ─── Persist tax calculation ──────────────────────────────────────────────────

export async function persistTaxCalculation(
  input: TaxInput,
  decision: TaxDecision,
  opts?: {
    stripeTaxCalculationId?: string;
    taxAmountInclusive?: number;
  },
): Promise<number> {
  const tamperHash = computeTamperHash(input, decision);
  try {
    const [row] = await db
      .insert(billingTaxCalculationsTable)
      .values({
        orgId: input.orgId,
        stripeInvoiceId: input.invoiceId ?? null,
        stripeTaxCalculationId: opts?.stripeTaxCalculationId ?? null,
        taxAmountExclusive: String(decision.taxAmountExclusive),
        taxAmountInclusive: opts?.taxAmountInclusive !== undefined
          ? String(opts.taxAmountInclusive)
          : null,
        currency: decision.currency,
        jurisdiction: decision.jurisdiction,
        taxType: decision.taxType,
        taxRate: String(decision.taxRate),
        inputSnapshot: input as unknown as Record<string, unknown>,
        basisAmount: String(input.amountExclusive ?? 0),
        exemptionApplied: decision.exemptionApplied ?? null,
        source: decision.source,
        reverseCharge: decision.reverseCharge,
        overrideReason: decision.overrideReason ?? null,
        tamperHash,
        metadata: null,
      })
      .returning({ id: billingTaxCalculationsTable.id });
    return row?.id ?? 0;
  } catch (err) {
    logger.warn({ err, orgId: input.orgId }, '[tax-engine] Failed to persist tax calculation — non-fatal');
    return 0;
  }
}

// ─── Demo data helpers ────────────────────────────────────────────────────────

const DEMO_JURISDICTIONS: Array<{
  jurisdiction: string;
  taxType: string;
  taxRate: number;
  source: TaxSource;
}> = [
  { jurisdiction: 'US-CA', taxType: 'sales_tax', taxRate: 0.0875, source: 'stripe_tax' },
  { jurisdiction: 'US-TX', taxType: 'sales_tax', taxRate: 0.0825, source: 'stripe_tax' },
  { jurisdiction: 'DE',    taxType: 'vat',        taxRate: 0.19,   source: 'stripe_tax' },
  { jurisdiction: 'GB',    taxType: 'vat',        taxRate: 0.20,   source: 'stripe_tax' },
  { jurisdiction: 'FR',    taxType: 'vat',        taxRate: 0.20,   source: 'stripe_tax' },
  { jurisdiction: 'US-NY', taxType: 'sales_tax',  taxRate: 0.08,   source: 'stripe_tax' },
  { jurisdiction: 'AU',    taxType: 'gst',        taxRate: 0.10,   source: 'stripe_tax' },
];

export function buildDemoTaxReport(
  month: number,
  year: number,
): Array<{
  jurisdiction: string;
  taxType: string;
  taxRate: number;
  source: TaxSource;
  taxableRevenue: number;
  taxCollected: number;
  invoiceCount: number;
}> {
  return DEMO_JURISDICTIONS.map((j) => {
    const base = 4000 + Math.floor(Math.random() * 8000);
    return {
      ...j,
      taxableRevenue: base,
      taxCollected: Math.round(base * j.taxRate * 100) / 100,
      invoiceCount: 3 + Math.floor(Math.random() * 15),
      month,
      year,
    };
  });
}

// ─── Expiring cert check ──────────────────────────────────────────────────────

export async function findExpiringSoonCertificates(
  windowDays: number,
): Promise<Array<{ id: number; orgId: number; jurisdiction: string; expiresAt: Date; daysUntilExpiry: number }>> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + windowDays);

  const now = new Date();
  const rows = await db
    .select({
      id: taxExemptionCertificatesTable.id,
      orgId: taxExemptionCertificatesTable.orgId,
      jurisdiction: taxExemptionCertificatesTable.jurisdiction,
      expiresAt: taxExemptionCertificatesTable.expiresAt,
    })
    .from(taxExemptionCertificatesTable)
    .where(
      and(
        eq(taxExemptionCertificatesTable.status, 'active'),
        lte(taxExemptionCertificatesTable.expiresAt, cutoff),
        gt(taxExemptionCertificatesTable.expiresAt, now),
      ),
    );

  return rows
    .filter((r) => r.expiresAt !== null)
    .map((r) => ({
      id: r.id,
      orgId: r.orgId,
      jurisdiction: r.jurisdiction,
      expiresAt: r.expiresAt as Date,
      daysUntilExpiry: Math.ceil(
        ((r.expiresAt as Date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      ),
    }));
}
