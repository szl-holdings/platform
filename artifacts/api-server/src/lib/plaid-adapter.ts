/**
 * plaid-adapter.ts — Plaid Link integration for ACH bank account verification.
 *
 * Flow:
 *  1. Client calls /billing/ach/link-token → createLinkToken() → returns link_token
 *  2. Plaid Link UI verifies the bank account (instant or micro-deposit)
 *  3. Client sends public_token to /billing/ach/exchange-token → exchangePublicToken()
 *  4. We use the processor_token to create a Stripe bank-account payment method
 *  5. We persist a billing_rail_accounts row for this org
 *
 * Demo mode: when PLAID_CLIENT_ID / PLAID_SECRET are absent the adapter
 * returns synthetic responses that allow the rest of the flow to proceed
 * without any external calls.
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { logger } from './logger';

export interface PlaidLinkTokenRequest {
  clientUserId: string;
  clientName: string;
  redirectUri?: string;
}

export interface PlaidLinkTokenResponse {
  linkToken: string;
  expiration: string;
  requestId: string;
  demo?: boolean;
}

export interface PlaidExchangeResult {
  accessToken: string;
  itemId: string;
  processorToken: string;
  accountId: string;
  institutionName?: string;
  accountName?: string;
  accountMask?: string;
  demo?: boolean;
}

export interface PlaidItemWebhookPayload {
  webhookType: string;
  webhookCode: string;
  itemId: string;
  error?: { errorCode: string; errorMessage: string } | null;
}

const PLAID_BASE_URL =
  process.env.PLAID_ENV === 'production'
    ? 'https://production.plaid.com'
    : process.env.PLAID_ENV === 'development'
      ? 'https://development.plaid.com'
      : 'https://sandbox.plaid.com';

function isPlaidConfigured(): boolean {
  return !!(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
}

async function plaidRequest<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const url = `${PLAID_BASE_URL}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.PLAID_CLIENT_ID,
      secret: process.env.PLAID_SECRET,
      ...body,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Plaid API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function createLinkToken(
  req: PlaidLinkTokenRequest,
): Promise<PlaidLinkTokenResponse> {
  if (!isPlaidConfigured()) {
    logger.debug('[plaid] Demo mode — returning synthetic link token');
    return {
      linkToken: `link-sandbox-demo-${Date.now()}`,
      expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      requestId: `demo-req-${Date.now()}`,
      demo: true,
    };
  }

  const data = await plaidRequest<{
    link_token: string;
    expiration: string;
    request_id: string;
  }>('/link/token/create', {
    user: { client_user_id: req.clientUserId },
    client_name: req.clientName,
    products: ['auth'],
    country_codes: ['US'],
    language: 'en',
    ...(req.redirectUri ? { redirect_uri: req.redirectUri } : {}),
    account_filters: {
      depository: { account_subtypes: ['checking', 'savings'] },
    },
    payment_initiation: undefined,
  });

  return {
    linkToken: data.link_token,
    expiration: data.expiration,
    requestId: data.request_id,
  };
}

export async function exchangePublicToken(
  publicToken: string,
  accountId: string,
): Promise<PlaidExchangeResult> {
  if (!isPlaidConfigured()) {
    logger.debug('[plaid] Demo mode — returning synthetic exchange result');
    return {
      accessToken: `access-sandbox-demo-${Date.now()}`,
      itemId: `item-demo-${Date.now()}`,
      processorToken: `processor-stripe-sandbox-demo-${Date.now()}`,
      accountId,
      institutionName: 'Demo Bank',
      accountName: 'Demo Checking',
      accountMask: '0000',
      demo: true,
    };
  }

  const exchangeData = await plaidRequest<{
    access_token: string;
    item_id: string;
    request_id: string;
  }>('/item/public_token/exchange', { public_token: publicToken });

  const accessToken = exchangeData.access_token;
  const itemId = exchangeData.item_id;

  const processorData = await plaidRequest<{
    processor_token: string;
    request_id: string;
  }>('/processor/token/create', {
    access_token: accessToken,
    account_id: accountId,
    processor: 'stripe',
  });

  let institutionName: string | undefined;
  let accountName: string | undefined;
  let accountMask: string | undefined;

  try {
    const authData = await plaidRequest<{
      accounts: Array<{ account_id: string; name: string; mask: string }>;
      item: { institution_id: string };
    }>('/auth/get', { access_token: accessToken });

    const acct = authData.accounts.find((a) => a.account_id === accountId);
    accountName = acct?.name;
    accountMask = acct?.mask;

    if (authData.item.institution_id) {
      const instData = await plaidRequest<{
        institution: { name: string };
      }>('/institutions/get_by_id', {
        institution_id: authData.item.institution_id,
        country_codes: ['US'],
      });
      institutionName = instData.institution.name;
    }
  } catch (err) {
    logger.warn({ err }, '[plaid] Failed to fetch account/institution details — continuing');
  }

  return {
    accessToken,
    itemId,
    processorToken: processorData.processor_token,
    accountId,
    institutionName,
    accountName,
    accountMask,
  };
}

/**
 * verifyPlaidWebhookSignature — validates the Plaid-Verification-Id +
 * JSON body signature per Plaid webhook docs.
 *
 * Security: in demo mode (Plaid not configured AND no override secret), the
 * function returns true so local development works without credentials. In
 * any environment where PLAID_CLIENT_ID is set, PLAID_WEBHOOK_SECRET is
 * required and absence causes rejection, not silent acceptance.
 *
 * @param rawBody - raw request body string
 * @param signatureHeader - value of the plaid-verification header
 * @param secretOverride - optional secret (used in tests instead of env var)
 */
