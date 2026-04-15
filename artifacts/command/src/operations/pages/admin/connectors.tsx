import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wifi, WifiOff, AlertTriangle, Play, RefreshCw, CheckCircle } from "lucide-react";
import { useState } from "react";
import { apiFetch } from "@szl-holdings/shared-ui";

interface ServiceHealth {
  name: string;
  app: string;
  status: string;
  latencyMs?: number;
  mode: string;
  description?: string;
  lastChecked?: string;
}

interface ServicesHealthMatrix {
  services: ServiceHealth[];
  summary: { total: number; liveConfigured: number; mockedDemoMode: number; manualRequired: number };
}

const statusIcon = (status: string) => {
  if (status === "LIVE_CONFIGURED") return <CheckCircle className="w-3.5 h-3.5 text-[#6b8f71]" />;
  if (status === "MOCKED_DEMO_MODE") return <AlertTriangle className="w-3.5 h-3.5 text-[#d4a054]" />;
  return <WifiOff className="w-3.5 h-3.5 text-[#c45a4a]" />;
};

export default function Connectors() {
  const qc = useQueryClient();
  const [testing, setTesting] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<ServicesHealthMatrix>({
    queryKey: ["services-health"],
    queryFn: () => apiFetch("/services/health"),
    refetchInterval: 30000,
  });

  const testMutation = useMutation({
    mutationFn: (name: string) => apiFetch(`/admin/connectors/${name}/test`, { method: "POST" }),
    onSettled: () => { setTesting(null); qc.invalidateQueries({ queryKey: ["services-health"] }); },
  });

  const services = data?.services ?? [];
  const summary = data?.summary ?? { total: 0, liveConfigured: 0, mockedDemoMode: 0, manualRequired: 0 };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-display font-bold flex items-center gap-2"><Wifi className="w-5 h-5 text-primary" />Connectors</h1>
        <p className="text-xs text-muted-foreground mt-1">Integration health matrix and connector management</p>
      </div>

      {error ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
          <AlertTriangle className="w-8 h-8 text-[#d4a054] mx-auto mb-2" /><p>Connector data requires API connection</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Total", value: summary.total, color: "text-foreground" },
              { label: "Live", value: summary.liveConfigured, color: "text-[#6b8f71]" },
              { label: "Sandbox", value: summary.mockedDemoMode, color: "text-[#d4a054]" },
              { label: "Needs Config", value: summary.manualRequired, color: "text-[#c45a4a]" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-border bg-card p-4">
                <div className="text-xs text-muted-foreground mb-1">{label}</div>
                <div className={`text-2xl font-bold font-display ${color}`}>{isLoading ? "—" : value}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              services.map((svc) => (
                <div key={svc.name} className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    {statusIcon(svc.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{svc.name}</span>
                        <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{svc.app}</span>
                      </div>
                      {svc.description && <p className="text-[10px] text-muted-foreground mt-0.5">{svc.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {svc.latencyMs && <span className="text-xs text-muted-foreground">{svc.latencyMs}ms</span>}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      svc.status === "LIVE_CONFIGURED" ? "bg-[#6b8f71]/10 text-[#6b8f71]" :
                      svc.status === "MOCKED_DEMO_MODE" ? "bg-[#d4a054]/10 text-[#d4a054]" :
                      "bg-[#c45a4a]/10 text-[#c45a4a]"
                    }`}>{svc.mode || svc.status.toLowerCase().replace(/_/g, " ")}</span>
                    <button
                      onClick={() => { setTesting(svc.name); testMutation.mutate(svc.name); }}
                      disabled={testing === svc.name}
                      className="p-1.5 rounded hover:bg-muted transition-colors disabled:opacity-50"
                      title="Test connection"
                    >
                      {testing === svc.name ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" /> : <Play className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
              ))
            )}
            {!isLoading && services.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No connectors registered</div>}
          </div>
        </>
      )}
    </div>
  );
}
