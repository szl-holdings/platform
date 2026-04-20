import { AnimatePresence, m } from 'framer-motion';
import {
  Calendar,
  CalendarDays,
  ChevronDown,
  FileText,
  Filter,
  Image,
  LayoutList,
  Link2,
  Mail,
  Megaphone,
  Plus,
  Tag,
  Twitter,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { DistributionOsLayout } from './admin-dashboard';

const API = import.meta.env.VITE_API_URL || '';

interface CalendarItem {
  id: number;
  title: string;
  contentType: string;
  contentId: number | null;
  pillarId: number | null;
  channel: string | null;
  status: string;
  scheduledDate: string | null;
  owner: string | null;
  notes: string | null;
  campaignId: number | null;
  destinationUrl: string | null;
  targetAudience: string | null;
  createdAt: string;
}

interface Pillar {
  id: number;
  name: string;
  slug: string;
  color: string | null;
  isFavorite: boolean;
}

const CONTENT_TYPES = [
  { value: 'article', label: 'Article', icon: FileText },
  { value: 'newsletter', label: 'Newsletter', icon: Mail },
  { value: 'carousel', label: 'Carousel', icon: Image },
  { value: 'x-post', label: 'X / Thread', icon: Twitter },
  { value: 'campaign', label: 'Campaign', icon: Megaphone },
  { value: 'other', label: 'Other', icon: Tag },
];

const STATUSES = [
  { value: 'idea', label: 'Idea', color: '#8b8579', bg: 'hsla(30,5%,45%,0.12)' },
  { value: 'planned', label: 'Draft', color: '#4a90b8', bg: 'hsla(210,45%,50%,0.12)' },
  {
    value: 'in-progress',
    label: 'Design in Progress',
    color: '#d4a054',
    bg: 'hsla(38,65%,58%,0.12)',
  },
  { value: 'ready', label: 'Scheduled', color: '#9c5adc', bg: 'hsla(270,60%,60%,0.12)' },
  { value: 'published', label: 'Published', color: '#5a9c5a', bg: 'hsla(120,35%,48%,0.12)' },
  { value: 'repurpose', label: 'Repurpose', color: '#b87c2a', bg: 'hsla(35,50%,44%,0.12)' },
  { value: 'archived', label: 'Archived', color: '#4a4540', bg: 'hsla(30,5%,28%,0.12)' },
  { value: 'cancelled', label: 'Cancelled', color: '#6b3030', bg: 'hsla(0,30%,30%,0.12)' },
] as const;

type Status = (typeof STATUSES)[number]['value'];

const CHANNELS = [
  'site',
  'linkedin',
  'x',
  'medium',
  'substack',
  'newsletter',
  'instagram',
  'other',
];

function statusMeta(status: string) {
  return (
    STATUSES.find((s) => s.value === status) || {
      label: status,
      color: '#8b8579',
      bg: 'hsla(30,5%,45%,0.12)',
    }
  );
}

function typeIcon(contentType: string) {
  return CONTENT_TYPES.find((t) => t.value === contentType)?.icon || Tag;
}

function StatusPill({ status, onChange }: { status: string; onChange: (s: Status) => void }) {
  const [open, setOpen] = useState(false);
  const meta = statusMeta(status);
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.25rem 0.625rem',
          background: meta.bg,
          color: meta.color,
          border: `1px solid ${meta.color}30`,
          borderRadius: '4px',
          fontSize: '0.6875rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {meta.label} <ChevronDown size={10} />
      </button>
      <AnimatePresence>
        {open && (
          <m.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              right: 0,
              background: '#111520',
              border: '1px solid hsla(0,0%,100%,0.1)',
              borderRadius: '8px',
              overflow: 'hidden',
              zIndex: 100,
              minWidth: 160,
            }}
          >
            {STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => {
                  onChange(s.value);
                  setOpen(false);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.5rem 0.875rem',
                  background: s.value === status ? 'hsla(0,0%,100%,0.06)' : 'transparent',
                  color: s.color,
                  border: 'none',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: s.value === status ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                {s.label}
              </button>
            ))}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NewItemForm({
  pillars,
  onAdd,
  onClose,
}: {
  pillars: Pillar[];
  onAdd: (item: CalendarItem) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: '',
    contentType: 'article',
    channel: 'site',
    scheduledDate: '',
    pillarId: '' as string | number,
    owner: '',
    notes: '',
    status: 'idea' as Status,
    destinationUrl: '',
    targetAudience: '',
    contentId: '' as string | number,
    campaignId: '' as string | number,
  });
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!form.title) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/distribution-os/calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          contentType: form.contentType,
          channel: form.channel || null,
          scheduledDate: form.scheduledDate || null,
          pillarId: form.pillarId ? Number(form.pillarId) : null,
          owner: form.owner || null,
          notes: form.notes || null,
          status: form.status,
          destinationUrl: form.destinationUrl || null,
          targetAudience: form.targetAudience || null,
          contentId: form.contentId ? Number(form.contentId) : null,
          campaignId: form.campaignId ? Number(form.campaignId) : null,
        }),
      });
      const item = await res.json();
      onAdd(item);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        padding: '1.5rem',
        background: 'hsla(0,0%,100%,0.025)',
        border: '1px solid hsla(0,0%,100%,0.08)',
        borderRadius: '12px',
        marginBottom: '1.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
        }}
      >
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#e8e4de' }}>
          Add Calendar Item
        </h3>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#6b6560', cursor: 'pointer' }}
        >
          <X size={16} />
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Title</label>
          <input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Content title…"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Content Type</label>
          <select
            value={form.contentType}
            onChange={(e) => setForm((p) => ({ ...p, contentType: e.target.value }))}
            style={selectStyle}
          >
            {CONTENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Channel</label>
          <select
            value={form.channel}
            onChange={(e) => setForm((p) => ({ ...p, channel: e.target.value }))}
            style={selectStyle}
          >
            {CHANNELS.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Pillar</label>
          <select
            value={form.pillarId}
            onChange={(e) => setForm((p) => ({ ...p, pillarId: e.target.value }))}
            style={selectStyle}
          >
            <option value="">— None —</option>
            {pillars.map((p) => (
              <option key={p.id} value={p.id}>
                {p.isFavorite ? '★ ' : ''}
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Initial Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as Status }))}
            style={selectStyle}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Publish Date</label>
          <input
            type="date"
            value={form.scheduledDate}
            onChange={(e) => setForm((p) => ({ ...p, scheduledDate: e.target.value }))}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Owner</label>
          <input
            value={form.owner}
            onChange={(e) => setForm((p) => ({ ...p, owner: e.target.value }))}
            placeholder="Assigned to…"
            style={inputStyle}
          />
        </div>
      </div>

      <div
        style={{
          borderTop: '1px solid hsla(0,0%,100%,0.06)',
          paddingTop: '1rem',
          marginBottom: '1rem',
        }}
      >
        <div
          style={{
            fontSize: '0.625rem',
            fontWeight: 700,
            color: '#6b6560',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
          }}
        >
          <Link2 size={11} /> Linked Resources
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Destination Page URL</label>
            <input
              value={form.destinationUrl}
              onChange={(e) => setForm((p) => ({ ...p, destinationUrl: e.target.value }))}
              placeholder="/offer-page or https://…"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Target Audience</label>
            <input
              value={form.targetAudience}
              onChange={(e) => setForm((p) => ({ ...p, targetAudience: e.target.value }))}
              placeholder="e.g. Maritime operations executives"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Carousel / Content ID</label>
            <input
              type="number"
              value={form.contentId}
              onChange={(e) => setForm((p) => ({ ...p, contentId: e.target.value }))}
              placeholder="Carousel project ID (optional)"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Campaign ID</label>
            <input
              type="number"
              value={form.campaignId}
              onChange={(e) => setForm((p) => ({ ...p, campaignId: e.target.value }))}
              placeholder="DOS campaign ID (optional)"
              style={inputStyle}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Additional notes, context, or instructions…"
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={submit}
          disabled={!form.title || saving}
          style={{
            padding: '0.625rem 1.25rem',
            background: form.title
              ? 'linear-gradient(135deg, #d4a054, #c8953c)'
              : 'hsla(0,0%,100%,0.06)',
            color: form.title ? '#070a10' : '#4a4540',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '0.8125rem',
            cursor: form.title ? 'pointer' : 'not-allowed',
          }}
        >
          {saving ? 'Adding…' : 'Add Item'}
        </button>
        <button
          onClick={onClose}
          style={{
            padding: '0.625rem 1rem',
            background: 'hsla(0,0%,100%,0.04)',
            color: '#8b8579',
            border: '1px solid hsla(0,0%,100%,0.08)',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.6875rem',
  fontWeight: 600,
  color: '#8b8579',
  textTransform: 'uppercase',
  marginBottom: '0.375rem',
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5625rem 0.75rem',
  background: 'hsla(0,0%,100%,0.04)',
  border: '1px solid hsla(0,0%,100%,0.1)',
  borderRadius: '6px',
  color: '#e8e4de',
  fontSize: '0.8125rem',
  boxSizing: 'border-box',
};
const selectStyle: React.CSSProperties = { ...inputStyle };

function ItemRow({
  item,
  pillars,
  onUpdate,
}: {
  item: CalendarItem;
  pillars: Pillar[];
  onUpdate: (updated: CalendarItem) => void;
}) {
  const Icon = typeIcon(item.contentType);
  const pillar = pillars.find((p) => p.id === item.pillarId);
  const [expanded, setExpanded] = useState(false);

  async function updateStatus(status: Status) {
    const res = await fetch(`${API}/api/distribution-os/calendar/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const updated = await res.json();
    onUpdate(updated);
  }

  return (
    <div
      style={{
        background: 'hsla(0,0%,100%,0.02)',
        border: '1px solid hsla(0,0%,100%,0.05)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.875rem',
          padding: '0.875rem 1rem',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded((p) => !p)}
      >
        <Icon size={15} style={{ color: '#d4a054', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#e8e4de',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.title}
          </div>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.125rem' }}
          >
            <span style={{ fontSize: '0.6875rem', color: '#4a4540' }}>{item.contentType}</span>
            {item.channel && (
              <span style={{ fontSize: '0.6875rem', color: '#4a4540' }}>· {item.channel}</span>
            )}
            {pillar && (
              <span style={{ fontSize: '0.6875rem', color: pillar.color || '#8b8579' }}>
                · {pillar.name}
              </span>
            )}
            {item.owner && (
              <span style={{ fontSize: '0.6875rem', color: '#4a4540' }}>· {item.owner}</span>
            )}
          </div>
        </div>
        {item.scheduledDate && (
          <div style={{ fontSize: '0.75rem', color: '#6b6560', flexShrink: 0 }}>
            {new Date(item.scheduledDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </div>
        )}
        <div onClick={(e) => e.stopPropagation()}>
          <StatusPill status={item.status} onChange={updateStatus} />
        </div>
        <ChevronDown
          size={14}
          style={{
            color: '#4a4540',
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
            flexShrink: 0,
          }}
        />
      </div>

      <AnimatePresence>
        {expanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '0 1rem 1rem 2.75rem',
                borderTop: '1px solid hsla(0,0%,100%,0.04)',
              }}
            >
              <div
                style={{ paddingTop: '0.875rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}
              >
                {item.scheduledDate && (
                  <div>
                    <div
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        color: '#6b6560',
                        textTransform: 'uppercase',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Publish Date
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#c8c2ba' }}>
                      {new Date(item.scheduledDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                )}
                {item.channel && (
                  <div>
                    <div
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        color: '#6b6560',
                        textTransform: 'uppercase',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Target Channel
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#c8c2ba' }}>{item.channel}</div>
                  </div>
                )}
                {item.targetAudience && (
                  <div>
                    <div
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        color: '#6b6560',
                        textTransform: 'uppercase',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Target Audience
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#c8c2ba' }}>
                      {item.targetAudience}
                    </div>
                  </div>
                )}
                {item.destinationUrl && (
                  <div>
                    <div
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        color: '#6b6560',
                        textTransform: 'uppercase',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Destination Page
                    </div>
                    <a
                      href={
                        item.destinationUrl.startsWith('http')
                          ? item.destinationUrl
                          : `https://szlholdings.com${item.destinationUrl}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '0.8125rem',
                        color: '#4a90b8',
                        fontFamily: 'monospace',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      {item.destinationUrl} <span style={{ fontSize: '0.6875rem' }}>↗</span>
                    </a>
                  </div>
                )}
                {item.contentId && (
                  <div>
                    <div
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        color: '#6b6560',
                        textTransform: 'uppercase',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Linked Carousel
                    </div>
                    <a
                      href={`../carousel-lab?id=${item.contentId}`}
                      style={{
                        fontSize: '0.8125rem',
                        color: '#4a90b8',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      Carousel #{item.contentId} <span style={{ fontSize: '0.6875rem' }}>↗</span>
                    </a>
                  </div>
                )}
                {item.campaignId && (
                  <div>
                    <div
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        color: '#6b6560',
                        textTransform: 'uppercase',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Linked Campaign
                    </div>
                    <a
                      href={`../campaigns?id=${item.campaignId}`}
                      style={{
                        fontSize: '0.8125rem',
                        color: '#4a90b8',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      Campaign #{item.campaignId} <span style={{ fontSize: '0.6875rem' }}>↗</span>
                    </a>
                  </div>
                )}
                {item.notes && (
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        color: '#6b6560',
                        textTransform: 'uppercase',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Notes
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#8b8579', lineHeight: 1.5 }}>
                      {item.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ContentCalendarPage() {
  const [location] = useLocation();
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/distribution-os/calendar`).then((r) => r.json()),
      fetch(`${API}/api/distribution-os/pillars`).then((r) => r.json()),
    ])
      .then(([calData, pillarData]) => {
        setItems(Array.isArray(calData) ? calData : []);
        setPillars(Array.isArray(pillarData) ? pillarData : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleUpdate(updated: CalendarItem) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  const filtered = items.filter((i) => {
    if (filterStatus !== 'all' && i.status !== filterStatus) return false;
    if (filterType !== 'all' && i.contentType !== filterType) return false;
    return true;
  });

  const grouped = filtered.reduce(
    (acc, item) => {
      const key = item.scheduledDate
        ? new Date(item.scheduledDate).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })
        : 'Unscheduled';
      (acc[key] = acc[key] || []).push(item);
      return acc;
    },
    {} as Record<string, CalendarItem[]>,
  );

  const byStatus = items.reduce(
    (acc, i) => {
      (acc[i.status] = acc[i.status] || []).push(i);
      return acc;
    },
    {} as Record<string, CalendarItem[]>,
  );

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e8e4de' }}>
              Content Calendar
            </h1>
            <p style={{ fontSize: '0.8125rem', color: '#6b6560', marginTop: '0.25rem' }}>
              {items.length} items · {filtered.length} shown
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div
              style={{
                display: 'flex',
                background: 'hsla(0,0%,100%,0.04)',
                border: '1px solid hsla(0,0%,100%,0.08)',
                borderRadius: '6px',
                overflow: 'hidden',
              }}
            >
              {(['list', 'kanban'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: viewMode === mode ? 'hsla(0,0%,100%,0.08)' : 'transparent',
                    color: viewMode === mode ? '#e8e4de' : '#6b6560',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: viewMode === mode ? 600 : 400,
                  }}
                >
                  {mode === 'list' ? <LayoutList size={14} /> : <CalendarDays size={14} />}
                  {mode === 'list' ? 'List' : 'Kanban'}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowNew((p) => !p)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'linear-gradient(135deg, #d4a054, #c8953c)',
                color: '#070a10',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              <Plus size={15} /> Add Item
            </button>
          </div>
        </div>

        {showNew && (
          <NewItemForm
            pillars={pillars}
            onAdd={(item) => {
              setItems((p) => [...p, item]);
            }}
            onClose={() => setShowNew(false)}
          />
        )}

        <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '0.375rem 0.75rem',
              background: 'hsla(0,0%,100%,0.04)',
              border: '1px solid hsla(0,0%,100%,0.08)',
              borderRadius: '6px',
              color: '#c8c2ba',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '0.375rem 0.75rem',
              background: 'hsla(0,0%,100%,0.04)',
              border: '1px solid hsla(0,0%,100%,0.08)',
              borderRadius: '6px',
              color: '#c8c2ba',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Types</option>
            {CONTENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {STATUSES.map((s) => (
              <div
                key={s.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.25rem 0.625rem',
                  background: s.bg,
                  border: `1px solid ${s.color}30`,
                  borderRadius: '4px',
                  fontSize: '0.6875rem',
                  color: s.color,
                }}
              >
                <span style={{ fontWeight: 700 }}>{(byStatus[s.value] || []).length}</span>{' '}
                {s.label}
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#4a4540' }}>
            Loading calendar…
          </div>
        ) : viewMode === 'list' ? (
          filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#4a4540' }}>
              <Calendar size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
              <p style={{ color: '#6b6560' }}>
                {items.length === 0 ? 'No calendar items yet.' : 'No items match your filters.'}
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([month, monthItems]) => (
              <div key={month} style={{ marginBottom: '2rem' }}>
                <h3
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    color: '#6b6560',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: '0.75rem',
                  }}
                >
                  {month} · {monthItems.length} item{monthItems.length !== 1 ? 's' : ''}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {monthItems.map((item) => (
                    <ItemRow key={item.id} item={item} pillars={pillars} onUpdate={handleUpdate} />
                  ))}
                </div>
              </div>
            ))
          )
        ) : (
          <div
            style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '1rem' }}
          >
            {STATUSES.map((s) => {
              const lane = byStatus[s.value] || [];
              return (
                <div key={s.value} style={{ minWidth: 220, maxWidth: 240, flexShrink: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <div
                      style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }}
                    />
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        color: s.color,
                        textTransform: 'uppercase',
                      }}
                    >
                      {s.label}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: '#4a4540', marginLeft: 'auto' }}>
                      {lane.length}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {lane.map((item) => {
                      const Icon = typeIcon(item.contentType);
                      return (
                        <div
                          key={item.id}
                          style={{
                            padding: '0.875rem',
                            background: 'hsla(0,0%,100%,0.025)',
                            border: '1px solid hsla(0,0%,100%,0.06)',
                            borderRadius: '8px',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              marginBottom: '0.375rem',
                            }}
                          >
                            <Icon size={12} style={{ color: '#d4a054' }} />
                            <span style={{ fontSize: '0.625rem', color: '#6b6560' }}>
                              {item.contentType}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: '0.8125rem',
                              fontWeight: 600,
                              color: '#e8e4de',
                              lineHeight: 1.4,
                            }}
                          >
                            {item.title}
                          </div>
                          {item.scheduledDate && (
                            <div
                              style={{
                                fontSize: '0.625rem',
                                color: '#4a4540',
                                marginTop: '0.375rem',
                              }}
                            >
                              {new Date(item.scheduledDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {lane.length === 0 && (
                      <div
                        style={{
                          padding: '1.5rem',
                          textAlign: 'center',
                          color: '#4a4540',
                          fontSize: '0.75rem',
                          border: '1px dashed hsla(0,0%,100%,0.04)',
                          borderRadius: '8px',
                        }}
                      >
                        Empty
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </m.div>
    </DistributionOsLayout>
  );
}
