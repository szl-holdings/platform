import {
  BatchPdfPanel,
  DocumentEnginePanel,
  SigningDashboard,
} from '@szl-holdings/shared-ui/document-engine';
import { cn } from '@szl-holdings/shared-ui/utils';
import { motion } from 'framer-motion';
import { BookOpen, FileText, Layers, Pen } from 'lucide-react';
import { useState } from 'react';

const TABS = [
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'signing', label: 'Signing', icon: Pen },
  { id: 'pdf-batch', label: 'PDF Batches', icon: Layers },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function CarlotaDocumentEngine() {
  const [activeTab, setActiveTab] = useState<TabId>('documents');

  return (
    <div className="flex flex-col h-full overflow-hidden bg-cj-bg">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-shrink-0"
      >
        <div className="flex items-center gap-3 px-6 pt-6 pb-0">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-cj-heading">Document Engine</h1>
            <p className="text-xs text-cj-muted">
              Engagement letters, NDAs, service agreements & e-signatures
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-6 pt-4 border-b border-cj-border">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-colors',
                  isActive
                    ? 'border-purple-400 text-purple-400 bg-purple-500/5'
                    : 'border-transparent text-cj-muted hover:text-cj-heading',
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
        {activeTab === 'documents' && (
          <DocumentEnginePanel appSource="carlota_jo" accentColor="#a855f7" className="h-full" />
        )}
        {activeTab === 'signing' && (
          <SigningDashboard appSource="carlota_jo" accentColor="#a855f7" className="h-full" />
        )}
        {activeTab === 'pdf-batch' && (
          <BatchPdfPanel appSource="carlota_jo" accentColor="#a855f7" className="h-full" />
        )}
      </div>
    </div>
  );
}
