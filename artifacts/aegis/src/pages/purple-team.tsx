import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Crosshair,
  FileText,
  Play,
  RefreshCw,
  SlidersHorizontal,
  XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

const DS = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.06)',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    tertiary: 'rgba(255,255,255,0.28)',
    muted: 'rgba(255,255,255,0.14)',
  },
};

type SimStatus = 'idle' | 'running' | 'complete';
type PathResult = 'blocked' | 'success' | 'partial';

/* ─── Defense posture controls — toggling these changes simulation outcomes ─── */
interface DefenseControl {
  id: string;
  label: string;
  category: string;
  description: string;
  blocks: string[];
  partialBlocks?: string[];
  enabled: boolean;
}

const DEFAULT_CONTROLS: DefenseControl[] = [
  {
    id: 'email_filter',
    label: 'Advanced Email Filtering',
    category: 'Email',
    description: 'ML-based attachment scanning + Safe Attachments policy',
    blocks: [],
    partialBlocks: ['AP-001'],
    enabled: false,
  },
  {
    id: 'dmarc',
    label: 'DMARC Enforcement (p=reject)',
    category: 'Email',
    description: 'Full DMARC reject policy on all organizational domains',
    blocks: ['AP-001'],
    partialBlocks: [],
    enabled: false,
  },
  {
    id: 'edr_full',
    label: 'EDR Full Script Control',
    category: 'Endpoint',
    description: 'CrowdStrike Falcon script execution blocking + ASR rules',
    blocks: ['AP-002'],
    partialBlocks: [],
    enabled: true,
  },
  {
    id: 'sysmon',
    label: 'Sysmon + SIEM Detections',
    category: 'Detection',
    description: 'Sysmon v14 + tuned SIEM rules for scheduled task creation',
    blocks: ['AP-003'],
    partialBlocks: [],
    enabled: true,
  },
  {
    id: 'smb_signing',
    label: 'SMB Signing Enforced',
    category: 'Network',
    description: 'Mandatory SMB signing via GPO on all domain-joined systems',
    blocks: ['AP-004'],
    partialBlocks: [],
    enabled: false,
  },
  {
    id: 'laps',
    label: 'LAPS + Network Segmentation',
    category: 'Network',
    description: 'Local Admin Password Solution + restricted SMB traffic flow',
    blocks: [],
    partialBlocks: ['AP-004'],
    enabled: false,
  },
  {
    id: 'credential_guard',
    label: 'Windows Credential Guard',
    category: 'Identity',
    description: 'Credential Guard + PPL for LSASS + ASR credential steal block',
    blocks: ['AP-005'],
    partialBlocks: [],
    enabled: false,
  },
  {
    id: 'dlp_blocking',
    label: 'DLP Active Blocking',
    category: 'Data',
    description: 'DLP policy set to block (not just alert) on sensitive data egress',
    blocks: ['AP-006'],
    partialBlocks: [],
    enabled: false,
  },
  {
    id: 'dlp_alert',
    label: 'DLP Alert Policy',
    category: 'Data',
    description: 'DLP alerting on sensitive data patterns (delay before blocking)',
    blocks: [],
    partialBlocks: ['AP-006'],
    enabled: true,
  },
  {
    id: 'canary_files',
    label: 'Canary Files + Honeypots',
    category: 'Deception',
    description: 'Decoy files trigger instant SIEM alert on ransomware access',
    blocks: ['AP-007'],
    partialBlocks: [],
    enabled: true,
  },
];

/* ─── Attack path definitions with scoring model ─────────────────────────── */
interface AttackPath {
  id: string;
  tactic: string;
  technique: string;
  techniqueId: string;
  target: string;
  costToRemediate: number;
  costIfBreached: number;
}

