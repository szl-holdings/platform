import { useStandardQuery } from '@szl-holdings/api-client-react';
import { EvidenceDrawer } from '@szl-holdings/design-system/cockpit/evidence-drawer';
import { RecommendationCard } from '@szl-holdings/design-system/cockpit/recommendation-card';
import { ConfidenceMeter } from '@szl-holdings/design-system/proof/confidence-meter';
import { FreshnessChip } from '@szl-holdings/design-system/proof/freshness-chip';
import {
  type PolicyState,
  PolicyStateChip,
} from '@szl-holdings/design-system/proof/policy-state-chip';
import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Clock,
  Database,
  Search,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ACCENT,
  AGENT_RUN_ATTRS,
  apiUrl,
  emitSpan,
  tracedFetch,
} from './cognitive/shared';

function toPolicy(status: string | undefined): PolicyState | undefined {
  if (!status) return undefined;
  if (status === 'approved' || status === 'allowed') return 'allowed';
  if (status === 'blocked' || status === 'rejected' || status === 'denied') return 'blocked';
  if (status === 'pending' || status === 'review' || status === 'escalated')
    return 'requires-approval';
  return undefined;
}

const DOMAIN_COLORS: Record<string, string> = {
  maritime: '#4d8fcc',
  'real-estate': '#22c55e',
  legal: '#a855f7',
  security: '#ef4444',
  finance: '#f59e0b',
  platform: '#8b7ac8',
  ai: '#06b6d4',
};

const HEALTH_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  healthy: { color: '#22c55e', icon: <CheckCircle className="h-3 w-3" /> },
  degraded: { color: '#f59e0b', icon: <AlertTriangle className="h-3 w-3" /> },
  stale: { color: 'var(--gi-text-muted)', icon: <Clock className="h-3 w-3" /> },
  unknown: { color: '#334155', icon: <Clock className="h-3 w-3" /> },
};

type Tab = 'entities' | 'recommendations';

const REFRESH_INTERVAL_MS = 30_000;
const FLASH_DURATION_MS = 2_000;

function usePageVisible(): boolean {
  const [visible, setVisible] = useState(typeof document === 'undefined' ? true : !document.hidden);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onChange = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return visible;
}

function useFlashOnChange<T>(
  items: T[] | undefined,
  getId: (it: T) => string,
  getStamp: (it: T) => string,
): Set<string> {
  const prevRef = useRef<Map<string, string> | null>(null);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!items) return undefined;
    const next = new Map<string, string>();
    for (const it of items) next.set(getId(it), getStamp(it));
    const prev = prevRef.current;
    prevRef.current = next;
    if (!prev) return undefined;
    const changed = new Set<string>();
    for (const [id, stamp] of next.entries()) {
      const before = prev.get(id);
      if (before === undefined || before !== stamp) changed.add(id);
    }
    if (changed.size === 0) return undefined;
    setFlashIds((curr) => {
      const merged = new Set(curr);
      for (const id of changed) merged.add(id);
      return merged;
    });
    const timeout = setTimeout(() => {
      setFlashIds((curr) => {
        if (curr.size === 0) return curr;
        const next2 = new Set(curr);
        for (const id of changed) next2.delete(id);
        return next2;
      });
    }, FLASH_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [items, getId, getStamp]);
  return flashIds;
}

interface EntitySnapshot {
  entityId: string;
  entityType: string;
  domain: string;
  label: string;
  health: string;
  updatedAt: string;
  signalCount?: number;
  evidenceCount?: number;
}

interface EvidenceItem {
  evidenceId: string;
  source: string;
  kind: string;
  ref: string;
  summary: string;
  confidence: number;
  capturedAt: string;
  entityLinks?: { entityId: string; label: string }[];
  policyState?: string;
  drillUrl?: string;
}

interface Recommendation {
  recommendationId: string;
  title: string;
  summary: string;
  domain: string;
  status: string;
  confidence: number;
  generatedAt: string;
  evidenceCount?: number;
  modelId?: string;
  evidenceIds?: string[];
}

interface WhyResponse {
  why: {
    entity: EntitySnapshot;
    evidence: EvidenceItem[];
    signals: { signalId: string; kind: string; value: unknown; ts: string }[];
    recommendations: Recommendation[];
  };
  meta?: { meshVersion: string };
}

