import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Bell, Shield, Plus, Clock, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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

export default function AlertCenterPage() {
  const qc = useQueryClient();
  const { data: alerts = [], isLoading: loadingAlerts } = useQuery({ queryKey: ["alerts"], queryFn: api.alerts.list });
  const { data: alertRules = [] } = useQuery({ queryKey: ["alertRules"], queryFn: api.alertRules.list });
  const { data: vessels = [] } = useQuery({ queryKey: ["vessels"], queryFn: api.vessels.list });
  const [ruleOpen, setRuleOpen] = useState(false);
  const [ruleForm, setRuleForm] = useState({ name: "", ruleType: "speed", severity: "medium" });

  const createRuleMut = useMutation({
    mutationFn: (data: any) => api.alertRules.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["alertRules"] }); setRuleOpen(false); toast.success("Alert rule created"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteRuleMut = useMutation({
    mutationFn: (id: number) => api.alertRules.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["alertRules"] }); toast.success("Rule deleted"); },
  });

  const activeAlerts = alerts.filter((a: any) => a.status === "active");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Alert Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor triggered alerts and manage alert rules</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Alerts</p>
              <p className="text-2xl font-bold font-display mt-1 text-chart-5">{activeAlerts.length}</p>
            </div>
            <AlertTriangle className="w-5 h-5 text-chart-5" />
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Alerts</p>
              <p className="text-2xl font-bold font-display mt-1">{alerts.length}</p>
            </div>
            <Bell className="w-5 h-5 text-primary" />
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Alert Rules</p>
              <p className="text-2xl font-bold font-display mt-1">{alertRules.length}</p>
            </div>
            <Shield className="w-5 h-5 text-chart-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="alerts">Triggered Alerts ({alerts.length})</TabsTrigger>
          <TabsTrigger value="rules">Alert Rules ({alertRules.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-3">
          {loadingAlerts ? (
            <div className="text-center py-12 text-muted-foreground">Loading alerts...</div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No alerts triggered</div>
          ) : (
            alerts.map((alert: any) => {
              const vessel = vessels.find((v: any) => v.id === alert.vesselId);
              return (
                <Card key={alert.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${alert.severity === "critical" ? "bg-red-500/10" : alert.severity === "high" ? "bg-orange-500/10" : "bg-amber-500/10"}`}>
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
                        <Badge variant="outline" className={severityColors[alert.severity] || ""}>{alert.severity}</Badge>
                        <Badge variant="outline" className={alertStatusColors[alert.status] || ""}>{alert.status}</Badge>
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
            <div className="text-center py-12 text-muted-foreground">No alert rules configured</div>
          ) : alertRules.map((rule: any) => (
            <Card key={rule.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">{rule.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{rule.description || `${rule.ruleType} based alert rule`}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">{rule.ruleType}</Badge>
                      <Badge variant="outline" className={severityColors[rule.severity] || ""}>{rule.severity}</Badge>
                      {rule.isActive && <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active</Badge>}
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
