import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Ship, Anchor, Navigation, AlertTriangle, Activity, ArrowRight, Waves, Package } from "lucide-react";
import { useEffect, useState, useRef } from "react";

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

export default function FleetDashboard() {
  const { data: vessels = [], isLoading: loadingVessels } = useQuery({ queryKey: ["vessels"], queryFn: api.vessels.list });
  const { data: fleets = [] } = useQuery({ queryKey: ["fleets"], queryFn: api.fleets.list });
  const { data: alerts = [] } = useQuery({ queryKey: ["alerts"], queryFn: api.alerts.list });
  const { data: routes = [] } = useQuery({ queryKey: ["routes"], queryFn: api.routes.list });

  const activeAlerts = alerts.filter((a: any) => a.status === "active");
  const activeRoutes = routes.filter((r: any) => r.status === "active");

  return (
    <div className="p-6 space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="font-display text-2xl font-bold">Fleet Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time fleet overview and status monitoring</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingVessels ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <Card className="bg-card border-border animate-fade-in-up stagger-1 hover:border-primary/20 transition-all duration-300 group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Vessels</p>
                    <p className="text-2xl font-bold font-display mt-1"><AnimatedCounter value={vessels.length} /></p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Ship className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border animate-fade-in-up stagger-2 hover:border-chart-2/20 transition-all duration-300 group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Fleets</p>
                    <p className="text-2xl font-bold font-display mt-1"><AnimatedCounter value={fleets.filter((f: any) => f.status === "active").length} /></p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Anchor className="w-5 h-5 text-chart-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border animate-fade-in-up stagger-3 hover:border-chart-3/20 transition-all duration-300 group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Routes</p>
                    <p className="text-2xl font-bold font-display mt-1"><AnimatedCounter value={activeRoutes.length} /></p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Navigation className="w-5 h-5 text-chart-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border animate-fade-in-up stagger-4 hover:border-chart-5/20 transition-all duration-300 group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Alerts</p>
                    <p className="text-2xl font-bold font-display mt-1">
                      <span className={activeAlerts.length > 0 ? "text-chart-5" : ""}><AnimatedCounter value={activeAlerts.length} /></span>
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg bg-chart-5/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${activeAlerts.length > 0 ? "animate-pulse" : ""}`}>
                    <AlertTriangle className="w-5 h-5 text-chart-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="animate-fade-in-up stagger-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Type</span>
                          <span>{typeIcons[vessel.vesselType] || vessel.vesselType}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Flag</span>
                          <span>{vessel.flag}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Fleet</span>
                          <span>{fleet?.name || "Unassigned"}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Tonnage</span>
                          <span>{vessel.grossTonnage ? `${Number(vessel.grossTonnage).toLocaleString()} GT` : "N/A"}</span>
                        </div>
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
