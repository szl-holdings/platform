import { useStandardQuery } from '@szl-holdings/api-client-react';

import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bug,
  ChevronRight,
  Clock,
  Crosshair,
  Download,
  Eye,
  HardDrive,
  Lock,
  Network,
  Pause,
  Play,
  Radio,
  Server,
  Shield,
  Target,
  Terminal,
  Upload,
  Wifi,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const KILL_CHAIN_STAGES = [
  {
    id: 'recon',
    label: 'Reconnaissance',
    shortLabel: 'Recon',
    mitre: 'TA0043',
    color: '#6366f1',
    techniques: [
      'T1595 — Active Scanning',
      'T1592 — Gather Host Info',
      'T1589 — Gather Victim Identity',
    ],
    icon: Eye,
    status: 'completed',
    timestamp: '2026-03-31 06:12:04',
    findings:
      'Attacker profiled 847 external-facing hosts. LinkedIn scraping identified 3 high-value targets in IT.',
  },
  {
    id: 'weaponize',
    label: 'Weaponization',
    shortLabel: 'Weaponize',
    mitre: 'TA0001',
    color: '#8b5cf6',
    techniques: [
      'T1566.002 — Spearphishing Link',
      'T1204.002 — Malicious File',
      'T1059.001 — PowerShell',
    ],
    icon: Bug,
    status: 'completed',
    timestamp: '2026-03-31 06:45:22',
    findings:
      'Crafted spearphishing email with weaponized Excel attachment (CVE-2024-21413). Payload: Cobalt Strike loader.',
  },
  {
    id: 'delivery',
    label: 'Delivery',
    shortLabel: 'Delivery',
    mitre: 'TA0001',
    color: '#a855f7',
    techniques: ['T1566.001 — Spearphishing Attachment', 'T1071.001 — Application Layer Protocol'],
    icon: Download,
    status: 'completed',
    timestamp: '2026-03-31 07:03:41',
    findings:
      'Email delivered to j.harrison@corp.com. Subject: Q1 Budget Review. Opened 07:03:41 UTC.',
  },
  {
    id: 'exploit',
    label: 'Exploitation',
    shortLabel: 'Exploit',
    mitre: 'TA0002',
    color: '#ef4444',
    techniques: [
      'T1203 — Exploitation for Client Execution',
      'T1059.001 — PowerShell',
      'CVE-2024-21413',
    ],
    icon: Terminal,
    status: 'completed',
    timestamp: '2026-03-31 07:04:15',
    findings:
      'CVE-2024-21413 triggered on WORKSTATION-142. powershell.exe spawned by EXCEL.EXE. AMSI bypass detected.',
  },
  {
    id: 'install',
    label: 'Installation',
    shortLabel: 'Install',
    mitre: 'TA0003',
    color: '#f97316',
    techniques: [
      'T1547.001 — Registry Run Keys',
      'T1055.012 — Process Hollowing',
      'T1027.009 — Embedded Payloads',
    ],
    icon: HardDrive,
    status: 'completed',
    timestamp: '2026-03-31 07:06:33',
    findings:
      'Cobalt Strike beacon implanted. Persistence via HKCU Run key. Process hollowing into svchost.exe.',
  },
  {
    id: 'c2',
    label: 'C2',
    shortLabel: 'C2',
    mitre: 'TA0011',
    color: '#f59e0b',
    techniques: [
      'T1071.001 — Web Protocols (HTTPS)',
      'T1132.001 — Standard Encoding',
      'T1573.001 — Symmetric Cryptography',
    ],
    icon: Radio,
    status: 'active',
    timestamp: '2026-03-31 07:07:12',
    findings:
      'HTTPS beacon to 103.45.67.89:443 (APT29 infra). 60s jitter. Encrypted with custom AES-256 key.',
  },
  {
    id: 'lateral',
    label: 'Lateral Movement',
    shortLabel: 'Lateral',
    mitre: 'TA0008',
    color: '#dc2626',
    techniques: [
      'T1021.002 — SMB/Windows Admin Shares',
      'T1075 — Pass-the-Hash',
      'T1097 — Pass the Ticket',
    ],
    icon: Network,
    status: 'active',
    timestamp: '2026-03-31 08:32:44',
    findings:
      'INVESTIGATING: Pass-the-hash to DC-PROD-03. NTLM hash harvested from WORKSTATION-142 memory.',
  },
  {
    id: 'exfil',
    label: 'Exfiltration',
    shortLabel: 'Exfil',
    mitre: 'TA0010',
    color: '#be123c',
    techniques: ['T1567.002 — Exfiltration to Cloud Storage', 'T1030 — Data Transfer Size Limits'],
    icon: Upload,
    status: 'blocked',
    timestamp: '—',
    findings:
      'BLOCKED: Aegis DLP prevented S3 upload of finance.zip (2.4GB). No exfiltration confirmed.',
  },
];

