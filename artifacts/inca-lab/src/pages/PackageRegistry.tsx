import { useState } from "react";
import { cn } from "../lib/utils";
import {
  Package, Search, Plus, Upload, Download, Lock, Globe, Users, Tag, ChevronRight,
  GitBranch, Clock, Check, AlertCircle, Star, Shield, Boxes, Layers, Cpu, Brain, Anchor, Scale, Compass, Server
} from "lucide-react";

interface PkgDep {
  name: string;
  version: string;
  type: "model" | "tool" | "prompt" | "schema";
}

interface RegistryPackage {
  id: string;
  name: string;
  scope: string;
  version: string;
  description: string;
  domain: string;
  type: "agent-bundle" | "model-config" | "prompt-pack" | "tool-binding" | "schema";
  access: "public" | "org-private" | "team-only";
  downloads: number;
  stars: number;
  verified: boolean;
  slaCompliant: boolean;
  dependencies: PkgDep[];
  publisher: string;
  publishedAt: string;
  tags: string[];
  lockfileHash?: string;
}

const PACKAGES: RegistryPackage[] = [
  {
    id: "maritime-risk-agent", name: "maritime-risk-agent", scope: "@alloy",
    version: "3.2.0", description: "Complete maritime risk intelligence agent bundle. Includes AIS analysis model config, sanctions screening tools, vessel ownership resolution prompts, and risk scoring schema.",
    domain: "Maritime", type: "agent-bundle", access: "public",
    downloads: 2847, stars: 94, verified: true, slaCompliant: true,
    dependencies: [
      { name: "@alloy/claude-maritime-config", version: "^2.0.0", type: "model" },
      { name: "@alloy/ais-analysis-tools", version: "^1.4.0", type: "tool" },
      { name: "@alloy/sanctions-prompts", version: "^3.0.0", type: "prompt" },
      { name: "@alloy/maritime-risk-schema", version: "^2.1.0", type: "schema" },
    ],
    publisher: "alloy-core", publishedAt: "2025-11-14", tags: ["maritime", "AIS", "sanctions", "risk"],
    lockfileHash: "sha256:a8f3c2d...",
  },
  {
    id: "legal-docminer-bundle", name: "legal-docminer-bundle", scope: "@alloy",
    version: "2.5.1", description: "Legal document mining bundle. Contract parsing, deadline extraction, obligation mapping, and counterparty identification with NLP-optimized prompts.",
    domain: "Legal", type: "agent-bundle", access: "public",
    downloads: 1234, stars: 67, verified: true, slaCompliant: true,
    dependencies: [
      { name: "@alloy/gpt4o-mini-legal-config", version: "^1.0.0", type: "model" },
      { name: "@alloy/contract-parsing-tools", version: "^2.3.0", type: "tool" },
      { name: "@alloy/deadline-extraction-prompts", version: "^1.2.0", type: "prompt" },
      { name: "@alloy/legal-document-schema", version: "^1.5.0", type: "schema" },
    ],
    publisher: "alloy-core", publishedAt: "2025-10-28", tags: ["legal", "contracts", "NLP", "extraction"],
    lockfileHash: "sha256:b9e4f1a...",
  },
  {
    id: "threat-sentinel-pack", name: "threat-sentinel-pack", scope: "@alloy",
    version: "4.1.0", description: "Security threat detection bundle with OFAC screening tools, CVE correlation model, maker-checker validation prompts, and audit trail schema.",
    domain: "Security", type: "agent-bundle", access: "public",
    downloads: 3102, stars: 118, verified: true, slaCompliant: true,
    dependencies: [
      { name: "@alloy/claude-security-config", version: "^3.0.0", type: "model" },
      { name: "@alloy/ofac-screening-tools", version: "^2.0.0", type: "tool" },
      { name: "@alloy/threat-analysis-prompts", version: "^4.0.0", type: "prompt" },
      { name: "@alloy/security-audit-schema", version: "^1.0.0", type: "schema" },
    ],
    publisher: "alloy-core", publishedAt: "2025-12-01", tags: ["security", "OFAC", "CVE", "threat-intel"],
    lockfileHash: "sha256:c1d5e8b...",
  },
  {
    id: "real-estate-prospector", name: "real-estate-prospector", scope: "@alloy",
    version: "2.1.0", description: "Property analysis agent bundle. Distressed asset identification, due diligence scoring, comparable sales analysis, and market risk schema.",
    domain: "Real Estate", type: "agent-bundle", access: "org-private",
    downloads: 891, stars: 42, verified: true, slaCompliant: false,
    dependencies: [
      { name: "@alloy/gemini-realestate-config", version: "^1.5.0", type: "model" },
      { name: "@alloy/property-analysis-tools", version: "^1.0.0", type: "tool" },
      { name: "@alloy/due-diligence-prompts", version: "^2.0.0", type: "prompt" },
      { name: "@alloy/property-risk-schema", version: "^1.2.0", type: "schema" },
    ],
    publisher: "szl-holdings", publishedAt: "2025-09-15", tags: ["real-estate", "property", "due-diligence"],
    lockfileHash: "sha256:d2e6f9c...",
  },
  {
    id: "ais-analysis-tools", name: "ais-analysis-tools", scope: "@alloy",
    version: "1.4.2", description: "Standalone AIS vessel tracking tool bindings. Dark period detection, position interpolation, and port call enrichment.",
    domain: "Maritime", type: "tool-binding", access: "public",
    downloads: 5621, stars: 203, verified: true, slaCompliant: true,
    dependencies: [],
    publisher: "alloy-core", publishedAt: "2025-08-20", tags: ["AIS", "vessels", "maritime", "tracking"],
    lockfileHash: "sha256:e3f7a0d...",
  },
  {
    id: "sanctions-prompts", name: "sanctions-prompts", scope: "@alloy",
    version: "3.0.1", description: "OFAC/UN sanctions screening prompt pack. Optimized for high-accuracy entity matching with confidence calibration.",
    domain: "Security", type: "prompt-pack", access: "public",
    downloads: 4128, stars: 156, verified: true, slaCompliant: true,
    dependencies: [],
    publisher: "alloy-core", publishedAt: "2025-11-02", tags: ["OFAC", "sanctions", "prompts", "compliance"],
  },
];

