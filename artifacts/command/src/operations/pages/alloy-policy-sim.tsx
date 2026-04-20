import { api } from '@lyte/lib/api';
import { useStandardQuery } from '@szl-holdings/api-client-react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  ChevronRight,
  Clock,
  Eye,
  GitBranch,
  Info,
  Lock,
  Play,
  RefreshCw,
  Shield,
  XCircle,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

const BG = { page: '#080c14', surface: '#0c1018', elevated: '#10141e' };
const BORDER = { subtle: 'rgba(255,255,255,0.04)', muted: 'rgba(255,255,255,0.07)' };
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
  muted: 'rgba(255,255,255,0.14)',
};
const ACCENT = '#d4a054';

type PolicyOutcome = 'approved' | 'blocked' | 'escalated' | 'deferred';

interface PolicyRule {
  id: string;
  name: string;
  scope: string;
  condition: string;
  action: string;
  active: boolean;
  priority: number;
}

interface SimStep {
  step: string;
  description: string;
  outcome: PolicyOutcome;
  rule?: string;
  reason: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface SimScenario {
  name: string;
  description: string;
  pack: string;
  packColor: string;
  impactEstimate?: string;
  timeOfDay?: string;
  severity?: string;
  steps: SimStep[];
  summary: { approved: number; blocked: number; escalated: number; deferred: number };
}

type LucideIcon = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
const OUTCOME_CFG: Record<
  PolicyOutcome,
  { color: string; bg: string; icon: LucideIcon; label: string }
> = {
  approved: { color: '#6b8f71', bg: 'rgba(107,143,113,0.1)', icon: CheckCircle, label: 'Approved' },
  blocked: { color: '#c45a4a', bg: 'rgba(196,90,74,0.1)', icon: XCircle, label: 'Blocked' },
  escalated: {
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.1)',
    icon: AlertTriangle,
    label: 'Escalated',
  },
  deferred: { color: '#c8953c', bg: 'rgba(200,149,60,0.1)', icon: Clock, label: 'Deferred' },
};

const COVENANT_RULES: PolicyRule[] = [
  {
    id: 'p1',
    name: 'High-severity → Human approval required',
    scope: 'All workflows',
    condition: 'severity >= HIGH',
    action: 'Insert approval gate',
    active: true,
    priority: 1,
  },
  {
    id: 'p2',
    name: 'Financial actions > $50K → Finance review',
    scope: 'Finance workflows',
    condition: 'impact_estimate > 50000',
    action: 'Route to Finance approver',
    active: true,
    priority: 2,
  },
  {
    id: 'p3',
    name: 'Compliance events → immutable audit log',
    scope: 'Compliance workflows',
    condition: 'category = compliance',
    action: 'Append to audit trail',
    active: true,
    priority: 3,
  },
  {
    id: 'p4',
    name: 'Auto-remediation for known patterns',
    scope: 'Ops workflows',
    condition: 'pattern_match = known',
    action: 'Execute remediation playbook',
    active: false,
    priority: 4,
  },
  {
    id: 'p5',
    name: 'Off-hours actions → defer or escalate',
    scope: 'All workflows',
    condition: 'time NOT BETWEEN 08:00-18:00',
    action: 'Escalate or defer',
    active: true,
    priority: 5,
  },
  {
    id: 'p6',
    name: 'Irreversible write-backs → dual approval',
    scope: 'Write-back gates',
    condition: 'irreversible = true',
    action: 'Require dual approver sign-off',
    active: true,
    priority: 6,
  },
  {
    id: 'p7',
    name: 'Export to external party → redaction check',
    scope: 'Export gates',
    condition: 'destination = external',
    action: 'Apply redaction policy',
    active: true,
    priority: 7,
  },
];

