import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { dataProvider } from "@/data/data-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Ship, Anchor, Navigation, AlertTriangle, Activity, ArrowRight, Waves, Package, Gauge, Leaf, ShieldCheck, Heart, TrendingUp, AlertCircle, Info, Clock, Globe, MapPin } from "lucide-react";
import { useEffect, useState, useRef, useMemo } from "react";

const statusColors: Record<string, string> = {
  at_sea: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  in_port: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  anchored: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  maintenance: "bg-red-500/10 text-red-400 border-red-500/20",
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  decommissioned: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const typeIcons: Record<string, string> = {
  container: "Container",
  tanker: "Tanker",
  bulk: "Bulk Carrier",
  cargo: "General Cargo",
  passenger: "Passenger",
  fishing: "Fishing",
  other: "Other",
};

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

function StatCardSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-7 w-12" />
          </div>
          <div className="skeleton w-10 h-10 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

function VesselCardSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="skeleton w-10 h-10 rounded-lg" />
            <div className="space-y-1.5">
              <div className="skeleton h-4 w-28" />
              <div className="skeleton h-3 w-20" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-3/4" />
        </div>
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          <div className="skeleton h-5 w-16 rounded-full" />
          <div className="skeleton h-3 w-14" />
        </div>
      </CardContent>
    </Card>
  );
}

function HealthPillar({ label, score, icon: Icon, color }: { label: string; score: number; icon: typeof Heart; color: string }) {
  const getBarColor = (s: number) => s >= 80 ? "bg-emerald-400" : s >= 60 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div className={`h-2 rounded-full transition-all duration-1000 ${getBarColor(score)}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-lg font-bold ${score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400"}`}>{score}</span>
      <span className="text-[10px] text-muted-foreground text-center">{label}</span>
    </div>
  );
}

const vesselStatusDotColors: Record<string, string> = {
  at_sea: "#22c55e",
  in_port: "#3b82f6",
  anchored: "#eab308",
  maintenance: "#ef4444",
};

