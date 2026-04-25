import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export type PrismPhase = 'detect' | 'interpret' | 'decide' | 'execute' | 'verify';

export type DomainTag = 'aegis' | 'vessels' | 'terra';

export interface LiveSignal {
  id: string;
  domain: DomainTag;
  title: string;
  summary: string;
  severity: 'critical' | 'high' | 'medium';
  source: string;
  sourceType: string;
  detectedAt: string;
  phase: PrismPhase;
  classifiedAs: string;
  confidence: number;
}

export interface LiveRecommendation {
  id: string;
  signalId: string;
  title: string;
  reasoning: string;
  evidence: string[];
  confidenceScore: number;
  suggestedAction: string;
  impactEstimate: string;
  approvalState: 'pending' | 'approved' | 'rejected' | 'executing' | 'done';
  domain: DomainTag;
  executionLog?: string[];
}

export interface LiveWorkflowRun {
  id: string;
  signalId: string;
  domain: DomainTag;
  name: string;
  phase: PrismPhase;
  steps: WorkflowStep[];
  startedAt: string;
  completedAt?: string;
}

export interface WorkflowStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  durationMs?: number;
  output?: string;
}

export type DemoScenarioKey = 'aegis' | 'vessels' | 'terra';

export interface DemoScenario {
  key: DemoScenarioKey;
  name: string;
  domainLabel: string;
  color: string;
  icon: string;
  description: string;
  tagline: string;
  signals: Omit<LiveSignal, 'detectedAt' | 'phase'>[];
  workflowName: string;
  workflowSteps: Omit<WorkflowStep, 'status' | 'durationMs'>[];
  recommendation: Omit<LiveRecommendation, 'id' | 'approvalState' | 'executionLog'> & {
    signalId?: string;
  };
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    key: 'aegis',
    name: 'Security Incident',
    domainLabel: 'Aegis — Defense & Security',
    color: '#c45a4a',
    icon: '🛡️',
    description: 'Unauthorized credential access attempt detected across 3 admin accounts',
    tagline: 'Threat detection → triage → containment → approval → remediation',
    signals: [
      {
        id: 'LIVE-AEG-001',
        domain: 'aegis',
        title:
          'Unauthorized credential sweep: 3 admin accounts targeted — anomalous auth pattern detected',
        summary:
          'Behavioral analytics detected a structured credential sweep across admin accounts at 02:14 UTC. 847 failed attempts over 4 minutes from rotating IPs. Pattern consistent with credential-stuffing attack.',
        severity: 'critical',
        source: 'Aegis Threat Intelligence',
        sourceType: 'security_monitoring',
        classifiedAs: 'credential_attack',
        confidence: 0.94,
      },
      {
        id: 'LIVE-AEG-002',
        domain: 'aegis',
        title:
          'Lateral movement detected: internal service-to-service calls outside normal baseline',
        summary:
          'Post-authentication, internal API calls show a 340% spike from one compromised service account, querying unauthorized data endpoints.',
        severity: 'high',
        source: 'Aegis Network Fabric',
        sourceType: 'network_monitoring',
        classifiedAs: 'lateral_movement',
        confidence: 0.87,
      },
    ],
    workflowName: 'Aegis Threat Containment — SEC-CRIT-2026',
    workflowSteps: [
      { id: 's1', label: 'Detect: Ingest threat signal from Aegis Intelligence fabric' },
      { id: 's2', label: 'Interpret: Classify threat vector and map blast radius' },
      { id: 's3', label: 'Decide: Generate containment recommendation with evidence trail' },
      { id: 's4', label: 'Execute: Isolate compromised accounts, rotate credentials' },
      { id: 's5', label: 'Verify: Confirm remediation, update threat model, close loop' },
    ],
    recommendation: {
      signalId: 'LIVE-AEG-001',
      domain: 'aegis',
      title: 'Immediate containment: Isolate 3 admin accounts and rotate credentials',
      reasoning:
        'Pattern analysis confirms a credential-stuffing attack targeting admin accounts. The lateral movement signal indicates at least one account may have been partially compromised. Blast radius includes 2 internal APIs with elevated data access.',
      evidence: [
        '847 failed auth attempts in 4 minutes (baseline: < 5/hour)',
        '3 rotating IP clusters — all attributed to known threat infrastructure',
        '1 service account queried 14 unauthorized endpoints post-auth',
        'No MFA challenge triggered for 2 of 3 targeted accounts (policy gap)',
      ],
      confidenceScore: 0.94,
      suggestedAction:
        '1. Force logout and suspend 3 admin accounts\n2. Rotate all credentials and API keys\n3. Enable MFA enforcement globally\n4. Block identified IP ranges at perimeter\n5. Notify CISO and initiate incident record',
      impactEstimate:
        'Containment within 8 minutes. Prevents estimated $2.4M exposure from data breach risk.',
    },
  },
  {
    key: 'vessels',
    name: 'Maritime Exception',
    domainLabel: 'Vessels — Fleet Command',
    color: '#38bdf8',
    icon: '⚓',
    description:
      'Cargo vessel deviating from approved route — fuel anomaly and ETA impact detected',
    tagline: 'Vessel anomaly → route analysis → risk scoring → approval → course correction',
    signals: [
      {
        id: 'LIVE-VES-001',
        domain: 'vessels',
        title:
          'MV Meridian Star: unauthorized course deviation — 47nm off approved route, ETA impact +14h',
        summary:
          'AIS telemetry shows MV Meridian Star deviating 47 nautical miles south of approved route for past 6.3 hours. Fuel consumption anomaly of +34% detected. Cargo: high-value electronics, Port of Rotterdam ETA now missed.',
        severity: 'critical',
        source: 'Vessels AIS Intelligence',
        sourceType: 'vessel_monitoring',
        classifiedAs: 'route_deviation',
        confidence: 0.97,
      },
      {
        id: 'LIVE-VES-002',
        domain: 'vessels',
        title:
          'Fuel consumption anomaly: MV Meridian Star — 34% above baseline, engine fault code ECU-0147',
        summary:
          'Engine telemetry reports fault code ECU-0147 (injector irregularity) alongside elevated fuel draw. Chief Engineer has not acknowledged 3 automated system alerts.',
        severity: 'high',
        source: 'Vessels Engine Telemetry',
        sourceType: 'iot_monitoring',
        classifiedAs: 'mechanical_anomaly',
        confidence: 0.91,
      },
    ],
    workflowName: 'Vessels Deviation Response — VES-EXC-2026',
    workflowSteps: [
      { id: 's1', label: 'Detect: AIS deviation alert from Vessels telemetry layer' },
      { id: 's2', label: 'Interpret: Route analysis, fuel model, cargo risk scoring' },
      { id: 's3', label: 'Decide: Recommend optimal corrective heading and client notification' },
      { id: 's4', label: 'Execute: Dispatch course correction to vessel, notify freight client' },
      { id: 's5', label: 'Verify: Confirm vessel on corrected heading, update ETA model' },
    ],
    recommendation: {
      signalId: 'LIVE-VES-001',
      domain: 'vessels',
      title: 'Authorize emergency heading correction — bearing 047° NE — and notify freight client',
      reasoning:
        'MV Meridian Star deviation is caused by engine fault ECU-0147 combined with adverse current. Current trajectory misses Rotterdam port window, triggering demurrage penalties of $84K/day. Immediate corrective action minimizes losses.',
      evidence: [
        '47nm deviation over 6.3h — AIS confidence 97%',
        'Engine fault ECU-0147 confirmed by 3 independent telemetry nodes',
        'Rotterdam port window closes in 11.2 hours',
        'Demurrage penalty: $84K/day if window missed',
        'Optimal corrective heading: 047° NE — fuel cost delta: +$12K',
      ],
      confidenceScore: 0.97,
      suggestedAction:
        '1. Authorize heading correction to 047° NE immediately\n2. Notify Chief Engineer — escalate if no response in 15 minutes\n3. Alert freight client (PRAXIS Electronics) — revised ETA +4h\n4. Schedule port berth rebook at Rotterdam\n5. Open engine maintenance ticket for injector service at arrival',
      impactEstimate:
        'Avoids $84K/day demurrage. Saves $340K freight client penalty clause. Net loss: $12K fuel overage vs $424K+ exposure.',
    },
  },
  {
    key: 'terra',
    name: 'Real Estate Opportunity',
    domainLabel: 'Terra — Real Estate Intelligence',
    color: '#a07848',
    icon: '🏢',
    description:
      'Distressed commercial property flagged — acquisition window opening within 72 hours',
    tagline: 'Market signal → valuation analysis → risk scoring → approval → offer execution',
    signals: [
      {
        id: 'LIVE-TER-001',
        domain: 'terra',
        title:
          'Distress signal: 847 Commerce Blvd — owner listed after failed refinancing, 22% below market',
        summary:
          'Proptech intelligence identified a distressed C-class office building at 847 Commerce Blvd. Owner filed for voluntary sale after failed Q1 refinancing. Listed at $4.1M — 22% below comparable sales. 72-hour exclusive window before public listing.',
        severity: 'high',
        source: 'Terra Market Intelligence',
        sourceType: 'property_monitoring',
        classifiedAs: 'acquisition_opportunity',
        confidence: 0.89,
      },
      {
        id: 'LIVE-TER-002',
        domain: 'terra',
        title:
          'Cap rate opportunity: 847 Commerce Blvd at 9.2% — portfolio target is 7.5% threshold',
        summary:
          'Pro-forma cap rate analysis shows 9.2% at ask price, assuming 85% occupancy target. Current occupancy: 71%. Lease-up runway estimated 14 months based on comparable absorption.',
        severity: 'medium',
        source: 'Terra Financial Model',
        sourceType: 'financial_analysis',
        classifiedAs: 'financial_opportunity',
        confidence: 0.82,
      },
    ],
    workflowName: 'Terra Acquisition Analysis — TER-OPP-2026',
    workflowSteps: [
      { id: 's1', label: 'Detect: Distress signal from Terra market intelligence layer' },
      { id: 's2', label: 'Interpret: Comparable analysis, cap rate model, risk scoring' },
      {
        id: 's3',
        label: 'Decide: Recommendation with offer price, risk factors, and return model',
      },
      { id: 's4', label: 'Execute: Prepare LOI, engage broker, initiate due diligence' },
      { id: 's5', label: 'Verify: Confirm LOI delivered, timeline locked, pipeline updated' },
    ],
    recommendation: {
      signalId: 'LIVE-TER-001',
      domain: 'terra',
      title: 'Submit LOI at $3.95M — 72-hour exclusive window closes April 6 09:00 EST',
      reasoning:
        '847 Commerce Blvd represents a high-conviction acquisition aligned with portfolio strategy. Distressed owner, exclusive window, and above-target cap rate create a rare entry point. Risk-adjusted IRR of 18.4% at $3.95M exceeds the 15% hurdle rate.',
      evidence: [
        'Listed at $4.1M — 22% below Q1 2026 comp sales ($5.25M avg)',
        'Cap rate: 9.2% at ask (portfolio target: 7.5%) — room for compression',
        '71% occupancy — lease-up to 85% adds $380K additional NOI annually',
        'Owner motivation: failed refinancing at 6.8% — must close by Q2',
        'Competing buyer identified — LOI submitted first gets exclusivity',
      ],
      confidenceScore: 0.89,
      suggestedAction:
        '1. Submit LOI at $3.95M with 10-day due diligence period\n2. Engage Meridian Brokerage — contact: James Holt\n3. Order Phase I environmental and structural report\n4. Model lease-up assumptions with market rent comps\n5. Reserve $450K capital for CapEx — HVAC and lobby refresh',
      impactEstimate:
        'Projected 3-year IRR: 18.4%. Stabilized value at 7.5% cap: $5.2M. Equity gain: ~$1.25M on $3.95M basis.',
    },
  },
];

