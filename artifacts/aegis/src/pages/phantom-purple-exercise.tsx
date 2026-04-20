import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Clock,
  Crosshair,
  Eye,
  Pause,
  Play,
  RotateCcw,
  Shield,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const ACCENT = '#ef4444';
const RED_COLOR = '#ef4444';
const BLUE_COLOR = '#3b82f6';
const PHANTOM_ACCENT = '#a855f7';

const DS = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.06)',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    muted: 'rgba(255,255,255,0.25)',
  },
};

interface Move {
  id: string;
  tick: number;
  side: 'red' | 'blue';
  mitre?: string;
  action: string;
  detail: string;
  result: 'success' | 'blocked' | 'partial' | 'detected';
  relatedBlueId?: string;
  relatedRedId?: string;
}

const EXERCISE_MOVES: Move[] = [
  {
    id: 'r1',
    tick: 1,
    side: 'red',
    mitre: 'T1566.001',
    action: 'Spearphishing Attachment',
    detail: 'Weaponized XLSM sent to 3 finance execs — macro payload with stage-1 dropper',
    result: 'partial',
  },
  {
    id: 'b1',
    tick: 1,
    side: 'blue',
    action: 'Email Security Gateway',
    detail:
      'Advanced email filter flagged attachment as suspicious — quarantined for review, 1 of 3 delivered',
    result: 'partial',
    relatedRedId: 'r1',
  },
  {
    id: 'r2',
    tick: 2,
    side: 'red',
    mitre: 'T1059.001',
    action: 'PowerShell Execution',
    detail:
      'Macro triggers obfuscated PS script: -EncodedCommand bypass downloads stage-2 payload from CDN',
    result: 'success',
  },
  {
    id: 'b2',
    tick: 2,
    side: 'blue',
    action: 'EDR Script Monitoring',
    detail:
      'CrowdStrike detected PowerShell with -EncodedCommand — alert generated but not auto-blocked',
    result: 'detected',
    relatedRedId: 'r2',
  },
  {
    id: 'r3',
    tick: 3,
    side: 'red',
    mitre: 'T1547.001',
    action: 'Registry Run Key Persistence',
    detail:
      'Implant adds HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run — survives user logout',
    result: 'success',
  },
  {
    id: 'b3',
    tick: 3,
    side: 'blue',
    action: 'Registry Monitoring (Sysmon)',
    detail:
      'Sysmon Event ID 13 captured registry modification — logged but no alert threshold triggered',
    result: 'detected',
    relatedRedId: 'r3',
  },
  {
    id: 'r4',
    tick: 4,
    side: 'red',
    mitre: 'T1003.001',
    action: 'LSASS Memory Dump',
    detail:
      'Mimikatz sekurlsa::logonpasswords extracts 4 NTLM hashes including svc_admin domain account',
    result: 'success',
  },
  {
    id: 'b4',
    tick: 4,
    side: 'blue',
    action: 'Credential Guard',
    detail:
      'Credential Guard NOT enabled on this endpoint — LSASS dump succeeded. Detection only via SIEM alert (delayed 11 min)',
    result: 'partial',
    relatedRedId: 'r4',
  },
  {
    id: 'r5',
    tick: 5,
    side: 'red',
    mitre: 'T1550.002',
    action: 'Pass-the-Hash — Lateral',
    detail: 'PtH with svc_admin NTLM hash — connects to 7 servers via SMB. DC-PROD-02 reached.',
    result: 'success',
  },
  {
    id: 'b5',
    tick: 5,
    side: 'blue',
    action: 'Network Segmentation / SMB Signing',
    detail:
      'SMB signing NOT enforced — PtH attack succeeded. Lateral movement alert triggered by SIEM after 3 hops',
    result: 'partial',
    relatedRedId: 'r5',
  },
  {
    id: 'r6',
    tick: 6,
    side: 'red',
    mitre: 'T1567.002',
    action: 'Exfiltration to Cloud Storage',
    detail:
      '18.4GB staged data exfiltrated via OneDrive sync — HTTPS traffic blends with legitimate O365 usage',
    result: 'success',
  },
  {
    id: 'b6',
    tick: 6,
    side: 'blue',
    action: 'DLP + CASB Controls',
    detail:
      'DLP policy in alert-only mode — flagged anomalous OneDrive upload volume but did not block. CASB not deployed.',
    result: 'partial',
    relatedRedId: 'r6',
  },
  {
    id: 'r7',
    tick: 7,
    side: 'red',
    mitre: 'T1486',
    action: 'Data Encrypted for Impact',
    detail: 'Ransomware deployed via scheduled task — AES-256 encryption initiated on 89 servers',
    result: 'blocked',
  },
  {
    id: 'b7',
    tick: 7,
    side: 'blue',
    action: 'EDR Behavioral Detection',
    detail:
      'CrowdStrike Falcon blocked ransomware process tree via behavioral detection — mass file encryption prevented on 82 of 89 servers',
    result: 'success',
    relatedRedId: 'r7',
  },
];

