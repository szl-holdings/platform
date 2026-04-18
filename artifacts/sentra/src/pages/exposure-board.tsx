import { useState } from "react";
import { ShieldAlert, Zap, TrendingUp, FileText, Globe } from "lucide-react";
import { sentraTwin } from "@/data/sentra-twin";
import {
  ProofEnvelope,
  type PolicyState,
  type AutonomyMode,
  type EvidenceSource,
} from "@szl-holdings/design-system";

const ACCENT = "#ef4444";
const EXPOSURE_EVIDENCE: EvidenceSource[] = [
  {
    id: "ev-exp-001",
    label: "Threat Intel — TA-2891 Probability Model",
    type: "model",
    timestamp: new Date(Date.now() - 20 * 60_000).toISOString(),
    excerpt: "Monte Carlo simulation (10,000 runs) estimates 92% probability of lateral movement to ERP cluster if SCADA segment remains unsegmented. Expected loss: $1.4M.",
  },
  {
    id: "ev-exp-002",
    label: "Insurance Policy Engine — Cyber Coverage Check",
    type: "api",
    timestamp: new Date(Date.now() - 45 * 60_000).toISOString(),
    excerpt: "Cyber policy CHR-2024-991 section 8.3 requires verified backup cadence ≤ 24h. Current status: 2 critical servers at 72h+ backup age. Policy clause at risk.",
  },
];

export default function ExposureBoard() {
  const [autonomyMode, setAutonomyMode] = useState<AutonomyMode>("recommend");

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-display font-bold text-slate-100">Exposure Board</h1>
        <p className="text-slate-400 mt-1">Financial impact modeling and vulnerability prioritization</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 sentra-panel p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-lg font-display font-bold text-slate-200">Financial Exposure at Risk</h2>
              <p className="text-sm text-slate-500">Aggregate potential loss based on current compromise</p>
            </div>
            <div className="text-5xl font-display font-bold text-red-500">
              $2.8M
            </div>
          </div>

          <div className="h-64 w-full flex items-end gap-2 px-4 mb-4">
            {[45, 62, 88, 72, 95, 28, 54].map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-red-500/20 border-t-2 border-red-500 transition-all duration-1000" 
                  style={{ height: `${v}%` }} 
                />
                <span className="text-[10px] text-slate-600 font-mono">T-{7-i}D</span>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between text-[10px] text-slate-500 font-mono px-4 border-t border-slate-800 pt-4">
            <span>7 DAY EXPOSURE TREND</span>
            <span className="text-red-400">↑ 14% SINCE LAST INCIDENT</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="sentra-panel p-6">
            <h3 className="text-xs text-slate-500 uppercase font-mono mb-4 flex items-center gap-2">
              <ShieldAlert className="w-3 h-3" />
              Top CVE Findings
            </h3>
            <div className="space-y-4">
              <div className="p-3 rounded bg-slate-800/50 border border-slate-700">
                <div className="flex justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-200 font-mono">CVE-2026-1182</span>
                  <span className="text-[10px] text-red-400 font-bold">9.8 CRITICAL</span>
                </div>
                <p className="text-[10px] text-slate-500">Remote Code Execution on legacy SCADA systems via malformed packet.</p>
              </div>
              <div className="p-3 rounded bg-slate-800/50 border border-slate-700">
                <div className="flex justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-200 font-mono">CVE-2025-0842</span>
                  <span className="text-[10px] text-amber-400 font-bold">8.1 HIGH</span>
                </div>
                <p className="text-[10px] text-slate-500">Authentication bypass in HMI control plane web server.</p>
              </div>
            </div>
          </div>

          <div className="sentra-panel p-6">
            <h3 className="text-xs text-slate-500 uppercase font-mono mb-4 flex items-center gap-2">
              <Globe className="w-3 h-3" />
              Insurance Posture
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Coverage Limit</span>
                <span className="text-slate-300 font-mono">$10.0M</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Retention</span>
                <span className="text-slate-300 font-mono">$500K</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-xs font-bold">
                <span className="text-slate-200">Policy Compliance</span>
                <span className="text-amber-400">FAIL (Backup Staleness)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-display font-bold text-slate-200">Recommended Cost Avoidance Actions</h2>
        
        <ProofEnvelope
          title="Deploy OT-Segment Isolation — Estimated $1.4M Savings"
          accentColor={ACCENT}
          evidence={EXPOSURE_EVIDENCE}
          timestamp={EXPOSURE_EVIDENCE[0].timestamp}
          confidence={91}
          policyState={"requires-approval" as PolicyState}
          autonomyMode={autonomyMode}
          onAutonomyChange={setAutonomyMode}
        >
          <div className="sentra-panel p-6">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded bg-red-500/10 flex items-center justify-center shrink-0">
                  <Zap className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100">Deploy OT-Segment Isolation</h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                    By isolating the compromised SCADA segment, we avoid a 92% probability of ransomware spread to the ERP cluster, preventing an additional $1.4M in operational downtime.
                  </p>
                  <div className="flex items-center gap-6 mt-4 text-[10px] font-mono text-slate-500">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      ESTIMATED SAVINGS: $1.4M
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-3 h-3" />
                      EVIDENCE: PROBABILITY MODEL TA-2891
                    </div>
                  </div>
                </div>
              </div>
              <button className="px-6 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors ml-4 shrink-0">
                Approve & Deploy
              </button>
            </div>
          </div>
        </ProofEnvelope>
      </div>
    </div>
  );
}
