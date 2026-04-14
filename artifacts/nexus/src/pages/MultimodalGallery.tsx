import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Image, Volume2, Video, FileText, ChevronRight, Play, Pause, ZoomIn,
  MessageSquare, Clock, Target, Network, AlertTriangle, Check, X,
  Layers, Eye, Download, Filter, Search
} from "lucide-react";

interface EvidenceItem {
  id: string;
  type: "image" | "audio" | "video" | "text";
  title: string;
  source: string;
  timestamp: string;
  domain: string;
  confidence: number;
  aiAnnotations: string[];
  crossModalLinks: string[];
  riskLevel: "critical" | "high" | "medium" | "low";
  boundingBoxes?: Array<{ label: string; x: number; y: number; w: number; h: number; confidence: number }>;
  transcript?: string;
  duration?: string;
  keyframes?: string[];
}

const EVIDENCE: EvidenceItem[] = [
  {
    id: "ev-001", type: "image", title: "Vessel Deck Configuration — MV Aurora Star",
    source: "Satellite AIS Overlay · ESRI", timestamp: "2026-04-13 08:42 UTC", domain: "Maritime",
    confidence: 0.94, riskLevel: "high",
    aiAnnotations: [
      "Vessel identified: MV Aurora Star IMO 9712845",
      "AIS transponder gap: 14h 22m detected in prior 48h",
      "Cargo configuration inconsistent with declared manifest",
      "Port of registry flag matches secondary sanctions exposure",
    ],
    crossModalLinks: ["ev-002", "ev-003"],
    boundingBoxes: [
      { label: "Vessel ID: IMO 9712845", x: 15, y: 20, w: 70, h: 30, confidence: 0.94 },
      { label: "Cargo Anomaly Zone", x: 25, y: 55, w: 50, h: 20, confidence: 0.81 },
    ],
  },
  {
    id: "ev-002", type: "audio", title: "Port Authority Radio Intercept — Transcript",
    source: "SIGINT Feed · Classified", timestamp: "2026-04-12 14:18 UTC", domain: "Maritime",
    confidence: 0.87, riskLevel: "high",
    aiAnnotations: [
      "Speaker A: Port Authority Dispatch",
      "Speaker B: Unidentified vessel, matches Aurora Star callsign",
      "3 references to alternate cargo manifest detected",
      "Geolocation: 22°N 60°E — Omani territorial waters",
    ],
    crossModalLinks: ["ev-001", "ev-003"],
    duration: "4m 32s",
    transcript: "[14:18:04] DISPATCH: Aurora Star, confirm cargo manifest number?\n[14:18:11] VESSEL: Copy. Manifest Foxtrot-224... [inaudible] alternative.\n[14:18:19] DISPATCH: Please repeat, did you say alternative?\n[14:18:25] VESSEL: Negative. Foxtrot-224 is primary. Secondary documentation available on request.\n[14:18:34] DISPATCH: Roger. Proceed to berth 7A. Customs boarding at 16:00.",
  },
  {
    id: "ev-003", type: "video", title: "Port Departure CCTV — Container Transfer",
    source: "Port Authority CCTV · Dubai Jebel Ali", timestamp: "2026-04-11 22:55 UTC", domain: "Maritime",
    confidence: 0.78, riskLevel: "medium",
    aiAnnotations: [
      "4 unmarked containers loaded outside manifest window",
      "Night operation: 22:40–23:35 local time (minimizes customs visibility)",
      "Vehicle license plate partially obscured (intentional)",
      "3 individuals without port authority IDs identified",
    ],
    crossModalLinks: ["ev-001"],
    duration: "58m 14s",
    keyframes: ["22:40 — Truck arrival", "22:55 — Container transfer begins", "23:20 — Loading complete", "23:35 — Truck departure"],
  },
  {
    id: "ev-004", type: "text", title: "Corporate Registry Filing — Beneficial Ownership",
    source: "BVI Corporate Registry", timestamp: "2026-04-09 10:00 UTC", domain: "Maritime",
    confidence: 0.99, riskLevel: "critical",
    aiAnnotations: [
      "Ultimate beneficial owner: Rezai Maritime Holdings LLC (BVI)",
      "Cross-referenced to OFAC SDN List — secondary connection via Caspian Shipping Partners",
      "Shell company chain: 3 layers identified (BVI → Cyprus → Malta)",
      "Director: Ali Rezai (DOB 1971-03-14) — matches SDN entry #89241",
    ],
    crossModalLinks: ["ev-001", "ev-002"],
    transcript: "Company: Aurora Maritime Holdings Ltd\nJurisdiction: British Virgin Islands\nRegistration: BVI-2018-00412\nDirectors: Ali Rezai, Fatima Khalil\nShareholder: Rezai Maritime Holdings LLC (100%)\nUBO Analysis: See Schedule A...",
  },
  {
    id: "ev-005", type: "image", title: "Threat Actor Network — Geospatial Mapping",
    source: "OSINT / ACLED / UN Trade DB", timestamp: "2026-04-13 06:00 UTC", domain: "Security",
    confidence: 0.88, riskLevel: "critical",
    aiAnnotations: [
      "7 nodes identified in threat actor network",
      "Primary hub: Dubai — 4 registered entities",
      "Secondary hub: Tehran (via intermediary) — 3 identified",
      "Financial flows mapped: $12.4M via hawala network (estimated)",
    ],
    crossModalLinks: ["ev-004"],
    boundingBoxes: [
      { label: "Primary Hub (Dubai)", x: 60, y: 35, w: 25, h: 25, confidence: 0.95 },
      { label: "Secondary Hub (Tehran)", x: 15, y: 30, w: 22, h: 22, confidence: 0.82 },
      { label: "Transit Node (Muscat)", x: 55, y: 65, w: 18, h: 18, confidence: 0.77 },
    ],
  },
];

