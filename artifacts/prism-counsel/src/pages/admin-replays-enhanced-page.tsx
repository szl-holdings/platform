import { useState } from "react";
import { RefreshCw, Play, AlertTriangle, CheckCircle, Clock, Filter, XCircle, Server } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API = import.meta.env.BASE_URL + "api";

function useDeadLetterEvents() {
  return useQuery({
    queryKey: ["dead-letter-events"],
    queryFn: async () => { const r = await fetch(`${API}/prism-counsel/jobs/dead-letter`); return r.json(); },
    staleTime: 30000, retry: false,
  });
}

const DEMO_DLQ_EVENTS = [
  { id: 1, orgId: 1, jobType: "export_generate", error: "Azure Blob connection timeout after 3 retries", retryCount: 3, payload: { exportId: 42, exportType: "review_packet" }, failedAt: "2026-04-02T11:00:00Z", resolvedAt: null, resolution: null },
  { id: 2, orgId: 1, jobType: "deadline_evaluate", error: "Matter ID 999 not found in pc_matters", retryCount: 3, payload: { matterId: 999 }, failedAt: "2026-04-03T07:30:00Z", resolvedAt: null, resolution: null },
];

const REPLAY_STRATEGIES: Record<string, string> = {
  export_generate: "Re-trigger export job with same payload. Ensure Azure Blob credentials are valid first.",
  deadline_evaluate: "Verify matter ID exists. If matter was deleted, discard. Otherwise fix payload and replay.",
  document_extract: "Re-queue document extraction. Check Azure Doc Intel endpoint is responding.",
  connector_sync: "Reset connector account status, then re-trigger sync.",
  forecast_recompute: "Re-queue forecast recompute. Usually safe to replay.",
  notification_send: "Check notification channel. If Teams webhook expired, update and replay.",
};

export default function AdminReplaysEnhancedPage() {
  const [filter, setFilter] = useState("all");
  const qc = useQueryClient();
  const { data: dlqData, isFetching } = useDeadLetterEvents();
  const events = dlqData?.data?.events ?? DEMO_DLQ_EVENTS;
  const isDemo = !dlqData?.data?.events;

  const replayMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const r = await fetch(`${API}/prism-counsel/jobs/dead-letter/${eventId}/replay`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dead-letter-events"] }),
  });

  const discardMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const r = await fetch(`${API}/prism-counsel/jobs/dead-letter/${eventId}/discard`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: "Manual discard" }) });
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dead-letter-events"] }),
  });

  const filtered = filter === "all" ? events : events.filter((e: any) => e.jobType === filter);
  const jobTypes = [...new Set(events.map((e: any) => e.jobType))];
  const unresolved = events.filter((e: any) => !e.resolvedAt).length;

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-[#8b7ac8]" />
            <h1 className="text-lg font-semibold text-slate-100">Job Replays & Dead Letter Queue</h1>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#c45a4a]/10 text-[#c45a4a] border border-[#c45a4a]/20">ADMIN</span>
            {isDemo && <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#d4a054]/10 text-[#d4a054]">DEMO</span>}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Failed job events, replay queue, discard controls, and root cause analysis with recovery hints</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{unresolved} unresolved</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Unresolved Events", value: unresolved, color: unresolved > 0 ? "#c45a4a" : "#4a90b8" },
          { label: "Resolved This Week", value: events.filter((e: any) => e.resolvedAt).length, color: "#4a90b8" },
          { label: "Unique Job Types", value: jobTypes.length, color: "#8b7ac8" },
        ].map((s, i) => (
          <div key={i} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
            <div className="text-[10px] text-slate-500 mb-1">{s.label}</div>
            <div className="text-xl font-semibold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 flex-wrap">
        <button onClick={() => setFilter("all")} className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${filter === "all" ? "bg-[#8b7ac8]/15 text-[#8b7ac8]" : "text-slate-500 hover:text-slate-300"}`}>All</button>
        {(jobTypes as string[]).map(jt => (
          <button key={jt} onClick={() => setFilter(jt)} className={`px-2.5 py-1 rounded text-[10px] font-mono transition-colors ${filter === jt ? "bg-[#8b7ac8]/15 text-[#8b7ac8]" : "text-slate-500 hover:text-slate-300"}`}>{jt}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && <div className="text-center text-slate-500 py-8 text-sm">No events in the dead letter queue — all clear</div>}
        {filtered.map((event: any) => {
          const strategy = REPLAY_STRATEGIES[event.jobType];
          return (
            <div key={event.id} className={`rounded-lg border p-4 ${event.resolvedAt ? "border-white/[0.06]" : "border-[#c45a4a]/20"}`} style={{ background: "#0c1220" }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    {event.resolvedAt ? <CheckCircle className="w-3.5 h-3.5 text-[#4a90b8]" /> : <XCircle className="w-3.5 h-3.5 text-[#c45a4a]" />}
                    <span className="text-xs font-mono text-slate-200">{event.jobType}</span>
                    <span className="text-[9px] text-slate-500">DLQ-{event.id}</span>
                    <span className="text-[9px] text-slate-500">· {event.retryCount} retries</span>
                  </div>
                  <div className="text-[10px] text-[#c45a4a] mt-1">{event.error}</div>
                  {event.payload && <div className="text-[9px] font-mono text-slate-600 mt-0.5">{JSON.stringify(event.payload)}</div>}
                </div>
                <div className="text-[9px] text-slate-500 text-right">
                  <div>Failed: {new Date(event.failedAt).toLocaleString()}</div>
                  {event.resolvedAt && <div className="text-[#4a90b8]">Resolved: {new Date(event.resolvedAt).toLocaleString()}</div>}
                </div>
              </div>
              {strategy && !event.resolvedAt && (
                <div className="p-2 rounded mb-3" style={{ background: "#080c14" }}>
                  <div className="text-[9px] text-slate-600 mb-0.5">Recovery Strategy</div>
                  <p className="text-[10px] text-slate-400">{strategy}</p>
                </div>
              )}
              {!event.resolvedAt && (
                <div className="flex items-center gap-2">
                  <button onClick={() => replayMutation.mutate(event.id)} disabled={replayMutation.isPending} className="flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-medium bg-[#4a90b8]/10 text-[#4a90b8] hover:bg-[#4a90b8]/20 transition-colors">
                    <Play className="w-2.5 h-2.5" /> Replay
                  </button>
                  <button onClick={() => discardMutation.mutate(event.id)} disabled={discardMutation.isPending} className="flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-medium bg-white/[0.04] text-slate-500 hover:text-slate-300 transition-colors">
                    Discard
                  </button>
                </div>
              )}
              {event.resolvedAt && (
                <div className="text-[9px] text-slate-500">Resolution: {event.resolution ?? "Unknown"} · Notes: {event.notes ?? "—"}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
