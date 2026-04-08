import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Layers, Pen, BookOpen, Brain } from "lucide-react";
import { DocumentEnginePanel, BatchPdfPanel, SigningDashboard } from "@szl-holdings/shared-ui";
import { cn } from "@szl-holdings/shared-ui/utils";
import { useGenome } from "@/context/GenomeContext";
import { CLIENT_GENOME } from "@/data/genome-data";

const TABS = [
  { id: "documents", label: "Documents", icon: FileText },
  { id: "signing", label: "Signing", icon: Pen },
  { id: "pdf-batch", label: "PDF Batches", icon: Layers },
] as const;

type TabId = typeof TABS[number]["id"];

export default function CarlotaDocumentEngine() {
  const [activeTab, setActiveTab] = useState<TabId>("documents");
  const { getPref } = useGenome();

  const liveTone = getPref("tone");
  const liveLength = getPref("length");

  return (
    <div className="flex flex-col h-full overflow-hidden bg-cj-bg">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex-shrink-0">
        {(liveTone || liveLength) && (
          <div className="flex items-center gap-3 px-6 pt-3 pb-0">
            <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] rounded border" style={{ borderColor: "rgba(196,170,126,0.2)", background: "rgba(196,170,126,0.05)", color: "rgba(196,170,126,0.65)" }}>
              <Brain className="w-3 h-3" />
              <span>Genome active: {CLIENT_GENOME.name}</span>
              {liveTone && <span className="opacity-60">· Tone: {liveTone}</span>}
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 px-6 pt-6 pb-0">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-cj-heading">Document Engine</h1>
            <p className="text-xs text-cj-muted">Engagement letters, NDAs, service agreements & e-signatures</p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-6 pt-4 border-b border-cj-border">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-colors",
                  isActive
                    ? "border-purple-400 text-purple-400 bg-purple-500/5"
                    : "border-transparent text-cj-muted hover:text-cj-heading"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "documents" && (
          <DocumentEnginePanel
            appSource="carlota_jo"
            accentColor="#a855f7"
            className="h-full"
          />
        )}
        {activeTab === "signing" && (
          <SigningDashboard
            appSource="carlota_jo"
            accentColor="#a855f7"
            className="h-full"
          />
        )}
        {activeTab === "pdf-batch" && (
          <BatchPdfPanel
            appSource="carlota_jo"
            accentColor="#a855f7"
            className="h-full"
          />
        )}
      </div>
    </div>
  );
}
