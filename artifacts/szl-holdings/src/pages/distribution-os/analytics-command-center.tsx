import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { m } from "framer-motion";
import {
  Activity, Users, Eye, TrendingUp, Target, BarChart3, Globe,
  Smartphone, Monitor, Tablet, Chrome, RefreshCw, Filter,
  ArrowUp, ArrowDown, Clock, Zap, MousePointer, Radio,
} from "lucide-react";
import { DistributionOsLayout } from "./admin-dashboard";

const API = import.meta.env.VITE_API_URL || "";

interface TopPage {
  path: string;
  views: number;
  uniqueVisitors: number;
  avgDurationSeconds: number | null;
  bounceRate: string;
}

interface OverviewData {
  totalSessions: number;
  totalPageViews: number;
  totalConversions: number;
  uniqueVisitors: number;
  activeNow: number;
  conversionRate: string;
  bounceRate: string;
  avgSessionDurationSeconds: number;
  channels: Array<{ channel: string | null; count: number }>;
  devices: Array<{ deviceType: string | null; count: number }>;
  browsers: Array<{ browser: string | null; count: number }>;
  topPages: TopPage[];
  utmCampaigns: Array<{ utmSource: string | null; utmMedium: string | null; utmCampaign: string | null; count: number }>;
  recentVisitors: Array<{
    visitorId: string;
    path: string | null;
    channel: string | null;
    sessionStart: string;
    sessionEnd: string | null;
    pageCount: number;
    converted: boolean;
  }>;
  durationHistogram: Array<{ label: string; count: number }>;
  funnel: { visit: number; engage: number; convert: number };
}