const SCENARIOS: SimScenario[] = [
  {
    name: 'Charter rate update at 2AM',
    description:
      'Apply a new fuel surcharge rate change (>$50K fleet-wide impact) at 2:00 AM outside business hours.',
    pack: 'Vessels',
    packColor: '#38bdf8',
    impactEstimate: '$72,000',
    timeOfDay: '02:00 AM',
    severity: 'MEDIUM',
    steps: [
      {
        step: 'Calculate Surcharge Rates',
        description: 'Run fuel surcharge formula against current Brent crude',
        outcome: 'approved',
        reason: 'Calculation step — no policy trigger',
        riskLevel: 'low',
      },
      {
        step: 'Financial Impact Check',
        description: 'Fleet-wide impact estimate: $72,000',
        outcome: 'escalated',
        rule: 'p2',
        reason: 'Impact > $50K threshold — Finance review required',
        riskLevel: 'high',
      },
      {
        step: 'Off-Hours Detection',
        description: 'Action triggered at 02:00 AM — outside 08:00–18:00 window',
        outcome: 'deferred',
        rule: 'p5',
        reason: 'Off-hours policy — deferred until 08:00 AM business hours',
        riskLevel: 'medium',
      },
      {
        step: 'Write-Back Gate',
        description: 'Irreversible rate table update pending',
        outcome: 'blocked',
        rule: 'p6',
        reason: 'Irreversible write-back requires dual approver sign-off',
        riskLevel: 'high',
      },
    ],
    summary: { approved: 1, blocked: 1, escalated: 1, deferred: 1 },
  },
  {
    name: 'Export portfolio data to external auditor',
    description:
      'Send full Q1 real estate valuation dataset to external auditor without redaction pre-check.',
    pack: 'Terra',
    packColor: '#a07848',
    impactEstimate: '$0',
    timeOfDay: '10:30 AM',
    severity: 'LOW',
    steps: [
      {
        step: 'Data Assembly',
        description: 'Compile 14 asset valuations + income data',
        outcome: 'approved',
        reason: 'Assembly step — no policy trigger',
        riskLevel: 'low',
      },
      {
        step: 'External Destination Check',
        description: 'Export destination: Secure Auditor Portal (external party)',
        outcome: 'blocked',
        rule: 'p7',
        reason: 'External destination detected — redaction policy must be applied first',
        riskLevel: 'high',
      },
      {
        step: 'Compliance Audit Trail',
        description: 'Export is a compliance-category event',
        outcome: 'approved',
        rule: 'p3',
        reason: 'Compliance audit trail appended — required step passed',
        riskLevel: 'low',
      },
      {
        step: 'Finance Sign-Off',
        description: 'Export contains financial data under Finance governance',
        outcome: 'escalated',
        rule: 'p2',
        reason: 'Finance-category data requires Finance approval before external release',
        riskLevel: 'medium',
      },
    ],
    summary: { approved: 2, blocked: 1, escalated: 1, deferred: 0 },
  },
  {
    name: 'Security incident auto-remediation (known pattern)',
    description:
      'Attempt to auto-remediate a known brute-force pattern using the remediation playbook without approval.',
    pack: 'Aegis',
    packColor: '#4f6ef7',
    impactEstimate: '$0',
    timeOfDay: '3:45 PM',
    severity: 'HIGH',
    steps: [
      {
        step: 'Incident Classification',
        description: 'Severity: HIGH — brute-force attack detected',
        outcome: 'escalated',
        rule: 'p1',
        reason: 'HIGH severity — human approval gate required before any action',
        riskLevel: 'high',
      },
      {
        step: 'Auto-Remediation Attempt',
        description: 'Pattern matched: known brute-force signature',
        outcome: 'blocked',
        rule: 'p4',
        reason: 'Auto-remediation policy is INACTIVE — manual approval required',
        riskLevel: 'high',
      },
      {
        step: 'Compliance Logging',
        description: 'Security incident is compliance-category',
        outcome: 'approved',
        rule: 'p3',
        reason: 'Compliance audit trail appended — passed',
        riskLevel: 'low',
      },
      {
        step: 'Block IP Rule Deployment',
        description: 'Deploy firewall rule to block attacker IP',
        outcome: 'escalated',
        rule: 'p1',
        reason: 'HIGH severity action requires CISO sign-off before deployment',
        riskLevel: 'high',
      },
    ],
    summary: { approved: 1, blocked: 1, escalated: 2, deferred: 0 },
  },
  {
    name: 'Q1 executive report distribution',
    description:
      'Distribute Q1 board report to external board members with exec sign-off in place.',
    pack: 'PRISM',
    packColor: '#d4a054',
    impactEstimate: '$0',
    timeOfDay: '9:00 AM',
    severity: 'LOW',
    steps: [
      {
        step: 'Report Compilation',
        description: 'Aggregate KPIs and generate narrative',
        outcome: 'approved',
        reason: 'Internal compilation — no policy triggers',
        riskLevel: 'low',
      },
      {
        step: 'External Distribution Check',
        description: 'Recipients include external board members',
        outcome: 'blocked',
        rule: 'p7',
        reason: 'External destination — redaction policy must be applied and verified',
        riskLevel: 'medium',
      },
      {
        step: 'Exec Approval Verification',
        description: 'CEO + CFO sign-off recorded in audit trail',
        outcome: 'approved',
        reason: 'Approval chain satisfied — dual exec sign-off verified',
        riskLevel: 'low',
      },
      {
        step: 'Compliance Trail',
        description: 'Board report is a compliance-category document',
        outcome: 'approved',
        rule: 'p3',
        reason: 'Compliance audit trail appended — passed',
        riskLevel: 'low',
      },
    ],
    summary: { approved: 3, blocked: 1, escalated: 0, deferred: 0 },
  },
];

