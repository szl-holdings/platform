import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FileText, CheckCircle, Clock, AlertCircle, Shield, Tag, RefreshCw, ChevronDown, ChevronUp, Layers, ExternalLink, BookOpen } from "lucide-react";

const ACCENT = "#40856a";
const API = "/api";

function fetchDiligenceRoom(matterId?: string) {
  const url = matterId
    ? `${API}/terra/cognitive/diligence-room?matterId=${encodeURIComponent(matterId)}`
    : `${API}/terra/cognitive/diligence-room`;
  return fetch(url).then(r => r.json()).then(d => d.data ?? d);
}

const STATUS_CONFIG: Record<string, { color: string; Icon: typeof CheckCircle; label: string }> = {
  verified: { color: "#40856a", Icon: CheckCircle, label: "Verified" },
  in_review: { color: "#4a7dc8", Icon: Clock, label: "In Review" },
  pending: { color: "#c8a060", Icon: AlertCircle, label: "Pending" },
};

const CATEGORY_COLORS: Record<string, string> = {
  title: "#4a7dc8",
  environmental: "#40856a",
  financial: "#c8a060",
  lease: "#8b5cf6",
  structural: "#ec4899",
  legal: "#c04a2a",
};

function ConfidencePill({ value }: { value: number }) {
  const color = value >= 0.85 ? "#40856a" : value >= 0.65 ? "#c8a060" : "#c04a2a";
  const label = value >= 0.85 ? "High" : value >= 0.65 ? "Medium" : "Low";
  return (
    <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-mono"
      style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}>
      {label} {(value * 100).toFixed(0)}%
    </span>
  );
}