export interface DemoModeState {
  active: boolean;
  currentScenario: DemoScenarioKey;
  phase: PrismPhase;
  signals: LiveSignal[];
  workflowRun: LiveWorkflowRun | null;
  recommendation: LiveRecommendation | null;
  signalCount: number;
  elapsedMs: number;
  running: boolean;
}

interface DemoModeContext {
  state: DemoModeState;
  activate: (scenario?: DemoScenarioKey) => void;
  deactivate: () => void;
  reset: () => void;
  selectScenario: (key: DemoScenarioKey) => void;
  approveRecommendation: () => void;
  rejectRecommendation: () => void;
}

const Ctx = createContext<DemoModeContext | null>(null);

export function useDemoMode(): DemoModeContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDemoMode must be used within DemoModeProvider');
  return ctx;
}

const PHASE_ORDER: PrismPhase[] = ['detect', 'interpret', 'decide', 'execute', 'verify'];
const PHASE_DURATIONS_MS: Record<PrismPhase, number> = {
  detect: 3000,
  interpret: 4500,
  decide: 5000,
  execute: 4000,
  verify: 3500,
};

function buildWorkflowRun(scenario: DemoScenario, signalId: string): LiveWorkflowRun {
  return {
    id: `WRUN-${scenario.key.toUpperCase()}-${Date.now()}`,
    signalId,
    domain: scenario.key,
    name: scenario.workflowName,
    phase: 'detect',
    steps: scenario.workflowSteps.map((s) => ({ ...s, status: 'pending' as const })),
    startedAt: new Date().toISOString(),
  };
}

