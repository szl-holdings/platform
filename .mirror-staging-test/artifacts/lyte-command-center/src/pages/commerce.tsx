import { useState, useEffect } from "react";
import { CreditCard, Package, ArrowUpRight, Loader2, CheckCircle, AlertTriangle, ExternalLink, ShoppingCart } from "lucide-react";

interface StripeProduct {
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

interface StripeConfig {
  stripeConnected: boolean;
  stripeMode: "live" | "test" | "mock";
  webhookSecretConfigured: boolean;
  priceIdsConfigured: number;
  priceIdsTotal: number;
  instructions: string;
}

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount / 100);
}

export default function Commerce() {
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [config, setConfig] = useState<StripeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/billing/products").then((r) => r.json()),
      fetch("/api/billing/stripe-config").then((r) => r.json()),
    ])
      .then(([productsData, configData]) => {
        if (Array.isArray(productsData)) {
          setProducts(productsData);
        } else if (productsData?.data && Array.isArray(productsData.data)) {
          setProducts(productsData.data);
        }
        if (configData?.data) {
          setConfig(configData.data);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleCheckout = async (priceId: string, productName: string, interval?: string) => {
    setCheckoutLoading(priceId);
    setCheckoutError(null);
    try {
      const successUrl = window.location.origin + window.location.pathname + "?checkout=success";
      const cancelUrl = window.location.origin + window.location.pathname + "?checkout=cancel";
      const mode = interval ? "subscription" : "payment";

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          mode,
          successUrl,
          cancelUrl,
        }),
      });

      const data = await res.json();
      if (data?.data?.url) {
        window.open(data.data.url, "_blank");
      } else if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        setCheckoutError(`Checkout failed for ${productName}: ${data?.error || "No checkout URL returned"}`);
      }
    } catch (err) {
      setCheckoutError(`Checkout failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const modeColor =
    config?.stripeMode === "live"
      ? "text-[#6b8f71] border-[#6b8f71]/30 bg-[#6b8f71]/10"
      : config?.stripeMode === "test"
        ? "text-[#d4a054] border-[#d4a054]/30 bg-[#d4a054]/10"
        : "text-slate-400 border-slate-500/30 bg-slate-500/10";

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-white mb-2">Commerce & Products</h2>
          <p className="text-slate-400 text-lg">Stripe product catalog and payment status across the SZL portfolio.</p>
        </div>
        {config && (
          <span className={`text-xs px-3 py-1.5 rounded-full font-semibold border ${modeColor}`}>
            Stripe: {config.stripeMode.toUpperCase()}
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-[#c45a4a]/30 bg-[#c45a4a]/5 p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-[#c45a4a]" />
          <span className="text-sm text-[#c45a4a]">{error}</span>
        </div>
      )}

      {checkoutError && (
        <div className="rounded-xl border border-[#c8953c]/30 bg-[#c8953c]/5 p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-[#c8953c]" />
          <span className="text-sm text-[#c8953c]">{checkoutError}</span>
        </div>
      )}

      {config && config.stripeMode === "mock" && (
        <div className="rounded-xl border border-[#d4a054]/30 bg-[#d4a054]/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#d4a054] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#d4a054] mb-1">Stripe is in mock mode</p>
              <p className="text-xs text-[#d4a054]/70">{config.instructions}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Package className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Total Products</span>
          </div>
          <div className="text-3xl font-bold text-white">{products.length}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#6b8f71]/20 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-[#6b8f71]" />
            </div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Active Products</span>
          </div>
          <div className="text-3xl font-bold text-white">{products.filter((p) => p.active).length}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#8b7ac8]/20 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-[#8b7ac8]" />
            </div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Total Price Points</span>
          </div>
          <div className="text-3xl font-bold text-white">{products.reduce((sum, p) => sum + p.prices.length, 0)}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-sky-400" />
            </div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Price IDs Set</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {config ? `${config.priceIdsConfigured}/${config.priceIdsTotal}` : "—"}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h3 className="text-lg font-semibold text-white">Product Catalog</h3>
          <p className="text-sm text-slate-400 mt-1">Products and pricing pulled from Stripe</p>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Package className="w-12 h-12 text-slate-600 mb-4" />
            <p className="text-slate-400 text-sm">No products found in Stripe</p>
            <p className="text-slate-500 text-xs mt-1">
              {config?.stripeMode === "mock"
                ? "Connect Stripe and create products to see them here"
                : "Create products in your Stripe dashboard to see them here"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {products.map((product) => (
              <div key={product.id} className="p-5 hover:bg-white/5 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-base font-semibold text-white">{product.name}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        product.active ? "bg-[#6b8f71]/10 text-[#6b8f71] border border-[#6b8f71]/30" : "bg-[#c45a4a]/10 text-[#c45a4a] border border-[#c45a4a]/30"
                      }`}>
                        {product.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {product.description && (
                      <p className="text-sm text-slate-400 mb-3">{product.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {product.prices.map((price) => (
                        <div key={price.id} className="flex items-center gap-2">
                          <span className="text-sm px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                            {formatPrice(price.amount, price.currency)}
                            {price.interval && <span className="text-cyan-400/60">/{price.interval}</span>}
                          </span>
                          {product.active && config?.stripeMode !== "mock" && (
                            <button
                              onClick={() => handleCheckout(price.id, product.name, price.interval)}
                              disabled={checkoutLoading === price.id}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-medium transition-colors disabled:opacity-50 border border-cyan-500/20"
                            >
                              {checkoutLoading === price.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <ShoppingCart className="w-3 h-3" />
                              )}
                              Checkout
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-xs font-mono text-slate-500">{product.id}</span>
                    <a
                      href={`https://dashboard.stripe.com/products/${product.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Dashboard
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {config && (
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <h3 className="text-lg font-semibold text-white">Stripe Configuration</h3>
            <p className="text-sm text-slate-400 mt-1">Price ID configuration status for each product checkout flow</p>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            {config && (
              <>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-sm text-slate-300">Stripe Secret Key</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.stripeConnected ? "bg-[#6b8f71]/10 text-[#6b8f71]" : "bg-[#c45a4a]/10 text-[#c45a4a]"}`}>
                    {config.stripeConnected ? "Configured" : "Missing"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-sm text-slate-300">Webhook Secret</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.webhookSecretConfigured ? "bg-[#6b8f71]/10 text-[#6b8f71]" : "bg-[#d4a054]/10 text-[#d4a054]"}`}>
                    {config.webhookSecretConfigured ? "Configured" : "Missing"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
