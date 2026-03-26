import { useState, useEffect } from "react";
import { CreditCard, Package, ArrowUpRight, Loader2, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";

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

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount / 100);
}

export default function Commerce() {
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing/products")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-white mb-2">Commerce & Products</h2>
          <p className="text-slate-400 text-lg">Stripe product catalog and payment status across the SZL portfolio.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Active Products</span>
          </div>
          <div className="text-3xl font-bold text-white">{products.filter((p) => p.active).length}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Total Price Points</span>
          </div>
          <div className="text-3xl font-bold text-white">{products.reduce((sum, p) => sum + p.prices.length, 0)}</div>
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
            <p className="text-slate-500 text-xs mt-1">Create products in Stripe to see them here</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {products.map((product) => (
              <div key={product.id} className="p-5 hover:bg-white/5 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-base font-semibold text-white">{product.name}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        product.active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-red-500/10 text-red-400 border border-red-500/30"
                      }`}>
                        {product.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {product.description && (
                      <p className="text-sm text-slate-400 mb-3">{product.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {product.prices.map((price) => (
                        <span key={price.id} className="text-sm px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                          {formatPrice(price.amount, price.currency)}
                          {price.interval && <span className="text-cyan-400/60">/{price.interval}</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-500">{product.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