function OutcomeBadge({ outcome }: { outcome: PolicyOutcome }) {
  const cfg = OUTCOME_CFG[outcome];
  const Icon = cfg.icon;
  return (
    <span
      className="flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-semibold font-mono"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}20` }}
    >
      <Icon className="w-2.5 h-2.5" /> {cfg.label}
    </span>
  );
}

export default function AlloyPolicySimPage() {
  const [activeScenario, setActiveScenario] = useState<SimScenario | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState<number>(0);
  const [showRules, setShowRules] = useState(false);
  const [liveSimResult, setLiveSimResult] = useState<Record<string, unknown> | null>(null);
  const [isLiveSimRunning, setIsLiveSimRunning] = useState(false);

  const { data: policiesData } = useStandardQuery({
    queryKey: ['covenant-policies'],
    queryFn: () => api.covenant.policies(),
    staleTime: 120_000,
  });

  const { data: covenantStatus } = useStandardQuery({
    queryKey: ['covenant-status'],
    queryFn: () => api.covenant.status(),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const realPolicyCount = policiesData?.count ?? 0;

  async function runLiveSim(scenario: SimScenario) {
    setIsLiveSimRunning(true);
    setLiveSimResult(null);
    try {
      const result = await api.covenant.simulate(
        { roles: ['analyst'] },
        { type: 'workflow', domain: 'lyte' },
        'execute',
        {
          scenario: scenario.name,
          severity: scenario.severity,
          timeOfDay: scenario.timeOfDay,
          impactEstimate: scenario.impactEstimate,
          pack: scenario.pack,
        },
      );
      setLiveSimResult(result);
    } catch {
      setLiveSimResult(null);
    } finally {
      setIsLiveSimRunning(false);
    }
  }

  function runSim(scenario: SimScenario) {
    setActiveScenario(scenario);
    setIsRunning(true);
    setVisibleSteps(0);
    setLiveSimResult(null);
    void runLiveSim(scenario);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleSteps(i);
      if (i >= scenario.steps.length) {
        setIsRunning(false);
        clearInterval(interval);
      }
    }, 500);
  }

  return (
    <div className="p-4 md:p-5 space-y-5" style={{ background: BG.page, minHeight: '100vh' }}>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-3.5 h-3.5" style={{ color: ACCENT }} />
          <span
            className="text-[9px] font-mono uppercase tracking-widest"
            style={{ color: ACCENT }}
          >
            Alloy · COVENANT
          </span>
        </div>
        <h1 className="text-lg font-bold tracking-tight" style={{ color: TEXT.primary }}>
          Policy Simulation Console
        </h1>
        <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>
          Test "what would happen if" scenarios against COVENANT policies before running live. See
          projected approve / block / escalate outcomes.
        </p>
        <div
          className="mt-2 flex items-center gap-1.5 text-[9px] font-mono px-2 py-1 rounded w-fit"
          style={{
            background: 'rgba(212,160,84,0.06)',
            border: '1px solid rgba(212,160,84,0.15)',
            color: '#d4a054',
          }}
        >
          <Eye className="w-3 h-3" /> SIMULATION ONLY — No live actions executed
        </div>
      </div>

      <div
        className="rounded-md p-3 flex items-start gap-2"
        style={{ background: 'rgba(74,144,184,0.04)', border: '1px solid rgba(74,144,184,0.12)' }}
      >
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#4a90b8' }} />
        <div className="flex-1">
          <p className="text-[9px] leading-relaxed" style={{ color: TEXT.secondary }}>
            COVENANT is Alloy's policy engine. Every proposed action is evaluated against active
            policy rules before execution. This console simulates those evaluations without
            triggering real workflows.
          </p>
          {covenantStatus && (
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[8px] font-mono" style={{ color: '#6b8f71' }}>
                Engine: {covenantStatus.status}
              </span>
              {realPolicyCount > 0 && (
                <span className="text-[8px] font-mono" style={{ color: TEXT.tertiary }}>
                  {realPolicyCount} policies loaded
                </span>
              )}
              {(covenantStatus.highRiskActions as string[])?.length > 0 && (
                <span className="text-[8px] font-mono" style={{ color: '#c8953c' }}>
                  {(covenantStatus.highRiskActions as string[]).length} high-risk actions monitored
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span
          className="text-[9px] font-semibold uppercase tracking-widest"
          style={{ color: TEXT.muted }}
        >
          Active COVENANT Rules
        </span>
        <button
          onClick={() => setShowRules(!showRules)}
          className="flex items-center gap-1 text-[9px] hover:opacity-75 transition-opacity"
          style={{ color: TEXT.tertiary }}
        >
          {showRules ? 'Hide' : 'Show'} rules
          <ChevronRight
            className={`w-3 h-3 transition-transform ${showRules ? 'rotate-90' : ''}`}
          />
        </button>
      </div>

      {showRules && (
        <div
          className="rounded-md overflow-hidden"
          style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
        >
          <div className="divide-y" style={{ borderColor: BORDER.subtle }}>
            {COVENANT_RULES.map((rule) => (
              <div key={rule.id} className="flex items-start gap-3 px-4 py-3">
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0`}
                  style={{ background: rule.active ? '#6b8f71' : TEXT.muted }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>
                      P{rule.priority}
                    </span>
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: rule.active ? TEXT.primary : TEXT.tertiary }}
                    >
                      {rule.name}
                    </span>
                    {!rule.active && (
                      <span
                        className="text-[7px] font-mono px-1 py-px rounded"
                        style={{ color: TEXT.muted, background: 'rgba(255,255,255,0.04)' }}
                      >
                        INACTIVE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[8px]">
                    <span className="font-mono" style={{ color: TEXT.muted }}>
                      IF {rule.condition}
                    </span>
                    <ArrowRight className="w-2.5 h-2.5" style={{ color: TEXT.muted }} />
                    <span style={{ color: TEXT.tertiary }}>{rule.action}</span>
                  </div>
                </div>
                <span className="text-[8px] font-mono shrink-0" style={{ color: TEXT.muted }}>
                  {rule.scope}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <span
          className="text-[9px] font-semibold uppercase tracking-widest"
          style={{ color: TEXT.muted }}
        >
          Simulation Scenarios
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-2">
          {SCENARIOS.map((s) => (
            <div
              key={s.name}
              className="rounded-md p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
              style={{
                background: BG.surface,
                border: `1px solid ${activeScenario?.name === s.name ? ACCENT + '40' : BORDER.subtle}`,
              }}
              onClick={() => !isRunning && runSim(s)}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest"
                  style={{ color: s.packColor, background: `${s.packColor}14` }}
                >
                  {s.pack}
                </span>
                {s.impactEstimate && s.impactEstimate !== '$0' && (
                  <span
                    className="text-[7px] font-mono px-1.5 py-0.5 rounded"
                    style={{ color: '#c8953c', background: 'rgba(200,149,60,0.08)' }}
                  >
                    {s.impactEstimate} impact
                  </span>
                )}
                {s.timeOfDay && (
                  <span
                    className="text-[7px] font-mono px-1.5 py-0.5 rounded"
                    style={{ color: TEXT.muted, background: 'rgba(255,255,255,0.04)' }}
                  >
                    {s.timeOfDay}
                  </span>
                )}
              </div>
              <div className="text-[11px] font-medium mb-1" style={{ color: TEXT.primary }}>
                {s.name}
              </div>
              <p className="text-[9px] leading-relaxed mb-3" style={{ color: TEXT.secondary }}>
                {s.description}
              </p>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] font-medium hover:opacity-80 transition-all"
                style={{
                  background: 'rgba(212,160,84,0.1)',
                  border: '1px solid rgba(212,160,84,0.2)',
                  color: ACCENT,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isRunning) runSim(s);
                }}
              >
                {isRunning && activeScenario?.name === s.name ? (
                  <>
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Running…
                  </>
                ) : (
                  <>
                    <Play className="w-2.5 h-2.5" /> Simulate
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {activeScenario && (
        <div className="space-y-4">
          <div
            className="rounded-md overflow-hidden"
            style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
          >
            <div
              className="px-4 py-3 flex items-center gap-2"
              style={{ borderBottom: `1px solid ${BORDER.subtle}` }}
            >
              <Shield className="w-3.5 h-3.5" style={{ color: '#8b7ac8' }} />
              <span className="text-[11px] font-semibold" style={{ color: TEXT.primary }}>
                COVENANT Simulation: {activeScenario.name}
              </span>
              {isRunning && (
                <RefreshCw className="w-3 h-3 animate-spin ml-auto" style={{ color: ACCENT }} />
              )}
            </div>

            <div className="divide-y" style={{ borderColor: BORDER.subtle }}>
              {activeScenario.steps.slice(0, visibleSteps).map((step, i) => {
                const rule = step.rule ? COVENANT_RULES.find((r) => r.id === step.rule) : null;
                return (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-mono font-bold"
                          style={{ background: 'rgba(255,255,255,0.04)', color: TEXT.muted }}
                        >
                          {i + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] font-medium" style={{ color: TEXT.primary }}>
                            {step.step}
                          </span>
                          <OutcomeBadge outcome={step.outcome} />
                        </div>
                        <p className="text-[9px]" style={{ color: TEXT.secondary }}>
                          {step.description}
                        </p>
                        <div className="mt-1.5 flex items-start gap-1.5">
                          {rule && (
                            <span
                              className="text-[7px] font-mono px-1.5 py-0.5 rounded shrink-0"
                              style={{ color: TEXT.muted, background: 'rgba(255,255,255,0.04)' }}
                            >
                              Rule {rule.id}
                            </span>
                          )}
                          <p
                            className="text-[9px] italic"
                            style={{ color: OUTCOME_CFG[step.outcome].color + 'cc' }}
                          >
                            {step.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {!isRunning && visibleSteps >= activeScenario.steps.length && (
              <div className="px-4 py-4" style={{ borderTop: `1px solid ${BORDER.subtle}` }}>
                <div
                  className="text-[9px] font-semibold uppercase tracking-widest mb-2.5"
                  style={{ color: TEXT.muted }}
                >
                  Simulation Summary
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(['approved', 'blocked', 'escalated', 'deferred'] as PolicyOutcome[]).map(
                    (key) => {
                      const cfg = OUTCOME_CFG[key];
                      const val = activeScenario.summary[key];
                      return (
                        <div
                          key={key}
                          className="rounded-md p-2.5 text-center"
                          style={{
                            background: BG.elevated,
                            border: `1px solid ${val > 0 ? cfg.color + '20' : BORDER.subtle}`,
                          }}
                        >
                          <div
                            className="text-base font-bold font-mono"
                            style={{ color: val > 0 ? cfg.color : TEXT.muted }}
                          >
                            {val}
                          </div>
                          <div
                            className="text-[7px] uppercase tracking-widest mt-0.5"
                            style={{ color: val > 0 ? cfg.color : TEXT.muted }}
                          >
                            {cfg.label}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
                {activeScenario.summary.blocked > 0 && (
                  <div
                    className="mt-3 rounded-md p-2.5 flex items-start gap-2"
                    style={{
                      background: 'rgba(196,90,74,0.04)',
                      border: '1px solid rgba(196,90,74,0.12)',
                    }}
                  >
                    <AlertTriangle
                      className="w-3 h-3 shrink-0 mt-0.5"
                      style={{ color: '#c45a4a' }}
                    />
                    <p className="text-[9px]" style={{ color: '#c45a4a' }}>
                      {activeScenario.summary.blocked} step
                      {activeScenario.summary.blocked > 1 ? 's' : ''} would be blocked. This
                      workflow cannot proceed live without resolving policy violations.
                    </p>
                  </div>
                )}
                {liveSimResult && (
                  <div
                    className="mt-3 rounded-md p-2.5"
                    style={{
                      background: 'rgba(107,143,113,0.04)',
                      border: '1px solid rgba(107,143,113,0.12)',
                    }}
                  >
                    <div
                      className="text-[8px] font-mono font-semibold mb-1.5 uppercase tracking-widest"
                      style={{ color: '#6b8f71' }}
                    >
                      COVENANT Engine Response
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-mono" style={{ color: TEXT.secondary }}>
                        Decision:{' '}
                        <span
                          style={{
                            color:
                              (liveSimResult.decision as Record<string, string> | undefined)
                                ?.effect === 'allow'
                                ? '#6b8f71'
                                : '#c45a4a',
                          }}
                        >
                          {(
                            (liveSimResult.decision as Record<string, string> | undefined)
                              ?.effect ?? 'evaluated'
                          ).toUpperCase()}
                        </span>
                      </span>
                      {typeof liveSimResult.explanation === 'string' &&
                        liveSimResult.explanation && (
                          <span className="text-[8px]" style={{ color: TEXT.tertiary }}>
                            {String(liveSimResult.explanation).slice(0, 80)}
                          </span>
                        )}
                    </div>
                  </div>
                )}
                {isLiveSimRunning && !liveSimResult && (
                  <div className="mt-3 flex items-center gap-2">
                    <RefreshCw className="w-3 h-3 animate-spin" style={{ color: ACCENT }} />
                    <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>
                      Querying COVENANT engine…
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