const PROCESS_TREE = [
  {
    id: 'explorer',
    name: 'explorer.exe',
    pid: 1204,
    user: 'j.harrison',
    depth: 0,
    status: 'normal',
  },
  {
    id: 'excel',
    name: 'EXCEL.EXE',
    pid: 3847,
    user: 'j.harrison',
    depth: 1,
    status: 'malicious',
    alert: 'Malicious attachment',
  },
  {
    id: 'powershell',
    name: 'powershell.exe',
    pid: 4021,
    user: 'j.harrison',
    depth: 2,
    status: 'critical',
    alert: 'AMSI bypass + encoded cmd',
  },
  {
    id: 'svchost',
    name: 'svchost.exe',
    pid: 4156,
    user: 'SYSTEM',
    depth: 3,
    status: 'critical',
    alert: 'Process hollowing — Cobalt Strike',
  },
  {
    id: 'net',
    name: 'net.exe',
    pid: 4288,
    user: 'SYSTEM',
    depth: 4,
    status: 'malicious',
    alert: 'Recon: net group /domain',
  },
  {
    id: 'cmd2',
    name: 'cmd.exe',
    pid: 4301,
    user: 'SYSTEM',
    depth: 4,
    status: 'malicious',
    alert: 'Spawned by hollowed svchost',
  },
  {
    id: 'mimikatz',
    name: 'lsass.exe [accessed]',
    pid: 612,
    user: 'SYSTEM',
    depth: 5,
    status: 'critical',
    alert: 'Credential dumping attempt',
  },
];

const DEFENDER_TIMELINE = [
  {
    time: '07:04:18',
    action: 'PowerShell execution blocked on WORKSTATION-142',
    type: 'detect',
    actor: 'Aegis Sensor',
  },
  {
    time: '07:04:22',
    action: 'AMSI bypass detected — alert escalated to P1',
    type: 'alert',
    actor: 'Watchdog AI',
  },
  {
    time: '07:06:41',
    action: 'Process hollowing detected in svchost.exe',
    type: 'detect',
    actor: 'Behavioral Engine',
  },
  {
    time: '07:07:15',
    action: 'C2 beacon to 103.45.67.89 flagged — IOC match',
    type: 'block',
    actor: 'Threat Intel Feed',
  },
  {
    time: '07:09:00',
    action: 'INC-2847 created — assigned to J. Chen (SOC L2)',
    type: 'action',
    actor: 'Aegis SOAR',
  },
  {
    time: '08:32:51',
    action: 'Lateral movement detected — Pass-the-Hash to DC-PROD-03',
    type: 'detect',
    actor: 'Identity Threat Engine',
  },
  {
    time: '08:33:04',
    action: 'DC-PROD-03 network isolation initiated',
    type: 'block',
    actor: 'Aegis SOAR Playbook',
  },
  {
    time: '08:45:12',
    action: 'S3 exfiltration blocked — DLP triggered on finance.zip',
    type: 'block',
    actor: 'DLP Engine',
  },
  {
    time: '09:10:00',
    action: 'WORKSTATION-142 memory dump collected for forensics',
    type: 'action',
    actor: 'J. Chen (SOC L2)',
  },
];

const ENDPOINTS_HIT = [
  {
    name: 'WORKSTATION-142',
    user: 'j.harrison',
    os: 'Windows 11 22H2',
    stage: 'Initial Access',
    risk: 96,
    contained: false,
  },
  {
    name: 'DC-PROD-03',
    user: 'SYSTEM',
    os: 'Windows Server 2022',
    stage: 'Lateral Movement',
    risk: 91,
    contained: true,
  },
  {
    name: 'FILE-SRV-01',
    user: 'SYSTEM',
    os: 'Windows Server 2019',
    stage: 'Discovery',
    risk: 64,
    contained: false,
  },
];

const stageColors: Record<string, string> = {
  completed: '#22c55e',
  active: '#f59e0b',
  blocked: '#ef4444',
  pending: 'rgba(255,255,255,0.15)',
};