const RISK_CONFIG = {
  critical: { color: "#f43f5e", bg: "bg-red-500/10 border-red-500/25", label: "CRITICAL" },
  high: { color: "#f97316", bg: "bg-orange-500/10 border-orange-500/25", label: "HIGH" },
  medium: { color: "#f59e0b", bg: "bg-amber-500/10 border-amber-500/25", label: "MEDIUM" },
  low: { color: "#22c55e", bg: "bg-emerald-500/10 border-emerald-500/25", label: "LOW" },
};

const TYPE_ICON = { image: Image, audio: Volume2, video: Video, text: FileText };
const TYPE_COLOR = { image: "#3b82f6", audio: "#a78bfa", video: "#f97316", text: "#22d3ee" };

function ImageViewer({ item }: { item: EvidenceItem }) {
  const [showBoxes, setShowBoxes] = useState(true);
  return (
    <div className="space-y-3">
      <div className="relative bg-[hsl(228,25%,6%)] rounded-lg overflow-hidden" style={{ paddingTop: "60%" }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full relative">
            {/* Simulated satellite/image view */}
            <div className="w-full h-full" style={{ background: "linear-gradient(135deg, hsl(220,25%,8%) 0%, hsl(215,30%,12%) 50%, hsl(220,25%,8%) 100%)" }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-xs font-mono text-muted-foreground opacity-40">[SATELLITE/IMAGERY — CLASSIFIED]</div>
              </div>
              {/* Simulated terrain features */}
              <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 40% 40%, hsla(220,30%,20%,0.4) 0%, transparent 40%), radial-gradient(circle at 70% 60%, hsla(210,25%,15%,0.3) 0%, transparent 30%)" }} />
            </div>
            {showBoxes && item.boundingBoxes?.map((box, i) => (
              <div
                key={i}
                className="absolute border-2 flex items-start justify-start group"
                style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%`, borderColor: RISK_CONFIG[item.riskLevel].color }}
              >
                <div className="text-xs font-mono px-1 py-0.5 text-white leading-none absolute -top-5 left-0 whitespace-nowrap" style={{ background: RISK_CONFIG[item.riskLevel].color, fontSize: "9px" }}>
                  {box.label} ({(box.confidence * 100).toFixed(0)}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <button
        onClick={() => setShowBoxes(!showBoxes)}
        className={cn("flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors", showBoxes ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground")}
      >
        <Target className="w-3 h-3" /> {showBoxes ? "Hide" : "Show"} AI annotations
      </button>
    </div>
  );
}

function AudioViewer({ item }: { item: EvidenceItem }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0.3);

  return (
    <div className="space-y-3">
      <div className="bg-[hsl(228,25%,6%)] rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => setPlaying(!playing)}
            className="w-8 h-8 rounded-full bg-[hsl(258,80%,62%)] flex items-center justify-center text-white"
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>
          <div className="flex-1">
            <div className="h-8 flex items-center gap-px">
              {Array.from({ length: 60 }).map((_, i) => (
                <div
                  key={i}
                  className="w-0.5 rounded-full transition-all"
                  style={{
                    height: `${20 + Math.sin(i * 0.4) * 15 + Math.random() * 10}%`,
                    backgroundColor: i / 60 < progress ? "hsl(258,80%,62%)" : "hsl(228,20%,20%)",
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs font-mono text-muted-foreground mt-1">
              <span>01:23</span>
              <span>{item.duration}</span>
            </div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">Drag to seek</div>
      </div>
      {item.transcript && (
        <div className="bg-[hsl(228,25%,6%)] rounded-lg p-3 max-h-40 overflow-y-auto">
          <div className="text-xs font-mono text-muted-foreground mb-2">TRANSCRIPT</div>
          <pre className="text-xs text-foreground font-mono whitespace-pre-wrap leading-relaxed">{item.transcript}</pre>
        </div>
      )}
    </div>
  );
}

function VideoViewer({ item }: { item: EvidenceItem }) {
  return (
    <div className="space-y-3">
      <div className="bg-[hsl(228,25%,6%)] rounded-lg overflow-hidden" style={{ paddingTop: "56%" }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Video className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-30" />
            <div className="text-xs font-mono text-muted-foreground opacity-50">[CLASSIFIED CCTV FOOTAGE]</div>
          </div>
        </div>
      </div>
      {item.keyframes && (
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Key Frames</div>
          <div className="space-y-1.5">
            {item.keyframes.map((kf, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="w-1 h-1 rounded-full bg-[hsl(258,80%,62%)] flex-shrink-0" />
                <span className="text-foreground font-mono">{kf}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TextViewer({ item }: { item: EvidenceItem }) {
  return (
    <div className="bg-[hsl(228,25%,6%)] rounded-lg p-4 max-h-60 overflow-y-auto">
      <div className="text-xs font-mono text-muted-foreground mb-3 uppercase tracking-wider">Document Extract</div>
      <pre className="text-sm text-foreground font-mono whitespace-pre-wrap leading-relaxed">{item.transcript}</pre>
    </div>
  );
}

export default function MultimodalGallery() {
  const [selectedId, setSelectedId] = useState<string>("ev-001");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [search, setSearch] = useState("");

  const selected = EVIDENCE.find(e => e.id === selectedId) ?? EVIDENCE[0]!;
  const filtered = EVIDENCE.filter(e => {
    if (filterType !== "all" && e.type !== filterType) return false;
    if (filterRisk !== "all" && e.riskLevel !== filterRisk) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const risk = RISK_CONFIG[selected.riskLevel];
  const TypeIcon = TYPE_ICON[selected.type];

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar list */}
      <div className="w-72 flex-shrink-0 border-r border-border flex flex-col bg-[hsl(226_24%_4%)]">
        <div className="p-3 border-b border-border">
          <div className="font-display font-bold text-sm text-foreground mb-2">Multimodal Gallery</div>
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search evidence..." className="w-full bg-[hsl(228,20%,7%)] border border-border rounded-md pl-8 pr-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {["all", "image", "audio", "video", "text"].map(t => (
              <button key={t} onClick={() => setFilterType(t)} className={cn("px-2 py-0.5 rounded text-xs capitalize transition-colors", filterType === t ? "bg-[hsl(258,80%,62%)] text-white" : "text-muted-foreground hover:text-foreground")}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map(item => {
            const Icon = TYPE_ICON[item.type];
            const r = RISK_CONFIG[item.riskLevel];
            return (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={cn("w-full flex items-start gap-2.5 px-3 py-3 border-b border-border/30 text-left hover:bg-[hsl(228,20%,7%)] transition-colors", selectedId === item.id && "bg-[hsla(258,80%,62%,0.08)]")}
              >
                <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${TYPE_COLOR[item.type]}18` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: TYPE_COLOR[item.type] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground leading-snug mb-0.5 truncate">{item.title}</div>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("text-xs px-1 py-0.5 rounded border font-mono", r.bg)} style={{ color: r.color, fontSize: "9px" }}>{r.label}</span>
                    <span className="text-xs text-muted-foreground">{item.timestamp.slice(0, 10)}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main viewer */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-3xl">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${TYPE_COLOR[selected.type]}18` }}>
              <TypeIcon className="w-4.5 h-4.5" style={{ color: TYPE_COLOR[selected.type] }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-semibold text-foreground mb-0.5">{selected.title}</div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("text-xs px-2 py-0.5 rounded border font-mono font-medium", risk.bg)} style={{ color: risk.color }}>{risk.label} RISK</span>
                <span className="text-xs text-muted-foreground">{selected.source}</span>
                <span className="text-xs text-muted-foreground">{selected.timestamp}</span>
                <span className="text-xs text-muted-foreground">Confidence: {(selected.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            {selected.type === "image" && <ImageViewer item={selected} />}
            {selected.type === "audio" && <AudioViewer item={selected} />}
            {selected.type === "video" && <VideoViewer item={selected} />}
            {selected.type === "text" && <TextViewer item={selected} />}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* AI Annotations */}
            <div className="bg-[hsl(228,20%,7%)] border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-3.5 h-3.5 text-[hsl(258,80%,62%)]" />
                <div className="text-xs font-medium text-foreground uppercase tracking-wider">AI Analysis</div>
              </div>
              <div className="space-y-1.5">
                {selected.aiAnnotations.map((ann, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <ChevronRight className="w-3 h-3 text-[hsl(258,80%,62%)] flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{ann}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cross-modal evidence chain */}
            <div className="bg-[hsl(228,20%,7%)] border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Network className="w-3.5 h-3.5 text-[hsl(258,80%,62%)]" />
                <div className="text-xs font-medium text-foreground uppercase tracking-wider">Evidence Chain</div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[hsl(258,80%,62%,0.12)] border border-[hsl(258,80%,62%,0.25)]">
                  <TypeIcon className="w-3 h-3" style={{ color: TYPE_COLOR[selected.type] }} />
                  <span className="text-xs text-[hsl(258,80%,72%)] font-mono">{selected.id}</span>
                </div>
                <span className="text-muted-foreground">→</span>
                <div className="flex flex-wrap gap-1">
                  {selected.crossModalLinks.map(linkId => {
                    const linked = EVIDENCE.find(e => e.id === linkId);
                    if (!linked) return null;
                    const LIcon = TYPE_ICON[linked.type];
                    return (
                      <button
                        key={linkId}
                        onClick={() => setSelectedId(linkId)}
                        className="flex items-center gap-1 px-2 py-1 rounded border text-xs hover:bg-secondary/30 transition-colors"
                        style={{ borderColor: `${TYPE_COLOR[linked.type]}40` }}
                      >
                        <LIcon className="w-3 h-3" style={{ color: TYPE_COLOR[linked.type] }} />
                        <span style={{ color: TYPE_COLOR[linked.type] }}>{linkId}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Click a linked item to inspect. All items in chain corroborate the same event.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