const CHANNEL_COLORS: Record<string, string> = {
  organic: "#5a9c5a",
  paid: "#d4a054",
  direct: "#4a90b8",
  social: "#8b7ac8",
  email: "#c45a4a",
  referral: "#6b8b6b",
};

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function MetricCard({ icon: Icon, label, value, sub, color = "#4a90b8", delta, pulse }: {
  icon: typeof Eye; label: string; value: string | number; sub?: string; color?: string; delta?: number; pulse?: boolean;
}) {
  return (
    <div style={{ padding: "1.25rem", background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "10px", position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <Icon size={16} style={{ color }} />
          {pulse && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#5a9c5a", display: "inline-block", animation: "pulse-dot 1.5s ease-in-out infinite" }} />}
        </div>
        {delta !== undefined && (
          <span style={{ fontSize: "0.6875rem", color: delta >= 0 ? "#5a9c5a" : "#c45a4a", display: "flex", alignItems: "center", gap: "0.125rem" }}>
            {delta >= 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#e8e4de", letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "0.75rem", color: "#8b8579", marginTop: "0.375rem" }}>{label}</div>
      {sub && <div style={{ fontSize: "0.6875rem", color: "#4a4540", marginTop: "0.125rem" }}>{sub}</div>}
      <style>{`@keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }`}</style>
    </div>
  );
}

function FunnelBar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
        <span style={{ fontSize: "0.8125rem", color: "#8b8579" }}>{label}</span>
        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#e8e4de" }}>{count.toLocaleString()}</span>
      </div>
      <div style={{ height: "8px", background: "hsla(0,0%,100%,0.05)", borderRadius: "4px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "4px", transition: "width 0.5s ease" }} />
      </div>
      <div style={{ fontSize: "0.625rem", color: "#4a4540", marginTop: "0.25rem" }}>{pct.toFixed(1)}% of visits</div>
    </div>
  );
}

function ChannelPie({ channels }: { channels: Array<{ channel: string | null; count: number }> }) {
  const total = channels.reduce((s, c) => s + c.count, 0);
  return (
    <div>
      {channels.map((ch) => {
        const label = ch.channel ?? "unknown";
        const pct = total > 0 ? ((ch.count / total) * 100).toFixed(1) : "0";
        const color = CHANNEL_COLORS[label] ?? "#6b6560";
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.625rem" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.8125rem", color: "#8b8579", textTransform: "capitalize" }}>{label}</span>
                <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#e8e4de" }}>{ch.count}</span>
              </div>
              <div style={{ height: "3px", background: "hsla(0,0%,100%,0.05)", borderRadius: "2px", marginTop: "0.25rem" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "2px" }} />
              </div>
            </div>
            <span style={{ fontSize: "0.6875rem", color: "#4a4540", width: "36px", textAlign: "right" }}>{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

function LiveFeed({ visitors }: { visitors: OverviewData["recentVisitors"] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {visitors.slice(0, 10).map((v, i) => {
        const isRecent = v.sessionEnd && (Date.now() - new Date(v.sessionEnd).getTime()) < 5 * 60 * 1000;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem", background: "hsla(0,0%,100%,0.02)", borderRadius: "6px", border: "1px solid hsla(0,0%,100%,0.04)" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: v.converted ? "#5a9c5a" : isRecent ? "#d4a054" : "#4a90b8", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.75rem", color: "#8b8579", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {v.path ?? "/"}
              </div>
              <div style={{ fontSize: "0.6875rem", color: "#4a4540" }}>
                {v.channel ?? "direct"} · {v.pageCount}p
                {v.converted && <span style={{ color: "#5a9c5a" }}> · converted</span>}
                {isRecent && !v.converted && <span style={{ color: "#d4a054" }}> · active</span>}
              </div>
            </div>
            <span style={{ fontSize: "0.6875rem", color: "#4a4540", flexShrink: 0 }}>
              {new Date(v.sessionStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        );
      })}
      {visitors.length === 0 && (
        <div style={{ fontSize: "0.8125rem", color: "#4a4540", textAlign: "center", padding: "1rem" }}>No recent sessions</div>
      )}
    </div>
  );
}

function TopPagesTable({ pages }: { pages: TopPage[] }) {
  if (pages.length === 0) {
    return <div style={{ fontSize: "0.8125rem", color: "#4a4540", textAlign: "center", padding: "1rem" }}>No page view data yet</div>;
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid hsla(0,0%,100%,0.06)" }}>
            <th style={{ textAlign: "left", color: "#4a4540", padding: "0.375rem 0.5rem 0.5rem 0", fontWeight: 600, fontSize: "0.6875rem" }}>#</th>
            <th style={{ textAlign: "left", color: "#4a4540", padding: "0.375rem 0.5rem 0.5rem 0", fontWeight: 600, fontSize: "0.6875rem" }}>Page</th>
            <th style={{ textAlign: "right", color: "#4a4540", padding: "0.375rem 0.5rem 0.5rem", fontWeight: 600, fontSize: "0.6875rem" }}>Views</th>
            <th style={{ textAlign: "right", color: "#4a4540", padding: "0.375rem 0.5rem 0.5rem", fontWeight: 600, fontSize: "0.6875rem" }}>Unique</th>
            <th style={{ textAlign: "right", color: "#4a4540", padding: "0.375rem 0.5rem 0.5rem", fontWeight: 600, fontSize: "0.6875rem" }}>Avg Time</th>
            <th style={{ textAlign: "right", color: "#4a4540", padding: "0.375rem 0 0.5rem", fontWeight: 600, fontSize: "0.6875rem" }}>Bounce</th>
          </tr>
        </thead>
        <tbody>
          {pages.slice(0, 15).map((p, i) => (
            <tr key={i} style={{ borderBottom: "1px solid hsla(0,0%,100%,0.03)" }}>
              <td style={{ padding: "0.5rem 0.5rem 0.5rem 0", color: "#4a4540" }}>{i + 1}</td>
              <td style={{ padding: "0.5rem 0.5rem", color: "#8b8579", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.path}</td>
              <td style={{ padding: "0.5rem 0.5rem", color: "#e8e4de", fontWeight: 600, textAlign: "right" }}>{p.views.toLocaleString()}</td>
              <td style={{ padding: "0.5rem 0.5rem", color: "#8b8579", textAlign: "right" }}>{(p.uniqueVisitors ?? 0).toLocaleString()}</td>
              <td style={{ padding: "0.5rem 0.5rem", color: "#8b8579", textAlign: "right" }}>{formatDuration(p.avgDurationSeconds ?? 0)}</td>
              <td style={{ padding: "0.5rem 0", textAlign: "right" }}>
                <span style={{ color: parseFloat(p.bounceRate) > 60 ? "#c45a4a" : parseFloat(p.bounceRate) > 30 ? "#d4a054" : "#5a9c5a" }}>
                  {p.bounceRate}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AnalyticsCommandCenterPage() {
  const [location] = useLocation();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/analytics-lake/overview?days=${days}`);
      if (res.ok) {
        const d = await res.json() as OverviewData;
        setData(d);
      }
    } catch { /* loading state remains */ }
    setLoading(false);
  }, [days]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const interval = setInterval(() => { refresh(); }, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const d = data;

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e8e4de" }}>Analytics Command Center</h1>
            <p style={{ fontSize: "0.8125rem", color: "#6b6560", marginTop: "0.25rem" }}>First-party visitor intelligence & conversion tracking</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {[7, 14, 30].map(n => (
              <button
                key={n}
                onClick={() => setDays(n)}
                style={{
                  padding: "0.375rem 0.75rem", borderRadius: "6px", fontSize: "0.75rem", cursor: "pointer",
                  background: days === n ? "hsla(0,0%,100%,0.1)" : "transparent",
                  border: `1px solid ${days === n ? "hsla(0,0%,100%,0.15)" : "hsla(0,0%,100%,0.06)"}`,
                  color: days === n ? "#e8e4de" : "#6b6560",
                }}
              >
                {n}d
              </button>
            ))}
            <button
              onClick={refresh}
              disabled={refreshing}
              style={{ padding: "0.375rem", borderRadius: "6px", background: "transparent", border: "1px solid hsla(0,0%,100%,0.06)", color: "#6b6560", cursor: "pointer" }}
            >
              <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            </button>
          </div>
        </div>

        {loading && !d ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#4a4540", fontSize: "0.875rem" }}>Loading analytics…</div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              <MetricCard icon={Radio} label="Active Now" value={d?.activeNow ?? 0} sub="visitors in last 5m" color="#5a9c5a" pulse={(d?.activeNow ?? 0) > 0} />
              <MetricCard icon={Users} label="Unique Visitors" value={(d?.uniqueVisitors ?? 0).toLocaleString()} color="#4a90b8" />
              <MetricCard icon={Eye} label="Page Views" value={(d?.totalPageViews ?? 0).toLocaleString()} color="#8b7ac8" />
              <MetricCard icon={Target} label="Conversions" value={(d?.totalConversions ?? 0).toLocaleString()} color="#5a9c5a" />
              <MetricCard icon={TrendingUp} label="Conv. Rate" value={`${d?.conversionRate ?? "0.00"}%`} color="#d4a054" />
              <MetricCard icon={Activity} label="Bounce Rate" value={`${d?.bounceRate ?? "0.00"}%`} color="#c45a4a" />
              <MetricCard icon={Clock} label="Avg Duration" value={formatDuration(d?.avgSessionDurationSeconds ?? 0)} color="#4a90b8" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
              <div style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
                <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Zap size={14} style={{ color: "#d4a054" }} />
                  Conversion Funnel
                </h3>
                {d?.funnel && (
                  <>
                    <FunnelBar label="Visit" count={d.funnel.visit} max={d.funnel.visit} color="#4a90b8" />
                    <FunnelBar label="Engage (2+ pages)" count={d.funnel.engage} max={d.funnel.visit} color="#8b7ac8" />
                    <FunnelBar label="Convert" count={d.funnel.convert} max={d.funnel.visit} color="#5a9c5a" />
                  </>
                )}
              </div>

              <div style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
                <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Globe size={14} style={{ color: "#4a90b8" }} />
                  Acquisition Channels
                </h3>
                <ChannelPie channels={d?.channels ?? []} />
              </div>
            </div>

            <div style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <BarChart3 size={14} style={{ color: "#8b7ac8" }} />
                Top Pages
              </h3>
              <TopPagesTable pages={d?.topPages ?? []} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Monitor size={14} style={{ color: "#4a90b8" }} />
                    Devices
                  </h3>
                  {(d?.devices ?? []).map((dev, i) => {
                    const total = (d?.devices ?? []).reduce((s, dd) => s + dd.count, 0);
                    const label = dev.deviceType ?? "unknown";
                    const pct = total > 0 ? ((dev.count / total) * 100).toFixed(0) : "0";
                    const DevIcon = label === "mobile" ? Smartphone : label === "tablet" ? Tablet : Monitor;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <DevIcon size={12} style={{ color: "#6b6560" }} />
                        <span style={{ fontSize: "0.75rem", color: "#8b8579", flex: 1, textTransform: "capitalize" }}>{label}</span>
                        <span style={{ fontSize: "0.75rem", color: "#e8e4de" }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Chrome size={14} style={{ color: "#d4a054" }} />
                    Browsers
                  </h3>
                  {(d?.browsers ?? []).map((br, i) => {
                    const total = (d?.browsers ?? []).reduce((s, b) => s + b.count, 0);
                    const pct = total > 0 ? ((br.count / total) * 100).toFixed(0) : "0";
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.75rem", color: "#8b8579", flex: 1 }}>{br.browser ?? "Other"}</span>
                        <span style={{ fontSize: "0.75rem", color: "#e8e4de" }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Filter size={14} style={{ color: "#5a9c5a" }} />
                    UTM Campaign Performance
                  </h3>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid hsla(0,0%,100%,0.06)" }}>
                          <th style={{ textAlign: "left", fontSize: "0.6875rem", color: "#4a4540", padding: "0.5rem 0", fontWeight: 600 }}>Source</th>
                          <th style={{ textAlign: "left", fontSize: "0.6875rem", color: "#4a4540", padding: "0.5rem 0", fontWeight: 600 }}>Medium</th>
                          <th style={{ textAlign: "left", fontSize: "0.6875rem", color: "#4a4540", padding: "0.5rem 0", fontWeight: 600 }}>Campaign</th>
                          <th style={{ textAlign: "right", fontSize: "0.6875rem", color: "#4a4540", padding: "0.5rem 0", fontWeight: 600 }}>Sessions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(d?.utmCampaigns ?? []).slice(0, 8).map((u, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid hsla(0,0%,100%,0.03)" }}>
                            <td style={{ fontSize: "0.75rem", color: "#8b8579", padding: "0.5rem 0" }}>{u.utmSource ?? "—"}</td>
                            <td style={{ fontSize: "0.75rem", color: "#8b8579", padding: "0.5rem 0" }}>{u.utmMedium ?? "—"}</td>
                            <td style={{ fontSize: "0.75rem", color: "#8b8579", padding: "0.5rem 0", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.utmCampaign ?? "—"}</td>
                            <td style={{ fontSize: "0.75rem", color: "#e8e4de", fontWeight: 600, padding: "0.5rem 0", textAlign: "right" }}>{u.count}</td>
                          </tr>
                        ))}
                        {(d?.utmCampaigns ?? []).length === 0 && (
                          <tr>
                            <td colSpan={4} style={{ fontSize: "0.75rem", color: "#4a4540", textAlign: "center", padding: "1rem 0" }}>No UTM data yet</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Activity size={14} style={{ color: "#4a90b8" }} />
                    Live Visitor Feed
                    <span style={{ marginLeft: "auto", fontSize: "0.6875rem", color: "#4a4540" }}>Updates every 30s</span>
                  </h3>
                  <LiveFeed visitors={d?.recentVisitors ?? []} />
                </div>
              </div>
            </div>

            <div style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <MousePointer size={14} style={{ color: "#c45a4a" }} />
                Session Duration Distribution
              </h3>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem", height: "80px" }}>
                {(d?.durationHistogram ?? []).map((bucket, i) => {
                  const maxCount = Math.max(...(d?.durationHistogram ?? []).map(b => b.count), 1);
                  const pct = (bucket.count / maxCount) * 100;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.375rem" }}>
                      <span style={{ fontSize: "0.625rem", color: "#4a4540" }}>{bucket.count}</span>
                      <div style={{ width: "100%", background: "hsla(191,92%,44%,0.7)", height: `${pct}%`, minHeight: "2px", borderRadius: "3px 3px 0 0" }} />
                      <span style={{ fontSize: "0.6rem", color: "#4a4540", textAlign: "center", lineHeight: 1.2 }}>{bucket.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </m.div>
    </DistributionOsLayout>
  );
}
