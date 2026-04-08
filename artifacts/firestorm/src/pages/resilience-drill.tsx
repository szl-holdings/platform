import { useState, useEffect, useRef } from "react";
import {
  Shield, Play, Clock, CheckCircle2, XCircle, AlertTriangle, Target,
  ChevronRight, ChevronDown, BarChart3, Award, RefreshCw, Zap,
  Users, Lock, Server, Package, BookOpen, Star, TrendingUp
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

const BG = "#070A10";

type DrillPhase = "select" | "briefing" | "active" | "review";
type ScenarioId = "ransomware" | "insider_threat" | "supply_chain" | "apt_intrusion" | "data_breach";

interface DrillStep {
  id: string;
  prompt: string;
  context?: string;
  options: { id: string; text: string; score: number; rationale: string }[];
  timeLimit: number;
  correctOption?: string;
}

interface DrillScenario {
  id: ScenarioId;
  title: string;
  category: string;
  difficulty: "Intermediate" | "Advanced" | "Expert";
  duration: number;
  icon: typeof Shield;
  color: string;
  summary: string;
  objectives: string[];
  steps: DrillStep[];
}

const SCENARIOS: DrillScenario[] = [
  {
    id: "ransomware",
    title: "Ransomware — Sacsayhuamán Crisis",
    category: "Ransomware / Data Integrity",
    difficulty: "Advanced",
    duration: 20,
    icon: Lock,
    color: "#ef4444",
    summary: "A ransomware operator has encrypted 40% of your managed client infrastructure. The encryption is ongoing. C2 beacons are active on 3 hosts.",
    objectives: [
      "Contain the spread within 15 minutes",
      "Preserve forensic evidence before remediation",
      "Notify affected stakeholders without causing panic",
      "Validate backup integrity before restore",
    ],
    steps: [
      {
        id: "rs-1",
        prompt: "SIEM alert: mass file encryption detected across 12 endpoints. The process is still running. What is your FIRST action?",
        context: "Time: T+0 min. 12 endpoints showing BitLocker bypass activity. Network share encryption in progress.",
        options: [
          { id: "a", text: "Immediately isolate all 12 affected endpoints from the network", score: 25, rationale: "Correct — containment stops spread. Isolation is the highest priority before any investigation." },
          { id: "b", text: "Run an AV scan on all affected endpoints to identify the malware", score: 5, rationale: "AV scans take time and won't stop active encryption. Containment first." },
          { id: "c", text: "Notify the client and executive team before taking any technical action", score: 3, rationale: "Premature notification without containment will cause confusion. Contain first, then notify." },
          { id: "d", text: "Review the SIEM logs to determine the patient zero host", score: 10, rationale: "Useful but not the FIRST step. Spread stops nothing while you investigate." },
        ],
        timeLimit: 90,
        correctOption: "a",
      },
      {
        id: "rs-2",
        prompt: "Endpoints isolated. Forensic team is on-site. C2 beacon still active from one non-isolated host (WKST-0041). What now?",
        context: "T+8 min. 11/12 endpoints isolated. WKST-0041 missed — analyst failed to catch it. C2 traffic ongoing.",
        options: [
          { id: "a", text: "Isolate WKST-0041 immediately, then collect forensic image before wiping", score: 25, rationale: "Correct. Isolate first to stop C2, then image before any remediation." },
          { id: "b", text: "Let WKST-0041 run — it provides C2 visibility for threat intel collection", score: 8, rationale: "Risky without proper deception environment. Active encryption still ongoing." },
          { id: "c", text: "Wipe WKST-0041 immediately — it's the active threat", score: 12, rationale: "Containment without imaging destroys evidence. Isolate first, image second." },
          { id: "d", text: "Block the C2 IP at the perimeter firewall only", score: 15, rationale: "Good supplemental action, but the host is still active and may pivot to a new C2." },
        ],
        timeLimit: 90,
        correctOption: "a",
      },
      {
        id: "rs-3",
        prompt: "Containment complete. Backups exist but were last tested 6 months ago. Client wants systems restored NOW. Your decision?",
        context: "T+22 min. All endpoints isolated. Backup tapes exist. Client CEO is calling every 10 minutes.",
        options: [
          { id: "a", text: "Validate backup integrity (spot test 3 systems) before committing to full restore", score: 25, rationale: "Correct. Untested backups may also be encrypted. Validation is mandatory before restore." },
          { id: "b", text: "Begin full restore immediately — every minute of downtime costs money", score: 5, rationale: "Restoring from compromised or untested backups could worsen the situation." },
          { id: "c", text: "Pay the ransom while backups are validated in parallel", score: 3, rationale: "Payment funds criminals, doesn't guarantee decryption, and may violate policy/law." },
          { id: "d", text: "Rebuild from scratch without using backups", score: 10, rationale: "Valid as a last resort, but wastes days of rebuild time if backups are intact." },
        ],
        timeLimit: 90,
        correctOption: "a",
      },
    ],
  },
  {
    id: "insider_threat",
    title: "Insider Threat — Privileged Exfiltration",
    category: "Insider Risk",
    difficulty: "Advanced",
    duration: 18,
    icon: Users,
    color: "#f59e0b",
    summary: "UEBA flagged anomalous data access by a senior developer who gave 2-week notice yesterday. Large file transfers to personal cloud storage detected.",
    objectives: [
      "Determine if exfiltration has already occurred",
      "Preserve evidence without tipping off the subject",
      "Assess the sensitivity of the accessed data",
      "Coordinate with HR and Legal before escalation",
    ],
    steps: [
      {
        id: "it-1",
        prompt: "UEBA alert: 4.2GB transferred to personal Dropbox from developer workstation in last 2 hours. Developer gave notice yesterday. First action?",
        context: "T+0. Developer is currently at their desk. Alert confidence: 87%. Data includes source code and customer PII.",
        options: [
          { id: "a", text: "Immediately revoke all access and confront the developer", score: 8, rationale: "Premature revocation alerts the subject and may destroy evidence. HR and Legal must be involved first." },
          { id: "b", text: "Covertly capture forensic evidence and notify HR, Legal, and CISO before taking visible action", score: 25, rationale: "Correct. Preserve evidence covertly, involve stakeholders, follow HR/Legal protocol." },
          { id: "c", text: "Monitor passively for 24 hours to gather more evidence", score: 12, rationale: "Extended passive monitoring risks additional exfiltration. Evidence must be captured now." },
          { id: "d", text: "Block the Dropbox domain at the firewall", score: 15, rationale: "Useful as a supplemental control, but the data is already transferred. Doesn't address evidence." },
        ],
        timeLimit: 90,
        correctOption: "b",
      },
      {
        id: "it-2",
        prompt: "Legal advises covert monitoring for 48 hours. You discover the developer is also exfiltrating to a VPN endpoint. HR wants to terminate today. Your recommendation?",
        context: "T+6h. Active VPN tunnel to unknown endpoint. HR ready to terminate. Legal says 48h covert window ends at T+42h.",
        options: [
          { id: "a", text: "Terminate immediately — ongoing exfiltration outweighs evidence gathering timeline", score: 20, rationale: "Acceptable. When active harm is occurring, immediate containment may override extended monitoring." },
          { id: "b", text: "Continue monitoring per Legal's advice — the VPN may reveal the destination and accomplices", score: 18, rationale: "Valid if properly documented. Continuing provides intelligence but risks further data loss." },
          { id: "c", text: "Block the VPN tunnel only, preserve employment while Legal completes review", score: 25, rationale: "Correct balance — stops active harm, preserves employment relationship until Legal completes review, maintains evidence chain." },
          { id: "d", text: "Escalate to law enforcement immediately", score: 10, rationale: "May be appropriate eventually, but premature escalation without internal alignment is problematic." },
        ],
        timeLimit: 90,
        correctOption: "c",
      },
    ],
  },
  {
    id: "supply_chain",
    title: "Supply Chain Compromise — Third-Party Library",
    category: "Supply Chain",
    difficulty: "Expert",
    duration: 25,
    icon: Package,
    color: "#8b5cf6",
    summary: "A widely-used open source library in your CI/CD pipeline was discovered to contain backdoored code deployed in the last release. Scope is unknown.",
    objectives: [
      "Determine which production systems ingested the compromised version",
      "Assess whether the backdoor has been activated",
      "Coordinate remediation without halting all operations",
      "Assess regulatory notification obligations",
    ],
    steps: [
      {
        id: "sc-1",
        prompt: "A critical open source library (used in 14 microservices) has a confirmed backdoor in v2.4.1-2.4.3. You deployed v2.4.2 last week. First action?",
        context: "T+0. Public CVE published 2 hours ago. Patch (v2.4.4) available. 14 services potentially affected.",
        options: [
          { id: "a", text: "Immediately patch all 14 services to v2.4.4", score: 18, rationale: "Good but needs risk assessment first — patching may disrupt operations and doesn't address possible existing compromise." },
          { id: "b", text: "Audit SBOM to confirm which deployed versions contain the backdoor, then prioritize patching by exposure", score: 25, rationale: "Correct. Scope definition before remediation ensures resources go to highest-risk systems first." },
          { id: "c", text: "Halt all deployments and quarantine the CI/CD pipeline pending full investigation", score: 20, rationale: "Reasonable but may be excessive if only 3 of 14 services are externally exposed." },
          { id: "d", text: "Wait for vendor advisory before acting — public CVE may be wrong", score: 2, rationale: "Never acceptable when a confirmed backdoor is identified in production code." },
        ],
        timeLimit: 90,
        correctOption: "b",
      },
      {
        id: "sc-2",
        prompt: "SBOM analysis confirms 8 of 14 services use the backdoored version. One processes PII from EU customers. What triggers regulatory notification?",
        context: "T+3h. 8 services confirmed. 1 service handles GDPR-regulated PII. Backdoor activation is unconfirmed.",
        options: [
          { id: "a", text: "GDPR notification required only if data exfiltration is confirmed", score: 12, rationale: "Incorrect — GDPR requires notification when a breach is likely, not confirmed. Presumption of breach applies." },
          { id: "b", text: "Backdoored code in production systems handling PII likely meets GDPR Article 33 notification threshold", score: 25, rationale: "Correct. Under GDPR, a likely breach triggers 72-hour notification. Backdoor presence = breach risk." },
          { id: "c", text: "No notification required until you know exactly what data was accessed", score: 5, rationale: "This misreads GDPR. Inability to confirm no breach is itself grounds for notification." },
          { id: "d", text: "Notify all EU customers proactively regardless of breach confirmation", score: 15, rationale: "Notification to DPA (Article 33) precedes customer notification. Order matters." },
        ],
        timeLimit: 90,
        correctOption: "b",
      },
      {
        id: "sc-3",
        prompt: "Patch deployed across all 8 services. Logs show the backdoor callback function was invoked twice in the past week. Data accessed is unknown. Next step?",
        context: "T+18h. Patching complete. 2 confirmed backdoor invocations in logs. No known data exfiltration confirmed.",
        options: [
          { id: "a", text: "Close the incident — patching is complete and the threat is neutralized", score: 2, rationale: "Incorrect. Backdoor invocations indicate possible compromise. Incident is active until impact is assessed." },
          { id: "b", text: "Perform forensic analysis on the 2 invocation events to determine scope and exfiltration", score: 25, rationale: "Correct. Active backdoor invocations require forensic analysis before incident can be closed." },
          { id: "c", text: "Notify DPA now that backdoor invocations are confirmed", score: 18, rationale: "DPA notification may be appropriate but forensic scope assessment should precede or run parallel to notification." },
          { id: "d", text: "Rotate all API keys and secrets as a precaution", score: 20, rationale: "Good hygiene but not the primary investigation step. Forensics should drive remediation scope." },
        ],
        timeLimit: 90,
        correctOption: "b",
      },
    ],
  },
  {
    id: "apt_intrusion",
    title: "APT Intrusion — Nation-State Persistent Access",
    category: "Advanced Persistent Threat",
    difficulty: "Expert",
    duration: 30,
    icon: Target,
    color: "#ef4444",
    summary: "Threat intelligence confirms APT29 Cozy Bear has established persistent access in your network. C2 beacons to known APT29 infrastructure. Dwell time estimated 45 days.",
    objectives: [
      "Map the full extent of compromise without tipping off the adversary",
      "Identify all persistence mechanisms before remediation",
      "Coordinate CISA notification and law enforcement",
      "Execute a coordinated eradication without adversary awareness",
    ],
    steps: [
      {
        id: "apt-1",
        prompt: "Threat intel confirms APT29 access for ~45 days. They may have exfiltrated data. You have C2 visibility. Do you eradicate immediately?",
        context: "T+0. C2 active. 45-day dwell time. No confirmed exfiltration. Threat intel: adversary is in 'collection' phase.",
        options: [
          { id: "a", text: "Eradicate immediately — every minute of adversary access is unacceptable", score: 10, rationale: "Premature eradication without full scope mapping may miss additional persistence. Adversary may have dead-man triggers." },
          { id: "b", text: "Maintain covert monitoring while fully mapping adversary TTPs, persistence, and lateral movement before eradication", score: 25, rationale: "Correct. APT eradication requires full scope before action. Partial eradication alerts the adversary and they will re-establish access." },
          { id: "c", text: "Block the C2 IP and hope that severs their access", score: 5, rationale: "Nation-state adversaries use multiple C2 channels. Blocking one IP is insufficient." },
          { id: "d", text: "Notify CISA immediately and let them take over", score: 12, rationale: "CISA notification is appropriate but shouldn't replace your own incident response. Parallel tracks." },
        ],
        timeLimit: 90,
        correctOption: "b",
      },
      {
        id: "apt-2",
        prompt: "After 72 hours of monitoring, you've mapped 4 persistence mechanisms and 7 compromised hosts. Ready to eradicate. Coordination approach?",
        context: "T+72h. Full scope mapped. 4 persistence mechanisms. 7 hosts. CISA notified. Law enforcement briefed.",
        options: [
          { id: "a", text: "Eradicate one host at a time over several days to avoid alerting the adversary", score: 8, rationale: "Phased eradication risks adversary detecting early actions and re-establishing access on unaddressed hosts." },
          { id: "b", text: "Simultaneous coordinated eradication across all 7 hosts and all 4 persistence mechanisms in one window", score: 25, rationale: "Correct. APT eradication must be simultaneous and comprehensive. Any partial action gives the adversary time to respond." },
          { id: "c", text: "Wait for law enforcement confirmation before eradicating", score: 10, rationale: "Law enforcement generally wants you to proceed with incident response. Waiting indefinitely is unacceptable." },
          { id: "d", text: "Rebuild all 7 hosts from scratch before addressing persistence mechanisms", score: 15, rationale: "Rebuild without removing persistence mechanisms means the rebuilt systems may re-establish adversary access." },
        ],
        timeLimit: 90,
        correctOption: "b",
      },
    ],
  },
  {
    id: "data_breach",
    title: "Data Breach — PII Exfiltration Confirmed",
    category: "Data Loss",
    difficulty: "Intermediate",
    duration: 20,
    icon: Server,
    color: "#3b82f6",
    summary: "Database logs confirm 2.1 million customer records were exported in the past 72 hours. A third-party vendor API key was the entry point.",
    objectives: [
      "Revoke compromised credentials and stop ongoing exfiltration",
      "Determine regulatory notification scope (GDPR, CCPA, state breach laws)",
      "Preserve forensic evidence for legal discovery",
      "Draft customer notification within regulatory timeline",
    ],
    steps: [
      {
        id: "db-1",
        prompt: "DB logs confirm 2.1M records exported via vendor API key. Vendor key still active. First action?",
        context: "T+0. Vendor API key active. Exfiltration window: 72 hours. 2.1M PII records. Vendor is a payment processor.",
        options: [
          { id: "a", text: "Revoke the vendor API key immediately and notify the vendor", score: 25, rationale: "Correct. Immediate credential revocation stops ongoing exfiltration. Vendor notification follows." },
          { id: "b", text: "Investigate how the key was stolen before revoking it", score: 8, rationale: "Root cause analysis is important but not before stopping the active breach. Revoke first." },
          { id: "c", text: "Notify affected customers before revoking credentials", score: 3, rationale: "Customer notification before containment is backwards. Stop the breach first." },
          { id: "d", text: "Audit the vendor's security posture before taking action", score: 5, rationale: "Relevant but not the immediate step. Revocation is the containment action." },
        ],
        timeLimit: 90,
        correctOption: "a",
      },
      {
        id: "db-2",
        prompt: "Breach contained. 2.1M records confirmed exfiltrated. Data includes names, emails, hashed passwords, and 180K payment card numbers. Which regulator do you notify first?",
        context: "T+2h. Breach contained. Records include EU customers (400K), California residents (600K), and other US customers.",
        options: [
          { id: "a", text: "GDPR Data Protection Authority (72-hour clock started at breach discovery)", score: 25, rationale: "Correct. GDPR 72-hour notification applies to EU residents. Payment cards also trigger PCI DSS notification, which can run parallel." },
          { id: "b", text: "California AG under CCPA (45-day timeline)", score: 12, rationale: "CCPA notification is required but the GDPR 72-hour clock is more urgent." },
          { id: "c", text: "Card brands (Visa/Mastercard) for the 180K payment card numbers", score: 18, rationale: "PCI DSS notification to card brands is urgent but the GDPR clock is already ticking." },
          { id: "d", text: "Wait until you know the full breach scope before notifying anyone", score: 2, rationale: "Waiting is not acceptable under GDPR's 72-hour window, which runs from the point you reasonably knew." },
        ],
        timeLimit: 90,
        correctOption: "a",
      },
    ],
  },
];

const DIFFICULTY_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  Intermediate: { text: "text-amber-300", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  Advanced: { text: "text-orange-300", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  Expert: { text: "text-red-300", bg: "bg-red-500/10", border: "border-red-500/20" },
};

interface DrillState {
  scenario: DrillScenario;
  phase: DrillPhase;
  currentStep: number;
  responses: Record<string, { option: string; timeSpent: number; score: number; rationale: string }>;
  startTime: number;
  stepStartTime: number;
  timeRemaining: number;
}

function useTimer(seconds: number, active: boolean, onExpire: () => void) {
  const [remaining, setRemaining] = useState(seconds);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!active) {
      if (ref.current) clearInterval(ref.current);
      return;
    }
    ref.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(ref.current!);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [active, onExpire]);

  return remaining;
}

