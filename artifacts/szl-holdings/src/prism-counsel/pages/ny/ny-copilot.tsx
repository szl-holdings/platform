import { MessageSquare, Mail, FileText, Users, Database, ChevronRight, Shield, Sparkles } from "lucide-react";
import { useState } from "react";

const COPILOT_SURFACES = [
  {
    id: "outlook",
    icon: Mail,
    title: "Outlook Summarization",
    description: "Automatically surfaces and summarizes insurer correspondence, adjuster communications, and coverage-related emails across all NY matters.",
    capabilities: [
      "Insurer communication summary by matter (last 30 / 60 / 90 days)",
      "Reserve movement signals extracted from informal communications",
      "Adjuster silence detection with configurable threshold alerts",
      "Privilege tagging — attorney-client and work product headers detected automatically",
      "Communication timeline stitched into matter chronology",
    ],
    trigger: "Available via PRISM Copilot connector in Outlook — triggers on email to/from known insurer domains",
    acl: "Matter-scoped: only assigned attorney, paralegal, and supervising partner",
  },
  {
    id: "word",
    icon: FileText,
    title: "Word Document Generation",
    description: "Generates structured legal documents pre-populated with matter data — requires attorney review and approval before use.",
    documents: [
      { name: "Demand Package Cover Letter", trigger: "Demand readiness score ≥ 70", note: "Requires partner approval before send" },
      { name: "Medical Chronology Narrative", trigger: "All treatment records uploaded", note: "AI-generated; attorney must verify all assertions" },
      { name: "Deposition Prep Memo", trigger: "Deposition scheduled", note: "Privileged — attorney-client; not exported without explicit approval" },
      { name: "Mediation Readiness Brief", trigger: "Mediation within 30 days", note: "Privileged; partner sign-off required" },
      { name: "Insurer Communication Summary", trigger: "On-demand or weekly cadence", note: "Shareable with client after attorney review" },
      { name: "Coverage Analysis Memorandum", trigger: "Coverage dispute flagged in matter", note: "Privileged; coverage counsel co-sign recommended" },
    ],
    acl: "Generated documents inherit matter privilege classification; export triggers approval workflow",
  },
  {
    id: "teams",
    icon: Users,
    title: "Teams Alert Cards",
    description: "Structured alert cards surfaced directly in Matter Teams channels or attorney DMs for real-time matter intelligence.",
    alertTypes: [
      { type: "Deadline Breach Risk Alert", trigger: "Breach risk score increases by ≥ 5 points weekly", urgency: "critical" },
      { type: "Insurer Silence Escalation", trigger: "Communication silence exceeds configured threshold", urgency: "high" },
      { type: "Approval Request", trigger: "Demand send / settlement / filing requires approval", urgency: "high" },
      { type: "Reserve Movement Signal", trigger: "Reserve movement detected from carrier intelligence", urgency: "medium" },
      { type: "Pre-Mediation Readiness Report", trigger: "7 days before scheduled mediation session", urgency: "medium" },
      { type: "No-Fault Clock Warning", trigger: "Clock enters 14-day warning window", urgency: "critical" },
    ],
    acl: "Cards sent to matter team channel — attorney, paralegal, supervising partner only",
  },
  {
    id: "sharepoint",
    icon: Database,
    title: "SharePoint Retrieval",
    description: "Permission-aware retrieval of matter documents from SharePoint document libraries, with ACL-enforced access and matter-scope filtering.",
    capabilities: [
      "Matter folder scoped — only documents tagged to the requesting matter are returned",
      "Privilege-aware: privileged documents returned only to attorneys and above",
      "Version-aware: always retrieves current version with change delta log",
      "Source lineage tracked: every document retrieval logged with actor attribution",
      "Cross-matter search blocked: searches cannot return documents outside the requestor's permitted scope",
    ],
    acl: "SharePoint ACLs enforced server-side — no client-side bypass possible",
  },
];

const CONNECTOR_DEFINITIONS = [
  {
    name: "PRISM Counsel Synced Connector",
    type: "Synced",
    scope: "All matter data — non-privileged fields only",
    refreshCycle: "Daily at 2:00 AM ET",
    acl: "Org-scoped; role filters applied: attorney sees all assigned matters, paralegal sees assigned matters only",
    dataTypes: ["Matter metadata", "Deadline status", "Readiness scores", "Offer movements", "Communication windows", "Forecast scores"],
    excluded: ["Privileged content", "Strategy memos", "Settlement authority", "Mediation briefs"],
  },
  {
    name: "PRISM Counsel Federated Connector",
    type: "Federated (Real-time)",
    scope: "Live matter queries — answer grounded in real-time matter data",
    refreshCycle: "Real-time on query",
    acl: "Matter-scoped and role-aware: every answer filtered to requestor's permitted view",
    dataTypes: ["All non-privileged matter data", "Clock status", "Deadline risk", "Insurer intelligence", "Venue scores"],
    excluded: ["All privileged content", "Client identity (external queries)", "Strategy-classified records"],
  },
];

