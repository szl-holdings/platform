import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { CloudRain, Wind, Eye, Thermometer, Waves, AlertTriangle, Cloud, Sun, Snowflake, CloudLightning, MapPin } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { LiveDataBadge } from "@/lib/live-badge";

const riskColors: Record<string, string> = {
  low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  moderate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  severe: "bg-red-500/10 text-red-400 border-red-500/20",
};

const riskIcons: Record<string, string> = {
  low: "text-emerald-400",
  moderate: "text-amber-400",
  high: "text-orange-400",
  severe: "text-red-400",
};

const riskGlow: Record<string, string> = {
  low: "",
  moderate: "",
  high: "ring-1 ring-orange-500/10",
  severe: "ring-1 ring-red-500/20 animate-pulse",
};

function WeatherAtmosphere({ risk }: { risk: string }) {
  if (risk === "low") return (
    <div className="absolute top-2 right-2 opacity-10">
      <Sun className="w-8 h-8 text-amber-400" />
    </div>
  );
  if (risk === "moderate") return (
    <div className="absolute top-2 right-2 opacity-10">
      <Cloud className="w-8 h-8 text-amber-400 animate-wave-float" />
    </div>
  );
  if (risk === "high") return (
    <div className="absolute top-2 right-2 opacity-[0.15]">
      <CloudRain className="w-8 h-8 text-orange-400 animate-wave-float" />
    </div>
  );
  if (risk === "severe") return (
    <div className="absolute top-2 right-2 opacity-20">
      <CloudLightning className="w-8 h-8 text-red-400 animate-pulse" />
    </div>
  );
  return null;
}

function AnimatedCounter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    if (diff === 0) return;
    let cancelled = false;
    const startTime = performance.now();
    const step = (now: number) => {
      if (cancelled) return;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(step);
      else ref.current = value;
    };
    requestAnimationFrame(step);
    return () => { cancelled = true; };
  }, [value, duration]);
  return <>{display}</>;
}

function WeatherSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-5 w-20 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="skeleton h-3 w-full" />
        <div className="grid grid-cols-2 gap-3">
          <div className="skeleton h-6 w-full" />
          <div className="skeleton h-6 w-full" />
          <div className="skeleton h-6 w-full" />
          <div className="skeleton h-6 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

interface WeatherSnapshot {
  id: string | number;
  location: string;
  latitude?: number;
  longitude?: number;
  riskLevel: string;
  description?: string;
  temperature?: string | number;
  windSpeed?: string | number;
  windDirection?: string;
  waveHeight?: string | number;
  visibility?: string | number;
  routeId?: number;
}

interface RouteItem {
  id: number;
  originPort?: string;
  destinationPort?: string;
}

interface ForecastHour { time?: string; waveHeight?: number | null; }
interface MarineWeatherData {
  source?: string;
  current?: {
    waveHeight?: number | null;
    windWaveHeight?: number | null;
    swellWaveHeight?: number | null;
    windSpeed?: number | null;
    windDirection?: number | null;
    seaSurfaceTemperature?: number | null;
    visibility?: number | null;
  };
  forecastHours?: ForecastHour[];
}

