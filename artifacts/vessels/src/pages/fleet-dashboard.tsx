import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Ship, Anchor, Navigation, AlertTriangle, Activity, ArrowRight, Waves, Package } from "lucide-react";

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

export default function FleetDashboard() {
  const { data: vessels = [], isLoading: loadingVessels } = useQuery({ queryKey: ["vessels"], queryFn: api.vessels.list });
  const { data: fleets = [] } = useQuery({ queryKey: ["fleets"], queryFn: api.fleets.list });
  const { data: alerts = [] } = useQuery({ queryKey: ["alerts"], queryFn: api.alerts.list });
  const { data: routes = [] } = useQuery({ queryKey: ["routes"], queryFn: api.routes.list });

  const activeAlerts = alerts.filter((a: any) => a.status === "active");
  const activeRoutes = routes.filter((r: any) => r.status === "active");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Fleet Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time fleet overview and status monitoring</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Vessels</p>
                <p className="text-2xl font-bold font-display mt-1">{vessels.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Ship className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Fleets</p>
                <p className="text-2xl font-bold font-display mt-1">{fleets.filter((f: any) => f.status === "active").length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                <Anchor className="w-5 h-5 text-chart-2" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Routes</p>
                <p className="text-2xl font-bold font-display mt-1">{activeRoutes.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                <Navigation className="w-5 h-5 text-chart-3" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Alerts</p>
                <p className="text-2xl font-bold font-display mt-1">{activeAlerts.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-chart-5/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-chart-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold">Fleet Overview</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fleets.map((fleet: any) => {
            const fleetVessels = vessels.filter((v: any) => v.fleetId === fleet.id);
            return (
              <Card key={fleet.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-display">{fleet.name}</CardTitle>
                    <Badge variant="outline" className={statusColors[fleet.status] || ""}>
                      {fleet.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{fleet.region}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-3">{fleet.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Ship className="w-3 h-3" /> {fleetVessels.length} vessels</span>
                    <span className="flex items-center gap-1"><Waves className="w-3 h-3" /> {fleetVessels.filter((v: any) => v.status === "at_sea").length} at sea</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold">Vessel Fleet</h2>
        </div>
        {loadingVessels ? (
          <div className="text-center py-12 text-muted-foreground">Loading vessels...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {vessels.map((vessel: any) => {
              const fleet = fleets.find((f: any) => f.id === vessel.fleetId);
              return (
                <Link key={vessel.id} href={`/vessel/${vessel.id}`}>
                  <Card className="bg-card border-border hover:border-primary/30 transition-all cursor-pointer group">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Ship className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-display font-semibold text-sm">{vessel.name}</h3>
                            <p className="text-xs text-muted-foreground">IMO: {vessel.imo}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
                        <Badge variant="outline" className={statusColors[vessel.status] || ""}>
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
