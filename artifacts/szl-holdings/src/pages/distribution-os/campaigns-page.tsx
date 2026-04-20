import { AnimatePresence, m } from 'framer-motion';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Filter,
  Link2,
  Loader2,
  Megaphone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { DistributionOsLayout } from './admin-dashboard';

const campaignSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'archived']),
  owner: z.string().optional(),
});

const linkSchema = z.object({
  name: z.string().min(2, 'Link name must be at least 2 characters'),
  destination: z.string().url('Must be a valid URL starting with https://'),
  source: z.string().min(1, 'Source is required'),
  medium: z.string().min(1, 'Medium is required'),
  campaign: z.string().optional(),
  content: z.string().optional(),
  term: z.string().optional(),
  owner: z.string().optional(),
  notes: z.string().optional(),
});

const API = import.meta.env.VITE_API_URL || '';

interface Campaign {
  id: number;
  name: string;
  slug: string;
  status: string;
  description: string | null;
  owner: string | null;
  notes: string | null;
  totalClicks: number;
  totalConversions: number;
  createdAt: string;
}

interface CampaignLink {
  id: number;
  campaignId: number;
  name: string;
  source: string;
  medium: string;
  campaign: string;
  content: string | null;
  term: string | null;
  destination: string;
  fullUrl: string;
  clicks: number;
  conversions: number;
  owner: string | null;
  notes: string | null;
}

type SortKey = 'name' | 'clicks' | 'conversions' | 'source';
type LinkFormKey = keyof typeof defaultLinkForm;

const defaultLinkForm = {
  name: '',
  source: 'linkedin',
  medium: 'social',
  campaign: '',
  content: '',
  term: '',
  destination: 'https://szlholdings.com',
  owner: 'Stephen',
  notes: '',
};
type SortDir = 'asc' | 'desc';

const STATUS_META: Record<string, { color: string; bg: string }> = {
  draft: { color: '#8b8579', bg: 'hsla(0,0%,100%,0.04)' },
  active: { color: '#5a9c5a', bg: 'hsla(120,30%,40%,0.12)' },
  paused: { color: '#d4a054', bg: 'hsla(40,60%,50%,0.12)' },
  completed: { color: '#4a90b8', bg: 'hsla(210,50%,50%,0.12)' },
  archived: { color: '#4a4540', bg: 'hsla(0,0%,100%,0.02)' },
};

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] || STATUS_META.draft;
  return (
    <span
      style={{
        fontSize: '0.6875rem',
        fontWeight: 700,
        color: meta.color,
        background: meta.bg,
        padding: '0.2rem 0.625rem',
        borderRadius: '100px',
      }}
    >
      {status.toUpperCase()}
    </span>
  );
}

function buildUtmUrl(
  destination: string,
  source: string,
  medium: string,
  campaign: string,
  content: string,
  term: string,
) {
  if (!destination) return '';
  const params = new URLSearchParams();
  if (source) params.set('utm_source', source);
  if (medium) params.set('utm_medium', medium);
  if (campaign) params.set('utm_campaign', campaign);
  if (content) params.set('utm_content', content);
  if (term) params.set('utm_term', term);
  const qs = params.toString();
  return qs ? `${destination}${destination.includes('?') ? '&' : '?'}${qs}` : destination;
}

