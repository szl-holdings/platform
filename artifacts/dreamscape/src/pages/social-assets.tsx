import { useState } from "react";
import { Image, Linkedin, Twitter, Youtube, Instagram, Monitor, Filter, Download, Eye, Grid, List } from "lucide-react";
import { cn } from "@/lib/utils";

const bannerAssets = [
  { id: "BNR-001", name: "LinkedIn Company Banner", platform: "linkedin", dimensions: "1128×191", category: "profile", campaign: "Brand", status: "active" },
  { id: "BNR-002", name: "LinkedIn Personal Banner", platform: "linkedin", dimensions: "1584×396", category: "profile", campaign: "Brand", status: "active" },
  { id: "BNR-003", name: "Instagram Profile Grid", platform: "instagram", dimensions: "1080×1080", category: "profile", campaign: "Brand", status: "active" },
  { id: "BNR-004", name: "X/Twitter Header", platform: "x", dimensions: "1500×500", category: "profile", campaign: "Brand", status: "active" },
  { id: "BNR-005", name: "YouTube Channel Art", platform: "youtube", dimensions: "2560×1440", category: "profile", campaign: "Brand", status: "active" },
  { id: "BNR-006", name: "Week 1 Campaign - Launch", platform: "linkedin", dimensions: "1200×627", category: "campaign", campaign: "Week 1", status: "active" },
  { id: "BNR-007", name: "Week 2 Campaign - Products", platform: "linkedin", dimensions: "1200×627", category: "campaign", campaign: "Week 2", status: "active" },
  { id: "BNR-008", name: "Week 3 Campaign - Technical", platform: "x", dimensions: "1600×900", category: "campaign", campaign: "Week 3", status: "active" },
  { id: "BNR-009", name: "Week 4 Campaign - Hiring", platform: "linkedin", dimensions: "1200×627", category: "campaign", campaign: "Week 4", status: "active" },
  { id: "BNR-010", name: "Week 5 Campaign - Stories", platform: "linkedin", dimensions: "1200×627", category: "campaign", campaign: "Week 5", status: "draft" },
  { id: "BNR-011", name: "Week 6 Campaign - Innovation", platform: "x", dimensions: "1600×900", category: "campaign", campaign: "Week 6", status: "draft" },
  { id: "BNR-012", name: "Week 7 Campaign - BTS", platform: "linkedin", dimensions: "1200×627", category: "campaign", campaign: "Week 7", status: "draft" },
];

const platformIcons: Record<string, any> = { linkedin: Linkedin, x: Twitter, youtube: Youtube, instagram: Instagram };
const platformColors: Record<string, string> = {
  linkedin: "text-blue-400 bg-blue-400/10",
  x: "text-foreground bg-foreground/10",
  youtube: "text-red-400 bg-red-400/10",
  instagram: "text-pink-400 bg-pink-400/10",
};

export function SocialAssets() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = bannerAssets.filter(a =>
    (categoryFilter === "all" || a.category === categoryFilter) &&
    (platformFilter === "all" || a.platform === platformFilter)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Image className="w-6 h-6 text-primary" />
            Social Media Assets
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Banner graphics, profile images, and campaign visuals</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setViewMode("grid")} className={cn("p-2 rounded-lg", viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground")}><Grid className="w-4 h-4" /></button>
          <button onClick={() => setViewMode("list")} className={cn("p-2 rounded-lg", viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground")}><List className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {["all", "profile", "campaign"].map(c => (
            <button key={c} onClick={() => setCategoryFilter(c)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
                categoryFilter === c ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"
              )}>{c}</button>
          ))}
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex gap-1">
          {["all", "linkedin", "x", "instagram", "youtube"].map(p => (
            <button key={p} onClick={() => setPlatformFilter(p)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
                platformFilter === p ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"
              )}>{p}</button>
          ))}
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(asset => {
            const Icon = platformIcons[asset.platform] || Monitor;
            return (
              <div key={asset.id} className="bg-card/60 border border-border rounded-xl overflow-hidden hover:border-primary/20 transition-all group">
                <div className="aspect-video bg-gradient-to-br from-primary/20 via-muted/30 to-cyan-500/20 flex items-center justify-center relative">
                  <div className="text-center">
                    <Monitor className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground font-mono">{asset.dimensions}</p>
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"><Eye className="w-4 h-4" /></button>
                    <button className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"><Download className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn("w-5 h-5 rounded flex items-center justify-center", platformColors[asset.platform])}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{asset.id}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{asset.name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">{asset.campaign}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium capitalize",
                      asset.status === "active" ? "bg-emerald-400/10 text-emerald-400" : "bg-amber-400/10 text-amber-400"
                    )}>{asset.status}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(asset => {
            const Icon = platformIcons[asset.platform] || Monitor;
            return (
              <div key={asset.id} className="bg-card/60 border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/20 transition-all">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", platformColors[asset.platform])}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-mono text-muted-foreground w-20">{asset.id}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{asset.name}</p>
                </div>
                <span className="text-xs text-muted-foreground font-mono">{asset.dimensions}</span>
                <span className="text-xs text-muted-foreground">{asset.campaign}</span>
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium capitalize",
                  asset.status === "active" ? "bg-emerald-400/10 text-emerald-400" : "bg-amber-400/10 text-amber-400"
                )}>{asset.status}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
