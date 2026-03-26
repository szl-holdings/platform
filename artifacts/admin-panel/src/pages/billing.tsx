import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CreditCard, CheckCircle, Calendar, Users, Sparkles } from "lucide-react";

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

export default function BillingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-billing"],
    queryFn: api.getBilling,
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing & Subscription</h1>
        <p className="text-sm text-muted-foreground mt-1">Plan details and payment history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Current Plan</span>
          </div>
          <div className="text-2xl font-semibold">{data.plan}</div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`w-2 h-2 rounded-full ${data.status === "active" ? "bg-emerald-400" : "bg-red-400"}`} />
            <span className="text-sm text-muted-foreground capitalize">{data.status}</span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Monthly Cost</span>
          </div>
          <div className="text-2xl font-semibold">{formatAmount(data.monthlyAmount, data.currency)}</div>
          <div className="text-sm text-muted-foreground mt-2">per month</div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Seats</span>
          </div>
          <div className="text-2xl font-semibold">{data.seats.used}/{data.seats.total}</div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-3">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(data.seats.used / data.seats.total) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-amber-400" />
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

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium">Included Features</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.features.map((f) => (
              <span key={f} className="text-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-medium mb-4">Invoice History</h3>
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
              <tr key={inv.id} className="border-b border-border/50">
                <td className="py-3 text-sm font-mono">{inv.id}</td>
                <td className="py-3 text-sm text-muted-foreground">{new Date(inv.date).toLocaleDateString()}</td>
                <td className="py-3 text-sm font-medium">{formatAmount(inv.amount, data.currency)}</td>
                <td className="py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 capitalize">
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
