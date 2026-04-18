import { AnimatedCounter } from "@szl-holdings/shared-ui/animated-counter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Button } from "@szl-holdings/shared-ui/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@szl-holdings/shared-ui/ui/dialog";
import { Input } from "@szl-holdings/shared-ui/ui/input";
import { Label } from "@szl-holdings/shared-ui/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@szl-holdings/shared-ui/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@szl-holdings/shared-ui/ui/tabs";
import { AlertTriangle, Bell, Shield, Plus, Clock, Trash2, BellOff } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "@szl-holdings/shared-ui/ui/sonner";
import { doctrineEventBus } from "@szl-holdings/observability";
import { DoctrineLayerBadge } from "@szl-holdings/shared-ui/doctrine-layer-badge";
import { DataStateBadge } from "@szl-holdings/shared-ui/data-state-badge";
import { EmptyState } from "@szl-holdings/shared-ui/design-system";

interface FleetAlert {
  id: number;
  title: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "active" | "acknowledged" | "resolved" | "dismissed";
  vesselId: number;
  triggeredAt: string;
}

interface FleetVessel {
  id: number;
  name: string;
}

interface AlertRuleData {
  id: number;
  name: string;
  description?: string;
  ruleType: string;
  severity: string;
  isActive?: boolean;
}


const severityColors: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
};

