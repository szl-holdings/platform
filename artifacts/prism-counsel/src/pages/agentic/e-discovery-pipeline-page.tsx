import { useState, useCallback } from "react";
import { FileText, Search, Shield, AlertTriangle, CheckCircle, Clock, Brain, BarChart3, Eye, XCircle, Filter, Layers, DollarSign, ArrowUpRight, Lock } from "lucide-react";

const PRISM_GOLD = "#c8a96e";
const PRISM_BLUE = "#4a8ab0";
const PRISM_RED = "#b85a4a";

interface DocumentSet {
  id: string;
  matter: string;
  totalDocs: number;
  processed: number;
  relevant: number;
  privileged: number;
  piiRedacted: number;
  produced: number;
  costPerDoc: number;
  status: "collecting" | "processing" | "review" | "production" | "complete";
  tarRound: number;
  tarPrecision: number;
  tarRecall: number;
  reviewers: { name: string; coded: number; rate: number }[];
}

const DOCUMENT_SETS: DocumentSet[] = [
  {
    id: "EDIS-2024-001",
    matter: "Martinez v. Pinnacle Freight LLC",
    totalDocs: 142_847,
    processed: 142_847,
    relevant: 18_432,
    privileged: 2_891,
    piiRedacted: 4_217,
    produced: 12_650,
    costPerDoc: 1.24,
    status: "review",
    tarRound: 4,
    tarPrecision: 94.2,
    tarRecall: 91.8,
    reviewers: [
      { name: "Sarah Chen", coded: 4_200, rate: 87 },
      { name: "James Whitfield", coded: 3_100, rate: 82 },
      { name: "Maria Rodriguez", coded: 2_800, rate: 91 },
    ],
  },
  {
    id: "EDIS-2024-002",
    matter: "Chen v. Harbor Point Insurance",
    totalDocs: 67_234,
    processed: 67_234,
    relevant: 8_912,
    privileged: 1_245,
    piiRedacted: 1_893,
    produced: 8_912,
    costPerDoc: 0.94,
    status: "complete",
    tarRound: 3,
    tarPrecision: 96.1,
    tarRecall: 93.4,
    reviewers: [
      { name: "David Park", coded: 5_600, rate: 94 },
      { name: "Sarah Chen", coded: 3_200, rate: 89 },
    ],
  },
];

const pipelineStages = ["Collection", "Processing", "AI Relevance", "Privilege Check", "PII Redaction", "Review", "Production"];

const fmt = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : n.toString();

