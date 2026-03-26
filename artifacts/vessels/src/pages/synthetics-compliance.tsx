import { useQuery } from "@tanstack/react-query";
import { dataProvider } from "@/data/data-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, FileWarning, AlertTriangle, CheckCircle, Clock, Shield, Ban, Globe } from "lucide-react";

const certStatusColors: Record<string, string> = {
  Valid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Expiring Soon": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Expired: "bg-red-500/10 text-red-400 border-red-500/20",
};

const defSeverityColors: Record<string, string> = {
  High: "bg-red-500/10 text-red-400 border-red-500/20",
  Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export default function SyntheticsCompliancePage() {
  const { data: certificates = [] } = useQuery({ queryKey: ["certificates"], queryFn: () => dataProvider.getComplianceCertificates() });
  const { data: deficiencies = [] } = useQuery({ queryKey: ["deficiencies"], queryFn: () => dataProvider.getPortStateDeficiencies() });
  const { data: alerts = [] } = useQuery({ queryKey: ["compliance-alerts"], queryFn: () => dataProvider.getComplianceAlerts() });
  const { data: sanctions = [] } = useQuery({ queryKey: ["sanctions-risk"], queryFn: () => dataProvider.getSanctionsRiskIndicators() });

  const expiring = certificates.filter(c => c.status === "Expiring Soon").length;
  const expired = certificates.filter(c => c.status === "Expired").length;
  const openDef = deficiencies.filter(d => d.status === "Open").length;

  return (
    <div className="p-6 space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" /> Synthetics & Compliance
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Certificate tracking, port state control, compliance alerts, and sanctions monitoring</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up stagger-1">
        <Card className="bg-card border-border hover:border-emerald-500/20 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Valid Certs</p>
                <p className="text-2xl font-bold font-display mt-1 text-emerald-400">{certificates.filter(c => c.status === "Valid").length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform"><CheckCircle className="w-5 h-5 text-emerald-400" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-amber-500/20 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Expiring Soon</p>
                <p className={`text-2xl font-bold font-display mt-1 ${expiring > 0 ? "text-amber-400" : ""}`}>{expiring}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform ${expiring > 0 ? "animate-pulse" : ""}`}><Clock className="w-5 h-5 text-amber-400" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-red-500/20 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Expired / Open Def.</p>
                <p className="text-2xl font-bold font-display mt-1 text-red-400">{expired + openDef}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform ${(expired + openDef) > 0 ? "animate-pulse" : ""}`}><AlertTriangle className="w-5 h-5 text-red-400" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-red-500/20 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Sanctions Flags</p>
                <p className="text-2xl font-bold font-display mt-1 text-red-400">{sanctions.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform"><Ban className="w-5 h-5 text-red-400" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border animate-fade-in-up stagger-2">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <FileWarning className="w-5 h-5 text-amber-400" /> Certificate Tracker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {certificates.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry).map(cert => (
                <div key={cert.id} className={`p-3 rounded-lg border transition-all ${cert.status === "Expired" ? "border-red-500/20 bg-red-500/5" : cert.status === "Expiring Soon" ? "border-amber-500/20 bg-amber-500/5" : "border-border bg-background/50"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold">{cert.certificateType}</p>
                    <Badge variant="outline" className={`text-xs ${certStatusColors[cert.status]}`}>
                      {cert.status === "Expired" && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {cert.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{cert.vesselName} · {cert.issuer}</p>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>Expires: {new Date(cert.expiryDate).toLocaleDateString()}</span>
                    <span className={`font-semibold ${cert.daysUntilExpiry <= 0 ? "text-red-400" : cert.daysUntilExpiry <= 30 ? "text-amber-400" : "text-emerald-400"}`}>
                      {cert.daysUntilExpiry <= 0 ? `${Math.abs(cert.daysUntilExpiry)}d overdue` : `${cert.daysUntilExpiry}d remaining`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card border-border animate-fade-in-up stagger-3">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" /> Port State Control Deficiencies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deficiencies.map(def => (
                  <div key={def.id} className={`p-3 rounded-lg border transition-all ${def.status === "Open" ? "border-red-500/20 bg-red-500/5" : "border-border bg-background/50"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold">{def.description}</p>
                      <Badge variant="outline" className={`text-xs ${defSeverityColors[def.severity]}`}>{def.severity}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{def.vesselName} · {def.port} · Code: {def.deficiencyCode}</p>
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>Inspected: {new Date(def.inspectionDate).toLocaleDateString()}</span>
                      <Badge variant="outline" className={`text-[10px] ${def.status === "Open" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>{def.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border animate-fade-in-up stagger-4">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-400" /> Sanctions Risk Indicators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sanctions.map(s => (
                  <div key={s.id} className="p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-red-400">{s.vesselName}</p>
                      <Badge variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/20">{s.riskLevel}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{s.reason}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span>IMO: {s.imo}</span>
                      <span>Flag: {s.flag}</span>
                      <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {s.region}</span>
                      <span>Last seen: {new Date(s.lastSeen).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="bg-card border-border animate-fade-in-up stagger-5">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" /> Compliance Alert Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map(a => {
              const sevColor = a.severity === "Critical" ? "border-l-red-400 bg-red-500/5" : a.severity === "High" ? "border-l-orange-400 bg-orange-500/5" : a.severity === "Warning" ? "border-l-amber-400 bg-amber-500/5" : "border-l-blue-400 bg-blue-500/5";
              return (
                <div key={a.id} className={`p-3 rounded-lg border border-border border-l-2 ${sevColor}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{a.type}</p>
                      <Badge variant="outline" className={`text-[10px] ${a.severity === "Critical" ? "bg-red-500/10 text-red-400 border-red-500/20" : a.severity === "High" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : a.severity === "Warning" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>{a.severity}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(a.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{a.vessel} — {a.message}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
