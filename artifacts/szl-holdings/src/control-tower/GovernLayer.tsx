
import { useStandardQuery } from "@szl-holdings/api-client-react";
import { Shield, CheckCircle2, XCircle, Circle, Lock, Unlock, Eye } from "lucide-react";

import { cn } from "@/lib/utils";

import { API_BASE, DOMAIN_COLORS } from "./constants";

import { SectionCard, TimeAgo } from "./components";

export function GovernLayer() {
  const { data: complianceData, isLoading: complianceLoading } = useStandardQuery<{ data: Record<string, unknown> }>({
    queryKey: ["ct-compliance"],
    queryFn: () => fetch(`${API_BASE}/control-tower/govern/compliance`).then(r => r.json()),
    refetchInterval: 30000,
  });

  const { data: auditData, isLoading: auditLoading } = useStandardQuery<{ data: Record<string, unknown> }>({
    queryKey: ["ct-audit"],
    queryFn: () => fetch(`${API_BASE}/control-tower/govern/audit?limit=30`).then(r => r.json()),
    refetchInterval: 20000,
  });

  const { data: certsData, isLoading: certsLoading } = useStandardQuery<{ data: Record<string, unknown> }>({
    queryKey: ["ct-certs"],
    queryFn: () => fetch(`${API_BASE}/control-tower/govern/certificates`).then(r => r.json()),
    staleTime: 300000,
  });

  const compliance = complianceData?.data as Record<string, unknown> | undefined;
  const policies = (compliance?.policies as unknown[]) ?? [];
  const auditEntries = ((auditData?.data as Record<string, unknown>)?.entries as unknown[]) ?? [];
  const integrity = (auditData?.data as Record<string, unknown>)?.integrity as Record<string, unknown> | undefined;
  const certs = ((certsData?.data as Record<string, unknown>)?.certificates as unknown[]) ?? [];
  const score = Number(compliance?.overallComplianceScore ?? 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Compliance Score", value: complianceLoading ? "—" : `${score}`, color: score >= 90 ? "text-emerald-400" : score >= 70 ? "text-amber-400" : "text-red-400" },
          { label: "Risk Posture", value: String(compliance?.riskPosture ?? "—"), color: compliance?.riskPosture === "low" ? "text-emerald-400" : compliance?.riskPosture === "medium" ? "text-amber-400" : "text-red-400" },
          { label: "Audit Chain", value: integrity?.valid ? "✓ Valid" : "⚠ Broken", color: integrity?.valid ? "text-emerald-400" : "text-red-400" },
          { label: "Total Audit Entries", value: String(compliance?.totalAuditEntries ?? 0), color: "text-sky-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className={cn("text-base font-bold font-mono", color)}>{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SectionCard title="Policy Compliance" icon={Shield} color="text-emerald-400">
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {complianceLoading ? (
              Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-muted/20 rounded animate-pulse" />)
            ) : (
              policies.map((policy: unknown) => {
                const p = policy as Record<string, unknown>;
                const status = String(p.status ?? "unknown");
                return (
                  <div key={String(p.id)} className="p-2.5 rounded-lg bg-muted/10 border border-border/30">
                    <div className="flex items-center gap-2 mb-1">
                      {status === "compliant" ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      ) : status === "violation" ? (
                        <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                      ) : (
                        <Circle className="w-3 h-3 text-muted-foreground shrink-0" />
                      )}
                      <span className="text-[10px] font-semibold text-foreground truncate">{String(p.name)}</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground line-clamp-2 pl-5">{String(p.description)}</p>
                    <div className="flex items-center gap-2 mt-1 pl-5">
                      <span className={cn("text-[9px] px-1 py-0.5 rounded border font-medium",
                        status === "compliant" ? "text-emerald-400 border-emerald-500/30" :
                        status === "violation" ? "text-red-400 border-red-500/30" :
                        "text-muted-foreground border-border/30"
                      )}>
                        {status}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-mono">{String(p.category)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>

        <SectionCard title="Scope Certificates" icon={Lock} color="text-amber-400">
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {certsLoading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-muted/20 rounded animate-pulse" />)
            ) : (
              certs.map((cert: unknown) => {
                const c = cert as Record<string, unknown>;
                const certificate = c.certificate as Record<string, unknown>;
                const expiresAt = new Date(String(certificate?.expiresAt ?? ""));
                const isExpired = expiresAt < new Date();
                return (
                  <div key={String(c.agentId)} className="p-2.5 rounded-lg bg-muted/10 border border-border/30">
                    <div className="flex items-center gap-2 mb-1">
                      {isExpired ? <Unlock className="w-3 h-3 text-red-400 shrink-0" /> : <Lock className="w-3 h-3 text-emerald-400 shrink-0" />}
                      <span className="text-[10px] font-semibold text-foreground">{String(c.agentName)}</span>
                      <span className={cn("text-[9px] font-mono px-1 py-0.5 rounded border ml-auto", DOMAIN_COLORS[String(c.domain)] ?? "text-muted-foreground")}>
                        {String(c.domain)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-muted-foreground">Risk:</span>
                      <span className={cn("text-[9px] font-mono", certificate?.maxRiskLevel === "critical" ? "text-red-400" : certificate?.maxRiskLevel === "high" ? "text-orange-400" : "text-emerald-400")}>
                        {String(certificate?.maxRiskLevel ?? "—")}
                      </span>
                      <span className={cn("text-[9px] px-1 py-0.5 rounded border ml-auto", isExpired ? "text-red-400 border-red-500/30" : "text-emerald-400 border-emerald-500/30")}>
                        {isExpired ? "expired" : "active"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>

        <SectionCard title="Audit Trail" icon={Eye} color="text-violet-400">
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {auditLoading ? (
              Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-7 bg-muted/20 rounded animate-pulse" />)
            ) : auditEntries.length === 0 ? (
              <div className="text-center py-6">
                <Eye className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No audit entries yet</p>
              </div>
            ) : (
              auditEntries.map((entry: unknown, i) => {
                const e = entry as Record<string, unknown>;
                const execResult = String(e.executionResult ?? "unknown");
                return (
                  <div key={String(e.entryId ?? i)} className="flex items-center gap-2 text-[10px] py-1 border-b border-border/20 last:border-0">
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0",
                      execResult === "success" ? "bg-emerald-500" :
                      execResult === "failure" ? "bg-red-500" :
                      execResult === "skipped" ? "bg-muted-foreground" : "bg-amber-500"
                    )} />
                    <span className="font-mono text-muted-foreground truncate flex-1">{String(e.agentId ?? "—").slice(0, 20)}</span>
                    <span className="text-foreground truncate max-w-24">{String(e.toolName ?? "—")}</span>
                    <TimeAgo ts={e.timestamp as string} />
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
