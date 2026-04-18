import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, AlertTriangle, Server, Shield, RefreshCw, ChevronDown, Activity, Lock, Eye, CheckCircle } from "lucide-react";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { cn } from "@szl-holdings/shared-ui/utils";

const API = import.meta.env.VITE_API_URL ?? "/api";

const DS = {
  surface: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.07)",
  text: { primary: "rgba(255,255,255,0.9)", secondary: "rgba(255,255,255,0.55)", muted: "rgba(255,255,255,0.28)" },
};

const IDENTITIES = [
  { id: "j.smith@corp.com", label: "j.smith — Finance Analyst" },
  { id: "admin.svc@corp.com", label: "admin.svc — Service Account" },
  { id: "devops.svc@corp.com", label: "devops.svc — CI/CD Account" },
];

const ACCESS_PATH_COLORS: Record<string, string> = {
  "direct-permission": "#ef4444",
  "group-membership": "#f97316",
  "transitive-trust": "#eab308",
};

const FRESHNESS_COLORS: Record<string, string> = {
  current: "#10b981",
  "aging": "#f59e0b",
  "stale-90d": "#ef4444",
};

export default function IdentityBlastRadius() {
  const [selectedIdentity, setSelectedIdentity] = useState("j.smith@corp.com");

  // Live backend route — /firestorm/* path is an active api-server endpoint.
  // Follow-up task #1715 will rename it to /aegis/* once the server migration lands.
  const { data, isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["identity-blast-radius", selectedIdentity],
    queryFn: async () => {
      const r = await fetch(`${API}/firestorm/cognitive/identity-blast-radius?identityId=${encodeURIComponent(selectedIdentity)}`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed to load identity blast radius");
      return r.json();
    },
    staleTime: 30_000,
    retry: 1,
  });

  const result = data?.data ?? {};
  const identity = result.identity ?? {};
  const blastRadius = result.blastRadius ?? {};
  const permissionGraph = result.permissionGraph ?? {};
  const reachableAssets: Array<{
    assetId: number; name: string; type: string; accessPath: string;
    permission: string; riskScore: number; evidence: string[]; freshness: string;
    provenance: { source: string; traceRef?: string; traceId: string };
  }> = result.reachableAssets ?? [];
  const evidenceCitations: Array<{
    id: string; type: string; description: string; collectedAt: string; source: string;
  }> = result.evidenceCitations ?? [];
  const provenance = result.provenance ?? {};

  const riskColor = (identity.riskScore ?? 0) > 90 ? "text-red-400" : (identity.riskScore ?? 0) > 70 ? "text-orange-400" : "text-yellow-400";

  return (
    <div className="p-6 space-y-6" style={{ maxWidth: 1280, margin: "0 auto" }}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: DS.text.primary }}>
            <Users className="w-5 h-5 text-purple-400"/>
            Identity Blast Radius
          </h1>
          <p className="text-sm mt-1" style={{ color: DS.text.secondary }}>
            Reachable assets, permissions, and lateral movement paths from any identity with evidence citations.
          </p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors" style={{ background: "rgba(139,92,246,0.08)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.2)" }}>
          <RefreshCw className="w-3 h-3"/>
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: DS.surface, border: `1px solid ${DS.border}` }}>
        <Users className="w-4 h-4 text-purple-400 shrink-0"/>
        <span className="text-xs" style={{ color: DS.text.muted }}>Select Identity:</span>
        <div className="relative">
          <select
            value={selectedIdentity}
            onChange={e => setSelectedIdentity(e.target.value)}
            className="text-xs font-medium pl-2 pr-6 py-1.5 rounded-lg appearance-none cursor-pointer"
            style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.25)" }}
          >
            {IDENTITIES.map(id => <option key={id.id} value={id.id}>{id.label}</option>)}
          </select>
          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: "#8b5cf6" }}/>
        </div>
      </div>

      {!isLoading && identity.displayName && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl p-5 space-y-3" style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.15)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}>
                <Users className="w-5 h-5 text-purple-400"/>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: DS.text.primary }}>{identity.displayName}</p>
                <p className="text-[11px]" style={{ color: DS.text.muted }}>{identity.role} · {identity.id}</p>
              </div>
              <div className="ml-auto text-right">
                <p className={cn("text-2xl font-bold", riskColor)}>{identity.riskScore}</p>
                <p className="text-[10px]" style={{ color: DS.text.muted }}>Risk Score</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex justify-between"><span style={{ color: DS.text.muted }}>MFA Enabled:</span><span style={{ color: identity.mfaEnabled ? "#10b981" : "#ef4444" }}>{identity.mfaEnabled ? "Yes" : "No"}</span></div>
              <div className="flex justify-between"><span style={{ color: DS.text.muted }}>Last Login:</span><span style={{ color: DS.text.secondary }}>{identity.lastLogin}</span></div>
              <div className="flex justify-between"><span style={{ color: DS.text.muted }}>Anomalies:</span><span className="text-orange-400">{identity.anomalyCount} detected</span></div>
              <div className="flex justify-between"><span style={{ color: DS.text.muted }}>Groups:</span><span style={{ color: DS.text.secondary }}>{identity.groups?.length ?? 0} groups</span></div>
            </div>
          </div>

          <div className="rounded-xl p-5 space-y-3" style={{ background: DS.surface, border: `1px solid ${DS.border}` }}>
            <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: DS.text.muted }}>Blast Radius Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Reachable Assets", value: blastRadius.totalReachableAssets, color: "text-blue-400" },
                { label: "Crown Jewels", value: blastRadius.crownJewelsReachable, color: "text-red-400" },
                { label: "Lateral Paths", value: blastRadius.lateralMovementPaths, color: "text-orange-400" },
                { label: "High-Risk Assets", value: blastRadius.highRiskAssets, color: "text-yellow-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${DS.border}` }}>
                  <p className="text-[10px]" style={{ color: DS.text.muted }}>{label}</p>
                  <p className={cn("text-xl font-bold mt-0.5", color)}>{value ?? "—"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-purple-500/40 border-t-purple-400 rounded-full animate-spin"/>
        </div>
      )}

      {!isLoading && (
        <>
          <div className="rounded-xl p-4 space-y-3" style={{ background: DS.surface, border: `1px solid ${DS.border}` }}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: DS.text.muted }}>Reachable Assets</h3>
              <div className="flex items-center gap-3 text-[10px]">
                {Object.entries(ACCESS_PATH_COLORS).map(([path, color]) => (
                  <span key={path} className="flex items-center gap-1" style={{ color: DS.text.muted }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: color }}/>
                    {path.replace(/-/g, " ")}
                  </span>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                    {["Asset", "Type", "Access Path", "Permission", "Risk", "Freshness", "Evidence"].map(h => (
                      <th key={h} className="pb-2 text-left font-medium pr-4" style={{ color: DS.text.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reachableAssets.map((asset, i) => {
                    const pathColor = ACCESS_PATH_COLORS[asset.accessPath] ?? "#94a3b8";
                    const freshnessColor = FRESHNESS_COLORS[asset.freshness] ?? "#94a3b8";
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${DS.border}` }} className="hover:bg-white/[0.02]">
                        <td className="py-2 pr-4 font-medium" style={{ color: DS.text.primary }}>{asset.name}</td>
                        <td className="py-2 pr-4" style={{ color: DS.text.muted }}>{asset.type}</td>
                        <td className="py-2 pr-4">
                          <span className="flex items-center gap-1" style={{ color: pathColor }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: pathColor }}/>
                            {asset.accessPath.replace(/-/g, " ")}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          <Badge className={cn("text-[9px]", asset.permission.includes("write") ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20")}>
                            {asset.permission}
                          </Badge>
                        </td>
                        <td className="py-2 pr-4">
                          <span className={cn("font-mono", (asset.riskScore as number) > 75 ? "text-red-400" : (asset.riskScore as number) > 50 ? "text-orange-400" : "text-yellow-400")}>
                            {asset.riskScore}
                          </span>
                        </td>
                        <td className="py-2 pr-4" style={{ color: freshnessColor }}>{asset.freshness}</td>
                        <td className="py-2">
                          <div className="flex flex-wrap gap-1">
                            {asset.evidence?.slice(0, 2).map((ev, j) => (
                              <span key={j} className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(59,130,246,0.08)", color: "#3b82f6" }}>{ev}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl p-4 space-y-3" style={{ background: DS.surface, border: `1px solid ${DS.border}` }}>
              <h3 className="text-xs font-semibold uppercase tracking-widest flex items-center gap-2" style={{ color: DS.text.muted }}>
                <Lock className="w-3.5 h-3.5"/> Group Permissions
              </h3>
              <div className="space-y-2">
                {(permissionGraph.directPermissions ?? []).map((g: { group: string; permissions: string[]; assignedAt: string; reviewer: string }, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${DS.border}` }}>
                    <Shield className="w-3.5 h-3.5 text-purple-400 shrink-0"/>
                    <span className="text-[11px] flex-1 font-medium" style={{ color: DS.text.primary }}>{g.group}</span>
                    <div className="flex gap-1">
                      {g.permissions.map((p: string) => (
                        <Badge key={p} className={cn("text-[8px]", p === "write" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20")}>{p}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-4 space-y-3" style={{ background: DS.surface, border: `1px solid ${DS.border}` }}>
              <h3 className="text-xs font-semibold uppercase tracking-widest flex items-center gap-2" style={{ color: DS.text.muted }}>
                <Eye className="w-3.5 h-3.5"/> Evidence Citations
              </h3>
              <div className="space-y-2">
                {evidenceCitations.map((ev) => (
                  <div key={ev.id} className="p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${DS.border}` }}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-medium" style={{ color: DS.text.primary }}>{ev.id}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(16,185,129,0.08)", color: "#10b981" }}>{ev.source}</span>
                    </div>
                    <p className="text-[10px]" style={{ color: DS.text.secondary }}>{ev.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex items-center gap-6 text-[10px] pt-2" style={{ color: DS.text.muted }}>
        <span><Activity className="w-3 h-3 inline mr-1"/>Verified by: {provenance.verifiedBy ?? "Cognitive Runtime"}</span>
        <span>Runtime: {provenance.cognitiveRuntime ?? "v2.1.0"}</span>
        {dataUpdatedAt > 0 && <span>Updated: {new Date(dataUpdatedAt).toLocaleTimeString()}</span>}
      </div>
    </div>
  );
}
