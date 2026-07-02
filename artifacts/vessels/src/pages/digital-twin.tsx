import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  Cpu,
  Droplets,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  Thermometer,
  Wind,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const VESSELS_DATA = [
  {
    id: 'MV-001',
    name: 'Pacific Navigator',
    type: 'VLCC Tanker',
    flag: '🇱🇷',
    status: 'at_sea',
    lat: 24.5,
    lon: 55.2,
  },
  {
    id: 'MV-002',
    name: 'Arctic Breeze',
    type: 'LNG Carrier',
    flag: '🇬🇷',
    status: 'in_port',
    lat: 1.3,
    lon: 103.8,
  },
  {
    id: 'MV-003',
    name: 'Meridian Bulk',
    type: 'Capesize Bulker',
    flag: '🇲🇭',
    status: 'at_sea',
    lat: -33.8,
    lon: 18.4,
  },
  {
    id: 'MV-004',
    name: 'Cape Resolute',
    type: 'Panamax Bulk',
    flag: '🇵🇦',
    status: 'anchored',
    lat: 29.9,
    lon: 32.5,
  },
];

const SENSOR_STREAMS = [
  {
    key: 'main_engine_rpm',
    label: 'Main Engine RPM',
    unit: 'RPM',
    base: 112,
    variance: 4,
    color: 'sky',
    icon: Cpu,
    min: 0,
    max: 130,
    warn: 125,
    crit: 128,
  },
  {
    key: 'exhaust_temp',
    label: 'Exhaust Temp',
    unit: '°C',
    base: 342,
    variance: 12,
    color: 'orange',
    icon: Thermometer,
    min: 200,
    max: 420,
    warn: 390,
    crit: 410,
  },
  {
    key: 'fuel_flow',
    label: 'Fuel Flow Rate',
    unit: 't/day',
    base: 68.4,
    variance: 2.8,
    color: 'violet',
    icon: Droplets,
    min: 0,
    max: 90,
    warn: 82,
    crit: 87,
  },
  {
    key: 'hull_stress',
    label: 'Hull Stress Index',
    unit: '%',
    base: 38,
    variance: 6,
    color: 'amber',
    icon: Activity,
    min: 0,
    max: 100,
    warn: 70,
    crit: 85,
  },
  {
    key: 'shaft_vibration',
    label: 'Shaft Vibration',
    unit: 'mm/s',
    base: 2.8,
    variance: 0.4,
    color: 'emerald',
    icon: Zap,
    min: 0,
    max: 8,
    warn: 5.5,
    crit: 7,
  },
  {
    key: 'wind_force',
    label: 'Apparent Wind',
    unit: 'kts',
    base: 18,
    variance: 5,
    color: 'teal',
    icon: Wind,
    min: 0,
    max: 60,
    warn: 40,
    crit: 50,
  },
];

const REPLAY_EVENTS = [
  { time: '2026-04-10 08:12', type: 'anomaly', label: 'Engine RPM spike +12%', severity: 'warn' },
  {
    time: '2026-04-10 11:45',
    type: 'weather',
    label: 'Sea state Beaufort 6 encountered',
    severity: 'info',
  },
  {
    time: '2026-04-11 03:22',
    type: 'fuel',
    label: 'Fuel efficiency drop detected',
    severity: 'warn',
  },
  {
    time: '2026-04-11 14:00',
    type: 'maintenance',
    label: 'Routine cylinder inspection',
    severity: 'info',
  },
  {
    time: '2026-04-12 20:33',
    type: 'anomaly',
    label: 'Shaft vibration elevated',
    severity: 'critical',
  },
  {
    time: '2026-04-13 06:18',
    type: 'weather',
    label: 'Low pressure system avoided',
    severity: 'info',
  },
  {
    time: '2026-04-14 12:00',
    type: 'milestone',
    label: 'Mid-voyage waypoint passed',
    severity: 'info',
  },
  { time: '2026-04-15 09:45', type: 'anomaly', label: 'Hull stress normalized', severity: 'info' },
];

function useLiveSensor(base: number, variance: number, running: boolean) {
  const [val, setVal] = useState(base);
  useEffect(() => {
    if (!running) return;
    const iv = setInterval(
      () => {
        setVal(base + (Math.random() - 0.5) * variance * 2);
      },
      1400 + Math.random() * 600,
    );
    return () => clearInterval(iv);
  }, [base, variance, running]);
  return val;
}

