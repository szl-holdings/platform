import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { TrendingUp, Users, Globe, Clock, BarChart3, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const trafficData = [
  { month: "Oct", visits: 2400, uniqueUsers: 1800 },
  { month: "Nov", visits: 3100, uniqueUsers: 2300 },
  { month: "Dec", visits: 2800, uniqueUsers: 2100 },
  { month: "Jan", visits: 4200, uniqueUsers: 3100 },
  { month: "Feb", visits: 5800, uniqueUsers: 4200 },
  { month: "Mar", visits: 7400, uniqueUsers: 5300 },
];

const appUsage = [
  { name: "Firestorm", sessions: 1840, avgDuration: "8m 42s", bounce: "18%" },
  { name: "Lyte", sessions: 2120, avgDuration: "11m 15s", bounce: "12%" },
  { name: "INCA", sessions: 980, avgDuration: "14m 33s", bounce: "9%" },
  { name: "Terra", sessions: 1340, avgDuration: "7m 22s", bounce: "22%" },
  { name: "Vessels", sessions: 760, avgDuration: "9m 18s", bounce: "16%" },
  { name: "Dreamscape", sessions: 1100, avgDuration: "6m 44s", bounce: "28%" },
  { name: "MSP", sessions: 890, avgDuration: "12m 07s", bounce: "11%" },
];

const usageChart = appUsage.map(a => ({ name: a.name, sessions: a.sessions }));

const deviceData = [
  { device: "Desktop", share: 68 }, { device: "Mobile", share: 24 }, { device: "Tablet", share: 8 },
];

export default function Metrics() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Platform Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Aggregated usage metrics across all SZL ecosystem applications.</p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Monthly Visitors", value: "7,400", sub: "+27% MoM", icon: Users, color: "text-foreground" },
            { label: "Total Sessions", value: "11,030", sub: "Across 7 apps", icon: Globe, color: "text-emerald-400" },
            { label: "Avg Session Duration", value: "9m 54s", sub: "+18% vs last month", icon: Clock, color: "text-primary" },
            { label: "Avg Bounce Rate", value: "16.6%", sub: "Below 20% target", icon: Activity, color: "text-emerald-400" },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Platform Traffic Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trafficData}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="visits" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} name="Total Visits" />
                <Area type="monotone" dataKey="uniqueUsers" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 2" name="Unique Users" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Sessions by Application</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={usageChart} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }} axisLine={false} tickLine={false} width={70} />
                    <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
                    <Bar dataKey="sessions" fill="#6366f1" fillOpacity={0.7} radius={[0, 4, 4, 0]} name="Sessions" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Device Split</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {deviceData.map(d => (
                  <div key={d.device}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{d.device}</span>
                      <span className="font-medium">{d.share}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${d.share}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Top App by Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {appUsage.sort((a, b) => parseFloat(b.avgDuration) - parseFloat(a.avgDuration)).slice(0, 3).map((app, i) => (
                    <div key={app.name} className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-4">#{i + 1}</span>
                      <span className="text-xs font-medium flex-1">{app.name}</span>
                      <span className="text-xs text-muted-foreground">{app.avgDuration}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">App-Level Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left pb-2 font-medium">Application</th>
                    <th className="text-right pb-2 font-medium">Sessions</th>
                    <th className="text-right pb-2 font-medium">Avg Duration</th>
                    <th className="text-right pb-2 font-medium">Bounce Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {appUsage.map(app => (
                    <tr key={app.name} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2 font-medium text-foreground">{app.name}</td>
                      <td className="py-2 text-right text-muted-foreground">{app.sessions.toLocaleString()}</td>
                      <td className="py-2 text-right text-muted-foreground">{app.avgDuration}</td>
                      <td className="py-2 text-right">
                        <span className={parseInt(app.bounce) < 15 ? "text-emerald-400" : parseInt(app.bounce) < 25 ? "text-amber-400" : "text-red-400"}>
                          {app.bounce}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