interface GapFinding {
  id: string;
  category: string;
  finding: string;
  severity: 'critical' | 'high' | 'medium';
  control: string;
  recommendation: string;
}

const GAP_FINDINGS: GapFinding[] = [
  {
    id: 'g1',
    category: 'Identity & Access',
    finding: 'Credential Guard not enforced on endpoints — LSASS dumps possible',
    severity: 'critical',
    control: 'T1003 / Credential Access',
    recommendation: 'Enable Windows Credential Guard via Group Policy on all tier-1 endpoints',
  },
  {
    id: 'g2',
    category: 'Network Controls',
    finding: 'SMB signing not enforced — enables Pass-the-Hash lateral movement',
    severity: 'critical',
    control: 'T1550 / Lateral Movement',
    recommendation: 'Mandate SMB signing via GPO: RequireSecuritySignature=1 on all domain systems',
  },
  {
    id: 'g3',
    category: 'Data Loss Prevention',
    finding: 'DLP in alert-only mode — exfiltration to cloud storage not blocked',
    severity: 'high',
    control: 'T1567 / Exfiltration',
    recommendation:
      'Switch DLP policy from audit to block for anomalous volume uploads >500MB to unapproved destinations',
  },
  {
    id: 'g4',
    category: 'Email Security',
    finding: '1 of 3 phishing emails delivered — email gateway partial detection only',
    severity: 'high',
    control: 'T1566 / Initial Access',
    recommendation:
      'Enable Microsoft Defender Safe Attachments in block mode for all XLSM/XLSB file types',
  },
  {
    id: 'g5',
    category: 'Detection Latency',
    finding: 'SIEM credential theft alert fired 11 minutes post-compromise',
    severity: 'medium',
    control: 'T1003 / Credential Access',
    recommendation:
      'Deploy near-real-time LSASS process access alert rule with 60-second detection SLA',
  },
];

const SEV_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
};

