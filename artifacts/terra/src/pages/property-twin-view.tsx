import { useState, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Activity,
  Shield,
  AlertTriangle,
  Link as LinkIcon,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  TrendingUp,
  History,
  Info,
  ExternalLink,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";
import { propertyTwins } from "@/data/property-twin";
import { ProofEnvelope, ConfidenceMeter, PolicyStateChip } from "@szl-holdings/design-system";
import { cn } from "@szl-holdings/shared-ui/utils";

const property = propertyTwins.find(p => p.id === "twin-004")!;

export default function PropertyTwinView() {
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(property.escalationWorkflows?.[0]?.id || null);

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#c8a060]" />
            Property Digital Twin
          </h1>
          <p className="text-white/40 text-sm mt-1">{property.name} • {property.address}, {property.city}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            Distress Score: {property.distressScore}
          </div>
          <PolicyStateChip state="requires-approval" />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Connectors & Timeline */}
        <div className="lg:col-span-8 space-y-6">
          {/* External Connectors */}
          <section className="bg-[#0a0c10] border border-white/5 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-blue-400" />
              External Connector Fabric
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {property.externalDataConnectors.map((connector) => (
                <div 
                  key={connector.id} 
                  className="bg-white/[0.02] border border-white/5 rounded-lg p-3 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">{connector.name}</span>
                    {connector.status === "connected" ? (
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                    ) : connector.status === "error" ? (
                      <XCircle className="w-3 h-3 text-rose-500" />
                    ) : (
                      <Clock className="w-3 h-3 text-white/20" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded",
                      connector.status === "connected" ? "bg-emerald-500/10 text-emerald-400" :
                      connector.status === "error" ? "bg-rose-500/10 text-rose-400" :
                      "bg-white/5 text-white/30"
                    )}>
                      {connector.status.replace("_", " ")}
                    </span>
                    {connector.lastSyncAt && (
                      <span className="text-[9px] text-white/20">
                        {new Date(connector.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Distress History Timeline */}
          <section className="bg-[#0a0c10] border border-white/5 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white/70 mb-6 flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              Signal Mesh History
            </h2>
            <div className="space-y-6 relative before:absolute before:inset-0 before:left-[11px] before:w-px before:bg-white/5">
              {property.distressHistory?.map((signal) => (
                <div key={signal.id} className="relative pl-8">
                  <div className={cn(
                    "absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#0a0c10] z-10",
                    signal.severity === "critical" ? "bg-rose-500" : "bg-amber-500"
                  )}>
                    <Activity className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white/90">{signal.summary}</span>
                      <span className="text-[10px] text-white/30 font-mono">
                        {new Date(signal.occurredAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded",
                        signal.severity === "critical" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"
                      )}>
                        {signal.type.replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-white/40 italic">System: Distress Engine V4</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Workflow Card */}
        <div className="lg:col-span-4">
          <section className="sticky top-6">
            <ProofEnvelope
              title="Distress Escalation"
              confidence={0.89}
              timestamp={new Date()}
              evidence={[
                { id: "e1", label: "City Assessor Link", type: "api" },
                { id: "e2", label: "Financial Distress Signal", type: "signal" },
                { id: "e3", label: "ACRIS Lien Report", type: "document" }
              ]}
              policyState="requires-approval"
              autonomyMode="recommend"
            >
              <div className="space-y-4 pt-2">
                <div className="p-3 bg-white/[0.03] border border-white/5 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white/70">
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                    AI Recommendation
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Initiate immediate debt restructuring and emergency maintenance funding to preserve asset value.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center justify-between">
                    Evidence Chain
                    <span className="text-emerald-400">3 Signals Linked</span>
                  </div>
                  <div className="space-y-1.5">
                    {["Tax lien filed (critical)", "Occupancy dropped below 70%", "Deferred maintenance exceeding $500k"].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] text-white/60 bg-white/[0.02] p-2 rounded border border-white/5">
                        <CheckCircle className="w-3 h-3 text-emerald-500/50" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Approve
                  </button>
                  <button className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold py-2.5 rounded-lg border border-white/10 transition-colors flex items-center justify-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    Escalate
                  </button>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between text-[10px] text-white/20">
                    <span>Generated by Atlas-L4</span>
                    <span className="flex items-center gap-1 font-mono">
                      CONFIDENCE: 89%
                    </span>
                  </div>
                </div>
              </div>
            </ProofEnvelope>
          </section>
        </div>
      </div>
    </div>
  );
}
