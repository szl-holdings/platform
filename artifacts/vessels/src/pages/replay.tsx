import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Clock, MapPin, Fuel, Wind, AlertTriangle, Activity, ChevronRight, Zap } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";

const VOYAGE_EVENTS = [
  { time: "Apr 8 06:00", type: "departure", label: "Departed Ras Tanura (SATANK)", detail: "Cargo: 280,000t crude", severity: "info", lat: 26.6, lon: 50.2 },
  { time: "Apr 8 14:30", type: "waypoint", label: "Strait of Hormuz transit", detail: "Passage: 2h 14m, no incidents", severity: "info", lat: 26.6, lon: 56.5 },
  { time: "Apr 9 09:15", type: "weather", label: "Beaufort 6 sea state encountered", detail: "Speed reduced to 11.2 kts", severity: "warn", lat: 23.0, lon: 58.5 },
  { time: "Apr 9 18:40", type: "fuel", label: "Fuel consumption spike +8%", detail: "Weather-related variance", severity: "warn", lat: 21.5, lon: 57.0 },
  { time: "Apr 10 11:00", type: "ais", label: "AIS transmission gap 47 min", detail: "Gulf of Aden, possible interference", severity: "warn", lat: 14.5, lon: 49.0 },
  { time: "Apr 10 22:00", type: "waypoint", label: "Bab-el-Mandeb crossing", detail: "UKMTO notification sent", severity: "info", lat: 12.5, lon: 43.5 },
  { time: "Apr 11 16:00", type: "anomaly", label: "Speed reduction — congestion", detail: "Red Sea northbound lane congestion", severity: "warn", lat: 19.0, lon: 39.5 },
  { time: "Apr 12 08:00", type: "inspection", label: "Pre-canal inspection report submitted", detail: "Suez Canal Authority clearance", severity: "info", lat: 28.5, lon: 33.5 },
  { time: "Apr 12 20:00", type: "waypoint", label: "Suez Canal southbound entry", detail: "Convoy position: 4 of 18", severity: "info", lat: 30.0, lon: 32.5 },
  { time: "Apr 13 14:00", type: "anomaly", label: "Engine temp elevated +4°C", detail: "Monitoring — within operating range", severity: "warn", lat: 31.5, lon: 32.0 },
  { time: "Apr 14 06:00", type: "waypoint", label: "Port Said exit — Mediterranean", detail: "Speed restored 13.4 kts", severity: "info", lat: 31.3, lon: 32.3 },
  { time: "Apr 15 09:45", type: "weather", label: "Med weather system avoided", detail: "Route deviation +18nm", severity: "info", lat: 35.8, lon: 24.0 },
  { time: "Apr 16 04:00", type: "waypoint", label: "Gibraltar Strait approach", detail: "Current position — ETA Rotterdam Apr 20", severity: "info", lat: 36.1, lon: -5.3 },
];

const METRICS_TIMELINE = [
  { label: "Apr 8", speed: 13.8, fuel: 72.4, weather: 2, risk: 18 },
  { label: "Apr 9", speed: 11.4, fuel: 78.1, weather: 6, risk: 42 },
  { label: "Apr 10", speed: 12.2, fuel: 74.8, weather: 4, risk: 55 },
  { label: "Apr 11", speed: 11.8, fuel: 68.0, weather: 3, risk: 44 },
  { label: "Apr 12", speed: 9.2, fuel: 52.4, weather: 2, risk: 28 },
  { label: "Apr 13", speed: 8.4, fuel: 47.8, weather: 2, risk: 22 },
  { label: "Apr 14", speed: 13.4, fuel: 69.8, weather: 3, risk: 20 },
  { label: "Apr 15", speed: 13.1, fuel: 68.2, weather: 4, risk: 18 },
  { label: "Apr 16", speed: 13.4, fuel: 70.0, weather: 3, risk: 16 },
];

