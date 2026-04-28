import { EcosystemNav } from '@szl-holdings/shared-ui/ecosystem-nav';
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiUrl, fetchJson } from './cognitive/shared';

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

interface DimensionScore {
  score: number;
  weight: number;
  label: string;
  detail: string;
}

interface ParticipantScore {
  label: string;
  responsesGiven: number;
  detectRate: number;
  resolveRate: number;
  avgResponseMinutes: number | null;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
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
  dimensions: {
    timeToDetect: DimensionScore;
    timeToRespond: DimensionScore;
    runbookAdherence: DimensionScore;
    businessImpactContainment: DimensionScore;
  };
  participantScores: ParticipantScore[];
  resilienceScore: number;
}

interface DrillRun {
  id: string;
  tenantId: string;
  scenarioId: string;
  status: 'ready' | 'running' | 'paused' | 'completed' | 'aborted';
  operatorLabel: string;
  participants: string[];
  startedAt: string | null;
  completedAt: string | null;
  currentInjectIndex: number;
  injectStatuses: InjectStatus[];
  score: DrillScore | null;
}

interface LeaderboardEntry {
  participantLabel: string;
  optedIn: boolean;
  totalDrills: number;
  avgResilienceScore: number;
  bestGrade: string;
  totalInjectsHandled: number;
  avgDetectMinutes: number | null;
  lastDrillAt: string | null;
}

interface ResilienceScorePoint {
  drillId: string;
  scenarioId: string;
  score: number;
  completedAt: string;
  grade: string;
  dimensions: {
    timeToDetect: number;
    timeToRespond: number;
    runbookAdherence: number;
    businessImpactContainment: number;
  };
}

type TabId = 'scenarios' | 'active' | 'debrief' | 'leaderboard' | 'resilience';

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#4a6070',
};

const RESPONSE_COLORS: Record<string, string> = {
  resolved: '#22c55e',
  contained: '#84cc16',
  detected: '#38bdf8',
  escalated: '#f59e0b',
  missed: '#ef4444',
};

const DOMAIN_ICONS: Record<string, string> = {
  sentra: '\uD83D\uDEE1',
  aegis: '\u2694',
  counsel: '\u2696',
  terra: '\u2B22',
  vessels: '\u2693',
  holdings: '\u25C6',
};

const GRADE_COLORS: Record<string, string> = {
  A: '#22c55e',
  B: '#84cc16',
  C: '#f59e0b',
  D: '#f97316',
  F: '#ef4444',
};

function gradeColor(g: string): string {
  return GRADE_COLORS[g] ?? 'var(--gi-text-muted)';
}

function dimScoreColor(s: number): string {
  return s >= 80 ? '#22c55e' : s >= 60 ? '#f59e0b' : '#ef4444';
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ background: 'var(--gi-bg-base)', border: '1px solid var(--gi-border-subtle)', borderRadius: 8, padding: '14px 18px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gi-text-muted)', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: color ?? 'var(--gi-text-primary)' }}>{value}</div>
    </div>
  );
}

