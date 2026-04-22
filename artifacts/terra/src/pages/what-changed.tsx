
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CheckCircle,
  Clock,
  FileText,
  RefreshCw,
  Shield,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { type WhatChangedEvent, whatChangedFeed } from '@/data/property-twin';

const ACCENT = '#40856a';

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const EVENT_ICONS: Record<WhatChangedEvent['eventType'], React.ElementType> = {
  ownership_change: User,
  valuation_update: Building2,
  distress_signal: AlertTriangle,
  diligence_update: CheckCircle,
  approval_action: Shield,
  document_added: FileText,
  lease_event: FileText,
  market_signal: Activity,
  readiness_change: Clock,
};

const EVENT_LABELS: Record<WhatChangedEvent['eventType'], string> = {
  ownership_change: 'Ownership',
  valuation_update: 'Valuation',
  distress_signal: 'Distress',
  diligence_update: 'Diligence',
  approval_action: 'Approval',
  document_added: 'Document',
  lease_event: 'Lease',
  market_signal: 'Market',
  readiness_change: 'Readiness',
};

const SEV_COLOR = {
  info: {
    bg: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.06)',
    text: 'rgba(255,255,255,0.65)',
    badge: 'rgba(255,255,255,0.1)',
    badgeText: 'rgba(255,255,255,0.4)',
  },
  warning: {
    bg: '#c08a2c08',
    border: '#c08a2c25',
    text: 'rgba(255,255,255,0.75)',
    badge: '#c08a2c20',
    badgeText: '#c08a2c',
  },
  critical: {
    bg: '#c04a2a08',
    border: '#c04a2a30',
    text: 'rgba(255,255,255,0.85)',
    badge: '#c04a2a20',
    badgeText: '#c04a2a',
  },
};

const ALL_TYPES = [
  'all',
  'distress_signal',
  'approval_action',
  'diligence_update',
  'document_added',
  'readiness_change',
  'market_signal',
] as const;

function EventCard({ event }: { event: WhatChangedEvent }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = EVENT_ICONS[event.eventType] ?? Activity;
  const s = SEV_COLOR[event.severity];
  return (
    <div
      className="rounded-xl border p-4 transition-all duration-200 cursor-pointer hover:bg-white/3"
      style={{ background: s.bg, borderColor: s.border }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg flex-shrink-0" style={{ background: s.badge }}>
          <Icon size={14} style={{ color: s.badgeText }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span
              className="text-xs font-medium px-1.5 py-0.5 rounded"
              style={{ background: s.badge, color: s.badgeText }}
            >
              {EVENT_LABELS[event.eventType]}
            </span>
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {event.propertyName}
            </span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
              · {event.source}
            </span>
          </div>
          <div className="text-sm font-medium" style={{ color: s.text }}>
            {event.summary}
          </div>
          {expanded && event.detail && (
            <div
              className="mt-2 text-xs leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              {event.detail}
            </div>
          )}
          <div
            className="flex items-center gap-3 mt-1.5 text-xs"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            <span>{relTime(event.occurredAt)}</span>
            {event.actor && <span>· by {event.actor}</span>}
          </div>
        </div>
        <ArrowUpRight size={14} style={{ color: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
      </div>
    </div>
  );
}

export default function WhatChanged() {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = whatChangedFeed.filter((e) => {
    if (filter !== 'all' && e.eventType !== filter) return false;
    if (
      search &&
      !e.summary.toLowerCase().includes(search.toLowerCase()) &&
      !e.propertyName.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const counts = {
    critical: whatChangedFeed.filter((e) => e.severity === 'critical').length,
    warning: whatChangedFeed.filter((e) => e.severity === 'warning').length,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto" style={{ color: 'rgba(255,255,255,0.8)' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.95)' }}>
            What Changed
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            A real-time log of significant events across your property portfolio
          </p>
        </div>
        <button
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div
          className="rounded-xl border p-4"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Total events (24h)
          </div>
          <div className="text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {whatChangedFeed.length}
          </div>
        </div>
        <div
          className="rounded-xl border p-4"
          style={{ background: '#c04a2a08', borderColor: '#c04a2a25' }}
        >
          <div className="text-xs mb-1" style={{ color: '#c04a2a' }}>
            Critical
          </div>
          <div className="text-2xl font-bold" style={{ color: '#c04a2a' }}>
            {counts.critical}
          </div>
        </div>
        <div
          className="rounded-xl border p-4"
          style={{ background: '#c08a2c08', borderColor: '#c08a2c25' }}
        >
          <div className="text-xs mb-1" style={{ color: '#c08a2c' }}>
            Warnings
          </div>
          <div className="text-2xl font-bold" style={{ color: '#c08a2c' }}>
            {counts.warning}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm rounded-lg px-3 py-2 outline-none"
          style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
        />
        <div className="flex items-center gap-1">
          {ALL_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className="text-xs px-2.5 py-1 rounded-lg transition-colors capitalize"
              style={{
                background: filter === t ? `${ACCENT}20` : 'rgba(255,255,255,0.04)',
                color: filter === t ? ACCENT : 'rgba(255,255,255,0.4)',
                border: `1px solid ${filter === t ? `${ACCENT}40` : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {t === 'all' ? 'All' : (EVENT_LABELS[t as WhatChangedEvent['eventType']] ?? t)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
            No events match your filter.
          </div>
        ) : (
          filtered.map((e) => <EventCard key={e.id} event={e} />)
        )}
      </div>
    </div>
  );
}
