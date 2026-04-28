import { useState, useEffect } from 'react';

interface ThreatSignal {
  id: string;
  timestamp: number;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  anomalyScore: number;
  metric: string;
  source: string;
  description: string;
  causalChain: string[];
}

interface ForecastBand {
  t: number;
  actual: number;
  predicted: number;
  lower95: number;
  upper95: number;
  lower80: number;
  upper80: number;
}

interface DetectorStatus {
  name: string;
  type: string;
  streams: number;
  status: 'active' | 'warming' | 'offline';
  lastScore: number;
  researcher: string;
  institution: string;
  technique: string;
}

const DETECTORS: DetectorStatus[] = [
  {
    name: 'Poghosyan Data-Agnostic Detector',
    type: 'anomaly',
    streams: 14,
    status: 'active',
    lastScore: 23,
    researcher: 'Dr. Arnak Poghosyan',
    institution: 'VMware / American University of Armenia',
    technique: 'Data-agnostic time-series anomaly detection. 20+ US patents covering metric compression and root-cause analysis in distributed systems.',
  },
  {
    name: 'Chandola SQUAD Scorer',
    type: 'multivariate',
    streams: 8,
    status: 'active',
    lastScore: 41,
    researcher: 'Dr. Varun Chandola',
    institution: 'SUNY Buffalo / Oak Ridge National Lab',
    technique: 'Statistical Quality-based Unsupervised Anomaly Detection for big complex data. Multi-dimensional scoring catches cross-metric deviations.',
  },
  {
    name: 'Hyndman Seasonal Decomposer',
    type: 'forecast',
    streams: 12,
    status: 'active',
    lastScore: 18,
    researcher: 'Dr. Rob J. Hyndman',
    institution: 'Monash University',
    technique: 'STL decomposition + ETS forecasting with confidence bands. The forecast R package\'s methodology adapted for security time-series.',
  },
  {
    name: 'Talwalkar Foundation Forecaster',
    type: 'forecast',
    streams: 6,
    status: 'active',
    lastScore: 31,
    researcher: 'Dr. Ameet Talwalkar',
    institution: 'CMU / Datadog',
    technique: 'Toto-class foundation model for observability time-series. Pre-trained on millions of metric streams, fine-tuned on security telemetry.',
  },
  {
    name: 'Li Causal Chain Analyzer',
    type: 'causal',
    streams: 8,
    status: 'active',
    lastScore: 37,
    researcher: 'Dr. Jundong Li',
    institution: 'University of Virginia',
    technique: 'Graph-based causal inference for anomaly propagation tracing. DAG structure identifies root causes rather than symptoms.',
  },
  {
    name: 'Liu Explainable Detector',
    type: 'anomaly',
    streams: 10,
    status: 'warming',
    lastScore: 0,
    researcher: 'Dr. Anna Liu',
    institution: 'UMass Amherst',
    technique: 'Nonparametric explainable anomaly detection with interactive data exploration. Provides human-readable explanations for each flagged anomaly.',
  },
];

const THREAT_CATEGORIES = ['Lateral Movement', 'Data Exfiltration', 'Privilege Escalation', 'C2 Beacon', 'Credential Access', 'Defense Evasion', 'Reconnaissance', 'Persistence'] as const;
const SOURCES = ['EDR', 'SIEM', 'NDR', 'CASB', 'WAF', 'DNS', 'IAM', 'Cloud Trail'] as const;

function generateSignals(): ThreatSignal[] {
  const now = Date.now();
  return Array.from({ length: 20 }, (_, i) => {
    const score = Math.floor(Math.random() * 100);
    return {
      id: `ts-${i}`,
      timestamp: now - i * 30000 - Math.floor(Math.random() * 10000),
      category: THREAT_CATEGORIES[i % THREAT_CATEGORIES.length],
      severity: score > 85 ? 'critical' : score > 60 ? 'high' : score > 30 ? 'medium' : 'low',
      anomalyScore: score,
      metric: ['event_rate', 'bytes_out', 'auth_failures', 'dns_queries', 'process_spawns', 'file_access'][i % 6],
      source: SOURCES[i % SOURCES.length],
      description: [
        'Unusual lateral movement pattern detected across 3 subnets',
        'Data egress volume 4.2σ above seasonal baseline',
        'Privilege escalation attempt via service account chain',
        'Periodic beacon pattern matching known C2 framework',
        'Credential spray from 12 source IPs in 90-second window',
        'Process injection technique evading EDR signature',
        'Port scan from internal host targeting DMZ segment',
        'Registry persistence mechanism installed via scheduled task',
        'DNS tunneling pattern detected in query entropy analysis',
        'Cloud API calls from unregistered geographic region',
        'Anomalous login sequence violating Hyndman baseline',
        'MITRE ATT&CK T1059.001 pattern in command execution',
        'Chandola SQUAD multi-metric deviation in auth subsystem',
        'File hash collision with known APT toolkit artifact',
        'Li causal chain: DNS→Beacon→Exfil correlation found',
        'Memory-resident payload detected via behavioral heuristic',
        'Talwalkar forecaster: event rate 3.8σ above prediction',
        'Poghosyan data-agnostic flag on network telemetry drift',
        'Kerberoasting pattern detected in ticket requests',
        'Supply chain artifact hash mismatch on 2 packages',
      ][i],
      causalChain: i < 5 ? [
        SOURCES[(i + 1) % SOURCES.length],
        SOURCES[(i + 2) % SOURCES.length],
        SOURCES[(i + 3) % SOURCES.length],
      ] : [],
    };
  });
}

