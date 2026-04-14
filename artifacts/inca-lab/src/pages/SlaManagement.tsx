import { useState } from "react";
import { cn } from "../lib/utils";
import {
  Shield, AlertTriangle, CheckCircle, XCircle, Clock, DollarSign,
  TrendingDown, TrendingUp, Plus, Zap, Settings, RefreshCw, Bell
} from "lucide-react";

interface SlaContract {
  agentId: string;
  agentName: string;
  domain: string;
  responseTimeP95: number;
  responseTimeP95Target: number;
  accuracyTarget: number;
  currentAccuracy: number;
  uptimeTarget: number;
  currentUptime: number;
  maxCostPerRun: number;
  currentAvgCost: number;
  complianceStatus: "compliant" | "at-risk" | "breached";
  breachCount30d: number;
  lastBreach: string | null;
  remediations: string[];
}

const CONTRACTS: SlaContract[] = [
  {
    agentId: "sentinel", agentName: "Sentinel v4", domain: "Security",
    responseTimeP95: 1840, responseTimeP95Target: 3000,
    accuracyTarget: 97, currentAccuracy: 99.1,
    uptimeTarget: 99.5, currentUptime: 99.8,
    maxCostPerRun: 0.10, currentAvgCost: 0.042,
    complianceStatus: "compliant", breachCount30d: 0, lastBreach: null,
    remediations: [],
  },
  {
    agentId: "beacon", agentName: "Beacon v3", domain: "Analytics",
    responseTimeP95: 1120, responseTimeP95Target: 2000,
    accuracyTarget: 95, currentAccuracy: 98.4,
    uptimeTarget: 99, currentUptime: 99.4,
    maxCostPerRun: 0.05, currentAvgCost: 0.028,
    complianceStatus: "compliant", breachCount30d: 0, lastBreach: null,
    remediations: [],
  },
  {
    agentId: "helmsman", agentName: "Helmsman v3", domain: "Maritime",
    responseTimeP95: 2640, responseTimeP95Target: 5000,
    accuracyTarget: 95, currentAccuracy: 97.3,
    uptimeTarget: 98.5, currentUptime: 99.1,
    maxCostPerRun: 0.15, currentAvgCost: 0.071,
    complianceStatus: "compliant", breachCount30d: 1, lastBreach: "2026-04-09 14:22",
    remediations: ["Automatic model fallback activated once on 2026-04-09"],
  },
  {
    agentId: "zeus", agentName: "Zeus v3", domain: "Infrastructure",
    responseTimeP95: 1920, responseTimeP95Target: 2000,
    accuracyTarget: 95, currentAccuracy: 88.2,
    uptimeTarget: 99, currentUptime: 97.4,
    maxCostPerRun: 0.08, currentAvgCost: 0.038,
    complianceStatus: "breached", breachCount30d: 7, lastBreach: "2026-04-13 08:45",
    remediations: ["Model swap to claude-sonnet-4-6", "Traffic throttled to 50%", "Auto-scaling triggered"],
  },
  {
    agentId: "muse", agentName: "Muse v2", domain: "Commerce",
    responseTimeP95: 5600, responseTimeP95Target: 4000,
    accuracyTarget: 88, currentAccuracy: 91.4,
    uptimeTarget: 97, currentUptime: 98.2,
    maxCostPerRun: 0.10, currentAvgCost: 0.065,
    complianceStatus: "at-risk", breachCount30d: 3, lastBreach: "2026-04-12 19:08",
    remediations: ["Latency alert triggered", "Switched to cached responses for low-priority requests"],
  },
  {
    agentId: "docminer", agentName: "DocMiner v2", domain: "Legal",
    responseTimeP95: 4200, responseTimeP95Target: 6000,
    accuracyTarget: 92, currentAccuracy: 94.8,
    uptimeTarget: 98, currentUptime: 98.9,
    maxCostPerRun: 0.08, currentAvgCost: 0.034,
    complianceStatus: "compliant", breachCount30d: 0, lastBreach: null,
    remediations: [],
  },
];

