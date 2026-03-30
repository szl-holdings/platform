import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { BarChart3, TrendingDown, Shield, AlertTriangle, CheckCircle, Target } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";

const riskTrend = [
  { month: "Oct", score: 72 }, { month: "Nov", score: 68 }, { month: "Dec", score: 71 },
  { month: "Jan", score: 65 }, { month: "Feb", score: 62 }, { month: "Mar", score: 58 },
];

const vulnTrend = [
  { week: "Wk 1", critical: 18, high: 45, medium: 112 }, { week: "Wk 2", critical: 14, high: 41, medium: 108 },
  { week: "Wk 3", critical: 11, high: 38, medium: 99 }, { week: "Wk 4", critical: 8, high: 33, medium: 91 },
];

const complianceFrameworks = [
  { name: "SOC 2 Type II", score: 94, controls: 84, passing: 79, status: "Compliant" },
  { name: "NIST CSF", score: 87, controls: 108, passing: 94, status: "Compliant" },
  { name: "ISO 27001", score: 78, controls: 114, passing: 89, status: "In Progress" },
  { name: "CIS Controls v8", score: 82, controls: 153, passing: 125, status: "Compliant" },
];

const topVulns = [
  { cve: "CVE-2024-3400", score: 10.0, asset: "Palo Alto FW-EDGE-01", status: "Patch Scheduled", days: 4 },
  { cve: "CVE-2024-21413", score: 9.8, asset: "Exchange SERVER-01", status: "Under Review", days: 7 },
  { cve: "CVE-2023-46747", score: 9.8, asset: "F5 LTM Load Balancer", status: "Mitigated", days: 0 },
  { cve: "CVE-2024-1709", score: 9.8, asset: "ConnectWise ScreenConnect", status: "Patched", days: 0 },
];

export default function ExecutiveRisk() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          Executive Risk Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Vulnerability trending, compliance posture, and board-level security metrics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Security Risk Score", value: "58", sub: "↓ 14 pts from Q4", color: "text-emerald-400" },
          { label: "Critical Vulnerabilities", value: "8", sub: "↓ 10 from last month", color: "text-red-400" },
          { label: "Mean Time to Detect", value: "4.2 min", sub: "Target: 1 min", color: "text-amber-400" },
          { label: "Mean Time to Respond", value: "18 min", sub: "Target: 60 min — ACHIEVED", color: "text-emerald-400" },
        ].map(({ label, value, sub, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Risk Score Trend (6 Months)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={riskTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} domain={[40, 80]} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="score" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Vulnerability Trend (4 Weeks)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={vulnTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="critical" fill="#ef4444" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="high" fill="#f97316" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="medium" fill="#eab308" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Compliance Posture</h3>
          <div className="space-y-3">
            {complianceFrameworks.map((f) => (
              <Card key={f.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">{f.name}</span>
                    <Badge variant="outline" className={`text-[10px] ${f.status === "Compliant" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-amber-400 bg-amber-500/10 border-amber-500/20"}`}>{f.status}</Badge>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{f.passing}/{f.controls} controls passing</span>
                    <span className="font-bold text-foreground">{f.score}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${f.score >= 90 ? "bg-emerald-500" : f.score >= 75 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${f.score}%` }} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Critical CVEs — Open</h3>
          <div className="space-y-3">
            {topVulns.map((v) => (
              <Card key={v.cve}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold">{v.cve}</span>
                        <span className={`text-[10px] font-bold ${v.score >= 9.5 ? "text-red-400" : "text-orange-400"}`}>CVSS {v.score}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{v.asset}</p>
                      <p className="text-[10px] mt-1">
                        <span className={`${v.status === "Patched" || v.status === "Mitigated" ? "text-emerald-400" : v.status === "Patch Scheduled" ? "text-sky-400" : "text-amber-400"}`}>{v.status}</span>
                        {v.days > 0 && <span className="text-muted-foreground ml-1">in {v.days}d</span>}
                      </p>
                    </div>
                    {v.status === "Patched" || v.status === "Mitigated" ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
