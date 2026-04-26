import {
  AlertTriangle,
  Bell,
  BellOff,
  BookmarkPlus,
  Clock,
  ExternalLink,
  Globe,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import {
  type AddWatchlistInput,
  isDemoMode,
  type PushSchedule,
  useAddToWatchlist,
  usePersonalizedBrief,
  usePushSchedule,
  useRemoveFromWatchlist,
  useUpdatePushSchedule,
  useWatchlist,
  type WatchlistItem,
} from '../lib/api';

const DOMAIN_META: Record<string, { label: string; color: string; icon: string }> = {
  maritime: { label: 'Maritime', color: '#5090e8', icon: '⚓' },
  security: { label: 'Security', color: '#e05050', icon: '⬡' },
  real_estate: { label: 'Real Estate', color: '#4eca8b', icon: '⬢' },
  legal: { label: 'Legal', color: '#9b70e8', icon: '⚖' },
  financial: { label: 'Financial', color: '#e08c40', icon: '◈' },
  platform: { label: 'Platform', color: '#40c8d8', icon: '◆' },
  executive: { label: 'Executive', color: '#c8a84b', icon: '★' },
};

const ENTITY_TYPES = [
  { value: 'vessel', label: 'Vessel', domain: 'maritime' },
  { value: 'threat', label: 'Threat', domain: 'security' },
  { value: 'property', label: 'Property', domain: 'real_estate' },
  { value: 'matter', label: 'Legal Matter', domain: 'legal' },
  { value: 'deal', label: 'Deal', domain: 'financial' },
  { value: 'holding', label: 'Holding', domain: 'financial' },
  { value: 'agent', label: 'Agent', domain: 'platform' },
];

function domainColor(domain: string) {
  return DOMAIN_META[domain]?.color ?? '#c8a84b';
}

function AddEntityModal({ onClose, onAdd }: { onClose: () => void; onAdd: (input: AddWatchlistInput) => void }) {
  const [entityType, setEntityType] = useState('');
  const [entityLabel, setEntityLabel] = useState('');
  const [entityUri, setEntityUri] = useState('');
  const [domain, setDomain] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedType = ENTITY_TYPES.find((t) => t.value === entityType);

  const handleTypeChange = (v: string) => {
    setEntityType(v);
    const t = ENTITY_TYPES.find((et) => et.value === v);
    if (t) setDomain(t.domain);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityType || !entityLabel.trim() || !domain) return;
    const uri = entityUri.trim() || `${domain}:${entityType}:${entityLabel.trim().toLowerCase().replace(/\s+/g, '-')}`;
    setSubmitting(true);
    try {
      onAdd({ entityUri: uri, entityType, entityLabel: entityLabel.trim(), domain });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#0f1117', border: '1px solid rgba(200,168,75,0.25)',
          borderRadius: 12, padding: 28, width: 440, maxWidth: '90vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c8a84b' }}>
            Add to Watchlist
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Entity Type
            </label>
            <select
              value={entityType}
              onChange={(e) => handleTypeChange(e.target.value)}
              required
              style={{
                width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6, padding: '8px 12px', color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem',
              }}
            >
              <option value="">Select entity type…</option>
              {ENTITY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label} ({DOMAIN_META[t.domain]?.label ?? t.domain})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Label / Name
            </label>
            <input
              type="text"
              value={entityLabel}
              onChange={(e) => setEntityLabel(e.target.value)}
              placeholder={selectedType ? `e.g. "MV Pacific Dawn"` : 'Entity name or identifier'}
              required
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6, padding: '8px 12px', color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Entity URI <span style={{ opacity: 0.5 }}>(auto-generated if blank)</span>
            </label>
            <input
              type="text"
              value={entityUri}
              onChange={(e) => setEntityUri(e.target.value)}
              placeholder="maritime:vessel:mv-pacific-dawn"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6, padding: '8px 12px', color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            />
          </div>

          {domain && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
              borderRadius: 6, background: `${domainColor(domain)}10`, border: `1px solid ${domainColor(domain)}30`,
            }}>
              <span style={{ fontSize: '0.85rem' }}>{DOMAIN_META[domain]?.icon ?? '◆'}</span>
              <span style={{ fontSize: '0.75rem', color: domainColor(domain), fontWeight: 600 }}>
                {DOMAIN_META[domain]?.label ?? domain} domain
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !entityType || !entityLabel.trim()}
            style={{
              marginTop: 4, padding: '10px 20px', borderRadius: 6,
              background: 'rgba(200,168,75,0.12)', border: '1px solid rgba(200,168,75,0.35)',
              color: '#c8a84b', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
              opacity: submitting || !entityType || !entityLabel.trim() ? 0.5 : 1,
            }}
          >
            {submitting ? 'Adding…' : 'Add to Watchlist'}
          </button>
        </div>
      </form>
    </div>
  );
}

