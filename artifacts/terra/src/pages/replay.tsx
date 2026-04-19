import { useState, useEffect, useRef } from "react";

import { Play, Pause, SkipBack, SkipForward, RotateCcw, Clock, Building2, TrendingDown, TrendingUp, DollarSign, AlertTriangle, Activity, ChevronRight } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { useStandardQuery } from "@szl-holdings/api-client-react";

const DEMO_PROPERTY_EVENTS = [
  { time: "Jan 2023", type: "acquisition", label: "Property acquired at $3.2M", detail: "Cap rate 6.4% — below market comp avg of 7.1%", severity: "info" },
  { time: "Mar 2023", type: "market", label: "Interest rate environment tightened", detail: "10-yr Treasury crossed 4.0% — cap rate expansion pressure begins", severity: "warn" },
  { time: "Jun 2023", type: "tenant", label: "3-unit vacancy — tenant churn", detail: "Vacancy rate rose from 0% to 25%", severity: "warn" },
  { time: "Aug 2023", type: "valuation", label: "AVM revaluation: −$180K", detail: "Cap rate expansion + NOI compression on vacant units", severity: "warn" },
  { time: "Nov 2023", type: "tenant", label: "2 units re-leased at market rate", detail: "Vacancy reduced to 8.3% — rents +6% vs prior tenants", severity: "info" },
  { time: "Jan 2024", type: "market", label: "Submarket pressure index: elevated", detail: "Williamsburg multifamily supply pipeline 280 units", severity: "warn" },
  { time: "Apr 2024", type: "filing", label: "Water damage claim filed", detail: "Insurance claim $22K — boiler replacement", severity: "info" },
  { time: "Jun 2024", type: "valuation", label: "AVM stabilized at $3.62M", detail: "Occupancy 91.7% — NOI recovering toward $220K", severity: "info" },
  { time: "Sep 2024", type: "market", label: "Rate cut expectations — cap compression", detail: "50bps Fed cut — multifamily cap rates tightening", severity: "info" },
  { time: "Jan 2025", type: "valuation", label: "AVM: $3.80M — above acquisition", detail: "IRR tracking 14.2% — on plan for 5-year hold", severity: "info" },
  { time: "Mar 2025", type: "tenant", label: "Lease renewal — 2 units at +8%", detail: "Organic rent growth sustained", severity: "info" },
  { time: "Apr 2025", type: "market", label: "Lien screen clear — title clean", detail: "No UCC filings, mechanic liens, or lis pendens", severity: "info" },
  { time: "Apr 2026", type: "current", label: "Current: Portfolio stable — IRR 14.2%", detail: "Next decision: Hold / refi / portfolio sale evaluation Q3 2026", severity: "info" },
];

const VALUATION_TIMELINE = [
  { label: "Jan'23", value: 3200, noi: 196, occupancy: 100 },
  { label: "Jun'23", value: 3080, noi: 147, occupancy: 75 },
  { label: "Sep'23", value: 3020, noi: 151, occupancy: 75 },
  { label: "Jan'24", value: 3250, noi: 185, occupancy: 91 },
  { label: "Jun'24", value: 3620, noi: 204, occupancy: 92 },
  { label: "Jan'25", value: 3800, noi: 228, occupancy: 100 },
  { label: "Apr'26", value: 3800, noi: 228, occupancy: 100 },
];

interface PropertyEvent {
  time: string;
  type: string;
  label: string;
  detail: string;
  severity: string;
}

interface ApiEvent {
  time: string;
  type: string;
  label: string;
  detail: string;
  severity: string;
}

