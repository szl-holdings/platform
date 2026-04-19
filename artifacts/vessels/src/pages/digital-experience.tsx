
import { dataProvider } from "@/data/data-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Progress } from "@szl-holdings/shared-ui/ui/progress";
import { Package, Truck, Star, Clock, AlertTriangle, CheckCircle, TrendingUp, MapPin } from "lucide-react";
import { useStandardQuery } from "@szl-holdings/api-client-react";

const demurrageColors: Record<string, string> = {
  Low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  High: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function DigitalExperiencePage() {
  const { data: shipments = [] } = useStandardQuery({ queryKey: ["shipments"], queryFn: () => dataProvider.getShipmentRecords() });

  const avgOnTime = shipments.length > 0 ? Math.round(shipments.reduce((s, r) => s + (r.onTimeScore ?? 0), 0) / shipments.length * 10) / 10 : 0;
  const avgSatisfaction = shipments.length > 0 ? (shipments.reduce((s, r) => s + (r.customerSatisfaction ?? 0), 0) / shipments.length).toFixed(1) : "0";
  const highRisk = shipments.filter(s => s.demurrageRisk === "High").length;
  const inTransit = shipments.filter(s => s.status === "In Transit").length;

  return (
    <div className="p-6 space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Package className="w-6 h-6 text-primary" /> Digital Experience
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Cargo visibility, on-time delivery rates, and charterer satisfaction benchmarks</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up stagger-1">
        <Card className="bg-card border-border hover:border-primary/20 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">In Transit</p>
                <p className="text-2xl font-bold font-display mt-1">{inTransit}</p>
                <p className="text-xs text-muted-foreground mt-1">{shipments.length} total shipments</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform"><Truck className="w-5 h-5 text-primary" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-emerald-500/20 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">On-Time Score</p>
                <p className="text-2xl font-bold font-display mt-1 text-emerald-400">{avgOnTime}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs text-emerald-400">+1.2% vs last month</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform"><CheckCircle className="w-5 h-5 text-emerald-400" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-amber-500/20 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Satisfaction</p>
                <p className="text-2xl font-bold font-display mt-1">{avgSatisfaction}<span className="text-sm text-muted-foreground">/5.0</span></p>
                <div className="flex items-center gap-0.5 mt-1">
                  {[1,2,3,4,5].map(i => <Star key={i} className={`w-3 h-3 ${i <= Math.round(Number(avgSatisfaction)) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />)}
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform"><Star className="w-5 h-5 text-amber-400" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-red-500/20 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Demurrage Risk</p>
                <p className="text-2xl font-bold font-display mt-1 text-red-400">{highRisk}</p>
                <p className="text-xs text-muted-foreground mt-1">high-risk shipments</p>
              </div>
              <div className={`w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform ${highRisk > 0 ? "animate-pulse" : ""}`}><AlertTriangle className="w-5 h-5 text-red-400" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border animate-fade-in-up stagger-2">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" /> Active Shipments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shipments.map(s => {
              const etaMs = s.eta ? new Date(s.eta).getTime() : Date.now();
              const departureMs = s.departureDate ? new Date(s.departureDate).getTime() : Date.now();
              const daysTotal = Math.max(1, Math.ceil((etaMs - departureMs) / 86400000));
              const daysPassed = Math.max(0, Math.ceil((Date.now() - departureMs) / 86400000));
              const progress = Math.min(100, Math.round((daysPassed / daysTotal) * 100));
              return (
                <div key={s.id} className={`p-4 rounded-lg border transition-all ${s.demurrageRisk === "High" ? "border-red-500/20 bg-red-500/5" : "border-border bg-background/50"} hover:border-primary/20`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{s.shipmentId}</p>
                        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">{s.cargoType}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.vesselName}</p>
                    </div>
                    <Badge variant="outline" className={`text-xs ${s.demurrageRisk ? demurrageColors[String(s.demurrageRisk)] ?? "" : ""}`}>
                      {String(s.demurrageRisk) === "High" && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {s.demurrageRisk} Risk
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs font-medium">{s.origin}</span>
                    <div className="flex-1 relative h-1.5 bg-muted rounded-full">
                      <div className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <MapPin className="w-3 h-3 text-primary" />
                    <span className="text-xs font-medium">{s.destination}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>{(s.weight ?? 0).toLocaleString()} MT</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ETA: {s.eta ? new Date(s.eta).toLocaleDateString() : "—"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <CheckCircle className={`w-3 h-3 ${(s.onTimeScore ?? 0) >= 95 ? "text-emerald-400" : (s.onTimeScore ?? 0) >= 90 ? "text-amber-400" : "text-red-400"}`} />
                        {(s.onTimeScore ?? 0)}% on-time
                      </span>
                      <span className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(i => <Star key={i} className={`w-2.5 h-2.5 ${i <= Math.round(s.customerSatisfaction ?? 0) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
