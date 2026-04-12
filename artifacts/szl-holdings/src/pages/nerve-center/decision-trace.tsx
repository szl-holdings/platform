import { useState } from "react";
import { GitBranch, ChevronDown, ChevronUp, DollarSign, Clock, TrendingUp } from "lucide-react";

interface DecisionTrace {
  id: string;
  title: string;
  domain: string;
  trigger: string;
  dataPoints: string[];
  decision: string;
  cascadedActions: string[];
  outcomes: string[];
  decidedAt: string;
  decidedBy: string;
  financialImpact: string;
  burnRatePerHour?: number;
  isPending: boolean;
}

const DEMO_TRACES: DecisionTrace[] = [
  {
    id: "dt-001",
    title: "Port Authorization PR-2847",
    domain: "prism",
    trigger: "Vessel MV Athena Rotterdam delay > 12h threshold breached",
    dataPoints: [
      "MV Athena AIS: Rotterdam anchorage since 04:30 UTC",
      "Demurrage clause: $4,200/hr after 12h delay",
      "Cargo contract: Ashworth clearance certificate required",
      "Port Authority: force majeure declared 06:15 UTC",
    ],
    decision: "PENDING — Authorization required to proceed with port clearance",
    cascadedActions: [],
    outcomes: [],
    decidedAt: "",
    decidedBy: "",
    financialImpact: "$4,200/hr",
    burnRatePerHour: 4200,
    isPending: true,
  },
  {
    id: "dt-002",
    title: "AWS Q2 Invoice $48,200 Approval",
    domain: "alloy",
    trigger: "Invoice received from AWS — Q2 cloud services",
    dataPoints: [
      "Q2 cloud budget: $180K allocated",
      "YTD spend: $127K — invoice within envelope",
      "PO-2026-Q2-AWS matched all line items",
      "All services actively in use (confirmed by Lyte)",
    ],
    decision: "APPROVED & EXECUTED — Payment processed automatically",
    cascadedActions: ["Payment queued to finance system", "PO marked fulfilled", "Budget tracker updated"],
    outcomes: ["Payment confirmed 09:14 UTC", "Budget utilization: 97%"],
    decidedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    decidedBy: "AI (autonomous — within policy)",
    financialImpact: "$48,200",
    isPending: false,
  },
  {
    id: "dt-003",
    title: "CloudOps Vendor Risk Escalation",
    domain: "aegis",
    trigger: "Security questionnaire overdue >14 months — auto-flagged",
    dataPoints: [
      "SOC 2 Type II certification: pending (last audit: 14 months ago)",
      "3 CVEs associated with CloudOps stack — CVSS avg 6.8",
      "Patch cadence: 47 days avg vs. 14-day SLA",
      "Data processed: 340GB customer PII/month",
    ],
    decision: "ESCALATED — Risk dossier sent to CISO for 48h review",
    cascadedActions: ["CISO notified with full dossier", "Vendor access flagged for review", "Alternate vendor shortlist requested"],
    outcomes: ["CISO acknowledged — review scheduled for April 13"],
    decidedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    decidedBy: "Risk Assessment Agent → CISO",
    financialImpact: "$0 (risk mitigation)",
    isPending: false,
  },
];

const DOMAIN_COLORS: Record<string, string> = {
  vessels: "#38bdf8", terra: "#86efac", aegis: "#818cf8", prism: "#fbbf24", lyte: "#2dd4bf", alloy: "#c084fc", people: "#fb923c",
};

