import { useMemo } from "react";
import { m } from "framer-motion";
import { Ship, Shield, Zap, Brain, BarChart2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EngineState } from "@/hooks/useDecisionEngine";
import type { LiveMetrics } from "@/hooks/useLiveTheaterData";
import { SeverityBadge } from "../helpers";

export function SignalStage({ engine }: { engine: EngineState }) {
  const signals = useMemo(() => {
    return engine.publishedSignals
      .filter(evt => evt.type === "domain_signal")
      .map(evt => ({
        id: evt.id,
        domain: evt.domain === "aegis" ? "Aegis" : evt.domain === "vessels" ? "Vessels" : evt.domain,
        icon: evt.domain === "aegis" ? Shield : Ship,
        color: evt.domain === "aegis" ? "#6366f1" : "#3b82f6",
        type: String(evt.payload.signalType ?? "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        severity: evt.severity,
        title: String(evt.payload.title ?? ""),
        timestamp: new Date(evt.timestamp).toISOString(),
        details: Object.fromEntries(
          Object.entries(evt.payload).filter(([k]) => !["signalType", "title"].includes(k))
        ),
      }));
  }, [engine.publishedSignals]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Two independent domain signals fire within a 4-minute window, triggering cross-domain correlation via the Prism Event Bus.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {signals.map((sig) => {
          const Icon = sig.icon;
          return (
            <div key={sig.id} className="rounded-xl border border-border/40 bg-card/60 p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${sig.color}20` }}>
                  <Icon className="w-4 h-4" style={{ color: sig.color }} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: sig.color }}>{sig.domain}</span>
                  <span className="text-[10px] text-muted-foreground ml-2">{sig.type}</span>
                </div>
                <span className={cn(
                  "ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border",
                  sig.severity === "critical" ? "bg-red-500/10 border-red-500/25 text-red-400" : "bg-orange-500/10 border-orange-500/25 text-orange-400"
                )}>{sig.severity}</span>
              </div>
              <p className="text-sm font-semibold text-foreground mb-3">{sig.title}</p>
              <div className="space-y-1">
                {Object.entries(sig.details).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 text-[11px]">
                    <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}:</span>
                    <span className="text-foreground font-medium font-mono text-[10px]">{String(v)}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 font-mono">
                {new Date(sig.timestamp).toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>
      <div className="rounded-lg border border-border/30 bg-muted/10 px-4 py-3 flex items-center gap-3">
        <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <p className="text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground">Prism Event Bus:</span>{" "}
          {engine.busStats.totalPublished} events published across {Object.keys(engine.busStats.byType).length} event types.
          {" "}{engine.busStats.subscriptionCount} active subscription(s).
        </p>
      </div>
    </div>
  );
}

export function LiveSignalStage({ metrics }: { metrics: LiveMetrics | null }) {
  if (!metrics) return <p className="text-sm text-muted-foreground">Loading live signals…</p>;

  const signalItems = [
    {
      domain: "Alloy",
      color: "#ec4899",
      icon: Brain,
      title: "AI Recommendation Engine — Active",
      severity: "info" as const,
      details: [
        { label: "Total Recommendations", value: metrics.alloy.total_recommendations.toLocaleString() },
        { label: "Workflows (30d)", value: metrics.alloy.workflow_runs_30d.toLocaleString() },
      ],
    },
    {
      domain: "Lyte / Terra",
      color: "#10b981",
      icon: BarChart2,
      title: "Real Estate Signal — Distress Portfolio Active",
      severity: metrics.beacon.high_opportunity_properties > 5 ? "high" as const : "medium" as const,
      details: [
        { label: "Distress Properties", value: metrics.beacon.total_distress_properties.toLocaleString() },
        { label: "High-Opportunity", value: metrics.beacon.high_opportunity_properties.toLocaleString() },
        { label: "Active Leads", value: metrics.beacon.total_leads.toLocaleString() },
      ],
    },
    {
      domain: "Firestorm",
      color: "#ef4444",
      icon: Shield,
      title: "Security Posture — Open Vulnerabilities",
      severity: metrics.firestorm.open_vulnerabilities > 10 ? "critical" as const : metrics.firestorm.open_vulnerabilities > 0 ? "high" as const : "info" as const,
      details: [
        { label: "Open Vulnerabilities", value: metrics.firestorm.open_vulnerabilities.toLocaleString() },
      ],
    },
    {
      domain: "Platform",
      color: "#8b5cf6",
      icon: Activity,
      title: "Audit & Governance — Event Stream",
      severity: "info" as const,
      details: [
        { label: "Audit Events (30d)", value: metrics.platform.audit_events_30d.toLocaleString() },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Live platform signals ingested from active domain packs — real telemetry from the SZL Holdings platform.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {signalItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <m.div
              key={item.domain}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              className="rounded-xl border border-border/40 bg-card/60 p-5"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${item.color}20` }}>
                  <Icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: item.color }}>{item.domain}</span>
                </div>
                <div className="ml-auto"><SeverityBadge severity={item.severity} /></div>
              </div>
              <p className="text-sm font-semibold text-foreground mb-3">{item.title}</p>
              <div className="space-y-1">
                {item.details.map((d) => (
                  <div key={d.label} className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">{d.label}</span>
                    <span className="font-semibold text-foreground font-mono">{d.value}</span>
                  </div>
                ))}
              </div>
            </m.div>
          );
        })}
      </div>
    </div>
  );
}