const DEMO_QUERIES = [
  { q: "What NY matters have clocks expiring in the next 14 days?", category: "Deadlines" },
  { q: "Summarize all insurer communications for Vasquez matter in last 60 days", category: "Summary" },
  { q: "What is the disclaimer vulnerability score for Kensington Realty?", category: "Forecast" },
  { q: "Which NY matters are below 65% demand readiness?", category: "Readiness" },
  { q: "Draft mediation brief outline for Okafor v. Starbucks", category: "Draft" },
  { q: "List all AI review packets pending approval across NY matters", category: "Governance" },
];

const DEMO_RESPONSE = `**NY Matter Clock Expiration Report — Next 14 Days**
*As of April 3, 2026*

**2 urgent clocks identified:**

1. **Vasquez v. Progressive — EUO Verification Window**
   - Rule: 11 NYCRR § 65-3.5
   - Expires: April 15, 2026 (12 days)
   - Risk: Non-attendance triggers mandatory suspension of no-fault benefits
   - Status: SCHEDULED — confirm appearance confirmation received

2. **Vasquez v. Progressive — Bill Arbitration Deadline (Bill #3)**
   - Rule: 11 NYCRR § 65-4.2
   - Expires: May 1, 2026 (28 days)
   - Risk: Forfeiture of no-fault claim if not filed
   - Status: PENDING — arbitration packet not yet filed

**No clocks expiring for Okafor or Kensington matters in this window.**

*Sources: Matter clock tracker, NY rule profile database*
*Confidence: High — clock data verified against source records as of this morning*`;

