import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Target, DollarSign, FileText, Calendar, TrendingUp, Search, Building2, CheckCircle } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const deals = [
  { id: "MA-001", target: "NovaSec Intelligence", sector: "Cybersecurity AI", stage: "LOI Signed", valuation: "$28M", multiple: "8.2x ARR", arr: "$3.4M", strategic: "Enhances Firestorm threat intel capabilities", status: "Active", dd: 65, lead: "K. Wilson" },
  { id: "MA-002", target: "MarineData Co.", sector: "Maritime Analytics", stage: "Due Diligence", valuation: "$14M", multiple: "6.5x ARR", arr: "$2.1M", strategic: "Strengthens Vessels AIS data coverage in APAC", status: "Active", dd: 40, lead: "S. Martinez" },
  { id: "MA-003", target: "PropAnalytics Ltd.", sector: "Real Estate AI", stage: "Closed", valuation: "$7.2M", multiple: "5.1x ARR", arr: "$1.4M", strategic: "Integrated into Terra analytics module — Q4 2025", status: "Closed", dd: 100, lead: "L. Park" },
  { id: "MA-004", target: "CloudMetrics Inc.", sector: "DevOps SaaS", stage: "Initial Outreach", valuation: "$42M", multiple: "9.4x ARR", arr: "$4.5M", strategic: "Potential Lyte AIOps feature expansion", status: "Early", dd: 0, lead: "K. Wilson" },
];

const ddChecklistItems = [
  { item: "Financial statements (3Y audited)", done: true },
  { item: "Revenue & churn cohort analysis", done: true },
  { item: "Customer interviews (10 min)", done: true },
  { item: "IP & patent review", done: false },
  { item: "Employee contract review", done: false },
  { item: "Technical architecture assessment", done: false },
  { item: "Customer concentration analysis", done: true },
];

const stageColor: Record<string, string> = {
  "Initial Outreach": "text-slate-400 bg-slate-500/10 border-slate-500/20",
  "LOI Signed": "text-blue-400 bg-blue-500/10 border-blue-500/20",
  "Due Diligence": "text-amber-400 bg-amber-500/10 border-amber-500/20",
  "Closed": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

export default function MATracker() {
  usePageMeta({
    title: "M&A Tracker | SZL Holdings – Mergers & Acquisitions Pipeline",
    description: "SZL Holdings mergers and acquisitions pipeline tracker. Monitor deal stages, valuations, due diligence progress, and strategic rationale for acquisition targets.",
    canonical: "https://szlholdings.com/ma-tracker",
  });
  const [selected, setSelected] = useState(deals[0]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Target className="w-6 h-6 text-primary" />
          M&A Deal Tracker
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Strategic acquisition pipeline management, due diligence tracking, and deal analytics</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Active Deals", value: deals.filter(d => d.status === "Active").length, color: "text-sky-400" },
          { label: "Pipeline Value", value: "$84M", color: "text-primary" },
          { label: "Closed This Year", value: "1", color: "text-emerald-400" },
          { label: "Avg Multiple", value: "7.3x ARR", color: "text-amber-400" },
        ].map(({ label, value, color }) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-2xl font-bold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {deals.map((deal) => (
            <Card key={deal.id} onClick={() => setSelected(deal)} className={`cursor-pointer transition-all hover:border-primary/30 ${selected.id === deal.id ? "border-primary" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{deal.target}</span>
                      <Badge variant="outline" className="text-[10px]">{deal.sector}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${stageColor[deal.stage]}`}>{deal.stage}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{deal.strategic}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Valuation: <span className="text-foreground font-semibold">{deal.valuation}</span></span>
                      <span>ARR: <span className="text-emerald-400">{deal.arr}</span></span>
                      <span>Multiple: <span className="text-foreground">{deal.multiple}</span></span>
                      <span>Lead: {deal.lead}</span>
                    </div>
                    {deal.dd > 0 && (
                      <div className="mt-2">
                        <div className="flex justify-between text-[10px] mb-0.5"><span className="text-muted-foreground">DD Progress</span><span>{deal.dd}%</span></div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className={`h-full rounded-full ${deal.dd >= 100 ? "bg-emerald-500" : "bg-primary"}`} style={{ width: `${deal.dd}%` }} /></div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{selected.target} — DD Checklist</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {ddChecklistItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle className={`w-3.5 h-3.5 shrink-0 ${item.done ? "text-emerald-400" : "text-muted-foreground"}`} />
                  <span className={`text-xs ${item.done ? "" : "text-muted-foreground"}`}>{item.item}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-border text-xs text-muted-foreground">
                {ddChecklistItems.filter(i => i.done).length}/{ddChecklistItems.length} items complete
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
