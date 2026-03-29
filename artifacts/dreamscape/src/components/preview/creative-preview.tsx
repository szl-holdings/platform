import * as React from "react";
import { format } from "date-fns";
import { PlayCircle, CheckCircle, XCircle, Clock, ExternalLink, Shield, Users, MessageSquare, AlertTriangle } from "lucide-react";
import { useStoryboards, useReviews, useUpdateReview } from "@/hooks/use-creative";
import { Card, Button, Badge } from "@/components/ui";

const DEPARTMENT_COLORS: Record<string, string> = {
  Creative: "border-l-purple-500",
  Client: "border-l-blue-500",
  Legal: "border-l-amber-500",
  Production: "border-l-emerald-500",
  Media: "border-l-cyan-500",
};

const DEPARTMENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Creative: Users,
  Client: MessageSquare,
  Legal: Shield,
  Production: PlayCircle,
  Media: ExternalLink,
};

export function CreativePreview({ campaignId }: { campaignId: string }) {
  const { data: storyboards } = useStoryboards(campaignId);
  const { data: reviews } = useReviews(campaignId);
  const updateReview = useUpdateReview();

  const approvedCount = reviews?.filter(r => r.status === "approved").length || 0;
  const pendingCount = reviews?.filter(r => r.status === "pending").length || 0;
  const changesCount = reviews?.filter(r => r.status === "changes_requested").length || 0;
  const totalReviews = reviews?.length || 0;
  const currentRound = reviews?.reduce((max, r) => Math.max(max, r.round || 1), 1) || 1;

  return (
    <div className="max-w-5xl mx-auto py-6 grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        
        <div className="rounded-2xl overflow-hidden bg-black border border-border shadow-2xl relative aspect-video group">
          <img 
            src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&h=1080&fit=crop" 
            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
            alt="Video Preview Placeholder"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <button className="w-20 h-20 bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-primary/20 backdrop-blur">
              <PlayCircle className="w-10 h-10 ml-1" />
            </button>
          </div>
          <div className="absolute top-4 left-4">
            <Badge variant="outline" className="bg-black/50 backdrop-blur border-white/20 text-white text-xs">
              Review Round {currentRound}
            </Badge>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
            <div className="w-full flex items-center gap-4 text-white">
              <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-1/3 rounded-full" />
              </div>
              <span className="text-xs font-mono font-medium">00:14 / 01:30</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            Storyboard Sequence
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {storyboards?.map(scene => (
              <Card key={scene.id} className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
                <div className="aspect-video bg-muted relative">
                   {scene.thumbnailUrl && <img src={scene.thumbnailUrl} className="w-full h-full object-cover" alt="Scene" />}
                   <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 rounded font-mono">
                     {scene.duration}
                   </div>
                   {scene.shotType && (
                     <div className="absolute top-1 left-1 bg-black/60 text-white/80 text-[9px] px-1.5 rounded font-mono backdrop-blur-sm">
                       {scene.shotType.split(' — ')[0]}
                     </div>
                   )}
                </div>
                <div className="p-3">
                  <div className="text-xs font-bold text-muted-foreground mb-1">SCENE {scene.sceneNumber}</div>
                  <p className="text-sm text-foreground line-clamp-2" title={scene.visual}>{scene.visual}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <h3 className="font-bold text-lg">Approval Status</h3>
            <Badge variant="outline" className="text-xs">Round {currentRound}</Badge>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="text-lg font-bold text-emerald-400">{approvedCount}</div>
              <div className="text-[10px] text-emerald-400/70">Approved</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="text-lg font-bold text-amber-400">{pendingCount}</div>
              <div className="text-[10px] text-amber-400/70">Pending</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="text-lg font-bold text-red-400">{changesCount}</div>
              <div className="text-[10px] text-red-400/70">Changes</div>
            </div>
          </div>

          <div className="h-2 bg-muted rounded-full overflow-hidden flex">
            {totalReviews > 0 && (
              <>
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(approvedCount / totalReviews) * 100}%` }} />
                <div className="h-full bg-amber-500 transition-all" style={{ width: `${(pendingCount / totalReviews) * 100}%` }} />
                <div className="h-full bg-red-500 transition-all" style={{ width: `${(changesCount / totalReviews) * 100}%` }} />
              </>
            )}
          </div>
          
          <div className="space-y-3">
            {reviews?.map(review => {
              const DeptIcon = DEPARTMENT_ICONS[review.department] || Users;
              return (
                <div key={review.id} className={`bg-background rounded-xl p-4 border border-border border-l-2 ${DEPARTMENT_COLORS[review.department] || ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium text-sm">{review.reviewer}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <DeptIcon className="w-3 h-3" />
                        {review.role}
                      </div>
                    </div>
                    <Badge 
                      variant={review.status === "approved" ? "success" : review.status === "changes_requested" ? "warning" : "default"}
                      className="capitalize text-[10px]"
                    >
                      {review.status === "changes_requested" ? (
                        <><AlertTriangle className="w-3 h-3 mr-1" />Changes</>
                      ) : review.status === "approved" ? (
                        <><CheckCircle className="w-3 h-3 mr-1" />Approved</>
                      ) : "Pending"}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground/90 mt-2 leading-relaxed">"{review.comment}"</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {format(new Date(review.date), "MMM d, h:mm a")}
                    </div>
                    <Badge variant="outline" className="text-[9px] h-4">{review.department}</Badge>
                  </div>

                  {review.status === "pending" && (
                    <div className="flex gap-2 mt-4 pt-3 border-t border-border/50">
                      <Button size="sm" className="flex-1" onClick={() => updateReview.mutate({ id: review.id, campaignId, status: "approved" })}>
                        <CheckCircle className="w-4 h-4 mr-1.5" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => updateReview.mutate({ id: review.id, campaignId, status: "changes_requested" })}>
                        <XCircle className="w-4 h-4 mr-1.5" /> Request Changes
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Button variant="outline" className="w-full mt-2 border-primary/30 text-primary hover:bg-primary/10">
            <ExternalLink className="w-4 h-4 mr-2" /> Share Preview Link
          </Button>
        </div>
      </div>
    </div>
  );
}
