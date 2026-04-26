/**
 * coinbase-adapter.ts — Coinbase Commerce integration for crypto invoice payments.
 *
 * Supported assets: USDC on Base, ETH, BTC (plus whatever Coinbase Commerce
 * enables on the account — we don't restrict at the adapter level).
 *
 * Flow:
 *  1. Customer clicks "Pay with Crypto" on an invoice.
 *  2. We call createCharge() with the invoice amount — Coinbase returns a
 *     hosted-checkout URL.
 *  3. Customer pays at that URL; Coinbase fires a webhook.
 *  4. handleCoinbaseWebhook() in billing-webhook.ts processes the event,
 *     marks the invoice paid in our ledger, and records an out-of-band
 *     payment against the Stripe invoice for reconciliation.
 *
 * Demo mode: when COINBASE_COMMERCE_API_KEY is absent the adapter returns
 * synthetic responses and webhook verification always passes.
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { logger } from './logger';

export type CoinbaseChargeStatus =
  | 'NEW'
  | 'PENDING'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'CANCELED'
  | 'UNRESOLVED';

export interface CoinbaseChargeRequest {
  name: string;
  description: string;
  amountUsd: string;
  currency?: string;
  metadata?: Record<string, string>;
  redirectUrl?: string;
  cancelUrl?: string;
}

export interface CoinbaseChargeResponse {
  chargeId: string;
  code: string;
  hostedUrl: string;
  expiresAt: string;
  status: CoinbaseChargeStatus;
  demo?: boolean;
}

export interface CoinbaseWebhookEvent {
  id: string;
  type: 'charge:created' | 'charge:confirmed' | 'charge:failed' | 'charge:delayed' | 'charge:pending' | 'charge:resolved';
  data: {
    id: string;
    code: string;
    name: string;
    description: string;
    metadata: Record<string, string>;
    pricing: { local: { amount: string; currency: string } };
    payments: Array<{
      network: string;
      transaction_id: string;
      status: string;
      detected_at: string;
      value: { local: { amount: string; currency: string } };
    }>;
    timeline: Array<{ time: string; status: CoinbaseChargeStatus }>;
    status: CoinbaseChargeStatus;
    addresses: Record<string, string>;
  };
}

const COINBASE_COMMERCE_API = 'https://api.commerce.coinbase.com';

function isCoinbaseConfigured(): boolean {
  return !!process.env.COINBASE_COMMERCE_API_KEY;
}

async function coinbaseRequest<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const url = `${COINBASE_COMMERCE_API}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-CC-Api-Key': process.env.COINBASE_COMMERCE_API_KEY!,
      'X-CC-Version': '2018-03-22',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Coinbase Commerce API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function createCharge(
  req: CoinbaseChargeRequest,
): Promise<CoinbaseChargeResponse> {
  if (!isCoinbaseConfigured()) {
    logger.debug('[coinbase] Demo mode — returning synthetic charge');
    const demoCode = `DEMO${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    return {
      chargeId: `demo-charge-${Date.now()}`,
      code: demoCode,
      hostedUrl: `https://commerce.coinbase.com/charges/${demoCode}`,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      status: 'NEW',
      demo: true,
    };
  }

  const data = await coinbaseRequest<{
    data: {
      id: string;
      code: string;
      hosted_url: string;
      expires_at: string;
      timeline: Array<{ status: CoinbaseChargeStatus }>;
    };
  }>('POST', '/charges', {
    name: req.name,
    description: req.description,
    local_price: { amount: req.amountUsd, currency: req.currency ?? 'USD' },
    pricing_type: 'fixed_price',
    metadata: req.metadata ?? {},
    redirect_url: req.redirectUrl,
    cancel_url: req.cancelUrl,
  });

  const charge = data.data;
  const latestStatus =
    (charge.timeline[charge.timeline.length - 1]?.status as CoinbaseChargeStatus) ?? 'NEW';

  return {
    chargeId: charge.id,
    code: charge.code,
    hostedUrl: charge.hosted_url,
    expiresAt: charge.expires_at,
    status: latestStatus,
  };
}

export async function getCharge(chargeId: string): Promise<CoinbaseChargeResponse | null> {
  if (!isCoinbaseConfigured()) {
    return null;
  }
  try {
    const data = await coinbaseRequest<{
      data: {
        id: string;
        code: string;
        hosted_url: string;
        expires_at: string;
        timeline: Array<{ status: CoinbaseChargeStatus }>;
      };
    }>('GET', `/charges/${chargeId}`);
    const charge = data.data;
    const latestStatus =
      (charge.timeline[charge.timeline.length - 1]?.status as CoinbaseChargeStatus) ?? 'NEW';
    return {
      chargeId: charge.id,
      code: charge.code,
      hostedUrl: charge.hosted_url,
      expiresAt: charge.expires_at,
      status: latestStatus,
    };
  } catch (err) {
    logger.warn({ err, chargeId }, '[coinbase] Failed to fetch charge');
    return null;
  }
}

/**
 * getCoinbaseSettlements — fetches the list of completed charges from
 * Coinbase Commerce for reconciliation. Returns an array of settled charges
 * with their invoice metadata.
 */
