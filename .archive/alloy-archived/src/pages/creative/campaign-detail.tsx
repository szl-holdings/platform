import * as React from "react";
import { useRoute, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, FileText, LayoutTemplate, Mic2, FolderArchive, Eye, ArrowLeft, Calendar, CreditCard, TrendingUp, DollarSign, Users, MessageCircle } from "lucide-react";
import { useCampaign } from "@/hooks/use-campaigns";
import { format } from "date-fns";
import { CommentThread, ActivityFeed } from "@workspace/shared-ui/collaboration";

import { ScriptEditor } from "@/components/creative/scripts/script-editor";
import { StoryboardBoard } from "@/components/creative/storyboards/storyboard-board";
import { VoiceoverManager } from "@/components/creative/voice/voiceover-manager";
import { AssetVault } from "@/components/creative/vault/asset-vault";
import { CreativePreview } from "@/components/creative/preview/creative-preview";
import { CampaignBilling } from "@/components/creative/billing/campaign-billing";

const statusColors: Record<string, string> = {
  concept: "bg-white/5 text-slate-400 border-white/10",
  pre_production: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  production: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  post_production: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  review: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  published: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  archived: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export function CampaignDetail() {
  const [, params] = useRoute("/creative/campaigns/:id");
  const campaignId = params?.id || "";
  const { data: campaign, isLoading } = useCampaign(campaignId);
  
  const [activeTab, setActiveTab] = React.useState<"scripts"|"storyboards"|"voice"|"vault"|"preview"|"billing"|"discussion">("scripts");

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-24 h-4 bg-white/5 animate-pulse rounded" />
            <div className="w-3 h-3 bg-white/3 animate-pulse rounded" />
            <div className="w-32 h-4 bg-white/5 animate-pulse rounded" />
          </div>
          <div className="w-2/3 h-10 bg-white/5 animate-pulse rounded-lg" />
          <div className="flex gap-3">
            <div className="w-24 h-6 bg-white/3 animate-pulse rounded-full" />
            <div className="w-20 h-6 bg-white/3 animate-pulse rounded-full" />
          </div>
          <div className="flex gap-2 border-b border-white/8 pb-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="w-28 h-9 bg-white/3 animate-pulse rounded-lg" />
            ))}
          </div>
          <div className="h-96 bg-white/3 animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-red-500/50" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Campaign not found</h2>
        <p className="text-slate-400 mb-4">This campaign may have been deleted or doesn't exist.</p>
        <Link href="/creative">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-white/10 text-slate-400 hover:border-white/20 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Campaign Hub
          </button>
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: "scripts", label: "Scripts", icon: FileText },
    { id: "storyboards", label: "Storyboards", icon: LayoutTemplate },
    { id: "voice", label: "Voiceovers", icon: Mic2 },
    { id: "vault", label: "Asset Vault", icon: FolderArchive },
    { id: "preview", label: "Review & Approval", icon: Eye },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "discussion", label: "Discussion", icon: MessageCircle },
  ] as const;

  return (
    <div className="h-full flex flex-col">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 shrink-0">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
          <Link href="/creative" className="hover:text-slate-300 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Campaign Hub
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white font-medium">{campaign.name}</span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">{campaign.name}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded border border-white/10 text-slate-400">{campaign.client}</span>
              <span className={`text-xs px-2 py-0.5 rounded border capitalize ${statusColors[campaign.status] || ""}`}>
                {campaign.status.replace(/_/g, " ")}
              </span>
              {campaign.budget && (
                <span className="text-xs px-2 py-0.5 rounded border border-white/10 text-slate-400 flex items-center gap-0.5">
                  <DollarSign className="w-3 h-3" />{campaign.budget.replace("$", "")}
                </span>
              )}
              {campaign.director && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Dir: {campaign.director}
                </span>
              )}
              {campaign.deadline && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Due {format(new Date(campaign.deadline), "MMM d, yyyy")}
                </span>
              )}
            </div>
            {campaign.description && (
              <p className="text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">{campaign.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3">
              {campaign.progress !== undefined && (
                <div className="flex items-center gap-3 max-w-xs flex-1">
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${campaign.progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-cyan-400 rounded-full"
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-400">{campaign.progress}%</span>
                </div>
              )}
              {campaign.kpis && campaign.kpis.length > 0 && (
                <div className="hidden lg:flex items-center gap-3">
                  {campaign.kpis.slice(0, 3).map((kpi, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500">{kpi.label}:</span>
                      <span className="font-bold text-white">{kpi.value}</span>
                      <span className="text-emerald-400 flex items-center text-[10px]">
                        <TrendingUp className="w-2.5 h-2.5" />{kpi.trend}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setActiveTab("preview")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300 transition-colors"
          >
            <Eye className="w-4 h-4" /> Share Preview
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-1 border-b border-white/8 mb-6 shrink-0 overflow-x-auto pb-[1px]"
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? "text-cyan-400" : "text-slate-500 hover:text-slate-300 hover:bg-white/3 rounded-t-lg"}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="creativeActiveTab" className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-cyan-400" />
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
            {activeTab === "discussion" && (
              <div className="h-full overflow-y-auto space-y-4 p-1">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <CommentThread entityType="campaign" entityId={campaignId} title="Campaign Discussion" collapsible={false} />
                  <ActivityFeed entityType="campaign" title="Campaign Activity" limit={10} compact />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default CampaignDetail;
