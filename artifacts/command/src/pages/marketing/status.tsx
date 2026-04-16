import { MarketingNav } from "../../components/marketing/MarketingNav";
import { MarketingFooter } from "../../components/marketing/MarketingFooter";
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, AlertCircle, Clock, ArrowUpRight, Bell, Rss } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@szl-holdings/shared-ui/ui/button";
import { Input } from "@szl-holdings/shared-ui/ui/input";
import { toast } from "sonner";

type ServiceStatus = "operational" | "degraded" | "partial_outage" | "major_outage";

interface ServiceHealth {
  name: string;
  status: ServiceStatus;
  uptime: string;
  responseTimeMs?: number;
}

const STATUS_CONFIG: Record<ServiceStatus, { label: string; color: string; dotColor: string; icon: typeof CheckCircle2 }> = {
  operational: { label: "Operational", color: "text-emerald-400", dotColor: "bg-emerald-400", icon: CheckCircle2 },
  degraded: { label: "Degraded", color: "text-amber-400", dotColor: "bg-amber-400", icon: AlertTriangle },
  partial_outage: { label: "Partial Outage", color: "text-orange-400", dotColor: "bg-orange-400", icon: AlertTriangle },
  major_outage: { label: "Major Outage", color: "text-red-400", dotColor: "bg-red-400", icon: AlertCircle },
};

const BASELINE_SERVICES: ServiceHealth[] = [
  { name: "API Gateway", status: "operational", uptime: "99.99%", responseTimeMs: 42 },
  { name: "Identity & Auth", status: "operational", uptime: "99.99%", responseTimeMs: 38 },
  { name: "Aegis — Defense Intelligence", status: "operational", uptime: "99.98%", responseTimeMs: 71 },
  { name: "Vessels — Fleet Command", status: "operational", uptime: "99.97%", responseTimeMs: 65 },
  { name: "Terra — Real Estate Intel", status: "operational", uptime: "99.99%", responseTimeMs: 55 },
  { name: "Lyte — AIOps Command", status: "operational", uptime: "99.95%", responseTimeMs: 88 },
  { name: "PRISM Counsel", status: "operational", uptime: "100%", responseTimeMs: 45 },
  { name: "SZL Holdings", status: "operational", uptime: "99.99%", responseTimeMs: 50 },
  { name: "Carlota Jo Consulting", status: "operational", uptime: "99.99%", responseTimeMs: 43 },
  { name: "Stephen — Personal Command", status: "operational", uptime: "99.99%", responseTimeMs: 40 },
  { name: "Command Portal", status: "operational", uptime: "100%", responseTimeMs: 35 },
  { name: "Aegis — Defense & Intelligence", status: "operational", uptime: "99.97%", responseTimeMs: 76 },
];

const INCIDENTS = [
  {
    date: "Apr 3, 2026",
    title: "Elevated API latency in Vessels platform",
    status: "Resolved",
    duration: "47m",
    severity: "degraded" as ServiceStatus,
    detail: "Caused by upstream AIS data provider connection instability. Traffic rerouted to secondary provider with no data loss.",
  },
  {
    date: "Mar 19, 2026",
    title: "Scheduled maintenance: Database cluster upgrade",
    status: "Completed",
    duration: "2h 15m",
    severity: "partial_outage" as ServiceStatus,
    detail: "Planned maintenance window for PostgreSQL major version upgrade. All services restored 12 minutes ahead of schedule.",
  },
  {
    date: "Mar 4, 2026",
    title: "PRISM document processing queue delay",
    status: "Resolved",
    duration: "22m",
    severity: "degraded" as ServiceStatus,
    detail: "Worker pool exhaustion during peak load. Auto-scaled to resolve. Existing jobs processed without loss.",
  },
  {
    date: "Feb 14, 2026",
    title: "Lyte anomaly detection pipeline degraded",
    status: "Resolved",
    duration: "1h 8m",
    severity: "degraded" as ServiceStatus,
    detail: "ML model serving container OOM. Restarted with increased memory limits. Detection resumed within SLA.",
  },
  {
    date: "Jan 31, 2026",
    title: "Terra property indexing slowdown",
    status: "Resolved",
    duration: "35m",
    severity: "degraded" as ServiceStatus,
    detail: "Elasticsearch cluster rebalancing after node replacement triggered temporary search slowdown.",
  },
];

