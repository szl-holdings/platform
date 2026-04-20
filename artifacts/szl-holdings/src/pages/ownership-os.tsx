import { useStandardQuery } from '@szl-holdings/api-client-react';
import { AnimatePresence, m } from 'framer-motion';
import { ClipboardList, Loader2, Lock, Scale, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/ownership-os/api';
import { DisclaimerBanner } from '@/ownership-os/components';
import { NextActionsPanel } from '@/ownership-os/NextActionsPanel';
import { ScenarioComparisonView } from '@/ownership-os/ScenarioComparisonView';
import { ScenarioDetailView } from '@/ownership-os/ScenarioDetailView';
import { ScenarioList } from '@/ownership-os/ScenarioList';

const NAV_ITEMS = [
  { id: 'scenarios', label: 'Scenarios', icon: Shield },
  { id: 'compare', label: 'Compare', icon: Scale },
  { id: 'actions', label: 'Next Actions', icon: ClipboardList },
] as const;

type NavItem = (typeof NAV_ITEMS)[number]['id'];

export default function OwnershipOsPage() {
  const [nav, setNav] = useState<NavItem>('scenarios');
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);

  const { data: featureEnabled, isLoading: flagLoading } = useStandardQuery<boolean>({
    queryKey: ['ownership-feature-flag'],
    queryFn: async () => {
      try {
        await apiFetch('/ownership/health');
        return true;
      } catch {
        return false;
      }
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    document.title = 'Ownership Readiness OS | SZL Holdings';
  }, []);

  if (flagLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!featureEnabled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card border border-border rounded-xl p-8 text-center max-w-md space-y-3">
          <Lock className="w-8 h-8 text-muted-foreground/40 mx-auto" />
          <h2 className="text-base font-semibold text-foreground">Ownership Readiness OS</h2>
          <p className="text-sm text-muted-foreground">
            This module is not currently enabled. Contact an administrator to enable the ownership
            readiness feature.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center gap-3 pb-2 border-b border-border/50">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Ownership Readiness OS</h1>
            <p className="text-xs text-muted-foreground">
              Internal — Certification, Banking & Governance Planning
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
            <span className="text-[10px] text-muted-foreground/50 font-medium">PRIVATE</span>
          </div>
        </div>

        <div className="flex gap-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setNav(item.id);
                  setSelectedScenarioId(null);
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  nav === item.id
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
              >
                <Icon className="w-3 h-3" /> {item.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {nav === 'scenarios' && !selectedScenarioId && (
            <m.div
              key="scenario-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ScenarioList
                onSelect={(id) => {
                  setSelectedScenarioId(id);
                }}
              />
            </m.div>
          )}
          {nav === 'scenarios' && selectedScenarioId && (
            <m.div
              key={`scenario-detail-${selectedScenarioId}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ScenarioDetailView
                scenarioId={selectedScenarioId}
                onBack={() => setSelectedScenarioId(null)}
              />
            </m.div>
          )}
          {nav === 'compare' && (
            <m.div
              key="compare"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ScenarioComparisonView />
            </m.div>
          )}
          {nav === 'actions' && (
            <m.div
              key="actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="space-y-4">
                <DisclaimerBanner />
                <NextActionsPanel />
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
