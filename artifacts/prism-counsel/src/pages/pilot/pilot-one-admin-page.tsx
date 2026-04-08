import { useState, useEffect } from "react";
import { Settings, Activity, Layers, Database, Zap, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

const API = "/api";

type AdminSection = "pressure" | "friction" | "portfolio" | "worldline" | "quality";

interface SectionData {
  pressure?: { summary: { totalSnapshots: number; requiresReview: number; highPressure: number; activeSilenceWindows: number }; recentSnapshots: any[]; activeSilenceWindows: any[] };
  friction?: { summary: { totalSnapshots: number; requiresReview: number; highFriction: number; pendingRecommendations: number }; recentSnapshots: any[]; pendingRecommendations: any[] };
  portfolio?: { benchmarks: any[]; effectiveness: any[]; cohorts: any[]; teamLag: any[] };
  worldline?: { summary: { signalOverlays: number; weatherEvents: number; regulatoryEvents: number; recoveryMarkers: number }; recentOverlays: any[] };
  quality?: { summary: { quietRiskMatters: number; highRiskCount: number }; quietRisks: any[]; qualityWarnings: any[] };
}

export default function PilotOneAdminPage() {
  const [activeSection, setActiveSection] = useState<AdminSection>("pressure");
  const [data, setData] = useState<SectionData>({});
  const [loading, setLoading] = useState(false);
  const [runningLearning, setRunningLearning] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => { fetchSection(activeSection); }, [activeSection]);

  async function fetchSection(section: AdminSection) {
    setLoading(true);
    try {
      const res = await fetch(`${API}/prism-counsel/pilot-one/admin/${section}`);
      if (res.ok) {
        const sectionData = await res.json();
        setData(prev => ({ ...prev, [section]: sectionData }));
      }
    } catch { } finally { setLoading(false); }
  }

  async function runPortfolioLearning() {
    setRunningLearning(true);
    setMessage(null);
    try {
      const res = await fetch(`${API}/prism-counsel/pilot-one/portfolio/run-learning`, { method: "POST" });
      if (res.ok) {
        setMessage({ type: "success", text: "Portfolio learning cycle completed successfully" });
        await fetchSection("portfolio");
      } else {
        setMessage({ type: "error", text: "Failed to run portfolio learning" });
      }
    } catch {
      setMessage({ type: "error", text: "Error running portfolio learning" });
    } finally {
      setRunningLearning(false);
    }
  }

  const tabs: Array<{ id: AdminSection; label: string; icon: React.ReactNode }> = [
    { id: "pressure", label: "Pressure Engine", icon: <Activity className="w-4 h-4" /> },
    { id: "friction", label: "Friction Engine", icon: <Layers className="w-4 h-4" /> },
    { id: "portfolio", label: "Portfolio Learning", icon: <Database className="w-4 h-4" /> },
    { id: "worldline", label: "Worldline", icon: <Zap className="w-4 h-4" /> },
    { id: "quality", label: "Data Quality", icon: <CheckCircle className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-slate-500" />
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Pilot One Admin</h1>
            <p className="text-sm text-slate-500 mt-0.5">Engine health, data quality, and operational controls</p>
          </div>
        </div>
        <button
          onClick={runPortfolioLearning}
          disabled={runningLearning}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${runningLearning ? "animate-spin" : ""}`} />
          {runningLearning ? "Running..." : "Run Portfolio Learning"}
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded border text-sm ${message.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${activeSection === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-400">Loading admin data...</div>
      ) : (
        <div className="space-y-4">
          {activeSection === "pressure" && data.pressure && <PressureAdminView data={data.pressure} />}
          {activeSection === "friction" && data.friction && <FrictionAdminView data={data.friction} />}
          {activeSection === "portfolio" && data.portfolio && <PortfolioAdminView data={data.portfolio} />}
          {activeSection === "worldline" && data.worldline && <WorldlineAdminView data={data.worldline} />}
          {activeSection === "quality" && data.quality && <QualityAdminView data={data.quality} />}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color = "text-slate-700" }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function PressureAdminView({ data }: { data: NonNullable<SectionData["pressure"]> }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Snapshots" value={data.summary.totalSnapshots} />
        <StatCard label="Requires Review" value={data.summary.requiresReview} color="text-amber-600" />
        <StatCard label="High Pressure" value={data.summary.highPressure} color="text-red-600" />
        <StatCard label="Active Silence Windows" value={data.summary.activeSilenceWindows} color="text-orange-600" />
      </div>
      <TableView title="Recent Pressure Snapshots" rows={data.recentSnapshots.slice(0, 10)} columns={["matterId", "overallScore", "direction", "requiresReview", "computedAt"]} />
    </div>
  );
}

function FrictionAdminView({ data }: { data: NonNullable<SectionData["friction"]> }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Snapshots" value={data.summary.totalSnapshots} />
        <StatCard label="Requires Review" value={data.summary.requiresReview} color="text-amber-600" />
        <StatCard label="High Friction" value={data.summary.highFriction} color="text-red-600" />
        <StatCard label="Pending Recommendations" value={data.summary.pendingRecommendations} color="text-blue-600" />
      </div>
      <TableView title="Recent Friction Snapshots" rows={data.recentSnapshots.slice(0, 10)} columns={["matterId", "overallScore", "direction", "frictionClass", "readinessDragDays"]} />
    </div>
  );
}

function PortfolioAdminView({ data }: { data: NonNullable<SectionData["portfolio"]> }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Benchmarks" value={data.benchmarks.length} />
        <StatCard label="Action Effectiveness" value={data.effectiveness.length} />
        <StatCard label="Matter Cohorts" value={data.cohorts.length} />
        <StatCard label="Lag Metrics" value={data.teamLag.length} />
      </div>
      <TableView title="Action Effectiveness" rows={data.effectiveness.slice(0, 8)} columns={["actionType", "outcomeMetric", "successRate", "averageImpact", "averageTimeToImpactDays"]} />
      <TableView title="Team Lag Metrics" rows={data.teamLag} columns={["metricType", "avgDays", "medianDays", "p90Days"]} />
    </div>
  );
}

function WorldlineAdminView({ data }: { data: NonNullable<SectionData["worldline"]> }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Signal Overlays" value={data.summary.signalOverlays} />
        <StatCard label="Weather Events" value={data.summary.weatherEvents} />
        <StatCard label="Regulatory Events" value={data.summary.regulatoryEvents} />
        <StatCard label="Recovery Markers" value={data.summary.recoveryMarkers} />
      </div>
      <TableView title="Recent Signal Overlays" rows={data.recentOverlays.slice(0, 10)} columns={["sourceClass", "overlayType", "jurisdiction", "legalUsefulnessScore"]} />
    </div>
  );
}

function QualityAdminView({ data }: { data: NonNullable<SectionData["quality"]> }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Quiet Risk Matters" value={data.summary.quietRiskMatters} />
        <StatCard label="High Risk Count" value={data.summary.highRiskCount} color="text-red-600" />
      </div>
      {data.qualityWarnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-semibold text-amber-900 text-sm mb-2 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Quality Warnings</h3>
          {data.qualityWarnings.map((w, i) => (
            <div key={i} className="flex items-center gap-3 text-sm py-1 border-b border-amber-100 last:border-0">
              <span className="text-slate-700">Matter #{w.matterId}</span>
              <span className="text-red-600 font-medium">{Math.round(w.riskScore * 100)}/100</span>
              <span className="text-slate-500 text-xs">{Array.isArray(w.signals) ? w.signals.join(", ") : ""}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TableView({ title, rows, columns }: { title: string; rows: any[]; columns: string[] }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100">
              {columns.map(col => (
                <th key={col} className="text-left px-4 py-2 text-slate-500 font-medium">{col.replace(/([A-Z])/g, ' $1').toLowerCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                {columns.map(col => (
                  <td key={col} className="px-4 py-2 text-slate-700">
                    {typeof row[col] === "number" ? (col.includes("Score") || col.includes("Rate") || col.includes("Impact") ? (row[col] * 100).toFixed(1) + "%" : row[col]) : row[col] === null ? "—" : typeof row[col] === "boolean" ? (row[col] ? "yes" : "no") : String(row[col] ?? "—").substring(0, 40)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