function ScenarioCard({ scenario, onSelect }: { scenario: DrillScenario; onSelect: () => void }) {
  const Icon = scenario.icon;
  const diff = DIFFICULTY_COLORS[scenario.difficulty] || DIFFICULTY_COLORS.Intermediate;
  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-5 rounded-2xl border transition-all hover:border-white/15"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: scenario.color + "15", border: `1px solid ${scenario.color}25` }}>
          <Icon size={18} style={{ color: scenario.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="text-sm font-bold text-white truncate">{scenario.title}</h3>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase", diff.text, diff.bg, diff.border)}>{scenario.difficulty}</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-white/10 text-white/40">{scenario.category}</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-white/10 text-white/40">{scenario.duration}m est.</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-white/10 text-white/40">{scenario.steps.length} decision points</span>
          </div>
          <p className="text-[11px] leading-relaxed text-white/45 line-clamp-2">{scenario.summary}</p>
        </div>
        <ChevronRight size={14} className="text-white/20 shrink-0 mt-1" />
      </div>
    </button>
  );
}

function TimerBar({ remaining, total, color }: { remaining: number; total: number; color: string }) {
  const pct = (remaining / total) * 100;
  return (
    <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, backgroundColor: pct > 50 ? "#10b981" : pct > 20 ? "#f59e0b" : "#ef4444" }}
      />
    </div>
  );
}

