import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Button } from "@szl-holdings/shared-ui/ui/button";
import { Progress } from "@szl-holdings/shared-ui/ui/progress";
import {
  Shield, Key, Globe, Settings, Package, Search,
  CheckCircle, AlertTriangle, XCircle, RefreshCw,
  ChevronDown, ChevronRight, Zap, User, Clock, Calendar
} from "lucide-react";
import { type ElementType, useState } from "react";
import { toast } from "@szl-holdings/shared-ui/ui/sonner";

interface HardeningControl {
  id: number;
  controlId: string;
  name: string;
  description: string | null;
  status: "implemented" | "partial" | "not_implemented";
  owner: string | null;
  lastReviewedAt: string | null;
  priority: "critical" | "high" | "medium" | "low";
  linkedAssets: string[] | null;
  recommendedAction: string | null;
  dueDate: string | null;
  auditTrail: { action: string; user: string; at: string }[] | null;
  category: string;
}

interface CategoryMeta {
  id: string;
  label: string;
  icon: ElementType;
  color: string;
}

const CATEGORY_META: CategoryMeta[] = [
  { id: "mfa_credential", label: "MFA & Credential Hardening", icon: Key, color: "text-purple-400" },
  { id: "application_hardening", label: "Application Hardening", icon: Globe, color: "text-blue-400" },
  { id: "config_hardening", label: "Configuration Hardening", icon: Settings, color: "text-amber-400" },
  { id: "dependency_supply_chain", label: "Dependency & Supply Chain", icon: Package, color: "text-teal-400" },
  { id: "vulnerability_assessment", label: "Vulnerability Assessment Coverage", icon: Search, color: "text-orange-400" },
];

