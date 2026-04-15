import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Users, AlertTriangle, MapPin, Clock, Lock, Eye, Activity } from "lucide-react";

const identityAlerts = [
  { id: "ID-001", user: "j.smith@corp.com", type: "Impossible Travel", severity: "Critical", detail: "Login from New York (08:41) and Moscow (09:03) — 22 min apart, 7400km", status: "Blocked", time: "2h ago" },
  { id: "ID-002", user: "admin.svc@corp.com", type: "Credential Stuffing", severity: "Critical", detail: "847 failed logins from 103.45.x.x range in 4 minutes", status: "Locked", time: "3h ago" },
  { id: "ID-003", user: "m.rodriguez@corp.com", type: "Anomalous Privilege Escalation", severity: "High", detail: "Standard user account accessed Global Admin role for first time", status: "Revoked", time: "5h ago" },
  { id: "ID-004", user: "finance.svc@corp.com", type: "After-Hours Access", severity: "Medium", detail: "Service account active 2:14 AM — no maintenance window scheduled", status: "Investigating", time: "8h ago" },
  { id: "ID-005", user: "k.wilson@corp.com", type: "MFA Bypass Attempt", severity: "High", detail: "3 consecutive MFA push rejections followed by successful login via legacy auth", status: "Disabled", time: "11h ago" },
];

const compromisedAccounts = [
  { account: "j.smith@corp.com", riskScore: 97, lastActivity: "Accessing finance ERP", location: "Anomalous — Moscow IP", mfaEnabled: true },
  { account: "admin.svc@corp.com", riskScore: 94, lastActivity: "Service locked — 847 attempts", location: "103.45.67.89", mfaEnabled: false },
  { account: "m.rodriguez@corp.com", riskScore: 81, lastActivity: "Global Admin role accessed", location: "Internal — 192.168.1.45", mfaEnabled: true },
];

const privilegedSessions = [
  { user: "a.thompson@corp.com", role: "Domain Admin", started: "14 min ago", duration: "14m", actions: 23, risk: "Low" },
  { user: "devops.svc@corp.com", role: "Azure Contributor", started: "1h ago", duration: "1h 12m", actions: 147, risk: "Medium" },
  { user: "backup.svc@corp.com", role: "Backup Operator", started: "2h ago", duration: "2h 04m", actions: 892, risk: "High" },
];

const sevColor: Record<string, string> = {
  Critical: "bg-red-500/10 text-red-400 border-red-500/20",
  High: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export default function IdentityThreat() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          Identity Threat Detection
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Login anomalies, credential compromise, impossible travel, and privileged access alerts</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Active Identity Alerts", value: "5", color: "text-red-400" },
          { label: "Compromised Accounts", value: "3", color: "text-orange-400" },
          { label: "Privileged Sessions", value: "3", color: "text-amber-400" },
          { label: "MFA Coverage", value: "94%", color: "text-emerald-400" },
        ].map(({ label, value, color }) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-2xl font-bold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Identity Alerts</h3>
          <div className="space-y-3">
            {identityAlerts.map((alert) => (
              <Card key={alert.id} className={alert.severity === "Critical" ? "border-red-500/30" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${alert.severity === "Critical" ? "bg-red-500/10" : alert.severity === "High" ? "bg-orange-500/10" : "bg-amber-500/10"}`}>
                      <Users className={`w-4 h-4 ${alert.severity === "Critical" ? "text-red-400" : alert.severity === "High" ? "text-orange-400" : "text-amber-400"}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold">{alert.user}</span>
                        <Badge variant="outline" className={`text-[10px] ${sevColor[alert.severity]}`}>{alert.severity}</Badge>
                        <Badge variant="outline" className="text-[10px]">{alert.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{alert.detail}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                        <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{alert.time}</span>
                        <span className={`${alert.status === "Blocked" || alert.status === "Locked" || alert.status === "Revoked" || alert.status === "Disabled" ? "text-emerald-400" : "text-amber-400"}`}>→ {alert.status}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">High-Risk Accounts</h3>
            <div className="space-y-3">
              {compromisedAccounts.map((acct) => (
                <Card key={acct.account} className="border-red-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{acct.account}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{acct.lastActivity}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-2.5 h-2.5" />{acct.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-red-400">{acct.riskScore}</p>
                        <p className="text-[10px] text-muted-foreground">risk score</p>
                        <p className={`text-[10px] mt-0.5 ${acct.mfaEnabled ? "text-emerald-400" : "text-red-400"}`}>{acct.mfaEnabled ? "MFA On" : "No MFA"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Active Privileged Sessions</h3>
            <div className="space-y-2">
              {privilegedSessions.map((sess) => (
                <Card key={sess.user}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{sess.user}</span>
                          <Badge variant="outline" className="text-[10px]">{sess.role}</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Duration: {sess.duration} · {sess.actions} actions</p>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${sess.risk === "High" ? "text-red-400 bg-red-500/10 border-red-500/20" : sess.risk === "Medium" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"}`}>{sess.risk}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
