import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { Database, RefreshCw, Trash2, CheckCircle, AlertTriangle } from "lucide-react";

export default function SeedManagerPage() {
  const [lastResult, setLastResult] = useState<{ type: string; success: boolean; message: string } | null>(null);

  const seedMutation = useMutation({
    mutationFn: api.seedData,
    onSuccess: (data) => {
      const totalRows = data.tables?.reduce((sum, t) => sum + t.rows, 0) ?? 0;
      setLastResult({ type: "seed", success: true, message: `Seeded ${totalRows} rows across ${data.tables?.length ?? 0} tables` });
    },
    onError: () => {
      setLastResult({ type: "seed", success: false, message: "Failed to seed data" });
    },
  });

  const resetMutation = useMutation({
    mutationFn: api.resetData,
    onSuccess: (data) => {
      setLastResult({ type: "reset", success: true, message: data.message ?? "Data reset successfully" });
    },
    onError: () => {
      setLastResult({ type: "reset", success: false, message: "Failed to reset data" });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Seed & Demo Data</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage demo data for development and testing</p>
      </div>

      {lastResult && (
        <div className={`rounded-lg border p-4 flex items-center gap-3 ${
          lastResult.success
            ? "border-emerald-500/30 bg-emerald-500/10"
            : "border-red-500/30 bg-red-500/10"
        }`}>
          {lastResult.success ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span className={`text-sm ${lastResult.success ? "text-emerald-400" : "text-red-400"}`}>
            {lastResult.message}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Seed Demo Data</h3>
              <p className="text-xs text-muted-foreground">Populate the database with sample records</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            This will insert demo projects, users, audit log entries, and feature flags into the database.
            Existing data will not be affected.
          </p>
          <button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="w-full flex items-center justify-center gap-2 text-sm py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {seedMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            Run Seed
          </button>
        </div>

        <div className="rounded-lg border border-red-500/20 bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Reset All Data</h3>
              <p className="text-xs text-muted-foreground">Clear and re-seed from scratch</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            This will remove all existing demo data and re-populate with fresh defaults.
            Use this to return to a clean state.
          </p>
          <button
            onClick={() => resetMutation.mutate()}
            disabled={resetMutation.isPending}
            className="w-full flex items-center justify-center gap-2 text-sm py-2.5 rounded-md border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
          >
            {resetMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Reset Data
          </button>
        </div>
      </div>
    </div>
  );
}