export default function WeatherPage() {
  const { data: rawSnapshots = [], isLoading } = useQuery({ queryKey: ["weather"], queryFn: () => api.weather.snapshots() });
  const snapshots = rawSnapshots as WeatherSnapshot[];
  const { data: rawRoutes = [] } = useQuery({ queryKey: ["routes"], queryFn: api.routes.list });
  const routes = rawRoutes as RouteItem[];

  const { data: rawMarineWeather, isLoading: marineLoading } = useQuery({
    queryKey: ["marine-weather-hormuz"],
    queryFn: () => api.live.marineWeather(26.58, 56.26),
    staleTime: 3600000,
    refetchInterval: 3600000,
  });
  const marineWeather = rawMarineWeather as MarineWeatherData | undefined;

  const severeCount = snapshots.filter((s) => s.riskLevel === "severe" || s.riskLevel === "high").length;
  const marineIsLive = marineWeather?.source === "live";

  return (
    <div className="p-6 space-y-6">
      <div className="animate-fade-in-up flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Weather Impact</h1>
          <p className="text-sm text-muted-foreground mt-1">Sea state forecasts, wind and wave conditions, and storm avoidance routing</p>
        </div>
        <LiveDataBadge isLive={marineIsLive} isLoading={marineLoading} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border animate-fade-in-up stagger-1 hover:border-primary/20 transition-all duration-300 group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Snapshots</p>
                <p className="text-2xl font-bold font-display mt-1"><AnimatedCounter value={snapshots.length} /></p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CloudRain className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={`bg-card border-border animate-fade-in-up stagger-2 hover:border-chart-5/20 transition-all duration-300 group ${severeCount > 0 ? "ring-1 ring-chart-5/10" : ""}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">High/Severe Risk</p>
                <p className="text-2xl font-bold font-display mt-1 text-chart-5"><AnimatedCounter value={severeCount} /></p>
              </div>
              <div className={`w-10 h-10 rounded-lg bg-chart-5/10 flex items-center justify-center group-hover:scale-110 transition-transform ${severeCount > 0 ? "animate-pulse" : ""}`}>
                <AlertTriangle className="w-5 h-5 text-chart-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border animate-fade-in-up stagger-3 hover:border-chart-2/20 transition-all duration-300 group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Routes Monitored</p>
                <p className="text-2xl font-bold font-display mt-1"><AnimatedCounter value={new Set(snapshots.map((s) => s.routeId).filter(Boolean)).size} /></p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Waves className="w-5 h-5 text-chart-2 animate-wave-float" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Marine Weather Panel — Open-Meteo */}
      <Card className="bg-card border-border animate-fade-in-up stagger-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <Waves className="w-5 h-5 text-blue-400" /> Live Marine Conditions — Open-Meteo
            </CardTitle>
            <LiveDataBadge isLive={marineIsLive} isLoading={marineLoading} />
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Strait of Hormuz (26.58°N, 56.26°E)
          </p>
        </CardHeader>
        <CardContent>
          {marineLoading ? (
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-12 rounded-lg" />)}
            </div>
          ) : marineWeather?.current ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <p className="text-xs text-muted-foreground/60 font-mono uppercase">Wave Height</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {marineWeather.current.waveHeight != null ? `${marineWeather.current.waveHeight.toFixed(1)}m` : "—"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                  <p className="text-xs text-muted-foreground/60 font-mono uppercase">Swell Height</p>
                  <p className="text-2xl font-bold text-cyan-400">
                    {marineWeather.current.swellWaveHeight != null ? `${marineWeather.current.swellWaveHeight.toFixed(1)}m` : "—"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-xs text-muted-foreground/60 font-mono uppercase">Wind Waves</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {marineWeather.current.windWaveHeight != null ? `${marineWeather.current.windWaveHeight.toFixed(1)}m` : "—"}
                  </p>
                </div>
              </div>
              {(marineWeather.forecastHours?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">24-Hour Forecast</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {(marineWeather.forecastHours ?? []).slice(0, 12).map((h: ForecastHour, i: number) => (
                      <div key={i} className="shrink-0 text-center p-2 rounded bg-muted/30 min-w-[50px]">
                        <p className="text-[9px] text-muted-foreground">{h.time?.slice(11, 16) ?? ""}</p>
                        <p className="text-xs font-medium text-blue-400">{h.waveHeight != null ? `${h.waveHeight.toFixed(1)}m` : "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground">Source: Open-Meteo Marine API · Updates hourly</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Marine weather data unavailable</p>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <WeatherSkeleton key={i} />)}
        </div>
      ) : snapshots.length === 0 ? (
        <Card className="bg-card border-border border-dashed animate-fade-in-up stagger-4">
          <CardContent className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-4">
              <CloudRain className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground font-medium">No weather data available</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Weather snapshots will appear once routes are being monitored</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {snapshots.map((snap, i: number) => {
            const route = routes.find((r) => r.id === snap.routeId);
            const isSevere = snap.riskLevel === "severe" || snap.riskLevel === "high";
            return (
              <Card key={snap.id} className={`bg-card border-border hover:border-primary/20 transition-all duration-300 relative overflow-hidden animate-fade-in-up stagger-${Math.min((i % 6) + 1, 8)} ${riskGlow[snap.riskLevel] || ""}`}>
                <WeatherAtmosphere risk={snap.riskLevel} />
                <CardHeader className="pb-3 relative">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-display">{snap.location}</CardTitle>
                    <Badge variant="outline" className={`${riskColors[snap.riskLevel] || ""} ${isSevere ? "animate-pulse" : ""}`}>
                      {isSevere && <span className={`w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse-dot ${snap.riskLevel === "severe" ? "bg-red-400" : "bg-orange-400"}`} />}
                      {snap.riskLevel} risk
                    </Badge>
                  </div>
                  {route && (
                    <p className="text-xs text-muted-foreground">{route.originPort} → {route.destinationPort}</p>
                  )}
                </CardHeader>
                <CardContent className="pt-0 relative">
                  <p className="text-sm text-muted-foreground mb-3">{snap.description}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-xs bg-muted/30 rounded-lg px-2.5 py-1.5">
                      <Thermometer className={`w-3.5 h-3.5 ${riskIcons[snap.riskLevel]}`} />
                      <span className="text-muted-foreground">Temp:</span>
                      <span className="font-medium">{snap.temperature ? `${Number(snap.temperature)}°C` : "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs bg-muted/30 rounded-lg px-2.5 py-1.5">
                      <Wind className={`w-3.5 h-3.5 ${riskIcons[snap.riskLevel]}`} />
                      <span className="text-muted-foreground">Wind:</span>
                      <span className="font-medium">{snap.windSpeed ? `${Number(snap.windSpeed)} km/h ${snap.windDirection || ""}` : "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs bg-muted/30 rounded-lg px-2.5 py-1.5">
                      <Waves className={`w-3.5 h-3.5 ${riskIcons[snap.riskLevel]} ${isSevere ? "animate-wave-float" : ""}`} />
                      <span className="text-muted-foreground">Waves:</span>
                      <span className="font-medium">{snap.waveHeight ? `${Number(snap.waveHeight)}m` : "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs bg-muted/30 rounded-lg px-2.5 py-1.5">
                      <Eye className={`w-3.5 h-3.5 ${riskIcons[snap.riskLevel]}`} />
                      <span className="text-muted-foreground">Visibility:</span>
                      <span className="font-medium">{snap.visibility ? `${Number(snap.visibility)} km` : "N/A"}</span>
                    </div>
                  </div>
                  {snap.latitude && snap.longitude && (
                    <p className="text-xs text-muted-foreground mt-2 font-mono">
                      {Number(snap.latitude).toFixed(4)}°, {Number(snap.longitude).toFixed(4)}°
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
