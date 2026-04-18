import { useState } from "react";
import { Activity, ShieldAlert, Zap, CheckCircle2, XCircle, Info, Cpu } from "lucide-react";
import { sentraTwin } from "@/data/sentra-twin";
import {
  ProofEnvelope,
  type PolicyState,
  type AutonomyMode,
  type EvidenceSource,
} from "@szl-holdings/design-system";
import { cn } from "@szl-holdings/shared-ui/utils";

const ACCENT = "#ef4444";
const ISOLATION_EVIDENCE: EvidenceSource[] = [
  {
    id: "ev-inc-001",
    label: "Network Sensor — PLC-003 Outbound Traffic",
    type: "signal",
    timestamp: new Date(Date.now() - 3 * 60_000).toISOString(),
    excerpt: "Anomalous C2 beaconing detected from PLC Controller (asset-003) to known malicious IP 45.142.x.x at 3-minute intervals. Confidence: critical.",
  },
  {
    id: "ev-inc-002",
    label: "EDR — SCADA Payload Signature Match",
    type: "api",
    timestamp: new Date(Date.now() - 10 * 60_000).toISOString(),
    excerpt: "Encrypted payload on SCADA Server matched LockBit-adjacent signature (SHA-256: a3f1...c9e2). Confidence 97% malicious. Immediate isolation recommended.",
  },
];

const RESET_EVIDENCE: EvidenceSource[] = [
  {
    id: "ev-inc-003",
    label: "IAM — Credential Spray Detection",
    type: "api",
    timestamp: new Date(Date.now() - 25 * 60_000).toISOString(),
    excerpt: "14 failed login attempts on OT-Admin account from lateral IP in last 30 minutes. Pattern consistent with credential spraying targeting SCADA segment admin accounts.",
  },
];

export default function IncidentCommander() {
  const [isolationMode, setIsolationMode] = useState<AutonomyMode>("recommend");
  const [resetMode, setResetMode] = useState<AutonomyMode>("recommend");
  const activeIncident = sentraTwin.incidents[0];

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-100">Incident Commander</h1>
          <p className="text-slate-400 mt-1">Real-time containment and response orchestration</p>
        </div>
        <div className="px-4 py-2 rounded border border-red-500/40 bg-red-500/10 flex items-center gap-3">
          <Activity className="w-5 h-5 text-red-500 animate-pulse" />
          <div className="text-right">
            <div className="text-[10px] text-red-400 font-mono uppercase tracking-widest">Active Incident</div>
            <div className="text-sm font-bold text-slate-100">{activeIncident.id}</div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="sentra-panel p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-display font-bold text-slate-100">{activeIncident.title}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 font-mono">MITRE: {activeIncident.mitreStage}</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Detected {new Date(activeIncident.detectedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-slate-400 leading-relaxed">
              {activeIncident.description}
            </p>

            <div className="mt-8 space-y-4">
              <h3 className="text-xs text-slate-500 uppercase tracking-widest font-mono font-bold">Recommended Containment Actions</h3>
              
              <ProofEnvelope
                title="Isolate PLC Segment (VLAN 42)"
                accentColor={ACCENT}
                evidence={ISOLATION_EVIDENCE}
                timestamp={ISOLATION_EVIDENCE[0].timestamp}
                confidence={94}
                policyState={"allowed" as PolicyState}
                autonomyMode={isolationMode}
                onAutonomyChange={setIsolationMode}
              >
                <div className="p-4 bg-red-500/5 rounded border border-red-500/10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-red-500/20 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-red-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-200">Isolate PLC Segment (VLAN 42)</div>
                        <p className="text-xs text-slate-500">Anomalous C2 beaconing identified from PLC Controller (asset-003).</p>
                      </div>
                    </div>
                    <button className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors ml-4 shrink-0">
                      Execute Isolation
                    </button>
                  </div>
                </div>
              </ProofEnvelope>

              <ProofEnvelope
                title="Force Password Reset — OT-Admin Accounts"
                accentColor="#f59e0b"
                evidence={RESET_EVIDENCE}
                timestamp={RESET_EVIDENCE[0].timestamp}
                confidence={88}
                policyState={"requires-approval" as PolicyState}
                autonomyMode={resetMode}
                onAutonomyChange={setResetMode}
              >
                <div className="p-4 bg-amber-500/5 rounded border border-amber-500/10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-amber-500/20 flex items-center justify-center">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-200">Force Password Reset — OT-Admin</div>
                        <p className="text-xs text-slate-500">Credential spraying detected targeting admin accounts in OT segment.</p>
                      </div>
                    </div>
                    <button className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors ml-4 shrink-0">
                      Trigger Reset
                    </button>
                  </div>
                </div>
              </ProofEnvelope>
            </div>
          </div>

          <div className="sentra-panel p-6">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest font-mono mb-4">Incident Timeline</h2>
            <div className="space-y-6">
              {[
                { time: "14:12", event: "Isolation recommendation generated by Signal Mesh", type: "system" },
                { time: "14:05", event: "Anomalous C2 beacon detected from PLC-003", type: "alert" },
                { time: "13:58", event: "Ransomware payload signature matched on SCADA-01", type: "alert" },
                { time: "13:50", event: "Incident INC-2026-0891 initialized", type: "system" },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="text-xs font-mono text-slate-500 pt-1 shrink-0">{item.time}</div>
                  <div className="flex-1 pb-4 border-b border-slate-800">
                    <div className={cn(
                      "text-sm",
                      item.type === 'alert' ? "text-red-400" : "text-slate-300"
                    )}>{item.event}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="sentra-panel p-6">
            <h3 className="text-xs text-slate-500 uppercase font-mono mb-4">Affected Assets</h3>
            <div className="space-y-3">
              {activeIncident.affectedAssets.map(assetId => {
                const asset = sentraTwin.assets.find(a => a.id === assetId);
                return (
                  <div key={assetId} className="flex items-center justify-between p-3 rounded bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center gap-3">
                      <Cpu className="w-4 h-4 text-red-400" />
                      <div>
                        <div className="text-xs font-bold text-slate-200">{asset?.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{assetId}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-[9px] text-red-400 border border-red-500/20 font-bold">COMPROMISED</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="sentra-panel p-6">
            <h3 className="text-xs text-slate-500 uppercase font-mono mb-4">Commander Checklist</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Detection confirmed</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Impact scope analyzed</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-amber-400">
                <Activity className="w-4 h-4" />
                <span>Containment in progress</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <XCircle className="w-4 h-4" />
                <span>Eradication pending</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