function GaugeArc({ pct, color }: { pct: number; color: string }) {
  const r = 28;
  const circ = Math.PI * r;
  const dash = (pct / 100) * circ;
  const colorMap: Record<string, string> = {
    sky: '#38bdf8',
    orange: '#fb923c',
    violet: '#a78bfa',
    amber: '#fbbf24',
    emerald: '#34d399',
    teal: '#2dd4bf',
  };
  const fill = colorMap[color] ?? '#38bdf8';
  return (
    <svg width="72" height="44" viewBox="0 0 72 44">
      <path
        d="M8 40 A28 28 0 0 1 64 40"
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M8 40 A28 28 0 0 1 64 40"
        fill="none"
        stroke={fill}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    </svg>
  );
}

function SensorCard({ s, running }: { s: (typeof SENSOR_STREAMS)[0]; running: boolean }) {
  const rawVal = useLiveSensor(s.base, s.variance, running);
  const val = Number(rawVal.toFixed(1));
  const pct = Math.min(100, Math.max(0, ((val - s.min) / (s.max - s.min)) * 100));
  const status = val >= s.crit ? 'critical' : val >= s.warn ? 'warn' : 'normal';
  const colorMap: Record<string, string> = {
    sky: 'text-sky-400',
    orange: 'text-orange-400',
    violet: 'text-violet-400',
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
    teal: 'text-teal-400',
  };
  const Icon = s.icon;
  return (
    <div
      className={cn(
        'bg-[#0a1628]/80 border rounded-xl p-4 flex flex-col gap-2',
        status === 'critical'
          ? 'border-red-500/30 shadow-red-500/10 shadow-lg'
          : status === 'warn'
            ? 'border-amber-500/25'
            : 'border-sky-500/10',
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className={cn('w-3.5 h-3.5', colorMap[s.color])} />
          <span className="text-[10px] text-sky-400/60 uppercase tracking-wider">{s.label}</span>
        </div>
        {status === 'critical' && (
          <span className="flex items-center gap-1 text-[9px] text-red-400">
            <AlertTriangle className="w-2.5 h-2.5" />
            CRIT
          </span>
        )}
        {status === 'warn' && <span className="text-[9px] text-amber-400">WARN</span>}
        {status === 'normal' && <span className="text-[9px] text-emerald-400/60">OK</span>}
      </div>
      <div className="flex items-end gap-2">
        <GaugeArc pct={pct} color={s.color} />
        <div>
          <span className={cn('text-2xl font-bold font-mono leading-none', colorMap[s.color])}>
            {val}
          </span>
          <span className="text-[10px] text-sky-400/40 ml-1">{s.unit}</span>
        </div>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background:
              status === 'critical' ? '#f87171' : status === 'warn' ? '#fbbf24' : undefined,
            backgroundColor:
              status === 'normal' ? (colorMap[s.color] ? undefined : undefined) : undefined,
            backgroundImage:
              status === 'normal'
                ? `linear-gradient(90deg, rgba(56,189,248,0.5), rgba(56,189,248,0.2))`
                : undefined,
          }}
        />
      </div>
    </div>
  );
}

