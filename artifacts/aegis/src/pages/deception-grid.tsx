import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, Server, Database, Globe, Key, FileText, Activity, AlertTriangle, Zap, Shield, RefreshCw, TrendingUp, Network, HardDrive } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { toast } from "@szl-holdings/shared-ui/ui/sonner";
import { api } from "../lib/api";
import { useStandardMutation, useStandardQuery } from "@szl-holdings/api-client-react";

interface Honeypot {
  id: string;
  name: string;
  type: string;
  ip: string;
  os: string;
  status: string;
  interactions: number;
  iocsPushed: number;
  deceptionScore: number;
  lastHit?: string;
  lastInteraction?: string;
  deployedAt: string;
  generated?: string;
  attackerProfile?: string;
}

interface DeceptionEvent {
  id: string;
  time: string;
  honeypot: string;
  event: string;
  severity: string;
  attackerIp?: string;
  technique?: string;
  intel?: string;
  pushedToFeed: boolean;
}

const typeIcon: Record<string, typeof Server> = {
  server: Server,
  database: Database,
  credential: Key,
  fileshare: HardDrive,
  api: Globe,
  email: FileText,
};

const typeColor: Record<string, string> = {
  server: "#3b82f6",
  database: "#8b5cf6",
  credential: "#f59e0b",
  fileshare: "#10b981",
  api: "#06b6d4",
  email: "#f97316",
};

const statusConfig: Record<string, { color: string; label: string }> = {
  active: { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", label: "Active" },
  engaged: { color: "text-amber-400 bg-amber-500/10 border-amber-500/30", label: "Engaged" },
  triggered: { color: "text-red-400 bg-red-500/10 border-red-500/30", label: "🔴 Triggered" },
  adapting: { color: "text-blue-400 bg-blue-500/10 border-blue-500/30", label: "Adapting" },
};

function relTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  } catch { return iso; }
}

