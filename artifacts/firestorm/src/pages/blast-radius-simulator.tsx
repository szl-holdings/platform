import { useState } from "react";
import {
  Zap, Shield, Server, Database, Globe, Network, Monitor, Lock, Users,
  AlertTriangle, CheckCircle, ChevronRight, Eye, TrendingUp, Activity,
  Package, Cloud, Cpu, ArrowRight
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

const BG = "#070A10";
const CARD = "#0c1220";
const BORDER = "#1a2235";

type ChangeType = "firewall-rule" | "patch" | "config" | "access-policy" | "segment";

interface SimChange {
  id: string;
  type: ChangeType;
  title: string;
  description: string;
  scope: string;
  estimatedRisk: "reduce" | "increase" | "neutral";
}

interface AssetNode {
  id: string;
  label: string;
  type: "endpoint" | "server" | "database" | "cloud" | "network" | "identity";
  currentExposure: number;
  afterExposure: number;
  impactClass: "protected" | "exposed" | "unchanged" | "reduced";
  vulnerabilities: string[];
}

const CHANGES: SimChange[] = [
  {
    id: "fw-block-smb",
    type: "firewall-rule",
    title: "Block SMB (445) East-West",
    description: "Add firewall rule blocking SMB port 445 between workstation VLAN and server VLAN to prevent lateral movement via EternalBlue/WannaCry style attacks.",
    scope: "All workstations → server VLAN",
    estimatedRisk: "reduce",
  },
  {
    id: "patch-dc",
    type: "patch",
    title: "Emergency Patch DC — CVE-2024-21447",
    description: "Apply out-of-band patch for critical privilege escalation vulnerability on all domain controllers. Requires maintenance window and reboot.",
    scope: "4 domain controllers",
    estimatedRisk: "reduce",
  },
  {
    id: "disable-rdp",
    type: "config",
    title: "Disable RDP — Production Servers",
    description: "Remove RDP access from internet-facing jump servers, replacing with PAM-enforced SSH sessions. All 14 server admins affected.",
    scope: "14 production servers",
    estimatedRisk: "reduce",
  },
  {
    id: "new-fw-rule",
    type: "firewall-rule",
    title: "Open SFTP — Vendor Integration",
    description: "Open inbound SFTP (port 22) from vendor IP range 203.0.113.0/24 to internal file transfer server. Required for new payroll integration.",
    scope: "FTP-PROD-01",
    estimatedRisk: "increase",
  },
  {
    id: "remove-admin",
    type: "access-policy",
    title: "Remove Local Admin — Workstations",
    description: "Remove local administrator rights from 847 standard user accounts. All software install requests routed through PAM approval workflow.",
    scope: "847 workstations",
    estimatedRisk: "reduce",
  },
];

const generateAssets = (changeId: string): AssetNode[] => {
  const base: AssetNode[] = [
    { id: "wks", label: "Workstations (847)", type: "endpoint", currentExposure: 72, afterExposure: 72, impactClass: "unchanged", vulnerabilities: ["Local Admin Abuse", "SMB Lateral Movement"] },
    { id: "srv-app", label: "App Servers (12)", type: "server", currentExposure: 58, afterExposure: 58, impactClass: "unchanged", vulnerabilities: ["Unpatched RDP", "Credential Spray"] },
    { id: "dc", label: "Domain Controllers (4)", type: "server", currentExposure: 81, afterExposure: 81, impactClass: "unchanged", vulnerabilities: ["CVE-2024-21447", "LSASS Dump"] },
    { id: "db", label: "Databases (6)", type: "database", currentExposure: 44, afterExposure: 44, impactClass: "unchanged", vulnerabilities: ["Overprivileged SvcAccounts"] },
    { id: "cloud-idp", label: "Azure AD / Okta", type: "identity", currentExposure: 65, afterExposure: 65, impactClass: "unchanged", vulnerabilities: ["MFA Bypass Risk", "Stale Accounts"] },
    { id: "sftp", label: "File Transfer Server", type: "server", currentExposure: 30, afterExposure: 30, impactClass: "unchanged", vulnerabilities: ["Weak SSH Config"] },
    { id: "inet", label: "Internet Exposure", type: "network", currentExposure: 55, afterExposure: 55, impactClass: "unchanged", vulnerabilities: ["Attack Surface"] },
  ];

  switch (changeId) {
    case "fw-block-smb":
      return base.map((a) =>
        a.id === "wks" ? { ...a, afterExposure: 45, impactClass: "reduced", vulnerabilities: a.vulnerabilities.filter((v) => !v.includes("SMB")) } :
        a.id === "srv-app" ? { ...a, afterExposure: 35, impactClass: "reduced" } :
        a.id === "dc" ? { ...a, afterExposure: 62, impactClass: "reduced" } : a
      );
    case "patch-dc":
      return base.map((a) =>
        a.id === "dc" ? { ...a, afterExposure: 41, impactClass: "reduced", vulnerabilities: a.vulnerabilities.filter((v) => !v.includes("CVE")) } :
        a.id === "wks" ? { ...a, afterExposure: 60, impactClass: "reduced" } : a
      );
    case "disable-rdp":
      return base.map((a) =>
        a.id === "srv-app" ? { ...a, afterExposure: 28, impactClass: "reduced", vulnerabilities: a.vulnerabilities.filter((v) => !v.includes("RDP")) } :
        a.id === "inet" ? { ...a, afterExposure: 32, impactClass: "reduced" } : a
      );
    case "new-fw-rule":
      return base.map((a) =>
        a.id === "sftp" ? { ...a, afterExposure: 78, impactClass: "exposed", vulnerabilities: [...a.vulnerabilities, "New External Exposure", "Vendor Account Risk"] } :
        a.id === "db" ? { ...a, afterExposure: 62, impactClass: "exposed" } :
        a.id === "inet" ? { ...a, afterExposure: 72, impactClass: "exposed" } : a
      );
    case "remove-admin":
      return base.map((a) =>
        a.id === "wks" ? { ...a, afterExposure: 38, impactClass: "reduced", vulnerabilities: a.vulnerabilities.filter((v) => !v.includes("Admin")) } :
        a.id === "dc" ? { ...a, afterExposure: 65, impactClass: "reduced" } : a
      );
    default:
      return base;
  }
};

function ExposureBar({ current, after, label }: { current: number; after: number; label: string }) {
  const isReduced = after < current;
  const isIncreased = after > current;
  const delta = after - current;
  const barColor = isIncreased ? "#ef4444" : isReduced ? "#22c55e" : "#64748b";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[9px]">
        <span className="text-slate-400">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-mono">{current}%</span>
          <ArrowRight className="w-2.5 h-2.5 text-slate-600" />
          <span className="font-mono font-semibold" style={{ color: barColor }}>{after}%</span>
          {delta !== 0 && (
            <span className="font-mono text-[8px]" style={{ color: barColor }}>
              ({delta > 0 ? "+" : ""}{delta}%)
            </span>
          )}
        </div>
      </div>
      <div className="relative h-2 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div className="h-full rounded-full opacity-40" style={{ width: `${current}%`, background: "#64748b" }} />
        <div
          className="absolute top-0 h-full rounded-full transition-all"
          style={{ width: `${after}%`, background: barColor, opacity: 0.8 }}
        />
      </div>
    </div>
  );
}

