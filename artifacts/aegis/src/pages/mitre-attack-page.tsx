import { useStandardQuery } from '@szl-holdings/api-client-react';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  Eye,
  Grid3X3,
  Shield,
  Target,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/api';

const tactics = [
  {
    id: 'TA0001',
    name: 'Initial Access',
    shortName: 'Initial Access',
    techniques: ['T1566.001', 'T1190', 'T1133', 'T1078', 'T1195.002', 'T1189'],
  },
  {
    id: 'TA0002',
    name: 'Execution',
    shortName: 'Execution',
    techniques: ['T1059.001', 'T1059.003', 'T1204', 'T1053', 'T1047'],
  },
  {
    id: 'TA0003',
    name: 'Persistence',
    shortName: 'Persistence',
    techniques: ['T1547', 'T1053', 'T1136', 'T1505.003', 'T1078'],
  },
  {
    id: 'TA0004',
    name: 'Privilege Escalation',
    shortName: 'Priv. Esc.',
    techniques: ['T1548', 'T1134', 'T1078.004', 'T1055', 'T1611'],
  },
  {
    id: 'TA0005',
    name: 'Defense Evasion',
    shortName: 'Defense Evasion',
    techniques: ['T1070', 'T1036', 'T1027', 'T1562', 'T1055'],
  },
  {
    id: 'TA0006',
    name: 'Credential Access',
    shortName: 'Credential Access',
    techniques: ['T1003.001', 'T1110.001', 'T1110.003', 'T1555', 'T1557'],
  },
  {
    id: 'TA0007',
    name: 'Discovery',
    shortName: 'Discovery',
    techniques: ['T1087', 'T1082', 'T1046', 'T1083', 'T1135'],
  },
  {
    id: 'TA0008',
    name: 'Lateral Movement',
    shortName: 'Lateral Movement',
    techniques: ['T1021.002', 'T1550', 'T1570', 'T1563', 'T1080'],
  },
  {
    id: 'TA0009',
    name: 'Collection',
    shortName: 'Collection',
    techniques: ['T1560', 'T1005', 'T1039', 'T1074', 'T1113'],
  },
  {
    id: 'TA0011',
    name: 'Command & Control',
    shortName: 'C2',
    techniques: ['T1071.001', 'T1573', 'T1105', 'T1571', 'T1572'],
  },
  {
    id: 'TA0010',
    name: 'Exfiltration',
    shortName: 'Exfiltration',
    techniques: ['T1041', 'T1048.001', 'T1567.002', 'T1029', 'T1030'],
  },
  {
    id: 'TA0040',
    name: 'Impact',
    shortName: 'Impact',
    techniques: ['T1486', 'T1485', 'T1490', 'T1489', 'T1561'],
  },
];

const techniqueNames: Record<string, string> = {
  'T1566.001': 'Spearphishing Attachment',
  T1190: 'Exploit Public App',
  T1133: 'External Remote Svc',
  T1078: 'Valid Accounts',
  'T1195.002': 'Supply Chain',
  T1189: 'Drive-by Compromise',
  'T1059.001': 'PowerShell',
  'T1059.003': 'Cmd Shell',
  T1204: 'User Execution',
  T1053: 'Scheduled Task',
  T1047: 'WMI',
  T1547: 'Boot Autostart',
  T1136: 'Create Account',
  'T1505.003': 'Web Shell',
  'T1078.004': 'Cloud Accounts',
  T1548: 'Abuse Elevation',
  T1134: 'Access Token',
  T1055: 'Process Injection',
  T1611: 'Container Escape',
  T1070: 'Indicator Removal',
  T1036: 'Masquerading',
  T1027: 'Obfuscated Files',
  T1562: 'Impair Defenses',
  T1218: 'Sys Binary Proxy',
  'T1003.001': 'LSASS Memory',
  'T1110.001': 'Password Guess',
  'T1110.003': 'Password Spray',
  T1555: 'Creds from Stores',
  T1557: 'Adv-in-the-Middle',
  T1087: 'Account Discovery',
  T1082: 'System Info',
  T1046: 'Network Service Scan',
  T1083: 'File Discovery',
  T1135: 'Network Share',
  'T1021.002': 'SMB/Admin Shares',
  T1550: 'Alt Auth Material',
  T1570: 'Lateral Tool Transfer',
  T1563: 'Remote Session',
  T1080: 'Taint Shared Content',
  T1560: 'Archive Data',
  T1005: 'Data from Local Sys',
  T1039: 'Network Share Data',
  T1074: 'Data Staged',
  T1113: 'Screen Capture',
  'T1071.001': 'Web Protocols (C2)',
  T1573: 'Encrypted Channel',
  T1105: 'Ingress Tool',
  T1571: 'Non-Standard Port',
  T1572: 'Protocol Tunneling',
  T1041: 'Exfil Over C2',
  'T1048.001': 'Exfil Over DNS',
  'T1567.002': 'Exfil to Cloud',
  T1029: 'Scheduled Transfer',
  T1030: 'Data Transfer Size',
  T1486: 'Data Encrypted',
  T1485: 'Data Destruction',
  T1490: 'Inhibit Recovery',
  T1489: 'Service Stop',
  T1561: 'Disk Wipe',
};