export default function DeceptionGrid() {
  const qc = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const honeypotsQuery = useStandardQuery({
    queryKey: ["deception", "honeypots"],
    queryFn: () => api.deception.honeypots(),
    refetchInterval: 20000,
  });

  const eventsQuery = useStandardQuery({
    queryKey: ["deception", "events"],
    queryFn: () => api.deception.events(),
    refetchInterval: 10000,
  });

  type HoneypotsResponse = { data?: { honeypots?: Honeypot[]; totalInteractions?: number; avgDeception?: number; intelItems?: number } };
  type EventsResponse = { data?: { events?: DeceptionEvent[] } };

  const deployMutation = useStandardMutation({
    mutationFn: () => api.deception.deployHoneypot(),
    onSuccess: (data: { data?: { message?: string } }) => {
      qc.invalidateQueries({ queryKey: ["deception", "honeypots"] });
      toast.success(data?.data?.message ?? "New honeypot deployed");
    },
    onError: () => toast.error("Failed to deploy honeypot"),
  });

  const pushIocMutation = useStandardMutation({
    mutationFn: (eventId: string) => api.deception.pushIoc(eventId),
    onSuccess: (data: { data?: { message?: string } }) => {
      qc.invalidateQueries({ queryKey: ["deception", "events"] });
      toast.success(data?.data?.message ?? "IOC pushed to threat intel feeds");
    },
    onError: () => toast.error("Failed to push IOC"),
  });

  const honeypotsData = (honeypotsQuery.data as HoneypotsResponse | null)?.data;
  const honeypots: Honeypot[] = honeypotsData?.honeypots ?? [];
  const totalInteractions: number = honeypotsData?.totalInteractions ?? 0;
  const avgDeception: number = honeypotsData?.avgDeception ?? 0;
  const intelItems: number = honeypotsData?.intelItems ?? 0;

  const events: DeceptionEvent[] = (eventsQuery.data as EventsResponse | null)?.data?.events ?? [];
  const selectedEvent = events.find(e => e.id === selectedEventId) ?? events[0] ?? null;

  return (
    <div className="p-6 space-y-6 max-w-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-5 h-5 text-purple-400" />
            <h1 className="text-lg font-semibold text-white">Threat Decoys</h1>
          </div>
          <p className="text-xs text-zinc-500">Generative AI creates hyper-realistic fake assets. Honeypots adapt to attacker interaction patterns in real time.</p>
        </div>
        <button
          onClick={() => deployMutation.mutate()}
          disabled={deployMutation.isPending}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-medium hover:bg-purple-500/25 transition-colors disabled:opacity-50"
        >
          {deployMutation.isPending ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Deploying...</> : <><Zap className="w-3.5 h-3.5" /> Deploy New Decoy</>}
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active Honeypots", value: honeypots.length || "—", sub: "across 4 network segments", color: "#8b5cf6", icon: Eye },
          { label: "Total Interactions", value: totalInteractions || "—", sub: "attacker engagements captured", color: "#ef4444", icon: Activity },
          { label: "Threat Intel Items", value: intelItems || "—", sub: "extracted from attacker behavior", color: "#f97316", icon: TrendingUp },
          { label: "Avg Deception Score", value: avgDeception ? `${avgDeception}%` : "—", sub: "realism rating", color: "#10b981", icon: Shield },
        ].map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-xl border border-white/8 bg-white/3 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500">{m.label}</span>
                <Icon className="w-3.5 h-3.5" style={{ color: m.color }} />
              </div>
              <div className="text-2xl font-bold text-white">
                {honeypotsQuery.isLoading ? <span className="text-zinc-500 text-lg">loading…</span> : m.value}
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">{m.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Honeypot Grid */}
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Deception Assets</h2>
          {honeypotsQuery.isLoading ? (
            <div className="text-xs text-zinc-500 text-center py-8">Loading honeypots…</div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {honeypots.map((hp: Honeypot) => {
                const Icon = typeIcon[hp.type] ?? Server;
                const sc = statusConfig[hp.status] ?? statusConfig.active;
                return (
                  <div key={hp.id} className={cn("rounded-xl border p-3 transition-all", hp.status === "triggered" ? "border-red-500/30 bg-red-500/5" : "border-white/8 bg-white/3")}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${typeColor[hp.type] ?? "#888"}20`, border: `1px solid ${typeColor[hp.type] ?? "#888"}30` }}>
                        <Icon className="w-4 h-4" style={{ color: typeColor[hp.type] ?? "#888" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-white truncate">{hp.name}</span>
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded border shrink-0", sc.color)}>{sc.label}</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">{hp.ip} · {hp.generated}</div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] text-zinc-400">{hp.interactions} interactions</span>
                          {hp.lastInteraction && <span className="text-[10px] text-zinc-500">Last: {relTime(hp.lastInteraction)}</span>}
                          <div className="ml-auto flex items-center gap-1">
                            <div className="w-12 h-1 rounded-full bg-white/5">
                              <div className="h-full rounded-full bg-purple-500/60" style={{ width: `${hp.deceptionScore}%` }} />
                            </div>
                            <span className="text-[10px] text-purple-400">{hp.deceptionScore}%</span>
                          </div>
                        </div>
                        {hp.attackerProfile && (
                          <div className="mt-1.5 text-[10px] text-amber-400 bg-amber-500/10 rounded px-1.5 py-0.5">{hp.attackerProfile}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Deception Telemetry */}
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Deception Telemetry Feed</h2>
          {eventsQuery.isLoading ? (
            <div className="text-xs text-zinc-500 text-center py-8">Loading events…</div>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {events.map((evt: DeceptionEvent) => (
                  <button
                    key={evt.id}
                    onClick={() => setSelectedEventId(evt.id)}
                    className={cn("w-full rounded-xl border p-3 text-left transition-all", selectedEvent?.id === evt.id ? "border-purple-500/40 bg-purple-500/5" : "border-white/8 bg-white/3 hover:bg-white/5")}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-[11px] font-medium text-white leading-snug">{evt.event}</span>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded border shrink-0", evt.severity === "critical" ? "text-red-400 border-red-500/30 bg-red-500/10" : "text-orange-400 border-orange-500/30 bg-orange-500/10")}>{evt.severity}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                      <span>{fmtTime(evt.time)}</span>
                      <span>·</span>
                      <span>{evt.honeypot}</span>
                      <span>·</span>
                      <span>{evt.attackerIp}</span>
                      {evt.pushedToFeed && <span className="text-emerald-400 ml-1">✓ IOC pushed</span>}
                    </div>
                  </button>
                ))}
              </div>

              {selectedEvent && (
                <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Network className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-xs font-semibold text-purple-300">Threat Intelligence Extracted</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-0.5">MITRE Technique</div>
                      <div className="text-xs text-white font-mono">{selectedEvent.technique}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-0.5">Attacker IP</div>
                      <div className="text-xs text-white font-mono">{selectedEvent.attackerIp}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-0.5">Intel Analysis</div>
                      <div className="text-[11px] text-zinc-300 leading-relaxed">{selectedEvent.intel}</div>
                    </div>
                    {!selectedEvent.pushedToFeed ? (
                      <button
                        onClick={() => pushIocMutation.mutate(selectedEvent.id)}
                        disabled={pushIocMutation.isPending}
                        className="w-full mt-2 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-medium hover:bg-purple-500/25 transition-colors disabled:opacity-50"
                      >
                        {pushIocMutation.isPending ? "Pushing..." : "Push IOC to Threat Intel"}
                      </button>
                    ) : (
                      <div className="w-full mt-2 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium text-center">
                        ✓ IOC pushed to threat intel feeds
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