const statusConfig: Record<string, { label: string; icon: ElementType; color: string; bg: string }> = {
  implemented: { label: "Implemented", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  partial: { label: "Partial", icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  not_implemented: { label: "Not Implemented", icon: XCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
};

const priorityColors: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

function ControlCard({ control, categoryColor }: { control: HardeningControl; categoryColor: string }) {
  const [expanded, setExpanded] = useState(false);
  const qc = useQueryClient();
  const statusInfo = statusConfig[control.status] ?? statusConfig.not_implemented;
  const StatusIcon = statusInfo.icon;
  const linkedAssets = Array.isArray(control.linkedAssets) ? control.linkedAssets : [];
  const auditTrail = Array.isArray(control.auditTrail) ? control.auditTrail : [];

  const workflowMutation = useMutation({
    mutationFn: (actionType: string) =>
      api.workflowActions.create({ entityType: "asset", entityId: control.id, actionType, assignedTo: control.owner, notes: `Control: ${control.controlId} — ${control.name}` }),
    onSuccess: () => toast.success("Workflow action triggered via Alloy"),
    onError: () => toast.error("Failed to trigger workflow"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { status: string; notes?: string }) =>
      api.hardeningControls.update(control.id, data),
    onSuccess: () => {
      toast.success("Control status updated");
      qc.invalidateQueries({ queryKey: ["hardening-controls"] });
      qc.invalidateQueries({ queryKey: ["hardening-summary"] });
    },
    onError: () => toast.error("Failed to update control"),
  });

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${control.status === "not_implemented" && control.priority === "critical" ? "border-red-500/30 bg-red-500/3" : "border-zinc-800 bg-zinc-900/20"}`}>
      <div
        className="flex items-start gap-3 p-4 cursor-pointer hover:bg-zinc-800/20 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <StatusIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${statusInfo.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono text-zinc-500">{control.controlId}</span>
                <h4 className="text-sm font-semibold text-white">{control.name}</h4>
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {control.owner && (
                  <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <User className="w-3 h-3" />{control.owner}
                  </span>
                )}
                {control.lastReviewedAt && (
                  <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />Reviewed {new Date(control.lastReviewedAt).toLocaleDateString()}
                  </span>
                )}
                {linkedAssets.length > 0 && (
                  <span className="text-[10px] text-zinc-600">{linkedAssets.length} asset{linkedAssets.length > 1 ? "s" : ""}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="outline" className={`text-[10px] ${priorityColors[control.priority]}`}>
                {control.priority}
              </Badge>
              <Badge variant="outline" className={`text-[10px] ${statusInfo.bg} ${statusInfo.color} border-current`}>
                {statusInfo.label}
              </Badge>
              {expanded ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />}
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-zinc-800/60 px-4 pb-4 pt-3 space-y-3">
          {control.description && <p className="text-sm text-zinc-300">{control.description}</p>}

          {control.recommendedAction && (
            <div className="bg-orange-500/5 border border-orange-500/15 rounded-lg px-3 py-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-orange-400/80 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Recommended Action
              </div>
              <p className="text-sm text-orange-200/90">{control.recommendedAction}</p>
              {control.dueDate && (
                <p className="text-[10px] text-orange-400/60 mt-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />Due: {new Date(control.dueDate).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {linkedAssets.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Linked Assets</div>
              <div className="flex flex-wrap gap-1.5">
                {linkedAssets.map(asset => (
                  <span key={asset} className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">{asset}</span>
                ))}
              </div>
            </div>
          )}

          {auditTrail.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Audit Trail</div>
              <div className="space-y-1">
                {auditTrail.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <div className="w-1 h-1 rounded-full bg-zinc-600 flex-shrink-0" />
                    <span className="text-zinc-400">{entry.action}</span>
                    <span className="text-zinc-600 ml-auto">{entry.user} · {new Date(entry.at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {(control.status === "not_implemented" || control.status === "partial") && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-[11px] border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                onClick={() => workflowMutation.mutate("assign_owner")}
                disabled={workflowMutation.isPending}
              >
                <Zap className="w-3 h-3 mr-1" />
                Route via Alloy
              </Button>
            )}
            {control.priority === "critical" && control.status !== "implemented" && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-[11px] border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={() => workflowMutation.mutate("escalate")}
                disabled={workflowMutation.isPending}
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                Escalate
              </Button>
            )}
            {control.status !== "implemented" && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-[11px] border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                onClick={() => updateMutation.mutate({ status: "implemented", notes: "Marked implemented by operator" })}
                disabled={updateMutation.isPending}
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Mark Implemented
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function categoryScore(controls: HardeningControl[]): number {
  if (controls.length === 0) return 0;
  const weights = { implemented: 1, partial: 0.5, not_implemented: 0 };
  return Math.round((controls.reduce((sum, c) => sum + (weights[c.status] ?? 0), 0) / controls.length) * 100);
}

export default function HardeningControlsPage() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>("mfa_credential");

  const { data: controls = [], isLoading, refetch } = useQuery({
    queryKey: ["hardening-controls"],
    queryFn: () => api.hardeningControls.list(),
    staleTime: 30_000,
  });

  const { data: summary } = useQuery({
    queryKey: ["hardening-summary"],
    queryFn: () => api.hardeningControls.summary(),
    staleTime: 30_000,
  });

  const totalControls = summary?.total ?? controls.length;
  const implemented = summary?.implemented ?? controls.filter((c: HardeningControl) => c.status === "implemented").length;
  const partial = summary?.partial ?? controls.filter((c: HardeningControl) => c.status === "partial").length;
  const notImplemented = summary?.notImplemented ?? controls.filter((c: HardeningControl) => c.status === "not_implemented").length;
  const criticalGaps = summary?.criticalGaps ?? controls.filter((c: HardeningControl) => c.status === "not_implemented" && c.priority === "critical").length;
  const overallScore = summary?.overallScore ?? (totalControls > 0 ? Math.round(((implemented + partial * 0.5) / totalControls) * 100) : 0);

  const byCategory = CATEGORY_META.map(meta => ({
    ...meta,
    controls: controls.filter((c: HardeningControl) => c.category === meta.id),
  }));

  return (
    <div className="flex flex-col gap-6 p-6 min-h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-400" />
            Hardening & Control Mapping
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">MFA/credential hardening, application hardening, config hardening, dependency mapping, and vulnerability assessment coverage</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 flex-shrink-0"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="col-span-2 md:col-span-1 bg-zinc-900/50 border-zinc-700">
          <CardContent className="p-4 text-center">
            <div className={`text-4xl font-bold ${overallScore >= 80 ? "text-emerald-400" : overallScore >= 60 ? "text-amber-400" : "text-red-400"}`}>{overallScore}%</div>
            <div className="text-[10px] text-zinc-500 mt-1">Overall Score</div>
            <Progress value={overallScore} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="text-xs text-emerald-400 font-medium mb-1">Implemented</div>
            <div className="text-3xl font-bold text-emerald-400">{implemented}</div>
            <div className="text-[10px] text-zinc-500 mt-1">of {totalControls} controls</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="text-xs text-amber-400 font-medium mb-1">Partial</div>
            <div className="text-3xl font-bold text-amber-400">{partial}</div>
            <div className="text-[10px] text-zinc-500 mt-1">In progress</div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="text-xs text-red-400 font-medium mb-1">Not Implemented</div>
            <div className="text-3xl font-bold text-red-400">{notImplemented}</div>
            <div className="text-[10px] text-zinc-500 mt-1">Gaps to close</div>
          </CardContent>
        </Card>
        <Card className={`${criticalGaps > 0 ? "bg-red-500/10 border-red-500/30" : "bg-zinc-900/50 border-zinc-700"}`}>
          <CardContent className="p-4">
            <div className={`text-xs font-medium mb-1 ${criticalGaps > 0 ? "text-red-400 animate-pulse" : "text-zinc-400"}`}>Critical Gaps</div>
            <div className={`text-3xl font-bold ${criticalGaps > 0 ? "text-red-400" : "text-zinc-500"}`}>{criticalGaps}</div>
            <div className="text-[10px] text-zinc-500 mt-1">Immediate action</div>
          </CardContent>
        </Card>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12 text-zinc-500 text-sm">
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          Loading controls from database...
        </div>
      )}

      <div className="space-y-4">
        {byCategory.map((category) => {
          const score = categoryScore(category.controls);
          const isExpanded = expandedCategory === category.id;
          const Icon = category.icon;
          const gapCount = category.controls.filter((c: HardeningControl) => c.status === "not_implemented").length;
          const criticalGapCount = category.controls.filter((c: HardeningControl) => c.status === "not_implemented" && c.priority === "critical").length;

          return (
            <div key={category.id} className="border border-zinc-800 rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center gap-3 px-5 py-4 bg-zinc-900/40 hover:bg-zinc-800/40 transition-colors"
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${category.color}`} />
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-white">{category.label}</span>
                    {criticalGapCount > 0 && (
                      <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20">
                        {criticalGapCount} critical gap{criticalGapCount > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1.5">
                    <div className="flex-1 max-w-[200px]">
                      <Progress value={score} className="h-1.5" />
                    </div>
                    <span className={`text-xs font-medium ${score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400"}`}>{score}%</span>
                    <span className="text-xs text-zinc-600">{category.controls.length} controls</span>
                    {gapCount > 0 && <span className="text-xs text-zinc-500">{gapCount} gap{gapCount > 1 ? "s" : ""}</span>}
                  </div>
                </div>
                {isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-500 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-zinc-500 flex-shrink-0" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-3 space-y-2 border-t border-zinc-800/60">
                  {category.controls.length === 0 ? (
                    <div className="text-sm text-zinc-600 text-center py-4">No controls in this category</div>
                  ) : (
                    category.controls.map((control: HardeningControl) => (
                      <ControlCard key={control.id} control={control} categoryColor={category.color} />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
