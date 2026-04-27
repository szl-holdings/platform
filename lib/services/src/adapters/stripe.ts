import { ServiceAdapter } from "../base.js";

export interface StripeConnectionStatus {
  connected: boolean;
  accountId?: string;
  mode: "live" | "test" | "mock";
}

export interface StripeProduct {
  id: string;
  name: string;
  description: string;
  active: boolean;
  prices: Array<{
    id: string;
    amount: number;
    currency: string;
    interval?: string | undefined;
  }>;
}

export interface StripeCheckoutSession {
  id: string;
  url: string;
  status: string;
  customerId?: string;
  subscriptionId?: string;
  paymentIntentId?: string;
}

export interface StripeCustomer {
  id: string;
  email: string;
  name?: string | undefined;
  metadata?: Record<string, string> | undefined;
}

export interface StripeSubscription {
  id: string;
  customerId: string;
  status: string;
  priceId: string;
  productId?: string | undefined;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  canceledAt?: number | undefined;
  items: Array<{
    id: string;
    priceId: string;
    quantity: number;
  }>;
}

export interface StripeInvoice {
  id: string;
  customerId: string;
  subscriptionId?: string | undefined;
  amount: number;
  currency: string;
  status: string;
  paidAt?: number | undefined;
  created: number;
  hostedInvoiceUrl?: string | undefined;
  invoicePdf?: string | undefined;
}

export interface StripePortalSession {
  id: string;
  url: string;
}

const MOCK_PRODUCTS: StripeProduct[] = [
  {
    id: "prod_mock_001",
    name: "SZL Basic Plan",
    description: "Basic access to portfolio management tools",
    active: true,
    prices: [{ id: "price_mock_001", amount: 2900, currency: "usd", interval: "month" }],
  },
  {
    id: "prod_mock_002",
    name: "SZL Enterprise Plan",
    description: "Full suite of enterprise portfolio tools",
    active: true,
    prices: [{ id: "price_mock_002", amount: 9900, currency: "usd", interval: "month" }],
  },
];

export class StripeAdapter extends ServiceAdapter {
  readonly name = "stripe";
  readonly description = "Stripe payment processing and subscription management";
  readonly requiredEnvVars = ["STRIPE_SECRET_KEY"];

  private get secretKey(): string | undefined {
    return process.env.STRIPE_SECRET_KEY;
  }

  private get webhookSecret(): string | undefined {
    return process.env.STRIPE_WEBHOOK_SECRET;
  }

  private async stripeRequest(path: string, options?: RequestInit): Promise<unknown> {
    const response = await fetch(`https://api.stripe.com/v1${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Stripe API error: ${response.status} ${response.statusText} - ${body}`);
    }

