import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {

  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Download,
  Factory,
  Flame,
  Gauge,
  Network,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Settings,
  Shield,
  SkipBack,
  SkipForward,
  Zap,
} from "lucide-react";
import { api } from "../lib/api";
import { useStandardMutation, useStandardQuery } from "@szl-holdings/api-client-react";

type ProtocolName = "Modbus" | "DNP3" | "S7";
type Severity = "info" | "low" | "medium" | "high" | "critical";

interface DecodedField {
  name: string;
  value: string;
  bytes: string;
  note?: string;
  flag?: "info" | "warn" | "anomaly";
}

interface DecodedFrame {
  id: number;
  frameId: string;
  observedAt: string;
  protocol: ProtocolName;
  src: string;
  dst: string;
  assetId: string | null;
  functionLabel: string;
  summary: string;
  severity: Severity;
  rawHex: string;
  fields: DecodedField[];
  forensicEventId: string | null;
  conversationSessionId: string | null;
}

interface ConversationFrame {
  id: number;
  sessionId: string;
  seq: number;
  observedAt: string;
  direction: "→" | "←";
  src: string;
  dst: string;
  protocol: ProtocolName;
  summary: string;
  bytes: number;
  anomalous: boolean;
  frameId: string | null;
  payloadHex: string;
}

const HOST_IP: Record<string, string> = {
  "ENG-WS-3": "10.4.12.65",
  "S7-CPU-413": "10.4.12.50",
  "HMI-A": "10.4.12.18",
  "PLC-Boiler-2": "10.4.12.41",
  "PLC-Reactor-1": "10.4.12.42",
  "RTU-Substation-7": "10.4.12.71",
};

const SESSION_DATE = "2026-04-17";

function tsToEpochMs(ts: string): number {
  // ts format "HH:MM:SS.mmm"
  const [hms, ms = "0"] = ts.split(".");
  const [hh, mm, ss] = hms.split(":").map((n) => Number.parseInt(n, 10));
  const millis = Number.parseInt(ms.padEnd(3, "0").slice(0, 3), 10);
  return Date.parse(`${SESSION_DATE}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}.${String(millis).padStart(3, "0")}Z`);
}

interface OtAsset {
  id: number;
  assetId: string;
  name: string;
  zone: string;
  protocol: ProtocolName;
  baseline: string;
  baselineLastComputedAt: string | null;
}

interface AnomalyScore {
  id: number;
  assetId: string;
  bucketAt: string;
  score: string;
  baselineSnapshot: string | null;
  reason: string | null;
}

const protocolColor: Record<ProtocolName, string> = {
  Modbus: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
  DNP3: "text-sky-300 border-sky-500/40 bg-sky-500/10",
  S7: "text-violet-300 border-violet-500/40 bg-violet-500/10",
};

const sevColor: Record<Severity, string> = {
  critical: "border-red-500/50 bg-red-500/10 text-red-300",
  high: "border-orange-500/50 bg-orange-500/10 text-orange-300",
  medium: "border-amber-500/50 bg-amber-500/10 text-amber-300",
  low: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
  info: "border-slate-500/50 bg-slate-500/10 text-slate-300",
};

const fieldFlagColor: Record<NonNullable<DecodedField["flag"]>, string> = {
  info: "text-slate-300",
  warn: "text-amber-300",
  anomaly: "text-red-300",
};

function heatColor(score: number, baseline: number): string {
  const ratio = score / Math.max(baseline, 1);
  if (ratio >= 5) return "bg-red-500/80 border-red-400";
  if (ratio >= 3) return "bg-orange-500/70 border-orange-400";
  if (ratio >= 2) return "bg-amber-500/60 border-amber-400";
  if (ratio >= 1.3) return "bg-yellow-500/40 border-yellow-500/60";
  return "bg-emerald-500/25 border-emerald-500/40";
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3 });
  } catch {
    return iso;
  }
}

const ACTIVE_SESSION_ID = "INC-2024-0329";
const HEATMAP_HOURS = 12;

