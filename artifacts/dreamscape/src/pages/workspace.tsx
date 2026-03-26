import * as React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Plus, MoreHorizontal, LayoutGrid, Clock, Target, Sparkles, Film, Palette, Megaphone, Layers } from "lucide-react";
import { useCampaigns, useCreateCampaign } from "@/hooks/use-campaigns";
import { Button, Card, Badge, Input } from "@/components/ui";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

const categoryGradients: Record<string, string> = {
  brand_campaign: "linear-gradient(135deg, rgba(124,58,237,0.4), rgba(168,85,247,0.2), rgba(192,38,211,0.3))",
  brand_story: "linear-gradient(135deg, rgba(124,58,237,0.4), rgba(168,85,247,0.2), rgba(192,38,211,0.3))",
  product_launch: "linear-gradient(135deg, rgba(37,99,235,0.4), rgba(6,182,212,0.2), rgba(20,184,166,0.3))",
  social_media: "linear-gradient(135deg, rgba(219,39,119,0.4), rgba(244,63,94,0.2), rgba(249,115,22,0.3))",
  commercial: "linear-gradient(135deg, rgba(217,119,6,0.4), rgba(234,179,8,0.2), rgba(249,115,22,0.3))",
  video_production: "linear-gradient(135deg, rgba(37,99,235,0.4), rgba(99,102,241,0.2), rgba(168,85,247,0.3))",
  event_marketing: "linear-gradient(135deg, rgba(5,150,105,0.4), rgba(34,197,94,0.2), rgba(20,184,166,0.3))",
  default: "linear-gradient(135deg, rgba(217,119,6,0.3), rgba(217,119,6,0.15), rgba(245,158,11,0.25))",
};

const categoryIcons: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  brand_campaign: Megaphone,
  brand_story: Megaphone,
  product_launch: Sparkles,
  social_media: Layers,
  commercial: Film,
  video_production: Film,
  event_marketing: Palette,
};

function CampaignThumbnail({ category, name }: { category: string; name: string }) {
  const gradient = categoryGradients[category] || categoryGradients.default;
  const Icon = categoryIcons[category] || Sparkles;

  return (
    <div
      className="w-full h-36 rounded-t-xl flex items-center justify-center relative overflow-hidden"
      style={{ background: gradient }}
    >
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle at 30% -20%, rgba(255,255,255,0.15), transparent 50%)" }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle at 80% 80%, rgba(0,0,0,0.2), transparent 50%)" }}
      />
      <div className="absolute top-3 left-3 flex gap-1">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.3)" }} />
        ))}
      </div>
      <Icon className="w-10 h-10" style={{ color: "rgba(255,255,255,0.6)" }} />
      <div
        className="absolute bottom-0 left-0 right-0 h-12"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.3), transparent)" }}
      />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1,2,3].map(i => (
        <Card key={i} className="overflow-hidden border-border/50 bg-card">
          <div className="h-36 bg-muted/30 animate-pulse" />
          <div className="p-6 space-y-3">
            <div className="flex gap-2">
              <div className="w-20 h-5 bg-muted/30 animate-pulse rounded-full" />
              <div className="w-16 h-5 bg-muted/30 animate-pulse rounded-full" />
            </div>
            <div className="w-3/4 h-6 bg-muted/30 animate-pulse rounded" />
            <div className="w-1/2 h-4 bg-muted/20 animate-pulse rounded" />
            <div className="pt-4 space-y-2">
              <div className="w-full h-1.5 bg-muted/20 animate-pulse rounded-full" />
              <div className="w-1/3 h-3 bg-muted/20 animate-pulse rounded" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function Workspace() {
  const { data: campaigns, isLoading } = useCampaigns();
  const createCampaign = useCreateCampaign();
  const [isCreating, setIsCreating] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createCampaign.mutate({ name: newTitle }, {
      onSuccess: () => {
        setNewTitle("");
        setIsCreating(false);
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-display font-bold text-foreground">Campaign Workspace</h1>
          <p className="text-muted-foreground mt-1">Manage active creative projects and timelines.</p>
        </motion.div>
        
        {isCreating ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
            <Input 
              autoFocus
              placeholder="Campaign name..." 
              value={newTitle} 
              onChange={e => setNewTitle(e.target.value)} 
              onKeyDown={e => e.key === "Enter" && handleCreate()}
            />
            <Button onClick={handleCreate} disabled={createCampaign.isPending}>Save</Button>
            <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" /> New Campaign
            </Button>
          </motion.div>
        )}
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {campaigns?.map(campaign => (
            <motion.div key={campaign.id} variants={item}>
              <Link href={`/campaigns/${campaign.id}`} className="block group">
                <Card className="overflow-hidden border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 relative bg-card">
                  <CampaignThumbnail category={campaign.category} name={campaign.name} />

                  <div className="p-5">
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button className="text-white/70 hover:text-white p-1.5 rounded-lg bg-black/30 backdrop-blur-sm hover:bg-black/50" onClick={e => e.preventDefault()}>
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="bg-background/50 text-xs">{campaign.category.replace('_', ' ')}</Badge>
                      <Badge 
                        variant="outline"
                        className={`text-xs ${campaign.status === "review" ? "border-amber-500/50 text-amber-400" : campaign.status === "published" ? "border-emerald-500/50 text-emerald-400" : ""}`}
                      >
                        {campaign.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors leading-tight">{campaign.name}</h3>
                    <p className="text-sm text-muted-foreground mb-5 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" /> Client: {campaign.client}
                    </p>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold text-foreground">{campaign.progress}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${campaign.progress}%` }}
                            transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
                            className={`h-full rounded-full ${campaign.progress >= 80 ? 'bg-success' : campaign.progress >= 50 ? 'bg-primary' : 'bg-warning'}`}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Due {format(new Date(campaign.deadline), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      {!isLoading && campaigns?.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-amber-500/20 mx-auto mb-4 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary/60" />
          </div>
          <h3 className="text-xl font-display font-bold text-foreground mb-2">No campaigns yet</h3>
          <p className="text-muted-foreground mb-6">Create your first campaign to get started.</p>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create Campaign
          </Button>
        </motion.div>
      )}
    </div>
  );
}
