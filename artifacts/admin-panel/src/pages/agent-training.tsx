import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Brain, Plus, Trash2, ChevronDown, ChevronUp, Save, BarChart2,
  ThumbsUp, ThumbsDown, BookOpen, Settings, AlertTriangle, CheckCircle,
  Loader2, RefreshCw, MessageSquare
} from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";

const API_BASE = "/api";

const AGENTS = [
  { id: "nexus", name: "Nexus", icon: "⬡", color: "hsl(250, 90%, 65%)", isAdvisory: true },
  { id: "helmsman", name: "Helmsman", icon: "⚓", color: "hsl(210, 90%, 55%)", isAdvisory: true },
  { id: "sentinel", name: "Sentinel", icon: "🛡️", color: "hsl(350, 80%, 55%)", isAdvisory: true },
  { id: "beacon", name: "Beacon", icon: "📡", color: "hsl(190, 90%, 50%)", isAdvisory: true },
  { id: "muse", name: "Muse", icon: "✨", color: "hsl(280, 80%, 60%)", isAdvisory: false },
  { id: "compass", name: "Compass", icon: "🎯", color: "hsl(160, 80%, 50%)", isAdvisory: false },
  { id: "terra", name: "Terra", icon: "🏢", color: "hsl(210, 90%, 55%)", isAdvisory: false },
  { id: "navigator", name: "Navigator", icon: "🧭", color: "hsl(250, 90%, 65%)", isAdvisory: false },
  { id: "stephen-ai", name: "Stephen AI", icon: "💼", color: "hsl(250, 90%, 65%)", isAdvisory: false },
];

interface TrainingPair {
  id: number;
  agentId: string;
  question: string;
  answer: string;
  category: string;
  createdAt: string;
}

interface BehaviorPrefs {
  tone: string;
  detailLevel: string;
  domainJargon: boolean;
  responseLength: string;
  customInstructions: string;
}

interface PerformanceData {
  agentId: string;
  avgRating: string;
  totalFeedback: number;
  trainingPairs: number;
  needsTraining: boolean;
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts?.headers },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function RatingBar({ value, max = 5 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct >= 70 ? "bg-emerald-400" : pct >= 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground w-8">{value.toFixed(1)}</span>
    </div>
  );
}

