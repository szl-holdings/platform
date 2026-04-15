import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
import { apiFetch } from "@szl-holdings/shared-ui";
  DollarSign, CreditCard, TrendingUp, AlertCircle, CheckCircle,
  RefreshCw, ExternalLink, Users, Activity, XCircle, Clock
} from "lucide-react";

interface StripeConfig {
  stripeConnected: boolean;
  stripeMode: "live" | "test" | "mock";
  webhookSecretConfigured: boolean;
  priceIdsConfigured: number;
  priceIdsTotal: number;
  prices: { envVar: string; label: string; configured: boolean }[];
  instructions: string;
}

interface RevenueAnalytics {
  source: string;
  stripeMode: string;
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  pastDueSubscriptions: number;
  canceledSubscriptions: number;
  canceledThisMonth: number;
  newSubscriptionsThisMonth: number;
  totalLifetimeRevenue: number;
}

interface LytePilotMetrics {
  totalPilots: number;
  activePilots: number;
  trialingPilots: number;
  pastDuePilots: number;
  revenueEvents: RevenueEvent[];
}

interface RevenueEvent {
  id: number;
  eventType: string;
  product: string;
  amount: number | null;
  currency: string;
  customerId: string | null;
  subscriptionId: string | null;
  metadata: Record<string, unknown> | null;
  occurredAt: string;
}

interface StripeInvoice {
  id: string;
  customer: string;
  amount_due: number;
  amount_paid: number;
  status: string;
  created: number;
  hosted_invoice_url?: string;
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}


function StatusIcon({ ok }: { ok: boolean }) {
  return ok
    ? <CheckCircle size={14} className="text-[#6b8f71]" />
    : <XCircle size={14} className="text-[#c45a4a]" />;
}

