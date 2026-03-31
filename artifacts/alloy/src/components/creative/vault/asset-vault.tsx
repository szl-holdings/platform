import * as React from "react";
import { Upload, Image as ImageIcon, Video, FileAudio, FileText, Trash2, Film, Layers, Music, Type, FolderOpen, HardDrive, Monitor } from "lucide-react";
import { useAssets, useDeleteAsset } from "@/hooks/use-creative";

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  image: ImageIcon,
  video: Video,
  audio: FileAudio,
  document: FileText,
  font: Type,
  template: Layers,
  raw_footage: Film,
  color_graded: Monitor,
  motion_graphics: Layers,
  audio_stem: Music,
};

const CATEGORY_COLORS: Record<string, string> = {
  "RAW Footage": "border-l-red-500/50",
  "Color-Graded Masters": "border-l-violet-500/50",
  "Audio Stems": "border-l-amber-500/50",
  "Motion Graphics Templates": "border-l-cyan-500/50",
  "CGI & Renders": "border-l-purple-500/50",
  "VFX Composites": "border-l-indigo-500/50",
  "Brand Documents": "border-l-emerald-500/50",
  "Typography": "border-l-pink-500/50",
};

export function AssetVault({ campaignId }: { campaignId: string }) {
  const { data: assets, isLoading } = useAssets(campaignId);
  const deleteAsset = useDeleteAsset();
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);

  if (isLoading) return <div className="animate-pulse h-full bg-white/3 rounded-xl" />;

  const categories = [...new Set(assets?.map(a => a.category) || [])];
  const filteredAssets = activeCategory ? assets?.filter(a => a.category === activeCategory) : assets;
  const totalSizeMB = assets?.reduce((acc, a) => {
    const match = (a.size || "").match(/([\d.]+)\s*(TB|GB|MB|KB)/i);
    if (!match) return acc;
    const val = parseFloat(match[1]);
    if (match[2] === "TB") return acc + val * 1024 * 1024;
    if (match[2] === "GB") return acc + val * 1024;
    if (match[2] === "MB") return acc + val;
    return acc + val / 1024;
  }, 0) || 0;
  const formattedSize = totalSizeMB >= 1024 * 1024
    ? `${(totalSizeMB / (1024 * 1024)).toFixed(1)} TB`
    : totalSizeMB >= 1024
    ? `${(totalSizeMB / 1024).toFixed(1)} GB`
    : `${totalSizeMB.toFixed(0)} MB`;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-cyan-400" /> Production Asset Vault
          </h2>
          <p className="text-sm text-slate-500">
            {assets?.length || 0} assets · {formattedSize} total
          </p>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors">
          <Upload className="w-4 h-4" /> Ingest Assets
        </button>
      </div>

      {categories.length > 0 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 shrink-0">
          <button
            onClick={() => setActiveCategory(null)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${!activeCategory ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20"}`}
          >
            All ({assets?.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : (cat || null))}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${activeCategory === cat ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20"}`}
            >
              {cat} ({assets?.filter(a => a.category === cat).length})
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredAssets?.map(asset => {
          const Icon = TYPE_ICONS[asset.type] || FileText;
          const borderColor = CATEGORY_COLORS[asset.category as keyof typeof CATEGORY_COLORS] || "";
          return (
            <div key={asset.id} className={`group overflow-hidden flex flex-col relative bg-[#0d1117] border border-white/8 hover:border-cyan-400/30 transition-all hover:shadow-xl hover:-translate-y-1 border-l-2 rounded-xl ${borderColor}`}>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button 
                  className="w-7 h-7 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                  onClick={() => deleteAsset.mutate({ id: asset.id, campaignId })}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="aspect-square bg-white/3 border-b border-white/8 flex items-center justify-center p-4 relative overflow-hidden">
                {asset.type === "image" && asset.url ? (
                  <img src={asset.url} alt={asset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Icon className="w-12 h-12 text-slate-600" />
                    {asset.codec && (
                      <span className="text-[9px] font-mono text-slate-600 uppercase">{asset.codec}</span>
                    )}
                  </div>
                )}
                <div className="absolute bottom-1.5 left-1.5 bg-black/90 px-1.5 py-0.5 rounded text-[10px] font-medium border border-white/10 text-slate-400 uppercase tracking-wider">
                  {asset.type.replace(/_/g, " ")}
                </div>
              </div>
              
              <div className="p-3 flex flex-col flex-1">
                <h4 className="text-xs font-semibold text-white truncate mb-0.5" title={asset.name}>
                  {asset.name}
                </h4>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-[10px] text-slate-500">{asset.size}</p>
                  {asset.resolution && (
                    <p className="text-[10px] text-slate-600 flex items-center gap-0.5">
                      <HardDrive className="w-2.5 h-2.5" /> {asset.resolution}
                    </p>
                  )}
                </div>
                
                <div className="mt-auto flex flex-wrap gap-1">
                  {(asset.tags || []).slice(0, 3).map(tag => (
                    <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded border border-white/10 text-slate-500">
                      {tag}
                    </span>
                  ))}
                  {(asset.tags || []).length > 3 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border border-white/10 text-slate-500">+{(asset.tags || []).length - 3}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
