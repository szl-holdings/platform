import { useState, useEffect, useRef } from "react";
import {
  Play, Pause, SkipBack, SkipForward, ChevronRight,
  Shield, AlertTriangle, Server, Database, Users, Globe,
  Lock, Zap, Eye, Monitor, Network, CheckCircle, XCircle,
  Activity, Clock, Target
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

const BG = "#070A10";
const CARD = "#0c1220";
const BORDER = "#1a2235";

type AttackNode = "internet" | "perimeter" | "endpoint" | "lateral" | "dc" | "data";

interface AttackStep {
  id: number;
  label: string;
  technique: string;
  mitreId: string;
  tactic: string;
  description: string;
  targetNode: AttackNode;
  duration: number;
  controlsFired: string[];
  controlsPassed: string[];
  ioc: string;
  severity: "critical" | "high" | "medium" | "low";
}

interface AttackScenario {
  id: string;
  name: string;
  threat: string;
  description: string;
  steps: AttackStep[];
}

const SCENARIOS: AttackScenario[] = [
  {
    id: "apt29-cloud",
    name: "APT29 Cloud Identity Takeover",
    threat: "COZY BEAR",
    description: "Nation-state OAuth phishing campaign leading to persistent cloud access and data exfiltration",
    steps: [
      {
        id: 1, label: "Initial Phishing Email", technique: "Spearphishing Link", mitreId: "T1566.002", tactic: "Initial Access",
        description: "A highly targeted spearphishing email is sent to the CFO's executive assistant, impersonating a Microsoft security alert. The link leads to a fake OAuth consent page hosted on a typosquat domain (microsoftonline-security[.]com).",
        targetNode: "internet", duration: 3000, severity: "medium",
        controlsFired: ["Email Security Gateway"], controlsPassed: [],
        ioc: "microsoftonline-security[.]com / IP: 185.220.101.47",
      },
      {
        id: 2, label: "OAuth Token Harvested", technique: "Application Access Token", mitreId: "T1550.001", tactic: "Defense Evasion",
        description: "The victim clicks the link and grants OAuth consent to a malicious app registered in a compromised Azure tenant. The adversary now holds a refresh token with Mail.Read and Files.Read.All permissions — bypassing MFA entirely.",
        targetNode: "perimeter", duration: 3500, severity: "high",
        controlsFired: ["Azure AD Sign-in Risk Policy"], controlsPassed: ["MFA"],
        ioc: "AppID: a9bc2d8f-..., Tenant: 3f7a9c21-... OAuth scope: Mail.Read, Files.ReadWrite.All",
      },
      {
        id: 3, label: "Mailbox Reconnaissance", technique: "Email Collection", mitreId: "T1114.002", tactic: "Collection",
        description: "Using the harvested OAuth token, the adversary accesses the victim's mailbox via Microsoft Graph API. Automated scripts enumerate contacts, forward rules, and search for keywords: 'password', 'login', 'VPN', 'budget', 'acquisition'.",
        targetNode: "endpoint", duration: 4000, severity: "high",
        controlsFired: ["DLP Policy"], controlsPassed: [],
        ioc: "Graph API calls from IP 45.148.120.33 — 4,200 requests in 90 minutes",
      },
      {
        id: 4, label: "Lateral Movement via Shared Credentials", technique: "Valid Accounts", mitreId: "T1078.003", tactic: "Lateral Movement",
        description: "Email reconnaissance reveals a shared service account password in a Slack-exported conversation. The adversary authenticates as svc-reportgen@company.com — an account with access to 14 internal systems.",
        targetNode: "lateral", duration: 3500, severity: "critical",
        controlsFired: ["UEBA Anomaly Detection"], controlsPassed: [],
        ioc: "svc-reportgen login from Netherlands (ASN 43350) — first time in 8 months",
      },
      {
        id: 5, label: "Domain Controller Access", technique: "OS Credential Dumping: LSASS", mitreId: "T1003.001", tactic: "Credential Access",
        description: "The service account has logon rights to the primary domain controller. The adversary uses a custom LSASS dump tool (evading Defender via handle manipulation) to extract Kerberos tickets and NTLM hashes for 847 domain users.",
        targetNode: "dc", duration: 4500, severity: "critical",
        controlsFired: ["EDR — Suspicious Process"], controlsPassed: ["Antivirus"],
        ioc: "lsass.exe accessed by svc-reportgen via OpenProcess handle — custom tool signature",
      },
      {
        id: 6, label: "Data Exfiltration via SharePoint", technique: "Exfiltration to Cloud Storage", mitreId: "T1567.002", tactic: "Exfiltration",
        description: "Using harvested credentials for the CTO's SharePoint admin account, the adversary bulk-downloads 47GB of product roadmaps, M&A documents, and source code. Data is staged to a legitimate OneDrive tenant before being forwarded to adversary infrastructure.",
        targetNode: "data", duration: 5000, severity: "critical",
        controlsFired: ["DLP — Bulk Download Alert"], controlsPassed: ["CASB Policy"],
        ioc: "47GB SharePoint download in 18 minutes — destination: one-drive-backup-corp[.]com",
      },
    ],
  },
  {
    id: "scattered-spider-helpdesk",
    name: "Scattered Spider Help Desk Attack",
    threat: "SCATTERED SPIDER",
    description: "Social engineering of IT help desk to bypass MFA, followed by identity provider takeover and ransomware",
    steps: [
      {
        id: 1, label: "OSINT Targeting", technique: "Gather Victim Identity Information", mitreId: "T1589.001", tactic: "Reconnaissance",
        description: "Attacker gathers employee information from LinkedIn, corporate website, and a previously leaked database. They identify the help desk queue phone number and a junior IT administrator's name (Tyler, who started 3 weeks ago).",
        targetNode: "internet", duration: 2500, severity: "low",
        controlsFired: [], controlsPassed: [],
        ioc: "LinkedIn scraping, leaked employee DB from 2024 incident (Pastebin reference)",
      },
      {
        id: 2, label: "Help Desk Social Engineering", technique: "Phishing for Information: Impersonation", mitreId: "T1598.002", tactic: "Initial Access",
        description: "Attacker calls help desk posing as 'Ryan Hernandez, VP Finance, traveling in London.' They claim phone was stolen and beg for MFA reset. Tyler — eager to help — bypasses identity verification and resets MFA for the real Ryan's account.",
        targetNode: "perimeter", duration: 3000, severity: "critical",
        controlsFired: [], controlsPassed: ["Identity Verification Policy"],
        ioc: "Help desk ticket #58291 — MFA reset without manager approval or callback verification",
      },
      {
        id: 3, label: "Okta Admin Console Compromise", technique: "Modify Authentication Process", mitreId: "T1556.006", tactic: "Persistence",
        description: "Using Ryan's credentials, attacker logs into Okta admin console. They add a silent authentication factor (attacker-controlled phone), grant admin rights to a newly created ghost account, and disable conditional access policies for the Finance group.",
        targetNode: "endpoint", duration: 3500, severity: "critical",
        controlsFired: ["Okta Admin Alert"], controlsPassed: ["SIEM Correlation"],
        ioc: "New admin account: r.hernandez.backup@company.com — created 2:47 AM UTC",
      },
      {
        id: 4, label: "Azure AD Enumeration & Privilege Escalation", technique: "Valid Accounts: Cloud Accounts", mitreId: "T1078.004", tactic: "Privilege Escalation",
        description: "With Okta fully compromised, attacker federates into Azure AD. They enumerate all applications with high-privilege service principals and identify an unmonitored legacy sync account with Global Admin rights.",
        targetNode: "lateral", duration: 3000, severity: "critical",
        controlsFired: ["Azure AD Identity Protection"], controlsPassed: [],
        ioc: "Graph API enumeration: 2,100 calls in 8 minutes — AzureAD Service Principal discovery",
      },
      {
        id: 5, label: "Ransomware Staging", technique: "Ingress Tool Transfer", mitreId: "T1105", tactic: "Command and Control",
        description: "Using SFTP access obtained via the legacy sync account, attacker deploys ALPHV/BlackCat ransomware encryptor to 6 file servers via a scheduled task disguised as a Microsoft update. Deployment is staged across a weekend to avoid detection.",
        targetNode: "dc", duration: 4000, severity: "critical",
        controlsFired: ["EDR File Quarantine"], controlsPassed: ["Backup Monitoring"],
        ioc: "svchost-update.exe (SHA256: 4a8f3c...) — ALPHV ransom note string detected",
      },
      {
        id: 6, label: "Mass Encryption Event", technique: "Data Encrypted for Impact", mitreId: "T1486", tactic: "Impact",
        description: "ALPHV executes across 847 endpoints simultaneously on Sunday 3:14 AM. File servers, development repositories, and 3 backup targets are encrypted. Ransom demand: $15M in Monero. Business disruption estimated $100M.",
        targetNode: "data", duration: 5000, severity: "critical",
        controlsFired: ["EDR — Mass File Modification", "SIEM — Ransomware Pattern"], controlsPassed: ["Backup Integrity Check"],
        ioc: "847 endpoints simultaneously writing .alphv extension — cryptographic entropy spike",
      },
    ],
  },
];

const NODE_CONFIG: Record<AttackNode, { label: string; icon: typeof Server; x: number; y: number }> = {
  internet: { label: "Internet", icon: Globe, x: 80, y: 140 },
  perimeter: { label: "Perimeter / Cloud IdP", icon: Shield, x: 220, y: 140 },
  endpoint: { label: "Endpoint / Mailbox", icon: Monitor, x: 380, y: 90 },
  lateral: { label: "Internal Network", icon: Network, x: 380, y: 190 },
  dc: { label: "Domain Controller", icon: Server, x: 540, y: 140 },
  data: { label: "Data / SharePoint", icon: Database, x: 680, y: 140 },
};

const SEVERITY_COLOR = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#22c55e",
};

