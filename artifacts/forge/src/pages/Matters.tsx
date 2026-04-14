import { AppShell } from "@/components/layout/AppShell";
import { Scale, Clock, CheckCircle2, PauseCircle, FileText, User, Calendar } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { portalApi, type LegalMatter, type MattersResponse } from "@/lib/api";
import { AIInsightCard } from "@szl-holdings/shared-ui/ai-insight-card";

const STATUS_CONFIG: Record<string, { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; color: string; label: string; badge: string }> = {
  active: { icon: CheckCircle2, color: "var(--color-forge-success)", label: "Active", badge: "forge-badge-success" },
  pending: { icon: Clock, color: "var(--color-forge-warning)", label: "Pending", badge: "forge-badge-warning" },
  "on-hold": { icon: PauseCircle, color: "var(--color-forge-text-muted)", label: "On Hold", badge: "forge-badge-neutral" },
  resolved: { icon: CheckCircle2, color: "var(--color-forge-primary)", label: "Resolved", badge: "forge-badge-primary" },
};

const TIMELINE_STEPS = [
  { label: "Matter Opened", done: true },
  { label: "Initial Assessment", done: true },
  { label: "Discovery / Evidence Gathering", done: true },
  { label: "Filing / Arbitration Submission", done: false },
  { label: "Response Period", done: false },
  { label: "Hearing / Mediation", done: false },
  { label: "Resolution", done: false },
];

