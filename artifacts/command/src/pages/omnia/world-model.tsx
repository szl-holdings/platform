import {
  Activity,
  ChevronRight,
  ExternalLink,
  Filter,
  Layers,
  RefreshCw,
  Search,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { OmniaLayout } from './layout';

const BASE_API = import.meta.env.BASE_URL.replace(/\/$/, '').replace(/\/command$/, '') || '';
const ACCENT = '#8b7ac8';

const DOMAIN_COLORS: Record<string, string> = {
  aegis: '#ef4444',
  sentra: '#22c55e',
  vessels: '#4d8fcc',
  terra: '#22c55e',
  counsel: '#8b5cf6',
  command: '#8b7ac8',
  a11oy: '#c9b787',
  holdings: '#c9b787',
  pulse: '#f59e0b',
  lyte: '#3b82f6',
};

const EDGE_COLORS: Record<string, string> = {
  causal: '#ef4444',
  associative: '#3b82f6',
  hierarchical: '#22c55e',
  temporal: '#f59e0b',
  dependency: '#6b7280',
  governs: '#8b7ac8',
};

interface Entity {
  id: string;
  label: string;
  type: string;
  domain: string;
  confidence: number;
  freshness: number;
  provenance: string[];
  description: string;
  lastSeen: string;
  x?: number;
  y?: number;
}

interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  type: string;
  confidence: number;
  strength: number;
  lastActive: string;
}

interface WorldModelData {
  entities: Entity[];
  relationships: Relationship[];
  meta: {
    totalEntities: number;
    totalRelationships: number;
    lastRefreshed: string;
    activeDomains: string[];
  };
}

function layoutEntities(entities: Entity[], width: number, height: number): Entity[] {
  const cx = width / 2;
  const cy = height / 2;
  const domains = [...new Set(entities.map((e) => e.domain))];
  const byDomain: Record<string, Entity[]> = {};
  for (const e of entities) {
    if (!byDomain[e.domain]) byDomain[e.domain] = [];
    byDomain[e.domain].push(e);
  }
  const result: Entity[] = [];
  domains.forEach((domain, di) => {
    const angle = (di / domains.length) * Math.PI * 2 - Math.PI / 2;
    const dr = Math.min(cx, cy) * 0.52;
    const dcx = cx + Math.cos(angle) * dr;
    const dcy = cy + Math.sin(angle) * dr;
    const items = byDomain[domain] ?? [];
    items.forEach((entity, ei) => {
      const er = items.length > 1 ? 55 : 0;
      const ea = items.length > 1 ? (ei / items.length) * Math.PI * 2 : 0;
      result.push({ ...entity, x: dcx + Math.cos(ea) * er, y: dcy + Math.sin(ea) * er });
    });
  });
  return result;
}