const typeIcons: Record<string, React.ReactNode> = {
  departure: <MapPin className="w-3 h-3 text-emerald-400" />,
  waypoint: <ChevronRight className="w-3 h-3 text-sky-400" />,
  weather: <Wind className="w-3 h-3 text-amber-400" />,
  fuel: <Fuel className="w-3 h-3 text-orange-400" />,
  ais: <Activity className="w-3 h-3 text-violet-400" />,
  anomaly: <AlertTriangle className="w-3 h-3 text-red-400" />,
  inspection: <Zap className="w-3 h-3 text-sky-400" />,
};

function ScrubberChart({ data, cursor }: { data: typeof METRICS_TIMELINE; cursor: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#060d1a";
    ctx.fillRect(0, 0, w, h);
    const pad = { l: 10, r: 10, t: 10, b: 20 };
    const chartW = w - pad.l - pad.r;
    const chartH = h - pad.t - pad.b;
    const n = data.length;
    const stepX = chartW / (n - 1);
    const drawLine = (values: number[], max: number, color: string) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      values.forEach((v, i) => {
        const x = pad.l + i * stepX;
        const y = pad.t + chartH * (1 - v / max);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };
    drawLine(data.map(d => d.speed), 16, "rgba(56,189,248,0.7)");
    drawLine(data.map(d => d.fuel), 100, "rgba(251,191,36,0.5)");
    drawLine(data.map(d => d.risk), 100, "rgba(248,113,113,0.45)");
    // cursor line
    const cx = pad.l + cursor * stepX;
    ctx.beginPath();
    ctx.strokeStyle = "rgba(139,122,200,0.8)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.moveTo(cx, pad.t);
    ctx.lineTo(cx, pad.t + chartH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(cx, pad.t + chartH / 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#8b7ac8";
    ctx.fill();
    // x labels
    ctx.font = "8px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    data.forEach((d, i) => {
      ctx.fillText(d.label, pad.l + i * stepX - 14, h - 4);
    });
  }, [data, cursor]);
  return <canvas ref={canvasRef} width={520} height={90} className="w-full rounded" />;
}

