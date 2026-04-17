import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
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
  Settings,
  Shield,
  SkipBack,
  SkipForward,
  Zap,
} from "lucide-react";

type ProtocolName = "Modbus" | "DNP3" | "S7";

interface DecodedField {
  name: string;
  value: string;
  bytes: string;
  note?: string;
  flag?: "info" | "warn" | "anomaly";
}

interface DecodedFrame {
  id: string;
  ts: string;
  protocol: ProtocolName;
  src: string;
  dst: string;
  function: string;
  summary: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  rawHex: string;
  fields: DecodedField[];
  forensicEventId?: string;
}

interface ConversationFrame {
  seq: number;
  ts: string;
  direction: "→" | "←";
  src: string;
  dst: string;
  protocol: ProtocolName;
  summary: string;
  bytes: number;
  anomalous: boolean;
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
  id: string;
  name: string;
  zone: string;
  protocol: ProtocolName;
  baseline: number;
  scores: number[];
}

const decodedFrames: DecodedFrame[] = [
  {
    id: "PKT-MB-2031",
    ts: "14:23:45.122",
    protocol: "Modbus",
    src: "10.4.12.18 (HMI-A)",
    dst: "10.4.12.41 (PLC-Boiler-2)",
    function: "FC=06 Write Single Register",
    summary: "Write 0x07D0 (2000) to register 40021 — boiler setpoint override",
    severity: "critical",
    rawHex: "00 19 00 00 00 06 01 06 00 14 07 D0",
    forensicEventId: "FE-006",
    fields: [
      { name: "Transaction ID", value: "0x0019 (25)", bytes: "00 19" },
      { name: "Protocol ID", value: "0x0000 (Modbus)", bytes: "00 00" },
      { name: "Length", value: "6 bytes", bytes: "00 06" },
      { name: "Unit ID", value: "0x01 (PLC-Boiler-2)", bytes: "01" },
      { name: "Function Code", value: "0x06 — Write Single Register", bytes: "06", flag: "warn" },
      { name: "Register Address", value: "40021 (Boiler Setpoint)", bytes: "00 14", flag: "anomaly", note: "Outside engineering-approved range" },
      { name: "Value", value: "2000 (target °C × 10)", bytes: "07 D0", flag: "anomaly", note: "Exceeds safety ceiling 850 °C × 10" },
    ],
  },
  {
    id: "PKT-DNP-1188",
    ts: "14:23:31.004",
    protocol: "DNP3",
    src: "10.4.12.41 (PLC-Boiler-2)",
    dst: "10.4.12.18 (HMI-A)",
    function: "FC=01 Read / Class 0 Poll Response",
    summary: "Analog Input 12 reporting 1418 (pressure psi) — above operating envelope",
    severity: "high",
    rawHex: "05 64 1A 44 03 00 04 00 BD 71 C0 C7 81 00 00 1E 02 00 00 00 00 8A 05",
    forensicEventId: "FE-007",
    fields: [
      { name: "Start Bytes", value: "0x0564", bytes: "05 64" },
      { name: "Length", value: "26", bytes: "1A" },
      { name: "Control", value: "0x44 PRM=1 FCB=0 FCV=0 FC=4", bytes: "44" },
      { name: "Destination", value: "3", bytes: "03 00" },
      { name: "Source", value: "4", bytes: "04 00" },
      { name: "App Header", value: "FIR=1 FIN=1 SEQ=0 FC=129 (Response)", bytes: "C7 81" },
      { name: "Object 30 Var 2", value: "Analog Input #12 = 1418", bytes: "1E 02 00 00 00 8A 05", flag: "anomaly", note: "Baseline 740 ±60" },
    ],
  },
  {
    id: "PKT-S7-0911",
    ts: "14:22:58.610",
    protocol: "S7",
    src: "10.4.12.65 (ENG-WS-3)",
    dst: "10.4.12.50 (S7-CPU-413)",
    function: "Job — PLC STOP",
    summary: "Engineering workstation issued PLC STOP outside change window",
    severity: "critical",
    rawHex: "03 00 00 21 02 F0 80 32 01 00 00 04 00 00 0E 00 00 05 01 12 04 11 44 01 00 FF 09 00 04 00 01 00 00",
    forensicEventId: "FE-008",
    fields: [
      { name: "TPKT Header", value: "Version 3, Length 33", bytes: "03 00 00 21" },
      { name: "COTP", value: "DT TPDU", bytes: "02 F0 80" },
      { name: "S7 Protocol ID", value: "0x32", bytes: "32" },
      { name: "ROSCTR", value: "0x01 Job", bytes: "01" },
      { name: "Function", value: "0x29 — PLC STOP", bytes: "29", flag: "anomaly", note: "Stop command from non-approved host" },
      { name: "PI Service", value: "P_PROGRAM", bytes: "50 5F 50 52 4F 47 52 41 4D" },
    ],
  },
  {
    id: "PKT-MB-2032",
    ts: "14:23:46.881",
    protocol: "Modbus",
    src: "10.4.12.18 (HMI-A)",
    dst: "10.4.12.41 (PLC-Boiler-2)",
    function: "FC=03 Read Holding Registers",
    summary: "Verification read of register 40021 returns 2000",
    severity: "medium",
    rawHex: "00 1A 00 00 00 06 01 03 00 14 00 01",
    fields: [
      { name: "Transaction ID", value: "0x001A (26)", bytes: "00 1A" },
      { name: "Function Code", value: "0x03 Read Holding", bytes: "03" },
      { name: "Register Start", value: "40021", bytes: "00 14" },
      { name: "Quantity", value: "1", bytes: "00 01" },
    ],
  },
];

