import { useStandardQuery } from '@szl-holdings/api-client-react';

import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import {
  AlertTriangle,
  Clock,
  Loader2,
  Lock,
  Pause,
  Play,
  Server,
  Shield,
  SkipBack,
  SkipForward,
  Target,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  ExecutiveSafeModeProvider,
  useExecutiveSafeMode,
} from '../lib/executive-safe-mode-context';

type EventSeverity = 'critical' | 'high' | 'medium' | 'low';

interface ReplayEvent {
  id: string;
  t: number;
  type:
    | 'initial_access'
    | 'execution'
    | 'persistence'
    | 'lateral_move'
    | 'exfil'
    | 'c2'
    | 'discovery'
    | 'defense_evasion';
  severity: EventSeverity;
  actor: string;
  target: string;
  description: string;
  mitre: string;
  evidence: string;
}

interface AegisIncident {
  id: number;
  title: string;
  severity: string;
  status: string;
  mitreTactic?: string | null;
  mitreId?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

const SEV_COLOR: Record<EventSeverity, string> = {
  critical: '#f5f5f5',
  high: '#c9b787',
  medium: '#8b7ac8',
  low: '#6b7280',
};

const TYPE_COLOR: Record<string, string> = {
  initial_access: '#f5f5f5',
  execution: '#c9b787',
  persistence: '#c9b787',
  lateral_move: '#8b7ac8',
  exfil: '#c9b787',
  c2: '#8a8a8a',
  discovery: '#6b7280',
  defense_evasion: '#c9b787',
};

const TYPE_LABEL: Record<string, string> = {
  initial_access: 'Initial Access',
  execution: 'Execution',
  persistence: 'Persistence',
  lateral_move: 'Lateral Movement',
  exfil: 'Data Exfiltration',
  c2: 'C2 Beacon',
  discovery: 'Discovery',
  defense_evasion: 'Defense Evasion',
};

const SEED_EVENTS: ReplayEvent[] = [
  {
    id: 'e01',
    t: 0,
    type: 'initial_access',
    severity: 'critical',
    actor: 'APT29',
    target: 'mail.corp.internal',
    description: 'Spear-phishing email delivers macro-laced Excel attachment to finance team',
    mitre: 'T1566.001',
    evidence: 'Email header analysis, sandbox detonation log',
  },
  {
    id: 'e02',
    t: 3,
    type: 'execution',
    severity: 'critical',
    actor: 'APT29',
    target: 'WKSTN-FIN-042',
    description: 'PowerShell encoded command executes in-memory shellcode loader',
    mitre: 'T1059.001',
    evidence: 'Process tree: EXCEL.EXE → powershell.exe -enc …',
  },
  {
    id: 'e03',
    t: 7,
    type: 'persistence',
    severity: 'high',
    actor: 'APT29',
    target: 'WKSTN-FIN-042',
    description: 'Scheduled task created for SYSTEM-level persistence under task svchost64',
    mitre: 'T1053.005',
    evidence: 'Registry key HKLM\\SOFTWARE\\Microsoft\\… captured',
  },
  {
    id: 'e04',
    t: 12,
    type: 'discovery',
    severity: 'medium',
    actor: 'APT29',
    target: 'CORP-NET-10.0.0/16',
    description: 'LDAP queries enumerate domain admin group membership and GPO objects',
    mitre: 'T1087.002',
    evidence: 'Network capture: 847 LDAP queries in 90s',
  },
  {
    id: 'e05',
    t: 18,
    type: 'c2',
    severity: 'high',
    actor: 'APT29',
    target: '185.220.101.45',
    description:
      'Cobalt Strike Beacon establishes HTTPS C2 channel over port 443 with traffic blending',
    mitre: 'T1071.001',
    evidence: 'JA3 fingerprint match, beacon timing jitter analysis',
  },
  {
    id: 'e06',
    t: 26,
    type: 'lateral_move',
    severity: 'critical',
    actor: 'APT29',
    target: 'PROD-DC-01',
    description: 'Pass-the-ticket with Golden Ticket using harvested krbtgt NTLM hash',
    mitre: 'T1550.003',
    evidence: 'Kerberos ticket anomaly: 10y lifetime, event 4769',
  },
  {
    id: 'e07',
    t: 33,
    type: 'lateral_move',
    severity: 'high',
    actor: 'APT29',
    target: 'FILESERVER-01',
    description: 'SMB lateral movement via hijacked domain admin session',
    mitre: 'T1021.002',
    evidence: 'Windows event 4624 type 3 anomaly, source: DC01',
  },
  {
    id: 'e08',
    t: 41,
    type: 'defense_evasion',
    severity: 'high',
    actor: 'APT29',
    target: 'FILESERVER-01',
    description: 'Security event log cleared via wevtutil, AV tampered via COM interface',
    mitre: 'T1070.001',
    evidence: 'Event 1102 on FILESERVER, AV service stopped',
  },
  {
    id: 'e09',
    t: 48,
    type: 'exfil',
    severity: 'critical',
    actor: 'APT29',
    target: '185.220.101.45:8443',
    description: 'Staged archive of 47GB exfiltrated over encrypted HTTPS in 2h window',
    mitre: 'T1048.003',
    evidence: 'NetFlow anomaly, DLP: 47.2GB egress to unfamiliar IP',
  },
];

const TOTAL_DURATION = 60;

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 60);
  const m = Math.floor(seconds % 60);
  return `T+${h.toString().padStart(2, '0')}h${m.toString().padStart(2, '0')}m`;
}

