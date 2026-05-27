import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import {
  CheckCircle,
  ChevronRight,
  ExternalLink,
  FileText,
  Film,
  Loader,
  Zap,
} from 'lucide-react';
import { useCallback, useState } from 'react';

const ACCENT = '#c9b787';
const RED = '#f5f5f5';
const GREEN = '#c9b787';
const BLUE = '#c9b787';
const _PURPLE = '#8a8a8a';

const DS = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.06)',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    muted: 'rgba(255,255,255,0.25)',
  },
};

interface BriefingItem {
  id: string;
  priority: 'flash' | 'priority' | 'routine';
  title: string;
  domain: string;
  summary: string;
  evidence: string[];
  recommendation: string;
  confidence: number;
}

interface Briefing {
  id: string;
  title: string;
  generatedAt: string;
  period: string;
  classification: 'executive' | 'operational' | 'strategic';
  recipientFocus: string;
  items: BriefingItem[];
  status: 'draft' | 'reviewed' | 'distributed';
}

const BRIEFINGS: Briefing[] = [
  {
    id: 'BRF-2024-0315',
    title: 'Daily Executive Intelligence Briefing',
    generatedAt: '2024-03-15T06:00:00Z',
    period: '24h',
    classification: 'executive',
    recipientFocus: 'C-Suite / Board',
    status: 'draft',
    items: [
      {
        id: 'BI-001',
        priority: 'flash',
        title: 'Red Sea Corridor Disruption — Multi-Domain Convergence',
        domain: 'Cross-Domain',
        summary:
          'Five independent signals across maritime, cyber, financial, and legal domains converge on coordinated disruption of Red Sea shipping corridors. APT-41 targeting logistics companies coincides with vessel rerouting and insurance premium spikes. Confidence: 94%. Immediate action required on vessel rerouting and contract force majeure triggers.',
        evidence: [
          'SEXTANT AIS anomaly detection',
          'Sentra APT-41 IOC match',
          'SZL insurance premium data',
          'PRISM contract review queue',
        ],
        recommendation:
          'Activate Crisis Protocol Bravo. Reroute 3 LNG carriers. Brief insurance underwriters. Convene legal for force majeure review.',
        confidence: 94,
      },
      {
        id: 'BI-002',
        priority: 'priority',
        title: 'China Supply Chain Exposure — Portfolio Risk Assessment',
        domain: 'Financial',
        summary:
          '2 portfolio companies identified with >40% China supply chain dependency. Current geopolitical tensions elevate risk of sudden disruption. Combined exposure: $180M across semiconductor components and rare earth materials. Risk score upgraded from MEDIUM to HIGH.',
        evidence: [
          'Sentra portfolio analysis',
          'DOMAINE supply chain mapping',
          'PRISM contract database',
        ],
        recommendation:
          'Initiate supplier diversification review for affected portfolio companies. Accelerate nearshoring assessment for critical components.',
        confidence: 82,
      },
      {
        id: 'BI-003',
        priority: 'priority',
        title: 'EU Regulatory Landscape — Carbon Tax Acceleration Signals',
        domain: 'Regulatory',
        summary:
          'Intelligence indicates EU carbon border adjustment mechanism (CBAM) likely to expand scope to cover maritime emissions by Q2 2025 — 6 months ahead of published timeline. 23 contracts require carbon clause amendments.',
        evidence: [
          'Brussels policy monitoring',
          'EU Parliament committee transcripts',
          'PRISM regulatory radar',
        ],
        recommendation:
          'Begin proactive carbon clause amendments. Brief portfolio companies on compliance timeline. Review maritime fleet fuel strategy.',
        confidence: 71,
      },
      {
        id: 'BI-004',
        priority: 'routine',
        title: 'Rotterdam Port Congestion — Real Estate Opportunity Window',
        domain: 'Real Estate',
        summary:
          'Vessel rerouting patterns predict 15-20% increase in Rotterdam port throughput over next 4-6 weeks. Warehouse vacancy rates already declining from 8.2% to 6.1%. 2-3 week window for pre-positioning.',
        evidence: [
          'SEXTANT rerouting analysis',
          'DOMAINE market intelligence',
          'Port authority data',
        ],
        recommendation:
          'Accelerate Rotterdam warehouse acquisition pipeline. Engage brokers for near-port logistics space before pricing adjusts.',
        confidence: 76,
      },
    ],
  },
  {
    id: 'BRF-2024-0314',
    title: 'Weekly Strategic Assessment',
    generatedAt: '2024-03-14T06:00:00Z',
    period: '7d',
    classification: 'strategic',
    recipientFocus: 'Strategy Committee',
    status: 'distributed',
    items: [
      {
        id: 'BI-005',
        priority: 'priority',
        title: 'Global Threat Landscape — Weekly Risk Trajectory',
        domain: 'Geopolitical',
        summary:
          'Overall geopolitical risk index increased 12 points to 74/100 this week, driven by Middle East escalation and South China Sea tensions. Three risk vectors now classified ELEVATED: maritime trade disruption, cyber infrastructure targeting, and regulatory acceleration.',
        evidence: [
          'NEXUS geopolitical risk model',
          'OSINT sentiment analysis',
          'Historical pattern matching',
        ],
        recommendation:
          'Review all risk mitigation positions. Stress-test portfolio for simultaneous multi-domain disruption scenario.',
        confidence: 88,
      },
    ],
  },
];

