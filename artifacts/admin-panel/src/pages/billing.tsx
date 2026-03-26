import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CreditCard, CheckCircle, Calendar, Users, Sparkles, Shield, BarChart3, AlertTriangle } from "lucide-react";

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <div className="h-7 w-52 bg-muted rounded animate-pulse" />
        <div className="h-4 w-56 bg-muted/60 rounded animate-pulse mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 h-28 animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 h-32 animate-pulse" />
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card h-48 animate-pulse" />
    </div>
  );
}

export default function BillingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-billing"],
    queryFn: api.getBilling,
  });

  const { data: settings } = useQuery({
    queryKey: ["admin-billing-settings"],
    queryFn: api.getBillingSettings,
  });

  if (isLoading || !data) return <LoadingSkeleton />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing & Subscription</h1>
        <p className="text-sm text-muted-foreground mt-1">Plan details, entitlements, and usage</p>
      </div>

      {settings && !settings.stripeConfigured && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-400">Stripe Not Connected</p>
            <p className="text-xs text-muted-foreground mt-1">Billing is running in demo mode. Connect Stripe to enable live payments.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-card p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-8 translate-x-8" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Current Plan</span>
            </div>
            <div className="text-2xl font-semibold">{data.plan}</div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="relative">
                <span className={`block w-2 h-2 rounded-full ${data.status === "active" ? "bg-emerald-400" : "bg-red-400"}`} />
                {data.status === "active" && <span className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-40" />}
              </span>
              <span className="text-sm text-muted-foreground capitalize">{data.status}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Monthly Cost</span>
          </div>
          <div className="text-2xl font-semibold">{formatAmount(data.monthlyAmount, data.currency)}</div>
          <div className="text-sm text-muted-foreground mt-2">per month</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Seats</span>
          </div>
          <div className="text-2xl font-semibold">{data.seats.used}<span className="text-muted-foreground text-lg">/{data.seats.total}</span></div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-3">
            <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-1000" style={{ width: `${(data.seats.used / data.seats.total) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-sm font-medium">Billing Period</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start</span>
              <span className="font-mono">{new Date(data.currentPeriodStart).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">End</span>
              <span className="font-mono">{new Date(data.currentPeriodEnd).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-sm font-medium">Included Features</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.features.map((f) => (
              <span key={f} className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {settings && settings.entitlements.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-sm font-medium">Plan Entitlements</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {settings.entitlements.map((ent, i) => (
              <div key={i} className="rounded-lg border border-border/50 bg-muted/20 p-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{ent.featureKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ent.type === "boolean" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"}`}>
                    {ent.type}
                  </span>
                </div>
                {ent.limitValue && (
                  <span className="text-xs text-muted-foreground">Limit: {ent.limitValue.toLocaleString()}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {settings && settings.usageSummary.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-violet-400" />
            </div>
            <span className="text-sm font-medium">Usage Summary</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3">Feature</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3">Total Usage</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3">Events</th>
              </tr>
            </thead>
            <tbody>
              {settings.usageSummary.map((u) => (
                <tr key={u.featureKey} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-3 text-sm">{u.featureKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</td>
                  <td className="py-3 text-sm font-mono">{u.totalQuantity.toLocaleString()}</td>
                  <td className="py-3 text-sm text-muted-foreground">{u.eventCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-medium mb-4">Invoice History</h3>
        {data.invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CreditCard className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">No invoices yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3">Invoice</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3">Date</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3">Amount</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-3 text-sm font-mono">{inv.id}</td>
                  <td className="py-3 text-sm text-muted-foreground">{new Date(inv.date).toLocaleDateString()}</td>
                  <td className="py-3 text-sm font-medium">{formatAmount(inv.amount, data.currency)}</td>
                  <td className="py-3">
                    <span className="text-xs px-2.5 py-1 rounded-full text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 capitalize font-medium">
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
