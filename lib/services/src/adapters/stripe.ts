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
    return process.env["STRIPE_SECRET_KEY"];
  }

  private get webhookSecret(): string | undefined {
    return process.env["STRIPE_WEBHOOK_SECRET"];
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
      const isTest = this.secretKey!.startsWith("sk_test_");
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
      return { id: "cus_mock_" + Date.now(), email, name, metadata };
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
  }): Promise<StripeCheckoutSession> {
    if (!this.isLive) {
      return {
        id: "cs_mock_" + Date.now(),
        url: options.successUrl + "?session_id=cs_mock_" + Date.now(),
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

    const data = (await this.stripeRequest("/checkout/sessions", {
      method: "POST",
      body: params.toString(),
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
      return { id: "bps_mock_" + Date.now(), url: returnUrl };
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
      return { id: "usage_mock_" + Date.now(), quantity };
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
        id: "inv_mock_" + Date.now(),
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

    const crypto = await import("crypto");
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
    if (Math.abs(now - parseInt(timestamp)) > tolerance) {
      return { verified: false, event: null };
    }

    return { verified, event };
  }
}
