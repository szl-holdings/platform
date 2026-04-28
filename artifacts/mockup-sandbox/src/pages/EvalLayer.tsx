/**
 * EvalLayer — Open Evaluation Graph Overlay for NEXUS
 *
 * Shows all SZL domain apps as graph nodes with live eval scores.
 * Clicking a node opens a score panel with full leaderboard for that domain,
 * filtered to the selected entity. EvalBadges surface on each node.
 */

import {
  EvalBadge,
  type LeaderboardEntry,
  LeaderboardTable,
  ResultDetailDrawer,
  type EvalResultDetail,
  ScoreChip,
  SubmitScoreForm,
  type SubmitScorePayload,
} from '@szl-holdings/design-system';
import { BarChart2, ChevronRight, ShieldCheck, Trophy, X } from 'lucide-react';
import { useState } from 'react';

type BadgeState = 'verified' | 'community' | 'leaderboard' | 'source';

interface AppNode {
  id: string;
  label: string;
  domain: string;
  domainKey: string;
  score: number;
  prevScore: number;
  metric: string;
  badgeState: BadgeState;
  color: string;
  x: number;
  y: number;
  benchmarkId: string;
  leaderboard: LeaderboardEntry[];
}

const APP_NODES: AppNode[] = [
  {
    id: 'pulse',
    label: 'Pulse',
    domain: 'executive',
    domainKey: 'executive',
    score: 0.942,
    prevScore: 0.918,
    metric: 'brief_relevance',
    badgeState: 'verified',
    color: '#f59e0b',
    x: 50,
    y: 15,
    benchmarkId: 'szl-pulse-brief-relevance-v1',
    leaderboard: [
      { rank: 1, resultId: 'r-p1', entityId: 'pulse-v3.1', entityLabel: 'Pulse v3.1', entityType: 'intelligence-product', domain: 'executive', metric: 'brief_relevance', value: 0.942, badgeState: 'verified', evalDate: '2026-04-27', sourceUrl: null },
      { rank: 2, resultId: 'r-p2', entityId: 'pulse-v3.0', entityLabel: 'Pulse v3.0', entityType: 'intelligence-product', domain: 'executive', metric: 'brief_relevance', value: 0.918, badgeState: 'community', evalDate: '2026-04-10', sourceUrl: null },
    ],
  },
  {
    id: 'sentra',
    label: 'Sentra',
    domain: 'cyber',
    domainKey: 'cyber',
    score: 0.914,
    prevScore: 0.882,
    metric: 'threat_recall',
    badgeState: 'verified',
    color: '#ef4444',
    x: 15,
    y: 38,
    benchmarkId: 'szl-cyber-threat-detection-v1',
    leaderboard: [
      { rank: 1, resultId: 'r-s1', entityId: 'sentra-v2.8', entityLabel: 'Sentra v2.8', entityType: 'intelligence-product', domain: 'cyber', metric: 'threat_recall', value: 0.914, badgeState: 'verified', evalDate: '2026-04-27', sourceUrl: null },
      { rank: 2, resultId: 'r-s2', entityId: 'sentra-v2.7', entityLabel: 'Sentra v2.7', entityType: 'intelligence-product', domain: 'cyber', metric: 'threat_recall', value: 0.882, badgeState: 'community', evalDate: '2026-04-12', sourceUrl: null },
      { rank: 3, resultId: 'r-s3', entityId: 'baseline-ids', entityLabel: 'Baseline IDS', entityType: 'model', domain: 'cyber', metric: 'threat_recall', value: 0.751, badgeState: 'community', evalDate: '2026-03-28', sourceUrl: null },
    ],
  },
  {
    id: 'lyte',
    label: 'Lyte',
    domain: 'decision',
    domainKey: 'decision',
    score: 0.887,
    prevScore: 0.853,
    metric: 'decision_quality',
    badgeState: 'verified',
    color: '#fb923c',
    x: 83,
    y: 38,
    benchmarkId: 'szl-lyte-decision-quality-v1',
    leaderboard: [
      { rank: 1, resultId: 'r-l1', entityId: 'lyte-v2.5', entityLabel: 'Lyte v2.5', entityType: 'intelligence-product', domain: 'decision', metric: 'decision_quality', value: 0.887, badgeState: 'verified', evalDate: '2026-04-26', sourceUrl: null },
      { rank: 2, resultId: 'r-l2', entityId: 'lyte-v2.4', entityLabel: 'Lyte v2.4', entityType: 'intelligence-product', domain: 'decision', metric: 'decision_quality', value: 0.853, badgeState: 'community', evalDate: '2026-04-05', sourceUrl: null },
    ],
  },
  {
    id: 'counsel',
    label: 'Counsel',
    domain: 'legal',
    domainKey: 'legal',
    score: 0.879,
    prevScore: 0.841,
    metric: 'contract_extraction',
    badgeState: 'verified',
    color: '#818cf8',
    x: 30,
    y: 65,
    benchmarkId: 'szl-legal-contract-extraction-v1',
    leaderboard: [
      { rank: 1, resultId: 'r-c1', entityId: 'counsel-v2.5', entityLabel: 'Counsel v2.5', entityType: 'intelligence-product', domain: 'legal', metric: 'contract_extraction', value: 0.879, badgeState: 'verified', evalDate: '2026-04-26', sourceUrl: null },
      { rank: 2, resultId: 'r-c2', entityId: 'counsel-v2.4', entityLabel: 'Counsel v2.4', entityType: 'intelligence-product', domain: 'legal', metric: 'contract_extraction', value: 0.841, badgeState: 'community', evalDate: '2026-04-08', sourceUrl: null },
    ],
  },
  {
    id: 'terra',
    label: 'Terra',
    domain: 'terra',
    domainKey: 'terra',
    score: 0.836,
    prevScore: 0.800,
    metric: 'distress_precision',
    badgeState: 'community',
    color: '#22c55e',
    x: 68,
    y: 65,
    benchmarkId: 'szl-terra-distress-signal-v1',
    leaderboard: [
      { rank: 1, resultId: 'r-t1', entityId: 'terra-v3.1', entityLabel: 'Terra v3.1', entityType: 'intelligence-product', domain: 'terra', metric: 'distress_precision', value: 0.836, badgeState: 'community', evalDate: '2026-04-24', sourceUrl: null },
      { rank: 2, resultId: 'r-t2', entityId: 'terra-v3.0', entityLabel: 'Terra v3.0', entityType: 'intelligence-product', domain: 'terra', metric: 'distress_precision', value: 0.800, badgeState: 'community', evalDate: '2026-04-02', sourceUrl: null },
    ],
  },
  {
    id: 'vessels',
    label: 'Vessels',
    domain: 'maritime',
    domainKey: 'maritime',
    score: 0.791,
    prevScore: 0.774,
    metric: 'port_eta_accuracy',
    badgeState: 'community',
    color: '#38bdf8',
    x: 50,
    y: 88,
    benchmarkId: 'szl-maritime-port-eta-v1',
    leaderboard: [
      { rank: 1, resultId: 'r-v1', entityId: 'vessels-v2.3', entityLabel: 'Vessels v2.3', entityType: 'intelligence-product', domain: 'maritime', metric: 'port_eta_accuracy', value: 0.791, badgeState: 'community', evalDate: '2026-04-23', sourceUrl: null },
      { rank: 2, resultId: 'r-v2', entityId: 'vessels-v2.2', entityLabel: 'Vessels v2.2', entityType: 'intelligence-product', domain: 'maritime', metric: 'port_eta_accuracy', value: 0.774, badgeState: 'community', evalDate: '2026-03-30', sourceUrl: null },
    ],
  },
];