function DimensionBar({ dim }: { dim: DimensionScore }) {
  const c = dimScoreColor(dim.score);
  return (
    <div style={{ background: 'var(--gi-bg-base)', border: '1px solid var(--gi-border-subtle)', borderRadius: 8, padding: '14px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>{dim.label}</span>
        <span style={{ fontSize: 20, fontWeight: 800, color: c }}>{dim.score}</span>
      </div>
      <div style={{ width: '100%', height: 6, background: 'var(--gi-border-subtle)', borderRadius: 3 }}>
        <div style={{ width: `${dim.score}%`, height: '100%', background: c, borderRadius: 3, transition: 'width 0.5s ease' }} />
      </div>
      <div style={{ fontSize: 10, color: 'var(--gi-text-muted)', marginTop: 4 }}>{dim.detail}</div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'var(--gi-border-subtle)' : 'transparent',
        border: active ? '1px solid #334155' : '1px solid transparent',
        borderRadius: 6,
        color: active ? 'var(--gi-text-primary)' : 'var(--gi-text-muted)',
        fontSize: 13,
        fontWeight: 700,
        padding: '8px 18px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      {children}
    </button>
  );
}

export default function GameDayPage() {
  const [tab, setTab] = useState<TabId>('scenarios');
  const [scenarios, setScenarios] = useState<CrisisScenario[]>([]);
  const [activeDrill, setActiveDrill] = useState<DrillRun | null>(null);
  const [drillHistory, setDrillHistory] = useState<DrillRun[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myOptIn, setMyOptIn] = useState<boolean>(false);
  const [resilienceHistory, setResilienceHistory] = useState<ResilienceScorePoint[]>([]);
  const [loadingScenarios, setLoadingScenarios] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [respondingInjectId, setRespondingInjectId] = useState<string | null>(null);
  const [responseType, setResponseType] = useState<TeamResponse['responseType']>('detected');
  const [responseNotes, setResponseNotes] = useState('');
  const [humanApproval, setHumanApproval] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadScenarios = useCallback(async () => {
    try {
      setLoadingScenarios(true);
      const data = await fetchJson<{ scenarios: CrisisScenario[] }>(apiUrl('/stress-drill/scenarios'));
      setScenarios(data.scenarios);
    } catch { setError('Failed to load scenarios'); } finally { setLoadingScenarios(false); }
  }, []);

  const loadDrillHistory = useCallback(async () => {
    try {
      const data = await fetchJson<{ drills: DrillRun[] }>(apiUrl('/stress-drill/drills'));
      setDrillHistory(data.drills);
    } catch { /* non-critical */ }
  }, []);

  const loadLeaderboard = useCallback(async () => {
    try {
      const data = await fetchJson<{ leaderboard: LeaderboardEntry[] }>(apiUrl('/stress-drill/leaderboard'));
      setLeaderboard(data.leaderboard);
    } catch { /* non-critical */ }
  }, []);

  const loadMyOptInStatus = useCallback(async () => {
    try {
      const data = await fetchJson<{ optedIn: boolean }>(apiUrl('/stress-drill/leaderboard/my-status'));
      setMyOptIn(data.optedIn);
    } catch { /* non-critical */ }
  }, []);

  const toggleOptIn = useCallback(async () => {
    try {
      const endpoint = myOptIn ? '/stress-drill/leaderboard/opt-out' : '/stress-drill/leaderboard/opt-in';
      await fetchJson(apiUrl(endpoint), { method: 'POST' });
      setMyOptIn(!myOptIn);
      void loadLeaderboard();
    } catch { /* non-critical */ }
  }, [myOptIn, loadLeaderboard]);

  const loadResilienceHistory = useCallback(async () => {
    try {
      const data = await fetchJson<{ history: ResilienceScorePoint[] }>(apiUrl('/stress-drill/resilience'));
      setResilienceHistory(data.history);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => {
    void loadScenarios();
    void loadDrillHistory();
    void loadLeaderboard();
    void loadMyOptInStatus();
    void loadResilienceHistory();
  }, [loadScenarios, loadDrillHistory, loadLeaderboard, loadMyOptInStatus, loadResilienceHistory]);

  useEffect(() => {
    if (activeDrill && activeDrill.status === 'running') {
      pollRef.current = setInterval(async () => {
        try {
          const updated = await fetchJson<DrillRun>(apiUrl(`/stress-drill/drills/${activeDrill.id}`));
          setActiveDrill(updated);
        } catch { /* ignore */ }
      }, 5000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeDrill?.id, activeDrill?.status]);

  const startScenario = useCallback(async (scenarioId: string) => {
    setError(null);
    setLoadingAction(true);
    try {
      const created = await fetchJson<DrillRun>(apiUrl('/stress-drill/drills'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId }),
      });
      const started = await fetchJson<DrillRun>(apiUrl(`/stress-drill/drills/${created.id}/start`), { method: 'POST' });
      setActiveDrill(started);
      setTab('active');
    } catch { setError('Failed to start drill'); } finally { setLoadingAction(false); }
  }, []);

  const advanceDrillAction = useCallback(async () => {
    if (!activeDrill) return;
    setError(null);
    setLoadingAction(true);
    try {
      const result = await fetchJson<{ drill: DrillRun }>(apiUrl(`/stress-drill/drills/${activeDrill.id}/advance`), { method: 'POST' });
      setActiveDrill(result.drill);
    } catch { setError('Failed to advance drill'); } finally { setLoadingAction(false); }
  }, [activeDrill]);

  const submitResponse = useCallback(async () => {
    if (!activeDrill || !respondingInjectId) return;
    setError(null);
    setLoadingAction(true);
    try {
      const updated = await fetchJson<DrillRun>(apiUrl(`/stress-drill/drills/${activeDrill.id}/respond`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ injectId: respondingInjectId, responseType, notes: responseNotes, humanApprovalGiven: humanApproval }),
      });
      setActiveDrill(updated);
      setRespondingInjectId(null);
      setResponseNotes('');
      setHumanApproval(false);
      setResponseType('detected');
    } catch { setError('Failed to submit response'); } finally { setLoadingAction(false); }
  }, [activeDrill, respondingInjectId, responseType, responseNotes, humanApproval]);

  const completeDrillAction = useCallback(async () => {
    if (!activeDrill) return;
    setLoadingAction(true);
    try {
      const completed = await fetchJson<DrillRun>(apiUrl(`/stress-drill/drills/${activeDrill.id}/complete`), { method: 'POST' });
      setActiveDrill(completed);
      setTab('debrief');
      void loadDrillHistory();
      void loadLeaderboard();
      void loadResilienceHistory();
    } catch { setError('Failed to complete drill'); } finally { setLoadingAction(false); }
  }, [activeDrill, loadDrillHistory, loadLeaderboard, loadResilienceHistory]);

  const abortDrillAction = useCallback(async () => {
    if (!activeDrill) return;
    setLoadingAction(true);
    try {
      await fetchJson<DrillRun>(apiUrl(`/stress-drill/drills/${activeDrill.id}/abort`), { method: 'POST' });
      setActiveDrill(null);
      setTab('scenarios');
      void loadDrillHistory();
    } catch { setError('Failed to abort drill'); } finally { setLoadingAction(false); }
  }, [activeDrill, loadDrillHistory]);

  const viewDebrief = useCallback((drill: DrillRun) => {
    setActiveDrill(drill);
    setTab('debrief');
  }, []);

  const openPdfDebrief = useCallback(() => {
    if (!activeDrill) return;
    window.open(apiUrl(`/stress-drill/drills/${activeDrill.id}/debrief/pdf`), '_blank');
  }, [activeDrill]);

  const scenarioFromId = (id: string) => scenarios.find((s) => s.id === id);

  return (
    <div style={{ minHeight: '100vh', background: '#060c1a', color: 'var(--gi-text-primary)' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#ef4444', marginBottom: 6 }}>
            RED-TEAM · GAME DAY ENGINE
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Game Day — Resilience Scoring</h1>
          <p style={{ color: '#94a3b8', maxWidth: 700, lineHeight: 1.6, fontSize: 13 }}>
            Run cross-domain crisis drills, score team performance across four dimensions, track resilience over time, and compete on the internal leaderboard.
          </p>
        </div>

        {error && (
          <div style={{ background: '#ef444418', border: '1px solid #ef4444', borderRadius: 8, padding: '10px 14px', color: '#ef4444', marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
          <TabButton active={tab === 'scenarios'} onClick={() => setTab('scenarios')}>Scenarios</TabButton>
          {activeDrill && activeDrill.status === 'running' && (
            <TabButton active={tab === 'active'} onClick={() => setTab('active')}>Active Drill</TabButton>
          )}
          {activeDrill && activeDrill.status === 'completed' && (
            <TabButton active={tab === 'debrief'} onClick={() => setTab('debrief')}>Debrief</TabButton>
          )}
          <TabButton active={tab === 'leaderboard'} onClick={() => setTab('leaderboard')}>Leaderboard</TabButton>
          <TabButton active={tab === 'resilience'} onClick={() => setTab('resilience')}>Resilience Trend</TabButton>
        </div>

        {/* ── Scenarios Tab ── */}
        {tab === 'scenarios' && (
          <div>
            {drillHistory.filter((d) => d.status === 'completed').length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gi-text-muted)', marginBottom: 10 }}>
                  Recent Completed Drills
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {drillHistory.filter((d) => d.status === 'completed').slice(0, 8).map((drill) => {
                    const sc = scenarioFromId(drill.scenarioId);
                    return (
                      <button
                        key={drill.id}
                        onClick={() => viewDebrief(drill)}
                        style={{
                          background: 'var(--gi-bg-base)',
                          border: `1px solid ${gradeColor(drill.score?.grade ?? 'F')}40`,
                          borderRadius: 8,
                          padding: '8px 14px',
                          cursor: 'pointer',
                          color: 'var(--gi-text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 12,
                        }}
                      >
                        <span>{sc?.icon ?? '\u25C6'}</span>
                        <span style={{ fontWeight: 600 }}>{sc?.name ?? drill.scenarioId}</span>
                        <span style={{ fontWeight: 800, color: gradeColor(drill.score?.grade ?? 'F') }}>
                          {drill.score?.grade ?? '\u2014'}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--gi-text-muted)' }}>
                          RS: {drill.score?.resilienceScore ?? '\u2014'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {loadingScenarios ? (
              <div style={{ color: 'var(--gi-text-muted)', padding: 40, textAlign: 'center' }}>Loading scenarios\u2026</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
                {scenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    style={{ background: '#0a0f1e', border: `1px solid ${scenario.accentColor}30`, borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span style={{ fontSize: 32 }}>{scenario.icon}</span>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 2 }}>{scenario.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>{scenario.tagline}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--gi-text-muted)', lineHeight: 1.6, flex: 1 }}>{scenario.summary}</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {scenario.domains.map((d) => (
                        <span
                          key={d}
                          style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: '#94a3b8', background: 'var(--gi-border-subtle)', borderRadius: 4, padding: '2px 7px' }}
                        >
                          {DOMAIN_ICONS[d] ?? '\u25C6'} {d.toUpperCase()}
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--gi-border-subtle)', paddingTop: 14 }}>
                      <div style={{ fontSize: 11, color: 'var(--gi-text-muted)' }}>
                        <span style={{ color: '#94a3b8', fontWeight: 600 }}>{scenario.injectCount} injects</span>{' '}
                        · {scenario.durationHours}h window
                      </div>
                      <button
                        disabled={loadingAction}
                        onClick={() => startScenario(scenario.id)}
                        style={{
                          background: scenario.accentColor,
                          border: 'none',
                          borderRadius: 6,
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: 700,
                          padding: '7px 18px',
                          cursor: loadingAction ? 'not-allowed' : 'pointer',
                          opacity: loadingAction ? 0.5 : 1,
                        }}
                      >
                        {loadingAction ? 'Starting\u2026' : 'Launch Drill'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Active Drill Tab ── */}
        {tab === 'active' && activeDrill && (
          <ActiveDrillView
            drill={activeDrill}
            scenario={scenarioFromId(activeDrill.scenarioId)}
            loadingAction={loadingAction}
            respondingInjectId={respondingInjectId}
            responseType={responseType}
            responseNotes={responseNotes}
            humanApproval={humanApproval}
            onAdvance={advanceDrillAction}
            onComplete={completeDrillAction}
            onAbort={abortDrillAction}
            onStartRespond={setRespondingInjectId}
            onResponseTypeChange={setResponseType}
            onResponseNotesChange={setResponseNotes}
            onHumanApprovalChange={setHumanApproval}
            onSubmitResponse={submitResponse}
            onCancelRespond={() => setRespondingInjectId(null)}
          />
        )}

        {/* ── Debrief Tab ── */}
        {tab === 'debrief' && activeDrill && activeDrill.score && (
          <DebriefView
            drill={activeDrill}
            scenario={scenarioFromId(activeDrill.scenarioId)}
            onExportPdf={openPdfDebrief}
            onBack={() => setTab('scenarios')}
          />
        )}

        {/* ── Leaderboard Tab ── */}
        {tab === 'leaderboard' && <LeaderboardView entries={leaderboard} onRefresh={loadLeaderboard} myOptIn={myOptIn} onToggleOptIn={toggleOptIn} />}

        {/* ── Resilience Trend Tab ── */}
        {tab === 'resilience' && <ResilienceTrendView history={resilienceHistory} scenarioFromId={scenarioFromId} />}
      </div>
    </div>
  );
}

function ActiveDrillView({
  drill,
  scenario,
  loadingAction,
  respondingInjectId,
  responseType,
  responseNotes,
  humanApproval,
  onAdvance,
  onComplete,
  onAbort,
  onStartRespond,
  onResponseTypeChange,
  onResponseNotesChange,
  onHumanApprovalChange,
  onSubmitResponse,
  onCancelRespond,
}: {
  drill: DrillRun;
  scenario: CrisisScenario | undefined;
  loadingAction: boolean;
  respondingInjectId: string | null;
  responseType: TeamResponse['responseType'];
  responseNotes: string;
  humanApproval: boolean;
  onAdvance: () => void;
  onComplete: () => void;
  onAbort: () => void;
  onStartRespond: (id: string) => void;
  onResponseTypeChange: (t: TeamResponse['responseType']) => void;
  onResponseNotesChange: (n: string) => void;
  onHumanApprovalChange: (v: boolean) => void;
  onSubmitResponse: () => void;
  onCancelRespond: () => void;
}) {
  const firedInjects = drill.injectStatuses.filter((s) => s.firedAt !== null);
  const totalInjects = drill.injectStatuses.length;
  const hasMoreInjects = drill.currentInjectIndex < totalInjects - 1;
  const allFiredResponded = firedInjects.every((s) => s.response !== null);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#ef4444', marginBottom: 4 }}>
            DRILL ACTIVE — {drill.status.toUpperCase()}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 2 }}>
            {scenario?.icon ?? '\u25C6'} {scenario?.name ?? drill.scenarioId}
          </h2>
          <div style={{ fontSize: 11, color: 'var(--gi-text-muted)' }}>
            ID: {drill.id} · Operator: {drill.operatorLabel} · Participants: {drill.participants.length}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {hasMoreInjects && allFiredResponded && (
            <button
              disabled={loadingAction}
              onClick={onAdvance}
              style={{ background: '#1e40af', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 700, padding: '7px 16px', cursor: 'pointer' }}
            >
              Fire Next Inject →
            </button>
          )}
          <button
            disabled={loadingAction}
            onClick={onComplete}
            style={{ background: '#15803d', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 700, padding: '7px 16px', cursor: 'pointer' }}
          >
            Complete & Score
          </button>
          <button
            disabled={loadingAction}
            onClick={onAbort}
            style={{ background: '#7f1d1d', border: 'none', borderRadius: 6, color: '#fca5a5', fontSize: 12, fontWeight: 700, padding: '7px 16px', cursor: 'pointer' }}
          >
            Abort
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard label="Injects Fired" value={`${firedInjects.length}/${totalInjects}`} />
        <StatCard label="Responded" value={firedInjects.filter((s) => s.response !== null).length} color="#22c55e" />
        <StatCard label="Awaiting" value={firedInjects.filter((s) => s.response === null).length} color="#f59e0b" />
        <StatCard label="Remaining" value={totalInjects - firedInjects.length} color="var(--gi-text-muted)" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {firedInjects.map((is) => {
          const sevColor = SEVERITY_COLORS[is.inject.severity] ?? '#4a6070';
          const isResponding = respondingInjectId === is.inject.id;

          return (
            <div
              key={is.inject.id}
              style={{ background: '#0a0f1e', border: `1px solid ${sevColor}30`, borderRadius: 10, padding: 18 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: sevColor, background: `${sevColor}18`, borderRadius: 3, padding: '2px 6px', border: `1px solid ${sevColor}40` }}>
                      {is.inject.severity.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: '#94a3b8', background: 'var(--gi-border-subtle)', borderRadius: 3, padding: '2px 6px' }}>
                      {DOMAIN_ICONS[is.inject.domain] ?? '\u25C6'} {is.inject.domain.toUpperCase()}
                    </span>
                    {is.inject.requiresHumanApproval && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', background: '#f59e0b18', borderRadius: 3, padding: '2px 6px', border: '1px solid #f59e0b40' }}>
                        HUMAN APPROVAL
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{is.inject.title}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>{is.inject.description}</div>
                </div>
              </div>

              {is.response ? (
                <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--gi-bg-base)', borderRadius: 6, borderLeft: `3px solid ${RESPONSE_COLORS[is.response.responseType] ?? 'var(--gi-text-muted)'}` }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: RESPONSE_COLORS[is.response.responseType], background: `${RESPONSE_COLORS[is.response.responseType]}18`, borderRadius: 3, padding: '2px 6px' }}>
                      {is.response.responseType.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--gi-text-muted)' }}>by {is.response.respondedByLabel}</span>
                    {is.response.humanApprovalGiven && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#22c55e' }}>\u2713 Approved</span>
                    )}
                  </div>
                  {is.response.notes && (
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{is.response.notes}</div>
                  )}
                </div>
              ) : isResponding ? (
                <div style={{ marginTop: 10, padding: 12, background: 'var(--gi-bg-base)', borderRadius: 6, border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                    {(['detected', 'contained', 'resolved', 'escalated', 'missed'] as const).map((rt) => (
                      <button
                        key={rt}
                        onClick={() => onResponseTypeChange(rt)}
                        style={{
                          background: responseType === rt ? `${RESPONSE_COLORS[rt]}30` : 'transparent',
                          border: `1px solid ${responseType === rt ? RESPONSE_COLORS[rt] : '#334155'}`,
                          borderRadius: 4,
                          color: responseType === rt ? RESPONSE_COLORS[rt] : '#94a3b8',
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '4px 10px',
                          cursor: 'pointer',
                        }}
                      >
                        {rt.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={responseNotes}
                    onChange={(e) => onResponseNotesChange(e.target.value)}
                    placeholder="Response notes..."
                    style={{
                      width: '100%',
                      background: '#0a0f1e',
                      border: '1px solid var(--gi-border-subtle)',
                      borderRadius: 4,
                      color: 'var(--gi-text-primary)',
                      fontSize: 12,
                      padding: 8,
                      minHeight: 50,
                      resize: 'vertical',
                    }}
                  />
                  {is.inject.requiresHumanApproval && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 11, color: '#f59e0b', cursor: 'pointer' }}>
                      <input type="checkbox" checked={humanApproval} onChange={(e) => onHumanApprovalChange(e.target.checked)} />
                      Human approval granted
                    </label>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      disabled={loadingAction}
                      onClick={onSubmitResponse}
                      style={{ background: '#1e40af', border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, fontWeight: 700, padding: '6px 14px', cursor: 'pointer' }}
                    >
                      Submit Response
                    </button>
                    <button
                      onClick={onCancelRespond}
                      style={{ background: 'transparent', border: '1px solid #334155', borderRadius: 4, color: '#94a3b8', fontSize: 11, fontWeight: 700, padding: '6px 14px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => onStartRespond(is.inject.id)}
                  style={{ marginTop: 8, background: 'var(--gi-border-subtle)', border: '1px solid #334155', borderRadius: 4, color: 'var(--gi-text-primary)', fontSize: 11, fontWeight: 700, padding: '6px 14px', cursor: 'pointer' }}
                >
                  Respond to Inject
                </button>
              )}

              {is.inject.runbookRef && (
                <div style={{ marginTop: 6, fontSize: 10, color: 'var(--gi-text-muted)' }}>
                  Runbook: {is.inject.runbookRef}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DebriefView({
  drill,
  scenario,
  onExportPdf,
  onBack,
}: {
  drill: DrillRun;
  scenario: CrisisScenario | undefined;
  onExportPdf: () => void;
  onBack: () => void;
}) {
  const score = drill.score!;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#c8a050', marginBottom: 4 }}>
            GAME DAY DEBRIEF
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 2 }}>
            {scenario?.icon ?? '\u25C6'} {scenario?.name ?? drill.scenarioId}
          </h2>
          <div style={{ fontSize: 11, color: 'var(--gi-text-muted)' }}>
            Drill {drill.id} · Operator: {drill.operatorLabel} · Completed: {new Date(score.completedAt).toLocaleString()}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', border: `2px solid ${gradeColor(score.grade)}`, borderRadius: 10, padding: '10px 20px', background: `${gradeColor(score.grade)}10`, minWidth: 70 }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: gradeColor(score.grade), lineHeight: 1 }}>{score.grade}</span>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: gradeColor(score.grade), marginTop: 2 }}>{score.overallScore}/100</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', border: '2px solid #c8a050', borderRadius: 10, padding: '10px 20px', background: '#c8a05010', minWidth: 70 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: '#c8a050', marginBottom: 2 }}>RESILIENCE</span>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#c8a050', lineHeight: 1 }}>{score.resilienceScore}</span>
          </div>
        </div>
      </div>

      <div style={{ background: '#0a0f1e', border: '1px solid var(--gi-border-subtle)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: 'var(--gi-text-primary)', lineHeight: 1.6 }}>{score.verdict}</div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gi-text-muted)', marginBottom: 10 }}>
        4-DIMENSION RESILIENCE SCORING
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 24 }}>
        <DimensionBar dim={score.dimensions.timeToDetect} />
        <DimensionBar dim={score.dimensions.timeToRespond} />
        <DimensionBar dim={score.dimensions.runbookAdherence} />
        <DimensionBar dim={score.dimensions.businessImpactContainment} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 24 }}>
        <StatCard label="Injects Fired" value={score.totalInjects} />
        <StatCard label="Detected" value={score.detected} color="#22c55e" />
        <StatCard label="Resolved" value={score.resolved} color="#a855f7" />
        <StatCard label="Missed" value={score.missed} color="#ef4444" />
        <StatCard label="Avg Detect" value={score.avgDetectMinutes != null ? `${score.avgDetectMinutes}m` : 'N/A'} color="#f59e0b" />
        <StatCard label="Avg Resolve" value={score.avgResolveMinutes != null ? `${score.avgResolveMinutes}m` : 'N/A'} color="#a855f7" />
        <StatCard label="Human Approvals" value={`${score.humanApprovalsGiven}/${score.humanApprovalsRequired}`} color="#38bdf8" />
      </div>

      {score.participantScores.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gi-text-muted)', marginBottom: 10 }}>
            PARTICIPANT PERFORMANCE
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {score.participantScores.map((ps) => (
              <div
                key={ps.label}
                style={{ background: '#0a0f1e', border: '1px solid var(--gi-border-subtle)', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16 }}
              >
                <span style={{ fontSize: 20, fontWeight: 900, color: gradeColor(ps.grade), minWidth: 30, textAlign: 'center' }}>{ps.grade}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{ps.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--gi-text-muted)' }}>
                    {ps.responsesGiven} responses · Detect: {ps.detectRate}% · Resolve: {ps.resolveRate}% · Avg: {ps.avgResponseMinutes != null ? `${ps.avgResponseMinutes}m` : 'N/A'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {score.domainBreakdown.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gi-text-muted)', marginBottom: 10 }}>
            DOMAIN BREAKDOWN
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, marginBottom: 24 }}>
            {score.domainBreakdown.map((d) => (
              <div key={d.domain} style={{ background: '#0a0f1e', border: '1px solid var(--gi-border-subtle)', borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#94a3b8', marginBottom: 4 }}>
                  {DOMAIN_ICONS[d.domain] ?? '\u25C6'} {d.domain.toUpperCase()}
                </div>
                <div style={{ fontSize: 11, color: 'var(--gi-text-muted)' }}>
                  {d.injectCount} injects · {d.detected} detected · {d.resolved} resolved
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {score.missedSteps.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#ef4444', marginBottom: 10 }}>
            MISSED STEPS
          </div>
          <div style={{ background: '#0a0f1e', border: '1px solid #ef444440', borderRadius: 8, padding: 16, marginBottom: 24 }}>
            {score.missedSteps.map((m, i) => (
              <div key={i} style={{ fontSize: 12, color: '#ef4444', marginBottom: 4 }}>{'•'} {m}</div>
            ))}
          </div>
        </>
      )}

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gi-text-muted)', marginBottom: 10 }}>
        IMPROVEMENT RECOMMENDATIONS
      </div>
      <div style={{ background: '#0a0f1e', border: '1px solid var(--gi-border-subtle)', borderRadius: 8, padding: 16, marginBottom: 24 }}>
        {score.recommendations.map((r, i) => (
          <div key={i} style={{ fontSize: 12, color: 'var(--gi-text-primary)', marginBottom: 6, lineHeight: 1.5 }}>{'•'} {r}</div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onExportPdf}
          style={{ background: '#c8a050', border: 'none', borderRadius: 6, color: '#000', fontSize: 12, fontWeight: 700, padding: '8px 20px', cursor: 'pointer' }}
        >
          Export PDF Debrief
        </button>
        <button
          onClick={onBack}
          style={{ background: 'transparent', border: '1px solid #334155', borderRadius: 6, color: '#94a3b8', fontSize: 12, fontWeight: 700, padding: '8px 20px', cursor: 'pointer' }}
        >
          Back to Scenarios
        </button>
      </div>
    </div>
  );
}

function LeaderboardView({ entries, onRefresh, myOptIn, onToggleOptIn }: { entries: LeaderboardEntry[]; onRefresh: () => void; myOptIn: boolean; onToggleOptIn: () => void }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gi-text-muted)', marginBottom: 4 }}>
            INTERNAL LEADERBOARD
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            Opt-in participation · Privacy-respecting · Ranked by average resilience score
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onToggleOptIn}
            style={{
              background: myOptIn ? 'var(--gi-border-subtle)' : '#1e40af',
              border: `1px solid ${myOptIn ? '#334155' : '#2563eb'}`,
              borderRadius: 6,
              color: myOptIn ? '#94a3b8' : '#fff',
              fontSize: 11,
              fontWeight: 700,
              padding: '6px 14px',
              cursor: 'pointer',
            }}
          >
            {myOptIn ? 'Opt Out' : 'Opt In'}
          </button>
          <button
            onClick={onRefresh}
            style={{ background: 'var(--gi-border-subtle)', border: '1px solid #334155', borderRadius: 6, color: '#94a3b8', fontSize: 11, fontWeight: 700, padding: '6px 14px', cursor: 'pointer' }}
          >
            Refresh
          </button>
        </div>
      </div>

      {myOptIn && (
        <div style={{ background: 'var(--gi-bg-base)', border: '1px solid #1e40af40', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 12, color: '#94a3b8' }}>
          You are opted in to the leaderboard. Your scores from completed drills will appear publicly.
        </div>
      )}

      {entries.length === 0 ? (
        <div style={{ background: '#0a0f1e', border: '1px solid var(--gi-border-subtle)', borderRadius: 12, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>{'\uD83C\uDFC6'}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>No leaderboard entries yet</div>
          <div style={{ fontSize: 12, color: 'var(--gi-text-muted)' }}>Complete drills and opt in to appear on the leaderboard</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.map((entry, idx) => {
            const medal = idx === 0 ? '\uD83E\uDD47' : idx === 1 ? '\uD83E\uDD48' : idx === 2 ? '\uD83E\uDD49' : `#${idx + 1}`;
            return (
              <div
                key={entry.participantLabel}
                style={{
                  background: '#0a0f1e',
                  border: `1px solid ${idx < 3 ? '#c8a05040' : 'var(--gi-border-subtle)'}`,
                  borderRadius: 10,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <span style={{ fontSize: idx < 3 ? 24 : 14, fontWeight: 800, minWidth: 36, textAlign: 'center', color: idx < 3 ? '#c8a050' : 'var(--gi-text-muted)' }}>
                  {medal}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{entry.participantLabel}</div>
                  <div style={{ fontSize: 11, color: 'var(--gi-text-muted)' }}>
                    {entry.totalDrills} drills · {entry.totalInjectsHandled} injects handled · Best: {entry.bestGrade}
                    {entry.avgDetectMinutes !== null && ` · Avg detect: ${entry.avgDetectMinutes}m`}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--gi-text-muted)' }}>RESILIENCE</span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: entry.avgResilienceScore >= 80 ? '#22c55e' : entry.avgResilienceScore >= 60 ? '#f59e0b' : '#ef4444' }}>
                    {entry.avgResilienceScore}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ResilienceTrendView({
  history,
  scenarioFromId,
}: {
  history: ResilienceScorePoint[];
  scenarioFromId: (id: string) => CrisisScenario | undefined;
}) {
  const latestScore = history.length > 0 ? history[history.length - 1].score : null;
  const maxScore = history.length > 0 ? Math.max(...history.map((h) => h.score)) : 0;
  const minScore = history.length > 0 ? Math.min(...history.map((h) => h.score)) : 0;
  const trend =
    history.length >= 2 ? history[history.length - 1].score - history[history.length - 2].score : 0;

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#0a0f1e', border: '2px solid #c8a050', borderRadius: 12, padding: '20px 28px', textAlign: 'center', minWidth: 160 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: '#c8a050', marginBottom: 4 }}>CURRENT RESILIENCE SCORE</div>
          <div style={{ fontSize: 48, fontWeight: 900, color: '#c8a050', lineHeight: 1 }}>
            {latestScore ?? '\u2014'}
          </div>
          {trend !== 0 && (
            <div style={{ fontSize: 12, fontWeight: 700, color: trend > 0 ? '#22c55e' : '#ef4444', marginTop: 4 }}>
              {trend > 0 ? '\u2191' : '\u2193'} {Math.abs(trend)} pts from last drill
            </div>
          )}
        </div>
        <StatCard label="Drills Completed" value={history.length} color="#38bdf8" />
        <StatCard label="Peak Score" value={maxScore || '\u2014'} color="#22c55e" />
        <StatCard label="Floor Score" value={history.length > 0 ? minScore : '\u2014'} color="#f59e0b" />
      </div>

      {history.length === 0 ? (
        <div style={{ background: '#0a0f1e', border: '1px solid var(--gi-border-subtle)', borderRadius: 12, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>{'\uD83D\uDCC8'}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>No resilience data yet</div>
          <div style={{ fontSize: 12, color: 'var(--gi-text-muted)' }}>Complete drills to build your resilience score trend</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gi-text-muted)', marginBottom: 10 }}>
            RESILIENCE SCORE TREND
          </div>

          <div style={{ background: '#0a0f1e', border: '1px solid var(--gi-border-subtle)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}>
              {history.map((point, idx) => {
                const height = maxScore > 0 ? (point.score / 100) * 100 : 50;
                const sc = scenarioFromId(point.scenarioId);
                const barColor = point.score >= 80 ? '#22c55e' : point.score >= 60 ? '#f59e0b' : '#ef4444';
                return (
                  <div
                    key={point.drillId}
                    title={`${sc?.name ?? point.scenarioId}: ${point.score} (${point.grade})`}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                  >
                    <span style={{ fontSize: 9, fontWeight: 700, color: barColor }}>{point.score}</span>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: 40,
                        height: `${height}%`,
                        background: barColor,
                        borderRadius: 3,
                        minHeight: 4,
                        transition: 'height 0.5s ease',
                      }}
                    />
                    <span style={{ fontSize: 8, color: 'var(--gi-text-muted)', textAlign: 'center' }}>
                      {sc?.icon ?? '\u25C6'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gi-text-muted)', marginBottom: 10 }}>
            DIMENSION TRENDS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 24 }}>
            {(['timeToDetect', 'timeToRespond', 'runbookAdherence', 'businessImpactContainment'] as const).map((dimKey) => {
              const dimLabels: Record<string, string> = {
                timeToDetect: 'Time-to-Detect',
                timeToRespond: 'Time-to-Respond',
                runbookAdherence: 'Runbook Adherence',
                businessImpactContainment: 'Business Impact Containment',
              };
              const latest = history.length > 0 ? history[history.length - 1].dimensions[dimKey] : 0;
              const avg = history.length > 0 ? Math.round(history.reduce((sum, h) => sum + h.dimensions[dimKey], 0) / history.length) : 0;
              return (
                <div key={dimKey} style={{ background: '#0a0f1e', border: '1px solid var(--gi-border-subtle)', borderRadius: 8, padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>{dimLabels[dimKey]}</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: dimScoreColor(latest) }}>{latest}</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'var(--gi-border-subtle)', borderRadius: 3 }}>
                    <div style={{ width: `${latest}%`, height: '100%', background: dimScoreColor(latest), borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--gi-text-muted)', marginTop: 4 }}>
                    Avg across {history.length} drills: {avg}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gi-text-muted)', marginBottom: 10 }}>
            DRILL HISTORY
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...history].reverse().map((point) => {
              const sc = scenarioFromId(point.scenarioId);
              return (
                <div key={point.drillId} style={{ background: '#0a0f1e', border: '1px solid var(--gi-border-subtle)', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 20 }}>{sc?.icon ?? '\u25C6'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{sc?.name ?? point.scenarioId}</div>
                    <div style={{ fontSize: 10, color: 'var(--gi-text-muted)' }}>
                      {new Date(point.completedAt).toLocaleString()} · {point.drillId}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: gradeColor(point.grade) }}>{point.grade}</span>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: 'var(--gi-text-muted)' }}>RESILIENCE</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#c8a050' }}>{point.score}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