export default function EDiscoveryPipelinePage() {
  const [selected, setSelected] = useState(DOCUMENT_SETS[0]);

  const [privilegeDocs, setPrivilegeDocs] = useState([
    { doc: "Email_20240112_Chen_Internal.msg", type: "Attorney-Client", confidence: 97, decision: null as "withhold" | "produce" | null },
    { doc: "Memo_LegalStrategy_Q4.docx", type: "Work Product", confidence: 94, decision: null as "withhold" | "produce" | null },
    { doc: "Teams_Chat_ChenParker_1128.html", type: "Attorney-Client", confidence: 88, decision: null as "withhold" | "produce" | null },
    { doc: "Draft_Response_v3_Comments.docx", type: "Work Product", confidence: 92, decision: null as "withhold" | "produce" | null },
  ]);

  const handlePrivilegeDecision = useCallback((doc: string, decision: "withhold" | "produce") => {
    setPrivilegeDocs(prev => prev.map(p => p.doc === doc ? { ...p, decision } : p));
  }, []);
  const stageIndex = pipelineStages.indexOf(
    selected.status === "collecting" ? "Collection" :
    selected.status === "processing" ? "Processing" :
    selected.status === "review" ? "Review" :
    selected.status === "production" ? "Production" : "Production"
  );

  return (
    <div className="min-h-screen" style={{ background: "#080c14" }}>
      <div className="max-w-7xl mx-auto px-6 py-8 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Autonomous E-Discovery Pipeline</h1>
            <p className="text-[11px] text-white/30 mt-1">AI-powered document processing, relevance scoring, privilege detection, and Technology-Assisted Review</p>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          {DOCUMENT_SETS.map(ds => (
            <button key={ds.id} onClick={() => setSelected(ds)} aria-label={`Select document set ${ds.matter}`}
              className={`flex-1 text-left rounded-xl border p-4 transition ${selected.id === ds.id ? "border-white/[0.12] bg-white/[0.04]" : "border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.03]"}`}>
              <span className="text-[9px] font-mono text-white/20">{ds.id}</span>
              <p className="text-sm font-medium text-white mt-0.5">{ds.matter}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[10px] text-white/25">{fmt(ds.totalDocs)} docs</span>
                <span className="text-[10px]" style={{ color: ds.status === "complete" ? "#22c55e" : PRISM_GOLD }}>{ds.status.charAt(0).toUpperCase() + ds.status.slice(1)}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 mb-6">
          <h3 className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-4">Pipeline Progress</h3>
          <div className="flex items-center gap-2">
            {pipelineStages.map((stage, i) => {
              const complete = i <= stageIndex || selected.status === "complete";
              const active = i === stageIndex && selected.status !== "complete";
              return (
                <div key={stage} className="flex-1 flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold"
                        style={{ background: complete ? PRISM_GOLD + "20" : active ? PRISM_BLUE + "20" : "rgba(255,255,255,0.03)", color: complete ? PRISM_GOLD : active ? PRISM_BLUE : "rgba(255,255,255,0.2)" }}>
                        {complete ? <CheckCircle className="h-3 w-3" /> : i + 1}
                      </div>
                      <span className={`text-[9px] ${complete ? "text-white/60" : active ? "text-white/40" : "text-white/15"}`}>{stage}</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/[0.05]">
                      <div className="h-full rounded-full" style={{ width: complete ? "100%" : active ? "60%" : "0%", background: complete ? PRISM_GOLD : PRISM_BLUE }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-6 gap-4 mb-6">
          {[
            { label: "Total Documents", value: fmt(selected.totalDocs), icon: FileText, color: "white" },
            { label: "AI Relevant", value: fmt(selected.relevant), icon: Search, color: PRISM_GOLD },
            { label: "Privileged", value: fmt(selected.privileged), icon: Lock, color: PRISM_RED },
            { label: "PII Redacted", value: fmt(selected.piiRedacted), icon: Shield, color: PRISM_BLUE },
            { label: "Produced", value: fmt(selected.produced), icon: CheckCircle, color: "#22c55e" },
            { label: "Cost/Doc", value: `$${selected.costPerDoc.toFixed(2)}`, icon: DollarSign, color: PRISM_GOLD },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <s.icon className="h-3 w-3" style={{ color: s.color }} />
                <span className="text-[8px] uppercase tracking-wider text-white/25">{s.label}</span>
              </div>
              <p className="text-xl font-semibold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 space-y-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-3.5 w-3.5" style={{ color: PRISM_GOLD }} />
                  <h3 className="text-[10px] uppercase tracking-wider text-white/30 font-semibold">Technology-Assisted Review (TAR)</h3>
                </div>
                <span className="text-[9px] text-white/20">Round {selected.tarRound} · Active Learning</span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-3 text-center">
                  <p className="text-[8px] uppercase tracking-wider text-white/25 mb-1">Precision</p>
                  <p className="text-2xl font-semibold" style={{ color: "#22c55e" }}>{selected.tarPrecision}%</p>
                </div>
                <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-3 text-center">
                  <p className="text-[8px] uppercase tracking-wider text-white/25 mb-1">Recall</p>
                  <p className="text-2xl font-semibold" style={{ color: PRISM_BLUE }}>{selected.tarRecall}%</p>
                </div>
                <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-3 text-center">
                  <p className="text-[8px] uppercase tracking-wider text-white/25 mb-1">F1 Score</p>
                  <p className="text-2xl font-semibold" style={{ color: PRISM_GOLD }}>
                    {((2 * selected.tarPrecision * selected.tarRecall) / (selected.tarPrecision + selected.tarRecall)).toFixed(1)}%
                  </p>
                </div>
              </div>

              <h4 className="text-[9px] uppercase tracking-wider text-white/25 mb-2">TAR Round History</h4>
              <div className="space-y-1.5">
                {Array.from({ length: selected.tarRound }, (_, i) => {
                  const round = i + 1;
                  const p = 78 + round * 4.2;
                  const r = 72 + round * 5.1;
                  return (
                    <div key={round} className="flex items-center gap-3 rounded-lg bg-white/[0.015] border border-white/[0.04] px-3 py-2">
                      <span className="text-[10px] font-mono text-white/25 w-16">Round {round}</span>
                      <div className="flex-1">
                        <div className="h-1.5 rounded-full bg-white/[0.05]">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(p, 100)}%`, background: PRISM_GOLD }} />
                        </div>
                      </div>
                      <span className="text-[9px] text-white/30 w-12">P: {Math.min(p, selected.tarPrecision).toFixed(1)}%</span>
                      <span className="text-[9px] text-white/30 w-12">R: {Math.min(r, selected.tarRecall).toFixed(1)}%</span>
                      <span className="text-[9px] text-white/20 w-20">{(round * 2_400 + 1_200).toLocaleString()} coded</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-3">Document Classification Breakdown</h3>
              <div className="space-y-2">
                {[
                  { label: "Responsive — Privileged", count: selected.privileged, color: PRISM_RED, pct: (selected.privileged / selected.totalDocs * 100).toFixed(1) },
                  { label: "Responsive — Producible", count: selected.relevant - selected.privileged, color: "#22c55e", pct: ((selected.relevant - selected.privileged) / selected.totalDocs * 100).toFixed(1) },
                  { label: "PII Detected & Redacted", count: selected.piiRedacted, color: PRISM_BLUE, pct: (selected.piiRedacted / selected.totalDocs * 100).toFixed(1) },
                  { label: "Non-Responsive", count: selected.totalDocs - selected.relevant, color: "rgba(255,255,255,0.15)", pct: ((selected.totalDocs - selected.relevant) / selected.totalDocs * 100).toFixed(1) },
                ].map(cat => (
                  <div key={cat.label} className="flex items-center gap-3 rounded-lg bg-white/[0.015] border border-white/[0.04] p-3">
                    <div className="h-3 w-3 rounded" style={{ background: cat.color }} />
                    <span className="text-[10px] text-white/50 flex-1">{cat.label}</span>
                    <span className="text-[10px] font-semibold text-white">{fmt(cat.count)}</span>
                    <span className="text-[9px] text-white/20 w-10 text-right">{cat.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-4 space-y-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-3">Reviewer Performance</h3>
              {selected.reviewers.map(r => (
                <div key={r.name} className="rounded-lg bg-white/[0.015] border border-white/[0.04] p-3 mb-2 last:mb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-white">{r.name}</span>
                    <span className="text-[9px] font-semibold" style={{ color: r.rate >= 90 ? "#22c55e" : r.rate >= 80 ? PRISM_GOLD : PRISM_RED }}>{r.rate}% accuracy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-white/25">{r.coded.toLocaleString()} docs coded</span>
                    <div className="flex-1 h-1 rounded-full bg-white/[0.05]">
                      <div className="h-full rounded-full" style={{ width: `${r.rate}%`, background: r.rate >= 90 ? "#22c55e" : PRISM_GOLD }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-3">Budget Tracking</h3>
              {[
                { label: "Total Budget", value: `$${(selected.totalDocs * 2.50 / 1000).toFixed(0)}K` },
                { label: "Spent to Date", value: `$${(selected.produced * selected.costPerDoc / 1000).toFixed(0)}K` },
                { label: "Cost per Document", value: `$${selected.costPerDoc.toFixed(2)}` },
                { label: "AI vs Manual Savings", value: "68%" },
                { label: "Projected Total", value: `$${(selected.totalDocs * selected.costPerDoc / 1000).toFixed(0)}K` },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-1.5 border-b border-white/[0.03] last:border-0">
                  <span className="text-[10px] text-white/30">{s.label}</span>
                  <span className="text-[10px] font-semibold text-white">{s.value}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-3">Privilege Detection Log</h3>
              <div className="space-y-1.5">
                {privilegeDocs.map(p => (
                  <div key={p.doc} className="rounded-lg bg-white/[0.015] border border-white/[0.04] px-2.5 py-2">
                    <div className="flex items-center gap-2">
                      <Lock className="h-3 w-3 flex-shrink-0" style={{ color: p.decision === "withhold" ? PRISM_RED : p.decision === "produce" ? "#22c55e" : PRISM_RED }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] text-white/50 truncate">{p.doc}</p>
                        <p className="text-[8px] text-white/20">{p.type}</p>
                      </div>
                      <span className="text-[9px] font-semibold" style={{ color: PRISM_GOLD }}>{p.confidence}%</span>
                    </div>
                    {p.decision === null ? (
                      <div className="flex items-center gap-1.5 mt-2">
                        <button onClick={() => handlePrivilegeDecision(p.doc, "withhold")} aria-label={`Withhold ${p.doc}`}
                          className="text-[8px] font-semibold rounded px-2 py-1 hover:brightness-125 transition" style={{ background: PRISM_RED + "20", color: PRISM_RED }}>Withhold</button>
                        <button onClick={() => handlePrivilegeDecision(p.doc, "produce")} aria-label={`Produce ${p.doc}`}
                          className="text-[8px] font-semibold rounded px-2 py-1 hover:brightness-125 transition" style={{ background: "#22c55e20", color: "#22c55e" }}>Produce</button>
                      </div>
                    ) : (
                      <p className="text-[8px] mt-1.5 font-semibold uppercase tracking-wider" style={{ color: p.decision === "withhold" ? PRISM_RED : "#22c55e" }}>{p.decision}</p>
                    )}
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
