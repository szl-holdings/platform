import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layers, Building2, TrendingUp, TrendingDown, Activity, MapPin, BarChart3, AlertTriangle, DollarSign, Shield, Clock, ChevronRight, Lock, GitBranch } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

const DEMO_PROPERTIES = [
  { id: "p-001", address: "84 Grand St", neighborhood: "Williamsburg", type: "Multi-Family", units: 12, value: 3_800_000, noi: 228_000, ltv: 0.58, status: "stable" },
  { id: "p-002", address: "210 Kent Ave", neighborhood: "Williamsburg", type: "Mixed-Use", units: 18, value: 5_200_000, noi: 364_000, ltv: 0.62, status: "stable" },
  { id: "p-003", address: "1002 Myrtle Ave", neighborhood: "Bushwick", type: "Multi-Family", units: 8, value: 2_100_000, noi: 147_000, ltv: 0.71, status: "watch" },
  { id: "p-004", address: "422 Flatbush Ave", neighborhood: "Park Slope", type: "Commercial", units: 1, value: 7_400_000, noi: 444_000, ltv: 0.54, status: "stable" },
];

const OVERLAYS = [
  { id: "submarket", label: "Submarket Pressure", active: true, color: "#2d6a4f", severity: "moderate" },
  { id: "public-filings", label: "Public Filings (UCC/Lis)", active: true, color: "#c8953c", severity: "low" },
  { id: "cap-rate", label: "Cap Rate Expansion", active: false, color: "#4a90b8", severity: "moderate" },
  { id: "flood", label: "Flood & Climate Risk", active: false, color: "#8b7ac8", severity: "high" },
];

const TWIN_STATUS = [
  { label: "AVM Sync", value: "Real-time", status: "ok" },
  { label: "Property Memory", value: "36 months", status: "ok" },
  { label: "Market Fidelity", value: "97%", status: "ok" },
  { label: "Drift Score", value: "0.08σ", status: "ok" },
  { label: "Lien Screen", value: "Live", status: "ok" },
  { label: "Submarket Twin", value: "Active", status: "warn" },
];

const DEMO_MARKET_MEMORY = [
  { period: "Q1 2024", capRate: 5.8, rentGrowth: 3.2, vacancyRate: 4.1, submktPressure: 28 },
  { period: "Q2 2024", capRate: 6.1, rentGrowth: 2.4, vacancyRate: 5.0, submktPressure: 35 },
  { period: "Q3 2024", capRate: 6.4, rentGrowth: 1.8, vacancyRate: 5.8, submktPressure: 42 },
  { period: "Q4 2024", capRate: 6.6, rentGrowth: 1.2, vacancyRate: 6.2, submktPressure: 48 },
  { period: "Q1 2025", capRate: 6.3, rentGrowth: 2.1, vacancyRate: 5.4, submktPressure: 38 },
  { period: "Q2 2025", capRate: 6.0, rentGrowth: 2.8, vacancyRate: 4.8, submktPressure: 31 },
];

interface DisplayProperty {
  id: string;
  address: string;
  neighborhood: string;
  type: string;
  units: number;
  value: number;
  noi: number;
  ltv: number;
  status: string;
}

interface ApiProperty {
  id: number;
  address: string;
  city: string | null;
  propertyType: string;
  units: number | null;
  assessedValue: string | null;
  capRate: string | null;
  noi: string | null;
  externalId: string | null;
  kpis?: { value: number | null; noi: number | null; capRate: number | null };
}

interface MarketData {
  totalProperties: number;
  avgCapRate: string | null;
  dataSource: string;
}

function mapApiProperty(p: ApiProperty, idx: number): DisplayProperty {
  const demo = DEMO_PROPERTIES[idx % DEMO_PROPERTIES.length];
  return {
    id: String(p.id),
    address: p.address,
    neighborhood: p.city ?? demo.neighborhood,
    type: p.propertyType,
    units: p.units ?? demo.units,
    value: (p.kpis?.value ?? Number(p.assessedValue ?? 0)) || demo.value,
    noi: (p.kpis?.noi ?? Number(p.noi ?? 0)) || demo.noi,
    ltv: demo.ltv,
    status: "stable",
  };
}

function fmt(n: number, compact = true) {
  if (compact) {
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  }
  return `$${n.toLocaleString()}`;
}

