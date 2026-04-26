/**
 * Stress Drill — Adversarial red-team & crisis stress-drill suite
 *
 * Three starter scenarios: Ransomware-CFO, Sanctions-Sweep, Hurricane-Default
 * Runs in an isolated tenant — production records are never touched.
 */

import { EcosystemNav } from '@szl-holdings/shared-ui/ecosystem-nav';
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiUrl, fetchJson } from './cognitive/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CrisisInject {
  id: string;
  t: number;
  domain: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedResponse: string;
  runbookRef?: string;
  requiresHumanApproval: boolean;
}

interface CrisisScenario {
  id: string;
  name: string;
  tagline: string;
  archetype: string;
  icon: string;
  accentColor: string;
  durationHours: number;
  summary: string;
  domains: string[];
  injectCount: number;
  injects: CrisisInject[];
}

interface TeamResponse {
  id: string;
  injectId: string;
  respondedAt: string;
  responseType: 'detected' | 'contained' | 'resolved' | 'escalated' | 'missed';
  notes: string;
  humanApprovalGiven: boolean;
  respondedByLabel: string;
}

interface InjectStatus {
  inject: CrisisInject;
  firedAt: string | null;
  response: TeamResponse | null;
}

interface DomainScoreEntry {
  domain: string;
  injectCount: number;
  detected: number;
  resolved: number;
}

interface DrillScore {
  totalInjects: number;
  detected: number;
  contained: number;
  resolved: number;
  missed: number;
  humanApprovalsRequired: number;
  humanApprovalsGiven: number;
  avgDetectMinutes: number | null;
  avgResolveMinutes: number | null;
  missedSteps: string[];
  domainBreakdown: DomainScoreEntry[];
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  verdict: string;
  recommendations: string[];
  completedAt: string;
}

interface DrillRun {
  id: string;
  tenantId: string;
  scenarioId: string;
  status: 'ready' | 'running' | 'paused' | 'completed' | 'aborted';
  operatorLabel: string;
  startedAt: string | null;
  completedAt: string | null;
  currentInjectIndex: number;
  injectStatuses: InjectStatus[];
  score: DrillScore | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#64748b',
};

const RESPONSE_COLORS: Record<string, string> = {
  resolved: '#22c55e',
  contained: '#84cc16',
  detected: '#38bdf8',
  escalated: '#f59e0b',
  missed: '#ef4444',
};

const DOMAIN_ICONS: Record<string, string> = {
  sentra: '🛡',
  aegis: '⚔',
  counsel: '⚖',
  terra: '⬢',
  vessels: '⚓',
  holdings: '◆',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function GradeBadge({ grade, score }: { grade: DrillScore['grade']; score: number }) {
  const color =
    grade === 'A' ? '#22c55e' :
    grade === 'B' ? '#84cc16' :
    grade === 'C' ? '#f59e0b' :
    grade === 'D' ? '#f97316' : '#ef4444';

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: `2px solid ${color}`,
        borderRadius: 10,
        padding: '12px 24px',
        background: `${color}10`,
        minWidth: 80,
      }}
    >
      <span style={{ fontSize: 40, fontWeight: 900, color, lineHeight: 1 }}>{grade}</span>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color, marginTop: 4 }}>{score}/100</span>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const color = SEVERITY_COLORS[severity] ?? '#64748b';
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 1,
        color,
        background: `${color}18`,
        borderRadius: 3,
        padding: '2px 7px',
        border: `1px solid ${color}40`,
        whiteSpace: 'nowrap',
      }}
    >
      {severity.toUpperCase()}
    </span>
  );
}