const conversation: ConversationFrame[] = [
  { seq: 1, ts: "14:22:55.001", direction: "→", src: "ENG-WS-3", dst: "S7-CPU-413", protocol: "S7", summary: "TCP SYN — Port 102", bytes: 60, anomalous: false },
  { seq: 2, ts: "14:22:55.014", direction: "←", src: "S7-CPU-413", dst: "ENG-WS-3", protocol: "S7", summary: "SYN/ACK", bytes: 60, anomalous: false },
  { seq: 3, ts: "14:22:55.230", direction: "→", src: "ENG-WS-3", dst: "S7-CPU-413", protocol: "S7", summary: "COTP CR Connect Request", bytes: 22, anomalous: false },
  { seq: 4, ts: "14:22:55.241", direction: "←", src: "S7-CPU-413", dst: "ENG-WS-3", protocol: "S7", summary: "COTP CC Connect Confirm", bytes: 22, anomalous: false },
  { seq: 5, ts: "14:22:55.402", direction: "→", src: "ENG-WS-3", dst: "S7-CPU-413", protocol: "S7", summary: "Setup Communication", bytes: 25, anomalous: false },
  { seq: 6, ts: "14:22:58.610", direction: "→", src: "ENG-WS-3", dst: "S7-CPU-413", protocol: "S7", summary: "PLC STOP — UNAUTHORIZED", bytes: 33, anomalous: true },
  { seq: 7, ts: "14:23:14.330", direction: "→", src: "HMI-A", dst: "PLC-Boiler-2", protocol: "Modbus", summary: "Read Holding 40000-40020 (baseline scan)", bytes: 12, anomalous: false },
  { seq: 8, ts: "14:23:31.004", direction: "←", src: "PLC-Boiler-2", dst: "HMI-A", protocol: "DNP3", summary: "AI #12 reading anomalous (1418 psi)", bytes: 26, anomalous: true },
  { seq: 9, ts: "14:23:45.122", direction: "→", src: "HMI-A", dst: "PLC-Boiler-2", protocol: "Modbus", summary: "Write 40021 = 2000 (override setpoint)", bytes: 12, anomalous: true },
  { seq: 10, ts: "14:23:46.881", direction: "→", src: "HMI-A", dst: "PLC-Boiler-2", protocol: "Modbus", summary: "Read-back 40021 (confirm tamper)", bytes: 12, anomalous: false },
];