const ATTACK_PATHS: AttackPath[] = [
  {
    id: 'AP-001',
    tactic: 'Initial Access',
    technique: 'Spearphishing Attachment',
    techniqueId: 'T1566.001',
    target: 'Finance Team Mailboxes',
    costToRemediate: 45_000,
    costIfBreached: 3_200_000,
  },
  {
    id: 'AP-002',
    tactic: 'Execution',
    technique: 'PowerShell Script Execution',
    techniqueId: 'T1059.001',
    target: 'WKS-FIN-047 (Finance)',
    costToRemediate: 28_000,
    costIfBreached: 1_800_000,
  },
  {
    id: 'AP-003',
    tactic: 'Persistence',
    technique: 'Scheduled Task / Job',
    techniqueId: 'T1053.005',
    target: 'WKS-FIN-047',
    costToRemediate: 12_000,
    costIfBreached: 900_000,
  },
  {
    id: 'AP-004',
    tactic: 'Lateral Movement',
    technique: 'Remote Services: SMB',
    techniqueId: 'T1021.002',
    target: 'DC-PROD-03 (Domain Controller)',
    costToRemediate: 320_000,
    costIfBreached: 14_200_000,
  },
  {
    id: 'AP-005',
    tactic: 'Credential Access',
    technique: 'OS Credential Dumping: LSASS',
    techniqueId: 'T1003.001',
    target: 'DC-PROD-03',
    costToRemediate: 180_000,
    costIfBreached: 8_600_000,
  },
  {
    id: 'AP-006',
    tactic: 'Exfiltration',
    technique: 'Exfiltration Over C2 Channel',
    techniqueId: 'T1041',
    target: 'Crown Jewels: IP Repository',
    costToRemediate: 95_000,
    costIfBreached: 22_000_000,
  },
  {
    id: 'AP-007',
    tactic: 'Impact',
    technique: 'Data Encrypted for Impact',
    techniqueId: 'T1486',
    target: 'File Servers FS-01 through FS-04',
    costToRemediate: 15_000,
    costIfBreached: 7_400_000,
  },
];

/* ─── Compute outcomes from defense posture ─────────────────────────────── */
interface ComputedResult {
  pathId: string;
  result: PathResult;
  detectionTime: number | null;
  blockedBy: string | null;
  remainingCost: number;
}

function computeSimulationResults(controls: DefenseControl[]): ComputedResult[] {
  return ATTACK_PATHS.map((path) => {
    const hardBlocking = controls.filter((c) => c.enabled && c.blocks.includes(path.id));
    const partialBlocking = controls.filter(
      (c) => c.enabled && (c.partialBlocks ?? []).includes(path.id),
    );

    if (hardBlocking.length > 0) {
      const ctrl = hardBlocking[0];
      const detectTime = Math.round(30 + Math.random() * 90);
      return {
        pathId: path.id,
        result: 'blocked',
        detectionTime: detectTime,
        blockedBy: ctrl.label,
        remainingCost: path.costToRemediate,
      };
    } else if (partialBlocking.length > 0) {
      const ctrl = partialBlocking[0];
      const detectTime = Math.round(300 + Math.random() * 600);
      return {
        pathId: path.id,
        result: 'partial',
        detectionTime: detectTime,
        blockedBy: `${ctrl.label} (partial)`,
        remainingCost: path.costToRemediate * 0.4 + path.costIfBreached * 0.3,
      };
    } else {
      return {
        pathId: path.id,
        result: 'success',
        detectionTime: null,
        blockedBy: null,
        remainingCost: path.costIfBreached,
      };
    }
  });
}

const TACTIC_ORDER = [
  'Initial Access',
  'Execution',
  'Persistence',
  'Lateral Movement',
  'Credential Access',
  'Exfiltration',
  'Impact',
];

const RESULT_COLORS: Record<PathResult, string> = {
  success: '#f5f5f5',
  partial: '#c9b787',
  blocked: '#c9b787',
};
const RESULT_LABELS: Record<PathResult, string> = {
  success: 'SUCCEEDED',
  partial: 'PARTIAL',
  blocked: 'BLOCKED',
};

