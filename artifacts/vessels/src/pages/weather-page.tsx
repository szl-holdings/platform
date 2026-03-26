import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CloudRain, Wind, Eye, Thermometer, Waves, AlertTriangle } from "lucide-react";

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

export default function WeatherPage() {
  const { data: snapshots = [], isLoading } = useQuery({ queryKey: ["weather"], queryFn: () => api.weather.snapshots() });
  const { data: routes = [] } = useQuery({ queryKey: ["routes"], queryFn: api.routes.list });

  const severeCount = snapshots.filter((s: any) => s.riskLevel === "severe" || s.riskLevel === "high").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Weather Impact</h1>
        <p className="text-sm text-muted-foreground mt-1">Weather conditions and risk analysis along active routes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Snapshots</p>
                <p className="text-2xl font-bold font-display mt-1">{snapshots.length}</p>
              </div>
              <CloudRain className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">High/Severe Risk</p>
                <p className="text-2xl font-bold font-display mt-1 text-chart-5">{severeCount}</p>
              </div>
              <AlertTriangle className="w-5 h-5 text-chart-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Routes Monitored</p>
                <p className="text-2xl font-bold font-display mt-1">{new Set(snapshots.map((s: any) => s.routeId).filter(Boolean)).size}</p>
              </div>
              <Waves className="w-5 h-5 text-chart-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading weather data...</div>
      ) : snapshots.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No weather data available</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {snapshots.map((snap: any) => {
            const route = routes.find((r: any) => r.id === snap.routeId);
            return (
              <Card key={snap.id} className="bg-card border-border hover:border-primary/20 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-display">{snap.location}</CardTitle>
                    <Badge variant="outline" className={riskColors[snap.riskLevel] || ""}>
                      {snap.riskLevel} risk
                    </Badge>
                  </div>
                  {route && (
                    <p className="text-xs text-muted-foreground">{route.originPort} → {route.destinationPort}</p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-3">{snap.description}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-xs">
                      <Thermometer className={`w-3.5 h-3.5 ${riskIcons[snap.riskLevel]}`} />
                      <span className="text-muted-foreground">Temp:</span>
                      <span>{snap.temperature ? `${Number(snap.temperature)}°C` : "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Wind className={`w-3.5 h-3.5 ${riskIcons[snap.riskLevel]}`} />
                      <span className="text-muted-foreground">Wind:</span>
                      <span>{snap.windSpeed ? `${Number(snap.windSpeed)} km/h ${snap.windDirection || ""}` : "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Waves className={`w-3.5 h-3.5 ${riskIcons[snap.riskLevel]}`} />
                      <span className="text-muted-foreground">Waves:</span>
                      <span>{snap.waveHeight ? `${Number(snap.waveHeight)}m` : "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Eye className={`w-3.5 h-3.5 ${riskIcons[snap.riskLevel]}`} />
                      <span className="text-muted-foreground">Visibility:</span>
                      <span>{snap.visibility ? `${Number(snap.visibility)} km` : "N/A"}</span>
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
