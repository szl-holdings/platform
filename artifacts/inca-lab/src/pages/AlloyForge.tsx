import { useState } from "react";
import { cn } from "../lib/utils";
import {
  Boxes, Plus, GitBranch, ArrowLeftRight, Download, Upload, Check, AlertCircle,
  Lock, Play, Trash2, ChevronRight, RefreshCw, Package, Cpu, DollarSign, Layers, Info,
  ExternalLink, Settings
} from "lucide-react";

interface EnvPackage {
  name: string;
  version: string;
  type: "model" | "tool" | "prompt" | "schema" | "connector";
  locked: boolean;
  conflictWith?: string;
}

interface AgentEnvironment {
  id: string;
  name: string;
  description: string;
  status: "active" | "staging" | "archived";
  packages: EnvPackage[];
  modelBudget: number;
  contextWindow: number;
  providerConstraint: "any" | "anthropic" | "openai" | "gemini";
  createdAt: string;
  lockedAt?: string;
  manifestHash: string;
}

const ENVIRONMENTS: AgentEnvironment[] = [
  {
    id: "prod-maritime-v3", name: "prod-maritime-v3", description: "Production maritime intelligence environment — AIS, sanctions, vessel risk",
    status: "active",
    packages: [
      { name: "@alloy/maritime-risk-agent", version: "3.2.0", type: "schema", locked: true },
      { name: "@alloy/claude-maritime-config", version: "2.0.1", type: "model", locked: true },
      { name: "@alloy/ais-analysis-tools", version: "1.4.2", type: "tool", locked: true },
      { name: "@alloy/sanctions-prompts", version: "3.0.1", type: "prompt", locked: true },
      { name: "@alloy/maritime-db-connector", version: "1.0.0", type: "connector", locked: true },
    ],
    modelBudget: 500, contextWindow: 200000, providerConstraint: "anthropic",
    createdAt: "2025-11-14", lockedAt: "2025-11-20", manifestHash: "sha256:a8f3c2d...",
  },
  {
    id: "staging-legal-v2", name: "staging-legal-v2", description: "Legal document processing — contract mining, deadline extraction",
    status: "staging",
    packages: [
      { name: "@alloy/legal-docminer-bundle", version: "2.5.1", type: "schema", locked: false },
      { name: "@alloy/gpt4o-mini-legal-config", version: "1.0.2", type: "model", locked: false },
      { name: "@alloy/contract-parsing-tools", version: "2.3.1", type: "tool", locked: false },
      { name: "@alloy/deadline-extraction-prompts", version: "1.2.0", type: "prompt", locked: false },
    ],
    modelBudget: 300, contextWindow: 128000, providerConstraint: "openai",
    createdAt: "2025-12-01", manifestHash: "sha256:b9e4f1a...",
  },
  {
    id: "dev-security-exp", name: "dev-security-experimental", description: "Experimental security agent with new threat model — not ready for prod",
    status: "staging",
    packages: [
      { name: "@alloy/threat-sentinel-pack", version: "4.1.0", type: "schema", locked: false },
      { name: "@alloy/claude-security-config", version: "3.1.0-beta", type: "model", locked: false, conflictWith: "@alloy/gpt4-security-config" },
      { name: "@alloy/ofac-screening-tools", version: "2.0.0", type: "tool", locked: false },
    ],
    modelBudget: 200, contextWindow: 100000, providerConstraint: "anthropic",
    createdAt: "2025-12-10", manifestHash: "sha256:c1d5e8b...",
  },
  {
    id: "prod-analytics-v2", name: "prod-analytics-v2", description: "Beacon anomaly detection — KPI monitoring and alerting",
    status: "active",
    packages: [
      { name: "@alloy/beacon-agent-pack", version: "3.0.1", type: "schema", locked: true },
      { name: "@alloy/gemini-analytics-config", version: "1.5.0", type: "model", locked: true },
      { name: "@alloy/anomaly-detection-tools", version: "2.2.0", type: "tool", locked: true },
    ],
    modelBudget: 150, contextWindow: 32000, providerConstraint: "gemini",
    createdAt: "2025-10-05", lockedAt: "2025-10-15", manifestHash: "sha256:d2e6f9c...",
  },
];

const PACKAGE_TYPE_COLOR: Record<string, string> = {
  model: "#22c55e",
  tool: "#60a5fa",
  prompt: "#f97316",
  schema: "#a78bfa",
  connector: "#22d3ee",
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
  staging: "bg-amber-500/10 border-amber-500/25 text-amber-400",
  archived: "bg-secondary border-border text-muted-foreground",
};