const DOMAIN_ICON: Record<string, React.ComponentType<{className?: string}>> = {
  Maritime: Anchor, Legal: Scale, Security: Shield, "Real Estate": Compass,
  Analytics: Layers, Infrastructure: Server, default: Brain,
};

const DOMAIN_COLOR: Record<string, string> = {
  Maritime: "#3b82f6", Legal: "#f59e0b", Security: "#f43f5e",
  "Real Estate": "#22d3ee", Analytics: "#10b981", Infrastructure: "#f97316",
};

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  "agent-bundle": { label: "Agent Bundle", color: "#7c3aed" },
  "model-config": { label: "Model Config", color: "#22c55e" },
  "prompt-pack": { label: "Prompt Pack", color: "#f97316" },
  "tool-binding": { label: "Tool Binding", color: "#60a5fa" },
  schema: { label: "Schema", color: "#a78bfa" },
};

const ACCESS_ICON: Record<string, React.ComponentType<{className?: string}>> = {
  public: Globe,
  "org-private": Lock,
  "team-only": Users,
};

const DEP_TYPE_COLOR: Record<string, string> = {
  model: "#22c55e",
  tool: "#60a5fa",
  prompt: "#f97316",
  schema: "#a78bfa",
};

function PackageCard({ pkg, onInstall, onView }: { pkg: RegistryPackage; onInstall: (id: string) => void; onView: (pkg: RegistryPackage) => void }) {
  const Icon = DOMAIN_ICON[pkg.domain] || Brain;
  const color = DOMAIN_COLOR[pkg.domain] || "#7c3aed";
  const typeBadge = TYPE_BADGE[pkg.type]!;
  const AccessIcon = ACCESS_ICON[pkg.access]!;

  return (
    <div className="inca-panel p-4 flex flex-col gap-3 hover:border-primary/30 transition-all cursor-pointer">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground font-mono">{pkg.scope}/</span>
            <span className="text-sm font-semibold text-foreground font-mono">{pkg.name}</span>
            <span className="text-xs text-muted-foreground font-mono">v{pkg.version}</span>
            {pkg.verified && (
              <span className="flex items-center gap-0.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                <Check className="w-2.5 h-2.5" /> Verified
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs px-1.5 py-0.5 rounded border font-medium" style={{ background: `${typeBadge.color}15`, color: typeBadge.color, borderColor: `${typeBadge.color}30` }}>
              {typeBadge.label}
            </span>
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <AccessIcon className="w-3 h-3" /> {pkg.access}
            </span>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{pkg.description}</p>

      <div className="flex flex-wrap gap-1">
        {pkg.tags.slice(0, 4).map(t => (
          <span key={t} className="text-xs font-mono bg-secondary border border-border rounded px-1.5 py-0.5 text-muted-foreground">{t}</span>
        ))}
      </div>

      {pkg.dependencies.length > 0 && (
        <div className="bg-secondary/50 rounded-lg p-2.5">
          <div className="text-xs text-muted-foreground mb-1.5 font-medium">Dependencies ({pkg.dependencies.length})</div>
          <div className="space-y-1">
            {pkg.dependencies.slice(0, 3).map(dep => (
              <div key={dep.name} className="flex items-center gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: DEP_TYPE_COLOR[dep.type] }} />
                <span className="font-mono text-foreground truncate">{dep.name}</span>
                <span className="text-muted-foreground flex-shrink-0">{dep.version}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Download className="w-3 h-3" /> {pkg.downloads.toLocaleString()}</span>
          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" /> {pkg.stars}</span>
        </div>
        <span className="font-mono">{pkg.publisher}</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onInstall(pkg.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Download className="w-3 h-3" /> alloy install
        </button>
        <button
          onClick={() => onView(pkg)}
          className="px-3 py-1.5 bg-secondary text-muted-foreground hover:text-foreground rounded-lg text-xs transition-colors flex items-center gap-1"
        >
          <ChevronRight className="w-3 h-3" /> Details
        </button>
      </div>
    </div>
  );
}

function PackageDetailModal({ pkg, onClose, onInstall }: { pkg: RegistryPackage; onClose: () => void; onInstall: (id: string) => void }) {
  const Icon = DOMAIN_ICON[pkg.domain] || Brain;
  const color = DOMAIN_COLOR[pkg.domain] || "#7c3aed";
  const [tab, setTab] = useState<"overview" | "deps" | "cli">("overview");
  const [installed, setInstalled] = useState(false);

  function handleInstall() {
    onInstall(pkg.id);
    setInstalled(true);
    setTimeout(() => setInstalled(false), 2500);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl mx-4 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <div className="font-display font-semibold text-foreground font-mono">{pkg.scope}/{pkg.name}</div>
            <div className="text-xs text-muted-foreground">v{pkg.version} · {pkg.domain} · {pkg.type}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {pkg.slaCompliant && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
                <Check className="w-3 h-3" /> SLA
              </span>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
          </div>
        </div>

        <div className="flex gap-1 px-5 pt-4 border-b border-border">
          {(["overview", "deps", "cli"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={cn("px-3 py-1.5 text-xs font-medium rounded-t-md capitalize transition-all", tab === t ? "bg-secondary text-foreground border-t border-x border-border" : "text-muted-foreground hover:text-foreground")}>
              {t === "deps" ? "Dependencies" : t === "cli" ? "CLI Usage" : "Overview"}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
          {tab === "overview" && (
            <>
              <p className="text-sm text-muted-foreground leading-relaxed">{pkg.description}</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Publisher", value: pkg.publisher },
                  { label: "Published", value: pkg.publishedAt },
                  { label: "Access", value: pkg.access },
                  { label: "Downloads", value: pkg.downloads.toLocaleString() },
                  { label: "Stars", value: String(pkg.stars) },
                  { label: "Lockfile", value: pkg.lockfileHash?.slice(0, 20) + "..." || "N/A" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-secondary rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
                    <div className="text-sm font-medium text-foreground font-mono truncate">{value}</div>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-2">Tags</div>
                <div className="flex flex-wrap gap-1">
                  {pkg.tags.map(t => (
                    <span key={t} className="text-xs font-mono bg-secondary border border-border rounded px-1.5 py-0.5 text-muted-foreground">{t}</span>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === "deps" && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Dependency Tree ({pkg.dependencies.length})</div>
              {pkg.dependencies.length === 0 ? (
                <div className="text-sm text-muted-foreground">No dependencies — standalone package.</div>
              ) : (
                pkg.dependencies.map(dep => (
                  <div key={dep.name} className="flex items-center gap-3 p-3 bg-secondary rounded-lg border border-border">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: DEP_TYPE_COLOR[dep.type] }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm text-foreground">{dep.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{dep.type}</div>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{dep.version}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "cli" && (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Install</div>
              <div className="bg-black/40 rounded-lg p-3 font-mono text-xs text-emerald-400 border border-border">
                alloy install {pkg.scope}/{pkg.name}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Pin exact version</div>
              <div className="bg-black/40 rounded-lg p-3 font-mono text-xs text-emerald-400 border border-border">
                alloy install {pkg.scope}/{pkg.name}@{pkg.version} --save-exact
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Publish update</div>
              <div className="bg-black/40 rounded-lg p-3 font-mono text-xs text-emerald-400 border border-border">
                alloy publish --access {pkg.access}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-border flex gap-3">
          <button
            onClick={handleInstall}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {installed ? <><Check className="w-4 h-4" /> Installed!</> : <><Download className="w-4 h-4" /> Install Package</>}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 bg-secondary text-muted-foreground rounded-lg text-sm hover:text-foreground transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function PublishModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [name, setName] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [access, setAccess] = useState("public");

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <Upload className="w-5 h-5 text-primary" />
          <div className="font-display font-semibold text-foreground">Publish Package</div>
          <button onClick={onClose} className="ml-auto text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
        </div>
        {step === "form" ? (
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Package Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="my-agent-bundle" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-primary/40" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Version (semver)</label>
              <input value={version} onChange={e => setVersion(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-primary/40" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Access Level</label>
              <select value={access} onChange={e => setAccess(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
                <option value="public">Public</option>
                <option value="org-private">Org Private</option>
                <option value="team-only">Team Only</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => name && setStep("success")}
                disabled={!name}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" /> alloy publish
              </button>
              <button onClick={onClose} className="px-4 py-2.5 bg-secondary text-muted-foreground rounded-lg text-sm hover:text-foreground transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="font-semibold text-foreground mb-1">Package Published!</div>
            <div className="text-sm text-muted-foreground mb-1">@alloy/{name} v{version}</div>
            <div className="text-xs text-muted-foreground">Available in the registry · Security scan queued</div>
            <button onClick={onClose} className="mt-5 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const TYPES = ["All", "agent-bundle", "model-config", "prompt-pack", "tool-binding", "schema"];
const DOMAINS = ["All", "Maritime", "Legal", "Security", "Real Estate", "Analytics", "Infrastructure"];
const ACCESS_LEVELS = ["All", "public", "org-private", "team-only"];

export function PackageRegistry() {
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("All");
  const [type, setType] = useState("All");
  const [access, setAccess] = useState("All");
  const [sortBy, setSortBy] = useState<"downloads" | "stars" | "recent">("downloads");
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());
  const [selectedPkg, setSelectedPkg] = useState<RegistryPackage | null>(null);
  const [showPublish, setShowPublish] = useState(false);

  const filtered = PACKAGES.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.description.toLowerCase().includes(search.toLowerCase()) && !p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false;
    if (domain !== "All" && p.domain !== domain) return false;
    if (type !== "All" && p.type !== type) return false;
    if (access !== "All" && p.access !== access) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "downloads") return b.downloads - a.downloads;
    if (sortBy === "stars") return b.stars - a.stars;
    return b.publishedAt.localeCompare(a.publishedAt);
  });

  function handleInstall(id: string) {
    setInstalledIds(prev => new Set([...prev, id]));
    setTimeout(() => setInstalledIds(prev => { const s = new Set(prev); s.delete(id); return s; }), 3000);
  }

  const totalDownloads = PACKAGES.reduce((s, p) => s + p.downloads, 0);
  const publicPkgs = PACKAGES.filter(p => p.access === "public").length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {selectedPkg && <PackageDetailModal pkg={selectedPkg} onClose={() => setSelectedPkg(null)} onInstall={handleInstall} />}
      {showPublish && <PublishModal onClose={() => setShowPublish(false)} />}

      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-5 rounded-full bg-primary" />
            <h1 className="text-xl font-display font-semibold text-foreground">Package Registry</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-3.5">
            AI capability bundles — models, prompts, tools, and schemas as versioned, dependency-resolved packages.
          </p>
        </div>
        <button
          onClick={() => setShowPublish(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Upload className="w-4 h-4" /> Publish Package
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="kpi-tile p-3 text-center">
          <div className="text-xl font-display font-bold text-primary">{PACKAGES.length}</div>
          <div className="text-xs text-muted-foreground">Packages</div>
        </div>
        <div className="kpi-tile p-3 text-center">
          <div className="text-xl font-display font-bold text-foreground">{publicPkgs}</div>
          <div className="text-xs text-muted-foreground">Public</div>
        </div>
        <div className="kpi-tile p-3 text-center">
          <div className="text-xl font-display font-bold text-foreground">{totalDownloads.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Total Installs</div>
        </div>
        <div className="kpi-tile p-3 text-center">
          <div className="text-xl font-display font-bold text-emerald-400">{PACKAGES.filter(p => p.verified).length}</div>
          <div className="text-xs text-muted-foreground">Verified</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search packages, tags..."
            className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
          />
        </div>
        <select value={domain} onChange={e => setDomain(e.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
          {DOMAINS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={type} onChange={e => setType(e.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={access} onChange={e => setAccess(e.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
          {ACCESS_LEVELS.map(a => <option key={a}>{a}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
          <option value="downloads">Sort: Most Installed</option>
          <option value="stars">Sort: Most Starred</option>
          <option value="recent">Sort: Most Recent</option>
        </select>
      </div>

      {installedIds.size > 0 && (
        <div className="mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/25 rounded-lg text-sm text-emerald-400 flex items-center gap-2">
          <Check className="w-4 h-4" /> Package installed. Dependencies resolved and lockfile updated.
        </div>
      )}

      <div className="text-xs text-muted-foreground mb-3">{filtered.length} packages found</div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(pkg => (
          <PackageCard key={pkg.id} pkg={pkg} onInstall={handleInstall} onView={setSelectedPkg} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Package className="w-8 h-8 mb-3" />
            <div className="text-sm">No packages match your filters</div>
            <button onClick={() => { setSearch(""); setDomain("All"); setType("All"); setAccess("All"); }} className="mt-3 text-xs text-primary hover:text-primary/80 transition-colors">Clear filters</button>
          </div>
        )}
      </div>
    </div>
  );
}
