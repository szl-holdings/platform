import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Briefcase, CheckCircle, Clock, ArrowRight, FileText, Users, DollarSign, Target } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const engagements = [
  { id: "ENG-001", client: "Apex Capital Partners", type: "Growth Strategy", stage: "Delivery", value: "$240K", started: "Jan 15, 2026", due: "Apr 30, 2026", health: "Green", pm: "C. Martinez", team: 4, completion: 68 },
  { id: "ENG-002", client: "NovaTech Industries", type: "Market Entry", stage: "Discovery", value: "$85K", started: "Mar 1, 2026", due: "May 15, 2026", health: "Green", pm: "L. Park", team: 2, completion: 22 },
  { id: "ENG-003", client: "Summit Healthcare", type: "Operational Excellence", stage: "Proposal", value: "$165K", started: "Mar 20, 2026", due: "Jun 30, 2026", health: "Yellow", pm: "C. Martinez", team: 3, completion: 5 },
  { id: "ENG-004", client: "Pacific Ventures", type: "M&A Due Diligence", stage: "SOW Review", value: "$320K", started: "Mar 28, 2026", due: "Jun 15, 2026", health: "Green", pm: "R. Santos", team: 5, completion: 2 },
];

const stages = ["Intake", "Discovery", "Proposal", "SOW Review", "Kickoff", "Delivery", "Review", "Closed"];

const healthColor: Record<string, string> = {
  Green: "text-emerald-400", Yellow: "text-amber-400", Red: "text-red-400",
};

const stageColor: Record<string, string> = {
  Intake: "bg-slate-500/20 text-slate-400",
  Discovery: "bg-sky-500/20 text-sky-400",
  Proposal: "bg-blue-500/20 text-blue-400",
  "SOW Review": "bg-purple-500/20 text-purple-400",
  Kickoff: "bg-amber-500/20 text-amber-400",
  Delivery: "bg-primary/20 text-primary",
  Review: "bg-orange-500/20 text-orange-400",
  Closed: "bg-emerald-500/20 text-emerald-400",
};

const pipeline = [
  { stage: "Discovery", count: 1, value: "$85K" },
  { stage: "Proposal", count: 1, value: "$165K" },
  { stage: "SOW Review", count: 1, value: "$320K" },
  { stage: "Delivery", count: 1, value: "$240K" },
];

export default function EngagementWorkflow() {
  usePageMeta({
    title: "Engagement Workflow | Carlota Jo Consulting – Client Project Management",
    description: "Manage consulting engagements end-to-end with Carlota Jo's workflow platform. Track milestones, deliverables, and client outcomes in real time.",
    canonical: "https://szlholdings.com/carlota-jo/engagements",
  });
  const [selected, setSelected] = useState(engagements[0]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-primary" />
          Engagement Workflow
        </h1>
        <p className="text-sm text-muted-foreground mt-1">End-to-end engagement tracking from intake questionnaire through SOW to delivery and follow-up</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Active Engagements", value: engagements.filter(e => e.stage === "Delivery" || e.stage === "Discovery").length, color: "text-primary" },
          { label: "Pipeline Value", value: `$${(810 / 1000).toFixed(2)}M`, color: "text-emerald-400" },
          { label: "Avg Completion", value: `${Math.round(engagements.reduce((a, e) => a + e.completion, 0) / engagements.length)}%`, color: "text-sky-400" },
          { label: "Engagements This Q", value: "4", color: "text-amber-400" },
        ].map(({ label, value, color }) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-2xl font-bold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Engagement Pipeline</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {stages.map((stage, i) => {
              const eng = engagements.filter(e => e.stage === stage);
              return (
                <div key={stage} className="flex items-center gap-2 shrink-0">
                  <div className="text-center">
                    <div className={`px-3 py-2 rounded-lg ${eng.length > 0 ? stageColor[stage] : "bg-muted text-muted-foreground"} min-w-20`}>
                      <p className="text-[10px] font-semibold">{stage}</p>
                      <p className="text-sm font-bold">{eng.length}</p>
                    </div>
                    {eng.length > 0 && <p className="text-[10px] text-muted-foreground mt-0.5">{eng.map(e => e.value).join(", ")}</p>}
                  </div>
                  {i < stages.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          {engagements.map((eng) => (
            <Card key={eng.id} onClick={() => setSelected(eng)} className={`cursor-pointer transition-all hover:border-primary/30 ${selected.id === eng.id ? "border-primary" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{eng.client}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${stageColor[eng.stage]}`}>{eng.stage}</span>
                      <span className={`text-xs ${healthColor[eng.health]}`}>●</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{eng.type} · PM: {eng.pm}</p>
                    <div className="flex gap-3 text-[10px] text-muted-foreground mt-1.5">
                      <span>Value: <span className="text-emerald-400 font-semibold">{eng.value}</span></span>
                      <span>Due: {eng.due}</span>
                      <span>Team: {eng.team}</span>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] mb-0.5"><span className="text-muted-foreground">Progress</span><span>{eng.completion}%</span></div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${eng.completion}%` }} /></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{selected.client} — Workflow Detail</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><p className="text-muted-foreground">Type</p><p className="font-semibold">{selected.type}</p></div>
              <div><p className="text-muted-foreground">Value</p><p className="font-semibold text-emerald-400">{selected.value}</p></div>
              <div><p className="text-muted-foreground">Started</p><p className="font-semibold">{selected.started}</p></div>
              <div><p className="text-muted-foreground">Due Date</p><p className="font-semibold">{selected.due}</p></div>
              <div><p className="text-muted-foreground">Lead PM</p><p className="font-semibold">{selected.pm}</p></div>
              <div><p className="text-muted-foreground">Team Size</p><p className="font-semibold">{selected.team} consultants</p></div>
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-xs font-semibold mb-2">Stage Checklist — {selected.stage}</p>
              {["Kickoff meeting scheduled", "Discovery interviews complete", "Stakeholder map created", "Initial findings draft"].map((item, i) => (
                <div key={item} className="flex items-center gap-2 py-1">
                  <CheckCircle className={`w-3.5 h-3.5 ${i < 2 ? "text-emerald-400" : "text-muted-foreground"}`} />
                  <span className={`text-xs ${i < 2 ? "" : "text-muted-foreground"}`}>{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