const otAssets: OtAsset[] = [
  { id: "PLC-Boiler-2", name: "PLC-Boiler-2", zone: "Process Zone A", protocol: "Modbus", baseline: 14, scores: [11, 13, 12, 14, 16, 18, 22, 28, 41, 67, 88, 92] },
  { id: "S7-CPU-413", name: "S7-CPU-413", zone: "Process Zone A", protocol: "S7", baseline: 9, scores: [8, 9, 10, 9, 11, 12, 14, 19, 31, 58, 81, 84] },
  { id: "PLC-Reactor-1", name: "PLC-Reactor-1", zone: "Process Zone B", protocol: "DNP3", baseline: 12, scores: [10, 11, 12, 13, 13, 14, 14, 15, 16, 21, 27, 34] },
  { id: "HMI-A", name: "HMI-A (Operator)", zone: "Control Room", protocol: "Modbus", baseline: 18, scores: [16, 17, 18, 19, 19, 20, 22, 26, 35, 48, 61, 73] },
  { id: "RTU-Substation-7", name: "RTU-Substation-7", zone: "Substation North", protocol: "DNP3", baseline: 11, scores: [9, 10, 11, 11, 12, 13, 13, 14, 14, 15, 16, 17] },
  { id: "ENG-WS-3", name: "ENG-WS-3", zone: "Engineering", protocol: "S7", baseline: 7, scores: [6, 7, 7, 8, 8, 9, 11, 18, 39, 71, 89, 95] },
];

const protocolColor: Record<ProtocolName, string> = {
  Modbus: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
  DNP3: "text-sky-300 border-sky-500/40 bg-sky-500/10",
  S7: "text-violet-300 border-violet-500/40 bg-violet-500/10",
};