function EventDot({
  event,
  playhead,
  onClick,
}: {
  event: ReplayEvent;
  playhead: number;
  onClick: () => void;
}) {
  const pct = (event.t / TOTAL_DURATION) * 100;
  const isPast = playhead >= event.t;
  const isCurrent =
    playhead >= event.t &&
    (SEED_EVENTS.findIndex((e) => e.t > playhead) === SEED_EVENTS.indexOf(event) + 1 ||
      SEED_EVENTS.indexOf(event) === SEED_EVENTS.filter((e) => e.t <= playhead).length - 1);
  const color = TYPE_COLOR[event.type];

  return (
    <button
      onClick={onClick}
      className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all"
      style={{ left: `${pct}%`, top: '50%', opacity: isPast ? 1 : 0.35 }}
      title={event.description}
    >
      <div
        className="w-3 h-3 rounded-full border-2"
        style={{
          background: isPast ? color : 'rgba(255,255,255,0.1)',
          borderColor: color,
          boxShadow: isCurrent ? `0 0 8px ${color}80` : 'none',
          transform: isCurrent ? 'scale(1.5)' : 'scale(1)',
        }}
      />
    </button>
  );
}

export default function AegisReplay() {
  return (
    <ExecutiveSafeModeProvider>
      <AegisReplayContent />
    </ExecutiveSafeModeProvider>
  );
}