export default function ResilienceDrillSimulator() {
  const [phase, setPhase] = useState<"select" | "briefing" | "active" | "review">("select");
  const [scenario, setScenario] = useState<DrillScenario | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, { option: string; timeSpent: number; score: number; rationale: string; stepTitle: string }>>({});
  const [stepStartTime, setStepStartTime] = useState(Date.now());
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [drillStartTime, setDrillStartTime] = useState(Date.now());

  const step = scenario?.steps[currentStep] ?? null;

  const handleTimerExpire = () => {
    if (!scenario || !step || revealed) return;
    const timeSpent = step.timeLimit;
    setResponses(prev => ({
      ...prev,
      [step.id]: { option: "expired", timeSpent, score: 0, rationale: "Time expired — no response given.", stepTitle: step.prompt.slice(0, 60) },
    }));
    setRevealed(true);
    setTimerActive(false);
  };

  const timeRemaining = useTimer(step?.timeLimit ?? 60, timerActive && !revealed, handleTimerExpire);

  const startDrill = (s: DrillScenario) => {
    setScenario(s);
    setPhase("briefing");
    setCurrentStep(0);
    setResponses({});
    setSelectedOption(null);
    setRevealed(false);
  };

  const beginDrill = () => {
    setPhase("active");
    setStepStartTime(Date.now());
    setTimerActive(true);
    setDrillStartTime(Date.now());
  };

  const handleSelectOption = (optionId: string) => {
    if (revealed || !step || !scenario) return;
    setSelectedOption(optionId);
    const timeSpent = Math.round((Date.now() - stepStartTime) / 1000);
    const opt = step.options.find(o => o.id === optionId)!;
    setTimerActive(false);
    setResponses(prev => ({
      ...prev,
      [step.id]: { option: optionId, timeSpent, score: opt.score, rationale: opt.rationale, stepTitle: step.prompt.slice(0, 60) },
    }));
    setRevealed(true);
  };

  const advance = () => {
    if (!scenario) return;
    if (currentStep + 1 >= scenario.steps.length) {
      setPhase("review");
      return;
    }
    setCurrentStep(prev => prev + 1);
    setSelectedOption(null);
    setRevealed(false);
    setStepStartTime(Date.now());
    setTimerActive(true);
  };

  const totalScore = Object.values(responses).reduce((acc, r) => acc + r.score, 0);
  const maxScore = scenario ? scenario.steps.reduce((acc, s) => acc + Math.max(...s.options.map(o => o.score)), 0) : 0;
  const scorePct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const drillDurationMin = Math.round((Date.now() - drillStartTime) / 60000);

  const getScoreGrade = (pct: number) => {
    if (pct >= 90) return { label: "Distinguished", color: "#10b981", icon: "★" };
    if (pct >= 75) return { label: "Proficient", color: "#3b82f6", icon: "◆" };
    if (pct >= 60) return { label: "Developing", color: "#f59e0b", icon: "●" };
    return { label: "Needs Improvement", color: "#ef4444", icon: "▲" };
  };

  const grade = getScoreGrade(scorePct);

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: BG, color: "#e2e8f0" }}>
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <h1 className="text-sm font-bold text-white">Resilience Drill Simulator</h1>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/5 text-amber-400/70">TRADECRAFT TRAINING</span>
          </div>
          {phase !== "select" && (
            <button
              onClick={() => { setPhase("select"); setScenario(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> New Scenario
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* PHASE: SELECT */}
        {phase === "select" && (
          <div className="px-6 py-6 max-w-3xl">
            <div className="mb-6">
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-2">Scenario Library</p>
              <p className="text-[13px] text-white/45 leading-relaxed max-w-xl">
                Each drill is a timed, decision-driven scenario with scored analyst responses and structured after-action review. 
                Decisions are evaluated against NIST, CISA, and PICERL best practices.
              </p>
            </div>
            <div className="space-y-3">
              {SCENARIOS.map(s => (
                <ScenarioCard key={s.id} scenario={s} onSelect={() => startDrill(s)} />
              ))}
            </div>
          </div>
        )}

        {/* PHASE: BRIEFING */}
        {phase === "briefing" && scenario && (
          <div className="px-6 py-6 max-w-2xl">
            <div className="mb-2">
              <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Scenario Briefing</span>
            </div>
            <h2 className="text-lg font-bold text-white mb-4">{scenario.title}</h2>
            <div className="bg-white/[0.025] border border-white/5 rounded-xl p-5 mb-4">
              <div className="text-[9px] font-mono uppercase tracking-widest text-white/30 mb-2">Situation</div>
              <p className="text-sm text-white/80 leading-relaxed">{scenario.summary}</p>
            </div>
            <div className="bg-white/[0.025] border border-white/5 rounded-xl p-5 mb-4">
              <div className="text-[9px] font-mono uppercase tracking-widest text-white/30 mb-3">Mission Objectives</div>
              <ul className="space-y-2">
                {scenario.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[12px] text-white/70">
                    <span className="w-4 h-4 rounded bg-white/5 flex items-center justify-center text-[9px] font-mono text-white/40 shrink-0 mt-0.5">{i + 1}</span>
                    {obj}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center gap-3 mb-6 text-[11px] text-white/40">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {scenario.duration}m estimated</span>
              <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {scenario.steps.length} decision points</span>
              <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {scenario.difficulty}</span>
            </div>
            <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-[11px] text-amber-300/80 mb-6">
              Each decision is timed. You have {scenario.steps[0]?.timeLimit ?? 90} seconds per decision point. Choose carefully — time and accuracy both affect your score.
            </div>
            <button
              onClick={beginDrill}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: (scenario.color || "#ef4444") + "20", border: `1px solid ${scenario.color || "#ef4444"}30` }}
            >
              <Play size={14} /> Begin Drill
            </button>
          </div>
        )}

        {/* PHASE: ACTIVE */}
        {phase === "active" && scenario && step && (
          <div className="px-6 py-6 max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-white/30">STEP {currentStep + 1} / {scenario.steps.length}</span>
                <div className="flex gap-1">
                  {scenario.steps.map((_, i) => (
                    <div key={i} className={cn("w-2 h-2 rounded-full transition-all", i < currentStep ? "bg-emerald-500" : i === currentStep ? "bg-amber-400" : "bg-white/10")} />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <Clock className={cn("w-3 h-3", timeRemaining < 20 ? "text-red-400 animate-pulse" : "text-white/40")} />
                <span className={cn(timeRemaining < 20 ? "text-red-400 font-bold" : "text-white/50")}>{timeRemaining}s</span>
              </div>
            </div>

            <TimerBar remaining={timeRemaining} total={step.timeLimit} color="#10b981" />

            <div className="mt-5 mb-4">
              {step.context && (
                <div className="text-[10px] font-mono text-white/25 mb-3 italic">{step.context}</div>
              )}
              <h3 className="text-[14px] font-semibold text-white leading-relaxed">{step.prompt}</h3>
            </div>

            <div className="space-y-2.5 mb-5">
              {step.options.map(opt => {
                const isSelected = selectedOption === opt.id;
                const isBest = revealed && opt.id === step.correctOption;
                const isWrong = revealed && isSelected && opt.id !== step.correctOption;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt.id)}
                    disabled={revealed}
                    className={cn(
                      "w-full text-left px-4 py-3.5 rounded-xl border transition-all text-sm",
                      !revealed && "hover:border-white/15 hover:bg-white/[0.03]",
                      isBest && "bg-emerald-500/10 border-emerald-500/30",
                      isWrong && "bg-red-500/10 border-red-500/30",
                      isSelected && !isBest && !isWrong && "bg-white/[0.04] border-white/15",
                      !isSelected && !isBest && "bg-white/[0.02] border-white/5"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5",
                        isBest ? "bg-emerald-500/20 text-emerald-400" : isWrong ? "bg-red-500/20 text-red-400" : "bg-white/5 text-white/40"
                      )}>
                        {opt.id.toUpperCase()}
                      </span>
                      <div className="flex-1">
                        <p className={cn("text-[12px] leading-relaxed", isBest ? "text-emerald-300" : isWrong ? "text-red-300" : "text-white/80")}>{opt.text}</p>
                        {revealed && (
                          <p className="text-[10px] leading-relaxed mt-1.5 text-white/45">{opt.rationale}</p>
                        )}
                      </div>
                      {isBest && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {isWrong && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {revealed && (
              <div className="flex items-center justify-between">
                <div className="text-[11px] text-white/40">
                  Score this step: <span className={cn("font-bold", responses[step.id]?.score >= 20 ? "text-emerald-400" : responses[step.id]?.score >= 10 ? "text-amber-400" : "text-red-400")}>
                    {responses[step.id]?.score ?? 0} pts
                  </span>
                </div>
                <button
                  onClick={advance}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-blue-500/15 border border-blue-500/25 text-blue-300 hover:bg-blue-500/20 transition-colors"
                >
                  {currentStep + 1 >= scenario.steps.length ? "View After-Action Review" : "Next Decision"}
                  <ChevronRight size={13} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* PHASE: REVIEW */}
        {phase === "review" && scenario && (
          <div className="px-6 py-6 max-w-2xl">
            <div className="mb-2">
              <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">After-Action Review</span>
            </div>
            <h2 className="text-lg font-bold text-white mb-6">{scenario.title}</h2>

            {/* Score summary */}
            <div className="bg-white/[0.025] border border-white/5 rounded-xl p-5 mb-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[9px] font-mono uppercase tracking-widest text-white/30 mb-1">Performance Score</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold font-mono tabular-nums" style={{ color: grade.color }}>{scorePct}%</span>
                    <span className="text-sm font-semibold" style={{ color: grade.color }}>{grade.icon} {grade.label}</span>
                  </div>
                  <div className="text-[10px] text-white/30 mt-1">{totalScore} / {maxScore} points · {drillDurationMin}m drill time</div>
                </div>
                <Award size={32} style={{ color: grade.color, opacity: 0.5 }} />
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${scorePct}%`, backgroundColor: grade.color }} />
              </div>
            </div>

            {/* Step-by-step review */}
            <div className="space-y-3 mb-6">
              {scenario.steps.map((s, i) => {
                const resp = responses[s.id];
                const bestScore = Math.max(...s.options.map(o => o.score));
                const chosen = s.options.find(o => o.id === resp?.option);
                const best = s.options.find(o => o.id === s.correctOption);
                const isPerfect = resp?.score === bestScore;
                return (
                  <div key={s.id} className={cn("rounded-xl border p-4", isPerfect ? "border-emerald-500/20 bg-emerald-500/5" : resp?.score === 0 ? "border-red-500/15 bg-red-500/5" : "border-white/5 bg-white/[0.015]")}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] font-mono text-white/30">STEP {i + 1}</span>
                      {isPerfect ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : resp?.score === 0 ? <XCircle className="w-3.5 h-3.5 text-red-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                      <span className={cn("text-[9px] font-mono font-bold", isPerfect ? "text-emerald-400" : resp?.score === 0 ? "text-red-400" : "text-amber-400")}>
                        {resp?.score ?? 0}/{bestScore} pts
                      </span>
                      {resp?.timeSpent && <span className="text-[9px] font-mono text-white/25">{resp.timeSpent}s response</span>}
                    </div>
                    <p className="text-[11px] text-white/70 mb-2">{s.prompt.slice(0, 80)}…</p>
                    {chosen && (
                      <div className="text-[10px] text-white/50 mb-1">
                        <span className="text-white/30">Your choice: </span>
                        <span className={cn(isPerfect ? "text-emerald-300" : "text-red-300")}>{chosen.text.slice(0, 60)}…</span>
                      </div>
                    )}
                    {!isPerfect && best && (
                      <div className="text-[10px] text-emerald-400/70">
                        <span className="text-white/30">Best response: </span>
                        {best.text.slice(0, 60)}…
                      </div>
                    )}
                    {chosen?.rationale && (
                      <p className="text-[10px] text-white/35 mt-1.5 italic">{chosen.rationale}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Improvement recommendations */}
            <div className="bg-white/[0.025] border border-white/5 rounded-xl p-5 mb-5">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-white">Tradecraft Recommendations</span>
              </div>
              <ul className="space-y-2">
                {scorePct < 70 && (
                  <li className="flex items-start gap-2 text-[11px] text-white/60">
                    <TrendingUp className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                    Review NIST SP 800-61 incident response lifecycle — prioritize containment before investigation in active threat scenarios.
                  </li>
                )}
                {scorePct < 90 && (
                  <li className="flex items-start gap-2 text-[11px] text-white/60">
                    <Star className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                    Coordinate HR, Legal, and CISO before taking visible action on insider threat cases — evidence preservation requires stakeholder alignment.
                  </li>
                )}
                <li className="flex items-start gap-2 text-[11px] text-white/60">
                  <Zap className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                  Repeat this drill category after reviewing after-action findings. Benchmark target: 85%+ on Advanced scenarios.
                </li>
              </ul>
            </div>

            <button
              onClick={() => { setPhase("select"); setScenario(null); setResponses({}); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors"
            >
              <RefreshCw size={12} /> Run Another Scenario
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
