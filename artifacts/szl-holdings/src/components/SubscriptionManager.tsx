import { useState, useEffect } from "react";
import {
  CreditCard, CheckCircle2, AlertCircle, Clock, XCircle,
  ExternalLink, RefreshCw, Loader2, ChevronDown, ChevronUp, FileText,
  TrendingUp, Calendar,
} from "lucide-react";
import { trackEvent } from "@szl-holdings/observability/react";

interface Subscription {
  id: string;
  customerId: string;
  status: string;
  priceId: string;
  productId?: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  canceledAt?: number;
  items: Array<{ id: string; priceId: string; quantity: number }>;
}

interface Invoice {
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

interface SubscriptionManagerProps {
  customerEmail?: string;
  customerId?: string;
  returnUrl?: string;
  apiBase?: string;
  onManageClick?: () => void;
  className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2; bg: string }> = {
  active: { label: "Active", color: "text-emerald-500", icon: CheckCircle2, bg: "bg-emerald-500/10 border-emerald-500/20" },
  trialing: { label: "Trial", color: "text-blue-400", icon: Clock, bg: "bg-blue-500/10 border-blue-500/20" },
  past_due: { label: "Past Due", color: "text-amber-500", icon: AlertCircle, bg: "bg-amber-500/10 border-amber-500/20" },
  canceled: { label: "Canceled", color: "text-red-400", icon: XCircle, bg: "bg-red-500/10 border-red-500/20" },
  paused: { label: "Paused", color: "text-zinc-400", icon: Clock, bg: "bg-zinc-500/10 border-zinc-500/20" },
};

function formatCents(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatDateMs(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export function SubscriptionManager({
  customerEmail,
  customerId,
  returnUrl,
  apiBase = "/api",
  onManageClick,
  className = "",
}: SubscriptionManagerProps) {
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showInvoices, setShowInvoices] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const params = new URLSearchParams();
  if (customerEmail) params.set("email", customerEmail);
  if (customerId) params.set("customerId", customerId);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/billing/subscription-status?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = await res.json();
      const d = json.data ?? json;
      setSubscribed(d.subscribed ?? false);
      setSubscription(d.subscription ?? null);

      const resolvedId = customerId ?? d.subscription?.customerId;
      if (resolvedId) {
        const invRes = await fetch(`${apiBase}/billing/stripe-invoices?customerId=${resolvedId}`, {
          credentials: "include",
        });
        if (invRes.ok) {
          const invJson = await invRes.json();
          setInvoices(invJson.data ?? invJson ?? []);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subscription");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, [customerEmail, customerId]);

  const openBillingPortal = async () => {
    setPortalLoading(true);
    setActionMsg(null);
    trackEvent("billing_portal_opened", { product: "szl-holdings", source: "subscription_manager" });
    try {
      const res = await fetch(`${apiBase}/billing/portal-session`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnUrl: returnUrl ?? window.location.href,
        }),
      });
      const json = await res.json();
      const url = json.data?.url ?? json.url;
      if (url) {
        window.location.href = url;
      } else {
        setActionMsg("Unable to open billing portal. Please contact support.");
      }
    } catch {
      setActionMsg("Unable to open billing portal. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!subscription?.id) return;
    if (!cancelConfirm) {
      setCancelConfirm(true);
      return;
    }
    setCancelLoading(true);
    setActionMsg(null);
    setCancelConfirm(false);
    try {
      const res = await fetch(`${apiBase}/billing/cancel-subscription`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: subscription.id }),
      });
      const json = await res.json();
      const d = json.data ?? json;
      setActionMsg(d.message ?? "Subscription will cancel at end of billing period");
      await fetchStatus();
    } catch {
      setActionMsg("Failed to cancel subscription. Please try again or contact support.");
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-10 ${className}`}>
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-xl border border-red-500/20 bg-red-500/5 p-5 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Unable to load subscription</p>
            <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
            <button
              onClick={fetchStatus}
              className="mt-3 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!subscribed || !subscription) {
    return (
      <div className={`rounded-xl border border-border bg-card p-5 ${className}`}>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-muted/30 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">No active subscription</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              You don't have an active subscription. Choose a plan to get started.
            </p>
            <div className="flex items-center gap-2 mt-3">
              {onManageClick && (
                <button
                  onClick={() => {
                    trackEvent("upgrade_clicked", { product: "szl-holdings", source: "subscription_manager", cta: "view_plans" });
                    onManageClick();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  View Plans
                </button>
              )}
              <button
                onClick={async () => {
                  trackEvent("upgrade_clicked", { product: "szl-holdings", source: "subscription_manager", cta: "start_trial" });
                  const origin = window.location.origin;
                  const res = await fetch(`${apiBase}/billing/checkout`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      priceId: import.meta.env.VITE_STRIPE_PRICE_SZL_PRO ?? "price_szl_pro_monthly",
                      mode: "subscription",
                      customerEmail: customerEmail,
                      successUrl: `${origin}/?checkout=success`,
                      cancelUrl: `${origin}/?checkout=cancel`,
                    }),
                  });
                  const json = await res.json();
                  const url = json.data?.url ?? json.url;
                  if (url) window.location.href = url;
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/15 transition-colors"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[subscription.status] ?? STATUS_CONFIG.active;
  const StatusIcon = statusCfg.icon;
  const daysLeft = Math.max(0, Math.ceil((subscription.currentPeriodEnd * 1000 - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Current Subscription</p>
              <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{subscription.id}</p>
            </div>
          </div>
          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${statusCfg.bg} ${statusCfg.color}`}>
            <StatusIcon className="w-3 h-3" /> {statusCfg.label}
          </span>
        </div>

        <div className="border-t border-border divide-y divide-border/50">
          <div className="px-5 py-3 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Current Period</p>
              <p className="text-xs font-medium text-foreground">
                {formatDate(subscription.currentPeriodStart)} — {formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Renews In</p>
              <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                {subscription.cancelAtPeriodEnd ? "Cancels" : "Renews"} in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {subscription.cancelAtPeriodEnd && (
            <div className="px-5 py-3 bg-amber-500/5">
              <p className="text-xs text-amber-500 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Your subscription will cancel on {formatDate(subscription.currentPeriodEnd)} and will not renew.
              </p>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-border flex items-center gap-3 flex-wrap">
          <button
            onClick={openBillingPortal}
            disabled={portalLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {portalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
            Manage Billing
          </button>

          {!subscription.cancelAtPeriodEnd && subscription.status === "active" && (
            <button
              onClick={handleCancel}
              disabled={cancelLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                cancelConfirm
                  ? "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              {cancelLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              {cancelConfirm ? "Confirm cancel" : "Cancel plan"}
            </button>
          )}

          {cancelConfirm && (
            <button
              onClick={() => setCancelConfirm(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Never mind
            </button>
          )}

          <button
            onClick={fetchStatus}
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {actionMsg && (
          <div className="px-5 py-3 border-t border-border bg-muted/10">
            <p className="text-xs text-muted-foreground">{actionMsg}</p>
          </div>
        )}
      </div>

      {invoices.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <button
            onClick={() => setShowInvoices(v => !v)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Invoice History</span>
              <span className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                {invoices.length}
              </span>
            </div>
            {showInvoices ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {showInvoices && (
            <div className="border-t border-border divide-y divide-border/50">
              {invoices.slice(0, 12).map(inv => (
                <div key={inv.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {formatCents(inv.amount, inv.currency)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {inv.paidAt ? formatDate(inv.paidAt) : formatDateMs(inv.created)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                      inv.status === "paid"
                        ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
                        : "text-muted-foreground bg-muted/30 border-border"
                    }`}>
                      {inv.status}
                    </span>
                    {inv.hostedInvoiceUrl && (
                      <a
                        href={inv.hostedInvoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> View
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SubscriptionManager;
