import * as React from "react";
import { Plus, Image as ImageIcon, GripVertical, Clock, Camera, Sun, Users, Clapperboard } from "lucide-react";
import { useStoryboards, useCreateStoryboard } from "@/alloy/hooks/use-creative";
import { motion } from "framer-motion";

export function StoryboardBoard({ campaignId }: { campaignId: string }) {
  const { data: scenes, isLoading } = useStoryboards(campaignId);
  const createScene = useCreateStoryboard();

  const handleAddScene = () => {
    const nextNum = (scenes?.length || 0) + 1;
    createScene.mutate({ campaignId: parseInt(campaignId, 10), sceneNumber: nextNum, visual: "New scene description...", duration: "3s" });
  };

  if (isLoading) return (
    <div className="animate-pulse flex gap-6 overflow-hidden">
      {[1,2,3].map(i => <div key={i} className="w-80 h-96 bg-white/5 border border-white/8 rounded-xl shrink-0" />)}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h2 className="font-semibold text-lg flex items-center gap-2 text-white">
            <Clapperboard className="w-5 h-5 text-blue-400" /> Scene Layout
          </h2>
          <p className="text-xs text-slate-500 mt-1">{scenes?.length || 0} scenes · {scenes?.reduce((acc, s) => acc + parseInt(s.duration || "0"), 0) || 0}s total runtime</p>
        </div>
        <button
          onClick={handleAddScene}
          disabled={createScene.isPending}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 disabled:opacity-40 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Scene
        </button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-6 -mx-2 px-2 flex gap-6">
        {scenes?.map((scene) => (
          <motion.div 
            key={scene.id} 
            layoutId={String(scene.id)}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-[340px] shrink-0 h-full max-h-[700px] flex flex-col group cursor-grab active:cursor-grabbing"
          >
            <div className="flex-1 flex flex-col bg-[#0d1117] border border-white/8 hover:border-blue-400/30 transition-colors overflow-hidden relative rounded-xl">
              <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-black/80 rounded text-slate-500">
                <GripVertical className="w-4 h-4" />
              </div>

              <div className="h-48 bg-white/3 border-b border-white/8 relative shrink-0">
                {scene.thumbnailUrl ? (
                  <img src={scene.thumbnailUrl} alt={`Scene ${scene.sceneNumber}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-xs font-medium">No Thumbnail</span>
                  </div>
                )}
                <div className="absolute bottom-2 right-2 bg-black/90 px-2 py-1 rounded text-xs font-bold font-mono text-slate-300 border border-white/10 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-blue-400" /> {scene.duration}
                </div>
                <div className="absolute top-2 right-2 bg-blue-500 text-white w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold">
                  {scene.sceneNumber}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col gap-3 overflow-y-auto">
                {scene.shotType && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-1 rounded border border-blue-500/20 bg-blue-500/5 text-blue-400 font-mono flex items-center gap-1">
                      <Camera className="w-3 h-3" /> {scene.shotType}
                    </span>
                  </div>
                )}

                {scene.cameraMovement && (
                  <div className="text-[11px] text-slate-500 bg-white/3 px-2.5 py-1.5 rounded-lg border border-white/8 font-mono">
                    {scene.cameraMovement}
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Visual Description</h4>
                  <p className="text-sm text-slate-200 leading-relaxed">{scene.visual}</p>
                </div>

                {scene.dialogue && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Audio / Dialogue</h4>
                    <div className="bg-white/3 p-3 rounded-lg border border-white/8 text-sm italic border-l-2 border-l-cyan-400 text-slate-300">
                      {scene.dialogue}
                    </div>
                  </div>
                )}

                {scene.lighting && (
                  <div className="flex items-start gap-2 text-xs text-slate-500">
                    <Sun className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400" />
                    <span>{scene.lighting}</span>
                  </div>
                )}

                {scene.talentNotes && (
                  <div className="flex items-start gap-2 text-xs text-slate-500 mt-auto">
                    <Users className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-400" />
                    <span>{scene.talentNotes}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        <button 
          onClick={handleAddScene}
          className="w-[340px] shrink-0 h-[700px] border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-slate-600 hover:text-blue-400 hover:border-blue-400/30 hover:bg-blue-400/3 transition-all"
        >
          <Plus className="w-8 h-8 mb-2" />
          <span className="font-medium text-sm">Add New Scene</span>
        </button>
      </div>
    </div>
  );
}