const PLAYBOOKS: Record<string, { title: string; steps: string[] }> = {
  'AP-001': {
    title: 'Spearphishing Remediation Playbook',
    steps: [
      'Deploy Advanced Email Filtering with ML-based attachment scanning (Defender for O365 Plan 2)',
      'Enable DMARC enforcement: p=reject for all organizational sending domains',
      'Enable Safe Attachments policy with Dynamic Delivery for all mailboxes',
      'Conduct targeted phishing simulation for Finance team — 100% completion required',
      'Enable MFA for all email-enabled accounts (Microsoft Authenticator preferred)',
    ],
  },
  'AP-002': {
    title: 'PowerShell Execution Hardening Playbook',
    steps: [
      'Enable CrowdStrike Falcon script execution blocking in prevention policy',
      'Deploy ASR rule: Block execution of potentially obfuscated scripts',
      'Enable PowerShell Constrained Language Mode via GPO',
      'Enable Script Block Logging + transcription for all endpoints',
      'Alert on Base64-encoded PowerShell parameters in SIEM',
    ],
  },
  'AP-004': {
    title: 'Lateral Movement Containment Playbook',
    steps: [
      'Enforce SMB signing on all domain-joined Windows endpoints via GPO immediately',
      'Deploy LAPS to all workstations — remove shared local admin passwords',
      'Implement micro-segmentation: restrict SMB traffic to authorized jump hosts only',
      'Enable Credential Guard on all Windows 11/2019+ systems',
      'Require MFA for all remote service authentications including SMB over VPN',
    ],
  },
  'AP-005': {
    title: 'Credential Dumping Prevention Playbook',
    steps: [
      'Enable Windows Defender Credential Guard on all Domain Controllers immediately',
      'Set PPL (Protected Process Light) for LSASS via registry and GPO',
      'Deploy ASR rule: Block credential stealing from Windows local security authority',
      'Audit and rotate all Domain Admin and Service Account credentials',
      'Enable audit policy: Audit LSA secrets access — forward to SIEM',
    ],
  },
  'AP-006': {
    title: 'Exfiltration Prevention Playbook',
    steps: [
      'Switch DLP policy from Alert to Block mode for sensitive data classifications',
      'Enable CASB solution for all cloud egress (Defender for Cloud Apps)',
      'Inspect and block C2 traffic using SSL/TLS inspection at network perimeter',
      'Add threat intel feed integration for known C2 infrastructure IPs/domains',
      'Classify and tag all crown jewel IP repositories with automated sensitivity labels',
    ],
  },
};

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function SimProgress({ running, progress }: { running: boolean; progress: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {running && <span className="w-1.5 h-1.5 rounded-full bg-[#c9b787] animate-pulse" />}
          <span
            className="text-[10px] font-mono uppercase tracking-wider"
            style={{ color: running ? '#c9b787' : DS.text.tertiary }}
          >
            {running
              ? 'Simulation Running — testing attack paths against defense posture...'
              : progress === 100
                ? 'Simulation Complete'
                : 'Configure defense posture, then run simulation'}
          </span>
        </div>
        <span className="text-[10px] font-mono" style={{ color: DS.text.muted }}>
          {progress}%
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            background: running
              ? 'linear-gradient(90deg, #c9b787, #f5f5f5)'
              : progress === 100
                ? '#8a8a8a'
                : '#c9b787',
          }}
        />
      </div>
    </div>
  );
}

