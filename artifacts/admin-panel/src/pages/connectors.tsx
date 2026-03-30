import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Plug, CheckCircle2, AlertTriangle, XCircle, RefreshCw, ToggleLeft, ToggleRight, TestTube } from "lucide-react";
import { useState } from "react";

const STATUS_COLORS = {
  LIVE_CONFIGURED: "text-emerald-400 bg-emerald-500/10",
  MOCKED_DEMO_MODE: "text-amber-400 bg-amber-500/10",
  MANUAL_REQUIRED: "text-red-400 bg-red-500/10",
};

const STATUS_ICONS = {
  LIVE_CONFIGURED: <CheckCircle2 className="w-3.5 h-3.5" />,
  MOCKED_DEMO_MODE: <AlertTriangle className="w-3.5 h-3.5" />,
  MANUAL_REQUIRED: <XCircle className="w-3.5 h-3.5" />,
};

export default function ConnectorsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-connectors"], queryFn: api.getConnectors });
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  const enableMut = useMutation({
    mutationFn: ({ name, enabled }: { name: string; enabled: boolean }) => api.setConnectorEnabled(name, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-connectors"] }),
  });

  async function handleTest(name: string) {
    setTestingId(name);
    try {
      const result = await api.testConnector(name);
      setTestResults(prev => ({ ...prev, [name]: { success: result.success, message: result.message } }));
    } catch {
      setTestResults(prev => ({ ...prev, [name]: { success: false, message: "Test failed" } }));
    } finally {
      setTestingId(null);
    }
  }

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Connectors</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage integration connectors and their health</p>
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Live", value: summary.liveConfigured, color: "emerald" },
            { label: "Demo Mode", value: summary.mockedDemoMode, color: "amber" },
            { label: "Needs Config", value: summary.manualRequired, color: "red" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-2xl font-bold">{s.value}</p>
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
        <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
          {data?.connectors.map((c) => (
            <div key={c.name} className="flex items-center gap-4 px-5 py-3.5">
              <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                <Plug className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1 font-medium ${STATUS_COLORS[c.status as keyof typeof STATUS_COLORS] || "bg-muted text-muted-foreground"}`}>
                    {STATUS_ICONS[c.status as keyof typeof STATUS_ICONS]}
                    {c.status.replace(/_/g, " ").toLowerCase()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{c.description}</p>
                {testResults[c.name] && (
                  <p className={`text-xs mt-1 ${testResults[c.name].success ? "text-emerald-400" : "text-red-400"}`}>
                    {testResults[c.name].message}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleTest(c.name)}
                  disabled={testingId === c.name}
                  className="text-xs px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {testingId === c.name ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <TestTube className="w-3.5 h-3.5" />
                  )}
                  Test
                </button>
                <button
                  onClick={() => enableMut.mutate({ name: c.name, enabled: !c.enabled })}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {c.enabled ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
