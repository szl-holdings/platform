import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "../lib/utils";
import { api, type EnvironmentSnapshot } from "../lib/api";
import {
  Package, GitBranch, Copy, RotateCcw, Play, Download, Clock,
  ChevronDown, ChevronUp, CheckCircle, AlertTriangle, Plus, Diff,
  Lock, Upload, Search, Tag, Loader2, XCircle
} from "lucide-react";

const TAG_CONFIG: Record<string, { label: string; className: string }> = {
  production: { label: "Production", className: "badge-running" },
  archived: { label: "Archived", className: "badge-idle" },
  experimental: { label: "Experimental", className: "badge-warning" },
  staging: { label: "Staging", className: "badge-staged" },
};

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#22c55e",
  anthropic: "#f97316",
  gemini: "#60a5fa",
  meta: "#a78bfa",
};

interface DiffModalProps {
  snapA: EnvironmentSnapshot;
  snapB: EnvironmentSnapshot;
  onClose: () => void;
}

function DiffModal({ snapA, snapB, onClose }: DiffModalProps) {
  const diffs: Array<{ field: string; a: string; b: string; changed: boolean }> = [
    { field: "Model", a: snapA.model, b: snapB.model, changed: snapA.model !== snapB.model },
    { field: "Provider", a: snapA.provider, b: snapB.provider, changed: snapA.provider !== snapB.provider },
    { field: "System Prompt Hash", a: snapA.systemPromptHash.slice(7, 15), b: snapB.systemPromptHash.slice(7, 15), changed: snapA.systemPromptHash !== snapB.systemPromptHash },
    { field: "Tools Hash", a: snapA.toolsHash.slice(7, 15), b: snapB.toolsHash.slice(7, 15), changed: snapA.toolsHash !== snapB.toolsHash },
    { field: "Memory Config", a: snapA.memoryConfig, b: snapB.memoryConfig, changed: snapA.memoryConfig !== snapB.memoryConfig },
    { field: "Temperature", a: String(snapA.hyperparameters.temperature), b: String(snapB.hyperparameters.temperature), changed: snapA.hyperparameters.temperature !== snapB.hyperparameters.temperature },
    { field: "Max Tokens", a: String(snapA.hyperparameters.max_tokens), b: String(snapB.hyperparameters.max_tokens), changed: snapA.hyperparameters.max_tokens !== snapB.hyperparameters.max_tokens },
    { field: "Top P", a: String(snapA.hyperparameters.top_p), b: String(snapB.hyperparameters.top_p), changed: snapA.hyperparameters.top_p !== snapB.hyperparameters.top_p },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl mx-4 shadow-2xl animate-fade-in overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <Diff className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <div className="font-display font-semibold text-foreground">Environment Diff</div>
            <div className="text-xs text-muted-foreground">{snapA.name} → {snapB.name}</div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
        </div>
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-1">
          <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground mb-2 px-2">
            <div>Field</div>
            <div className="text-amber-400">v{snapA.version} (older)</div>
            <div className="text-primary">v{snapB.version} (newer)</div>
          </div>
          {diffs.map(({ field, a, b, changed }) => (
            <div key={field} className={cn("grid grid-cols-3 gap-2 p-2 rounded-lg text-xs", changed ? "bg-amber-500/8 border border-amber-500/20" : "bg-secondary/30")}>
              <div className="text-muted-foreground">{field}</div>
              <div className={cn("font-mono truncate", changed ? "text-amber-400 line-through" : "text-foreground")}>{a}</div>
              <div className={cn("font-mono truncate", changed ? "text-primary font-medium" : "text-foreground")}>{b}</div>
            </div>
          ))}
          <div className="mt-3 p-2 bg-secondary rounded-lg text-xs text-muted-foreground">
            {diffs.filter(d => d.changed).length} field{diffs.filter(d => d.changed).length !== 1 ? "s" : ""} changed
          </div>
        </div>
      </div>
    </div>
  );
}

