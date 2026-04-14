import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  FileText, Clock, CheckCircle2, Eye, Send, AlertCircle,
  ChevronRight, DollarSign, Calendar, Plus, Sparkles, X
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { portalApi, type Proposal } from "@/lib/api";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { color: string; icon: typeof CheckCircle2; label: string }> = {
  draft: { color: "var(--color-forge-text-muted)", icon: FileText, label: "Draft" },
  sent: { color: "var(--color-forge-primary)", icon: Send, label: "Sent" },
  viewed: { color: "var(--color-forge-gold)", icon: Eye, label: "Viewed" },
  accepted: { color: "var(--color-forge-success)", icon: CheckCircle2, label: "Accepted" },
  declined: { color: "var(--color-forge-danger)", icon: AlertCircle, label: "Declined" },
  expired: { color: "var(--color-forge-text-faint)", icon: Clock, label: "Expired" },
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export default function Proposals() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [genTitle, setGenTitle] = useState("");
  const [genType, setGenType] = useState("consulting");
  const [genDesc, setGenDesc] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["forge-portal", "proposals"],
    queryFn: () => portalApi.getProposals(),
    retry: 1,
  });

  const { data: detail } = useQuery({
    queryKey: ["forge-portal", "proposals", selectedId],
    queryFn: () => portalApi.getProposal(selectedId!),
    enabled: !!selectedId,
    retry: 1,
  });

  const generateMutation = useMutation({
    mutationFn: (params: { title: string; type: string; description: string }) =>
      portalApi.generateProposal(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forge-portal", "proposals"] });
      setShowGenerator(false);
      setGenTitle("");
      setGenDesc("");
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => portalApi.acceptProposal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forge-portal", "proposals"] });
      queryClient.invalidateQueries({ queryKey: ["forge-portal", "proposals", selectedId] });
    },
  });

  const proposals = data?.proposals ?? [];

  return (
    <AppShell title="Proposals & SOWs" subtitle="AI-generated proposals and engagement management">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-forge-text-muted)" }}>
              <FileText className="w-4 h-4" />
              <span>{proposals.length} proposals</span>
            </div>
          </div>
          <button
            onClick={() => setShowGenerator(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-600 text-white"
            style={{ background: "var(--color-forge-primary)" }}
          >
            <Plus className="w-4 h-4" /> Generate Proposal
          </button>
        </div>

        {showGenerator && (
          <div className="forge-card-elevated p-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" style={{ color: "var(--color-forge-primary)" }} />
                <h3 className="text-sm font-600" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-display)" }}>AI Proposal Generator</h3>
              </div>
              <button onClick={() => setShowGenerator(false)}><X className="w-4 h-4" style={{ color: "var(--color-forge-text-muted)" }} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-600 mb-1" style={{ color: "var(--color-forge-text-muted)" }}>Proposal Title</label>
                <input
                  type="text"
                  value={genTitle}
                  onChange={e => setGenTitle(e.target.value)}
                  placeholder="e.g., Strategic Maritime Intelligence Advisory"
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: "var(--color-forge-bg-secondary)", color: "var(--color-forge-text)", border: "1px solid var(--color-forge-border)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-600 mb-1" style={{ color: "var(--color-forge-text-muted)" }}>Engagement Type</label>
                <select
                  value={genType}
                  onChange={e => setGenType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: "var(--color-forge-bg-secondary)", color: "var(--color-forge-text)", border: "1px solid var(--color-forge-border)" }}
                >
                  <option value="consulting">Consulting Engagement</option>
                  <option value="advisory">Advisory Retainer</option>
                  <option value="intelligence">Intelligence Package</option>
                  <option value="custom">Custom Engagement</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-600 mb-1" style={{ color: "var(--color-forge-text-muted)" }}>Description</label>
                <textarea
                  value={genDesc}
                  onChange={e => setGenDesc(e.target.value)}
                  placeholder="Describe the engagement objectives and scope..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                  style={{ background: "var(--color-forge-bg-secondary)", color: "var(--color-forge-text)", border: "1px solid var(--color-forge-border)" }}
                />
              </div>
              <button
                onClick={() => generateMutation.mutate({ title: genTitle, type: genType, description: genDesc })}
                disabled={!genTitle.trim() || generateMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-600 text-white disabled:opacity-50"
                style={{ background: "var(--color-forge-primary)" }}
              >
                <Sparkles className="w-4 h-4" /> {generateMutation.isPending ? "Generating..." : "Generate with AI"}
              </button>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {isLoading && (
              <div className="text-center py-12">
                <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin mx-auto" style={{ borderColor: "var(--color-forge-primary)" }} />
              </div>
            )}
            {proposals.map((proposal) => {
              const config = STATUS_CONFIG[proposal.status] ?? STATUS_CONFIG.draft;
              const StatusIcon = config.icon;
              const isSelected = selectedId === proposal.id;
              return (
                <button
                  key={proposal.id}
                  onClick={() => setSelectedId(proposal.id)}
                  className={cn("w-full text-left p-4 rounded-lg transition-all", isSelected && "ring-1")}
                  style={{
                    background: isSelected ? "color-mix(in srgb, var(--color-forge-primary) 6%, var(--color-forge-bg))" : "var(--color-forge-bg)",
                    border: `1px solid ${isSelected ? "var(--color-forge-primary)" : "var(--color-forge-border)"}`,
                    
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-600 pr-2" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-display)" }}>{proposal.title}</h4>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <StatusIcon className="w-3.5 h-3.5" style={{ color: config.color }} />
                      <span className="text-xs font-500" style={{ color: config.color }}>{config.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: "var(--color-forge-text-muted)" }}>
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{fmt(proposal.pricing.total)}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{proposal.validUntil}</span>
                    <span className="capitalize">{proposal.type}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-3">
            {detail ? (
              <div className="forge-card-elevated p-6 animate-fade-in-up space-y-6">
                <div>
                  <div className="flex items-start justify-between">
                    <h2 className="text-lg font-700" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-display)" }}>{detail.title}</h2>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: `color-mix(in srgb, ${STATUS_CONFIG[detail.status]?.color ?? "gray"} 12%, transparent)` }}>
                      {(() => { const Ic = STATUS_CONFIG[detail.status]?.icon ?? FileText; return <Ic className="w-3.5 h-3.5" style={{ color: STATUS_CONFIG[detail.status]?.color }} />; })()}
                      <span className="text-xs font-600" style={{ color: STATUS_CONFIG[detail.status]?.color }}>{STATUS_CONFIG[detail.status]?.label}</span>
                    </div>
                  </div>
                  <p className="text-sm mt-2" style={{ color: "var(--color-forge-text-muted)" }}>{detail.executiveSummary}</p>
                </div>

                <div>
                  <h3 className="forge-eyebrow mb-3">Services</h3>
                  <div className="space-y-3">
                    {detail.services.map((svc, idx) => (
                      <div key={idx} className="p-3 rounded-lg" style={{ background: "var(--color-forge-bg-secondary)" }}>
                        <div className="text-sm font-600" style={{ color: "var(--color-forge-text)" }}>{svc.name}</div>
                        <div className="text-xs mt-1" style={{ color: "var(--color-forge-text-muted)" }}>{svc.description}</div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {svc.deliverables.map((d, di) => (
                            <span key={di} className="text-[0.625rem] px-1.5 py-0.5 rounded" style={{ background: "color-mix(in srgb, var(--color-forge-primary) 10%, transparent)", color: "var(--color-forge-primary)" }}>{d}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="forge-eyebrow mb-3">Timeline</h3>
                  <div className="space-y-2">
                    {detail.timeline.map((phase, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-700 text-white" style={{ background: "var(--color-forge-primary)" }}>{idx + 1}</div>
                        <div>
                          <div className="text-sm font-600" style={{ color: "var(--color-forge-text)" }}>{phase.phase} <span className="font-400" style={{ color: "var(--color-forge-text-muted)" }}>· {phase.duration}</span></div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {phase.milestones.map((m, mi) => (
                              <span key={mi} className="text-[0.625rem] px-1.5 py-0.5 rounded" style={{ background: "var(--color-forge-bg-secondary)", color: "var(--color-forge-text-muted)" }}>{m}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-lg" style={{ background: "color-mix(in srgb, var(--color-forge-gold) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--color-forge-gold) 25%, transparent)" }}>
                  <h3 className="forge-eyebrow mb-3" style={{ color: "var(--color-forge-gold)" }}>Pricing</h3>
                  <div className="text-2xl font-700 mb-2" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-mono)" }}>
                    {fmt(detail.pricing.total)} <span className="text-sm font-400" style={{ color: "var(--color-forge-text-muted)" }}>{detail.pricing.currency}</span>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    {detail.pricing.breakdown.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span style={{ color: "var(--color-forge-text-muted)" }}>{item.item}</span>
                        <span className="font-500" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-mono)" }}>{fmt(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs" style={{ color: "var(--color-forge-text-muted)" }}>Terms: {detail.pricing.paymentTerms}</div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: "var(--color-forge-text-muted)" }}>Valid until {detail.validUntil}</span>
                  {(detail.status === "sent" || detail.status === "viewed") && (
                    <button
                      onClick={() => acceptMutation.mutate(detail.id)}
                      disabled={acceptMutation.isPending}
                      className="ml-auto flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-600 text-white"
                      style={{ background: "var(--color-forge-success)" }}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Accept Proposal
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="forge-card-elevated p-12 text-center">
                <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-forge-text-faint)" }} />
                <p className="text-sm" style={{ color: "var(--color-forge-text-muted)" }}>Select a proposal to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
