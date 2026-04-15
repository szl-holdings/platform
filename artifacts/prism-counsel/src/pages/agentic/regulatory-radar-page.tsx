import { useState } from "react";
import { Radio, AlertTriangle, CheckCircle, Clock, Globe, Shield, FileText, ArrowRight, ChevronRight, XCircle, Layers, Eye } from "lucide-react";

const PRISM_GOLD = "#c8a96e";
const PRISM_BLUE = "#4a8ab0";
const PRISM_RED = "#b85a4a";

interface RegulatoryChange {
  id: string;
  title: string;
  agency: string;
  jurisdiction: string;
  effectiveDate: string;
  publishedDate: string;
  impact: "critical" | "high" | "medium" | "low";
  status: "action-required" | "under-review" | "compliant" | "not-applicable";
  summary: string;
  affectedPolicies: string[];
  gaps: string[];
  remediation: { task: string; owner: string; deadline: string; status: "pending" | "in-progress" | "complete" }[];
}

const CHANGES: RegulatoryChange[] = [
  {
    id: "REG-2024-042",
    title: "SEC Rule 10b5-1 Amendments — Insider Trading Plans",
    agency: "SEC",
    jurisdiction: "Federal",
    effectiveDate: "2024-04-01",
    publishedDate: "2024-01-15",
    impact: "critical",
    status: "action-required",
    summary: "New cooling-off periods for insider trading plans, enhanced disclosure requirements for 10b5-1 plan adoptions, amendments and terminations. Requires board certification of compliance.",
    affectedPolicies: ["Insider Trading Policy", "Trading Window Policy", "Board Compliance Program"],
    gaps: ["No cooling-off period language in current policy", "Missing board certification requirement", "Director trading plans not covered"],
    remediation: [
      { task: "Update Insider Trading Policy with 90-day cooling-off period", owner: "General Counsel", deadline: "2024-03-15", status: "in-progress" },
      { task: "Create board certification template", owner: "Compliance Officer", deadline: "2024-03-20", status: "pending" },
      { task: "Revise director trading plan templates", owner: "Associate", deadline: "2024-03-25", status: "pending" },
    ],
  },
  {
    id: "REG-2024-038",
    title: "NY DFS Cybersecurity Regulation Amendment (23 NYCRR 500)",
    agency: "NY DFS",
    jurisdiction: "New York",
    effectiveDate: "2024-04-15",
    publishedDate: "2024-02-01",
    impact: "high",
    status: "under-review",
    summary: "Enhanced requirements for Class A companies including independent CISO, annual independent audits, endpoint detection, and privileged access management. Expanded incident reporting to 72 hours.",
    affectedPolicies: ["Cybersecurity Policy", "Incident Response Plan", "Vendor Management Policy"],
    gaps: ["CISO independence requirements not met", "Audit cadence is biennial, not annual"],
    remediation: [
      { task: "Assess CISO reporting structure for independence", owner: "CISO", deadline: "2024-03-30", status: "in-progress" },
      { task: "Engage independent audit firm for annual assessment", owner: "Compliance Officer", deadline: "2024-04-01", status: "pending" },
    ],
  },
  {
    id: "REG-2024-031",
    title: "EU AI Act — High-Risk AI System Requirements",
    agency: "European Commission",
    jurisdiction: "EU",
    effectiveDate: "2024-08-01",
    publishedDate: "2024-03-01",
    impact: "high",
    status: "under-review",
    summary: "Classification framework for AI systems used in legal decision-making. Requires conformity assessments, human oversight mechanisms, and transparency documentation for high-risk legal AI.",
    affectedPolicies: ["AI Usage Policy", "Technology Governance", "Client Disclosure Policy"],
    gaps: ["No AI risk classification framework exists", "Missing conformity assessment procedure", "Client AI disclosure templates needed"],
    remediation: [
      { task: "Develop AI risk classification matrix", owner: "Technology Counsel", deadline: "2024-05-15", status: "pending" },
      { task: "Create conformity assessment SOP", owner: "Compliance Officer", deadline: "2024-06-01", status: "pending" },
      { task: "Draft client AI disclosure language", owner: "Senior Associate", deadline: "2024-05-30", status: "pending" },
    ],
  },
  {
    id: "REG-2024-025",
    title: "ABA Model Rule 1.1 — Duty of Technology Competence Update",
    agency: "ABA",
    jurisdiction: "Multi-State",
    effectiveDate: "2024-06-01",
    publishedDate: "2024-02-15",
    impact: "medium",
    status: "compliant",
    summary: "Updated guidance on attorney obligations regarding generative AI tools. Requires reasonable understanding of AI capabilities and limitations when used in client representation.",
    affectedPolicies: ["AI Acceptable Use Policy", "CLE Requirements"],
    gaps: [],
    remediation: [
      { task: "Update AI usage training materials", owner: "Training Coordinator", deadline: "2024-04-15", status: "complete" },
    ],
  },
];

const impactColor = (i: string) => i === "critical" ? "#ef4444" : i === "high" ? "#f59e0b" : i === "medium" ? PRISM_BLUE : "#22c55e";
const statusColor = (s: string) => s === "action-required" ? "#ef4444" : s === "under-review" ? "#f59e0b" : s === "compliant" ? "#22c55e" : "#6b7280";

