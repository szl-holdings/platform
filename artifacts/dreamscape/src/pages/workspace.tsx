import * as React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Plus, MoreHorizontal, Clock, Target, Sparkles, Film, Palette, Megaphone, Layers, TrendingUp, DollarSign, Users, Calendar, Image, FolderOpen, Eye, Loader2 } from "lucide-react";
import { ActivityFeed } from "@workspace/shared-ui/collaboration";
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

const categoryLabels: Record<string, string> = {
  brand_campaign: "Brand Film",
  brand_story: "Brand Story",
  product_launch: "Product Launch",
  social_media: "Social Campaign",
  commercial: "Performance Ads",
  video_production: "Documentary",
  event_marketing: "Experiential",
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

const assetLibrary = [
  { name: "Brand Guidelines Pack", category: "Brand", count: 24, color: "from-violet-500 to-purple-500" },
  { name: "Stock Photography", category: "Photos", count: 1240, color: "from-blue-500 to-cyan-500" },
  { name: "Motion Templates", category: "Video", count: 86, color: "from-amber-500 to-orange-500" },
  { name: "Audio Library", category: "Audio", count: 312, color: "from-emerald-500 to-green-500" },
  { name: "Social Templates", category: "Design", count: 156, color: "from-pink-500 to-rose-500" },
  { name: "Font Collections", category: "Typography", count: 48, color: "from-indigo-500 to-blue-500" },
];

function CampaignThumbnail({ category }: { category: string }) {
  const gradient = categoryGradients[category] || categoryGradients.default;
  const Icon = categoryIcons[category] || Sparkles;

  return (
    <div
      className="w-full h-36 rounded-t-xl flex items-center justify-center relative overflow-hidden"
      style={{ background: gradient }}
    >
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 30% -20%, rgba(255,255,255,0.15), transparent 50%)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 80% 80%, rgba(0,0,0,0.2), transparent 50%)" }} />
      <div className="absolute top-3 left-3">
        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-black/30 backdrop-blur-sm text-white/80">
          {categoryLabels[category] || category.replace('_', ' ')}
        </span>
      </div>
      <Icon className="w-10 h-10" style={{ color: "rgba(255,255,255,0.5)" }} />
      <div className="absolute bottom-0 left-0 right-0 h-16" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent)" }} />
    </div>
  );
}

function CalendarEventBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    review: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    publish: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    meeting: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    production: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    delivery: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    deadline: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${styles[type] || styles.meeting}`}>{type}</span>;
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

  const activeCampaigns = (campaigns || []).filter(c => c.status !== "archived" && c.status !== "published");
  const totalBudget = (campaigns || []).reduce((sum, c) => {
    const b = parseFloat((c.budget || "0").replace(/[^0-9.]/g, ""));
    return sum + (isNaN(b) ? 0 : b);
  }, 0);
  const budgetStr = totalBudget >= 1000000
    ? `$${(totalBudget / 1000000).toFixed(1)}M`
    : totalBudget >= 1000
    ? `$${(totalBudget / 1000).toFixed(0)}K`
    : `$${totalBudget}`;

  const quickStats = [
    { label: "Active Campaigns", value: String(activeCampaigns.length || 0), trend: `${(campaigns || []).filter(c => c.status === "review").length} in review`, icon: Film },
    { label: "Total Campaigns", value: String((campaigns || []).length), trend: `${(campaigns || []).filter(c => c.status === "published").length} published`, icon: Users },
    { label: "In Production", value: String((campaigns || []).filter(c => ["production", "post_production", "pre_production"].includes(c.status)).length), trend: "active shoots & edits", icon: Eye },
    { label: "Campaign Budget", value: budgetStr || "—", trend: "total portfolio value", icon: DollarSign },
  ];

  const calendarEvents = React.useMemo(() => {
    return (campaigns || [])
      .filter(c => c.deadline && c.status !== "archived")
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
      .slice(0, 7)
      .map(c => ({
        date: new Date(c.deadline!),
        title: `${c.name} — Deadline`,
        type: c.status === "review" ? "review" : c.status === "published" ? "publish" : c.status === "production" ? "production" : "deadline",
        campaign: c.client ?? c.clientName ?? c.name,
      }));
  }, [campaigns]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-display font-bold text-foreground">Campaign Workspace</h1>
          <p className="text-muted-foreground mt-1">Brand films, social campaigns, product launches, and event content — in one command view.</p>
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
            <Button onClick={() => setIsCreating(true)} className="bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90 text-white shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" /> New Campaign
            </Button>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-4 border-border/50 bg-card/80 hover:border-primary/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-amber-500/10 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  {isLoading ? (
                    <div className="w-12 h-6 bg-muted/30 animate-pulse rounded" />
                  ) : (
                    <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground">{stat.trend}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <span className="ml-3 text-muted-foreground text-sm">Loading campaigns...</span>
        </div>
      )}

      {!isLoading && (!campaigns || campaigns.length === 0) && (
        <div className="text-center py-12">
          <Film className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No campaigns yet. Create your first campaign to get started.</p>
        </div>
      )}

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {campaigns?.map(campaign => (
          <motion.div key={campaign.id} variants={item}>
            <Link href={`/campaigns/${campaign.id}`} className="block group">
              <Card className="overflow-hidden border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 relative bg-card">
                <CampaignThumbnail category={campaign.category} />

                <div className="p-4">
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button className="text-white/70 hover:text-white p-1.5 rounded-lg bg-black/30 backdrop-blur-sm hover:bg-black/50" onClick={e => e.preventDefault()}>
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      variant="outline"
                      className={`text-xs capitalize ${campaign.status === "review" ? "border-amber-500/50 text-amber-400" : campaign.status === "published" ? "border-emerald-500/50 text-emerald-400" : campaign.status === "post_production" ? "border-violet-500/50 text-violet-400" : campaign.status === "concept" ? "border-blue-500/50 text-blue-400" : ""}`}
                    >
                      {campaign.status.replace(/_/g, ' ')}
                    </Badge>
                    {campaign.budget && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        <DollarSign className="w-3 h-3 mr-0.5" />{campaign.budget.replace('$', '')}
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="text-sm font-bold text-foreground mb-1 group-hover:text-primary transition-colors leading-tight line-clamp-1">{campaign.name}</h3>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Target className="w-3 h-3 shrink-0" /> {campaign.client}
                  </p>
                  
                  {campaign.kpis && campaign.kpis.length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5 my-2">
                      {campaign.kpis.slice(0, 2).map((kpi, i) => (
                        <div key={i} className="bg-muted/30 rounded-lg px-2 py-1 border border-border/30">
                          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{kpi.label}</div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-foreground">{kpi.value}</span>
                            <span className="text-[9px] text-emerald-400 flex items-center">
                              <TrendingUp className="w-2 h-2" /> {kpi.trend}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold text-foreground">{campaign.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${campaign.progress ?? 0}%` }}
                        transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${(campaign.progress ?? 0) >= 80 ? 'bg-emerald-500' : (campaign.progress ?? 0) >= 50 ? 'bg-primary' : (campaign.progress ?? 0) >= 25 ? 'bg-amber-500' : 'bg-blue-500'}`}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1.5">
                      <Clock className="w-3 h-3" />
                      <span>Due {format(new Date(campaign.deadline || new Date()), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <Card className="p-5 border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" /> Content Calendar
              </h3>
              <Link href="/content-calendar">
                <span className="text-xs text-primary hover:underline cursor-pointer">View Full Calendar</span>
              </Link>
            </div>
            <div className="space-y-2">
              {isLoading && (
                <div className="flex items-center gap-2 py-4 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading deadlines...</span>
                </div>
              )}
              {!isLoading && calendarEvents.length === 0 && (
                <p className="text-sm text-muted-foreground py-4">No upcoming campaign deadlines.</p>
              )}
              {calendarEvents.map((event, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="flex items-center gap-4 p-3 rounded-lg border border-border/30 hover:border-primary/20 hover:bg-muted/20 transition-all group cursor-pointer"
                >
                  <div className="text-center shrink-0 w-12">
                    <div className="text-lg font-bold text-foreground leading-none">{format(event.date, "d")}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">{format(event.date, "MMM")}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{event.title}</p>
                    <p className="text-[11px] text-muted-foreground">{event.campaign}</p>
                  </div>
                  <CalendarEventBadge type={event.type} />
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="p-5 border-border/50 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-amber-400" /> Asset Library
              </h3>
              <Link href="/social-assets">
                <span className="text-xs text-primary hover:underline cursor-pointer">Browse All</span>
              </Link>
            </div>
            <div className="space-y-2">
              {assetLibrary.map((asset, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/30 hover:border-primary/20 hover:bg-muted/20 transition-all cursor-pointer group"
                >
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${asset.color} flex items-center justify-center shrink-0`}>
                    <Image className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{asset.name}</p>
                    <p className="text-[10px] text-muted-foreground">{asset.category}</p>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{asset.count}</span>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <ActivityFeed entityType="campaign" title="Creative Team Activity" limit={8} compact />
        </motion.div>
      </div>
    </div>
  );
}

export default Workspace;
