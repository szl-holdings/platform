import React, { useState } from "react";
import { TimeSeriesChart } from "@szl-holdings/shared-ui/analytics";
import { DashboardShell } from "@szl-holdings/shared-ui/design-system";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Activity, Layers } from "lucide-react";
import { LANE_ACCENT_HEX } from "@szl-holdings/shared-ui/lane-colors";

const ACCENT = LANE_ACCENT_HEX.szl.primary;

interface RevenueStream {
  id: string;
  label: string;
  domain: string;
  icon: string;
  color: string;
  totalRevenue: number;
  mrr?: number;
  qoqChange: number;
  yoyChange: number;
  breakdown: Array<{ label: string; amount: number }>;
  description: string;
}

const REVENUE_STREAMS: RevenueStream[] = [
  {
    id: "stripe",
    label: "Stripe Subscriptions",
    domain: "Platform",
    icon: "💳",
    color: "#635bff",
    totalRevenue: 1284000,
    mrr: 107000,
    qoqChange: 14.2,
    yoyChange: 38.6,
    breakdown: [
      { label: "Enterprise Plans", amount: 820000 },
      { label: "Growth Plans", amount: 312000 },
      { label: "Pro Plans", amount: 152000 },
    ],
    description: "SaaS subscription revenue across all products",
  },
  {
    id: "portfolio",
    label: "Portfolio Valuations",
    domain: "SZL Holdings",
    icon: "◆",
    color: ACCENT,
    totalRevenue: 284200000,
    qoqChange: 3.1,
    yoyChange: 18.4,
    breakdown: [
      { label: "Maritime Fund", amount: 98400000 },
      { label: "Real Estate Holdings", amount: 142800000 },
      { label: "Venture Portfolio", amount: 43000000 },
    ],
    description: "Cross-domain portfolio asset valuations (NAV)",
  },
  {
    id: "terra",
    label: "Real Estate Yields",
    domain: "Terra",
    icon: "⬢",
    color: "#22c55e",
    totalRevenue: 6840000,
    mrr: 570000,
    qoqChange: 2.8,
    yoyChange: 11.2,
    breakdown: [
      { label: "Commercial Rents", amount: 3200000 },
      { label: "Industrial Rents", amount: 2100000 },
      { label: "Residential Yield", amount: 1540000 },
    ],
    description: "Annualized real estate rental yield projections",
  },
  {
    id: "vessels",
    label: "Maritime Revenue",
    domain: "Vessels",
    icon: "⚓",
    color: "#0ea5e9",
    totalRevenue: 21400000,
    mrr: 1783333,
    qoqChange: 7.3,
    yoyChange: 24.1,
    breakdown: [
      { label: "Charter Revenue", amount: 12800000 },
      { label: "Cargo Commissions", amount: 5400000 },
      { label: "Port Agency Fees", amount: 3200000 },
    ],
    description: "Maritime operations: charter, cargo, and agency fees",
  },
  {
    id: "carlota",
    label: "Advisory Fees",
    domain: "Carlota Jo",
    icon: "◈",
    color: "#ec4899",
    totalRevenue: 3600000,
    mrr: 300000,
    qoqChange: 18.5,
    yoyChange: 42.3,
    breakdown: [
      { label: "Retainer Fees", amount: 2100000 },
      { label: "Project Engagements", amount: 980000 },
      { label: "Workshop Revenue", amount: 520000 },
    ],
    description: "Advisory retainers, project engagements, and workshops",
  },
];

const MONTHS = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];

function generateTrend(base: number, volatility: number, trend: "up" | "down" | "flat" = "up"): number[] {
  return MONTHS.map((_, i) => {
    const growth = trend === "up" ? 1 + (i * 0.02) : trend === "down" ? 1 - (i * 0.01) : 1;
    return base * growth * (1 + (Math.random() - 0.5) * volatility);
  });
}

function formatCurrency(v: number, compact = true): string {
  if (compact) {
    if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  }
  return `$${v.toLocaleString()}`;
}