export default function OmniaWorldModelPage() {
  const [data, setData] = useState<WorldModelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null);
  const [filterDomain, setFilterDomain] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoom, setZoom] = useState(1);
  const [rippleData, setRippleData] = useState<any>(null);
  const [showRipple, setShowRipple] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const W = 900;
  const H = 600;

  const apiBase = `${BASE_API}/api`;

  const load = async (showR = false) => {
    if (showR) setRefreshing(true);
    try {
      const res = await fetch(`${apiBase}/omnia/graph`);
      if (res.ok) setData(await res.json());
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const laidOut = useMemo(() => {
    if (!data) return [];
    return layoutEntities(data.entities, W, H);
  }, [data]);

  const filtered = useMemo(() => {
    return laidOut.filter((e) => {
      if (filterDomain !== 'all' && e.domain !== filterDomain) return false;
      if (searchQuery && !e.label.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [laidOut, filterDomain, searchQuery]);

  const filteredIds = useMemo(() => new Set(filtered.map((e) => e.id)), [filtered]);

  const visibleRels = useMemo(() => {
    if (!data) return [];
    return data.relationships.filter(
      (r) => filteredIds.has(r.sourceId) && filteredIds.has(r.targetId),
    );
  }, [data, filteredIds]);

  const loadRipple = useCallback(async (entityId: string) => {
    try {
      const res = await fetch(`${apiBase}/omnia/ripple/${entityId}`);
      if (res.ok) setRippleData(await res.json());
    } catch {}
  }, [apiBase]);

  const handleEntityClick = useCallback((entity: Entity) => {
    setSelectedEntity(entity);
    setShowRipple(false);
    loadRipple(entity.id);
  }, [loadRipple]);

  const domains = data ? [...new Set(data.entities.map((e) => e.domain))] : [];

  if (loading) {
    return (
      <OmniaLayout title="World Model" subtitle="Loading entity graph…">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'rgba(255,255,255,0.4)' }}>
          <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginRight: 10 }} />
          Building world model…
        </div>
      </OmniaLayout>
    );
  }

  return (
    <OmniaLayout
      title="World Model"
      subtitle={`${data?.meta.totalEntities ?? 0} entities · ${data?.meta.totalRelationships ?? 0} relationships · ${domains.length} domains`}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entities…"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '7px 10px 7px 32px',
                fontSize: 13,
                color: 'rgba(235,230,220,0.9)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={12} style={{ color: 'rgba(255,255,255,0.4)' }} />
            <select
              value={filterDomain}
              onChange={(e) => setFilterDomain(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 7,
                padding: '6px 10px',
                fontSize: 12,
                color: 'rgba(235,230,220,0.8)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All domains</option>
              {domains.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { icon: ZoomIn, onClick: () => setZoom((z) => Math.min(z + 0.2, 2.5)) },
              { icon: ZoomOut, onClick: () => setZoom((z) => Math.max(z - 0.2, 0.4)) },
            ].map(({ icon: Icon, onClick }, i) => (
              <button
                key={i}
                onClick={onClick}
                style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}
              >
                <Icon size={13} />
              </button>
            ))}
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: `${ACCENT}12`, border: `1px solid ${ACCENT}30`, borderRadius: 7, cursor: 'pointer', fontSize: 11, color: ACCENT }}
          >
            <RefreshCw size={11} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              style={{
                width: '100%',
                height: 520,
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s',
              }}
            >
              <defs>
                {Object.entries(EDGE_COLORS).map(([type, color]) => (
                  <marker
                    key={type}
                    id={`arrow-${type}`}
                    markerWidth="8"
                    markerHeight="8"
                    refX="8"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L0,6 L8,3 z" fill={color} opacity={0.6} />
                  </marker>
                ))}
              </defs>

              {visibleRels.map((rel) => {
                const src = filtered.find((e) => e.id === rel.sourceId);
                const tgt = filtered.find((e) => e.id === rel.targetId);
                if (!src?.x || !tgt?.x) return null;
                const color = EDGE_COLORS[rel.type] ?? '#6b7280';
                const isHighlighted = selectedEntity && (rel.sourceId === selectedEntity.id || rel.targetId === selectedEntity.id);
                return (
                  <g key={rel.id}>
                    <line
                      x1={src.x}
                      y1={src.y}
                      x2={tgt.x}
                      y2={tgt.y}
                      stroke={color}
                      strokeWidth={isHighlighted ? 2 : 1}
                      strokeOpacity={isHighlighted ? 0.7 : 0.2}
                      markerEnd={`url(#arrow-${rel.type})`}
                    />
                  </g>
                );
              })}

              {filtered.map((entity) => {
                const domainColor = DOMAIN_COLORS[entity.domain] ?? '#8b7ac8';
                const isSelected = selectedEntity?.id === entity.id;
                const isHovered = hoveredEntity === entity.id;
                const isRippleAffected = rippleData?.affected?.some((a: any) => a.entityId === entity.id);
                const r = isSelected ? 14 : isHovered ? 12 : 10;
                if (!entity.x || !entity.y) return null;
                return (
                  <g
                    key={entity.id}
                    onClick={() => handleEntityClick(entity)}
                    onMouseEnter={() => setHoveredEntity(entity.id)}
                    onMouseLeave={() => setHoveredEntity(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {(isSelected || isRippleAffected) && (
                      <circle
                        cx={entity.x}
                        cy={entity.y}
                        r={r + 6}
                        fill={isRippleAffected ? 'rgba(239,68,68,0.15)' : `${domainColor}15`}
                        stroke={isRippleAffected ? '#ef4444' : domainColor}
                        strokeWidth={1.5}
                        strokeOpacity={0.4}
                      />
                    )}
                    <circle
                      cx={entity.x}
                      cy={entity.y}
                      r={r}
                      fill={isSelected ? domainColor : `${domainColor}30`}
                      stroke={domainColor}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      strokeOpacity={isSelected ? 1 : 0.6}
                    />
                    <text
                      x={entity.x}
                      y={(entity.y ?? 0) + r + 14}
                      textAnchor="middle"
                      fontSize={10}
                      fill={isSelected ? 'rgba(235,230,220,0.95)' : 'rgba(235,230,220,0.6)'}
                      fontWeight={isSelected ? 600 : 400}
                    >
                      {entity.label.length > 16 ? entity.label.slice(0, 15) + '…' : entity.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {Object.entries(EDGE_COLORS).map(([type, color]) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                  <span style={{ width: 20, height: 1.5, background: color, display: 'inline-block', opacity: 0.7 }} />
                  {type}
                </div>
              ))}
            </div>
          </div>

          <div>
            {selectedEntity ? (
              <div
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: `${DOMAIN_COLORS[selectedEntity.domain] ?? ACCENT}0d`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{ width: 10, height: 10, borderRadius: '50%', background: DOMAIN_COLORS[selectedEntity.domain] ?? ACCENT, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: DOMAIN_COLORS[selectedEntity.domain] ?? ACCENT }}>
                      {selectedEntity.domain} · {selectedEntity.type}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: 'rgba(235,230,220,0.95)', margin: '6px 0 0' }}>
                    {selectedEntity.label}
                  </h3>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '0 0 12px', lineHeight: 1.5 }}>
                    {selectedEntity.description}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {[
                      { label: 'Confidence', value: `${(selectedEntity.confidence * 100).toFixed(0)}%` },
                      { label: 'Freshness', value: `${(selectedEntity.freshness * 100).toFixed(0)}%` },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 7, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(235,230,220,0.9)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => { setShowRipple(!showRipple); if (!showRipple) loadRipple(selectedEntity.id); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      width: '100%',
                      padding: '8px 12px',
                      background: showRipple ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${showRipple ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 7,
                      cursor: 'pointer',
                      fontSize: 12,
                      color: showRipple ? '#ef4444' : 'rgba(255,255,255,0.6)',
                      marginBottom: 8,
                    }}
                  >
                    <Activity size={12} />
                    {showRipple ? 'Hide Ripple Analysis' : 'Analyze Downstream Impact'}
                  </button>
                  <a
                    href={`/${selectedEntity.domain}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 12px',
                      background: `${DOMAIN_COLORS[selectedEntity.domain] ?? ACCENT}12`,
                      border: `1px solid ${DOMAIN_COLORS[selectedEntity.domain] ?? ACCENT}30`,
                      borderRadius: 7,
                      fontSize: 12,
                      color: DOMAIN_COLORS[selectedEntity.domain] ?? ACCENT,
                      textDecoration: 'none',
                    }}
                  >
                    <ExternalLink size={12} />
                    Open in {selectedEntity.domain}
                  </a>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12,
                  padding: '24px 20px',
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.3)',
                  fontSize: 13,
                  marginBottom: 12,
                }}
              >
                <Layers size={24} style={{ marginBottom: 8, opacity: 0.4 }} />
                <div>Click any entity node to inspect it</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>Ripple analysis shows downstream effects</div>
              </div>
            )}

            {showRipple && rippleData && (
              <div
                style={{
                  background: 'rgba(239,68,68,0.05)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ef4444' }}>
                    Ripple Analysis
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                    {rippleData.affected?.length ?? 0} downstream entities affected
                  </div>
                </div>
                <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                  {(rippleData.affected ?? []).map((a: any, i: number) => (
                    <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: a.impactType === 'direct' ? '#ef4444' : '#f59e0b', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: 'rgba(235,230,220,0.8)', flex: 1 }}>{a.entityLabel}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: DOMAIN_COLORS[a.domain] ?? '#8b7ac8' }}>{a.domain}</span>
                      </div>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0 14px', lineHeight: 1.4 }}>{a.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </OmniaLayout>
  );
}
