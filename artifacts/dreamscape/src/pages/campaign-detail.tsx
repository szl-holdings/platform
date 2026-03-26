import * as React from "react";
import { useRoute, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, FileText, LayoutTemplate, Mic2, FolderArchive, Eye, ArrowLeft, Calendar, CreditCard } from "lucide-react";
import { useCampaign } from "@/hooks/use-campaigns";
import { Badge, Button } from "@/components/ui";
import { format } from "date-fns";

import { ScriptEditor } from "@/components/scripts/script-editor";
import { StoryboardBoard } from "@/components/storyboards/storyboard-board";
import { VoiceoverManager } from "@/components/voice/voiceover-manager";
import { AssetVault } from "@/components/vault/asset-vault";
import { CreativePreview } from "@/components/preview/creative-preview";
import { CampaignBilling } from "@/components/billing/campaign-billing";

const statusColors: Record<string, string> = {
  concept: "bg-muted text-muted-foreground",
  pre_production: "bg-blue-500/10 text-blue-400",
  production: "bg-primary/10 text-primary",
  post_production: "bg-violet-500/10 text-violet-400",
  review: "bg-amber-500/10 text-amber-400",
  published: "bg-emerald-500/10 text-emerald-400",
  archived: "bg-slate-500/10 text-slate-400",
};

export function CampaignDetail() {
  const [, params] = useRoute("/campaigns/:id");
  const campaignId = params?.id || "";
  const { data: campaign, isLoading } = useCampaign(campaignId);
  
  const [activeTab, setActiveTab] = React.useState<"scripts"|"storyboards"|"voice"|"vault"|"preview"|"billing">("scripts");

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-24 h-4 bg-muted/30 animate-pulse rounded" />
            <div className="w-3 h-3 bg-muted/20 animate-pulse rounded" />
            <div className="w-32 h-4 bg-muted/30 animate-pulse rounded" />
          </div>
          <div className="w-2/3 h-10 bg-muted/30 animate-pulse rounded-lg" />
          <div className="flex gap-3">
            <div className="w-24 h-6 bg-muted/20 animate-pulse rounded-full" />
            <div className="w-20 h-6 bg-muted/20 animate-pulse rounded-full" />
          </div>
          <div className="flex gap-2 border-b border-border/50 pb-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="w-28 h-9 bg-muted/20 animate-pulse rounded-lg" />
            ))}
          </div>
          <div className="h-96 bg-muted/10 animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-destructive/50" />
        </div>
        <h2 className="text-xl font-display font-bold text-foreground mb-2">Campaign not found</h2>
        <p className="text-muted-foreground mb-4">This campaign may have been deleted or doesn't exist.</p>
        <Link href="/">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Workspace</Button>
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: "scripts", label: "Scripts", icon: FileText },
    { id: "storyboards", label: "Storyboards", icon: LayoutTemplate },
    { id: "voice", label: "Voiceovers", icon: Mic2 },
    { id: "vault", label: "Asset Vault", icon: FolderArchive },
    { id: "preview", label: "Stakeholder Preview", icon: Eye },
    { id: "billing", label: "Billing", icon: CreditCard },
  ] as const;

  return (
    <div className="h-full flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 shrink-0"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Workspace
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">{campaign.name}</span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">{campaign.name}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <Badge variant="outline">{campaign.client}</Badge>
              <Badge variant="default" className={`capitalize ${statusColors[campaign.status] || ''}`}>
                {campaign.status.replace('_', ' ')}
              </Badge>
              {campaign.deadline && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Due {format(new Date(campaign.deadline), "MMM d, yyyy")}
                </span>
              )}
            </div>
            {campaign.progress !== undefined && (
              <div className="mt-3 flex items-center gap-3 max-w-sm">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${campaign.progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">{campaign.progress}%</span>
              </div>
            )}
          </div>
          <Button variant="outline" onClick={() => setActiveTab("preview")}>
            <Eye className="w-4 h-4 mr-2" /> Share Preview
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-1 border-b border-border/50 mb-6 shrink-0 overflow-x-auto pb-[1px]"
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap
              ${activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-t-lg"}
            `}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTab" 
                className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary" 
              />
            )}
          </button>
        ))}
      </motion.div>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 h-full"
          >
            {activeTab === "scripts" && <ScriptEditor campaignId={campaignId} />}
            {activeTab === "storyboards" && <StoryboardBoard campaignId={campaignId} />}
            {activeTab === "voice" && <VoiceoverManager campaignId={campaignId} />}
            {activeTab === "vault" && <AssetVault campaignId={campaignId} />}
            {activeTab === "preview" && <CreativePreview campaignId={campaignId} />}
            {activeTab === "billing" && <CampaignBilling campaignId={campaignId} campaignName={campaign.name} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
