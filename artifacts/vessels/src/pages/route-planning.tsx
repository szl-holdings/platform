import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Button } from "@workspace/shared-ui/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/shared-ui/ui/dialog";
import { Input } from "@workspace/shared-ui/ui/input";
import { Label } from "@workspace/shared-ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/shared-ui/ui/select";
import { Navigation, Plus, MapPin, Clock, Trash2, Route, ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  planned: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  completed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  canceled: "bg-red-500/10 text-red-400 border-red-500/20",
};

function RoutePathIndicator({ status }: { status: string }) {
  const isActive = status === "active";
  return (
    <div className="flex items-center gap-1 my-2">
      <div className={`w-2.5 h-2.5 rounded-full border-2 ${isActive ? "border-emerald-400 bg-emerald-400/30" : "border-muted-foreground/40 bg-transparent"}`} />
      <div className="flex-1 relative h-0.5">
        <div className={`absolute inset-0 rounded-full ${isActive ? "bg-emerald-400/30" : "bg-muted-foreground/20"}`} />
        {isActive && (
          <div className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-emerald-400 animate-pulse" />
        )}
        {[0.25, 0.5, 0.75].map((pos) => (
          <div
            key={pos}
            className={`absolute top-1/2 -translate-y-1/2 w-1 h-1 rounded-full ${isActive ? "bg-emerald-400" : "bg-muted-foreground/30"}`}
            style={{ left: `${pos * 100}%` }}
          />
        ))}
      </div>
      <div className={`w-2.5 h-2.5 rounded-full border-2 ${status === "completed" ? "border-blue-400 bg-blue-400/30" : "border-muted-foreground/40 bg-transparent"}`} />
    </div>
  );
}

function RouteSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="skeleton w-10 h-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-48" />
            <div className="skeleton h-3 w-32" />
            <div className="skeleton h-3 w-40" />
          </div>
          <div className="skeleton h-5 w-16 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function RoutePlanningPage() {
  const qc = useQueryClient();
  const { data: routes = [], isLoading } = useQuery({ queryKey: ["routes"], queryFn: api.routes.list });
  const { data: vessels = [] } = useQuery({ queryKey: ["vessels"], queryFn: api.vessels.list });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ vesselId: "", originPort: "", destinationPort: "", distanceNm: "" });

  const createMut = useMutation({
    mutationFn: (data: any) => api.routes.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["routes"] }); setOpen(false); toast.success("Route created"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.routes.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["routes"] }); toast.success("Route deleted"); },
  });

  const handleCreate = () => {
    if (!form.vesselId || !form.originPort || !form.destinationPort) { toast.error("Fill required fields"); return; }
    createMut.mutate({
      vesselId: Number(form.vesselId),
      originPort: form.originPort,
      destinationPort: form.destinationPort,
      distanceNm: form.distanceNm || undefined,
      status: "planned",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold">Route Planning</h1>
          <p className="text-sm text-muted-foreground mt-1">Voyage planning with waypoint optimization, ETA forecasting, and weather-adjusted routing</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Route</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="font-display">Create Route</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Vessel</Label>
                <Select value={form.vesselId} onValueChange={v => setForm(p => ({ ...p, vesselId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select vessel" /></SelectTrigger>
                  <SelectContent>{vessels.map((v: any) => <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Origin Port</Label><Input value={form.originPort} onChange={e => setForm(p => ({ ...p, originPort: e.target.value }))} placeholder="e.g. Shanghai" /></div>
                <div><Label>Destination Port</Label><Input value={form.destinationPort} onChange={e => setForm(p => ({ ...p, destinationPort: e.target.value }))} placeholder="e.g. Rotterdam" /></div>
              </div>
              <div><Label>Distance (nm)</Label><Input value={form.distanceNm} onChange={e => setForm(p => ({ ...p, distanceNm: e.target.value }))} placeholder="Optional" /></div>
              <Button onClick={handleCreate} disabled={createMut.isPending} className="w-full">{createMut.isPending ? "Creating..." : "Create Route"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <RouteSkeleton key={i} />)}
        </div>
      ) : routes.length === 0 ? (
        <Card className="bg-card border-border border-dashed animate-fade-in-up stagger-2">
          <CardContent className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-4">
              <Navigation className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground font-medium">No routes planned yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Create your first route to begin tracking vessel journeys</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {routes.map((route: any, i: number) => {
            const vessel = vessels.find((v: any) => v.id === route.vesselId);
            const isActive = route.status === "active";
            return (
              <Card key={route.id} className={`bg-card border-border hover:border-primary/20 transition-all duration-300 animate-fade-in-up stagger-${Math.min(i + 1, 8)} ${isActive ? "ring-1 ring-emerald-500/10" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5 ${isActive ? "ring-1 ring-emerald-500/20" : ""}`}>
                        <Navigation className={`w-5 h-5 text-primary ${isActive ? "animate-pulse" : ""}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-display font-semibold">{route.originPort}</h3>
                          <ArrowRight className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-muted-foreground"}`} />
                          <h3 className="font-display font-semibold">{route.destinationPort}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{vessel?.name || "Unassigned vessel"}</p>
                        <RoutePathIndicator status={route.status} />
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          {route.departureAt && (
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Dep: {new Date(route.departureAt).toLocaleDateString()}</span>
                          )}
                          {route.arrivalAt && (
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> ETA: {new Date(route.arrivalAt).toLocaleDateString()}</span>
                          )}
                          {route.distanceNm && (
                            <span>{Number(route.distanceNm).toLocaleString()} nm</span>
                          )}
                        </div>
                        {route.waypoints && Array.isArray(route.waypoints) && route.waypoints.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {route.waypoints.map((wp: any, idx: number) => (
                              <span key={idx} className="text-xs bg-muted px-2 py-0.5 rounded flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5 text-primary/60" />
                                {wp.name || `Waypoint ${idx + 1}`}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`${statusColors[route.status] || ""} ${isActive ? "animate-pulse" : ""}`}>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse-dot" />}
                        {route.status}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteMut.mutate(route.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
