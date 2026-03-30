import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CreditCard, CheckCircle2, DollarSign, Users, Package } from "lucide-react";

function formatAmount(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

export default function BillingPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-billing-settings"], queryFn: api.getBillingSettings });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const plans = data?.plans ?? [];
  const subscriptions = data?.subscriptions ?? [];
  const invoices = data?.invoices ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
          <p className="text-sm text-muted-foreground mt-1">Plans, subscriptions, and invoices</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${
          data?.stripeConfigured ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
        }`}>
          <CreditCard className="w-3.5 h-3.5" />
          {data?.stripeConfigured ? "Stripe Connected" : "Stripe Demo Mode"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">{plan.name}</h3>
            </div>
            {plan.monthlyPrice != null && (
              <p className="text-2xl font-bold">{formatAmount(plan.monthlyPrice)}<span className="text-sm text-muted-foreground font-normal">/mo</span></p>
            )}
            <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{plan.description}</p>
          </div>
        ))}
      </div>

      {subscriptions.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3">Active Subscriptions</h2>
          <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
            {subscriptions.slice(0, 10).map((sub) => (
              <div key={sub.id} className="flex items-center gap-4 px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium">Subscription #{sub.id}</p>
                  <p className="text-xs text-muted-foreground">{sub.planId ? `Plan: ${sub.planId}` : ""}</p>
                </div>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
                  sub.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"
                }`}>
                  {sub.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {invoices.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3">Recent Invoices</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Invoice</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.slice(0, 10).map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs">{inv.stripeInvoiceId || `INV-${inv.id}`}</td>
                    <td className="px-5 py-3">{inv.amountDue != null ? formatAmount(inv.amountDue, inv.currency || "usd") : "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        inv.status === "paid" ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"
                      }`}>{inv.status}</span>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
