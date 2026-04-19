import { ConfidenceMeter, PolicyStateChip, ProofEnvelope } from "@szl-holdings/design-system";
import { 
  Building2, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  CheckCircle
} from "lucide-react";
import { useState } from "react";
import { CASTELLANO_ESTATE_TWIN, type PropertyTwin, type EstateRecommendation, type SystemCheck, type VendorTwin } from "../data/property-twin";

export default function ReadinessChecklistPage() {
  const [twin, setTwin] = useState<PropertyTwin>(CASTELLANO_ESTATE_TWIN);
  const [isSimulationActive, setIsSimulationActive] = useState(false);

  const toggleSimulation = () => {
    setIsSimulationActive(!isSimulationActive);
    if (!isSimulationActive) {
      // Simulate vendor outage
      setTwin({
        ...CASTELLANO_ESTATE_TWIN,
        readinessScore: 48,
        vendors: CASTELLANO_ESTATE_TWIN.vendors.map((v: VendorTwin) => 
          v.name === "BlueWave Pool Services" ? { ...v, status: "offline" } : v
        ),
        recommendations: [
          ...CASTELLANO_ESTATE_TWIN.recommendations,
          {
            id: "rec-vendor-backup",
            title: "Emergency Vendor Dispatch",
            description: "BlueWave Pool Services is offline. Dispatch AquaTech Services for immediate pool heating restoration before VIP arrival.",
            confidence: 0.92,
            freshness: "live",
            policyState: "cleared",
            evidence: "Primary vendor system heartbeat failure + T-18h arrival proximity."
          }
        ]
      });
    } else {
      setTwin(CASTELLANO_ESTATE_TWIN);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-[#fdfcf9] min-h-screen text-[#1a1a1a]">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-serif font-medium mb-2" style={{ color: "var(--color-ink-900)" }}>Estate Readiness Checklist</h1>
          <div className="flex items-center gap-4 text-sm text-[#666]">
            <div className="flex items-center gap-1.5">
              <Building2 size={16} />
              <span>{twin.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={16} />
              <span>{twin.expectedArrival.guestName} arrival in {twin.expectedArrival.countdown}</span>
            </div>
          </div>
        </div>
        <button
          onClick={toggleSimulation}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
            isSimulationActive 
              ? "bg-red-50 border-red-200 text-red-700" 
              : "bg-white border-[#9a7d52]/20 text-[#9a7d52] hover:bg-[#9a7d52]/5"
          }`}
        >
          {isSimulationActive ? "Reset Simulation" : "Vendor Outage Simulation"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white border border-[#9a7d52]/10 rounded-xl shadow-sm">
          <div className="text-sm font-medium text-[#666] mb-1">Readiness Score</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-serif font-bold" style={{ color: twin.readinessScore < 60 ? "#ef4444" : "var(--color-gold)" }}>
              {twin.readinessScore}%
            </span>
          </div>
        </div>
        <div className="p-6 bg-white border border-[#9a7d52]/10 rounded-xl shadow-sm">
          <div className="text-sm font-medium text-[#666] mb-1">Critical Issues</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-serif font-bold text-red-500">
              {twin.systemChecks.filter((c: SystemCheck) => c.criticality === "critical" && c.status !== "online").length}
            </span>
          </div>
        </div>
        <div className="p-6 bg-white border border-[#9a7d52]/10 rounded-xl shadow-sm">
          <div className="text-sm font-medium text-[#666] mb-1">Active Vendors</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-serif font-bold" style={{ color: "var(--color-ink-900)" }}>
              {twin.vendors.filter((v: VendorTwin) => v.status === "online").length}/{twin.vendors.length}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-xl font-serif font-medium border-b border-[#9a7d52]/10 pb-2">System Readiness</h2>
          <div className="bg-white border border-[#9a7d52]/10 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fdfcf9] border-b border-[#9a7d52]/10">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#9a7d52]">System</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#9a7d52]">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#9a7d52]">Criticality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#9a7d52]/5">
                {twin.systemChecks.map((check: SystemCheck) => (
                  <tr key={check.id} className="hover:bg-[#fdfcf9]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-[#1a1a1a]">{check.system}</div>
                      <div className="text-xs text-[#666]">{check.details}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {check.status === "online" ? (
                          <CheckCircle2 size={16} className="text-green-500" />
                        ) : check.status === "pending" ? (
                          <Clock size={16} className="text-amber-500" />
                        ) : (
                          <AlertTriangle size={16} className="text-red-500" />
                        )}
                        <span className={`text-sm capitalize ${
                          check.status === "online" ? "text-green-700" : 
                          check.status === "pending" ? "text-amber-700" : "text-red-700"
                        }`}>
                          {check.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        check.criticality === "critical" 
                          ? "bg-red-50 border-red-200 text-red-700" 
                          : "bg-blue-50 border-blue-200 text-blue-700"
                      }`}>
                        {check.criticality}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-serif font-medium border-b border-[#9a7d52]/10 pb-2">AI Dispatch Recommendations</h2>
          <div className="space-y-4">
            {twin.recommendations.map((rec: EstateRecommendation) => (
              <ProofEnvelope
                key={rec.id}
                title={rec.title}
                confidence={rec.confidence}
                timestamp={new Date().toISOString()}
                evidence={[{ id: 'ev-1', type: 'signal', label: 'Sensor Network' }]}
                policyState={rec.policyState === "cleared" ? "allowed" : rec.policyState === "flagged" ? "blocked" : "requires-approval"}
                autonomyMode="recommend"
              >
                <div className="space-y-4">
                  <p className="text-sm text-[#444] leading-relaxed">
                    {rec.description}
                  </p>
                  <div className="p-3 bg-[#fdfcf9] border border-[#9a7d52]/10 rounded-lg">
                    <div className="text-[10px] font-bold uppercase text-[#9a7d52] mb-1">Evidence Cluster</div>
                    <p className="text-xs italic text-[#666]">{rec.evidence}</p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button className="flex-1 py-2 bg-[#9a7d52] text-white rounded-lg text-sm font-medium hover:bg-[#866a44] transition-colors">
                      Execute Dispatch
                    </button>
                    <button className="px-4 py-2 border border-[#9a7d52]/20 text-[#666] rounded-lg text-sm font-medium hover:bg-[#fdfcf9] transition-colors">
                      Ignore
                    </button>
                  </div>
                </div>
              </ProofEnvelope>
            ))}
          </div>

          <div className="bg-white border border-[#9a7d52]/10 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-medium text-[#9a7d52] uppercase tracking-wider mb-4">Vendor Status</h3>
            <div className="space-y-3">
              {twin.vendors.map((vendor: VendorTwin) => (
                <div key={vendor.id} className="flex items-center justify-between p-3 bg-[#fdfcf9] rounded-lg border border-[#9a7d52]/5">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${vendor.status === "online" ? "bg-green-500" : "bg-red-500 animate-pulse"}`} />
                    <span className="text-sm font-medium">{vendor.name}</span>
                  </div>
                  <span className="text-xs text-[#666]">{vendor.specialty}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
