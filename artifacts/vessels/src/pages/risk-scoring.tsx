import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Shield, AlertTriangle, Globe, Activity } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";

const vessels = [
  {
    id: "V-001", name: "PACIFIC ENDEAVOR", imo: "9234567", flag: "Marshall Islands",
    riskScore: 91, riskLevel: "Critical",
    factors: { flagState: 85, ownerOpacity: 92, routeAnomaly: 88, aisGaps: 95, portCalls: 78, cargo: 72 },
    anomalies: ["3x AIS blackouts in 30 days", "Route deviation 240nm off standard track", "Sanctioned port call history"],
    ownership: "Shell company chain — 4 layers"
  },
  {
    id: "V-002", name: "NORDIC CARRIER", imo: "9876543", flag: "Norway",
    riskScore: 22, riskLevel: "Low",
    factors: { flagState: 15, ownerOpacity: 18, routeAnomaly: 20, aisGaps: 10, portCalls: 25, cargo: 30 },
    anomalies: ["Minor route variance — weather routing"],
    ownership: "Stena Line AB — Public company"
  },
  {
    id: "V-003", name: "ATLAS FORTUNE", imo: "9456789", flag: "Panama",
    riskScore: 67, riskLevel: "Medium",
    factors: { flagState: 62, ownerOpacity: 75, routeAnomaly: 55, aisGaps: 72, portCalls: 68, cargo: 58 },
    anomalies: ["Ownership chain through 2 jurisdictions", "Irregular port call at Hodeidah"],
    ownership: "Fortune Maritime Ltd. — Confidential"
  },
  {
    id: "V-004", name: "EMERALD COAST", imo: "9123456", flag: "Comoros",
    riskScore: 82, riskLevel: "High",
    factors: { flagState: 90, ownerOpacity: 84, routeAnomaly: 76, aisGaps: 88, portCalls: 82, cargo: 65 },
    anomalies: ["High-risk flag state", "AIS manipulation detected", "Prior STS transfer near sanctioned territory"],
    ownership: "3 shell companies — 2 BVI, 1 Cayman"
  },
];

const riskTrend = [
  { date: "Mar 1", fleet: 42 }, { date: "Mar 7", fleet: 47 }, { date: "Mar 14", fleet: 45 },
  { date: "Mar 21", fleet: 51 }, { date: "Mar 28", fleet: 48 }, { date: "Today", fleet: 53 },
];

const levelColor: Record<string, string> = {
  Critical: "text-red-400 bg-red-500/10 border-red-500/20",
  High: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  Medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  Low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

export default function RiskScoringPage() {
  const [selected, setSelected] = useState(vessels[0]);

  const radarData = Object.entries(selected.factors).map(([key, val]) => ({
    subject: key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()),
    value: val,
    fullMark: 100,
  }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Behavioral Risk Scoring Engine
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Voyage anomaly detection, flag state risk, ownership chain analysis, and behavioral pattern scoring</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Critical Risk Vessels", value: "1", color: "text-red-400" },
          { label: "High Risk Vessels", value: "1", color: "text-orange-400" },
          { label: "Avg Fleet Risk Score", value: "65.5", color: "text-amber-400" },
          { label: "Anomalies Detected (30d)", value: "247", color: "text-sky-400" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Fleet Risk List</h3>
          {vessels.map((v) => (
            <Card
              key={v.id}
              onClick={() => setSelected(v)}
              className={`cursor-pointer transition-all hover:border-primary/30 ${selected.id === v.id ? "border-primary ring-1 ring-primary/20" : ""}`}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{v.name}</p>
                    <p className="text-[10px] text-muted-foreground">{v.flag} · IMO {v.imo}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${levelColor[v.riskLevel].split(" ")[0]}`}>{v.riskScore}</p>
                    <Badge variant="outline" className={`text-[10px] ${levelColor[v.riskLevel]}`}>{v.riskLevel}</Badge>
                  </div>
                </div>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${v.riskScore >= 85 ? "bg-red-500" : v.riskScore >= 65 ? "bg-orange-500" : v.riskScore >= 40 ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${v.riskScore}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{selected.name} — Risk Radar</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Radar dataKey="value" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.25} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Fleet Risk Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={riskTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} domain={[30, 70]} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="fleet" stroke="#f97316" fill="#f97316" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Detected Anomalies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {selected.anomalies.map((a, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/40">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs">{a}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Ownership Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2">
                <Globe className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs">{selected.ownership}</p>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Risk Factor Breakdown</p>
                {Object.entries(selected.factors).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2 mb-1.5">
                    <p className="text-xs w-28 text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}</p>
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${val >= 80 ? "bg-red-500" : val >= 60 ? "bg-orange-500" : val >= 40 ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{ width: `${val}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono w-6 text-right">{val}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