const prioColor = (p: string) => (p === 'flash' ? RED : p === 'priority' ? ACCENT : BLUE);

type VideoRenderState = { status: 'idle' | 'rendering' | 'done'; jobId?: string; mp4Url?: string };

export default function ExecutiveBriefingPage() {
  const [briefings, setBriefings] = useState(() => BRIEFINGS.map((b) => ({ ...b })));
  const [selectedId, setSelectedId] = useState(BRIEFINGS[0].id);
  const [expandedItem, setExpandedItem] = useState<string | null>(BRIEFINGS[0].items[0].id);
  const [videoStates, setVideoStates] = useState<Record<string, VideoRenderState>>({});

  const selected = briefings.find((b) => b.id === selectedId) ?? briefings[0];

  const handleStatusChange = useCallback(
    (status: Briefing['status']) => {
      setBriefings((prev) => prev.map((b) => (b.id === selectedId ? { ...b, status } : b)));
    },
    [selectedId],
  );

  async function handleBriefAsVideo() {
    if (videoStates[selectedId]?.status === 'rendering') return;
    const brief = briefings.find((b) => b.id === selectedId);
    setVideoStates((prev) => ({ ...prev, [selectedId]: { status: 'rendering' } }));
    try {
      const composition = `<section data-brief-id="${selectedId}"><h1>${brief?.classification ?? 'Executive Brief'}</h1><p>${brief?.recipientFocus ?? 'Board'}</p></section>`;
      const submitRes = await apiFetch<{ data: { job_id: string; audit_trace: string } }>('/nexus/bridge/video-render', {
        method: 'POST',
        body: JSON.stringify({ composition, duration: 30, seed: `pulse-brief-${selectedId}` }),
        headers: { 'Content-Type': 'application/json' },
        skipAuth: true,
      });
      const submitted = (submitRes as unknown as { data: { job_id: string; audit_trace: string } }).data ?? submitRes;
      const jobId = (submitted as { job_id: string }).job_id;
      setVideoStates((prev) => ({ ...prev, [selectedId]: { status: 'rendering', jobId } }));
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const pollRes = await apiFetch<{ data: { status: string; mp4_url: string | null } }>(`/nexus/bridge/video-render/${jobId}`, { skipAuth: true });
        const polled = (pollRes as unknown as { data: { status: string; mp4_url: string | null } }).data ?? pollRes;
        const p = polled as { status: string; mp4_url: string | null };
        if (p.status === 'done' && p.mp4_url) {
          setVideoStates((prev) => ({ ...prev, [selectedId]: { status: 'done', jobId, mp4Url: p.mp4_url! } }));
          return;
        }
        if (p.status === 'failed') throw new Error('Render failed');
      }
      throw new Error('Render timed out');
    } catch {
      setVideoStates((prev) => ({ ...prev, [selectedId]: { status: 'idle' } }));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">
            AI Executive Briefing Generator
          </h1>
          <p className="text-[11px] mt-1" style={{ color: DS.text.muted }}>
            Autonomous synthesis of critical signals, correlations, and predictions into actionable
            intelligence narratives
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-wider" style={{ color: DS.text.muted }}>
            AI Synthesis
          </span>
          <span
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium"
            style={{ background: `${GREEN}20`, color: GREEN }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" /> Active
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        {briefings.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelectedId(b.id)}
            aria-label={`Select briefing ${b.title}`}
            className="flex-1 text-left rounded-xl p-4 transition"
            style={{
              background: selectedId === b.id ? 'rgba(255,255,255,0.04)' : DS.surface,
              border: `1px solid ${selectedId === b.id ? 'rgba(255,255,255,0.12)' : DS.border}`,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-3.5 w-3.5" style={{ color: ACCENT }} />
              <span className="text-[9px] font-mono" style={{ color: DS.text.muted }}>
                {b.id}
              </span>
              <span
                className="text-[8px] uppercase font-bold rounded px-1.5 py-0.5"
                style={{
                  background:
                    b.status === 'distributed'
                      ? `${GREEN}15`
                      : b.status === 'reviewed'
                        ? `${BLUE}15`
                        : `${ACCENT}15`,
                  color:
                    b.status === 'distributed' ? GREEN : b.status === 'reviewed' ? BLUE : ACCENT,
                }}
              >
                {b.status}
              </span>
            </div>
            <p className="text-sm font-medium text-white">{b.title}</p>
            <p className="text-[9px] mt-1" style={{ color: DS.text.muted }}>
              {b.recipientFocus} · {b.period} window · {b.items.length} items
            </p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-3">
          {selected.items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl overflow-hidden"
              style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
            >
              <button
                onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                aria-label={`Toggle briefing item ${item.title}`}
                className="w-full text-left p-4 flex items-center gap-3"
              >
                <div
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ background: prioColor(item.priority) }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-[8px] uppercase font-bold tracking-wider rounded px-1.5 py-0.5"
                      style={{
                        background: `${prioColor(item.priority)}15`,
                        color: prioColor(item.priority),
                      }}
                    >
                      {item.priority}
                    </span>
                    <span className="text-[9px]" style={{ color: DS.text.muted }}>
                      {item.domain}
                    </span>
                    <span className="text-[9px] font-semibold ml-auto" style={{ color: ACCENT }}>
                      {item.confidence}%
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                </div>
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${expandedItem === item.id ? 'rotate-90' : ''}`}
                  style={{ color: DS.text.muted }}
                />
              </button>
              {expandedItem === item.id && (
                <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: DS.border }}>
                  <div className="pt-3">
                    <h4
                      className="text-[9px] uppercase tracking-wider font-semibold mb-1.5"
                      style={{ color: DS.text.muted }}
                    >
                      Assessment
                    </h4>
                    <p className="text-[11px] leading-relaxed" style={{ color: DS.text.secondary }}>
                      {item.summary}
                    </p>
                  </div>
                  <div>
                    <h4
                      className="text-[9px] uppercase tracking-wider font-semibold mb-1.5"
                      style={{ color: DS.text.muted }}
                    >
                      Evidence Sources
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {item.evidence.map((e) => (
                        <span
                          key={e}
                          className="text-[8px] px-2 py-0.5 rounded-full"
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: `1px solid ${DS.border}`,
                            color: DS.text.secondary,
                          }}
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div
                    className="rounded-lg p-3"
                    style={{ background: `${ACCENT}08`, borderLeft: `2px solid ${ACCENT}` }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Zap className="h-3 w-3" style={{ color: ACCENT }} />
                      <span
                        className="text-[9px] uppercase tracking-wider font-semibold"
                        style={{ color: ACCENT }}
                      >
                        Recommended Action
                      </span>
                    </div>
                    <p className="text-[10px] leading-relaxed" style={{ color: DS.text.secondary }}>
                      {item.recommendation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="col-span-4 space-y-4">
          <div
            className="rounded-xl p-5"
            style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
          >
            <h3
              className="text-[10px] uppercase tracking-wider font-semibold mb-3"
              style={{ color: DS.text.muted }}
            >
              Briefing Controls
            </h3>
            {selected.status === 'draft' && (
              <div className="space-y-2">
                <button
                  onClick={() => handleStatusChange('reviewed')}
                  aria-label="Mark briefing as reviewed"
                  className="w-full text-[10px] font-semibold rounded-lg py-2 transition hover:brightness-125"
                  style={{ background: `${BLUE}20`, color: BLUE }}
                >
                  Mark Reviewed
                </button>
                <button
                  onClick={() => handleStatusChange('distributed')}
                  aria-label="Distribute briefing"
                  className="w-full text-[10px] font-semibold rounded-lg py-2 transition hover:brightness-125"
                  style={{ background: `${GREEN}20`, color: GREEN }}
                >
                  Distribute
                </button>
              </div>
            )}
            {selected.status === 'reviewed' && (
              <button
                onClick={() => handleStatusChange('distributed')}
                aria-label="Distribute briefing"
                className="w-full text-[10px] font-semibold rounded-lg py-2 transition hover:brightness-125"
                style={{ background: `${GREEN}20`, color: GREEN }}
              >
                Distribute to Recipients
              </button>
            )}
            {selected.status === 'distributed' && (
              <p className="text-[10px]" style={{ color: GREEN }}>
                Distributed to {selected.recipientFocus}
              </p>
            )}

            {/* Brief as video — HyperFrames video.render */}
            <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${DS.border}` }}>
              <p className="text-[9px] uppercase tracking-wider mb-2" style={{ color: DS.text.muted }}>
                Video Output
              </p>
              {(() => {
                const vs = videoStates[selectedId] ?? { status: 'idle' };
                if (vs.status === 'done' && vs.mp4Url) {
                  return (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[9px]" style={{ color: GREEN }}>
                        <CheckCircle className="w-3 h-3" />
                        <span>Render complete · Job {vs.jobId}</span>
                      </div>
                      <a
                        href={vs.mp4Url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 w-full text-[10px] font-semibold rounded-lg py-2 transition hover:brightness-125"
                        style={{ background: `${GREEN}20`, color: GREEN }}
                      >
                        <ExternalLink className="w-3 h-3" />
                        Share MP4 Link
                      </a>
                      <button
                        onClick={handleBriefAsVideo}
                        className="w-full text-[9px] rounded-lg py-1.5 transition hover:brightness-125"
                        style={{ background: 'rgba(255,255,255,0.04)', color: DS.text.muted }}
                      >
                        Re-render
                      </button>
                    </div>
                  );
                }
                if (vs.status === 'rendering') {
                  return (
                    <div className="flex items-center gap-2 text-[10px] py-2" style={{ color: ACCENT }}>
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                      <span>Rendering via HyperFrames…</span>
                    </div>
                  );
                }
                return (
                  <button
                    onClick={handleBriefAsVideo}
                    aria-label="Render briefing as shareable MP4 video"
                    className="flex items-center justify-center gap-1.5 w-full text-[10px] font-semibold rounded-lg py-2 transition hover:brightness-125"
                    style={{ background: `${ACCENT}15`, color: ACCENT }}
                  >
                    <Film className="w-3.5 h-3.5" />
                    Brief as Video
                  </button>
                );
              })()}
            </div>
          </div>

          <div
            className="rounded-xl p-5"
            style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
          >
            <h3
              className="text-[10px] uppercase tracking-wider font-semibold mb-3"
              style={{ color: DS.text.muted }}
            >
              Briefing Metadata
            </h3>
            {[
              { label: 'Generated', value: new Date(selected.generatedAt).toLocaleString() },
              { label: 'Period', value: selected.period },
              { label: 'Classification', value: selected.classification },
              { label: 'Recipients', value: selected.recipientFocus },
              { label: 'Items', value: selected.items.length.toString() },
              {
                label: 'Flash Priority',
                value: selected.items.filter((i) => i.priority === 'flash').length.toString(),
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center justify-between py-1.5"
                style={{ borderBottom: `1px solid ${DS.border}` }}
              >
                <span className="text-[10px]" style={{ color: DS.text.muted }}>
                  {s.label}
                </span>
                <span className="text-[10px] font-semibold text-white">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
