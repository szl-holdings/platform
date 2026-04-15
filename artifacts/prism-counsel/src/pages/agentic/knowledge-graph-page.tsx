import { useState } from "react";
import { Brain, Search, FileText, Link2, Layers, ChevronRight, Scale, Users, Tag, BookOpen, Lightbulb, MessageSquare, ArrowRight } from "lucide-react";

const PRISM_GOLD = "#c8a96e";
const PRISM_BLUE = "#4a8ab0";
const PRISM_RED = "#b85a4a";

interface KnowledgeNode {
  id: string;
  title: string;
  type: "clause" | "matter" | "decision" | "precedent" | "framework" | "expert";
  connections: number;
  relevance: number;
  summary: string;
  tags: string[];
  lastUsed: string;
  usageCount: number;
}

const NODES: KnowledgeNode[] = [
  { id: "KG-001", title: "Indemnification Cap — Fortune 500 Standard", type: "clause", connections: 47, relevance: 94, summary: "Aggregate liability capped at 2x annual fees. Mutual indemnification with carve-outs for IP infringement, willful misconduct, and confidentiality breach. Used in 47 MSAs with Fortune 500 clients since 2021.", tags: ["indemnification", "liability cap", "fortune 500", "MSA"], lastUsed: "2024-03-12", usageCount: 47 },
  { id: "KG-002", title: "Martinez v. Pinnacle — Liability Assessment", type: "matter", connections: 23, relevance: 88, summary: "Commercial auto injury claim. Key issues: driver employment status, vehicle maintenance records, comparative negligence. Connected to 23 similar commercial auto matters in firm history.", tags: ["commercial auto", "personal injury", "SDNY"], lastUsed: "2024-03-15", usageCount: 8 },
  { id: "KG-003", title: "Johnson v. TransGlobal (2019) — Verdict Analysis", type: "decision", connections: 31, relevance: 82, summary: "$1.2M verdict for plaintiff in commercial auto case. Key factors: driver fatigue evidence, GPS data contradicting logbook, employer knew of Hours of Service violations. Judge Kessler presiding.", tags: ["verdict", "commercial auto", "driver fatigue", "Kessler"], lastUsed: "2024-02-28", usageCount: 15 },
  { id: "KG-004", title: "Non-Compete Enforceability Framework — NY", type: "framework", connections: 56, relevance: 91, summary: "NY courts apply reasonableness test: (1) necessary to protect legitimate interest, (2) reasonable in time/geography, (3) not unduly burdensome, (4) not harmful to public. Recent trend: courts narrowing enforcement. Max recommended: 12 months, 50-mile radius.", tags: ["non-compete", "New York", "enforceability", "employment"], lastUsed: "2024-03-10", usageCount: 56 },
  { id: "KG-005", title: "Dr. Sarah Williams — Biomechanics Expert", type: "expert", connections: 18, relevance: 76, summary: "Retained 18 times in PI cases. Specializes in accident reconstruction and injury causation. Acceptance rate: 94% (Daubert challenges survived). Avg fee: $15K per case. Excellent jury presentation.", tags: ["expert", "biomechanics", "accident reconstruction"], lastUsed: "2024-01-20", usageCount: 18 },
  { id: "KG-006", title: "Data Processing Agreement — GDPR/CCPA Template", type: "clause", connections: 34, relevance: 89, summary: "Firm-standard DPA covering GDPR Article 28, CCPA 1798.140(v), and NY Shield Act requirements. Includes sub-processor obligations, breach notification (72hr), and data deletion upon termination.", tags: ["DPA", "GDPR", "CCPA", "privacy"], lastUsed: "2024-03-08", usageCount: 34 },
  { id: "KG-007", title: "Settlement Mediation Playbook — Insurance Bad Faith", type: "framework", connections: 29, relevance: 85, summary: "Structured approach for insurance bad faith mediations: (1) opening anchor at 85% of claimed damages, (2) incremental concessions tied to evidence reveals, (3) bracket negotiation in final rounds. Historical success: 72% settlement rate within mediator's range.", tags: ["mediation", "bad faith", "settlement strategy"], lastUsed: "2024-03-05", usageCount: 29 },
  { id: "KG-008", title: "SLA Uptime Standards — Technology Vendor", type: "clause", connections: 22, relevance: 78, summary: "Minimum 99.9% uptime SLA with tiered service credits: 99.5-99.9% = 5% credit, 99.0-99.5% = 10% credit, <99.0% = 25% credit + termination right. Includes maintenance window exclusions and force majeure carve-outs.", tags: ["SLA", "uptime", "SaaS", "technology"], lastUsed: "2024-03-06", usageCount: 22 },
];

const typeColor = (t: string) => t === "clause" ? PRISM_GOLD : t === "matter" ? PRISM_BLUE : t === "decision" ? "#22c55e" : t === "precedent" ? "#f59e0b" : t === "framework" ? "#a78bfa" : PRISM_RED;
const typeIcon = (t: string) => t === "clause" ? FileText : t === "matter" ? Scale : t === "decision" ? BookOpen : t === "framework" ? Layers : t === "expert" ? Users : Brain;

interface NlQuery {
  query: string;
  results: string[];
}

const SAMPLE_QUERIES: NlQuery[] = [
  { query: "What did we negotiate on indemnification caps with Fortune 500 clients last year?", results: ["KG-001"] },
  { query: "Show me all commercial auto cases in SDNY with jury verdicts over $1M", results: ["KG-002", "KG-003"] },
  { query: "What's our standard non-compete position in New York?", results: ["KG-004"] },
  { query: "Which biomechanics experts have we used and what's their Daubert track record?", results: ["KG-005"] },
];

