import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, m } from 'framer-motion';
import {
  Check,
  ChevronRight,
  Loader2,
  Plus,
  Shield,
  Star,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiFetch } from './api';
import { DisclaimerBanner, StatusBadge } from './components';
import type { OwnershipScenario } from './types';

// ─── Scenario List ────────────────────────────────────────────────────────────

export function ScenarioList({ onSelect }: { onSelect: (id: number) => void }) {
  const qc = useQueryClient();
  const [autoSeeded, setAutoSeeded] = useState(false);

  const { data: scenarios = [], isLoading } = useStandardQuery<OwnershipScenario[]>({
    queryKey: ['ownership-scenarios'],
    queryFn: () => apiFetch('/ownership/scenarios?limit=50'),
  });

  const seedMutation = useStandardMutation({
    mutationFn: () => apiFetch('/ownership/seed-preferred-template', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ownership-scenarios'] }),
  });

  useEffect(() => {
    if (!isLoading && scenarios.length === 0 && !autoSeeded && !seedMutation.isPending) {
      setAutoSeeded(true);
      seedMutation.mutate();
    }
  }, [isLoading, scenarios.length, autoSeeded, seedMutation]);

  const deleteMutation = useStandardMutation({
    mutationFn: (id: number) => apiFetch(`/ownership/scenarios/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ownership-scenarios'] }),
  });

  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const createMutation = useStandardMutation({
    mutationFn: () =>
      apiFetch('/ownership/scenarios', {
        method: 'POST',
        body: JSON.stringify({ name: newName, description: newDesc }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ownership-scenarios'] });
      setShowNew(false);
      setNewName('');
      setNewDesc('');
    },
  });

  return (
    <div className="space-y-5">
      <DisclaimerBanner />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Ownership Scenarios</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {scenarios.length} scenario{scenarios.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {scenarios.filter((s) => s.isPreferred).length === 0 && (
            <button
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/15 disabled:opacity-50 transition-colors"
            >
              {seedMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Star className="w-3 h-3" />
              )}
              Load Preferred Template
            </button>
          )}
          <button
            onClick={() => setShowNew(!showNew)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Scenario
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showNew && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">New Ownership Scenario</h3>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Scenario name (e.g. Mom 51% / Stephen 30% / Dad 19%)"
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowNew(false)}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createMutation.mutate()}
                  disabled={!newName.trim() || createMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  Create
                </button>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      ) : scenarios.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-10 text-center space-y-3">
          <Shield className="w-8 h-8 text-muted-foreground/40 mx-auto" />
          <div>
            <p className="text-sm font-medium text-foreground">No scenarios yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Load the preferred mom-led template or create a custom scenario.
            </p>
          </div>
          <button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {seedMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Star className="w-4 h-4" />
            )}
            Load Preferred Mom-Led Structure
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {scenarios.map((s) => (
            <div
              key={s.id}
              className="group bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all cursor-pointer"
              onClick={() => onSelect(s.id)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{s.name}</span>
                    {s.isPreferred && <Star className="w-3.5 h-3.5 text-amber-500" />}
                    {s.isActive && (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-semibold">
                        ACTIVE
                      </span>
                    )}
                    {s.isTemplate && (
                      <span className="text-[10px] bg-violet-500/10 text-violet-500 border border-violet-500/20 px-1.5 py-0.5 rounded-full font-semibold">
                        TEMPLATE
                      </span>
                    )}
                    <StatusBadge status={s.status} />
                  </div>
                  {s.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {s.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    {s.fundraisingFitScore != null && (
                      <span className="text-[10px] text-muted-foreground">
                        Fundraising: {s.fundraisingFitScore}/100
                      </span>
                    )}
                    {s.bankFitScore != null && (
                      <span className="text-[10px] text-muted-foreground">
                        Banking: {s.bankFitScore}/100
                      </span>
                    )}
                    {s.investorClarityScore != null && (
                      <span className="text-[10px] text-muted-foreground">
                        Investor Clarity: {s.investorClarityScore}/100
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this scenario?')) deleteMutation.mutate(s.id);
                    }}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
