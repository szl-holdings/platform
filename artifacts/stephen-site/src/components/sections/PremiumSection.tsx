import { useState, useEffect } from "react";
import { Lock, Loader2, CheckCircle, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export function PremiumSection() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    fetch("/api/billing/products")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, []);

  const handleSubscribe = async (priceId?: string) => {
    setLoading(true);
    try {
      const baseUrl = window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, "");
      const selectedPriceId = priceId || products[0]?.prices[0]?.id;

      if (!selectedPriceId) {
        alert("No subscription plan available. Please try again later.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: selectedPriceId,
          mode: "subscription",
          successUrl: baseUrl + "/checkout/success?session_id={CHECKOUT_SESSION_ID}",
          cancelUrl: baseUrl + "/checkout/cancel",
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Could not create checkout session. Please try again.");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const mainProduct = products[0];
  const mainPrice = mainProduct?.prices[0];

  return (
    <section id="premium" className="py-32 bg-background relative overflow-hidden border-t border-white/5">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl relative z-10">
        <div className="glass-panel rounded-3xl overflow-hidden relative border border-primary/20 shadow-2xl shadow-primary/5">
          
          <div className="p-12 filter blur-md opacity-40 select-none">
            <h3 className="text-3xl font-serif font-bold text-foreground mb-6">Exclusive VC Insights Q3</h3>
            <div className="space-y-4">
              <div className="h-4 bg-secondary rounded w-3/4"></div>
              <div className="h-4 bg-secondary rounded w-full"></div>
              <div className="h-4 bg-secondary rounded w-5/6"></div>
              <div className="h-4 bg-secondary rounded w-full"></div>
              <div className="h-4 bg-secondary rounded w-2/3"></div>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-6">
              <div className="h-32 bg-secondary rounded-xl"></div>
              <div className="h-32 bg-secondary rounded-xl"></div>
            </div>
          </div>

          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-background/60 backdrop-blur-sm">
            <div className="w-16 h-16 rounded-full bg-gradient-to-b from-primary to-yellow-600 flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
              <Lock className="w-8 h-8 text-background" />
            </div>
            <h3 className="text-3xl font-serif font-bold text-foreground mb-4">Premium Content</h3>
            <p className="text-muted-foreground max-w-md mb-4 text-lg">
              Unlock exclusive architectural templates, investment thesis reports, and deep technical analyses.
            </p>

            {mainPrice && (
              <p className="text-2xl font-bold text-primary mb-6">
                {formatPrice(mainPrice.amount, mainPrice.currency)}
                {mainPrice.interval && <span className="text-base font-normal text-muted-foreground">/{mainPrice.interval}</span>}
              </p>
            )}

            {products.length > 1 && (
              <div className="flex flex-wrap gap-3 mb-6 max-w-lg">
                {products.map((product) => {
                  const price = product.prices[0];
                  if (!price) return null;
                  return (
                    <Button
                      key={product.id}
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => handleSubscribe(price.id)}
                      disabled={loading}
                    >
                      <Crown className="w-3 h-3 mr-1" />
                      {product.name} — {formatPrice(price.amount, price.currency)}/{price.interval || "once"}
                    </Button>
                  );
                })}
              </div>
            )}

            <Button
              size="lg"
              className="rounded-full px-10 py-6 text-base font-semibold shadow-xl shadow-primary/20"
              onClick={() => handleSubscribe()}
              disabled={loading || loadingProducts}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Redirecting to Checkout...
                </>
              ) : (
                "Subscribe to Access"
              )}
            </Button>
            <p className="mt-6 text-sm text-muted-foreground">
              Already a member? <a href="#" className="text-primary hover:underline">Log in</a>
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
