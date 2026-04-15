import { useState, useCallback, useMemo } from "react";
import { FileText, AlertTriangle, CheckCircle, XCircle, Eye, Clock, Brain, ChevronRight, ArrowUpRight, Shield, Zap, BarChart3, Edit3 } from "lucide-react";

const PRISM_GOLD = "#c8a96e";
const PRISM_BLUE = "#4a8ab0";
const PRISM_RED = "#b85a4a";

interface ClauseDeviation {
  clause: string;
  section: string;
  playbookPosition: string;
  incomingPosition: string;
  risk: "critical" | "high" | "medium" | "low";
  suggestedRedline: string;
  accepted?: boolean;
}

interface Contract {
  id: string;
  title: string;
  counterparty: string;
  type: string;
  status: "review" | "redlined" | "negotiation" | "executed" | "expired";
  receivedDate: string;
  dueDate: string;
  value: number;
  pageCount: number;
  clauseCount: number;
  deviations: ClauseDeviation[];
  agentConfidence: number;
  reviewTime: string;
}

const CONTRACTS: Contract[] = [
  {
    id: "CLM-2024-001",
    title: "Master Services Agreement — Pinnacle Technologies",
    counterparty: "Pinnacle Technologies Inc.",
    type: "MSA",
    status: "review",
    receivedDate: "2024-03-12",
    dueDate: "2024-03-19",
    value: 4_200_000,
    pageCount: 47,
    clauseCount: 124,
    agentConfidence: 94,
    reviewTime: "4m 12s",
    deviations: [
      { clause: "Limitation of Liability", section: "§12.1", playbookPosition: "Cap at 2x annual fees", incomingPosition: "Uncapped consequential damages", risk: "critical", suggestedRedline: "Insert: 'aggregate liability shall not exceed two (2) times the annual fees paid under this Agreement'", accepted: undefined },
      { clause: "Indemnification", section: "§13.2", playbookPosition: "Mutual indemnification", incomingPosition: "One-sided (client indemnifies only)", risk: "high", suggestedRedline: "Add mutual indemnification clause per Playbook §13-A", accepted: undefined },
      { clause: "IP Assignment", section: "§8.4", playbookPosition: "License, not assignment", incomingPosition: "Full IP assignment to client", risk: "critical", suggestedRedline: "Replace 'assigns all right, title' with 'grants a non-exclusive, perpetual license'", accepted: undefined },
      { clause: "Termination for Convenience", section: "§15.1", playbookPosition: "90-day notice", incomingPosition: "30-day notice", risk: "medium", suggestedRedline: "Amend notice period from thirty (30) to ninety (90) days", accepted: true },
      { clause: "Governing Law", section: "§18.3", playbookPosition: "New York", incomingPosition: "Delaware", risk: "low", suggestedRedline: "Acceptable — Delaware within firm parameters", accepted: true },
    ],
  },
  {
    id: "CLM-2024-002",
    title: "NDA — Meridian Capital Group",
    counterparty: "Meridian Capital Group LLC",
    type: "NDA",
    status: "executed",
    receivedDate: "2024-03-08",
    dueDate: "2024-03-10",
    value: 0,
    pageCount: 6,
    clauseCount: 18,
    agentConfidence: 99,
    reviewTime: "28s",
    deviations: [
      { clause: "Non-Solicitation", section: "§4.2", playbookPosition: "12 months", incomingPosition: "24 months", risk: "medium", suggestedRedline: "Reduce non-solicitation period to 12 months", accepted: true },
    ],
  },
  {
    id: "CLM-2024-003",
    title: "Software License — DataVault Enterprise",
    counterparty: "DataVault Corp.",
    type: "SaaS Agreement",
    status: "negotiation",
    receivedDate: "2024-03-05",
    dueDate: "2024-03-22",
    value: 890_000,
    pageCount: 32,
    clauseCount: 89,
    agentConfidence: 87,
    reviewTime: "2m 44s",
    deviations: [
      { clause: "Data Processing", section: "§7.1", playbookPosition: "GDPR + CCPA compliant DPA", incomingPosition: "No DPA attached", risk: "critical", suggestedRedline: "Require execution of firm-standard DPA as exhibit", accepted: undefined },
      { clause: "SLA Uptime", section: "§5.3", playbookPosition: "99.9% with credits", incomingPosition: "99.5% best-effort", risk: "high", suggestedRedline: "Amend to 99.9% with service credit schedule per Exhibit B", accepted: undefined },
      { clause: "Auto-Renewal", section: "§16.1", playbookPosition: "No auto-renewal", incomingPosition: "Annual auto-renewal with 60-day opt-out", risk: "medium", suggestedRedline: "Remove auto-renewal; replace with mutual opt-in renewal notice", accepted: undefined },
    ],
  },
  {
    id: "CLM-2024-004",
    title: "Employment Agreement — Senior Associate",
    counterparty: "James R. Whitfield",
    type: "Employment",
    status: "redlined",
    receivedDate: "2024-03-10",
    dueDate: "2024-03-17",
    value: 285_000,
    pageCount: 14,
    clauseCount: 42,
    agentConfidence: 96,
    reviewTime: "1m 08s",
    deviations: [
      { clause: "Non-Compete", section: "§9.1", playbookPosition: "12-month, 50-mile radius", incomingPosition: "24-month, nationwide", risk: "high", suggestedRedline: "Reduce to 12-month period, 50-mile geographic scope per state enforceability standards", accepted: true },
    ],
  },
];

