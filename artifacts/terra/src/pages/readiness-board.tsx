import { useState } from "react";
import {
  CheckCircle, AlertTriangle, Clock, Building2, TrendingUp,
  Shield, BarChart3, Plug, ArrowUpRight, RefreshCw
} from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";
import { propertyTwins, type PropertyTwin } from "@/data/property-twin";

const ACCENT = "#40856a";

function fmtM(n: number) { return `$${(n / 1_000_000).toFixed(1)}M`; }

const READINESS_BANDS = [
  { label: "Ready", min: 80, color: "#40856a" },
  { label: "Needs Attention", min: 55, color: "#c08a2c" },
  { label: "Not Ready", min: 0, color: "#c04a2a" },
];

function getBand(score: number) {
  return READINESS_BANDS.find(b => score >= b.min) ?? READINESS_BANDS[READINESS_BANDS.length - 1];
}

function RadialScore({ score, size = 64 }: { score: number; size?: number }) {
  const band = getBand(score);
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={size * 0.09} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={band.color} strokeWidth={size * 0.09}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - score / 100)}
        strokeLinecap="round"
      />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="middle"
        fill={band.color} fontSize={size * 0.24} fontWeight="700"
        transform={`rotate(90, ${size / 2}, ${size / 2})`}
      >
        {score}
      </text>
    </svg>
  );
}