function RevenueStreamCard({ stream, selected, onClick }: { stream: RevenueStream; selected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? `${stream.color}12` : "rgba(255,255,255,0.02)",
        border: `1px solid ${selected ? stream.color + "40" : "rgba(255,255,255,0.07)"}`,
        borderRadius: "14px",
        padding: "16px",
        cursor: "pointer",
        transition: "all 0.2s",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${stream.color}20`, border: `1px solid ${stream.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>
            {stream.icon}
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{stream.label}</div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>{stream.domain}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: stream.qoqChange >= 0 ? "#22c55e" : "#ef4444", fontWeight: 700, display: "flex", alignItems: "center", gap: "2px", justifyContent: "flex-end" }}>
            {stream.qoqChange >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {stream.qoqChange >= 0 ? "+" : ""}{stream.qoqChange.toFixed(1)}% QoQ
          </div>
          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", marginTop: "1px" }}>{stream.yoyChange >= 0 ? "+" : ""}{stream.yoyChange.toFixed(1)}% YoY</div>
        </div>
      </div>
      <div style={{ fontSize: "20px", fontWeight: 800, color: stream.color }}>{formatCurrency(stream.totalRevenue)}</div>
      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
        {stream.mrr ? `${formatCurrency(stream.mrr)}/mo` : "Portfolio NAV"}
      </div>
    </div>
  );
}