const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${n}`;

const riskColor = (r: string) =>
  r === "critical" ? "#ef4444" : r === "high" ? "#f59e0b" : r === "medium" ? PRISM_BLUE : "#22c55e";

const statusLabel: Record<string, { text: string; color: string }> = {
  review: { text: "AI Review", color: PRISM_BLUE },
  redlined: { text: "Redlined", color: "#f59e0b" },
  negotiation: { text: "Negotiation", color: PRISM_GOLD },
  executed: { text: "Executed", color: "#22c55e" },
  expired: { text: "Expired", color: "#6b7280" },
};

export default function ContractLifecyclePage() {
  const [contracts, setContracts] = useState<Contract[]>(() => CONTRACTS.map(c => ({ ...c, deviations: c.deviations.map(d => ({ ...d })) })));
  const [selectedId, setSelectedId] = useState(CONTRACTS[0].id);
  const [expandedClause, setExpandedClause] = useState<string | null>(null);
  const [actionLog, setActionLog] = useState<{ contractId: string; clause: string; action: string; timestamp: string }[]>([]);

  const selected = useMemo(() => contracts.find(c => c.id === selectedId) ?? contracts[0], [contracts, selectedId]);

  const handleRedlineAction = useCallback((contractId: string, clauseIdx: number, action: "accept" | "reject" | "modify") => {
    setContracts(prev => prev.map(c => {
      if (c.id !== contractId) return c;
      const newDevs = c.deviations.map((d, i) => i === clauseIdx ? { ...d, accepted: action === "accept" ? true : action === "reject" ? false : d.accepted } : d);
      const allResolved = newDevs.every(d => d.accepted !== undefined);
      return { ...c, deviations: newDevs, status: allResolved ? "redlined" as const : c.status, agentConfidence: Math.min(99, c.agentConfidence + (action === "accept" ? 1 : 0)) };
    }));
    const clause = contracts.find(c => c.id === contractId)?.deviations[clauseIdx]?.clause ?? "";
    setActionLog(prev => [{ contractId, clause, action, timestamp: new Date().toLocaleTimeString() }, ...prev].slice(0, 20));
  }, [contracts]);

  const totalDeviations = contracts.reduce((s, c) => s + c.deviations.length, 0);
  const criticalDeviations = contracts.reduce((s, c) => s + c.deviations.filter(d => d.risk === "critical").length, 0);
  const avgConfidence = Math.round(contracts.reduce((s, c) => s + c.agentConfidence, 0) / contracts.length);
  const pendingContracts = contracts.filter(c => c.status === "review" || c.status === "negotiation").length;
  const resolvedCount = contracts.reduce((s, c) => s + c.deviations.filter(d => d.accepted !== undefined).length, 0);

  return (
    <div className="min-h-screen" style={{ background: "#080c14" }}>
      <div className="max-w-7xl mx-auto px-6 py-8 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Agentic Contract Lifecycle</h1>
            <p className="text-[11px] text-white/30 mt-1">AI agents autonomously review, extract, and redline contracts against your clause playbook</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-wider text-white/25">Agent Status</span>
            <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium" style={{ background: "#22c55e20", color: "#22c55e" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" /> Active
            </span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Pending Review", value: pendingContracts.toString(), icon: Clock, accent: PRISM_GOLD },
            { label: "Total Deviations", value: totalDeviations.toString(), icon: AlertTriangle, accent: "#f59e0b" },
            { label: "Critical Flags", value: criticalDeviations.toString(), icon: XCircle, accent: "#ef4444" },
            { label: "Agent Confidence", value: `${avgConfidence}%`, icon: Brain, accent: PRISM_BLUE },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className="h-3.5 w-3.5" style={{ color: s.accent }} />
                <span className="text-[9px] uppercase tracking-wider text-white/30">{s.label}</span>
              </div>
              <p className="text-2xl font-semibold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-4">
            <h3 className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-3">Contract Queue</h3>
            <div className="space-y-2">
              {contracts.map(c => {
                const st = statusLabel[c.status];
                return (
                  <button key={c.id} onClick={() => setSelectedId(c.id)} aria-label={`Select contract ${c.title}`}
                    className={`w-full text-left rounded-xl border p-4 transition ${selected.id === c.id ? "border-white/[0.12] bg-white/[0.04]" : "border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.03]"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-white/25">{c.id}</span>
                      <span className="text-[9px] font-semibold rounded-full px-2 py-0.5" style={{ background: st.color + "20", color: st.color }}>{st.text}</span>
                    </div>
                    <p className="text-sm font-medium text-white mb-0.5">{c.title}</p>
                    <p className="text-[10px] text-white/30">{c.counterparty} · {c.type}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-white/25">
                      <span>{c.pageCount} pages</span>
                      <span>{c.deviations.length} deviations</span>
                      <span className="ml-auto font-mono">{c.reviewTime}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <h4 className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-3">Agent Learning Stats</h4>
              {[
                { label: "Contracts Reviewed", value: "1,247" },
                { label: "Redlines Accepted", value: "89.4%" },
                { label: "Avg Review Time", value: "2m 18s" },
                { label: "Playbook Compliance", value: "96.2%" },
                { label: "False Positive Rate", value: "3.1%" },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-1.5 border-b border-white/[0.03] last:border-0">
                  <span className="text-[10px] text-white/40">{s.label}</span>
                  <span className="text-[11px] font-semibold text-white">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-8">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-white">{selected.title}</h3>
                  <p className="text-[10px] text-white/30 mt-0.5">{selected.counterparty} · {selected.clauseCount} clauses · {selected.pageCount} pages</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-wider text-white/25">Value</p>
                    <p className="text-sm font-semibold text-white">{fmt(selected.value)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-wider text-white/25">Confidence</p>
                    <p className="text-sm font-semibold" style={{ color: PRISM_GOLD }}>{selected.agentConfidence}%</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-6">
                {["Received", "Parsed", "Clauses Extracted", "Playbook Compared", "Deviations Flagged", "Redlines Generated"].map((step, i) => (
                  <div key={step} className="flex items-center gap-1.5">
                    <div className="flex items-center justify-center h-5 w-5 rounded-full text-[8px] font-bold" style={{ background: PRISM_GOLD + "20", color: PRISM_GOLD }}>
                      <CheckCircle className="h-3 w-3" />
                    </div>
                    <span className="text-[9px] text-white/40">{step}</span>
                    {i < 5 && <ChevronRight className="h-3 w-3 text-white/10" />}
                  </div>
                ))}
              </div>

              <h4 className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-3">Clause Deviations ({selected.deviations.length})</h4>
              <div className="space-y-2">
                {selected.deviations.map((d, i) => (
                  <div key={i} className="rounded-lg border border-white/[0.05] bg-white/[0.015] overflow-hidden">
                    <button onClick={() => setExpandedClause(expandedClause === `${selected.id}-${i}` ? null : `${selected.id}-${i}`)}
                      aria-label={`Toggle clause deviation ${d.clause}`} className="w-full text-left p-3 flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full" style={{ background: riskColor(d.risk) }} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-white">{d.clause}</span>
                          <span className="text-[9px] font-mono text-white/20">{d.section}</span>
                          <span className="text-[8px] uppercase font-bold tracking-wider rounded px-1.5 py-0.5" style={{ background: riskColor(d.risk) + "20", color: riskColor(d.risk) }}>{d.risk}</span>
                        </div>
                      </div>
                      {d.accepted !== undefined && (
                        <span className="text-[9px] font-semibold" style={{ color: d.accepted ? "#22c55e" : "#ef4444" }}>
                          {d.accepted ? "Accepted" : "Rejected"}
                        </span>
                      )}
                      <ChevronRight className={`h-3.5 w-3.5 text-white/20 transition-transform ${expandedClause === `${selected.id}-${i}` ? "rotate-90" : ""}`} />
                    </button>
                    {expandedClause === `${selected.id}-${i}` && (
                      <div className="px-3 pb-3 space-y-2 border-t border-white/[0.04] pt-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-lg bg-white/[0.02] p-2.5">
                            <p className="text-[8px] uppercase tracking-wider text-white/25 mb-1">Playbook Position</p>
                            <p className="text-[10px] text-white/60">{d.playbookPosition}</p>
                          </div>
                          <div className="rounded-lg bg-white/[0.02] p-2.5">
                            <p className="text-[8px] uppercase tracking-wider text-white/25 mb-1">Incoming Position</p>
                            <p className="text-[10px] text-white/60">{d.incomingPosition}</p>
                          </div>
                        </div>
                        <div className="rounded-lg p-2.5" style={{ background: PRISM_GOLD + "08", borderLeft: `2px solid ${PRISM_GOLD}` }}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <Edit3 className="h-3 w-3" style={{ color: PRISM_GOLD }} />
                            <span className="text-[8px] uppercase tracking-wider font-semibold" style={{ color: PRISM_GOLD }}>Suggested Redline</span>
                          </div>
                          <p className="text-[10px] text-white/50 italic">"{d.suggestedRedline}"</p>
                        </div>
                        {d.accepted === undefined && (
                          <div className="flex items-center gap-2 pt-1">
                            <button onClick={() => handleRedlineAction(selected.id, i, "accept")} className="text-[9px] font-semibold rounded-lg px-3 py-1.5 hover:brightness-125 transition" style={{ background: "#22c55e20", color: "#22c55e" }} aria-label={`Accept redline for ${d.clause}`}>Accept Redline</button>
                            <button onClick={() => handleRedlineAction(selected.id, i, "reject")} className="text-[9px] font-semibold rounded-lg px-3 py-1.5 hover:brightness-125 transition" style={{ background: "#ef444420", color: "#ef4444" }} aria-label={`Reject redline for ${d.clause}`}>Reject</button>
                            <button onClick={() => handleRedlineAction(selected.id, i, "modify")} className="text-[9px] font-semibold rounded-lg px-3 py-1.5 bg-white/[0.04] text-white/40 hover:bg-white/[0.06] transition" aria-label={`Modify redline for ${d.clause}`}>Modify</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {actionLog.length > 0 && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 mb-4">
                <h4 className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-3">Action Log ({actionLog.length}) &mdash; {resolvedCount}/{totalDeviations} Resolved</h4>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {actionLog.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-white/[0.015] border border-white/[0.04] p-2">
                      <div className="h-1.5 w-1.5 rounded-full" style={{ background: a.action === "accept" ? "#22c55e" : a.action === "reject" ? "#ef4444" : PRISM_GOLD }} />
                      <span className="text-[9px] text-white/40 flex-1">{a.action.charAt(0).toUpperCase() + a.action.slice(1)} — {a.clause}</span>
                      <span className="text-[8px] text-white/20 font-mono">{a.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <h4 className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-3">Version History</h4>
              <div className="space-y-2">
                {[
                  { version: "v3 — Redlined Draft", date: "Mar 14, 2024 10:42 AM", actor: "AI Agent", changes: "5 redlines applied, 2 accepted by counsel" },
                  { version: "v2 — Clause Extraction", date: "Mar 12, 2024 3:18 PM", actor: "AI Agent", changes: "124 clauses extracted, 5 deviations flagged" },
                  { version: "v1 — Original Received", date: "Mar 12, 2024 2:05 PM", actor: "Pinnacle Legal", changes: "47-page document received via email" },
                ].map(v => (
                  <div key={v.version} className="flex items-center gap-3 rounded-lg bg-white/[0.015] border border-white/[0.04] p-2.5">
                    <FileText className="h-3.5 w-3.5 text-white/20 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-[10px] font-medium text-white">{v.version}</p>
                      <p className="text-[9px] text-white/25">{v.changes}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-white/30">{v.date}</p>
                      <p className="text-[9px] text-white/20">{v.actor}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
