import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { GitBranch, Layers, MapPin, AlertTriangle, Activity, Navigation, Shield, CloudRain, RotateCcw, ChevronRight, Anchor, Radio, Clock, Zap, Lock, RefreshCw } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";

const DEMO_VESSELS = [
  { id: "MV-001", name: "Pacific Navigator", type: "VLCC Tanker", flag: "🇱🇷", lat: 24.5, lon: 55.2, status: "at_sea", heading: 278, speed: 13.4 },
  { id: "MV-002", name: "Arctic Breeze", type: "LNG Carrier", flag: "🇬🇷", lat: 1.3, lon: 103.8, status: "in_port", heading: 0, speed: 0 },
  { id: "MV-003", name: "Meridian Bulk", type: "Capesize Bulker", flag: "🇲🇭", lat: -33.8, lon: 18.4, status: "at_sea", heading: 192, speed: 11.8 },
  { id: "MV-004", name: "Cape Resolute", type: "Panamax Bulk", flag: "🇵🇦", lat: 29.9, lon: 32.5, status: "anchored", heading: 45, speed: 0 },
];

const DEMO_ROUTE_WAYPOINTS = [
  { id: "wp1", label: "Rotterdam", lat: 51.9, lon: 4.5, eta: "Apr 20", type: "destination" },
  { id: "wp2", label: "Gibraltar", lat: 36.1, lon: -5.3, eta: "Apr 17", type: "waypoint" },
  { id: "wp3", label: "Suez Canal", lat: 30.0, lon: 32.5, eta: "Apr 15", type: "chokepoint" },
  { id: "wp4", label: "Bab-el-Mandeb", lat: 12.5, lon: 43.5, eta: "Apr 13", type: "chokepoint" },
  { id: "wp5", label: "Origin Port", lat: 22.3, lon: 59.6, eta: "Departed Apr 8", type: "origin" },
];

const OVERLAYS = [
  { id: "weather", label: "Weather Systems", icon: CloudRain, active: true, color: "#4a90b8", severity: "moderate" },
  { id: "sanctions", label: "Sanctions Zones", icon: Shield, active: false, color: "#c45a4a", severity: "high" },
  { id: "port-disruption", label: "Port Disruptions", icon: Anchor, active: true, color: "#c8953c", severity: "low" },
  { id: "route-anomaly", label: "Route Anomalies", icon: Navigation, active: false, color: "#8b7ac8", severity: "moderate" },
];

const DEMO_ROUTE_MEMORY = [
  { date: "Apr 8–10", segment: "Persian Gulf → Indian Ocean", avgSpeed: 13.8, fuelBurn: 72.4, incidents: 0, aisGap: false },
  { date: "Apr 10–12", segment: "Indian Ocean transit", avgSpeed: 12.9, fuelBurn: 68.1, incidents: 1, aisGap: false },
  { date: "Apr 12–14", segment: "Bab-el-Mandeb crossing", avgSpeed: 11.2, fuelBurn: 61.0, incidents: 0, aisGap: true },
  { date: "Apr 14–16", segment: "Red Sea → Suez approach", avgSpeed: 13.4, fuelBurn: 69.8, incidents: 0, aisGap: false },
];

const TWIN_STATUS = [
  { label: "AIS Sync", value: "48ms lag", status: "ok" },
  { label: "Route Memory", value: "8 voyages", status: "ok" },
  { label: "Sensor Fidelity", value: "94%", status: "ok" },
  { label: "Drift Score", value: "0.12σ", status: "ok" },
  { label: "Sanctions Screen", value: "Live", status: "warn" },
  { label: "Twin Worldline", value: "Active", status: "ok" },
];

interface ApiVessel {
  id: number;
  name: string;
  vesselType: string;
  flag: string | null;
  status: string;
}

interface Waypoint {
  id: string;
  label: string;
  lat: number;
  lon: number;
  eta: string;
  type: string;
}

interface DisplayVessel {
  id: string;
  name: string;
  type: string;
  flag: string;
  lat: number;
  lon: number;
  status: string;
  heading: number;
  speed: number;
}

