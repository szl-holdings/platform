import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Users, DollarSign, FileText, TrendingUp, Download, Mail, Clock, Lock } from "lucide-react";
import { useRole } from "@szl-holdings/shared-ui/use-role";

const lpInvestors = [
  { name: "Sovereign Capital Partners", commitment: "$45M", deployed: "$38M", distributions: "$12.4M", netIRR: 19.2, moic: 1.68, tier: "Anchor LP" },
  { name: "Pacific Pension Trust", commitment: "$30M", deployed: "$26M", distributions: "$7.8M", netIRR: 17.4, moic: 1.52, tier: "Major LP" },
  { name: "Meridian Family Office", commitment: "$15M", deployed: "$15M", distributions: "$4.2M", netIRR: 21.8, moic: 1.93, tier: "Major LP" },
  { name: "Atlas Endowment Fund", commitment: "$25M", deployed: "$19M", distributions: "$5.1M", netIRR: 16.7, moic: 1.44, tier: "Standard LP" },
  { name: "Pinnacle Investment Group", commitment: "$10M", deployed: "$8M", distributions: "$2.3M", netIRR: 18.9, moic: 1.61, tier: "Standard LP" },
];

const recentReports = [
  { name: "Q4 2025 Quarterly Report", type: "Quarterly", date: "Jan 15, 2026", status: "Sent" },
  { name: "Year-End Capital Account Statement", type: "Annual", date: "Feb 1, 2026", status: "Sent" },
  { name: "Q1 2026 Preliminary Update", type: "Quarterly", date: "Apr 15, 2026", status: "Draft" },
  { name: "Property Acquisition — Austin Tower", type: "Transaction", date: "Nov 3, 2025", status: "Sent" },
  { name: "Disposition Notice — SF Warehouse", type: "Transaction", date: "Dec 14, 2025", status: "Sent" },
];

const distributions = [
  { date: "Mar 15, 2026", amount: "$3.2M", type: "Operating", perUnit: "$0.58" },
  { date: "Dec 15, 2025", amount: "$4.1M", type: "Operating + Disposition", perUnit: "$0.74" },
  { date: "Sep 15, 2025", amount: "$2.9M", type: "Operating", perUnit: "$0.52" },
  { date: "Jun 15, 2025", amount: "$3.0M", type: "Operating", perUnit: "$0.54" },
];

type IRTab = "investors" | "reports" | "distributions";

export default function IRModule() {
  const [activeTab, setActiveTab] = useState<IRTab>("investors");
  const { isInvestor, isAdmin, isLoading } = useRole();

  if (!isLoading && !isInvestor && !isAdmin) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Lock className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Investor Access Required</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            The Investor Relations module is restricted to users with the investor role. Contact your administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          Investor Relations & LP Reporting
        </h1>
        <p className="text-sm text-muted-foreground mt-1">LP reporting, distribution waterfall calculations, and investor relationship management</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total LP Capital", value: "$125M", color: "text-sky-400" },
          { label: "Capital Deployed", value: "$106M", color: "text-primary" },
          { label: "Total Distributions", value: "$31.8M", color: "text-emerald-400" },
          { label: "Avg LP Net IRR", value: "18.8%", color: "text-amber-400" },
        ].map(({ label, value, color }) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-2xl font-bold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border">
        {([{ key: "investors", label: "LP Investors" }, { key: "reports", label: "Reports & Letters" }, { key: "distributions", label: "Distribution History" }] as { key: IRTab; label: string }[]).map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)} className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{label}</button>
        ))}
      </div>

      {activeTab === "investors" && (
        <div className="space-y-3">
          {lpInvestors.map((lp) => (
            <Card key={lp.name}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{lp.name}</span>
                      <Badge variant="outline" className="text-[10px]">{lp.tier}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-2 text-xs">
                      <div><p className="text-muted-foreground">Commitment</p><p className="font-semibold">{lp.commitment}</p></div>
                      <div><p className="text-muted-foreground">Deployed</p><p className="font-semibold">{lp.deployed}</p></div>
                      <div><p className="text-muted-foreground">Distributions</p><p className="font-semibold text-emerald-400">{lp.distributions}</p></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-center shrink-0">
                    <div><p className="text-sm font-bold text-emerald-400">{lp.netIRR}%</p><p className="text-[10px] text-muted-foreground">Net IRR</p></div>
                    <div><p className="text-sm font-bold text-sky-400">{lp.moic}x</p><p className="text-[10px] text-muted-foreground">MOIC</p></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "reports" && (
        <div className="space-y-3">
          {recentReports.map((r) => (
            <Card key={r.name} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">{r.name}</p>
                      <div className="flex gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <Badge variant="outline" className="text-[10px]">{r.type}</Badge>
                        <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{r.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] ${r.status === "Sent" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-amber-400 bg-amber-500/10 border-amber-500/20"}`}>{r.status}</Badge>
                    <button className="text-xs text-muted-foreground hover:text-foreground transition-colors"><Download className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "distributions" && (
        <div className="space-y-3">
          {distributions.map((d, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-emerald-400">{d.amount}</p>
                      <Badge variant="outline" className="text-[10px]">{d.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{d.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{d.perUnit}</p>
                    <p className="text-[10px] text-muted-foreground">per unit</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