export default function VesselsReplayPage() {
  const [playing, setPlaying] = useState(false);
  const [cursor, setCursor] = useState(12);
  const totalEvents = VOYAGE_EVENTS.length;

  useEffect(() => {
    if (!playing) return;
    if (cursor >= totalEvents - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setCursor(c => Math.min(c + 1, totalEvents - 1)), 900);
    return () => clearTimeout(t);
  }, [playing, cursor, totalEvents]);

  const metricCursor = Math.floor((cursor / (totalEvents - 1)) * (METRICS_TIMELINE.length - 1));
  const current = VOYAGE_EVENTS[cursor];
  const sevColor: Record<string, string> = { info: "text-sky-400/60", warn: "text-amber-400", crit: "text-red-400" };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <RotateCcw className="w-4 h-4 text-violet-400" />
            <h1 className="font-display text-xl font-bold text-sky-50">Voyage Replay</h1>
            <Badge variant="outline" className="text-[9px] text-violet-400 border-violet-500/30 bg-violet-500/5">ATLAS RUNTIME</Badge>
          </div>
          <p className="text-xs text-sky-400/40">Step through the voyage worldline — every event, anomaly, and decision point</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-1 rounded-lg">
          <Clock className="w-3 h-3" />
          {current.time}
        </div>
      </div>

      {/* Current event spotlight */}
      <div className="bg-[#0a1628]/90 border border-violet-500/20 rounded-xl p-4 flex items-start gap-4">
        <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
          {typeIcons[current.type] ?? <Activity className="w-3.5 h-3.5 text-sky-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-sky-100">{current.label}</p>
            <Badge variant="outline" className={cn("text-[9px] capitalize", current.severity === "warn" ? "text-amber-400 border-amber-500/20 bg-amber-500/5" : "text-sky-400/60 border-sky-500/10 bg-transparent")}>{current.severity}</Badge>
          </div>
          <p className="text-[11px] text-sky-400/50">{current.detail}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-sky-400/40 font-mono">Event {cursor + 1} / {totalEvents}</p>
          <p className="text-[10px] text-sky-400/30 font-mono">{current.lat.toFixed(1)}°N {Math.abs(current.lon).toFixed(1)}°{current.lon >= 0 ? "E" : "W"}</p>
        </div>
      </div>

      {/* Scrubber + controls */}
      <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-sky-400/50 uppercase tracking-wider">Voyage Timeline</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[9px] text-sky-400/40">
              <span className="inline-block w-3 h-0.5 bg-sky-400/60 rounded" />Speed
              <span className="inline-block w-3 h-0.5 bg-amber-400/50 rounded ml-1" />Fuel
              <span className="inline-block w-3 h-0.5 bg-red-400/45 rounded ml-1" />Risk
            </div>
          </div>
        </div>
        <ScrubberChart data={METRICS_TIMELINE} cursor={metricCursor} />
        <input type="range" min={0} max={totalEvents - 1} value={cursor} onChange={e => { setPlaying(false); setCursor(Number(e.target.value)); }}
          className="w-full h-1.5 rounded-full accent-violet-500 cursor-pointer" />
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => { setPlaying(false); setCursor(0); }} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-sky-500/20 bg-sky-500/5 text-sky-400/60 hover:text-sky-300 transition-colors">
            <SkipBack className="w-3.5 h-3.5" />Start
          </button>
          <button onClick={() => setCursor(c => Math.max(0, c - 1))} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-sky-500/20 bg-sky-500/5 text-sky-400/60 hover:text-sky-300 transition-colors">
            ‹ Prev
          </button>
          <button onClick={() => setPlaying(p => !p)} className={cn("flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-lg border transition-colors", playing ? "bg-violet-500/15 border-violet-500/30 text-violet-300" : "bg-sky-500/10 border-sky-500/30 text-sky-300")}>
            {playing ? <><Pause className="w-3.5 h-3.5" />Pause</> : <><Play className="w-3.5 h-3.5" />Play</>}
          </button>
          <button onClick={() => setCursor(c => Math.min(totalEvents - 1, c + 1))} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-sky-500/20 bg-sky-500/5 text-sky-400/60 hover:text-sky-300 transition-colors">
            Next ›
          </button>
          <button onClick={() => { setPlaying(false); setCursor(totalEvents - 1); }} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-sky-500/20 bg-sky-500/5 text-sky-400/60 hover:text-sky-300 transition-colors">
            End<SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Event log */}
      <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-sky-500/10">
          <p className="text-sm font-semibold text-sky-100">Voyage Event Log</p>
          <p className="text-[10px] text-sky-400/40">Click any event to jump to that point in the voyage</p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {VOYAGE_EVENTS.map((ev, i) => {
            const isCurrent = i === cursor;
            const isPast = i < cursor;
            return (
              <div key={i} onClick={() => { setPlaying(false); setCursor(i); }}
                className={cn("flex gap-3 px-4 py-3 border-b border-sky-500/5 cursor-pointer transition-all", isCurrent ? "bg-violet-500/8 border-violet-500/20" : isPast ? "hover:bg-sky-500/3 opacity-70" : "hover:bg-sky-500/3 opacity-40")}>
                <div className="flex flex-col items-center mt-0.5">
                  <div className={cn("w-2 h-2 rounded-full shrink-0", isCurrent ? "bg-violet-400 ring-2 ring-violet-400/30" : isPast ? "bg-sky-500/40" : "bg-sky-500/15")} />
                  {i < VOYAGE_EVENTS.length - 1 && <div className="w-px flex-1 bg-sky-500/8 mt-0.5" />}
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span>{typeIcons[ev.type]}</span>
                    <p className={cn("text-[11px] font-medium", isCurrent ? "text-sky-100" : "text-sky-300")}>{ev.label}</p>
                    {ev.severity === "warn" && <span className="text-[9px] text-amber-400">⚠</span>}
                  </div>
                  <p className="text-[10px] text-sky-400/40">{ev.time} · {ev.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