function ValuationChart({ data, cursor }: { data: typeof VALUATION_TIMELINE; cursor: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#050a08";
    ctx.fillRect(0, 0, w, h);
    const pad = { l: 10, r: 10, t: 10, b: 20 };
    const chartW = w - pad.l - pad.r;
    const chartH = h - pad.t - pad.b;
    const n = data.length;
    const stepX = chartW / (n - 1);
    const minV = 2900, maxV = 4000;
    const minN = 100, maxN = 260;
    const drawLine = (values: number[], min: number, max: number, color: string, filled = false) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      values.forEach((v, i) => {
        const x = pad.l + i * stepX;
        const y = pad.t + chartH * (1 - (v - min) / (max - min));
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      if (filled) {
        ctx.lineTo(pad.l + (n - 1) * stepX, pad.t + chartH);
        ctx.lineTo(pad.l, pad.t + chartH);
        ctx.closePath();
        ctx.fillStyle = `${color.replace("1)", "0.06)")}`;
        ctx.fill();
      }
    };
    drawLine(data.map(d => d.value), minV, maxV, "rgba(45,106,79,0.8)", true);
    drawLine(data.map(d => d.noi), minN, maxN, "rgba(200,149,60,0.55)");
    const cx = pad.l + cursor * stepX;
    ctx.beginPath();
    ctx.strokeStyle = "rgba(139,122,200,0.7)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.moveTo(cx, pad.t);
    ctx.lineTo(cx, pad.t + chartH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(cx, pad.t + chartH * (1 - (data[cursor].value - minV) / (maxV - minV)), 4, 0, Math.PI * 2);
    ctx.fillStyle = "#2d6a4f";
    ctx.fill();
    ctx.font = "8px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    data.forEach((d, i) => ctx.fillText(d.label, pad.l + i * stepX - 14, h - 4));
  }, [data, cursor]);
  return <canvas ref={canvasRef} width={520} height={90} className="w-full rounded" />;
}

const typeIcon: Record<string, React.ReactNode> = {
  acquisition: <DollarSign className="w-3 h-3" style={{ color: "#2d6a4f" }} />,
  market: <Activity className="w-3 h-3 text-amber-400" />,
  tenant: <Building2 className="w-3 h-3 text-sky-400" />,
  valuation: <TrendingUp className="w-3 h-3" style={{ color: "#2d6a4f" }} />,
  filing: <AlertTriangle className="w-3 h-3 text-orange-400" />,
  current: <ChevronRight className="w-3 h-3 text-violet-400" />,
  distress: <AlertTriangle className="w-3 h-3 text-red-400" />,
};

export default function TerraReplayPage() {
  const [playing, setPlaying] = useState(false);
  const [cursor, setCursor] = useState(12);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const { data: propertiesData, isError: propertiesListError } = useStandardQuery<{ data: { properties: Array<{ id: number; address: string }> } }>({
    queryKey: ["terra-properties-replay-list"],
    queryFn: () => fetch("/api/terra/properties").then(r => r.ok ? r.json() : Promise.reject(r.status)),
    staleTime: 120000,
    retry: 1,
  });

  const properties = propertiesData?.data?.properties ?? [];
  const effectivePropertyId = selectedPropertyId ?? (properties[0] ? String(properties[0].id) : null);

  const { data: historyData, isError: historyError, isLoading: historyLoading, isFetching: historyFetching } = useStandardQuery<{ data: { events: ApiEvent[]; address: string } }>({
    queryKey: ["terra-property-history", effectivePropertyId],
    queryFn: () => fetch(`/api/terra/properties/${effectivePropertyId}/history`).then(r => r.ok ? r.json() : Promise.reject(r.status)),
    staleTime: 60000,
    retry: 1,
    enabled: !!effectivePropertyId,
  });

  const apiEvents = historyData?.data?.events;
  const isLiveEvents = apiEvents && apiEvents.length > 0;
  const PROPERTY_EVENTS: PropertyEvent[] = isLiveEvents ? apiEvents : DEMO_PROPERTY_EVENTS;
  const total = PROPERTY_EVENTS.length;

  const dataMode: "loading" | "live" | "demo" | "error" = (historyLoading || (historyFetching && !historyData))
    ? "loading"
    : (historyError || propertiesListError)
    ? "error"
    : isLiveEvents
    ? "live"
    : "demo";

  useEffect(() => {
    setCursor(Math.min(12, total - 1));
  }, [total]);

  useEffect(() => {
    if (!playing) return;
    if (cursor >= total - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setCursor(c => Math.min(c + 1, total - 1)), 900);
    return () => clearTimeout(t);
  }, [playing, cursor, total]);

  const valCursor = Math.min(VALUATION_TIMELINE.length - 1, Math.floor((cursor / Math.max(total - 1, 1)) * (VALUATION_TIMELINE.length - 1)));
  const current = PROPERTY_EVENTS[Math.min(cursor, total - 1)] ?? PROPERTY_EVENTS[0];
  const valAtCursor = VALUATION_TIMELINE[valCursor];

  const selectedAddress = properties.find(p => String(p.id) === effectivePropertyId)?.address ?? historyData?.data?.address ?? "84 Grand St";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <RotateCcw className="w-4 h-4" style={{ color: "#8b7ac8" }} />
            <h1 className="font-display text-xl font-bold" style={{ color: "rgba(255,255,255,0.88)" }}>Property Evolution Replay</h1>
            <span className="text-[9px] px-2 py-0.5 rounded-full border" style={{ color: "#8b7ac8", borderColor: "rgba(139,122,200,0.3)", background: "rgba(139,122,200,0.08)" }}>ATLAS RUNTIME</span>
          </div>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>Step through the property worldline — every valuation shift, market event, and tenant change</p>
        </div>
        <div className="flex items-center gap-2">
          {properties.length > 0 && (
            <select
              value={effectivePropertyId ?? ""}
              onChange={e => { setSelectedPropertyId(e.target.value); setCursor(0); setPlaying(false); }}
              className="text-[10px] rounded-lg px-2 py-1 outline-none"
              style={{ background: "rgba(5,10,8,0.8)", border: "1px solid rgba(45,106,79,0.2)", color: "rgba(255,255,255,0.7)" }}
            >
              {properties.slice(0, 20).map(p => (
                <option key={p.id} value={String(p.id)}>{p.address}</option>
              ))}
            </select>
          )}
          {dataMode === "live" && (
            <div className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-lg border" style={{ color: "#2d6a4f", borderColor: "rgba(45,106,79,0.3)", background: "rgba(45,106,79,0.08)" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#2d6a4f" }} />LIVE
            </div>
          )}
          {dataMode === "demo" && (
            <div className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />DEMO
            </div>
          )}
          {dataMode === "error" && (
            <div className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />ERROR
            </div>
          )}
          {dataMode === "loading" && (
            <div className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-lg border" style={{ color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.03)" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.4)" }} />LOADING
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-lg border" style={{ color: "#8b7ac8", borderColor: "rgba(139,122,200,0.25)", background: "rgba(139,122,200,0.06)" }}>
            <Clock className="w-3 h-3" />
            {current.time}
          </div>
        </div>
      </div>

      {dataMode === "live" && (
        <div className="flex items-center gap-2 text-[10px] px-3 py-2 rounded-lg border" style={{ borderColor: "rgba(45,106,79,0.2)", background: "rgba(45,106,79,0.04)", color: "#2d6a4f" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#2d6a4f" }} />
          Live history from {selectedAddress} — {total} events loaded
        </div>
      )}
      {dataMode === "demo" && (
        <div className="flex items-start gap-2 text-[11px] px-3 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/8 text-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <p className="font-semibold text-amber-300">Demo data — no live records found</p>
            <p className="text-amber-300/70 text-[10px] mt-0.5">No property history was returned for {selectedAddress}. Showing illustrative demo events. The page will switch to live data automatically once real events are recorded.</p>
          </div>
        </div>
      )}
      {dataMode === "error" && (
        <div className="flex items-start gap-2 text-[11px] px-3 py-2.5 rounded-lg border border-red-500/30 bg-red-500/8 text-red-200">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-400" />
          <div>
            <p className="font-semibold text-red-300">Live data unavailable</p>
            <p className="text-red-300/70 text-[10px] mt-0.5">The property history API request failed. Showing demo content while the connection is restored.</p>
          </div>
        </div>
      )}

      <div className="rounded-xl p-4 flex items-start gap-4" style={{ background: "rgba(5,10,8,0.9)", border: "1px solid rgba(139,122,200,0.2)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(139,122,200,0.08)", border: "1px solid rgba(139,122,200,0.2)" }}>
          {typeIcon[current.type] ?? <Activity className="w-3.5 h-3.5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>{current.label}</p>
            {current.severity === "warn" && <span className="text-[9px] text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/8 border border-amber-500/20">warn</span>}
          </div>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>{current.detail}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>Event {cursor + 1} / {total}</p>
          <p className="text-[11px] font-mono font-bold mt-0.5" style={{ color: "#2d6a4f" }}>${(valAtCursor.value / 1000).toFixed(2)}M AVM</p>
        </div>
      </div>

      <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(5,10,8,0.8)", border: "1px solid rgba(45,106,79,0.12)" }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.25)" }}>Property Valuation Timeline</span>
          <div className="flex items-center gap-3 text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            <span className="inline-block w-3 h-0.5 rounded" style={{ background: "rgba(45,106,79,0.8)" }} />AVM
            <span className="inline-block w-3 h-0.5 rounded ml-1" style={{ background: "rgba(200,149,60,0.55)" }} />NOI (K)
          </div>
        </div>
        <ValuationChart data={VALUATION_TIMELINE} cursor={valCursor} />
        <input type="range" min={0} max={total - 1} value={cursor} onChange={e => { setPlaying(false); setCursor(Number(e.target.value)); }}
          className="w-full h-1.5 rounded-full cursor-pointer" style={{ accentColor: "#8b7ac8" }} />
        <div className="flex items-center justify-center gap-3">
          {[
            { label: "Start", icon: <SkipBack className="w-3.5 h-3.5" />, action: () => { setPlaying(false); setCursor(0); } },
            { label: "‹ Prev", icon: null, action: () => setCursor(c => Math.max(0, c - 1)) },
          ].map(btn => (
            <button key={btn.label} onClick={btn.action} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors" style={{ borderColor: "rgba(45,106,79,0.15)", background: "rgba(5,10,8,0.6)", color: "rgba(255,255,255,0.4)" }}>
              {btn.icon}{btn.label}
            </button>
          ))}
          <button onClick={() => setPlaying(p => !p)} className="flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-lg border transition-colors" style={playing ? { borderColor: "rgba(139,122,200,0.35)", background: "rgba(139,122,200,0.1)", color: "#c5b8e8" } : { borderColor: "rgba(45,106,79,0.25)", background: "rgba(45,106,79,0.08)", color: "#6b8f71" }}>
            {playing ? <><Pause className="w-3.5 h-3.5" />Pause</> : <><Play className="w-3.5 h-3.5" />Play</>}
          </button>
          {[
            { label: "Next ›", icon: null, action: () => setCursor(c => Math.min(total - 1, c + 1)) },
            { label: "End", icon: <SkipForward className="w-3.5 h-3.5" />, action: () => { setPlaying(false); setCursor(total - 1); } },
          ].map(btn => (
            <button key={btn.label} onClick={btn.action} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors" style={{ borderColor: "rgba(45,106,79,0.15)", background: "rgba(5,10,8,0.6)", color: "rgba(255,255,255,0.4)" }}>
              {btn.label}{btn.icon}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: "rgba(5,10,8,0.8)", border: "1px solid rgba(45,106,79,0.12)" }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(45,106,79,0.1)" }}>
          <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>Property History — {selectedAddress}</p>
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.28)" }}>Click any event to jump to that point in the worldline</p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {PROPERTY_EVENTS.map((ev, i) => {
            const isCurrent = i === cursor;
            const isPast = i < cursor;
            return (
              <div key={i} onClick={() => { setPlaying(false); setCursor(i); }} className="flex gap-3 px-4 py-3 border-b cursor-pointer transition-all" style={{ borderColor: "rgba(45,106,79,0.05)", background: isCurrent ? "rgba(139,122,200,0.06)" : undefined, opacity: isPast ? 0.7 : i > cursor ? 0.4 : 1 }}>
                <div className="flex flex-col items-center mt-0.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: isCurrent ? "#8b7ac8" : isPast ? "rgba(45,106,79,0.4)" : "rgba(45,106,79,0.15)" }} />
                  {i < PROPERTY_EVENTS.length - 1 && <div className="w-px flex-1 mt-0.5" style={{ background: "rgba(45,106,79,0.08)" }} />}
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    {typeIcon[ev.type] ?? <Activity className="w-3 h-3" style={{ color: "rgba(255,255,255,0.4)" }} />}
                    <p className="text-[11px] font-medium" style={{ color: isCurrent ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.6)" }}>{ev.label}</p>
                    {ev.severity === "warn" && <span className="text-[9px] text-amber-400">⚠</span>}
                  </div>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{ev.time} · {ev.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
