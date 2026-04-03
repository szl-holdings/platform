import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Button } from "@szl-holdings/shared-ui/ui/button";
import { Input } from "@szl-holdings/shared-ui/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@szl-holdings/shared-ui/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@szl-holdings/shared-ui/ui/dialog";
import { Label } from "@szl-holdings/shared-ui/ui/label";
import {
  Server, Monitor, Network, Cloud, Globe, Database, Cpu, User, Box, Layers,
  AlertTriangle, Shield, Search, Filter, Plus, RefreshCw, ArrowUpRight,
  CheckCircle, XCircle, Clock, Flame, Zap
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const assetTypeIcons: Record<string, any> = {
  server: Server,
  endpoint: Monitor,
  network_device: Network,
  cloud_resource: Cloud,
  application: Globe,
  database: Database,
  api: Cpu,
  iam_identity: User,
  container: Box,
  other: Layers,
};

const exposureColors: Record<string, string> = {
  public: "bg-red-500/15 text-red-400 border-red-500/30",
  internal: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  restricted: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  critical: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

const environmentColors: Record<string, string> = {
  production: "bg-red-500/10 text-red-400",
  staging: "bg-amber-500/10 text-amber-400",
  development: "bg-emerald-500/10 text-emerald-400",
  dmz: "bg-orange-500/10 text-orange-400",
  internal: "bg-blue-500/10 text-blue-400",
};

function getRiskColor(score: number): string {
  if (score >= 8) return "text-red-400";
  if (score >= 6) return "text-orange-400";
  if (score >= 4) return "text-amber-400";
  return "text-emerald-400";
}

function getRiskBg(score: number): string {
  if (score >= 8) return "bg-red-500/10 border-red-500/20";
  if (score >= 6) return "bg-orange-500/10 border-orange-500/20";
  if (score >= 4) return "bg-amber-500/10 border-amber-500/20";
  return "bg-emerald-500/10 border-emerald-500/20";
}


function formatTimeSince(isoDate: string | null | undefined): string {
  if (!isoDate) return "Never";
  const diff = Date.now() - new Date(isoDate).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return `${Math.floor(diff / 60000)}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AssetInventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [envFilter, setEnvFilter] = useState("all");
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  const { data: rawAssets, isLoading } = useQuery({
    queryKey: ["firestorm-assets"],
    queryFn: () => api.assets.list(),
  });

  const assets: any[] = (rawAssets && Array.isArray(rawAssets)) ? rawAssets : [];

  const triggerWorkflow = useMutation({
    mutationFn: ({ entityId, actionType, assignedTo }: any) =>
      api.workflowActions.create({ entityType: "asset", entityId, actionType, assignedTo }),
    onSuccess: () => {
      toast.success("Workflow action triggered via Alloy engine");
      queryClient.invalidateQueries({ queryKey: ["firestorm-assets"] });
    },
    onError: () => toast.error("Failed to trigger workflow"),
  });

  const owners = Array.from(new Set(assets.map((a: any) => a.owner)));

  const filtered = assets.filter((a: any) => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.owner.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "all" && a.assetType !== typeFilter) return false;
    if (ownerFilter !== "all" && a.owner !== ownerFilter) return false;
    if (envFilter !== "all" && a.environment !== envFilter) return false;
    if (severityFilter === "critical" && parseFloat(a.riskScore) < 8) return false;
    if (severityFilter === "high" && (parseFloat(a.riskScore) < 6 || parseFloat(a.riskScore) >= 8)) return false;
    if (severityFilter === "medium" && (parseFloat(a.riskScore) < 4 || parseFloat(a.riskScore) >= 6)) return false;
    if (severityFilter === "low" && parseFloat(a.riskScore) >= 4) return false;
    return true;
  });

  const criticalCount = assets.filter((a: any) => parseFloat(a.riskScore) >= 8).length;
  const highCount = assets.filter((a: any) => parseFloat(a.riskScore) >= 6 && parseFloat(a.riskScore) < 8).length;
  const totalCriticalFindings = assets.reduce((s: number, a: any) => s + (a.criticalFindings || 0), 0);
  const totalHighFindings = assets.reduce((s: number, a: any) => s + (a.highFindings || 0), 0);

  return (
    <div className="flex flex-col gap-6 p-6 min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-400" />
            Asset Inventory
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">All managed assets with exposure level, risk score, and finding counts</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 gap-1.5" onClick={() => queryClient.invalidateQueries({ queryKey: ["firestorm-assets"] })}>
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="text-xs text-red-400 font-medium mb-1">Critical Risk Assets</div>
            <div className="text-3xl font-bold text-red-400">{criticalCount}</div>
            <div className="text-[10px] text-zinc-500 mt-1">Risk Score ≥ 8.0</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="text-xs text-orange-400 font-medium mb-1">High Risk Assets</div>
            <div className="text-3xl font-bold text-orange-400">{highCount}</div>
            <div className="text-[10px] text-zinc-500 mt-1">Risk Score 6.0–7.9</div>
          </CardContent>
        </Card>
        <Card className="bg-rose-500/5 border-rose-500/20">
          <CardContent className="p-4">
            <div className="text-xs text-rose-400 font-medium mb-1">Critical Findings</div>
            <div className="text-3xl font-bold text-rose-400">{totalCriticalFindings}</div>
            <div className="text-[10px] text-zinc-500 mt-1">Across all assets</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="text-xs text-amber-400 font-medium mb-1">High Findings</div>
            <div className="text-3xl font-bold text-amber-400">{totalHighFindings}</div>
            <div className="text-[10px] text-zinc-500 mt-1">Requires remediation</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets or owners..."
            className="pl-9 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 text-sm h-8"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 h-8 bg-zinc-900 border-zinc-700 text-zinc-300 text-sm">
            <SelectValue placeholder="Asset Type" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="server">Server</SelectItem>
            <SelectItem value="endpoint">Endpoint</SelectItem>
            <SelectItem value="network_device">Network Device</SelectItem>
            <SelectItem value="cloud_resource">Cloud Resource</SelectItem>
            <SelectItem value="application">Application</SelectItem>
            <SelectItem value="database">Database</SelectItem>
            <SelectItem value="api">API</SelectItem>
            <SelectItem value="iam_identity">IAM Identity</SelectItem>
            <SelectItem value="container">Container</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-36 h-8 bg-zinc-900 border-zinc-700 text-zinc-300 text-sm">
            <SelectValue placeholder="Risk Severity" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical (≥8)</SelectItem>
            <SelectItem value="high">High (6–8)</SelectItem>
            <SelectItem value="medium">Medium (4–6)</SelectItem>
            <SelectItem value="low">Low (&lt;4)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={envFilter} onValueChange={setEnvFilter}>
          <SelectTrigger className="w-36 h-8 bg-zinc-900 border-zinc-700 text-zinc-300 text-sm">
            <SelectValue placeholder="Environment" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            <SelectItem value="all">All Environments</SelectItem>
            <SelectItem value="production">Production</SelectItem>
            <SelectItem value="staging">Staging</SelectItem>
            <SelectItem value="development">Development</SelectItem>
            <SelectItem value="dmz">DMZ</SelectItem>
            <SelectItem value="internal">Internal</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
          <SelectTrigger className="w-40 h-8 bg-zinc-900 border-zinc-700 text-zinc-300 text-sm">
            <SelectValue placeholder="Owner" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            <SelectItem value="all">All Owners</SelectItem>
            {owners.map((o: string) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-xs text-zinc-500 ml-auto">
          <Filter className="w-3 h-3" />
          {filtered.length} / {assets.length} assets
        </div>
      </div>

      <div className="border border-zinc-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr,1fr,1fr,1fr,1fr,1fr,auto] gap-0 border-b border-zinc-800 bg-zinc-900/50">
          {["Asset", "Type", "Owner", "Environment", "Exposure", "Risk Score", "Actions"].map((h) => (
            <div key={h} className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{h}</div>
          ))}
        </div>
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-zinc-500 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            Loading asset inventory…
          </div>
        )}
        {filtered.length === 0 && !isLoading && (
          <div className="flex items-center justify-center py-16 text-zinc-500 text-sm">
            No assets match the current filters.
          </div>
        )}
        {filtered.map((asset: any) => {
          const Icon = assetTypeIcons[asset.assetType] || Layers;
          const riskNum = parseFloat(asset.riskScore);
          return (
            <div
              key={asset.id}
              className="grid grid-cols-[2fr,1fr,1fr,1fr,1fr,1fr,auto] gap-0 border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors group"
            >
              <div className="px-4 py-3 flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${getRiskBg(riskNum)}`}>
                  <Icon className={`w-3.5 h-3.5 ${getRiskColor(riskNum)}`} />
                </div>
                <div>
                  <div className="text-sm font-medium text-white font-mono">{asset.name}</div>
                  <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                    {asset.criticalFindings > 0 && <span className="text-red-400 font-medium">{asset.criticalFindings} critical</span>}
                    {asset.highFindings > 0 && <span className="text-orange-400">{asset.highFindings} high</span>}
                    {asset.criticalFindings === 0 && asset.highFindings === 0 && <span className="text-emerald-400">Clean</span>}
                    <span className="text-zinc-600">· Scanned {formatTimeSince(asset.lastScannedAt)}</span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 flex items-center">
                <span className="text-xs text-zinc-400 capitalize">{asset.assetType.replace(/_/g, " ")}</span>
              </div>
              <div className="px-4 py-3 flex items-center">
                <span className="text-xs text-zinc-300">{asset.owner}</span>
              </div>
              <div className="px-4 py-3 flex items-center">
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${environmentColors[asset.environment] || "text-zinc-400"}`}>
                  {asset.environment}
                </span>
              </div>
              <div className="px-4 py-3 flex items-center">
                <Badge variant="outline" className={`text-[10px] ${exposureColors[asset.exposureLevel] || ""}`}>
                  {asset.exposureLevel}
                </Badge>
              </div>
              <div className="px-4 py-3 flex items-center">
                <div className="flex items-center gap-1.5">
                  <span className={`text-lg font-bold font-mono ${getRiskColor(riskNum)}`}>
                    {riskNum.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-zinc-600">/10</span>
                </div>
              </div>
              <div className="px-4 py-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-[10px] border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                  onClick={() => triggerWorkflow.mutate({ entityId: asset.id, actionType: "assign_owner", assignedTo: asset.owner })}
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Assign
                </Button>
                {parseFloat(asset.riskScore) >= 8 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-[10px] border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={() => triggerWorkflow.mutate({ entityId: asset.id, actionType: "escalate" })}
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Escalate
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