export default function PurpleTeam() {
  const [status, setStatus] = useState<SimStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [controls, setControls] = useState<DefenseControl[]>(DEFAULT_CONTROLS);
  const [results, setResults] = useState<ComputedResult[]>([]);
  const [selected, setSelected] = useState<{ path: AttackPath; result: ComputedResult } | null>(
    null,
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function toggleControl(id: string) {
    setControls((prev) => prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)));
    if (status === 'complete') {
      setStatus('idle');
      setProgress(0);
      setResults([]);
      setSelected(null);
    }
  }

  function startSim() {
    setStatus('running');
    setProgress(0);
    setResults([]);
    setSelected(null);
    const computed = computeSimulationResults(controls);
    let p = 0;
    intervalRef.current = setInterval(() => {
      p += Math.random() * 10 + 6;
      if (p >= 100) {
        p = 100;
        clearInterval(intervalRef.current!);
        setStatus('complete');
        setResults(computed);
      }
      setProgress(Math.round(p));
    }, 350);
  }

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    [],
  );

  const successCount = results.filter((r) => r.result === 'success').length;
  const partialCount = results.filter((r) => r.result === 'partial').length;
  const blockedCount = results.filter((r) => r.result === 'blocked').length;
  const totalExposure = results.reduce((s, r) => s + r.remainingCost, 0);

  const enabledCount = controls.filter((c) => c.enabled).length;
  const postureScore = Math.round((enabledCount / controls.length) * 100);

  const tacticsData = TACTIC_ORDER.map((tactic) => {
    const paths = ATTACK_PATHS.filter((p) => p.tactic === tactic);
    const pathResults = paths.map((p) => results.find((r) => r.pathId === p.id));
    return {
      tactic: tactic.split(' ')[0],
      success: pathResults.filter((r) => r?.result === 'success').length,
      partial: pathResults.filter((r) => r?.result === 'partial').length,
      blocked: pathResults.filter((r) => r?.result === 'blocked').length,
    };
  });

  const categories = [...new Set(controls.map((c) => c.category))];

  return (
    <div
      className="min-h-screen p-6 space-y-5"
      style={{ background: '#080B12', color: DS.text.primary }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: 'rgba(138,138,138,0.15)' }}
            >
              <Crosshair className="w-4 h-4 text-[#8a8a8a]" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">Autonomous Purple Team</h1>
          </div>
          <p className="text-sm" style={{ color: DS.text.secondary }}>
            Configure your defense posture — simulation computes MITRE ATT&CK outcomes from your
            actual controls
          </p>
        </div>
        <button
          onClick={startSim}
          disabled={status === 'running'}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: status === 'running' ? 'rgba(138,138,138,0.08)' : 'rgba(138,138,138,0.15)',
            border: '1px solid rgba(138,138,138,0.3)',
            color: status === 'running' ? '#8a8a8a' : '#c4b5fd',
            cursor: status === 'running' ? 'not-allowed' : 'pointer',
          }}
        >
          {status === 'running' ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {status === 'running' ? 'Running...' : 'Run Simulation'}
        </button>
      </div>

      {/* Progress */}
      <div
        className="rounded-xl p-4"
        style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
      >
        <SimProgress running={status === 'running'} progress={progress} />
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* Defense Posture Configuration */}
        <div className="col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5" style={{ color: '#8a8a8a' }} />
              <h2
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: DS.text.tertiary }}
              >
                Defense Posture Model
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="text-[10px] font-mono"
                style={{
                  color:
                    postureScore >= 70 ? '#c9b787' : postureScore >= 40 ? '#c9b787' : '#f5f5f5',
                }}
              >
                {postureScore}%
              </span>
              <span className="text-[10px]" style={{ color: DS.text.muted }}>
                posture
              </span>
            </div>
          </div>
          <p className="text-[10px]" style={{ color: DS.text.muted }}>
            Toggle controls to model your defense posture. The simulation computes which attack
            paths each control blocks or degrades.
          </p>
          {categories.map((cat) => (
            <div key={cat}>
              <p
                className="text-[9px] font-semibold uppercase tracking-widest mb-1.5"
                style={{ color: DS.text.muted }}
              >
                {cat}
              </p>
              <div className="space-y-1.5">
                {controls
                  .filter((c) => c.category === cat)
                  .map((ctrl) => (
                    <button
                      key={ctrl.id}
                      onClick={() => toggleControl(ctrl.id)}
                      className="w-full text-left rounded-lg p-3 transition-all"
                      style={{
                        background: ctrl.enabled
                          ? 'rgba(201,183,135,0.06)'
                          : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${ctrl.enabled ? 'rgba(201,183,135,0.2)' : DS.border}`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded shrink-0 flex items-center justify-center"
                          style={{
                            background: ctrl.enabled
                              ? 'rgba(201,183,135,0.2)'
                              : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${ctrl.enabled ? 'rgba(201,183,135,0.4)' : DS.border}`,
                          }}
                        >
                          {ctrl.enabled && <CheckCircle className="w-3 h-3 text-[#c9b787]" />}
                        </div>
                        <span
                          className="text-[11px] font-medium flex-1"
                          style={{ color: ctrl.enabled ? DS.text.primary : DS.text.secondary }}
                        >
                          {ctrl.label}
                        </span>
                      </div>
                      <p className="text-[9px] mt-1 ml-6" style={{ color: DS.text.muted }}>
                        {ctrl.description}
                      </p>
                      {ctrl.blocks.length > 0 && (
                        <div className="flex gap-1 mt-1.5 ml-6">
                          <span className="text-[8px] text-[#c9b787]/60">Blocks:</span>
                          {ctrl.blocks.map((b) => (
                            <span
                              key={b}
                              className="text-[8px] font-mono text-[#c9b787]/80 px-1 rounded"
                              style={{ background: 'rgba(201,183,135,0.08)' }}
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      )}
                      {ctrl.partialBlocks && ctrl.partialBlocks.length > 0 && (
                        <div className="flex gap-1 mt-1 ml-6">
                          <span className="text-[8px] text-[#c9b787]/60">Degrades:</span>
                          {ctrl.partialBlocks.map((b) => (
                            <span
                              key={b}
                              className="text-[8px] font-mono text-[#c9b787]/80 px-1 rounded"
                              style={{ background: 'rgba(201,183,135,0.08)' }}
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Results panel */}
        <div className="col-span-3 space-y-4">
          {/* KPI Strip */}
          {status !== 'idle' && (
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Paths Tested', value: ATTACK_PATHS.length, color: '#8a8a8a' },
                { label: 'Succeeded', value: successCount, color: '#f5f5f5' },
                { label: 'Partial', value: partialCount, color: '#c9b787' },
                { label: 'Blocked', value: blockedCount, color: '#c9b787' },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="rounded-xl p-3"
                  style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
                >
                  <div className="text-[10px] mb-1" style={{ color: DS.text.tertiary }}>
                    {label}
                  </div>
                  <div className="text-xl font-bold font-mono" style={{ color }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {status === 'complete' && (
            <div
              className="rounded-xl p-3"
              style={{
                background: 'rgba(245,245,245,0.04)',
                border: '1px solid rgba(245,245,245,0.12)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: DS.text.secondary }}>
                  Remaining breach exposure with current posture
                </span>
                <span className="text-lg font-bold font-mono text-[#f5f5f5]">
                  {fmt(totalExposure)}
                </span>
              </div>
            </div>
          )}

          {/* Attack path results */}
          <div className="space-y-2">
            <h2
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: DS.text.tertiary }}
            >
              Attack Path Results
            </h2>
            {ATTACK_PATHS.map((path) => {
              const result = results.find((r) => r.pathId === path.id);
              const isSelected = selected?.path.id === path.id;
              const isRevealed = status === 'complete' && !!result;
              return (
                <button
                  key={path.id}
                  onClick={() =>
                    isRevealed && setSelected(isSelected ? null : { path, result: result! })
                  }
                  className="w-full text-left rounded-xl p-4 transition-all"
                  style={{
                    background: isSelected ? 'rgba(138,138,138,0.06)' : DS.surface,
                    border: `1px solid ${isSelected ? 'rgba(138,138,138,0.25)' : DS.border}`,
                    opacity: status === 'running' ? 0.5 : 1,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {!isRevealed ? (
                        <Clock className="w-4 h-4" style={{ color: DS.text.muted }} />
                      ) : result?.result === 'success' ? (
                        <XCircle className="w-4 h-4 text-[#f5f5f5]" />
                      ) : result?.result === 'partial' ? (
                        <AlertTriangle className="w-4 h-4 text-[#c9b787]" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-[#c9b787]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(255,255,255,0.05)', color: DS.text.tertiary }}
                        >
                          {path.tactic}
                        </span>
                        <span className="text-[9px] font-mono" style={{ color: DS.text.muted }}>
                          {path.techniqueId}
                        </span>
                      </div>
                      <p className="text-xs font-medium">{path.technique}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: DS.text.secondary }}>
                        {path.target}
                      </p>
                      {isRevealed && result?.blockedBy && (
                        <p className="text-[10px] mt-1" style={{ color: '#c9b787' }}>
                          {result?.result === 'partial' ? 'Degraded by' : 'Blocked by'}:{' '}
                          {result?.blockedBy} · {result?.detectionTime}s detection
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {isRevealed && (
                        <Badge
                          className="text-[9px] px-1.5 py-0"
                          style={{
                            background: `${RESULT_COLORS[result?.result]}15`,
                            color: RESULT_COLORS[result?.result],
                            border: `1px solid ${RESULT_COLORS[result?.result]}25`,
                          }}
                        >
                          {RESULT_LABELS[result?.result]}
                        </Badge>
                      )}
                      {isRevealed && (
                        <span
                          className="text-[9px] font-mono"
                          style={{
                            color: result?.result === 'success' ? '#f5f5f5' : DS.text.muted,
                          }}
                        >
                          {fmt(result?.remainingCost)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Tactic chart + playbook */}
          {status === 'complete' && (
            <div className="grid grid-cols-2 gap-4">
              <div
                className="rounded-xl p-4"
                style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
              >
                <h3
                  className="text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: DS.text.tertiary }}
                >
                  Results by Tactic
                </h3>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tacticsData} layout="vertical" margin={{ left: 0, right: 10 }}>
                      <XAxis
                        type="number"
                        tick={{ fill: DS.text.muted, fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        dataKey="tactic"
                        type="category"
                        tick={{ fill: DS.text.secondary, fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                        width={70}
                      />
                      <Bar dataKey="success" stackId="a" fill="#f5f5f5" fillOpacity={0.8} />
                      <Bar dataKey="partial" stackId="a" fill="#c9b787" fillOpacity={0.8} />
                      <Bar
                        dataKey="blocked"
                        stackId="a"
                        fill="#c9b787"
                        fillOpacity={0.8}
                        radius={[0, 3, 3, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {selected && PLAYBOOKS[selected.path.id] ? (
                <div
                  className="rounded-xl p-4"
                  style={{ background: DS.surface, border: '1px solid rgba(138,138,138,0.2)' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-[#8a8a8a]" />
                    <h3 className="text-[10px] font-semibold text-[#8a8a8a]">
                      {PLAYBOOKS[selected.path.id].title}
                    </h3>
                  </div>
                  <div className="space-y-1.5">
                    {PLAYBOOKS[selected.path.id].steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span
                          className="text-[9px] font-mono mt-0.5 w-4 shrink-0"
                          style={{ color: '#8a8a8a' }}
                        >
                          {i + 1}.
                        </span>
                        <p
                          className="text-[10px] leading-relaxed"
                          style={{ color: DS.text.secondary }}
                        >
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div
                    className="mt-3 pt-3 space-y-1"
                    style={{ borderTop: `1px solid ${DS.border}` }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px]" style={{ color: DS.text.muted }}>
                        Remediation cost
                      </span>
                      <span className="text-xs font-mono font-bold text-[#c9b787]">
                        {fmt(selected.path.costToRemediate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px]" style={{ color: DS.text.muted }}>
                        Cost if breached
                      </span>
                      <span className="text-xs font-mono font-bold text-[#f5f5f5]">
                        {fmt(selected.path.costIfBreached)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="rounded-xl p-4 flex flex-col items-center justify-center text-center"
                  style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
                >
                  <FileText className="w-8 h-8 mb-2" style={{ color: DS.text.muted }} />
                  <p className="text-xs" style={{ color: DS.text.tertiary }}>
                    Select an attack path to view its remediation playbook
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