function AegisReplayContent() {
  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<ReplayEvent | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const safeMode = useExecutiveSafeMode();

  const { data: incidentData, isLoading } = useStandardQuery<AegisIncident[]>({
    queryKey: ['firestorm-incidents-replay'],
    queryFn: () => apiFetch<AegisIncident[]>('/firestorm/incidents'),
    staleTime: 60000,
    retry: 1,
  });

  const incidents = Array.isArray(incidentData) ? incidentData : [];
  const latestIncident =
    incidents
      .filter((i) => ['critical', 'high'].includes(i.severity))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;

  const incidentId = latestIncident
    ? `INC-${String(latestIncident.id).padStart(7, '0')}`
    : 'INC-2024-0847';

  const incidentSeverityLabel = latestIncident
    ? `${latestIncident.severity.charAt(0).toUpperCase() + latestIncident.severity.slice(1)} Severity`
    : 'APT29 (Cozy Bear)';

  const dwellTime = latestIncident
    ? `${Math.round((Date.now() - new Date(latestIncident.createdAt).getTime()) / 60000)} min dwell`
    : '52 minutes';

  const REPLAY_EVENTS = SEED_EVENTS;

  const visibleEvents = REPLAY_EVENTS.filter((e) => e.t <= playhead);
  const currentEvent = visibleEvents[visibleEvents.length - 1] ?? null;

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setPlayhead((p) => {
          if (p >= TOTAL_DURATION) {
            setPlaying(false);
            return TOTAL_DURATION;
          }
          return p + 1;
        });
      }, 300);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing]);

  function handleScrub(e: React.ChangeEvent<HTMLInputElement>) {
    setPlaying(false);
    setPlayhead(parseInt(e.target.value, 10));
  }

  function reset() {
    setPlaying(false);
    setPlayhead(0);
    setSelectedEvent(null);
  }

  const displayEvent = selectedEvent ?? currentEvent;

  if (safeMode) {
    return (
      <div className="max-w-7xl mx-auto space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Play className="w-3.5 h-3.5" style={{ color: '#8b7ac8' }} />
            <span
              className="text-[10px] font-bold uppercase tracking-widest font-mono"
              style={{ color: '#8b7ac8' }}
            >
              PARAGON · ATLAS Replay Engine
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Attack Path Replay</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Scrub through the kill chain timeline to reconstruct the attack path with spatial twin
            evidence anchoring.
          </p>
        </div>
        <div
          className="rounded-2xl border flex flex-col items-center justify-center gap-4 py-16 px-8 text-center"
          style={{ borderColor: 'rgba(139,122,200,0.2)', background: 'rgba(139,122,200,0.04)' }}
        >
          <div
            className="p-4 rounded-2xl"
            style={{
              background: 'rgba(139,122,200,0.1)',
              border: '1px solid rgba(139,122,200,0.2)',
            }}
          >
            <Lock className="w-7 h-7" style={{ color: '#8b7ac8' }} />
          </div>
          <div>
            <div className="text-sm font-bold text-white mb-1">Replay Access Restricted</div>
            <div className="text-[11px] max-w-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Attack path replay data contains unreviewed incident intelligence. All replay controls
              and event data are blocked in Executive Safe Mode.
            </div>
          </div>
          <div
            className="text-[9px] px-3 py-1.5 rounded-lg font-mono"
            style={{
              color: 'rgba(139,122,200,0.6)',
              background: 'rgba(139,122,200,0.08)',
              border: '1px solid rgba(139,122,200,0.15)',
            }}
          >
            Contact the SOC lead to release {incidentId} for executive review
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Play className="w-3.5 h-3.5" style={{ color: '#8b7ac8' }} />
          <span
            className="text-[10px] font-bold uppercase tracking-widest font-mono"
            style={{ color: '#8b7ac8' }}
          >
            PARAGON · ATLAS Replay Engine
          </span>
          {isLoading && (
            <Loader2
              className="w-3 h-3 animate-spin ml-1"
              style={{ color: 'rgba(139,122,200,0.5)' }}
            />
          )}
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">Attack Path Replay</h1>
        <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Scrub through the kill chain timeline to reconstruct the attack path with spatial twin
          evidence anchoring.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Incident ID', value: incidentId, color: '#8b7ac8' },
          {
            label: latestIncident ? 'Severity' : 'Adversary',
            value: incidentSeverityLabel,
            color: '#f5f5f5',
          },
          { label: 'Dwell Time', value: dwellTime, color: '#c9b787' },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border p-4"
            style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.015)' }}
          >
            <div
              className="text-[9px] font-medium uppercase tracking-widest mb-1"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              {c.label}
            </div>
            <div className="text-sm font-bold" style={{ color: c.color }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {latestIncident && (
        <div
          className="rounded-xl border px-4 py-2.5 flex items-center gap-3"
          style={{ borderColor: 'rgba(139,122,200,0.12)', background: 'rgba(139,122,200,0.02)' }}
        >
          <AlertTriangle className="w-3 h-3 shrink-0" style={{ color: '#8b7ac8' }} />
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Replaying timeline for live incident:{' '}
            <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {latestIncident.title}
            </span>
          </span>
          <span className="ml-auto text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
            {incidentId}
          </span>
        </div>
      )}

      <div
        className="rounded-xl border p-5"
        style={{ borderColor: 'rgba(139,122,200,0.15)', background: 'rgba(139,122,200,0.03)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-3.5 h-3.5" style={{ color: '#8b7ac8' }} />
          <span className="text-[11px] font-semibold text-white">Timeline Scrubber</span>
          <span className="ml-auto text-[11px] font-mono" style={{ color: '#8b7ac8' }}>
            {formatTime(playhead)}
          </span>
        </div>

        <div className="relative mb-2 h-8 flex items-center">
          <div
            className="absolute inset-x-0 h-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          />
          <div
            className="absolute left-0 h-1 rounded-full transition-all"
            style={{
              width: `${(playhead / TOTAL_DURATION) * 100}%`,
              background: 'linear-gradient(to right, #8b7ac8, #f5f5f5)',
            }}
          />
          {REPLAY_EVENTS.map((ev) => (
            <EventDot
              key={ev.id}
              event={ev}
              playhead={playhead}
              onClick={() => setSelectedEvent(ev)}
            />
          ))}
          <input
            type="range"
            min={0}
            max={TOTAL_DURATION}
            value={playhead}
            onChange={handleScrub}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-8"
          />
        </div>

        <div
          className="flex items-center gap-3 justify-between text-[9px] font-mono mb-4"
          style={{ color: 'rgba(255,255,255,0.25)' }}
        >
          <span>T+00h00m</span>
          <span>T+00h30m</span>
          <span>T+01h00m</span>
        </div>

        <div className="flex items-center gap-2 justify-center">
          <button
            onClick={reset}
            className="p-2 rounded-lg transition-colors hover:bg-white/8"
            style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all"
            style={{
              background: playing ? 'rgba(139,122,200,0.15)' : 'rgba(139,122,200,0.2)',
              color: '#8b7ac8',
              border: '1px solid rgba(139,122,200,0.3)',
            }}
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {playing ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={() => setPlayhead(TOTAL_DURATION)}
            className="p-2 rounded-lg transition-colors hover:bg-white/8"
            style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <div
            className="p-4 border-b flex items-center gap-2"
            style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}
          >
            <Target className="w-3.5 h-3.5" style={{ color: '#f5f5f5' }} />
            <span className="text-[11px] font-semibold text-white">Event Log</span>
            <span
              className="ml-auto text-[9px] font-mono"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              {visibleEvents.length} / {REPLAY_EVENTS.length} events
            </span>
          </div>
          <div className="divide-y divide-white/[0.04] max-h-80 overflow-y-auto">
            {REPLAY_EVENTS.map((ev) => {
              const isVisible = ev.t <= playhead;
              const color = TYPE_COLOR[ev.type];
              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="p-3 flex items-start gap-3 cursor-pointer hover:bg-white/3 transition-all"
                  style={{ opacity: isVisible ? 1 : 0.25 }}
                >
                  <div
                    className="text-[9px] font-mono mt-0.5 w-16 shrink-0"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                  >
                    {formatTime(ev.t)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{ color, background: `${color}15` }}
                      >
                        {TYPE_LABEL[ev.type]}
                      </span>
                      <span
                        className="text-[9px] font-mono"
                        style={{ color: 'rgba(139,122,200,0.6)' }}
                      >
                        {ev.mitre}
                      </span>
                    </div>
                    <div
                      className="text-[10px] line-clamp-1"
                      style={{
                        color: isVisible ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      {ev.description}
                    </div>
                  </div>
                  <span
                    className="text-[8px] font-bold uppercase px-1 py-0.5 rounded shrink-0"
                    style={{
                      color: SEV_COLOR[ev.severity],
                      background: `${SEV_COLOR[ev.severity]}15`,
                    }}
                  >
                    {ev.severity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="rounded-xl border p-4"
          style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.01)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-3.5 h-3.5" style={{ color: '#8b7ac8' }} />
            <span className="text-[11px] font-semibold text-white">Event Detail</span>
          </div>
          {displayEvent ? (
            <div className="space-y-3">
              <div
                className="rounded-lg p-3"
                style={{
                  background: `${TYPE_COLOR[displayEvent.type]}08`,
                  border: `1px solid ${TYPE_COLOR[displayEvent.type]}20`,
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      color: TYPE_COLOR[displayEvent.type],
                      background: `${TYPE_COLOR[displayEvent.type]}15`,
                    }}
                  >
                    {TYPE_LABEL[displayEvent.type]}
                  </span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      color: SEV_COLOR[displayEvent.severity],
                      background: `${SEV_COLOR[displayEvent.severity]}15`,
                    }}
                  >
                    {displayEvent.severity}
                  </span>
                </div>
                <div className="text-sm font-semibold text-white leading-snug">
                  {displayEvent.description}
                </div>
              </div>
              {[
                { label: 'Adversary', value: displayEvent.actor, icon: Target },
                { label: 'Target', value: displayEvent.target, icon: Server },
                { label: 'MITRE', value: displayEvent.mitre, icon: Shield },
                { label: 'Time', value: formatTime(displayEvent.t), icon: Clock },
              ].map((r) => (
                <div key={r.label} className="flex items-center gap-2 text-[10px]">
                  <r.icon
                    className="w-3 h-3 shrink-0"
                    style={{ color: 'rgba(255,255,255,0.25)' }}
                  />
                  <span
                    className="font-medium w-20 shrink-0"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                  >
                    {r.label}
                  </span>
                  <span className="font-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {r.value}
                  </span>
                </div>
              ))}
              <div
                className="rounded-lg p-3"
                style={{
                  background: 'rgba(201,183,135,0.05)',
                  border: '1px solid rgba(201,183,135,0.15)',
                }}
              >
                <div
                  className="text-[9px] font-bold uppercase tracking-widest mb-1"
                  style={{ color: '#c9b787' }}
                >
                  Evidence
                </div>
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {displayEvent.evidence}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Play className="w-8 h-8 mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
              <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Play the timeline or click an event to inspect
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
