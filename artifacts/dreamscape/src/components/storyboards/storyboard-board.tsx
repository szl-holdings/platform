import * as React from "react";
import { Plus, Image as ImageIcon, GripVertical, Clock } from "lucide-react";
import { useStoryboards, useCreateStoryboard } from "@/hooks/use-creative";
import { Button, Card } from "@/components/ui";
import { motion } from "framer-motion";

export function StoryboardBoard({ campaignId }: { campaignId: string }) {
  const { data: scenes, isLoading } = useStoryboards(campaignId);
  const createScene = useCreateStoryboard();

  const handleAddScene = () => {
    const nextNum = (scenes?.length || 0) + 1;
    createScene.mutate({ campaignId, sceneNumber: nextNum, visual: "New scene description...", duration: "3s" });
  };

  if (isLoading) return <div className="animate-pulse flex gap-6 overflow-hidden">
    {[1,2,3].map(i => <div key={i} className="w-80 h-96 bg-card border border-border rounded-xl shrink-0" />)}
  </div>;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h2 className="font-semibold text-lg">Scene Layout</h2>
        <Button onClick={handleAddScene} disabled={createScene.isPending}>
          <Plus className="w-4 h-4 mr-2" /> Add Scene
        </Button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-6 -mx-2 px-2 flex gap-6">
        {scenes?.map((scene) => (
          <motion.div 
            key={scene.id} 
            layoutId={scene.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-80 shrink-0 h-full max-h-[600px] flex flex-col group cursor-grab active:cursor-grabbing"
          >
            <Card className="flex-1 flex flex-col bg-card border-border shadow-md hover:border-primary/50 transition-colors overflow-hidden relative">
              
              <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-background/80 rounded backdrop-blur text-muted-foreground">
                <GripVertical className="w-4 h-4" />
              </div>

              {/* Thumbnail Area */}
              <div className="h-48 bg-muted border-b border-border relative shrink-0">
                {scene.thumbnailUrl ? (
                  <img src={scene.thumbnailUrl} alt={`Scene ${scene.sceneNumber}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-xs font-medium">No Thumbnail</span>
                  </div>
                )}
                <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur px-2 py-1 rounded text-xs font-bold font-mono text-foreground border border-border/50 flex items-center gap-1.5 shadow-sm">
                  <Clock className="w-3 h-3 text-primary" /> {scene.duration}
                </div>
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground w-6 h-6 rounded flex items-center justify-center text-xs font-bold shadow-md">
                  {scene.sceneNumber}
                </div>
              </div>

              {/* Content Area */}
              <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Visual</h4>
                  <p className="text-sm text-foreground leading-relaxed">{scene.visual}</p>
                </div>
                {scene.dialogue && (
                  <div className="mt-auto">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Audio / Dialogue</h4>
                    <div className="bg-muted/30 p-3 rounded-lg border border-border/50 text-sm italic border-l-2 border-l-primary">
                      {scene.dialogue}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        ))}

        <button 
          onClick={handleAddScene}
          className="w-80 shrink-0 h-[600px] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          <Plus className="w-8 h-8 mb-2" />
          <span className="font-medium">Add New Scene</span>
        </button>
      </div>
    </div>
  );
}