export default function KnowledgeGraphPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [activeQuery, setActiveQuery] = useState<NlQuery | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  const filteredNodes = NODES.filter(n =>
    (filterType === "all" || n.type === filterType) &&
    (searchQuery === "" || n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="min-h-screen" style={{ background: "#080c14" }}>
      <div className="max-w-7xl mx-auto px-6 py-8 lg:px-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-white tracking-tight">Knowledge Graph & Precedent Engine</h1>
          <p className="text-[11px] text-white/30 mt-1">Query your firm's collective intelligence — every clause, matter, decision, and outcome in a living knowledge graph</p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 space-y-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    aria-label="Search the knowledge graph"
                    placeholder="Search the knowledge graph — try 'indemnification' or 'commercial auto'..."
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] pl-9 pr-4 py-2.5 text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/[0.15]"
                  />
                </div>
              </div>

              <div className="flex gap-1.5 mb-4">
                {["all", "clause", "matter", "decision", "framework", "expert"].map(t => (
                  <button key={t} onClick={() => setFilterType(t)}
                    aria-label={`Filter by ${t} type`}
                    className={`text-[9px] uppercase tracking-wider font-semibold rounded-lg px-3 py-1.5 transition ${filterType === t ? "text-white" : "text-white/20 hover:text-white/35"}`}
                    style={filterType === t ? { background: (t === "all" ? PRISM_GOLD : typeColor(t)) + "15", color: t === "all" ? PRISM_GOLD : typeColor(t) } : {}}>
                    {t}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {filteredNodes.map(n => {
                  const Icon = typeIcon(n.type);
                  return (
                    <button key={n.id} onClick={() => setSelectedNode(n)} aria-label={`Select node ${n.title}`}
                      className={`w-full text-left rounded-lg border p-3 transition ${selectedNode?.id === n.id ? "border-white/[0.12] bg-white/[0.04]" : "border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.03]"}`}>
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: typeColor(n.type) + "15" }}>
                          <Icon className="h-3.5 w-3.5" style={{ color: typeColor(n.type) }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-[11px] font-medium text-white">{n.title}</p>
                            <span className="text-[8px] uppercase tracking-wider font-bold rounded px-1.5 py-0.5" style={{ background: typeColor(n.type) + "15", color: typeColor(n.type) }}>{n.type}</span>
                          </div>
                          <p className="text-[9px] text-white/30 mt-0.5 line-clamp-1">{n.summary}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Link2 className="h-3 w-3 text-white/15" />
                            <span className="text-[10px] text-white/30">{n.connections}</span>
                          </div>
                          <p className="text-[9px] text-white/15">{n.usageCount} uses</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        {n.tags.slice(0, 4).map(t => (
                          <span key={t} className="text-[8px] px-1.5 py-0.5 rounded border border-white/[0.06] text-white/25">{t}</span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="col-span-4 space-y-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-3.5 w-3.5" style={{ color: PRISM_GOLD }} />
                <h3 className="text-[10px] uppercase tracking-wider text-white/30 font-semibold">Natural Language Query</h3>
              </div>
              <p className="text-[9px] text-white/25 mb-3">Ask questions in plain English — the knowledge graph finds relevant work product and precedent.</p>
              <div className="space-y-2">
                {SAMPLE_QUERIES.map((q, i) => (
                  <button key={i} onClick={() => { setActiveQuery(q); setSearchQuery(""); }}
                    aria-label={`Run query: ${q.query}`}
                    className="w-full text-left rounded-lg bg-white/[0.015] border border-white/[0.04] p-2.5 hover:bg-white/[0.03] transition">
                    <p className="text-[10px] text-white/50 italic leading-relaxed">"{q.query}"</p>
                    <p className="text-[8px] text-white/15 mt-1">{q.results.length} result{q.results.length > 1 ? "s" : ""}</p>
                  </button>
                ))}
              </div>
            </div>

            {selectedNode && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: typeColor(selectedNode.type) + "15" }}>
                    {(() => { const Icon = typeIcon(selectedNode.type); return <Icon className="h-3 w-3" style={{ color: typeColor(selectedNode.type) }} />; })()}
                  </div>
                  <h3 className="text-[10px] uppercase tracking-wider text-white/30 font-semibold">Node Detail</h3>
                </div>
                <p className="text-sm font-medium text-white mb-1">{selectedNode.title}</p>
                <p className="text-[10px] text-white/40 leading-relaxed mb-3">{selectedNode.summary}</p>
                <div className="space-y-1.5 mb-3">
                  {[
                    { label: "Connections", value: selectedNode.connections.toString() },
                    { label: "Relevance Score", value: `${selectedNode.relevance}%` },
                    { label: "Usage Count", value: selectedNode.usageCount.toString() },
                    { label: "Last Referenced", value: selectedNode.lastUsed },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between py-1 border-b border-white/[0.03] last:border-0">
                      <span className="text-[9px] text-white/25">{s.label}</span>
                      <span className="text-[10px] font-semibold text-white">{s.value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedNode.tags.map(t => (
                    <span key={t} className="text-[8px] px-2 py-0.5 rounded-full border border-white/[0.06] bg-white/[0.02] text-white/30">{t}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-3">Graph Statistics</h3>
              {[
                { label: "Total Nodes", value: "12,847" },
                { label: "Connections", value: "48,231" },
                { label: "Clauses Indexed", value: "3,421" },
                { label: "Matters Linked", value: "892" },
                { label: "Precedents", value: "2,156" },
                { label: "Last Updated", value: "2 hours ago" },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-1.5 border-b border-white/[0.03] last:border-0">
                  <span className="text-[10px] text-white/30">{s.label}</span>
                  <span className="text-[10px] font-semibold text-white">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
