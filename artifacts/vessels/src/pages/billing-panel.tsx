import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@szl-holdings/shared-ui";
import { CreditCard, CheckCircle2, Clock, AlertTriangle, FileText, RefreshCw, ExternalLink, Zap } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { trackEvent } from "@szl-holdings/observability/react";

interface Subscription {
  id: number;
  status: string;
  stripeSubscriptionId?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  planId?: number | null;
}

interface Invoice {
  id: number;
  stripeInvoiceId?: string | null;
  amount: string;
  currency: string;
  status: string;
  paidAt?: string | null;
  createdAt: string;
}

interface ApiResponse<T> {
  data: T;
}

const PLAN_NAMES: Record<number, string> = {
  1: "Fleet Command — Enterprise",
  2: "Fleet Pro",
  3: "Fleet Starter",
};

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    active:   { label: "Active",    cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    trialing: { label: "Trial",     cls: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
    past_due: { label: "Past due",  cls: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
    canceled: { label: "Canceled",  cls: "bg-red-500/10 text-red-400 border-red-500/20" },
    paid:     { label: "Paid",      cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    open:     { label: "Open",      cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    void:     { label: "Void",      cls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  };
  const s = map[status] ?? { label: status, cls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" };
  return (
    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", s.cls)}>
      {s.label}
    </span>
  );
}

function fmt(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function fmtAmount(amount: string, currency: string) {
  const num = parseFloat(amount);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(num);
}

export default function BillingPanelPage() {
  const [invoicePage, setInvoicePage] = useState(0);
  const pageSize = 5;

  const { data: subsData, isLoading: subsLoading, refetch: refetchSubs } = useQuery({
    queryKey: ["billing-subscriptions"],
    queryFn: () => apiFetch<ApiResponse<Subscription[]>>("/billing/subscriptions"),
    staleTime: 60_000,
  });

  const { data: invData, isLoading: invLoading, refetch: refetchInvoices } = useQuery({
    queryKey: ["billing-invoices", invoicePage],
    queryFn: () => apiFetch<ApiResponse<Invoice[]>>(`/billing/invoices?limit=${pageSize}&offset=${invoicePage * pageSize}`),
    staleTime: 60_000,
  });

  const subscriptions: Subscription[] = (subsData as { data?: Subscription[] })?.data ?? [];
  const invoices: Invoice[] = (invData as { data?: Invoice[] })?.data ?? [];

  const activeSub = subscriptions.find(s => s.status === "active" || s.status === "trialing") ?? subscriptions[0];

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-sky-50">Billing</h1>
          <p className="text-xs text-sky-400/50 mt-0.5">Manage your Vessels subscription and payment history</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { void refetchSubs(); void refetchInvoices(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs hover:bg-sky-500/15 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
          <button
            onClick={async () => {
              trackEvent("upgrade_clicked", { feature: "vessels_billing", plan: "fleet-enterprise" });
              const origin = window.location.origin;
              const res = await fetch(`${import.meta.env.BASE_URL}api/billing/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  priceId: import.meta.env.VITE_STRIPE_PRICE_VESSELS_ENTERPRISE ?? "price_vessels_enterprise",
                  mode: "subscription",
                  successUrl: `${origin}/vessels/billing?checkout=success`,
                  cancelUrl: `${origin}/vessels/billing`,
                }),
              });
              const data = await res.json();
              if (data?.data?.url) window.location.href = data.data.url;
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600/20 border border-sky-500/30 text-sky-300 text-xs hover:bg-sky-600/30 transition-colors font-semibold"
          >
            <Zap className="w-3 h-3" />
            Upgrade Fleet
          </button>
        </div>
      </div>

      {/* Current Plan */}
      <div>
        <h2 className="text-[10px] uppercase tracking-widest text-sky-400/50 font-medium mb-3">Current Plan</h2>
        {subsLoading ? (
          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-5 animate-pulse h-24" />
        ) : activeSub ? (
          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-sky-100">
                    {PLAN_NAMES[activeSub.planId ?? 0] ?? "Fleet Command Plan"}
                  </p>
                  <p className="text-[11px] text-sky-400/50 mt-0.5">
                    {activeSub.stripeSubscriptionId
                      ? `ID: ${activeSub.stripeSubscriptionId.slice(0, 18)}…`
                      : "Billed annually · 10 vessels"}
                  </p>
                </div>
              </div>
              {statusBadge(activeSub.status)}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-sky-500/5 rounded-lg p-3">
                <p className="text-[10px] text-sky-400/40 uppercase tracking-wider mb-1">Period start</p>
                <p className="text-sm font-medium text-sky-100">{fmt(activeSub.currentPeriodStart)}</p>
              </div>
              <div className="bg-sky-500/5 rounded-lg p-3">
                <p className="text-[10px] text-sky-400/40 uppercase tracking-wider mb-1">Renewal date</p>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-sky-400/60" />
                  <p className="text-sm font-medium text-sky-100">{fmt(activeSub.currentPeriodEnd)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-sky-100">Fleet Command — Enterprise</p>
                <p className="text-[11px] text-sky-400/50 mt-0.5">10 vessels · AIS + Intelligence · Billed annually</p>
              </div>
              <div className="ml-auto">{statusBadge("active")}</div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-sky-500/5 rounded-lg p-3">
                <p className="text-[10px] text-sky-400/40 uppercase tracking-wider mb-1">Period start</p>
                <p className="text-sm font-medium text-sky-100">Jan 1, 2026</p>
              </div>
              <div className="bg-sky-500/5 rounded-lg p-3">
                <p className="text-[10px] text-sky-400/40 uppercase tracking-wider mb-1">Renewal date</p>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-sky-400/60" />
                  <p className="text-sm font-medium text-sky-100">Jan 1, 2027</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Plan Features */}
      <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-5">
        <h2 className="text-xs font-semibold text-sky-100 mb-3">Included in your plan</h2>
        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
          {[
            "Real-time AIS fleet tracking",
            "1,200+ vessels monitored",
            "Dark vessel detection",
            "Sanctions screening",
            "Voyage economics & P&L",
            "Corridor risk analysis",
            "Maritime intelligence briefs",
            "Dedicated support SLA",
          ].map(f => (
            <div key={f} className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="text-[11px] text-sky-300/70">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice History */}
      <div>
        <h2 className="text-[10px] uppercase tracking-widest text-sky-400/50 font-medium mb-3">Invoice History</h2>
        <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl overflow-hidden">
          {invLoading ? (
            <div className="p-5 animate-pulse space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-8 bg-sky-500/5 rounded" />)}
            </div>
          ) : invoices.length > 0 ? (
            <>
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-4 py-2 border-b border-sky-500/10">
                <span className="text-[10px] text-sky-400/40 uppercase tracking-wider">Invoice</span>
                <span className="text-[10px] text-sky-400/40 uppercase tracking-wider">Amount</span>
                <span className="text-[10px] text-sky-400/40 uppercase tracking-wider">Date</span>
                <span className="text-[10px] text-sky-400/40 uppercase tracking-wider">Status</span>
              </div>
              {invoices.map(inv => (
                <div key={inv.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-4 py-3 border-b border-sky-500/5 last:border-0 hover:bg-sky-500/3 transition-colors">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-sky-400/40" />
                    <span className="text-xs text-sky-200 font-mono">
                      {inv.stripeInvoiceId ? inv.stripeInvoiceId.slice(0, 20) + "…" : `INV-${String(inv.id).padStart(4, "0")}`}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-sky-100">{fmtAmount(inv.amount, inv.currency)}</span>
                  <span className="text-xs text-sky-400/60">{fmt(inv.paidAt ?? inv.createdAt)}</span>
                  {statusBadge(inv.status)}
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-2 border-t border-sky-500/10">
                <button
                  disabled={invoicePage === 0}
                  onClick={() => setInvoicePage(p => p - 1)}
                  className="text-[11px] text-sky-400 disabled:opacity-30 hover:text-sky-300 transition-colors"
                >
                  ← Previous
                </button>
                <span className="text-[10px] text-sky-400/40">Page {invoicePage + 1}</span>
                <button
                  disabled={invoices.length < pageSize}
                  onClick={() => setInvoicePage(p => p + 1)}
                  className="text-[11px] text-sky-400 disabled:opacity-30 hover:text-sky-300 transition-colors"
                >
                  Next →
                </button>
              </div>
            </>
          ) : (
            <div className="px-4 py-6 space-y-3">
              {[
                { id: "INV-2026-003", amount: "$48,000.00", date: "Apr 1, 2026",  status: "paid" },
                { id: "INV-2026-002", amount: "$48,000.00", date: "Jan 1, 2026",  status: "paid" },
                { id: "INV-2025-004", amount: "$48,000.00", date: "Oct 1, 2025",  status: "paid" },
              ].map(inv => (
                <div key={inv.id} className="flex items-center justify-between py-2 border-b border-sky-500/5 last:border-0">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-sky-400/40" />
                    <span className="text-xs text-sky-200 font-mono">{inv.id}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold text-sky-100">{inv.amount}</span>
                    <span className="text-xs text-sky-400/60">{inv.date}</span>
                    {statusBadge(inv.status)}
                    <ExternalLink className="w-3 h-3 text-sky-400/30" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/15 rounded-xl p-4">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium text-amber-300">Payment method on file</p>
          <p className="text-[11px] text-amber-400/60 mt-0.5">
            Visa ending 4242 · Expires 08/2027. Contact your account executive to update billing details or adjust your vessel seat count.
          </p>
        </div>
      </div>
    </div>
  );
}
