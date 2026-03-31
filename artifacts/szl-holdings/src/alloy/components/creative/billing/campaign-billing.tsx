import * as React from "react";
import { CreditCard, ExternalLink, Package, Loader2, Copy, CheckCircle } from "lucide-react";

interface StripeProduct {
  id: string;
  name: string;
  description: string;
  active: boolean;
  prices: Array<{ id: string; amount: number; currency: string; interval?: string }>;
}

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount / 100);
}

interface CampaignBillingProps {
  campaignId: string;
  campaignName: string;
}

export function CampaignBilling({ campaignId, campaignName }: CampaignBillingProps) {
  const [products, setProducts] = React.useState<StripeProduct[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creatingLink, setCreatingLink] = React.useState<string | null>(null);
  const [paymentLink, setPaymentLink] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/billing/products")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setProducts(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreatePaymentLink = async (priceId: string) => {
    setCreatingLink(priceId);
    try {
      const baseUrl = window.location.origin;
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          mode: "payment",
          successUrl: baseUrl + "/alloy/?billing=success",
          cancelUrl: baseUrl + "/alloy/?billing=cancel",
          metadata: { campaignId, campaignName },
        }),
      });
      const data = await res.json();
      if (data.url) setPaymentLink(data.url);
    } catch {
    } finally {
      setCreatingLink(null);
    }
  };

  const handleCopy = () => {
    if (paymentLink) {
      navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Campaign Billing</h2>
        <p className="text-sm text-slate-400">
          Associate payment links with this campaign for client billing.
        </p>
      </div>

      {paymentLink && (
        <div className="p-4 border border-cyan-500/20 bg-cyan-500/5 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-400">Payment Link Created</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={paymentLink}
              className="flex-1 px-3 py-2 text-xs font-mono bg-black/30 border border-white/10 rounded-lg text-slate-300"
            />
            <button onClick={handleCopy} className="p-2 rounded-lg border border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300 transition-colors">
              {copied ? <CheckCircle className="w-4 h-4 text-cyan-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <a href={paymentLink} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300 transition-colors">
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-white mb-3">Available Products</h3>
        {products.length === 0 ? (
          <div className="p-8 text-center bg-[#0d1117] border border-white/8 rounded-xl">
            <Package className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No Stripe products available</p>
            <p className="text-xs text-slate-600 mt-1">Create products in Stripe to generate payment links.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((product) => (
              <div key={product.id} className="p-4 bg-[#0d1117] border border-white/8 hover:border-white/12 rounded-xl transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{product.name}</h4>
                    {product.description && (
                      <p className="text-xs text-slate-500 mt-1">{product.description}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${product.active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                    {product.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {product.prices.map((price) => (
                    <span key={price.id} className="text-xs px-2 py-1 rounded bg-white/5 font-mono text-slate-400">
                      {formatPrice(price.amount, price.currency)}{price.interval && `/${price.interval}`}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  {product.prices.map((price) => (
                    <button
                      key={price.id}
                      disabled={creatingLink === price.id}
                      onClick={() => handleCreatePaymentLink(price.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {creatingLink === price.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <CreditCard className="w-3 h-3" />
                      )}
                      Create Payment Link
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
