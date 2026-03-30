import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Users, MessageSquare, CheckCircle, Clock, AlertCircle, Send } from "lucide-react";

const projects = [
  { id: "P-001", name: "Q2 Campaign — Product Launch", status: "In Review", assets: 14, comments: 8, approvers: ["L. Park (Creative Dir)", "M. Chen (Marketing VP)"], deadline: "2026-04-03", deadlineLabel: "Apr 3", progress: 75 },
  { id: "P-002", name: "Brand Refresh — Visual Identity", status: "Pending Approval", assets: 7, comments: 3, approvers: ["C. Martinez (CMO)"], deadline: "2026-04-10", deadlineLabel: "Apr 10", progress: 90 },
  { id: "P-003", name: "Social Media Pack — March 2026", status: "Approved", assets: 32, comments: 12, approvers: ["L. Park", "K. Wilson"], deadline: "2026-03-28", deadlineLabel: "Mar 28", progress: 100 },
  { id: "P-004", name: "Investor Day Video Suite", status: "In Progress", assets: 5, comments: 2, approvers: ["CEO", "CFO", "CMO"], deadline: "2026-04-15", deadlineLabel: "Apr 15", progress: 45 },
];

const feedbackItems = [
  { project: "Q2 Campaign", asset: "Hero Banner v3", user: "L. Park", comment: "The gradient transition on the CTA needs more contrast. Can we try a solid brand blue?", timestamp: "14 min ago", resolved: false },
  { project: "Q2 Campaign", asset: "Social Reel — 30s", user: "M. Chen", comment: "Perfect pacing on the product reveal. Approved for this section.", timestamp: "2h ago", resolved: true },
  { project: "Brand Refresh", asset: "Logo System", user: "C. Martinez", comment: "Reduce the secondary mark by 10% — the spacing feels off at small sizes.", timestamp: "4h ago", resolved: false },
  { project: "Investor Day Video", asset: "Opening Sequence", user: "K. Wilson", comment: "Strong opening. Let's add the SZL Holdings tagline at 0:04.", timestamp: "6h ago", resolved: false },
];

const statusColor: Record<string, string> = {
  "In Review": "text-amber-400 bg-amber-500/10 border-amber-500/20",
  "Pending Approval": "text-orange-400 bg-orange-500/10 border-orange-500/20",
  "Approved": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  "In Progress": "text-sky-400 bg-sky-500/10 border-sky-500/20",
};

export default function CollaborativeWorkspace() {
  const [newComment, setNewComment] = useState("");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          Collaborative Approval Workspace
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Streamlined review workflows, feedback annotations, and multi-stakeholder approval chains</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Active Projects", value: "4", color: "text-sky-400" },
          { label: "Awaiting Approval", value: "2", color: "text-amber-400" },
          { label: "Open Feedback", value: "3", color: "text-orange-400" },
          { label: "Approved This Month", value: "1", color: "text-emerald-400" },
        ].map(({ label, value, color }) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-2xl font-bold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Project Status Board</h3>
          <div className="space-y-3">
            {projects.map((p) => (
              <Card key={p.id} className="hover:border-primary/30 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{p.name}</span>
                        <Badge variant="outline" className={`text-[10px] ${statusColor[p.status]}`}>{p.status}</Badge>
                      </div>
                      <div className="flex gap-3 text-[10px] text-muted-foreground mt-1.5">
                        <span>{p.assets} assets</span>
                        <span>{p.comments} comments</span>
                        <span className={`${new Date(p.deadline) < new Date("2026-04-05") ? "text-amber-400" : ""}`}>Due: {p.deadlineLabel}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.approvers.map(a => <span key={a} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{a}</span>)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">{p.progress}%</p>
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                        <div className={`h-full rounded-full ${p.progress === 100 ? "bg-emerald-500" : p.progress >= 75 ? "bg-sky-500" : "bg-amber-500"}`} style={{ width: `${p.progress}%` }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Feedback Thread</h3>
          <div className="space-y-3">
            {feedbackItems.map((f, i) => (
              <Card key={i} className={f.resolved ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${f.resolved ? "bg-emerald-500/10" : "bg-amber-500/10"}`}>
                      {f.resolved ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <MessageSquare className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{f.user}</span>
                        <span className="text-[10px] text-muted-foreground">{f.timestamp}</span>
                      </div>
                      <p className="text-[10px] text-primary mt-0.5">{f.project} · {f.asset}</p>
                      <p className="text-xs text-muted-foreground mt-1">{f.comment}</p>
                      {!f.resolved && (
                        <button className="text-[10px] text-emerald-400 hover:underline mt-1.5">Mark Resolved</button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add feedback or annotation..." className="flex-1 px-3 py-2 text-xs bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary" />
            <button className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"><Send className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