function exportCsv(links: CampaignLink[]) {
  const headers = [
    'Name',
    'Source',
    'Medium',
    'Campaign',
    'Content',
    'Term',
    'Destination',
    'Full URL',
    'Clicks',
    'Conversions',
    'Owner',
    'Notes',
  ];
  const rows = links.map((l) => [
    l.name,
    l.source,
    l.medium,
    l.campaign,
    l.content || '',
    l.term || '',
    l.destination,
    l.fullUrl,
    l.clicks,
    l.conversions,
    l.owner || '',
    l.notes || '',
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'campaign-links.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function CampaignsPage() {
  const [location] = useLocation();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [links, setLinks] = useState<CampaignLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [linksLoading, setLinksLoading] = useState(false);

  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [showLinkBuilder, setShowLinkBuilder] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [camForm, setCamForm] = useState({
    name: '',
    description: '',
    status: 'active',
    owner: 'Stephen',
  });
  const [linkForm, setLinkForm] = useState<typeof defaultLinkForm>({ ...defaultLinkForm });
  const [saving, setSaving] = useState(false);
  const [camErrors, setCamErrors] = useState<Partial<Record<string, string>>>({});
  const [linkErrors, setLinkErrors] = useState<Partial<Record<string, string>>>({});

  const selectedCampaign = campaigns.find((c) => c.id === selected);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/distribution-os/campaigns`)
      .then((r) => r.json())
      .then((d) => {
        setCampaigns(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) {
      setLinks([]);
      return;
    }
    setLinksLoading(true);
    fetch(`${API}/api/distribution-os/campaigns/${selected}/links`)
      .then((r) => r.json())
      .then((d) => {
        setLinks(Array.isArray(d) ? d : []);
        setLinksLoading(false);
      })
      .catch(() => setLinksLoading(false));
  }, [selected]);

  async function createCampaign() {
    const parsed = campaignSchema.safeParse(camForm);
    if (!parsed.success) {
      const errs: Partial<Record<string, string>> = {};
      for (const e of parsed.error.errors) {
        errs[e.path[0] as string] = e.message;
      }
      setCamErrors(errs);
      return;
    }
    setCamErrors({});
    setSaving(true);
    const slug = camForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const res = await fetch(`${API}/api/distribution-os/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...parsed.data, slug }),
    });
    const c = await res.json();
    setCampaigns((prev) => [c, ...prev]);
    setSelected(c.id);
    setShowNewCampaign(false);
    setCamForm({ name: '', description: '', status: 'active', owner: 'Stephen' });
    setSaving(false);
  }

  async function deleteCampaign(id: number) {
    if (!confirm('Delete this campaign?')) return;
    await fetch(`${API}/api/distribution-os/campaigns/${id}`, { method: 'DELETE' });
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    if (selected === id) setSelected(null);
  }

  async function createLink() {
    if (!selected) return;
    const formWithCampaign = {
      ...linkForm,
      campaign: linkForm.campaign || selectedCampaign?.slug || '',
    };
    const parsed = linkSchema.safeParse(formWithCampaign);
    if (!parsed.success) {
      const errs: Partial<Record<string, string>> = {};
      for (const e of parsed.error.errors) {
        errs[e.path[0] as string] = e.message;
      }
      setLinkErrors(errs);
      return;
    }
    setLinkErrors({});
    setSaving(true);
    const res = await fetch(`${API}/api/distribution-os/campaigns/${selected}/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
    const link = await res.json();
    setLinks((prev) => [...prev, link]);
    setLinkForm({ ...defaultLinkForm });
    setShowLinkBuilder(false);
    setSaving(false);
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(url);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sources = ['all', ...Array.from(new Set(links.map((l) => l.source)))];

  const filteredLinks = links
    .filter((l) => {
      if (sourceFilter !== 'all' && l.source !== sourceFilter) return false;
      if (!search) return true;
      return (
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.destination.toLowerCase().includes(search.toLowerCase())
      );
    })
    .sort((a, b) => {
      const av = a[sortKey] as string | number;
      const bv = b[sortKey] as string | number;
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });

  const previewUrl = buildUtmUrl(
    linkForm.destination,
    linkForm.source,
    linkForm.medium,
    linkForm.campaign || selectedCampaign?.slug || '',
    linkForm.content,
    linkForm.term,
  );

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronDown size={12} style={{ color: '#4a4540' }} />;
    return sortDir === 'desc' ? (
      <ChevronDown size={12} style={{ color: '#d4a054' }} />
    ) : (
      <ChevronUp size={12} style={{ color: '#d4a054' }} />
    );
  }

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
              Campaigns & UTM Manager
            </h1>
            <p style={{ fontSize: '0.8125rem', color: '#6b6560', marginTop: '0.25rem' }}>
              {campaigns.length} campaigns · Build and track UTM links
            </p>
          </div>
          <button
            onClick={() => setShowNewCampaign(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              background: 'linear-gradient(135deg, #d4a054, #c8953c)',
              color: '#070a10',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            <Plus size={15} /> New Campaign
          </button>
        </div>

        <AnimatePresence>
          {showNewCampaign && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', marginBottom: '1.5rem' }}
            >
              <div
                style={{
                  padding: '1.25rem',
                  background: 'hsla(0,0%,100%,0.03)',
                  border: '1px solid hsla(0,0%,100%,0.08)',
                  borderRadius: '10px',
                }}
              >
                <h3
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#e8e4de',
                    marginBottom: '1rem',
                  }}
                >
                  New Campaign
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: '0.6875rem',
                        color: '#6b6560',
                        fontWeight: 600,
                        display: 'block',
                        marginBottom: '0.375rem',
                      }}
                    >
                      Campaign Name *
                    </label>
                    <input
                      value={camForm.name}
                      onChange={(e) => {
                        setCamForm((p) => ({ ...p, name: e.target.value }));
                        setCamErrors((p) => ({ ...p, name: undefined }));
                      }}
                      placeholder="e.g. Founder LinkedIn Q2"
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        background: 'hsla(0,0%,100%,0.04)',
                        border: `1px solid ${camErrors.name ? 'hsla(0,70%,55%,0.5)' : 'hsla(0,0%,100%,0.1)'}`,
                        borderRadius: '6px',
                        color: '#e8e4de',
                        fontSize: '0.8125rem',
                        boxSizing: 'border-box',
                      }}
                    />
                    {camErrors.name && (
                      <div
                        style={{
                          fontSize: '0.6875rem',
                          color: '#c45a4a',
                          marginTop: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <AlertCircle size={10} />
                        {camErrors.name}
                      </div>
                    )}
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: '0.6875rem',
                        color: '#6b6560',
                        fontWeight: 600,
                        display: 'block',
                        marginBottom: '0.375rem',
                      }}
                    >
                      Status
                    </label>
                    <select
                      value={camForm.status}
                      onChange={(e) => setCamForm((p) => ({ ...p, status: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        background: 'hsla(0,0%,100%,0.04)',
                        border: '1px solid hsla(0,0%,100%,0.1)',
                        borderRadius: '6px',
                        color: '#e8e4de',
                        fontSize: '0.8125rem',
                      }}
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: '0.6875rem',
                        color: '#6b6560',
                        fontWeight: 600,
                        display: 'block',
                        marginBottom: '0.375rem',
                      }}
                    >
                      Owner
                    </label>
                    <input
                      value={camForm.owner}
                      onChange={(e) => setCamForm((p) => ({ ...p, owner: e.target.value }))}
                      placeholder="Stephen"
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        background: 'hsla(0,0%,100%,0.04)',
                        border: '1px solid hsla(0,0%,100%,0.1)',
                        borderRadius: '6px',
                        color: '#e8e4de',
                        fontSize: '0.8125rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label
                    style={{
                      fontSize: '0.6875rem',
                      color: '#6b6560',
                      fontWeight: 600,
                      display: 'block',
                      marginBottom: '0.375rem',
                    }}
                  >
                    Description
                  </label>
                  <input
                    value={camForm.description}
                    onChange={(e) => setCamForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Campaign purpose and goals"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      background: 'hsla(0,0%,100%,0.04)',
                      border: '1px solid hsla(0,0%,100%,0.1)',
                      borderRadius: '6px',
                      color: '#e8e4de',
                      fontSize: '0.8125rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={createCampaign}
                    disabled={saving || !camForm.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.5rem 1.25rem',
                      background: '#d4a054',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#070a10',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                    }}
                  >
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}{' '}
                    Create
                  </button>
                  <button
                    onClick={() => setShowNewCampaign(false)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'none',
                      border: '1px solid hsla(0,0%,100%,0.08)',
                      borderRadius: '6px',
                      color: '#6b6560',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem' }}>
          <div>
            <h2
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: '#4a4540',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: '0.75rem',
              }}
            >
              Campaigns
            </h2>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <Loader2 size={20} style={{ color: '#d4a054' }} className="animate-spin" />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {campaigns.map((c) => (
                  <div key={c.id} style={{ position: 'relative' }}>
                    <button
                      onClick={() => setSelected(c.id === selected ? null : c.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.625rem',
                        padding: '0.75rem',
                        width: '100%',
                        background:
                          selected === c.id ? 'hsla(0,0%,100%,0.06)' : 'hsla(0,0%,100%,0.02)',
                        border:
                          selected === c.id
                            ? '1px solid hsla(0,0%,100%,0.12)'
                            : '1px solid hsla(0,0%,100%,0.05)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <Megaphone size={14} style={{ color: '#d4a054', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            color: '#e8e4de',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {c.name}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: '#4a4540' }}>
                          {c.totalClicks} clicks · {c.totalConversions} conv.
                        </div>
                      </div>
                      <StatusBadge status={c.status} />
                    </button>
                  </div>
                ))}
                {campaigns.length === 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '2rem',
                      color: '#4a4540',
                      fontSize: '0.8125rem',
                    }}
                  >
                    No campaigns yet. Create one to get started.
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            {!selected ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '300px',
                  color: '#4a4540',
                  textAlign: 'center',
                }}
              >
                <Target size={32} style={{ marginBottom: '1rem' }} />
                <p style={{ fontSize: '0.875rem' }}>Select a campaign to view its links</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  or create a new campaign to start building UTM links
                </p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                  }}
                >
                  <div>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#e8e4de' }}>
                      {selectedCampaign?.name}
                    </h2>
                    {selectedCampaign?.description && (
                      <p style={{ fontSize: '0.75rem', color: '#6b6560', marginTop: '0.25rem' }}>
                        {selectedCampaign.description}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => exportCsv(filteredLinks)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.5rem 0.75rem',
                        background: 'hsla(0,0%,100%,0.05)',
                        border: '1px solid hsla(0,0%,100%,0.08)',
                        borderRadius: '6px',
                        color: '#6b6560',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      <Download size={13} /> CSV
                    </button>
                    <button
                      onClick={() => setShowLinkBuilder(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.5rem 0.875rem',
                        background: '#d4a054',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#070a10',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      <Plus size={13} /> New Link
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {showLinkBuilder && (
                    <m.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: 'hidden', marginBottom: '1.25rem' }}
                    >
                      <div
                        style={{
                          padding: '1.25rem',
                          background: 'hsla(0,0%,100%,0.02)',
                          border: '1px solid hsla(40,60%,50%,0.2)',
                          borderRadius: '10px',
                        }}
                      >
                        <h3
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#e8e4de',
                            marginBottom: '1rem',
                          }}
                        >
                          UTM Link Builder
                        </h3>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.625rem',
                            marginBottom: '0.75rem',
                          }}
                        >
                          {[
                            {
                              label: 'Link Name *',
                              key: 'name' as LinkFormKey,
                              placeholder: 'e.g. LinkedIn Bio Link',
                            },
                            {
                              label: 'Destination URL *',
                              key: 'destination' as LinkFormKey,
                              placeholder: 'https://szlholdings.com/...',
                            },
                          ].map((f) => (
                            <div key={f.key}>
                              <label
                                style={{
                                  fontSize: '0.6875rem',
                                  color: '#6b6560',
                                  fontWeight: 600,
                                  display: 'block',
                                  marginBottom: '0.3rem',
                                }}
                              >
                                {f.label}
                              </label>
                              <input
                                value={linkForm[f.key]}
                                onChange={(e) => {
                                  setLinkForm((p) => ({ ...p, [f.key]: e.target.value }));
                                  setLinkErrors((p) => ({ ...p, [f.key]: undefined }));
                                }}
                                placeholder={f.placeholder}
                                style={{
                                  width: '100%',
                                  padding: '0.5rem 0.625rem',
                                  background: 'hsla(0,0%,100%,0.04)',
                                  border: `1px solid ${linkErrors[f.key] ? 'hsla(0,70%,55%,0.5)' : 'hsla(0,0%,100%,0.1)'}`,
                                  borderRadius: '6px',
                                  color: '#e8e4de',
                                  fontSize: '0.8125rem',
                                  boxSizing: 'border-box',
                                }}
                              />
                              {linkErrors[f.key] && (
                                <div
                                  style={{
                                    fontSize: '0.6875rem',
                                    color: '#c45a4a',
                                    marginTop: '0.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                  }}
                                >
                                  <AlertCircle size={10} />
                                  {linkErrors[f.key]}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
                            gap: '0.625rem',
                            marginBottom: '0.875rem',
                          }}
                        >
                          {(
                            [
                              {
                                label: 'Source',
                                key: 'source' as LinkFormKey,
                                placeholder: 'linkedin',
                                options: [
                                  'linkedin',
                                  'x',
                                  'linktree',
                                  'email',
                                  'substack',
                                  'medium',
                                  'direct',
                                  'other',
                                ],
                              },
                              {
                                label: 'Medium',
                                key: 'medium' as LinkFormKey,
                                placeholder: 'social',
                                options: [
                                  'social',
                                  'email',
                                  'organic',
                                  'paid',
                                  'referral',
                                  'bio-link',
                                  'content',
                                ],
                              },
                              {
                                label: 'Campaign',
                                key: 'campaign' as LinkFormKey,
                                placeholder: selectedCampaign?.slug || 'campaign-slug',
                                options: undefined,
                              },
                              {
                                label: 'Content',
                                key: 'content' as LinkFormKey,
                                placeholder: 'carousel-1',
                                options: undefined,
                              },
                              {
                                label: 'Term',
                                key: 'term' as LinkFormKey,
                                placeholder: 'keyword',
                                options: undefined,
                              },
                            ] as {
                              label: string;
                              key: LinkFormKey;
                              placeholder: string;
                              options?: string[];
                            }[]
                          ).map((f) => (
                            <div key={f.key}>
                              <label
                                style={{
                                  fontSize: '0.6875rem',
                                  color: '#6b6560',
                                  fontWeight: 600,
                                  display: 'block',
                                  marginBottom: '0.3rem',
                                }}
                              >
                                {f.label}
                              </label>
                              {f.options ? (
                                <select
                                  value={linkForm[f.key]}
                                  onChange={(e) =>
                                    setLinkForm((p) => ({ ...p, [f.key]: e.target.value }))
                                  }
                                  style={{
                                    width: '100%',
                                    padding: '0.5rem 0.5rem',
                                    background: 'hsla(0,0%,100%,0.04)',
                                    border: '1px solid hsla(0,0%,100%,0.1)',
                                    borderRadius: '6px',
                                    color: '#e8e4de',
                                    fontSize: '0.75rem',
                                  }}
                                >
                                  {f.options.map((o) => (
                                    <option key={o} value={o}>
                                      {o}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  value={linkForm[f.key]}
                                  onChange={(e) =>
                                    setLinkForm((p) => ({ ...p, [f.key]: e.target.value }))
                                  }
                                  placeholder={f.placeholder}
                                  style={{
                                    width: '100%',
                                    padding: '0.5rem 0.5rem',
                                    background: 'hsla(0,0%,100%,0.04)',
                                    border: '1px solid hsla(0,0%,100%,0.1)',
                                    borderRadius: '6px',
                                    color: '#e8e4de',
                                    fontSize: '0.75rem',
                                    boxSizing: 'border-box',
                                  }}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                        {previewUrl && (
                          <div
                            style={{
                              marginBottom: '0.875rem',
                              padding: '0.625rem 0.875rem',
                              background: 'hsla(0,0%,100%,0.03)',
                              border: '1px solid hsla(0,0%,100%,0.06)',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                            }}
                          >
                            <Link2 size={12} style={{ color: '#d4a054', flexShrink: 0 }} />
                            <span
                              style={{
                                fontSize: '0.75rem',
                                color: '#8b8579',
                                flex: 1,
                                wordBreak: 'break-all',
                              }}
                            >
                              {previewUrl}
                            </span>
                            <button
                              onClick={() => copyUrl(previewUrl)}
                              style={{
                                padding: '0.25rem 0.5rem',
                                background: 'none',
                                border: '1px solid hsla(0,0%,100%,0.08)',
                                borderRadius: '4px',
                                color: '#6b6560',
                                cursor: 'pointer',
                                flexShrink: 0,
                              }}
                            >
                              {copied === previewUrl ? (
                                <Check size={12} style={{ color: '#5a9c5a' }} />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={createLink}
                            disabled={saving || !linkForm.name || !linkForm.destination}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              padding: '0.5rem 1.25rem',
                              background: '#d4a054',
                              border: 'none',
                              borderRadius: '6px',
                              color: '#070a10',
                              fontWeight: 700,
                              fontSize: '0.8125rem',
                              cursor: 'pointer',
                            }}
                          >
                            {saving ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Save size={13} />
                            )}{' '}
                            Save Link
                          </button>
                          <button
                            onClick={() => setShowLinkBuilder(false)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: 'none',
                              border: '1px solid hsla(0,0%,100%,0.08)',
                              borderRadius: '6px',
                              color: '#6b6560',
                              fontSize: '0.8125rem',
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>

                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '0.875rem',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <Search
                      size={12}
                      style={{
                        position: 'absolute',
                        left: '0.5rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#4a4540',
                      }}
                    />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search links..."
                      style={{
                        paddingLeft: '1.75rem',
                        paddingRight: '0.625rem',
                        paddingTop: '0.375rem',
                        paddingBottom: '0.375rem',
                        background: 'hsla(0,0%,100%,0.04)',
                        border: '1px solid hsla(0,0%,100%,0.08)',
                        borderRadius: '6px',
                        color: '#e8e4de',
                        fontSize: '0.75rem',
                      }}
                    />
                  </div>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    style={{
                      padding: '0.375rem 0.5rem',
                      background: 'hsla(0,0%,100%,0.04)',
                      border: '1px solid hsla(0,0%,100%,0.08)',
                      borderRadius: '6px',
                      color: '#e8e4de',
                      fontSize: '0.75rem',
                    }}
                  >
                    {sources.map((s) => (
                      <option key={s} value={s}>
                        {s === 'all' ? 'All Sources' : s}
                      </option>
                    ))}
                  </select>
                </div>

                {linksLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                    <Loader2 size={20} style={{ color: '#d4a054' }} className="animate-spin" />
                  </div>
                ) : filteredLinks.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '3rem',
                      color: '#4a4540',
                      fontSize: '0.875rem',
                    }}
                  >
                    No links yet. Create a UTM link above.
                  </div>
                ) : (
                  <div
                    style={{
                      background: 'hsla(0,0%,100%,0.02)',
                      border: '1px solid hsla(0,0%,100%,0.06)',
                      borderRadius: '10px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 60px 60px 80px',
                        gap: '0.5rem',
                        padding: '0.625rem 1rem',
                        borderBottom: '1px solid hsla(0,0%,100%,0.06)',
                        background: 'hsla(0,0%,100%,0.02)',
                      }}
                    >
                      {[
                        { label: 'Link Name', key: 'name' as SortKey },
                        { label: 'Source', key: 'source' as SortKey },
                        { label: 'Destination', key: null },
                        { label: 'Clicks', key: 'clicks' as SortKey },
                        { label: 'Conv.', key: 'conversions' as SortKey },
                        { label: 'Actions', key: null },
                      ].map((col) => (
                        <div
                          key={col.label}
                          onClick={() => col.key && toggleSort(col.key)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            color: '#4a4540',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            cursor: col.key ? 'pointer' : 'default',
                          }}
                        >
                          {col.label}
                          {col.key &&
                            (sortKey === col.key ? (
                              sortDir === 'desc' ? (
                                <ChevronDown size={11} style={{ color: '#d4a054' }} />
                              ) : (
                                <ChevronUp size={11} style={{ color: '#d4a054' }} />
                              )
                            ) : (
                              <ChevronDown size={11} style={{ color: '#4a4540' }} />
                            ))}
                        </div>
                      ))}
                    </div>
                    {filteredLinks.map((link) => (
                      <div
                        key={link.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1fr 1fr 60px 60px 80px',
                          gap: '0.5rem',
                          alignItems: 'center',
                          padding: '0.75rem 1rem',
                          borderBottom: '1px solid hsla(0,0%,100%,0.04)',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: '0.8125rem',
                              fontWeight: 600,
                              color: '#e8e4de',
                              marginBottom: '0.125rem',
                            }}
                          >
                            {link.name}
                          </div>
                          <div
                            style={{
                              fontSize: '0.6875rem',
                              color: '#4a4540',
                              wordBreak: 'break-all',
                            }}
                          >
                            {link.fullUrl.substring(0, 60)}
                            {link.fullUrl.length > 60 ? '…' : ''}
                          </div>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#8b8579' }}>
                          {link.source} / {link.medium}
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: '#6b6560',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {link.destination.replace(/^https?:\/\//, '')}
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e8e4de' }}>
                          {link.clicks}
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#5a9c5a' }}>
                          {link.conversions}
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button
                            onClick={() => copyUrl(link.fullUrl)}
                            style={{
                              padding: '0.3rem',
                              background: 'none',
                              border: '1px solid hsla(0,0%,100%,0.06)',
                              borderRadius: '4px',
                              color: '#6b6560',
                              cursor: 'pointer',
                            }}
                            title="Copy URL"
                          >
                            {copied === link.fullUrl ? (
                              <Check size={12} style={{ color: '#5a9c5a' }} />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                          <a
                            href={link.fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '0.3rem',
                              background: 'none',
                              border: '1px solid hsla(0,0%,100%,0.06)',
                              borderRadius: '4px',
                              color: '#6b6560',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            title="Open link"
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </m.div>
    </DistributionOsLayout>
  );
}
