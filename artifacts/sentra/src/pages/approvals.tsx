import { useState } from "react";
import { Shield, CheckCircle2, XCircle, Clock, AlertTriangle, Bot, RotateCcw, FileText } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

interface ApprovalItem {
  id: string;
  title: string;
  requestedBy: string;
  requestedAt: string;
  tier: "critical" | "elevated" | "standard";
  domain: "agent-mesh" | "ot-response" | "control-drift";
  description: string;
  proofHash: string;
  status: "pending" | "approved" | "rejected";
}

const INITIAL_APPROVALS: ApprovalItem[] = [
  {
    id: "apr-001",
    title: "Rotate GITHUB_TOKEN — Scope to Read-Only",
    requestedBy: "Mesh Engine",
    requestedAt: new Date(Date.now() - 3 * 60_000).toISOString(),
    tier: "critical",
    domain: "agent-mesh",
    description: "Rotate the exposed GITHUB_TOKEN found in claude_desktop_config.json. New token will be scoped to read-only, removing push and PR creation capabilities from all agent runtimes pending re-authorization.",
    proofHash: "0x3a9f...c1d8",
    status: "pending",
  },
  {
    id: "apr-002",
    title: "Quarantine ext-scraper-v2 MCP Server — Revoke Codex Access",
    requestedBy: "Mesh Engine",
    requestedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    tier: "critical",
    domain: "agent-mesh",
    description: "Remove mcp-ext-scraper from all runtime configs and block the package from installation. Codex CLI will lose MCP connectivity until a replacement server is approved. Unexpected egress to collect.ext-scraper.io was confirmed.",
    proofHash: "0x7b2e...f094",
    status: "pending",
  },
  {
    id: "apr-003",
    title: "Deploy OT-Segment Isolation — Ransomware Response",
    requestedBy: "CISO (Admin)",
    requestedAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
    tier: "critical",
    domain: "ot-response",
    description: "Isolate compromised SCADA segment from ERP cluster to prevent ransomware lateral movement. Estimated $1.4M loss avoidance. Network firewall rules and VLAN changes required.",
    proofHash: "0x8d1e...a290",
    status: "approved",
  },
  {
    id: "apr-004",
    title: "Pin MCP Package Versions — Supply Chain Hardening",
    requestedBy: "Mesh Engine",
    requestedAt: new Date(Date.now() - 90 * 60_000).toISOString(),
    tier: "elevated",
    domain: "agent-mesh",
    description: "Update all MCP server configurations to use exact version pins: @modelcontextprotocol/server-github@2.1.0, server-brave-search@0.6.1, server-sequential-thinking@0.9.0. Prevents malicious version injection.",
    proofHash: "0x5c12...8a3f",
    status: "pending",
  },
];

const TIER_STYLES: Record<string, string> = {
  critical: "text-red-400 border-red-500/30 bg-red-500/10",
  elevated: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  standard: "text-sky-400 border-sky-500/30 bg-sky-500/10",
};

const DOMAIN_ICON: Record<string, typeof Bot> = {
  "agent-mesh": Bot,
  "ot-response": AlertTriangle,
  "control-drift": Shield,
};

export default function Approvals() {
  const [items, setItems] = useState(INITIAL_APPROVALS);

  function act(id: string, action: "approved" | "rejected") {
    setItems(prev => prev.map(a => a.id === id ? { ...a, status: action } : a));
  }

  const pending = items.filter(a => a.status === "pending");
  const resolved = items.filter(a => a.status !== "pending");

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-100">Guardian Approvals</h1>
          <p className="text-slate-400 mt-1">Policy-gated action queue — all high-impact changes require principal review</p>
        </div>
        <div className="flex gap-3">
          <div className="sentra-panel px-4 py-2 text-center">
            <div className="text-[10px] text-slate-500 font-mono uppercase">Pending</div>
            <div className="text-2xl font-display font-bold text-amber-400">{pending.length}</div>
          </div>
        </div>
      </header>

      {pending.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-display font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            Awaiting Decision
          </h2>
          {pending.map(item => {
            const Icon = DOMAIN_ICON[item.domain] ?? Shield;
            return (
              <div key={item.id} className="sentra-panel p-6 border-amber-500/10">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-100">{item.title}</h3>
                          <span className={cn("px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border", TIER_STYLES[item.tier])}>
                            {item.tier}
                          </span>
                          {item.domain === "agent-mesh" && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono border text-sky-400 border-sky-500/20 bg-sky-500/10">
                              agent-mesh
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mb-3">
                          Requested by {item.requestedBy} · {new Date(item.requestedAt).toLocaleTimeString()}
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed mb-4">{item.description}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                          <FileText className="w-3 h-3" />
                          ProofEnvelope: {item.proofHash}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-5 pt-4 border-t border-slate-800">
                      <button
                        onClick={() => act(item.id, "approved")}
                        className="flex items-center gap-2 px-5 py-2 rounded bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-sm font-bold transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => act(item.id, "rejected")}
                        className="flex items-center gap-2 px-5 py-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 text-sm font-bold transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {resolved.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-display font-bold text-slate-500 uppercase tracking-wider">Resolved</h2>
          {resolved.map(item => (
            <div key={item.id} className="sentra-panel p-5 opacity-60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {item.status === "approved" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-slate-500" />
                  )}
                  <div>
                    <div className="text-sm font-bold text-slate-300">{item.title}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{item.requestedBy} · {new Date(item.requestedAt).toLocaleTimeString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {item.domain === "agent-mesh" && (
                    <span className="text-[10px] font-mono text-sky-500/60">agent-mesh</span>
                  )}
                  <span className={cn(
                    "px-2 py-0.5 rounded border text-[10px] font-mono font-bold",
                    item.status === "approved"
                      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                      : "text-slate-500 border-slate-700 bg-slate-800"
                  )}>
                    {item.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