const STATUS_CONFIG = {
  compliant: { label: "Compliant", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/25", icon: CheckCircle },
  "at-risk": { label: "At Risk", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/25", icon: AlertTriangle },
  breached: { label: "Breached", color: "text-red-400", bg: "bg-red-500/10 border-red-500/25", icon: XCircle },
};

function MetricRow({ label, current, target, unit = "", higherBetter = true }: {
  label: string; current: number; target: number; unit?: string; higherBetter?: boolean;
}) {
  const pct = Math.min((current / target) * 100, 100);
  const compliant = higherBetter ? current >= target : current <= target;
  return (
    <div className="py-2">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className={cn("font-mono font-medium", compliant ? "text-emerald-400" : "text-red-400")}>
            {current}{unit}
          </span>
          <span className="text-muted-foreground">/ {target}{unit} target</span>
        </div>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(pct, 100)}%`,
            backgroundColor: compliant ? "#22c55e" : "#ef4444",
          }}
        />
      </div>
    </div>
  );
}

function SlaCard({ contract, expanded, onToggle }: { contract: SlaContract; expanded: boolean; onToggle: () => void }) {
  const cfg = STATUS_CONFIG[contract.complianceStatus];
  const Icon = cfg.icon;

  return (
    <div className={cn("inca-panel overflow-hidden", contract.complianceStatus === "breached" && "border-red-500/25")}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-secondary/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className={cn("w-4 h-4 flex-shrink-0", cfg.color)} />
          <div className="text-left">
            <div className="text-sm font-medium text-foreground">{contract.agentName}</div>
            <div className="text-xs text-muted-foreground">{contract.domain}</div>
          </div>
          <span className={cn("text-xs px-2 py-0.5 rounded border font-medium ml-2", cfg.bg, cfg.color)}>
            {cfg.label}
          </span>
          {contract.breachCount30d > 0 && (
            <span className="text-xs text-muted-foreground">{contract.breachCount30d} breach{contract.breachCount30d !== 1 ? "es" : ""} (30d)</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:grid grid-cols-4 gap-4 text-xs text-right">
            <div>
              <div className={cn("font-mono font-medium", contract.responseTimeP95 <= contract.responseTimeP95Target ? "text-emerald-400" : "text-red-400")}>
                {contract.responseTimeP95}ms
              </div>
              <div className="text-muted-foreground">P95</div>
            </div>
            <div>
              <div className={cn("font-mono font-medium", contract.currentAccuracy >= contract.accuracyTarget ? "text-emerald-400" : "text-red-400")}>
                {contract.currentAccuracy}%
              </div>
              <div className="text-muted-foreground">Accuracy</div>
            </div>
            <div>
              <div className={cn("font-mono font-medium", contract.currentUptime >= contract.uptimeTarget ? "text-emerald-400" : "text-red-400")}>
                {contract.currentUptime}%
              </div>
              <div className="text-muted-foreground">Uptime</div>
            </div>
            <div>
              <div className={cn("font-mono font-medium", contract.currentAvgCost <= contract.maxCostPerRun ? "text-emerald-400" : "text-red-400")}>
                ${contract.currentAvgCost.toFixed(3)}
              </div>
              <div className="text-muted-foreground">Avg Cost</div>
            </div>
          </div>
          <span className="text-muted-foreground">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/40 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">SLA Metrics</div>
              <MetricRow label="P95 Response Time" current={contract.responseTimeP95} target={contract.responseTimeP95Target} unit="ms" higherBetter={false} />
              <MetricRow label="Accuracy" current={contract.currentAccuracy} target={contract.accuracyTarget} unit="%" />
              <MetricRow label="Uptime" current={contract.currentUptime} target={contract.uptimeTarget} unit="%" />
              <MetricRow label="Cost Per Run" current={contract.currentAvgCost} target={contract.maxCostPerRun} unit="$" higherBetter={false} />
            </div>

            <div>
              {contract.lastBreach && (
                <div className="mb-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Last Breach</div>
                  <div className="bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-400 font-mono">{contract.lastBreach}</div>
                </div>
              )}
              {contract.remediations.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Auto-Remediations</div>
                  <div className="space-y-1.5">
                    {contract.remediations.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <RefreshCw className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Actions</div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1 px-2.5 py-1.5 bg-primary/10 border border-primary/25 text-primary rounded text-xs hover:bg-primary/15 transition-colors">
                    <Settings className="w-3 h-3" /> Edit SLA
                  </button>
                  <button className="flex items-center gap-1 px-2.5 py-1.5 bg-secondary border border-border text-muted-foreground rounded text-xs hover:text-foreground transition-colors">
                    <Bell className="w-3 h-3" /> Alert Rules
                  </button>
                  {contract.complianceStatus === "breached" && (
                    <button className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/25 text-amber-400 rounded text-xs hover:bg-amber-500/15 transition-colors">
                      <Zap className="w-3 h-3" /> Force Failover
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SlaManagement() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewSla, setShowNewSla] = useState(false);

  const compliant = CONTRACTS.filter(c => c.complianceStatus === "compliant").length;
  const atRisk = CONTRACTS.filter(c => c.complianceStatus === "at-risk").length;
  const breached = CONTRACTS.filter(c => c.complianceStatus === "breached").length;
  const totalBreaches = CONTRACTS.reduce((s, c) => s + c.breachCount30d, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">Agent SLA Management</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-3.5">
          Define per-agent SLA contracts, monitor compliance, receive breach alerts, and trigger auto-remediation.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="kpi-tile p-4 text-center">
          <div className="text-2xl font-display font-bold text-emerald-400">{compliant}</div>
          <div className="text-xs text-muted-foreground">Compliant</div>
        </div>
        <div className="kpi-tile p-4 text-center">
          <div className="text-2xl font-display font-bold text-amber-400">{atRisk}</div>
          <div className="text-xs text-muted-foreground">At Risk</div>
        </div>
        <div className="kpi-tile p-4 text-center">
          <div className={cn("text-2xl font-display font-bold", breached > 0 ? "text-red-400" : "text-foreground")}>{breached}</div>
          <div className="text-xs text-muted-foreground">Breached</div>
        </div>
        <div className="kpi-tile p-4 text-center">
          <div className="text-2xl font-display font-bold text-foreground">{totalBreaches}</div>
          <div className="text-xs text-muted-foreground">Breaches (30d)</div>
        </div>
      </div>

      {breached > 0 && (
        <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/25 rounded-lg flex items-center gap-3">
          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-red-400">SLA Breach Detected</div>
            <div className="text-xs text-muted-foreground mt-0.5">{CONTRACTS.filter(c => c.complianceStatus === "breached").map(c => c.agentName).join(", ")} — auto-remediation in progress</div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-foreground">SLA Contracts ({CONTRACTS.length})</div>
        <button
          onClick={() => setShowNewSla(!showNewSla)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/25 text-primary rounded-lg text-xs font-medium hover:bg-primary/15 transition-colors"
        >
          <Plus className="w-3 h-3" /> New SLA Contract
        </button>
      </div>

      {showNewSla && (
        <div className="inca-panel p-4 mb-4 animate-fade-in">
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">New SLA Contract</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Agent", type: "select" },
              { label: "P95 Target (ms)", type: "number", placeholder: "3000" },
              { label: "Accuracy Target (%)", type: "number", placeholder: "95" },
              { label: "Uptime Target (%)", type: "number", placeholder: "99" },
              { label: "Max Cost/Run ($)", type: "number", placeholder: "0.10" },
              { label: "Alert Email", type: "text", placeholder: "ops@szl.com" },
            ].map(f => (
              <div key={f.label}>
                <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                {f.type === "select" ? (
                  <select className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
                    {CONTRACTS.map(c => <option key={c.agentId}>{c.agentName}</option>)}
                  </select>
                ) : (
                  <input type={f.type} placeholder={f.placeholder} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40" />
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Save Contract</button>
            <button onClick={() => setShowNewSla(false)} className="px-4 py-2 bg-secondary text-muted-foreground rounded-lg text-sm hover:text-foreground transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {[...CONTRACTS].sort((a, b) => {
          const order = { breached: 0, "at-risk": 1, compliant: 2 };
          return order[a.complianceStatus] - order[b.complianceStatus];
        }).map(contract => (
          <SlaCard
            key={contract.agentId}
            contract={contract}
            expanded={expandedId === contract.agentId}
            onToggle={() => setExpandedId(expandedId === contract.agentId ? null : contract.agentId)}
          />
        ))}
      </div>
    </div>
  );
}