export function EnvironmentSnapshots() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("All");
  const [domainFilter, setDomainFilter] = useState("All");
  const [expandedSnap, setExpandedSnap] = useState<string | null>(null);
  const [diffPair, setDiffPair] = useState<[string, string] | null>(null);
  const [actionMsg, setActionMsg] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<Record<string, string>>({});

  const snapshotsQuery = useQuery({
    queryKey: ["inca-environment-snapshots"],
    queryFn: () => api.getSnapshots(),
    staleTime: 30_000,
  });

  const cloneMutation = useMutation({
    mutationFn: (id: string) => api.cloneSnapshot(id),
    onSuccess: (_data, id) => {
      setActionMsg(prev => ({ ...prev, [id]: "Cloned" }));
      setTimeout(() => setActionMsg(prev => { const n = { ...prev }; delete n[id]; return n; }), 2500);
      qc.invalidateQueries({ queryKey: ["inca-environment-snapshots"] });
    },
    onError: (err: Error, id) => {
      setActionError(prev => ({ ...prev, [id]: err.message }));
      setTimeout(() => setActionError(prev => { const n = { ...prev }; delete n[id]; return n; }), 3000);
    },
  });

  const promoteMutation = useMutation({
    mutationFn: ({ id, target }: { id: string; target: "staging" | "production" }) =>
      api.promoteSnapshot(id, target),
    onSuccess: (_data, { id, target }) => {
      setActionMsg(prev => ({ ...prev, [id]: `Promoted to ${target}` }));
      setTimeout(() => setActionMsg(prev => { const n = { ...prev }; delete n[id]; return n; }), 2500);
      qc.invalidateQueries({ queryKey: ["inca-environment-snapshots"] });
    },
    onError: (err: Error, { id }) => {
      setActionError(prev => ({ ...prev, [id]: err.message }));
      setTimeout(() => setActionError(prev => { const n = { ...prev }; delete n[id]; return n; }), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteSnapshot(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ["inca-environment-snapshots"] });
    },
    onError: (err: Error, id) => {
      setActionError(prev => ({ ...prev, [id]: err.message }));
      setTimeout(() => setActionError(prev => { const n = { ...prev }; delete n[id]; return n; }), 3000);
    },
  });

  const snapshots = snapshotsQuery.data?.data ?? [];
  const allDomains = [...new Set(snapshots.map(s => s.domain))];
  const tags = ["All", "production", "staging", "experimental", "archived"];
  const domains = ["All", ...allDomains];

  const filtered = snapshots.filter(s => {
    if (tagFilter !== "All" && s.tag !== tagFilter) return false;
    if (domainFilter !== "All" && s.domain !== domainFilter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.domain.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const diffSnapA = diffPair ? snapshots.find(s => s.id === diffPair[0]) : null;
  const diffSnapB = diffPair ? snapshots.find(s => s.id === diffPair[1]) : null;

  const productionCount = snapshots.filter(s => s.tag === "production").length;
  const pinnedCount = snapshots.filter(s => s.pinned).length;
  const domains2 = new Set(snapshots.map(s => s.domain)).size;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {diffPair && diffSnapA && diffSnapB && (
        <DiffModal snapA={diffSnapA} snapB={diffSnapB} onClose={() => setDiffPair(null)} />
      )}

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">Environment Snapshots</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-3.5">
          Version-locked agent environments: model weights, prompt templates, tool configurations, and hyperparameters. Reproducible, diffable, and deployable. Promotions are gated by model approval status.
        </p>
      </div>

      {snapshotsQuery.isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading environment snapshots…</span>
        </div>
      )}

      {snapshotsQuery.isError && (
        <div className="inca-panel p-4 border-red-500/20 text-sm text-red-400 flex items-center gap-2 mb-5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Failed to load snapshots: {snapshotsQuery.error?.message}
        </div>
      )}

      {!snapshotsQuery.isLoading && (
        <>
          <div className="grid grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Total Snapshots</div>
              <div className="text-xl font-display font-bold text-foreground">{snapshots.length}</div>
              <div className="text-xs text-muted-foreground">across {domains2} domains</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Production Pinned</div>
              <div className="text-xl font-display font-bold text-emerald-400">{productionCount}</div>
              <div className="text-xs text-muted-foreground">active deployments</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Pinned Snapshots</div>
              <div className="text-xl font-display font-bold text-primary">{pinnedCount}</div>
              <div className="text-xs text-muted-foreground">protected from deletion</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Domains Covered</div>
              <div className="text-xl font-display font-bold text-foreground">{domains2}</div>
              <div className="text-xs text-muted-foreground">active platform domains</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-5">
            <div className="relative flex-1 min-w-40">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search snapshots…" className="w-full pl-9 pr-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40" />
            </div>
            <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
              {tags.map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={domainFilter} onChange={e => setDomainFilter(e.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
              {domains.map(d => <option key={d}>{d}</option>)}
            </select>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 border border-primary/20 text-primary rounded-lg text-sm font-medium hover:bg-primary/15 transition-colors">
              <Plus className="w-3.5 h-3.5" /> New Snapshot
            </button>
          </div>

          <div className="space-y-3">
            {filtered.map((snap) => {
              const tagCfg = TAG_CONFIG[snap.tag] || TAG_CONFIG["archived"];
              const isExpanded = expandedSnap === snap.id;
              const providerColor = PROVIDER_COLORS[snap.provider] || "#888";
              const done = actionMsg[snap.id];
              const err = actionError[snap.id];

              return (
                <div key={snap.id} className={cn("inca-panel overflow-hidden", snap.pinned && "border-primary/15")}>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-md bg-primary/8 border border-primary/15 flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold text-foreground">{snap.name}</span>
                          <span className="text-xs font-mono text-muted-foreground">v{snap.version}</span>
                          <span className={cn("px-1.5 py-0.5 rounded text-xs", tagCfg.className)}>{tagCfg.label}</span>
                          {snap.pinned && <Lock className="w-3 h-3 text-primary" />}
                          {snap.deployedTo && <span className="text-xs text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">→ {snap.deployedTo}</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">{snap.description}</div>
                        <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: providerColor }} />{snap.model}</span>
                          <span>{snap.domain}</span>
                          <span>by {snap.createdBy}</span>
                          <span>Created {snap.createdAt.slice(0, 10)}</span>
                          {snap.diffFromParent && (
                            <span className="text-emerald-400">+{snap.diffFromParent.added} ~{snap.diffFromParent.changed} -{snap.diffFromParent.removed} from parent</span>
                          )}
                        </div>
                        {err && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1">
                            <XCircle className="w-3 h-3 flex-shrink-0" /> {err}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {done ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-400 px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                            <CheckCircle className="w-3 h-3" /> {done}
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => cloneMutation.mutate(snap.id)}
                              disabled={cloneMutation.isPending && cloneMutation.variables === snap.id}
                              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 bg-secondary rounded-lg border border-border transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              {cloneMutation.isPending && cloneMutation.variables === snap.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Copy className="w-3 h-3" />}
                              Clone
                            </button>
                            <button className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 bg-secondary rounded-lg border border-border transition-colors flex items-center gap-1">
                              <Download className="w-3 h-3" /> Export
                            </button>
                            {snap.parentSnapshotId && (
                              <button onClick={() => setDiffPair([snap.parentSnapshotId!, snap.id])} className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 bg-blue-500/10 rounded-lg border border-blue-500/20 transition-colors flex items-center gap-1">
                                <Diff className="w-3 h-3" /> Diff
                              </button>
                            )}
                            <button onClick={() => setExpandedSnap(isExpanded ? null : snap.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-border/50 animate-fade-in">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                          <div className="bg-secondary rounded-lg p-2.5">
                            <div className="text-xs text-muted-foreground mb-1">System Prompt Hash</div>
                            <div className="text-xs font-mono text-foreground truncate">{snap.systemPromptHash.slice(7, 19)}…</div>
                          </div>
                          <div className="bg-secondary rounded-lg p-2.5">
                            <div className="text-xs text-muted-foreground mb-1">Tools Hash</div>
                            <div className="text-xs font-mono text-foreground truncate">{snap.toolsHash.slice(7, 19)}…</div>
                          </div>
                          <div className="bg-secondary rounded-lg p-2.5">
                            <div className="text-xs text-muted-foreground mb-1">Memory Config</div>
                            <div className="text-xs text-foreground">{snap.memoryConfig}</div>
                          </div>
                          <div className="bg-secondary rounded-lg p-2.5">
                            <div className="text-xs text-muted-foreground mb-1">Temperature</div>
                            <div className="text-xs font-mono text-primary">{snap.hyperparameters.temperature}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {Object.entries(snap.hyperparameters).filter(([k]) => k !== "temperature").map(([key, val]) => (
                            <div key={key} className="bg-secondary rounded-lg p-2">
                              <div className="text-xs text-muted-foreground">{key.replace("_", " ")}</div>
                              <div className="text-xs font-mono text-foreground">{val}</div>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => promoteMutation.mutate({ id: snap.id, target: "staging" })}
                            disabled={promoteMutation.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                          >
                            {promoteMutation.isPending && promoteMutation.variables?.id === snap.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                            Promote to Staging
                          </button>
                          <button
                            onClick={() => promoteMutation.mutate({ id: snap.id, target: "production" })}
                            disabled={promoteMutation.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs hover:bg-emerald-500/15 transition-colors disabled:opacity-50"
                          >
                            <Upload className="w-3 h-3" /> Promote to Production
                          </button>
                          {!snap.pinned && (
                            <button
                              onClick={() => deleteMutation.mutate(snap.id)}
                              disabled={deleteMutation.isPending}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-red-400 rounded-lg text-xs hover:text-red-300 transition-colors border border-border ml-auto"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="inca-panel p-10 text-center">
                <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <div className="text-sm text-muted-foreground">No snapshots match current filters.</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