function buildRecommendation(scenario: DemoScenario, signalId: string): LiveRecommendation {
  const { signalId: _placeholder, ...rest } = scenario.recommendation;
  return {
    ...rest,
    id: `REC-${scenario.key.toUpperCase()}-${Date.now()}`,
    signalId,
    approvalState: 'pending',
  };
}

const INITIAL_STATE: DemoModeState = {
  active: false,
  currentScenario: 'aegis',
  phase: 'detect',
  signals: [],
  workflowRun: null,
  recommendation: null,
  signalCount: 0,
  elapsedMs: 0,
  running: false,
};

export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoModeState>(INITIAL_STATE);
  const timerSetRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionTokenRef = useRef<number>(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  const addTimer = useCallback((fn: () => void, delay: number): ReturnType<typeof setTimeout> => {
    const id = setTimeout(() => {
      timerSetRef.current.delete(id);
      fn();
    }, delay);
    timerSetRef.current.add(id);
    return id;
  }, []);

  const clearAllTimers = useCallback(() => {
    timerSetRef.current.forEach((id) => clearTimeout(id));
    timerSetRef.current.clear();
    if (elapsedRef.current) {
      clearInterval(elapsedRef.current);
      elapsedRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearAllTimers();
    sessionTokenRef.current += 1;
    setState(INITIAL_STATE);
  }, [clearAllTimers]);

  const runPhaseSequence = useCallback(
    (
      scenario: DemoScenario,
      phaseIndex: number,
      wfRun: LiveWorkflowRun,
      rec: LiveRecommendation,
      sessionToken: number,
    ) => {
      const phase = PHASE_ORDER[phaseIndex];
      if (!phase) return;

      setState((prev) => {
        if (sessionTokenRef.current !== sessionToken) return prev;
        const newSteps =
          prev.workflowRun?.steps.map(
            (s, i) =>
              ({
                ...s,
                status: i < phaseIndex ? 'done' : i === phaseIndex ? 'running' : 'pending',
              }) as WorkflowStep,
          ) ?? wfRun.steps;

        return {
          ...prev,
          phase,
          running: true,
          workflowRun: prev.workflowRun
            ? { ...prev.workflowRun, phase, steps: newSteps }
            : { ...wfRun, phase, steps: newSteps },
          recommendation:
            phase === 'decide' ? { ...rec, approvalState: 'pending' } : prev.recommendation,
        };
      });

      const duration = PHASE_DURATIONS_MS[phase];

      addTimer(() => {
        if (sessionTokenRef.current !== sessionToken || !stateRef.current.active) return;

        setState((prev) => {
          if (sessionTokenRef.current !== sessionToken) return prev;
          const completedSteps =
            prev.workflowRun?.steps.map(
              (s, i) =>
                ({
                  ...s,
                  status: i <= phaseIndex ? 'done' : 'pending',
                  durationMs:
                    i <= phaseIndex ? duration + Math.floor(Math.random() * 800) : undefined,
                }) as WorkflowStep,
            ) ?? [];

          const isLast = phaseIndex === PHASE_ORDER.length - 1;
          return {
            ...prev,
            running: !isLast,
            workflowRun: prev.workflowRun
              ? {
                  ...prev.workflowRun,
                  steps: completedSteps,
                  completedAt: isLast ? new Date().toISOString() : undefined,
                }
              : null,
          };
        });

        if (phase === 'execute') {
          const curRec = stateRef.current.recommendation;
          if (curRec && curRec.approvalState === 'approved') {
            setState((prev) => {
              if (sessionTokenRef.current !== sessionToken) return prev;
              return {
                ...prev,
                recommendation: prev.recommendation
                  ? {
                      ...prev.recommendation,
                      approvalState: 'executing',
                      executionLog: ['Initiating execution...'],
                    }
                  : null,
              };
            });

            const logItems = [
              'Step 1: Authenticating with target systems...',
              'Step 2: Applying recommended action...',
              'Step 3: Validating execution result...',
              'Step 4: Writing audit trail...',
              'Execution complete — result verified',
            ];
            logItems.forEach((log, i) => {
              addTimer(
                () => {
                  if (sessionTokenRef.current !== sessionToken) return;
                  setState((prev) => {
                    if (sessionTokenRef.current !== sessionToken) return prev;
                    return {
                      ...prev,
                      recommendation: prev.recommendation
                        ? {
                            ...prev.recommendation,
                            executionLog: [...(prev.recommendation.executionLog ?? []), log],
                          }
                        : null,
                    };
                  });
                },
                700 * (i + 1),
              );
            });

            addTimer(
              () => {
                if (sessionTokenRef.current !== sessionToken) return;
                setState((prev) => {
                  if (sessionTokenRef.current !== sessionToken) return prev;
                  return {
                    ...prev,
                    recommendation: prev.recommendation
                      ? {
                          ...prev.recommendation,
                          approvalState: 'done',
                        }
                      : null,
                  };
                });
                runPhaseSequence(scenario, phaseIndex + 1, wfRun, rec, sessionToken);
              },
              700 * (logItems.length + 2),
            );
            return;
          }
        }

        if (phaseIndex < PHASE_ORDER.length - 1 && phase !== 'decide') {
          runPhaseSequence(scenario, phaseIndex + 1, wfRun, rec, sessionToken);
        }
      }, duration);
    },
    [addTimer],
  );

  const activate = useCallback(
    (scenarioKey: DemoScenarioKey = 'aegis') => {
      clearAllTimers();
      sessionTokenRef.current += 1;
      const sessionToken = sessionTokenRef.current;
      const scenario = DEMO_SCENARIOS.find((s) => s.key === scenarioKey) ?? DEMO_SCENARIOS[0];

      const now = new Date().toISOString();
      const firstSignal: LiveSignal = {
        ...scenario.signals[0],
        detectedAt: now,
        phase: 'detect',
      };

      const wfRun = buildWorkflowRun(scenario, firstSignal.id);
      const rec = buildRecommendation(scenario, firstSignal.id);

      setState({
        active: true,
        currentScenario: scenarioKey,
        phase: 'detect',
        signals: [firstSignal],
        workflowRun: wfRun,
        recommendation: null,
        signalCount: 1,
        elapsedMs: 0,
        running: true,
      });

      elapsedRef.current = setInterval(() => {
        if (sessionTokenRef.current !== sessionToken) return;
        setState((prev) => {
          if (sessionTokenRef.current !== sessionToken) return prev;
          return { ...prev, elapsedMs: prev.elapsedMs + 100 };
        });
      }, 100);

      if (scenario.signals[1]) {
        addTimer(() => {
          if (sessionTokenRef.current !== sessionToken) return;
          setState((prev) => {
            if (sessionTokenRef.current !== sessionToken) return prev;
            return {
              ...prev,
              signals: [
                ...prev.signals,
                {
                  ...scenario.signals[1],
                  detectedAt: new Date().toISOString(),
                  phase: 'detect' as PrismPhase,
                },
              ],
              signalCount: prev.signalCount + 1,
            };
          });
        }, 4000);
      }

      runPhaseSequence(scenario, 0, wfRun, rec, sessionToken);
    },
    [clearAllTimers, addTimer, runPhaseSequence],
  );

  const deactivate = useCallback(() => {
    clearAllTimers();
    sessionTokenRef.current += 1;
    setState(INITIAL_STATE);
  }, [clearAllTimers]);

  const selectScenario = useCallback((key: DemoScenarioKey) => {
    setState((prev) => ({ ...prev, currentScenario: key }));
  }, []);

  const approveRecommendation = useCallback(() => {
    const sessionToken = sessionTokenRef.current;
    setState((prev) => {
      if (sessionTokenRef.current !== sessionToken) return prev;
      return {
        ...prev,
        recommendation: prev.recommendation
          ? { ...prev.recommendation, approvalState: 'approved' }
          : null,
      };
    });

    const scenario =
      DEMO_SCENARIOS.find((s) => s.key === stateRef.current.currentScenario) ?? DEMO_SCENARIOS[0];
    const phaseIndex = PHASE_ORDER.indexOf('execute');
    const wfRun = stateRef.current.workflowRun ?? buildWorkflowRun(scenario, '');
    const rec = stateRef.current.recommendation ?? buildRecommendation(scenario, '');

    addTimer(() => {
      if (sessionTokenRef.current !== sessionToken) return;
      runPhaseSequence(scenario, phaseIndex, wfRun, rec, sessionToken);
    }, 800);
  }, [addTimer, runPhaseSequence]);

  const rejectRecommendation = useCallback(() => {
    clearAllTimers();
    sessionTokenRef.current += 1;
    setState((prev) => ({
      ...prev,
      recommendation: prev.recommendation
        ? { ...prev.recommendation, approvalState: 'rejected' }
        : null,
      running: false,
      workflowRun: prev.workflowRun
        ? {
            ...prev.workflowRun,
            steps: prev.workflowRun.steps.map((s) => ({
              ...s,
              status: s.status === 'running' ? 'failed' : s.status,
            })),
            completedAt: new Date().toISOString(),
          }
        : null,
    }));
  }, [clearAllTimers]);

  useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  return (
    <Ctx.Provider
      value={{
        state,
        activate,
        deactivate,
        reset,
        selectScenario,
        approveRecommendation,
        rejectRecommendation,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