const PROVIDER_COLOR: Record<string, string> = {
  anthropic: "#f97316",
  openai: "#22c55e",
  gemini: "#60a5fa",
  any: "#a78bfa",
};

function EnvCard({ env, onClone, onDiff, onSelect }: {
  env: AgentEnvironment;
  onClone: (id: string) => void;
  onDiff: (id: string) => void;
  onSelect: (env: AgentEnvironment) => void;
}) {
  const hasConflict = env.packages.some(p => p.conflictWith);

  return (
    <div
      className={cn("inca-panel p-4 flex flex-col gap-3 hover:border-primary/30 transition-all cursor-pointer", hasConflict && "border-amber-500/20")}
      onClick={() => onSelect(env)}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-semibold text-foreground">{env.name}</span>
            {env.lockedAt && <Lock className="w-3 h-3 text-muted-foreground" />}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("text-xs px-1.5 py-0.5 rounded border font-medium capitalize", STATUS_BADGE[env.status])}>
              {env.status}
            </span>
            <span className="text-xs text-muted-foreground">{env.packages.length} packages</span>
            {hasConflict && (
              <span className="flex items-center gap-0.5 text-xs text-amber-400">
                <AlertCircle className="w-3 h-3" /> Conflict
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PROVIDER_COLOR[env.providerConstraint] }} />
          <span className="text-xs text-muted-foreground capitalize">{env.providerConstraint}</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground line-clamp-1">{env.description}</p>

      <div className="space-y-1">
        {env.packages.slice(0, 3).map(pkg => (
          <div key={pkg.name} className="flex items-center gap-2 text-xs">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: PACKAGE_TYPE_COLOR[pkg.type] }} />
            <span className="font-mono text-foreground truncate flex-1">{pkg.name}</span>
            <span className="text-muted-foreground flex-shrink-0">{pkg.version}</span>
            {pkg.conflictWith && <AlertCircle className="w-3 h-3 text-amber-400 flex-shrink-0" />}
          </div>
        ))}
        {env.packages.length > 3 && (
          <div className="text-xs text-muted-foreground pl-3.5">+{env.packages.length - 3} more packages</div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/40 text-center">
        <div>
          <div className="text-xs font-mono font-bold text-foreground">${env.modelBudget}</div>
          <div className="text-xs text-muted-foreground">Budget/mo</div>
        </div>
        <div>
          <div className="text-xs font-mono font-bold text-foreground">{(env.contextWindow / 1000).toFixed(0)}K</div>
          <div className="text-xs text-muted-foreground">Context</div>
        </div>
        <div>
          <div className="text-xs font-mono font-bold text-foreground">{env.lockedAt ? "Locked" : "Unlocked"}</div>
          <div className="text-xs text-muted-foreground">State</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={e => { e.stopPropagation(); onClone(env.id); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-secondary text-muted-foreground hover:text-foreground rounded-lg text-xs transition-colors"
        >
          <GitBranch className="w-3 h-3" /> Clone
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDiff(env.id); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-secondary text-muted-foreground hover:text-foreground rounded-lg text-xs transition-colors"
        >
          <ArrowLeftRight className="w-3 h-3" /> Diff
        </button>
        <button
          onClick={e => { e.stopPropagation(); onSelect(env); }}
          className="px-3 py-1.5 bg-secondary text-muted-foreground hover:text-foreground rounded-lg text-xs transition-colors"
        >
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function EnvDetailPanel({ env, onClose }: { env: AgentEnvironment; onClose: () => void }) {
  const [tab, setTab] = useState<"packages" | "manifest" | "conflicts">("packages");
  const conflicts = env.packages.filter(p => p.conflictWith);

  return (
    <div className="inca-panel flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Boxes className="w-4 h-4 text-primary" />
        <div>
          <div className="text-sm font-mono font-semibold text-foreground">{env.name}</div>
          <div className="text-xs text-muted-foreground">{env.description}</div>
        </div>
        <button onClick={onClose} className="ml-auto text-muted-foreground hover:text-foreground">✕</button>
      </div>

      <div className="flex gap-1 px-4 pt-3 border-b border-border">
        {(["packages", "manifest", "conflicts"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-3 py-1.5 text-xs font-medium rounded-t-md capitalize transition-all", tab === t ? "bg-secondary text-foreground border-t border-x border-border" : "text-muted-foreground hover:text-foreground")}>
            {t === "conflicts" ? `Conflicts${conflicts.length > 0 ? ` (${conflicts.length})` : ""}` : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "packages" && (
          <div className="space-y-2">
            {env.packages.map(pkg => (
              <div key={pkg.name} className={cn("p-3 bg-secondary rounded-lg border", pkg.conflictWith ? "border-amber-500/30" : "border-border")}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PACKAGE_TYPE_COLOR[pkg.type] }} />
                  <span className="font-mono text-sm text-foreground flex-1 truncate">{pkg.name}</span>
                  <span className="text-xs font-mono text-muted-foreground">{pkg.version}</span>
                  {pkg.locked ? <Lock className="w-3 h-3 text-muted-foreground" /> : <Settings className="w-3 h-3 text-muted-foreground" />}
                </div>
                <div className="flex items-center gap-2 mt-1.5 ml-4">
                  <span className="text-xs capitalize text-muted-foreground">{pkg.type}</span>
                  {pkg.conflictWith && (
                    <span className="text-xs text-amber-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Conflicts with {pkg.conflictWith}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "manifest" && (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground mb-2">Environment Manifest — shareable / importable</div>
            <div className="bg-black/40 rounded-lg p-3 font-mono text-xs text-emerald-400 border border-border leading-relaxed whitespace-pre">
{`{
  "name": "${env.name}",
  "version": "1.0.0",
  "provider": "${env.providerConstraint}",
  "budget_usd": ${env.modelBudget},
  "context_window": ${env.contextWindow},
  "packages": {
${env.packages.map(p => `    "${p.name}": "${p.version}"`).join(",\n")}
  },
  "lockfileHash": "${env.manifestHash}"
}`}
            </div>
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary/15 border border-primary/25 text-primary rounded-lg text-xs font-medium hover:bg-primary/25 transition-colors">
                <Download className="w-3.5 h-3.5" /> Export Manifest
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-secondary border border-border text-muted-foreground hover:text-foreground rounded-lg text-xs font-medium transition-colors">
                <Upload className="w-3.5 h-3.5" /> Import Manifest
              </button>
            </div>
          </div>
        )}

        {tab === "conflicts" && (
          <div>
            {conflicts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Check className="w-8 h-8 mb-2 text-emerald-400" />
                <div className="text-sm">No conflicts detected</div>
              </div>
            ) : (
              <div className="space-y-3">
                {conflicts.map(pkg => (
                  <div key={pkg.name} className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium text-foreground">Version Conflict</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-mono text-amber-400">{pkg.name}</span> requires incompatible version with <span className="font-mono text-amber-400">{pkg.conflictWith}</span>.
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button className="text-xs text-primary hover:text-primary/80 transition-colors">Auto-resolve</button>
                      <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">Pin version</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border flex gap-2">
        <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors">
          <Play className="w-3.5 h-3.5" /> Activate Environment
        </button>
        <button className="px-3 py-2 bg-secondary text-muted-foreground hover:text-foreground rounded-lg text-xs transition-colors flex items-center gap-1">
          <RefreshCw className="w-3.5 h-3.5" /> Sync
        </button>
      </div>
    </div>
  );
}

function CreateEnvModal({ onClose }: { onClose: (env?: Partial<AgentEnvironment>) => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [provider, setProvider] = useState("any");
  const [budget, setBudget] = useState("200");
  const [context, setContext] = useState("128000");
  const [done, setDone] = useState(false);

  function handleCreate() {
    if (!name) return;
    setDone(true);
    setTimeout(() => onClose({ name, description: desc, providerConstraint: provider as AgentEnvironment["providerConstraint"] }), 1500);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center" onClick={() => onClose()}>
      <div className="bg-card border border-border rounded-xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <Plus className="w-5 h-5 text-primary" />
          <div className="font-display font-semibold text-foreground">New Agent Environment</div>
          <button onClick={() => onClose()} className="ml-auto text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
        </div>
        {!done ? (
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Environment Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="prod-maritime-v4" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-primary/40" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Description</label>
              <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Purpose of this environment..." className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Provider Constraint</label>
                <select value={provider} onChange={e => setProvider(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
                  <option value="any">Any Provider</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="openai">OpenAI</option>
                  <option value="gemini">Gemini</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Context Window</label>
                <select value={context} onChange={e => setContext(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
                  <option value="32000">32K tokens</option>
                  <option value="128000">128K tokens</option>
                  <option value="200000">200K tokens</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Monthly Model Budget (USD)</label>
              <input type="number" value={budget} onChange={e => setBudget(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-primary/40" />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCreate}
                disabled={!name}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create Environment
              </button>
              <button onClick={() => onClose()} className="px-4 py-2.5 bg-secondary text-muted-foreground rounded-lg text-sm hover:text-foreground transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="font-semibold text-foreground mb-1">Environment Created!</div>
            <div className="text-sm text-muted-foreground">{name} is ready for package installation</div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AlloyForge() {
  const [envs, setEnvs] = useState<AgentEnvironment[]>(ENVIRONMENTS);
  const [selectedEnv, setSelectedEnv] = useState<AgentEnvironment | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [clonedId, setClonedId] = useState<string | null>(null);
  const [diffId, setDiffId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "staging" | "archived">("all");

  function handleClone(id: string) {
    const src = envs.find(e => e.id === id);
    if (!src) return;
    const clone: AgentEnvironment = {
      ...src,
      id: `${src.id}-clone-${Date.now()}`,
      name: `${src.name}-clone`,
      status: "staging",
      lockedAt: undefined,
      createdAt: new Date().toISOString().split("T")[0]!,
    };
    setEnvs(prev => [clone, ...prev]);
    setClonedId(id);
    setTimeout(() => setClonedId(null), 2500);
  }

  function handleCreate(env?: Partial<AgentEnvironment>) {
    setShowCreate(false);
    if (env?.name) {
      const newEnv: AgentEnvironment = {
        id: `env-${Date.now()}`,
        name: env.name,
        description: env.description ?? "",
        status: "staging",
        packages: [],
        modelBudget: 200,
        contextWindow: 128000,
        providerConstraint: (env.providerConstraint as AgentEnvironment["providerConstraint"]) ?? "any",
        createdAt: new Date().toISOString().split("T")[0]!,
        manifestHash: `sha256:${Math.random().toString(36).slice(2)}...`,
      };
      setEnvs(prev => [newEnv, ...prev]);
    }
  }

  const filtered = statusFilter === "all" ? envs : envs.filter(e => e.status === statusFilter);
  const activeCount = envs.filter(e => e.status === "active").length;
  const conflictCount = envs.filter(e => e.packages.some(p => p.conflictWith)).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {showCreate && <CreateEnvModal onClose={handleCreate} />}

      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-5 rounded-full bg-primary" />
            <h1 className="text-xl font-display font-semibold text-foreground">Alloy Forge</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-3.5">
            AI-native package manager. Create, clone, diff, and switch agent environments with locked dependency manifests.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Environment
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="kpi-tile p-3 text-center">
          <div className="text-xl font-display font-bold text-primary">{envs.length}</div>
          <div className="text-xs text-muted-foreground">Environments</div>
        </div>
        <div className="kpi-tile p-3 text-center">
          <div className="text-xl font-display font-bold text-emerald-400">{activeCount}</div>
          <div className="text-xs text-muted-foreground">Active</div>
        </div>
        <div className="kpi-tile p-3 text-center">
          <div className="text-xl font-display font-bold text-foreground">{envs.reduce((s, e) => s + e.packages.length, 0)}</div>
          <div className="text-xs text-muted-foreground">Total Packages</div>
        </div>
        <div className="kpi-tile p-3 text-center">
          <div className={cn("text-xl font-display font-bold", conflictCount > 0 ? "text-amber-400" : "text-foreground")}>{conflictCount}</div>
          <div className="text-xs text-muted-foreground">Conflicts</div>
        </div>
      </div>

      {clonedId && (
        <div className="mb-4 px-4 py-3 bg-primary/10 border border-primary/25 rounded-lg text-sm text-primary flex items-center gap-2">
          <GitBranch className="w-4 h-4" /> Environment cloned. Find it in Staging.
        </div>
      )}

      <div className="flex gap-2 mb-5">
        {(["all", "active", "staging", "archived"] as const).map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize", statusFilter === f ? "bg-primary/15 text-primary border border-primary/25" : "bg-secondary text-muted-foreground hover:text-foreground border border-transparent")}
          >
            {f}
          </button>
        ))}
      </div>

      <div className={cn("gap-4", selectedEnv ? "grid grid-cols-1 lg:grid-cols-3" : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3")}>
        {!selectedEnv ? (
          filtered.map(env => (
            <EnvCard key={env.id} env={env} onClone={handleClone} onDiff={setDiffId} onSelect={setSelectedEnv} />
          ))
        ) : (
          <>
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
              {filtered.map(env => (
                <EnvCard key={env.id} env={env} onClone={handleClone} onDiff={setDiffId} onSelect={setSelectedEnv} />
              ))}
            </div>
            <div className="lg:col-span-1">
              <EnvDetailPanel env={selectedEnv} onClose={() => setSelectedEnv(null)} />
            </div>
          </>
        )}
        {filtered.length === 0 && (
          <div className="col-span-3 flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Boxes className="w-8 h-8 mb-3" />
            <div className="text-sm">No environments in this state</div>
          </div>
        )}
      </div>
    </div>
  );
}
