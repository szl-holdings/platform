import { useState } from "react";
import { cn } from "../lib/utils";
import {
  Package, Plus, Key, Shield, Settings, Check, Copy, Trash2, Globe,
  DollarSign, BarChart3, Cpu, Eye, AlertCircle, ChevronDown, ChevronUp
} from "lucide-react";

interface WhiteLabelDeployment {
  id: string;
  clientName: string;
  clientLogo: string;
  brandColor: string;
  selectedAgents: string[];
  resourceLimits: { rpmCap: number; dailyRunCap: number; maxConcurrency: number };
  apiKey: string;
  deployedAt: string;
  status: "active" | "paused" | "provisioning";
  monthlyRevenue: number;
  runsThisMonth: number;
  uptimePct: number;
}

const DEPLOYMENTS: WhiteLabelDeployment[] = [
  {
    id: "wl-001", clientName: "Apex Maritime Group", clientLogo: "AM", brandColor: "#3b82f6",
    selectedAgents: ["Helmsman v3", "Sentinel v4", "Beacon v3"],
    resourceLimits: { rpmCap: 60, dailyRunCap: 500, maxConcurrency: 5 },
    apiKey: "szl_wl_amg_k9x2mq7pT4nR…", deployedAt: "2026-02-14 09:00", status: "active",
    monthlyRevenue: 4800, runsThisMonth: 1247, uptimePct: 99.7,
  },
  {
    id: "wl-002", clientName: "Nexaris Legal Partners", clientLogo: "NL", brandColor: "#f59e0b",
    selectedAgents: ["DocMiner v2", "Sentinel v4"],
    resourceLimits: { rpmCap: 30, dailyRunCap: 200, maxConcurrency: 3 },
    apiKey: "szl_wl_nlp_m3v8kT5qY2…", deployedAt: "2026-03-01 11:30", status: "active",
    monthlyRevenue: 2200, runsThisMonth: 642, uptimePct: 99.2,
  },
  {
    id: "wl-003", clientName: "UrbanEdge Properties", clientLogo: "UE", brandColor: "#22d3ee",
    selectedAgents: ["Prospector v2", "Beacon v3"],
    resourceLimits: { rpmCap: 20, dailyRunCap: 100, maxConcurrency: 2 },
    apiKey: "szl_wl_uep_T7nM4x…", deployedAt: "2026-04-01 14:00", status: "provisioning",
    monthlyRevenue: 1100, runsThisMonth: 89, uptimePct: 98.4,
  },
];

const ALL_AGENTS = [
  "Alloy", "Helmsman v3", "Sentinel v4", "DocMiner v2", "Prospector v2",
  "Beacon v3", "Muse v2", "Zeus v3", "Oracle v1",
];

function StatusBadge({ status }: { status: WhiteLabelDeployment["status"] }) {
  if (status === "active") return <span className="badge-running text-xs px-1.5 py-0.5 rounded">active</span>;
  if (status === "paused") return <span className="badge-idle text-xs px-1.5 py-0.5 rounded">paused</span>;
  return <span className="badge-warning text-xs px-1.5 py-0.5 rounded animate-pulse">provisioning</span>;
}

