import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ExternalLink,
  Info,
  Layers,
  RefreshCw,
  Search,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
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
};

const SEVERITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#3b82f6',
};

interface Entity {
  id: string;
  label: string;
  type: string;
  domain: string;
  confidence: number;
  description: string;
}

interface RippleAffected {
  entityId: string;
  entityLabel: string;
  domain: string;
  impactType: 'direct' | 'indirect' | 'potential';
  severity: 'low' | 'medium' | 'high';
  description: string;
  deepLink?: string;
}

interface RippleData {
  sourceEntityId: string;
  sourceEntityLabel: string;
  affected: RippleAffected[];
  propagatedAt: string;
}

export default function OmniaRipplePage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [ripple, setRipple] = useState<RippleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const apiBase = `${BASE_API}/api`;

  useEffect(() => {
    fetch(`${apiBase}/omnia/entities`)
      .then((r) => r.json())
      .then((d) => setEntities(d.entities ?? []))
      .catch(() => {});
  }, []);

  const loadRipple = async (entity: Entity) => {
    setSelectedEntity(entity);
    setRipple(null);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/omnia/ripple/${entity.id}`);
      if (res.ok) setRipple(await res.json());
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const FEATURED_ENTITIES: Entity[] = entities.length > 0 ? entities : [
    { id: 'e-apt41', label: 'APT-41 Threat Cluster', type: 'threat', domain: 'aegis', confidence: 0.92, description: 'Nation-state threat actor — HIGH' },
    { id: 'e-stellarwind', label: 'MV Stellarwind', type: 'vessel', domain: 'vessels', confidence: 0.98, description: 'Route deviation detected' },
    { id: 'e-ter4402', label: 'Property TER-4402', type: 'property', domain: 'terra', confidence: 0.87, description: 'Covenant watch — DSCR 1.01x' },
    { id: 'e-cjl2291', label: 'Matter CJL-2291', type: 'matter', domain: 'counsel', confidence: 0.87, description: 'Deadline in 48h' },
    { id: 'e-a11oy-fabric', label: 'A11oy Execution Fabric', type: 'agent', domain: 'a11oy', confidence: 0.99, description: '3 pending approvals' },
  ];

  const filteredEntities = FEATURED_ENTITIES.filter((e) =>
    !searchQuery || e.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const directAffected = ripple?.affected.filter((a) => a.impactType === 'direct') ?? [];
  const indirectAffected = ripple?.affected.filter((a) => a.impactType !== 'direct') ?? [];

  return (
    <OmniaLayout
      title="Ripple / Impact View"
      subtitle="Select an entity to trace downstream effects across the portfolio"
    >
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        <div>
          <div
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
                Select Entity
              </div>
              <div style={{ position: 'relative' }}>
                <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search entities…"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 7,
                    padding: '6px 10px 6px 30px',
                    fontSize: 12,
                    color: 'rgba(235,230,220,0.9)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              {filteredEntities.map((entity) => {
                const isSelected = selectedEntity?.id === entity.id;
                const domainColor = DOMAIN_COLORS[entity.domain] ?? ACCENT;
                return (
                  <button
                    key={entity.id}
                    onClick={() => loadRipple(entity)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      width: '100%',
                      padding: '11px 16px',
                      background: isSelected ? `${domainColor}12` : 'transparent',
                      border: 'none',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderLeft: isSelected ? `3px solid ${domainColor}` : '3px solid transparent',
                      transition: 'all 0.12s',
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: domainColor, flexShrink: 0, marginTop: 4 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: isSelected ? 'rgba(235,230,220,0.95)' : 'rgba(235,230,220,0.7)', fontWeight: isSelected ? 500 : 400, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {entity.label}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', gap: 6 }}>
                        <span style={{ textTransform: 'capitalize', color: domainColor, fontWeight: 600, opacity: 0.8 }}>{entity.domain}</span>
                        <span>·</span>
                        <span>{entity.type}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          {!selectedEntity && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 340,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14,
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              <Activity size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
              <div style={{ fontSize: 14, marginBottom: 4 }}>Select an entity to analyze ripple effects</div>
              <div style={{ fontSize: 12 }}>Downstream impacts will be traced across the portfolio world model</div>
            </div>
          )}

          {loading && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 200,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14,
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite', marginRight: 10 }} />
              Tracing ripple effects…
            </div>
          )}

          {!loading && ripple && (
            <div>
              <div
                style={{
                  background: `${DOMAIN_COLORS[selectedEntity?.domain ?? ''] ?? ACCENT}0d`,
                  border: `1px solid ${DOMAIN_COLORS[selectedEntity?.domain ?? ''] ?? ACCENT}25`,
                  borderRadius: 12,
                  padding: '16px 20px',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <Zap size={20} style={{ color: DOMAIN_COLORS[selectedEntity?.domain ?? ''] ?? ACCENT, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: DOMAIN_COLORS[selectedEntity?.domain ?? ''] ?? ACCENT, marginBottom: 3 }}>
                    Ripple Source
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'rgba(235,230,220,0.95)' }}>
                    {ripple.sourceEntityLabel}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: ripple.affected.length > 2 ? '#ef4444' : '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>
                    {ripple.affected.length}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>entities affected</div>
                </div>
              </div>

              {directAffected.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ef4444', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={12} /> Direct Impact ({directAffected.length})
                  </div>
                  {directAffected.map((a) => (
                    <div
                      key={a.entityId}
                      style={{
                        background: 'rgba(239,68,68,0.05)',
                        border: '1px solid rgba(239,68,68,0.15)',
                        borderRadius: 10,
                        padding: '14px 18px',
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ArrowRight size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(235,230,220,0.9)' }}>{a.entityLabel}</span>
                            <span style={{ padding: '1px 7px', background: `${DOMAIN_COLORS[a.domain] ?? ACCENT}15`, border: `1px solid ${DOMAIN_COLORS[a.domain] ?? ACCENT}30`, borderRadius: 5, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: DOMAIN_COLORS[a.domain] ?? ACCENT }}>
                              {a.domain}
                            </span>
                            <span style={{ padding: '1px 6px', background: `${SEVERITY_COLORS[a.severity]}15`, borderRadius: 5, fontSize: 10, fontWeight: 600, color: SEVERITY_COLORS[a.severity] }}>
                              {a.severity}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{a.description}</div>
                        </div>
                        {a.deepLink && (
                          <a href={a.deepLink} style={{ color: 'rgba(255,255,255,0.3)', display: 'flex', flexShrink: 0 }}>
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {indirectAffected.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f59e0b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Info size={12} /> Indirect / Potential Impact ({indirectAffected.length})
                  </div>
                  {indirectAffected.map((a) => (
                    <div
                      key={a.entityId}
                      style={{
                        background: 'rgba(255,255,255,0.025)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 8,
                        padding: '11px 16px',
                        marginBottom: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: DOMAIN_COLORS[a.domain] ?? ACCENT, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: 'rgba(235,230,220,0.75)', marginBottom: 2 }}>{a.entityLabel}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{a.description}</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: DOMAIN_COLORS[a.domain] ?? ACCENT }}>{a.domain}</span>
                      {a.deepLink && (
                        <a href={a.deepLink} style={{ color: 'rgba(255,255,255,0.25)', display: 'flex', flexShrink: 0 }}>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {ripple.affected.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
                  No downstream effects detected for this entity.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </OmniaLayout>
  );
}
