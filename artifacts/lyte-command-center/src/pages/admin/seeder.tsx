import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Database, CheckCircle2, AlertTriangle, RefreshCw, Play, RotateCcw, Info } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const r = await fetch(`/api${path}`, { headers: { "Content-Type": "application/json" }, ...opts });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

interface SeedTableCheck {
  table: string;
  description: string;
  expected: number;
  actual: number;
  status: "pass" | "fail" | "error";
}

interface SeedValidation {
  timestamp: string;
  overallStatus: "complete" | "incomplete" | "error";
  results: SeedTableCheck[];
  summary: { total: number; passed: number; failed: number; errors: number };
}

const statusStyles = {
  pass:  { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", label: "Pass" },
  fail:  { color: "text-amber-400 bg-amber-500/10 border-amber-500/20",   label: "Low" },
  error: { color: "text-red-400 bg-red-500/10 border-red-500/20",         label: "Error" },
};

const overallColors = {
  complete:   "text-emerald-400",
  incomplete: "text-amber-400",
  error:      "text-red-400",
};

export default function DemoDataSeeder() {
  const [confirmReset, setConfirmReset] = useState(false);
  const [actionResult, setActionResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery<SeedValidation>({
    queryKey: ["admin-seed-validate"],
    queryFn: () => apiFetch("/admin/seed/validate"),
    refetchInterval: 30000,
  });

  const seedMutation = useMutation({
    mutationFn: () => apiFetch("/admin/seed", { method: "POST" }),
    onSuccess: () => {
      setActionResult({ type: "success", message: "Platform data seeded successfully." });
      qc.invalidateQueries({ queryKey: ["admin-seed-validate"] });
    },
    onError: (e) => setActionResult({ type: "error", message: String(e) }),
  });

  const resetMutation = useMutation({
    mutationFn: () => apiFetch("/admin/seed/reset", { method: "POST" }),
    onSuccess: () => {
      setActionResult({ type: "success", message: "Demo data reset. Re-seeding on next load." });
      setConfirmReset(false);
      qc.invalidateQueries({ queryKey: ["admin-seed-validate"] });
    },
    onError: (e) => { setActionResult({ type: "error", message: String(e) }); setConfirmReset(false); },
  });

  const summary = data?.summary;
  const results = data?.results ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-display font-bold flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />Demo Data Seeder
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Validate and manage platform demo data state</p>
        </div>
        <div className="flex items-center gap-3">
          {data?.overallStatus && (
            <span className={cn("text-xs font-mono font-medium uppercase", overallColors[data.overallStatus])}>
              {data.overallStatus}
            </span>
          )}
          <button onClick={() => qc.invalidateQueries({ queryKey: ["admin-seed-validate"] })} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {actionResult && (
        <div className={cn(
          "rounded-xl border p-4 flex items-center gap-3 text-sm",
          actionResult.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
        )}>
          {actionResult.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{actionResult.message}</span>
          <button onClick={() => setActionResult(null)} className="ml-auto text-xs opacity-60 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Tables", value: summary.total, color: "text-foreground" },
            { label: "Passing",  value: summary.passed, color: "text-emerald-400" },
            { label: "Low / Missing", value: summary.failed, color: "text-amber-400" },
            { label: "Errors",  value: summary.errors, color: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <div className={cn("text-2xl font-bold font-display", s.color)}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start gap-2 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-300/80">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
        <span>Seeder auto-runs on startup when tables are empty. Use manual seed only to force re-populate, and reset only in development.</span>
      </div>

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => seedMutation.mutate()}
          disabled={seedMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5" />
          {seedMutation.isPending ? "Seeding..." : "Run Seeder"}
        </button>
        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Data
          </button>
        ) : (
          <div className="flex items-center gap-2 p-2 rounded-lg border border-red-500/30 bg-red-500/10">
            <span className="text-xs text-red-400 font-medium">Confirm reset?</span>
            <button
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
              className="px-2 py-1 rounded text-[10px] font-bold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {resetMutation.isPending ? "Resetting..." : "Yes, Reset"}
            </button>
            <button onClick={() => setConfirmReset(false)} className="px-2 py-1 rounded text-[10px] text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">Failed to load seed validation</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Table Validation</span>
            {data?.timestamp && <span className="text-[10px] text-muted-foreground">Checked {new Date(data.timestamp).toLocaleTimeString()}</span>}
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Table</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium hidden sm:table-cell">Description</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Rows</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium hidden sm:table-cell">Min</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((c) => {
                const s = statusStyles[c.status] ?? statusStyles.pass;
                return (
                  <tr key={c.table} className="border-b border-border/30 hover:bg-white/[0.015] transition-colors">
                    <td className="px-4 py-2.5 font-mono text-[10px] text-muted-foreground">{c.table}</td>
                    <td className="px-4 py-2.5 hidden sm:table-cell text-muted-foreground/70">{c.description}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium text-foreground">{c.actual}</td>
                    <td className="px-4 py-2.5 text-right hidden sm:table-cell font-mono text-muted-foreground">{c.expected}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border", s.color)}>
                        {s.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