function BlastRadiusVisual({ assets }: { assets: AssetNode[] }) {
  const exposed = assets.filter((a) => a.impactClass === "exposed");
  const reduced = assets.filter((a) => a.impactClass === "reduced");
  const unchanged = assets.filter((a) => a.impactClass === "unchanged");

  const typeIcons: Record<string, typeof Server> = {
    endpoint: Monitor,
    server: Server,
    database: Database,
    cloud: Cloud,
    network: Network,
    identity: Users,
  };

  const impactColors: Record<string, { bg: string; border: string; text: string }> = {
    exposed: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", text: "#ef4444" },
    reduced: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.25)", text: "#22c55e" },
    unchanged: { bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.06)", text: "#64748b" },
    protected: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.25)", text: "#22c55e" },
  };

  return (
    <div className="rounded-lg border p-5" style={{ background: CARD, borderColor: BORDER }}>
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-semibold text-slate-100">Blast Radius Visualization</span>
        <div className="ml-auto flex gap-3 text-[9px]">
          <span className="flex items-center gap-1 text-red-400"><span className="w-2 h-2 rounded-sm bg-red-400 opacity-60" /> Newly Exposed</span>
          <span className="flex items-center gap-1 text-green-400"><span className="w-2 h-2 rounded-sm bg-green-400 opacity-60" /> Risk Reduced</span>
          <span className="flex items-center gap-1 text-slate-500"><span className="w-2 h-2 rounded-sm bg-slate-500 opacity-40" /> Unchanged</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {assets.map((asset) => {
          const Icon = typeIcons[asset.type] ?? Server;
          const cfg = impactColors[asset.impactClass];
          const delta = asset.afterExposure - asset.currentExposure;
          return (
            <div key={asset.id} className="rounded-lg p-3 transition-all" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: cfg.text }} />
                <span className="text-[10px] font-medium text-slate-200 truncate">{asset.label}</span>
              </div>
              <ExposureBar current={asset.currentExposure} after={asset.afterExposure} label="Risk Score" />
              {asset.vulnerabilities.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {asset.vulnerabilities.slice(0, 2).map((v) => (
                    <span key={v} className="text-[8px] px-1 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.04)", color: "#64748b" }}>
                      {v}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-md p-3 text-center" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
          <div className="text-lg font-bold font-mono text-green-400">{reduced.length}</div>
          <div className="text-[9px] text-slate-500">Assets hardened</div>
        </div>
        <div className="rounded-md p-3 text-center" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <div className="text-lg font-bold font-mono text-red-400">{exposed.length}</div>
          <div className="text-[9px] text-slate-500">Assets exposed</div>
        </div>
        <div className="rounded-md p-3 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-lg font-bold font-mono text-slate-400">{unchanged.length}</div>
          <div className="text-[9px] text-slate-500">Unchanged</div>
        </div>
      </div>
    </div>
  );
}

export default function BlastRadiusSimulator() {
  const [selectedChange, setSelectedChange] = useState<string>("fw-block-smb");
  const [confirmed, setConfirmed] = useState(false);

  const change = CHANGES.find((c) => c.id === selectedChange) ?? CHANGES[0];
  const assets = generateAssets(selectedChange);

  const riskBefore = Math.round(assets.reduce((s, a) => s + a.currentExposure, 0) / assets.length);
  const riskAfter = Math.round(assets.reduce((s, a) => s + a.afterExposure, 0) / assets.length);
  const delta = riskAfter - riskBefore;
  const deltaColor = delta < 0 ? "#22c55e" : delta > 0 ? "#ef4444" : "#64748b";

  const changeTypeColors: Record<ChangeType, { color: string; bg: string; label: string }> = {
    "firewall-rule": { color: "#f97316", bg: "rgba(249,115,22,0.1)", label: "Firewall Rule" },
    "patch": { color: "#22c55e", bg: "rgba(34,197,94,0.1)", label: "Security Patch" },
    "config": { color: "#3b82f6", bg: "rgba(59,130,246,0.1)", label: "Configuration" },
    "access-policy": { color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", label: "Access Policy" },
    "segment": { color: "#14b8a6", bg: "rgba(20,184,166,0.1)", label: "Segmentation" },
  };

  return (
    <div className="flex h-full" style={{ background: BG }}>
      <div className="w-80 shrink-0 flex flex-col border-r overflow-y-auto" style={{ borderColor: BORDER }}>
        <div className="p-5 border-b" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-amber-400" />
            <h1 className="text-sm font-bold text-slate-100">Blast Radius Simulator</h1>
          </div>
          <p className="text-[10px] text-slate-500">Model security impact of any change before it happens</p>
        </div>
        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          {CHANGES.map((c) => {
            const selected = c.id === selectedChange;
            const cfg = changeTypeColors[c.type];
            return (
              <button
                key={c.id}
                onClick={() => { setSelectedChange(c.id); setConfirmed(false); }}
                className="w-full text-left rounded-lg border p-3 transition-all"
                style={{
                  background: selected ? "rgba(59,130,246,0.06)" : CARD,
                  border: selected ? "1px solid rgba(59,130,246,0.3)" : `1px solid ${BORDER}`,
                }}
              >
                <div className="flex items-start gap-2">
                  <div className="flex flex-col gap-1 flex-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-medium w-fit" style={{ color: cfg.color, background: cfg.bg }}>{cfg.label}</span>
                    <div className="text-[10px] font-medium text-slate-200">{c.title}</div>
                    <div className="text-[9px] text-slate-500">{c.scope}</div>
                  </div>
                  <div className={cn("w-2 h-2 rounded-full mt-1 shrink-0", c.estimatedRisk === "reduce" ? "bg-green-400" : c.estimatedRisk === "increase" ? "bg-red-400" : "bg-slate-500")} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="rounded-lg border p-5" style={{ background: CARD, borderColor: BORDER }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ color: changeTypeColors[change.type].color, background: changeTypeColors[change.type].bg }}>
                  {changeTypeColors[change.type].label}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-100 mb-1">{change.title}</h2>
              <p className="text-[11px] text-slate-400 leading-relaxed max-w-xl">{change.description}</p>
            </div>
            <div className="text-right ml-4 shrink-0">
              <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Avg Risk Score</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold font-mono text-slate-400">{riskBefore}%</span>
                <ArrowRight className="w-4 h-4 text-slate-600" />
                <span className="text-2xl font-bold font-mono" style={{ color: deltaColor }}>{riskAfter}%</span>
              </div>
              <div className="text-[10px] font-mono mt-0.5" style={{ color: deltaColor }}>
                {delta > 0 ? "+" : ""}{delta}% risk {delta < 0 ? "reduction" : delta > 0 ? "increase" : "change"}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => setConfirmed(!confirmed)}
              className="flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-medium transition-all"
              style={{
                background: confirmed ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)",
                color: confirmed ? "#22c55e" : "#64748b",
                border: `1px solid ${confirmed ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              {confirmed ? <CheckCircle className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {confirmed ? "Simulation Approved" : "Approve Change (Simulation)"}
            </button>
            <span className="text-[9px] text-slate-500">Scope: {change.scope}</span>
          </div>
        </div>

        <BlastRadiusVisual assets={assets} />

        <div className="rounded-lg border p-5" style={{ background: CARD, borderColor: BORDER }}>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-slate-100">Security Impact Assessment</span>
          </div>
          <div className="space-y-3">
            {change.estimatedRisk === "reduce" ? (
              <>
                <div className="p-3 rounded-md" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
                  <div className="text-[9px] uppercase tracking-widest text-green-400 mb-1">Risk Reduction Analysis</div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    This change is projected to reduce your overall attack surface exposure by <span className="text-green-400 font-semibold">{Math.abs(delta)}%</span>. Primary mitigation is lateral movement prevention — an adversary who gains initial access will face significantly more segmentation barriers.
                  </p>
                </div>
                <div className="p-3 rounded-md" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)" }}>
                  <div className="text-[9px] uppercase tracking-widest text-amber-400 mb-1">Residual Risk</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Residual risk remains in identity plane — compromised cloud credentials would bypass this control. Recommend pairing with Conditional Access enforcement and privileged identity management.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 rounded-md" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <div className="text-[9px] uppercase tracking-widest text-red-400 mb-1">Risk Increase Warning</div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    This change introduces a new external attack vector. Exposure increases by <span className="text-red-400 font-semibold">{delta}%</span>. Recommend IP allowlisting, certificate-based SSH authentication, and enhanced logging on the file transfer server before deployment.
                  </p>
                </div>
                <div className="p-3 rounded-md" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)" }}>
                  <div className="text-[9px] uppercase tracking-widest text-blue-400 mb-1">Compensating Controls Recommended</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Deploy a WAF or reverse proxy with rate limiting in front of the SFTP endpoint. Enable fail2ban and restrict banner information disclosure. Create a dedicated monitoring rule in your SIEM for this connection.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