export default function RegulatoryRadarPage() {
  const [expanded, setExpanded] = useState<string | null>(CHANGES[0].id);

  const actionRequired = CHANGES.filter(c => c.status === "action-required").length;
  const underReview = CHANGES.filter(c => c.status === "under-review").length;
  const totalGaps = CHANGES.reduce((s, c) => s + c.gaps.length, 0);

  return (
    <div className="min-h-screen" style={{ background: "#080c14" }}>
      <div className="max-w-7xl mx-auto px-6 py-8 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Regulatory Compliance Radar</h1>
            <p className="text-[11px] text-white/30 mt-1">Continuous regulatory change monitoring with automated policy mapping, gap detection, and remediation tracking</p>
          </div>
          <div className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 animate-pulse" style={{ color: "#22c55e" }} />
            <span className="text-[10px] text-white/30">Live Monitoring</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Action Required", value: actionRequired.toString(), icon: AlertTriangle, color: "#ef4444" },
            { label: "Under Review", value: underReview.toString(), icon: Eye, color: "#f59e0b" },
            { label: "Compliance Gaps", value: totalGaps.toString(), icon: XCircle, color: PRISM_RED },
            { label: "Jurisdictions Tracked", value: "4", icon: Globe, color: PRISM_BLUE },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <s.icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                <span className="text-[9px] uppercase tracking-wider text-white/25">{s.label}</span>
              </div>
              <p className="text-2xl font-semibold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {CHANGES.map(c => (
            <div key={c.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              <button onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                aria-label={`Toggle regulatory change ${c.title}`} className="w-full text-left p-5 flex items-center gap-4">
                <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: impactColor(c.impact) }} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-mono text-white/20">{c.id}</span>
                    <span className="text-[8px] uppercase font-bold tracking-wider rounded px-1.5 py-0.5" style={{ background: impactColor(c.impact) + "15", color: impactColor(c.impact) }}>{c.impact}</span>
                    <span className="text-[8px] uppercase font-bold tracking-wider rounded px-1.5 py-0.5" style={{ background: statusColor(c.status) + "15", color: statusColor(c.status) }}>{c.status.replace("-", " ")}</span>
                  </div>
                  <p className="text-sm font-medium text-white">{c.title}</p>
                  <p className="text-[10px] text-white/30">{c.agency} · {c.jurisdiction} · Effective {c.effectiveDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-white/25">{c.gaps.length} gaps</p>
                  <p className="text-[10px] text-white/25">{c.remediation.length} tasks</p>
                </div>
                <ChevronRight className={`h-4 w-4 text-white/15 transition-transform ${expanded === c.id ? "rotate-90" : ""}`} />
              </button>

              {expanded === c.id && (
                <div className="border-t border-white/[0.04] px-5 pb-5 pt-4 space-y-4">
                  <div className="rounded-lg bg-white/[0.015] border border-white/[0.04] p-3">
                    <p className="text-[10px] text-white/50 leading-relaxed">{c.summary}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-[9px] uppercase tracking-wider text-white/25 font-semibold mb-2">Affected Policies</h4>
                      {c.affectedPolicies.map(p => (
                        <div key={p} className="flex items-center gap-2 rounded-lg bg-white/[0.015] border border-white/[0.04] px-3 py-2 mb-1.5">
                          <FileText className="h-3 w-3 text-white/20" />
                          <span className="text-[10px] text-white/50">{p}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="text-[9px] uppercase tracking-wider text-white/25 font-semibold mb-2">Compliance Gaps Identified</h4>
                      {c.gaps.length === 0 ? (
                        <div className="flex items-center gap-2 rounded-lg bg-green-500/5 border border-green-500/10 px-3 py-2">
                          <CheckCircle className="h-3 w-3" style={{ color: "#22c55e" }} />
                          <span className="text-[10px]" style={{ color: "#22c55e" }}>No gaps — fully compliant</span>
                        </div>
                      ) : c.gaps.map(g => (
                        <div key={g} className="flex items-start gap-2 rounded-lg bg-red-500/5 border border-red-500/10 px-3 py-2 mb-1.5">
                          <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" style={{ color: "#ef4444" }} />
                          <span className="text-[10px] text-white/50">{g}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[9px] uppercase tracking-wider text-white/25 font-semibold mb-2">Remediation Tasks</h4>
                    <div className="space-y-1.5">
                      {c.remediation.map((r, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-lg bg-white/[0.015] border border-white/[0.04] p-3">
                          <div className="h-4 w-4 rounded flex items-center justify-center" style={{
                            background: r.status === "complete" ? "#22c55e20" : r.status === "in-progress" ? PRISM_GOLD + "20" : "rgba(255,255,255,0.03)",
                          }}>
                            {r.status === "complete" ? <CheckCircle className="h-3 w-3" style={{ color: "#22c55e" }} /> :
                             r.status === "in-progress" ? <Clock className="h-3 w-3" style={{ color: PRISM_GOLD }} /> :
                             <div className="h-2 w-2 rounded-sm bg-white/10" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] text-white/60">{r.task}</p>
                            <p className="text-[9px] text-white/20">{r.owner}</p>
                          </div>
                          <span className="text-[9px] text-white/25">{r.deadline}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
