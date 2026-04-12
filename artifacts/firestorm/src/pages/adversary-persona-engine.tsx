import { useState } from "react";
import {
  Users, Shield, Target, AlertTriangle, ChevronRight, Globe, Clock,
  Zap, Eye, TrendingUp, Brain, Network, Lock, Database, Server, Radio,
  Activity, Flag, MapPin, ChevronDown, ChevronUp, Flame
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

const BG = "#070A10";
const CARD = "#0c1220";
const BORDER = "#1a2235";

interface TTP {
  id: string;
  tactic: string;
  technique: string;
  subtechnique?: string;
  confidence: number;
}

interface AdversaryPersona {
  id: string;
  codename: string;
  aka: string[];
  nation: string;
  flag: string;
  motivation: "espionage" | "financial" | "disruption" | "hacktivism";
  sophistication: "nation-state" | "advanced" | "moderate";
  activeYears: string;
  primaryTargets: string[];
  ttps: TTP[];
  recentActivity: string;
  nextMoveRisk: "critical" | "high" | "moderate" | "low";
  nextMoves: string[];
  infrastructure: string[];
  associatedMalware: string[];
  historicalCampaigns: Array<{ year: string; name: string; impact: string }>;
  matchScore: number;
}

const ADVERSARIES: AdversaryPersona[] = [
  {
    id: "apt29",
    codename: "COZY BEAR",
    aka: ["APT29", "Midnight Blizzard", "The Dukes", "Iron Hemlock"],
    nation: "Russia",
    flag: "🇷🇺",
    motivation: "espionage",
    sophistication: "nation-state",
    activeYears: "2008–present",
    primaryTargets: ["Government", "Defense", "Think Tanks", "Healthcare", "Energy"],
    recentActivity: "Active spear-phishing campaigns using OAuth token theft against cloud environments. Observed in 14 confirmed intrusions Q1 2026.",
    nextMoveRisk: "critical",
    nextMoves: [
      "Cloud identity theft via OAuth consent phishing targeting Microsoft 365 tenants",
      "Supply chain compromise through trusted vendor software update channels",
      "Living-off-the-land lateral movement using legitimate admin tools (PsExec, WMI)",
      "Credential dumping via LSASS memory access on domain controllers",
    ],
    infrastructure: ["Bulletproof hosting (ASN 211680)", "Compromised WordPress sites as C2 proxies", "Azure free-tier tenants for staging"],
    associatedMalware: ["SUNBURST", "RAINDROP", "WellMess", "GoldFinder", "TrailBlazer"],
    ttps: [
      { id: "T1566.002", tactic: "Initial Access", technique: "Spearphishing Link", confidence: 95 },
      { id: "T1078.004", tactic: "Defense Evasion", technique: "Valid Accounts: Cloud Accounts", confidence: 90 },
      { id: "T1550.001", tactic: "Lateral Movement", technique: "Application Access Token", confidence: 88 },
      { id: "T1003.001", tactic: "Credential Access", technique: "OS Credential Dumping: LSASS Memory", confidence: 85 },
      { id: "T1567.002", tactic: "Exfiltration", technique: "Exfiltration to Cloud Storage", confidence: 82 },
      { id: "T1027.010", tactic: "Defense Evasion", technique: "Obfuscated Files: Command Obfuscation", confidence: 78 },
    ],
    historicalCampaigns: [
      { year: "2020", name: "SolarWinds / SUNBURST", impact: "18,000 organizations globally compromised" },
      { year: "2021", name: "Microsoft Exchange OAuth Campaign", impact: "Multiple U.S. government agencies breached" },
      { year: "2023", name: "Microsoft Corporate Email Breach", impact: "Senior executive communications exfiltrated" },
      { year: "2024", name: "HPE Hybrid Cloud Intrusion", impact: "6-month dwell time, persistent access confirmed" },
    ],
    matchScore: 94,
  },
  {
    id: "apt41",
    codename: "DOUBLE DRAGON",
    aka: ["APT41", "Winnti", "BARIUM", "Earth Baku", "Brass Typhoon"],
    nation: "China",
    flag: "🇨🇳",
    motivation: "espionage",
    sophistication: "nation-state",
    activeYears: "2012–present",
    primaryTargets: ["Technology", "Healthcare", "Telecom", "Gaming", "Finance"],
    recentActivity: "Targeting semiconductor supply chains and healthcare IP. Exploiting public-facing applications CVE-2024-series. 9 new victims Q1 2026.",
    nextMoveRisk: "high",
    nextMoves: [
      "Exploitation of Confluence/Atlassian vulnerabilities for initial access",
      "Rootkit deployment on ESXi hypervisors for persistent virtualization-layer access",
      "IP theft via memory-scraping of development environments and code repositories",
      "Watering hole attacks against industry association websites",
    ],
    infrastructure: ["Chinese domestic hosting (AS4538, AS23910)", "Compromised academic servers in Southeast Asia", "Fast-flux DNS infrastructure"],
    associatedMalware: ["CROSSWALK", "MESSAGETAP", "DEADEYE", "SPECULOOS", "LOWKEY"],
    ttps: [
      { id: "T1190", tactic: "Initial Access", technique: "Exploit Public-Facing Application", confidence: 92 },
      { id: "T1133", tactic: "Initial Access", technique: "External Remote Services", confidence: 88 },
      { id: "T1055.012", tactic: "Defense Evasion", technique: "Process Hollowing", confidence: 85 },
      { id: "T1112", tactic: "Defense Evasion", technique: "Modify Registry", confidence: 80 },
      { id: "T1074.001", tactic: "Collection", technique: "Local Data Staging", confidence: 78 },
    ],
    historicalCampaigns: [
      { year: "2020", name: "Global Healthcare IP Campaign", impact: "COVID-19 research data targeted across 12 countries" },
      { year: "2022", name: "Asian Gaming Supply Chain", impact: "32 gaming companies backdoored via update mechanism" },
      { year: "2023", name: "Telecom Interception Campaign", impact: "Call detail records of 100M+ users accessed" },
    ],
    matchScore: 71,
  },
  {
    id: "lazarus",
    codename: "GUARDIANS OF PEACE",
    aka: ["Lazarus Group", "Hidden Cobra", "ZINC", "Labyrinth Chollima"],
    nation: "North Korea",
    flag: "🇰🇵",
    motivation: "financial",
    sophistication: "advanced",
    activeYears: "2009–present",
    primaryTargets: ["Financial", "Cryptocurrency", "Defense", "Energy"],
    recentActivity: "Targeting DeFi protocols and cryptocurrency bridges. $1.2B stolen in crypto heists attributed Q4 2025–Q1 2026. Social engineering via fake job offers.",
    nextMoveRisk: "high",
    nextMoves: [
      "Fake recruiter LinkedIn campaigns targeting blockchain developers with malicious take-home coding tests",
      "Smart contract exploitation in DeFi bridge protocols",
      "SWIFT messaging system attacks on banks with weak correspondent banking controls",
      "Ransomware deployment as cover for financial theft operations",
    ],
    infrastructure: ["Mixing services (Tornado Cash descendants)", "Compromised North Korean university IP ranges", "Southeast Asian fintech intermediaries"],
    associatedMalware: ["BLINDINGCAN", "COPPERHEDGE", "HOPLIGHT", "TYPEFRAME", "AppleJeus"],
    ttps: [
      { id: "T1566.003", tactic: "Initial Access", technique: "Spearphishing via Service", confidence: 96 },
      { id: "T1059.007", tactic: "Execution", technique: "JavaScript", confidence: 89 },
      { id: "T1486", tactic: "Impact", technique: "Data Encrypted for Impact", confidence: 87 },
      { id: "T1070.004", tactic: "Defense Evasion", technique: "File Deletion", confidence: 83 },
    ],
    historicalCampaigns: [
      { year: "2016", name: "Bangladesh Bank SWIFT Heist", impact: "$81M stolen from central bank reserves" },
      { year: "2022", name: "Ronin Bridge Hack", impact: "$625M cryptocurrency stolen" },
      { year: "2024", name: "Radiant Capital DeFi Attack", impact: "$50M drained across chains" },
    ],
    matchScore: 58,
  },
  {
    id: "scattered-spider",
    codename: "SCATTERED SPIDER",
    aka: ["Muddled Libra", "Octo Tempest", "0ktapus", "UNC3944"],
    nation: "US/UK/Canada (cybercriminal network)",
    flag: "🌐",
    motivation: "financial",
    sophistication: "advanced",
    activeYears: "2022–present",
    primaryTargets: ["Hospitality", "Gaming", "Retail", "Telecom", "Insurance"],
    recentActivity: "Social engineering attacks on help desks to bypass MFA. MGM-style attacks on identity providers. 3 confirmed incidents in your sector Q1 2026.",
    nextMoveRisk: "critical",
    nextMoves: [
      "Help desk social engineering to reset MFA and bypass identity controls",
      "SIM swapping attacks on executive mobile accounts",
      "Okta and Azure AD tenant hijacking via compromised admin credentials",
      "Ransomware deployment (ALPHV/BlackCat affiliate) post-access",
    ],
    infrastructure: ["Residential proxy networks", "Telegram and Discord for coordination", "Legitimate cloud services for exfiltration"],
    associatedMalware: ["ALPHV/BlackCat", "Cobalt Strike", "Mimikatz", "ScreenConnect"],
    ttps: [
      { id: "T1078.004", tactic: "Initial Access", technique: "Valid Accounts: Cloud Accounts", confidence: 97 },
      { id: "T1656", tactic: "Defense Evasion", technique: "Impersonation", confidence: 94 },
      { id: "T1621", tactic: "Credential Access", technique: "Multi-Factor Authentication Request Generation", confidence: 91 },
      { id: "T1530", tactic: "Collection", technique: "Data from Cloud Storage", confidence: 88 },
    ],
    historicalCampaigns: [
      { year: "2023", name: "MGM Resorts Cyberattack", impact: "$100M business disruption, guest data exposed" },
      { year: "2023", name: "Caesars Entertainment Breach", impact: "$15M ransom paid, loyalty program data exfiltrated" },
      { year: "2022", name: "0ktapus Campaign", impact: "130+ organizations breached via Okta phishing" },
    ],
    matchScore: 88,
  },
];

const MOTIVATION_CONFIG = {
  espionage: { label: "State Espionage", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
  financial: { label: "Financial Gain", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  disruption: { label: "Disruption/Sabotage", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  hacktivism: { label: "Hacktivism", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
};

const RISK_CONFIG = {
  critical: { label: "CRITICAL", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  high: { label: "HIGH", color: "#f97316", bg: "rgba(249,115,22,0.12)" },
  moderate: { label: "MODERATE", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  low: { label: "LOW", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
};

const TACTIC_COLORS: Record<string, string> = {
  "Initial Access": "#ef4444",
  "Execution": "#f97316",
  "Persistence": "#f59e0b",
  "Privilege Escalation": "#eab308",
  "Defense Evasion": "#84cc16",
  "Credential Access": "#22c55e",
  "Discovery": "#14b8a6",
  "Lateral Movement": "#3b82f6",
  "Collection": "#8b5cf6",
  "Exfiltration": "#ec4899",
  "Impact": "#ef4444",
};

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 85 ? "#ef4444" : value >= 70 ? "#f97316" : "#f59e0b";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono w-8 text-right" style={{ color }}>{value}%</span>
    </div>
  );
}

function AdversaryCard({ persona, selected, onSelect }: { persona: AdversaryPersona; selected: boolean; onSelect: () => void }) {
  const motivCfg = MOTIVATION_CONFIG[persona.motivation];
  const riskCfg = RISK_CONFIG[persona.nextMoveRisk];

  return (
    <button
      onClick={onSelect}
      className="w-full text-left rounded-lg border transition-all"
      style={{
        background: selected ? "rgba(59,130,246,0.06)" : CARD,
        border: selected ? "1px solid rgba(59,130,246,0.3)" : `1px solid ${BORDER}`,
      }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">{persona.flag}</span>
              <div>
                <div className="text-xs font-bold text-slate-100 tracking-wide">{persona.codename}</div>
                <div className="text-[9px] text-slate-500">{persona.aka[0]} · {persona.nation}</div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: riskCfg.color, background: riskCfg.bg }}>
              {riskCfg.label} THREAT
            </span>
            <span className="text-[9px] font-mono text-slate-500">{persona.matchScore}% match</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-2.5">
          <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ color: motivCfg.color, background: motivCfg.bg }}>
            {motivCfg.label}
          </span>
          <span className="text-[9px] text-slate-500">·</span>
          <span className="text-[9px] text-slate-500">{persona.sophistication}</span>
        </div>

        <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">{persona.recentActivity}</p>

        <div className="mt-3 flex gap-1 flex-wrap">
          {persona.primaryTargets.slice(0, 3).map((t) => (
            <span key={t} className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8" }}>
              {t}
            </span>
          ))}
          {persona.primaryTargets.length > 3 && (
            <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "#64748b" }}>
              +{persona.primaryTargets.length - 3}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function NextMovePredictor({ persona }: { persona: AdversaryPersona }) {
  const riskCfg = RISK_CONFIG[persona.nextMoveRisk];
  return (
    <div className="rounded-lg border p-5" style={{ background: CARD, borderColor: BORDER }}>
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4" style={{ color: "#8b5cf6" }} />
        <span className="text-sm font-semibold text-slate-100">Next Move Predictor</span>
        <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded" style={{ color: riskCfg.color, background: riskCfg.bg }}>
          {riskCfg.label} PROBABILITY
        </span>
      </div>

      <div className="space-y-3">
        {persona.nextMoves.map((move, idx) => (
          <div key={idx} className="flex gap-3 p-3 rounded-md" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${riskCfg.color}18`, border: `1px solid ${riskCfg.color}30` }}>
              <span className="text-[9px] font-bold" style={{ color: riskCfg.color }}>{idx + 1}</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">{move}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 rounded-md" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
        <div className="text-[9px] uppercase tracking-widest font-medium text-purple-400 mb-1">AI Intelligence Assessment</div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Based on observed infrastructure patterns, current geopolitical context, and TTPs from the last 90 days, {persona.codename} is most likely to initiate a{" "}
          <span className="text-slate-200 font-medium">{persona.nextMoves[0].split(" ").slice(0, 5).join(" ").toLowerCase()}</span> campaign within the next 30–60 days.
          Confidence: <span style={{ color: riskCfg.color }} className="font-semibold">{persona.matchScore}%</span>.
        </p>
      </div>
    </div>
  );
}

function TTPMatrix({ ttps }: { ttps: TTP[] }) {
  return (
    <div className="rounded-lg border p-5" style={{ background: CARD, borderColor: BORDER }}>
      <div className="flex items-center gap-2 mb-4">
        <Network className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-semibold text-slate-100">TTP Mapping</span>
        <span className="text-[10px] text-slate-500 ml-1">MITRE ATT&CK</span>
      </div>

      <div className="space-y-2">
        {ttps.map((ttp) => {
          const tacticColor = TACTIC_COLORS[ttp.tactic] ?? "#64748b";
          return (
            <div key={ttp.id} className="rounded-md p-3" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${tacticColor}15`, color: tacticColor }}>
                    {ttp.tactic}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{ttp.id}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-300">{ttp.technique}</span>
                <ConfidenceBar value={ttp.confidence} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HistoricalCampaigns({ campaigns }: { campaigns: AdversaryPersona["historicalCampaigns"] }) {
  return (
    <div className="rounded-lg border p-5" style={{ background: CARD, borderColor: BORDER }}>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-semibold text-slate-100">Historical Attack Record</span>
      </div>

      <div className="relative pl-4">
        <div className="absolute left-0 top-0 bottom-0 w-px" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="space-y-4">
          {campaigns.map((c, idx) => (
            <div key={idx} className="relative">
              <div className="absolute -left-[17px] w-2 h-2 rounded-full" style={{ background: "#ef4444", top: 4 }} />
              <div className="text-[9px] font-mono text-slate-500 mb-0.5">{c.year}</div>
              <div className="text-[11px] font-semibold text-slate-200 mb-0.5">{c.name}</div>
              <div className="text-[10px] text-slate-400">{c.impact}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdversaryPersonaEngine() {
  const [selected, setSelected] = useState<string>("apt29");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const persona = ADVERSARIES.find((a) => a.id === selected) ?? ADVERSARIES[0];

  return (
    <div className="flex h-full" style={{ background: BG }}>
      <div className="w-80 shrink-0 flex flex-col border-r overflow-y-auto" style={{ borderColor: BORDER }}>
        <div className="p-5 border-b" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-red-400" />
            <h1 className="text-sm font-bold text-slate-100">Adversary Persona Engine</h1>
          </div>
          <p className="text-[10px] text-slate-500">AI-generated threat actor profiles with predicted next moves</p>
          <div className="mt-3 flex items-center gap-2 text-[9px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-slate-500">Intelligence updated 4 min ago · 4 active profiles</span>
          </div>
        </div>
        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          {ADVERSARIES.map((a) => (
            <AdversaryCard key={a.id} persona={a} selected={selected === a.id} onSelect={() => setSelected(a.id)} />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="rounded-lg border p-5" style={{ background: CARD, borderColor: BORDER }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl">{persona.flag}</span>
                <div>
                  <h2 className="text-xl font-bold tracking-wide" style={{ color: "#e2e8f0" }}>{persona.codename}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    {persona.aka.map((n) => (
                      <span key={n} className="text-[9px] font-mono text-slate-500">{n}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[10px] px-2 py-0.5 rounded font-medium" style={{ color: MOTIVATION_CONFIG[persona.motivation].color, background: MOTIVATION_CONFIG[persona.motivation].bg }}>
                  {MOTIVATION_CONFIG[persona.motivation].label}
                </span>
                <span className="text-[10px] text-slate-500">·</span>
                <span className="text-[10px] text-slate-500 capitalize">{persona.sophistication}</span>
                <span className="text-[10px] text-slate-500">·</span>
                <span className="text-[10px] text-slate-500">{persona.activeYears}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Infra Match Score</div>
              <div className="text-3xl font-bold font-mono" style={{ color: persona.matchScore >= 80 ? "#ef4444" : "#f59e0b" }}>
                {persona.matchScore}%
              </div>
              <div className="text-[9px] text-slate-500">vs. your environment</div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-md text-[11px] text-slate-300 leading-relaxed" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <span className="text-[9px] uppercase tracking-widest text-slate-500 block mb-1">Recent Activity Intelligence</span>
            {persona.recentActivity}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-1.5">Associated Malware</div>
              <div className="flex flex-wrap gap-1">
                {persona.associatedMalware.map((m) => (
                  <span key={m} className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.08)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.15)" }}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-1.5">Known Infrastructure</div>
              <div className="space-y-1">
                {persona.infrastructure.map((i) => (
                  <div key={i} className="text-[9px] text-slate-400 flex items-start gap-1">
                    <Server className="w-2.5 h-2.5 shrink-0 mt-0.5 text-slate-600" />
                    {i}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <NextMovePredictor persona={persona} />
        <TTPMatrix ttps={persona.ttps} />
        <HistoricalCampaigns campaigns={persona.historicalCampaigns} />
      </div>
    </div>
  );
}
