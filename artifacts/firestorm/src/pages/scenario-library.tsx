import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Target, Plus, Trash2, Shield, Zap, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const categoryColors: Record<string, string> = {
  network: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  application: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  social_engineering: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  physical: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  insider_threat: "bg-red-500/10 text-red-400 border-red-500/20",
  supply_chain: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

const severityColors: Record<string, string> = {
  low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
};

const categoryLabels: Record<string, string> = {
  network: "Network",
  application: "Application",
  social_engineering: "Social Engineering",
  physical: "Physical Security",
  insider_threat: "Insider Threat",
  supply_chain: "Supply Chain",
};

export default function ScenarioLibrary() {
  const qc = useQueryClient();
  const { data: scenarios = [], isLoading } = useQuery({ queryKey: ["scenarios"], queryFn: api.scenarios.list });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "network", severity: "medium", description: "" });
  const [filter, setFilter] = useState<string>("all");

  const createMut = useMutation({
    mutationFn: (data: any) => api.scenarios.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["scenarios"] }); setOpen(false); toast.success("Scenario created"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.scenarios.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["scenarios"] }); toast.success("Scenario deleted"); },
  });

  const filtered = filter === "all" ? scenarios : scenarios.filter((s: any) => s.category === filter);
  const categories = [...new Set(scenarios.map((s: any) => s.category))];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Scenario Library</h1>
          <p className="text-sm text-muted-foreground mt-1">Pre-built security assessment scenarios for simulation</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Scenario</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="font-display">Create Scenario</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Phishing Campaign Simulation" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Severity</Label>
                  <Select value={form.severity} onValueChange={v => setForm(p => ({ ...p, severity: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Scenario description..." rows={3} /></div>
              <Button onClick={() => {
                if (!form.name) { toast.error("Name required"); return; }
                createMut.mutate(form);
              }} disabled={createMut.isPending} className="w-full">
                {createMut.isPending ? "Creating..." : "Create Scenario"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>All ({scenarios.length})</Button>
        {categories.map((cat: string) => (
          <Button key={cat} variant={filter === cat ? "default" : "outline"} size="sm" onClick={() => setFilter(cat)}>
            {categoryLabels[cat] || cat} ({scenarios.filter((s: any) => s.category === cat).length})
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading scenarios...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No scenarios found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((scenario: any) => (
            <Card key={scenario.id} className="bg-card border-border hover:border-primary/20 transition-colors group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Target className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <CardTitle className="text-sm font-display leading-tight">{scenario.name}</CardTitle>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteMut.mutate(scenario.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{scenario.description || "No description"}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={categoryColors[scenario.category] || ""}>{categoryLabels[scenario.category] || scenario.category}</Badge>
                  <Badge variant="outline" className={severityColors[scenario.severity] || ""}>{scenario.severity}</Badge>
                </div>
                {scenario.attackVector && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Zap className="w-3 h-3" />
                    <span>{scenario.attackVector}</span>
                  </div>
                )}
                {scenario.mitreTechnique && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-3 h-3" />
                    <span>MITRE: {scenario.mitreTechnique}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
