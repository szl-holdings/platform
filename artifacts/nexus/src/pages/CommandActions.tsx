import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { executeCommandAction, fetchProofChain, updateCommandDecision } from "@/lib/api";
import { useNexusSettings } from "@/lib/SettingsContext";
import { cn, formatTimeAgo } from "@/lib/utils";
import {
  TerminalSquare, Ship, Shield, Building2, Scale, Activity,
  ArrowRight, FileText, Loader2, AlertCircle, CheckCircle, Clock
} from "lucide-react";

interface CommandAction {
  id: string;
  label: string;
  description: string;
  targetDomain: string;
  actionType: string;
  requiresApproval: boolean;
  riskLevel: "P0" | "P1" | "P2" | "P3";
}

const DOMAIN_COLORS: Record<string, string> = {
  vessels: "hsl(206,72%,52%)", aegis: "hsl(222,60%,62%)", terra: "hsl(140,50%,48%)",
  prism: "hsl(38,72%,58%)", lyte: "hsl(192,85%,46%)",
};
const DOMAIN_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  vessels: Ship, aegis: Shield, terra: Building2, prism: Scale, lyte: Activity,
};

const ACTION_TEMPLATES: CommandAction[] = [
  {
    id: "act-001", label: "Escalate to Aegis SOC",
    description: "Escalate the current entity or correlation to the Aegis Security Operations Center for Tier 2 threat analysis. Includes IOC package and context from Nexus canvas.",
    targetDomain: "aegis", actionType: "escalate", requiresApproval: false, riskLevel: "P2",
  },
  {
    id: "act-002", label: "Open PRISM Matter",
    description: "Create a new legal matter in PRISM Counsel from the current entity or correlation. Pre-fills matter type, involved parties, and relevant evidence from Nexus context.",
    targetDomain: "prism", actionType: "create_matter", requiresApproval: false, riskLevel: "P2",
  },
  {
    id: "act-003", label: "Flag Vessel for Enhanced Screening",
    description: "Flag a vessel entity for immediate enhanced due diligence, suspend charter payment approvals, and initiate counterparty KYC refresh request.",
    targetDomain: "vessels", actionType: "flag_vessel", requiresApproval: true, riskLevel: "P1",
  },
  {
    id: "act-004", label: "Initiate Terra Deal Review",
    description: "Trigger a priority deal review for the selected property or owner entity in Terra. Routes to senior analyst queue with Nexus context and correlation evidence attached.",
    targetDomain: "terra", actionType: "initiate_review", requiresApproval: false, riskLevel: "P2",
  },
  {
    id: "act-005", label: "Freeze Lyte Approval Workflow",
    description: "Pause the specified approval workflow in Lyte pending threat clearance or compliance review. Triggers emergency ownership assignment and SLA clock.",
    targetDomain: "lyte", actionType: "freeze", requiresApproval: true, riskLevel: "P1",
  },
  {
    id: "act-006", label: "Activate Breach Notification Runbook",
    description: "Activate the PRISM statutory breach notification process. Sets legal notification windows, assigns lead counsel, and begins regulatory reporting preparation.",
    targetDomain: "prism", actionType: "create_matter", requiresApproval: true, riskLevel: "P0",
  },
];

const PRIORITY_COLORS: Record<string, string> = {
  P0: "hsl(0,72%,51%)", P1: "hsl(32,88%,52%)", P2: "hsl(45,85%,52%)", P3: "hsl(160,65%,42%)",
};