function formatRelative(ts: string) {
  if (!ts) return "—";
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

function TraceCard({ trace }: { trace: DecisionTrace }) {
  const [open, setOpen] = useState(trace.isPending);
  const domColor = DOMAIN_COLORS[trace.domain] ?? "#4B8BDB";

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: trace.isPending ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)", background: "rgba(10,14,24,0.9)" }}>
      <button className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-white/2 transition-colors" onClick={() => setOpen(o => !o)}>
        <GitBranch className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: domColor }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded capitalize" style={{ color: domColor, background: `${domColor}15` }}>{trace.domain}</span>
            {trace.isPending && (
              <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded animate-pulse" style={{ color: "#ef4444", background: "rgba(239,68,68,0.1)" }}>
                PENDING
              </span>
            )}
          </div>
          <p className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{trace.title}</p>
          {trace.burnRatePerHour && (
            <div className="flex items-center gap-1 mt-0.5">
              <DollarSign className="w-2.5 h-2.5" style={{ color: "#ef4444" }} />
              <span className="text-[9px] font-mono font-bold" style={{ color: "#ef4444" }}>${trace.burnRatePerHour.toLocaleString()}/hr burning</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>{formatRelative(trace.decidedAt)}</span>
          {open ? <ChevronUp className="w-3 h-3" style={{ color: "rgba(255,255,255,0.25)" }} /> : <ChevronDown className="w-3 h-3" style={{ color: "rgba(255,255,255,0.25)" }} />}
        </div>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2.5 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="mt-2 rounded-lg p-2.5" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="text-[8px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>Trigger</div>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.55)" }}>{trace.trigger}</p>
          </div>

          <div>
            <div className="text-[8px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.25)" }}>Data Informing Decision</div>
            <div className="space-y-1">
              {trace.dataPoints.map((dp, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[9px] font-mono shrink-0 mt-0.5" style={{ color: "rgba(75,139,219,0.5)" }}>{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.5)" }}>{dp}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg p-2.5 border" style={{ background: trace.isPending ? "rgba(239,68,68,0.04)" : "rgba(16,185,129,0.04)", borderColor: trace.isPending ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)" }}>
            <div className="text-[8px] uppercase tracking-widest mb-1" style={{ color: trace.isPending ? "#ef4444" : "#10b981" }}>Decision</div>
            <p className="text-[10px] font-medium" style={{ color: trace.isPending ? "#ef4444" : "#10b981" }}>{trace.decision}</p>
          </div>

          {trace.cascadedActions.length > 0 && (
            <div>
              <div className="text-[8px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.25)" }}>Cascaded Actions</div>
              {trace.cascadedActions.map((action, i) => (
                <div key={i} className="flex items-start gap-1.5 mb-1">
                  <span style={{ color: "#4B8BDB", fontSize: "9px" }}>→</span>
                  <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.5)" }}>{action}</span>
                </div>
              ))}
            </div>
          )}

          {trace.outcomes.length > 0 && (
            <div>
              <div className="text-[8px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.25)" }}>Outcomes</div>
              {trace.outcomes.map((outcome, i) => (
                <div key={i} className="flex items-start gap-1.5 mb-1">
                  <span style={{ color: "#10b981", fontSize: "9px" }}>✓</span>
                  <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.5)" }}>{outcome}</span>
                </div>
              ))}
            </div>
          )}

          {trace.decidedBy && (
            <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.2)" }}>By: {trace.decidedBy}</span>
              <span className="text-[8px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>Impact: {trace.financialImpact}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DecisionTrace() {
  const pending = DEMO_TRACES.filter(t => t.isPending);
  const resolved = DEMO_TRACES.filter(t => !t.isPending);

  const totalBurnRate = pending.reduce((sum, t) => sum + (t.burnRatePerHour ?? 0), 0);
  const [burnElapsed, _] = useState(() => Date.now());
  const elapsed = Math.floor((Date.now() - burnElapsed + 4 * 3600000) / 3600000);
  const totalBurned = totalBurnRate * elapsed;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <GitBranch className="w-3.5 h-3.5" style={{ color: "#4B8BDB" }} />
            <h3 className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>Decision Trace</h3>
          </div>
          <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>Full context chain for every executive decision</p>
        </div>
      </div>

      <div className="rounded-xl border p-3" style={{ borderColor: "rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.03)" }}>
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="w-3.5 h-3.5" style={{ color: "#ef4444" }} />
          <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: "#ef4444" }}>Indecision Burn Rate</span>
        </div>
        <div className="text-2xl font-bold font-mono" style={{ color: "#ef4444" }}>
          ${totalBurnRate.toLocaleString()}<span className="text-sm">/hr</span>
        </div>
        <p className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
          {pending.length} pending decision{pending.length !== 1 ? "s" : ""} · ~${totalBurned.toLocaleString()} total cost since delay began
        </p>
        <div className="mt-2 space-y-1">
          {pending.map(t => t.burnRatePerHour ? (
            <div key={t.id} className="flex items-center justify-between">
              <span className="text-[9px] truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{t.title}</span>
              <span className="text-[9px] font-mono shrink-0 ml-2" style={{ color: "#ef4444" }}>${t.burnRatePerHour.toLocaleString()}/hr</span>
            </div>
          ) : null)}
        </div>
      </div>

      {pending.length > 0 && (
        <div>
          <div className="text-[8px] uppercase tracking-widest mb-2" style={{ color: "rgba(239,68,68,0.5)" }}>Pending Decisions</div>
          <div className="space-y-2">
            {pending.map(t => <TraceCard key={t.id} trace={t} />)}
          </div>
        </div>
      )}

      <div>
        <div className="text-[8px] uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>Recent Decision History</div>
        <div className="space-y-2">
          {resolved.map(t => <TraceCard key={t.id} trace={t} />)}
        </div>
      </div>
    </div>
  );
}
