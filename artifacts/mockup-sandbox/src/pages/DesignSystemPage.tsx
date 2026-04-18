/* gi-lint-ignore-file — this file intentionally renders forbidden phrases as lexicon examples */
import { useState } from "react";
import {
  EvidenceBadge,
  FreshnessChip,
  ConfidenceMeter,
  PolicyStateChip,
  AutonomyModeToggle,
  ProofEnvelope,
  DenseTable,
  TimelineLane,
  GraphCanvas,
  MapSurface,
  NarrativePanel,
} from "@szl-holdings/design-system";
import type {
  AutonomyMode,
  EvidenceSource,
  TimelineEvent,
  GraphNode,
  GraphEdge,
  MapMarker,
  ColumnDef,
} from "@szl-holdings/design-system";
import { color, productAccent, motion } from "@szl-holdings/design-system";

const SAMPLE_EVIDENCE: EvidenceSource[] = [
  { id: "e1", label: "Q3 Revenue Report", type: "document", url: "#", timestamp: "2026-04-15T10:00:00Z", excerpt: "Gross margin improved 4.2pp YoY driven by enterprise mix shift." },
  { id: "e2", label: "CRM Pipeline Signal", type: "signal", timestamp: "2026-04-17T08:30:00Z", excerpt: "42 enterprise deals in Stage 4 — $18M ACV at risk of Q2 slip." },
  { id: "e3", label: "Atlas Spatial Index", type: "api", url: "#", excerpt: "Vessel density up 12% in South China Sea corridor." },
];

const SAMPLE_EVENTS: TimelineEvent[] = [
  { id: "t1", timestamp: new Date(Date.now() - 3_600_000 * 2), label: "Policy Tier Elevated", description: "Guardian escalated to Tier 2 due to contract value > $500k", severity: "warning", actor: "Guardian" },
  { id: "t2", timestamp: new Date(Date.now() - 3_600_000 * 5), label: "Recommendation Generated", description: "Alloy synthesized 3 countermeasures from 7 evidence signals", severity: "info", actor: "Alloy", meta: { confidence: "82%", model: "gpt-4o" } },
  { id: "t3", timestamp: new Date(Date.now() - 3_600_000 * 11), label: "Human Approval Granted", description: "CFO approved drawdown of $2.1M reserve", severity: "success", actor: "R. Vargas" },
  { id: "t4", timestamp: new Date(Date.now() - 3_600_000 * 24), label: "Alert Threshold Breached", description: "Action Debt score exceeded 85 — three compounding delays detected", severity: "critical", actor: "Pulse" },
  { id: "t5", timestamp: new Date(Date.now() - 3_600_000 * 48), label: "Baseline Established", description: "Ownership Drift calibration completed for Q2", severity: "neutral", actor: "Lyte" },
];

const SAMPLE_NODES: GraphNode[] = [
  { id: "alloy", label: "Alloy", x: 0.5,  y: 0.15, radius: 14, color: "#00d4ff", ringColor: "#00d4ff" },
  { id: "guardian", label: "Guardian", x: 0.2, y: 0.45, radius: 10, color: "#a855f7" },
  { id: "pulse",   label: "Pulse",    x: 0.8, y: 0.45, radius: 10, color: "#ffb700" },
  { id: "lyte",    label: "Lyte",     x: 0.35,y: 0.75, radius: 10, color: "#00e878" },
  { id: "vessels", label: "Vessels",  x: 0.65,y: 0.75, radius: 10, color: "#14b8a6" },
];

const SAMPLE_EDGES: GraphEdge[] = [
  { id: "a-g", source: "alloy",    target: "guardian", color: "#a855f7", weight: 1.5 },
  { id: "a-p", source: "alloy",    target: "pulse",    color: "#ffb700", weight: 1.5 },
  { id: "a-l", source: "alloy",    target: "lyte",     color: "#00e878", dashed: true },
  { id: "a-v", source: "alloy",    target: "vessels",  color: "#14b8a6", dashed: true },
  { id: "g-l", source: "guardian", target: "lyte",     color: "#243040" },
  { id: "p-v", source: "pulse",    target: "vessels",  color: "#243040" },
];