interface RecommendationChainResponse {
  chain: {
    recommendation: Recommendation;
    evidence: EvidenceItem[];
  };
  meta?: { meshVersion: string };
}

function deriveFreshness(capturedAt: string | undefined): 'fresh' | 'aging' | 'stale' | 'unknown' {
  if (!capturedAt) return 'unknown';
  const ageMs = Date.now() - new Date(capturedAt).getTime();
  if (Number.isNaN(ageMs)) return 'unknown';
  if (ageMs < 3_600_000) return 'fresh';
  if (ageMs < 86_400_000) return 'aging';
  return 'stale';
}

function buildEvidenceItems(
  raw: EvidenceItem[],
): import('@szl-holdings/design-system/cockpit/evidence-drawer').EvidenceItem[] {
  return raw.map((e) => ({
    evidenceId: e.evidenceId,
    kind: (['raw', 'normalized', 'derived'].includes(e.kind) ? e.kind : 'raw') as
      | 'raw'
      | 'normalized'
      | 'derived',
    source: e.source,
    ref: e.ref,
    summary: e.summary,
    confidence: Math.round((e.confidence ?? 0.8) * 100),
    freshness: deriveFreshness(e.capturedAt),
    capturedAt: e.capturedAt,
    entityLinks: e.entityLinks,
    policyState: toPolicy(e.policyState),
    drillUrl: e.drillUrl,
  }));
}