export default function NyCopilotPage() {
  const [activeTab, setActiveTab] = useState<string>("surfaces");
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);
  const [showResponse, setShowResponse] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-white/[0.06] px-6 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#d4a054]" />
          <h1 className="text-sm font-semibold text-slate-200">PRISM Copilot — NY Insurance Layer</h1>
          <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20">
            M365-NATIVE
          </span>
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5">Outlook · Word · Teams · SharePoint · Copilot connectors — NY-specific intelligence surfaces</p>
      </div>

      <div className="flex border-b border-white/[0.06]">
        {[
          { id: "surfaces", label: "Workflow Surfaces" },
          { id: "connectors", label: "Connector Definitions" },
          { id: "demo", label: "Live Demo" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs transition-colors ${activeTab === tab.id ? "text-[#d4a054] border-b-2 border-[#d4a054]" : "text-slate-500 hover:text-slate-300"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "surfaces" && (
          <div className="space-y-4 max-w-[900px]">
            {COPILOT_SURFACES.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-[#d4a054]" />
                    <h3 className="text-sm font-semibold text-slate-200">{s.title}</h3>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-3">{s.description}</p>

                  {s.capabilities && (
                    <div className="space-y-1 mb-3">
                      {s.capabilities.map((cap, ci) => (
                        <div key={ci} className="flex items-start gap-2 text-[10px] text-slate-400">
                          <div className="w-1 h-1 rounded-full bg-[#4a90b8] flex-shrink-0 mt-1.5" />
                          <span>{cap}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {s.documents && (
                    <div className="space-y-1.5 mb-3">
                      {s.documents.map((doc, di) => (
                        <div key={di} className="rounded border border-white/[0.04] p-2.5" style={{ background: "#080c14" }}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[11px] font-medium text-slate-200">{doc.name}</span>
                          </div>
                          <div className="text-[9px] text-slate-500">Trigger: {doc.trigger}</div>
                          <div className="text-[9px] text-[#d4a054]">{doc.note}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {s.alertTypes && (
                    <div className="space-y-1.5 mb-3">
                      {s.alertTypes.map((alert, ai) => (
                        <div key={ai} className="flex items-center gap-3 py-1 border-b border-white/[0.04] last:border-0">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${alert.urgency === "critical" ? "bg-[#c45a4a]" : alert.urgency === "high" ? "bg-[#d4a054]" : "bg-[#4a90b8]"}`} />
                          <div className="flex-1 text-[10px] text-slate-300">{alert.type}</div>
                          <div className="text-[9px] text-slate-500">{alert.trigger}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="rounded border border-white/[0.04] p-2 mt-2" style={{ background: "#080c14" }}>
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-[#4a90b8]" />
                      <span className="text-[9px] text-[#4a90b8] font-medium">ACL: </span>
                      <span className="text-[9px] text-slate-500">{s.acl}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "connectors" && (
          <div className="space-y-4 max-w-[900px]">
            {CONNECTOR_DEFINITIONS.map((c, i) => (
              <div key={i} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-200">{c.name}</div>
                    <div className="text-[10px] text-slate-500">{c.scope}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-medium ${c.type.includes("Real") ? "bg-[#4a90b8]/10 text-[#4a90b8]" : "bg-[#d4a054]/10 text-[#d4a054]"}`}>
                    {c.type.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="text-[10px] text-slate-500 mb-1">Refresh Cycle</div>
                    <div className="text-[11px] text-slate-300">{c.refreshCycle}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 mb-1">Access Control</div>
                    <div className="text-[11px] text-slate-300">{c.acl}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-medium text-slate-400 uppercase mb-1">Included Data Types</div>
                    {c.dataTypes.map((d, di) => (
                      <div key={di} className="flex items-center gap-1.5 text-[10px] text-slate-400 py-0.5">
                        <div className="w-1 h-1 rounded-full bg-[#4a90b8]" />
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-[10px] font-medium text-[#c45a4a] uppercase mb-1">Excluded (Privilege / ACL)</div>
                    {c.excluded.map((d, di) => (
                      <div key={di} className="flex items-center gap-1.5 text-[10px] text-slate-500 py-0.5">
                        <div className="w-1 h-1 rounded-full bg-[#c45a4a]" />
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <h3 className="text-xs font-semibold text-slate-200 mb-2">Connector Permission Model</h3>
              <div className="space-y-2 text-[10px] text-slate-400">
                <p>All PRISM Counsel connectors enforce matter-scoped access control at the graph layer. The Copilot orchestration layer cannot retrieve data outside the authenticated user's permitted scope.</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Privileged content is flagged at the record level — never returned in connector responses</li>
                  <li>Cross-matter queries are rejected unless user has multi-matter authority</li>
                  <li>Every connector retrieval is logged with actor identity, timestamp, query text, and result scope</li>
                  <li>Generated answers include citations to source records — no fabricated data permitted</li>
                  <li>Role-aware answer shaping: answers omit fields the requestor's role cannot see</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === "demo" && (
          <div className="max-w-[800px] space-y-4">
            <div className="text-xs text-slate-400 mb-3">Example queries for NY Insurance Copilot layer:</div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {DEMO_QUERIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedQuery(q.q); setShowResponse(true); }}
                  className="flex items-start gap-2 p-3 rounded-lg border border-white/[0.06] text-left hover:border-[#d4a054]/30 transition-colors"
                  style={{ background: "#0c1220" }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#d4a054] mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[9px] text-[#d4a054] uppercase mb-0.5">{q.category}</div>
                    <div className="text-[11px] text-slate-300">{q.q}</div>
                  </div>
                </button>
              ))}
            </div>

            {showResponse && selectedQuery && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="max-w-xl rounded-lg p-3 border border-[#d4a054]/20 bg-[#d4a054]/5">
                    <div className="text-xs text-slate-200">{selectedQuery}</div>
                  </div>
                </div>
                <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
                  <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {DEMO_RESPONSE.split("\n").map((line, li) => {
                      if (line.startsWith("**") && line.endsWith("**")) {
                        return <div key={li} className="font-semibold text-slate-100 mt-2 first:mt-0">{line.replace(/\*\*/g, "")}</div>;
                      }
                      if (line.startsWith("*") && line.endsWith("*")) {
                        return <div key={li} className="text-[10px] text-slate-500 italic">{line.replace(/\*/g, "")}</div>;
                      }
                      if (line.match(/^\d+\./)) {
                        return <div key={li} className="ml-2 mt-1">{line}</div>;
                      }
                      if (line.startsWith("   -")) {
                        return <div key={li} className="ml-6 text-[10px] text-slate-400">{line}</div>;
                      }
                      return <div key={li}>{line}</div>;
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="text-[9px] text-slate-600 text-center pt-2">
              Copilot outputs are AI-generated and require attorney review. All NY insurance assertions include source citations and confidence levels. Not legal advice. Microsoft 365 integration is modeled — live APIs not connected.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
