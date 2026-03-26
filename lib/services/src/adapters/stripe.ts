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
      throw new Error(`Stripe API error: ${response.status} ${response.statusText}`);
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
}
