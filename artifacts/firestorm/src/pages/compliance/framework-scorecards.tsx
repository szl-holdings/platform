import { useState } from "react";
import { motion } from "framer-motion";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Shield, CheckCircle, AlertTriangle, FileText, Download, ChevronRight, Link2, Database } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

const FRAMEWORKS = [
  {
    id: "nist-800-53",
    name: "NIST 800-53 Rev 5",
    shortName: "NIST 800-53",
    color: "#3b82f6",
    score: 79,
    controls: 1000,
    implemented: 790,
    status: "In Progress",
    families: [
      { id: "AC", name: "Access Control", total: 25, implemented: 22, score: 88 },
      { id: "AU", name: "Audit & Accountability", total: 16, implemented: 14, score: 87 },
      { id: "CA", name: "Assessment & Authorization", total: 9, implemented: 7, score: 78 },
      { id: "CM", name: "Configuration Mgmt", total: 14, implemented: 11, score: 79 },
      { id: "CP", name: "Contingency Planning", total: 13, implemented: 10, score: 77 },
      { id: "IA", name: "Identification & Auth", total: 12, implemented: 11, score: 92 },
      { id: "IR", name: "Incident Response", total: 10, implemented: 8, score: 80 },
      { id: "MA", name: "Maintenance", total: 6, implemented: 4, score: 67 },
      { id: "MP", name: "Media Protection", total: 9, implemented: 7, score: 78 },
      { id: "PE", name: "Physical & Environ. Protection", total: 20, implemented: 14, score: 70 },
      { id: "PL", name: "Planning", total: 10, implemented: 8, score: 80 },
      { id: "PM", name: "Program Management", total: 16, implemented: 12, score: 75 },
      { id: "PS", name: "Personnel Security", total: 9, implemented: 8, score: 89 },
      { id: "RA", name: "Risk Assessment", total: 10, implemented: 8, score: 80 },
      { id: "SA", name: "System Acquisition", total: 23, implemented: 17, score: 74 },
      { id: "SC", name: "Sys & Comm. Protection", total: 51, implemented: 39, score: 76 },
      { id: "SI", name: "Sys & Info. Integrity", total: 23, implemented: 18, score: 78 },
      { id: "SR", name: "Supply Chain Risk", total: 12, implemented: 8, score: 67 },
    ],
  },
  {
    id: "nist-csf",
    name: "NIST CSF 2.0",
    shortName: "NIST CSF",
    color: "#10b981",
    score: 76,
    controls: 106,
    implemented: 81,
    status: "In Progress",
    families: [
      { id: "GV", name: "Govern", total: 6, implemented: 4, score: 67 },
      { id: "ID", name: "Identify", total: 21, implemented: 17, score: 81 },
      { id: "PR", name: "Protect", total: 29, implemented: 22, score: 76 },
      { id: "DE", name: "Detect", total: 18, implemented: 14, score: 78 },
      { id: "RS", name: "Respond", total: 17, implemented: 12, score: 71 },
      { id: "RC", name: "Recover", total: 15, implemented: 12, score: 80 },
    ],
  },
  {
    id: "soc2",
    name: "SOC 2 Type II",
    shortName: "SOC 2",
    color: "#8b5cf6",
    score: 91,
    controls: 65,
    implemented: 60,
    status: "Compliant",
    families: [
      { id: "CC", name: "Common Criteria (Security)", total: 35, implemented: 33, score: 94 },
      { id: "A", name: "Availability", total: 8, implemented: 7, score: 87 },
      { id: "PI", name: "Processing Integrity", total: 9, implemented: 8, score: 89 },
      { id: "C", name: "Confidentiality", total: 7, implemented: 6, score: 86 },
      { id: "P", name: "Privacy", total: 6, implemented: 6, score: 100 },
    ],
  },
  {
    id: "cmmc",
    name: "CMMC 2.0",
    shortName: "CMMC",
    color: "#f97316",
    score: 71,
    controls: 110,
    implemented: 78,
    status: "In Progress",
    families: [
      { id: "L1", name: "Level 1 (Basic)", total: 17, implemented: 17, score: 100 },
      { id: "L2-AC", name: "L2 Access Control", total: 22, implemented: 17, score: 77 },
      { id: "L2-AU", name: "L2 Audit", total: 9, implemented: 7, score: 78 },
      { id: "L2-CM", name: "L2 Config Mgmt", total: 9, implemented: 6, score: 67 },
      { id: "L2-IA", name: "L2 Identification", total: 11, implemented: 9, score: 82 },
      { id: "L2-IR", name: "L2 Incident Response", total: 3, implemented: 2, score: 67 },
      { id: "L2-MA", name: "L2 Maintenance", total: 6, implemented: 4, score: 67 },
      { id: "L2-PS", name: "L2 Personnel Security", total: 2, implemented: 2, score: 100 },
      { id: "L2-RA", name: "L2 Risk Assessment", total: 3, implemented: 2, score: 67 },
      { id: "L2-SC", name: "L2 Sys Comm", total: 16, implemented: 11, score: 69 },
      { id: "L2-SI", name: "L2 Sys Integrity", total: 12, implemented: 9, score: 75 },
    ],
  },
  {
    id: "fedramp",
    name: "FedRAMP Moderate",
    shortName: "FedRAMP",
    color: "#06b6d4",
    score: 74,
    controls: 323,
    implemented: 239,
    status: "Assessment",
    families: [
      { id: "AC", name: "Access Control", total: 35, implemented: 28, score: 80 },
      { id: "AU", name: "Audit", total: 22, implemented: 17, score: 77 },
      { id: "IA", name: "Identification", total: 18, implemented: 14, score: 78 },
      { id: "IR", name: "Incident Response", total: 14, implemented: 10, score: 71 },
      { id: "SC", name: "System Comm Protection", total: 48, implemented: 35, score: 73 },
      { id: "SI", name: "System Integrity", total: 32, implemented: 23, score: 72 },
    ],
  },
  {
    id: "iso27001",
    name: "ISO 27001:2022",
    shortName: "ISO 27001",
    color: "#f59e0b",
    score: 82,
    controls: 93,
    implemented: 76,
    status: "In Progress",
    families: [
      { id: "A.5", name: "Organizational Controls", total: 37, implemented: 31, score: 84 },
      { id: "A.6", name: "People Controls", total: 8, implemented: 7, score: 87 },
      { id: "A.7", name: "Physical Controls", total: 14, implemented: 11, score: 79 },
      { id: "A.8", name: "Technological Controls", total: 34, implemented: 27, score: 79 },
    ],
  },
  {
    id: "nis2",
    name: "NIS2 / BSI Act",
    shortName: "NIS2/BSI",
    color: "#ec4899",
    score: 68,
    controls: 42,
    implemented: 29,
    status: "Remediation",
    families: [
      { id: "Risk", name: "Risk Management", total: 8, implemented: 6, score: 75 },
      { id: "Incident", name: "Incident Handling", total: 7, implemented: 5, score: 71 },
      { id: "BCM", name: "Business Continuity", total: 5, implemented: 3, score: 60 },
      { id: "Supply", name: "Supply Chain", total: 6, implemented: 3, score: 50 },
      { id: "Crypto", name: "Cryptography", total: 4, implemented: 3, score: 75 },
      { id: "Human", name: "Human Resources", total: 5, implemented: 4, score: 80 },
      { id: "Access", name: "Access Control", total: 7, implemented: 5, score: 71 },
    ],
  },
];

