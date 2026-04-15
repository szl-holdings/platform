import { useState, useMemo } from "react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { AmbientBar, type AmbientSignal } from "@szl-holdings/shared-ui/ambient-intelligence";
import { EnergyPulse, type EnergyMetrics } from "@szl-holdings/shared-ui/energy-heartbeat";
import { CorrelationFeed, type CrossDomainCorrelation } from "@szl-holdings/shared-ui/cross-domain-correlation";

interface ThoughtResonanceEntry {
  id: string;
  title: string;
  type: "article" | "talk" | "podcast" | "interview";
  publishDate: string;
  themes: string[];
  audienceSegments: Array<{
    segment: string;
    resonanceScore: number;
    engagementRate: number;
    shareRate: number;
  }>;
  overallResonance: number;
  totalEngagements: number;
  suggestedNextTopic?: string;
}

const DEMO_ENTRIES: ThoughtResonanceEntry[] = [
  {
    id: "tr-001", title: "Why Every CEO Should Think Like a CISO", type: "article",
    publishDate: "2026-03-28", themes: ["cybersecurity", "leadership", "risk"],
    overallResonance: 89, totalEngagements: 14200,
    suggestedNextTopic: "Write about board-level cyber risk governance — operators resonated 3× more than investors",
    audienceSegments: [
      { segment: "Operators / CTOs", resonanceScore: 94, engagementRate: 0.12, shareRate: 0.08 },
      { segment: "Investors / LPs", resonanceScore: 78, engagementRate: 0.06, shareRate: 0.03 },
      { segment: "Technologists", resonanceScore: 91, engagementRate: 0.14, shareRate: 0.11 },
      { segment: "General Audience", resonanceScore: 62, engagementRate: 0.04, shareRate: 0.02 },
    ],
  },
  {
    id: "tr-002", title: "The Compound Effect of Ecosystem Thinking", type: "talk",
    publishDate: "2026-03-15", themes: ["strategy", "ecosystems", "innovation"],
    overallResonance: 95, totalEngagements: 8600,
    suggestedNextTopic: "Expand into 'ecosystem flywheel' framework — investors showed unusual engagement spike",
    audienceSegments: [
      { segment: "Operators / CTOs", resonanceScore: 88, engagementRate: 0.09, shareRate: 0.06 },
      { segment: "Investors / LPs", resonanceScore: 97, engagementRate: 0.18, shareRate: 0.14 },
      { segment: "Technologists", resonanceScore: 82, engagementRate: 0.07, shareRate: 0.05 },
      { segment: "General Audience", resonanceScore: 71, engagementRate: 0.05, shareRate: 0.03 },
    ],
  },
  {
    id: "tr-003", title: "AI Agents in Production: Lessons from 100 Deployments", type: "podcast",
    publishDate: "2026-02-20", themes: ["AI", "agents", "production", "engineering"],
    overallResonance: 91, totalEngagements: 22400,
    suggestedNextTopic: "Deep dive into agent reliability patterns — technologists are 4× more engaged than other segments",
    audienceSegments: [
      { segment: "Operators / CTOs", resonanceScore: 86, engagementRate: 0.08, shareRate: 0.05 },
      { segment: "Investors / LPs", resonanceScore: 72, engagementRate: 0.04, shareRate: 0.02 },
      { segment: "Technologists", resonanceScore: 98, engagementRate: 0.22, shareRate: 0.16 },
      { segment: "General Audience", resonanceScore: 55, engagementRate: 0.03, shareRate: 0.01 },
    ],
  },
  {
    id: "tr-004", title: "Maritime Intelligence: Where Old World Meets New Tech", type: "interview",
    publishDate: "2026-01-10", themes: ["maritime", "technology", "transformation"],
    overallResonance: 74, totalEngagements: 5800,
    suggestedNextTopic: "Consider a multi-part series — niche topic but highly engaged audience within segment",
    audienceSegments: [
      { segment: "Operators / CTOs", resonanceScore: 82, engagementRate: 0.07, shareRate: 0.04 },
      { segment: "Investors / LPs", resonanceScore: 69, engagementRate: 0.05, shareRate: 0.03 },
      { segment: "Technologists", resonanceScore: 71, engagementRate: 0.06, shareRate: 0.04 },
      { segment: "General Audience", resonanceScore: 48, engagementRate: 0.02, shareRate: 0.01 },
    ],
  },
];

const TYPE_ICONS: Record<string, string> = { article: "📝", talk: "🎤", podcast: "🎙", interview: "💬" };
const SEGMENT_COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"];