function ResponseBadge({ type }: { type: string }) {
  const color = RESPONSE_COLORS[type] ?? '#64748b';
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 1,
        color,
        background: `${color}18`,
        borderRadius: 3,
        padding: '2px 7px',
        border: `1px solid ${color}40`,
        whiteSpace: 'nowrap',
      }}
    >
      {type.toUpperCase()}
    </span>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div
      style={{
        background: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: 8,
        padding: '16px 20px',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: '#64748b',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color ?? '#e2e8f0' }}>{value}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StressDrillPage() {
  const [view, setView] = useState<'library' | 'active' | 'debrief'>('library');
  const [scenarios, setScenarios] = useState<CrisisScenario[]>([]);
  const [activeDrill, setActiveDrill] = useState<DrillRun | null>(null);
  const [drillHistory, setDrillHistory] = useState<DrillRun[]>([]);
  const [loadingScenarios, setLoadingScenarios] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Respond form state
  const [respondingInjectId, setRespondingInjectId] = useState<string | null>(null);
  const [responseType, setResponseType] = useState<TeamResponse['responseType']>('detected');
  const [responseNotes, setResponseNotes] = useState('');
  const [humanApproval, setHumanApproval] = useState(false);

  // Polling ref for active drill
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadScenarios = useCallback(async () => {
    try {
      setLoadingScenarios(true);
      const data = await fetchJson<{ scenarios: CrisisScenario[] }>(
        apiUrl('/stress-drill/scenarios'),
      );
      setScenarios(data.scenarios);
    } catch {
      setError('Failed to load scenarios');
    } finally {
      setLoadingScenarios(false);
    }
  }, []);

  const loadDrillHistory = useCallback(async () => {
    try {
      const data = await fetchJson<{ drills: DrillRun[] }>(apiUrl('/stress-drill/drills'));
      setDrillHistory(data.drills);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    void loadScenarios();
    void loadDrillHistory();
  }, [loadScenarios, loadDrillHistory]);

  // Poll active drill state
  useEffect(() => {
    if (activeDrill && activeDrill.status === 'running') {
      pollRef.current = setInterval(async () => {
        try {
          const updated = await fetchJson<DrillRun>(apiUrl(`/stress-drill/drills/${activeDrill.id}`));
          setActiveDrill(updated);
        } catch {
          // ignore
        }
      }, 5000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeDrill?.id, activeDrill?.status]);

  const startScenario = useCallback(
    async (scenarioId: string) => {
      setError(null);
      setLoadingAction(true);
      try {
        const created = await fetchJson<DrillRun>(apiUrl('/stress-drill/drills'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenarioId }),
        });
        const started = await fetchJson<DrillRun>(
          apiUrl(`/stress-drill/drills/${created.id}/start`),
          { method: 'POST' },
        );
        setActiveDrill(started);
        setView('active');
      } catch {
        setError('Failed to start drill');
      } finally {
        setLoadingAction(false);
      }
    },
    [],
  );

  const advanceDrill = useCallback(async () => {
    if (!activeDrill) return;
    setError(null);
    setLoadingAction(true);
    try {
      const result = await fetchJson<{ drill: DrillRun; nextInject: CrisisInject | null }>(
        apiUrl(`/stress-drill/drills/${activeDrill.id}/advance`),
        { method: 'POST' },
      );
      setActiveDrill(result.drill);
    } catch {
      setError('Failed to advance drill');
    } finally {
      setLoadingAction(false);
    }
  }, [activeDrill]);

  const submitResponse = useCallback(async () => {
    if (!activeDrill || !respondingInjectId) return;
    setError(null);
    setLoadingAction(true);
    try {
      const updated = await fetchJson<DrillRun>(
        apiUrl(`/stress-drill/drills/${activeDrill.id}/respond`),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            injectId: respondingInjectId,
            responseType,
            notes: responseNotes,
            humanApprovalGiven: humanApproval,
          }),
        },
      );
      setActiveDrill(updated);
      setRespondingInjectId(null);
      setResponseNotes('');
      setHumanApproval(false);
      setResponseType('detected');
    } catch {
      setError('Failed to submit response');
    } finally {
      setLoadingAction(false);
    }
  }, [activeDrill, respondingInjectId, responseType, responseNotes, humanApproval]);

  const completeDrill = useCallback(async () => {
    if (!activeDrill) return;
    setLoadingAction(true);
    try {
      const completed = await fetchJson<DrillRun>(
        apiUrl(`/stress-drill/drills/${activeDrill.id}/complete`),
        { method: 'POST' },
      );
      setActiveDrill(completed);
      setView('debrief');
      void loadDrillHistory();
    } catch {
      setError('Failed to complete drill');
    } finally {
      setLoadingAction(false);
    }
  }, [activeDrill, loadDrillHistory]);

  const abortDrill = useCallback(async () => {
    if (!activeDrill) return;
    setLoadingAction(true);
    try {
      await fetchJson<DrillRun>(apiUrl(`/stress-drill/drills/${activeDrill.id}/abort`), {
        method: 'POST',
      });
      setActiveDrill(null);
      setView('library');
      void loadDrillHistory();
    } catch {
      setError('Failed to abort drill');
    } finally {
      setLoadingAction(false);
    }
  }, [activeDrill, loadDrillHistory]);

  const viewDebrief = useCallback((drill: DrillRun) => {
    setActiveDrill(drill);
    setView('debrief');
  }, []);

  const openPdfDebrief = useCallback(() => {
    if (!activeDrill) return;
    window.open(apiUrl(`/stress-drill/drills/${activeDrill.id}/debrief/pdf`), '_blank');
  }, [activeDrill]);

  // ─── Scenario Library View ───────────────────────────────────────────────────

  const scenarioFromId = (id: string) => scenarios.find((s) => s.id === id);

  if (view === 'library') {
    return (
      <div style={{ minHeight: '100vh', background: '#060c1a', color: '#e2e8f0' }}>
        <EcosystemNav currentAppId="command" currentAppName="Unified Command" />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: '#ef4444',
                marginBottom: 8,
              }}
            >
              RED-TEAM · CRISIS STRESS DRILL
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
              Crisis Stress-Drill Suite
            </h1>
            <p style={{ color: '#94a3b8', maxWidth: 640, lineHeight: 1.6 }}>
              Run cross-domain crisis drills in an isolated tenant. The simulator fires realistic
              injects into the alert bus and scores how the platform, runbooks, and team respond.
              Production records are never touched.
            </p>
          </div>

          {error && (
            <div
              style={{
                background: '#ef444418',
                border: '1px solid #ef4444',
                borderRadius: 8,
                padding: '12px 16px',
                color: '#ef4444',
                marginBottom: 24,
              }}
            >
              {error}
            </div>
          )}

          {/* History strip */}
          {drillHistory.filter((d) => d.status === 'completed').length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: '#64748b',
                  marginBottom: 12,
                }}
              >
                Recent Completed Drills
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {drillHistory
                  .filter((d) => d.status === 'completed')
                  .slice(0, 5)
                  .map((drill) => {
                    const sc = scenarioFromId(drill.scenarioId);
                    const gradeColor =
                      drill.score?.grade === 'A' ? '#22c55e' :
                      drill.score?.grade === 'B' ? '#84cc16' :
                      drill.score?.grade === 'C' ? '#f59e0b' :
                      drill.score?.grade === 'D' ? '#f97316' : '#ef4444';
                    return (
                      <button
                        key={drill.id}
                        onClick={() => viewDebrief(drill)}
                        style={{
                          background: '#0f172a',
                          border: `1px solid ${gradeColor}40`,
                          borderRadius: 8,
                          padding: '10px 16px',
                          cursor: 'pointer',
                          color: '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <span style={{ fontSize: 18 }}>{sc?.icon ?? '◆'}</span>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{sc?.name ?? drill.scenarioId}</span>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color: gradeColor,
                            marginLeft: 4,
                          }}
                        >
                          {drill.score?.grade ?? '—'}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Scenario cards */}
          {loadingScenarios ? (
            <div style={{ color: '#64748b', padding: 40, textAlign: 'center' }}>
              Loading scenarios…
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: 24,
              }}
            >
              {scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  style={{
                    background: '#0a0f1e',
                    border: `1px solid ${scenario.accentColor}30`,
                    borderRadius: 12,
                    padding: 28,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <span style={{ fontSize: 36 }}>{scenario.icon}</span>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
                        {scenario.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
                        {scenario.tagline}
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65, flex: 1 }}>
                    {scenario.summary}
                  </p>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {scenario.domains.map((d) => (
                      <span
                        key={d}
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: 1,
                          color: '#94a3b8',
                          background: '#1e293b',
                          borderRadius: 4,
                          padding: '2px 8px',
                        }}
                      >
                        {DOMAIN_ICONS[d] ?? '◆'} {d.toUpperCase()}
                      </span>
                    ))}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid #1e293b',
                      paddingTop: 16,
                    }}
                  >
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      <span style={{ color: '#94a3b8', fontWeight: 600 }}>
                        {scenario.injectCount} injects
                      </span>{' '}
                      · {scenario.durationHours}h simulated window
                    </div>
                    <button
                      disabled={loadingAction}
                      onClick={() => startScenario(scenario.id)}
                      style={{
                        background: scenario.accentColor,
                        border: 'none',
                        borderRadius: 6,
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 700,
                        padding: '8px 20px',
                        cursor: loadingAction ? 'not-allowed' : 'pointer',
                        opacity: loadingAction ? 0.5 : 1,
                      }}
                    >
                      {loadingAction ? 'Starting…' : 'Launch Drill'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Active Drill View ───────────────────────────────────────────────────────

  if (view === 'active' && activeDrill) {
    const scenario = scenarioFromId(activeDrill.scenarioId);
    const firedInjects = activeDrill.injectStatuses.filter((s) => s.firedAt !== null);
    const currentInject = firedInjects[firedInjects.length - 1];
    const totalInjects = activeDrill.injectStatuses.length;
    const hasMoreInjects = activeDrill.currentInjectIndex < totalInjects - 1;
    const allFiredResponded = firedInjects.every((s) => s.response !== null);
    const respondingInject = respondingInjectId
      ? firedInjects.find((s) => s.inject.id === respondingInjectId)
      : null;

    return (
      <div style={{ minHeight: '100vh', background: '#060c1a', color: '#e2e8f0' }}>
        <EcosystemNav currentAppId="command" currentAppName="Unified Command" />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 28,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: '#ef4444',
                  marginBottom: 6,
                }}
              >
                DRILL ACTIVE — {activeDrill.status.toUpperCase()}
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
                {scenario?.icon ?? '◆'} {scenario?.name ?? activeDrill.scenarioId}
              </h1>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                ID: {activeDrill.id} · Operator: {activeDrill.operatorLabel}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {hasMoreInjects && allFiredResponded && (
                <button
                  disabled={loadingAction}
                  onClick={advanceDrill}
                  style={{
                    background: '#1e40af',
                    border: 'none',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    padding: '8px 18px',
                    cursor: 'pointer',
                  }}
                >
                  Fire Next Inject →
                </button>
              )}
              <button
                disabled={loadingAction}
                onClick={completeDrill}
                style={{
                  background: '#22c55e',
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  padding: '8px 18px',
                  cursor: 'pointer',
                }}
              >
                Complete &amp; Score
              </button>
              <button
                disabled={loadingAction}
                onClick={abortDrill}
                style={{
                  background: 'transparent',
                  border: '1px solid #ef4444',
                  borderRadius: 6,
                  color: '#ef4444',
                  fontSize: 13,
                  fontWeight: 700,
                  padding: '8px 18px',
                  cursor: 'pointer',
                }}
              >
                Abort
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                background: '#ef444418',
                border: '1px solid #ef4444',
                borderRadius: 8,
                padding: '12px 16px',
                color: '#ef4444',
                marginBottom: 24,
              }}
            >
              {error}
            </div>
          )}

          {/* Progress */}
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: 8,
              padding: '14px 20px',
              marginBottom: 28,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1,
                  color: '#64748b',
                  marginBottom: 6,
                }}
              >
                INJECT PROGRESS
              </div>
              <div
                style={{
                  height: 6,
                  background: '#1e293b',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${((activeDrill.currentInjectIndex + 1) / totalInjects) * 100}%`,
                    background: scenario?.accentColor ?? '#ef4444',
                    borderRadius: 3,
                    transition: 'width 0.4s',
                  }}
                />
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap' }}>
              {activeDrill.currentInjectIndex + 1} / {totalInjects} injects fired
            </div>
          </div>

          {/* Two-column layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 24 }}>
            {/* Inject timeline */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: '#64748b',
                  marginBottom: 14,
                }}
              >
                Inject Timeline
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeDrill.injectStatuses.map((s, idx) => {
                  const isFired = s.firedAt !== null;
                  const isResponded = s.response !== null;
                  const isCurrent = idx === activeDrill.currentInjectIndex && isFired;

                  return (
                    <div
                      key={s.inject.id}
                      style={{
                        background: isFired ? '#0f172a' : '#0a0f1e',
                        border: `1px solid ${isCurrent ? (scenario?.accentColor ?? '#ef4444') : '#1e293b'}`,
                        borderRadius: 8,
                        padding: '16px 18px',
                        opacity: isFired ? 1 : 0.4,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 16 }}>{DOMAIN_ICONS[s.inject.domain] ?? '◆'}</span>
                          <SeverityBadge severity={s.inject.severity} />
                          <span
                            style={{
                              fontSize: 11,
                              color: '#64748b',
                              background: '#1e293b',
                              borderRadius: 4,
                              padding: '2px 7px',
                              fontWeight: 600,
                            }}
                          >
                            T+{s.inject.t}m
                          </span>
                        </div>
                        {isResponded && s.response && (
                          <ResponseBadge type={s.response.responseType} />
                        )}
                        {isFired && !isResponded && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              letterSpacing: 1,
                              color: '#f59e0b',
                              background: '#f59e0b18',
                              borderRadius: 3,
                              padding: '2px 7px',
                              border: '1px solid #f59e0b40',
                            }}
                          >
                            AWAITING RESPONSE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
                        {s.inject.title}
                      </div>
                      {isFired && (
                        <div
                          style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, marginBottom: 10 }}
                        >
                          {s.inject.description}
                        </div>
                      )}
                      {isFired && s.inject.runbookRef && (
                        <div
                          style={{
                            fontSize: 11,
                            color: '#a78bfa',
                            marginBottom: 10,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <span>📋</span>
                          <span>Runbook: {s.inject.runbookRef}</span>
                        </div>
                      )}
                      {isFired && !isResponded && (
                        <button
                          onClick={() => {
                            setRespondingInjectId(s.inject.id);
                            setResponseType('detected');
                            setResponseNotes('');
                            setHumanApproval(false);
                          }}
                          style={{
                            background: scenario?.accentColor ?? '#ef4444',
                            border: 'none',
                            borderRadius: 5,
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 700,
                            padding: '6px 14px',
                            cursor: 'pointer',
                          }}
                        >
                          Log Response
                        </button>
                      )}
                      {isResponded && s.response && (
                        <div
                          style={{
                            borderTop: '1px solid #1e293b',
                            paddingTop: 8,
                            marginTop: 4,
                            fontSize: 12,
                            color: '#64748b',
                          }}
                        >
                          <span style={{ color: '#94a3b8' }}>Response by: </span>
                          {s.response.respondedByLabel}
                          {s.response.notes && (
                            <div style={{ marginTop: 4, color: '#94a3b8', fontStyle: 'italic' }}>
                              "{s.response.notes}"
                            </div>
                          )}
                          {s.inject.requiresHumanApproval && (
                            <div
                              style={{
                                marginTop: 4,
                                color: s.response.humanApprovalGiven ? '#22c55e' : '#ef4444',
                              }}
                            >
                              Human approval: {s.response.humanApprovalGiven ? 'GIVEN ✓' : 'NOT GIVEN ✗'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right panel */}
            <div>
              {/* Response form */}
              {respondingInject && (
                <div
                  style={{
                    background: '#0f172a',
                    border: `1px solid ${scenario?.accentColor ?? '#ef4444'}60`,
                    borderRadius: 10,
                    padding: 20,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      color: '#94a3b8',
                      marginBottom: 14,
                    }}
                  >
                    Log Response — {respondingInject.inject.title}
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#64748b',
                        display: 'block',
                        marginBottom: 6,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                      }}
                    >
                      Response Type
                    </label>
                    {(
                      ['detected', 'contained', 'resolved', 'escalated', 'missed'] as const
                    ).map((type) => (
                      <label
                        key={type}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 6,
                          cursor: 'pointer',
                          fontSize: 13,
                          color: responseType === type ? RESPONSE_COLORS[type] : '#94a3b8',
                        }}
                      >
                        <input
                          type="radio"
                          name="responseType"
                          value={type}
                          checked={responseType === type}
                          onChange={() => setResponseType(type)}
                        />
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </label>
                    ))}
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#64748b',
                        display: 'block',
                        marginBottom: 6,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                      }}
                    >
                      Notes
                    </label>
                    <textarea
                      value={responseNotes}
                      onChange={(e) => setResponseNotes(e.target.value)}
                      rows={3}
                      placeholder="What did the team do? What runbook steps were taken?"
                      style={{
                        width: '100%',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: 6,
                        color: '#e2e8f0',
                        fontSize: 13,
                        padding: '8px 12px',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>

                  {respondingInject.inject.requiresHumanApproval && (
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 14,
                        cursor: 'pointer',
                        fontSize: 13,
                        color: '#94a3b8',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={humanApproval}
                        onChange={(e) => setHumanApproval(e.target.checked)}
                      />
                      <span>
                        Human approval gate satisfied{' '}
                        <span style={{ color: '#f59e0b' }}>(required for scoring)</span>
                      </span>
                    </label>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      disabled={loadingAction}
                      onClick={submitResponse}
                      style={{
                        background: '#22c55e',
                        border: 'none',
                        borderRadius: 6,
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 700,
                        padding: '8px 16px',
                        cursor: 'pointer',
                        flex: 1,
                      }}
                    >
                      Submit
                    </button>
                    <button
                      onClick={() => setRespondingInjectId(null)}
                      style={{
                        background: 'transparent',
                        border: '1px solid #334155',
                        borderRadius: 6,
                        color: '#94a3b8',
                        fontSize: 13,
                        fontWeight: 700,
                        padding: '8px 12px',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Current inject explainer */}
              {!respondingInjectId && currentInject && (
                <div
                  style={{
                    background: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: 10,
                    padding: 20,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      color: '#64748b',
                      marginBottom: 10,
                    }}
                  >
                    Expected Response
                  </div>
                  <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.65 }}>
                    {currentInject.inject.expectedResponse}
                  </div>
                </div>
              )}

              {/* Scenario overview */}
              <div
                style={{
                  background: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: 10,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    color: '#64748b',
                    marginBottom: 10,
                  }}
                >
                  Scenario Brief
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.65 }}>
                  {scenario?.summary}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Debrief View ────────────────────────────────────────────────────────────

  if (view === 'debrief' && activeDrill?.score) {
    const score = activeDrill.score;
    const scenario = scenarioFromId(activeDrill.scenarioId);
    const gradeColor =
      score.grade === 'A' ? '#22c55e' :
      score.grade === 'B' ? '#84cc16' :
      score.grade === 'C' ? '#f59e0b' :
      score.grade === 'D' ? '#f97316' : '#ef4444';

    return (
      <div style={{ minHeight: '100vh', background: '#060c1a', color: '#e2e8f0' }}>
        <EcosystemNav currentAppId="command" currentAppName="Unified Command" />
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 32,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: '#22c55e',
                  marginBottom: 6,
                }}
              >
                DRILL COMPLETE — DEBRIEF
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
                {scenario?.icon ?? '◆'} {scenario?.name ?? activeDrill.scenarioId}
              </h1>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Operator: {activeDrill.operatorLabel} · Completed:{' '}
                {new Date(score.completedAt).toLocaleString()}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <GradeBadge grade={score.grade} score={score.overallScore} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={openPdfDebrief}
                  style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 6,
                    color: '#e2e8f0',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '8px 16px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Export PDF ↗
                </button>
                <button
                  onClick={() => setView('library')}
                  style={{
                    background: 'transparent',
                    border: '1px solid #1e293b',
                    borderRadius: 6,
                    color: '#64748b',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '8px 16px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ← Scenario Library
                </button>
              </div>
            </div>
          </div>

          {/* Verdict */}
          <div
            style={{
              background: `${gradeColor}10`,
              border: `1px solid ${gradeColor}40`,
              borderRadius: 8,
              padding: '14px 20px',
              marginBottom: 28,
              fontSize: 14,
              color: '#cbd5e1',
              lineHeight: 1.7,
            }}
          >
            {score.verdict}
          </div>

          {/* Stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 14,
              marginBottom: 32,
            }}
          >
            <StatCard label="Injects Fired" value={score.totalInjects} />
            <StatCard label="Detected" value={score.detected} color="#22c55e" />
            <StatCard label="Resolved" value={score.resolved} color="#a78bfa" />
            <StatCard label="Missed" value={score.missed} color="#ef4444" />
            <StatCard
              label="Avg. Time-to-Detect"
              value={score.avgDetectMinutes != null ? `${score.avgDetectMinutes}m` : '—'}
              color="#f59e0b"
            />
            <StatCard
              label="Avg. Time-to-Resolve"
              value={score.avgResolveMinutes != null ? `${score.avgResolveMinutes}m` : '—'}
              color="#c084fc"
            />
            <StatCard
              label="Human Approvals"
              value={`${score.humanApprovalsGiven}/${score.humanApprovalsRequired}`}
              color="#38bdf8"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
            {/* Inject timeline */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: '#64748b',
                  marginBottom: 14,
                }}
              >
                Inject Timeline
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {activeDrill.injectStatuses
                  .filter((s) => s.firedAt !== null)
                  .map((s) => {
                    const resp = s.response;
                    return (
                      <div
                        key={s.inject.id}
                        style={{
                          background: '#0f172a',
                          border: '1px solid #1e293b',
                          borderRadius: 8,
                          padding: '14px 18px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 6,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>{DOMAIN_ICONS[s.inject.domain] ?? '◆'}</span>
                            <SeverityBadge severity={s.inject.severity} />
                            <span
                              style={{ fontSize: 11, color: '#64748b', background: '#1e293b', borderRadius: 4, padding: '2px 7px', fontWeight: 600 }}
                            >
                              T+{s.inject.t}m
                            </span>
                          </div>
                          {resp ? (
                            <ResponseBadge type={resp.responseType} />
                          ) : (
                            <ResponseBadge type="missed" />
                          )}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                          {s.inject.title}
                        </div>
                        {resp?.notes && (
                          <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                            "{resp.notes}"
                          </div>
                        )}
                        {s.inject.requiresHumanApproval && (
                          <div
                            style={{
                              fontSize: 11,
                              color: resp?.humanApprovalGiven ? '#22c55e' : '#ef4444',
                              marginTop: 4,
                            }}
                          >
                            Human approval: {resp?.humanApprovalGiven ? 'Given ✓' : 'Not given ✗'}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Right panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Domain breakdown */}
              <div
                style={{
                  background: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: 10,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    color: '#64748b',
                    padding: '12px 16px',
                    borderBottom: '1px solid #1e293b',
                  }}
                >
                  Domain Breakdown
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Domain', 'Injects', 'Detected', 'Resolved'].map((h) => (
                        <th
                          key={h}
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: 1,
                            textTransform: 'uppercase',
                            color: '#64748b',
                            padding: '8px 12px',
                            textAlign: 'left',
                            background: '#1e293b',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {score.domainBreakdown.map((d) => (
                      <tr key={d.domain} style={{ borderTop: '1px solid #1e293b' }}>
                        <td style={{ padding: '8px 12px', fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                          {DOMAIN_ICONS[d.domain] ?? '◆'} {d.domain.toUpperCase()}
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: 13, color: '#e2e8f0', textAlign: 'center' }}>{d.injectCount}</td>
                        <td style={{ padding: '8px 12px', fontSize: 13, color: '#22c55e', textAlign: 'center' }}>{d.detected}</td>
                        <td style={{ padding: '8px 12px', fontSize: 13, color: '#a78bfa', textAlign: 'center' }}>{d.resolved}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Missed steps */}
              {score.missedSteps.length > 0 && (
                <div
                  style={{
                    background: '#0f172a',
                    border: '1px solid #ef444440',
                    borderRadius: 10,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      color: '#ef4444',
                      marginBottom: 10,
                    }}
                  >
                    Missed Steps ({score.missedSteps.length})
                  </div>
                  {score.missedSteps.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: 12,
                        color: '#f87171',
                        marginBottom: 6,
                        display: 'flex',
                        gap: 6,
                      }}
                    >
                      <span>✗</span>
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              <div
                style={{
                  background: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    color: '#64748b',
                    marginBottom: 10,
                  }}
                >
                  Recommendations
                </div>
                {score.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 13,
                      color: '#cbd5e1',
                      marginBottom: 10,
                      lineHeight: 1.6,
                      paddingLeft: 14,
                      borderLeft: '2px solid #334155',
                    }}
                  >
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#060c1a', color: '#e2e8f0' }}>
      <EcosystemNav currentAppId="command" currentAppName="Unified Command" />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 48, textAlign: 'center', color: '#64748b' }}>
        Loading…
      </div>
    </div>
  );
}