function PropertyReadinessCard({ twin }: { twin: PropertyTwin }) {
  const band = getBand(twin.readinessScore);
  const openTasks = twin.diligenceTasks.filter(t => t.status === "not_started" || t.status === "blocked").length;
  const pendingDocs = twin.documents.filter(d => d.status === "pending").length;
  const pendingApprovals = twin.approvals.filter(a => a.status === "pending").length;

  return (
    <div className="rounded-xl border p-5 transition-all duration-200 hover:bg-white/3" style={{
      background: "rgba(255,255,255,0.02)",
      borderColor: twin.distressSignal !== "none" ? "#c04a2a25" : "rgba(255,255,255,0.06)",
    }}>
      <div className="flex items-start gap-4 mb-4">
        <RadialScore score={twin.readinessScore} size={72} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div>
              <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{twin.name}</div>
              <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{twin.city}, {twin.state} · {twin.propertyType}</div>
            </div>
            <span className="text-xs font-medium" style={{ color: band.color }}>{band.label}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            <span>{fmtM(twin.value)}</span>
            <span>·</span>
            <span>{twin.occupancy}% occ</span>
            <span>·</span>
            <span>{twin.diligenceCompletionPct}% diligence</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Open Tasks", value: openTasks, warn: openTasks > 0 },
          { label: "Docs Pending", value: pendingDocs, warn: pendingDocs > 0 },
          { label: "Approvals", value: pendingApprovals, warn: pendingApprovals > 0 },
        ].map(m => (
          <div key={m.label} className="rounded-lg p-2.5 text-center" style={{ background: m.warn ? "#c08a2c08" : "rgba(255,255,255,0.03)", border: `1px solid ${m.warn ? "#c08a2c20" : "rgba(255,255,255,0.04)"}` }}>
            <div className="text-lg font-bold" style={{ color: m.warn ? "#c08a2c" : "rgba(255,255,255,0.7)" }}>{m.value}</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{m.label}</div>
          </div>
        ))}
      </div>

      {twin.distressSignal !== "none" && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3" style={{ background: "#c04a2a10", border: "1px solid #c04a2a20" }}>
          <AlertTriangle size={12} style={{ color: "#c04a2a" }} />
          <span className="text-xs" style={{ color: "#c04a2a" }}>
            Distress signal: <strong>{twin.distressSignal}</strong> — readiness may be unreliable
          </span>
        </div>
      )}

      <div className="space-y-1.5">
        {twin.diligenceTasks.filter(t => t.status === "blocked").map(t => (
          <div key={t.id} className="flex items-center gap-2 text-xs" style={{ color: "#c04a2a" }}>
            <AlertTriangle size={10} />
            <span>Blocked: {t.label}</span>
          </div>
        ))}
        {twin.diligenceTasks.filter(t => t.status === "in_progress").map(t => (
          <div key={t.id} className="flex items-center gap-2 text-xs" style={{ color: "#4a7dc8" }}>
            <Clock size={10} />
            <span>In progress: {t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UnderwritingFrictionRow({ twin }: { twin: PropertyTwin }) {
  const frictions = [
    twin.diligenceTasks.filter(t => t.status === "blocked").length > 0 && "Blocked tasks",
    twin.documents.filter(d => d.status === "pending").length > 0 && "Pending documents",
    twin.distressSignal !== "none" && `Distress: ${twin.distressSignal}`,
    twin.externalDataConnectors.filter(c => c.status === "not_connected").length > 0 && "External sources not connected",
  ].filter(Boolean) as string[];

  return (
    <div className="flex items-start gap-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>{twin.name}</div>
        <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{twin.city}, {twin.state}</div>
      </div>
      <div className="flex-1 flex flex-wrap gap-1.5">
        {frictions.length === 0 ? (
          <span className="text-xs" style={{ color: ACCENT }}>No friction detected</span>
        ) : frictions.map(f => (
          <span key={f} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#c08a2c15", color: "#c08a2c", border: "1px solid #c08a2c25" }}>
            {f}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-full rounded-full" style={{ width: `${twin.readinessScore}%`, background: getBand(twin.readinessScore).color }} />
        </div>
        <span className="text-xs w-8 text-right" style={{ color: "rgba(255,255,255,0.5)" }}>{twin.readinessScore}</span>
      </div>
    </div>
  );
}

export default function ReadinessBoard() {
  const [view, setView] = useState<"board" | "friction">("board");

  const ready = propertyTwins.filter(t => t.readinessScore >= 80);
  const attention = propertyTwins.filter(t => t.readinessScore >= 55 && t.readinessScore < 80);
  const notReady = propertyTwins.filter(t => t.readinessScore < 55);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>Readiness Board</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Portfolio-wide readiness scoring — diligence progress, document status, approvals, and distress signals
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(["board", "friction"] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="text-xs px-3 py-1.5 rounded-lg capitalize transition-colors"
              style={{
                background: view === v ? `${ACCENT}20` : "rgba(255,255,255,0.04)",
                color: view === v ? ACCENT : "rgba(255,255,255,0.4)",
                border: `1px solid ${view === v ? `${ACCENT}40` : "rgba(255,255,255,0.06)"}`,
              }}
            >
              {v === "board" ? "Readiness Grid" : "Underwriting Friction"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Portfolio</div>
          <div className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>{propertyTwins.length}</div>
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>tracked properties</div>
        </div>
        <div className="rounded-xl border p-4" style={{ background: "#40856a08", borderColor: "#40856a25" }}>
          <div className="text-xs mb-1" style={{ color: "#40856a" }}>Ready</div>
          <div className="text-2xl font-bold" style={{ color: "#40856a" }}>{ready.length}</div>
        </div>
        <div className="rounded-xl border p-4" style={{ background: "#c08a2c08", borderColor: "#c08a2c25" }}>
          <div className="text-xs mb-1" style={{ color: "#c08a2c" }}>Needs Attention</div>
          <div className="text-2xl font-bold" style={{ color: "#c08a2c" }}>{attention.length}</div>
        </div>
        <div className="rounded-xl border p-4" style={{ background: "#c04a2a08", borderColor: "#c04a2a25" }}>
          <div className="text-xs mb-1" style={{ color: "#c04a2a" }}>Not Ready</div>
          <div className="text-2xl font-bold" style={{ color: "#c04a2a" }}>{notReady.length}</div>
        </div>
      </div>

      {view === "board" ? (
        <div className="grid grid-cols-2 gap-4">
          {propertyTwins.map(t => <PropertyReadinessCard key={t.id} twin={t} />)}
        </div>
      ) : (
        <div className="rounded-xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>Underwriting Friction Analysis</h3>
          <div className="flex items-center gap-4 text-xs mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
            <span className="flex-1">Property</span>
            <span className="flex-1">Friction Points</span>
            <span className="w-24 text-right">Score</span>
          </div>
          {propertyTwins.map(t => <UnderwritingFrictionRow key={t.id} twin={t} />)}
          <div className="mt-6 rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.01)", borderColor: "rgba(255,255,255,0.04)" }}>
            <div className="flex items-center gap-2 mb-2 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              <Plug size={12} />
              <span>External data would further enrich friction detection. Connect sources to enable zoning, permit, and lien data.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
