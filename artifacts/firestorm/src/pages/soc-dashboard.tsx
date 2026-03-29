import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Activity, Clock, Users, Bell, Zap, TrendingUp } from "lucide-react";
import { useState, useEffect, useRef } from "react";

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
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(step);
      else ref.current = value;
    };
    requestAnimationFrame(step);
    return () => { cancelled = true; };
  }, [value, duration]);
  return <>{display}</>;
}

const severityColors: Record<string, string> = {
  critical: "text-red-400",
  high: "text-orange-400",
  medium: "text-amber-400",
  low: "text-blue-400",
};

const statusColors: Record<string, string> = {
  incident: "bg-red-500/10 text-red-400 border-red-500/20",
  alert: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  finding: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export default function SOCDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["soc-dashboard"],
    queryFn: api.socDashboard.get,
    refetchInterval: 30000,
  });

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-fade-in-up">
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary animate-pulse" /> SOC Operations Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Loading operational metrics...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-4"><div className="skeleton h-16 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" /> SOC Operations Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time security operations center metrics</p>
        </div>
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse">
          <Zap className="w-3 h-3 mr-1" /> Operational
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`bg-card border-border animate-fade-in-up stagger-1 hover:border-red-500/20 transition-all duration-300 group ${data.activeIncidents > 0 ? "ring-1 ring-red-500/10" : ""}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Incidents</p>
                <p className={`text-2xl font-bold font-display mt-1 ${data.activeIncidents > 0 ? "text-red-400" : "text-emerald-400"}`}>
                  <AnimatedCounter value={data.activeIncidents} />
                </p>
              </div>
              <div className={`w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform ${data.activeIncidents > 0 ? "animate-pulse" : ""}`}>
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border animate-fade-in-up stagger-2 hover:border-amber-500/20 transition-all duration-300 group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Open Alerts</p>
                <p className="text-2xl font-bold font-display mt-1 text-amber-400">
                  <AnimatedCounter value={data.openAlerts} />
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bell className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border animate-fade-in-up stagger-3 hover:border-primary/20 transition-all duration-300 group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">MTTD</p>
                <p className="text-2xl font-bold font-display mt-1">
                  <AnimatedCounter value={data.mttd} /><span className="text-sm text-muted-foreground ml-1">min</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border animate-fade-in-up stagger-4 hover:border-chart-4/20 transition-all duration-300 group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">MTTR</p>
                <p className="text-2xl font-bold font-display mt-1">
                  <AnimatedCounter value={data.mttr} /><span className="text-sm text-muted-foreground ml-1">min</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-chart-4/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5 text-chart-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-card border-border animate-fade-in-up stagger-5">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" /> Alerts by Severity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.alertsBySeverity || {}).map(([severity, count]) => (
              <div key={severity} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${severity === "critical" ? "bg-red-400 animate-pulse" : severity === "high" ? "bg-orange-400" : severity === "medium" ? "bg-amber-400" : "bg-blue-400"}`} />
                  <span className="text-sm font-medium capitalize">{severity}</span>
                </div>
                <span className={`text-lg font-bold font-display ${severityColors[severity] || ""}`}>{count as number}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border animate-fade-in-up stagger-6">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Analyst Workload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.analystWorkload || {}).length > 0 ? (
              Object.entries(data.analystWorkload).map(([analyst, count]) => (
                <div key={analyst} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border">
                  <span className="text-sm font-medium">{analyst}</span>
                  <Badge variant="outline">{count as number} incidents</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No active analyst assignments</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border animate-fade-in-up stagger-7">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Operational Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border">
              <span className="text-sm text-muted-foreground">Total Incidents</span>
              <span className="font-bold">{data.totalIncidents}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border">
              <span className="text-sm text-muted-foreground">Total Alerts</span>
              <span className="font-bold">{data.totalAlerts}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border">
              <span className="text-sm text-muted-foreground">Open Findings</span>
              <span className="font-bold">{data.openFindings}</span>
            </div>
            <div className={`flex items-center justify-between p-3 rounded-lg border ${data.criticalFindings > 0 ? "bg-red-500/5 border-red-500/20" : "bg-background/50 border-border"}`}>
              <span className="text-sm text-muted-foreground">Critical Findings</span>
              <span className={`font-bold ${data.criticalFindings > 0 ? "text-red-400" : ""}`}>{data.criticalFindings}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border animate-fade-in-up stagger-8">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(data.recentActivity || []).length > 0 ? (
            <div className="space-y-2">
              {data.recentActivity.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={statusColors[item.type] || ""}>
                      {item.type}
                    </Badge>
                    <span className="text-sm font-medium">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${item.severity === "critical" ? "bg-red-500/10 text-red-400 border-red-500/20" : item.severity === "high" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                      {item.severity}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No recent activity. Create incidents or alerts to populate this feed.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
