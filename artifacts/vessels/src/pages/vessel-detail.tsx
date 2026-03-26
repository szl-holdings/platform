import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Ship, MapPin, Package, Navigation, Clock } from "lucide-react";

const statusColors: Record<string, string> = {
  at_sea: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  in_port: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  anchored: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  maintenance: "bg-red-500/10 text-red-400 border-red-500/20",
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  completed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  planned: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  in_transit: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  loading: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  delivered: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export default function VesselDetailPage() {
  const [, params] = useRoute("/vessel/:id");
  const vesselId = Number(params?.id);

  const { data: vessel, isLoading } = useQuery({ queryKey: ["vessel", vesselId], queryFn: () => api.vessels.get(vesselId), enabled: !!vesselId });
  const { data: positions = [] } = useQuery({ queryKey: ["positions", vesselId], queryFn: () => api.vessels.positions(vesselId), enabled: !!vesselId });
  const { data: cargo = [] } = useQuery({ queryKey: ["cargo", vesselId], queryFn: () => api.vessels.cargo(vesselId), enabled: !!vesselId });
  const { data: routes = [] } = useQuery({ queryKey: ["vesselRoutes", vesselId], queryFn: () => api.vessels.routes(vesselId), enabled: !!vesselId });

  if (isLoading) return <div className="flex items-center justify-center h-full text-muted-foreground">Loading...</div>;
  if (!vessel) return <div className="flex items-center justify-center h-full text-muted-foreground">Vessel not found</div>;

  const lastPosition = positions[0];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold">{vessel.name}</h1>
            <Badge variant="outline" className={statusColors[vessel.status] || ""}>
              {vessel.status?.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">IMO: {vessel.imo} | MMSI: {vessel.mmsi || "N/A"} | {vessel.flag}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Ship className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="text-sm font-semibold capitalize">{vessel.vesselType}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-chart-2" />
              <div>
                <p className="text-xs text-muted-foreground">Last Position</p>
                <p className="text-sm font-semibold">{lastPosition ? `${Number(lastPosition.latitude).toFixed(4)}, ${Number(lastPosition.longitude).toFixed(4)}` : "Unknown"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Navigation className="w-5 h-5 text-chart-3" />
              <div>
                <p className="text-xs text-muted-foreground">Speed / Heading</p>
                <p className="text-sm font-semibold">{lastPosition ? `${lastPosition.speed} kn / ${lastPosition.heading}°` : "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-chart-4" />
              <div>
                <p className="text-xs text-muted-foreground">Tonnage</p>
                <p className="text-sm font-semibold">{vessel.grossTonnage ? `${Number(vessel.grossTonnage).toLocaleString()} GT` : "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="routes" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="routes">Routes ({routes.length})</TabsTrigger>
          <TabsTrigger value="cargo">Cargo ({cargo.length})</TabsTrigger>
          <TabsTrigger value="positions">Position History ({positions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="routes" className="space-y-3">
          {routes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No routes assigned</p>
          ) : routes.map((route: any) => (
            <Card key={route.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Navigation className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-semibold text-sm">{route.originPort} → {route.destinationPort}</p>
                      <p className="text-xs text-muted-foreground">
                        {route.departureAt ? new Date(route.departureAt).toLocaleDateString() : "TBD"} — {route.arrivalAt ? new Date(route.arrivalAt).toLocaleDateString() : "TBD"}
                        {route.distanceNm ? ` | ${Number(route.distanceNm).toLocaleString()} nm` : ""}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={statusColors[route.status] || ""}>{route.status}</Badge>
                </div>
                {route.waypoints && Array.isArray(route.waypoints) && route.waypoints.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {route.waypoints.map((wp: any, i: number) => (
                      <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded">{wp.name || `WP ${i + 1}`}</span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="cargo" className="space-y-3">
          {cargo.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No cargo records</p>
          ) : cargo.map((c: any) => (
            <Card key={c.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{c.cargoType}</p>
                    <p className="text-xs text-muted-foreground">{c.quantity} {c.unit} | {c.origin} → {c.destination}</p>
                  </div>
                  <Badge variant="outline" className={statusColors[c.status] || ""}>{c.status?.replace("_", " ")}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="positions" className="space-y-3">
          {positions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No position data</p>
          ) : positions.map((pos: any) => (
            <Card key={pos.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-chart-2" />
                    <div>
                      <p className="text-sm font-mono">{Number(pos.latitude).toFixed(4)}°, {Number(pos.longitude).toFixed(4)}°</p>
                      <p className="text-xs text-muted-foreground">Speed: {pos.speed} kn | Heading: {pos.heading}°</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(pos.recordedAt).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
