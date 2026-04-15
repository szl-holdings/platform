import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Activity, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { apiGet } from "../lib/api";

interface UsageResponse {
  usage: Array<{
    orgId: number;
    featureKey: string;
    product: string;
    periodType: string;
    periodStart: string;
    totalQuantity: string;
    eventCount: number;
  }>;
  totalEvents: number;
  managedOrgCount: number;
}

interface PartnerMe {
  partner: { id: number };
}

export default function UsagePage() {
  const meQuery = useQuery<PartnerMe>({
    queryKey: ["partner-me"],
    queryFn: () => apiGet("/partner/me"),
    retry: false,
  });

  const partnerId = meQuery.data?.partner?.id;

  const { data, isLoading } = useQuery<UsageResponse>({
    queryKey: ["partner-usage", partnerId],
    queryFn: () => apiGet(`/partner/accounts/${partnerId}/usage`),
    enabled: !!partnerId,
  });

  const chartData = (data?.usage ?? []).reduce<Record<string, Record<string, number>>>((acc, row) => {
    const month = new Date(row.periodStart).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    if (!acc[month]) acc[month] = { month: month as unknown as number };
    acc[month][row.featureKey] = (acc[month][row.featureKey] ?? 0) + row.eventCount;
    return acc;
  }, {});

  const chartRows = Object.values(chartData).sort((a, b) =>
    String(a.month).localeCompare(String(b.month))
  );

  const featureKeys = [...new Set(data?.usage.map((r) => r.featureKey) ?? [])].slice(0, 5);
  const colors = ["#6366f1", "#7c3aed", "#06b6d4", "#10b981", "#f59e0b"];

  const totalEvents = data?.totalEvents ?? 0;
  const uniqueFeatures = featureKeys.length;
  const uniqueOrgs = data?.managedOrgCount ?? 0;
  const avgPerOrg = uniqueOrgs > 0 ? Math.round(totalEvents / uniqueOrgs) : 0;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Aggregate Usage</h1>
        <p className="text-slate-400 text-sm mt-0.5">Metered usage across all managed tenants</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Activity, label: "Total Events", value: totalEvents.toLocaleString(), color: "text-indigo-400", bg: "bg-indigo-500/10" },
          { icon: Zap, label: "Unique Features", value: uniqueFeatures, color: "text-violet-400", bg: "bg-violet-500/10" },
          { icon: TrendingUp, label: "Managed Orgs", value: uniqueOrgs, color: "text-cyan-400", bg: "bg-cyan-500/10" },
          { icon: BarChart3, label: "Avg / Org", value: avgPerOrg.toLocaleString(), color: "text-emerald-400", bg: "bg-emerald-500/10" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-5">Monthly Event Volume by Feature</h2>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : chartRows.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <BarChart3 className="w-8 h-8 text-slate-600 mb-3" />
            <p className="text-slate-400 text-sm">No usage data available yet</p>
            <p className="text-slate-500 text-xs mt-1">Events will appear here once tenants start using the platform</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartRows} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                labelStyle={{ color: "#f8fafc" }}
                itemStyle={{ color: "#94a3b8" }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
              {featureKeys.map((key, i) => (
                <Bar key={key} dataKey={key} fill={colors[i % colors.length]} radius={[2, 2, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {data && data.usage.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl mt-6 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700">
            <h2 className="text-sm font-semibold text-white">Raw Usage Records</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Org</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Feature</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Product</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Period</th>
                  <th className="text-right px-5 py-3 text-slate-400 font-medium">Events</th>
                  <th className="text-right px-5 py-3 text-slate-400 font-medium">Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {data.usage.slice(0, 20).map((row, i) => (
                  <tr key={i} className="hover:bg-slate-700/30">
                    <td className="px-5 py-2.5 text-slate-300">#{row.orgId}</td>
                    <td className="px-5 py-2.5 text-white font-medium font-mono">{row.featureKey}</td>
                    <td className="px-5 py-2.5 text-slate-400 capitalize">{row.product}</td>
                    <td className="px-5 py-2.5 text-slate-400">{new Date(row.periodStart).toLocaleDateString()}</td>
                    <td className="px-5 py-2.5 text-right text-white">{row.eventCount}</td>
                    <td className="px-5 py-2.5 text-right text-slate-300">{Number(row.totalQuantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
