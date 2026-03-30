import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Grid3X3, Shield, AlertTriangle } from "lucide-react";

const tactics = [
  { id: "TA0001", name: "Initial Access", techniques: ["T1566", "T1190", "T1133", "T1078", "T1195"] },
  { id: "TA0002", name: "Execution", techniques: ["T1059", "T1204", "T1053", "T1047", "T1203"] },
  { id: "TA0003", name: "Persistence", techniques: ["T1547", "T1053", "T1136", "T1078", "T1543"] },
  { id: "TA0004", name: "Privilege Escalation", techniques: ["T1548", "T1134", "T1068", "T1055", "T1078"] },
  { id: "TA0005", name: "Defense Evasion", techniques: ["T1070", "T1036", "T1027", "T1562", "T1218"] },
  { id: "TA0006", name: "Credential Access", techniques: ["T1003", "T1110", "T1555", "T1056", "T1557"] },
  { id: "TA0007", name: "Discovery", techniques: ["T1087", "T1082", "T1083", "T1046", "T1135"] },
  { id: "TA0008", name: "Lateral Movement", techniques: ["T1021", "T1570", "T1080", "T1563", "T1550"] },
  { id: "TA0009", name: "Collection", techniques: ["T1560", "T1005", "T1039", "T1074", "T1113"] },
  { id: "TA0010", name: "Exfiltration", techniques: ["T1041", "T1048", "T1567", "T1029", "T1030"] },
  { id: "TA0011", name: "Command & Control", techniques: ["T1071", "T1573", "T1105", "T1571", "T1572"] },
  { id: "TA0040", name: "Impact", techniques: ["T1486", "T1485", "T1490", "T1489", "T1561"] },
];

const techniqueNames: Record<string, string> = {
  T1566: "Phishing", T1190: "Exploit Public App", T1133: "External Remote Svc", T1078: "Valid Accounts", T1195: "Supply Chain",
  T1059: "Command/Script Interpreter", T1204: "User Execution", T1053: "Scheduled Task", T1047: "WMI", T1203: "Exploitation for Client",
  T1547: "Boot Autostart", T1136: "Create Account", T1543: "System Services",
  T1548: "Abuse Elevation", T1134: "Access Token Manipulation", T1068: "Exploitation for Priv Esc", T1055: "Process Injection",
  T1070: "Indicator Removal", T1036: "Masquerading", T1027: "Obfuscated Files", T1562: "Impair Defenses", T1218: "System Binary Proxy",
  T1003: "OS Credential Dump", T1110: "Brute Force", T1555: "Credentials from Stores", T1056: "Input Capture", T1557: "Adversary-in-the-Middle",
  T1087: "Account Discovery", T1082: "System Info Discovery", T1083: "File Discovery", T1046: "Network Service Scan", T1135: "Network Share Discovery",
  T1021: "Remote Services", T1570: "Lateral Tool Transfer", T1080: "Taint Shared Content", T1563: "Remote Service Session", T1550: "Use Alternate Auth",
  T1560: "Archive Data", T1005: "Data from Local System", T1039: "Data from Network Share", T1074: "Data Staged", T1113: "Screen Capture",
  T1041: "Exfil Over C2", T1048: "Exfil Over Alt Protocol", T1567: "Exfil Over Web Svc", T1029: "Scheduled Transfer", T1030: "Data Transfer Limits",
  T1071: "Application Layer Protocol", T1573: "Encrypted Channel", T1105: "Ingress Tool Transfer", T1571: "Non-Standard Port", T1572: "Protocol Tunneling",
  T1486: "Data Encrypted for Impact", T1485: "Data Destruction", T1490: "Inhibit System Recovery", T1489: "Service Stop", T1561: "Disk Wipe",
};

export default function MitreAttackPage() {
  const { data: findings = [] } = useQuery({ queryKey: ["findings"], queryFn: () => api.findings.list() });
  const { data: incidents = [] } = useQuery({ queryKey: ["incidents"], queryFn: api.incidents.list });

  const observedTechniques = new Set<string>();
  findings.forEach((f: any) => {
    if (f.category) {
      const match = f.category.match(/T\d{4}/);
      if (match) observedTechniques.add(match[0]);
    }
  });
  incidents.forEach((i: any) => {
    if (i.attackTechnique) {
      const match = i.attackTechnique.match(/T\d{4}/);
      if (match) observedTechniques.add(match[0]);
    }
  });

  const totalTechniques = tactics.reduce((sum, t) => sum + t.techniques.length, 0);
  const coverage = totalTechniques > 0 ? Math.round((observedTechniques.size / totalTechniques) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Grid3X3 className="w-6 h-6 text-primary" /> MITRE ATT&CK Matrix
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Detection coverage mapped to MITRE ATT&CK — identify gaps in adversary visibility</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            {observedTechniques.size} Observed
          </Badge>
          <Badge variant="outline">
            {coverage}% Coverage
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up stagger-1">
        <Card className="bg-card border-border hover:border-primary/20 transition-all group">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Tactics Covered</p>
              <p className="text-2xl font-bold font-display mt-1">{tactics.filter(t => t.techniques.some(tech => observedTechniques.has(tech))).length}/{tactics.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Grid3X3 className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-emerald-500/20 transition-all group">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Techniques Detected</p>
              <p className="text-2xl font-bold font-display mt-1 text-emerald-400">{observedTechniques.size}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-red-500/20 transition-all group">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Coverage Gaps</p>
              <p className="text-2xl font-bold font-display mt-1 text-red-400">{totalTechniques - observedTechniques.size}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4 text-xs animate-fade-in-up stagger-2">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50" /> Detected</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-muted border border-border" /> Not Observed</span>
      </div>

      <div className="overflow-x-auto animate-fade-in-up stagger-3">
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${tactics.length}, minmax(130px, 1fr))` }}>
          {tactics.map(tactic => (
            <div key={tactic.id} className="space-y-2">
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-2 text-center">
                <p className="text-[10px] text-muted-foreground font-mono">{tactic.id}</p>
                <p className="text-xs font-semibold">{tactic.name}</p>
              </div>
              {tactic.techniques.map(tech => {
                const isObserved = observedTechniques.has(tech);
                return (
                  <div
                    key={tech}
                    className={`rounded-lg p-2 text-center border transition-all cursor-default ${
                      isObserved
                        ? "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20"
                        : "bg-muted/30 border-border hover:bg-muted/50"
                    }`}
                  >
                    <p className={`text-[10px] font-mono ${isObserved ? "text-emerald-400" : "text-muted-foreground"}`}>{tech}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{techniqueNames[tech] || tech}</p>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
