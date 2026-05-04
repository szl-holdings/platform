import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Shield,
  Activity,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Brain,
  Database,
  Layers,
  RefreshCw,
  ExternalLink,
  Users,
  Zap,
  Server,
  Key,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

// ─── types ────────────────────────────────────────────────────────────────────

interface HFSubsystem {
  reachable?: boolean;
  available?: boolean;
  registered?: boolean;
  configured?: boolean;
  tokenPresent?: boolean;
  tokenValid?: boolean;
  latencyMs?: number;
  toolCount?: number;
  error?: string;
  username?: string;
  backend?: string;
  description: string;
  endpoint?: string;
}

interface HFStatus {
  status: "healthy" | "degraded";
  checkedAt: string;
  totalCheckMs: number;
  subsystems: {
    inferenceApi: HFSubsystem;
    mcpProxy: HFSubsystem;
    connectorAdapter: HFSubsystem;
    tokenValidity: HFSubsystem;
    embeddingBackend: HFSubsystem;
    autoTrainApi: HFSubsystem;
  };
}

interface HFHubStatus {
  tokenPresent: boolean;
  tokenValid: boolean;
  username?: string;
  inferenceReachable: boolean;
  pinnedModels: number;
  pinnedDatasets: number;
  pinnedSpaces: number;
  lastChecked: string;
  status: "healthy" | "degraded" | "auth_error" | "unconfigured";
  message?: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function subsystemOk(s: HFSubsystem): boolean {
  if ("reachable" in s) return !!s.reachable;
  if ("available" in s) return !!s.available;
  if ("tokenValid" in s) return !!s.tokenValid;
  if ("registered" in s) return !!s.registered;
  return false;
}

function SubsystemRow({ name, s }: { name: string; s: HFSubsystem }) {
  const ok = subsystemOk(s);
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-800/60 last:border-0">
      <div className="mt-0.5">
        {ok ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        ) : (
          <AlertCircle className="w-4 h-4 text-red-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-200">{name}</span>
          {s.latencyMs != null && (
            <span className="text-xs text-slate-500">{s.latencyMs}ms</span>
          )}
          {s.toolCount != null && (
            <span className="text-xs text-slate-500">{s.toolCount} tools</span>
          )}
          {s.username && (
            <span className="text-xs text-emerald-400">@{s.username}</span>
          )}
          {s.backend && (
            <span className="text-xs text-blue-400">{s.backend}</span>
          )}
        </div>
        <div className="text-xs text-slate-500 mt-0.5">{s.description}</div>
        {s.error && (
          <div className="text-xs text-red-400 mt-0.5 truncate">{s.error}</div>
        )}
        {s.endpoint && (
          <div className="text-xs text-slate-600 mt-0.5 truncate">{s.endpoint}</div>
        )}
      </div>
    </div>
  );
}

// ─── HF Status Tile ───────────────────────────────────────────────────────────

function HuggingFaceTile() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: hfStatus,
    isLoading: hfLoading,
    refetch: refetchHf,
  } = useQuery({
    queryKey: ["admin-hf-status"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/hf/status");
      if (!res.ok) throw new Error("HF status check failed");
      return res.json() as Promise<HFStatus>;
    },
    refetchInterval: 120_000,
  });

  const {
    data: hubStatus,
    isLoading: hubLoading,
    refetch: refetchHub,
  } = useQuery({
    queryKey: ["admin-hf-hub-status"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/hf/hub/status");
      if (!res.ok) throw new Error("HF hub status check failed");
      return res.json() as Promise<HFHubStatus>;
    },
    refetchInterval: 120_000,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchHf(), refetchHub()]);
    setIsRefreshing(false);
  };

  const overallOk =
    hfStatus?.status === "healthy" && hubStatus?.status === "healthy";

  return (
    <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
            <span className="text-yellow-400 text-sm">🤗</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-100">Powered by Hugging Face</div>
            <div className="text-xs text-slate-500">
              Inference · Hub · Datasets · Spaces · MCP
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {(hfStatus || hubStatus) && (
            <div className="flex items-center gap-1.5">
              {overallOk ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              )}
              <span
                className={`text-xs font-medium ${overallOk ? "text-emerald-400" : "text-amber-400"}`}
              >
                {overallOk ? "All systems healthy" : "Degraded"}
              </span>
            </div>
          )}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded-md transition-colors"
            title="Refresh status"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {(hfLoading || hubLoading) && (
        <div className="flex items-center justify-center py-12 text-slate-500 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
          Checking HuggingFace subsystems…
        </div>
      )}

      {hubStatus && !hubLoading && (
        <div className="px-5 py-4 border-b border-slate-800/60">
          <div className="grid grid-cols-4 gap-3">
            {[
              {
                label: "Token",
                value: hubStatus.tokenValid ? "Valid" : hubStatus.tokenPresent ? "Invalid" : "Missing",
                icon: Key,
                ok: hubStatus.tokenValid,
                detail: hubStatus.username ? `@${hubStatus.username}` : undefined,
              },
              {
                label: "Inference API",
                value: hubStatus.inferenceReachable ? "Online" : "Offline",
                icon: Zap,
                ok: hubStatus.inferenceReachable,
              },
              {
                label: "Pinned Items",
                value: `${hubStatus.pinnedModels + hubStatus.pinnedDatasets + hubStatus.pinnedSpaces}`,
                icon: Brain,
                ok: true,
                detail: `${hubStatus.pinnedModels}M · ${hubStatus.pinnedDatasets}D · ${hubStatus.pinnedSpaces}S`,
              },
              {
                label: "Last Sync",
                value: new Date(hubStatus.lastChecked).toLocaleTimeString(),
                icon: Activity,
                ok: true,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon
                      className={`w-3.5 h-3.5 ${item.ok ? "text-emerald-400" : "text-red-400"}`}
                    />
                    <span className="text-xs text-slate-400">{item.label}</span>
                  </div>
                  <div
                    className={`text-sm font-semibold ${item.ok ? "text-slate-100" : "text-red-400"}`}
                  >
                    {item.value}
                  </div>
                  {item.detail && (
                    <div className="text-xs text-slate-500 mt-0.5">{item.detail}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {hfStatus && !hfLoading && (
        <div className="px-5 py-4">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
            Subsystem Status
          </div>
          <div>
            <SubsystemRow name="Inference API" s={hfStatus.subsystems.inferenceApi} />
            <SubsystemRow name="MCP Proxy" s={hfStatus.subsystems.mcpProxy} />
            <SubsystemRow name="Connector Adapter" s={hfStatus.subsystems.connectorAdapter} />
            <SubsystemRow name="Token Validity" s={hfStatus.subsystems.tokenValidity} />
            <SubsystemRow name="Embedding Backend" s={hfStatus.subsystems.embeddingBackend} />
            <SubsystemRow name="AutoTrain API" s={hfStatus.subsystems.autoTrainApi} />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-slate-600">
              Checked {new Date(hfStatus.checkedAt).toLocaleTimeString()} ·{" "}
              {hfStatus.totalCheckMs}ms
            </span>
            <a
              href="/nuro-forge/hub"
              className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
            >
              Open HF Hub <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminCommandCenter() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-7 h-7 text-violet-400" />
            <h1 className="text-2xl font-semibold text-slate-100">Admin Command Center</h1>
          </div>
          <p className="text-sm text-slate-400">
            Platform-wide health, integrations, and operational telemetry.
          </p>
        </div>

        <div className="space-y-6">
          <HuggingFaceTile />
        </div>
      </div>
    </div>
  );
}