const CROSS_MAPPING = [
  { control: "Access Control Policy", frameworks: ["NIST AC-2", "SOC 2 CC6.1", "ISO A.5.15", "CMMC AC.L2-3.1.1", "NIS2 Access"], status: "implemented", evidence: 4 },
  { control: "Multi-Factor Authentication", frameworks: ["NIST IA-2", "SOC 2 CC6.7", "ISO A.8.5", "FedRAMP IA-2", "CMMC IA.L2-3.5.3"], status: "implemented", evidence: 3 },
  { control: "Vulnerability Scanning", frameworks: ["NIST RA-5", "SOC 2 CC7.1", "ISO A.8.8", "CMMC RA.L2-3.11.2", "FedRAMP RA-5"], status: "partial", evidence: 2 },
  { control: "Incident Response Plan", frameworks: ["NIST IR-4", "SOC 2 CC7.3", "ISO A.5.24", "CMMC IR.L2-3.6.1", "NIS2 Incident"], status: "implemented", evidence: 5 },
  { control: "System & Comm. Protection", frameworks: ["NIST SC-7", "SOC 2 CC6.6", "ISO A.8.22", "FedRAMP SC-7", "CMMC SC.L2-3.13.1"], status: "partial", evidence: 1 },
];

export default function FrameworkScorecards() {
  const [selectedFramework, setSelectedFramework] = useState(FRAMEWORKS[0]);
  const [activeTab, setActiveTab] = useState<"overview" | "controls" | "crossmap">("overview");

  const radarData = FRAMEWORKS.slice(0, 6).map(f => ({
    subject: f.shortName,
    score: f.score,
    fullMark: 100,
  }));

  return (
    <div className="space-y-5 p-1">
      <header className="flex items-end justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="font-display text-lg font-bold text-orange-50 flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-400" /> Framework Scorecards
          </h1>
          <p className="text-orange-400/50 text-xs mt-0.5">Government-grade compliance across NIST 800-53, CSF 2.0, SOC 2, CMMC, FedRAMP, ISO 27001, NIS2/BSI</p>
        </motion.div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export SSP/POA&M
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-orange-500/10">
        {([["overview", "Framework Overview"], ["controls", "Control Catalog"], ["crossmap", "Cross-Framework Mapping"]] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn("px-4 py-2 text-xs font-semibold transition-colors border-b-2 -mb-px",
              activeTab === tab ? "border-orange-400 text-orange-300" : "border-transparent text-orange-400/40 hover:text-orange-300/70"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-5 flex flex-col items-center justify-center"
          >
            <h3 className="text-xs font-semibold text-orange-50 mb-3 w-full">Coverage Radar</h3>
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="rgba(249,115,22,0.15)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(251,146,60,0.6)", fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#09080f", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 8 }} />
                  <Radar name="Score" dataKey="score" stroke="rgba(239,68,68,0.8)" fill="rgba(239,68,68,0.2)" animationDuration={1500} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {FRAMEWORKS.map((fw, i) => {
              const pct = (fw.implemented / fw.controls) * 100;
              return (
                <motion.div
                  key={fw.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.05 }}
                  onClick={() => { setSelectedFramework(fw); setActiveTab("controls"); }}
                  className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-4 hover:-translate-y-0.5 transition-transform duration-300 cursor-pointer relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-bold mb-0.5" style={{ color: `${fw.color}80` }}>
                        {fw.status}
                      </div>
                      <h3 className="text-sm font-bold text-orange-50">{fw.name}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold font-mono" style={{ color: fw.score >= 85 ? "#22c55e" : fw.score >= 70 ? "#f59e0b" : "#ef4444" }}>{fw.score}%</div>
                      <div className="text-[9px] text-orange-400/40">{fw.implemented}/{fw.controls} controls</div>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${fw.color}60, ${fw.color})` }} />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                    <span>{fw.families.length} control families</span>
                    <div className="flex items-center gap-1" style={{ color: fw.color }}>
                      <ChevronRight className="w-3 h-3" /> View controls
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "controls" && (
        <div className="grid grid-cols-1 xl:grid-cols-[200px_1fr] gap-5">
          <div className="space-y-1.5">
            {FRAMEWORKS.map((fw) => (
              <button
                key={fw.id}
                onClick={() => setSelectedFramework(fw)}
                className={cn("w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all",
                  selectedFramework.id === fw.id ? "text-white" : "text-orange-400/50 hover:text-orange-300"
                )}
                style={selectedFramework.id === fw.id ? { background: `${fw.color}12`, border: `1px solid ${fw.color}25` } : { border: "1px solid transparent" }}
              >
                <div className="font-semibold">{fw.shortName}</div>
                <div className="text-[9px] mt-0.5 opacity-60">{fw.score}% · {fw.implemented}/{fw.controls}</div>
              </button>
            ))}
          </div>

          <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-orange-50">{selectedFramework.name} — Control Families</h3>
              <span className="text-xs font-mono" style={{ color: selectedFramework.color }}>{selectedFramework.score}% overall</span>
            </div>

            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={selectedFramework.families} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="id" tick={{ fontSize: 9, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: "#0a0d14", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="score" fill={selectedFramework.color} opacity={0.8} radius={[2, 2, 0, 0]} name="Score %" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
              {selectedFramework.families.map((fam) => (
                <div key={fam.id} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <span className="text-[9px] font-mono font-bold w-10 shrink-0" style={{ color: selectedFramework.color }}>{fam.id}</span>
                  <span className="text-[11px] text-orange-200/60 flex-1 min-w-0 truncate">{fam.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${fam.score}%`, background: fam.score >= 80 ? "#22c55e" : fam.score >= 65 ? "#f59e0b" : "#ef4444" }} />
                    </div>
                    <span className="text-[10px] font-mono w-8 text-right" style={{ color: fam.score >= 80 ? "#22c55e" : fam.score >= 65 ? "#f59e0b" : "#ef4444" }}>{fam.score}%</span>
                    <span className="text-[9px] text-white/20 w-12 text-right">{fam.implemented}/{fam.total}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "crossmap" && (
        <div className="space-y-3">
          <div className="rounded-xl border border-orange-500/10 bg-orange-500/5 p-4">
            <div className="text-[10px] uppercase tracking-wider font-bold text-orange-400/60 mb-3 flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5" /> Cross-Framework Control Mapping
            </div>
            <div className="space-y-2">
              {CROSS_MAPPING.map((item) => (
                <div key={item.control} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      {item.status === "implemented" ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                      <span className="text-xs font-semibold text-white/80">{item.control}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Database className="w-3 h-3 text-white/25" />
                      <span className="text-[9px] text-white/30">{item.evidence} evidence files</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.frameworks.map((fw) => (
                      <span key={fw} className="text-[9px] font-mono px-2 py-0.5 rounded border border-orange-500/15 bg-orange-500/5 text-orange-300/60">{fw}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-orange-500/10 bg-orange-500/5 p-4">
              <div className="text-[10px] uppercase tracking-wider font-bold text-orange-400/60 mb-3 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" /> SSP/POA&M Generation
              </div>
              <div className="space-y-2">
                {[
                  { name: "System Security Plan (SSP)", desc: "FedRAMP/NIST 800-53 template", status: "Ready" },
                  { name: "Plan of Action & Milestones (POA&M)", desc: "Open findings with remediation plans", status: "Ready" },
                  { name: "Statement of Applicability (SoA)", desc: "ISO 27001 Annex A mapping", status: "Ready" },
                  { name: "CMMC Assessment Report", desc: "Level 2 readiness package", status: "Draft" },
                  { name: "NIS2 Incident Report Template", desc: "24h/72h/1mo notification format", status: "Ready" },
                ].map((doc) => (
                  <div key={doc.name} className="flex items-center gap-3 p-2.5 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.03] transition-colors cursor-pointer group">
                    <FileText className="w-3.5 h-3.5 text-orange-400/50 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-orange-100/70">{doc.name}</div>
                      <div className="text-[9px] text-orange-400/30">{doc.desc}</div>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Download className="w-3.5 h-3.5 text-orange-400" />
                    </div>
                    <span className={cn("text-[9px] font-bold shrink-0", doc.status === "Ready" ? "text-emerald-400" : "text-amber-400")}>{doc.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-orange-500/10 bg-orange-500/5 p-4">
              <div className="text-[10px] uppercase tracking-wider font-bold text-orange-400/60 mb-3">Compliance Readiness Summary</div>
              <div className="space-y-2">
                {FRAMEWORKS.map((fw) => (
                  <div key={fw.id} className="flex items-center gap-3">
                    <div className="text-[9px] font-mono w-16 shrink-0" style={{ color: fw.color }}>{fw.shortName}</div>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${fw.score}%`, background: `linear-gradient(90deg, ${fw.color}60, ${fw.color})` }} />
                    </div>
                    <div className="text-[10px] font-mono w-8 text-right shrink-0" style={{ color: fw.score >= 85 ? "#22c55e" : fw.score >= 70 ? "#f59e0b" : "#ef4444" }}>{fw.score}%</div>
                    <span className={cn("text-[8px] font-bold uppercase w-16 text-right shrink-0", fw.status === "Compliant" ? "text-emerald-400" : fw.status === "Remediation" ? "text-red-400" : "text-amber-400")}>{fw.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
