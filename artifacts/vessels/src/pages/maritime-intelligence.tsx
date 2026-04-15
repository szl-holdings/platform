import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Ship, Anchor, Navigation, AlertTriangle, Cloud, ShieldAlert, Globe, Radio, Waves, Thermometer, Wind, Eye, MapPin, Languages, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@szl-holdings/shared-ui";

function AnimatedCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const start = performance.now();
    const step = (now: number) => {
      if (cancelled) return;
      const p = Math.min((now - start) / 1000, 1);
      setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    return () => { cancelled = true; };
  }, [value]);
  return <>{display}</>;
}

interface MapVessel { lat?: number; lon?: number; latitude?: number; longitude?: number; name?: string; mmsi?: string; course?: number; }
interface MapChokepoint { lat?: number; lon?: number; name?: string; riskLevel?: string; status?: string; vesselCount?: number; dailyTransits?: number; oilFlowMbpd?: number; }
interface WeatherRow { region: string; warning?: string; windSpeed?: number; windDirection?: string; waveHeight?: number; seaTemp?: number; visibility?: string; }
interface SanctionEntity { entity: string; word: string; }
interface SanctionRow { imo: string; name?: string; status?: string; reason?: string; flag?: string; source?: string; entities?: SanctionEntity[]; aiEnriched?: boolean; }
function VesselMapCanvas({ vessels, chokepoints }: { vessels: MapVessel[]; chokepoints: MapChokepoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    ctx.fillStyle = "#0a1628";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(6, 182, 212, 0.06)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < w; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
    for (let j = 0; j < h; j += 40) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(w, j); ctx.stroke(); }

    const toX = (lon: number) => ((lon + 180) / 360) * w;
    const toY = (lat: number) => ((90 - lat) / 180) * h;

    chokepoints.forEach((cp) => {
      const x = toX(cp.lon ?? 0);
      const y = toY(cp.lat ?? 0);
      const color = cp.riskLevel === "critical" ? "rgba(239, 68, 68, 0.6)" : cp.riskLevel === "warning" ? "rgba(234, 179, 8, 0.6)" : cp.riskLevel === "elevated" ? "rgba(249, 115, 22, 0.5)" : "rgba(6, 182, 212, 0.4)";

      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      const grad = ctx.createRadialGradient(x, y, 0, x, y, 20);
      grad.addColorStop(0, color.replace("0.6", "0.15").replace("0.5", "0.12").replace("0.4", "0.1"));
      grad.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    });

    vessels.forEach((v) => {
      const x = toX(v.lon ?? 0);
      const y = toY(v.lat ?? 0);
      ctx.fillStyle = "rgba(6, 182, 212, 0.9)";
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      const rad = ((v.course ?? 0) * Math.PI) / 180;
      ctx.strokeStyle = "rgba(6, 182, 212, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.sin(rad) * 12, y - Math.cos(rad) * 12);
      ctx.stroke();
    });
  }, [vessels, chokepoints]);

  return <canvas ref={canvasRef} className="w-full h-full rounded-lg" style={{ minHeight: 350 }} />;
}

