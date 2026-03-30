import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Users, MessageSquare, CheckCircle, Clock, AlertCircle, Send, Loader2 } from "lucide-react";
import { useCampaigns } from "@/hooks/use-campaigns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Review } from "@/hooks/use-creative";

const statusColor: Record<string, string> = {
  "In Review": "text-amber-400 bg-amber-500/10 border-amber-500/20",
  "Pending Approval": "text-orange-400 bg-orange-500/10 border-orange-500/20",
  "Approved": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  "In Progress": "text-sky-400 bg-sky-500/10 border-sky-500/20",
  "review": "text-amber-400 bg-amber-500/10 border-amber-500/20",
  "concept": "text-blue-400 bg-blue-500/10 border-blue-500/20",
  "pre_production": "text-sky-400 bg-sky-500/10 border-sky-500/20",
  "production": "text-sky-400 bg-sky-500/10 border-sky-500/20",
  "post_production": "text-violet-400 bg-violet-500/10 border-violet-500/20",
  "published": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  "archived": "text-slate-400 bg-slate-500/10 border-slate-500/20",
};

function statusLabel(status: string) {
  const map: Record<string, string> = {
    concept: "Concept",
    pre_production: "Pre-Production",
    production: "In Progress",
    post_production: "Post Production",
    review: "In Review",
    published: "Approved",
    archived: "Archived",
  };
  return map[status] ?? status.replace(/_/g, " ");
}

function useAllReviews(campaignIds: number[]) {
  return useQuery({
    queryKey: ["all-reviews", campaignIds.join(",")],
    queryFn: async () => {
      if (!campaignIds.length) return [] as Review[];
      const results = await Promise.all(
        campaignIds.map(id => api.reviews.listForCampaign(id).catch(() => []))
      );
      return results.flat() as Review[];
    },
    enabled: campaignIds.length > 0,
  });
}

export default function CollaborativeWorkspace() {
  const [newComment, setNewComment] = useState("");
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns();
  const queryClient = useQueryClient();

  const activeCampaignIds = (campaigns || [])
    .filter(c => ["review", "production", "pre_production", "post_production"].includes(c.status))
    .slice(0, 6)
    .map(c => c.id);

  const { data: reviews, isLoading: reviewsLoading } = useAllReviews(activeCampaignIds);

  const createReview = useMutation({
    mutationFn: async ({ campaignId, comment }: { campaignId: number; comment: string }) => {
      return api.reviews.create({
        campaignId,
        reviewerName: "Team Member",
        comment,
        status: "pending",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-reviews"] });
      setNewComment("");
    },
  });

  const activeCampaigns = (campaigns || [])
    .filter(c => ["review", "production", "pre_production", "post_production"].includes(c.status))
    .slice(0, 4);

  const recentReviews = (reviews || []).slice(0, 5);

  const awaiting = (campaigns || []).filter(c => c.status === "review").length;
  const openFeedback = (reviews || []).filter(r => r.status === "pending" || r.status === "changes_requested").length;
  const approved = (reviews || []).filter(r => r.status === "approved").length;

  const handleSubmitComment = () => {
    if (!newComment.trim() || !activeCampaigns[0]) return;
    createReview.mutate({ campaignId: activeCampaigns[0].id, comment: newComment.trim() });
  };

  if (campaignsLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          Collaborative Approval Workspace
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Review workflows, feedback annotations, and multi-stakeholder approvals</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Active Projects", value: String(activeCampaigns.length), color: "text-sky-400" },
          { label: "Awaiting Approval", value: String(awaiting), color: "text-amber-400" },
          { label: "Open Feedback", value: String(openFeedback), color: "text-orange-400" },
          { label: "Approved Reviews", value: String(approved), color: "text-emerald-400" },
        ].map(({ label, value, color }) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-2xl font-bold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Project Status Board</h3>
          {activeCampaigns.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">No active campaigns in review or production.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {activeCampaigns.map((c) => (
                <Card key={c.id} className="hover:border-primary/30 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{c.name}</span>
                          <Badge variant="outline" className={`text-[10px] ${statusColor[c.status] ?? ""}`}>{statusLabel(c.status)}</Badge>
                        </div>
                        <div className="flex gap-3 text-[10px] text-muted-foreground mt-1.5">
                          <span>{c.client ?? c.clientName ?? "—"}</span>
                          {c.deadline && (
                            <span>Due: {new Date(c.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">{c.progress ?? 0}%</p>
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${(c.progress ?? 0) === 100 ? "bg-emerald-500" : (c.progress ?? 0) >= 75 ? "bg-sky-500" : "bg-amber-500"}`}
                            style={{ width: `${c.progress ?? 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Feedback Thread</h3>
          {reviewsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground p-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading feedback...</span>
            </div>
          ) : recentReviews.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">No feedback yet on active campaigns.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {recentReviews.map((f) => {
                const resolved = f.status === "approved";
                return (
                  <Card key={f.id} className={resolved ? "opacity-60" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${resolved ? "bg-emerald-500/10" : "bg-amber-500/10"}`}>
                          {resolved ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <MessageSquare className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold">{f.reviewerName ?? (f as any).reviewer ?? "Reviewer"}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {f.createdAt ? new Date(f.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : (f as any).date ? new Date((f as any).date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                            </span>
                          </div>
                          {(f as any).department && (
                            <p className="text-[10px] text-primary mt-0.5">{(f as any).department}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">{f.comment}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              f.status === "approved" ? "bg-emerald-500/10 text-emerald-400" :
                              f.status === "changes_requested" ? "bg-amber-500/10 text-amber-400" :
                              "bg-blue-500/10 text-blue-400"
                            }`}>{f.status.replace(/_/g, " ")}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmitComment()}
              placeholder="Add feedback or annotation..."
              className="flex-1 px-3 py-2 text-xs bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleSubmitComment}
              disabled={createReview.isPending || !newComment.trim() || activeCampaigns.length === 0}
              className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {createReview.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