function MoveCard({ move, pair, isActive }: { move: Move; pair?: Move; isActive: boolean }) {
  const isRed = move.side === 'red';
  const color = isRed ? RED_COLOR : BLUE_COLOR;
  const resultConfig: Record<string, { label: string; color: string }> = {
    success: { label: isRed ? 'SUCCESS' : 'DEFENDED', color: isRed ? RED_COLOR : BLUE_COLOR },
    blocked: { label: isRed ? 'BLOCKED' : 'BLOCKED', color: BLUE_COLOR },
    partial: { label: 'PARTIAL', color: '#f59e0b' },
    detected: { label: 'DETECTED', color: '#f59e0b' },
  };
  const rc = resultConfig[move.result];

  return (
    <div
      className="rounded-xl border p-3 transition-all"
      style={{
        borderColor: isActive ? `${color}40` : `${color}12`,
        background: isActive ? `${color}08` : 'rgba(255,255,255,0.02)',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold text-white truncate">{move.action}</div>
          {move.mitre && (
            <div className="text-[8px] font-mono mt-0.5" style={{ color: PHANTOM_ACCENT }}>
              {move.mitre}
            </div>
          )}
        </div>
        <span
          className="text-[8px] px-1.5 py-0.5 rounded font-bold shrink-0"
          style={{ background: `${rc.color}15`, color: rc.color }}
        >
          {rc.label}
        </span>
      </div>
      <p className="text-[9px] leading-relaxed" style={{ color: DS.text.muted }}>
        {move.detail}
      </p>
    </div>
  );
}

export default function PhantomPurpleExercise() {
  const [running, setRunning] = useState(false);
  const [currentTick, setCurrentTick] = useState(0);
  const [selectedGap, setSelectedGap] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxTick = Math.max(...EXERCISE_MOVES.map((m) => m.tick));

  function start() {
    setCurrentTick(0);
    setRunning(true);
    let tick = 0;
    intervalRef.current = setInterval(() => {
      tick += 1;
      setCurrentTick(tick);
      if (tick >= maxTick) {
        clearInterval(intervalRef.current!);
        setRunning(false);
      }
    }, 1600);
  }

  function reset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCurrentTick(0);
    setRunning(false);
  }

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    [],
  );

  const visibleRed = EXERCISE_MOVES.filter((m) => m.side === 'red' && m.tick <= currentTick);
  const visibleBlue = EXERCISE_MOVES.filter((m) => m.side === 'blue' && m.tick <= currentTick);

  const redSuccesses = visibleRed.filter((m) => m.result === 'success').length;
  const blueDefenses = visibleBlue.filter(
    (m) => m.result === 'success' || m.result === 'blocked',
  ).length;
  const partial = [...visibleRed, ...visibleBlue].filter(
    (m) => m.result === 'partial' || m.result === 'detected',
  ).length;

  const complete = currentTick >= maxTick && currentTick > 0;
  const selectedGapData = GAP_FINDINGS.find((g) => g.id === selectedGap);

  return (
    <div className="min-h-screen p-5 space-y-5" style={{ background: '#080B12' }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crosshair className="w-3.5 h-3.5" style={{ color: PHANTOM_ACCENT }} />
            <span
              className="text-[10px] font-bold uppercase tracking-widest font-mono"
              style={{ color: PHANTOM_ACCENT }}
            >
              PHANTOM · Purple Team
            </span>
          </div>
          <h1 className="text-xl font-bold text-white">Purple Team Exercise</h1>
          <p className="text-[11px] mt-0.5" style={{ color: DS.text.muted }}>
            Simultaneous red team attack + blue team defense visualization — DARPA-inspired
            adversarial co-simulation with gap analysis
          </p>
        </div>
        <div className="flex gap-2">
          {!running && currentTick === 0 && (
            <button
              onClick={start}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm"
              style={{
                background: 'rgba(168,85,247,0.2)',
                color: PHANTOM_ACCENT,
                border: '1px solid rgba(168,85,247,0.35)',
              }}
            >
              <Play className="w-4 h-4" /> Start Exercise
            </button>
          )}
          {running && (
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', color: DS.text.secondary }}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
          {complete && (
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm"
              style={{
                background: 'rgba(168,85,247,0.2)',
                color: PHANTOM_ACCENT,
                border: '1px solid rgba(168,85,247,0.35)',
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Run Again
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Red Team Successes',
            value: redSuccesses,
            color: RED_COLOR,
            sub: 'attack steps succeeded',
          },
          {
            label: 'Blue Team Defenses',
            value: blueDefenses,
            color: BLUE_COLOR,
            sub: 'attacks blocked or contained',
          },
          {
            label: 'Partial / Gaps',
            value: partial,
            color: '#f59e0b',
            sub: 'partial detections / coverage gaps',
          },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border p-4 text-center"
            style={{ borderColor: `${c.color}20`, background: `${c.color}06` }}
          >
            <div className="text-2xl font-bold font-mono" style={{ color: c.color }}>
              {c.value}
            </div>
            <div className="text-[10px] font-semibold mt-1 text-white">{c.label}</div>
            <div className="text-[9px] mt-0.5" style={{ color: DS.text.muted }}>
              {c.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div
          className="rounded-xl border"
          style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.03)' }}
        >
          <div
            className="flex items-center gap-2 px-4 py-3 border-b"
            style={{ borderColor: 'rgba(239,68,68,0.12)' }}
          >
            <Crosshair className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
              Red Team Moves
            </span>
            <span className="text-[8px] font-mono ml-auto text-red-400/60">APT29 Campaign</span>
          </div>
          <div className="p-3 space-y-2.5 max-h-96 overflow-y-auto">
            {currentTick === 0 && (
              <div className="py-8 text-center text-[11px]" style={{ color: DS.text.muted }}>
                Start exercise to begin simulation
              </div>
            )}
            {visibleRed.map((m) => (
              <MoveCard key={m.id} move={m} isActive={m.tick === currentTick} />
            ))}
          </div>
        </div>

        <div
          className="rounded-xl border"
          style={{ borderColor: 'rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.03)' }}
        >
          <div
            className="flex items-center gap-2 px-4 py-3 border-b"
            style={{ borderColor: 'rgba(59,130,246,0.12)' }}
          >
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
              Blue Team Response
            </span>
            <span className="text-[8px] font-mono ml-auto text-blue-400/60">SOC Defense Layer</span>
          </div>
          <div className="p-3 space-y-2.5 max-h-96 overflow-y-auto">
            {currentTick === 0 && (
              <div className="py-8 text-center text-[11px]" style={{ color: DS.text.muted }}>
                Blue team responses appear here
              </div>
            )}
            {visibleBlue.map((m) => (
              <MoveCard key={m.id} move={m} isActive={m.tick === currentTick} />
            ))}
          </div>
        </div>
      </div>

      {(complete || (GAP_FINDINGS.length > 0 && currentTick > 2)) && (
        <div
          className="rounded-xl border"
          style={{ borderColor: 'rgba(239,68,68,0.2)', background: DS.surface }}
        >
          <div
            className="flex items-center gap-2 px-4 py-3 border-b"
            style={{ borderColor: DS.border }}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white">
              Coverage Gap Analysis
            </span>
            <span
              className="text-[8px] px-1.5 py-0.5 rounded font-bold ml-auto"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
            >
              {GAP_FINDINGS.length} gaps identified
            </span>
          </div>
          <div className="grid grid-cols-12 gap-0">
            <div className="col-span-5 border-r divide-y" style={{ borderColor: DS.border }}>
              {GAP_FINDINGS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGap(g.id === selectedGap ? null : g.id)}
                  className="w-full text-left px-4 py-3 transition-colors hover:bg-white/[0.02]"
                  style={{
                    background: selectedGap === g.id ? 'rgba(239,68,68,0.05)' : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[8px] px-1.5 py-0.5 rounded font-bold"
                      style={{
                        background: `${SEV_COLORS[g.severity]}15`,
                        color: SEV_COLORS[g.severity],
                      }}
                    >
                      {g.severity.toUpperCase()}
                    </span>
                    <span className="text-[9px] font-mono" style={{ color: PHANTOM_ACCENT }}>
                      {g.control}
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-white">{g.category}</div>
                  <div className="text-[9px] mt-0.5" style={{ color: DS.text.muted }}>
                    {g.finding.slice(0, 70)}…
                  </div>
                </button>
              ))}
            </div>
            <div className="col-span-7 p-5">
              {selectedGapData ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-[9px] px-2 py-1 rounded font-bold"
                        style={{
                          background: `${SEV_COLORS[selectedGapData.severity]}15`,
                          color: SEV_COLORS[selectedGapData.severity],
                        }}
                      >
                        {selectedGapData.severity.toUpperCase()} SEVERITY
                      </span>
                      <span className="text-[9px] font-mono" style={{ color: PHANTOM_ACCENT }}>
                        {selectedGapData.control}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white">{selectedGapData.category}</h3>
                  </div>
                  <div>
                    <div
                      className="text-[9px] uppercase tracking-wider mb-1"
                      style={{ color: DS.text.muted }}
                    >
                      Gap Finding
                    </div>
                    <p
                      className="text-[11px] leading-relaxed"
                      style={{ color: 'rgba(255,255,255,0.75)' }}
                    >
                      {selectedGapData.finding}
                    </p>
                  </div>
                  <div
                    className="p-3 rounded-xl"
                    style={{
                      background: 'rgba(59,130,246,0.08)',
                      border: '1px solid rgba(59,130,246,0.2)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Shield className="w-3 h-3 text-blue-400" />
                      <span className="text-[9px] uppercase tracking-wider text-blue-400 font-bold">
                        Recommended Control
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-blue-200">
                      {selectedGapData.recommendation}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[11px]" style={{ color: DS.text.muted }}>
                    Select a gap finding to view details and remediation
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {running && (
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl border"
          style={{ borderColor: 'rgba(168,85,247,0.2)', background: 'rgba(168,85,247,0.05)' }}
        >
          <Activity className="w-3.5 h-3.5 animate-pulse" style={{ color: PHANTOM_ACCENT }} />
          <span className="text-[10px] font-mono" style={{ color: PHANTOM_ACCENT }}>
            Exercise running — phase {currentTick} of {maxTick}
          </span>
          <div
            className="flex-1 h-1.5 rounded-full mx-2"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(currentTick / maxTick) * 100}%`, background: PHANTOM_ACCENT }}
            />
          </div>
          <span className="text-[9px] font-mono" style={{ color: DS.text.muted }}>
            {Math.round((currentTick / maxTick) * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