function EvidenceCard({ evidence, index }: { evidence: any; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[evidence.status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.Icon;
  const catColor = CATEGORY_COLORS[evidence.category] ?? "#64748b";

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${evidence.status === "verified" ? "rgba(64,133,106,0.2)" : evidence.status === "in_review" ? "rgba(74,125,200,0.2)" : "rgba(200,160,96,0.2)"}` }}>
      <div
        className="p-4 cursor-pointer"
        style={{ background: "rgba(255,255,255,0.02)" }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="text-[8px] font-mono font-bold w-5 h-5 flex items-center justify-center rounded"
              style={{ background: `${catColor}20`, color: catColor }}>
              {index + 1}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold" style={{ color: "#e8edf8" }}>{evidence.label}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase"
                    style={{ background: `${catColor}18`, color: catColor }}>
                    {evidence.category}
                  </span>
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {evidence.source} · {evidence.date}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
                  {evidence.freshness} old
                </span>
                <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
              </div>
            </div>

            <p className="text-[11px] mt-2 leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{evidence.summary}</p>

            <div className="flex items-center justify-between mt-2">
              <ConfidencePill value={evidence.confidence} />
              <div className="flex items-center gap-1 text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {evidence.citations?.length ?? 0} citation{(evidence.citations?.length ?? 0) !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>
      </div>

      {expanded && evidence.citations?.length > 0 && (
        <div className="p-4 space-y-2" style={{ background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="text-[9px] uppercase tracking-wider font-semibold mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Citations</div>
          {evidence.citations.map((cit: any, i: number) => (
            <div key={i} className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <BookOpen className="w-3 h-3 flex-shrink-0" style={{ color: ACCENT }} />
                <span className="text-[10px] font-medium" style={{ color: "#e8edf8" }}>{cit.ref}</span>
                {cit.page && (
                  <span className="text-[9px] px-1 py-0.5 rounded font-mono" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
                    p.{cit.page}
                  </span>
                )}
              </div>
              <blockquote className="text-[10px] pl-2 italic" style={{ color: "rgba(255,255,255,0.5)", borderLeft: `2px solid ${catColor}40` }}>
                "{cit.excerpt}"
              </blockquote>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DiligenceRoomPage() {
  const [selectedMatterId, setSelectedMatterId] = useState<string | undefined>(undefined);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["terra-diligence-room", selectedMatterId],
    queryFn: () => fetchDiligenceRoom(selectedMatterId),
  });

  const matter = data?.matter;
  const allMatters: any[] = data?.allMatters ?? [];
  const prov = data?.provenance;
  const chainSummary = matter?.chainSummary;

  const stageMap: Record<string, string> = {
    pre_diligence: "Pre-Diligence",
    title_review: "Title Review",
    environmental: "Environmental",
    financial_audit: "Financial Audit",
    legal_review: "Legal Review",
    final_approval: "IC Sign-Off",
  };

  return (
    <div style={{ padding: "28px 28px 40px", maxWidth: 1280, margin: "0 auto" }}>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4" style={{ color: ACCENT }} />
            <h1 className="text-xl font-semibold" style={{ color: "#e8edf8" }}>Diligence Room</h1>
          </div>
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            Evidence chain per diligence matter — documents, citations, freshness, and confidence scores with full provenance.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}30`, color: ACCENT }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: `${ACCENT}30`, borderTopColor: ACCENT }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-4">
            <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
                Active Matters
              </div>
              {allMatters.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMatterId(m.id)}
                  className="w-full text-left rounded-lg p-3 mb-2 transition-all"
                  style={{
                    background: (selectedMatterId ?? matter?.id) === m.id ? `${ACCENT}15` : "rgba(255,255,255,0.02)",
                    border: `1px solid ${(selectedMatterId ?? matter?.id) === m.id ? `${ACCENT}40` : "rgba(255,255,255,0.06)"}`,
                  }}
                >
                  <div className="text-xs font-medium" style={{ color: "#e8edf8" }}>{m.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{stageMap[m.stage] ?? m.stage}</span>
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${m.completionPct}%`, background: ACCENT }} />
                    </div>
                    <span className="text-[9px] font-mono" style={{ color: ACCENT }}>{m.completionPct}%</span>
                  </div>
                  <div className="text-[9px] mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>Target close: {m.targetClose}</div>
                </button>
              ))}
            </div>

            {chainSummary && (
              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Chain Summary
                </div>
                {[
                  { label: "Verified", value: chainSummary.verified, color: "#40856a", Icon: CheckCircle },
                  { label: "In Review", value: chainSummary.inReview, color: "#4a7dc8", Icon: Clock },
                  { label: "Pending", value: chainSummary.pending, color: "#c8a060", Icon: AlertCircle },
                  { label: "Avg Confidence", value: `${(chainSummary.avgConfidence * 100).toFixed(0)}%`, color: ACCENT, Icon: Shield },
                ].map(m => (
                  <div key={m.label} className="flex items-center gap-2 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <m.Icon className="w-3 h-3" style={{ color: m.color }} />
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{m.label}</span>
                    <span className="ml-auto text-xs font-mono font-semibold" style={{ color: m.color }}>{m.value}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
                Category Legend
              </div>
              {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                <div key={cat} className="flex items-center gap-2 py-1.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: color }} />
                  <span className="text-[10px] capitalize" style={{ color: "rgba(255,255,255,0.5)" }}>{cat}</span>
                </div>
              ))}
            </div>

            {prov && (
              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                  <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Provenance</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <ConfidencePill value={prov.confidence} />
                </div>
                <div className="text-[10px] font-mono mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{prov.source}</div>
                <div className="text-[9px]" style={{ color: "rgba(64,133,106,0.5)" }}>{prov.traceRef}</div>
                <div className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>{prov.runtime}</div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-3">
            {matter && (
              <>
                <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="text-base font-semibold" style={{ color: "#e8edf8" }}>{matter.title}</div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono" style={{ background: `${ACCENT}18`, color: ACCENT }}>
                          {stageMap[matter.stage] ?? matter.stage}
                        </span>
                        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Opened: {matter.opened}</span>
                        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Target close: {matter.targetClose}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-bold font-mono" style={{ color: ACCENT }}>{matter.completionPct}%</div>
                      <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>complete</div>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${matter.completionPct}%`, background: ACCENT }} />
                  </div>
                </div>

                <div className="space-y-2">
                  {matter.evidenceChain?.map((ev: any, i: number) => (
                    <EvidenceCard key={ev.id} evidence={ev} index={i} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
