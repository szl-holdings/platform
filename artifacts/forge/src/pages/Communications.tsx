import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Mail, Bell, Milestone, Newspaper, FileBarChart,
  ChevronRight, Eye, Clock, AlertTriangle, Settings,
  Anchor, Building2, Scale, Shield, Filter
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { portalApi, type CommunicationItem, type CommunicationPreferences } from "@/lib/api";
import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<string, { icon: typeof Mail; color: string; label: string }> = {
  briefing: { icon: FileBarChart, color: "var(--color-forge-primary)", label: "Briefing" },
  alert: { icon: Bell, color: "var(--color-forge-warning)", label: "Alert" },
  milestone: { icon: Milestone, color: "var(--color-forge-success)", label: "Milestone" },
  newsletter: { icon: Newspaper, color: "var(--color-forge-gold)", label: "Newsletter" },
  report: { icon: FileBarChart, color: "var(--color-forge-vessels)", label: "Report" },
};

const DOMAIN_COLORS: Record<string, string> = {
  vessels: "var(--color-forge-vessels)",
  terra: "var(--color-forge-terra)",
  legal: "var(--color-forge-legal)",
  security: "var(--color-forge-security)",
  general: "var(--color-forge-text-muted)",
};

const DOMAIN_ICONS: Record<string, typeof Anchor> = {
  vessels: Anchor,
  terra: Building2,
  legal: Scale,
  security: Shield,
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "var(--color-forge-danger)",
  high: "var(--color-forge-warning)",
  normal: "var(--color-forge-text-muted)",
  low: "var(--color-forge-text-faint)",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) {
    return `Today ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (diff < 172800000) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Communications() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPrefs, setShowPrefs] = useState(false);

  const { data } = useQuery({
    queryKey: ["forge-portal", "communications", filter],
    queryFn: () => portalApi.getCommunications(filter ? { type: filter } : undefined),
    retry: 1,
  });

  const { data: detail } = useQuery({
    queryKey: ["forge-portal", "communications", "detail", selectedId],
    queryFn: () => portalApi.getCommunication(selectedId!),
    enabled: !!selectedId,
    retry: 1,
  });

  const { data: prefs } = useQuery({
    queryKey: ["forge-portal", "communications", "preferences"],
    queryFn: () => portalApi.getCommunicationPreferences(),
    retry: 1,
  });

  const updatePrefsMutation = useMutation({
    mutationFn: (updates: Partial<CommunicationPreferences>) => portalApi.updateCommunicationPreferences(updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["forge-portal", "communications", "preferences"] }),
  });

  const comms = data?.communications ?? [];
  const unread = data?.unread ?? 0;

  return (
    <AppShell title="Communications Hub" subtitle="Intelligence briefings, alerts, and updates">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-forge-text-muted)" }}>
              <Mail className="w-4 h-4" />
              <span>{comms.length} communications</span>
              {unread > 0 && (
                <span className="text-xs font-700 px-2 py-0.5 rounded-full text-white" style={{ background: "var(--color-forge-primary)" }}>{unread} unread</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: "var(--color-forge-bg-secondary)" }}>
              <button
                onClick={() => setFilter(null)}
                className="px-2 py-1 rounded text-xs font-500 transition-all"
                style={{ background: !filter ? "var(--color-forge-primary)" : "transparent", color: !filter ? "#fff" : "var(--color-forge-text-muted)" }}
              >
                All
              </button>
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className="px-2 py-1 rounded text-xs font-500 transition-all flex items-center gap-1"
                    style={{ background: filter === key ? cfg.color : "transparent", color: filter === key ? "#fff" : "var(--color-forge-text-muted)" }}
                  >
                    <Icon className="w-3 h-3" />{cfg.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowPrefs(!showPrefs)}
              className="p-2 rounded-lg transition-colors"
              style={{ background: showPrefs ? "var(--color-forge-primary)" : "var(--color-forge-bg-secondary)", color: showPrefs ? "#fff" : "var(--color-forge-text-muted)" }}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showPrefs && prefs && (
          <div className="forge-card-elevated p-5 animate-fade-in-up">
            <h3 className="text-sm font-600 mb-4" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-display)" }}>Communication Preferences</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-600 mb-1.5" style={{ color: "var(--color-forge-text-muted)" }}>Briefing Frequency</label>
                <div className="flex gap-1">
                  {(["daily", "weekly", "monthly"] as const).map(freq => (
                    <button
                      key={freq}
                      onClick={() => updatePrefsMutation.mutate({ briefingFrequency: freq })}
                      className="px-3 py-1.5 rounded text-xs font-500 capitalize"
                      style={{
                        background: prefs.briefingFrequency === freq ? "var(--color-forge-primary)" : "var(--color-forge-bg-secondary)",
                        color: prefs.briefingFrequency === freq ? "#fff" : "var(--color-forge-text-muted)",
                      }}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-600 mb-1.5" style={{ color: "var(--color-forge-text-muted)" }}>Alert Threshold</label>
                <div className="flex gap-1">
                  {(["all", "high", "critical"] as const).map(threshold => (
                    <button
                      key={threshold}
                      onClick={() => updatePrefsMutation.mutate({ alertThreshold: threshold })}
                      className="px-3 py-1.5 rounded text-xs font-500 capitalize"
                      style={{
                        background: prefs.alertThreshold === threshold ? "var(--color-forge-primary)" : "var(--color-forge-bg-secondary)",
                        color: prefs.alertThreshold === threshold ? "#fff" : "var(--color-forge-text-muted)",
                      }}
                    >
                      {threshold}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { key: "emailNotifications" as const, label: "Email Notifications" },
                  { key: "newsletterOptIn" as const, label: "Newsletter" },
                  { key: "inPortalNotifications" as const, label: "In-Portal Notifications" },
                ].map(toggle => (
                  <label key={toggle.key} className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => updatePrefsMutation.mutate({ [toggle.key]: !prefs[toggle.key] })}
                      className="w-8 h-4 rounded-full relative cursor-pointer transition-colors"
                      style={{ background: prefs[toggle.key] ? "var(--color-forge-primary)" : "var(--color-forge-bg-tertiary)" }}
                    >
                      <div
                        className="w-3 h-3 rounded-full absolute top-0.5 transition-all"
                        style={{ left: prefs[toggle.key] ? "calc(100% - 14px)" : "2px", background: "#fff" }}
                      />
                    </div>
                    <span className="text-xs" style={{ color: "var(--color-forge-text)" }}>{toggle.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-2">
            {comms.map((comm) => {
              const cfg = TYPE_CONFIG[comm.type] ?? TYPE_CONFIG.briefing;
              const Icon = cfg.icon;
              const isSelected = selectedId === comm.id;
              const isUnread = comm.status === "sent";
              return (
                <button
                  key={comm.id}
                  onClick={() => setSelectedId(comm.id)}
                  className={cn("w-full text-left p-3 rounded-lg transition-all", isSelected && "ring-1")}
                  style={{
                    background: isSelected ? "color-mix(in srgb, var(--color-forge-primary) 6%, var(--color-forge-bg))" : "var(--color-forge-bg)",
                    border: `1px solid ${isSelected ? "var(--color-forge-primary)" : "var(--color-forge-border)"}`,
                    
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `color-mix(in srgb, ${cfg.color} 12%, transparent)` }}>
                      <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isUnread && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "var(--color-forge-primary)" }} />}
                        <span className={cn("text-sm truncate", isUnread && "font-600")} style={{ color: "var(--color-forge-text)" }}>{comm.subject}</span>
                      </div>
                      <div className="text-xs truncate mt-0.5" style={{ color: "var(--color-forge-text-muted)" }}>{comm.summary}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[0.625rem] px-1.5 py-0.5 rounded" style={{ background: `color-mix(in srgb, ${cfg.color} 10%, transparent)`, color: cfg.color }}>{cfg.label}</span>
                        {comm.priority !== "normal" && (
                          <span className="text-[0.625rem] px-1.5 py-0.5 rounded capitalize" style={{ background: `color-mix(in srgb, ${PRIORITY_COLORS[comm.priority]} 10%, transparent)`, color: PRIORITY_COLORS[comm.priority] }}>{comm.priority}</span>
                        )}
                        <span className="text-[0.625rem] ml-auto" style={{ color: "var(--color-forge-text-faint)" }}>{formatDate(comm.scheduledAt)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-3">
            {detail ? (
              <div className="forge-card-elevated p-6 animate-fade-in-up space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {(() => { const cfg = TYPE_CONFIG[detail.type] ?? TYPE_CONFIG.briefing; const Ic = cfg.icon; return <Ic className="w-4 h-4" style={{ color: cfg.color }} />; })()}
                      <span className="text-xs font-600" style={{ color: TYPE_CONFIG[detail.type]?.color }}>{TYPE_CONFIG[detail.type]?.label}</span>
                      {detail.domain !== "general" && (
                        <span className="text-xs px-1.5 py-0.5 rounded capitalize" style={{ background: `color-mix(in srgb, ${DOMAIN_COLORS[detail.domain]} 10%, transparent)`, color: DOMAIN_COLORS[detail.domain] }}>{detail.domain}</span>
                      )}
                    </div>
                    <h2 className="text-lg font-700" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-display)" }}>{detail.subject}</h2>
                  </div>
                  {detail.priority !== "normal" && (
                    <span className="text-xs font-600 px-2 py-1 rounded capitalize flex items-center gap-1" style={{ background: `color-mix(in srgb, ${PRIORITY_COLORS[detail.priority]} 12%, transparent)`, color: PRIORITY_COLORS[detail.priority] }}>
                      {detail.priority === "urgent" && <AlertTriangle className="w-3 h-3" />}
                      {detail.priority}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs" style={{ color: "var(--color-forge-text-muted)" }}>
                  {detail.sentAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Sent {formatDate(detail.sentAt)}</span>}
                  {detail.readAt && <span className="flex items-center gap-1"><Eye className="w-3 h-3" />Read {formatDate(detail.readAt)}</span>}
                </div>

                <div className="p-4 rounded-lg text-sm leading-relaxed whitespace-pre-line" style={{ background: "var(--color-forge-bg-secondary)", color: "var(--color-forge-text)" }}>
                  {detail.body}
                </div>

                {Object.keys(detail.metadata).length > 0 && (
                  <div className="pt-3" style={{ borderTop: "1px solid var(--color-forge-border)" }}>
                    <div className="forge-eyebrow mb-2">Metadata</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(detail.metadata).map(([k, v]) => (
                        <span key={k} className="text-[0.625rem] px-2 py-0.5 rounded" style={{ background: "var(--color-forge-bg-secondary)", color: "var(--color-forge-text-muted)" }}>
                          {k}: {String(v)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="forge-card-elevated p-12 text-center">
                <Mail className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-forge-text-faint)" }} />
                <p className="text-sm" style={{ color: "var(--color-forge-text-muted)" }}>Select a communication to read</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
