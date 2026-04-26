/**
 * @szl-holdings/billing-client
 *
 * Shared billing client: typed React hooks and demo-mode fixtures for every
 * SZL Holdings artifact. Artifacts import from this package instead of
 * calling the billing API directly, so the shared tenant-scoped URL, error
 * handling, and demo-mode logic live in one place.
 *
 * DEMO MODE: When VITE_BILLING_DEMO_MODE=true (or the API returns a demo
 * flag) all hooks return structured fixture data instead of live API
 * responses. This means every artifact renders correctly without a live
 * Stripe key or real subscription.
 *
 * Usage:
 *   import { useBillingStatus, useBillingCheckout } from '@szl-holdings/billing-client';
 */

import { useCallback, useEffect, useReducer, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BillingPlan {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  priceMonthly: string;
  priceYearly?: string | null;
  features?: Record<string, unknown> | null;
  stripePriceId?: string | null;
  isActive: boolean;
}

export interface BillingSubscription {
  id: string;
  customerId: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused';
  priceId: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  canceledAt?: number;
  items: Array<{ id: string; priceId: string; quantity: number }>;
}

export interface BillingInvoice {
  id: string;
  customerId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: string;
  paidAt?: number;
  created: number;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
}

export interface BillingPaymentMethod {
  id: string;
  type: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
}

export interface BillingStatusResult {
  subscribed: boolean;
  subscription: BillingSubscription | null;
  allSubscriptions: BillingSubscription[];
  demo?: boolean;
}

export interface CheckoutResult {
  sessionId: string;
  url: string | null;
  demo?: boolean;
  message?: string;
}

export interface PortalResult {
  url: string;
  demo?: boolean;
}

export interface RefundRequestResult {
  id?: string;
  status: string;
  demo?: boolean;
}

// ─── Async state reducer ──────────────────────────────────────────────────────

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

type AsyncAction<T> =
  | { type: 'loading' }
  | { type: 'success'; data: T }
  | { type: 'error'; error: string };

function asyncReducer<T>(state: AsyncState<T>, action: AsyncAction<T>): AsyncState<T> {
  switch (action.type) {
    case 'loading': return { data: state.data, loading: true, error: null };
    case 'success': return { data: action.data, loading: false, error: null };
    case 'error': return { data: null, loading: false, error: action.error };
  }
}

function useAsyncState<T>(initial: T | null = null) {
  return useReducer(asyncReducer<T>, { data: initial, loading: false, error: null });
}

// ─── Config ───────────────────────────────────────────────────────────────────

function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="api-base"]');
    if (meta?.content) return meta.content.replace(/\/$/, '');
  }
  return '/api';
}

function isDemoMode(): boolean {
  if (typeof import.meta !== 'undefined') {
    const env = (import.meta as unknown as Record<string, unknown>).env as
      | Record<string, unknown>
      | undefined;
    if (env?.['VITE_BILLING_DEMO_MODE'] === 'true') return true;
    if (env?.['VITE_BILLING_DEMO_MODE'] === true) return true;
  }
  return false;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const base = getApiBase();
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
    throw new Error(body.message ?? body.error ?? `HTTP ${res.status}`);
  }
  const body = (await res.json()) as { data?: T } & T;
  return (body.data !== undefined ? body.data : body) as T;
}

// ─── Demo fixtures ────────────────────────────────────────────────────────────

const DEMO_SUBSCRIPTION: BillingSubscription = {
  id: 'sub_demo',
  customerId: 'cus_demo',
  status: 'active',
  priceId: 'price_demo',
  currentPeriodStart: Math.floor(Date.now() / 1000) - 15 * 86400,
  currentPeriodEnd: Math.floor(Date.now() / 1000) + 15 * 86400,
  cancelAtPeriodEnd: false,
  items: [{ id: 'si_demo', priceId: 'price_demo', quantity: 1 }],
};

