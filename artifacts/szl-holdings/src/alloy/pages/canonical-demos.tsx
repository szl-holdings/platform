import { DataStateBadge } from '@szl-holdings/shared-ui/data-state-badge';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Eye,
  FileText,
  Globe,
  Layers,
  Play,
  Radio,
  RefreshCw,
  Shield,
  Smartphone,
  User,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type DemoId = 'executive' | 'buyer' | 'workspace' | 'mobile';

interface DemoStep {
  id: number;
  label: string;
  description: string;
  icon: React.ReactNode;
  durationMs: number;
  phase: 'signal' | 'agent' | 'decision' | 'approval' | 'action' | 'audit';
  evidence?: string;
}

const DEMO_CONFIGS: Record<
  DemoId,
  {
    title: string;
    audience: string;
    duration: string;
    tagline: string;
    icon: React.ReactNode;
    color: string;
    steps: DemoStep[];
  }
> = {
  executive: {
    title: 'Executive / Investor Demo',
    audience: 'Investors & Board',
    duration: '~3 min',
    tagline:
      'Signal arrives → agent processes → decision with evidence → approval → execution → audit trail',
    icon: <Shield className="w-4 h-4" />,
    color: '#8b5cf6',
    steps: [
      {
        id: 1,
        label: 'Signal Arrives',
        phase: 'signal',
        description:
          'Anomaly detected: Vendor invoice #INV-4821 for $47,200 submitted outside normal approval window. Risk score: 8.4/10.',
        icon: <Radio className="w-3.5 h-3.5" />,
        durationMs: 800,
        evidence: 'Source: AP system webhook · Severity: HIGH · Confidence: 91%',
      },
      {
        id: 2,
        label: 'Agent Processes',
        phase: 'agent',
        description:
          'Counsel routes to Finance agent (KORA). Cross-references vendor history, contract terms, and similar invoices. Identifies: no corresponding PO, vendor flagged for duplicate billing in Q1.',
        icon: <Zap className="w-3.5 h-3.5" />,
        durationMs: 1800,
        evidence: 'KORA confidence: 88% · 3 evidence sources · Maker-checker: Sentinel validated',
      },
      {
        id: 3,
        label: 'Decision Object Produced',
        phase: 'decision',
        description:
          'Decision: HOLD for manual review. Recommendation: require PO match before processing. Estimated risk avoidance: $47,200. Evidence package attached.',
        icon: <FileText className="w-3.5 h-3.5" />,
        durationMs: 600,
        evidence:
          'Decision ID: DEC-2841 · Policy: invoice-approval-v2 · Approval required: Director Finance',
      },
      {
        id: 4,
        label: 'Approval Requested',
        phase: 'approval',
        description:
          'Approval request routed to Sarah Chen (Director, Finance) per approval matrix policy. SLA: 4 hours. Escalation: CFO after 4h.',
        icon: <User className="w-3.5 h-3.5" />,
        durationMs: 400,
        evidence: 'Approval #APR-0481 · Expires: 4h · Role: director_finance',
      },
      {
        id: 5,
        label: 'Human Approves',
        phase: 'approval',
        description:
          "Sarah Chen reviews evidence package and approves HOLD action. Notes: 'Vendor to provide PO reference before processing.' Decision logged.",
        icon: <CheckCircle className="w-3.5 h-3.5" />,
        durationMs: 200,
        evidence: 'Approved by: Sarah Chen · 8 min after request · Decision notes recorded',
      },
      {
        id: 6,
        label: 'Action Executed',
        phase: 'action',
        description:
          "Invoice flagged in AP system. Vendor notified via automated email. Finance team alerted. Workflow state updated to 'pending_vendor_response'.",
        icon: <ArrowRight className="w-3.5 h-3.5" />,
        durationMs: 700,
        evidence:
          'Actions: [ap_flag, vendor_email, team_alert] · All succeeded · State: pending_vendor_response',
      },
      {
        id: 7,
        label: 'Audit Trail Captured',
        phase: 'audit',
        description:
          'Complete immutable audit record: signal → analysis → decision → approval → execution. Available for SOC 2 evidence, 365-day retention.',
        icon: <Shield className="w-3.5 h-3.5" />,
        durationMs: 300,
        evidence: 'Audit entry: AUD-9204 · Retention: 365 days · SOC 2 compliant · Tamper-proof',
      },
    ],
  },
  buyer: {
    title: 'Buyer Demo',
    audience: 'Ops & Finance Buyers',
    duration: '~4 min',
    tagline:
      'Manual workflow → Counsel automates → evidence retrieval → resolution → time savings shown',
    icon: <Zap className="w-4 h-4" />,
    color: '#4B8BDB',
    steps: [
      {
        id: 1,
        label: 'Pain Point Identified',
        phase: 'signal',
        description:
          "Competitor intelligence request arrives: 'Research Apex Systems and produce a detailed competitive brief for Q2 board prep.' Previously: 2–3 analyst days.",
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
        durationMs: 500,
        evidence: 'Request source: Slack command · Requestor: Lisa Thornton · Priority: HIGH',
      },
      {
        id: 2,
        label: 'Counsel Activates Research Agent',
        phase: 'agent',
        description:
          'AI research agent dispatched. Queries: company financials, press coverage, product releases, patent filings, LinkedIn headcount changes, pricing data.',
        icon: <Zap className="w-3.5 h-3.5" />,
        durationMs: 2200,
        evidence: 'AI confidence: 84% · Sources scanned: 14 · Synthesis: 3,200 words',
      },
      {
        id: 3,
        label: 'Evidence Retrieved & Synthesized',
        phase: 'decision',
        description:
          'Apex Systems: $42M ARR (est), 22% YoY growth, 3 new enterprise wins this quarter. Product gap: no mobile-native workflow. Pricing: 15% above Counsel list.',
        icon: <FileText className="w-3.5 h-3.5" />,
        durationMs: 800,
        evidence: '14 sources · 3 evidence chains · Confidence markers per claim',
      },
      {
        id: 4,
        label: 'Artifact Generated',
        phase: 'action',
        description:
          'Competitive brief artifact produced: executive summary, 5-page analysis, SWOT table, win/loss talking points, recommended positioning. Requires compliance review before sharing.',
        icon: <FileText className="w-3.5 h-3.5" />,
        durationMs: 600,
        evidence: 'Artifact #ART-0812 · Format: PDF/markdown · Status: pending_review',
      },
      {
        id: 5,
        label: 'Task Resolved',
        phase: 'action',
        description:
          'Brief delivered to Lisa Thornton. Full workflow: 6 minutes. Previous method: 2–3 analyst days (avg 19 hours). Time saved per request: ~18.9 hours.',
        icon: <CheckCircle className="w-3.5 h-3.5" />,
        durationMs: 300,
        evidence: 'Time saved: 18.9h · Analyst cost avoided: ~$1,890 · Accuracy: human-reviewed',
      },
    ],
  },
  workspace: {
    title: 'Workspace Demo',
    audience: 'Power Users & Champions',
    duration: '~4 min',
    tagline:
      'Research → multi-source synthesis → artifact → browser extraction → meeting summary → one workspace',
    icon: <Layers className="w-4 h-4" />,
    color: '#10b981',
    steps: [
      {
        id: 1,
        label: 'Research Query',
        phase: 'signal',
        description:
          "User asks: 'Summarize the market for B2B workflow automation in 2026. Include key vendors, funding trends, and customer pain points.'",
        icon: <Eye className="w-3.5 h-3.5" />,
        durationMs: 400,
        evidence:
          'Query source: Counsel console · Agent routing: AI research agent + KORA (analytics)',
      },
      {
        id: 2,
        label: 'Multi-Source Synthesis',
        phase: 'agent',
        description:
          'AI research agent queries Arxiv, HuggingFace, web sources, and internal knowledge. KORA correlates with platform metrics. Responses synthesized by Counsel orchestrator.',
        icon: <Zap className="w-3.5 h-3.5" />,
        durationMs: 2400,
        evidence: 'Agents: SZL APEX + KORA · Sources: 11 · Avg confidence: 82%',
      },
      {
        id: 3,
        label: 'Artifact Generated',
        phase: 'action',
        description:
          'Market brief artifact created: 2,800 words, 4 vendor profiles, 3 funding charts, customer pain point matrix. Available in workspace sidebar.',
        icon: <FileText className="w-3.5 h-3.5" />,
        durationMs: 700,
        evidence: 'Artifact #ART-0891 · Ready for review · Download: PDF / Markdown',
      },
      {
        id: 4,
        label: 'Browser Data Extraction',
        phase: 'agent',
        description:
          'Browser Operator dispatched to extract competitor pricing tables from 3 public sites. Structured data returned, appended to artifact.',
        icon: <Globe className="w-3.5 h-3.5" />,
        durationMs: 1800,
        evidence:
          'Browser operator · 3 sites · Tables extracted: 6 · Requires: no approval (public data)',
      },
      {
        id: 5,
        label: 'Meeting Summary Added',
        phase: 'action',
        description:
          "Workspace ingests last week's strategy meeting transcript. Key decisions and action items extracted, linked to the research artifact.",
        icon: <User className="w-3.5 h-3.5" />,
        durationMs: 600,
        evidence:
          'Transcript: 47 min · Decisions: 4 · Action items: 9 · Owner assignments detected',
      },
      {
        id: 6,
        label: 'All-in-One View',
        phase: 'audit',
        description:
          'Research, artifacts, browser data, and meeting context — all visible in one workspace. Full source traceability for every data point.',
        icon: <Layers className="w-3.5 h-3.5" />,
        durationMs: 200,
        evidence: 'Workspace: all-in-one · Source: clearly labeled · Audit: complete',
      },
    ],
  },
  mobile: {
    title: 'Mobile Demo',
    audience: 'Executives & Decision Makers',
    duration: '~2 min',
    tagline:
      'Alert arrives on phone → approve from notification → dashboard shows status → digest summarizes the day',
    icon: <Smartphone className="w-4 h-4" />,
    color: '#f59e0b',
    steps: [
      {
        id: 1,
        label: 'Alert Arrives on Mobile',
        phase: 'signal',
        description:
          "Push notification received on executive mobile app: 'Invoice #4821 flagged — requires your approval. Value: $47,200. Evidence: 3 sources. Expires in 4h.'",
        icon: <Smartphone className="w-3.5 h-3.5" />,
        durationMs: 500,
        evidence: 'Push to: SZL Holdings Executive App · Priority: HIGH · Expiry: 4h',
      },
      {
        id: 2,
        label: 'Evidence Reviewed In-App',
        phase: 'decision',
        description:
          'Executive opens notification. Full decision object visible: agent summary, evidence chain, confidence score, policy reference. Audit trail link present.',
        icon: <Eye className="w-3.5 h-3.5" />,
        durationMs: 800,
        evidence: 'Decision visible: 3 screens · Evidence: swipeable · Confidence: 88%',
      },
      {
        id: 3,
        label: 'Approved from Notification',
        phase: 'approval',
        description:
          'One-tap approval from the mobile app. Biometric confirmation. Decision recorded with timestamp, GPS-tagged location (if enabled), and device fingerprint.',
        icon: <CheckCircle className="w-3.5 h-3.5" />,
        durationMs: 300,
        evidence: 'Approved: 1 tap · Auth: biometric · Timestamp: recorded · Audit: immutable',
      },
      {
        id: 4,
        label: 'Dashboard Status Updated',
        phase: 'action',
        description:
          "SZL Holdings mobile dashboard reflects updated status. Invoice workflow: 'approved — awaiting vendor response'. All downstream steps triggered automatically.",
        icon: <ArrowRight className="w-3.5 h-3.5" />,
        durationMs: 400,
        evidence: 'Dashboard: live · Status: updated · Downstream: triggered',
      },
      {
        id: 5,
        label: 'Executive Digest',
        phase: 'audit',
        description:
          'End-of-day AI digest summarizes: 3 approvals completed, 2 alerts reviewed, $47,200 risk mitigated, 1 open item requiring action tomorrow.',
        icon: <FileText className="w-3.5 h-3.5" />,
        durationMs: 200,
        evidence: 'Digest: daily · Personalized: yes · Source: all platform events',
      },
    ],
  },
};