function WatchlistCard({ item, onRemove }: { item: WatchlistItem; onRemove: (id: number) => void }) {
  const color = domainColor(item.domain);
  const meta = DOMAIN_META[item.domain];
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 16px', borderRadius: 8,
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
        transition: 'border-color 0.15s',
      }}
    >
      <div
        style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${color}12`, border: `1px solid ${color}30`, fontSize: '1rem',
        }}
      >
        {meta?.icon ?? '◆'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500, marginBottom: 2 }}>
          {item.entityLabel}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '0.68rem', padding: '1px 6px', borderRadius: 3,
              background: `${color}12`, border: `1px solid ${color}25`, color,
              fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
            }}
          >
            {meta?.label ?? item.domain}
          </span>
          <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
            {item.entityType}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={9} />
            {new Date(item.addedAt).toLocaleDateString()}
          </span>
        </div>
        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', marginTop: 2 }}>
          {item.entityUri}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        title="Remove from watchlist"
        style={{
          background: 'transparent', border: '1px solid rgba(224,80,80,0.25)',
          color: 'rgba(224,80,80,0.6)', padding: '5px 8px', borderRadius: 5,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem',
        }}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

function PushSchedulePanel({ schedule }: { schedule: PushSchedule }) {
  const update = useUpdatePushSchedule();
  const [hour, setHour] = useState(schedule.deliveryHourUtc);

  const handleToggle = () => {
    update.mutate({ enabled: !schedule.enabled });
  };

  const handleHourChange = (h: number) => {
    setHour(h);
    update.mutate({ deliveryHourUtc: h });
  };

  const formatHour = (h: number) => {
    const ampm = h < 12 ? 'AM' : 'PM';
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:00 ${ampm} UTC`;
  };

  return (
    <div
      style={{
        borderRadius: 10, border: '1px solid rgba(200,168,75,0.2)',
        background: 'rgba(200,168,75,0.04)', padding: '18px 20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {schedule.enabled ? <Bell size={15} color="#c8a84b" /> : <BellOff size={15} color="rgba(255,255,255,0.35)" />}
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: schedule.enabled ? '#c8a84b' : 'rgba(255,255,255,0.5)' }}>
            Morning Push Briefing
          </span>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={update.isPending}
          style={{
            padding: '4px 12px', borderRadius: 5, fontSize: '0.72rem', fontWeight: 600,
            background: schedule.enabled ? 'rgba(224,80,80,0.1)' : 'rgba(200,168,75,0.1)',
            border: schedule.enabled ? '1px solid rgba(224,80,80,0.3)' : '1px solid rgba(200,168,75,0.3)',
            color: schedule.enabled ? '#e05050' : '#c8a84b',
            cursor: 'pointer',
          }}
        >
          {schedule.enabled ? 'Pause' : 'Enable'}
        </button>
      </div>
      {schedule.enabled && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Delivery time:</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[5, 6, 7, 8, 9, 10].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => handleHourChange(h)}
                style={{
                  padding: '3px 10px', borderRadius: 5, fontSize: '0.72rem',
                  background: hour === h ? 'rgba(200,168,75,0.15)' : 'rgba(255,255,255,0.04)',
                  border: hour === h ? '1px solid rgba(200,168,75,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  color: hour === h ? '#c8a84b' : 'rgba(255,255,255,0.5)', cursor: 'pointer',
                }}
              >
                {formatHour(h)}
              </button>
            ))}
          </div>
        </div>
      )}
      {schedule.lastDeliveredAt && (
        <div style={{ marginTop: 10, fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={10} />
          Last delivered {new Date(schedule.lastDeliveredAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}

export default function Watchlist() {
  const { data: watchlist, isLoading: wLoading } = useWatchlist();
  const { data: personalized } = usePersonalizedBrief();
  const { data: schedule } = usePushSchedule();
  const addMutation = useAddToWatchlist();
  const removeMutation = useRemoveFromWatchlist();
  const [showModal, setShowModal] = useState(false);

  const handleAdd = (input: AddWatchlistInput) => {
    addMutation.mutate(input);
  };

  const handleRemove = (id: number) => {
    removeMutation.mutate(id);
  };

  const byDomain = (watchlist ?? []).reduce(
    (acc, item) => {
      const d = item.domain;
      if (!acc[d]) acc[d] = [];
      acc[d]!.push(item);
      return acc;
    },
    {} as Record<string, WatchlistItem[]>,
  );

  if (isDemoMode()) {
    return (
      <div style={{ padding: '40px 28px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', borderRadius: 8,
          background: 'rgba(224,140,64,0.06)', border: '1px solid rgba(224,140,64,0.2)',
        }}>
          <AlertTriangle size={15} color="#e08c40" />
          <span style={{ fontSize: '0.82rem', color: '#e08c40' }}>
            Watchlist management requires a full account. Sign in to personalize your briefings.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 0 60px' }}>
      {showModal && <AddEntityModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}

      <div
        style={{
          padding: '28px 28px 20px',
          borderBottom: '1px solid var(--pulse-border)',
          background: 'linear-gradient(180deg, rgba(200,168,75,0.04) 0%, transparent 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--pulse-gold)', marginBottom: 6 }}>
              Pulse · Watchlist
            </div>
            <h1 className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 500, color: 'var(--pulse-text)', lineHeight: 1.3 }}>
              My Intelligence Watchlist
            </h1>
            <p style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--pulse-text-dim)', maxWidth: 560 }}>
              Track entities across your portfolio — deals, vessels, holdings, threats, and legal matters. Your morning briefing is scoped to these entities.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 7,
              background: 'rgba(200,168,75,0.12)', border: '1px solid rgba(200,168,75,0.35)',
              color: '#c8a84b', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Plus size={14} />
            Add Entity
          </button>
        </div>

        {personalized && personalized.personalized && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginTop: 12,
            padding: '8px 14px', borderRadius: 6, background: 'rgba(78,202,139,0.05)',
            border: '1px solid rgba(78,202,139,0.2)',
          }}>
            <Globe size={12} color="#4eca8b" />
            <span style={{ fontSize: '0.75rem', color: '#4eca8b' }}>
              Your briefing is personalized to {personalized.watchedDomains.join(', ')} domains
            </span>
          </div>
        )}
      </div>

      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {schedule && <PushSchedulePanel schedule={schedule} />}

        {wLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ height: 60, borderRadius: 8, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        )}

        {!wLoading && (!watchlist || watchlist.length === 0) && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            padding: '48px 24px', borderRadius: 10, border: '1px dashed rgba(200,168,75,0.2)',
            background: 'rgba(200,168,75,0.02)',
          }}>
            <BookmarkPlus size={32} color="rgba(200,168,75,0.4)" />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500, marginBottom: 6 }}>
                Your watchlist is empty
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', maxWidth: 340, lineHeight: 1.5 }}>
                Add vessels, deals, holdings, threats, and legal matters to personalize your morning briefing.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              style={{
                marginTop: 4, display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 7,
                background: 'rgba(200,168,75,0.1)', border: '1px solid rgba(200,168,75,0.3)',
                color: '#c8a84b', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Plus size={14} />
              Add your first entity
            </button>
          </div>
        )}

        {!wLoading && watchlist && watchlist.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {Object.entries(byDomain).map(([domain, items]) => {
              const meta = DOMAIN_META[domain];
              const color = domainColor(domain);
              return (
                <div key={domain}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${color}20`,
                  }}>
                    <span style={{ fontSize: '1rem' }}>{meta?.icon ?? '◆'}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color }}>
                      {meta?.label ?? domain}
                    </span>
                    <span style={{
                      fontSize: '0.65rem', padding: '1px 7px', borderRadius: 10,
                      background: `${color}12`, border: `1px solid ${color}25`, color,
                    }}>
                      {items.length}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {items.map((item) => (
                      <WatchlistCard key={item.id} item={item} onRemove={handleRemove} />
                    ))}
                  </div>
                </div>
              );
            })}

            {personalized?.briefing && (
              <div style={{
                marginTop: 8, padding: '16px 18px', borderRadius: 10,
                background: 'rgba(200,168,75,0.04)', border: '1px solid rgba(200,168,75,0.15)',
              }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#c8a84b', marginBottom: 8 }}>
                  Personalized Briefing Preview
                </div>
                <div className="font-serif" style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4, marginBottom: 6 }}>
                  {personalized.briefing.headline}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                  {personalized.watchedDomains.length > 0
                    ? `Scoped to ${personalized.watchedDomains.join(', ')} — ${(personalized.briefing.sections as unknown[]).length} relevant sections`
                    : 'All domains included'}
                </div>
                <a
                  href="./"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10,
                    fontSize: '0.75rem', color: 'rgba(200,168,75,0.7)',
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={11} />
                  View full brief
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
