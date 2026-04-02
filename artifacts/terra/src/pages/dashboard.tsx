import { useState, useEffect, lazy, Suspense } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { DataStateBadge, useRealtimeChannel, ActionLoop } from "@workspace/shared-ui";
import {
  Building2, MapPin, TrendingUp, Users, Activity,
  ArrowRight, AlertTriangle, Eye, Globe, Map, Shield, BarChart3,
  ChevronRight, Layers, FileText, CheckCircle
} from "lucide-react";
import { brokerageSummary, brokerageDeals, riskSignals, agents } from "@/data/brokerage";
import { RiskBadge, StageBadge, formatCurrency, AgentAvatar } from "@/components/brokerage-ui";
import { properties } from "@/data/portfolio";
import { useMapboxToken } from "@/hooks/use-mapbox-token";
import { PackBanner } from "@/components/pack-banner";

const PropertyMap = lazy(() => import("@/components/property-map"));

const DOCTRINE_MODULES = [
  { id: "foundation", label: "Foundation", icon: Building2, color: "rgba(255,255,255,0.3)", desc: "Data layer", href: "/investor-mode" },
  { id: "watch", label: "Watch", icon: Eye, color: "#f59e0b", count: 3, desc: "Distress signals", href: "/distress-engine" },
  { id: "pipeline", label: "Pipeline", icon: Activity, color: "#3a7ad4", count: 8, desc: "Active deals", href: "/pipeline" },
  { id: "intelligence", label: "Intelligence", icon: BarChart3, color: "rgba(255,255,255,0.3)", desc: "Market data", href: "/market" },
  { id: "action", label: "Action", icon: ArrowRight, color: "rgba(255,255,255,0.3)", desc: "Execute", href: "/deals" },
];

const MARKET_SIGNALS = [
  { time: "5m ago", text: "New pre-foreclosure filing — 847 Park Ave, Queens (Est. $2.1M)", severity: "high" as const },
  { time: "12m ago", text: "Price reduction: 1240 Broadway commercial listing dropped 8% ($4.2M → $3.9M)", severity: "medium" as const },
  { time: "28m ago", text: "Ownership transfer detected — LLC → individual on 3 Tribeca parcels", severity: "high" as const },
  { time: "45m ago", text: "New listing match: 2BR Chelsea, $890K — matches 3 active buyer profiles", severity: "medium" as const },
  { time: "1h ago", text: "Distress cluster: 4 new filings in East Harlem zip 10029", severity: "critical" as const },
  { time: "2h ago", text: "Broker SLA warning — 2 inquiries aging past 4h target", severity: "high" as const },
];

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#c0503a",
  high: "#b8943c",
  medium: "rgba(255,255,255,0.3)",
  low: "rgba(255,255,255,0.18)",
};

const OPPORTUNITY_QUEUE = [
  {
    address: "847 Park Ave, Queens",
    type: "Pre-Foreclosure",
    owner: "Estate of R. Martinez",
    stage: "Distress",
    confidence: 87,
    evidence: "14yr hold · Q2 2026 debt maturity · filing confirmed",
    nextAction: "Initiate outreach",
    value: "$2.1M",
    flag: "urgent" as const,
  },
  {
    address: "1240 Broadway, Manhattan",
    type: "Commercial",
    owner: "Midtown RE LLC (unmask: Cerberus Capital)",
    stage: "Watch",
    confidence: 74,
    evidence: "Listing price down 8% · 47 DOM · LLC transfer pending",
    nextAction: "Comp analysis",
    value: "$3.9M",
    flag: "active" as const,
  },
  {
    address: "45 Warren St, Tribeca",
    type: "Multi-Family",
    owner: "W.Capital Partners LLC",
    stage: "Investigate",
    confidence: 61,
    evidence: "LLC transfer detected · 11yr hold · no active filings",
    nextAction: "Ownership verify",
    value: "$4.8M",
    flag: "watch" as const,
  },
  {
    address: "1890 Adam C Powell Blvd, Harlem",
    type: "Mixed-Use",
    owner: "R&B Holding Corp",
    stage: "Distress",
    confidence: 82,
    evidence: "Cluster alert: 4 filings, zip 10029 · tax lien delinquent",
    nextAction: "File review",
    value: "$1.6M",
    flag: "urgent" as const,
  },
  {
    address: "312 W 23rd St, Chelsea",
    type: "Residential",
    owner: "J. Park (individual)",
    stage: "Qualified",
    confidence: 55,
    evidence: "3 active buyer matches · motivated seller indicated",
    nextAction: "Schedule showing",
    value: "$890K",
    flag: "active" as const,
  },
];