function StatCard({ label, value, sub, icon: Icon, accent }: { label: string; value: string | number; sub?: string; icon: React.ElementType; accent?: string }) {
  return (
    <div className="bg-[#0e1420] border border-[#1e2a38] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={accent ?? "text-[#d4a054]"} />
        <span className="text-xs text-[#7a8fa6] font-mono">{label}</span>
      </div>
      <div className="text-2xl font-mono font-semibold text-[#e4d5b7]">{value}</div>
      {sub && <div className="text-xs text-[#556070] mt-1">{sub}</div>}
    </div>
  );
}

export default function BillingAdminPage() {
  const qc = useQueryClient();

  const { data: config, isLoading: configLoading } = useQuery<{ data: StripeConfig }>({
    queryKey: ["billing-stripe-config"],
    queryFn: () => apiFetch("/billing/stripe-config"),
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<{ data: RevenueAnalytics }>({
    queryKey: ["billing-revenue-analytics"],
    queryFn: () => apiFetch("/billing/revenue-analytics"),
  });

  const { data: pilotData } = useQuery<{ data: LytePilotMetrics }>({
    queryKey: ["lyte-pilot-metrics"],
    queryFn: () => apiFetch("/lyte/billing/pilot-metrics"),
    retry: false,
  });

  const { data: revenueEvents } = useQuery<{ data: RevenueEvent[] }>({
    queryKey: ["lyte-revenue-events"],
    queryFn: () => apiFetch("/lyte/billing/revenue-events?limit=20"),
    retry: false,
  });

  const { data: invoicesData } = useQuery<{ data: StripeInvoice[] }>({
    queryKey: ["billing-stripe-invoices"],
    queryFn: () => apiFetch("/billing/stripe-invoices"),
    retry: false,
  });

  const syncPlansMut = useMutation({
    mutationFn: () => apiFetch("/billing/sync-plans", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["billing"] }),
  });

  const stripeConf = config?.data;
  const rev = analytics?.data;
  const pilots = pilotData?.data;
  const events = revenueEvents?.data ?? [];
  const invoices = invoicesData?.data ?? [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-mono font-semibold text-[#e4d5b7]">Billing Admin</h1>
          <p className="text-xs text-[#556070] mt-1">Revenue operations · Lyte pilot commercial flow</p>
        </div>
        <button
          onClick={() => syncPlansMut.mutate()}
          disabled={syncPlansMut.isPending || !stripeConf?.stripeConnected}
          className="flex items-center gap-2 text-xs px-3 py-1.5 bg-[#1a2a1e] border border-[#2a4a2e] rounded-lg text-[#6b8f71] hover:bg-[#22381e] disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={12} className={syncPlansMut.isPending ? "animate-spin" : ""} />
          Sync Plans
        </button>
      </div>

      {stripeConf && (
        <div className="bg-[#0e1420] border border-[#1e2a38] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-mono text-[#9ba8b8]">Stripe Connection</span>
            <Modebage mode={stripeConf.stripeMode} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <StatusIcon ok={stripeConf.stripeConnected} />
              <span className="text-[#7a8fa6]">API Key</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon ok={stripeConf.webhookSecretConfigured} />
              <span className="text-[#7a8fa6]">Webhook Secret</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon ok={stripeConf.priceIdsConfigured > 0} />
              <span className="text-[#7a8fa6]">Prices: {stripeConf.priceIdsConfigured}/{stripeConf.priceIdsTotal}</span>
            </div>
            {!stripeConf.stripeConnected && (
              <div className="col-span-2 text-[#7a5030] text-xs">{stripeConf.instructions}</div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="MRR" value={rev ? formatCurrency(rev.mrr) : "—"} sub="Monthly recurring" icon={DollarSign} />
        <StatCard label="ARR" value={rev ? formatCurrency(rev.arr) : "—"} sub="Annual recurring" icon={TrendingUp} />
        <StatCard label="Active Subs" value={rev?.activeSubscriptions ?? "—"} sub={`${rev?.trialingSubscriptions ?? 0} trialing`} icon={Users} accent="text-[#6b8f71]" />
        <StatCard label="Past Due" value={rev?.pastDueSubscriptions ?? "—"} sub={`${rev?.canceledThisMonth ?? 0} canceled this month`} icon={AlertCircle} accent="text-[#c45a4a]" />
      </div>

      {pilots && (
        <div className="bg-[#0e1420] border border-[#1e2a38] rounded-xl p-4">
          <h2 className="text-sm font-mono text-[#9ba8b8] mb-3 flex items-center gap-2">
            <Activity size={14} className="text-[#d4a054]" />
            Lyte Pilot Contracts
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-mono font-semibold text-[#e4d5b7]">{pilots.totalPilots}</div>
              <div className="text-xs text-[#556070]">Total Pilots</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-mono font-semibold text-[#6b8f71]">{pilots.activePilots}</div>
              <div className="text-xs text-[#556070]">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-mono font-semibold text-[#d4a054]">{pilots.trialingPilots}</div>
              <div className="text-xs text-[#556070]">Trialing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-mono font-semibold text-[#c45a4a]">{pilots.pastDuePilots}</div>
              <div className="text-xs text-[#556070]">Past Due</div>
            </div>
          </div>
        </div>
      )}

      {events.length > 0 && (
        <div className="bg-[#0e1420] border border-[#1e2a38] rounded-xl p-4">
          <h2 className="text-sm font-mono text-[#9ba8b8] mb-3 flex items-center gap-2">
            <Clock size={14} className="text-[#d4a054]" />
            Revenue Events
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-[#556070] border-b border-[#1e2a38]">
                  <th className="pb-2 font-mono">Event</th>
                  <th className="pb-2 font-mono">Product</th>
                  <th className="pb-2 font-mono text-right">Amount</th>
                  <th className="pb-2 font-mono">Occurred</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2a38]">
                {events.map(e => (
                  <tr key={e.id} className="text-[#9ba8b8] hover:bg-[#111b2b]">
                    <td className="py-2 font-mono text-[#d4a054]">{e.eventType}</td>
                    <td className="py-2">{e.product}</td>
                    <td className="py-2 text-right text-[#6b8f71]">
                      {e.amount != null ? formatCurrency(e.amount) : "—"}
                    </td>
                    <td className="py-2 text-[#556070]">{new Date(e.occurredAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {invoices.length > 0 && (
        <div className="bg-[#0e1420] border border-[#1e2a38] rounded-xl p-4">
          <h2 className="text-sm font-mono text-[#9ba8b8] mb-3 flex items-center gap-2">
            <CreditCard size={14} className="text-[#d4a054]" />
            Recent Stripe Invoices
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-[#556070] border-b border-[#1e2a38]">
                  <th className="pb-2 font-mono">Invoice ID</th>
                  <th className="pb-2 font-mono">Customer</th>
                  <th className="pb-2 font-mono text-right">Amount</th>
                  <th className="pb-2 font-mono">Status</th>
                  <th className="pb-2 font-mono">Date</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2a38]">
                {invoices.slice(0, 15).map((inv) => (
                  <tr key={inv.id} className="text-[#9ba8b8] hover:bg-[#111b2b]">
                    <td className="py-2 font-mono text-xs text-[#556070]">{inv.id.slice(0, 16)}…</td>
                    <td className="py-2 text-[#7a8fa6]">{inv.customer}</td>
                    <td className="py-2 text-right text-[#e4d5b7]">{formatCurrency(inv.amount_due)}</td>
                    <td className="py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                        inv.status === "paid" ? "bg-[#1a3a1e] text-[#6b8f71]"
                        : inv.status === "open" ? "bg-[#3a2a1a] text-[#d4a054]"
                        : "bg-[#2a1a1a] text-[#c45a4a]"
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-2 text-[#556070]">{new Date(inv.created * 1000).toLocaleDateString()}</td>
                    <td className="py-2">
                      {inv.hosted_invoice_url && (
                        <a href={inv.hosted_invoice_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink size={12} className="text-[#556070] hover:text-[#9ba8b8]" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {configLoading || analyticsLoading ? (
        <div className="flex items-center gap-2 text-xs text-[#556070]">
          <RefreshCw size={12} className="animate-spin" />
          Loading billing data…
        </div>
      ) : null}

      <div className="bg-[#0a0e16] border border-[#1e2a38] rounded-xl p-4 text-xs text-[#556070]">
        <div className="font-mono font-semibold text-[#7a8fa6] mb-2">Policy Links</div>
        <div className="flex gap-4 flex-wrap">
          <a href="https://lyte.ai/terms" target="_blank" rel="noopener noreferrer" className="hover:text-[#9ba8b8] flex items-center gap-1">
            <ExternalLink size={10} /> Terms of Service
          </a>
          <a href="https://lyte.ai/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-[#9ba8b8] flex items-center gap-1">
            <ExternalLink size={10} /> Privacy Policy
          </a>
          <a href="https://lyte.ai/refunds" target="_blank" rel="noopener noreferrer" className="hover:text-[#9ba8b8] flex items-center gap-1">
            <ExternalLink size={10} /> Refund Policy
          </a>
        </div>
      </div>
    </div>
  );
}

function Modebage({ mode }: { mode: string }) {
  const styles: Record<string, string> = {
    live: "bg-[#1a3a1e] text-[#6b8f71] border border-[#2a5a2e]",
    test: "bg-[#3a2a1a] text-[#d4a054] border border-[#5a3a2a]",
    mock: "bg-[#2a2a3a] text-[#9b8ecf] border border-[#3a3a5a]",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${styles[mode] ?? styles.mock}`}>
      {mode.toUpperCase()}
    </span>
  );
}