function getHeatStyle(count: number, maxCount: number): { bg: string; text: string; ring: string } {
  if (count === 0)
    return { bg: 'rgba(255,255,255,0.04)', text: 'text-muted-foreground/30', ring: '' };
  const ratio = count / maxCount;
  if (ratio >= 0.8)
    return { bg: 'rgba(239,68,68,0.85)', text: 'text-white', ring: 'ring-1 ring-red-400/50' };
  if (ratio >= 0.6)
    return { bg: 'rgba(239,68,68,0.60)', text: 'text-white', ring: 'ring-1 ring-red-400/30' };
  if (ratio >= 0.4)
    return { bg: 'rgba(249,115,22,0.55)', text: 'text-white', ring: 'ring-1 ring-orange-400/30' };
  if (ratio >= 0.2)
    return { bg: 'rgba(234,179,8,0.45)', text: 'text-white', ring: 'ring-1 ring-yellow-400/30' };
  return { bg: 'rgba(234,179,8,0.18)', text: 'text-amber-300', ring: '' };
}

interface DrillDownProps {
  techniqueId: string;
  techniqueName: string;
  tactic: string;
  detection: any;
  onClose: () => void;
}

function DrillDownPanel({
  techniqueId,
  techniqueName,
  tactic,
  detection,
  onClose,
}: DrillDownProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#0A0D14] border border-white/10 rounded-xl w-full max-w-2xl mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono text-red-400/60 uppercase tracking-widest">
                {tactic}
              </span>
              <span className="text-red-500/20">·</span>
              <span className="text-[10px] font-mono text-muted-foreground/50">{techniqueId}</span>
            </div>
            <h2 className="font-display text-base font-bold text-foreground">{techniqueName}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-red-500/5 border border-red-500/15 rounded-lg p-3">
              <div className="text-[10px] text-muted-foreground font-mono mb-1">DETECTIONS</div>
              <div className="text-2xl font-bold text-red-400 font-display">
                {detection?.detectionCount ?? 0}
              </div>
              <div className="text-[9px] text-muted-foreground">total events</div>
            </div>
            <div className="bg-orange-500/5 border border-orange-500/15 rounded-lg p-3">
              <div className="text-[10px] text-muted-foreground font-mono mb-1">INCIDENTS</div>
              <div className="text-2xl font-bold text-orange-400 font-display">
                {detection?.incidentCount ?? 0}
              </div>
              <div className="text-[9px] text-muted-foreground">linked incidents</div>
            </div>
            <div className="bg-blue-500/5 border border-blue-500/15 rounded-lg p-3">
              <div className="text-[10px] text-muted-foreground font-mono mb-1">COVERAGE</div>
              <div
                className={cn(
                  'text-xl font-bold font-display',
                  detection?.coverageStatus === 'detected'
                    ? 'text-emerald-400'
                    : detection?.coverageStatus === 'partial'
                      ? 'text-amber-400'
                      : 'text-red-400/50',
                )}
              >
                {detection?.coverageStatus === 'detected'
                  ? 'Full'
                  : detection?.coverageStatus === 'partial'
                    ? 'Partial'
                    : 'None'}
              </div>
              <div className="text-[9px] text-muted-foreground">detection coverage</div>
            </div>
          </div>
          {detection?.lastDetectedAt && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="w-3.5 h-3.5 text-red-400" />
              Last detected: {new Date(detection.lastDetectedAt).toLocaleString()}
            </div>
          )}
          <div className="bg-white/5 rounded-lg p-3 space-y-2">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              ATT&CK Reference
            </div>
            <a
              href={`https://attack.mitre.org/techniques/${techniqueId.replace('.', '/')}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              attack.mitre.org/techniques/{techniqueId} <ChevronRight className="w-3 h-3" />
            </a>
          </div>
          {!detection && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/5 border border-red-500/10 text-xs text-red-400/70">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              No active detection rule for this technique — coverage gap identified
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MitreAttackPage() {
  const [selectedTechnique, setSelectedTechnique] = useState<{
    id: string;
    name: string;
    tactic: string;
    detection: any;
  } | null>(null);

  const { data: detections = [], isLoading } = useStandardQuery({
    queryKey: ['mitre-detections'],
    queryFn: () => api.mitreDetections.list(),
  });

  const detectionMap = new Map<string, any>();
  detections.forEach((d: any) => {
    detectionMap.set(d.techniqueId, d);
  });

  const maxCount = Math.max(...detections.map((d: any) => d.detectionCount), 1);

  const totalTechniques = tactics.reduce((s, t) => s + t.techniques.length, 0);
  const covered = tactics.reduce(
    (s, t) =>
      s +
      t.techniques.filter((tech) => {
        const d = detectionMap.get(tech);
        return d && d.coverageStatus !== 'not_covered';
      }).length,
    0,
  );
  const fullyCovered = tactics.reduce(
    (s, t) =>
      s +
      t.techniques.filter((tech) => {
        const d = detectionMap.get(tech);
        return d && d.coverageStatus === 'detected';
      }).length,
    0,
  );
  const totalDetections = detections.reduce((s: number, d: any) => s + d.detectionCount, 0);
  const coverage = totalTechniques > 0 ? Math.round((covered / totalTechniques) * 100) : 0;

  return (
    <div className="p-5 space-y-5">
      {selectedTechnique && (
        <DrillDownPanel
          techniqueId={selectedTechnique.id}
          techniqueName={selectedTechnique.name}
          tactic={selectedTechnique.tactic}
          detection={selectedTechnique.detection}
          onClose={() => setSelectedTechnique(null)}
        />
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-mono text-red-400/50 uppercase tracking-widest">
              Aegis / MITRE
            </span>
            <span className="text-red-500/20">·</span>
            <span className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest">
              Detection Coverage
            </span>
          </div>
          <h1 className="font-display text-xl font-bold flex items-center gap-2.5">
            <Grid3X3 className="w-5 h-5 text-red-400" /> MITRE ATT&CK Matrix
          </h1>
          <p className="text-[11px] text-muted-foreground mt-1">
            Real detection counts mapped to ATT&CK techniques — click any cell to drill down
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-mono"
          >
            {fullyCovered} Full Coverage
          </Badge>
          <Badge
            variant="outline"
            className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] font-mono"
          >
            {covered - fullyCovered} Partial
          </Badge>
          <Badge
            variant="outline"
            className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] font-mono"
          >
            {totalTechniques - covered} Gaps
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'ATT&CK Coverage',
            value: `${coverage}%`,
            sub: `${covered} of ${totalTechniques} techniques`,
            color: 'text-emerald-400',
            icon: Shield,
          },
          {
            label: 'Total Detections',
            value: isLoading ? '—' : totalDetections.toLocaleString(),
            sub: 'across all techniques',
            color: 'text-red-400',
            icon: Activity,
          },
          {
            label: 'Unique Techniques',
            value: isLoading ? '—' : String(fullyCovered),
            sub: 'with active detection rules',
            color: 'text-blue-400',
            icon: Eye,
          },
          {
            label: 'Coverage Gaps',
            value: isLoading ? '—' : String(totalTechniques - covered),
            sub: 'techniques without detections',
            color: 'text-orange-400',
            icon: AlertTriangle,
          },
        ].map(({ label, value, sub, color, icon: Icon }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={cn('w-3.5 h-3.5', color)} />
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                {label}
              </span>
            </div>
            <div className={cn('text-2xl font-bold font-display', color)}>{value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Target className="w-4 h-4 text-red-400" />
            <span className="font-display font-semibold text-sm text-foreground">
              ATT&CK Heatmap
            </span>
            <Badge
              variant="outline"
              className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20 ml-1"
            >
              {isLoading ? 'Loading...' : `${totalDetections} detections · 30-day window`}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span
                className="w-3 h-2 rounded-sm inline-block"
                style={{ backgroundColor: 'rgba(239,68,68,0.85)' }}
              />
              High Volume
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="w-3 h-2 rounded-sm inline-block"
                style={{ backgroundColor: 'rgba(234,179,8,0.30)' }}
              />
              Low Activity
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="w-3 h-2 rounded-sm inline-block"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
              />
              No Coverage
            </span>
          </div>
        </div>
        <div className="p-4 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-red-500/40 border-t-red-400 rounded-full animate-spin" />
            </div>
          ) : (
            <div
              className="grid gap-1.5 min-w-[900px]"
              style={{ gridTemplateColumns: `repeat(${tactics.length}, 1fr)` }}
            >
              {tactics.map((tactic) => (
                <div key={tactic.id} className="space-y-1">
                  <div
                    className="text-[9px] font-mono text-red-400/70 uppercase tracking-wide text-center py-1 px-1 truncate"
                    title={tactic.name}
                  >
                    {tactic.shortName}
                  </div>
                  {tactic.techniques.map((techId) => {
                    const detection = detectionMap.get(techId);
                    const count = detection?.detectionCount ?? 0;
                    const { bg, text, ring } = getHeatStyle(count, maxCount);
                    const name = techniqueNames[techId] ?? techId;
                    return (
                      <button
                        key={techId}
                        onClick={() =>
                          setSelectedTechnique({
                            id: techId,
                            name,
                            tactic: tactic.name,
                            detection: detection ?? null,
                          })
                        }
                        className={cn(
                          'w-full rounded-md px-1 py-2 text-center transition-all hover:scale-105 hover:z-10 relative hover:brightness-125 active:scale-100',
                          ring,
                        )}
                        style={{ backgroundColor: bg }}
                        title={`${tactic.name} › ${name} (${techId}): ${count} detection${count !== 1 ? 's' : ''}`}
                      >
                        <div className={cn('text-[8px] leading-tight truncate font-medium', text)}>
                          {name}
                        </div>
                        <div
                          className={cn(
                            'text-[11px] font-bold font-mono mt-0.5',
                            text,
                            count === 0 && 'opacity-40',
                          )}
                        >
                          {count}
                        </div>
                        {count > 0 && (
                          <div className={cn('text-[7px] font-mono mt-0.5', text, 'opacity-70')}>
                            {techId}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <Activity className="w-4 h-4 text-red-400" />
            <span className="font-display font-semibold text-sm">Top Active Techniques</span>
          </div>
          <div className="divide-y divide-border/40">
            {[...detections]
              .sort((a: any, b: any) => b.detectionCount - a.detectionCount)
              .slice(0, 8)
              .map((d: any) => (
                <button
                  key={d.techniqueId}
                  onClick={() =>
                    setSelectedTechnique({
                      id: d.techniqueId,
                      name: d.techniqueName,
                      tactic: d.tactic,
                      detection: d,
                    })
                  }
                  className="w-full px-5 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-12 text-[10px] font-mono text-muted-foreground/70 shrink-0">
                    {d.techniqueId}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">
                      {d.techniqueName}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{d.tactic}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="h-1.5 w-16 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-red-400"
                        style={{ width: `${Math.min((d.detectionCount / maxCount) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold font-mono text-red-400 w-6 text-right">
                      {d.detectionCount}
                    </span>
                  </div>
                </button>
              ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <span className="font-display font-semibold text-sm">Coverage Gaps</span>
            <Badge
              variant="outline"
              className="text-[10px] bg-orange-500/10 text-orange-400 border-orange-500/20 ml-auto"
            >
              {totalTechniques - covered} techniques uncovered
            </Badge>
          </div>
          <div className="divide-y divide-border/40">
            {tactics
              .flatMap((tactic) =>
                tactic.techniques
                  .filter((tech) => {
                    const d = detectionMap.get(tech);
                    return !d || d.coverageStatus === 'not_covered';
                  })
                  .slice(0, 2)
                  .map((tech) => ({ tech, tacticName: tactic.name })),
              )
              .slice(0, 8)
              .map(({ tech, tacticName }) => (
                <button
                  key={tech}
                  onClick={() =>
                    setSelectedTechnique({
                      id: tech,
                      name: techniqueNames[tech] ?? tech,
                      tactic: tacticName,
                      detection: null,
                    })
                  }
                  className="w-full px-5 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-12 text-[10px] font-mono text-muted-foreground/50 shrink-0">
                    {tech}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-muted-foreground truncate">
                      {techniqueNames[tech] ?? tech}
                    </div>
                    <div className="text-[10px] text-muted-foreground/60">{tacticName}</div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[9px] bg-red-500/10 text-red-400/70 border-red-500/20 shrink-0"
                  >
                    Gap
                  </Badge>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
