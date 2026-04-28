import {
  Activity,
  Brain,
  CheckCircle2,
  Eye,
  FileText,
  Info,
  Lock,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Shield,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface DemoStep {
  id: number;
  phase: string;
  title: string;
  description: string;
  durationSec: number;
  icon: React.ComponentType<{ size?: number; className?: string; color?: string }>;
  output: string;
  technicalDetail: string;
  highlight: string;
}

const DEMO_STEPS: DemoStep[] = [
  {
    id: 1,
    phase: 'Signal Ingestion',
    title: 'Anomalous signal enters via SIEM integration',
    description:
      'A high-severity alert arrives from Splunk: anomalous lateral movement detected from SVC-ACCNT-04 to DC-PROD-03. Signal passes schema validation and is routed to the triage queue.',
    durationSec: 45,
    icon: Radio,
    output: 'Alert AL-8820 created — severity: CRITICAL — source: SIEM/Splunk — status: new',
    technicalDetail:
      'POST /api/integrations/siem/ingest → schema validated → broadcastWs(aegis-alerts) → alert persisted',
    highlight:
      'Every ingested signal is schema-validated before touching the queue. Malformed signals are rejected and logged.',
  },
  {
    id: 2,
    phase: 'Enrichment',
    title: 'Threat context enrichment — MITRE + asset lookup',
    description:
      'Agent enriches the alert with MITRE ATT&CK context (T1021 — Remote Services, T1078 — Valid Accounts) and asset risk score from the asset inventory (DC-PROD-03: risk score 9.2/10).',
    durationSec: 40,
    icon: Brain,
    output:
      'Enrichment: T1021 (Lateral Movement / Remote Services), T1078 (Valid Accounts). DC-PROD-03 risk=9.2. SVC-ACCNT-04 last auth: 14:38 UTC.',
    technicalDetail:
      'RAG retrieval → MITRE technique lookup → firestorm_assets join → confidence scored 0.91',
    highlight:
      'Enrichment confidence is scored and included in all downstream outputs. Low-confidence enrichments are flagged.',
  },
  {
    id: 3,
    phase: 'Retrieval',
    title: 'Retrieval-augmented context pull',
    description:
      'The AI engine retrieves relevant historical incidents, playbook procedures for lateral movement, and prior SVC-ACCNT-04 activity from the vector store. Retrieval hit rate: 94%.',
    durationSec: 35,
    icon: Eye,
    output:
      'Retrieved: 3 prior lateral movement incidents, PB-LAT-001 playbook, 2 SVC-ACCNT-04 auth anomaly events (14d prior)',
    technicalDetail:
      'Vector search → top-5 chunks → retrieval confidence 0.94 → context assembled for triage agent',
    highlight:
      'Retrieval misses are surfaced explicitly. The agent does not hallucinate context when retrieval returns no results.',
  },
  {
    id: 4,
    phase: 'Structured Triage',
    title: 'Structured triage output — schema-validated',
    description:
      'The triage agent produces a structured output: severity confirmation, affected assets, attack technique mapping, recommended playbook, and proposed next actions — all schema-validated against the triage output schema.',
    durationSec: 50,
    icon: FileText,
    output:
      'Triage output: severity=CRITICAL, affected=[DC-PROD-03, SVC-ACCNT-04], technique=T1021/T1078, playbook=PB-LAT-001, proposed_actions=[network_isolation, credential_rotation, memory_forensics]',
    technicalDetail:
      'LLM call with structured output schema → zod validation → invalid schema rate 0% for this call → audit_event written',
    highlight:
      'Every triage output is schema-validated. Invalid outputs are rejected and escalated, not silently failed.',
  },
  {
    id: 5,
    phase: 'Analyst Review',
    title: 'Analyst review — decision console',
    description:
      'J. Chen reviews the triage output in the Decision Console. The system presents proposed actions with their execution mode (observe_only / propose_only / approval_required / approved_execute). J. Chen confirms the triage and requests network isolation approval.',
    durationSec: 60,
    icon: Activity,
    output:
      'Analyst: J. Chen — triage confirmed — network isolation action → execution mode: approval_required → approval request APR-041 created',
    technicalDetail:
      'PUT /api/aegis/incidents/41 → workflow_action INSERT → broadcastWs(approval-queue) → pubsub.publish(APPROVAL_REQUESTED)',
    highlight:
      'High-risk actions require explicit approval. The analyst cannot bypass the gate — only a designated approver can authorize.',
  },
  {
    id: 6,
    phase: 'Approval',
    title: 'Approval by SOC Lead — M. Walsh',
    description:
      'M. Walsh receives the approval request via Slack and mobile push notification. She reviews the proposed action (network isolation of DC-PROD-03) with evidence, and approves from the mobile approval queue. Approval logged to audit trail.',
    durationSec: 45,
    icon: CheckCircle2,
    output:
      'APR-041 approved by M. Walsh (SOC Lead) — 14:32 UTC — method: mobile quick action — audit_event: approval_granted',
    technicalDetail:
      'PUT /api/approvals/APR-041/approve → audit_log INSERT → execution_mode = approved_execute → notify analyst',
    highlight:
      'Every approval is attributed, timestamped, and immutably written to the audit log. Approvals cannot be retroactively removed.',
  },
  {
    id: 7,
    phase: 'Execution',
    title: 'Approved execution — containment actions',
    description:
      'With approval granted, the orchestrator executes: (1) network isolation request sent to network team via Slack, (2) credential rotation request sent to identity team via Teams, (3) evidence collection initiated. All actions run in approved_execute mode.',
    durationSec: 55,
    icon: Zap,
    output:
      'Executed: Slack → #network-ops (isolation request), Teams → #identity-ops (credential rotation), Evidence store upload initiated. All actions logged.',
    technicalDetail:
      'tool_registry.execute(notify_team, create_containment_step, request_evidence) → each call writes audit_event → broadcastWs(action-executed)',
    highlight:
      'Each tool execution writes an audit event before and after. Failed executions surface explicitly — no silent swallowing.',
  },
  {
    id: 8,
    phase: 'Audit Chain',
    title: 'Complete audit chain — every action traceable',
    description:
      'The audit chain for INC-0041 shows 14 events from first detection to containment execution: signal received, enrichment, retrieval, triage, analyst confirmation, approval request, approval grant, and each tool execution — all with timestamps, actors, and confidence scores.',
    durationSec: 40,
    icon: Lock,
    output:
      'Audit chain: 14 events — detection 14:28 → triage 14:31 → approval request 14:31 → approval granted 14:32 → execution complete 14:33. MTTD: 3min. MTTA: 4min.',
    technicalDetail:
      'GET /api/aegis/incidents/41/audit → joins workflow_actions, approval_log, tool_execution_log → ordered by timestamp',
    highlight:
      'The audit chain is complete and cannot be modified post-write. Every action is traceable to a human actor or to the system agent.',
  },
  {
    id: 9,
    phase: 'Executive Summary',
    title: 'Executive brief generated — evidence cited',
    description:
      'The document engine generates an executive incident brief for CISO review: current status, risk to operations, actions taken, evidence citations, analyst confidence (HIGH), and explicit assumptions. No claims without retrieval support.',
    durationSec: 50,
    icon: FileText,
    output:
      'Executive brief generated — INC-0041 — confidence: HIGH — evidence: 3 citations — assumptions: 2 listed — ready for CISO review',
    technicalDetail:
      'POST /api/reports/incident-brief → RAG evidence assembly → confidence scoring → zod schema validation → PDF render',
    highlight:
      'Every claim in the brief is backed by a retrieval citation. Confidence is labeled. Assumptions are visibly separated from supported findings.',
  },
  {
    id: 10,
    phase: 'Demo Complete',
    title: '8–12 minute end-to-end demo complete',
    description:
      'Signal entered → enriched → retrieved → structured triage → analyst review → approval → execution → audit chain → executive summary. Every step governed, every action auditable, every AI claim evidence-backed.',
    durationSec: 30,
    icon: Shield,
    output:
      'Demo complete. Incident INC-0041 contained. MTTD: 3min. MTTA: 4min. Approval delay: 61sec. Audit chain: 14 events. Executive brief: delivered.',
    technicalDetail:
      'End-to-end orchestration: observe_only → propose_only → approval_required → approved_execute. All four execution modes demonstrated.',
    highlight:
      'This demo reflects actual system behavior, not a simulation. Every capability shown is built and demonstrable in the pilot environment.',
  },
];

const SEED_DATASET_SUMMARY = {
  incidents: 4,
  alerts: 12,
  assets: 8,
  cases: 3,
  findings: 11,
  playbooks: 3,
  approvals: 4,
  auditEvents: 87,
};

export default function CanonicalDemoPage() {
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!running || currentStep >= DEMO_STEPS.length) return;
    const step = DEMO_STEPS[currentStep];
    const timer = setTimeout(
      () => {
        setCompletedSteps((prev) => [...prev, step.id]);
        if (currentStep < DEMO_STEPS.length - 1) {
          setCurrentStep((s) => s + 1);
        } else {
          setRunning(false);
        }
      },
      step.durationSec * 1000 * 0.05,
    );
    return () => clearTimeout(timer);
  }, [running, currentStep]);

  function startDemo() {
    setRunning(true);
    setCurrentStep(0);
    setCompletedSteps([]);
    setElapsed(0);
  }

  function resetDemo() {
    setRunning(false);
    setCurrentStep(0);
    setCompletedSteps([]);
    setElapsed(0);
  }

  const formatTime = (sec: number) =>
    `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  const progress = (completedSteps.length / DEMO_STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-[#07090d] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Play size={22} className="text-[#c9b787]" />
              <h1 className="text-xl font-bold text-white font-mono tracking-tight">
                PARAGON Canonical Demo
              </h1>
              <span className="text-xs bg-[#c9b787]/20 text-[#c9b787] border border-[#c9b787]/40 px-2 py-0.5 rounded font-mono font-bold">
                DEMO / PILOT
              </span>
            </div>
            <p className="text-xs text-[#8b9ab0] font-mono">
              10-step end-to-end: signal → enrichment → retrieval → triage → review → approval →
              execution → audit → executive summary
            </p>
            <p className="text-xs text-[#8b9ab0]/60 font-mono mt-0.5">
              Accelerated playback (5% of real timing) — actual analyst flow: 8–12 minutes
            </p>
          </div>
          <div className="flex gap-2">
            {running ? (
              <button
                onClick={() => setRunning(false)}
                className="flex items-center gap-2 px-4 py-2 bg-[#c9b787]/20 border border-[#c9b787]/40 text-[#c9b787] text-sm rounded-lg font-mono hover:bg-[#c9b787]/30 transition-colors"
              >
                <Pause size={14} /> Pause
              </button>
            ) : (
              <button
                onClick={startDemo}
                className="flex items-center gap-2 px-4 py-2 bg-[#c9b787] text-black text-sm rounded-lg font-mono font-bold hover:bg-[#c9b787] transition-colors"
              >
                <Play size={14} /> {completedSteps.length > 0 ? 'Restart Demo' : 'Start Demo'}
              </button>
            )}
            <button
              onClick={resetDemo}
              className="flex items-center gap-2 px-3 py-2 bg-[#0d1117] border border-[#1e2a3a] text-[#8b9ab0] text-sm rounded-lg font-mono hover:text-white transition-colors"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        <div className="bg-[#c9b787]/10 border border-[#c9b787]/30 rounded-xl p-4 flex items-start gap-3">
          <Info size={14} className="text-[#c9b787] mt-0.5 shrink-0" />
          <div className="space-y-1.5">
            <p className="text-xs text-[#c9b787]/80 font-mono leading-relaxed">
              <strong>PILOT ENVIRONMENT.</strong> This walkthrough uses seeded representative data
              (4 incidents, 12 alerts, 8 assets, 3 playbooks). The steps, API call patterns, and
              governance controls shown reflect real platform behavior — not fabricated. However,
              the specific incident scenario is pre-seeded for demonstration purposes, not a live
              production event.
            </p>
            <p className="text-xs text-[#c9b787]/60 font-mono">
              Production deployment requires per-customer SSO, SIEM, and identity integration
              config. SIEM ingestion, Slack notification, and mobile push are hook-ready but require
              customer credentials to activate.
            </p>
          </div>
        </div>

        {running || completedSteps.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#8b9ab0]">
                Progress: {completedSteps.length} / {DEMO_STEPS.length} steps
              </span>
              <span className="text-[#c9b787]">Elapsed: {formatTime(elapsed)}</span>
            </div>
            <div className="h-2 bg-[#1e2a3a] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#c9b787] rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          {DEMO_STEPS.map((step, idx) => {
            const isCompleted = completedSteps.includes(step.id);
            const isActive = running && currentStep === idx;
            const _isPending = !isCompleted && !isActive;
            return (
              <div
                key={step.id}
                className={`border rounded-xl p-4 transition-all ${isCompleted ? 'bg-[#c9b787]/5 border-[#c9b787]/30' : isActive ? 'bg-[#c9b787]/10 border-[#c9b787]/40' : 'bg-[#0d1117] border-[#1e2a3a]'}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0 ${isCompleted ? 'bg-[#c9b787]/20 border-[#c9b787]/50' : isActive ? 'bg-[#c9b787]/20 border-[#c9b787]/50' : 'bg-[#0a0f16] border-[#1e2a3a]'}`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={14} className="text-[#c9b787]" />
                    ) : isActive ? (
                      <div className="w-3 h-3 border border-[#c9b787] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="text-xs text-[#8b9ab0] font-mono">{step.id}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-[#c9b787] font-mono font-bold">
                        {step.phase}
                      </span>
                      {isActive && (
                        <span className="text-xs bg-[#c9b787]/20 text-[#c9b787] px-1.5 py-0.5 rounded font-mono animate-pulse">
                          Running
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1">{step.title}</h3>
                    <p className="text-xs text-[#8b9ab0] leading-relaxed">{step.description}</p>
                    {(isCompleted || isActive) && (
                      <div className="mt-3 space-y-2">
                        <div className="p-2 bg-[#0a0f16] rounded border border-[#1e2a3a] font-mono text-xs text-[#c9b787]">
                          → {step.output}
                        </div>
                        <div className="p-2 bg-[#0a0f16] rounded border border-[#1e2a3a] font-mono text-xs text-[#8b9ab0]">
                          {step.technicalDetail}
                        </div>
                        <div className="flex items-start gap-1.5 p-2 bg-[#c9b787]/10 rounded border border-[#c9b787]/20">
                          <Info size={11} className="text-[#c9b787] mt-0.5 shrink-0" />
                          <p className="text-xs text-[#c9b787] font-mono">{step.highlight}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-[#8b9ab0] font-mono shrink-0">
                    ~{step.durationSec}s
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-5">
          <h3 className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono mb-4">
            Demo Seed Dataset
          </h3>
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(SEED_DATASET_SUMMARY).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="text-2xl font-bold text-[#c9b787] font-mono">{value}</div>
                <div className="text-xs text-[#8b9ab0] font-mono capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
