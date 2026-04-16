import { useQuery } from "@tanstack/react-query";
import { Loader2, CheckCircle2 } from "lucide-react";
import type { NextActions } from "./types";
import { apiFetch } from "./api";
import { PriorityBadge } from "./components";

export function NextActionsPanel({ scenarioId }: { scenarioId?: number }) {
  const { data, isLoading } = useQuery<NextActions>({
    queryKey: ["ownership-next-actions"],
    queryFn: () => apiFetch("/ownership/next-actions"),
    enabled: !!scenarioId,
  });

  if (isLoading) return <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 text-muted-foreground animate-spin" /></div>;
  if (!data) return null;

  const priorityOrder = ["critical", "high", "medium", "low"];

  const allActions = [
    ...data.unconfirmedCitizenships.map(c => ({
      priority: "critical",
      title: `Confirm citizenship — ${c.personName}`,
      description: "U.S. citizenship documentation required for WOSB/MWBE certification eligibility of controlling owner.",
      category: "Citizenship",
    })),
    ...data.openLegalFlags.sort((a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)).map(f => ({
      priority: f.priority,
      title: f.title,
      description: f.description ?? "",
      category: f.flagType.replace(/_/g, " "),
    })),
    ...data.missingDocuments.map(d => ({
      priority: "high",
      title: `Create: ${d.title}`,
      description: d.notes ?? "Document is missing and must be created.",
      category: "Governance Document",
    })),
    ...data.documentsNeedingUpdate.map(d => ({
      priority: "medium",
      title: `Update: ${d.title}`,
      description: d.notes ?? "Document needs updates to align with current structure.",
      category: "Governance Document",
    })),
    ...data.pendingSignatureAuthority.map(s => ({
      priority: "high",
      title: `Document signature authority — ${s.personName} (${s.authorityType.replace(/_/g, " ")})`,
      description: s.notes ?? "Signature authority documentation required.",
      category: "Signature Authority",
    })),
  ].sort((a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority));

  return (
    <div className="space-y-3">
      {allActions.length === 0 ? (
        <div className="flex items-center gap-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-sm text-emerald-400">No open action items. All readiness checks passed.</p>
        </div>
      ) : (
        allActions.map((action, i) => (
          <div key={i} className="flex items-start gap-3 bg-card border border-border rounded-xl p-3.5 hover:border-border/80 transition-colors">
            <PriorityBadge priority={action.priority} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">{action.title}</div>
              {action.description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{action.description}</p>}
              <div className="text-[10px] text-muted-foreground/60 mt-1 uppercase tracking-wider">{action.category}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