function EntityList({
  entities,
  selected,
  onSelect,
  flashIds,
}: {
  entities: EntitySnapshot[];
  selected: EntitySnapshot | null;
  onSelect: (e: EntitySnapshot) => void;
  flashIds: Set<string>;
}) {
  if (entities.length === 0) {
    return (
      <div
        className="flex items-center justify-center py-16 text-[13px]"
        style={{ color: '#475569' }}
      >
        No entities found
      </div>
    );
  }

  return (
    <div>
      {entities.map((entity) => {
        const domainColor = DOMAIN_COLORS[entity.domain] ?? '#475569';
        const health = HEALTH_CONFIG[entity.health] ?? HEALTH_CONFIG.unknown;
        const isSelected = selected?.entityId === entity.entityId;
        const isFlashing = flashIds.has(entity.entityId);

        return (
          <div
            key={entity.entityId}
            onClick={() => onSelect(entity)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              cursor: 'pointer',
              background: isSelected ? `${ACCENT}0a` : 'transparent',
              borderLeft: isSelected ? `2px solid ${ACCENT}` : '2px solid transparent',
              transition: 'background 0.1s',
              animation: isFlashing ? 'evidenceFlash 2s ease-out' : undefined,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: `${domainColor}15`,
                border: `1px solid ${domainColor}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: domainColor,
              }}
            >
              <Database className="h-4 w-4" />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gi-text-primary)' }}>
                  {entity.label}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: domainColor,
                    background: `${domainColor}12`,
                    padding: '1px 6px',
                    borderRadius: 3,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    border: `1px solid ${domainColor}25`,
                  }}
                >
                  {entity.domain}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 11,
                  color: '#475569',
                }}
              >
                <span>{entity.entityType}</span>
                {entity.evidenceCount !== undefined && <span>{entity.evidenceCount} evidence</span>}
                {entity.signalCount !== undefined && <span>{entity.signalCount} signals</span>}
                <FreshnessChip timestamp={entity.updatedAt} />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: health.color,
                flexShrink: 0,
              }}
            >
              {health.icon}
              <span style={{ fontSize: 10, fontWeight: 600 }}>{entity.health}</span>
            </div>

            <ChevronRight className="h-4 w-4" style={{ color: '#334155', flexShrink: 0 }} />
          </div>
        );
      })}
    </div>
  );
}

function EntityDetailPanel({
  entity,
  onViewEvidence,
}: {
  entity: EntitySnapshot;
  onViewEvidence: (evidence: EvidenceItem[]) => void;
}) {
  const { data, isLoading, error } = useStandardQuery<WhyResponse>({
    queryKey: ['evidence-explorer', 'why', entity.entityId],
    queryFn: () =>
      tracedFetch<WhyResponse>(
        'evidence_explorer.entity_why.fetch',
        apiUrl(`/evidence-graph/why/${entity.entityId}`),
        {
          [AGENT_RUN_ATTRS.EVIDENCE_ENTITY_ID]: entity.entityId,
          [AGENT_RUN_ATTRS.RUN_DOMAIN]: entity.domain,
        },
      ),
    staleTime: 15_000,
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });

  const why = data?.why;

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        padding: 20,
        position: 'sticky',
        top: 20,
        height: 'fit-content',
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gi-text-primary)', marginBottom: 4 }}>
          {entity.label}
        </div>
        <div style={{ fontSize: 11, color: '#475569' }}>
          {entity.entityType} · {entity.domain}
        </div>
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '30px 0' }}>
          <div
            style={{
              width: 20,
              height: 20,
              border: `2px solid ${ACCENT}`,
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto',
            }}
          />
        </div>
      )}

      {error && <div style={{ color: '#ef4444', fontSize: 12 }}>Failed to load evidence</div>}

      {why && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {why.evidence.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 10,
                }}
              >
                Evidence ({why.evidence.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                {why.evidence.slice(0, 3).map((ev) => (
                  <div
                    key={ev.evidenceId}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 7,
                      padding: '8px 10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: '#8b7ac8',
                          background: '#8b7ac815',
                          padding: '1px 6px',
                          borderRadius: 3,
                        }}
                      >
                        {ev.kind}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--gi-text-muted)' }}>{ev.source}</span>
                    </div>
                    <div
                      style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5, marginBottom: 6 }}
                    >
                      {ev.summary}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ConfidenceMeter
                        value={Math.round((ev.confidence ?? 0.8) * 100)}
                        variant="compact"
                      />
                      <FreshnessChip timestamp={ev.capturedAt} />
                    </div>
                  </div>
                ))}
              </div>
              {why.evidence.length > 3 && (
                <button
                  onClick={() => onViewEvidence(why.evidence)}
                  style={{
                    width: '100%',
                    background: `${ACCENT}12`,
                    border: `1px solid ${ACCENT}30`,
                    borderRadius: 6,
                    padding: '7px 0',
                    color: ACCENT,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  View all {why.evidence.length} evidence items
                </button>
              )}
              {why.evidence.length <= 3 && why.evidence.length > 0 && (
                <button
                  onClick={() => onViewEvidence(why.evidence)}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 6,
                    padding: '7px 0',
                    color: 'var(--gi-text-muted)',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Open Evidence Drawer
                </button>
              )}
            </div>
          )}

          {why.recommendations.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 8,
                }}
              >
                Linked Recommendations ({why.recommendations.length})
              </div>
              {why.recommendations.slice(0, 2).map((rec) => (
                <div
                  key={rec.recommendationId}
                  style={{
                    padding: '8px 10px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 7,
                    marginBottom: 6,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--gi-text-primary)', marginBottom: 4 }}>
                    {rec.title}
                  </div>
                  <ConfidenceMeter
                    value={Math.round((rec.confidence ?? 0.8) * 100)}
                    variant="compact"
                  />
                </div>
              ))}
            </div>
          )}

          {why.evidence.length === 0 && why.recommendations.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#334155', fontSize: 12 }}>
              No evidence recorded for this entity
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EvidenceExplorer() {
  const [tab, setTab] = useState<Tab>('entities');
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const pageVisible = usePageVisible();
  const [selectedEntity, setSelectedEntity] = useState<EntitySnapshot | null>(null);
  const [drawerEvidence, setDrawerEvidence] = useState<EvidenceItem[]>([]);
  const [drawerTitle, setDrawerTitle] = useState('Evidence');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const pageLoadRef = useRef(performance.now());
  useEffect(() => {
    const loadedAt = performance.now();
    emitSpan({
      name: 'page.load',
      attributes: {
        [AGENT_RUN_ATTRS.PAGE_LOAD_PATH]: '/operations/evidence-explorer',
        [AGENT_RUN_ATTRS.PAGE_LOAD_LATENCY_MS]: Math.round(loadedAt - pageLoadRef.current),
        [AGENT_RUN_ATTRS.RUN_DOMAIN]: 'platform',
      },
      durationMs: Math.round(loadedAt - pageLoadRef.current),
      status: 'ok',
    });
  }, []);

  const { data: entitiesData, isLoading: entitiesLoading } = useStandardQuery({
    queryKey: ['evidence-explorer', 'entities', domainFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (domainFilter !== 'all') params.set('domain', domainFilter);
      const url = apiUrl(`/evidence-graph/entities?${params}`);
      return tracedFetch<{ entities: EntitySnapshot[]; total: number }>(
        'evidence_explorer.entities.fetch',
        url,
        {
          [AGENT_RUN_ATTRS.PAGE_LOAD_PATH]: '/operations/evidence-explorer',
          [AGENT_RUN_ATTRS.EVIDENCE_KIND]: 'normalized',
          domain: domainFilter,
        },
      );
    },
    staleTime: 15_000,
    enabled: tab === 'entities',
    refetchInterval: tab === 'entities' && pageVisible ? REFRESH_INTERVAL_MS : false,
    refetchIntervalInBackground: false,
  });

  const { data: recsData, isLoading: recsLoading } = useStandardQuery({
    queryKey: ['evidence-explorer', 'recommendations', domainFilter],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '100' });
      if (domainFilter !== 'all') params.set('domain', domainFilter);
      const url = apiUrl(`/evidence-graph/recommendations?${params}`);
      return tracedFetch<{ recommendations: Recommendation[]; total: number }>(
        'evidence_explorer.recommendations.fetch',
        url,
        { [AGENT_RUN_ATTRS.PAGE_LOAD_PATH]: '/operations/evidence-explorer', domain: domainFilter },
      );
    },
    staleTime: 15_000,
    enabled: tab === 'recommendations',
    refetchInterval: tab === 'recommendations' && pageVisible ? REFRESH_INTERVAL_MS : false,
    refetchIntervalInBackground: false,
  });

  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const { data: recChainData } = useStandardQuery<RecommendationChainResponse>({
    queryKey: ['evidence-explorer', 'rec-chain', selectedRec?.recommendationId],
    queryFn: () =>
      tracedFetch<RecommendationChainResponse>(
        'evidence_explorer.rec_chain.fetch',
        apiUrl(`/evidence-graph/recommendations/${selectedRec?.recommendationId}`),
        {
          [AGENT_RUN_ATTRS.EVIDENCE_ENTITY_ID]: selectedRec?.recommendationId,
          [AGENT_RUN_ATTRS.RUN_DOMAIN]: selectedRec?.domain,
          [AGENT_RUN_ATTRS.PAGE_LOAD_PATH]: '/operations/evidence-explorer',
        },
      ),
    staleTime: 15_000,
    enabled: !!selectedRec,
    refetchInterval: selectedRec && pageVisible ? REFRESH_INTERVAL_MS : false,
    refetchIntervalInBackground: false,
  });

  const domains = [
    'all',
    'maritime',
    'real-estate',
    'legal',
    'security',
    'finance',
    'platform',
    'ai',
  ];

  const filteredEntities = (entitiesData?.entities ?? []).filter(
    (e) =>
      !search ||
      e.label.toLowerCase().includes(search.toLowerCase()) ||
      e.entityType.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredRecs = (recsData?.recommendations ?? []).filter(
    (r) =>
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.summary.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    if (!selectedRec || !recsData?.recommendations) return;
    const updated = recsData.recommendations.find(
      (r) => r.recommendationId === selectedRec.recommendationId,
    );
    if (!updated) return;
    if (
      updated.confidence !== selectedRec.confidence ||
      updated.status !== selectedRec.status ||
      updated.generatedAt !== selectedRec.generatedAt ||
      updated.evidenceCount !== selectedRec.evidenceCount ||
      updated.summary !== selectedRec.summary ||
      updated.title !== selectedRec.title
    ) {
      setSelectedRec(updated);
    }
  }, [recsData, selectedRec]);

  useEffect(() => {
    if (!selectedEntity || !entitiesData?.entities) return;
    const updated = entitiesData.entities.find((e) => e.entityId === selectedEntity.entityId);
    if (!updated) return;
    if (
      updated.updatedAt !== selectedEntity.updatedAt ||
      updated.health !== selectedEntity.health ||
      updated.signalCount !== selectedEntity.signalCount ||
      updated.evidenceCount !== selectedEntity.evidenceCount ||
      updated.label !== selectedEntity.label
    ) {
      setSelectedEntity(updated);
    }
  }, [entitiesData, selectedEntity]);

  const entityFlashIds = useFlashOnChange(
    entitiesData?.entities,
    (e) => e.entityId,
    (e) => `${e.updatedAt}|${e.signalCount ?? ''}|${e.evidenceCount ?? ''}|${e.health}`,
  );
  const recFlashIds = useFlashOnChange(
    recsData?.recommendations,
    (r) => r.recommendationId,
    (r) => `${r.generatedAt}|${r.confidence}|${r.status}|${r.evidenceCount ?? ''}`,
  );

  const openDrawerForEntity = useCallback((evidence: EvidenceItem[], entityLabel?: string) => {
    setDrawerEvidence(evidence);
    setDrawerTitle(`Evidence — ${entityLabel ?? 'Entity'}`);
    setDrawerOpen(true);
  }, []);

  const openDrawerForRec = useCallback(
    (rec: Recommendation) => {
      if (recChainData?.chain?.evidence) {
        setDrawerEvidence(recChainData.chain.evidence);
        setDrawerTitle(`Evidence — ${rec.title}`);
        setDrawerOpen(true);
      }
    },
    [recChainData],
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: 'entities', label: 'Entity View' },
    { id: 'recommendations', label: 'Recommendation View' },
  ];

  const meshStatus = entitiesData
    ? `${entitiesData.total} entities`
    : recsData
      ? `${recsData.total} recommendations`
      : 'Loading…';

  return (
    <div
      style={{
        background: 'var(--gi-bg-base)',
        minHeight: '100vh',
        color: 'var(--gi-text-primary)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--gi-text-primary)' }}>
              Evidence Explorer
            </span>
            <span
              style={{
                fontSize: 11,
                color: ACCENT,
                background: `${ACCENT}20`,
                padding: '2px 10px',
                borderRadius: 20,
                border: `1px solid ${ACCENT}40`,
                fontWeight: 600,
              }}
            >
              LIVE
            </span>
            <span style={{ fontSize: 11, color: '#475569', marginLeft: 'auto' }}>{meshStatus}</span>
          </div>
          <p style={{ color: 'var(--gi-text-muted)', fontSize: 13, margin: 0 }}>
            Inspect evidence behind every entity and recommendation — raw signals, normalized facts,
            confidence, freshness, and what changed recently.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 20,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 8,
              padding: 4,
            }}
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  setSelectedEntity(null);
                  setSelectedRec(null);
                }}
                style={{
                  background: tab === t.id ? ACCENT : 'transparent',
                  color: tab === t.id ? '#fff' : 'var(--gi-text-muted)',
                  border: 'none',
                  borderRadius: 6,
                  padding: '7px 18px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
            <Search
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 14,
                height: 14,
                color: '#475569',
              }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === 'entities' ? 'Search entities…' : 'Search recommendations…'}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                color: 'var(--gi-text-primary)',
                fontSize: 12,
                padding: '8px 10px 8px 30px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            {domains.slice(0, 6).map((d) => (
              <button
                key={d}
                onClick={() => setDomainFilter(d)}
                style={{
                  background:
                    domainFilter === d ? (DOMAIN_COLORS[d] ?? ACCENT) : 'rgba(255,255,255,0.04)',
                  color: domainFilter === d ? '#fff' : 'var(--gi-text-muted)',
                  border: 'none',
                  borderRadius: 5,
                  padding: '5px 10px',
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  transition: 'all 0.12s',
                }}
              >
                {d === 'all' ? 'All' : d}
              </button>
            ))}
          </div>
        </div>

        {tab === 'entities' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: selectedEntity ? '1fr 380px' : '1fr',
              gap: 20,
              alignItems: 'start',
            }}
          >
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              {entitiesLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      border: `2px solid ${ACCENT}`,
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      margin: '0 auto',
                    }}
                  />
                </div>
              ) : (
                <EntityList
                  entities={filteredEntities}
                  selected={selectedEntity}
                  onSelect={setSelectedEntity}
                  flashIds={entityFlashIds}
                />
              )}
            </div>

            {selectedEntity && (
              <EntityDetailPanel
                entity={selectedEntity}
                onViewEvidence={(evidence) => openDrawerForEntity(evidence, selectedEntity.label)}
              />
            )}
          </div>
        )}

        {tab === 'recommendations' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: selectedRec ? '1fr 360px' : '1fr',
              gap: 20,
              alignItems: 'start',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recsLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      border: `2px solid ${ACCENT}`,
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      margin: '0 auto',
                    }}
                  />
                </div>
              ) : filteredRecs.length === 0 ? (
                <div
                  style={{ textAlign: 'center', padding: '60px 0', color: '#475569', fontSize: 13 }}
                >
                  No recommendations found
                </div>
              ) : (
                filteredRecs.map((rec) => (
                  <div
                    key={rec.recommendationId}
                    style={{
                      borderRadius: 12,
                      animation: recFlashIds.has(rec.recommendationId)
                        ? 'evidenceFlash 2s ease-out'
                        : undefined,
                    }}
                  >
                    <RecommendationCard
                      recommendationId={rec.recommendationId}
                      title={rec.title}
                      summary={rec.summary}
                      confidence={Math.round((rec.confidence ?? 0.8) * 100)}
                      domain={rec.domain}
                      generatedAt={rec.generatedAt}
                      evidenceCount={rec.evidenceCount}
                      modelId={rec.modelId}
                      policyState={toPolicy(rec.status)}
                      onInspect={() => setSelectedRec(rec)}
                      variant="full"
                      className={
                        selectedRec?.recommendationId === rec.recommendationId
                          ? 'border-[#8b7ac850]'
                          : ''
                      }
                    />
                  </div>
                ))
              )}
            </div>

            {selectedRec && (
              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12,
                  padding: 20,
                  position: 'sticky',
                  top: 20,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: 14,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--gi-text-primary)',
                        marginBottom: 6,
                        lineHeight: 1.4,
                      }}
                    >
                      {selectedRec.title}
                    </div>
                    <div
                      style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
                    >
                      <ConfidenceMeter
                        value={Math.round((selectedRec.confidence ?? 0.8) * 100)}
                        variant="compact"
                      />
                      <FreshnessChip timestamp={selectedRec.generatedAt} />
                      {toPolicy(selectedRec.status) && (
                        <PolicyStateChip state={toPolicy(selectedRec.status)!} />
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRec(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--gi-text-muted)',
                      cursor: 'pointer',
                      fontSize: 18,
                      marginLeft: 10,
                    }}
                  >
                    ×
                  </button>
                </div>

                <p style={{ fontSize: 12, color: 'var(--gi-text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
                  {selectedRec.summary}
                </p>

                {recChainData?.chain?.evidence && recChainData.chain.evidence.length > 0 ? (
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#475569',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        marginBottom: 10,
                      }}
                    >
                      Evidence Chain ({recChainData.chain.evidence.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {recChainData.chain.evidence.slice(0, 3).map((ev) => (
                        <div
                          key={ev.evidenceId}
                          style={{
                            padding: '8px 10px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 7,
                          }}
                        >
                          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                            {ev.summary}
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <ConfidenceMeter
                              value={Math.round((ev.confidence ?? 0.8) * 100)}
                              variant="compact"
                            />
                            <span style={{ fontSize: 10, color: '#475569' }}>{ev.source}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => openDrawerForRec(selectedRec)}
                      style={{
                        width: '100%',
                        marginTop: 10,
                        background: `${ACCENT}12`,
                        border: `1px solid ${ACCENT}30`,
                        borderRadius: 6,
                        padding: '8px 0',
                        color: ACCENT,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Open Full Evidence Drawer
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '20px 0',
                      color: '#334155',
                      fontSize: 12,
                    }}
                  >
                    Loading evidence chain…
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <EvidenceDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerTitle}
        evidence={buildEvidenceItems(drawerEvidence)}
        accent={ACCENT}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes evidenceFlash {
          0%   { background-color: rgba(139,122,200,0.28); box-shadow: inset 2px 0 0 ${ACCENT}; }
          60%  { background-color: rgba(139,122,200,0.12); }
          100% { background-color: transparent; box-shadow: none; }
        }
      `}</style>
    </div>
  );
}
