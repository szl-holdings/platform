import * as React from "react";
import { CreditCard, ExternalLink, Package, Loader2, Copy, CheckCircle } from "lucide-react";
import { Button, Card } from "@/components/ui";

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
          successUrl: baseUrl + "/dreamscape/?billing=success",
          cancelUrl: baseUrl + "/dreamscape/?billing=cancel",
          metadata: { campaignId, campaignName },
        }),
      });
      const data = await res.json();
      if (data.url) {
        setPaymentLink(data.url);
      }
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
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div>
        <h2 className="text-xl font-display font-bold text-foreground mb-1">Campaign Billing</h2>
        <p className="text-sm text-muted-foreground">
          Associate payment links with this campaign for client billing.
        </p>
      </div>

      {paymentLink && (
        <Card className="p-4 border-primary/30 bg-primary/5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Payment Link Created</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={paymentLink}
              className="flex-1 px-3 py-2 text-xs font-mono bg-background border border-border rounded-lg"
            />
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
            <a href={paymentLink} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </Card>
      )}

      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Available Products</h3>
        {products.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No Stripe products available</p>
            <p className="text-xs text-muted-foreground mt-1">Create products in Stripe to generate payment links.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{product.name}</h4>
                    {product.description && (
                      <p className="text-xs text-muted-foreground mt-1">{product.description}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${product.active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                    {product.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {product.prices.map((price) => (
                    <span key={price.id} className="text-xs px-2 py-1 rounded bg-muted font-mono">
                      {formatPrice(price.amount, price.currency)}{price.interval && `/${price.interval}`}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  {product.prices.map((price) => (
                    <Button
                      key={price.id}
                      variant="outline"
                      size="sm"
                      disabled={creatingLink === price.id}
                      onClick={() => handleCreatePaymentLink(price.id)}
                    >
                      {creatingLink === price.id ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : (
                        <CreditCard className="w-3 h-3 mr-1" />
                      )}
                      Create Payment Link
                    </Button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
