import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Button } from "@workspace/shared-ui/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/shared-ui/ui/select";
import { Progress } from "@workspace/shared-ui/ui/progress";
import { ClipboardCheck, Shield, CheckCircle, AlertTriangle, XCircle, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const frameworkLabels: Record<string, string> = {
  nist_csf: "NIST CSF",
  fedramp: "FedRAMP",
  fisma: "FISMA",
};

const statusColors: Record<string, string> = {
  implemented: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  partial: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  not_implemented: "bg-red-500/10 text-red-400 border-red-500/20",
  not_applicable: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const statusIcons: Record<string, any> = {
  implemented: CheckCircle,
  partial: AlertTriangle,
  not_implemented: XCircle,
  not_applicable: Shield,
};

function AnimatedProgress({ value, className }: { value: number; className?: string }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setCurrent(value), 100);
    return () => clearTimeout(timer);
  }, [value]);
  return <Progress value={current} className={`${className} transition-all duration-1000`} />;
}

export default function CompliancePage() {
  const qc = useQueryClient();
  const [framework, setFramework] = useState<string>("nist_csf");
  const { data: controls = [], isLoading } = useQuery({
    queryKey: ["compliance", framework],
    queryFn: () => api.compliance.list(framework),
  });

  const seedMut = useMutation({
    mutationFn: () => api.compliance.seed(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["compliance"] }); toast.success("Controls seeded"); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.compliance.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["compliance"] }); toast.success("Control updated"); },
  });

  const implemented = controls.filter((c: any) => c.status === "implemented").length;
  const partial = controls.filter((c: any) => c.status === "partial").length;
  const notImplemented = controls.filter((c: any) => c.status === "not_implemented").length;
  const total = controls.length;
  const score = total > 0 ? Math.round(((implemented + partial * 0.5) / total) * 100) : 0;

  const categories = [...new Set(controls.map((c: any) => c.category))];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-primary" /> Compliance Posture
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Framework alignment and control status tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={framework} onValueChange={setFramework}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="nist_csf">NIST CSF</SelectItem>
              <SelectItem value="fedramp">FedRAMP</SelectItem>
              <SelectItem value="fisma">FISMA</SelectItem>
            </SelectContent>
          </Select>
          {controls.length === 0 && (
            <Button variant="outline" onClick={() => seedMut.mutate()} disabled={seedMut.isPending}>
              <Download className="w-4 h-4 mr-2" /> {seedMut.isPending ? "Seeding..." : "Seed Controls"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up stagger-1">
        <Card className="bg-card border-border hover:border-primary/20 transition-all group">
          <CardContent className="p-4 text-center">
            <div className="text-4xl font-bold font-display mt-2" style={{ color: score >= 80 ? "hsl(var(--chart-4))" : score >= 50 ? "hsl(var(--chart-3))" : "hsl(var(--chart-2))" }}>
              {score}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Overall Score</p>
            <AnimatedProgress value={score} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-emerald-500/20 transition-all group">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Implemented</p>
              <p className="text-2xl font-bold font-display mt-1 text-emerald-400">{implemented}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-amber-500/20 transition-all group">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Partial</p>
              <p className="text-2xl font-bold font-display mt-1 text-amber-400">{partial}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-red-500/20 transition-all group">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Not Implemented</p>
              <p className="text-2xl font-bold font-display mt-1 text-red-400">{notImplemented}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="bg-card border-border"><CardContent className="p-4"><div className="skeleton h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : controls.length === 0 ? (
        <Card className="bg-card border-border border-dashed animate-fade-in-up stagger-2">
          <CardContent className="p-16 text-center">
            <ClipboardCheck className="w-8 h-8 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No compliance controls for {frameworkLabels[framework] || framework}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Click "Seed Controls" to load NIST CSF controls</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 animate-fade-in-up stagger-2">
          {categories.map(category => {
            const catControls = controls.filter((c: any) => c.category === category);
            const catImpl = catControls.filter((c: any) => c.status === "implemented").length;
            const catScore = catControls.length > 0 ? Math.round((catImpl / catControls.length) * 100) : 0;

            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display text-lg font-semibold">{category}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{catImpl}/{catControls.length} implemented</span>
                    <Badge variant="outline" className={catScore >= 80 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : catScore >= 50 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}>
                      {catScore}%
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  {catControls.map((control: any) => {
                    const StatusIcon = statusIcons[control.status] || Shield;
                    return (
                      <Card key={control.id} className="bg-card border-border hover:border-primary/20 transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <StatusIcon className={`w-4 h-4 ${control.status === "implemented" ? "text-emerald-400" : control.status === "partial" ? "text-amber-400" : "text-red-400"}`} />
                                <span className="font-mono text-xs text-muted-foreground">{control.controlId}</span>
                                <h3 className="font-semibold text-sm">{control.controlName}</h3>
                              </div>
                              {control.description && <p className="text-xs text-muted-foreground ml-6">{control.description}</p>}
                              {control.evidenceNotes && <p className="text-xs text-emerald-400/80 ml-6 mt-1">{control.evidenceNotes}</p>}
                            </div>
                            <Select value={control.status} onValueChange={v => updateMut.mutate({ id: control.id, data: { status: v } })}>
                              <SelectTrigger className="w-44 h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="implemented">Implemented</SelectItem>
                                <SelectItem value="partial">Partially Implemented</SelectItem>
                                <SelectItem value="not_implemented">Not Implemented</SelectItem>
                                <SelectItem value="not_applicable">Not Applicable</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