export default function ThoughtResonanceEngine() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = DEMO_ENTRIES.find((e) => e.id === selectedId);

  const ambientSignals: AmbientSignal[] = [
    { id: "sig-1", domain: "stephen", title: "Resonance Peak", summary: "Thought resonance score surged 34% this quarter across key themes", severity: "info", score: 0.52, timestamp: Date.now() },
  ];
  const energyMetrics: EnergyMetrics = { apiCallsPerMinute: 18, wsMessagesPerMinute: 32, chartRendersPerMinute: 3, dataRefreshesPerMinute: 2, activeSubscriptions: 5, deferredUpdates: 0, totalBudget: 120, usedBudget: 14 };
  const correlations: CrossDomainCorrelation[] = [
    { id: "cor-4", title: "Client Engagement → Thought Leadership", description: "Workshop engagement depth correlates with thought leadership reach", domains: ["carlota-jo", "stephen"], confidence: 0.82, timestamp: Date.now(), signals: [{ domain: "carlota-jo", event: "Workshop NPS at 92", severity: "info" }, { domain: "stephen", event: "Resonance score +34%", severity: "info" }], impact: "medium" },
  ];

  const topThemes = useMemo(() => {
    const map = new Map<string, number>();
    DEMO_ENTRIES.forEach((e) => e.themes.forEach((t) => map.set(t, (map.get(t) ?? 0) + e.overallResonance)));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, []);

  return (
    <div className="min-h-screen bg-[#060810] text-white p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white/90">Thought Resonance Engine</h1>
        <p className="text-sm text-white/40 mt-1">Which ideas land where — audience resonance map across investor, operator & technologist segments</p>
      </div>
      <AmbientBar signals={ambientSignals} appDomain="stephen" accentColor="#a855f7" compact />

      <div className="flex flex-wrap gap-2 mb-2">
        {topThemes.map(([theme, score]) => (
          <span key={theme} className="text-[11px] px-2 py-1 rounded-full border border-white/10 text-white/50">
            {theme} <span className="text-white/20 font-mono ml-1">{score}</span>
          </span>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-5 space-y-3">
          {DEMO_ENTRIES.map((entry) => (
            <div key={entry.id}
              className={cn("rounded-xl border p-4 cursor-pointer transition-all", selectedId === entry.id ? "bg-white/[0.06] border-white/15" : "bg-white/[0.02] border-white/5 hover:border-white/10")}
              onClick={() => setSelectedId(entry.id)}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{TYPE_ICONS[entry.type]}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white/85">{entry.title}</div>
                  <div className="text-[11px] text-white/40 mt-0.5">{entry.publishDate} • {entry.totalEngagements.toLocaleString()} engagements</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="text-lg font-bold" style={{ color: entry.overallResonance >= 85 ? "#10b981" : entry.overallResonance >= 70 ? "#f59e0b" : "#ef4444" }}>
                      {entry.overallResonance}
                    </div>
                    <span className="text-[9px] text-white/30">resonance</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="col-span-7">
          {selected ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{TYPE_ICONS[selected.type]}</span>
                  <div>
                    <h2 className="text-lg font-semibold text-white/90">{selected.title}</h2>
                    <p className="text-xs text-white/40">{selected.publishDate}</p>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-white/60 mb-3">Audience Resonance Map</h3>
                <div className="space-y-3">
                  {selected.audienceSegments.map((seg, i) => (
                    <div key={seg.segment} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/60">{seg.segment}</span>
                        <span className="font-mono font-medium" style={{ color: SEGMENT_COLORS[i] }}>{seg.resonanceScore}</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${seg.resonanceScore}%`, background: SEGMENT_COLORS[i], opacity: 0.7 }} />
                      </div>
                      <div className="flex gap-4 text-[10px] text-white/30">
                        <span>Engagement: {(seg.engagementRate * 100).toFixed(1)}%</span>
                        <span>Share rate: {(seg.shareRate * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selected.suggestedNextTopic && (
                <div className="rounded-xl border border-purple-500/20 bg-purple-500/[0.03] p-4">
                  <div className="text-[10px] text-purple-400 uppercase tracking-wider mb-2">AI Suggestion — What to Write/Speak About Next</div>
                  <p className="text-sm text-white/70">{selected.suggestedNextTopic}</p>
                </div>
              )}

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Themes</div>
                <div className="flex flex-wrap gap-2">
                  {selected.themes.map((theme) => (
                    <span key={theme} className="text-xs px-2 py-1 rounded-full bg-white/5 text-white/50">{theme}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center h-full flex items-center justify-center">
              <p className="text-sm text-white/30">Select a piece of content to view audience resonance breakdown</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/5">
        <div className="md:col-span-2">
          <CorrelationFeed correlations={correlations} currentDomain="stephen" accentColor="#a855f7" />
        </div>
        <div className="flex items-start justify-center">
          <EnergyPulse metrics={energyMetrics} utilization={energyMetrics.usedBudget / energyMetrics.totalBudget} accentColor="#a855f7" />
        </div>
      </div>
    </div>
  );
}
