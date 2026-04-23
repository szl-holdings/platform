import { color } from '@szl-holdings/design-system';
import { AnimatePresence, m } from 'framer-motion';
import {
  AlertTriangle,
  BookOpen,
  Building2,
  ChevronRight,
  Clock,
  ExternalLink,
  Globe,
  Layers,
  Network,
  Scale,
  Search,
  Ship,
  User,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'wouter';
import { SiteNav } from '@/components/SiteNav';
import { runAnomalyDetection } from '@/lib/nexus/anomaly-engine';
import {
  type EntityRecord,
  type EntityType,
  getConnectedEdges,
  KNOWLEDGE_GRAPH,
  NEXUS_EDGES,
  NEXUS_ENTITIES,
} from '@/lib/nexus/graph';
import { executeQuery } from '@/lib/nexus/query-engine';

const DOMAIN_COLORS: Record<EntityType, string> = {
  person: '#60a5fa',
  organization: '#a78bfa',
  vessel: '#38bdf8',
  property: '#4ade80',
  matter: '#d4a054',
  threat: '#ef4444',
  asset: '#f59e0b',
};

const DOMAIN_ICONS: Record<EntityType, React.ElementType> = {
  person: User,
  organization: Building2,
  vessel: Ship,
  property: Building2,
  matter: Scale,
  threat: AlertTriangle,
  asset: Layers,
};

const RISK_COLORS: Record<string, string> = {
  critical: color.accent.red,
  high: color.accent.amber,
  medium: color.accent.amber,
  low: color.accent.green,
  none: color.text.muted,
};

// ── Initial node positions (starting point for simulation) ──
const INITIAL_POSITIONS: Record<string, { x: number; y: number }> = {
  'viktor-sorokin': { x: 480, y: 260 },
  'sorokin-maritime': { x: 620, y: 160 },
  'mv-arctic-eagle': { x: 760, y: 240 },
  'shell-delta': { x: 600, y: 80 },
  'ofac-flag-sorokin': { x: 880, y: 160 },
  'trade-finance-dispute': { x: 380, y: 160 },
  'northport-properties': { x: 340, y: 340 },
  'bayview-plaza': { x: 220, y: 280 },
  'ironside-lofts': { x: 200, y: 400 },
  'marcus-chen': { x: 500, y: 440 },
  'chen-capital': { x: 640, y: 420 },
  'apt23-indicator': { x: 740, y: 400 },
  'construction-fraud': { x: 500, y: 550 },
  'trade-asset': { x: 720, y: 80 },
};

interface SimNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function useForceSimulation() {
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(() =>
    Object.fromEntries(
      NEXUS_ENTITIES.map((n) => [n.id, INITIAL_POSITIONS[n.id] ?? { x: 490, y: 300 }]),
    ),
  );
  const nodeState = useRef<SimNode[]>(
    NEXUS_ENTITIES.map((n) => ({
      id: n.id,
      ...(INITIAL_POSITIONS[n.id] ?? { x: 490, y: 300 }),
      vx: 0,
      vy: 0,
    })),
  );
  const animRef = useRef<number>(0);

  useEffect(() => {
    const tick = () => {
      const ns = nodeState.current;
      const REPULSION = 3800;
      const SPRING = 0.011;
      const IDEAL = 135;
      const DAMPING = 0.83;
      const GRAVITY = 0.0018;
      const cx = 490,
        cy = 300;

      for (const n of ns) {
        let fx = 0,
          fy = 0;
        for (const m of ns) {
          if (m.id === n.id) continue;
          const dx = n.x - m.x || 0.01;
          const dy = n.y - m.y || 0.01;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = REPULSION / (dist * dist);
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        }
        for (const e of NEXUS_EDGES) {
          const otherId =
            e.sourceId === n.id ? e.targetId : e.targetId === n.id ? e.sourceId : null;
          if (!otherId) continue;
          const other = ns.find((x) => x.id === otherId);
          if (!other) continue;
          const dx = other.x - n.x;
          const dy = other.y - n.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const disp = dist - IDEAL * (1 + (1 - e.strength) * 0.4);
          fx += (dx / dist) * disp * SPRING;
          fy += (dy / dist) * disp * SPRING;
        }
        fx += (cx - n.x) * GRAVITY;
        fy += (cy - n.y) * GRAVITY;
        n.vx = (n.vx + fx) * DAMPING;
        n.vy = (n.vy + fy) * DAMPING;
        n.x = Math.max(55, Math.min(925, n.x + n.vx));
        n.y = Math.max(45, Math.min(565, n.y + n.vy));
      }

      setPositions(Object.fromEntries(ns.map((n) => [n.id, { x: n.x, y: n.y }])));
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return positions;
}

function GraphCanvas({
  positions,
  selectedId,
  highlightIds,
  onSelect,
}: {
  positions: Record<string, { x: number; y: number }>;
  selectedId: string | null;
  highlightIds: Set<string>;
  onSelect: (id: string) => void;
}) {
  return (
    <svg width="100%" viewBox="0 0 980 620" style={{ display: 'block', cursor: 'default' }}>
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.14)" />
        </marker>
      </defs>

      {NEXUS_EDGES.map((e) => {
        const src = positions[e.sourceId];
        const tgt = positions[e.targetId];
        if (!src || !tgt) return null;
        const isHighlighted =
          highlightIds.size === 0 || (highlightIds.has(e.sourceId) && highlightIds.has(e.targetId));
        const opacity = highlightIds.size > 0 ? (isHighlighted ? 0.65 : 0.05) : 0.22;
        const mx = (src.x + tgt.x) / 2;
        const my = (src.y + tgt.y) / 2;
        return (
          <g key={e.id}>
            <line
              x1={src.x}
              y1={src.y}
              x2={tgt.x}
              y2={tgt.y}
              stroke={isHighlighted ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.14)'}
              strokeWidth={isHighlighted ? 1.5 : 1}
              strokeOpacity={opacity}
              strokeDasharray={e.inferred ? '4,3' : undefined}
              markerEnd="url(#arrow)"
            />
            {(isHighlighted || highlightIds.size === 0) && (
              <text
                x={mx}
                y={my - 5}
                textAnchor="middle"
                fontSize="7"
                fill="rgba(255,255,255,0.28)"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {e.relationship.replace(/_/g, ' ')}
              </text>
            )}
          </g>
        );
      })}

      {NEXUS_ENTITIES.map((n) => {
        const pos = positions[n.id];
        if (!pos) return null;
        const color = DOMAIN_COLORS[n.type];
        const riskColor = RISK_COLORS[n.risk];
        const isSelected = selectedId === n.id;
        const isHighlighted = highlightIds.size === 0 || highlightIds.has(n.id);
        const radius = n.risk === 'critical' ? 20 : n.risk === 'high' ? 17 : 14;
        const opacity = isHighlighted ? 1 : 0.18;

        return (
          <g key={n.id} style={{ cursor: 'pointer', opacity }} onClick={() => onSelect(n.id)}>
            {isSelected && (
              <circle
                cx={pos.x}
                cy={pos.y}
                r={radius + 12}
                fill={color}
                fillOpacity="0.07"
                stroke={color}
                strokeOpacity="0.28"
                strokeWidth="1.5"
              />
            )}
            {n.risk === 'critical' && (
              <circle cx={pos.x} cy={pos.y} r={radius + 5} fill={riskColor} fillOpacity="0.06">
                <animate
                  attributeName="r"
                  values={`${radius + 3};${radius + 9};${radius + 3}`}
                  dur="2.2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="fill-opacity"
                  values="0.06;0.02;0.06"
                  dur="2.2s"
                  repeatCount="indefinite"
                />
              </circle>
            )}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={radius}
              fill={`${color}18`}
              stroke={isSelected ? color : `${color}55`}
              strokeWidth={isSelected ? 2 : 1.5}
            />
            {n.risk !== 'none' && (
              <circle
                cx={pos.x + radius - 4}
                cy={pos.y - radius + 4}
                r={4}
                fill={riskColor}
                stroke="hsl(220,14%,4%)"
                strokeWidth="1.5"
              />
            )}
            <text
              x={pos.x}
              y={pos.y + 3}
              textAnchor="middle"
              fontSize="7.5"
              fontWeight="700"
              fill={color}
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {n.label.split(' ').slice(0, 2).join(' ')}
            </text>
            <text
              x={pos.x}
              y={pos.y + radius + 13}
              textAnchor="middle"
              fontSize="7"
              fill="rgba(255,255,255,0.4)"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {n.type.toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function EntityPanel({ entity, onClose }: { entity: EntityRecord; onClose: () => void }) {
  const color = DOMAIN_COLORS[entity.type];
  const riskColor = RISK_COLORS[entity.risk];
  const Icon = DOMAIN_ICONS[entity.type];

  const connectedEdges = useMemo(() => getConnectedEdges(entity.id), [entity.id]);
  const neighborIds = useMemo(
    () => connectedEdges.map((e) => (e.sourceId === entity.id ? e.targetId : e.sourceId)),
    [connectedEdges],
  );
  const neighbors = useMemo(
    () =>
      neighborIds
        .map((id) => NEXUS_ENTITIES.find((n) => n.id === id))
        .filter(Boolean) as EntityRecord[],
    [neighborIds],
  );

  const domainSections = [
    entity.domainData.vessels && {
      key: 'vessels',
      label: 'Maritime',
      color: '#38bdf8',
      entries: [
        entity.domainData.vessels.imoNumber && { k: 'IMO', v: entity.domainData.vessels.imoNumber },
        entity.domainData.vessels.currentPosition && {
          k: 'Position',
          v: entity.domainData.vessels.currentPosition,
        },
        entity.domainData.vessels.aisGapHours && {
          k: 'AIS Gap',
          v: `${entity.domainData.vessels.aisGapHours}h dark period`,
        },
        entity.domainData.vessels.transitCount30d && {
          k: 'Red Sea Transits (30d)',
          v: entity.domainData.vessels.transitCount30d,
        },
        entity.domainData.vessels.routeRisk && {
          k: 'Route Risk',
          v: entity.domainData.vessels.routeRisk,
        },
      ].filter(Boolean),
    },
    entity.domainData.legal && {
      key: 'legal',
      label: 'Legal',
      color: '#d4a054',
      entries: [
        entity.domainData.legal.matterIds?.length && {
          k: 'Matter IDs',
          v: entity.domainData.legal.matterIds.join(', '),
        },
        entity.domainData.legal.matterStatus && {
          k: 'Status',
          v: entity.domainData.legal.matterStatus,
        },
        entity.domainData.legal.aggregateExposure && {
          k: 'Exposure',
          v: `$${(entity.domainData.legal.aggregateExposure / 1e6).toFixed(1)}M`,
        },
        entity.domainData.legal.activeArbitrations && {
          k: 'Active Arbitrations',
          v: entity.domainData.legal.activeArbitrations,
        },
      ].filter(Boolean),
    },
    entity.domainData.property && {
      key: 'property',
      label: 'Real Estate',
      color: '#4ade80',
      entries: [
        entity.domainData.property.totalAUM && {
          k: 'Portfolio AUM',
          v: `$${(entity.domainData.property.totalAUM / 1e6).toFixed(1)}M`,
        },
        entity.domainData.property.distressScore && {
          k: 'Distress Score',
          v: `${entity.domainData.property.distressScore}/100`,
        },
        entity.domainData.property.capRate && {
          k: 'Cap Rate',
          v: `${entity.domainData.property.capRate}%`,
        },
        entity.domainData.property.ltv && { k: 'LTV', v: `${entity.domainData.property.ltv}%` },
        entity.domainData.property.dscr && { k: 'DSCR', v: `${entity.domainData.property.dscr}x` },
        entity.domainData.property.noi && {
          k: 'NOI',
          v: `$${(entity.domainData.property.noi / 1e3).toFixed(0)}K`,
        },
      ].filter(Boolean),
    },
    entity.domainData.threat && {
      key: 'threat',
      label: 'Threat',
      color: '#ef4444',
      entries: [
        entity.domainData.threat.ofacMatchConfidence && {
          k: 'OFAC Match',
          v: `${entity.domainData.threat.ofacMatchConfidence}% confidence`,
        },
        entity.domainData.threat.sanctionsPrograms?.length && {
          k: 'Programs',
          v: entity.domainData.threat.sanctionsPrograms.join(', '),
        },
        entity.domainData.threat.aptAssociations?.length && {
          k: 'APT Associations',
          v: entity.domainData.threat.aptAssociations.join(', '),
        },
        entity.domainData.threat.ipOverlap && { k: 'IP Range Overlap', v: 'Detected' },
        entity.domainData.threat.indicators?.length && {
          k: 'Indicators',
          v: entity.domainData.threat.indicators.join(' · '),
        },
      ].filter(Boolean),
    },
    entity.domainData.financial && {
      key: 'financial',
      label: 'Financial',
      color: '#f59e0b',
      entries: [
        entity.domainData.financial.aum && {
          k: 'AUM',
          v: `$${(entity.domainData.financial.aum / 1e6).toFixed(0)}M`,
        },
        entity.domainData.financial.facilitySize && {
          k: 'Facility Size',
          v: `$${(entity.domainData.financial.facilitySize / 1e6).toFixed(0)}M`,
        },
        entity.domainData.financial.facilityStatus && {
          k: 'Status',
          v: entity.domainData.financial.facilityStatus,
        },
        entity.domainData.financial.activePositions && {
          k: 'Active Positions',
          v: entity.domainData.financial.activePositions,
        },
      ].filter(Boolean),
    },
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    color: string;
    entries: Array<{ k: string; v: string | number }>;
  }>;

  return (
    <m.div
      key={entity.id}
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '340px',
        height: '100%',
        background: 'hsl(220,14%,6%)',
        borderLeft: '1px solid rgba(255,255,255,0.07)',
        overflowY: 'auto',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '1.125rem',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: `${color}15`,
                border: `1px solid ${color}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={14} style={{ color }} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(210,10%,92%)' }}>
                {entity.label}
              </div>
              <div style={{ fontSize: '10px', color: 'hsl(210,5%,42%)', marginTop: '1px' }}>
                {entity.subtitle}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'hsl(210,5%,40%)',
              padding: '2px',
            }}
          >
            <X size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              padding: '2px 6px',
              borderRadius: '4px',
              background: `${riskColor}15`,
              border: `1px solid ${riskColor}30`,
              color: riskColor,
            }}
          >
            {entity.risk.toUpperCase()} RISK
          </span>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '4px',
              background: `${color}10`,
              border: `1px solid ${color}20`,
              color,
            }}
          >
            {entity.type.toUpperCase()}
          </span>
        </div>
      </div>

      <div style={{ padding: '1rem 1.125rem', flex: 1 }}>
        <div
          style={{
            marginBottom: '0.875rem',
            padding: '0.625rem 0.75rem',
            borderRadius: '8px',
            background: `${riskColor}07`,
            border: `1px solid ${riskColor}15`,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.375rem',
            }}
          >
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'hsl(210,5%,40%)',
                textTransform: 'uppercase',
              }}
            >
              Risk Score
            </span>
            <span style={{ fontSize: '16px', fontWeight: 800, color: riskColor, lineHeight: 1 }}>
              {entity.riskScore}
            </span>
          </div>
          <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)' }}>
            <div
              style={{
                width: `${entity.riskScore}%`,
                height: '100%',
                borderRadius: '2px',
                background: `linear-gradient(90deg, ${riskColor}60, ${riskColor})`,
              }}
            />
          </div>
        </div>

        {entity.aliases.length > 0 && (
          <div style={{ marginBottom: '0.875rem' }}>
            <div
              style={{
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.07em',
                color: 'hsl(210,5%,40%)',
                textTransform: 'uppercase',
                marginBottom: '0.375rem',
              }}
            >
              Known Aliases
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
              {entity.aliases.map((a) => (
                <span
                  key={a}
                  style={{
                    fontSize: '9px',
                    color: 'hsl(210,5%,50%)',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    fontFamily: 'monospace',
                  }}
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {Object.keys(entity.identifiers).length > 0 && (
          <div style={{ marginBottom: '0.875rem' }}>
            <div
              style={{
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.07em',
                color: 'hsl(210,5%,40%)',
                textTransform: 'uppercase',
                marginBottom: '0.375rem',
              }}
            >
              Identifiers
            </div>
            {Object.entries(entity.identifiers).map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '9.5px',
                  padding: '2px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                }}
              >
                <span
                  style={{
                    color: 'hsl(210,5%,40%)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {k}
                </span>
                <span style={{ color: 'hsl(210,10%,70%)', fontFamily: 'monospace' }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {domainSections.map((s) => (
          <div key={s.key} style={{ marginBottom: '0.875rem' }}>
            <div
              style={{
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.07em',
                color: s.color,
                textTransform: 'uppercase',
                marginBottom: '0.375rem',
              }}
            >
              {s.label}
            </div>
            {s.entries.map((entry: { k: string; v: string | number }) => (
              <div
                key={entry.k}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  fontSize: '9.5px',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  background: `${s.color}05`,
                  marginBottom: '2px',
                }}
              >
                <span style={{ color: 'hsl(210,5%,40%)' }}>{entry.k}</span>
                <span style={{ color: 'hsl(210,10%,76%)', textAlign: 'right', fontWeight: 600 }}>
                  {entry.v}
                </span>
              </div>
            ))}
          </div>
        ))}

        <div style={{ marginBottom: '0.875rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              marginBottom: '0.375rem',
            }}
          >
            <Network size={10} style={{ color: '#60a5fa' }} />
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.07em',
                color: '#60a5fa',
                textTransform: 'uppercase',
              }}
            >
              Connected ({neighbors.length})
            </span>
          </div>
          {neighbors.map((n, i) => {
            const edge = connectedEdges.find((e) => e.sourceId === n.id || e.targetId === n.id);
            return (
              <div
                key={n.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.3rem 0',
                  borderBottom:
                    i < neighbors.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: DOMAIN_COLORS[n.type],
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: 'hsl(210,10%,74%)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {n.label}
                  </div>
                  <div style={{ fontSize: '8.5px', color: 'hsl(210,5%,36%)' }}>
                    {edge?.relationship.replace(/_/g, ' ')} · {edge?.confidence}% conf
                    {edge?.inferred ? ' · inferred' : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            paddingTop: '0.75rem',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <Link href="/nexus/oracle">
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '10px',
                color: '#a78bfa',
                cursor: 'pointer',
              }}
            >
              <BookOpen size={10} /> View in ORACLE Brief <ChevronRight size={9} />
            </span>
          </Link>
        </div>
      </div>
    </m.div>
  );
}

export default function NexusExplorerPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState<{ summary: string; confidence: number } | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<'graph' | 'anomalies' | 'timeline'>('graph');
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());
  const positions = useForceSimulation();

  const anomalyReport = useMemo(() => runAnomalyDetection(KNOWLEDGE_GRAPH), []);

  useEffect(() => {
    document.title = 'PRAXIS Explorer — SZL Intelligence';
  }, []);

  // Fix: deselect clears highlight
  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => {
      if (prev === id) {
        // Deselecting — clear highlights unless there's an active query
        setHighlightIds(new Set());
        return null;
      }
      // Selecting — highlight entity and its neighbors
      const connected = new Set<string>([id]);
      NEXUS_EDGES.forEach((e) => {
        if (e.sourceId === id) connected.add(e.targetId);
        if (e.targetId === id) connected.add(e.sourceId);
      });
      setHighlightIds(connected);
      return id;
    });
  }, []);

  const handleQuery = useCallback(() => {
    const q = query.trim();
    if (!q) {
      setHighlightIds(new Set());
      setSelectedId(null);
      setQueryResult(null);
      return;
    }
    const result = executeQuery(q, KNOWLEDGE_GRAPH);
    setHighlightIds(result.subgraphEntityIds);
    setQueryResult({ summary: result.summary, confidence: result.confidence });
    if (result.highlightedEntityIds.size === 1) {
      setSelectedId([...result.highlightedEntityIds][0]);
    } else {
      setSelectedId(null);
    }
  }, [query]);

  const handleClearSearch = () => {
    setQuery('');
    setHighlightIds(new Set());
    setSelectedId(null);
    setQueryResult(null);
  };

  const TIMELINE_EVENTS = [
    {
      date: 'Apr 15',
      time: '07:00',
      event: 'ORACLE daily brief generated',
      domain: 'Oracle',
      accent: '#a78bfa',
    },
    {
      date: 'Apr 14',
      time: '22:15',
      event: `PRAXIS graph refresh — ${NEXUS_EDGES.filter((e) => e.inferred).length} new inferred edges`,
      domain: 'PRAXIS',
      accent: '#60a5fa',
    },
    {
      date: 'Apr 12',
      time: '04:33',
      event: 'P001: Sanctions-evasion pattern detected — MV Arctic Eagle / Viktor Sorokin',
      domain: 'Cross-Domain',
      accent: '#ef4444',
    },
    {
      date: 'Apr 12',
      time: '03:10',
      event: 'MV Arctic Eagle entered Red Sea corridor',
      domain: 'SEXTANT',
      accent: '#38bdf8',
    },
    {
      date: 'Apr 10',
      time: '11:18',
      event: 'P002: APT-23 indicator linked to Chen Capital',
      domain: 'Threat',
      accent: '#ef4444',
    },
    {
      date: 'Apr 8',
      time: '09:44',
      event: 'OFAC SDN composite match confirmed by PARAGON',
      domain: 'Threat',
      accent: '#ef4444',
    },
    {
      date: 'Apr 3',
      time: '14:22',
      event: 'Second MV Arctic Eagle Red Sea transit logged',
      domain: 'SEXTANT',
      accent: '#38bdf8',
    },
    {
      date: 'Apr 1',
      time: '10:05',
      event: 'Chen fraud matter #1143 escalated to arbitration',
      domain: 'Legal',
      accent: '#d4a054',
    },
    {
      date: 'Mar 22',
      time: '16:30',
      event: 'Trade Finance Dispute #0892 escalated',
      domain: 'Legal',
      accent: '#d4a054',
    },
    {
      date: 'Feb 28',
      time: '09:41',
      event: 'P003: Sorokin-Chen co-investment at Ironside Lofts discovered',
      domain: 'Cross-Domain',
      accent: '#a78bfa',
    },
    {
      date: 'Mar 15',
      time: '08:55',
      event: 'Ironside Lofts distress score crossed 80',
      domain: 'Property',
      accent: '#4ade80',
    },
  ];

  const selectedEntity = selectedId
    ? (NEXUS_ENTITIES.find((n) => n.id === selectedId) ?? null)
    : null;

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(220,14%,4%)', position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-5%',
            width: '60vw',
            height: '60vw',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(96,165,250,0.03) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '40vw',
            height: '40vw',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(167,139,250,0.03) 0%, transparent 70%)',
          }}
        />
      </div>

      <SiteNav />

      <main
        className="pt-20"
        style={{ position: 'relative', zIndex: 1, minHeight: 'calc(100vh - 80px)' }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem 4rem' }}>
          <m.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            style={{ padding: '1.25rem 0 1rem' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '0.875rem',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    marginBottom: '0.25rem',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#60a5fa',
                      boxShadow: '0 0 8px #60a5fa88',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      color: '#60a5fa',
                      textTransform: 'uppercase',
                    }}
                  >
                    PRAXIS Intelligence Graph · v{KNOWLEDGE_GRAPH.version}
                  </span>
                </div>
                <h1
                  style={{
                    fontSize: 'clamp(1.5rem,2.6vw,1.875rem)',
                    fontWeight: 800,
                    letterSpacing: '-0.035em',
                    color: 'hsl(210,10%,95%)',
                    lineHeight: 1,
                  }}
                >
                  Entity Knowledge Graph
                </h1>
                <p style={{ fontSize: '11px', color: 'hsl(210,5%,42%)', marginTop: '4px' }}>
                  {NEXUS_ENTITIES.length} entities · {NEXUS_EDGES.length} relationships (
                  {NEXUS_EDGES.filter((e) => e.inferred).length} inferred) ·{' '}
                  {anomalyReport.totalCount} cross-domain anomalies
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link href="/nexus/oracle">
                  <m.button
                    whileHover={{ scale: 1.02 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      background: 'rgba(167,139,250,0.1)',
                      border: '1px solid rgba(167,139,250,0.25)',
                      color: '#a78bfa',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    <BookOpen size={12} /> ORACLE Brief
                  </m.button>
                </Link>
                <Link href="/nexus">
                  <m.button
                    whileHover={{ scale: 1.02 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      background: 'rgba(96,165,250,0.08)',
                      border: '1px solid rgba(96,165,250,0.2)',
                      color: '#60a5fa',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    <Globe size={12} /> Command
                  </m.button>
                </Link>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '0.625rem',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '520px' }}
              >
                <Search
                  size={12}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'hsl(210,5%,40%)',
                  }}
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                  placeholder={
                    'Follow the thread\u2026 \u201cMV Arctic Eagle\u201d, \u201cIMO 9234567\u201d, \u201csanctions\u201d, \u201cMarcus Chen\u201d'
                  }
                  style={{
                    width: '100%',
                    padding: '0.5rem 2rem 0.5rem 2rem',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    color: 'hsl(210,10%,88%)',
                    fontSize: '11px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
                {query && (
                  <button
                    onClick={handleClearSearch}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'hsl(210,5%,40%)',
                      padding: 0,
                    }}
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
              <button
                onClick={handleQuery}
                style={{
                  padding: '0.5rem 0.875rem',
                  borderRadius: '8px',
                  background: 'rgba(96,165,250,0.1)',
                  border: '1px solid rgba(96,165,250,0.25)',
                  color: '#60a5fa',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  flexShrink: 0,
                }}
              >
                Search
              </button>
              <div
                style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', alignItems: 'center' }}
              >
                {(Object.entries(DOMAIN_COLORS) as Array<[EntityType, string]>).map(
                  ([type, color]) => (
                    <div
                      key={type}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '9px',
                        color: 'hsl(210,5%,42%)',
                      }}
                    >
                      <div
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: color,
                        }}
                      />
                      {type}
                    </div>
                  ),
                )}
              </div>
            </div>

            {queryResult && (
              <m.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginTop: '0.625rem',
                  padding: '0.5rem 0.875rem',
                  borderRadius: '7px',
                  background: 'rgba(96,165,250,0.06)',
                  border: '1px solid rgba(96,165,250,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <span style={{ fontSize: '10px', color: 'hsl(210,5%,58%)' }}>
                  {queryResult.summary}
                </span>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#60a5fa', flexShrink: 0 }}>
                  {queryResult.confidence}% conf
                </span>
              </m.div>
            )}

            <div
              style={{
                display: 'flex',
                gap: '0.25rem',
                marginTop: '0.875rem',
                padding: '2px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.03)',
                width: 'fit-content',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {(['graph', 'anomalies', 'timeline'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '0.375rem 0.875rem',
                    borderRadius: '6px',
                    background: activeTab === tab ? 'rgba(255,255,255,0.08)' : 'none',
                    border:
                      activeTab === tab
                        ? '1px solid rgba(255,255,255,0.1)'
                        : '1px solid transparent',
                    color: activeTab === tab ? 'hsl(210,10%,88%)' : 'hsl(210,5%,42%)',
                    fontSize: '10px',
                    fontWeight: activeTab === tab ? 700 : 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    letterSpacing: '0.02em',
                  }}
                >
                  {tab === 'anomalies'
                    ? `Anomalies (${anomalyReport.totalCount})`
                    : tab === 'timeline'
                      ? 'Timeline'
                      : 'Graph Explorer'}
                </button>
              ))}
            </div>
          </m.div>

          {activeTab === 'graph' && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'relative',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.015)',
                overflow: 'hidden',
                height: '640px',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background:
                    'linear-gradient(90deg, rgba(96,165,250,0.4), rgba(167,139,250,0.2), transparent)',
                }}
              />

              <GraphCanvas
                positions={positions}
                selectedId={selectedId}
                highlightIds={highlightIds}
                onSelect={handleSelect}
              />

              <AnimatePresence>
                {selectedEntity && (
                  <EntityPanel
                    entity={selectedEntity}
                    onClose={() => {
                      setSelectedId(null);
                      if (!query) setHighlightIds(new Set());
                    }}
                  />
                )}
              </AnimatePresence>

              <div
                style={{
                  position: 'absolute',
                  bottom: '1rem',
                  left: '1rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.55)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div
                  style={{
                    fontSize: '9px',
                    color: 'hsl(210,5%,38%)',
                    marginBottom: '0.25rem',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                  }}
                >
                  RISK
                </div>
                {Object.entries(RISK_COLORS)
                  .filter(([k]) => k !== 'none')
                  .map(([level, color]) => (
                    <div
                      key={level}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        marginBottom: '2px',
                      }}
                    >
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: color,
                        }}
                      />
                      <span
                        style={{
                          fontSize: '8.5px',
                          color: 'hsl(210,5%,42%)',
                          textTransform: 'capitalize',
                        }}
                      >
                        {level}
                      </span>
                    </div>
                  ))}
              </div>
              <div
                style={{
                  position: 'absolute',
                  bottom: '1rem',
                  right: selectedEntity ? '356px' : '1rem',
                  padding: '0.375rem 0.625rem',
                  borderRadius: '6px',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(4px)',
                  transition: 'right 0.3s ease',
                }}
              >
                <span style={{ fontSize: '9px', color: 'hsl(210,5%,36%)' }}>
                  Click to explore · Dashed = inferred · Badge = risk level
                </span>
              </div>
            </m.div>
          )}

          {activeTab === 'anomalies' && (
            <m.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: 'rgba(239,68,68,0.05)',
                  border: '1px solid rgba(239,68,68,0.14)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.625rem',
                }}
              >
                <AlertTriangle
                  size={13}
                  style={{ color: '#ef4444', flexShrink: 0, marginTop: '1px' }}
                />
                <span style={{ fontSize: '11px', color: 'hsl(210,5%,58%)', lineHeight: 1.6 }}>
                  {anomalyReport.totalCount} cross-domain anomalies detected by PRAXIS pattern engine
                  across {Object.keys(anomalyReport.byDomain).length} domains. Patterns are computed
                  from the live knowledge graph — not static. Critical:{' '}
                  {anomalyReport.bySeverity.critical} · High: {anomalyReport.bySeverity.high} ·
                  Medium: {anomalyReport.bySeverity.medium}.
                </span>
              </div>
              {anomalyReport.anomalies.map((a, i) => {
                const severityColor =
                  a.severity === 'critical'
                    ? '#ef4444'
                    : a.severity === 'high'
                      ? '#f97316'
                      : '#eab308';
                return (
                  <m.div
                    key={`${a.patternId}-${i}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    style={{
                      padding: '1.125rem',
                      borderRadius: '12px',
                      background: `${severityColor}05`,
                      border: `1px solid ${severityColor}18`,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        bottom: 0,
                        width: '3px',
                        background: severityColor,
                      }}
                    />
                    <div style={{ paddingLeft: '0.75rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginBottom: '0.375rem',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '8px',
                                fontWeight: 800,
                                letterSpacing: '0.1em',
                                color: severityColor,
                                padding: '1px 5px',
                                borderRadius: '3px',
                                background: `${severityColor}15`,
                                border: `1px solid ${severityColor}25`,
                              }}
                            >
                              {a.severity.toUpperCase()}
                            </span>
                            <span
                              style={{
                                fontSize: '9px',
                                color: 'hsl(210,5%,38%)',
                                fontFamily: 'monospace',
                              }}
                            >
                              {a.patternId}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: 700,
                              color: 'hsl(210,10%,90%)',
                              lineHeight: 1.4,
                            }}
                          >
                            {a.title}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div
                            style={{
                              fontSize: '9px',
                              color: 'hsl(210,5%,38%)',
                              marginBottom: '2px',
                            }}
                          >
                            Confidence
                          </div>
                          <div
                            style={{
                              fontSize: '18px',
                              fontWeight: 800,
                              color: severityColor,
                              lineHeight: 1,
                            }}
                          >
                            {a.confidence}%
                          </div>
                        </div>
                      </div>
                      <p
                        style={{
                          fontSize: '11.5px',
                          color: 'hsl(210,5%,55%)',
                          lineHeight: 1.7,
                          marginBottom: '0.875rem',
                        }}
                      >
                        {a.description}
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          flexWrap: 'wrap',
                          marginBottom: '0.75rem',
                        }}
                      >
                        {a.domains.map((d) => (
                          <span
                            key={d}
                            style={{
                              fontSize: '9px',
                              fontWeight: 600,
                              padding: '2px 7px',
                              borderRadius: '4px',
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              color: 'hsl(210,5%,50%)',
                            }}
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                        {a.involvedEntityIds.slice(0, 4).map((eid) => {
                          const entity = NEXUS_ENTITIES.find((x) => x.id === eid);
                          return entity ? (
                            <button
                              key={eid}
                              onClick={() => {
                                setActiveTab('graph');
                                handleSelect(eid);
                              }}
                              style={{
                                fontSize: '9px',
                                fontWeight: 600,
                                padding: '2px 7px',
                                borderRadius: '4px',
                                background: `${DOMAIN_COLORS[entity.type]}10`,
                                border: `1px solid ${DOMAIN_COLORS[entity.type]}25`,
                                color: DOMAIN_COLORS[entity.type],
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                              }}
                            >
                              {entity.label}{' '}
                              <ExternalLink
                                size={7}
                                style={{ display: 'inline', verticalAlign: 'middle' }}
                              />
                            </button>
                          ) : null;
                        })}
                      </div>
                      <div style={{ marginTop: '0.75rem' }}>
                        {a.signals
                          .filter((s) => s.breached)
                          .slice(0, 3)
                          .map((sig, si) => (
                            <div
                              key={si}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '9.5px',
                                padding: '0.25rem 0',
                                borderTop: si > 0 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                              }}
                            >
                              <div
                                style={{
                                  width: '4px',
                                  height: '4px',
                                  borderRadius: '50%',
                                  background: severityColor,
                                  flexShrink: 0,
                                }}
                              />
                              <span style={{ color: 'hsl(210,5%,50%)' }}>{sig.metric}: </span>
                              <span style={{ color: 'hsl(210,10%,72%)', fontWeight: 600 }}>
                                {sig.value}
                              </span>
                              {sig.threshold !== undefined && (
                                <span style={{ color: 'hsl(210,5%,36%)' }}>
                                  (threshold: {sig.threshold})
                                </span>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  </m.div>
                );
              })}
            </m.div>
          )}

          {activeTab === 'timeline' && (
            <m.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div
                style={{
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.015)',
                  padding: '1.5rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: 'linear-gradient(90deg, rgba(167,139,250,0.4), transparent)',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <Clock size={13} style={{ color: '#a78bfa' }} />
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      color: '#a78bfa',
                      textTransform: 'uppercase',
                    }}
                  >
                    Intelligence Timeline — All Domains
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: '72px',
                      top: 0,
                      bottom: 0,
                      width: '1px',
                      background: 'rgba(255,255,255,0.05)',
                    }}
                  />
                  {TIMELINE_EVENTS.map((e, i) => (
                    <m.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      style={{
                        display: 'flex',
                        gap: '1rem',
                        alignItems: 'flex-start',
                        marginBottom: i < TIMELINE_EVENTS.length - 1 ? '1rem' : 0,
                      }}
                    >
                      <div style={{ textAlign: 'right', width: '62px', flexShrink: 0 }}>
                        <div
                          style={{ fontSize: '10px', fontWeight: 600, color: 'hsl(210,10%,68%)' }}
                        >
                          {e.date}
                        </div>
                        <div style={{ fontSize: '9px', color: 'hsl(210,5%,36%)' }}>{e.time}</div>
                      </div>
                      <div style={{ flexShrink: 0, marginTop: '3px' }}>
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: e.accent,
                            marginLeft: '-3.5px',
                            boxShadow: `0 0 8px ${e.accent}60`,
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <span
                          style={{
                            fontSize: '8.5px',
                            fontWeight: 700,
                            color: e.accent,
                            letterSpacing: '0.06em',
                            marginBottom: '2px',
                            display: 'block',
                          }}
                        >
                          {e.domain}
                        </span>
                        <span
                          style={{ fontSize: '11.5px', color: 'hsl(210,5%,62%)', lineHeight: 1.5 }}
                        >
                          {e.event}
                        </span>
                      </div>
                    </m.div>
                  ))}
                </div>
              </div>
            </m.div>
          )}
        </div>
      </main>
    </div>
  );
}
