import { useQuery } from "@tanstack/react-query";
import { m } from "framer-motion";
import {
  BarChart3, TrendingUp, Users, MousePointer, Globe, Activity,
  ArrowLeft, RefreshCw, Zap, Clock, Target, ChevronUp, ChevronDown, Radio,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface AppObs {
  appSlug: string;
  appName: string;
  overallScore: number;
  overallStatus: string;
  metrics?: Record<string, number>;
  events?: Array<{ label: string; timestamp: string; level: string }>;
  velocityTrend?: number;
  postureScore?: number;
}

function useEcosystemObs() {
  return useQuery<{ portfolioScore: number; apps: AppObs[]; timestamp: string }>({
    queryKey: ["analytics-obs"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/observability`);
      if (!res.ok) throw new Error("unavailable");
      return res.json();
    },
    refetchInterval: 60000,
    retry: 2,
  });
}

const ACCENT_COLORS = [
  "#6366f1", "#10b981", "#ef4444", "#f59e0b", "#3b82f6", "#ec4899", "#06b6d4", "#8b5cf6",
];

const trafficTrend = [
  { month: "Oct '25", visits: 2400, unique: 1800 },
  { month: "Nov '25", visits: 3100, unique: 2300 },
  { month: "Dec '25", visits: 2800, unique: 2100 },
  { month: "Jan '26", visits: 4200, unique: 3100 },
  { month: "Feb '26", visits: 5800, unique: 4200 },
  { month: "Mar '26", visits: 7400, unique: 5300 },
];

const ctaEvents = [
  { label: "Explore Ecosystem", clicks: 1840, conversions: 312, rate: 17 },
  { label: "Investor Relations", clicks: 620, conversions: 88, rate: 14 },
  { label: "Read Insights", clicks: 980, conversions: 180, rate: 18 },
  { label: "Contact / Inquire", clicks: 410, conversions: 76, rate: 19 },
  { label: "Enter Firestorm", clicks: 720, conversions: 540, rate: 75 },
  { label: "Enter Vessels", clicks: 380, conversions: 280, rate: 74 },
];

const referrers = [
  { source: "Direct", share: 38 },
  { source: "LinkedIn", share: 24 },
  { source: "Google Organic", share: 19 },
  { source: "Partner Referrals", share: 12 },
  { source: "Other", share: 7 },
];

const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#3b82f6", "#ec4899"];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: <span className="font-bold">{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</span></p>
        ))}
      </div>
    );
  }
  return null;
};

function MetricCard({ label, value, sub, delta, up, icon: Icon }: {
  label: string; value: string; sub: string; delta?: string; up?: boolean; icon: React.ElementType;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-4 h-4 text-muted-foreground" />
        {delta && (
          <span className={cn("text-[10px] font-bold flex items-center gap-0.5", up ? "text-emerald-500" : "text-red-500")}>
            {up ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {delta}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold font-display text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</p>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const { data: obs, isLoading, error } = useEcosystemObs();

  const appScores = obs?.apps?.map((a, i) => ({
    name: a.appName.replace(" Command Center", "").replace(" Intelligence", ""),
    score: a.overallScore,
    fill: ACCENT_COLORS[i % ACCENT_COLORS.length],
  })) ?? [];

  const appEventCounts = obs?.apps?.map((a, i) => ({
    name: a.appName.replace(" Command Center", "").replace(" Intelligence", ""),
    events: (a.events?.length ?? 0),
    fill: ACCENT_COLORS[i % ACCENT_COLORS.length],
  })) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-xs">
              <ArrowLeft className="w-4 h-4" /> Command Center
            </Link>
            <span className="text-border">/</span>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Executive Analytics</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <RefreshCw className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
            ) : (
              <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            )}
            {obs?.timestamp && (
              <span className="text-[10px] text-muted-foreground">
                Updated {new Date(obs.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Ecosystem Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time performance intelligence across the SZL Holdings platform portfolio.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard label="Monthly Visitors" value="7,400" sub="+27% vs last month" delta="27%" up icon={Users} />
          <MetricCard label="Portfolio Score" value={obs?.portfolioScore ? String(obs.portfolioScore) : "—"} sub="Ecosystem health index" icon={Activity} />
          <MetricCard label="CTA Conversion" value="17.4%" sub="Across all CTAs" delta="3%" up icon={Target} />
          <MetricCard label="Avg Session" value="9m 54s" sub="+18% vs last period" delta="18%" up icon={Clock} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Platform Traffic Trend
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trafficTrend}>
                <defs>
                  <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="uniqueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="visits" stroke="#6366f1" fill="url(#visitGrad)" strokeWidth={2} name="Total Visits" />
                <Area type="monotone" dataKey="unique" stroke="#10b981" fill="url(#uniqueGrad)" strokeWidth={1.5} strokeDasharray="4 2" name="Unique Visitors" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" /> Traffic Sources
            </h3>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={referrers} dataKey="share" nameKey="source" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                  {referrers.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {referrers.map((r, i) => (
                <div key={r.source} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-muted-foreground">{r.source}</span>
                  </div>
                  <span className="font-semibold text-foreground">{r.share}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {appScores.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Radio className="w-4 h-4 text-primary" /> Live Platform Health Scores
              <span className="text-[10px] text-emerald-500 ml-auto">From observability API</span>
            </h3>
            <div className="space-y-3">
              {appScores.map((a) => (
                <div key={a.name} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-24 shrink-0 truncate">{a.name}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${a.score}%`, backgroundColor: a.fill }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold w-6 text-right" style={{ color: a.fill }}>{a.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-primary" /> CTA Performance
            </h3>
            <div className="space-y-3">
              {ctaEvents.map(cta => (
                <div key={cta.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{cta.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-foreground font-medium">{cta.clicks.toLocaleString()} clicks</span>
                      <span className={cn(
                        "font-bold",
                        cta.rate >= 20 ? "text-emerald-500" : cta.rate >= 10 ? "text-amber-500" : "text-muted-foreground"
                      )}>{cta.rate}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(cta.rate * 4, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Inquiry Conversion Funnel
            </h3>
            <div className="space-y-4">
              {[
                { stage: "Site Visitors", count: 7400, pct: 100 },
                { stage: "Engaged (>2min)", count: 3100, pct: 42 },
                { stage: "CTA Interactions", count: 1240, pct: 17 },
                { stage: "Form Initiated", count: 320, pct: 4.3 },
                { stage: "Inquiry Submitted", count: 76, pct: 1.0 },
                { stage: "Qualified Lead", count: 28, pct: 0.4 },
              ].map((stage, i) => (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{stage.stage}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-foreground font-medium">{stage.count.toLocaleString()}</span>
                      <span className="text-muted-foreground w-10 text-right">{stage.pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${stage.pct}%`,
                        backgroundColor: `hsl(${240 - i * 30}, 70%, 60%)`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">1.0%</span> inquiry rate from visitors ·
                <span className="font-semibold text-foreground ml-1">36.8%</span> lead qualification rate
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> Platform Activity Volume
            {isLoading && <RefreshCw className="w-3.5 h-3.5 text-muted-foreground animate-spin ml-auto" />}
          </h3>
          {appEventCounts.length > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={appEventCounts}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="events" name="Events" radius={[4, 4, 0, 0]}>
                  {appEventCounts.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-36 flex items-center justify-center">
              <div className="text-center">
                {isLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading observability data...</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Observability data unavailable</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