function InfrastructureMap({ activeStep, completedSteps, scenario }: { activeStep: number | null; completedSteps: number[]; scenario: AttackScenario }) {
  const nodes = Object.entries(NODE_CONFIG);
  const steps = scenario.steps;

  return (
    <div className="rounded-lg border p-5" style={{ background: CARD, borderColor: BORDER }}>
      <div className="flex items-center gap-2 mb-4">
        <Network className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-semibold text-slate-100">Infrastructure Attack Map</span>
      </div>

      <div className="relative" style={{ height: 280 }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 760 280">
          {steps.slice(0, steps.length - 1).map((step, idx) => {
            const from = NODE_CONFIG[step.targetNode];
            const to = NODE_CONFIG[steps[idx + 1].targetNode];
            const isActive = activeStep === step.id;
            const isDone = completedSteps.includes(step.id);
            const color = isDone ? SEVERITY_COLOR[step.severity] : isActive ? SEVERITY_COLOR[step.severity] : "#1e293b";
            return (
              <line
                key={idx}
                x1={from.x} y1={from.y}
                x2={to.x} y2={to.y}
                stroke={color}
                strokeWidth={isActive ? 2 : 1}
                strokeDasharray={isActive ? "6 3" : "none"}
                opacity={isDone || isActive ? 1 : 0.3}
              />
            );
          })}
        </svg>

        {nodes.map(([key, node]) => {
          const nodeKey = key as AttackNode;
          const stepsHere = steps.filter((s) => s.targetNode === nodeKey);
          const isActive = stepsHere.some((s) => s.id === activeStep);
          const isDone = stepsHere.some((s) => completedSteps.includes(s.id));
          const activeSeverity = stepsHere.find((s) => s.id === activeStep)?.severity ?? "low";
          const color = isActive ? SEVERITY_COLOR[activeSeverity] : isDone ? "#ef4444" : "#334155";

          return (
            <div
              key={key}
              className="absolute flex flex-col items-center"
              style={{
                left: node.x - 32,
                top: node.y - 36,
                width: 64,
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
                style={{
                  background: isActive ? `${color}20` : isDone ? "rgba(239,68,68,0.08)" : "rgba(30,41,59,0.8)",
                  border: `1.5px solid ${isActive ? color : isDone ? "rgba(239,68,68,0.3)" : "#1e293b"}`,
                  boxShadow: isActive ? `0 0 12px ${color}40` : "none",
                }}
              >
                <node.icon className="w-4.5 h-4.5" style={{ color: isActive ? color : isDone ? "#ef4444" : "#475569" }} />
              </div>
              <div className="text-[8px] text-slate-500 text-center mt-1 leading-tight" style={{ color: isActive ? "#e2e8f0" : isDone ? "#94a3b8" : "#475569" }}>
                {node.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AttackReplayTheater() {
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0].id);
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scenario = SCENARIOS.find((s) => s.id === selectedScenario) ?? SCENARIOS[0];
  const activeStepData = currentStep > 0 ? scenario.steps.find((s) => s.id === currentStep) : null;

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  function reset() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPlaying(false);
    setCurrentStep(0);
    setCompletedSteps([]);
  }

  function handleScenarioChange(id: string) {
    reset();
    setSelectedScenario(id);
  }

  function advanceStep() {
    setCurrentStep((prev) => {
      const idx = scenario.steps.findIndex((s) => s.id === prev);
      const next = scenario.steps[idx + 1];
      if (!next) {
        setPlaying(false);
        return prev;
      }
      setCompletedSteps((c) => [...c, prev]);
      return next.id;
    });
  }

  function startPlay() {
    if (currentStep === 0) {
      setCurrentStep(scenario.steps[0].id);
    }
    setPlaying(true);
  }

  useEffect(() => {
    if (!playing || currentStep === 0) return;
    const step = scenario.steps.find((s) => s.id === currentStep);
    if (!step) return;
    timerRef.current = setTimeout(() => {
      const idx = scenario.steps.findIndex((s) => s.id === currentStep);
      const next = scenario.steps[idx + 1];
      if (next) {
        setCompletedSteps((c) => [...c, step.id]);
        setCurrentStep(next.id);
      } else {
        setCompletedSteps((c) => [...c, step.id]);
        setPlaying(false);
      }
    }, step.duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [playing, currentStep, scenario]);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: BG }}>
      <div className="p-5 border-b shrink-0" style={{ borderColor: BORDER }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Play className="w-4 h-4 text-red-400" />
              <h1 className="text-sm font-bold text-slate-100">Attack Replay Theater</h1>
            </div>
            <p className="text-[10px] text-slate-500">Step-by-step animated attack chain visualization against your infrastructure</p>
          </div>
          <div className="flex gap-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => handleScenarioChange(s.id)}
                className="px-3 py-1.5 rounded text-[10px] font-medium transition-all"
                style={{
                  background: selectedScenario === s.id ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.04)",
                  color: selectedScenario === s.id ? "#fca5a5" : "#64748b",
                  border: `1px solid ${selectedScenario === s.id ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.06)"}`,
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <InfrastructureMap activeStep={currentStep} completedSteps={completedSteps} scenario={scenario} />

        <div className="flex gap-3 items-center p-4 rounded-lg border" style={{ background: CARD, borderColor: BORDER }}>
          <button
            onClick={reset}
            className="p-2 rounded-lg transition-colors hover:bg-white/5"
          >
            <SkipBack className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => {
              if (playing) {
                setPlaying(false);
                if (timerRef.current) clearTimeout(timerRef.current);
              } else {
                startPlay();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all"
            style={{ background: playing ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.12)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.25)" }}
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {playing ? "Pause" : currentStep === 0 ? "Play Attack" : "Resume"}
          </button>

          <button
            onClick={advanceStep}
            disabled={playing}
            className="p-2 rounded-lg transition-colors hover:bg-white/5 disabled:opacity-40"
          >
            <SkipForward className="w-4 h-4 text-slate-400" />
          </button>

          <div className="flex-1 mx-2">
            <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(completedSteps.length / scenario.steps.length) * 100}%`,
                  background: "linear-gradient(90deg, #ef4444, #f97316)",
                }}
              />
            </div>
          </div>

          <span className="text-[10px] font-mono text-slate-500">
            {completedSteps.length}/{scenario.steps.length} steps
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-4" style={{ background: CARD, borderColor: BORDER }}>
            <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-3">Attack Chain</div>
            <div className="space-y-2">
              {scenario.steps.map((step) => {
                const isActive = step.id === currentStep;
                const isDone = completedSteps.includes(step.id);
                return (
                  <button
                    key={step.id}
                    onClick={() => {
                      if (playing) return;
                      setCurrentStep(step.id);
                      setCompletedSteps(scenario.steps.filter((s) => s.id < step.id).map((s) => s.id));
                    }}
                    className={cn("w-full flex items-center gap-2 p-2 rounded-md text-left transition-all", isActive && "ring-1")}
                    style={{
                      background: isActive ? `${SEVERITY_COLOR[step.severity]}12` : isDone ? "rgba(255,255,255,0.02)" : "transparent",
                      ringColor: isActive ? SEVERITY_COLOR[step.severity] : "transparent",
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold"
                      style={{
                        background: isActive ? `${SEVERITY_COLOR[step.severity]}20` : isDone ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.04)",
                        color: isActive ? SEVERITY_COLOR[step.severity] : isDone ? "#ef4444" : "#475569",
                      }}
                    >
                      {isDone ? <CheckCircle className="w-3 h-3" /> : step.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-medium text-slate-300 truncate">{step.label}</div>
                      <div className="text-[9px] text-slate-500 font-mono">{step.mitreId} · {step.tactic}</div>
                    </div>
                    <span
                      className="text-[8px] font-bold px-1 py-0.5 rounded shrink-0"
                      style={{ color: SEVERITY_COLOR[step.severity], background: `${SEVERITY_COLOR[step.severity]}15` }}
                    >
                      {step.severity.toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            {activeStepData ? (
              <>
                <div className="rounded-lg border p-4" style={{ background: `${SEVERITY_COLOR[activeStepData.severity]}08`, borderColor: `${SEVERITY_COLOR[activeStepData.severity]}25` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-3.5 h-3.5" style={{ color: SEVERITY_COLOR[activeStepData.severity] }} />
                    <span className="text-xs font-semibold text-slate-100">Step {activeStepData.id}: {activeStepData.label}</span>
                  </div>
                  <div className="text-[9px] font-mono mb-2" style={{ color: SEVERITY_COLOR[activeStepData.severity] }}>
                    {activeStepData.mitreId} · {activeStepData.technique}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{activeStepData.description}</p>
                </div>

                <div className="rounded-lg border p-4" style={{ background: CARD, borderColor: BORDER }}>
                  <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-2">IOC / Forensic Indicator</div>
                  <div className="text-[10px] font-mono text-amber-300 leading-relaxed p-2 rounded" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)" }}>
                    {activeStepData.ioc}
                  </div>
                </div>

                <div className="rounded-lg border p-4" style={{ background: CARD, borderColor: BORDER }}>
                  <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-2">Security Controls</div>
                  <div className="space-y-1.5">
                    {activeStepData.controlsFired.map((c) => (
                      <div key={c} className="flex items-center gap-2">
                        <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                        <span className="text-[10px] text-red-300">{c} — <span className="text-red-500">BYPASSED</span></span>
                      </div>
                    ))}
                    {activeStepData.controlsPassed.map((c) => (
                      <div key={c} className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-400 shrink-0" />
                        <span className="text-[10px] text-green-300">{c} — <span className="text-green-400">BLOCKED</span></span>
                      </div>
                    ))}
                    {activeStepData.controlsFired.length === 0 && activeStepData.controlsPassed.length === 0 && (
                      <div className="text-[10px] text-slate-500">No controls triggered at this stage</div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg border p-8 flex flex-col items-center justify-center text-center" style={{ background: CARD, borderColor: BORDER }}>
                <Play className="w-8 h-8 text-slate-700 mb-3" />
                <div className="text-sm text-slate-500">Press Play to begin the attack replay</div>
                <div className="text-[10px] text-slate-600 mt-1">Or click any step to inspect it</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
