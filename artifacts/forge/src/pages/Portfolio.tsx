import { AppShell } from "@/components/layout/AppShell";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, ArrowUpRight, Anchor, Building2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { portalApi, type PortfolioResponse } from "@/lib/api";
import { TREND_DATA, DOMAIN_RETURNS, fmt } from "@/data/mock";

const DOMAIN_COLORS: Record<string, string> = {
  vessels: "var(--color-forge-vessels)",
  terra: "var(--color-forge-terra)",
};

const DOMAIN_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  vessels: Anchor,
  terra: Building2,
};

export default function Portfolio() {
  const { data, isLoading } = useQuery<PortfolioResponse>({
    queryKey: ["forge-portal", "portfolio"],
    queryFn: () => portalApi.getPortfolio(),
    retry: 1,
  });

  const holdings = data?.holdings ?? [];
  const totalValue = data?.totalValue ?? 0;
  const totalDeployed = data?.totalDeployed ?? 0;
  const gain = totalValue - totalDeployed;
  const blendedReturn = totalDeployed > 0 ? `+${(((totalValue - totalDeployed) / totalDeployed) * 100).toFixed(1)}%` : "—";

  const byDomain = holdings.reduce((acc, h) => {
    if (!acc[h.domain]) acc[h.domain] = { deployed: 0, value: 0, count: 0 };
    acc[h.domain].deployed += h.capitalDeployed;
    acc[h.domain].value += h.currentValue;
    acc[h.domain].count += 1;
    return acc;
  }, {} as Record<string, { deployed: number; value: number; count: number }>);

  return (
    <AppShell title="Portfolio" subtitle="Investment analytics across your SZL Holdings engagements">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
          <KPI label="Total Value" value={isLoading ? "—" : fmt(totalValue)} sub="Current NAV" color="var(--color-forge-primary)" />
          <KPI label="Capital Deployed" value={isLoading ? "—" : fmt(totalDeployed)} sub="Across all holdings" color="var(--color-forge-gold)" />
          <KPI label="Total Gain" value={isLoading ? "—" : fmt(gain)} sub="Unrealized gain" color="var(--color-forge-success)" positive />
          <KPI label="Blended Return" value={isLoading ? "—" : blendedReturn} sub="vs. 9.5% target" color="var(--color-forge-vessels)" positive />
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* NAV trend */}
          <div className="forge-card-elevated p-5 lg:col-span-2 animate-fade-in-up stagger-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="forge-eyebrow mb-1">Portfolio NAV Trend</div>
                <div className="font-600 text-sm" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-display)" }}>7-Month Performance</div>
              </div>
              <span className="forge-badge forge-badge-success flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />+24.7%
              </span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={TREND_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="navGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-forge-primary)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--color-forge-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-forge-text-faint)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-forge-text-faint)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--color-forge-elevated)", border: "1px solid var(--color-forge-border)", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(v: number) => [`$${v}M`, "NAV Index"]}
                />
                <Area type="monotone" dataKey="value" stroke="var(--color-forge-primary)" strokeWidth={2} fill="url(#navGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Domain breakdown */}
          <div className="forge-card-elevated p-5 animate-fade-in-up stagger-3">
            <div className="forge-eyebrow mb-1">Domain Breakdown</div>
            <div className="font-600 text-sm mb-4" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-display)" }}>By Capital Deployed</div>
            {DOMAIN_RETURNS.map(d => {
              const domainData = byDomain[d.domain.toLowerCase() === "maritime" ? "vessels" : "terra"];
              const pct = domainData && totalDeployed > 0 ? Math.round((domainData.deployed / totalDeployed) * 100) : 0;
              return (
                <div key={d.domain} className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-500" style={{ color: "var(--color-forge-text)" }}>{d.domain}</span>
                    <div className="text-right">
                      <span className="forge-metric-xs" style={{ color: d.color }}>{d.irr}%</span>
                      <span className="text-xs ml-1" style={{ color: "var(--color-forge-text-muted)" }}>IRR</span>
                    </div>
                  </div>
                  <div className="forge-progress">
                    <div className="forge-progress-fill" style={{ width: `${pct}%`, background: d.color }} />
                  </div>
                  <div className="text-xs mt-1" style={{ color: "var(--color-forge-text-faint)" }}>{pct}% of portfolio · {fmt(domainData?.deployed ?? 0)} deployed</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Holdings table */}
        <div className="forge-card-elevated overflow-hidden animate-fade-in-up stagger-4">
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--color-forge-border)" }}>
            <h3 className="font-600 text-sm" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-display)" }}>Holdings</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="forge-table">
              <thead>
                <tr>
                  <th>Holding</th>
                  <th>Domain</th>
                  <th>Deployed</th>
                  <th>Current Value</th>
                  <th>Gain / Loss</th>
                  <th>IRR</th>
                  <th>Vintage</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map(h => {
                  const gain = h.currentValue - h.capitalDeployed;
                  const gainPct = ((gain / h.capitalDeployed) * 100).toFixed(1);
                  const Icon = DOMAIN_ICONS[h.domain];
                  return (
                    <tr key={h.id}>
                      <td>
                        <span className="font-500 text-sm" style={{ color: "var(--color-forge-text)" }}>{h.name}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5" style={{ color: DOMAIN_COLORS[h.domain] }} />
                          <span className="text-xs capitalize" style={{ color: DOMAIN_COLORS[h.domain] }}>
                            {h.domain === "vessels" ? "Maritime" : "Real Estate"}
                          </span>
                        </div>
                      </td>
                      <td><span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>{fmt(h.capitalDeployed)}</span></td>
                      <td><span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-forge-text)" }}>{fmt(h.currentValue)}</span></td>
                      <td>
                        <span className="text-xs" style={{ color: gain >= 0 ? "var(--color-forge-success)" : "var(--color-forge-danger)", fontFamily: "var(--font-mono)" }}>
                          {gain >= 0 ? "+" : ""}{fmt(gain)} ({gainPct}%)
                        </span>
                      </td>
                      <td>
                        <span className="forge-metric-xs" style={{ color: "var(--color-forge-primary)" }}>{h.irr}</span>
                      </td>
                      <td><span className="text-xs" style={{ color: "var(--color-forge-text-muted)", fontFamily: "var(--font-mono)" }}>{h.vintage}</span></td>
                      <td>
                        <span className={`forge-badge ${h.status === "active" ? "forge-badge-success" : h.status === "exited" ? "forge-badge-neutral" : "forge-badge-warning"}`}>
                          {h.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function KPI({ label, value, sub, color, positive }: { label: string; value: string; sub: string; color: string; positive?: boolean }) {
  return (
    <div className="forge-card-elevated p-4">
      <div className="forge-eyebrow mb-2">{label}</div>
      <div className="forge-metric">{value}</div>
      <div className="text-xs mt-1" style={{ color: positive ? "var(--color-forge-success)" : "var(--color-forge-text-muted)" }}>{sub}</div>
    </div>
  );
}