const PHASE_COLORS: Record<string, string> = {
  signal: '#f59e0b',
  agent: '#4B8BDB',
  decision: '#8b5cf6',
  approval: '#10b981',
  action: '#4d8fcc',
  audit: '#6b7280',
};

function DemoPlayer({ demoId }: { demoId: DemoId }) {
  const cfg = DEMO_CONFIGS[demoId];
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = () => {
    setActiveStep(-1);
    setIsPlaying(false);
    setIsComplete(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const play = () => {
    reset();
    setIsPlaying(true);
    let delay = 400;
    cfg.steps.forEach((step, idx) => {
      timerRef.current = setTimeout(() => {
        setActiveStep(idx);
        if (idx === cfg.steps.length - 1) {
          setTimeout(() => {
            setIsPlaying(false);
            setIsComplete(true);
          }, step.durationMs + 300);
        }
      }, delay);
      delay += step.durationMs + 500;
    });
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="p-1.5 rounded-lg"
            style={{
              background: `${cfg.color}15`,
              border: `1px solid ${cfg.color}25`,
              color: cfg.color,
            }}
          >
            {cfg.icon}
          </div>
          <div>
            <div className="text-sm font-bold text-white">{cfg.title}</div>
            <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {cfg.audience} · {cfg.duration}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isComplete && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border"
              style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          )}
          <button
            onClick={play}
            disabled={isPlaying}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border disabled:opacity-50"
            style={{
              borderColor: `${cfg.color}30`,
              background: `${cfg.color}10`,
              color: cfg.color,
            }}
          >
            <Play className="w-3 h-3" />
            {isPlaying ? 'Playing…' : isComplete ? 'Replay' : 'Run Demo'}
          </button>
        </div>
      </div>

      <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {cfg.tagline}
      </p>

      <div className="space-y-2">
        {cfg.steps.map((step, idx) => {
          const isDone = activeStep > idx;
          const isActive = activeStep === idx;
          const isPending = activeStep < idx;
          const phaseColor = PHASE_COLORS[step.phase] ?? cfg.color;

          return (
            <div
              key={step.id}
              className="rounded-xl border p-3 transition-all duration-500"
              style={{
                borderColor: isActive
                  ? `${phaseColor}40`
                  : isDone
                    ? 'rgba(16,185,129,0.15)'
                    : 'rgba(255,255,255,0.05)',
                background: isActive
                  ? `${phaseColor}08`
                  : isDone
                    ? 'rgba(16,185,129,0.04)'
                    : 'rgba(255,255,255,0.01)',
                opacity: isPending && activeStep >= 0 ? 0.5 : 1,
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="mt-0.5 p-1 rounded-lg shrink-0 transition-all"
                  style={{
                    background: isDone
                      ? 'rgba(16,185,129,0.12)'
                      : isActive
                        ? `${phaseColor}15`
                        : 'rgba(255,255,255,0.03)',
                    color: isDone ? '#10b981' : isActive ? phaseColor : 'rgba(255,255,255,0.3)',
                    border: `1px solid ${isDone ? 'rgba(16,185,129,0.2)' : isActive ? `${phaseColor}30` : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  {isDone ? <CheckCircle className="w-3 h-3" /> : step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-xs font-semibold"
                      style={{
                        color: isDone ? '#10b981' : isActive ? 'white' : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {step.label}
                    </span>
                    <span
                      className="text-[9px] uppercase tracking-widest px-1 py-0.5 rounded font-bold shrink-0"
                      style={{ color: phaseColor, background: `${phaseColor}12` }}
                    >
                      {step.phase}
                    </span>
                    {isActive && (
                      <span
                        className="flex items-center gap-1 text-[9px]"
                        style={{ color: phaseColor }}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full animate-pulse"
                          style={{ background: phaseColor }}
                        />
                        Processing
                      </span>
                    )}
                  </div>
                  {(isActive || isDone) && (
                    <p
                      className="text-[11px] mb-1 transition-all"
                      style={{ color: 'rgba(255,255,255,0.6)' }}
                    >
                      {step.description}
                    </p>
                  )}
                  {(isActive || isDone) && step.evidence && (
                    <div
                      className="text-[9px] font-mono px-2 py-1 rounded-md"
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        color: 'rgba(255,255,255,0.35)',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      {step.evidence}
                    </div>
                  )}
                  {isPending && activeStep < 0 && (
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                      {step.description.slice(0, 60)}…
                    </p>
                  )}
                </div>
                <div
                  className="shrink-0 text-[9px] font-mono"
                  style={{ color: 'rgba(255,255,255,0.2)' }}
                >
                  {(step.durationMs / 1000).toFixed(1)}s
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isComplete && (
        <div
          className="rounded-xl border p-4 text-center"
          style={{ borderColor: 'rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.06)' }}
        >
          <CheckCircle className="w-5 h-5 mx-auto mb-2" style={{ color: '#10b981' }} />
          <div className="text-sm font-semibold" style={{ color: '#10b981' }}>
            Demo Complete
          </div>
          <div className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            All {cfg.steps.length} steps executed. This is repeatable and self-contained.
          </div>
        </div>
      )}
    </div>
  );
}

export default function CanonicalDemos() {
  const [selectedDemo, setSelectedDemo] = useState<DemoId>('executive');

  return (
    <div className="max-w-4xl mx-auto space-y-5 p-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Play className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
            <span
              className="text-[10px] font-bold uppercase tracking-widest font-mono"
              style={{ color: '#10b981' }}
            >
              Counsel · Canonical Demos
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Canonical Demo Flows</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Scripted, repeatable, labeled demo flows. Each under 5 min. Seeded data — not live
            production.
          </p>
        </div>
        <DataStateBadge state="demo" />
      </div>

      <div
        className="rounded-xl border px-4 py-3 flex items-center gap-3"
        style={{ borderColor: 'rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.05)' }}
      >
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: '#f59e0b' }} />
        <span className="text-[11px]" style={{ color: 'rgba(245,158,11,0.8)' }}>
          <strong>Demo Mode</strong> — All data shown is seeded/illustrative. These flows are for
          demonstration purposes only and never silently active.
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {(Object.entries(DEMO_CONFIGS) as [DemoId, (typeof DEMO_CONFIGS)[DemoId]][]).map(
          ([id, cfg]) => (
            <button
              key={id}
              onClick={() => setSelectedDemo(id)}
              className="rounded-xl border p-3 text-left transition-all"
              style={{
                borderColor: selectedDemo === id ? `${cfg.color}30` : 'rgba(255,255,255,0.06)',
                background: selectedDemo === id ? `${cfg.color}08` : 'rgba(255,255,255,0.01)',
              }}
            >
              <div
                className="p-1.5 rounded-lg w-fit mb-2"
                style={{ background: `${cfg.color}15`, color: cfg.color }}
              >
                {cfg.icon}
              </div>
              <div className="text-xs font-semibold text-white mb-0.5">
                {cfg.title.split(' /')[0].split(' Demo')[0]}
              </div>
              <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {cfg.audience}
              </div>
              <div className="text-[9px] mt-1 font-mono" style={{ color: cfg.color }}>
                {cfg.duration}
              </div>
            </button>
          ),
        )}
      </div>

      <div
        className="rounded-xl border p-5"
        style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
      >
        <DemoPlayer demoId={selectedDemo} />
      </div>
    </div>
  );
}