const GRAPH_EDGES = [
  ['pulse', 'sentra'],
  ['pulse', 'lyte'],
  ['sentra', 'counsel'],
  ['sentra', 'terra'],
  ['lyte', 'terra'],
  ['lyte', 'vessels'],
  ['counsel', 'vessels'],
  ['terra', 'vessels'],
];

const TABS = ['Eval Graph', 'All Leaderboards', 'Submit Score'] as const;
type Tab = (typeof TABS)[number];

function scoreColor(score: number): string {
  if (score >= 0.9) return '#22c55e';
  if (score >= 0.8) return '#f59e0b';
  return '#ef4444';
}

export default function EvalLayer() {
  const [activeTab, setActiveTab] = useState<Tab>('Eval Graph');
  const [selectedNode, setSelectedNode] = useState<AppNode | null>(null);
  const [drawerEntry, setDrawerEntry] = useState<EvalResultDetail | null>(null);
  const [filterDomain, setFilterDomain] = useState<string | null>(null);

  const allEntries: LeaderboardEntry[] = APP_NODES.sort((a, b) => b.score - a.score).map((n, i) => ({
    rank: i + 1,
    resultId: `evidence-${n.id}`,
    entityId: n.id,
    entityLabel: n.label,
    entityType: 'intelligence-product',
    domain: n.domainKey,
    metric: n.metric,
    value: n.score,
    badgeState: n.badgeState,
    evalDate: '2026-04-27',
    sourceUrl: null,
  }));

  const filteredEntries = filterDomain
    ? allEntries.filter((e) => e.domain === filterDomain)
    : allEntries;

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/8">
        <Trophy className="w-5 h-5 text-violet-400" />
        <div>
          <h1 className="text-base font-semibold tracking-tight">Open Evaluation Layer</h1>
          <p className="text-xs text-white/40">Verified scores across all PRAXIS-governed domain products</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <EvalBadge state="verified" label="Platform Verified" />
          <ScoreChip metric="portfolio_avg" value={0.875} unit="%" higherIsBetter strong compact />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 border-b border-white/8">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === t
                ? 'text-violet-400 border-b-2 border-violet-400'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            {t}
          </button>
        ))}
        {filterDomain && (
          <div className="ml-auto flex items-center gap-2 py-2">
            <span className="text-xs text-white/40">Filtered: {filterDomain}</span>
            <button onClick={() => setFilterDomain(null)} className="text-white/40 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'Eval Graph' && (
          <>
            {/* Graph Canvas */}
            <div className="flex-1 relative p-6">
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                {GRAPH_EDGES.map(([from, to]) => {
                  const a = APP_NODES.find((n) => n.id === from)!;
                  const b = APP_NODES.find((n) => n.id === to)!;
                  const isHighlighted =
                    !selectedNode || selectedNode.id === from || selectedNode.id === to;
                  return (
                    <line
                      key={`${from}-${to}`}
                      x1={`${a.x}%`} y1={`${a.y}%`}
                      x2={`${b.x}%`} y2={`${b.y}%`}
                      stroke={isHighlighted ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.04)'}
                      strokeWidth={isHighlighted ? 1.5 : 1}
                      strokeDasharray={isHighlighted ? 'none' : '4 4'}
                    />
                  );
                })}
              </svg>

              {APP_NODES.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const isConnected =
                  selectedNode &&
                  GRAPH_EDGES.some(
                    ([a, b]) =>
                      (a === selectedNode.id && b === node.id) ||
                      (b === selectedNode.id && a === node.id),
                  );
                const isDimmed = selectedNode && !isSelected && !isConnected;

                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNode(isSelected ? null : node)}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                    style={{
                      left: `${node.x}%`,
                      top: `${node.y}%`,
                      zIndex: 10,
                      opacity: isDimmed ? 0.3 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <div
                      className="rounded-xl border p-3 text-left transition-all duration-200"
                      style={{
                        minWidth: '120px',
                        backgroundColor: isSelected ? 'rgba(139,92,246,0.15)' : 'rgba(10,11,14,0.95)',
                        borderColor: isSelected
                          ? 'rgba(139,92,246,0.7)'
                          : isConnected
                            ? 'rgba(139,92,246,0.3)'
                            : 'rgba(255,255,255,0.08)',
                        boxShadow: isSelected ? '0 0 20px rgba(139,92,246,0.25)' : 'none',
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: node.color }}
                        >
                          {node.label}
                        </span>
                        <EvalBadge state={node.badgeState} compact />
                      </div>
                      <div
                        className="text-xl font-bold tabular-nums"
                        style={{ color: scoreColor(node.score), letterSpacing: '-0.04em' }}
                      >
                        {(node.score * 100).toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-white/30 mt-0.5 font-mono">
                        {node.metric.replace(/_/g, ' ')}
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/8 text-xs text-violet-400">
                          <span>View leaderboard</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Score Panel */}
            {selectedNode && (
              <div
                className="w-80 border-l border-white/8 flex flex-col overflow-hidden"
                style={{ backgroundColor: 'rgba(10,11,14,0.98)' }}
              >
                <div className="flex items-center justify-between p-4 border-b border-white/8">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{selectedNode.label}</span>
                      <EvalBadge state={selectedNode.badgeState} />
                    </div>
                    <div className="text-xs text-white/40 mt-0.5">{selectedNode.domain}</div>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-white/30 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 border-b border-white/8 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <ScoreChip
                      metric={selectedNode.metric}
                      value={selectedNode.score}
                      unit="%"
                      higherIsBetter
                      delta={selectedNode.score - selectedNode.prevScore}
                      strong={selectedNode.score >= 0.9}
                    />
                    <ScoreChip
                      metric="prev_score"
                      value={selectedNode.prevScore}
                      unit="%"
                      higherIsBetter
                    />
                  </div>
                  <button
                    onClick={() => {
                      setFilterDomain(selectedNode.domainKey);
                      setActiveTab('All Leaderboards');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg border border-violet-500/30 text-xs text-violet-400 hover:bg-violet-500/10 transition-colors"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    Filter leaderboard to {selectedNode.label}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <div className="text-[10px] font-medium uppercase tracking-widest text-white/30 mb-2">
                    Benchmark Leaderboard
                  </div>
                  <LeaderboardTable
                    entries={selectedNode.leaderboard}
                    benchmarkId={selectedNode.benchmarkId}
                    higherIsBetter
                    compact
                    onRowClick={(entry) => {
                      setDrawerEntry({
                        resultId: entry.resultId,
                        entityId: entry.entityId,
                        entityLabel: entry.entityLabel,
                        entityType: entry.entityType,
                        domain: entry.domain,
                        benchmarkId: selectedNode.benchmarkId,
                        benchmarkName: `${selectedNode.label} — ${selectedNode.metric}`,
                        taskId: `${selectedNode.id}-primary`,
                        metric: entry.metric,
                        value: entry.value,
                        unit: '%',
                        higherIsBetter: true,
                        badgeState: entry.badgeState,
                        evalDate: entry.evalDate ?? '—',
                        evaluationFramework: 'szl-native',
                        notes: null,
                        sourceUrl: null,
                      });
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'All Leaderboards' && (
          <div className="flex-1 p-6 overflow-y-auto">
            {filterDomain && (
              <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <span className="text-xs text-violet-300">
                  Showing results filtered to: <strong>{filterDomain}</strong>
                </span>
                <button onClick={() => setFilterDomain(null)} className="ml-auto text-violet-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <LeaderboardTable
              entries={filteredEntries}
              title="All Domains — Portfolio Evidence Scores"
              higherIsBetter
              onRowClick={(entry) => {
                const node = APP_NODES.find((n) => n.id === entry.entityId);
                if (node) {
                  setSelectedNode(node);
                  setActiveTab('Eval Graph');
                }
              }}
            />
          </div>
        )}

        {activeTab === 'Submit Score' && (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-xl mx-auto">
              <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <ShieldCheck className="w-4 h-4 text-violet-400" />
                <span className="text-xs text-violet-300">
                  All submissions undergo automated verification before appearing on leaderboards.
                </span>
              </div>
              <SubmitScoreForm
                domain="decision"
                onSubmit={async (payload: SubmitScorePayload) => {
                  console.log('Score submitted:', payload);
                  setActiveTab('All Leaderboards');
                }}
              />
            </div>
          </div>
        )}
      </div>

      {drawerEntry && (
        <ResultDetailDrawer
          result={drawerEntry}
          open
          onClose={() => setDrawerEntry(null)}
        />
      )}
    </div>
  );
}
