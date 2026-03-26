import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { Database, RefreshCw, Trash2, CheckCircle, AlertTriangle, XCircle, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";

export default function SeedManagerPage() {
  const [lastResult, setLastResult] = useState<{ type: string; success: boolean; message: string } | null>(null);
  const [showAllResults, setShowAllResults] = useState(false);

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

  const { data: validation, isLoading: validating, refetch: runValidation } = useQuery({
    queryKey: ["seed-validation"],
    queryFn: api.validateSeedData,
    enabled: false,
  });

  const failedResults = validation?.results.filter((r) => r.status !== "pass") ?? [];
  const passedResults = validation?.results.filter((r) => r.status === "pass") ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Seed & Demo Data</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage demo data for development and testing</p>
      </div>

      {lastResult && (
        <div className={`rounded-xl border p-4 flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
          lastResult.success
            ? "border-emerald-500/30 bg-emerald-500/10"
            : "border-red-500/30 bg-red-500/10"
        }`}>
          {lastResult.success ? (
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
          )}
          <span className={`text-sm font-medium ${lastResult.success ? "text-emerald-400" : "text-red-400"}`}>
            {lastResult.message}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/20 hover:shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
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
            className="w-full flex items-center justify-center gap-2 text-sm py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
          >
            {seedMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            Run Seed
          </button>
        </div>

        <div className="rounded-xl border border-red-500/20 bg-card p-6 transition-all hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
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
            className="w-full flex items-center justify-center gap-2 text-sm py-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-all"
          >
            {resetMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Reset Data
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Seed Data Integrity Checker</h3>
              <p className="text-xs text-muted-foreground">Validate all {validation?.summary.total ?? 50} expected tables have demo data</p>
            </div>
          </div>
          <button
            onClick={() => runValidation()}
            disabled={validating}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-all disabled:opacity-50"
          >
            {validating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Run Check
          </button>
        </div>

        {validation && (
          <div className="space-y-4">
            <div className={`rounded-xl border p-4 flex items-center gap-3 ${
              validation.overallStatus === "complete"
                ? "border-emerald-500/30 bg-emerald-500/10"
                : validation.overallStatus === "incomplete"
                ? "border-amber-500/30 bg-amber-500/10"
                : "border-red-500/30 bg-red-500/10"
            }`}>
              {validation.overallStatus === "complete" ? (
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
              ) : validation.overallStatus === "incomplete" ? (
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                  <XCircle className="w-4 h-4 text-red-400" />
                </div>
              )}
              <div className="flex-1">
                <span className="text-sm font-medium capitalize">{validation.overallStatus}</span>
                <span className="text-sm text-muted-foreground ml-2">
                  — {validation.summary.passed} passed, {validation.summary.failed} failed, {validation.summary.errors} errors
                </span>
              </div>
            </div>

            {failedResults.length > 0 && (
              <div className="space-y-1">
                {failedResults.map((r) => (
                  <div key={r.table} className="flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="text-sm font-mono flex-1">{r.table}</span>
                    <span className="text-xs text-muted-foreground">{r.description}</span>
                    <span className="text-xs font-mono text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">{r.actual}/{r.expected}</span>
                  </div>
                ))}
              </div>
            )}

            {passedResults.length > 0 && (
              <div>
                <button
                  onClick={() => setShowAllResults(!showAllResults)}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showAllResults ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {showAllResults ? "Hide" : "Show"} {passedResults.length} passing checks
                </button>
                {showAllResults && (
                  <div className="space-y-1 mt-2">
                    {passedResults.map((r) => (
                      <div key={r.table} className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-sm font-mono flex-1">{r.table}</span>
                        <span className="text-xs text-muted-foreground">{r.description}</span>
                        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{r.actual} rows</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
