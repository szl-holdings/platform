/**
 * PRAXISHopQuery — dedicated hop-traversal query interface for the PRAXIS knowledge graph.
 * Lets operators traverse entity relationships visually and ask natural-language
 * graph questions ("show me all entities connected to this vessel owner within 2 hops").
 */

import { color } from '@szl-holdings/design-system';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Building2,
  ChevronRight,
  Globe,
  Layers,
  Loader2,
  Network,
  Scale,
  Search,
  Ship,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import {
  type EntityRecord,
  type EdgeRecord,
  type EntityType,
  PRAXIS_ENTITIES,
  PRAXIS_EDGES,
} from '@/lib/nexus/graph';

interface HopResult {
  entity: EntityRecord;
  hops: number;
  path: string[];
  connectingEdges: EdgeRecord[];
}

interface QueryResult {
  query: string;
  anchorEntity: EntityRecord;
  maxHops: number;
  results: HopResult[];
  naturalLanguageAnswer: string;
  executionMs: number;
}

const ENTITY_ICONS: Record<EntityType, React.ElementType> = {
  person: User,
  organization: Building2,
  vessel: Ship,
  property: Building2,
  matter: Scale,
  threat: AlertTriangle,
  asset: Layers,
};

const ENTITY_COLORS: Record<EntityType, string> = {
  person: '#60a5fa',
  organization: '#a78bfa',
  vessel: '#38bdf8',
  property: '#4ade80',
  matter: '#d4a054',
  threat: '#ef4444',
  asset: '#f59e0b',
};

const RISK_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#4ade80',
  none: '#64748b',
};

const NL_SUGGESTIONS = [
  'Show me all entities connected to this vessel owner within 2 hops',
  'Find all organizations that have legal exposure through related parties',
  'Which assets are connected to sanctioned entities?',
  'Show me the ownership chain for this vessel',
  'Find all legal matters connected to high-risk organizations',
];

function traverseGraph(
  anchorId: string,
  maxHops: number,
  entities: EntityRecord[],
  edges: EdgeRecord[],
): HopResult[] {
  const results: HopResult[] = [];
  const visited = new Set<string>([anchorId]);
  const queue: Array<{ entityId: string; hops: number; path: string[]; connectingEdges: EdgeRecord[] }> = [
    { entityId: anchorId, hops: 0, path: [anchorId], connectingEdges: [] },
  ];

  const entityMap = new Map(entities.map((e) => [e.id, e]));
  const edgeMap: Map<string, EdgeRecord[]> = new Map();
  for (const edge of edges) {
    if (!edgeMap.has(edge.sourceId)) edgeMap.set(edge.sourceId, []);
    edgeMap.get(edge.sourceId)!.push(edge);
    if (!edgeMap.has(edge.targetId)) edgeMap.set(edge.targetId, []);
    edgeMap.get(edge.targetId)!.push(edge);
  }

  while (queue.length > 0) {
    const { entityId, hops, path, connectingEdges } = queue.shift()!;
    if (hops > 0) {
      const entity = entityMap.get(entityId);
      if (entity) {
        results.push({ entity, hops, path, connectingEdges });
      }
    }
    if (hops >= maxHops) continue;

    const connectedEdges = edgeMap.get(entityId) ?? [];
    for (const edge of connectedEdges) {
      const nextId = edge.sourceId === entityId ? edge.targetId : edge.sourceId;
      if (!visited.has(nextId)) {
        visited.add(nextId);
        queue.push({
          entityId: nextId,
          hops: hops + 1,
          path: [...path, nextId],
          connectingEdges: [...connectingEdges, edge],
        });
      }
    }
  }

  return results.sort((a, b) => a.hops - b.hops || b.entity.riskScore - a.entity.riskScore);
}