export async function getCoinbaseSettlements(
  startDate: Date,
  endDate: Date,
): Promise<
  Array<{
    chargeId: string;
    code: string;
    amountUsd: string;
    currency: string;
    settledAt: string;
    metadata: Record<string, string>;
    transactionId?: string;
    network?: string;
  }>
> {
  if (!isCoinbaseConfigured()) {
    logger.debug('[coinbase] Demo mode — returning empty settlements');
    return [];
  }

  try {
    const data = await coinbaseRequest<{
      data: Array<{
        id: string;
        code: string;
        pricing: { local: { amount: string; currency: string } };
        metadata: Record<string, string>;
        payments: Array<{
          network: string;
          transaction_id: string;
          status: string;
          detected_at: string;
          value: { local: { amount: string; currency: string } };
        }>;
        timeline: Array<{ time: string; status: CoinbaseChargeStatus }>;
      }>;
      pagination: { next_uri: string | null };
    }>('GET', '/charges?limit=100&status=COMPLETED');

    const settlements = data.data
      .filter((charge) => {
        const completedEntry = charge.timeline.find((t) => t.status === 'COMPLETED');
        if (!completedEntry) return false;
        const settledAt = new Date(completedEntry.time);
        return settledAt >= startDate && settledAt <= endDate;
      })
      .map((charge) => {
        const completedEntry = charge.timeline.find((t) => t.status === 'COMPLETED');
        const payment = charge.payments.find((p) => p.status === 'CONFIRMED') ?? charge.payments[0];
        return {
          chargeId: charge.id,
          code: charge.code,
          amountUsd: charge.pricing.local.amount,
          currency: charge.pricing.local.currency,
          settledAt: completedEntry?.time ?? new Date().toISOString(),
          metadata: charge.metadata ?? {},
          transactionId: payment?.transaction_id,
          network: payment?.network,
        };
      });

    return settlements;
  } catch (err) {
    logger.error({ err }, '[coinbase] Failed to fetch settlements');
    return [];
  }
}

/**
 * verifyCoinbaseWebhookSignature — validates the X-CC-Webhook-Signature header
 * using HMAC-SHA256 with COINBASE_COMMERCE_WEBHOOK_SECRET.
 *
 * Security: silently accepts only in demo mode (no API key configured). When
 * COINBASE_COMMERCE_API_KEY is present, the webhook secret is required.
 *
 * @param rawBody - raw request body string
 * @param signatureHeader - value of the X-CC-Webhook-Signature header
 * @param secretOverride - optional secret (used in tests instead of env var)
 * @throws Error when signature is invalid or required secret is missing
 */
export function verifyCoinbaseWebhookSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secretOverride?: string,
): void {
  const secret = secretOverride ?? process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;
  if (!secret) {
    if (isCoinbaseConfigured()) {
      throw new Error(
        'COINBASE_COMMERCE_WEBHOOK_SECRET is not configured but Coinbase Commerce is active — rejecting webhook',
      );
    }
    logger.debug('[coinbase] No COINBASE_COMMERCE_WEBHOOK_SECRET — webhook signature skipped (demo mode)');
    return;
  }
  if (!signatureHeader) {
    throw new Error('Missing X-CC-Webhook-Signature header');
  }
  try {
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const valid = timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signatureHeader.toLowerCase(), 'hex'),
    );
    if (!valid) throw new Error('Coinbase webhook signature mismatch');
  } catch (err) {
    if (err instanceof Error && err.message.includes('mismatch')) throw err;
    throw new Error('Invalid Coinbase webhook signature');
  }
}

export function isCoinbaseWebhookConfigured(): boolean {
  return !!process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;
}
