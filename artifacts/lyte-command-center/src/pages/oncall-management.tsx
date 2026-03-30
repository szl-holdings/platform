import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Users, Clock, Bell, Phone, ChevronRight, Calendar, Activity, AlertTriangle } from "lucide-react";

const onCallSchedule = [
  { team: "Platform SRE", primary: "S. Park", secondary: "J. Chen", escalation: "K. Wilson (Director)", shift: "Now → Mar 31 09:00", pagerduty: "PD-SRE-001" },
  { team: "Backend Engineering", primary: "M. Rodriguez", secondary: "A. Thompson", escalation: "T. Lee (VP Eng)", shift: "Now → Apr 2 09:00", pagerduty: "PD-BE-002" },
  { team: "Infrastructure", primary: "B. Kim", secondary: "L. Patel", escalation: "K. Wilson (Director)", shift: "Now → Mar 31 09:00", pagerduty: "PD-INFRA-003" },
  { team: "Security", primary: "R. Santos", secondary: "F. Nguyen", escalation: "C. Martinez (CISO)", shift: "Now → Apr 1 09:00", pagerduty: "PD-SEC-004" },
];

const recentPages = [
  { id: "PAGE-001", incident: "payment-service: Latency spike", team: "Platform SRE", paged: "S. Park", ack: "2 min 14s", resolved: "14 min 07s", time: "2h ago" },
  { id: "PAGE-002", incident: "auth-service: Error rate > 5%", team: "Backend Engineering", paged: "M. Rodriguez", ack: "1 min 02s", resolved: "8 min 34s", time: "5h ago" },
  { id: "PAGE-003", incident: "DB: Replication lag critical", team: "Infrastructure", paged: "B. Kim", ack: "3 min 45s", resolved: "22 min 18s", time: "8h ago" },
  { id: "PAGE-004", incident: "Security: Anomalous access detected", team: "Security", paged: "R. Santos", ack: "0 min 58s", resolved: "31 min 02s", time: "12h ago" },
];

const escalationPolicies = [
  { name: "5-Minute Escalation", steps: ["Page Primary", "→ 5 min: Page Secondary", "→ 10 min: Page Manager", "→ 15 min: Page Director"], sla: "15 min max" },
  { name: "Critical P0 Policy", steps: ["Page Primary + Secondary simultaneously", "→ 2 min: Notify Manager", "→ 5 min: Bridge call created"], sla: "5 min escalation" },
];

const oncallMetrics = [
  { metric: "Avg Ack Time", value: "2m 4s", target: "< 5 min", status: "good" },
  { metric: "Avg Resolution", value: "18m 40s", target: "< 60 min", status: "good" },
  { metric: "Pages This Week", value: "23", target: "< 30", status: "good" },
  { metric: "Noise Ratio", value: "1.8%", target: "< 5%", status: "good" },
];

export default function OnCallManagement() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Phone className="w-6 h-6 text-cyan-400" />
          On-Call Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Intelligent escalation policies, schedule optimization, and team on-call health tracking</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {oncallMetrics.map(({ metric, value, target, status }) => (
          <Card key={metric}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{metric}</p>
              <p className={`text-2xl font-bold ${status === "good" ? "text-emerald-400" : "text-red-400"}`}>{value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Target: {target}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Current On-Call Schedule</h3>
          <div className="space-y-3">
            {onCallSchedule.map((sched) => (
              <Card key={sched.team}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{sched.team}</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 mt-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Primary</p>
                          <p className="font-medium text-emerald-400">{sched.primary}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Secondary</p>
                          <p className="font-medium">{sched.secondary}</p>
                        </div>
                        <div className="mt-1 col-span-2">
                          <p className="text-muted-foreground">Escalation</p>
                          <p className="font-medium text-amber-400">{sched.escalation}</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1"><Clock className="w-3 h-3" />{sched.shift}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Pages</h3>
          <div className="space-y-2">
            {recentPages.map((page) => (
              <Card key={page.id}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <Bell className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold">{page.incident}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{page.team} → {page.paged}</p>
                      <div className="flex gap-3 mt-1 text-[10px]">
                        <span className="text-sky-400">Ack: {page.ack}</span>
                        <span className="text-emerald-400">Resolved: {page.resolved}</span>
                        <span className="text-muted-foreground">{page.time}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Escalation Policies</h3>
            {escalationPolicies.map((p) => (
              <Card key={p.name} className="mb-3">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{p.name}</span>
                    <Badge variant="outline" className="text-[10px]">{p.sla}</Badge>
                  </div>
                  {p.steps.map((step, i) => (
                    <p key={i} className={`text-xs py-0.5 ${step.startsWith("→") ? "text-muted-foreground pl-3" : "font-medium"}`}>{step}</p>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
