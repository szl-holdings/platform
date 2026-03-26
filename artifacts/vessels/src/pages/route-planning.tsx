import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navigation, Plus, MapPin, Clock, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  planned: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  completed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  canceled: "bg-red-500/10 text-red-400 border-red-500/20",
};

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Route Planning</h1>
          <p className="text-sm text-muted-foreground mt-1">Plan and manage vessel routes with waypoints</p>
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
        <div className="text-center py-12 text-muted-foreground">Loading routes...</div>
      ) : routes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No routes planned yet</div>
      ) : (
        <div className="space-y-3">
          {routes.map((route: any) => {
            const vessel = vessels.find((v: any) => v.id === route.vesselId);
            return (
              <Card key={route.id} className="bg-card border-border hover:border-primary/20 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                        <Navigation className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-display font-semibold">{route.originPort}</h3>
                          <span className="text-muted-foreground">→</span>
                          <h3 className="font-display font-semibold">{route.destinationPort}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{vessel?.name || "Unassigned vessel"}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
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
                            {route.waypoints.map((wp: any, i: number) => (
                              <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded">{wp.name || `Waypoint ${i + 1}`}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={statusColors[route.status] || ""}>{route.status}</Badge>
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