export default function OtIcsDashboard() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"decoder" | "replay" | "heatmap">("decoder");
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [protocolFilter, setProtocolFilter] = useState<ProtocolName | "all">("all");
  const [replayIndex, setReplayIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
    const [replayProtocolFilter, setReplayProtocolFilter] = useState<ProtocolName | "all">("all");
    const [rangeStartIdx, setRangeStartIdx] = useState(0);
    const [rangeEndIdx, setRangeEndIdx] = useState(0);
    const [pcapDownloading, setPcapDownloading] = useState(false);
    const [pcapError, setPcapError] = useState<string | null>(null);
    const [pcapngDownloading, setPcapngDownloading] = useState(false);

    const framesQuery = useStandardQuery<DecodedFrame[]>({
      queryKey: ["ot-ics", "frames", protocolFilter],
      queryFn: () => api.otIcs.frames({ protocol: protocolFilter === "all" ? undefined : protocolFilter, limit: 100 }) as Promise<DecodedFrame[]>,
      refetchInterval: 15000,
    });

    const conversationQuery = useStandardQuery<ConversationFrame[]>({
      queryKey: ["ot-ics", "conversations", ACTIVE_SESSION_ID],
      queryFn: () => api.otIcs.conversations(ACTIVE_SESSION_ID) as Promise<ConversationFrame[]>,
      refetchInterval: 30000,
    });

    const assetsQuery = useStandardQuery<OtAsset[]>({
      queryKey: ["ot-ics", "assets"],
      queryFn: () => api.otIcs.assets() as Promise<OtAsset[]>,
    });

    const scoresQuery = useStandardQuery<AnomalyScore[]>({
      queryKey: ["ot-ics", "scores", HEATMAP_HOURS],
      queryFn: () => api.otIcs.anomalyScores({ hours: HEATMAP_HOURS }) as Promise<AnomalyScore[]>,
      refetchInterval: 30000,
    });

    const recomputeMutation = useStandardMutation({
      mutationFn: () => api.otIcs.recomputeBaselines(),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["ot-ics", "assets"] });
        qc.invalidateQueries({ queryKey: ["ot-ics", "scores"] });
      },
    });

    const frames = framesQuery.data ?? [];
    const conversation = conversationQuery.data ?? [];
    const assets = assetsQuery.data ?? [];
    const scores = scoresQuery.data ?? [];

    // Default selections
    useEffect(() => {
      if (!selectedFrameId && frames.length > 0) setSelectedFrameId(frames[0].frameId);
    }, [frames, selectedFrameId]);
    useEffect(() => {
      if (!selectedAsset && assets.length > 0) setSelectedAsset(assets[0].assetId);
    }, [assets, selectedAsset]);
    useEffect(() => {
      if (conversation.length > 0 && rangeStartIdx === 0 && rangeEndIdx === 0) {
        setRangeEndIdx(conversation.length - 1);
      }
    }, [conversation.length, rangeStartIdx, rangeEndIdx]);

    const selectedFrame = useMemo(
      () => frames.find((f) => f.frameId === selectedFrameId) ?? frames[0] ?? null,
      [frames, selectedFrameId],
    );

    // Bucket scores into per-asset hourly arrays for the heat map
    const scoresByAsset = useMemo(() => {
      const map = new Map<string, AnomalyScore[]>();
      for (const s of scores) {
        const list = map.get(s.assetId) ?? [];
        list.push(s);
        map.set(s.assetId, list);
      }
      for (const list of map.values()) list.sort((a, b) => new Date(a.bucketAt).getTime() - new Date(b.bucketAt).getTime());
      return map;
    }, [scores]);

    const selectedAssetData = useMemo(() => assets.find((a) => a.assetId === selectedAsset) ?? null, [assets, selectedAsset]);
    const selectedAssetScores = useMemo(
      () => (selectedAsset ? scoresByAsset.get(selectedAsset) ?? [] : []),
      [scoresByAsset, selectedAsset],
    );

    // Filtered conversation for replay (protocol + range filter)
    const filteredConversation = useMemo(() => {
      if (conversation.length === 0) return [];
      const start = Math.min(rangeStartIdx, rangeEndIdx);
      const end = Math.max(rangeStartIdx, rangeEndIdx);
      return conversation
        .slice(start, end + 1)
        .filter((f) => replayProtocolFilter === "all" || f.protocol === replayProtocolFilter);
    }, [conversation, replayProtocolFilter, rangeStartIdx, rangeEndIdx]);

    const safeReplayIndex = Math.max(0, Math.min(replayIndex, Math.max(filteredConversation.length - 1, 0)));
    const replayFrame = filteredConversation[safeReplayIndex] ?? null;

    // Reset playback when filters narrow the active set out of bounds.
    useEffect(() => {
      if (replayIndex >= filteredConversation.length) {
        setReplayIndex(Math.max(filteredConversation.length - 1, 0));
      }
    }, [filteredConversation.length, replayIndex]);

    const handleDownloadCapture = async (format: "pcap" | "pcapng") => {
      if (format === "pcap") setPcapDownloading(true);
      else setPcapngDownloading(true);
      setPcapError(null);
      try {
        // Each conversation frame ships its own authoritative payload hex, so the exported
        // capture carries real protocol bytes for every packet rather than zero-padding to
        // the reported byte count. Decoded frames continue to share the same bytes for the
        // anomalous packets, keeping the decoder tab consistent with the capture. The
        // pcapng path additionally enriches each packet with a per-frame comment, an
        // anomaly note, and the forensic event link so analysts can pivot from Wireshark
        // back into Aegis.
        const forensicById = new Map(frames.map((d) => [d.frameId, d.forensicEventId] as const));
        const framesPayload = filteredConversation.map((f) => {
          const fid = f.frameId;
          const forensicEventId = fid ? forensicById.get(fid) ?? undefined : undefined;
          return {
            ts: new Date(f.observedAt).getTime(),
            srcIp: HOST_IP[f.src] ?? "10.4.99.1",
            dstIp: HOST_IP[f.dst] ?? "10.4.99.2",
            protocol: f.protocol.toLowerCase() as "modbus" | "dnp3" | "s7",
            payloadHex: f.payloadHex ?? "",
            bytes: f.bytes,
            comment: format === "pcapng"
              ? `${f.protocol} #${f.seq} ${f.src} ${f.direction} ${f.dst} — ${f.summary}`
              : undefined,
            anomalyNote: format === "pcapng" && f.anomalous ? f.summary : undefined,
            forensicEventId: format === "pcapng" ? forensicEventId ?? undefined : undefined,
          };
        });
        const sessionId = `${ACTIVE_SESSION_ID}-${replayProtocolFilter}-${rangeStartIdx}-${rangeEndIdx}`;
        const startTs = framesPayload.length > 0 ? Math.min(...framesPayload.map((f) => f.ts)) : undefined;
        const endTs = framesPayload.length > 0 ? Math.max(...framesPayload.map((f) => f.ts)) : undefined;

        const readCookie = (name: string): string | null => {
          const match = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
          return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
        };
        let csrfToken = readCookie("csrf_token");
        if (!csrfToken) {
          const tokenRes = await fetch("/api/csrf-token", { credentials: "include" });
          if (tokenRes.ok) {
            const data = (await tokenRes.json()) as { csrfToken?: string };
            csrfToken = data.csrfToken ?? readCookie("csrf_token");
          }
        }

        const endpoint = format === "pcap" ? "/api/aegis/replay/pcap" : "/api/aegis/replay/pcapng";
        const res = await fetch(endpoint, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({
            sessionId,
            frames: framesPayload,
            filter: {
              protocol: replayProtocolFilter === "all" ? "all" : (replayProtocolFilter.toLowerCase() as "modbus" | "dnp3" | "s7"),
              startTs,
              endTs,
            },
          }),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error((errBody as { error?: string }).error ?? `HTTP ${res.status}`);
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${sessionId}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        setPcapError(err instanceof Error ? err.message : `Failed to export ${format.toUpperCase()}`);
      } finally {
        if (format === "pcap") setPcapDownloading(false);
        else setPcapngDownloading(false);
      }
    };

    const handleDownloadPcap = () => handleDownloadCapture("pcap");
    const handleDownloadPcapng = () => handleDownloadCapture("pcapng");

    // KPIs (computed from real data)
    const activeAnomalies = scores.filter((s) => Number(s.score) >= Number(s.baselineSnapshot ?? 10) * 2).length;
    const meanScore = scores.length > 0 ? Math.round(scores.reduce((a, s) => a + Number(s.score), 0) / scores.length) : 0;
    const meanBaseline = assets.length > 0 ? assets.reduce((a, b) => a + Number(b.baseline), 0) / assets.length : 0;
    const driftPct = meanBaseline > 0 ? Math.round(((meanScore / meanBaseline) - 1) * 100) : 0;
    const protoCounts = frames.reduce<Record<ProtocolName, number>>((acc, f) => {
      acc[f.protocol] = (acc[f.protocol] ?? 0) + 1;
      return acc;
    }, { Modbus: 0, DNP3: 0, S7: 0 });
    const totalFrames = frames.length || 1;
    const protoMix = `Modbus ${Math.round((protoCounts.Modbus / totalFrames) * 100)}% · DNP3 ${Math.round((protoCounts.DNP3 / totalFrames) * 100)}% · S7 ${Math.round((protoCounts.S7 / totalFrames) * 100)}%`;

    const tickPlayback = () => setReplayIndex((i) => Math.min(Math.max(0, filteredConversation.length - 1), i + 1));

    useEffect(() => {
      if (!playing || filteredConversation.length === 0) return;
      const id = setInterval(() => {
        setReplayIndex((i) => {
          if (i >= filteredConversation.length - 1) {
            setPlaying(false);
            return i;
          }
          return i + 1;
        });
      }, 1200);
      return () => clearInterval(id);
    }, [playing, filteredConversation.length]);

    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Factory className="w-6 h-6 text-primary" />
              OT / ICS Security
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Protocol-aware monitoring for Modbus, DNP3, and S7. Live decoder, conversation replay, and per-asset anomaly scoring.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => recomputeMutation.mutate()}
              disabled={recomputeMutation.isPending}
              className="text-xs px-3 py-2 rounded-lg border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition flex items-center gap-2 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${recomputeMutation.isPending ? "animate-spin" : ""}`} />
              {recomputeMutation.isPending ? "Recomputing…" : "Recompute baselines"}
            </button>
            <Link
              href="/forensics"
              className="text-xs px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/5 text-amber-300 hover:bg-amber-500/10 transition flex items-center gap-2"
            >
              <Flame className="w-3.5 h-3.5" /> Open in Forensics Timeline
            </Link>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard icon={<Cpu className="w-4 h-4 text-primary" />} label="OT Assets Monitored" value={assets.length.toLocaleString()} trend={`${new Set(assets.map((a) => a.zone)).size} zones`} />
          <KpiCard icon={<Radio className="w-4 h-4 text-emerald-400" />} label="Frames Decoded" value={frames.length.toLocaleString()} trend={protoMix} />
          <KpiCard icon={<AlertTriangle className="w-4 h-4 text-red-400" />} label="Active Protocol Anomalies" value={String(activeAnomalies)} trend={`${frames.filter((f) => f.severity === "critical").length} critical · ${frames.filter((f) => f.severity === "high").length} high`} critical={activeAnomalies > 0} />
          <KpiCard icon={<Gauge className="w-4 h-4 text-amber-400" />} label="Mean Anomaly Score" value={`${meanScore} / 100`} trend={`Baseline ${Math.round(meanBaseline)} · drift ${driftPct >= 0 ? "+" : ""}${driftPct}%`} />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-white/10">
          <TabButton active={tab === "decoder"} onClick={() => setTab("decoder")} icon={<Network className="w-3.5 h-3.5" />}>
            Protocol Decoder
          </TabButton>
          <TabButton active={tab === "replay"} onClick={() => setTab("replay")} icon={<Play className="w-3.5 h-3.5" />}>
            Conversation Replay
          </TabButton>
          <TabButton active={tab === "heatmap"} onClick={() => setTab("heatmap")} icon={<Activity className="w-3.5 h-3.5" />}>
            Anomaly Heat Map
          </TabButton>
        </div>

        {/* Decoder */}
        {tab === "decoder" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 space-y-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Protocol:</span>
                {(["all", "Modbus", "DNP3", "S7"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setProtocolFilter(p)}
                    className={`px-2 py-1 rounded border transition ${
                      protocolFilter === p
                        ? "border-primary/60 bg-primary/15 text-primary"
                        : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                    }`}
                  >
                    {p === "all" ? "All" : p}
                  </button>
                ))}
              </div>
              <StateView
                isLoading={framesQuery.isLoading}
                error={framesQuery.error}
                isEmpty={!framesQuery.isLoading && frames.length === 0}
                emptyMessage="No decoded frames yet. The capture pipeline will populate this view as traffic arrives."
              >
                <div className="rounded-xl border border-white/10 bg-white/[0.02] divide-y divide-white/5 overflow-hidden">
                  {frames.map((frame) => {
                    const active = selectedFrame && frame.frameId === selectedFrame.frameId;
                    return (
                      <button
                        key={frame.frameId}
                        onClick={() => setSelectedFrameId(frame.frameId)}
                        className={`w-full text-left p-3 transition ${active ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-white/5 border-l-2 border-transparent"}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${protocolColor[frame.protocol]}`}>
                            {frame.protocol}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">{formatTime(frame.observedAt)}</span>
                        </div>
                        <p className="text-xs font-medium mt-2">{frame.functionLabel}</p>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{frame.summary}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] font-mono text-muted-foreground">{frame.frameId}</span>
                          <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded border ${sevColor[frame.severity]}`}>{frame.severity}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </StateView>
            </div>

            <div className="lg:col-span-2 space-y-4">
              {selectedFrame ? (
                <>
                  <div className={`rounded-xl border p-4 ${sevColor[selectedFrame.severity]}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider opacity-80">{selectedFrame.protocol} · {selectedFrame.functionLabel}</p>
                        <p className="text-sm font-medium mt-1">{selectedFrame.summary}</p>
                      </div>
                      <span className="text-[10px] font-mono opacity-80">{selectedFrame.frameId} · {formatTime(selectedFrame.observedAt)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[11px] mt-3 opacity-90">
                      <div><span className="opacity-70">Source:</span> <span className="font-mono">{selectedFrame.src}</span></div>
                      <div><span className="opacity-70">Destination:</span> <span className="font-mono">{selectedFrame.dst}</span></div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs uppercase tracking-wider text-muted-foreground">Field-Level Decode</h3>
                      {selectedFrame.forensicEventId && (
                        <Link href="/forensics" className="text-[10px] text-amber-300 hover:underline flex items-center gap-1">
                          Linked event {selectedFrame.forensicEventId} →
                        </Link>
                      )}
                    </div>
                    <div className="space-y-1">
                      {(selectedFrame.fields ?? []).map((f, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 px-2 py-2 rounded hover:bg-white/[0.03] text-[12px]">
                          <div className="col-span-4">
                            <p className="font-medium">{f.name}</p>
                            {f.note && <p className={`text-[10px] mt-0.5 ${f.flag ? fieldFlagColor[f.flag] : "text-muted-foreground"}`}>{f.note}</p>}
                          </div>
                          <div className={`col-span-5 font-mono ${f.flag ? fieldFlagColor[f.flag] : "text-slate-200"}`}>{f.value}</div>
                          <div className="col-span-3 font-mono text-[10px] text-muted-foreground tracking-wider text-right">{f.bytes}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                    <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Raw Frame</h3>
                    <pre className="font-mono text-[11px] text-emerald-300/90 whitespace-pre-wrap break-all">{selectedFrame.rawHex}</pre>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center text-xs text-muted-foreground">
                  Select a frame to inspect its decoded fields.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Replay */}
        {tab === "replay" && (
          <StateView
            isLoading={conversationQuery.isLoading}
            error={conversationQuery.error}
            isEmpty={!conversationQuery.isLoading && conversation.length === 0}
            emptyMessage="No conversation captured for the active session yet."
          >
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Session Replay — {ACTIVE_SESSION_ID}</p>
                    <p className="text-sm font-medium">
                      Frame {filteredConversation.length === 0 ? 0 : safeReplayIndex + 1} of {filteredConversation.length}{replayFrame ? ` · ${formatTime(replayFrame.observedAt)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <ReplayBtn onClick={() => setReplayIndex(0)} icon={<SkipBack className="w-3.5 h-3.5" />} label="Restart" />
                    <ReplayBtn onClick={() => setReplayIndex((i) => Math.max(0, i - 1))} icon={<ChevronLeft className="w-3.5 h-3.5" />} label="Prev" />
                    <button
                      onClick={() => setPlaying((p) => !p)}
                      className="px-3 py-1.5 rounded-lg border border-primary/60 bg-primary/20 text-primary text-xs font-medium flex items-center gap-1.5 hover:bg-primary/30"
                    >
                      {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {playing ? "Pause" : "Play"}
                    </button>
                    <ReplayBtn onClick={tickPlayback} icon={<ChevronRight className="w-3.5 h-3.5" />} label="Next" />
                    <ReplayBtn onClick={() => setReplayIndex(Math.max(0, filteredConversation.length - 1))} icon={<SkipForward className="w-3.5 h-3.5" />} label="End" />
                    <button
                      onClick={handleDownloadPcap}
                      disabled={pcapDownloading || pcapngDownloading || filteredConversation.length === 0}
                      data-testid="button-download-pcap"
                      title="Export the current session frames as a .pcap file for Wireshark, Zeek, or other forensics tools"
                      className="px-3 py-1.5 rounded-lg border border-emerald-500/50 bg-emerald-500/10 text-emerald-300 text-xs font-medium flex items-center gap-1.5 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {pcapDownloading ? "Exporting…" : "Download PCAP"}
                    </button>
                    <button
                      onClick={handleDownloadPcapng}
                      disabled={pcapDownloading || pcapngDownloading || filteredConversation.length === 0}
                      data-testid="button-download-pcapng"
                      title="Export as PCAPNG with per-packet anomaly notes and forensic event IDs as Wireshark Frame > Packet comments"
                      className="px-3 py-1.5 rounded-lg border border-cyan-500/50 bg-cyan-500/10 text-cyan-300 text-xs font-medium flex items-center gap-1.5 hover:bg-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {pcapngDownloading ? "Exporting…" : "Download PCAPNG"}
                    </button>
                  </div>
                </div>

                {/* Filter / range controls */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                  <div>
                    <p className="uppercase tracking-wider text-muted-foreground mb-1.5">Protocol Filter</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(["all", "Modbus", "DNP3", "S7"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => {
                            setReplayProtocolFilter(p as ProtocolName | "all");
                            setReplayIndex(0);
                          }}
                          data-testid={`button-replay-filter-${p}`}
                          className={`px-2 py-1 rounded border transition ${
                            replayProtocolFilter === p
                              ? "border-primary/60 bg-primary/15 text-primary"
                              : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                          }`}
                        >
                          {p === "all" ? "All" : p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="uppercase tracking-wider text-muted-foreground mb-1.5">Range Start</p>
                    <select
                      value={rangeStartIdx}
                      onChange={(e) => {
                        const v = Number.parseInt(e.target.value, 10);
                        setRangeStartIdx(v);
                        if (v > rangeEndIdx) setRangeEndIdx(v);
                        setReplayIndex(0);
                      }}
                      data-testid="select-range-start"
                      className="w-full px-2 py-1.5 rounded border border-white/10 bg-black/40 font-mono text-[11px]"
                    >
                      {conversation.map((f, i) => (
                        <option key={f.id} value={i}>{formatTime(f.observedAt)} · #{f.seq} {f.protocol}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="uppercase tracking-wider text-muted-foreground mb-1.5">Range End</p>
                    <select
                      value={rangeEndIdx}
                      onChange={(e) => {
                        const v = Number.parseInt(e.target.value, 10);
                        setRangeEndIdx(v);
                        if (v < rangeStartIdx) setRangeStartIdx(v);
                        setReplayIndex(0);
                      }}
                      data-testid="select-range-end"
                      className="w-full px-2 py-1.5 rounded border border-white/10 bg-black/40 font-mono text-[11px]"
                    >
                      {conversation.map((f, i) => (
                        <option key={f.id} value={i}>{formatTime(f.observedAt)} · #{f.seq} {f.protocol}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {pcapError && (
                  <div className="mt-3 px-3 py-2 rounded border border-red-500/40 bg-red-500/10 text-[11px] text-red-300" role="alert">
                    PCAP export failed: {pcapError}
                  </div>
                )}

                {/* Progress bar */}
                <div className="mt-4 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${filteredConversation.length === 0 ? 0 : ((safeReplayIndex + 1) / filteredConversation.length) * 100}%` }}
                  />
                </div>

                {/* Current frame card */}
                {replayFrame && (
                  <div className={`mt-4 p-3 rounded-lg border ${replayFrame.anomalous ? "border-red-500/40 bg-red-500/10" : "border-white/10 bg-white/[0.03]"}`}>
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className={`px-1.5 py-0.5 rounded border ${protocolColor[replayFrame.protocol]}`}>{replayFrame.protocol}</span>
                      <span>{replayFrame.src}</span>
                      <span className="text-muted-foreground">{replayFrame.direction}</span>
                      <span>{replayFrame.dst}</span>
                      <span className="ml-auto text-muted-foreground">{replayFrame.bytes} bytes</span>
                    </div>
                    <p className={`mt-2 text-sm ${replayFrame.anomalous ? "text-red-200" : ""}`}>
                      {replayFrame.anomalous && <AlertTriangle className="inline w-3.5 h-3.5 mr-1 text-red-400" />}
                      {replayFrame.summary}
                    </p>
                  </div>
                )}
              </div>

              {/* Frame ladder */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                <table className="w-full text-[11px]">
                  <thead className="bg-white/5 text-muted-foreground uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="text-left px-3 py-2">#</th>
                      <th className="text-left px-3 py-2">Time</th>
                      <th className="text-left px-3 py-2">Source</th>
                      <th className="text-left px-3 py-2">Dst</th>
                      <th className="text-left px-3 py-2">Proto</th>
                      <th className="text-left px-3 py-2">Summary</th>
                      <th className="text-right px-3 py-2">Bytes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredConversation.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                          No frames match the selected protocol filter and time range.
                        </td>
                      </tr>
                    )}
                    {filteredConversation.map((f, idx) => {
                      const active = idx === safeReplayIndex;
                      return (
                        <tr
                          key={f.id}
                          onClick={() => setReplayIndex(idx)}
                          className={`cursor-pointer border-t border-white/5 ${
                            active ? "bg-primary/15" : f.anomalous ? "bg-red-500/[0.04] hover:bg-red-500/10" : "hover:bg-white/5"
                          }`}
                        >
                          <td className="px-3 py-1.5 font-mono">{f.seq}</td>
                          <td className="px-3 py-1.5 font-mono text-muted-foreground">{formatTime(f.observedAt)}</td>
                          <td className="px-3 py-1.5 font-mono">{f.src}</td>
                          <td className="px-3 py-1.5 font-mono">{f.dst}</td>
                          <td className="px-3 py-1.5">
                            <span className={`px-1.5 py-0.5 rounded border text-[10px] ${protocolColor[f.protocol]}`}>{f.protocol}</span>
                          </td>
                          <td className="px-3 py-1.5">
                            {f.anomalous && <AlertTriangle className="inline w-3 h-3 mr-1 text-red-400" />}
                            {f.summary}
                          </td>
                          <td className="px-3 py-1.5 font-mono text-right text-muted-foreground">{f.bytes}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </StateView>
        )}

      {/* Heat map */}
      {tab === "heatmap" && (
        <StateView
          isLoading={assetsQuery.isLoading || scoresQuery.isLoading}
          error={assetsQuery.error ?? scoresQuery.error}
          isEmpty={!assetsQuery.isLoading && assets.length === 0}
          emptyMessage="No assets are being monitored yet. Onboard OT/ICS assets to start collecting baselines."
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 overflow-x-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground">Protocol Anomaly Score · Last {HEATMAP_HOURS} hours</h3>
                <div className="flex items-center gap-2 text-[10px]">
                  <Legend swatch="bg-emerald-500/30" label="Baseline" />
                  <Legend swatch="bg-yellow-500/40" label="1.3×" />
                  <Legend swatch="bg-amber-500/60" label="2×" />
                  <Legend swatch="bg-orange-500/70" label="3×" />
                  <Legend swatch="bg-red-500/80" label="5×+" />
                </div>
              </div>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left pr-3 py-1 font-normal">Asset</th>
                    <th className="text-left pr-3 py-1 font-normal">Zone</th>
                    <th className="text-left pr-3 py-1 font-normal">Proto</th>
                    {Array.from({ length: HEATMAP_HOURS }).map((_, h) => (
                      <th key={h} className="px-1 py-1 font-normal text-center">{`${HEATMAP_HOURS - 1 - h}h`}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assets.map((a) => {
                    const baseline = Number(a.baseline);
                    const series = scoresByAsset.get(a.assetId) ?? [];
                    // Project series to fixed-width grid (oldest → newest)
                    const cells: Array<AnomalyScore | null> = Array(HEATMAP_HOURS).fill(null);
                    if (series.length > 0) {
                      const last = series[series.length - 1];
                      const lastBucket = new Date(last.bucketAt).getTime();
                      for (const s of series) {
                        const offset = Math.round((lastBucket - new Date(s.bucketAt).getTime()) / (60 * 60 * 1000));
                        const idx = HEATMAP_HOURS - 1 - offset;
                        if (idx >= 0 && idx < HEATMAP_HOURS) cells[idx] = s;
                      }
                    }
                    return (
                      <tr
                        key={a.assetId}
                        onClick={() => setSelectedAsset(a.assetId)}
                        className={`cursor-pointer border-t border-white/5 ${selectedAsset === a.assetId ? "bg-primary/10" : "hover:bg-white/5"}`}
                      >
                        <td className="pr-3 py-1.5 font-medium">{a.name}</td>
                        <td className="pr-3 py-1.5 text-muted-foreground">{a.zone}</td>
                        <td className="pr-3 py-1.5">
                          <span className={`px-1.5 py-0.5 rounded border text-[10px] ${protocolColor[a.protocol]}`}>{a.protocol}</span>
                        </td>
                        {cells.map((s, i) => (
                          <td key={i} className="px-0.5 py-1">
                            <div
                              title={s ? `Score ${s.score} (baseline ${baseline})` : "Score unavailable"}
                              className={`h-6 rounded border ${s ? heatColor(Number(s.score), baseline) : "bg-white/5 border-white/10"}`}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Asset Detail
              </h3>
              {selectedAssetData ? (
                <>
                  <div>
                    <p className="text-sm font-semibold">{selectedAssetData.name}</p>
                    <p className="text-[11px] text-muted-foreground">{selectedAssetData.zone} · {selectedAssetData.protocol}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <Stat label="Baseline" value={String(Math.round(Number(selectedAssetData.baseline)))} />
                    <Stat label="Current" value={selectedAssetScores.length > 0 ? String(Math.round(Number(selectedAssetScores[selectedAssetScores.length - 1].score))) : "—"} highlight />
                    <Stat label="Peak" value={selectedAssetScores.length > 0 ? String(Math.round(Math.max(...selectedAssetScores.map((s) => Number(s.score))))) : "—"} />
                    <Stat
                      label="Drift"
                      value={
                        selectedAssetScores.length > 0
                          ? `+${Math.round(((Number(selectedAssetScores[selectedAssetScores.length - 1].score) / Math.max(Number(selectedAssetData.baseline), 1)) - 1) * 100)}%`
                          : "—"
                      }
                      highlight
                    />
                  </div>
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <p className="text-[11px] text-muted-foreground">Top deviations</p>
                    {selectedAssetScores.filter((s) => s.reason).slice(-3).reverse().map((s) => (
                      <DeviationRow key={s.id} label={formatTime(s.bucketAt)} value={s.reason ?? ""} />
                    ))}
                    {selectedAssetScores.filter((s) => s.reason).length === 0 && (
                      <p className="text-[11px] text-muted-foreground">No deviation reasons recorded for this window.</p>
                    )}
                  </div>
                  {selectedAssetData.baselineLastComputedAt && (
                    <p className="text-[10px] text-muted-foreground">
                      Baseline last computed {new Date(selectedAssetData.baselineLastComputedAt).toLocaleString()}
                    </p>
                  )}
                  <div className="flex flex-col gap-2 pt-2">
                    <Link
                      href="/forensics"
                      className="text-[11px] px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/5 text-amber-300 hover:bg-amber-500/10 flex items-center justify-center gap-1.5"
                    >
                      <Flame className="w-3.5 h-3.5" /> Pivot to Forensics Timeline
                    </Link>
                    <Link
                      href="/xdr-console"
                      className="text-[11px] px-3 py-2 rounded-lg border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" /> Open in XDR Console
                    </Link>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Select an asset to inspect its anomaly profile.</p>
              )}
            </div>
          </div>
        </StateView>
      )}

      {/* Footnote */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-[11px] text-muted-foreground flex items-center gap-2">
        <Settings className="w-3.5 h-3.5" />
        Decoder profiles: Modbus/TCP (RFC), DNP3 (IEEE 1815), S7Comm (PROFINET). Baselines learned over rolling 30-day window via trimmed-mean of hourly anomaly scores.
      </div>
    </div>
  );
}

function StateView({
  isLoading,
  error,
  isEmpty,
  emptyMessage,
  children,
}: {
  isLoading: boolean;
  error: unknown;
  isEmpty: boolean;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center text-xs text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-xs text-red-300">
        Failed to load data: {(error as Error)?.message ?? "unknown error"}
      </div>
    );
  }
  if (isEmpty) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center text-xs text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }
  return <>{children}</>;
}

function KpiCard({ icon, label, value, trend, critical }: { icon: React.ReactNode; label: string; value: string; trend: string; critical?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${critical ? "border-red-500/30 bg-red-500/5" : "border-white/10 bg-white/[0.02]"}`}>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="text-xl font-display font-semibold mt-1.5">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1">{trend}</p>
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-xs font-medium border-b-2 transition flex items-center gap-1.5 ${
        active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function ReplayBtn({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-1.5 rounded-lg border border-white/10 bg-white/5 text-muted-foreground text-xs flex items-center gap-1 hover:bg-white/10"
    >
      {icon}
      {label}
    </button>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-muted-foreground">
      <span className={`inline-block w-3 h-3 rounded ${swatch}`} />
      {label}
    </span>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${highlight ? "text-amber-300" : ""}`}>{value}</p>
    </div>
  );
}

function DeviationRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[11px] gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-amber-300 truncate max-w-[60%] text-right">{value}</span>
    </div>
  );
}