const SAMPLE_MARKERS: MapMarker[] = [
  { id: "sgp", label: "Singapore", x: 0.72, y: 0.58, color: "#00d4ff", pulse: true, size: "lg", tooltip: "High vessel density — 47 assets" },
  { id: "sha", label: "Shanghai",  x: 0.76, y: 0.38, color: "#ffb700", size: "md", tooltip: "12 vessels in port" },
  { id: "lon", label: "London",    x: 0.45, y: 0.28, color: "#00e878", size: "md", tooltip: "HQ — command hub" },
  { id: "nyc", label: "New York",  x: 0.22, y: 0.32, color: "#a855f7", size: "sm", tooltip: "Capital markets desk" },
];

interface TableRow {
  id: string;
  metric: string;
  value: string;
  delta: string;
  status: string;
}

const TABLE_ROWS: TableRow[] = [
  { id: "r1", metric: "Action Debt Score",    value: "87 / 100", delta: "+12",  status: "critical" },
  { id: "r2", metric: "Ownership Drift Index",value: "0.34",      delta: "-0.06",status: "warning"  },
  { id: "r3", metric: "Pressure Map Tension", value: "High",      delta: "—",    status: "warning"  },
  { id: "r4", metric: "Decision Replay Delta",value: "3.2 days",  delta: "+0.8", status: "info"     },
  { id: "r5", metric: "Evidence Coverage",    value: "91%",       delta: "+4pp", status: "success"  },
];