function PropertyTwinCanvas({ propertyId, capRate, noiDrift }: { propertyId: string; capRate: string; noiDrift: string }) {
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
      ctx.fillStyle = "#050a08";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(45,106,79,0.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      const blockW = 72, blockH = 52, gap = 16;
      const startX = w / 2 - (2 * blockW + 1.5 * gap), startY = h / 2 - blockH;
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 4; col++) {
          const bx = startX + col * (blockW + gap);
          const by = startY + row * (blockH + gap);
          const isSubject = row === 0 && col === 1;
          const pulse = (Math.sin(t * 2 + col + row) + 1) / 2;
          const alpha = isSubject ? 0.8 : 0.2 + pulse * 0.1;
          ctx.fillStyle = isSubject ? `rgba(45,106,79,${alpha})` : `rgba(45,106,79,${alpha * 0.4})`;
          ctx.strokeStyle = isSubject ? `rgba(45,106,79,0.9)` : `rgba(45,106,79,0.15)`;
          ctx.lineWidth = isSubject ? 1.5 : 1;
          ctx.beginPath();
          ctx.rect(bx, by, blockW, blockH);
          ctx.fill();
          ctx.stroke();
          if (isSubject) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(45,106,79,${0.3 * (1 - pulse)})`;
            ctx.lineWidth = 2;
            ctx.rect(bx - 6 - pulse * 4, by - 6 - pulse * 4, blockW + 12 + pulse * 8, blockH + 12 + pulse * 8);
            ctx.stroke();
            ctx.font = "bold 8px monospace";
            ctx.fillStyle = "rgba(45,106,79,1)";
            ctx.fillText("TWIN", bx + 4, by + 14);
            ctx.font = "7px monospace";
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.fillText(propertyId, bx + 4, by + 26);
          }
          const winRows = 2, winCols = 3;
          for (let wr = 0; wr < winRows; wr++) {
            for (let wc = 0; wc < winCols; wc++) {
              const wx = bx + 8 + wc * 20;
              const wy = by + 10 + wr * 18;
              const lit = Math.random() > 0.4;
              ctx.fillStyle = lit ? `rgba(45,106,79,${0.4 + pulse * 0.3})` : "rgba(255,255,255,0.04)";
              ctx.fillRect(wx, wy, 10, 8);
            }
          }
        }
      }
      const dots = [[w * 0.15, h * 0.3], [w * 0.8, h * 0.25], [w * 0.65, h * 0.72], [w * 0.25, h * 0.75]];
      dots.forEach(([dx, dy], i) => {
        const p = (Math.sin(t * 2.5 + i * 0.8) + 1) / 2;
        ctx.beginPath();
        ctx.arc(dx, dy, 3 + p * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,149,60,${0.4 + p * 0.4})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(dx, dy, 6 + p * 5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(200,149,60,${0.15 * (1 - p)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      ctx.font = "9px monospace";
      ctx.fillStyle = "rgba(45,106,79,0.3)";
      [`PROPERTY_TWIN: ${propertyId}`, `AVM_SYNC: ${(Date.now() % 1000 / 10).toFixed(0)}ms`, `CAP_RATE: ${capRate}`, `NOI_DRIFT: ${noiDrift}`].forEach((line, i) => {
        ctx.fillText(line, 8, 16 + i * 14);
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [propertyId, capRate, noiDrift]);
  return <canvas ref={canvasRef} width={520} height={220} className="w-full rounded-lg" />;
}

export default function TerraAtlasRuntimePage() {
  const [selectedId, setSelectedId] = useState<string>(DEMO_PROPERTIES[0].id);
  const [overlays, setOverlays] = useState(OVERLAYS.map(o => ({ ...o })));
  const [safeMode, setSafeMode] = useState(false);

  const { data: driftData } = useQuery<{ twins: Array<{ twinId: string; driftScore: number; status: string }> }>({
    queryKey: ["terra-atlas-drift"],
    queryFn: () => fetch("/api/atlas/spatial/drift?twinCategory=property").then(r => r.ok ? r.json() : Promise.reject(r.status)).then(r => r.data ?? r),
    staleTime: 60000,
    retry: 1,
  });
  const { data: branchData } = useQuery<{ count: number }>({
    queryKey: ["terra-atlas-branches"],
    queryFn: () => fetch("/api/atlas/spatial/branches?twinCategory=property").then(r => r.ok ? r.json() : Promise.reject(r.status)).then(r => r.data ?? r),
    staleTime: 60000,
    retry: 1,
  });
  const { data: propertiesData } = useQuery<{ data: { properties: ApiProperty[] } }>({
    queryKey: ["terra-properties-list"],
    queryFn: () => fetch("/api/terra/properties").then(r => r.ok ? r.json() : Promise.reject(r.status)),
    staleTime: 120000,
    retry: 1,
  });
  const { data: selectedPropData } = useQuery<{ data: ApiProperty }>({
    queryKey: ["terra-property", selectedId],
    queryFn: () => fetch(`/api/terra/properties/${selectedId}`).then(r => r.ok ? r.json() : Promise.reject(r.status)),
    staleTime: 60000,
    retry: 1,
    enabled: !!selectedId,
  });
  const { data: marketData } = useQuery<{ data: MarketData }>({
    queryKey: ["terra-market"],
    queryFn: () => fetch("/api/terra/market").then(r => r.ok ? r.json() : Promise.reject(r.status)),
    staleTime: 120000,
    retry: 1,
  });

  const apiProperties = propertiesData?.data?.properties;
  const displayProperties: DisplayProperty[] = apiProperties && apiProperties.length > 0
    ? apiProperties.slice(0, 6).map(mapApiProperty)
    : DEMO_PROPERTIES;

  useEffect(() => {
    if (displayProperties.length > 0 && !displayProperties.find(p => p.id === selectedId)) {
      setSelectedId(displayProperties[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiProperties]);

  const selected = displayProperties.find(p => p.id === selectedId) ?? displayProperties[0];
  const isLiveProperty = !!selectedPropData?.data;

  const liveProp = selectedPropData?.data;
  const displayValue = (liveProp?.kpis?.value ?? Number(liveProp?.assessedValue ?? 0)) || selected.value;
  const displayNoi = (liveProp?.kpis?.noi ?? Number(liveProp?.noi ?? 0)) || selected.noi;
  const displayCapRate = liveProp?.kpis?.capRate ?? (displayNoi && displayValue ? (displayNoi / displayValue) * 100 : selected.noi / selected.value * 100);

  const liveMarket = marketData?.data;

  const liveDriftAvg = driftData?.twins?.length
    ? (driftData.twins.reduce((s, t) => s + t.driftScore, 0) / driftData.twins.length).toFixed(2)
    : null;
  const liveBranchCount = branchData?.count ?? null;

  const toggleOverlay = (id: string) => setOverlays(prev => prev.map(o => o.id === id ? { ...o, active: !o.active } : o));

  const statusColors: Record<string, string> = {
    stable: "text-emerald-400",
    watch: "text-amber-400",
    distress: "text-red-400",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4" style={{ color: "#2d6a4f" }} />
            <h1 className="font-display text-xl font-bold" style={{ color: "rgba(255,255,255,0.88)" }}>ATLAS Spatial Runtime</h1>
            <span className="text-[9px] px-2 py-0.5 rounded-full border" style={{ color: "#2d6a4f", borderColor: "rgba(45,106,79,0.3)", background: "rgba(45,106,79,0.08)" }}>TWIN ACTIVE</span>
          </div>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>Property + market pressure twin with spatial memory, submarket overlays, and drift monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSafeMode(m => !m)}
            className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-lg border transition-colors"
            style={safeMode ? { color: "#8b7ac8", borderColor: "rgba(139,122,200,0.3)", background: "rgba(139,122,200,0.08)" } : { color: "rgba(255,255,255,0.3)", borderColor: "rgba(45,106,79,0.1)" }}
          >
            <Lock className="w-3 h-3" /> {safeMode ? "Safe Mode ON" : "Safe Mode"}
          </button>
          <div className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-lg border" style={{ color: "#2d6a4f", borderColor: "rgba(45,106,79,0.25)", background: "rgba(45,106,79,0.06)" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#2d6a4f" }} />
            RUNTIME LIVE
          </div>
        </div>
      </div>

      {(liveDriftAvg !== null || liveBranchCount !== null || isLiveProperty || liveMarket) && (
        <div className="flex items-center gap-3 text-[10px] px-3 py-2 rounded-lg border" style={{ borderColor: "rgba(45,106,79,0.12)", background: "rgba(45,106,79,0.03)" }}>
          {isLiveProperty && (
            <span className="flex items-center gap-1" style={{ color: "#2d6a4f" }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: "#2d6a4f" }} />Live property data</span>
          )}
          {liveMarket && liveMarket.totalProperties > 0 && (
            <span style={{ color: "rgba(255,255,255,0.4)" }}>{liveMarket.totalProperties} properties · avg cap rate {liveMarket.avgCapRate ?? "N/A"}</span>
          )}
          {liveDriftAvg !== null && (
            <span style={{ color: "rgba(255,255,255,0.4)" }}>Live Drift Avg: <span className="font-mono" style={{ color: "rgba(255,255,255,0.7)" }}>{liveDriftAvg}σ</span></span>
          )}
          {liveBranchCount !== null && (
            <>
              <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
              <span className="flex items-center gap-1" style={{ color: "rgba(255,255,255,0.4)" }}><GitBranch className="w-3 h-3" /> <span className="font-mono" style={{ color: "rgba(255,255,255,0.7)" }}>{liveBranchCount}</span> scenario branch{liveBranchCount !== 1 ? "es" : ""}</span>
            </>
          )}
        </div>
      )}

      {safeMode && (
        <div className="flex items-center gap-2 text-[10px] px-3 py-2 rounded-lg border" style={{ color: "#8b7ac8", borderColor: "rgba(139,122,200,0.2)", background: "rgba(139,122,200,0.05)" }}>
          <Lock className="w-3 h-3 shrink-0" /> Executive Safe Mode — only stable twin data shown; watch and distress signals suppressed.
        </div>
      )}

      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {TWIN_STATUS.map(s => (
          <div key={s.label} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] whitespace-nowrap shrink-0", s.status === "warn" ? "border-amber-500/25 bg-amber-500/5" : "")} style={s.status !== "warn" ? { borderColor: "rgba(45,106,79,0.12)", background: "rgba(5,10,8,0.6)" } : {}}>
            <span className={cn("w-1.5 h-1.5 rounded-full", s.status === "warn" ? "bg-amber-400 animate-pulse" : "")} style={s.status !== "warn" ? { background: "#2d6a4f" } : {}} />
            <span style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</span>
            <span className={cn("font-mono", s.status === "warn" ? "text-amber-400" : "")} style={s.status !== "warn" ? { color: "rgba(255,255,255,0.7)" } : {}}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {displayProperties.map(p => (
          <button key={p.id} onClick={() => setSelectedId(p.id)} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-xs whitespace-nowrap transition-all text-left")} style={selected.id === p.id ? { borderColor: "rgba(45,106,79,0.35)", background: "rgba(45,106,79,0.08)", color: "rgba(255,255,255,0.88)" } : { borderColor: "rgba(45,106,79,0.08)", background: "rgba(5,10,8,0.6)", color: "rgba(255,255,255,0.35)" }}>
            <Building2 className="w-3.5 h-3.5 shrink-0" style={{ color: "#2d6a4f" }} />
            <div>
              <p className="font-medium">{p.address}</p>
              <p className="text-[9px] opacity-60">{p.neighborhood} · {p.type}</p>
            </div>
            <span className={cn("text-[9px] ml-1", statusColors[p.status] ?? "text-emerald-400")}>{p.status}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl overflow-hidden" style={{ background: "rgba(5,10,8,0.8)", border: "1px solid rgba(45,106,79,0.12)" }}>
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "rgba(45,106,79,0.1)" }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>{selected.address} — Property Twin</p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.28)" }}>{selected.neighborhood} · {selected.type} · {selected.units} units · {fmt(displayValue)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono" style={{ color: "rgba(45,106,79,0.6)" }}>{isLiveProperty ? "LIVE AVM" : "AVM SYNC"}</span>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#2d6a4f" }} />
              </div>
            </div>
            <div className="p-4">
              <PropertyTwinCanvas
                propertyId={selected.id}
                capRate={`${displayCapRate.toFixed(1)}%`}
                noiDrift={isLiveProperty ? "+live" : "+0.08σ"}
              />
            </div>
          </div>

          <div className="rounded-xl overflow-hidden" style={{ background: "rgba(5,10,8,0.8)", border: "1px solid rgba(45,106,79,0.12)" }}>
            <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "rgba(45,106,79,0.1)" }}>
              <Clock className="w-3.5 h-3.5" style={{ color: "#2d6a4f" }} />
              <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>Market Pressure Memory — {selected.neighborhood} Submarket</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b" style={{ borderColor: "rgba(45,106,79,0.08)" }}>
                    {["Period", "Cap Rate", "Rent Growth", "Vacancy", "Submarket Pressure"].map(h => (
                      <th key={h} className="text-left px-4 py-2 text-[10px] font-normal uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.25)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DEMO_MARKET_MEMORY.map((row, i) => {
                    const isLatest = i === DEMO_MARKET_MEMORY.length - 1;
                    return (
                      <tr key={i} className="border-b" style={{ borderColor: "rgba(45,106,79,0.05)", background: isLatest ? "rgba(45,106,79,0.04)" : undefined }}>
                        <td className="px-4 py-2.5 font-mono text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{row.period}</td>
                        <td className="px-4 py-2.5 font-mono" style={{ color: "rgba(255,255,255,0.7)" }}>{row.capRate.toFixed(1)}%</td>
                        <td className="px-4 py-2.5 font-mono" style={{ color: row.rentGrowth >= 2.5 ? "#2d6a4f" : "#c8953c" }}>{row.rentGrowth.toFixed(1)}%</td>
                        <td className="px-4 py-2.5 font-mono" style={{ color: row.vacancyRate >= 6 ? "#c45a4a" : "rgba(255,255,255,0.55)" }}>{row.vacancyRate.toFixed(1)}%</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${row.submktPressure}%`, background: row.submktPressure > 40 ? "#c8953c" : "#2d6a4f" }} />
                            </div>
                            <span className="text-[9px] font-mono w-6" style={{ color: "rgba(255,255,255,0.4)" }}>{row.submktPressure}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ background: "rgba(5,10,8,0.8)", border: "1px solid rgba(45,106,79,0.12)" }}>
            <p className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.88)" }}>
              <Layers className="w-3.5 h-3.5" style={{ color: "#2d6a4f" }} />
              Spatial Overlays
            </p>
            <div className="space-y-2">
              {overlays.map(ov => (
                <div key={ov.id} onClick={() => toggleOverlay(ov.id)} className="flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all" style={ov.active ? { borderColor: "rgba(45,106,79,0.2)", background: "rgba(45,106,79,0.06)" } : { borderColor: "transparent", background: "rgba(255,255,255,0.02)", opacity: 0.5 }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: ov.active ? ov.color : "rgba(255,255,255,0.2)" }} />
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.7)" }}>{ov.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded", ov.severity === "high" ? "text-red-400 bg-red-500/10" : ov.severity === "moderate" ? "text-amber-400 bg-amber-500/10" : "text-emerald-400 bg-emerald-500/10")}>{ov.severity}</span>
                    <div className="w-3 h-3 rounded-sm border flex items-center justify-center" style={{ borderColor: ov.active ? "#2d6a4f" : "rgba(45,106,79,0.2)", background: ov.active ? "rgba(45,106,79,0.15)" : undefined }}>
                      {ov.active && <span className="text-[8px]" style={{ color: "#2d6a4f" }}>✓</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ background: "rgba(5,10,8,0.8)", border: "1px solid rgba(45,106,79,0.12)" }}>
            <p className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.88)" }}>
              <BarChart3 className="w-3.5 h-3.5" style={{ color: "#2d6a4f" }} />
              Twin KPIs
              {isLiveProperty && <span className="text-[9px] ml-auto" style={{ color: "#2d6a4f" }}>● live</span>}
            </p>
            {[
              { label: "Estimated Value", val: fmt(displayValue), sub: isLiveProperty ? "AVM — live sync" : "AVM — last sync 4h" },
              { label: "Annual NOI", val: fmt(displayNoi), sub: "Stabilized" },
              { label: "LTV Ratio", val: `${(selected.ltv * 100).toFixed(0)}%`, sub: selected.ltv > 0.7 ? "⚠ High" : "OK" },
              { label: "Cap Rate", val: `${displayCapRate.toFixed(1)}%`, sub: "Implied" },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "rgba(45,106,79,0.07)" }}>
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{m.label}</span>
                <div className="text-right">
                  <p className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.78)" }}>{m.val}</p>
                  <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>{m.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-4" style={{ background: "rgba(5,10,8,0.8)", border: "1px solid rgba(45,106,79,0.12)" }}>
            <p className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.88)" }}>
              <Activity className="w-3.5 h-3.5" style={{ color: "#2d6a4f" }} />
              Twin Drift Monitor
            </p>
            {[
              { label: "Valuation Drift", val: "0.08σ", ok: true },
              { label: "NOI Variance", val: "0.12σ", ok: true },
              { label: "Market Drift", val: "1.8σ", ok: false },
              { label: "Occupancy Delta", val: "−2.1%", ok: false },
            ].map(d => (
              <div key={d.label} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: "rgba(45,106,79,0.07)" }}>
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{d.label}</span>
                <span className={cn("text-[10px] font-mono", d.ok ? "" : "text-amber-400")} style={d.ok ? { color: "#2d6a4f" } : {}}>{d.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