const alertStatusColors: Record<string, string> = {
  active: "bg-red-500/10 text-red-400 border-red-500/20",
  acknowledged: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  dismissed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const alertStatusLabels: Record<string, string> = {
  active: "Requires review",
  acknowledged: "Priority event",
  resolved: "Operational change",
  dismissed: "Route variance",
};

function AlertSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="skeleton w-8 h-8 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <div className="skeleton h-4 w-40" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-32" />
          </div>
          <div className="flex gap-2">
            <div className="skeleton h-5 w-16 rounded-full" />
            <div className="skeleton h-5 w-16 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AlertCenterPage() {
  const qc = useQueryClient();
  const { data: alertsRaw = [], isLoading: loadingAlerts, isError: alertsError } = useQuery({ queryKey: ["alerts"], queryFn: api.alerts.list });
  const { data: alertRulesRaw = [] } = useQuery({ queryKey: ["alertRules"], queryFn: api.alertRules.list });
  const { data: vesselsRaw = [] } = useQuery({ queryKey: ["vessels"], queryFn: api.vessels.list });

  const alerts = alertsRaw as unknown as FleetAlert[];
  const alertRules = alertRulesRaw as unknown as AlertRuleData[];
  const vessels = vesselsRaw as unknown as FleetVessel[];
  const isLive = !alertsError && !loadingAlerts;
  const [ruleOpen, setRuleOpen] = useState(false);
  const [ruleForm, setRuleForm] = useState({ name: "", ruleType: "speed", severity: "medium" });

  const createRuleMut = useMutation({
    mutationFn: (data: any) => api.alertRules.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["alertRules"] }); setRuleOpen(false); toast.success("Alert rule created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteRuleMut = useMutation({
    mutationFn: (id: number) => api.alertRules.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["alertRules"] }); toast.success("Rule deleted"); },
  });

  const activeAlerts = alerts.filter((a) => a.status === "active");

  useEffect(() => {
    if (activeAlerts.length > 0) {
      const hasCritical = activeAlerts.some((a) => a.severity === "critical");
      doctrineEventBus.emit({
        type: "alert",
        sourceApp: "vessels",
        layer: "OBSERVE",
        severity: hasCritical ? "critical" : "warning",
        title: `${activeAlerts.length} active maritime alert${activeAlerts.length > 1 ? "s" : ""}`,
        description: `Fleet alert stream: ${activeAlerts.length} active alert(s) require attention across fleet operations.`,
        entitiesInvolved: activeAlerts.slice(0, 3).map((a) => `vessel-${a.vesselId}`),
        context: {
          source: "alert-center",
          sourceApp: "vessels",
          severity: hasCritical ? "critical" : "medium",
          confidence: 0.92,
          impactedEntities: activeAlerts.slice(0, 5).map((a) => `vessel-${a.vesselId}`),
          causalFactors: ["threshold breach", "anomaly detection", "rule violation"],
          suggestedNextAction: "Acknowledge critical alerts and dispatch response team if required",
          businessImpact: `${activeAlerts.length} fleet operation(s) at risk — potential regulatory and safety exposure`,
          operationalImpact: "Active alert monitoring underway; fleet movements may require rerouting",
          layer: "OBSERVE",
          timestamp: Date.now(),
        },
        metadata: { alertCount: activeAlerts.length, source: "alert-center" },
      });
    }
  }, [activeAlerts.length]);

  return (
    <div className="p-6 space-y-6">
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-3 mb-0.5">
          <h1 className="font-display text-2xl font-bold">Alert Center</h1>
          <DoctrineLayerBadge appId="vessels" variant="compact" />
        </div>
        <p className="text-sm text-muted-foreground mt-1">Active alert stream, rule configuration, and escalation thresholds across fleet operations</p>
        <div className="flex items-center gap-2 mt-2">
          <DataStateBadge state={isLive ? "live" : "demo"} pulse={isLive} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`bg-card border-border animate-fade-in-up stagger-1 hover:border-chart-5/20 transition-all duration-300 group ${activeAlerts.length > 0 ? "ring-1 ring-chart-5/10" : ""}`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Alerts</p>
              <p className="text-2xl font-bold font-display mt-1 text-chart-5"><AnimatedCounter value={activeAlerts.length} /></p>
            </div>
            <div className={`w-10 h-10 rounded-lg bg-chart-5/10 flex items-center justify-center group-hover:scale-110 transition-transform ${activeAlerts.length > 0 ? "animate-pulse" : ""}`}>
              <AlertTriangle className="w-5 h-5 text-chart-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border animate-fade-in-up stagger-2 hover:border-primary/20 transition-all duration-300 group">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Alerts</p>
              <p className="text-2xl font-bold font-display mt-1"><AnimatedCounter value={alerts.length} /></p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bell className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border animate-fade-in-up stagger-3 hover:border-chart-2/20 transition-all duration-300 group">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Alert Rules</p>
              <p className="text-2xl font-bold font-display mt-1"><AnimatedCounter value={alertRules.length} /></p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5 text-chart-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="space-y-4 animate-fade-in-up stagger-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="alerts">Triggered Alerts ({alerts.length})</TabsTrigger>
          <TabsTrigger value="rules">Alert Rules ({alertRules.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-3">
          {loadingAlerts ? (
            <>
              {[...Array(3)].map((_, i) => <AlertSkeleton key={i} />)}
            </>
          ) : alerts.length === 0 ? (
            <EmptyState
              icon={BellOff}
              headline="All vessels nominal"
              description="No active fleet alerts. Speed, geofence, weather, schedule, cargo, and maintenance thresholds are all within tolerance — alerts will surface here the moment a rule trips."
              accentColor="#10b981"
            />
          ) : (
            alerts.map((alert, i: number) => {
              const vessel = vessels.find((v) => v.id === alert.vesselId);
              const isCritical = alert.severity === "critical";
              const isActive = alert.status === "active";
              return (
                <Card key={alert.id} className={`bg-card border-border transition-all duration-300 animate-fade-in-up stagger-${Math.min(i + 1, 8)} ${isCritical && isActive ? "ring-1 ring-red-500/20" : "hover:border-primary/20"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${alert.severity === "critical" ? "bg-red-500/10" : alert.severity === "high" ? "bg-orange-500/10" : "bg-amber-500/10"} ${isCritical && isActive ? "animate-pulse" : ""}`}>
                          <AlertTriangle className={`w-4 h-4 ${alert.severity === "critical" ? "text-red-400" : alert.severity === "high" ? "text-orange-400" : "text-amber-400"}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{alert.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            {vessel && <span>{vessel.name}</span>}
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(alert.triggeredAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${severityColors[alert.severity] || ""} ${isCritical && isActive ? "animate-pulse" : ""}`}>
                          {isCritical && isActive && <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5 animate-pulse-dot" />}
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline" className={alertStatusColors[alert.status] || ""}>{alertStatusLabels[alert.status] || alert.status}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="rules" className="space-y-3">
          <div className="flex justify-end">
            <Dialog open={ruleOpen} onOpenChange={setRuleOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Rule</Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader><DialogTitle className="font-display">Create Alert Rule</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Name</Label><Input value={ruleForm.name} onChange={e => setRuleForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Speed Limit Alert" /></div>
                  <div>
                    <Label>Rule Type</Label>
                    <Select value={ruleForm.ruleType} onValueChange={v => setRuleForm(p => ({ ...p, ruleType: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="speed">Speed</SelectItem>
                        <SelectItem value="geofence">Geofence</SelectItem>
                        <SelectItem value="weather">Weather</SelectItem>
                        <SelectItem value="schedule">Schedule</SelectItem>
                        <SelectItem value="cargo">Cargo</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Severity</Label>
                    <Select value={ruleForm.severity} onValueChange={v => setRuleForm(p => ({ ...p, severity: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => {
                    if (!ruleForm.name) { toast.error("Name required"); return; }
                    createRuleMut.mutate({ name: ruleForm.name, ruleType: ruleForm.ruleType, severity: ruleForm.severity, conditions: {} });
                  }} disabled={createRuleMut.isPending} className="w-full">
                    {createRuleMut.isPending ? "Creating..." : "Create Rule"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {alertRules.length === 0 ? (
            <EmptyState
              icon={Shield}
              headline="No alert rules configured"
              description="Create rules to automatically trigger alerts when vessel behavior falls outside acceptable parameters."
              accentColor="#38bdf8"
            />
          ) : alertRules.map((rule, i: number) => (
            <Card key={rule.id} className={`bg-card border-border hover:border-primary/20 transition-all duration-300 animate-fade-in-up stagger-${Math.min(i + 1, 8)}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">{rule.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{rule.description || `${rule.ruleType} based alert rule`}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">{rule.ruleType}</Badge>
                      <Badge variant="outline" className={severityColors[rule.severity] || ""}>{rule.severity}</Badge>
                      {rule.isActive && (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse-dot" />
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteRuleMut.mutate(rule.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