function FleetMap({ mockVessels }: { mockVessels: any[] }) {
  const [hoveredVessel, setHoveredVessel] = useState<any | null>(null);

  const toMapCoords = (lat: number, lon: number, width: number, height: number) => {
    const x = ((lon + 180) / 360) * width;
    const latRad = (lat * Math.PI) / 180;
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const y = height / 2 - (mercN / Math.PI) * (height / 2);
    return { x, y };
  };

  const W = 900;
  const H = 440;

  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-[#0a1628] border border-border/50">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ minHeight: 300 }}>
        <defs>
          <radialGradient id="ocean-glow" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#0d2847" />
            <stop offset="100%" stopColor="#060e1a" />
          </radialGradient>
          <filter id="vessel-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect width={W} height={H} fill="url(#ocean-glow)" />

        <g opacity="0.15" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" fill="none">
          {[-60, -30, 0, 30, 60].map(lat => {
            const { y } = toMapCoords(lat, 0, W, H);
            return <line key={`lat-${lat}`} x1={0} y1={y} x2={W} y2={y} strokeDasharray="4 4" />;
          })}
          {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map(lon => {
            const { x } = toMapCoords(0, lon, W, H);
            return <line key={`lon-${lon}`} x1={x} y1={0} x2={x} y2={H} strokeDasharray="4 4" />;
          })}
        </g>

        <g opacity="0.2" fill="rgba(255,255,255,0.08)">
          {[
            "M225,100 L230,95 L240,95 L245,100 L250,110 L260,115 L270,108 L280,100 L290,98 L295,100 L300,110 L305,115 L310,125 L315,135 L320,150 L325,160 L330,170 L335,175 L330,180 L320,182 L310,180 L305,175 L300,170 L295,165 L290,158 L280,155 L270,160 L260,170 L255,180 L250,185 L240,188 L235,185 L230,180 L225,170 L220,160 L215,150 L220,140 L225,130 L225,120 Z",
            "M430,85 L445,78 L460,80 L475,90 L480,105 L485,115 L490,125 L495,135 L500,145 L505,155 L510,165 L520,170 L535,172 L545,175 L550,180 L540,185 L530,190 L515,188 L500,185 L490,180 L480,170 L470,160 L460,155 L450,150 L445,140 L440,130 L435,120 L430,110 L428,100 Z",
            "M540,110 L560,105 L580,108 L600,115 L620,118 L640,120 L660,115 L680,110 L700,108 L720,112 L730,120 L740,130 L730,140 L720,148 L700,150 L680,148 L660,145 L640,140 L620,138 L600,140 L580,145 L560,148 L550,145 L545,135 L540,125 Z",
            "M620,170 L640,165 L660,168 L680,175 L700,185 L710,195 L700,210 L690,220 L680,230 L670,235 L660,230 L650,220 L640,210 L635,200 L630,190 L625,180 Z",
            "M340,230 L360,215 L380,210 L390,215 L395,225 L400,240 L395,260 L385,280 L375,295 L365,310 L355,320 L345,325 L338,315 L335,300 L332,285 L330,270 L332,255 L335,240 Z",
            "M720,240 L740,230 L760,232 L780,240 L790,255 L785,275 L775,295 L765,310 L755,320 L745,325 L735,320 L728,310 L722,295 L720,275 L718,260 Z",
          ].map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>

        {mockVessels.map((v) => {
          const { x, y } = toMapCoords(v.currentLat, v.currentLon, W, H);
          const color = vesselStatusDotColors[v.status] || "#666";
          const isHovered = hoveredVessel?.id === v.id;
          return (
            <g
              key={v.id}
              onMouseEnter={() => setHoveredVessel(v)}
              onMouseLeave={() => setHoveredVessel(null)}
              style={{ cursor: "pointer" }}
            >
              <circle cx={x} cy={y} r={isHovered ? 8 : 5} fill={color} opacity={0.25} />
              {v.status === "at_sea" && (
                <circle cx={x} cy={y} r={5} fill="none" stroke={color} strokeWidth={0.8} opacity={0.4}>
                  <animate attributeName="r" from="5" to="14" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={x} cy={y} r={isHovered ? 5 : 3.5} fill={color} filter={isHovered ? "url(#vessel-glow)" : undefined} />
            </g>
          );
        })}
      </svg>

      {hoveredVessel && (() => {
        const { x, y } = toMapCoords(hoveredVessel.currentLat, hoveredVessel.currentLon, W, H);
        const pctX = (x / W) * 100;
        const pctY = (y / H) * 100;
        return (
          <div
            className="absolute z-10 bg-card/95 backdrop-blur border border-border rounded-lg shadow-xl p-3 pointer-events-none"
            style={{
              left: `${Math.min(Math.max(pctX, 15), 85)}%`,
              top: `${Math.max(pctY - 2, 5)}%`,
              transform: "translate(-50%, -110%)",
              minWidth: 180,
            }}
          >
            <p className="text-xs font-bold">{hoveredVessel.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: vesselStatusDotColors[hoveredVessel.status] }} />
              <span className="text-[10px] text-muted-foreground">{hoveredVessel.status?.replace("_", " ")}</span>
              <span className="text-[10px] text-muted-foreground ml-auto">{hoveredVessel.currentSpeed > 0 ? `${hoveredVessel.currentSpeed} kn` : "Stationary"}</span>
            </div>
            {hoveredVessel.nextPort && (
              <p className="text-[10px] text-muted-foreground mt-1">Next: {hoveredVessel.nextPort}</p>
            )}
          </div>
        );
      })()}

      <div className="absolute bottom-3 left-3 flex items-center gap-3">
        {[
          { label: "At Sea", color: "#22c55e" },
          { label: "In Port", color: "#3b82f6" },
          { label: "Anchored", color: "#eab308" },
          { label: "Maintenance", color: "#ef4444" },
        ].map(s => (
          <span key={s.label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="absolute bottom-3 right-3 text-[10px] text-muted-foreground/50">
        {mockVessels.length} vessels tracked
      </div>
    </div>
  );
}

const severityIcons = {
  Critical: AlertTriangle,
  Warning: AlertCircle,
  Info: Info,
};

const severityAlertColors = {
  Critical: "border-l-red-400 bg-red-500/5",
  Warning: "border-l-amber-400 bg-amber-500/5",
  Info: "border-l-blue-400 bg-blue-500/5",
};

export default function FleetDashboard() {
  const { data: vessels = [], isLoading: loadingVessels } = useQuery({ queryKey: ["vessels"], queryFn: api.vessels.list });
  const { data: fleets = [] } = useQuery({ queryKey: ["fleets"], queryFn: api.fleets.list });
  const { data: alerts = [] } = useQuery({ queryKey: ["alerts"], queryFn: api.alerts.list });
  const { data: routes = [] } = useQuery({ queryKey: ["routes"], queryFn: api.routes.list });
  const { data: kpis } = useQuery({ queryKey: ["fleet-kpis"], queryFn: () => dataProvider.getFleetKPIs() });
  const { data: eventLogs = [] } = useQuery({ queryKey: ["dashboard-logs"], queryFn: () => dataProvider.getEventLogs() });
  const { data: mockVessels = [] } = useQuery({ queryKey: ["mock-vessels"], queryFn: () => dataProvider.getVessels() });

  const activeAlerts = alerts.filter((a: any) => a.status === "active");
  const activeRoutes = routes.filter((r: any) => r.status === "active");

  const recentAlerts = eventLogs.filter(l => l.severity === "Critical" || l.severity === "Warning").slice(0, 8);

  return (
    <div className="p-6 space-y-6">
      <div className="animate-fade-in-up flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight uppercase">Fleet Command Center</h1>
          <p className="text-xs text-muted-foreground mt-1 tracking-wider font-mono">MARITIME INTELLIGENCE & OPERATIONAL CONTROL // CLASSIFICATION: UNCLASSIFIED</p>
        </div>
        <div className="hidden md:flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />SYSTEMS NOMINAL</span>
          <span>UTC {new Date().toISOString().slice(11, 19)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 animate-fade-in-up stagger-1">
        {loadingVessels || !kpis ? (
          <>
            {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-16 rounded-lg" />)}
          </>
        ) : (
          <>
            <Card className="bg-card border-border hover:border-primary/20 transition-all group">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Vessels</p>
                <p className="text-xl font-bold font-display"><AnimatedCounter value={kpis.totalVessels} /></p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border hover:border-emerald-500/20 transition-all group">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">At Sea</p>
                <p className="text-xl font-bold font-display text-emerald-400"><AnimatedCounter value={kpis.atSea} /></p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border hover:border-blue-500/20 transition-all group">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">In Port</p>
                <p className="text-xl font-bold font-display text-blue-400"><AnimatedCounter value={kpis.inPort} /></p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border hover:border-amber-500/20 transition-all group">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Anchored</p>
                <p className="text-xl font-bold font-display text-amber-400"><AnimatedCounter value={kpis.anchored} /></p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border hover:border-emerald-500/20 transition-all group">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg TCE</p>
                <p className="text-xl font-bold font-display text-emerald-400">${(kpis.averageTCE / 1000).toFixed(0)}k</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border hover:border-primary/20 transition-all group">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Utilization</p>
                <p className="text-xl font-bold font-display">{kpis.averageUtilization}%</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border hover:border-chart-3/20 transition-all group">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">CO2 Today</p>
                <p className="text-xl font-bold font-display">{(kpis.totalCO2Today / 1000).toFixed(1)}k</p>
              </CardContent>
            </Card>
            <Card className={`bg-card border-border hover:border-red-500/20 transition-all group ${kpis.criticalAlerts > 0 ? "ring-1 ring-red-500/20" : ""}`}>
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Alerts</p>
                <p className={`text-xl font-bold font-display ${kpis.criticalAlerts > 0 ? "text-red-400" : ""}`}><AnimatedCounter value={kpis.activeAlerts} /></p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {kpis && (
        <Card className="bg-card border-border animate-fade-in-up stagger-2">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" /> Fleet Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className={`text-5xl font-bold font-display ${kpis.fleetHealthScore >= 80 ? "text-emerald-400" : kpis.fleetHealthScore >= 60 ? "text-amber-400" : "text-red-400"}`}>
                  {kpis.fleetHealthScore}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Overall Score</p>
              </div>
              <div className="flex-1 grid grid-cols-4 gap-6">
                <HealthPillar label="Operational" score={kpis.operationalScore} icon={Activity} color="bg-primary/10 text-primary" />
                <HealthPillar label="Compliance" score={kpis.complianceScore} icon={ShieldCheck} color="bg-chart-2/10 text-chart-2" />
                <HealthPillar label="Safety" score={kpis.safetyScore} icon={AlertTriangle} color="bg-chart-5/10 text-chart-5" />
                <HealthPillar label="Environmental" score={kpis.environmentalScore} icon={Leaf} color="bg-emerald-500/10 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {mockVessels.length > 0 && (
        <Card className="bg-card border-border animate-fade-in-up stagger-2">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" /> Fleet Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FleetMap mockVessels={mockVessels} />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="animate-fade-in-up stagger-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold">Fleet Overview</h2>
            </div>
            {fleets.length === 0 && !loadingVessels ? (
              <Card className="bg-card border-border border-dashed">
                <CardContent className="p-12 text-center">
                  <Anchor className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No fleets configured</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Fleets will appear here once created</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fleets.map((fleet: any, i: number) => {
                  const fleetVessels = vessels.filter((v: any) => v.fleetId === fleet.id);
                  const atSeaCount = fleetVessels.filter((v: any) => v.status === "at_sea").length;
                  return (
                    <Card key={fleet.id} className={`bg-card border-border hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 animate-fade-in-up stagger-${Math.min(i + 1, 8)}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-display">{fleet.name}</CardTitle>
                          <Badge variant="outline" className={statusColors[fleet.status] || ""}>
                            {fleet.status === "active" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse-dot" />}
                            {fleet.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{fleet.region}</p>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground mb-3">{fleet.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Ship className="w-3 h-3" /> {fleetVessels.length} vessels</span>
                          <span className="flex items-center gap-1">
                            <Waves className={`w-3 h-3 ${atSeaCount > 0 ? "animate-wave-float text-emerald-400" : ""}`} />
                            {atSeaCount} at sea
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <Card className="bg-card border-border animate-fade-in-up stagger-4 lg:row-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" /> Live Alert Feed
              </CardTitle>
              <Link href="/logs">
                <span className="text-xs text-primary hover:text-primary/80 cursor-pointer">View all</span>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {recentAlerts.map(alert => {
                const Icon = severityIcons[alert.severity as keyof typeof severityIcons] || Info;
                const colorClass = severityAlertColors[alert.severity as keyof typeof severityAlertColors] || "";
                return (
                  <div key={alert.id} className={`p-2.5 rounded-lg border border-border border-l-2 ${colorClass} transition-all hover:border-primary/20`}>
                    <div className="flex items-start gap-2">
                      <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${alert.severity === "Critical" ? "text-red-400" : "text-amber-400"}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium leading-tight">{alert.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground">{alert.vesselName}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(alert.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {recentAlerts.length === 0 && (
                <div className="text-center py-6">
                  <AlertTriangle className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No active alerts</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="animate-fade-in-up stagger-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold">Vessel Fleet</h2>
        </div>
        {loadingVessels ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <VesselCardSkeleton key={i} />)}
          </div>
        ) : vessels.length === 0 ? (
          <Card className="bg-card border-border border-dashed">
            <CardContent className="p-12 text-center">
              <Ship className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No vessels registered</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Vessels will appear here once added to the system</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {vessels.map((vessel: any, i: number) => {
              const fleet = fleets.find((f: any) => f.id === vessel.fleetId);
              const isAtSea = vessel.status === "at_sea";
              const isMaintenance = vessel.status === "maintenance";
              return (
                <Link key={vessel.id} href={`/vessel/${vessel.id}`}>
                  <Card className={`bg-card border-border hover:border-primary/30 transition-all duration-300 cursor-pointer group hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 animate-fade-in-up stagger-${Math.min((i % 6) + 1, 8)}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center relative ${isAtSea ? "ring-1 ring-emerald-500/30" : ""}`}>
                            <Ship className={`w-5 h-5 text-primary ${isAtSea ? "animate-wave-float" : ""}`} />
                            {isAtSea && (
                              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse-dot" />
                            )}
                            {isMaintenance && (
                              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-display font-semibold text-sm">{vessel.name}</h3>
                            <p className="text-xs text-muted-foreground">IMO: {vessel.imo}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-mono text-[10px]">CLASS</span>
                          <span className="font-medium">{vessel.shipClass || typeIcons[vessel.vesselType] || vessel.vesselType}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-mono text-[10px]">FLAG</span>
                          <span>{vessel.flag}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-mono text-[10px]">DWT</span>
                          <span>{vessel.deadweight ? `${Number(vessel.deadweight).toLocaleString()} t` : "N/A"}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-mono text-[10px]">ROUTE</span>
                          <span className="text-[10px] truncate max-w-[140px]">{vessel.tradeLane || fleet?.name || "Unassigned"}</span>
                        </div>
                        {vessel.nextPort && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground font-mono text-[10px]">NEXT</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-primary/60" />{vessel.nextPort}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                        <Badge variant="outline" className={`${statusColors[vessel.status] || ""} ${isAtSea ? "animate-pulse" : ""}`}>
                          {isAtSea && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse-dot" />}
                          {vessel.status?.replace("_", " ")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Built {vessel.yearBuilt}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
