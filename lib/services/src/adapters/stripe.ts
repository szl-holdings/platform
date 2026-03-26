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
    interval?: string;
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
  name?: string;
  metadata?: Record<string, string>;
}

export interface StripeSubscription {
  id: string;
  customerId: string;
  status: string;
  priceId: string;
  productId?: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  canceledAt?: number;
  items: Array<{
    id: string;
    priceId: string;
    quantity: number;
  }>;
}

export interface StripeInvoice {
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

  protected async performHealthCheck(): Promise<void> {
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
    const c = data.data[0];
    return { id: c.id, email: c.email, name: c.name, metadata: c.metadata };
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

    const timestamp = timestampPart.split("=")[1];
    const signedPayload = `${timestamp}.${body}`;
    const expectedSig = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(signedPayload)
      .digest("hex");

    const verified = sigParts.some((s: string) => {
      const sig = s.split("=")[1];
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