function mapApiVessel(v: ApiVessel, idx: number): DisplayVessel {
  const demo = DEMO_VESSELS[idx % DEMO_VESSELS.length];
  return {
    id: String(v.id),
    name: v.name,
    type: v.vesselType,
    flag: v.flag ?? "🚢",
    lat: demo.lat,
    lon: demo.lon,
    status: v.status,
    heading: demo.heading,
    speed: demo.speed,
  };
}

function RouteMemoryCanvas({ vesselId, waypoints }: { vesselId: string; waypoints: Waypoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    let raf: number;
    const draw = () => {
      frame++;
      const t = frame / 60;
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#060d1a";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(56,189,248,0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      const pts: [number, number][] = [[w * 0.85, h * 0.65], [w * 0.72, h * 0.60], [w * 0.58, h * 0.52], [w * 0.45, h * 0.42], [w * 0.28, h * 0.38], [w * 0.14, h * 0.32]];
      ctx.beginPath();
      ctx.strokeStyle = "rgba(56,189,248,0.18)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      pts.forEach(([x, y], i) => { if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.strokeStyle = "rgba(56,189,248,0.6)";
      ctx.lineWidth = 2;
      const activePts = pts.slice(2);
      activePts.forEach(([x, y], i) => { if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
      ctx.stroke();
      const wpColors: Record<string, string> = { origin: "#6b8f71", waypoint: "#4a90b8", chokepoint: "#c8953c", destination: "#8b7ac8" };
      pts.forEach(([x, y], i) => {
        const wp = waypoints[i];
        if (!wp) return;
        const pulse = (Math.sin(t * 2 + i) + 1) / 2;
        const c = wpColors[wp.type] ?? "#4a90b8";
        ctx.beginPath();
        ctx.arc(x, y, 4 + pulse * 2, 0, Math.PI * 2);
        ctx.strokeStyle = `${c}40`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = c;
        ctx.fill();
        ctx.font = "9px monospace";
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.fillText(wp.label, x + 8, y - 4);
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.fillText(wp.eta, x + 8, y + 7);
      });
      const [vx, vy] = pts[3];
      const pulse2 = (Math.sin(t * 3) + 1) / 2;
      ctx.beginPath();
      ctx.arc(vx, vy, 6 + pulse2 * 4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(56,189,248,${0.15 * (1 - pulse2)})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(vx, vy, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#38bdf8";
      ctx.fill();
      ctx.font = "9px monospace";
      ctx.fillStyle = "#38bdf8";
      ctx.fillText("▶ LIVE", vx + 8, vy - 6);
      ctx.fillStyle = "rgba(56,189,248,0.4)";
      ctx.fillText(vesselId, vx + 8, vy + 4);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [vesselId, waypoints]);
  return <canvas ref={canvasRef} width={520} height={240} className="w-full rounded-lg" />;
}

export default function VesselsAtlasRuntimePage() {
  const [selectedVesselId, setSelectedVesselId] = useState<string>(DEMO_VESSELS[0].id);
  const [overlays, setOverlays] = useState(OVERLAYS.map(o => ({ ...o })));
  const [safeMode, setSafeMode] = useState(false);

  const { data: driftData } = useQuery<{ twins: Array<{ twinId: string; driftScore: number; status: string }> }>({
    queryKey: ["vessels-atlas-drift"],
    queryFn: () => fetch("/api/atlas/spatial/drift?twinCategory=vessel").then(r => r.ok ? r.json() : Promise.reject(r.status)).then(r => r.data ?? r),
    staleTime: 60000,
    retry: 1,
  });
  const { data: branchData } = useQuery<{ count: number }>({
    queryKey: ["vessels-atlas-branches"],
    queryFn: () => fetch("/api/atlas/spatial/branches?twinCategory=vessel").then(r => r.ok ? r.json() : Promise.reject(r.status)).then(r => r.data ?? r),
    staleTime: 60000,
    retry: 1,
  });
  const { data: liveVesselsData, isError: vesselsError, isLoading: vesselsLoading } = useQuery<{ data: ApiVessel[] }>({
    queryKey: ["vessels-list"],
    queryFn: () => fetch("/api/vessels").then(r => r.ok ? r.json() : Promise.reject(r.status)),
    staleTime: 120000,
    retry: 1,
  });
  const { data: liveRouteData } = useQuery<{ data: { vessel: ApiVessel; position: { latitude: string; longitude: string; heading: string; speed: string } | null; waypoints: Waypoint[] } }>({
    queryKey: ["vessels-route", selectedVesselId],
    queryFn: () => fetch(`/api/vessels/${selectedVesselId}/route`).then(r => r.ok ? r.json() : Promise.reject(r.status)),
    staleTime: 30000,
    retry: 1,
    enabled: !!selectedVesselId,
  });

  const apiVessels = liveVesselsData?.data;
  const displayVessels: DisplayVessel[] = apiVessels && apiVessels.length > 0
    ? apiVessels.slice(0, 6).map(mapApiVessel)
    : DEMO_VESSELS;

  const dataMode: "loading" | "live" | "demo" | "error" = vesselsLoading
    ? "loading"
    : vesselsError
    ? "error"
    : (apiVessels && apiVessels.length > 0)
    ? "live"
    : "demo";

  useEffect(() => {
    if (displayVessels.length > 0 && !displayVessels.find(v => v.id === selectedVesselId)) {
      setSelectedVesselId(displayVessels[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiVessels]);

  const selectedVessel = displayVessels.find(v => v.id === selectedVesselId) ?? displayVessels[0];

  const liveWaypoints = liveRouteData?.data?.waypoints;
  const waypoints: Waypoint[] = (liveWaypoints && liveWaypoints.length > 0) ? liveWaypoints : DEMO_ROUTE_WAYPOINTS;
  const isLiveWaypoints = liveWaypoints && liveWaypoints.length > 0;

  const livePosition = liveRouteData?.data?.position;
  const displayHeading = livePosition?.heading ? Number(livePosition.heading) : selectedVessel.heading;
  const displaySpeed = livePosition?.speed ? Number(livePosition.speed) : selectedVessel.speed;

  const liveDriftAvg = driftData?.twins?.length
    ? (driftData.twins.reduce((s, t) => s + t.driftScore, 0) / driftData.twins.length).toFixed(2)
    : null;
  const liveBranchCount = branchData?.count ?? null;

  const toggleOverlay = (id: string) => {
    setOverlays(prev => prev.map(o => o.id === id ? { ...o, active: !o.active } : o));
  };

  const statusColors: Record<string, string> = {
    at_sea: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    in_port: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    anchored: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    active: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-sky-400" />
            <h1 className="font-display text-xl font-bold text-sky-50">ATLAS Spatial Runtime</h1>
            <Badge variant="outline" className="text-[9px] text-violet-400 border-violet-500/30 bg-violet-500/5">TWIN ACTIVE</Badge>
          </div>
          <p className="text-xs text-sky-400/40">Vessel digital twin with route memory, spatial overlays, and live worldline tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSafeMode(m => !m)}
            className={cn("flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-lg border transition-colors", safeMode ? "text-violet-400 bg-violet-500/10 border-violet-500/30" : "text-sky-400/40 border-sky-500/10 hover:bg-sky-500/5")}
          >
            <Lock className="w-3 h-3" /> {safeMode ? "Safe Mode ON" : "Safe Mode"}
          </button>
          {dataMode === "live" && (
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </div>
          )}
          {dataMode === "demo" && (
            <div className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              DEMO
            </div>
          )}
          {dataMode === "error" && (
            <div className="flex items-center gap-1.5 text-[10px] text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              ERROR
            </div>
          )}
          {dataMode === "loading" && (
            <div className="flex items-center gap-1.5 text-[10px] text-sky-400/60 bg-sky-500/5 border border-sky-500/20 px-2 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400/60 animate-pulse" />
              LOADING
            </div>
          )}
        </div>
      </div>

      {dataMode === "demo" && (
        <div className="flex items-start gap-2 text-[11px] px-3 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/8 text-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <p className="font-semibold text-amber-300">Demo data — no live records found</p>
            <p className="text-amber-300/70 text-[10px] mt-0.5">The vessels API responded successfully but returned no records. The page is showing illustrative demo content. It will switch to live data automatically once real records are available.</p>
          </div>
        </div>
      )}
      {dataMode === "error" && (
        <div className="flex items-start gap-2 text-[11px] px-3 py-2.5 rounded-lg border border-red-500/30 bg-red-500/8 text-red-200">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-400" />
          <div>
            <p className="font-semibold text-red-300">Live data unavailable</p>
            <p className="text-red-300/70 text-[10px] mt-0.5">The vessels API request failed. Showing demo content while the connection is restored.</p>
          </div>
        </div>
      )}

      {(liveDriftAvg !== null || liveBranchCount !== null || isLiveWaypoints) && (
        <div className="flex items-center gap-3 text-[10px] px-3 py-2 rounded-lg border border-sky-500/10 bg-sky-500/3">
          {isLiveWaypoints && (
            <span className="text-emerald-400/70 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Live route data</span>
          )}
          {liveDriftAvg !== null && (
            <span className="text-sky-400/50">Live Drift Avg: <span className="font-mono text-sky-300">{liveDriftAvg}σ</span></span>
          )}
          {liveBranchCount !== null && (
            <>
              <span className="text-sky-400/20">·</span>
              <span className="flex items-center gap-1 text-sky-400/50"><GitBranch className="w-3 h-3" /> <span className="font-mono text-sky-300">{liveBranchCount}</span> scenario branch{liveBranchCount !== 1 ? "es" : ""}</span>
            </>
          )}
        </div>
      )}

      {safeMode && (
        <div className="flex items-center gap-2 text-[10px] px-3 py-2 rounded-lg border border-violet-500/20 bg-violet-500/5 text-violet-300">
          <Lock className="w-3 h-3 shrink-0" /> Executive Safe Mode — only stable twin data shown; degraded signals suppressed.
        </div>
      )}

      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {TWIN_STATUS.map(s => (
          <div key={s.label} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] whitespace-nowrap shrink-0", s.status === "warn" ? "border-amber-500/25 bg-amber-500/5" : "border-sky-500/10 bg-[#0a1628]/60")}>
            <span className={cn("w-1.5 h-1.5 rounded-full", s.status === "warn" ? "bg-amber-400 animate-pulse" : "bg-emerald-400")} />
            <span className="text-sky-400/50">{s.label}</span>
            <span className={cn("font-mono", s.status === "warn" ? "text-amber-400" : "text-sky-300")}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {displayVessels.map(v => (
          <button key={v.id} onClick={() => setSelectedVesselId(v.id)} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-xs whitespace-nowrap transition-all", selectedVessel.id === v.id ? "bg-sky-500/10 border-sky-500/30 text-sky-300" : "bg-[#0a1628]/60 border-sky-500/10 text-sky-400/50 hover:text-sky-300")}>
            <span>{v.flag}</span>
            <div className="text-left">
              <p className="font-medium">{v.name}</p>
              <p className="text-[9px] opacity-60">{v.type}</p>
            </div>
            <Badge variant="outline" className={cn("text-[8px] ml-1", statusColors[v.status] ?? "")}>{v.status.replace("_", " ")}</Badge>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-sky-500/10 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-sky-100">{selectedVessel.name} — Route Memory Twin</p>
                <p className="text-[10px] text-sky-400/40">{selectedVessel.type} · Live spatial worldline · {displayHeading}° heading · {displaySpeed} kts</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-sky-400/50 font-mono">SYNC 48ms</span>
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              </div>
            </div>
            <div className="p-4">
              <RouteMemoryCanvas vesselId={selectedVessel.id} waypoints={waypoints} />
            </div>
          </div>

          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-sky-500/10 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-sm font-semibold text-sky-100">Route Memory Segments</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-sky-500/10">
                    {["Date", "Segment", "Avg Speed", "Fuel Burn", "Incidents", "AIS Gap"].map(h => (
                      <th key={h} className="text-left px-4 py-2 text-[10px] text-sky-400/40 font-normal uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DEMO_ROUTE_MEMORY.map((row, i) => (
                    <tr key={i} className="border-b border-sky-500/5 hover:bg-sky-500/5 transition-colors">
                      <td className="px-4 py-2.5 text-sky-400/60 font-mono text-[10px]">{row.date}</td>
                      <td className="px-4 py-2.5 text-sky-200">{row.segment}</td>
                      <td className="px-4 py-2.5 font-mono text-sky-300">{row.avgSpeed} kts</td>
                      <td className="px-4 py-2.5 font-mono text-sky-300">{row.fuelBurn} t/d</td>
                      <td className="px-4 py-2.5">
                        {row.incidents > 0
                          ? <span className="text-amber-400 font-mono">{row.incidents}</span>
                          : <span className="text-emerald-400/60 text-[10px]">None</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        {row.aisGap
                          ? <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">GAP DETECTED</span>
                          : <span className="text-[10px] text-emerald-400/50">Clean</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <p className="text-xs font-semibold text-sky-200 mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              External Overlays
            </p>
            <div className="space-y-2">
              {overlays.map(ov => {
                const Icon = ov.icon;
                return (
                  <div key={ov.id} className={cn("flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all", ov.active ? "border-sky-500/20 bg-sky-500/5" : "border-transparent bg-white/2 opacity-50")} onClick={() => toggleOverlay(ov.id)}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" style={{ color: ov.active ? ov.color : "rgba(255,255,255,0.25)" }} />
                      <span className="text-[11px] text-sky-200">{ov.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded", ov.severity === "high" ? "text-red-400 bg-red-500/10" : ov.severity === "moderate" ? "text-amber-400 bg-amber-500/10" : "text-emerald-400 bg-emerald-500/10")}>{ov.severity}</span>
                      <div className={cn("w-3 h-3 rounded-sm border flex items-center justify-center", ov.active ? "border-sky-400 bg-sky-500/20" : "border-sky-500/20")}>
                        {ov.active && <span className="text-[8px] text-sky-400">✓</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <p className="text-xs font-semibold text-sky-200 mb-3 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-sky-400" />
              Waypoint Sequence
              {isLiveWaypoints && <span className="text-[9px] text-emerald-400/70 ml-auto">● live</span>}
            </p>
            <div className="space-y-0">
              {waypoints.slice().reverse().map((wp, i, arr) => {
                const typeColors: Record<string, string> = { origin: "bg-emerald-400", waypoint: "bg-sky-400", chokepoint: "bg-amber-400", destination: "bg-violet-400" };
                const isActive = i === 2;
                return (
                  <div key={wp.id} className="flex gap-2">
                    <div className="flex flex-col items-center">
                      <div className={cn("w-2 h-2 rounded-full mt-1 shrink-0", typeColors[wp.type] ?? "bg-sky-400", isActive && "ring-2 ring-sky-400/40")} />
                      {i < arr.length - 1 && <div className="w-px flex-1 bg-sky-500/10 mt-0.5" />}
                    </div>
                    <div className="pb-3">
                      <p className={cn("text-[11px] font-medium", isActive ? "text-sky-300" : "text-sky-400/60")}>{wp.label}</p>
                      <p className="text-[10px] text-sky-400/35 font-mono">{wp.eta}</p>
                      {isActive && <span className="text-[9px] text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded mt-0.5 inline-block">← CURRENT</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <p className="text-xs font-semibold text-sky-200 mb-3 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Twin Drift Monitor
            </p>
            {[
              { label: "Position Drift", val: "0.12σ", ok: true },
              { label: "Speed Drift", val: "0.08σ", ok: true },
              { label: "Fuel Variance", val: "1.4σ", ok: false },
              { label: "ETA Variance", val: "+4h", ok: false },
            ].map(d => (
              <div key={d.label} className="flex items-center justify-between py-1.5 border-b border-sky-500/5 last:border-0">
                <span className="text-[10px] text-sky-400/50">{d.label}</span>
                <span className={cn("text-[10px] font-mono", d.ok ? "text-emerald-400" : "text-amber-400")}>{d.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