interface LiveThreat {
  id: number;
  title: string;
  severity: string;
  status: string;
  createdAt: string;
}
interface LiveThreatsResponse {
  data: { incidents: LiveThreat[]; alerts: LiveThreat[]; fetchedAt: string };
}
interface ThreatSummaryResponse {
  data: {
    totalIncidents: number;
    totalAlerts: number;
    activeCritical: number;
    activeHigh: number;
    fetchedAt: string;
  };
}

export default function ThreatKillChain() {
  const [selectedStage, setSelectedStage] = useState<(typeof KILL_CHAIN_STAGES)[0] | null>(
    KILL_CHAIN_STAGES[5],
  );
  const [playMode, setPlayMode] = useState(false);
  const [activeStageIdx, setActiveStageIdx] = useState(5);

  const {
    data: liveThreats,
    isError: isThreatsError,
    dataUpdatedAt,
  } = useStandardQuery<LiveThreatsResponse>({
    queryKey: ['kill-chain-live-threats'],
    queryFn: () => apiFetch<LiveThreatsResponse>('/aegis/live/threats'),
    refetchInterval: 30000,
    retry: 1,
  });

  const { data: threatSummary } = useStandardQuery<ThreatSummaryResponse>({
    queryKey: ['kill-chain-threat-summary'],
    queryFn: () => apiFetch<ThreatSummaryResponse>('/aegis/live/threat-summary'),
    refetchInterval: 30000,
    retry: 1,
  });

  const liveIncidents = liveThreats?.data?.incidents ?? [];
  const liveSummary = threatSummary?.data;
  const isLive = !isThreatsError && liveIncidents.length > 0;

  useEffect(() => {
    if (!playMode) return;
    const t = setInterval(() => {
      setActiveStageIdx((i) => {
        const next = (i + 1) % KILL_CHAIN_STAGES.length;
        setSelectedStage(KILL_CHAIN_STAGES[next]);
        return next;
      });
    }, 2000);
    return () => clearInterval(t);
  }, [playMode]);

  const BG = '#070d14';
  const SURFACE = '#0a1118';
  const BORDER = 'rgba(255,255,255,0.06)';

  return (
    <div className="min-h-screen" style={{ background: BG, color: 'rgba(255,255,255,0.85)' }}>
      {/* Header */}
      <div
        className="px-6 py-4 border-b flex items-center justify-between"
        style={{ borderColor: BORDER, background: SURFACE }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <Crosshair className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Threat Kill Chain Analysis</h1>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                INC-2847 · APT29 Campaign · DC-PROD-03
              </p>
            </div>
          </div>
          <div className="h-4 w-px" style={{ background: BORDER }} />
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-[10px] font-mono text-red-400">ACTIVE INCIDENT · P1</span>
          </div>
          {liveSummary && (
            <>
              <div className="h-4 w-px" style={{ background: BORDER }} />
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span style={{ color: '#ef4444' }}>{liveSummary.activeCritical ?? 0} CRIT</span>
                <span style={{ color: '#f59e0b' }}>{liveSummary.activeHigh ?? 0} HIGH</span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {liveSummary.totalIncidents} incidents total
                </span>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {isLive ? (
              <Wifi className="w-3 h-3 text-green-400" />
            ) : (
              <WifiOff className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
            )}
            <span
              className="text-[9px] font-mono"
              style={{ color: isLive ? '#22c55e' : 'rgba(255,255,255,0.2)' }}
            >
              {isLive ? `LIVE · ${liveIncidents.length} incidents` : 'SIMULATION MODE'}
            </span>
          </div>
          <button
            onClick={() => setPlayMode((p) => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-medium transition-colors"
            style={{
              background: playMode ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)',
              color: playMode ? '#ef4444' : 'rgba(255,255,255,0.6)',
              border: `1px solid ${playMode ? 'rgba(239,68,68,0.25)' : BORDER}`,
            }}
          >
            {playMode ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {playMode ? 'Pause Replay' : 'Replay Attack'}
          </button>
          <div
            className="text-[10px] font-mono tabular-nums"
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            {dataUpdatedAt
              ? new Date(dataUpdatedAt).toISOString().slice(0, 19).replace('T', ' ')
              : new Date().toISOString().slice(0, 19).replace('T', ' ')}{' '}
            UTC
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Kill Chain Stages */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              ATT&CK Kill Chain · Lockheed Martin Framework
            </span>
          </div>
          <div className="flex items-stretch gap-0 overflow-x-auto pb-2">
            {KILL_CHAIN_STAGES.map((stage, i) => {
              const Icon = stage.icon;
              const isSelected = selectedStage?.id === stage.id;
              const isActive = i === activeStageIdx && playMode;
              return (
                <div key={stage.id} className="flex items-stretch shrink-0">
                  <button
                    onClick={() => {
                      setSelectedStage(stage);
                      setActiveStageIdx(i);
                    }}
                    className="relative flex flex-col items-start px-3.5 py-3 transition-all min-w-[120px]"
                    style={{
                      background:
                        isSelected || isActive ? `${stage.color}12` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isSelected || isActive ? `${stage.color}40` : BORDER}`,
                      borderRadius:
                        i === 0
                          ? '6px 0 0 6px'
                          : i === KILL_CHAIN_STAGES.length - 1
                            ? '0 6px 6px 0'
                            : '0',
                      borderLeft: i > 0 ? 'none' : undefined,
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Icon className="w-3 h-3" style={{ color: stage.color }} />
                      <span className="text-[9px] font-mono" style={{ color: `${stage.color}90` }}>
                        {stage.mitre}
                      </span>
                    </div>
                    <span
                      className="text-[11px] font-semibold text-left leading-tight"
                      style={{
                        color: isSelected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)',
                      }}
                    >
                      {stage.shortLabel}
                    </span>
                    <div className="flex items-center gap-1 mt-2">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: stageColors[stage.status] }}
                      />
                      <span
                        className="text-[8px] capitalize"
                        style={{ color: stageColors[stage.status] }}
                      >
                        {stage.status}
                      </span>
                    </div>
                    {/* Arrow connector */}
                    {i < KILL_CHAIN_STAGES.length - 1 && (
                      <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 w-5 h-5 flex items-center justify-center">
                        <ChevronRight
                          className="w-3 h-3"
                          style={{ color: 'rgba(255,255,255,0.2)' }}
                        />
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-12 gap-4">
          {/* Stage detail */}
          <div className="col-span-4 space-y-4">
            {selectedStage ? (
              <div
                className="rounded-lg overflow-hidden"
                style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
              >
                <div className="h-0.5" style={{ background: selectedStage.color }} />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">{selectedStage.label}</h3>
                      <p
                        className="text-[10px] font-mono mt-0.5"
                        style={{ color: `${selectedStage.color}80` }}
                      >
                        {selectedStage.mitre}
                      </p>
                    </div>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
                      style={{
                        color: stageColors[selectedStage.status],
                        background: `${stageColors[selectedStage.status]}15`,
                        border: `1px solid ${stageColors[selectedStage.status]}30`,
                      }}
                    >
                      {selectedStage.status}
                    </span>
                  </div>

                  <div
                    className="mb-3 p-3 rounded"
                    style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}` }}
                  >
                    <p
                      className="text-[10px] leading-relaxed"
                      style={{ color: 'rgba(255,255,255,0.6)' }}
                    >
                      {selectedStage.findings}
                    </p>
                  </div>

                  <div className="space-y-1 mb-3">
                    <p
                      className="text-[9px] uppercase tracking-wider font-semibold mb-1.5"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                    >
                      Observed Techniques
                    </p>
                    {selectedStage.techniques.map((t) => (
                      <div key={t} className="flex items-center gap-2">
                        <span
                          className="w-1 h-1 rounded-full shrink-0"
                          style={{ background: selectedStage.color }}
                        />
                        <span
                          className="text-[10px] font-mono"
                          style={{ color: 'rgba(255,255,255,0.5)' }}
                        >
                          {t}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div
                    className="flex items-center gap-1.5"
                    style={{ color: 'rgba(255,255,255,0.25)' }}
                  >
                    <Clock className="w-3 h-3" />
                    <span className="text-[9px] font-mono">{selectedStage.timestamp}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="rounded-lg h-40 flex items-center justify-center text-xs"
                style={{
                  background: SURFACE,
                  border: `1px solid ${BORDER}`,
                  color: 'rgba(255,255,255,0.2)',
                }}
              >
                Select a stage
              </div>
            )}

            {/* Impacted endpoints */}
            <div
              className="rounded-lg overflow-hidden"
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
            >
              <div
                className="px-3 py-2 border-b flex items-center gap-2"
                style={{ borderColor: BORDER }}
              >
                <Server className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[11px] font-semibold text-white">Impacted Endpoints</span>
              </div>
              <div className="divide-y" style={{ borderColor: BORDER }}>
                {ENDPOINTS_HIT.map((ep) => (
                  <div key={ep.name} className="px-3 py-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold text-white">
                          {ep.name}
                        </span>
                        {ep.contained && (
                          <span
                            className="text-[8px] px-1.5 py-0.5 rounded font-medium"
                            style={{
                              color: '#22c55e',
                              background: 'rgba(34,197,94,0.1)',
                              border: '1px solid rgba(34,197,94,0.2)',
                            }}
                          >
                            CONTAINED
                          </span>
                        )}
                      </div>
                      <span
                        className="text-xs font-bold font-mono"
                        style={{
                          color: ep.risk >= 90 ? '#ef4444' : ep.risk >= 70 ? '#f59e0b' : '#22c55e',
                        }}
                      >
                        {ep.risk}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-3 text-[9px]"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                    >
                      <span>{ep.user}</span>
                      <span>·</span>
                      <span>{ep.stage}</span>
                    </div>
                    <div
                      className="mt-1.5 h-1 rounded-full overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${ep.risk}%`,
                          background:
                            ep.risk >= 90 ? '#ef4444' : ep.risk >= 70 ? '#f59e0b' : '#22c55e',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Process tree */}
          <div
            className="col-span-4 rounded-lg overflow-hidden"
            style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
          >
            <div
              className="px-3 py-2 border-b flex items-center justify-between"
              style={{ borderColor: BORDER }}
            >
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-[11px] font-semibold text-white">Process Execution Tree</span>
              </div>
              <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                WORKSTATION-142 · j.harrison
              </span>
            </div>
            <div className="p-3 space-y-1.5 font-mono">
              {PROCESS_TREE.map((proc, _i) => (
                <div
                  key={proc.id}
                  className="flex items-start gap-2 group"
                  style={{ paddingLeft: `${proc.depth * 16}px` }}
                >
                  {proc.depth > 0 && (
                    <span
                      className="text-[9px] shrink-0 mt-0.5"
                      style={{ color: 'rgba(255,255,255,0.15)' }}
                    >
                      └─
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[11px] font-medium"
                        style={{
                          color:
                            proc.status === 'critical'
                              ? '#ef4444'
                              : proc.status === 'malicious'
                                ? '#f97316'
                                : 'rgba(255,255,255,0.6)',
                        }}
                      >
                        {proc.name}
                      </span>
                      <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                        PID:{proc.pid}
                      </span>
                    </div>
                    {proc.alert && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <AlertTriangle
                          className="w-2.5 h-2.5 shrink-0"
                          style={{ color: proc.status === 'critical' ? '#ef4444' : '#f97316' }}
                        />
                        <span
                          className="text-[9px]"
                          style={{ color: proc.status === 'critical' ? '#ef4444' : '#f97316' }}
                        >
                          {proc.alert}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Defender timeline */}
          <div
            className="col-span-4 rounded-lg overflow-hidden"
            style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
          >
            <div
              className="px-3 py-2 border-b flex items-center gap-2"
              style={{ borderColor: BORDER }}
            >
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] font-semibold text-white">
                Defender Response Timeline
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: BORDER }}>
              {DEFENDER_TIMELINE.map((event, i) => {
                const typeStyle = {
                  detect: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Eye },
                  alert: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: AlertTriangle },
                  block: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: Shield },
                  action: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: Zap },
                }[event.type] ?? {
                  color: 'rgba(255,255,255,0.4)',
                  bg: 'rgba(255,255,255,0.04)',
                  icon: Activity,
                };
                const TypeIcon = typeStyle.icon;
                return (
                  <div key={i} className="px-3 py-2.5 flex items-start gap-3">
                    <div
                      className="shrink-0 w-5 h-5 rounded flex items-center justify-center mt-0.5"
                      style={{ background: typeStyle.bg }}
                    >
                      <TypeIcon className="w-2.5 h-2.5" style={{ color: typeStyle.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[10px] leading-snug"
                        style={{ color: 'rgba(255,255,255,0.7)' }}
                      >
                        {event.action}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="text-[9px] font-mono"
                          style={{ color: 'rgba(255,255,255,0.25)' }}
                        >
                          {event.time}
                        </span>
                        <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                          ·
                        </span>
                        <span className="text-[9px]" style={{ color: typeStyle.color }}>
                          {event.actor}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Network map summary */}
        <div
          className="rounded-lg p-4"
          style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Network className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[11px] font-semibold text-white">
                Lateral Movement Graph — Internal Network
              </span>
            </div>
            <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              CORP subnet 10.0.0.0/16
            </span>
          </div>
          <div className="flex items-center justify-center gap-6 py-4">
            {[
              {
                node: 'WORKSTATION-142',
                ip: '10.0.1.142',
                status: 'initial',
                label: 'Initial Access',
              },
              { node: '→', ip: '', status: 'arrow', label: '' },
              { node: 'DC-PROD-03', ip: '10.0.0.3', status: 'contained', label: 'Contained' },
              { node: '⤵', ip: '', status: 'arrow', label: '' },
              { node: 'FILE-SRV-01', ip: '10.0.2.11', status: 'discovery', label: 'Discovery' },
              { node: '✗', ip: '', status: 'blocked', label: '' },
              { node: 'S3 Bucket', ip: 'aws.s3.ext', status: 'blocked', label: 'Exfil Blocked' },
            ].map((item, i) => {
              if (item.status === 'arrow') {
                return (
                  <ArrowRight
                    key={i}
                    className="w-4 h-4"
                    style={{ color: 'rgba(239,68,68,0.5)' }}
                  />
                );
              }
              if (item.status === 'blocked') {
                return (
                  <X
                    key={i}
                    className="w-5 h-5 rounded-full p-0.5"
                    style={{ color: '#22c55e', background: 'rgba(34,197,94,0.12)' }}
                  />
                );
              }
              const colors: Record<string, string> = {
                initial: '#ef4444',
                contained: '#f59e0b',
                discovery: '#f97316',
                blocked: '#22c55e',
              };
              const c = colors[item.status] ?? '#94a3b8';
              return (
                <div key={i} className="text-center">
                  <div
                    className="w-16 h-14 rounded-lg flex flex-col items-center justify-center mx-auto mb-1.5"
                    style={{ background: `${c}10`, border: `1px solid ${c}30` }}
                  >
                    <Server className="w-5 h-5" style={{ color: c }} />
                    {item.status === 'contained' && (
                      <Lock className="w-2.5 h-2.5 mt-0.5" style={{ color: '#f59e0b' }} />
                    )}
                  </div>
                  <p
                    className="text-[9px] font-mono font-bold"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    {item.node}
                  </p>
                  {item.ip && (
                    <p
                      className="text-[8px] font-mono mt-0.5"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                    >
                      {item.ip}
                    </p>
                  )}
                  <p className="text-[8px] mt-0.5" style={{ color: c }}>
                    {item.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ATT&CK heatmap summary */}
        <div
          className="rounded-lg p-4"
          style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[11px] font-semibold text-white">
              MITRE ATT&CK Coverage — Observed in This Incident
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { t: 'T1595', tactic: 'Recon', hot: false },
              { t: 'T1566', tactic: 'Initial Access', hot: true },
              { t: 'T1203', tactic: 'Execution', hot: true },
              { t: 'T1059', tactic: 'Execution', hot: true },
              { t: 'T1547', tactic: 'Persistence', hot: true },
              { t: 'T1055', tactic: 'Defense Evasion', hot: true },
              { t: 'T1003', tactic: 'Credential Access', hot: true },
              { t: 'T1046', tactic: 'Discovery', hot: false },
              { t: 'T1021', tactic: 'Lateral Movement', hot: true },
              { t: 'T1071', tactic: 'C2', hot: true },
              { t: 'T1567', tactic: 'Exfiltration', hot: false },
              { t: 'T1486', tactic: 'Impact', hot: false },
            ].map((item) => (
              <div
                key={item.t}
                className="flex flex-col items-start px-2.5 py-1.5 rounded text-[9px] font-mono"
                style={{
                  background: item.hot ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${item.hot ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.06)'}`,
                  color: item.hot ? '#ef4444' : 'rgba(255,255,255,0.35)',
                }}
              >
                <span className="font-bold">{item.t}</span>
                <span className="text-[7px] mt-0.5 opacity-70">{item.tactic}</span>
              </div>
            ))}
          </div>
          <p className="text-[9px] mt-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Red = observed · Gray = not seen in this incident
          </p>
        </div>
      </div>
    </div>
  );
}