export function verifyPlaidWebhookSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secretOverride?: string,
): boolean {
  const secret = secretOverride ?? process.env.PLAID_WEBHOOK_SECRET;
  if (!secret) {
    if (isPlaidConfigured()) {
      logger.warn('[plaid] PLAID_WEBHOOK_SECRET not set but Plaid is configured — rejecting webhook');
      return false;
    }
    logger.debug('[plaid] No PLAID_WEBHOOK_SECRET — webhook signature skipped (demo mode)');
    return true;
  }
  if (!signatureHeader) return false;
  try {
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    return timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signatureHeader.toLowerCase(), 'hex'),
    );
  } catch {
    return false;
  }
}

export const ACH_RETURN_CODES: Record<string, string> = {
  R01: 'Insufficient funds — the bank account did not have enough funds to complete this payment.',
  R02: 'Account closed — the bank account is no longer active.',
  R03: 'No account / unable to locate account — the account number or routing number is incorrect.',
  R04: 'Invalid account number — the account number does not pass bank validation.',
  R05: 'Unauthorized debit to consumer account — the account holder did not authorize this payment.',
  R06: 'Returned per ODFI request — the originating bank recalled this payment.',
  R07: 'Authorization revoked — the account holder has revoked ACH authorization.',
  R08: 'Payment stopped — the account holder placed a stop-payment order.',
  R09: 'Uncollected funds — insufficient uncollected funds in the account.',
  R10: 'Customer advises not authorized — the account holder disputes this transaction.',
  R11: 'Check truncation entry return — the original transaction was a check; this is a return.',
  R12: 'Branch sold to another DFI — the account has been transferred to another institution.',
  R13: 'Invalid ACH routing number — the routing number is not a valid US ACH routing number.',
  R14: 'Representative payee deceased — the named representative is deceased.',
  R15: 'Beneficiary or account holder deceased — the account holder is deceased.',
  R16: 'Account frozen — the bank account is frozen and cannot accept debits.',
  R17: 'File record edit criteria — the transaction does not pass ODFI edit checks.',
  R20: 'Non-transaction account — this account type does not permit ACH debits.',
  R21: 'Invalid company identification — the company ID does not match bank records.',
  R22: 'Invalid individual ID number — the individual ID does not match bank records.',
  R23: 'Credit entry refused — the account holder refuses this credit.',
  R24: 'Duplicate entry — a duplicate payment was detected.',
  R29: 'Corporate customer advises not authorized — the company disputes this transaction.',
  R31: 'Permissible return entry — the return is within the permissible return period.',
};

export function describeAchReturn(returnCode: string): string {
  return (
    ACH_RETURN_CODES[returnCode.toUpperCase()] ??
    `ACH payment returned with code ${returnCode}. Please contact your bank or update your payment method.`
  );
}