export default function CommandActions() {
  const { refetchIntervalMs } = useNexusSettings();
  const qc = useQueryClient();
  const [selectedAction, setSelectedAction] = useState<CommandAction | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: proofData, isLoading: proofLoading } = useQuery({
    queryKey: ["proof-chain"],
    queryFn: () => fetchProofChain(20),
    refetchInterval: refetchIntervalMs,
  });

  const proofChain: Array<Record<string, unknown>> = proofData?.entries ?? [];

  const executeMutation = useMutation({
    mutationFn: (action: CommandAction) =>
      executeCommandAction({
        actionId: action.id,
        actionType: action.actionType,
        targetDomain: action.targetDomain,
        payload: { notes: actionNote.trim() || undefined },
        operator: "Nexus Operator",
        requiresApproval: action.requiresApproval,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proof-chain"] });
      setSelectedAction(null);
      setActionNote("");
      setConfirmOpen(false);
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ proofId }: { proofId: string }) =>
      updateCommandDecision(proofId, "approved", "approved"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proof-chain"] }),
  });

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Action templates */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-border shrink-0">
          <h1 className="text-lg font-display font-bold text-foreground">Command Actions</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cross-domain action triggers — all actions logged to Proof Chain audit trail
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-2 gap-3">
            {ACTION_TEMPLATES.map((action, idx) => {
              const Icon = DOMAIN_ICONS[action.targetDomain] ?? Shield;
              const domainColor = DOMAIN_COLORS[action.targetDomain] ?? "hsl(258,80%,62%)";
              return (
                <button
                  key={action.id}
                  onClick={() => { setSelectedAction(action); setConfirmOpen(false); setActionNote(""); }}
                  className={cn(
                    "fusion-panel p-4 text-left group animate-fade-in-up",
                    selectedAction?.id === action.id && "border-[hsl(258_80%_62%)] border-opacity-60"
                  )}
                  style={{ animationDelay: `${idx * 0.04}s` }}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${domainColor}14`, color: domainColor }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {action.requiresApproval && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-[hsla(32,88%,52%,0.1)] text-[hsl(32,88%,62%)] border border-[hsla(32,88%,52%,0.25)]">
                          APPROVAL REQ
                        </span>
                      )}
                      <span className="text-[9px] font-mono font-bold" style={{ color: PRIORITY_COLORS[action.riskLevel] }}>
                        {action.riskLevel}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-foreground mb-1">{action.label}</div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{action.description}</p>
                  <div className="flex items-center gap-1 mt-3 text-[10px] font-mono" style={{ color: domainColor }}>
                    <span className="capitalize">{action.targetDomain}</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                    <span className="capitalize">{action.actionType.replace("_", " ")}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-80 border-l border-border flex flex-col overflow-hidden bg-[hsl(226_24%_4%)]">
        {/* Action detail / confirm */}
        {selectedAction ? (
          <div className="flex flex-col overflow-hidden border-b border-border">
            <div className="px-4 py-3 border-b border-border">
              <div className="text-xs font-semibold text-foreground">{selectedAction.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{selectedAction.description}</div>
            </div>
            <div className="p-4 space-y-3">
              <textarea
                value={actionNote}
                onChange={e => setActionNote(e.target.value)}
                placeholder="Add context note for audit trail (optional)..."
                rows={3}
                className="w-full text-xs bg-card border border-border rounded px-2 py-1.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-[hsl(258_80%_62%)] resize-none"
              />
              {executeMutation.error && (
                <div className="text-[10px] text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Failed to execute — try again
                </div>
              )}
              {!confirmOpen ? (
                <button
                  onClick={() => setConfirmOpen(true)}
                  className="w-full py-2 rounded bg-[hsl(258_80%_62%)] text-white text-xs font-semibold hover:bg-[hsl(258_80%_55%)] transition-colors"
                >
                  {selectedAction.requiresApproval ? "Submit for Approval" : "Execute Action"}
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-[hsl(32,88%,62%)] font-medium">
                    {selectedAction.requiresApproval
                      ? "This action requires manager approval before execution. Submitting will create a pending approval request."
                      : "Confirm execution. This action will be logged to the Proof Chain audit trail."}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => executeMutation.mutate(selectedAction)}
                      disabled={executeMutation.isPending}
                      className="flex-1 py-1.5 rounded bg-[hsl(258_80%_62%)] text-white text-xs font-semibold hover:bg-[hsl(258_80%_55%)] transition-colors disabled:opacity-40"
                    >
                      {executeMutation.isPending ? "Executing..." : "Confirm"}
                    </button>
                    <button
                      onClick={() => setConfirmOpen(false)}
                      className="px-3 py-1.5 rounded border border-border text-muted-foreground text-xs hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 border-b border-border">
            <div className="text-xs text-muted-foreground text-center">Select an action to execute</div>
          </div>
        )}

        {/* Audit trail */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">Proof Chain Audit Trail</span>
          <span className="ml-auto text-[10px] text-muted-foreground font-mono">{proofChain.length} entries</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {proofLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : proofChain.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <FileText className="w-6 h-6 mb-2 opacity-30" />
              <p className="text-xs">No actions executed yet</p>
            </div>
          ) : (
            proofChain.map((entry: Record<string, unknown>) => (
              <div key={entry.id as string} className="px-4 py-3 border-b border-border/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground line-clamp-1">
                    {(entry.actionType as string).replace(/_/g, " ")}
                  </span>
                  <span className={cn(
                    "text-[9px] px-1 py-0.5 rounded font-mono",
                    entry.status === "executed" ? "text-[hsl(140,50%,56%)] bg-[hsla(140,50%,48%,0.1)]" :
                    entry.status === "pending" ? "text-[hsl(32,88%,62%)] bg-[hsla(32,88%,52%,0.1)]" :
                    entry.status === "approved" ? "text-[hsl(258,80%,70%)] bg-[hsla(258,80%,62%,0.1)]" :
                    "text-red-400 bg-red-500/10"
                  )}>
                    {(entry.status as string).toUpperCase()}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground font-mono mb-1">
                  {entry.operator as string} · {formatTimeAgo(entry.timestamp as string)}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono truncate">
                  {entry.txHash as string}
                </div>
                {entry.status === "pending" && (
                  <div className="flex gap-1.5 mt-2">
                    <button
                      onClick={() => approveMutation.mutate({ proofId: entry.id as string })}
                      className="flex-1 py-1 text-[10px] rounded bg-[hsla(140,50%,48%,0.12)] text-[hsl(140,50%,56%)] border border-[hsla(140,50%,48%,0.25)] hover:bg-[hsla(140,50%,48%,0.2)] transition-colors font-medium"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateCommandDecision(entry.id as string, "rejected", "rejected").then(() => qc.invalidateQueries({ queryKey: ["proof-chain"] }))}
                      className="flex-1 py-1 text-[10px] rounded bg-[hsla(0,72%,51%,0.1)] text-red-400 border border-[hsla(0,72%,51%,0.2)] hover:bg-[hsla(0,72%,51%,0.2)] transition-colors font-medium"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