export default function RevenueFusionPage() {
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [view, setView] = useState<"overview" | "waterfall" | "attribution">("overview");
  const [streams, setStreams] = useState<RevenueStream[]>(REVENUE_STREAMS);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/revenue-intelligence/summary", { credentials: "include" });
        if (res.ok) {
          const json = await res.json() as { data?: { streams?: RevenueStream[] } };
          if (Array.isArray(json.data?.streams) && (json.data?.streams?.length ?? 0) > 0) {
            setStreams(json.data!.streams!);
          }
        }
      } catch {
      }
    }
    void load();
  }, []);

  const total = streams.reduce((s, r) => s + (r.id === "portfolio" ? 0 : r.totalRevenue), 0);
  const totalWithPortfolio = streams.reduce((s, r) => s + r.totalRevenue, 0);
  const totalQoQ = streams.filter((r) => r.id !== "portfolio").reduce((s, r, _i, arr) => s + (r.qoqChange / arr.length), 0);

  const selected = streams.find((r) => r.id === selectedStream);

  const chartData = MONTHS.map((month, i) => ({
    label: month,
    stripe: Math.round(generateTrend(107000, 0.06)[i] ?? 107000),
    vessels: Math.round(generateTrend(1783333, 0.09)[i] ?? 1783333),
    terra: Math.round(generateTrend(570000, 0.04)[i] ?? 570000),
    carlota: Math.round(generateTrend(300000, 0.1, "up")[i] ?? 300000),
  }));

  return (
    <DashboardShell topbar={
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <DollarSign size={18} style={{ color: ACCENT }} />
        <div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>Revenue Intelligence Fusion</div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Unified P&L across all domains · Stripe, Portfolio, Real Estate, Maritime, Advisory</div>
        </div>
      </div>
    }>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", fontFamily: "system-ui, sans-serif" }}>

        {/* Top KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          {[
            { label: "Operating Revenue", value: formatCurrency(total), sub: `+${totalQoQ.toFixed(1)}% QoQ avg`, color: "#22c55e" },
            { label: "Portfolio NAV", value: formatCurrency(284200000), sub: "+3.1% QoQ", color: ACCENT },
            { label: "MRR (Combined)", value: formatCurrency(107000 + 1783333 + 570000 + 300000), sub: "+14% growth rate", color: "#0ea5e9" },
            { label: "Revenue Streams", value: `${streams.length}`, sub: "domains contributing", color: "#a855f7" },
          ].map((kpi) => (
            <div key={kpi.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "14px 16px" }}>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{kpi.label}</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "3px" }}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* View switcher */}
        <div style={{ display: "flex", gap: "6px" }}>
          {(["overview", "waterfall", "attribution"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: "7px 14px",
                borderRadius: "8px",
                border: `1px solid ${view === v ? ACCENT + "50" : "rgba(255,255,255,0.1)"}`,
                background: view === v ? `${ACCENT}15` : "rgba(255,255,255,0.04)",
                color: view === v ? ACCENT : "rgba(255,255,255,0.5)",
                fontSize: "12px",
                fontWeight: view === v ? 700 : 400,
                cursor: "pointer",
                fontFamily: "system-ui, sans-serif",
                textTransform: "capitalize",
              }}
            >
              {v}
            </button>
          ))}
        </div>

        {view === "overview" && (
          <>
            {/* Revenue stream cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              {streams.map((stream) => (
                <RevenueStreamCard
                  key={stream.id}
                  stream={stream}
                  selected={selectedStream === stream.id}
                  onClick={() => setSelectedStream((prev) => (prev === stream.id ? null : stream.id))}
                />
              ))}
            </div>

            {/* Selected stream detail */}
            {selected && (
              <div style={{ background: `${selected.color}08`, border: `1px solid ${selected.color}25`, borderRadius: "14px", padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                  <span style={{ fontSize: "18px" }}>{selected.icon}</span>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{selected.label}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{selected.description}</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                  {selected.breakdown.map((b) => {
                    const pct = (b.amount / selected.totalRevenue) * 100;
                    return (
                      <div key={b.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "12px" }}>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>{b.label}</div>
                        <div style={{ fontSize: "16px", fontWeight: 700, color: selected.color }}>{formatCurrency(b.amount)}</div>
                        <div style={{ marginTop: "8px", height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "2px" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: selected.color, borderRadius: "2px" }} />
                        </div>
                        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "3px" }}>{pct.toFixed(0)}% of total</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {view === "waterfall" && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: "16px" }}>Cash Flow Waterfall — Operating Revenue</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {streams.filter((r) => r.id !== "portfolio").map((stream, i, arr) => {
                const runningTotal = arr.slice(0, i + 1).reduce((s, r) => s + r.totalRevenue, 0);
                const pct = (stream.totalRevenue / total) * 100;
                return (
                  <div key={stream.id} style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", padding: "12px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "16px", width: "24px", textAlign: "center" }}>{stream.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{stream.label}</span>
                          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: stream.color }}>{formatCurrency(stream.totalRevenue)}</span>
                            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", minWidth: "80px", textAlign: "right" }}>Running: {formatCurrency(runningTotal)}</span>
                          </div>
                        </div>
                        <div style={{ height: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${stream.color}, ${stream.color}80)`, borderRadius: "4px", transition: "width 0.5s ease" }} />
                        </div>
                        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", marginTop: "3px" }}>{pct.toFixed(1)}% of operating revenue</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div style={{ borderTop: "2px solid rgba(255,255,255,0.15)", padding: "12px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>Total Operating Revenue</span>
                <span style={{ fontSize: "18px", fontWeight: 800, color: "#22c55e" }}>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        )}

        {view === "attribution" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "20px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>Revenue Attribution</div>
              {streams.filter((r) => r.id !== "portfolio").map((stream) => {
                const pct = (stream.totalRevenue / total) * 100;
                return (
                  <div key={stream.id} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: stream.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>{stream.label}</div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: stream.color }}>{pct.toFixed(1)}%</div>
                    <div style={{ width: "80px", height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: stream.color, borderRadius: "2px" }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "20px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>Growth Rates by Domain</div>
              {streams.map((stream) => (
                <div key={stream.id} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <span style={{ fontSize: "14px", width: "20px" }}>{stream.icon}</span>
                  <div style={{ flex: 1, fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>{stream.label}</div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: stream.qoqChange >= 0 ? "#22c55e" : "#ef4444" }}>
                      {stream.qoqChange >= 0 ? "+" : ""}{stream.qoqChange.toFixed(1)}% QoQ
                    </div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>
                      {stream.yoyChange >= 0 ? "+" : ""}{stream.yoyChange.toFixed(1)}% YoY
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
