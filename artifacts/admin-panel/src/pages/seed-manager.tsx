import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Database, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Trash2, Zap } from "lucide-react";
import { useState } from "react";

export default function SeedManagerPage() {
  const qc = useQueryClient();
  const { data, isLoading, refetch } = useQuery({ queryKey: ["admin-seed-validate"], queryFn: api.validateSeedData });
  const [confirmReset, setConfirmReset] = useState(false);

  const seedMut = useMutation({
    mutationFn: api.seedData,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-seed-validate"] }); refetch(); },
  });

  const resetMut = useMutation({
    mutationFn: api.resetData,
    onSuccess: () => { setConfirmReset(false); qc.invalidateQueries({ queryKey: ["admin-seed-validate"] }); refetch(); },
  });

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Seed Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage demo and seed data across all tables</p>
        </div>
        <div className="flex items-center gap-2">
          {confirmReset ? (
            <>
              <span className="text-xs text-red-400 mr-1">Confirm reset?</span>
              <button
                onClick={() => resetMut.mutate()}
                disabled={resetMut.isPending}
                className="px-3 py-1.5 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Yes, Reset
              </button>
              <button onClick={() => setConfirmReset(false)} className="px-3 py-1.5 text-xs bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setConfirmReset(true)}
                className="px-3 py-1.5 text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Reset Data
              </button>
              <button
                onClick={() => seedMut.mutate()}
                disabled={seedMut.isPending}
                className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {seedMut.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                Seed All
              </button>
            </>
          )}
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Tables", value: summary.total },
            { label: "Passing", value: summary.passed, color: "emerald" },
            { label: "Failing", value: summary.failed, color: "red" },
            { label: "Errors", value: summary.errors, color: "amber" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
              <p className={`text-2xl font-bold ${s.color ? (s.color === "emerald" ? "text-emerald-400" : s.color === "red" ? "text-red-400" : "text-amber-400") : ""}`}>
                {s.value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Table</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Expected</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actual</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.results.map((r) => (
                <tr key={r.table} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-2.5 font-mono text-xs">{r.table}</td>
                  <td className="px-5 py-2.5 text-xs text-muted-foreground">{r.description}</td>
                  <td className="px-5 py-2.5 text-xs text-right text-muted-foreground">≥{r.expected}</td>
                  <td className="px-5 py-2.5 text-xs text-right font-semibold">{r.actual}</td>
                  <td className="px-5 py-2.5 text-center">
                    {r.status === "pass" && <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />}
                    {r.status === "fail" && <AlertTriangle className="w-4 h-4 text-amber-400 mx-auto" />}
                    {r.status === "error" && <XCircle className="w-4 h-4 text-red-400 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