const FLAG_STYLES: Record<string, { color: string; label: string }> = {
  urgent: { color: "#c0503a", label: "Urgent" },
  active: { color: "#b8943c", label: "Active" },
  watch: { color: "rgba(255,255,255,0.3)", label: "Watch" },
};

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API = "/api";

export default function TerraIntelligence() {
  const qc = useQueryClient();
  const { lastMessage: wsSignal } = useRealtimeChannel("terra-signals");

  const { data: healthData, isError: apiDown } = useQuery({
    queryKey: ["terra-dashboard-health"],
    queryFn: () => fetch(`${API}/terra/pipeline/deals?limit=1`).then(r => r.json()).then(d => d.data ?? d),
    staleTime: 60000,
    retry: 1,
  });
  const dataMode: "live" | "demo" = (!apiDown && healthData?.dataMode === "live") ? "live" : "demo";

  useEffect(() => {
    if (!wsSignal) return;
    qc.invalidateQueries({ queryKey: ["terra-deals"] });
    qc.invalidateQueries({ queryKey: ["terra-signals"] });
    qc.invalidateQueries({ queryKey: ["terra-leads"] });
  }, [wsSignal, qc]);

  const activeSignals = riskSignals.filter(s => !s.acknowledged);
  const criticalSignals = activeSignals.filter(s => s.severity === "critical");
  const topDeals = [...brokerageDeals].sort((a, b) => b.price - a.price).slice(0, 5);
  const topAgents = [...agents].sort((a, b) => b.commissionMTD - a.commissionMTD).slice(0, 4);
  const { token: mapToken } = useMapboxToken();
  const [showMap, setShowMap] = useState(false);

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-white tracking-tight font-display">Property Intelligence</h1>
          <p className="text-[10px] mt-0.5 font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>
            Terra · {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <DataStateBadge state={dataMode} label={dataMode === "live" ? "Live" : "Demo"} />
          {criticalSignals.length > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold animate-pulse" style={{ color: "#c0503a", background: "rgba(192,80,58,0.09)", border: "1px solid rgba(192,80,58,0.18)" }}>
              <AlertTriangle className="w-3 h-3" />
              {criticalSignals.length} Critical
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.012)" }}>
        <div className="grid grid-cols-3 md:grid-cols-6">
          {[
            { label: "Active Listings", value: brokerageSummary.activeListings.toString(), color: "#b8943c" },
            { label: "Distress Signals", value: "3", color: "#c0503a", pulse: true },
            { label: "Deals in Motion", value: brokerageSummary.activeDeals.toString(), color: "#3a7ad4" },
            { label: "Broker Response", value: "2.4h", color: "#40856a", sub: "avg" },
            { label: "Market Movement", value: "+2.1%", color: "#40856a", sub: "30d" },
            { label: "Portfolio Tracked", value: "$2.4B", color: "#b8943c" },
          ].map((c, i) => (
            <div key={c.label} className="px-3 py-3 text-center" style={{ borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <span className="text-base font-bold font-mono" style={{ color: c.color }}>{c.value}</span>
                {c.pulse && <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: c.color }} />}
              </div>
              <div className="text-[8px] font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.25)" }}>{c.label}</div>
              {c.sub && <div className="text-[7px] mt-0.5" style={{ color: "rgba(255,255,255,0.15)" }}>{c.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {DOCTRINE_MODULES.map((mod) => (
          <Link key={mod.id} href={mod.href} className="group rounded-xl border p-3 transition-all hover:border-white/10 cursor-pointer" style={{
            borderColor: "rgba(255,255,255,0.05)",
            background: "rgba(255,255,255,0.012)",
          }}>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}>
                <mod.icon className="w-3 h-3" style={{ color: mod.color }} />
              </div>
              {mod.count !== undefined && mod.count > 0 && <span className="text-[9px] font-bold font-mono" style={{ color: mod.color }}>{mod.count}</span>}
            </div>
            <div className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>{mod.label}</div>
            <div className="text-[8px] mt-0.5 hidden sm:block" style={{ color: "rgba(255,255,255,0.2)" }}>{mod.desc}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.012)" }}>
            <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              <MapPin className="w-3.5 h-3.5" style={{ color: "#b8943c" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(184,148,60,0.7)" }}>Opportunity Queue</span>
              <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>({OPPORTUNITY_QUEUE.length})</span>
              <Link href="/distress-engine" className="ml-auto flex items-center gap-1 text-[10px] font-medium transition-opacity hover:opacity-70" style={{ color: "#b8943c" }}>
                Full watchlist <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-1.5 border-b" style={{ borderColor: "rgba(255,255,255,0.03)" }}>
              {["Property", "Owner", "Stage", "Conf.", "Evidence", "Action"].map((h, i) => (
                <div key={h} className={`text-[8px] font-semibold uppercase tracking-wider ${i === 0 ? "col-span-3" : i === 1 ? "col-span-2" : i === 4 ? "col-span-3" : "col-span-1"}`} style={{ color: "rgba(255,255,255,0.2)" }}>
                  {h}
                </div>
              ))}
            </div>

            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.03)" }}>
              {OPPORTUNITY_QUEUE.map((item, i) => {
                const flag = FLAG_STYLES[item.flag];
                return (
                  <div key={i}>
                    <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2.5 items-start hover:bg-white/[0.015] transition-colors">
                      <div className="col-span-3 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: flag.color }} />
                          <p className="text-[11px] font-medium text-white/80 truncate">{item.address}</p>
                        </div>
                        <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>{item.type} · {item.value}</span>
                      </div>
                      <div className="col-span-2 min-w-0">
                        <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{item.owner}</p>
                      </div>
                      <div className="col-span-1">
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ color: flag.color, background: `${flag.color}12` }}>{item.stage}</span>
                      </div>
                      <div className="col-span-1">
                        <span className="text-[11px] font-bold font-mono" style={{ color: item.confidence >= 80 ? "#40856a" : item.confidence >= 65 ? "#b8943c" : "rgba(255,255,255,0.4)" }}>{item.confidence}%</span>
                      </div>
                      <div className="col-span-3 min-w-0">
                        <p className="text-[9px] leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>{item.evidence}</p>
                      </div>
                      <div className="col-span-2 min-w-0">
                        <p className="text-[9px] font-medium" style={{ color: "#40856a" }}>→ {item.nextAction}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 md:hidden px-4 py-3 hover:bg-white/[0.015] transition-colors">
                      <div className="flex items-start gap-2 justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5" style={{ background: flag.color }} />
                          <p className="text-[11px] font-medium text-white/80 truncate">{item.address}</p>
                        </div>
                        <span className="text-[11px] font-bold font-mono shrink-0" style={{ color: item.confidence >= 80 ? "#40856a" : item.confidence >= 65 ? "#b8943c" : "rgba(255,255,255,0.4)" }}>{item.confidence}%</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>{item.type} · {item.value}</span>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ color: flag.color, background: `${flag.color}12` }}>{item.stage}</span>
                      </div>
                      <p className="text-[9px] font-medium" style={{ color: "#40856a" }}>→ {item.nextAction}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.012)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-3.5 h-3.5" style={{ color: "#3a7ad4" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(58,122,212,0.7)" }}>Deal Pipeline</span>
              <Link href="/deals" className="ml-auto flex items-center gap-1 text-[10px] font-medium hover:opacity-70 transition-opacity" style={{ color: "#3a7ad4" }}>
                Full pipeline <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-0">
              {topDeals.map((deal, i) => (
                <div key={deal.id} className="flex items-center gap-3 py-2 hover:bg-white/[0.015] transition-colors" style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-white/80 truncate">{deal.address}</p>
                    {deal.buyerName && <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>{deal.buyerName}</span>}
                  </div>
                  <StageBadge stage={deal.stage} />
                  <RiskBadge level={deal.riskLevel} />
                  <span className="text-[11px] font-mono font-bold" style={{ color: "#b8943c" }}>{formatCurrency(deal.price)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.012)" }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#b8943c" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(184,148,60,0.7)" }}>Market Signals</span>
            </div>
            <div className="space-y-0">
              {MARKET_SIGNALS.map((sig, i) => (
                <div key={i} className="flex gap-2.5 py-2" style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                  <div className="flex flex-col items-center shrink-0 pt-0.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: SEVERITY_COLORS[sig.severity] }} />
                    {i < MARKET_SIGNALS.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: "rgba(255,255,255,0.04)" }} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{sig.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[8px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>{sig.time}</span>
                      <span className="text-[8px] px-1 py-0.5 rounded uppercase font-semibold" style={{
                        color: SEVERITY_COLORS[sig.severity],
                        background: `${SEVERITY_COLORS[sig.severity]}12`,
                      }}>{sig.severity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.012)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-3.5 h-3.5" style={{ color: "#3a7ad4" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(58,122,212,0.7)" }}>Top Brokers</span>
              <Link href="/leads" className="ml-auto flex items-center gap-1 text-[10px] font-medium hover:opacity-70 transition-opacity" style={{ color: "#3a7ad4" }}>
                Scorecards <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {topAgents.map((agent, i) => (
              <div key={agent.id} className="flex items-center gap-3 py-2" style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                <AgentAvatar agent={agent} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-white/70">{agent.name}</p>
                  <p className="text-[8px]" style={{ color: "rgba(255,255,255,0.25)" }}>{agent.activeDeals} deals · {agent.conversionRate}% conv</p>
                </div>
                <span className="text-[10px] font-mono font-bold" style={{ color: "#40856a" }}>{formatCurrency(agent.commissionMTD)}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl border p-3" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.012)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3" style={{ color: "rgba(255,255,255,0.25)" }} />
                <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: "rgba(255,255,255,0.25)" }}>System</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: dataMode === "live" ? "#40856a" : "#9a7840" }} />
                <span className="text-[9px] font-mono font-semibold" style={{ color: dataMode === "live" ? "#40856a" : "#9a7840" }}>{dataMode === "live" ? "Live" : "Demo"}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Occupancy", value: "81%", color: "#b8943c" },
                { label: "Pipeline", value: formatCurrency(brokerageSummary.pipelineValue), color: "#3a7ad4" },
                { label: "Freshness", value: "2m ago", color: "rgba(255,255,255,0.35)" },
                { label: "Confidence", value: "High", color: "#40856a" },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-[8px]" style={{ color: "rgba(255,255,255,0.2)" }}>{s.label}</div>
                  <div className="text-[10px] font-mono font-bold" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(184,148,60,0.08)", background: "rgba(255,255,255,0.012)" }}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-2">
            <Map className="w-3.5 h-3.5" style={{ color: "#b8943c" }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(184,148,60,0.6)" }}>Spatial Context</span>
            <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>— {properties.length} properties tracked</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMap(s => !s)}
              className="text-[9px] px-2.5 py-1 rounded-lg border transition-all"
              style={{
                color: showMap ? "#b8943c" : "rgba(255,255,255,0.35)",
                borderColor: showMap ? "rgba(184,148,60,0.25)" : "rgba(255,255,255,0.07)",
                background: showMap ? "rgba(184,148,60,0.06)" : "transparent",
              }}
            >
              {showMap ? "Hide Map" : "Show Map"}
            </button>
            <Link href="/property-map" className="text-[9px] px-2.5 py-1 rounded-lg border transition-all hover:bg-white/5" style={{ color: "#b8943c", borderColor: "rgba(184,148,60,0.18)" }}>
              Full Map →
            </Link>
          </div>
        </div>
        {showMap && (
          <div style={{ height: 300 }}>
            {mapToken ? (
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(184,148,60,0.2)", borderTopColor: "#b8943c" }} />
                </div>
              }>
                <PropertyMap properties={properties} token={mapToken} height="300px" showPanel={false} />
              </Suspense>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-1">
                  <Globe className="w-5 h-5 mx-auto" style={{ color: "rgba(184,148,60,0.3)" }} />
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>Map loading…</p>
                </div>
              </div>
            )}
          </div>
        )}
        {!showMap && (
          <div className="px-4 py-2.5 flex items-center gap-4">
            {[
              { label: "Performing", color: "#40856a", count: properties.filter(p => p.status === "performing").length },
              { label: "Watch", color: "#b8943c", count: properties.filter(p => p.status === "watch").length },
              { label: "Critical", color: "#c0503a", count: properties.filter(p => p.status === "critical").length },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{s.count} {s.label}</span>
              </div>
            ))}
            <span className="ml-auto text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>Click "Show Map" to view geographic distribution</span>
          </div>
        )}
      </div>

      <ActionLoop
        title="Next Best Actions"
        actions={[
          { id: "1", label: "Review 847 Park Ave pre-foreclosure — outreach window open", type: "investigate", severity: "high" },
          { id: "2", label: "Verify Tribeca LLC transfer on 45 Warren St", type: "investigate" },
          { id: "3", label: "Respond to 2 aging broker inquiries (SLA breach)", type: "remediate", severity: "high" },
          { id: "4", label: "Approve East Harlem cluster analysis — zip 10029", type: "approve" },
          { id: "5", label: "Assign 1240 Broadway price reduction to acquisition team", type: "assign" },
        ]}
      />

      <OwnershipIntelligencePanel />

      <div className="pb-2">
        <PackBanner
          vertical="Real Estate Intelligence Pack"
          description="Terra runs on the Lyte + Alloy core — property distress detection, ownership stack analysis, underwriting workflows, and document diligence all powered by the same intelligence fabric."
          accentColor="#40856a"
        />
      </div>
    </div>
  );
}

const OWNERSHIP_RECORDS = [
  {
    address: "847 Park Ave, Queens",
    type: "Pre-Foreclosure",
    value: "$2.1M",
    ownershipStack: [
      { entity: "Estate of R. Martinez (individual)", role: "Title Holder", flags: ["Probate pending"], risk: "high" as const },
      { entity: "Chase Mortgage Corp", role: "First Lien", flags: ["Q2 2026 maturity"], risk: "high" as const },
      { entity: "NYC Dept. of Finance", role: "Tax Authority", flags: ["$12K delinquent"], risk: "medium" as const },
    ],
    distressSignals: ["14yr hold", "Q2 2026 debt maturity", "Filing confirmed"],
    diligenceState: { status: "active" as const, docs: 3, open: 2 },
  },
  {
    address: "1240 Broadway, Manhattan",
    type: "Commercial",
    value: "$3.9M",
    ownershipStack: [
      { entity: "Midtown RE LLC", role: "Title Holder", flags: ["Identity: Cerberus Capital"], risk: "medium" as const },
      { entity: "NYCB Commercial Lending", role: "First Lien", flags: ["Performing"], risk: "low" as const },
    ],
    distressSignals: ["Listing price down 8%", "47 DOM", "LLC transfer pending"],
    diligenceState: { status: "watch" as const, docs: 1, open: 1 },
  },
  {
    address: "45 Warren St, Tribeca",
    type: "Multi-Family",
    value: "$4.8M",
    ownershipStack: [
      { entity: "W.Capital Partners LLC", role: "Title Holder", flags: ["Transfer detected"], risk: "medium" as const },
      { entity: "Signature Bridge Bank", role: "First Lien", flags: ["Receiver-held"], risk: "high" as const },
    ],
    distressSignals: ["LLC transfer detected", "11yr hold", "No active filings"],
    diligenceState: { status: "pending" as const, docs: 0, open: 0 },
  },
];

function OwnershipIntelligencePanel() {
  const [selected, setSelected] = useState(0);
  const record = OWNERSHIP_RECORDS[selected];

  const riskColors = {
    high: { text: "#c0503a", bg: "rgba(192,80,58,0.08)", border: "rgba(192,80,58,0.15)" },
    medium: { text: "#b8943c", bg: "rgba(184,148,60,0.08)", border: "rgba(184,148,60,0.15)" },
    low: { text: "#40856a", bg: "rgba(64,133,106,0.08)", border: "rgba(64,133,106,0.15)" },
  };

  const diligenceColors = {
    active: { text: "#b8943c", label: "Active Review" },
    watch: { text: "rgba(255,255,255,0.4)", label: "Watchlist" },
    pending: { text: "rgba(255,255,255,0.25)", label: "Pending" },
    complete: { text: "#40856a", label: "Complete" },
  };

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(64,133,106,0.10)", background: "rgba(64,133,106,0.015)" }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(64,133,106,0.08)", background: "rgba(64,133,106,0.03)" }}>
        <Layers className="w-3.5 h-3.5" style={{ color: "#40856a" }} />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(64,133,106,0.8)" }}>Ownership Stack Intelligence</span>
        <span className="text-[8px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wide" style={{ color: "rgba(245,158,11,0.6)", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)" }}>Demo Scenario</span>
        <span className="ml-auto text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>Select a property to drill in</span>
      </div>

      <div className="flex divide-x" style={{ borderColor: "rgba(64,133,106,0.06)" }}>
        <div className="w-48 shrink-0 p-2 space-y-0.5 border-r" style={{ borderColor: "rgba(64,133,106,0.06)" }}>
          {OWNERSHIP_RECORDS.map((rec, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className="w-full text-left px-3 py-2 rounded-lg transition-all"
              style={{
                background: selected === i ? "rgba(64,133,106,0.10)" : "transparent",
                border: selected === i ? "1px solid rgba(64,133,106,0.18)" : "1px solid transparent",
              }}
            >
              <p className="text-[10px] font-medium truncate" style={{ color: selected === i ? "#40856a" : "rgba(255,255,255,0.45)" }}>{rec.address.split(",")[0]}</p>
              <p className="text-[8px] mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>{rec.type} · {rec.value}</p>
            </button>
          ))}
        </div>

        <div className="flex-1 p-4 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>{record.address}</p>
              <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{record.type} · {record.value}</span>
            </div>

            <div className="text-[9px] uppercase tracking-wider font-semibold mb-2" style={{ color: "rgba(255,255,255,0.2)" }}>Ownership Stack</div>
            <div className="space-y-1.5">
              {record.ownershipStack.map((layer, i) => {
                const rc = riskColors[layer.risk];
                return (
                  <div key={i} className="flex items-start gap-2.5 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[8px] font-bold" style={{ background: rc.bg, color: rc.text, border: `1px solid ${rc.border}` }}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>{layer.entity}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)" }}>{layer.role}</span>
                      </div>
                      {layer.flags.map((f, fi) => (
                        <span key={fi} className="text-[9px] px-1.5 py-0.5 rounded mr-1 mt-1 inline-block" style={{ color: rc.text, background: rc.bg, border: `1px solid ${rc.border}` }}>{f}</span>
                      ))}
                    </div>
                    <span className="text-[8px] uppercase font-semibold shrink-0" style={{ color: rc.text }}>{layer.risk}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[9px] uppercase tracking-wider font-semibold mb-2" style={{ color: "rgba(255,255,255,0.2)" }}>Distress Signals</div>
              <div className="space-y-1">
                {record.distressSignals.map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full shrink-0" style={{ background: "#b8943c" }} />
                    <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.4)" }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-wider font-semibold mb-2" style={{ color: "rgba(255,255,255,0.2)" }}>Diligence State</div>
              <div className="flex items-center gap-2 mb-1.5">
                <FileText className="w-3.5 h-3.5" style={{ color: diligenceColors[record.diligenceState.status]?.text || "rgba(255,255,255,0.3)" }} />
                <span className="text-[10px] font-medium" style={{ color: diligenceColors[record.diligenceState.status]?.text || "rgba(255,255,255,0.3)" }}>
                  {diligenceColors[record.diligenceState.status]?.label}
                </span>
              </div>
              <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                {record.diligenceState.docs} docs uploaded · {record.diligenceState.open} items open
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