const sevColor: Record<DecodedFrame["severity"], string> = {
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

export default function OtIcsDashboard() {
  const [tab, setTab] = useState<"decoder" | "replay" | "heatmap">("decoder");
  const [selectedFrameId, setSelectedFrameId] = useState(decodedFrames[0].id);
  const [protocolFilter, setProtocolFilter] = useState<ProtocolName | "all">("all");
  const [replayIndex, setReplayIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<string | null>("PLC-Boiler-2");
  const [replayProtocolFilter, setReplayProtocolFilter] = useState<ProtocolName | "all">("all");
  const [rangeStartIdx, setRangeStartIdx] = useState(0);
  const [rangeEndIdx, setRangeEndIdx] = useState(conversation.length - 1);
  const [pcapDownloading, setPcapDownloading] = useState(false);
  const [pcapError, setPcapError] = useState<string | null>(null);

  const filteredConversation = useMemo(() => {
    const start = Math.min(rangeStartIdx, rangeEndIdx);
    const end = Math.max(rangeStartIdx, rangeEndIdx);
    return conversation
      .slice(start, end + 1)
      .filter((f) => replayProtocolFilter === "all" || f.protocol === replayProtocolFilter);
  }, [replayProtocolFilter, rangeStartIdx, rangeEndIdx]);

  const safeReplayIndex = Math.max(0, Math.min(replayIndex, filteredConversation.length - 1));
  const activeReplayFrame = filteredConversation[safeReplayIndex] ?? conversation[0];

  // Reset playback when filters narrow the active set out of bounds.
  useEffect(() => {
    if (replayIndex >= filteredConversation.length) {
      setReplayIndex(Math.max(filteredConversation.length - 1, 0));
    }
  }, [filteredConversation.length, replayIndex]);

  const handleDownloadPcap = async () => {
    setPcapDownloading(true);
    setPcapError(null);
    try {
      const rawHexByTs = new Map(decodedFrames.map((d) => [d.ts, d.rawHex]));
      const framesPayload = filteredConversation.map((f) => {
        const srcHost = f.src;
        const dstHost = f.dst;
        return {
          ts: tsToEpochMs(f.ts),
          srcIp: HOST_IP[srcHost] ?? "10.4.99.1",
          dstIp: HOST_IP[dstHost] ?? "10.4.99.2",
          protocol: f.protocol.toLowerCase() as "modbus" | "dnp3" | "s7",
          payloadHex: rawHexByTs.get(f.ts),
          bytes: f.bytes,
        };
      });
      const sessionId = `INC-2024-0329-${replayProtocolFilter}-${rangeStartIdx}-${rangeEndIdx}`;
      const startTs = framesPayload.length > 0 ? Math.min(...framesPayload.map((f) => f.ts)) : undefined;
      const endTs = framesPayload.length > 0 ? Math.max(...framesPayload.map((f) => f.ts)) : undefined;

      // CSRF: read csrf_token cookie (auto-set on first GET) or fetch one.
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

      const res = await fetch("/api/aegis/replay/pcap", {
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
      a.download = `${sessionId}.pcap`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setPcapError(err instanceof Error ? err.message : "Failed to export PCAP");
    } finally {
      setPcapDownloading(false);
    }
  };

  const visibleFrames = useMemo(
    () => (protocolFilter === "all" ? decodedFrames : decodedFrames.filter((f) => f.protocol === protocolFilter)),
    [protocolFilter],
  );
  const selectedFrame = decodedFrames.find((f) => f.id === selectedFrameId) ?? decodedFrames[0];
  const replayFrame = activeReplayFrame;
  const selectedAssetData = otAssets.find((a) => a.id === selectedAsset) ?? null;

  const tickPlayback = () => {
    setReplayIndex((i) => Math.min(filteredConversation.length - 1, i + 1));
  };

  // Simple play loop: advance every 1.2s while playing
  useEffect(() => {
    if (!playing) return;
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
            Protocol-aware monitoring for Modbus, DNP3, and S7. Real-time decoder, conversation replay, and per-asset anomaly scoring.
          </p>
        </div>
        <Link
          href="/forensics"
          className="text-xs px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/5 text-amber-300 hover:bg-amber-500/10 transition flex items-center gap-2"
        >
          <Flame className="w-3.5 h-3.5" /> Open in Forensics Timeline
        </Link>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={<Cpu className="w-4 h-4 text-primary" />} label="OT Assets Monitored" value="247" trend="+12 this week" />
        <KpiCard icon={<Radio className="w-4 h-4 text-emerald-400" />} label="Frames Decoded / min" value="14,820" trend="Modbus 58% · DNP3 27% · S7 15%" />
        <KpiCard icon={<AlertTriangle className="w-4 h-4 text-red-400" />} label="Active Protocol Anomalies" value="7" trend="2 critical · 3 high" critical />
        <KpiCard icon={<Gauge className="w-4 h-4 text-amber-400" />} label="Mean Anomaly Score" value="42 / 100" trend="Baseline 11 · drift +280%" />
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
          {/* Frame list */}
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
            <div className="rounded-xl border border-white/10 bg-white/[0.02] divide-y divide-white/5 overflow-hidden">
              {visibleFrames.map((frame) => {
                const active = frame.id === selectedFrame.id;
                return (
                  <button
                    key={frame.id}
                    onClick={() => setSelectedFrameId(frame.id)}
                    className={`w-full text-left p-3 transition ${active ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-white/5 border-l-2 border-transparent"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${protocolColor[frame.protocol]}`}>
                        {frame.protocol}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">{frame.ts}</span>
                    </div>
                    <p className="text-xs font-medium mt-2">{frame.function}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{frame.summary}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] font-mono text-muted-foreground">{frame.id}</span>
                      <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded border ${sevColor[frame.severity]}`}>{frame.severity}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail */}
          <div className="lg:col-span-2 space-y-4">
            <div className={`rounded-xl border p-4 ${sevColor[selectedFrame.severity]}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider opacity-80">{selectedFrame.protocol} · {selectedFrame.function}</p>
                  <p className="text-sm font-medium mt-1">{selectedFrame.summary}</p>
                </div>
                <span className="text-[10px] font-mono opacity-80">{selectedFrame.id} · {selectedFrame.ts}</span>
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
                  <Link
                    href="/forensics"
                    className="text-[10px] text-amber-300 hover:underline flex items-center gap-1"
                  >
                    Linked event {selectedFrame.forensicEventId} →
                  </Link>
                )}
              </div>
              <div className="space-y-1">
                {selectedFrame.fields.map((f, i) => (
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
          </div>
        </div>
      )}

      {/* Replay */}
      {tab === "replay" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Session Replay — INC-2024-0329</p>
                <p className="text-sm font-medium">
                  Frame {filteredConversation.length === 0 ? 0 : safeReplayIndex + 1} of {filteredConversation.length} · {replayFrame.ts}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <ReplayBtn onClick={() => setReplayIndex(0)} icon={<SkipBack className="w-3.5 h-3.5" />} label="Restart" />
                <ReplayBtn
                  onClick={() => setReplayIndex((i) => Math.max(0, i - 1))}
                  icon={<ChevronLeft className="w-3.5 h-3.5" />}
                  label="Prev"
                />
                <button
                  onClick={() => setPlaying((p) => !p)}
                  className="px-3 py-1.5 rounded-lg border border-primary/60 bg-primary/20 text-primary text-xs font-medium flex items-center gap-1.5 hover:bg-primary/30"
                >
                  {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {playing ? "Pause" : "Play"}
                </button>
                <ReplayBtn onClick={tickPlayback} icon={<ChevronRight className="w-3.5 h-3.5" />} label="Next" />
                <ReplayBtn
                  onClick={() => setReplayIndex(Math.max(0, filteredConversation.length - 1))}
                  icon={<SkipForward className="w-3.5 h-3.5" />}
                  label="End"
                />
                <button
                  onClick={handleDownloadPcap}
                  disabled={pcapDownloading || filteredConversation.length === 0}
                  data-testid="button-download-pcap"
                  title="Export the current session frames as a .pcap file for Wireshark, Zeek, or other forensics tools"
                  className="px-3 py-1.5 rounded-lg border border-emerald-500/50 bg-emerald-500/10 text-emerald-300 text-xs font-medium flex items-center gap-1.5 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" />
                  {pcapDownloading ? "Exporting…" : "Download PCAP"}
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
                    <option key={f.seq} value={i}>{f.ts} · #{f.seq} {f.protocol}</option>
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
                    <option key={f.seq} value={i}>{f.ts} · #{f.seq} {f.protocol}</option>
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
                      key={f.seq}
                      onClick={() => setReplayIndex(idx)}
                      className={`cursor-pointer border-t border-white/5 ${
                        active ? "bg-primary/15" : f.anomalous ? "bg-red-500/[0.04] hover:bg-red-500/10" : "hover:bg-white/5"
                      }`}
                    >
                      <td className="px-3 py-1.5 font-mono">{f.seq}</td>
                      <td className="px-3 py-1.5 font-mono text-muted-foreground">{f.ts}</td>
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
      )}

      {/* Heat map */}
      {tab === "heatmap" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 overflow-x-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground">Protocol Anomaly Score · Last 12 hours</h3>
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
                  {Array.from({ length: 12 }).map((_, h) => (
                    <th key={h} className="px-1 py-1 font-normal text-center">{`${h * 1}h`}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {otAssets.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => setSelectedAsset(a.id)}
                    className={`cursor-pointer border-t border-white/5 ${selectedAsset === a.id ? "bg-primary/10" : "hover:bg-white/5"}`}
                  >
                    <td className="pr-3 py-1.5 font-medium">{a.name}</td>
                    <td className="pr-3 py-1.5 text-muted-foreground">{a.zone}</td>
                    <td className="pr-3 py-1.5">
                      <span className={`px-1.5 py-0.5 rounded border text-[10px] ${protocolColor[a.protocol]}`}>{a.protocol}</span>
                    </td>
                    {a.scores.map((s, i) => (
                      <td key={i} className="px-0.5 py-1">
                        <div
                          title={`Score ${s} (baseline ${a.baseline})`}
                          className={`h-6 rounded border ${heatColor(s, a.baseline)}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
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
                  <Stat label="Baseline" value={String(selectedAssetData.baseline)} />
                  <Stat label="Current" value={String(selectedAssetData.scores[selectedAssetData.scores.length - 1])} highlight />
                  <Stat label="Peak" value={String(Math.max(...selectedAssetData.scores))} />
                  <Stat
                    label="Drift"
                    value={`+${Math.round(((selectedAssetData.scores[selectedAssetData.scores.length - 1] / Math.max(selectedAssetData.baseline, 1)) - 1) * 100)}%`}
                    highlight
                  />
                </div>
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <p className="text-[11px] text-muted-foreground">Top deviations</p>
                  <DeviationRow label="Function code mix" value="FC=06 spike" />
                  <DeviationRow label="Off-hours writes" value="14× baseline" />
                  <DeviationRow label="Unauthorized peers" value="ENG-WS-3" />
                </div>
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
      )}

      {/* Footnote */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-[11px] text-muted-foreground flex items-center gap-2">
        <Settings className="w-3.5 h-3.5" />
        Decoder profiles: Modbus/TCP (RFC), DNP3 (IEEE 1815), S7Comm (PROFINET). Baselines learned over rolling 30-day window.
      </div>
    </div>
  );
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
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-amber-300">{value}</span>
    </div>
  );
}