function buildNaturalLanguageAnswer(
  query: string,
  anchor: EntityRecord,
  results: HopResult[],
  maxHops: number,
): string {
  const criticalCount = results.filter((r) => r.entity.risk === 'critical').length;
  const highCount = results.filter((r) => r.entity.risk === 'high').length;
  const vessels = results.filter((r) => r.entity.type === 'vessel');
  const threats = results.filter((r) => r.entity.type === 'threat');
  const orgs = results.filter((r) => r.entity.type === 'organization');

  let answer = `Within ${maxHops} hop${maxHops !== 1 ? 's' : ''} of **${anchor.label}**, PRAXIS identified ${results.length} connected entit${results.length !== 1 ? 'ies' : 'y'}. `;

  if (criticalCount > 0) {
    answer += `**${criticalCount} critical-risk** entit${criticalCount !== 1 ? 'ies' : 'y'} require immediate attention. `;
  }
  if (highCount > 0) {
    answer += `**${highCount} high-risk** connection${highCount !== 1 ? 's' : ''} detected. `;
  }
  if (vessels.length > 0) {
    answer += `Maritime exposure includes ${vessels.map((v) => v.entity.label).join(', ')}. `;
  }
  if (threats.length > 0) {
    answer += `Threat indicators present: ${threats.map((t) => t.entity.label).join(', ')}. `;
  }
  if (results.length === 0) {
    answer = `No entities found connected to **${anchor.label}** within ${maxHops} hop${maxHops !== 1 ? 's' : ''}. The entity appears to be an isolated node in the current knowledge graph.`;
  }

  return answer;
}

interface PRAXISHopQueryProps {
  initialAnchorId?: string;
}

