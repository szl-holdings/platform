import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { m, AnimatePresence } from "framer-motion";
import {
  Shield, CheckCircle2, AlertCircle, Loader2, Plus, Trash2,
  Edit3, ChevronRight, Lock, RefreshCw, Star, Briefcase, Scale,
  Building2, BarChart3, ClipboardList, CheckSquare, Circle, Flag,
  TrendingUp, Eye, EyeOff, Info, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  apiFetch, OwnershipScenario,
  StatusBadge, ScoreBar, PriorityBadge,
  DisclaimerBanner, NextActionsPanel,
} from "./ownership-os/shared";
import { ScenarioDetailView } from "./ownership-os/ScenarioDetailView";
import { ScenarioComparisonView } from "./ownership-os/ScenarioComparisonView";

// ─── Scenario List ────────────────────────────────────────────────────────────

function ScenarioList({ onSelect }: { onSelect: (id: number) => void }) {
  const qc = useQueryClient();
  const [autoSeeded, setAutoSeeded] = useState(false);

  const { data: scenarios = [], isLoading } = useQuery<OwnershipScenario[]>({
    queryKey: ["ownership-scenarios"],
    queryFn: () => apiFetch("/ownership/scenarios?limit=50"),
  });

  const seedMutation = useMutation({
    mutationFn: () => apiFetch("/ownership/seed", { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownership-scenarios"] });
      setAutoSeeded(true);
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: Partial<OwnershipScenario>) => apiFetch("/ownership/scenarios", {
      method: "POST", body: JSON.stringify(body),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ownership-scenarios"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/ownership/scenarios/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ownership-scenarios"] }),
  });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-muted-foreground animate-spin" /></div>;

  return (
    <div className="space-y-5">
      <DisclaimerBanner />

      {scenarios.length === 0 && !autoSeeded && (
        <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center space-y-4">
          <Building2 className="w-8 h-8 text-muted-foreground/30 mx-auto" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">No scenarios yet</h3>
            <p className="text-xs text-muted-foreground mt-1">Seed with a starter scenario or create one manually.</p>
          </div>
          <button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {seedMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Seed Starter Data
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Ownership Scenarios</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{scenarios.length} scenario{scenarios.length !== 1 ? "s" : ""} defined</p>
        </div>
        <button
          onClick={() => setShowCreateForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
        >
          <Plus className="w-3.5 h-3.5" /> New Scenario
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Scenario Name</label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. 51/49 Split — WOSB Ready"
                className="w-full bg-muted border border-border rounded-lg px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Description (optional)</label>
              <input
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Brief description of this scenario"
                className="w-full bg-muted border border-border rounded-lg px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => { setShowCreateForm(false); setNewName(""); setNewDesc(""); }} className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground">Cancel</button>
            <button
              onClick={() => {
                if (!newName.trim()) return;
                createMutation.mutate({ name: newName.trim(), description: newDesc.trim() || undefined });
                setShowCreateForm(false); setNewName(""); setNewDesc("");
              }}
              disabled={createMutation.isPending || !newName.trim()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
            >
              <Plus className="w-3 h-3" /> Create
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {scenarios.map(s => (
          <div
            key={s.id}
            className="group bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors cursor-pointer"
            onClick={() => onSelect(s.id)}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{s.name}</span>
                  {s.isPreferred && <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                  {s.isActive && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-wider">Active</span>}
                  {s.isTemplate && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 uppercase tracking-wider">Template</span>}
                  <StatusBadge status={s.status} />
                </div>
                {s.description && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.description}</p>}

                {(s.fundraisingFitScore != null || s.bankFitScore != null || s.investorClarityScore != null) && (
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    {s.fundraisingFitScore != null && <ScoreBar label="Fundraising Fit" score={s.fundraisingFitScore} />}
                    {s.bankFitScore != null && <ScoreBar label="Banking Fit" score={s.bankFitScore} color="bg-violet-500" />}
                    {s.investorClarityScore != null && <ScoreBar label="Investor Clarity" score={s.investorClarityScore} color="bg-emerald-500" />}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); if (confirm("Delete this scenario?")) deleteMutation.mutate(s.id); }}
                  className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "scenarios", label: "Scenarios", icon: Shield },
  { id: "compare", label: "Compare", icon: Scale },
  { id: "actions", label: "Next Actions", icon: ClipboardList },
] as const;

type NavItem = (typeof NAV_ITEMS)[number]["id"];

export default function OwnershipOsPage() {
  const [nav, setNav] = useState<NavItem>("scenarios");
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);

  const { data: featureEnabled, isLoading: flagLoading } = useQuery<boolean>({
    queryKey: ["ownership-feature-flag"],
    queryFn: async () => {
      try {
        await apiFetch("/ownership/health");
        return true;
      } catch {
        return false;
      }
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    document.title = "Ownership Readiness OS | SZL Holdings";
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
          <p className="text-sm text-muted-foreground">This module is not currently enabled. Contact an administrator to enable the ownership readiness feature.</p>
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
            <p className="text-xs text-muted-foreground">Internal — Certification, Banking & Governance Planning</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
            <span className="text-[10px] text-muted-foreground/50 font-medium">PRIVATE</span>
          </div>
        </div>

        <div className="flex gap-1.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { setNav(item.id); setSelectedScenarioId(null); }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  nav === item.id ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-3 h-3" /> {item.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {nav === "scenarios" && !selectedScenarioId && (
            <m.div key="scenario-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ScenarioList onSelect={id => { setSelectedScenarioId(id); }} />
            </m.div>
          )}
          {nav === "scenarios" && selectedScenarioId && (
            <m.div key={`scenario-detail-${selectedScenarioId}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ScenarioDetailView scenarioId={selectedScenarioId} onBack={() => setSelectedScenarioId(null)} />
            </m.div>
          )}
          {nav === "compare" && (
            <m.div key="compare" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ScenarioComparisonView />
            </m.div>
          )}
          {nav === "actions" && (
            <m.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="space-y-4">
                <DisclaimerBanner />
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-primary" /> All Open Action Items
                </h2>
                <NextActionsPanel scenarioId={1} />
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