const TABLE_COLS: ColumnDef<TableRow>[] = [
  { key: "metric", header: "Metric",   accessor: (r) => r.metric, sortable: true, width: "220px" },
  { key: "value",  header: "Value",    accessor: (r) => r.value,  sortable: true, mono: true },
  { key: "delta",  header: "Δ",        accessor: (r) => r.delta,  align: "right", mono: true },
  {
    key: "status", header: "State", align: "center",
    accessor: (r) => {
      const map: Record<string, string> = {
        critical: "bg-[#ff4455]/15 text-[#ff4455] border-[#ff4455]/30",
        warning:  "bg-[#ffb700]/15 text-[#ffb700] border-[#ffb700]/30",
        info:     "bg-[#00d4ff]/15 text-[#00d4ff] border-[#00d4ff]/30",
        success:  "bg-[#00e878]/15 text-[#00e878] border-[#00e878]/30",
      };
      return (
        <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${map[r.status] ?? ""}`}>
          {r.status}
        </span>
      );
    },
  },
];

const NARRATIVE_PARAGRAPHS = [
  { id: "p1", text: "Three compounding factors drove Action Debt above the 85-point threshold this quarter: a 12-day slip in the Singapore port clearing window, a stalled contract renewal with Meridian Freight, and under-utilisation of the automated exception-handling framework.", highlights: ["Action Debt", "automated exception-handling"] },
  { id: "p2", text: "The evidence trail is clear and traceable: 7 primary signals, 91% coverage, no contradictions. The recommended countermeasures have a combined expected value of $4.2M recovery within 60 days, subject to policy approval at Tier 2.", highlights: ["traceable", "policy approval"] },
  { id: "p3", text: "This synthesis was produced under the governed-intelligence framework. No recommendations were generated without verifiable evidence backing. Human review is required before any consequential action is initiated.", highlights: ["governed-intelligence", "verifiable evidence", "Human review"] },
];

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="mb-4 border-b border-[#1a2535] pb-2">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-[#4a6070]">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-[#4a6070]">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Preview({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#1a2535] bg-[#060b12] overflow-hidden">
      <div className="border-b border-[#1a2535] bg-[#0d1520] px-3 py-1.5">
        <span className="font-mono text-[10px] text-[#4a6070]">{label}</span>
      </div>
      <div className="p-4 flex flex-wrap gap-3 items-start">{children}</div>
    </div>
  );
}

export default function DesignSystemPage() {
  const [autonomyMode, setAutonomyMode] = useState<AutonomyMode>("ask-to-act");
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  return (
    <div className="min-h-full bg-[#060b12] px-6 py-8 text-[#c8d8e8]">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <div className="mb-1 flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-[#00d4ff]/40 to-transparent" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#00d4ff]">
              @szl-holdings/design-system
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-[#00d4ff]/40 to-transparent" />
          </div>
          <h1 className="text-center text-2xl font-bold tracking-tight text-[#c8d8e8]">
            Governed-Intelligence Design Language
          </h1>
          <p className="mt-2 text-center text-sm text-[#4a6070]">
            Dark-first · Evidence-backed · Traceable autonomy · Policy-gated
          </p>
        </div>

        {/* ── TOKENS ─────────────────────────────────────────────────────── */}
        <Section title="Design Tokens" subtitle="Color, typography, motion, elevation">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-wider text-[#4a6070]">Semantic Colors</p>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(color.accent).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 rounded border border-[#1a2535] bg-[#0d1520] px-2 py-1.5">
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: v }} />
                    <span className="text-[11px] text-[#7a99b8]">{k}</span>
                    <span className="ml-auto font-mono text-[10px] text-[#4a6070]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-wider text-[#4a6070]">Product Accents</p>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(productAccent).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 rounded border border-[#1a2535] bg-[#0d1520] px-2 py-1.5">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: v }}
                    />
                    <span className="text-[11px] text-[#7a99b8] capitalize">{k}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 mb-2 text-[10px] uppercase tracking-wider text-[#4a6070]">Motion Durations</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(motion.duration).map(([k, v]) => (
                  <div key={k} className="rounded border border-[#1a2535] bg-[#0d1520] px-2 py-1">
                    <span className="block text-[10px] text-[#4a6070]">{k}</span>
                    <span className="font-mono text-[11px] text-[#7a99b8]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ── PROOF ENVELOPE PRIMITIVES ───────────────────────────────────── */}
        <Section title="Proof Envelope Primitives" subtitle="Every AI output carries its verification chain">

          <div className="space-y-3">
            <Preview label="<EvidenceBadge /> — source count + popover with links">
              <EvidenceBadge sources={SAMPLE_EVIDENCE} />
              <EvidenceBadge sources={SAMPLE_EVIDENCE.slice(0, 1)} />
              <EvidenceBadge sources={[]} />
              <EvidenceBadge sources={SAMPLE_EVIDENCE} compact />
            </Preview>

            <Preview label="<FreshnessChip /> — relative time with staleness color ramp">
              <FreshnessChip timestamp={new Date(Date.now() - 30_000)} />
              <FreshnessChip timestamp={new Date(Date.now() - 3_600_000 * 4)} />
              <FreshnessChip timestamp={new Date(Date.now() - 3_600_000 * 48)} />
              <FreshnessChip timestamp={null} />
              <FreshnessChip timestamp={new Date(Date.now() - 30_000)} showAbsolute />
            </Preview>

            <Preview label="<ConfidenceMeter /> — 0–100 with contradiction indicator">
              <ConfidenceMeter value={92} label="Confidence" variant="full" />
              <ConfidenceMeter value={61} label="Evidence" variant="full" />
              <ConfidenceMeter value={28} label="Forecast" variant="full" />
              <ConfidenceMeter value={74} contradiction label="Contested" variant="full" />
              <div className="w-40">
                <ConfidenceMeter value={82} variant="compact" />
              </div>
            </Preview>

            <Preview label="<PolicyStateChip /> — allowed / requires-approval / blocked + reason">
              <PolicyStateChip state="allowed" />
              <PolicyStateChip state="requires-approval" />
              <PolicyStateChip state="blocked" />
              <PolicyStateChip state="requires-approval" reason="Contract > $500k" variant="full" />
              <PolicyStateChip state="blocked" reason="Sanctioned counterparty" variant="full" />
            </Preview>

            <Preview label="<AutonomyModeToggle /> — observe → recommend → draft → ask-to-act → approved-act">
              <div className="w-full space-y-2">
                <AutonomyModeToggle value={autonomyMode} onChange={setAutonomyMode} />
                <p className="text-[11px] text-[#4a6070]">
                  Current mode: <span className="text-[#c8d8e8] font-medium">{autonomyMode}</span>
                </p>
                <AutonomyModeToggle value="observe" readOnly variant="compact" />
              </div>
            </Preview>
          </div>
        </Section>

        {/* ── PROOF ENVELOPE COMPOSITE ─────────────────────────────────────── */}
        <Section title="ProofEnvelope — Composite" subtitle="Wraps any recommendation card with the full verification footer">
          <ProofEnvelope
            title="Recommended: Activate Singapore Port Rerouting Protocol"
            evidence={SAMPLE_EVIDENCE}
            timestamp={new Date(Date.now() - 3_600_000 * 1.5)}
            confidence={82}
            policyState="requires-approval"
            policyReason="Action value > $500k"
            autonomyMode={autonomyMode}
            onAutonomyChange={setAutonomyMode}
            accentColor="#00d4ff"
          >
            <p className="text-sm text-[#7a99b8] leading-relaxed">
              Reroute the <span className="text-[#c8d8e8] font-medium">7 vessels</span> currently queued at Tanjong Pagar to
              the Pasir Panjang terminal. Expected clearing time reduction:{" "}
              <span className="text-[#00e878] font-semibold">−9.4 days</span>. Recovery value estimate:{" "}
              <span className="text-[#00e878] font-semibold">$2.1M</span>. Two approvers required.
            </p>
          </ProofEnvelope>
        </Section>

        {/* ── COCKPIT PRIMITIVES ──────────────────────────────────────────── */}
        <Section title="Cockpit Primitives" subtitle="Dense operator surfaces — table, timeline, graph, map, narrative">

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-[11px] text-[#4a6070]">
                <span className="font-mono text-[#7a99b8]">&lt;DenseTable /&gt;</span> — sortable, scrollable, operator data grid
              </p>
              <DenseTable
                columns={TABLE_COLS}
                rows={TABLE_ROWS}
                rowKey={(r) => r.id}
                stickyHeader
                maxHeight="240px"
                caption="Platform health metrics"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-[11px] text-[#4a6070]">
                  <span className="font-mono text-[#7a99b8]">&lt;TimelineLane /&gt;</span> — event severity ramp
                </p>
                <TimelineLane events={SAMPLE_EVENTS} relative maxVisible={4} />
              </div>

              <div>
                <p className="mb-2 text-[11px] text-[#4a6070]">
                  <span className="font-mono text-[#7a99b8]">&lt;GraphCanvas /&gt;</span>
                  {selectedNode && (
                    <span className="ml-2 text-[#00d4ff]">Selected: {selectedNode.label}</span>
                  )}
                </p>
                <GraphCanvas
                  nodes={SAMPLE_NODES}
                  edges={SAMPLE_EDGES}
                  height={220}
                  onNodeClick={setSelectedNode}
                  showLabels
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] text-[#4a6070]">
                <span className="font-mono text-[#7a99b8]">&lt;MapSurface /&gt;</span>
                {selectedMarker && (
                  <span className="ml-2 text-[#00d4ff]">{selectedMarker.tooltip}</span>
                )}
              </p>
              <MapSurface
                markers={SAMPLE_MARKERS}
                height={200}
                showGrid
                onMarkerClick={setSelectedMarker}
              />
            </div>

            <div>
              <p className="mb-2 text-[11px] text-[#4a6070]">
                <span className="font-mono text-[#7a99b8]">&lt;NarrativePanel /&gt;</span> — evidence-backed synthesis
              </p>
              <NarrativePanel
                headline="Action Debt threshold breach — three compounding delays identified."
                paragraphs={NARRATIVE_PARAGRAPHS}
                attribution="Synthesized by Alloy · 7 signals · 91% evidence coverage · Traceable to audit log #2026-04-18-0047"
                collapseAfter={2}
                accentColor="#00d4ff"
              />
            </div>
          </div>
        </Section>

        {/* ── COPY LEXICON ─────────────────────────────────────────────────── */}
        <Section title="Copy Lexicon" subtitle="Governed-intelligence vocabulary — enforced by scripts/lint-copy.sh">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[#ff4455]/20 bg-[#ff4455]/5 p-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#ff4455]">Forbidden</p>
              <ul className="space-y-1">
                {["sentient", "AI magic", "self-aware", "the AI decided", "the AI thinks", "black box", "unexplainable", "fully autonomous AI"].map((t) => (
                  <li key={t} className="flex items-center gap-2 text-[11px] text-[#7a99b8]">
                    <span className="text-[#ff4455]">✕</span> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-[#00e878]/20 bg-[#00e878]/5 p-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#00e878]">Preferred</p>
              <ul className="space-y-1">
                {["governed intelligence", "evidence-backed", "traceable autonomy", "policy-gated", "verifiable", "explainable", "human-in-the-loop", "audit trail"].map((t) => (
                  <li key={t} className="flex items-center gap-2 text-[11px] text-[#7a99b8]">
                    <span className="text-[#00e878]">✓</span> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-[#4a6070]">
            Run <span className="font-mono text-[#7a99b8]">bash scripts/lint-copy.sh</span> to scan all source files for forbidden phrases.
          </p>
        </Section>

        <div className="border-t border-[#1a2535] pt-4 text-center">
          <p className="text-[11px] text-[#4a6070]">
            <span className="font-mono text-[#7a99b8]">@szl-holdings/design-system v0.1.0</span>
            {" · "}Every surface. Every signal. Governed.
          </p>
        </div>
      </div>
    </div>
  );
}