const DEMO_STATUS: BillingStatusResult = {
  subscribed: true,
  subscription: DEMO_SUBSCRIPTION,
  allSubscriptions: [DEMO_SUBSCRIPTION],
  demo: true,
};

const DEMO_INVOICES: BillingInvoice[] = [
  {
    id: 'in_demo_001',
    customerId: 'cus_demo',
    subscriptionId: 'sub_demo',
    amount: 9900,
    currency: 'usd',
    status: 'paid',
    paidAt: Math.floor(Date.now() / 1000) - 30 * 86400,
    created: Math.floor(Date.now() / 1000) - 30 * 86400,
    hostedInvoiceUrl: '#',
  },
  {
    id: 'in_demo_002',
    customerId: 'cus_demo',
    subscriptionId: 'sub_demo',
    amount: 9900,
    currency: 'usd',
    status: 'paid',
    paidAt: Math.floor(Date.now() / 1000) - 60 * 86400,
    created: Math.floor(Date.now() / 1000) - 60 * 86400,
    hostedInvoiceUrl: '#',
  },
];

const DEMO_PAYMENT_METHODS: BillingPaymentMethod[] = [
  {
    id: 'pm_demo_visa',
    type: 'card',
    brand: 'visa',
    last4: '4242',
    expMonth: 12,
    expYear: 2028,
    isDefault: true,
  },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * useBillingStatus — returns the current org's subscription status.
 * Auto-fetches on mount. Returns demo fixtures when demo mode is active.
 */
export function useBillingStatus(): AsyncState<BillingStatusResult> & { refetch: () => void } {
  const [state, dispatch] = useAsyncState<BillingStatusResult>();
  const fetchRef = useRef(0);

  const fetch_ = useCallback(async () => {
    const id = ++fetchRef.current;
    dispatch({ type: 'loading' });
    try {
      if (isDemoMode()) {
        if (id === fetchRef.current) dispatch({ type: 'success', data: DEMO_STATUS });
        return;
      }
      const data = await apiFetch<BillingStatusResult>('/billing/subscription-status');
      if (id === fetchRef.current) dispatch({ type: 'success', data });
    } catch (err) {
      if (id === fetchRef.current)
        dispatch({ type: 'error', error: (err as Error).message });
    }
  }, []);

  useEffect(() => { void fetch_(); }, [fetch_]);

  return { ...state, refetch: () => { void fetch_(); } };
}

/**
 * useBillingPlans — lists all billing plans.
 */
export function useBillingPlans(): AsyncState<BillingPlan[]> {
  const [state, dispatch] = useAsyncState<BillingPlan[]>();

  useEffect(() => {
    dispatch({ type: 'loading' });
    apiFetch<BillingPlan[]>('/billing/plans')
      .then((data) => dispatch({ type: 'success', data }))
      .catch((err) => dispatch({ type: 'error', error: (err as Error).message }));
  }, []);

  return state;
}

/**
 * useBillingCheckout — returns a startCheckout function.
 * When demo mode is ON, returns a demo session without hitting Stripe.
 */
export function useBillingCheckout(): {
  startCheckout: (params: {
    priceId: string;
    mode?: 'subscription' | 'payment';
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string;
  }) => Promise<CheckoutResult>;
  loading: boolean;
  error: string | null;
} {
  const [state, dispatch] = useAsyncState<CheckoutResult>();

  const startCheckout = useCallback(
    async (params: {
      priceId: string;
      mode?: 'subscription' | 'payment';
      successUrl: string;
      cancelUrl: string;
      customerEmail?: string;
    }): Promise<CheckoutResult> => {
      dispatch({ type: 'loading' });
      try {
        if (isDemoMode()) {
          const demo: CheckoutResult = {
            sessionId: `demo_session_${Date.now()}`,
            url: null,
            demo: true,
            message: 'Demo mode: no live Stripe key configured.',
          };
          dispatch({ type: 'success', data: demo });
          return demo;
        }
        const result = await apiFetch<CheckoutResult>('/billing/checkout', {
          method: 'POST',
          body: JSON.stringify(params),
        });
        dispatch({ type: 'success', data: result });
        return result;
      } catch (err) {
        dispatch({ type: 'error', error: (err as Error).message });
        throw err;
      }
    },
    [],
  );

  return { startCheckout, loading: state.loading, error: state.error };
}

/**
 * useBillingPortal — returns an openPortal function that redirects to the
 * Stripe Billing Portal. In demo mode it no-ops with a console note.
 */
export function useBillingPortal(): {
  openPortal: (returnUrl?: string) => Promise<PortalResult>;
  loading: boolean;
  error: string | null;
} {
  const [state, dispatch] = useAsyncState<PortalResult>();

  const openPortal = useCallback(async (returnUrl?: string): Promise<PortalResult> => {
    dispatch({ type: 'loading' });
    try {
      if (isDemoMode()) {
        const demo: PortalResult = { url: '#', demo: true };
        dispatch({ type: 'success', data: demo });
        console.info('[billing-client] Demo mode: billing portal is not available without a live Stripe key.');
        return demo;
      }
      const result = await apiFetch<PortalResult>('/billing/portal-session', {
        method: 'POST',
        body: JSON.stringify({ returnUrl: returnUrl ?? window.location.href }),
      });
      dispatch({ type: 'success', data: result });
      if (result.url && result.url !== '#') window.location.href = result.url;
      return result;
    } catch (err) {
      dispatch({ type: 'error', error: (err as Error).message });
      throw err;
    }
  }, []);

  return { openPortal, loading: state.loading, error: state.error };
}

/**
 * useInvoices — lists Stripe invoices for the current org.
 * Returns demo fixtures when demo mode is active.
 */
export function useInvoices(): AsyncState<BillingInvoice[]> & { refetch: () => void } {
  const [state, dispatch] = useAsyncState<BillingInvoice[]>();
  const fetchRef = useRef(0);

  const fetch_ = useCallback(async () => {
    const id = ++fetchRef.current;
    dispatch({ type: 'loading' });
    try {
      if (isDemoMode()) {
        if (id === fetchRef.current) dispatch({ type: 'success', data: DEMO_INVOICES });
        return;
      }
      const data = await apiFetch<BillingInvoice[]>('/billing/stripe-invoices');
      if (id === fetchRef.current) dispatch({ type: 'success', data });
    } catch (err) {
      if (id === fetchRef.current)
        dispatch({ type: 'error', error: (err as Error).message });
    }
  }, []);

  useEffect(() => { void fetch_(); }, [fetch_]);

  return { ...state, refetch: () => { void fetch_(); } };
}

/**
 * usePaymentMethods — lists saved payment methods for the current org's
 * Stripe customer. Returns demo fixtures when demo mode is active.
 */
export function usePaymentMethods(): AsyncState<BillingPaymentMethod[]> & { refetch: () => void } {
  const [state, dispatch] = useAsyncState<BillingPaymentMethod[]>();
  const fetchRef = useRef(0);

  const fetch_ = useCallback(async () => {
    const id = ++fetchRef.current;
    dispatch({ type: 'loading' });
    try {
      if (isDemoMode()) {
        if (id === fetchRef.current)
          dispatch({ type: 'success', data: DEMO_PAYMENT_METHODS });
        return;
      }
      const data = await apiFetch<BillingPaymentMethod[]>('/billing/payment-methods');
      if (id === fetchRef.current) dispatch({ type: 'success', data });
    } catch (err) {
      if (id === fetchRef.current)
        dispatch({ type: 'error', error: (err as Error).message });
    }
  }, []);

  useEffect(() => { void fetch_(); }, [fetch_]);

  return { ...state, refetch: () => { void fetch_(); } };
}

/**
 * useRequestRefund — returns a requestRefund function. Submits a refund
 * request to the API. In demo mode it returns a fake success immediately.
 */
export function useRequestRefund(): {
  requestRefund: (params: {
    chargeId?: string;
    paymentIntentId?: string;
    amount?: number;
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'other';
    notes?: string;
  }) => Promise<RefundRequestResult>;
  loading: boolean;
  error: string | null;
} {
  const [state, dispatch] = useAsyncState<RefundRequestResult>();

  const requestRefund = useCallback(
    async (params: {
      chargeId?: string;
      paymentIntentId?: string;
      amount?: number;
      reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'other';
      notes?: string;
    }): Promise<RefundRequestResult> => {
      dispatch({ type: 'loading' });
      try {
        if (isDemoMode()) {
          const demo: RefundRequestResult = { status: 'pending', demo: true };
          dispatch({ type: 'success', data: demo });
          return demo;
        }
        const result = await apiFetch<RefundRequestResult>('/billing/refund-request', {
          method: 'POST',
          body: JSON.stringify(params),
        });
        dispatch({ type: 'success', data: result });
        return result;
      } catch (err) {
        dispatch({ type: 'error', error: (err as Error).message });
        throw err;
      }
    },
    [],
  );

  return { requestRefund, loading: state.loading, error: state.error };
}

/**
 * useTaxBreakdown — returns tax calculation data for a specific invoice.
 * Stub: tax engine logic is handled by the tax-automation task.
 */
export function useTaxBreakdown(invoiceId: string | null): AsyncState<{
  taxAmountExclusive: number;
  taxAmountInclusive: number;
  currency: string;
  jurisdiction?: string;
  taxType?: string;
  taxRate?: number;
  demo?: boolean;
}> {
  const [state, dispatch] = useAsyncState<{
    taxAmountExclusive: number;
    taxAmountInclusive: number;
    currency: string;
    jurisdiction?: string;
    taxType?: string;
    taxRate?: number;
    demo?: boolean;
  }>();

  useEffect(() => {
    if (!invoiceId) return;
    dispatch({ type: 'loading' });
    if (isDemoMode()) {
      dispatch({
        type: 'success',
        data: {
          taxAmountExclusive: 0,
          taxAmountInclusive: 0,
          currency: 'usd',
          jurisdiction: 'US',
          taxType: 'vat',
          taxRate: 0,
          demo: true,
        },
      });
      return;
    }
    apiFetch<{
      taxAmountExclusive: number;
      taxAmountInclusive: number;
      currency: string;
      jurisdiction?: string;
      taxType?: string;
      taxRate?: number;
    }>(`/billing/tax-breakdown/${invoiceId}`)
      .then((data) => dispatch({ type: 'success', data }))
      .catch((err) => dispatch({ type: 'error', error: (err as Error).message }));
  }, [invoiceId]);

  return state;
}

/**
 * useBillingUsage — lists usage events for the current org.
 */
export function useBillingUsage(options?: {
  featureKey?: string;
  limit?: number;
}): AsyncState<Array<{
  id: number;
  featureKey: string;
  quantity: number;
  recordedAt: string;
}>> {
  const [state, dispatch] = useAsyncState<Array<{
    id: number;
    featureKey: string;
    quantity: number;
    recordedAt: string;
  }>>();

  const featureKey = options?.featureKey;
  const limit = options?.limit ?? 50;

  useEffect(() => {
    dispatch({ type: 'loading' });
    if (isDemoMode()) {
      dispatch({ type: 'success', data: [] });
      return;
    }
    const params = new URLSearchParams({ limit: String(limit) });
    if (featureKey) params.set('featureKey', featureKey);
    apiFetch<Array<{ id: number; featureKey: string; quantity: number; recordedAt: string }>>(
      `/billing/usage?${params.toString()}`,
    )
      .then((data) => dispatch({ type: 'success', data }))
      .catch((err) => dispatch({ type: 'error', error: (err as Error).message }));
  }, [featureKey, limit]);

  return state;
}

// Re-export types for consumers
export type { AsyncState };
