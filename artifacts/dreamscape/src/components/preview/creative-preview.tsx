import * as React from "react";
import { format } from "date-fns";
import { PlayCircle, CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";
import { useStoryboards, useReviews, useUpdateReview } from "@/hooks/use-creative";
import { Card, Button, Badge } from "@/components/ui";

export function CreativePreview({ campaignId }: { campaignId: string }) {
  const { data: storyboards } = useStoryboards(campaignId);
  const { data: reviews } = useReviews(campaignId);
  const updateReview = useUpdateReview();

  return (
    <div className="max-w-5xl mx-auto py-6 grid lg:grid-cols-3 gap-8">
      {/* Left Column: The Review Content */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* Cinematic "Video" Player Placeholder */}
        <div className="rounded-2xl overflow-hidden bg-black border border-border shadow-2xl relative aspect-video group">
          {/* landing page hero scenic mountain landscape */}
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
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
            <div className="w-full flex items-center gap-4 text-white">
              <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-1/3 rounded-full" />
              </div>
              <span className="text-xs font-mono font-medium">00:14 / 00:60</span>
            </div>
          </div>
        </div>

        {/* Storyboard Digest */}
        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            Storyboard Sequence
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {storyboards?.map(scene => (
              <Card key={scene.id} className="overflow-hidden border-border/50">
                <div className="aspect-video bg-muted relative">
                   {scene.thumbnailUrl && <img src={scene.thumbnailUrl} className="w-full h-full object-cover" alt="Scene" />}
                   <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 rounded">
                     {scene.duration}
                   </div>
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

      {/* Right Column: Stakeholder Review Pane */}
      <div className="flex flex-col gap-6">
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
          <h3 className="font-bold text-lg border-b border-border/50 pb-3">Approval Status</h3>
          
          <div className="space-y-4">
            {reviews?.map(review => (
              <div key={review.id} className="bg-background rounded-xl p-4 border border-border">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-sm">{review.reviewer}</div>
                    <div className="text-xs text-muted-foreground">{review.role}</div>
                  </div>
                  <Badge 
                    variant={review.status === "approved" ? "success" : review.status === "changes_requested" ? "warning" : "default"}
                    className="capitalize"
                  >
                    {review.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-foreground italic mt-2">"{review.comment}"</p>
                <div className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {format(new Date(review.date), "MMM d, h:mm a")}
                </div>

                {review.status === "pending" && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
                    <Button size="sm" className="flex-1" onClick={() => updateReview.mutate({ id: review.id, campaignId, status: "approved" })}>
                      <CheckCircle className="w-4 h-4 mr-1.5" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => updateReview.mutate({ id: review.id, campaignId, status: "changes_requested" })}>
                      <XCircle className="w-4 h-4 mr-1.5" /> Changes
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button variant="outline" className="w-full mt-2 border-primary/30 text-primary hover:bg-primary/10">
            <ExternalLink className="w-4 h-4 mr-2" /> Share Preview Link
          </Button>
        </div>
      </div>
    </div>
  );
}