export function PRAXISHopQuery({ initialAnchorId }: PRAXISHopQueryProps) {
  const [query, setQuery] = useState('');
  const [anchorSearch, setAnchorSearch] = useState('');
  const [selectedAnchor, setSelectedAnchor] = useState<EntityRecord | null>(
    initialAnchorId ? PRAXIS_ENTITIES.find((e) => e.id === initialAnchorId) ?? null : null,
  );
  const [maxHops, setMaxHops] = useState(2);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [anchorDropdown, setAnchorDropdown] = useState(false);
  const [selectedHopResult, setSelectedHopResult] = useState<HopResult | null>(null);

  const filteredEntities = anchorSearch.length >= 2
    ? PRAXIS_ENTITIES.filter((e) =>
        e.label.toLowerCase().includes(anchorSearch.toLowerCase()) ||
        e.type.toLowerCase().includes(anchorSearch.toLowerCase())
      ).slice(0, 8)
    : [];

  const runQuery = useCallback(async () => {
    if (!selectedAnchor) return;
    setIsRunning(true);
    setResult(null);

    const start = Date.now();
    await new Promise((r) => setTimeout(r, 800));

    const results = traverseGraph(selectedAnchor.id, maxHops, PRAXIS_ENTITIES, PRAXIS_EDGES);
    const naturalLanguageAnswer = buildNaturalLanguageAnswer(query, selectedAnchor, results, maxHops);

    setResult({
      query: query || `Show all entities within ${maxHops} hop${maxHops !== 1 ? 's' : ''} of ${selectedAnchor.label}`,
      anchorEntity: selectedAnchor,
      maxHops,
      results,
      naturalLanguageAnswer,
      executionMs: Date.now() - start,
    });
    setIsRunning(false);
    setSelectedHopResult(null);
  }, [selectedAnchor, maxHops, query]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Network className="w-4 h-4" style={{ color: color.accent.blue }} />
        <h3 className="text-sm font-semibold" style={{ color: color.text.primary }}>Graph Hop Traversal</h3>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono" style={{ background: `${color.accent.blue}20`, color: color.accent.blue }}>
          BETA
        </span>
      </div>

      {/* NL Query Input */}
      <div className="space-y-2">
        <label className="text-[11px]" style={{ color: color.text.muted }}>Natural Language Query</label>
        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Show me all entities connected to this vessel owner within 2 hops"
            rows={2}
            className="w-full px-3 py-2 rounded-xl text-xs resize-none"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: color.text.primary,
              outline: 'none',
            }}
          />
        </div>
        {/* Suggestions */}
        <div className="flex flex-wrap gap-1.5">
          {NL_SUGGESTIONS.slice(0, 3).map((s) => (
            <button
              key={s}
              onClick={() => setQuery(s)}
              className="text-[10px] px-2 py-1 rounded-lg transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', color: color.text.muted, border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {s.slice(0, 42)}…
            </button>
          ))}
        </div>
      </div>

      {/* Anchor Entity Selector */}
      <div className="space-y-2">
        <label className="text-[11px]" style={{ color: color.text.muted }}>Anchor Entity</label>
        {selectedAnchor ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: `${ENTITY_COLORS[selectedAnchor.type]}12`, border: `1px solid ${ENTITY_COLORS[selectedAnchor.type]}30` }}>
            {(() => { const Icon = ENTITY_ICONS[selectedAnchor.type]; return <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: ENTITY_COLORS[selectedAnchor.type] }} />; })()}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: color.text.primary }}>{selectedAnchor.label}</p>
              <p className="text-[10px]" style={{ color: color.text.muted }}>{selectedAnchor.subtitle}</p>
            </div>
            <button onClick={() => setSelectedAnchor(null)} className="p-0.5 rounded hover:opacity-70">
              <X className="w-3.5 h-3.5" style={{ color: color.text.muted }} />
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: color.text.muted }} />
              <input
                value={anchorSearch}
                onChange={(e) => { setAnchorSearch(e.target.value); setAnchorDropdown(true); }}
                onFocus={() => setAnchorDropdown(true)}
                placeholder="Search entities (Viktor Sorokin, MV Arctic Eagle…)"
                className="w-full pl-8 pr-3 py-2 rounded-xl text-xs"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: color.text.primary,
                  outline: 'none',
                }}
              />
            </div>
            <AnimatePresence>
              {anchorDropdown && filteredEntities.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute z-20 w-full mt-1 rounded-xl overflow-hidden"
                  style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {filteredEntities.map((entity) => {
                    const Icon = ENTITY_ICONS[entity.type];
                    return (
                      <button
                        key={entity.id}
                        onClick={() => { setSelectedAnchor(entity); setAnchorSearch(''); setAnchorDropdown(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-white/[0.04] transition-colors"
                      >
                        <Icon className="w-3 h-3 flex-shrink-0" style={{ color: ENTITY_COLORS[entity.type] }} />
                        <div>
                          <p className="text-xs text-white/80">{entity.label}</p>
                          <p className="text-[10px]" style={{ color: color.text.muted }}>{entity.type} · {entity.subtitle.slice(0, 36)}</p>
                        </div>
                        <span
                          className="ml-auto text-[9px] px-1 py-0.5 rounded font-mono"
                          style={{ background: `${RISK_COLORS[entity.risk]}18`, color: RISK_COLORS[entity.risk] }}
                        >
                          {entity.risk}
                        </span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Hop Count */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px]" style={{ color: color.text.muted }}>Max Hops</label>
          <span className="text-[11px] font-bold" style={{ color: color.accent.blue }}>{maxHops} hop{maxHops !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() => setMaxHops(n)}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: maxHops === n ? `${color.accent.blue}20` : 'rgba(255,255,255,0.04)',
                color: maxHops === n ? color.accent.blue : color.text.muted,
                border: `1px solid ${maxHops === n ? `${color.accent.blue}40` : 'rgba(255,255,255,0.07)'}`,
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Run Button */}
      <button
        onClick={runQuery}
        disabled={!selectedAnchor || isRunning}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
        style={{
          background: !selectedAnchor || isRunning ? 'rgba(255,255,255,0.06)' : color.accent.blue,
          color: !selectedAnchor || isRunning ? color.text.muted : 'white',
        }}
      >
        {isRunning ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Traversing Graph…</>
        ) : (
          <><Sparkles className="w-4 h-4" /> Run Hop Query</>
        )}
      </button>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* NL Answer */}
            <div className="rounded-xl p-4" style={{ background: `${color.accent.blue}08`, border: `1px solid ${color.accent.blue}20` }}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5" style={{ color: color.accent.blue }} />
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: color.accent.blue }}>PRAXIS Answer</span>
                <span className="ml-auto text-[10px]" style={{ color: color.text.muted }}>{result.executionMs}ms</span>
              </div>
              <p
                className="text-[12px] leading-relaxed"
                style={{ color: `${color.text.primary}cc` }}
                dangerouslySetInnerHTML={{
                  __html: result.naturalLanguageAnswer.replace(/\*\*(.*?)\*\*/g, '<strong style="color: white">$1</strong>'),
                }}
              />
            </div>

            {/* Entity Results */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-mono uppercase tracking-wider" style={{ color: color.text.muted }}>
                  Connected Entities ({result.results.length})
                </p>
                <div className="flex gap-2 text-[10px]">
                  {[1, 2, 3].map((hop) => {
                    const count = result.results.filter((r) => r.hops === hop).length;
                    if (!count) return null;
                    return (
                      <span key={hop} style={{ color: color.text.muted }}>
                        {hop}H: {count}
                      </span>
                    );
                  })}
                </div>
              </div>
              {result.results.map((hopResult, i) => {
                const Icon = ENTITY_ICONS[hopResult.entity.type];
                const isSelected = selectedHopResult?.entity.id === hopResult.entity.id;
                return (
                  <motion.button
                    key={hopResult.entity.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedHopResult(isSelected ? null : hopResult)}
                    className="w-full text-left rounded-xl p-3 transition-all"
                    style={{
                      background: isSelected ? `${ENTITY_COLORS[hopResult.entity.type]}10` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isSelected ? `${ENTITY_COLORS[hopResult.entity.type]}30` : 'rgba(255,255,255,0.05)'}`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: `${ENTITY_COLORS[hopResult.entity.type]}15` }}
                        >
                          <Icon className="w-3 h-3" style={{ color: ENTITY_COLORS[hopResult.entity.type] }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold" style={{ color: color.text.primary }}>{hopResult.entity.label}</span>
                            <span
                              className="text-[9px] font-mono uppercase px-1 py-0.5 rounded"
                              style={{ background: `${RISK_COLORS[hopResult.entity.risk]}18`, color: RISK_COLORS[hopResult.entity.risk] }}
                            >
                              {hopResult.entity.risk}
                            </span>
                          </div>
                          <p className="text-[10px] mt-0.5" style={{ color: color.text.muted }}>{hopResult.entity.subtitle}</p>
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-2 space-y-1"
                            >
                              {hopResult.connectingEdges.map((edge, ei) => (
                                <div key={ei} className="flex items-center gap-1.5 text-[10px]" style={{ color: color.text.muted }}>
                                  <div className="w-1 h-1 rounded-full bg-current opacity-40" />
                                  <span className="font-mono">{edge.relationship}</span>
                                  <span className="opacity-60">· {edge.confidence}% confidence · {edge.inferred ? 'inferred' : 'evidenced'}</span>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(255,255,255,0.06)', color: color.text.muted }}
                        >
                          {hopResult.hops}H
                        </span>
                        <span className="text-[9px]" style={{ color: color.text.muted }}>{hopResult.entity.riskScore}</span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
              {result.results.length === 0 && (
                <div className="rounded-xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Globe className="w-6 h-6 mx-auto mb-2" style={{ color: `${color.text.muted}40` }} />
                  <p className="text-xs" style={{ color: color.text.muted }}>No entities found within {result.maxHops} hops</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
