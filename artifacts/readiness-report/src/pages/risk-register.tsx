import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { AlertTriangle, Shield, TrendingDown, Target, Clock, CheckCircle } from "lucide-react";

const risks = [
  { id: "RSK-001", title: "Ransomware Attack on Production Systems", category: "Cybersecurity", likelihood: "Medium", impact: "Critical", score: 80, treatment: "Mitigate", owner: "CISO", controls: ["EDR deployed", "Air-gap backups", "IR plan tested"], dueDate: "Ongoing", status: "Active" },
  { id: "RSK-002", title: "Data Breach — Customer PII Exposure", category: "Data Privacy", likelihood: "Low", impact: "Critical", score: 72, treatment: "Mitigate", owner: "DPO", controls: ["Encryption at rest/transit", "Access controls", "DLP monitoring"], dueDate: "Ongoing", status: "Active" },
  { id: "RSK-003", title: "Third-Party Vendor Compromise", category: "Supply Chain", likelihood: "Medium", impact: "High", score: 63, treatment: "Mitigate", owner: "CISO", controls: ["Vendor risk assessments", "Contractual SLAs"], dueDate: "Q2 2026", status: "In Treatment" },
  { id: "RSK-004", title: "Key Person Dependency — Engineering", category: "Operational", likelihood: "High", impact: "Medium", score: 58, treatment: "Accept", owner: "CTO", controls: ["Documentation initiative", "Cross-training program"], dueDate: "Q3 2026", status: "In Treatment" },
  { id: "RSK-005", title: "Regulatory Non-compliance — GDPR", category: "Compliance", likelihood: "Low", impact: "High", score: 45, treatment: "Mitigate", owner: "DPO", controls: ["Privacy program", "Regular audits", "DSAR process"], dueDate: "Ongoing", status: "Active" },
  { id: "RSK-006", title: "Cloud Provider Outage", category: "Infrastructure", likelihood: "Low", impact: "High", score: 40, treatment: "Transfer", owner: "VP Infra", controls: ["Multi-region deployment", "Disaster recovery plan"], dueDate: "Q1 2026", status: "Closed" },
];

const riskMatrix = [
  { row: "Critical", cols: ["Medium", "High", "Critical", "Critical"] },
  { row: "High", cols: ["Low", "Medium", "High", "Critical"] },
  { row: "Medium", cols: ["Low", "Low", "Medium", "High"] },
  { row: "Low", cols: ["Low", "Low", "Low", "Medium"] },
];

const matrixColor: Record<string, string> = {
  Critical: "bg-red-500/40 text-red-300",
  High: "bg-orange-500/30 text-orange-300",
  Medium: "bg-amber-500/20 text-amber-300",
  Low: "bg-emerald-500/10 text-emerald-400",
};

const statusColor: Record<string, string> = {
  Active: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  "In Treatment": "text-sky-400 bg-sky-500/10 border-sky-500/20",
  Closed: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

export default function RiskRegister() {
  const [selected, setSelected] = useState<typeof risks[0] | null>(null);
  const avgScore = Math.round(risks.reduce((a, r) => a + r.score, 0) / risks.length);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-primary" />
          Risk Register
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Quantified risk scoring, impact assessment, treatment plans, and residual risk tracking</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Critical/High Risks", value: risks.filter(r => r.score >= 60).length, color: "text-red-400" },
          { label: "Avg Risk Score", value: avgScore, color: "text-amber-400" },
          { label: "In Treatment", value: risks.filter(r => r.status === "In Treatment").length, color: "text-sky-400" },
          { label: "Risk Owners", value: new Set(risks.map(r => r.owner)).size, color: "text-primary" },
        ].map(({ label, value, color }) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-2xl font-bold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {risks.map((risk) => (
            <Card key={risk.id} onClick={() => setSelected(selected?.id === risk.id ? null : risk)} className={`cursor-pointer transition-all hover:border-primary/30 ${selected?.id === risk.id ? "border-primary" : ""} ${risk.score >= 70 ? "border-red-500/20" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{risk.title}</span>
                      <Badge variant="outline" className="text-[10px]">{risk.category}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${statusColor[risk.status]}`}>{risk.status}</Badge>
                    </div>
                    <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                      <span>Likelihood: <span className="text-foreground">{risk.likelihood}</span></span>
                      <span>Impact: <span className="text-foreground">{risk.impact}</span></span>
                      <span>Treatment: <span className="text-foreground">{risk.treatment}</span></span>
                      <span>Owner: <span className="text-foreground">{risk.owner}</span></span>
                    </div>
                    {selected?.id === risk.id && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-[10px] text-muted-foreground mb-1.5">Existing Controls</p>
                        {risk.controls.map((c, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs py-0.5">
                            <CheckCircle className="w-3 h-3 text-emerald-400" />{c}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-center shrink-0">
                    <p className={`text-2xl font-bold ${risk.score >= 70 ? "text-red-400" : risk.score >= 50 ? "text-amber-400" : "text-emerald-400"}`}>{risk.score}</p>
                    <p className="text-[10px] text-muted-foreground">Risk Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Risk Matrix</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex gap-1 mb-1">
                  <div className="w-16 shrink-0" />
                  {["Rare", "Unlikely", "Likely", "Almost Certain"].map(l => <div key={l} className="flex-1 text-[9px] text-center text-muted-foreground">{l}</div>)}
                </div>
                {riskMatrix.map((row) => (
                  <div key={row.row} className="flex gap-1">
                    <div className="w-16 shrink-0 text-[9px] text-right pr-2 text-muted-foreground flex items-center justify-end">{row.row}</div>
                    {row.cols.map((cell, i) => (
                      <div key={i} className={`flex-1 h-8 rounded flex items-center justify-center text-[9px] font-bold ${matrixColor[cell]}`}>{cell}</div>
                    ))}
                  </div>
                ))}
                <div className="flex gap-1 mt-1">
                  <div className="w-16 shrink-0" />
                  <div className="flex-1 text-[9px] text-center text-muted-foreground">← Likelihood →</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
