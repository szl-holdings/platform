import { useState } from "react";
import {
  FileText, Shield, TrendingUp, TrendingDown, AlertTriangle,
  Download, CheckCircle, Clock, BarChart3, Building2, Eye,
  Target, ChevronRight, Loader2, RefreshCw, Lock
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

const BG = "#070A10";
const CARD = "#0c1220";
const BORDER = "#1a2235";

interface RiskNarrative {
  executiveSummary: string;
  overallScore: number;
  scoreTrend: "improving" | "declining" | "stable";
  peerBenchmark: number;
  sections: Array<{
    id: string;
    title: string;
    icon: typeof Shield;
    color: string;
    content: string[];
    metrics?: Array<{ label: string; value: string; trend?: "up" | "down" | "flat" }>;
  }>;
  recommendedActions: Array<{ priority: "critical" | "high" | "medium"; action: string; owner: string; timeline: string; businessImpact: string }>;
  certificationStatement: string;
}

const MOCK_NARRATIVE: RiskNarrative = {
  executiveSummary: `The organization's security posture for Q1 2026 is assessed as ELEVATED RISK with a Risk-Adjusted Security Score of 61/100 — 12 points below the Fortune 500 peer median. Three factors drive this elevated assessment: (1) an active, contained ransomware incident from February that revealed gaps in backup isolation; (2) identity infrastructure vulnerabilities in our Azure AD tenant that remain partially unmitigated; and (3) third-party vendor risk concentration in two strategic partners with below-average security ratings. The security team has made measurable progress: mean time to detect (MTTD) improved 34% quarter-over-quarter, and 94% of critical CVEs were patched within SLA. Targeted investments in identity hardening and backup architecture are recommended to achieve peer-median posture by Q3 2026.`,
  overallScore: 61,
  scoreTrend: "improving",
  peerBenchmark: 73,
  sections: [
    {
      id: "incidents",
      title: "Significant Security Events",
      icon: AlertTriangle,
      color: "#ef4444",
      content: [
        "A ransomware deployment (LockBit 3.0) was contained on February 14, 2026, affecting 12 endpoints before isolation. No customer data was exfiltrated. Estimated business disruption: $2.1M in response and recovery costs. Post-incident forensics confirmed the root cause as a compromised service account credential discovered in a dark web credential dump.",
        "Three high-severity phishing campaigns were identified and contained in Q1, with the most sophisticated mimicking Microsoft Entra ID authentication prompts. All three were attributed to the SCATTERED SPIDER threat group currently targeting our industry sector.",
        "A third-party vendor (Nexpoint IT Services) disclosed a supply chain compromise in March 2026. A thorough review confirmed our environment was isolated — no lateral movement was detected from our vendor integration endpoints.",
      ],
    },
    {
      id: "posture",
      title: "Security Posture & Risk Score",
      icon: Shield,
      color: "#3b82f6",
      content: [
        "The organization's Risk-Adjusted Security Score of 61/100 reflects strong performance in detection and response while indicating meaningful gaps in preventive architecture. The score is derived from 47 weighted security control categories assessed against NIST CSF 2.0 and CIS Controls v8.",
        "Peer benchmarking against 38 organizations in our sector (revenue band $1B–$5B) places us at the 29th percentile — below median but above the 'high risk' threshold of the lowest quartile. Industry leaders in our peer group score 84–91, driven primarily by Zero Trust architecture maturity and third-party risk management programs.",
      ],
      metrics: [
        { label: "Identity Security", value: "52/100", trend: "up" },
        { label: "Endpoint Protection", value: "78/100", trend: "up" },
        { label: "Network Segmentation", value: "64/100", trend: "flat" },
        { label: "Cloud Security", value: "58/100", trend: "up" },
        { label: "Third-Party Risk", value: "41/100", trend: "down" },
        { label: "Incident Response", value: "81/100", trend: "up" },
      ],
    },
    {
      id: "compliance",
      title: "Regulatory & Compliance Status",
      icon: CheckCircle,
      color: "#22c55e",
      content: [
        "SOC 2 Type II audit was completed February 2026 with zero exceptions — our second consecutive clean opinion. The auditors noted specific improvement in access review processes and evidence collection automation.",
        "PCI DSS 4.0 transition is on track for the June 2026 deadline. 87% of new requirements have been implemented; 13% remain in progress, all on schedule. No compensating controls are required for the current assessment period.",
        "GDPR compliance posture remains strong. Our DPA maintained the standard contractual clauses with all 14 EU-based data processors, and no data subject rights requests were outstanding at quarter-end.",
      ],
    },
    {
      id: "threats",
      title: "External Threat Landscape",
      icon: Target,
      color: "#f97316",
      content: [
        "The threat environment facing our sector has intensified in Q1 2026. SCATTERED SPIDER attacks against hospitality, retail, and financial services increased 140% year-over-year. Our industry sector is now the second most targeted vertical after healthcare.",
        "Ransomware group activity is at historic highs, with a 67% increase in Q1 2026 attacks against organizations in our revenue band. Average ransom demand for comparable organizations: $8.2M. Average recovery time without cyber insurance: 23 days.",
        "Supply chain risks remain acute. The XZ Utils backdoor discovery model (trusted contributor compromise) has spawned copycat attempts in 14 open-source packages used across the software industry, 3 of which are in our approved software inventory and are under review.",
      ],
    },
  ],
  recommendedActions: [
    {
      priority: "critical",
      action: "Implement Privileged Access Management (PAM) for all service accounts",
      owner: "CISO + IT Infrastructure",
      timeline: "60 days",
      businessImpact: "Eliminates primary attack vector used in February ransomware incident. Estimated risk reduction: 18 points on identity security subscore.",
    },
    {
      priority: "critical",
      action: "Isolate and test backup infrastructure — implement air-gapped backup for Tier 1 systems",
      owner: "IT Operations",
      timeline: "45 days",
      businessImpact: "Current backup architecture would allow ransomware to reach backup targets. Recovery time objective (RTO) without this: 23 days vs. target of 4 hours.",
    },
    {
      priority: "high",
      action: "Complete Conditional Access policy rollout — enforce MFA for all administrative roles",
      owner: "IT Security",
      timeline: "30 days",
      businessImpact: "Blocks the most common initial access vector for SCATTERED SPIDER-style attacks. Estimated prevention value: $2M+ per avoided incident.",
    },
    {
      priority: "high",
      action: "Conduct emergency security assessment of Nexpoint IT Services integration points",
      owner: "Third-Party Risk Team",
      timeline: "21 days",
      businessImpact: "Third-party risk concentration: two vendors represent 67% of our external attack surface. Mandatory for cyber insurance renewal in Q2.",
    },
    {
      priority: "medium",
      action: "Deploy network segmentation between workstation and server VLANs (SMB/RPC isolation)",
      owner: "Network Engineering",
      timeline: "90 days",
      businessImpact: "Lateral movement containment — limits blast radius of any endpoint compromise to 1 VLAN vs. the entire network. ROI: estimated $4.2M in avoided downtime per contained incident.",
    },
  ],
  certificationStatement: "This security posture narrative has been reviewed and certified by the Chief Information Security Officer. The assessments, metrics, and forward-looking statements reflect the organization's current understanding of its security environment based on available telemetry, third-party assessments, and industry intelligence as of April 12, 2026. This document is CONFIDENTIAL — BOARD OF DIRECTORS USE ONLY.",
};

const PRIORITY_CONFIG = {
  critical: { label: "CRITICAL", color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
  high: { label: "HIGH", color: "#f97316", bg: "rgba(249,115,22,0.08)" },
  medium: { label: "MEDIUM", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
};

function ScoreGauge({ score, benchmark }: { score: number; benchmark: number }) {
  const angle = (score / 100) * 180 - 90;
  const benchAngle = (benchmark / 100) * 180 - 90;
  const radius = 70;
  const cx = 90;
  const cy = 90;

  function polarToXY(deg: number, r: number) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  const scoreColor = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";

  const startPt = polarToXY(-90, radius);
  const endPt = polarToXY(90, radius);
  const currPt = polarToXY(angle, radius);
  const benchPt = polarToXY(benchAngle, radius);

  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="110" viewBox="0 0 180 120">
        <path d={`M ${startPt.x} ${startPt.y} A ${radius} ${radius} 0 0 1 ${endPt.x} ${endPt.y}`} fill="none" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
        <path d={`M ${startPt.x} ${startPt.y} A ${radius} ${radius} 0 0 1 ${currPt.x} ${currPt.y}`} fill="none" stroke={scoreColor} strokeWidth="10" strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={benchPt.x} y2={benchPt.y} stroke="#64748b" strokeWidth="2" strokeDasharray="4 2" />
        <circle cx={benchPt.x} cy={benchPt.y} r={4} fill="#64748b" />
        <text x={cx} y={cy + 8} textAnchor="middle" fill={scoreColor} fontSize="22" fontWeight="700" fontFamily="monospace">{score}</text>
        <text x={cx} y={cy + 22} textAnchor="middle" fill="#475569" fontSize="9">/ 100</text>
      </svg>
      <div className="flex items-center gap-3 text-[9px]">
        <span className="flex items-center gap-1" style={{ color: scoreColor }}><span className="w-2 h-0.5 rounded" style={{ background: scoreColor }} /> Your score: {score}</span>
        <span className="flex items-center gap-1 text-slate-500"><span className="w-2 h-0.5 rounded bg-slate-500" style={{ borderStyle: "dashed" }} /> Peer median: {benchmark}</span>
      </div>
    </div>
  );
}

export default function BoardReadyRiskNarrative() {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const narrative = MOCK_NARRATIVE;

  function handleGenerate() {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 2200);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: BG }}>
      <div className="p-5 border-b shrink-0 flex items-center justify-between" style={{ borderColor: BORDER }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-cyan-400" />
            <h1 className="text-sm font-bold text-slate-100">Board-Ready Risk Narrative</h1>
          </div>
          <p className="text-[10px] text-slate-500">One-click executive security posture report in business language — no charts or graphs for the C-suite</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: "rgba(6,182,212,0.12)", color: "#22d3ee", border: "1px solid rgba(6,182,212,0.25)" }}
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {generating ? "Generating…" : generated ? "Regenerate Narrative" : "Generate Board Report"}
          </button>
          {generated && (
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: "rgba(255,255,255,0.04)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          )}
        </div>
      </div>

      {!generated && !generating && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center" style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)" }}>
              <FileText className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <div className="text-base font-semibold text-slate-200 mb-1">Generate Your Board Narrative</div>
              <div className="text-sm text-slate-500 max-w-sm">
                Click "Generate Board Report" to create an executive-language security posture narrative from your live security data.
              </div>
            </div>
          </div>
        </div>
      )}

      {generating && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
            <div className="text-sm text-slate-400">Synthesizing security intelligence into executive narrative…</div>
            <div className="text-[10px] text-slate-600">Analyzing 847 incidents · 38 peer benchmarks · 47 control categories</div>
          </div>
        </div>
      )}

      {generated && (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto w-full">
          <div className="rounded-lg border p-6" style={{ background: CARD, borderColor: BORDER }}>
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-3 h-3 text-slate-500" />
              <span className="text-[9px] text-slate-500 uppercase tracking-widest">Confidential — Board of Directors · Q1 2026 Security Posture Report</span>
            </div>
            <div className="text-[10px] text-slate-600">Acme Corporation · Prepared by Office of the CISO · April 12, 2026</div>

            <div className="mt-6 flex items-start gap-8">
              <ScoreGauge score={narrative.overallScore} benchmark={narrative.peerBenchmark} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-bold text-slate-100">Executive Summary</span>
                  <span className="ml-auto flex items-center gap-1 text-[9px]" style={{ color: narrative.scoreTrend === "improving" ? "#22c55e" : "#ef4444" }}>
                    {narrative.scoreTrend === "improving" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {narrative.scoreTrend === "improving" ? "Improving" : "Declining"} trend QoQ
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{narrative.executiveSummary}</p>
              </div>
            </div>
          </div>

          {narrative.sections.map((section) => (
            <div key={section.id} className="rounded-lg border p-5" style={{ background: CARD, borderColor: BORDER }}>
              <div className="flex items-center gap-2 mb-4">
                <section.icon className="w-4 h-4" style={{ color: section.color }} />
                <span className="text-sm font-semibold text-slate-100">{section.title}</span>
              </div>
              <div className="space-y-3">
                {section.content.map((para, idx) => (
                  <p key={idx} className="text-[11px] text-slate-300 leading-relaxed">{para}</p>
                ))}
              </div>
              {section.metrics && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {section.metrics.map((m) => (
                    <div key={m.label} className="rounded-md p-2.5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="text-[9px] text-slate-500 mb-0.5">{m.label}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold font-mono text-slate-200">{m.value}</span>
                        {m.trend === "up" && <TrendingUp className="w-3 h-3 text-green-400" />}
                        {m.trend === "down" && <TrendingDown className="w-3 h-3 text-red-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="rounded-lg border p-5" style={{ background: CARD, borderColor: BORDER }}>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-slate-100">Recommended Actions — Board Priorities</span>
            </div>
            <div className="space-y-3">
              {narrative.recommendedActions.map((rec, idx) => {
                const cfg = PRIORITY_CONFIG[rec.priority];
                return (
                  <div key={idx} className="rounded-lg p-4" style={{ background: cfg.bg, border: `1px solid ${cfg.color}20` }}>
                    <div className="flex items-start gap-3">
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5" style={{ color: cfg.color, background: `${cfg.color}15` }}>
                        {cfg.label}
                      </span>
                      <div className="flex-1">
                        <div className="text-[11px] font-semibold text-slate-200 mb-1">{rec.action}</div>
                        <div className="text-[10px] text-slate-400 mb-2">{rec.businessImpact}</div>
                        <div className="flex items-center gap-3 text-[9px] text-slate-500">
                          <span>Owner: <span className="text-slate-400">{rec.owner}</span></span>
                          <span>Timeline: <span className="text-slate-400">{rec.timeline}</span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border p-4" style={{ background: "rgba(255,255,255,0.01)", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-start gap-2">
              <Lock className="w-3 h-3 text-slate-600 shrink-0 mt-0.5" />
              <p className="text-[9px] text-slate-600 leading-relaxed">{narrative.certificationStatement}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