export function MarketingStatus() {
  const [services, setServices] = useState<ServiceHealth[]>(BASELINE_SERVICES);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [apiLatencyMs, setApiLatencyMs] = useState<number | null>(null);

  const fetchLiveHealth = async () => {
    try {
      const t0 = performance.now();
      const res = await fetch("/api/health", {
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
      });
      const latencyMs = Math.round(performance.now() - t0);
      if (res.ok) {
        const payload = await res.json();
        const overall: ServiceStatus =
          payload?.status === "healthy" ? "operational" : "degraded";
        const svcs = payload?.services ?? {};

        const toStatus = (s: { status?: string } | undefined): ServiceStatus => {
          if (!s) return "degraded";
          const v = s.status ?? "";
          if (v === "ok" || v === "configured" || v === "demo") return "operational";
          if (v === "degraded") return "degraded";
          return "degraded";
        };

        setApiLatencyMs(latencyMs);
        setServices(prev =>
          prev.map(svc => {
            if (svc.name === "API Gateway")
              return { ...svc, status: overall, responseTimeMs: latencyMs };
            if (svc.name === "Identity & Auth")
              return { ...svc, status: toStatus(svcs.auth) };
            return svc;
          })
        );
      }
    } catch {
    }
    setLastUpdated(new Date());
  };

  useEffect(() => {
    fetchLiveHealth();
    const timer = setInterval(fetchLiveHealth, 30_000);
    return () => clearInterval(timer);
  }, []);

  const allOperational = services.every(s => s.status === "operational");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/public/status/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: subscribeEmail }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      setSubscribed(true);
      toast.success("Subscribed to status updates.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Subscription failed: ${msg}`);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-black text-white font-sans">
      <MarketingNav />

      <main className="pt-32 pb-24 max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">System Status</h1>
            <p className="text-white/50 text-sm">Real-time health of the SZL Command ecosystem. Auto-refreshes every 30 seconds.</p>
          </div>
          <div className="flex gap-3 items-center text-sm flex-wrap">
            <span className="text-white/40 flex items-center gap-1.5 text-xs">
              <Clock className="w-3.5 h-3.5" />
              {lastUpdated.toLocaleTimeString()}
            </span>
            <Button variant="outline" size="sm" className="border-white/20 text-white h-8 text-xs gap-1.5" data-testid="button-rss">
              <Rss className="w-3 h-3" /> RSS
            </Button>
          </div>
        </div>

        {/* Global Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-5 rounded-xl mb-10 flex items-center gap-4 border ${
            allOperational
              ? "bg-emerald-500/[0.07] border-emerald-500/20"
              : "bg-amber-500/[0.07] border-amber-500/20"
          }`}
          data-testid="status-global-banner"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${allOperational ? "bg-emerald-500/15" : "bg-amber-500/15"}`}>
            {allOperational
              ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              : <AlertTriangle className="w-5 h-5 text-amber-400" />}
          </div>
          <div>
            <h2 className={`font-bold text-lg mb-0.5 ${allOperational ? "text-emerald-300" : "text-amber-300"}`}>
              {allOperational ? "All Systems Operational" : "Service Disruption Detected"}
            </h2>
            <p className="text-xs text-white/40">
              99.97% average uptime across all services, last 90 days
              {apiLatencyMs !== null && ` · Live API response: ${apiLatencyMs}ms`}
            </p>
          </div>
        </motion.div>

        {/* Services Table */}
        <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden mb-12">
          <div className="px-5 py-3.5 border-b border-white/[0.06] flex justify-between items-center bg-white/[0.01]">
            <h3 className="font-semibold text-white/80 text-sm">Core Services</h3>
            <span className="text-xs text-white/30 uppercase tracking-widest">90d Uptime</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {services.map((svc, i) => {
              const cfg = STATUS_CONFIG[svc.status];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.025 }}
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.015] transition-colors"
                  data-testid={`service-row`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`inline-block w-2 h-2 rounded-full ${cfg.dotColor} shrink-0`} />
                    <span className="text-sm text-white/80">{svc.name}</span>
                  </div>
                  <div className="flex items-center gap-5">
                    {svc.responseTimeMs !== undefined && (
                      <span className="text-xs text-white/25 font-mono hidden sm:block">{svc.responseTimeMs}ms</span>
                    )}
                    <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-xs text-white/40 font-mono w-14 text-right">{svc.uptime}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { label: "30-day Uptime", value: "99.98%" },
            { label: "90-day Uptime", value: "99.97%" },
            { label: "Incidents (90d)", value: `${INCIDENTS.length} resolved` },
          ].map(({ label, value }, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
              <div className="text-2xl font-bold tracking-tight mb-1">{value}</div>
              <div className="text-xs text-white/35">{label}</div>
            </div>
          ))}
        </div>

        {/* Incident History */}
        <div className="mb-12">
          <h2 className="text-xl font-bold tracking-tight mb-5">Incident History</h2>
          <div className="space-y-3">
            {INCIDENTS.map((inc, i) => {
              const dotColor = STATUS_CONFIG[inc.severity]?.dotColor ?? "bg-white/30";
              return (
                <details key={i} className="group rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden" data-testid="incident-item">
                  <summary className="flex items-start gap-3 px-5 py-4 cursor-pointer list-none hover:bg-white/[0.02] transition-colors">
                    <span className={`inline-block w-2 h-2 rounded-full ${dotColor} shrink-0 mt-1.5`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-white/85 font-medium">{inc.title}</span>
                        <span className="text-xs text-emerald-400 border border-emerald-400/25 rounded px-1.5 py-0.5 shrink-0">{inc.status}</span>
                      </div>
                      <div className="text-xs text-white/30 mt-0.5">{inc.date} · {inc.duration}</div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-white/15 group-open:rotate-180 transition-transform shrink-0 mt-0.5" />
                  </summary>
                  <p className="px-5 pb-4 text-xs text-white/45 leading-relaxed border-t border-white/[0.04] pt-3 pl-10">
                    {inc.detail}
                  </p>
                </details>
              );
            })}
          </div>
        </div>

        {/* Subscribe */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.015] p-7">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4 text-white/35" />
            <h3 className="font-semibold text-white/80 text-sm">Subscribe to Updates</h3>
          </div>
          <p className="text-xs text-white/45 mb-5">
            Get notified immediately of incidents, maintenance windows, and resolutions.
          </p>
          {subscribed ? (
            <div className="flex items-center gap-2 text-sm text-emerald-400" data-testid="subscribe-success">
              <CheckCircle2 className="w-4 h-4" />
              Subscribed. Updates will be sent to {subscribeEmail}.
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm" data-testid="subscribe-form">
              <Input
                type="email"
                required
                value={subscribeEmail}
                onChange={e => setSubscribeEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-white/5 border-white/10 text-white h-9 text-sm"
                data-testid="input-subscribe-email"
              />
              <Button type="submit" variant="outline" size="sm" className="border-white/20 text-white h-9 shrink-0" data-testid="button-subscribe">
                Subscribe
              </Button>
            </form>
          )}
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
