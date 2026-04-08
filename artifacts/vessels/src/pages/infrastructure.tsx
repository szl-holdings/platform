import { useQuery } from "@tanstack/react-query";
import { dataProvider } from "@/data/data-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Progress } from "@szl-holdings/shared-ui/ui/progress";
import { Wrench, Cog, Ship, AlertTriangle, CheckCircle, Clock, Shield, Activity } from "lucide-react";

const severityColors: Record<string, string> = {
  Critical: "bg-red-500/10 text-red-400 border-red-500/20",
  High: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const statusIcons: Record<string, typeof CheckCircle> = {
  Completed: CheckCircle,
  "In Progress": Activity,
  Scheduled: Clock,
  Overdue: AlertTriangle,
};

function HealthGauge({ value, label, color }: { value: number; label: string; color: string }) {
  const getColor = (v: number) => v >= 90 ? "text-emerald-400" : v >= 75 ? "text-amber-400" : v >= 60 ? "text-orange-400" : "text-red-400";
  const getBg = (v: number) => v >= 90 ? "bg-emerald-500" : v >= 75 ? "bg-amber-500" : v >= 60 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`text-xs font-bold ${getColor(value)}`}>{value}%</span>
      </div>
      <Progress value={value} className={`h-1.5 [&>div]:${getBg(value)}`} />
    </div>
  );
}

export default function InfrastructurePage() {
  const { data: vessels = [] } = useQuery({ queryKey: ["infra-vessels"], queryFn: () => dataProvider.getVessels() });
  const { data: maintenanceLogs = [] } = useQuery({ queryKey: ["maintenance-logs"], queryFn: () => dataProvider.getMaintenanceLogs() });

  const inProgressCount = maintenanceLogs.filter(m => m.status === "In Progress").length;
  const overdueCount = maintenanceLogs.filter(m => m.status === "Overdue").length;
  const scheduledCount = maintenanceLogs.filter(m => m.status === "Scheduled").length;
  const totalCost = maintenanceLogs.reduce((s, m) => s + m.cost ?? 0, 0);

  const avgEngine = vessels.length > 0 ? Math.round(vessels.reduce((s, v) => s + (v.engineHealth ?? 0), 0) / vessels.length) : 0;
  const avgHull = vessels.length > 0 ? Math.round(vessels.reduce((s, v) => s + (v.hullCondition ?? 0), 0) / vessels.length) : 0;
  const avgMaint = vessels.length > 0 ? Math.round(vessels.reduce((s, v) => s + (v.maintenanceScore ?? 0), 0) / vessels.length) : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Cog className="w-6 h-6 text-primary" /> Infrastructure
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Engine telemetry, hull fouling index, dry-dock schedules, and predictive maintenance alerts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up stagger-1">
        <Card className="bg-card border-border hover:border-primary/20 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Engine Health</p>
                <p className={`text-2xl font-bold font-display mt-1 ${avgEngine >= 85 ? "text-emerald-400" : avgEngine >= 70 ? "text-amber-400" : "text-red-400"}`}>{avgEngine}%</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform"><Cog className="w-5 h-5 text-primary" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-chart-2/20 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Hull Condition</p>
                <p className={`text-2xl font-bold font-display mt-1 ${avgHull >= 85 ? "text-emerald-400" : avgHull >= 70 ? "text-amber-400" : "text-red-400"}`}>{avgHull}%</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center group-hover:scale-110 transition-transform"><Shield className="w-5 h-5 text-chart-2" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-orange-500/20 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Open Work Orders</p>
                <p className="text-2xl font-bold font-display mt-1">{inProgressCount + scheduledCount + overdueCount}</p>
                {overdueCount > 0 && <span className="text-xs text-red-400">{overdueCount} overdue</span>}
              </div>
              <div className={`w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform ${overdueCount > 0 ? "animate-pulse" : ""}`}><Wrench className="w-5 h-5 text-orange-400" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-chart-4/20 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Est. Maint. Costs</p>
                <p className="text-2xl font-bold font-display mt-1">${(totalCost / 1000).toFixed(0)}K</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-chart-4/10 flex items-center justify-center group-hover:scale-110 transition-transform"><Activity className="w-5 h-5 text-chart-4" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up stagger-2">
        {vessels.filter(v => (v.engineHealth ?? 0) < 85 || (v.hullCondition ?? 0) < 80 || (v.maintenanceScore ?? 0) < 75).map(v => (
          <Card key={v.id} className={`bg-card border-border hover:border-primary/20 transition-all ${(v.engineHealth ?? 0) < 70 || (v.hullCondition ?? 0) < 70 ? "ring-1 ring-red-500/20" : ""}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-sm flex items-center gap-2">
                  <Ship className="w-4 h-4 text-primary" /> {v.name}
                </CardTitle>
                <Badge variant="outline" className={`text-xs ${v.status === "maintenance" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
                  {v.status.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <HealthGauge value={(v.engineHealth ?? 0)} label="Engine Health" color="primary" />
              <HealthGauge value={(v.hullCondition ?? 0)} label="Hull Condition" color="chart-2" />
              <HealthGauge value={(v.maintenanceScore ?? 0)} label="Maintenance Score" color="chart-3" />
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                <div>Type: <span className="text-foreground capitalize">{v.vesselType}</span></div>
                <div>Built: <span className="text-foreground">{v.yearBuilt}</span></div>
                <div>GT: <span className="text-foreground">{(v.grossTonnage ?? 0).toLocaleString()}</span></div>
                <div>EEXI: <span className="text-foreground">{v.eexi}</span></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border animate-fade-in-up stagger-3">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-400" /> Maintenance Backlog
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {maintenanceLogs.sort((a, b) => {
              const order: Record<string, number> = { Overdue: 0, "In Progress": 1, Scheduled: 2, Completed: 3 };
              return (order[a.status] ?? 4) - (order[b.status] ?? 4);
            }).map(log => {
              const StatusIcon = statusIcons[log.status] || Clock;
              return (
                <div key={log.id} className={`p-4 rounded-lg border transition-all ${log.status === "Overdue" ? "border-red-500/20 bg-red-500/5" : log.status === "In Progress" ? "border-amber-500/20 bg-amber-500/5" : "border-border bg-background/50"}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <StatusIcon className={`w-4 h-4 mt-0.5 ${log.status === "Completed" ? "text-emerald-400" : log.status === "Overdue" ? "text-red-400" : log.status === "In Progress" ? "text-amber-400" : "text-muted-foreground"}`} />
                      <div>
                        <p className="text-sm font-semibold">{log.component}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{log.vesselName} · {log.type}</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">{log.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${severityColors[log.severity] || ""}`}>{log.severity}</Badge>
                      <Badge variant="outline" className={`text-xs ${log.status === "Completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : log.status === "Overdue" ? "bg-red-500/10 text-red-400 border-red-500/20" : log.status === "In Progress" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-muted text-muted-foreground"}`}>{log.status}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground ml-7">
                    <span>Scheduled: {new Date(log.date).toLocaleDateString()}</span>
                    <span>Est: {log.estimatedHours}h</span>
                    <span>Cost: ${(log.cost ?? 0).toLocaleString()}</span>
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
