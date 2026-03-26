import * as React from "react";
import { useRoute, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, FileText, LayoutTemplate, Mic2, FolderArchive, Eye, ArrowLeft } from "lucide-react";
import { useCampaign } from "@/hooks/use-campaigns";
import { Badge, Button } from "@/components/ui";

// Sub-components (in real app these would be imported from separate files)
import { ScriptEditor } from "@/components/scripts/script-editor";
import { StoryboardBoard } from "@/components/storyboards/storyboard-board";
import { VoiceoverManager } from "@/components/voice/voiceover-manager";
import { AssetVault } from "@/components/vault/asset-vault";
import { CreativePreview } from "@/components/preview/creative-preview";

export function CampaignDetail() {
  const [, params] = useRoute("/campaigns/:id");
  const campaignId = params?.id || "";
  const { data: campaign, isLoading } = useCampaign(campaignId);
  
  const [activeTab, setActiveTab] = React.useState<"scripts"|"storyboards"|"voice"|"vault"|"preview">("scripts");

  if (isLoading) return <div className="p-8 text-muted-foreground animate-pulse">Loading campaign details...</div>;
  if (!campaign) return <div className="p-8 text-destructive">Campaign not found</div>;

  const tabs = [
    { id: "scripts", label: "Scripts", icon: FileText },
    { id: "storyboards", label: "Storyboards", icon: LayoutTemplate },
    { id: "voice", label: "Voiceovers", icon: Mic2 },
    { id: "vault", label: "Asset Vault", icon: FolderArchive },
    { id: "preview", label: "Stakeholder Preview", icon: Eye },
  ] as const;

  return (
    <div className="h-full flex flex-col">
      {/* Header Breadcrumbs & Title */}
      <div className="mb-6 shrink-0">
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
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="outline">{campaign.client}</Badge>
              <Badge variant="default" className="capitalize">{campaign.status.replace('_', ' ')}</Badge>
            </div>
          </div>
          <Button variant="outline" onClick={() => setActiveTab("preview")}>
            <Eye className="w-4 h-4 mr-2" /> Share Preview
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-border/50 mb-6 shrink-0 overflow-x-auto pb-[1px]">
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
      </div>

      {/* Tab Content Area */}
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
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