    return response.json();
  }

  protected override async performHealthCheck(): Promise<void> {
    const result = await this.testConnection();
    if (!result.connected) throw new Error("Stripe connection verification failed");
  }

  async testConnection(): Promise<StripeConnectionStatus> {
    if (!this.isLive) {
      return { connected: false, mode: "mock" };
    }

    try {
      const data = (await this.stripeRequest("/account")) as { id: string };
      const isTest = this.secretKey?.startsWith("sk_test_");
      return {
        connected: true,
        accountId: data.id,
        mode: isTest ? "test" : "live",
      };
    } catch {
      return { connected: false, mode: "mock" };
    }
  }

  async listProducts(): Promise<StripeProduct[]> {
    if (!this.isLive) {
      return [...MOCK_PRODUCTS];
    }

    const data = (await this.stripeRequest("/products?active=true&limit=20")) as {
      data: Array<{ id: string; name: string; description: string; active: boolean }>;
    };

    const products: StripeProduct[] = [];
    for (const product of data.data) {
      const priceData = (await this.stripeRequest(
        `/prices?product=${product.id}&active=true`,
      )) as {
        data: Array<{
          id: string;
          unit_amount: number;
          currency: string;
          recurring?: { interval: string };
        }>;
      };

      products.push({
        id: product.id,
        name: product.name,
        description: product.description ?? "",
        active: product.active,
        prices: priceData.data.map((p) => ({
          id: p.id,
          amount: p.unit_amount,
          currency: p.currency,
          interval: p.recurring?.interval,
        })),
      });
    }

    return products;
  }

  async createCustomer(email: string, name?: string, metadata?: Record<string, string>): Promise<StripeCustomer> {
    if (!this.isLive) {
      return { id: `cus_mock_${Date.now()}`, email, name, metadata };
    }

    const params = new URLSearchParams();
    params.set("email", email);
    if (name) params.set("name", name);
    if (metadata) {
      for (const [k, v] of Object.entries(metadata)) {
        params.set(`metadata[${k}]`, v);
      }
    }

    const data = (await this.stripeRequest("/customers", {
      method: "POST",
      body: params.toString(),
    })) as { id: string; email: string; name: string; metadata: Record<string, string> };

    return { id: data.id, email: data.email, name: data.name, metadata: data.metadata };
  }

  async getCustomerByEmail(email: string): Promise<StripeCustomer | null> {
    if (!this.isLive) return null;

    const data = (await this.stripeRequest(`/customers?email=${encodeURIComponent(email)}&limit=1`)) as {
      data: Array<{ id: string; email: string; name: string; metadata: Record<string, string> }>;
    };

    if (data.data.length === 0) return null;
    const c = data.data[0]!;
    return { id: c.id, email: c.email, ...(c.name && { name: c.name }), ...(c.metadata && { metadata: c.metadata as Record<string, string> }) };
  }

  async createCheckoutSession(options: {
    priceId: string;
    mode: "subscription" | "payment";
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string;
    customerId?: string;
    metadata?: Record<string, string>;
    /** When provided, forwarded as the Stripe-Api Idempotency-Key header so
     *  transient retries with the same key converge on the same session. */
    idempotencyKey?: string;
  }): Promise<StripeCheckoutSession> {
    if (!this.isLive) {
      return {
        id: `cs_mock_${Date.now()}`,
        url: `${options.successUrl}?session_id=cs_mock_${Date.now()}`,
        status: "open",
      };
    }

    const params = new URLSearchParams();
    params.set("mode", options.mode);
    params.set("line_items[0][price]", options.priceId);
    params.set("line_items[0][quantity]", "1");
    params.set("success_url", options.successUrl);
    params.set("cancel_url", options.cancelUrl);

    if (options.customerId) {
      params.set("customer", options.customerId);
    } else if (options.customerEmail) {
      params.set("customer_email", options.customerEmail);
    }

    if (options.metadata) {
      for (const [k, v] of Object.entries(options.metadata)) {
        params.set(`metadata[${k}]`, v);
      }
    }

    const reqHeaders: Record<string, string> = {};
    if (options.idempotencyKey) {
      reqHeaders["Idempotency-Key"] = options.idempotencyKey;
    }

    const data = (await this.stripeRequest("/checkout/sessions", {
      method: "POST",
      body: params.toString(),
      headers: reqHeaders,
    })) as {
      id: string;
      url: string;
      status: string;
      customer: string;
      subscription: string;
      payment_intent: string;
    };

    return {
      id: data.id,
      url: data.url,
      status: data.status,
      customerId: data.customer,
      subscriptionId: data.subscription,
      paymentIntentId: data.payment_intent,
    };
  }

  async createCustomerPortalSession(customerId: string, returnUrl: string): Promise<StripePortalSession> {
    if (!this.isLive) {
      return { id: `bps_mock_${Date.now()}`, url: returnUrl };
    }

    const params = new URLSearchParams();
    params.set("customer", customerId);
    params.set("return_url", returnUrl);

    const data = (await this.stripeRequest("/billing_portal/sessions", {
      method: "POST",
      body: params.toString(),
    })) as { id: string; url: string };

    return { id: data.id, url: data.url };
  }

  async getSubscription(subscriptionId: string): Promise<StripeSubscription | null> {
    if (!this.isLive) return null;

    try {
      const data = (await this.stripeRequest(`/subscriptions/${subscriptionId}`)) as {
        id: string;
        customer: string;
        status: string;
        current_period_start: number;
        current_period_end: number;
        cancel_at_period_end: boolean;
        canceled_at: number | null;
        items: {
          data: Array<{
            id: string;
            price: { id: string; product: string };
            quantity: number;
          }>;
        };
      };

      return {
        id: data.id,
        customerId: data.customer,
        status: data.status,
        priceId: data.items.data[0]?.price.id ?? "",
        productId: data.items.data[0]?.price.product,
        currentPeriodStart: data.current_period_start,
        currentPeriodEnd: data.current_period_end,
        cancelAtPeriodEnd: data.cancel_at_period_end,
        canceledAt: data.canceled_at ?? undefined,
        items: data.items.data.map((i) => ({
          id: i.id,
          priceId: i.price.id,
          quantity: i.quantity,
        })),
      };
    } catch {
      return null;
    }
  }

  async listCustomerSubscriptions(customerId: string): Promise<StripeSubscription[]> {
    if (!this.isLive) return [];

    const data = (await this.stripeRequest(`/subscriptions?customer=${customerId}&limit=10`)) as {
      data: Array<{
        id: string;
        customer: string;
        status: string;
        current_period_start: number;
        current_period_end: number;
        cancel_at_period_end: boolean;
        canceled_at: number | null;
        items: {
          data: Array<{
            id: string;
            price: { id: string; product: string };
            quantity: number;
          }>;
        };
      }>;
    };

    return data.data.map((s) => ({
      id: s.id,
      customerId: s.customer,
      status: s.status,
      priceId: s.items.data[0]?.price.id ?? "",
      productId: s.items.data[0]?.price.product,
      currentPeriodStart: s.current_period_start,
      currentPeriodEnd: s.current_period_end,
      cancelAtPeriodEnd: s.cancel_at_period_end,
      canceledAt: s.canceled_at ?? undefined,
      items: s.items.data.map((i) => ({
        id: i.id,
        priceId: i.price.id,
        quantity: i.quantity,
      })),
    }));
  }

  async listInvoices(customerId?: string, limit = 20): Promise<StripeInvoice[]> {
    if (!this.isLive) return [];

    let path = `/invoices?limit=${limit}`;
    if (customerId) path += `&customer=${customerId}`;

    const data = (await this.stripeRequest(path)) as {
      data: Array<{
        id: string;
        customer: string;
        subscription: string | null;
        amount_paid: number;
        currency: string;
        status: string;
        status_transitions: { paid_at: number | null };
        created: number;
        hosted_invoice_url: string | null;
        invoice_pdf: string | null;
      }>;
    };

    return data.data.map((inv) => ({
      id: inv.id,
      customerId: inv.customer,
      subscriptionId: inv.subscription ?? undefined,
      amount: inv.amount_paid,
      currency: inv.currency,
      status: inv.status,
      paidAt: inv.status_transitions.paid_at ?? undefined,
      created: inv.created,
      hostedInvoiceUrl: inv.hosted_invoice_url ?? undefined,
      invoicePdf: inv.invoice_pdf ?? undefined,
    }));
  }

  async getCheckoutSession(sessionId: string): Promise<StripeCheckoutSession | null> {
    if (!this.isLive) return null;

    try {
      const data = (await this.stripeRequest(`/checkout/sessions/${sessionId}`)) as {
        id: string;
        url: string;
        status: string;
        customer: string;
        subscription: string;
        payment_intent: string;
      };

      return {
        id: data.id,
        url: data.url,
        status: data.status,
        customerId: data.customer,
        subscriptionId: data.subscription,
        paymentIntentId: data.payment_intent,
      };
    } catch {
      return null;
    }
  }

  async createMeteredUsageRecord(
    subscriptionItemId: string,
    quantity: number,
    action: "increment" | "set" = "increment",
    timestamp?: number,
  ): Promise<{ id: string; quantity: number }> {
    if (!this.isLive) {
      return { id: `usage_mock_${Date.now()}`, quantity };
    }

    const params = new URLSearchParams();
    params.set("quantity", String(Math.max(0, Math.floor(quantity))));
    params.set("action", action);
    params.set("timestamp", String(timestamp ?? Math.floor(Date.now() / 1000)));

    const data = (await this.stripeRequest(
      `/subscription_items/${subscriptionItemId}/usage_records`,
      { method: "POST", body: params.toString() },
    )) as { id: string; quantity: number };

    return { id: data.id, quantity: data.quantity };
  }

  async createInvoice(
    customerId: string,
    lineItems: Array<{ description: string; amount: number; currency?: string }>,
    options?: { dueDate?: number; notes?: string; metadata?: Record<string, string> },
  ): Promise<StripeInvoice> {
    if (!this.isLive) {
      return {
        id: `inv_mock_${Date.now()}`,
        customerId,
        amount: lineItems.reduce((s, i) => s + i.amount, 0),
        currency: lineItems[0]?.currency ?? "usd",
        status: "draft",
        created: Date.now(),
      };
    }

    const invoiceParams = new URLSearchParams();
    invoiceParams.set("customer", customerId);
    invoiceParams.set("collection_method", "send_invoice");
    invoiceParams.set(
      "due_date",
      String(options?.dueDate ?? Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60),
    );
    if (options?.notes) invoiceParams.set("description", options.notes);
    if (options?.metadata) {
      for (const [k, v] of Object.entries(options.metadata)) {
        invoiceParams.set(`metadata[${k}]`, v);
      }
    }

    const inv = (await this.stripeRequest("/invoices", {
      method: "POST",
      body: invoiceParams.toString(),
    })) as { id: string };

    for (const item of lineItems) {
      const itemParams = new URLSearchParams();
      itemParams.set("customer", customerId);
      itemParams.set("invoice", inv.id);
      itemParams.set("description", item.description);
      itemParams.set("amount", String(item.amount));
      itemParams.set("currency", item.currency ?? "usd");
      await this.stripeRequest("/invoiceitems", { method: "POST", body: itemParams.toString() });
    }

    const finalized = (await this.stripeRequest(`/invoices/${inv.id}/finalize`, {
      method: "POST",
    })) as { id: string };

    const sent = (await this.stripeRequest(`/invoices/${finalized.id}/send`, {
      method: "POST",
    })) as {
      id: string;
      customer: string;
      subscription: string | null;
      amount_paid: number;
      currency: string;
      status: string;
      status_transitions: { paid_at: number | null };
      created: number;
      hosted_invoice_url: string | null;
      invoice_pdf: string | null;
    };

    return {
      id: sent.id,
      customerId: sent.customer,
      subscriptionId: sent.subscription ?? undefined,
      amount: sent.amount_paid,
      currency: sent.currency,
      status: sent.status,
      paidAt: sent.status_transitions.paid_at ?? undefined,
      created: sent.created,
      hostedInvoiceUrl: sent.hosted_invoice_url ?? undefined,
      invoicePdf: sent.invoice_pdf ?? undefined,
    };
  }

  async cancelSubscription(
    subscriptionId: string,
    options?: { cancelImmediately?: boolean },
  ): Promise<StripeSubscription | null> {
    if (!this.isLive) return null;

    const params = new URLSearchParams();
    if (options?.cancelImmediately) {
      const data = (await this.stripeRequest(`/subscriptions/${subscriptionId}`, {
        method: "DELETE",
      })) as {
        id: string; customer: string; status: string;
        current_period_start: number; current_period_end: number;
        cancel_at_period_end: boolean; canceled_at: number | null;
        items: { data: Array<{ id: string; price: { id: string; product: string }; quantity: number }> };
      };
      return {
        id: data.id, customerId: data.customer, status: data.status,
        priceId: data.items.data[0]?.price.id ?? "", productId: data.items.data[0]?.price.product,
        currentPeriodStart: data.current_period_start, currentPeriodEnd: data.current_period_end,
        cancelAtPeriodEnd: data.cancel_at_period_end, canceledAt: data.canceled_at ?? undefined,
        items: data.items.data.map(i => ({ id: i.id, priceId: i.price.id, quantity: i.quantity })),
      };
    } else {
      params.set("cancel_at_period_end", "true");
      const data = (await this.stripeRequest(`/subscriptions/${subscriptionId}`, {
        method: "POST",
        body: params.toString(),
      })) as {
        id: string; customer: string; status: string;
        current_period_start: number; current_period_end: number;
        cancel_at_period_end: boolean; canceled_at: number | null;
        items: { data: Array<{ id: string; price: { id: string; product: string }; quantity: number }> };
      };
      return {
        id: data.id, customerId: data.customer, status: data.status,
        priceId: data.items.data[0]?.price.id ?? "", productId: data.items.data[0]?.price.product,
        currentPeriodStart: data.current_period_start, currentPeriodEnd: data.current_period_end,
        cancelAtPeriodEnd: data.cancel_at_period_end, canceledAt: data.canceled_at ?? undefined,
        items: data.items.data.map(i => ({ id: i.id, priceId: i.price.id, quantity: i.quantity })),
      };
    }
  }

  async updateSubscriptionPlan(subscriptionId: string, newPriceId: string): Promise<StripeSubscription | null> {
    if (!this.isLive) return null;

    const sub = (await this.stripeRequest(`/subscriptions/${subscriptionId}`)) as {
      id: string; items: { data: Array<{ id: string }> };
    };

    const itemId = sub.items.data[0]?.id;
    if (!itemId) throw new Error("No subscription item found");

    const params = new URLSearchParams();
    params.set(`items[0][id]`, itemId);
    params.set(`items[0][price]`, newPriceId);
    params.set("proration_behavior", "always_invoice");

    const data = (await this.stripeRequest(`/subscriptions/${subscriptionId}`, {
      method: "POST",
      body: params.toString(),
    })) as {
      id: string; customer: string; status: string;
      current_period_start: number; current_period_end: number;
      cancel_at_period_end: boolean; canceled_at: number | null;
      items: { data: Array<{ id: string; price: { id: string; product: string }; quantity: number }> };
    };

    return {
      id: data.id, customerId: data.customer, status: data.status,
      priceId: data.items.data[0]?.price.id ?? "", productId: data.items.data[0]?.price.product,
      currentPeriodStart: data.current_period_start, currentPeriodEnd: data.current_period_end,
      cancelAtPeriodEnd: data.cancel_at_period_end, canceledAt: data.canceled_at ?? undefined,
      items: data.items.data.map(i => ({ id: i.id, priceId: i.price.id, quantity: i.quantity })),
    };
  }

  async getRevenueAnalytics(): Promise<{
    mrr: number;
    arr: number;
    activeSubscriptions: number;
    trialingSubscriptions: number;
    pastDueSubscriptions: number;
    canceledThisMonth: number;
    churnRate: number;
    recentInvoices: StripeInvoice[];
    newSubscriptionsThisMonth: number;
  }> {
    if (!this.isLive) {
      return {
        mrr: 0, arr: 0,
        activeSubscriptions: 0, trialingSubscriptions: 0, pastDueSubscriptions: 0,
        canceledThisMonth: 0, churnRate: 0, recentInvoices: [],
        newSubscriptionsThisMonth: 0,
      };
    }

    const now = Math.floor(Date.now() / 1000);
    const monthStart = now - 30 * 24 * 60 * 60;

    const [allSubsData, invoiceData] = await Promise.all([
      this.stripeRequest("/subscriptions?limit=100&status=all&expand[]=data.items") as Promise<{
        data: Array<{
          id: string; status: string; cancel_at_period_end: boolean; canceled_at: number | null;
          created: number;
          items: { data: Array<{ price: { unit_amount: number; recurring?: { interval: string } } }> };
        }>;
      }>,
      this.stripeRequest(`/invoices?limit=20&status=paid`) as Promise<{
        data: Array<{
          id: string; customer: string; subscription: string | null; amount_paid: number; currency: string;
          status: string; status_transitions: { paid_at: number | null }; created: number;
          hosted_invoice_url: string | null; invoice_pdf: string | null;
        }>;
      }>,
    ]);

    let mrr = 0;
    let activeSubscriptions = 0;
    let trialingSubscriptions = 0;
    let pastDueSubscriptions = 0;
    let canceledThisMonth = 0;
    let newSubscriptionsThisMonth = 0;

    for (const sub of allSubsData.data) {
      if (sub.status === "active") {
        activeSubscriptions++;
        for (const item of sub.items.data) {
          const price = item.price;
          const amount = price.unit_amount ?? 0;
          const interval = price.recurring?.interval;
          if (interval === "year") mrr += amount / 12;
          else if (interval === "month") mrr += amount;
        }
        if (sub.created >= monthStart) newSubscriptionsThisMonth++;
      } else if (sub.status === "trialing") {
        trialingSubscriptions++;
        if (sub.created >= monthStart) newSubscriptionsThisMonth++;
      } else if (sub.status === "past_due") {
        pastDueSubscriptions++;
      } else if (sub.status === "canceled" && sub.canceled_at && sub.canceled_at >= monthStart) {
        canceledThisMonth++;
      }
    }

    const totalAtStartOfMonth = activeSubscriptions + canceledThisMonth;
    const churnRate = totalAtStartOfMonth > 0 ? (canceledThisMonth / totalAtStartOfMonth) * 100 : 0;

    const recentInvoices: StripeInvoice[] = invoiceData.data.map(inv => ({
      id: inv.id, customerId: inv.customer, subscriptionId: inv.subscription ?? undefined,
      amount: inv.amount_paid, currency: inv.currency, status: inv.status,
      paidAt: inv.status_transitions.paid_at ?? undefined, created: inv.created,
      hostedInvoiceUrl: inv.hosted_invoice_url ?? undefined, invoicePdf: inv.invoice_pdf ?? undefined,
    }));

    return {
      mrr: Math.round(mrr), arr: Math.round(mrr * 12),
      activeSubscriptions, trialingSubscriptions, pastDueSubscriptions,
      canceledThisMonth, churnRate: Math.round(churnRate * 10) / 10,
      recentInvoices, newSubscriptionsThisMonth,
    };
  }

  async getCustomerById(customerId: string): Promise<StripeCustomer | null> {
    if (!this.isLive) {
      return { id: customerId, email: 'demo@example.com', name: 'Demo Customer' };
    }

    try {
      const data = (await this.stripeRequest(`/customers/${customerId}`)) as {
        id: string;
        email: string;
        name: string;
        deleted?: boolean;
        metadata: Record<string, string>;
      };
      if (data.deleted) return null;
      return { id: data.id, email: data.email, name: data.name, metadata: data.metadata };
    } catch {
      return null;
    }
  }

  /**
   * ensureCustomer: Returns the existing Stripe customer for the given org's
   * billingCustomerId if one exists, otherwise creates a new customer and
   * returns it. Callers should persist the returned customer ID back to the
   * organizations.billingCustomerId column.
   *
   * An optional idempotencyKey is forwarded as the Stripe-Idempotency-Key
   * header so concurrent calls with the same key converge to a single customer.
   */
  async ensureCustomer(
    email: string,
    name?: string,
    metadata?: Record<string, string>,
    idempotencyKey?: string,
  ): Promise<StripeCustomer> {
    if (!this.isLive) {
      return { id: `cus_demo_${Date.now()}`, email, name, metadata };
    }

    const existing = await this.getCustomerByEmail(email);
    if (existing) return existing;

    const params = new URLSearchParams();
    params.set('email', email);
    if (name) params.set('name', name);
    if (metadata) {
      for (const [k, v] of Object.entries(metadata)) {
        params.set(`metadata[${k}]`, v);
      }
    }

    const headers: Record<string, string> = {};
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

    const data = (await this.stripeRequest('/customers', {
      method: 'POST',
      body: params.toString(),
      headers,
    })) as { id: string; email: string; name: string; metadata: Record<string, string> };

    return { id: data.id, email: data.email, name: data.name, metadata: data.metadata };
  }

  /**
   * createRefund: Issues a Stripe refund for a given charge or payment intent.
   * The idempotencyKey prevents double-refunds when the caller retries on
   * network failures.
   */
  async createRefund(options: {
    chargeId?: string;
    paymentIntentId?: string;
    amount?: number;
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
    idempotencyKey?: string;
    metadata?: Record<string, string>;
  }): Promise<{ id: string; amount: number; currency: string; status: string }> {
    if (!this.isLive) {
      return {
        id: `re_demo_${Date.now()}`,
        amount: options.amount ?? 0,
        currency: 'usd',
        status: 'succeeded',
      };
    }

    const params = new URLSearchParams();
    if (options.chargeId) params.set('charge', options.chargeId);
    if (options.paymentIntentId) params.set('payment_intent', options.paymentIntentId);
    if (options.amount) params.set('amount', String(Math.floor(options.amount)));
    if (options.reason) params.set('reason', options.reason);
    if (options.metadata) {
      for (const [k, v] of Object.entries(options.metadata)) {
        params.set(`metadata[${k}]`, v);
      }
    }

    const headers: Record<string, string> = {};
    if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;

    const data = (await this.stripeRequest('/refunds', {
      method: 'POST',
      body: params.toString(),
      headers,
    })) as { id: string; amount: number; currency: string; status: string };

    return { id: data.id, amount: data.amount, currency: data.currency, status: data.status };
  }

  /**
   * listPaymentMethods: Returns saved payment methods for a Stripe customer.
   */
  async listPaymentMethods(
    customerId: string,
    type: string = 'card',
  ): Promise<
    Array<{
      id: string;
      type: string;
      brand?: string;
      last4?: string;
      expMonth?: number;
      expYear?: number;
      isDefault: boolean;
    }>
  > {
    if (!this.isLive) {
      return [
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
    }

    const [pmData, customerData] = await Promise.all([
      this.stripeRequest(
        `/payment_methods?customer=${customerId}&type=${type}&limit=20`,
      ) as Promise<{
        data: Array<{
          id: string;
          type: string;
          card?: { brand: string; last4: string; exp_month: number; exp_year: number };
        }>;
      }>,
      this.stripeRequest(`/customers/${customerId}`) as Promise<{
        invoice_settings?: { default_payment_method?: string };
      }>,
    ]);

    const defaultPmId = customerData.invoice_settings?.default_payment_method;
    return pmData.data.map((pm) => ({
      id: pm.id,
      type: pm.type,
      brand: pm.card?.brand,
      last4: pm.card?.last4,
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
      isDefault: pm.id === defaultPmId,
    }));
  }

  /**
   * resolveChargeCustomer — returns the Stripe customer ID attached to the
   * given charge or payment intent. Used for cross-tenant ownership validation
   * before issuing a refund.
   *
   * Returns `null` in demo mode (isLive=false) — callers must still apply their
   * own org-level ownership check using billingCustomerId from the DB.
   */
  /**
   * getInvoicePaymentIntent — resolves the Stripe payment_intent ID attached
   * to a Stripe invoice. Used by the refund workflow when a request was linked
   * only by invoiceId (no direct chargeId/paymentIntentId on the request row).
   *
   * Returns null in demo mode — callers must handle the null case gracefully
   * (demo mode's refundPayment() does not require a Stripe ref).
   */
  async getInvoicePaymentIntent(stripeInvoiceId: string): Promise<string | null> {
    if (!this.isLive) return null;
    const invoice = (await this.stripeRequest(`/invoices/${stripeInvoiceId}`)) as {
      payment_intent?: string | null;
    };
    return invoice.payment_intent ?? null;
  }

  async resolveChargeCustomer(options: {
    chargeId?: string;
    paymentIntentId?: string;
  }): Promise<string | null> {
    if (!this.isLive) {
      return null;
    }
    if (options.chargeId) {
      const charge = (await this.stripeRequest(`/charges/${options.chargeId}`)) as {
        customer?: string | null;
      };
      return charge.customer ?? null;
    }
    if (options.paymentIntentId) {
      const pi = (await this.stripeRequest(
        `/payment_intents/${options.paymentIntentId}`,
      )) as { customer?: string | null };
      return pi.customer ?? null;
    }
    return null;
  }

  async verifyWebhookPayload(
    payload: string | Buffer,
    signature: string | undefined,
  ): Promise<{ verified: boolean; event: Record<string, unknown> | null }> {
    const body = typeof payload === "string" ? payload : payload.toString("utf8");
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(body);
    } catch {
      return { verified: false, event: null };
    }

    if (!this.isLive || !this.webhookSecret) {
      return { verified: true, event };
    }

    if (!signature) {
      return { verified: false, event: null };
    }

    const crypto = await import("node:crypto");
    const parts = signature.split(",");
    const timestampPart = parts.find((p: string) => p.startsWith("t="));
    const sigParts = parts.filter((p: string) => p.startsWith("v1="));

    if (!timestampPart || sigParts.length === 0) {
      return { verified: false, event: null };
    }

    const timestamp = timestampPart.split("=")[1] ?? "";
    const signedPayload = `${timestamp}.${body}`;
    const expectedSig = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(signedPayload)
      .digest("hex");

    const verified = sigParts.some((s: string) => {
      const sig = s.split("=")[1] ?? "";
      try {
        return crypto.timingSafeEqual(
          Buffer.from(expectedSig, "hex"),
          Buffer.from(sig, "hex"),
        );
      } catch {
        return false;
      }
    });

    if (!verified) {
      return { verified: false, event: null };
    }

    const tolerance = 300;
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp, 10)) > tolerance) {
      return { verified: false, event: null };
    }

    return { verified, event };
  }

  /**
   * createBankAccountTokenFromPlaid — converts a Plaid processor token into a
   * Stripe bank account token. The token is subsequently attached to the
   * Stripe customer as a payment method for ACH debits.
   */
  async createBankAccountTokenFromPlaid(
    processorToken: string,
  ): Promise<{ id: string; bank_account?: { bank_name?: string; last4?: string } }> {
    if (!this.isLive) {
      return { id: `btok_demo_${Date.now()}`, bank_account: { bank_name: 'Demo Bank', last4: '0000' } };
    }
    const params = new URLSearchParams();
    params.set('bank_account[account_holder_type]', 'company');
    params.set('bank_account[country]', 'US');
    params.set('bank_account[currency]', 'usd');
    params.set('bank_account[token]', processorToken);

    const data = (await this.stripeRequest('/tokens', {
      method: 'POST',
      body: params.toString(),
    })) as { id: string; bank_account?: { bank_name?: string; last4?: string } };

    return data;
  }

  /**
   * createAchCharge — initiates an ACH bank debit charge.
   *
   * Uses the Stripe Charges API (POST /v1/charges) with the customer's
   * attached bank account source (`ba_*`). This is the correct Stripe path
   * for ACH charges that originate from a Plaid processor token, since:
   *   btok_* → attachBankAccountToCustomer → ba_* (customer source)
   * and the Charges API is the standard way to debit a `ba_*` source.
   *
   * Stripe sends charge.pending → charge.succeeded | charge.failed webhooks
   * for ACH charges, which are already handled by billing-webhook.ts.
   */
  async createAchCharge(options: {
    amount: number;
    currency: string;
    customerId: string;
    paymentMethodId: string; // ba_* bank account source ID
    invoiceId: string;
    orgId: number;
    internalInvoiceId?: string;
  }): Promise<{ id: string; status: string; amount: number }> {
    if (!this.isLive) {
      return {
        id: `ch_demo_ach_${Date.now()}`,
        status: 'pending',
        amount: options.amount,
      };
    }

    // Use the Stripe Charges API to debit the bank account source (ba_*).
    // PaymentIntents require pm_us_bank_account (Financial Connections);
    // ba_* bank account sources must go through the legacy Charges API.
    const params = new URLSearchParams();
    params.set('amount', String(options.amount));
    params.set('currency', options.currency);
    params.set('customer', options.customerId);
    params.set('source', options.paymentMethodId); // ba_* bank account source
    params.set('metadata[invoiceId]', options.invoiceId);
    params.set('metadata[internalInvoiceId]', options.internalInvoiceId ?? options.invoiceId);
    params.set('metadata[orgId]', String(options.orgId));
    params.set('metadata[rail]', 'ach');

    const data = (await this.stripeRequest('/charges', {
      method: 'POST',
      body: params.toString(),
    })) as { id: string; status: string; amount: number };

    return { id: data.id, status: data.status, amount: data.amount };
  }

  /**
   * attachBankAccountToCustomer — converts a Plaid processor bank account token
   * (btok_*) into a Customer Source and returns the resulting bank account
   * object. Callers should persist the returned `id` (ba_*) as the payment
   * method reference rather than the raw bank token.
   */
  async attachBankAccountToCustomer(
    customerId: string,
    bankToken: string,
  ): Promise<{ id: string; bank_name?: string; last4?: string }> {
    if (!this.isLive) {
      return { id: `ba_demo_${Date.now()}`, bank_name: 'Demo Bank', last4: '0000' };
    }
    const params = new URLSearchParams();
    params.set('source', bankToken);
    const data = (await this.stripeRequest(`/customers/${customerId}/sources`, {
      method: 'POST',
      body: params.toString(),
    })) as { id: string; bank_name?: string; last4?: string };
    return { id: data.id, bank_name: data.bank_name, last4: data.last4 };
  }

  /**
   * markInvoicePaidOutOfBand — marks a Stripe invoice as paid without charging
   * a payment method. Used when an out-of-band payment (e.g. confirmed crypto
   * on-chain) settles the obligation so Stripe invoice state stays in sync.
   */
  async markInvoicePaidOutOfBand(stripeInvoiceId: string): Promise<void> {
    if (!this.isLive) {
      return;
    }
    const params = new URLSearchParams();
    params.set('paid_out_of_band', 'true');
    await this.stripeRequest(`/invoices/${stripeInvoiceId}/pay`, {
      method: 'POST',
      body: params.toString(),
    });
  }

  /**
   * payStripeInvoice — pays an existing Stripe invoice with a specific payment
   * method. Used by the card rail to charge via the Stripe Invoices API so the
   * payment appears in the Stripe dashboard ledger.
   */
  async payStripeInvoice(
    stripeInvoiceId: string,
    paymentMethodId: string,
  ): Promise<{ status: string }> {
    if (!this.isLive) {
      return { status: 'paid' };
    }
    const body = new URLSearchParams({ payment_method: paymentMethodId });
    const result = (await this.stripeRequest(`/invoices/${stripeInvoiceId}/pay`, {
      method: 'POST',
      body: body.toString(),
    })) as { status: string };
    return { status: result.status };
  }

  /**
   * createPaymentIntentForRail — creates a Stripe PaymentIntent with
   * `confirm: true` for a one-off card charge initiated from the unified rail
   * adapter (i.e., when there is no existing Stripe invoice to pay).
   */
  async createPaymentIntentForRail(params: {
    amount: number;
    currency: string;
    paymentMethodId: string;
    internalInvoiceId: string;
    orgId: number;
  }): Promise<{ id: string; status: string }> {
    if (!this.isLive) {
      return { id: `pi_demo_${Date.now()}`, status: 'succeeded' };
    }
    const body = new URLSearchParams({
      amount: String(params.amount),
      currency: params.currency,
      payment_method: params.paymentMethodId,
      confirm: 'true',
      'automatic_payment_methods[enabled]': 'true',
      'automatic_payment_methods[allow_redirects]': 'never',
      'metadata[internalInvoiceId]': params.internalInvoiceId,
      'metadata[orgId]': String(params.orgId),
      'metadata[rail]': 'card',
    });
    const result = (await this.stripeRequest('/payment_intents', {
      method: 'POST',
      body: body.toString(),
    })) as { id: string; status: string };
    return { id: result.id, status: result.status };
  }

  /**
   * getStripePayouts — retrieves recently paid-out transfers for reconciliation.
   * Returns the payouts with their associated balance transaction details.
   */
  async getStripePayouts(
    createdAfterUnix: number,
    limit = 50,
  ): Promise<
    Array<{
      id: string;
      amount: number;
      currency: string;
      arrivalDate: number;
      status: string;
      description?: string;
    }>
  > {
    if (!this.isLive) {
      return [];
    }
    const data = (await this.stripeRequest(
      `/payouts?status=paid&created[gte]=${createdAfterUnix}&limit=${limit}`,
    )) as {
      data: Array<{
        id: string;
        amount: number;
        currency: string;
        arrival_date: number;
        status: string;
        description?: string;
      }>;
    };
    return data.data.map((p) => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      arrivalDate: p.arrival_date,
      status: p.status,
      description: p.description,
    }));
  }
}