export default function AgentTraining() {
  const qc = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]!.id);
  const [activeTab, setActiveTab] = useState<"pairs" | "prefs" | "performance" | "advisory">("pairs");
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [isAddingPair, setIsAddingPair] = useState(false);
  const [expandedPairs, setExpandedPairs] = useState<Set<number>>(new Set());
  const [prefs, setPrefs] = useState<Partial<BehaviorPrefs>>({});
  const [prefsSaved, setPrefsSaved] = useState(false);

  const agent = AGENTS.find(a => a.id === selectedAgent)!;

  const { data: pairsData, isLoading: pairsLoading } = useQuery({
    queryKey: ["training-pairs", selectedAgent],
    queryFn: () => apiFetch<{ pairs: TrainingPair[] }>(`/agent-training/pairs/${selectedAgent}`),
    enabled: activeTab === "pairs",
  });

  const { data: prefsData, isLoading: prefsLoading } = useQuery({
    queryKey: ["agent-prefs", selectedAgent],
    queryFn: () => apiFetch<BehaviorPrefs>(`/agent-training/prefs/${selectedAgent}`),
    enabled: activeTab === "prefs",
  });

  const { data: perfData, isLoading: perfLoading } = useQuery({
    queryKey: ["agent-performance"],
    queryFn: () => apiFetch<{ performance: PerformanceData[] }>("/agent-training/performance"),
    enabled: activeTab === "performance",
  });

  const addPairMutation = useMutation({
    mutationFn: (data: { agentId: string; question: string; answer: string; category: string }) =>
      apiFetch<TrainingPair>("/agent-training/pairs", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training-pairs", selectedAgent] });
      setNewQuestion("");
      setNewAnswer("");
      setNewCategory("general");
      setIsAddingPair(false);
    },
  });

  const deletePairMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/agent-training/pairs/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training-pairs", selectedAgent] }),
  });

  const savePrefsMutation = useMutation({
    mutationFn: (data: Partial<BehaviorPrefs>) =>
      apiFetch<BehaviorPrefs>(`/agent-training/prefs/${selectedAgent}`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agent-prefs", selectedAgent] });
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2000);
    },
  });

  const currentPrefs: BehaviorPrefs = {
    tone: prefs.tone ?? prefsData?.tone ?? "professional",
    detailLevel: prefs.detailLevel ?? prefsData?.detailLevel ?? "balanced",
    domainJargon: prefs.domainJargon ?? prefsData?.domainJargon ?? true,
    responseLength: prefs.responseLength ?? prefsData?.responseLength ?? "medium",
    customInstructions: prefs.customInstructions ?? prefsData?.customInstructions ?? "",
  };

  const handleSavePrefs = useCallback(() => {
    savePrefsMutation.mutate(currentPrefs);
  }, [currentPrefs, savePrefsMutation]);

  const toggleExpanded = (id: number) => {
    setExpandedPairs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const tabs = [
    { id: "pairs" as const, label: "Training Pairs", icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: "prefs" as const, label: "Behavior", icon: <Settings className="w-3.5 h-3.5" /> },
    { id: "performance" as const, label: "Performance", icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { id: "advisory" as const, label: "Advisory Audit", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" /> Agent Training Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize per-agent behavior, add training examples, and track performance
          </p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {AGENTS.map(a => (
          <button
            key={a.id}
            onClick={() => setSelectedAgent(a.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all whitespace-nowrap shrink-0",
              selectedAgent === a.id
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-card border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
            )}
          >
            <span>{a.icon}</span>
            {a.name}
            {a.isAdvisory && (
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/15 text-amber-400 border border-amber-500/20">
                Advisory
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex gap-2 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 text-sm border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "pairs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">
                {agent.icon} {agent.name} — Training Pairs
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {pairsData?.pairs.length ?? 0} curated Q&A pairs · injected at inference time
              </p>
            </div>
            <button
              onClick={() => setIsAddingPair(s => !s)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Pair
            </button>
          </div>

          {isAddingPair && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
              <h4 className="text-sm font-medium">New Training Pair</h4>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Expected Question</label>
                <textarea
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                  placeholder="What question should this agent handle well?"
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Ideal Answer</label>
                <textarea
                  value={newAnswer}
                  onChange={e => setNewAnswer(e.target.value)}
                  placeholder="What's the ideal response the agent should give?"
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm resize-none h-28 focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                >
                  {["general", "domain-knowledge", "tone", "format", "escalation", "safety"].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setIsAddingPair(false)}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => addPairMutation.mutate({ agentId: selectedAgent, question: newQuestion, answer: newAnswer, category: newCategory })}
                  disabled={!newQuestion.trim() || !newAnswer.trim() || addPairMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {addPairMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Save Pair
                </button>
              </div>
            </div>
          )}

          {pairsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : pairsData?.pairs.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-xl">
              <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No training pairs yet for {agent.name}</p>
              <p className="text-xs text-muted-foreground mt-1">Add curated Q&A examples to improve agent responses</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pairsData?.pairs.map(pair => (
                <div key={pair.id} className="rounded-lg border border-border bg-card">
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer"
                    onClick={() => toggleExpanded(pair.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">{pair.category}</span>
                      <span className="text-sm truncate">{pair.question}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); deletePairMutation.mutate(pair.id); }}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        {deletePairMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                      {expandedPairs.has(pair.id) ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                  {expandedPairs.has(pair.id) && (
                    <div className="px-4 pb-4 border-t border-border pt-3 space-y-2">
                      <div>
                        <label className="text-[10px] font-medium text-primary uppercase tracking-wider">Question</label>
                        <p className="text-sm mt-1 text-muted-foreground">{pair.question}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">Ideal Answer</label>
                        <p className="text-sm mt-1 text-muted-foreground whitespace-pre-wrap">{pair.answer}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground/60">Added {new Date(pair.createdAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "prefs" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-1">{agent.icon} {agent.name} — Behavioral Preferences</h3>
            <p className="text-xs text-muted-foreground">These settings shape how {agent.name} responds. Applied at inference time.</p>
          </div>

          {prefsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4 max-w-xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Tone</label>
                  <select
                    value={currentPrefs.tone}
                    onChange={e => setPrefs(p => ({ ...p, tone: e.target.value }))}
                    className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                  >
                    {["professional", "casual", "technical", "concise", "detailed", "empathetic"].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Detail Level</label>
                  <select
                    value={currentPrefs.detailLevel}
                    onChange={e => setPrefs(p => ({ ...p, detailLevel: e.target.value }))}
                    className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                  >
                    {["brief", "balanced", "comprehensive", "exhaustive"].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Response Length</label>
                  <select
                    value={currentPrefs.responseLength}
                    onChange={e => setPrefs(p => ({ ...p, responseLength: e.target.value }))}
                    className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                  >
                    {["short", "medium", "long"].map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <button
                    role="switch"
                    aria-checked={currentPrefs.domainJargon}
                    onClick={() => setPrefs(p => ({ ...p, domainJargon: !currentPrefs.domainJargon }))}
                    className={cn(
                      "relative w-10 h-5 rounded-full transition-colors",
                      currentPrefs.domainJargon ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span className={cn(
                      "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow",
                      currentPrefs.domainJargon ? "left-[22px]" : "left-0.5"
                    )} />
                  </button>
                  <label className="text-sm text-foreground">Use domain jargon</label>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Custom Instructions</label>
                <textarea
                  value={currentPrefs.customInstructions}
                  onChange={e => setPrefs(p => ({ ...p, customInstructions: e.target.value }))}
                  placeholder={`Additional instructions for ${agent.name}... (e.g., "Always respond in bullet points", "Prioritize brevity over completeness")`}
                  className="w-full bg-card border border-border rounded-md px-3 py-2.5 text-sm resize-none h-28 focus:outline-none focus:border-primary/50"
                />
              </div>

              <button
                onClick={handleSavePrefs}
                disabled={savePrefsMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {savePrefsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> :
                  prefsSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {prefsSaved ? "Saved!" : "Save Preferences"}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "performance" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-1">Agent Performance Dashboard</h3>
            <p className="text-xs text-muted-foreground">Based on thumbs up/down feedback across all conversations</p>
          </div>

          {perfLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : perfData?.performance.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-xl">
              <BarChart2 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No feedback data yet</p>
              <p className="text-xs text-muted-foreground mt-1">Feedback appears after users rate agent responses</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(perfData?.performance ?? []).map((p) => {
                const ag = AGENTS.find(a => a.id === p.agentId);
                if (!ag) return null;
                return (
                  <div key={p.agentId} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span>{ag.icon}</span>
                        <span className="text-sm font-medium">{ag.name}</span>
                        {p.needsTraining && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                            Needs Training
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {p.totalFeedback} reviews</span>
                        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {p.trainingPairs} pairs</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Quality Score</span>
                        <div className="flex items-center gap-1">
                          {parseFloat(p.avgRating) >= 3.5 ? (
                            <ThumbsUp className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <ThumbsDown className="w-3 h-3 text-red-400" />
                          )}
                        </div>
                      </div>
                      <RatingBar value={parseFloat(p.avgRating)} max={5} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "advisory" && <AdvisoryAuditTab />}
    </div>
  );
}

interface AdvisoryAudit {
  id: number;
  agentId: string;
  recommendationType: string;
  riskLevel: string;
  title: string;
  description: string;
  runbook: string | null;
  status: string;
  actionedAt: string | null;
  createdAt: string;
}

function AdvisoryAuditTab() {
  const qc = useQueryClient();
  const [expandedAudit, setExpandedAudit] = useState<number | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["advisory-audit"],
    queryFn: () => apiFetch<{ audits: AdvisoryAudit[] }>("/agent-training/advisory-audit"),
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiFetch(`/agent-training/advisory-audit/${id}/action`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["advisory-audit"] }),
  });

  const riskColors: Record<string, string> = {
    low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    critical: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    actioned: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dismissed: "bg-muted/50 text-muted-foreground border-border",
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Advisory Recommendations Audit Trail
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            All agent recommendations with risk classification and human approval status
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-400/90">
          <strong>Advisory-Only Architecture:</strong> All advisory agents are architecturally prevented from executing destructive operations.
          Recommendations marked as "action-required" generate runbooks that require explicit human approval before execution.
        </p>
      </div>

      {data?.audits.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No advisory recommendations yet</p>
          <p className="text-xs text-muted-foreground mt-1">Advisory agents will log their recommendations here as they're generated</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data?.audits.map(audit => {
            const ag = AGENTS.find(a => a.id === audit.agentId);
            return (
              <div key={audit.id} className="rounded-lg border border-border bg-card">
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                  onClick={() => setExpandedAudit(expandedAudit === audit.id ? null : audit.id)}
                >
                  <span className="text-base">{ag?.icon ?? "🤖"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">{audit.title}</span>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full border", riskColors[audit.riskLevel] ?? "bg-muted/50 text-muted-foreground border-border")}>
                        {audit.riskLevel} risk
                      </span>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full border", statusColors[audit.status] ?? "bg-muted/50 text-muted-foreground border-border")}>
                        {audit.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{ag?.name ?? audit.agentId} · {new Date(audit.createdAt).toLocaleString()}</p>
                  </div>
                  {expandedAudit === audit.id ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                </div>

                {expandedAudit === audit.id && (
                  <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Description</label>
                      <p className="text-sm mt-1 text-foreground">{audit.description}</p>
                    </div>
                    {audit.runbook && (
                      <div>
                        <label className="text-[10px] font-medium text-amber-400 uppercase tracking-wider">Runbook (Human Execution Required)</label>
                        <pre className="text-xs mt-1 bg-muted/40 rounded p-3 whitespace-pre-wrap text-muted-foreground font-mono border border-border">
                          {audit.runbook}
                        </pre>
                      </div>
                    )}
                    {audit.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => actionMutation.mutate({ id: audit.id, status: "actioned" })}
                          disabled={actionMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve & Mark Actioned
                        </button>
                        <button
                          onClick={() => actionMutation.mutate({ id: audit.id, status: "dismissed" })}
                          disabled={actionMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-muted-foreground hover:text-foreground text-xs transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Dismiss
                        </button>
                      </div>
                    )}
                    {audit.actionedAt && (
                      <p className="text-xs text-emerald-400/70">Actioned at {new Date(audit.actionedAt).toLocaleString()}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