export default function Matters() {
  const { data, isLoading } = useQuery<MattersResponse>({
    queryKey: ["forge-portal", "matters"],
    queryFn: () => portalApi.getMatters(),
    retry: 1,
  });
  const matters = data?.matters ?? [];
  const [selected, setSelected] = useState<LegalMatter | null>(null);
  const activeSelected = selected ?? matters[0] ?? null;

  return (
    <AppShell title="Matter Tracker" subtitle="Active legal matters and recovery management">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-5 animate-fade-in-up">
          <AIInsightCard domain="forge" accentColor="hsl(38, 72%, 55%)" maxInsights={2} compact title="Legal Intelligence" />
        </div>
        <div className="flex gap-6">
          {/* Matter list */}
          <div className="w-80 flex-shrink-0 space-y-3">
            <div className="forge-eyebrow mb-3">{isLoading ? "—" : matters.length} matters</div>
            {matters.map(m => {
              const cfg = STATUS_CONFIG[m.status];
              const Icon = cfg.icon;
              const isActive = activeSelected?.id === m.id;
              return (
                <div
                  key={m.id}
                  className="forge-card-elevated p-4 cursor-pointer transition-all"
                  style={{
                    borderColor: isActive ? "var(--color-forge-primary)" : undefined,
                    boxShadow: isActive ? "0 0 0 2px var(--color-forge-primary-muted)" : undefined,
                  }}
                  onClick={() => setSelected(m)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="font-600 text-sm leading-tight" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-display)" }}>{m.title}</div>
                    <span className={`forge-badge ${cfg.badge} flex-shrink-0`}>{cfg.label}</span>
                  </div>
                  <div className="text-xs mb-3" style={{ color: "var(--color-forge-text-muted)" }}>{m.type}</div>
                  <div className="forge-progress mb-1">
                    <div
                      className="forge-progress-fill"
                      style={{
                        width: `${m.recoveryProgress}%`,
                        background: m.recoveryProgress >= 70 ? "var(--color-forge-success)" : m.recoveryProgress >= 40 ? "var(--color-forge-warning)" : "var(--color-forge-primary)",
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: "var(--color-forge-text-faint)" }}>
                    <span>Recovery progress</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-forge-text-secondary)" }}>{m.recoveryProgress}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 text-xs" style={{ color: "var(--color-forge-text-muted)" }}>
                    <Calendar className="w-3 h-3" />
                    Next: <span style={{ color: "var(--color-forge-text)", fontWeight: 600 }}>{m.nextDeadline}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Matter detail */}
          {activeSelected ? (
            <div className="flex-1 min-w-0 space-y-4">
              {/* Header */}
              <div className="forge-card-elevated p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="forge-eyebrow mb-1.5">{activeSelected.type}</div>
                    <h2 className="text-xl font-700" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-display)" }}>{activeSelected.title}</h2>
                  </div>
                  <span className={`forge-badge ${STATUS_CONFIG[activeSelected.status].badge} text-sm`}>
                    {STATUS_CONFIG[activeSelected.status].label}
                  </span>
                </div>
                <p className="text-sm" style={{ color: "var(--color-forge-text-secondary)" }}>{activeSelected.description}</p>
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4" style={{ borderTop: "1px solid var(--color-forge-border)" }}>
                  <InfoCell icon={User} label="Lead Attorney" value={activeSelected.leadAttorney} />
                  <InfoCell icon={Calendar} label="Opened" value={activeSelected.openedDate} />
                  <InfoCell icon={Clock} label="Next Deadline" value={activeSelected.nextDeadline} urgent />
                </div>
              </div>

              {/* Recovery progress */}
              <div className="forge-card-elevated p-5">
                <div className="forge-eyebrow mb-3">Recovery Progress</div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="forge-metric-sm" style={{ color: activeSelected.recoveryProgress >= 70 ? "var(--color-forge-success)" : "var(--color-forge-warning)" }}>
                    {activeSelected.recoveryProgress}%
                  </div>
                  <div className="flex-1">
                    <div className="forge-progress" style={{ height: "8px" }}>
                      <div
                        className="forge-progress-fill"
                        style={{
                          width: `${activeSelected.recoveryProgress}%`,
                          background: activeSelected.recoveryProgress >= 70 ? "var(--color-forge-success)" : activeSelected.recoveryProgress >= 40 ? "var(--color-forge-warning)" : "var(--color-forge-primary)",
                        }}
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs" style={{ color: "var(--color-forge-text-muted)" }}>
                  Recovery progress represents the estimated completion of case milestones toward final resolution. Strategy details are managed internally by your counsel team.
                </p>
              </div>

              {/* Timeline */}
              <div className="forge-card-elevated p-5">
                <div className="forge-eyebrow mb-4">Matter Timeline</div>
                <div className="space-y-3">
                  {TIMELINE_STEPS.map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[0.625rem] font-700"
                        style={{
                          background: step.done ? "var(--color-forge-success)" : i === TIMELINE_STEPS.findIndex(s => !s.done) ? "var(--color-forge-primary)" : "var(--color-forge-bg-tertiary)",
                          color: step.done || i === TIMELINE_STEPS.findIndex(s => !s.done) ? "white" : "var(--color-forge-text-faint)",
                          border: `1px solid ${step.done ? "var(--color-forge-success)" : "var(--color-forge-border)"}`,
                        }}
                      >
                        {step.done ? "✓" : i + 1}
                      </div>
                      <span
                        className="text-sm"
                        style={{
                          color: step.done ? "var(--color-forge-text)" : i === TIMELINE_STEPS.findIndex(s => !s.done) ? "var(--color-forge-primary)" : "var(--color-forge-text-muted)",
                          fontWeight: i === TIMELINE_STEPS.findIndex(s => !s.done) ? 600 : 400,
                        }}
                      >
                        {step.label}
                        {i === TIMELINE_STEPS.findIndex(s => !s.done) && (
                          <span className="ml-2 forge-badge forge-badge-primary text-[0.625rem]">Current</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Documents note */}
              <div
                className="rounded-lg p-4 flex items-start gap-3"
                style={{ background: "var(--color-forge-primary-muted)", border: "1px solid var(--color-forge-primary-border)" }}
              >
                <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--color-forge-primary)" }} />
                <div>
                  <div className="text-sm font-600 mb-0.5" style={{ color: "var(--color-forge-primary)" }}>Related Documents Available</div>
                  <div className="text-xs" style={{ color: "var(--color-forge-text-secondary)" }}>
                    Documents related to this matter are available in your Document Vault. Strategy memos and privileged work product are managed exclusively by your counsel.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center" style={{ color: "var(--color-forge-text-faint)" }}>
              Select a matter to view details
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function InfoCell({ icon: Icon, label, value, urgent }: { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; label: string; value: string; urgent?: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5" style={{ color: urgent ? "var(--color-forge-warning)" : "var(--color-forge-text-muted)" }} />
        <span className="forge-eyebrow">{label}</span>
      </div>
      <span className="text-sm font-500" style={{ color: urgent ? "var(--color-forge-warning)" : "var(--color-forge-text)" }}>{value}</span>
    </div>
  );
}
