import { useState, useEffect } from "react";
import { Shield, Clock, AlertTriangle, TrendingUp, Eye } from "lucide-react";

const API = "/api";

type SilenceWindow = {
  id: number;
  matterId: number;
  carrierName: string;
  daysSilent: number;
  silenceRisk: string;
  escalationSuggested: boolean;
  outstandingItems?: string[];
  silenceStartAt: string;
};

type CarrierPattern = {
  id: number;
  carrierName: string;
  patternType: string;
  description?: string;
  evidenceCount: number;
  confidence?: number;
  operationalImplication?: string;
  lastSeen: string;
};

type PressureItem = {
  matter: { id: number; title: string; caseNumber?: string };
  pressure: { overallScore: number; direction: string; requiresReview?: boolean };
};

function RiskBadge({ risk }: { risk: string }) {
  const map: Record<string, string> = {
    critical: "bg-red-100 text-red-700 border-red-200",
    high: "bg-orange-100 text-orange-700 border-orange-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    low: "bg-slate-100 text-slate-600 border-slate-200",
    none: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium border ${map[risk] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>{risk.toUpperCase()}</span>;
}

function PatternTypeBadge({ type }: { type: string }) {
  const label = type.replace(/_/g, " ");
  return <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 border border-slate-200">{label}</span>;
}

export default function CarrierWatchPage() {
  const [silenceWindows, setSilenceWindows] = useState<SilenceWindow[]>([]);
  const [patterns, setPatterns] = useState<CarrierPattern[]>([]);
  const [highPressure, setHighPressure] = useState<PressureItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/prism-counsel/pilot-one/boards/carrier-watch`);
      if (res.ok) {
        const data = await res.json();
        setSilenceWindows(data.activeSilenceWindows ?? []);
        setPatterns(data.behaviorPatterns ?? []);
        setHighPressure(data.highPressureMatters ?? []);
      }
    } catch { } finally { setLoading(false); }
  }

  const criticalSilence = silenceWindows.filter(s => s.silenceRisk === "critical" || s.silenceRisk === "high");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-orange-500" />
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Carrier Watch</h1>
          <p className="text-sm text-slate-500 mt-0.5">Carrier behavior patterns, silence windows, and high-pressure matters</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Silence Windows", value: silenceWindows.length, color: "text-orange-600" },
          { label: "Critical / High Risk", value: criticalSilence.length, color: "text-red-600" },
          { label: "Behavior Patterns", value: patterns.length, color: "text-amber-600" },
          { label: "High Pressure Matters", value: highPressure.length, color: "text-red-600" },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs text-slate-500">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-400">Loading carrier watch data...</div>
      ) : (
        <div className="space-y-6">
          {silenceWindows.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-orange-700 mb-3 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Active Silence Windows ({silenceWindows.length})
              </h2>
              <div className="space-y-2">
                {silenceWindows.map(sw => (
                  <div key={sw.id} className="bg-white border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="font-medium text-slate-800 text-sm">Matter #{sw.matterId}</span>
                        <span className="mx-2 text-slate-400">·</span>
                        <span className="text-sm text-slate-700">{sw.carrierName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">{sw.daysSilent} days silent</span>
                        <RiskBadge risk={sw.silenceRisk} />
                        {sw.escalationSuggested && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200 font-medium">Escalate</span>
                        )}
                      </div>
                    </div>
                    {sw.outstandingItems && Array.isArray(sw.outstandingItems) && sw.outstandingItems.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-slate-500 mb-1">Outstanding items:</p>
                        {sw.outstandingItems.map((item, i) => (
                          <span key={i} className="inline-block mr-1 mb-1 text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded border border-orange-200">{item}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {patterns.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-1.5">
                <Eye className="w-4 h-4" /> Carrier Behavior Patterns ({patterns.length})
              </h2>
              <div className="space-y-2">
                {patterns.map(p => (
                  <div key={p.id} className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-800 text-sm">{p.carrierName}</span>
                          <PatternTypeBadge type={p.patternType} />
                          <span className="text-xs text-slate-400">{p.evidenceCount} signal(s)</span>
                        </div>
                        {p.description && <p className="text-xs text-slate-600">{p.description}</p>}
                        {p.operationalImplication && <p className="text-xs text-amber-700 mt-1 font-medium">{p.operationalImplication}</p>}
                      </div>
                      {p.confidence && <span className="text-xs text-slate-500">{Math.round(p.confidence * 100)}% conf.</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {highPressure.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> High Pressure Matters ({highPressure.length})
              </h2>
              <div className="space-y-2">
                {highPressure.map(item => (
                  <div key={item.matter.id} className="bg-white border border-red-100 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-slate-800 text-sm">{item.matter.title}</span>
                      {item.matter.caseNumber && <span className="ml-2 text-xs text-slate-400 font-mono">{item.matter.caseNumber}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-red-600">{Math.round(item.pressure.overallScore * 100)}/100</span>
                      {item.pressure.direction === "rising" && <TrendingUp className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {silenceWindows.length === 0 && patterns.length === 0 && highPressure.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
              <Shield className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No carrier watch alerts</p>
              <p className="text-slate-400 text-sm mt-1">Compute pressure and track carrier events to populate this board</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