function generateForecast(): ForecastBand[] {
  return Array.from({ length: 72 }, (_, i) => {
    const hour = i / 3;
    const base = 150 + Math.sin(hour / 4) * 60 + Math.cos(hour / 12) * 40;
    const noise = (Math.random() - 0.5) * 40;
    const horizonFactor = Math.max(0, (i - 48) / 24);
    return {
      t: i,
      actual: i < 50 ? Math.max(0, Math.floor(base + noise)) : 0,
      predicted: Math.floor(base),
      lower95: Math.floor(base - 80 - horizonFactor * 50),
      upper95: Math.floor(base + 80 + horizonFactor * 50),
      lower80: Math.floor(base - 50 - horizonFactor * 30),
      upper80: Math.floor(base + 50 + horizonFactor * 30),
    };
  });
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-400 border-red-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    low: 'bg-green-500/10 text-green-400 border-green-500/20',
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded border uppercase ${styles[severity] || styles.low}`}>
      {severity}
    </span>
  );
}

function ScoreRing({ score, size = 40 }: { score: number; size?: number }) {
  const color = score < 30 ? '#4ade80' : score < 60 ? '#facc15' : score < 85 ? '#fb923c' : '#ef4444';
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

export default function PredictiveThreatEngine() {
  const [signals, setSignals] = useState<ThreatSignal[]>([]);
  const [forecast] = useState(generateForecast);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setSignals(generateSignals());
    const iv = setInterval(() => {
      setSignals(generateSignals());
      setTick(t => t + 1);
    }, 8000);
    return () => clearInterval(iv);
  }, []);

  const critCount = signals.filter(s => s.severity === 'critical').length;
  const highCount = signals.filter(s => s.severity === 'high').length;
  const avgScore = signals.length > 0 ? Math.round(signals.reduce((s, x) => s + x.anomalyScore, 0) / signals.length) : 0;
  const activeDetectors = DETECTORS.filter(d => d.status === 'active').length;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.2em] opacity-40 mb-1">SENTRA · INTELLIGENCE · PREDICTIVE ENGINE</p>
        <h1 className="text-2xl font-bold tracking-tight">Predictive Threat Engine</h1>
        <p className="text-sm opacity-50 mt-1 max-w-3xl">
          Multi-model anomaly detection and threat forecasting powered by research from
          Poghosyan (VMware), Talwalkar (CMU/Datadog), Chandola (SUNY Buffalo),
          Hyndman (Monash), Li (UVA), and Liu (UMass Amherst). Time-series decomposition,
          causal inference, and foundation-model forecasting fused into a single threat surface.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Critical Threats', value: critCount, color: '#ef4444' },
          { label: 'High Threats', value: highCount, color: '#fb923c' },
          { label: 'Avg Anomaly', value: avgScore, color: avgScore > 60 ? '#ef4444' : avgScore > 30 ? '#facc15' : '#4ade80' },
          { label: 'Active Detectors', value: `${activeDetectors}/${DETECTORS.length}`, color: '#06b6d4' },
          { label: 'Signals / min', value: Math.floor(12 + Math.random() * 8), color: '#a78bfa' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-4 space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-widest opacity-30">{kpi.label}</p>
            <p className="text-2xl font-mono font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-mono font-semibold uppercase tracking-wider opacity-70">Threat Event Forecast</h2>
              <p className="text-[10px] font-mono opacity-30 mt-0.5">Hyndman STL + Talwalkar Toto · 24h lookback + 8h forecast</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono opacity-30">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#06b6d4]" /> Actual</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#a78bfa]" /> Predicted</span>
            </div>
          </div>
          <div className="h-[200px] w-full">
            <svg viewBox="0 0 720 200" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="ci95" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="ci80" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {(() => {
                const maxV = Math.max(...forecast.map(p => p.upper95));
                const sy = (v: number) => 190 - (Math.max(0, v) / maxV) * 180;
                const sx = (i: number) => (i / (forecast.length - 1)) * 710 + 5;

                const band95 = forecast.map((p, i) => `${i===0?'M':'L'}${sx(i)},${sy(p.upper95)}`)
                  .concat([...forecast].reverse().map((p, i) => `L${sx(forecast.length-1-i)},${sy(p.lower95)}`))
                  .join(' ')+'Z';
                const band80 = forecast.map((p, i) => `${i===0?'M':'L'}${sx(i)},${sy(p.upper80)}`)
                  .concat([...forecast].reverse().map((p, i) => `L${sx(forecast.length-1-i)},${sy(p.lower80)}`))
                  .join(' ')+'Z';

                const actualPts = forecast.filter(p => p.actual > 0);
                const actualPath = actualPts.map((p, i) =>
                  `${i===0?'M':'L'}${sx(forecast.indexOf(p))},${sy(p.actual)}`).join(' ');
                const predPath = forecast.map((p, i) =>
                  `${i===0?'M':'L'}${sx(i)},${sy(p.predicted)}`).join(' ');

                const nowX = sx(49);
                return (
                  <>
                    <path d={band95} fill="url(#ci95)" />
                    <path d={band80} fill="url(#ci80)" />
                    <path d={predPath} fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
                    {actualPath && <path d={actualPath} fill="none" stroke="#06b6d4" strokeWidth="2" />}
                    <line x1={nowX} y1="5" x2={nowX} y2="195" stroke="white" strokeWidth="0.5" opacity="0.2" strokeDasharray="3 3" />
                    <text x={nowX+3} y="12" fill="white" opacity="0.3" fontSize="8" fontFamily="monospace">now</text>
                  </>
                );
              })()}
            </svg>
          </div>
        </div>

        <div className="lg:col-span-2 bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-5 max-h-[310px] overflow-y-auto">
          <h2 className="text-sm font-mono font-semibold uppercase tracking-wider opacity-70 mb-3">Causal Chain Analysis</h2>
          <p className="text-[10px] font-mono opacity-30 mb-3">Li DAG inference · root cause propagation tracing</p>
          <div className="space-y-2">
            {signals.filter(s => s.causalChain.length > 0).slice(0, 5).map(sig => (
              <div key={sig.id} className="p-2.5 rounded bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center justify-between mb-1">
                  <SeverityBadge severity={sig.severity} />
                  <ScoreRing score={sig.anomalyScore} size={28} />
                </div>
                <p className="text-[11px] opacity-60 mb-1.5">{sig.description}</p>
                <div className="flex items-center gap-1 text-[10px] font-mono">
                  <span className="opacity-30">chain:</span>
                  {[sig.source, ...sig.causalChain].map((node, i, arr) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="text-primary">{node}</span>
                      {i < arr.length - 1 && <span className="opacity-20">→</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg overflow-hidden">
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-sm font-mono font-semibold uppercase tracking-wider opacity-70">Detection Engine Registry</h2>
          <span className="text-[10px] font-mono opacity-30">{activeDetectors} active · {DETECTORS.length} total</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.04]">
          {DETECTORS.map(det => (
            <div key={det.name} className="bg-[#0a0a0f] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${det.status === 'active' ? 'bg-green-500 animate-pulse' : det.status === 'warming' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  <span className="text-xs font-mono font-bold">{det.name}</span>
                </div>
                {det.status === 'active' && <ScoreRing score={det.lastScore} size={28} />}
              </div>
              <p className="text-[10px] opacity-40 leading-relaxed">{det.technique}</p>
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="opacity-30">{det.researcher}</span>
                <span className="opacity-30">{det.streams} streams</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg overflow-hidden">
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-sm font-mono font-semibold uppercase tracking-wider opacity-70">Live Threat Signal Feed</h2>
          <span className="text-[10px] font-mono opacity-30">tick {tick} · refreshes every 8s</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.06] opacity-30">
                <th className="text-left px-5 py-2 font-medium uppercase tracking-wider">Time</th>
                <th className="text-left px-3 py-2 font-medium uppercase tracking-wider">Source</th>
                <th className="text-left px-3 py-2 font-medium uppercase tracking-wider">Category</th>
                <th className="text-left px-3 py-2 font-medium uppercase tracking-wider">Severity</th>
                <th className="text-left px-3 py-2 font-medium uppercase tracking-wider">Description</th>
                <th className="text-right px-5 py-2 font-medium uppercase tracking-wider">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {signals.slice(0, 10).map(sig => (
                <tr key={sig.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-2 opacity-40 whitespace-nowrap">
                    {new Date(sig.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="px-3 py-2 text-primary">{sig.source}</td>
                  <td className="px-3 py-2 opacity-60">{sig.category}</td>
                  <td className="px-3 py-2"><SeverityBadge severity={sig.severity} /></td>
                  <td className="px-3 py-2 opacity-50 max-w-xs truncate">{sig.description}</td>
                  <td className="px-5 py-2 text-right"><ScoreRing score={sig.anomalyScore} size={24} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