function TwinCanvas({ vesselId }: { vesselId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frame = 0;
    let raf: number;
    const draw = () => {
      frame++;
      const w = canvas.width,
        h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const t = frame / 60;
      // background
      ctx.fillStyle = '#060e1a';
      ctx.fillRect(0, 0, w, h);
      // ocean waves
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(56,189,248,${0.04 + i * 0.015})`;
        ctx.lineWidth = 1;
        for (let x = 0; x <= w; x += 2) {
          const y = h * 0.72 + Math.sin(x / 60 + t * 0.8 + i * 0.5) * (4 + i * 2);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      // hull
      const cx = w / 2 + Math.sin(t * 0.3) * 3;
      const cy = h * 0.55 + Math.sin(t * 0.5) * 4;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.sin(t * 0.4) * 0.02);
      // hull body
      ctx.beginPath();
      ctx.moveTo(-120, 10);
      ctx.lineTo(-115, 30);
      ctx.lineTo(115, 30);
      ctx.lineTo(130, 10);
      ctx.lineTo(120, -5);
      ctx.lineTo(-110, -5);
      ctx.closePath();
      ctx.fillStyle = 'rgba(14,36,70,0.95)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(56,189,248,0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // superstructure
      ctx.fillStyle = 'rgba(20,50,90,0.9)';
      ctx.strokeStyle = 'rgba(56,189,248,0.2)';
      ctx.beginPath();
      ctx.rect(-30, -50, 60, 45);
      ctx.fill();
      ctx.stroke();
      // bridge windows
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = `rgba(56,189,248,${0.3 + Math.sin(t * 2 + i) * 0.1})`;
        ctx.fillRect(-22 + i * 14, -44, 10, 8);
      }
      // funnel
      ctx.fillStyle = 'rgba(15,40,80,0.9)';
      ctx.fillRect(-8, -75, 16, 28);
      ctx.strokeStyle = 'rgba(56,189,248,0.15)';
      ctx.strokeRect(-8, -75, 16, 28);
      // smoke
      for (let i = 0; i < 5; i++) {
        const alpha = 0.08 - i * 0.014;
        ctx.beginPath();
        ctx.arc(0 + Math.sin(t + i * 0.8) * 8, -80 - i * 12, 4 + i * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,200,220,${alpha})`;
        ctx.fill();
      }
      // sensor pulse dots
      const sensorPts = [
        [-80, -2],
        [0, -15],
        [60, 5],
        [100, 12],
      ];
      sensorPts.forEach(([sx, sy], idx) => {
        const pulse = (Math.sin(t * 3 + idx) + 1) / 2;
        ctx.beginPath();
        ctx.arc(sx, sy, 3 + pulse * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56,189,248,${0.5 + pulse * 0.4})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx, sy, 6 + pulse * 4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56,189,248,${0.15 * (1 - pulse)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      ctx.restore();
      // digital overlay
      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(56,189,248,0.25)';
      const overlayLines = [
        `VESSEL_ID: ${vesselId}`,
        `TWIN_SYNC: ${((Date.now() % 1000) / 10).toFixed(0)}ms`,
        `SENSORS: 48 ACTIVE`,
        `INTEGRITY: 99.2%`,
      ];
      overlayLines.forEach((line, i) => ctx.fillText(line, 8, 16 + i * 14));
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [vesselId]);
  return (
    <canvas
      ref={canvasRef}
      width={480}
      height={220}
      className="w-full rounded-lg"
      style={{ background: '#060e1a' }}
    />
  );
}

export default function DigitalTwinPage() {
  const [selectedVessel, setSelectedVessel] = useState(VESSELS_DATA[0]);
  const [running, setRunning] = useState(true);
  const [replayMode, setReplayMode] = useState(false);
  const [replayIdx, setReplayIdx] = useState(0);

  useEffect(() => {
    if (!replayMode) return;
    if (replayIdx >= REPLAY_EVENTS.length) return;
    const timer = setTimeout(() => setReplayIdx((i) => i + 1), 1200);
    return () => clearTimeout(timer);
  }, [replayMode, replayIdx]);

  const statusColors: Record<string, string> = {
    at_sea: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    in_port: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    anchored: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-4 h-4 text-sky-400" />
            <h1 className="font-display text-xl font-bold text-sky-50">
              Vessel Digital Twin Engine
            </h1>
            <Badge
              variant="outline"
              className="text-[9px] text-sky-400 border-sky-500/30 bg-sky-500/5"
            >
              LIVE SYNC
            </Badge>
          </div>
          <p className="text-xs text-sky-400/40">
            Real-time 3D digital twin with sensor simulation, performance prediction & historical
            replay
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setReplayMode(!replayMode);
              setReplayIdx(0);
            }}
            className={cn(
              'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors',
              replayMode
                ? 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                : 'bg-sky-500/5 border-sky-500/20 text-sky-400/60 hover:text-sky-300',
            )}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Voyage Replay
          </button>
          <button
            onClick={() => setRunning(!running)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-sky-500/20 bg-sky-500/5 text-sky-400/60 hover:text-sky-300 transition-colors"
          >
            {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {running ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {VESSELS_DATA.map((v) => (
          <button
            key={v.id}
            onClick={() => setSelectedVessel(v)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs whitespace-nowrap transition-all',
              selectedVessel.id === v.id
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                : 'bg-[#0a1628]/60 border-sky-500/10 text-sky-400/50 hover:text-sky-300',
            )}
          >
            <span>{v.flag}</span>
            <div className="text-left">
              <p className="font-medium">{v.name}</p>
              <p className="text-[9px] opacity-60">{v.type}</p>
            </div>
            <Badge
              variant="outline"
              className={cn('text-[8px] ml-1', statusColors[v.status] ?? '')}
            >
              {v.status.replace('_', ' ')}
            </Badge>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-sky-500/10 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-sky-100">{selectedVessel.name}</p>
                <p className="text-[10px] text-sky-400/40">
                  {selectedVessel.type} · Digital Twin Visualization
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400">TWIN ACTIVE</span>
              </div>
            </div>
            <div className="p-4">
              <TwinCanvas vesselId={selectedVessel.id} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SENSOR_STREAMS.map((s) => (
              <SensorCard key={s.key} s={s} running={running} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <p className="text-xs font-semibold text-sky-200 mb-3 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
              Performance Prediction
            </p>
            {[
              { label: 'ETA Rotterdam', val: 'Apr 20 06:00', delta: '+4h delay', neg: true },
              { label: 'Remaining Fuel', val: '1,847 t', delta: '-12t vs plan', neg: true },
              { label: 'Speed Avg', val: '13.4 kts', delta: '+0.2 vs optimal', neg: false },
              { label: 'CII Score (YTD)', val: 'B+', delta: 'On track', neg: false },
              { label: 'Next Maint. Window', val: '28 days', delta: 'Cylinder #3', neg: false },
            ].map((r) => (
              <div
                key={r.label}
                className="flex items-center justify-between py-2 border-b border-sky-500/5 last:border-0"
              >
                <span className="text-[11px] text-sky-400/50">{r.label}</span>
                <div className="text-right">
                  <p className="text-[11px] font-mono text-sky-200">{r.val}</p>
                  <p
                    className={cn(
                      'text-[9px]',
                      r.neg ? 'text-amber-400/70' : 'text-emerald-400/70',
                    )}
                  >
                    {r.delta}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-sky-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-violet-400" />
                Voyage Replay
              </p>
              {replayMode && (
                <span className="text-[9px] text-violet-400 animate-pulse">REPLAYING</span>
              )}
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {REPLAY_EVENTS.map((ev, i) => {
                const shown = !replayMode || i <= replayIdx;
                const isCurrent = replayMode && i === replayIdx;
                const sev =
                  { critical: 'text-red-400', warn: 'text-amber-400', info: 'text-sky-400/60' }[
                    ev.severity
                  ] ?? 'text-sky-400/60';
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex gap-2 text-[10px] transition-all duration-500',
                      shown ? 'opacity-100' : 'opacity-20',
                      isCurrent && 'bg-violet-500/5 -mx-1 px-1 rounded',
                    )}
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'w-1.5 h-1.5 rounded-full mt-1 shrink-0',
                          ev.severity === 'critical'
                            ? 'bg-red-400'
                            : ev.severity === 'warn'
                              ? 'bg-amber-400'
                              : 'bg-sky-500/40',
                        )}
                      />
                      {i < REPLAY_EVENTS.length - 1 && (
                        <div className="w-px flex-1 bg-sky-500/10 mt-0.5" />
                      )}
                    </div>
                    <div className="pb-2">
                      <p className="text-sky-400/30 font-mono">{ev.time}</p>
                      <p className={cn('mt-0.5', sev)}>{ev.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {!replayMode && (
              <button
                onClick={() => {
                  setReplayMode(true);
                  setReplayIdx(0);
                }}
                className="mt-3 w-full text-[10px] text-center py-2 rounded-lg bg-violet-500/5 border border-violet-500/20 text-violet-400 hover:bg-violet-500/10 transition-colors"
              >
                Start 5-Day Voyage Replay
              </button>
            )}
          </div>

          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <p className="text-xs font-semibold text-sky-200 mb-3 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              Twin Integrity
            </p>
            {[
              { label: 'Sensor Coverage', val: 94, color: 'emerald' },
              { label: 'Data Freshness', val: 99, color: 'sky' },
              { label: 'Model Fidelity', val: 87, color: 'violet' },
              { label: 'Prediction Accuracy', val: 91, color: 'teal' },
            ].map((m) => (
              <div key={m.label} className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-sky-400/50">{m.label}</span>
                  <span className="text-[10px] font-mono text-sky-300">{m.val}%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500/60 to-sky-400/30 transition-all"
                    style={{ width: `${m.val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