function DeploymentCard({ deployment, expanded, onToggle }: { deployment: WhiteLabelDeployment; expanded: boolean; onToggle: () => void }) {
  const [keyCopied, setKeyCopied] = useState(false);

  function copyKey() {
    navigator.clipboard.writeText(deployment.apiKey).catch(() => {});
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 1500);
  }

  return (
    <div className="inca-panel overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-4 hover:bg-secondary/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ backgroundColor: deployment.brandColor }}
          >
            {deployment.clientLogo}
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-foreground">{deployment.clientName}</div>
            <div className="text-xs text-muted-foreground">{deployment.selectedAgents.length} agents · Deployed {deployment.deployedAt.slice(0, 10)}</div>
          </div>
          <StatusBadge status={deployment.status} />
        </div>
        <div className="flex items-center gap-5">
          <div className="hidden md:flex gap-6 text-xs text-right">
            <div>
              <div className="font-mono font-bold text-emerald-400">${deployment.monthlyRevenue.toLocaleString()}</div>
              <div className="text-muted-foreground">MRR</div>
            </div>
            <div>
              <div className="font-mono font-bold text-foreground">{deployment.runsThisMonth.toLocaleString()}</div>
              <div className="text-muted-foreground">Runs/mo</div>
            </div>
            <div>
              <div className="font-mono font-bold text-foreground">{deployment.uptimePct}%</div>
              <div className="text-muted-foreground">Uptime</div>
            </div>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/40 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* Agents */}
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Deployed Agents</div>
              <div className="space-y-1.5">
                {deployment.selectedAgents.map(a => (
                  <div key={a} className="flex items-center gap-2 py-1">
                    <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    <span className="text-xs text-foreground">{a}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resource Limits */}
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Resource Limits</div>
              <div className="space-y-2">
                {[
                  { label: "RPM Cap", value: deployment.resourceLimits.rpmCap },
                  { label: "Daily Run Cap", value: deployment.resourceLimits.dailyRunCap },
                  { label: "Max Concurrency", value: deployment.resourceLimits.maxConcurrency },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* API Key */}
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">API Access</div>
              <div className="bg-secondary rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground mb-2 flex items-center justify-between gap-2">
                <span className="truncate">{deployment.apiKey}</span>
                <button onClick={copyKey} className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors">
                  {keyCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div className="flex gap-1.5">
                <button className="flex items-center gap-1 px-2 py-1.5 bg-primary/10 border border-primary/25 text-primary rounded text-xs hover:bg-primary/15 transition-colors">
                  <Key className="w-3 h-3" /> Rotate Key
                </button>
                <button className="flex items-center gap-1 px-2 py-1.5 bg-secondary border border-border text-muted-foreground rounded text-xs hover:text-foreground transition-colors">
                  <Settings className="w-3 h-3" /> Edit Limits
                </button>
                <button className="flex items-center gap-1 px-2 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/15 transition-colors">
                  <Trash2 className="w-3 h-3" /> Revoke
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NewDeploymentModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [clientName, setClientName] = useState("");
  const [brandColor, setBrandColor] = useState("#3b82f6");
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [rpmCap, setRpmCap] = useState("60");
  const [dailyCap, setDailyCap] = useState("500");
  const [concurrency, setConcurrency] = useState("5");
  const [done, setDone] = useState(false);

  function toggleAgent(a: string) {
    setSelectedAgents(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  }

  function deploy() {
    setDone(true);
    setTimeout(onClose, 2000);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-lg mx-4 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="text-sm font-semibold text-foreground">New White-Label Deployment</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            Step {step} of 3
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors ml-2">✕</button>
          </div>
        </div>

        <div className="p-5">
          {step === 1 && (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Client Branding</div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Client Name</label>
                <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Apex Maritime Group" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Brand Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-10 h-8 rounded border border-border cursor-pointer bg-transparent" />
                  <span className="text-sm font-mono text-foreground">{brandColor}</span>
                  <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: brandColor }} />
                </div>
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Select Agent Capabilities</div>
              <div className="grid grid-cols-2 gap-2">
                {ALL_AGENTS.map(a => (
                  <button
                    key={a}
                    onClick={() => toggleAgent(a)}
                    className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-xs text-left transition-all", selectedAgents.includes(a) ? "border-primary/40 bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/25 hover:text-foreground")}
                  >
                    {selectedAgents.includes(a) ? <Check className="w-3 h-3 flex-shrink-0" /> : <div className="w-3 h-3 flex-shrink-0" />}
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 3 && !done && (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Resource Limits & Rate Caps</div>
              {[
                { label: "Requests/Minute Cap", value: rpmCap, setter: setRpmCap },
                { label: "Daily Run Cap", value: dailyCap, setter: setDailyCap },
                { label: "Max Concurrency", value: concurrency, setter: setConcurrency },
              ].map(({ label, value, setter }) => (
                <div key={label}>
                  <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                  <input type="number" value={value} onChange={e => setter(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40" />
                </div>
              ))}
              <div className="mt-3 p-3 bg-secondary rounded-lg text-xs text-muted-foreground space-y-1">
                <div className="font-medium text-foreground mb-2">Deployment Summary</div>
                <div>Client: <span className="text-foreground">{clientName || "—"}</span></div>
                <div>Agents: <span className="text-foreground">{selectedAgents.join(", ") || "—"}</span></div>
                <div>Brand Color: <span style={{ color: brandColor }}>{brandColor}</span></div>
              </div>
            </div>
          )}
          {done && (
            <div className="text-center py-6">
              <Check className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
              <div className="text-sm font-medium text-foreground mb-1">Deployment Provisioning</div>
              <div className="text-xs text-muted-foreground">API key generated and isolated instance deploying to Nuro Mesh.</div>
            </div>
          )}
        </div>

        {!done && (
          <div className="px-5 py-4 border-t border-border flex justify-between">
            <button onClick={() => step > 1 ? setStep(step - 1) : onClose()} className="px-4 py-2 bg-secondary text-muted-foreground rounded-lg text-sm hover:text-foreground transition-colors">
              {step > 1 ? "Back" : "Cancel"}
            </button>
            <button
              onClick={() => step < 3 ? setStep(step + 1) : deploy()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {step < 3 ? "Next" : "Deploy Instance"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function WhiteLabelPackaging() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const totalRevenue = DEPLOYMENTS.reduce((s, d) => s + d.monthlyRevenue, 0);
  const totalRuns = DEPLOYMENTS.reduce((s, d) => s + d.runsThisMonth, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {showModal && <NewDeploymentModal onClose={() => setShowModal(false)} />}

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">White-Label Agent Packaging</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-3.5">
          Deploy client-branded, isolated agent instances with custom capabilities, rate limits, and dedicated API keys.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="kpi-tile p-4 text-center">
          <div className="text-2xl font-display font-bold text-foreground">{DEPLOYMENTS.length}</div>
          <div className="text-xs text-muted-foreground">Active Deployments</div>
        </div>
        <div className="kpi-tile p-4 text-center">
          <div className="text-2xl font-display font-bold text-emerald-400">${totalRevenue.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Monthly Revenue</div>
        </div>
        <div className="kpi-tile p-4 text-center">
          <div className="text-2xl font-display font-bold text-foreground">{totalRuns.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Agent Runs / Month</div>
        </div>
        <div className="kpi-tile p-4 text-center">
          <div className="text-2xl font-display font-bold text-primary">{DEPLOYMENTS.filter(d => d.status === "active").length}</div>
          <div className="text-xs text-muted-foreground">Live Instances</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-foreground">Client Deployments</div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3 h-3" /> New Deployment
        </button>
      </div>

      <div className="space-y-3">
        {DEPLOYMENTS.map(d => (
          <DeploymentCard
            key={d.id}
            deployment={d}
            expanded={expandedId === d.id}
            onToggle={() => setExpandedId(expandedId === d.id ? null : d.id)}
          />
        ))}
      </div>
    </div>
  );
}