const riskColors: Record<string, string> = {
  normal: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  elevated: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  warning: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function MaritimeIntelligence() {
  const { data: aisVessels = [] } = useQuery({ queryKey: ["intel-maritime-vessels"], queryFn: () => apiFetch<any[]>("/intelligence/maritime/vessels"), refetchInterval: 30000 });
  const { data: chokepoints = [] } = useQuery({ queryKey: ["intel-chokepoints"], queryFn: () => apiFetch<any[]>("/intelligence/maritime/chokepoints"), refetchInterval: 60000 });
  const { data: weather = [] } = useQuery({ queryKey: ["intel-marine-weather"], queryFn: () => apiFetch<any[]>("/intelligence/maritime/weather"), refetchInterval: 300000 });
  const { data: sanctions = [] } = useQuery({ queryKey: ["intel-sanctions"], queryFn: () => apiFetch<any[]>("/intelligence/maritime/sanctions") });
  const [translations, setTranslations] = useState<Record<string, string>>({});

  const translateMutation = useMutation({
    mutationFn: async ({ text, imo, targetLang }: { text: string; imo: string; targetLang: string }) => {
      const result = await apiFetch<{ translatedText: string }>("/intelligence/ai/translate", {
        method: "POST",
        body: JSON.stringify({ text, targetLang }),
      });
      return { imo, translated: result.translatedText };
    },
    onSuccess: (data) => {
      setTranslations((prev) => ({ ...prev, [data.imo]: data.translated }));
    },
  });

  const alertChokepoints = chokepoints.filter((c) => c.riskLevel !== "normal").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2 tracking-tight uppercase">
            <Globe className="w-6 h-6 text-primary" /> Maritime Intelligence Center
          </h1>
          <p className="text-xs text-muted-foreground mt-1 tracking-wider font-mono">AIS VESSEL TRACKING // CHOKEPOINT MONITORING // THREAT ASSESSMENT // SANCTIONS COMPLIANCE</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse font-mono text-[10px]">
            <Radio className="w-3 h-3 mr-1" /> AIS FEED ACTIVE
          </Badge>
          <span className="text-[10px] text-muted-foreground font-mono hidden md:block">UTC {new Date().toISOString().slice(11, 19)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up stagger-1">
        <Card className="bg-card border-border hover:border-primary/20 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Vessels Tracked</p>
                <p className="text-2xl font-bold font-display mt-1"><AnimatedCounter value={aisVessels.length} /></p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform"><Ship className="w-5 h-5 text-primary" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-amber-500/20 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Chokepoints</p>
                <p className="text-2xl font-bold font-display mt-1"><AnimatedCounter value={chokepoints.length} /></p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform"><Anchor className="w-5 h-5 text-amber-400" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-orange-500/20 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Alerts Active</p>
                <p className="text-2xl font-bold font-display mt-1 text-orange-400"><AnimatedCounter value={alertChokepoints} /></p>
              </div>
              <div className={`w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform ${alertChokepoints > 0 ? "animate-pulse" : ""}`}><AlertTriangle className="w-5 h-5 text-orange-400" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-red-500/20 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Sanctioned</p>
                <p className="text-2xl font-bold font-display mt-1 text-red-400"><AnimatedCounter value={sanctions.length} /></p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform"><ShieldAlert className="w-5 h-5 text-red-400" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border animate-fade-in-up stagger-2">
        <CardHeader className="pb-2">
          <CardTitle className="font-display flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" /> Live Vessel Tracking & Chokepoint Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VesselMapCanvas vessels={aisVessels} chokepoints={chokepoints} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border animate-fade-in-up stagger-3">
          <CardHeader className="pb-2">
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <Anchor className="w-5 h-5 text-amber-400" /> Chokepoint Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chokepoints.map((cp) => (
                <div key={cp.name} className={`p-3 rounded-lg border transition-all ${cp.riskLevel === "critical" ? "border-red-500/20 bg-red-500/5" : cp.riskLevel === "warning" ? "border-orange-500/20 bg-orange-500/5" : "border-border bg-background/50"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-display font-semibold text-sm">{cp.name}</h4>
                    <Badge variant="outline" className={`text-xs ${riskColors[cp.riskLevel] || ""}`}>
                      {cp.riskLevel === "critical" && <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1 animate-pulse" />}
                      {cp.riskLevel}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div><span className="block text-muted-foreground/60 font-mono text-[9px]">VESSELS</span><span className="font-semibold text-foreground">{cp.vesselCount}</span></div>
                    <div><span className="block text-muted-foreground/60 font-mono text-[9px]">DAILY TRANSITS</span><span className="font-semibold text-foreground">{cp.dailyTransits}</span></div>
                    <div><span className="block text-muted-foreground/60 font-mono text-[9px]">OIL FLOW</span><span className="font-semibold text-foreground">{cp.oilFlowMbpd} Mb/d</span></div>
                  </div>
                  <p className="text-xs text-muted-foreground/60 mt-2">{cp.status}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card border-border animate-fade-in-up stagger-4">
            <CardHeader className="pb-2">
              <CardTitle className="font-display flex items-center gap-2 text-base">
                <Cloud className="w-5 h-5 text-blue-400" /> Marine Weather Overlay
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(weather as WeatherRow[]).map((w) => (
                  <div key={w.region} className={`p-3 rounded-lg border ${w.warning ? "border-amber-500/20 bg-amber-500/5" : "border-border bg-background/50"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold">{w.region}</span>
                      {w.warning && <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/20">{w.warning}</Badge>}
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Wind className="w-3 h-3" /> {w.windSpeed}kt {w.windDirection}</span>
                      <span className="flex items-center gap-1"><Waves className="w-3 h-3" /> {w.waveHeight}m</span>
                      <span className="flex items-center gap-1"><Thermometer className="w-3 h-3" /> {w.seaTemp}°C</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {w.visibility}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border animate-fade-in-up stagger-5">
            <CardHeader className="pb-2">
              <CardTitle className="font-display flex items-center gap-2 text-base">
                <ShieldAlert className="w-5 h-5 text-red-400" /> Sanctions Watchlist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(sanctions as SanctionRow[]).map((v) => (
                  <div key={v.imo} className="p-3 rounded-lg border border-red-500/10 bg-red-500/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-red-400">{v.name}</span>
                      <Badge variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/20">{v.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{v.reason}</p>
                    {translations[v.imo] && (
                      <p className="text-xs text-blue-400 mt-1 italic">{translations[v.imo]}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground/60">
                      <span>IMO: {v.imo}</span>
                      <span>Flag: {v.flag}</span>
                      <span>Source: {v.source}</span>
                      <button
                        onClick={() => translateMutation.mutate({ text: v.reason ?? "", imo: v.imo ?? "", targetLang: "fr" })}
                        disabled={translateMutation.isPending || !!translations[v.imo]}
                        className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                        title="Translate to French"
                      >
                        {translateMutation.isPending && translateMutation.variables?.imo === v.imo ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Languages className="w-3 h-3" />
                        )}
                        Translate
                      </button>
                    </div>
                    {v.entities && v.entities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {v.entities.map((e, idx) => (
                          <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/15">
                            {e.entity}: {e.word}
                          </span>
                        ))}
                        {v.aiEnriched && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/15">AI Enriched</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
