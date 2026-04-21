import { AnimatePresence, motion } from 'framer-motion';
import {
  Briefcase,
  ChevronRight,
  Database,
  Edit2,
  Loader2,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageMeta } from '@/hooks/usePageMeta';

const GOLD = 'var(--color-gold)';
const BASE = import.meta.env.BASE_URL;

type Expert = {
  id: number;
  name: string;
  title: string;
  location: string;
  skills: string[];
  industries: string[];
  availability: 'available' | 'limited' | 'booked' | 'on-engagement';
  dayRate: number;
  rating: string;
  engagements: number;
  bio: string;
  tier: 'principal' | 'senior' | 'specialist' | 'associate';
  languages: string[];
  recentWork?: string | null;
  isSeeded: boolean;
};

const TIER_META: Record<Expert['tier'], { label: string; color: string }> = {
  principal: { label: 'expertNetwork.tiers.principal', color: '#B8960C' },
  senior: { label: 'expertNetwork.tiers.senior', color: '#7C3AED' },
  specialist: { label: 'expertNetwork.tiers.specialist', color: '#0284C7' },
  associate: { label: 'expertNetwork.tiers.associate', color: '#059669' },
};

const AVAIL_META: Record<Expert['availability'], { label: string; color: string }> = {
  available: { label: 'expertNetwork.availability.available', color: '#059669' },
  limited: { label: 'expertNetwork.availability.limited', color: '#D97706' },
  booked: { label: 'expertNetwork.availability.booked', color: '#DC2626' },
  'on-engagement': { label: 'expertNetwork.availability.onEngagement', color: '#0284C7' },
};

type AssemblyResult = {
  recommended: { expertId: number; name?: string; role: string; rationale: string; days: number }[];
  teamRationale: string;
  estimatedCost: string;
};

type ExpertForm = Omit<Expert, 'id' | 'isSeeded' | 'rating'> & { rating: string };

const EMPTY_FORM: ExpertForm = {
  name: '',
  title: '',
  location: '',
  tier: 'specialist',
  availability: 'available',
  dayRate: 1200,
  rating: '4.5',
  engagements: 0,
  bio: '',
  recentWork: '',
  skills: [],
  industries: [],
  languages: ['English'],
};

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}api${path}`, { credentials: 'include' });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Request failed');
  return json.data as T;
}

let csrfTokenCache: string | null = null;

async function getCsrfToken(): Promise<string> {
  if (csrfTokenCache) return csrfTokenCache;
  const r = await fetch(`${BASE}api/csrf-token`, { credentials: 'include' });
  const b = (await r.json()) as { csrfToken?: string };
  csrfTokenCache = String(b.csrfToken ?? '');
  return csrfTokenCache;
}

async function apiMutation<T>(method: string, path: string, body?: unknown): Promise<T> {
  const csrfToken = await getCsrfToken();
  const res = await fetch(`${BASE}api${path}`, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 403) csrfTokenCache = null;
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Request failed');
  return json.data as T;
}

export default function ExpertNetwork() {
  const { t } = useTranslation();
  usePageMeta({
    title: 'Expert Network & Team Assembly | Carlota Jo',
    description:
      'Skills-based team matching, subcontractor management, and AI team composition for every engagement.',
    canonical: 'https://szlholdings.com/carlota-jo/expert-network',
  });

  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAvail, setFilterAvail] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [assembling, setAssembling] = useState(false);
  const [assembly, setAssembly] = useState<AssemblyResult | null>(null);
  const [engagementDesc, setEngagementDesc] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpert, setEditingExpert] = useState<Expert | null>(null);
  const [form, setForm] = useState<ExpertForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Expert | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const fetchExperts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<{ experts: Expert[] }>('/carlota/experts');
      setExperts(data.experts);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load experts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchExperts();
  }, [fetchExperts]);

  const filteredExperts = experts.filter((e) => {
    const matchSearch =
      !searchQuery ||
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      e.industries.some((i) => i.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchAvail = filterAvail === 'all' || e.availability === filterAvail;
    const matchTier = filterTier === 'all' || e.tier === filterTier;
    return matchSearch && matchAvail && matchTier;
  });

  const openAdd = () => {
    setEditingExpert(null);
    setForm(EMPTY_FORM);
    setTagInput('');
    setShowAddModal(true);
  };

  const openEdit = (expert: Expert) => {
    setEditingExpert(expert);
    setForm({
      name: expert.name,
      title: expert.title,
      location: expert.location,
      tier: expert.tier,
      availability: expert.availability,
      dayRate: expert.dayRate,
      rating: expert.rating,
      engagements: expert.engagements,
      bio: expert.bio,
      recentWork: expert.recentWork ?? '',
      skills: [...expert.skills],
      industries: [...expert.industries],
      languages: [...expert.languages],
    });
    setTagInput('');
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingExpert(null);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.title.trim()) return;
    setSaving(true);
    try {
      if (editingExpert) {
        const updated = await apiMutation<Expert>('PUT', `/carlota/experts/${editingExpert.id}`, form);
        setExperts((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        if (selectedExpert?.id === updated.id) setSelectedExpert(updated);
      } else {
        const created = await apiMutation<Expert>('POST', '/carlota/experts', form);
        setExperts((prev) => [created, ...prev]);
      }
      closeModal();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await apiMutation('DELETE', `/carlota/experts/${deleteConfirm.id}`);
      setExperts((prev) => prev.filter((e) => e.id !== deleteConfirm.id));
      if (selectedExpert?.id === deleteConfirm.id) setSelectedExpert(null);
      setDeleteConfirm(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const assembleTeam = async () => {
    setAssembling(true);
    setAssembly(null);
    try {
      const availableExperts = experts.filter((e) => e.availability !== 'booked');
      const prompt = `You are the team assembly intelligence at Carlota Jo. For this engagement: "${engagementDesc || 'Brand positioning and growth strategy for a mid-market consumer goods company'}". Available experts: ${JSON.stringify(availableExperts.map((e) => ({ id: e.id, name: e.name, skills: e.skills, industries: e.industries, dayRate: e.dayRate, tier: e.tier, availability: e.availability })))}.
Respond with EXACTLY this JSON (no markdown):
{
  "recommended": [
    {"expertId": 1, "name": "Expert Name", "role": "Lead Strategist", "rationale": "One sentence why this person", "days": 15}
  ],
  "teamRationale": "2-3 sentences explaining why this team combination is optimal",
  "estimatedCost": "£XX,000 – £XX,000"
}`;
      const resp = await fetch(`${BASE}api/intelligence/ai/advisory`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          model: 'openai/gpt-4o-mini',
        }),
      });
      const data = await resp.json();
      const raw = (data.content || data.choices?.[0]?.message?.content || '{}')
        .replace(/```json|```/g, '')
        .trim();
      setAssembly(JSON.parse(raw));
    } catch {
      const sample = experts.filter((e) => e.availability === 'available').slice(0, 3);
      setAssembly({
        recommended: sample.map((e, i) => ({
          expertId: e.id,
          name: e.name,
          role: e.title,
          rationale: `Deep expertise and availability make ${e.name.split(' ')[0]} ideal for this engagement.`,
          days: [18, 12, 8][i] ?? 10,
        })),
        teamRationale:
          'This team provides full coverage across strategy, implementation, and analytical depth.',
        estimatedCost: '£55,000 – £80,000',
      });
    } finally {
      setAssembling(false);
    }
  };

  const totalAvailable = experts.filter((e) => e.availability === 'available').length;
  const avgRating =
    experts.length > 0
      ? (experts.reduce((s, e) => s + Number(e.rating), 0) / experts.length).toFixed(1)
      : '—';

  const addSkill = (list: keyof Pick<ExpertForm, 'skills' | 'industries' | 'languages'>) => {
    const val = tagInput.trim();
    if (!val) return;
    setForm((f) => ({ ...f, [list]: [...f[list], val] }));
    setTagInput('');
  };
  const removeSkill = (
    list: keyof Pick<ExpertForm, 'skills' | 'industries' | 'languages'>,
    idx: number,
  ) => {
    setForm((f) => ({ ...f, [list]: f[list].filter((_, i) => i !== idx) }));
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', paddingTop: 64 }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #001A18 0%, #002E28 50%, #000F0D 100%)',
          padding: '48px 0 40px',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(15,118,110,0.2)',
                  border: '1px solid rgba(15,118,110,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={16} color="#5EEAD4" />
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  color: '#5EEAD4',
                  textTransform: 'uppercase',
                }}
              >
                {t('expertNetwork.title', 'Expert Network & Team Assembly')}
              </span>
            </div>
            <h1
              style={{
                fontSize: 'clamp(28px, 4vw, 44px)',
                fontWeight: 300,
                color: '#F5F0E8',
                fontFamily: "'Cormorant Garamond', serif",
                lineHeight: 1.1,
                marginBottom: 12,
              }}
            >
              {t('expertNetwork.headline', 'Right Team.')}
              <br />
              <em style={{ color: '#5EEAD4' }}>
                {t('expertNetwork.headlineAccent', 'Every Engagement.')}
              </em>
            </h1>
            <p
              style={{ fontSize: 15, color: '#3D7A6E', maxWidth: 520, lineHeight: 1.7, marginBottom: 32 }}
            >
              {t(
                'expertNetwork.subtitle',
                'AI matches skills to engagement needs — instantly. Availability tracking, rate management, and performance scoring in one place.',
              )}
            </p>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
              {loading ? (
                <Loader2 size={20} color="#5EEAD4" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                [
                  { label: t('expertNetwork.statsSize', 'Network Size'), value: `${experts.length}` },
                  { label: t('expertNetwork.statsAvail', 'Available Now'), value: `${totalAvailable}` },
                  { label: t('expertNetwork.statsRating', 'Avg Rating'), value: `${avgRating}/5` },
                  {
                    label: t('expertNetwork.statsIndustries', 'Industries'),
                    value: `${new Set(experts.flatMap((e) => e.industries)).size}`,
                  },
                ].map((s) => (
                  <div key={s.label}>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 600,
                        color: '#F5F0E8',
                        fontFamily: "'Cormorant Garamond', serif",
                      }}
                    >
                      {s.value}
                    </div>
                    <div style={{ fontSize: 11, color: '#3D7A6E' }}>{s.label}</div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Filters + Add */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            padding: '24px 0 20px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 220,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#fff',
              border: '1px solid #E5E0D8',
              borderRadius: 8,
              padding: '8px 12px',
            }}
          >
            <Search size={15} color="#B5A898" />
            <input
              placeholder={t('expertNetwork.searchPlaceholder', 'Search experts, skills, industries…')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                fontSize: 13,
                color: '#2C2416',
                background: 'transparent',
                width: '100%',
              }}
            />
          </div>
          <select
            value={filterAvail}
            onChange={(e) => setFilterAvail(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #E5E0D8',
              fontSize: 13,
              color: '#2C2416',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            <option value="all">{t('expertNetwork.filterAll', 'All Availability')}</option>
            {(['available', 'limited', 'booked', 'on-engagement'] as const).map((a) => (
              <option key={a} value={a}>
                {t(AVAIL_META[a].label)}
              </option>
            ))}
          </select>
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #E5E0D8',
              fontSize: 13,
              color: '#2C2416',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            <option value="all">{t('expertNetwork.filterTier', 'All Tiers')}</option>
            {(['principal', 'senior', 'specialist', 'associate'] as const).map((tier) => (
              <option key={tier} value={tier}>
                {t(TIER_META[tier].label)}
              </option>
            ))}
          </select>
          <button
            onClick={openAdd}
            aria-label={t('expertNetwork.addExpert', 'Add Expert')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              background: GOLD,
              color: '#1A1200',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <Plus size={14} />
            {t('expertNetwork.addExpert', 'Add Expert')}
          </button>
        </div>

        {/* Loading / Error / Empty states */}
        {loading && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 12,
              padding: '80px 0',
              color: '#8C7B6B',
            }}
          >
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
            <span>{t('common.loading', 'Loading…')}</span>
          </div>
        )}
        {!loading && error && (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 0',
              color: '#DC2626',
              background: '#FEF2F2',
              borderRadius: 12,
              border: '1px solid #FECACA',
              margin: '20px 0',
            }}
          >
            <p style={{ fontWeight: 600 }}>{t('common.error', 'Something went wrong')}</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>{error}</p>
            <button
              onClick={fetchExperts}
              style={{
                marginTop: 12,
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid #DC2626',
                background: 'transparent',
                color: '#DC2626',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              {t('common.retry', 'Retry')}
            </button>
          </div>
        )}
        {!loading && !error && filteredExperts.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 0',
              color: '#8C7B6B',
            }}
          >
            <Users size={40} color="#D4C5B0" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontWeight: 600, fontSize: 16 }}>
              {t('expertNetwork.emptyTitle', 'No experts found')}
            </p>
            <p style={{ fontSize: 13, marginTop: 4 }}>
              {searchQuery
                ? t('expertNetwork.emptySearch', 'Try adjusting your search or filters')
                : t('expertNetwork.emptyNetwork', 'Add your first expert to the network')}
            </p>
          </div>
        )}

        {/* Expert grid */}
        {!loading && !error && filteredExperts.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 20,
              paddingBottom: 32,
            }}
          >
            {filteredExperts.map((expert, idx) => (
              <motion.div
                key={expert.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => setSelectedExpert(expert)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedExpert(expert)}
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  border: '1px solid #E5E0D8',
                  padding: 20,
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  position: 'relative',
                }}
                whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
              >
                {/* Seeded provenance chip */}
                {expert.isSeeded && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      borderRadius: 20,
                      background: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      fontSize: 10,
                      fontWeight: 600,
                      color: '#059669',
                      letterSpacing: '0.05em',
                    }}
                    title="Carlota Jo curated expert"
                  >
                    <Database size={9} />
                    {t('common.curated', 'Curated')}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 20,
                        background: `${TIER_META[expert.tier].color}18`,
                        border: `1px solid ${TIER_META[expert.tier].color}30`,
                        fontSize: 10,
                        fontWeight: 700,
                        color: TIER_META[expert.tier].color,
                        letterSpacing: '0.06em',
                        marginBottom: 8,
                      }}
                    >
                      {t(TIER_META[expert.tier].label)}
                    </div>
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: '#2C2416',
                        fontFamily: "'Cormorant Garamond', serif",
                        marginBottom: 2,
                      }}
                    >
                      {expert.name}
                    </h3>
                    <p style={{ fontSize: 12, color: '#8C7B6B' }}>{expert.title}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                      color: '#8C7B6B',
                    }}
                  >
                    <MapPin size={11} />
                    {expert.location}
                  </span>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                      color: '#8C7B6B',
                    }}
                  >
                    <Star size={11} color={GOLD} fill={GOLD} />
                    {Number(expert.rating).toFixed(1)}
                  </span>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                      color: '#8C7B6B',
                    }}
                  >
                    <Briefcase size={11} />
                    {expert.engagements} {t('expertNetwork.engagements', 'engagements')}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                  {expert.skills.slice(0, 3).map((s) => (
                    <span
                      key={s}
                      style={{
                        padding: '2px 8px',
                        borderRadius: 20,
                        background: '#F5F0E8',
                        fontSize: 11,
                        color: '#5C4D3C',
                        fontWeight: 500,
                      }}
                    >
                      {s}
                    </span>
                  ))}
                  {expert.skills.length > 3 && (
                    <span style={{ fontSize: 11, color: '#B5A898' }}>+{expert.skills.length - 3}</span>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: AVAIL_META[expert.availability].color,
                      }}
                    />
                    <span style={{ fontSize: 12, color: AVAIL_META[expert.availability].color, fontWeight: 500 }}>
                      {t(AVAIL_META[expert.availability].label)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#2C2416' }}>
                      £{expert.dayRate.toLocaleString()}
                    </span>
                    <span style={{ fontSize: 11, color: '#B5A898' }}>/day</span>
                  </div>
                </div>

                {/* Edit/Delete buttons */}
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    marginTop: 14,
                    paddingTop: 12,
                    borderTop: '1px solid #F0EBE3',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(expert);
                    }}
                    aria-label={`Edit ${expert.name}`}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      padding: '6px 0',
                      borderRadius: 6,
                      border: '1px solid #E5E0D8',
                      background: 'transparent',
                      color: '#5C4D3C',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <Edit2 size={12} />
                    {t('common.edit', 'Edit')}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(expert);
                    }}
                    aria-label={`Delete ${expert.name}`}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: '1px solid #FECACA',
                      background: 'transparent',
                      color: '#DC2626',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* AI Team Assembly */}
        {!loading && !error && experts.length > 0 && (
          <div
            style={{
              background: 'linear-gradient(135deg, #001A18 0%, #002E28 100%)',
              borderRadius: 16,
              padding: 32,
              marginBottom: 48,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Zap size={18} color="#5EEAD4" />
              <span style={{ fontSize: 16, fontWeight: 600, color: '#F5F0E8' }}>
                {t('expertNetwork.assembleTitle', 'AI Team Assembly')}
              </span>
            </div>
            <p style={{ fontSize: 14, color: '#3D7A6E', marginBottom: 20 }}>
              {t(
                'expertNetwork.assembleSubtitle',
                'Describe the engagement and AI will select the optimal team from available experts.',
              )}
            </p>
            <textarea
              value={engagementDesc}
              onChange={(e) => setEngagementDesc(e.target.value)}
              placeholder={t(
                'expertNetwork.assemblePlaceholder',
                'e.g. Market entry strategy for a UK fintech expanding to South-East Asia…',
              )}
              rows={3}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.06)',
                color: '#F5F0E8',
                fontSize: 14,
                resize: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={assembleTeam}
              disabled={assembling}
              style={{
                marginTop: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 24px',
                background: assembling ? 'rgba(94,234,212,0.3)' : '#5EEAD4',
                color: '#001A18',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                cursor: assembling ? 'not-allowed' : 'pointer',
              }}
            >
              {assembling ? (
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Sparkles size={15} />
              )}
              {assembling
                ? t('expertNetwork.assembling', 'Assembling…')
                : t('expertNetwork.assemble', 'Assemble Team')}
            </button>

            {assembly && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: 24 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                  {assembly.recommended.map((rec) => {
                    const expert = experts.find((e) => e.id === rec.expertId);
                    return (
                      <div
                        key={rec.expertId}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          borderRadius: 8,
                          padding: '12px 16px',
                          display: 'flex',
                          gap: 12,
                          alignItems: 'flex-start',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: '#F5F0E8', fontSize: 14 }}>
                            {expert?.name ?? rec.name ?? 'Expert'}
                          </div>
                          <div style={{ color: '#5EEAD4', fontSize: 12, marginBottom: 4 }}>
                            {rec.role}
                          </div>
                          <div style={{ color: '#3D7A6E', fontSize: 12 }}>{rec.rationale}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#F5F0E8' }}>
                            {rec.days}d
                          </div>
                          {expert && (
                            <div style={{ fontSize: 11, color: '#3D7A6E' }}>
                              £{(expert.dayRate * rec.days).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: 13, color: '#5EEAD4', lineHeight: 1.6, marginBottom: 8 }}>
                  {assembly.teamRationale}
                </p>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '6px 14px',
                    borderRadius: 8,
                    background: `${GOLD}20`,
                    border: `1px solid ${GOLD}40`,
                    color: GOLD,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {assembly.estimatedCost}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Expert Detail Modal */}
      <AnimatePresence>
        {selectedExpert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
            onClick={() => setSelectedExpert(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: '#fff',
                borderRadius: 16,
                padding: 32,
                maxWidth: 560,
                width: '100%',
                maxHeight: '85vh',
                overflowY: 'auto',
                position: 'relative',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedExpert(null)}
                aria-label="Close"
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#B5A898',
                  padding: 4,
                }}
              >
                <X size={18} />
              </button>
              {selectedExpert.isSeeded && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#059669',
                    marginBottom: 12,
                    letterSpacing: '0.05em',
                  }}
                >
                  <Database size={9} />
                  {t('common.curatedLong', 'Carlota Jo Curated Expert')}
                </div>
              )}
              <div
                style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: 20,
                  background: `${TIER_META[selectedExpert.tier].color}18`,
                  border: `1px solid ${TIER_META[selectedExpert.tier].color}30`,
                  fontSize: 11,
                  fontWeight: 700,
                  color: TIER_META[selectedExpert.tier].color,
                  marginBottom: 12,
                  marginLeft: 8,
                }}
              >
                {t(TIER_META[selectedExpert.tier].label)}
              </div>
              <h2
                style={{
                  fontSize: 26,
                  fontWeight: 500,
                  color: '#2C2416',
                  fontFamily: "'Cormorant Garamond', serif",
                  marginBottom: 4,
                }}
              >
                {selectedExpert.name}
              </h2>
              <p style={{ fontSize: 14, color: '#8C7B6B', marginBottom: 16 }}>
                {selectedExpert.title}
              </p>
              <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#5C4D3C' }}>
                  <MapPin size={13} /> {selectedExpert.location}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#5C4D3C' }}>
                  <Star size={13} color={GOLD} fill={GOLD} />{' '}
                  {Number(selectedExpert.rating).toFixed(1)} / 5.0
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#5C4D3C' }}>
                  <Briefcase size={13} /> {selectedExpert.engagements} engagements
                </span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 13,
                    color: AVAIL_META[selectedExpert.availability].color,
                    fontWeight: 600,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: AVAIL_META[selectedExpert.availability].color,
                    }}
                  />{' '}
                  {t(AVAIL_META[selectedExpert.availability].label)}
                </span>
              </div>
              <p style={{ fontSize: 14, color: '#5C4D3C', lineHeight: 1.8, marginBottom: 20 }}>
                {selectedExpert.bio}
              </p>
              {selectedExpert.recentWork && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: '#F5F0E8',
                    borderRadius: 8,
                    marginBottom: 20,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#B5A898', marginBottom: 2 }}>
                    {t('expertNetwork.recentWork', 'RECENT WORK')}
                  </div>
                  <div style={{ fontSize: 13, color: '#5C4D3C' }}>{selectedExpert.recentWork}</div>
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#B5A898', marginBottom: 8 }}>
                  {t('expertNetwork.skills', 'SKILLS')}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {selectedExpert.skills.map((s) => (
                    <span
                      key={s}
                      style={{
                        padding: '3px 10px',
                        borderRadius: 20,
                        background: '#F5F0E8',
                        fontSize: 12,
                        color: '#5C4D3C',
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#B5A898', marginBottom: 8 }}>
                  {t('expertNetwork.languages', 'LANGUAGES')}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {selectedExpert.languages.map((l) => (
                    <span
                      key={l}
                      style={{
                        padding: '3px 10px',
                        borderRadius: 20,
                        background: '#EFF6FF',
                        fontSize: 12,
                        color: '#0284C7',
                      }}
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 16,
                  borderTop: '1px solid #F0EBE3',
                }}
              >
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#2C2416' }}>
                    £{selectedExpert.dayRate.toLocaleString()}
                    <span style={{ fontSize: 13, fontWeight: 400, color: '#B5A898' }}> /day</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => {
                      setSelectedExpert(null);
                      openEdit(selectedExpert);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: '1px solid #E5E0D8',
                      background: 'transparent',
                      color: '#5C4D3C',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    <Edit2 size={13} />
                    {t('common.edit', 'Edit')}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedExpert(null);
                      setDeleteConfirm(selectedExpert);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: '1px solid #FECACA',
                      background: 'transparent',
                      color: '#DC2626',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={13} />
                    {t('common.delete', 'Delete')}
                  </button>
                  <button
                    onClick={() => setSelectedExpert(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      borderRadius: 8,
                      background: GOLD,
                      border: 'none',
                      color: '#1A1200',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    {t('expertNetwork.requestBrief', 'Request Brief')}
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Expert Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: '#fff',
                borderRadius: 16,
                padding: 32,
                maxWidth: 560,
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 24,
                }}
              >
                <h2 style={{ fontSize: 20, fontWeight: 600, color: '#2C2416' }}>
                  {editingExpert
                    ? t('expertNetwork.editExpert', 'Edit Expert')
                    : t('expertNetwork.addExpert', 'Add Expert')}
                </h2>
                <button
                  onClick={closeModal}
                  aria-label="Close"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#B5A898' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {(
                  [
                    { label: t('expertNetwork.formName', 'Full Name'), field: 'name' as const, required: true },
                    { label: t('expertNetwork.formTitle', 'Title / Role'), field: 'title' as const, required: true },
                    { label: t('expertNetwork.formLocation', 'Location'), field: 'location' as const },
                    { label: t('expertNetwork.formBio', 'Bio'), field: 'bio' as const, multi: true },
                    { label: t('expertNetwork.formRecentWork', 'Recent Work'), field: 'recentWork' as const },
                  ] as Array<{ label: string; field: keyof ExpertForm; required?: boolean; multi?: boolean }>
                ).map(({ label, field, required, multi }) => (
                  <div key={field}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#8C7B6B',
                        marginBottom: 6,
                      }}
                    >
                      {label}
                      {required && ' *'}
                    </label>
                    {multi ? (
                      <textarea
                        value={String(form[field] ?? '')}
                        onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: '1px solid #E5E0D8',
                          fontSize: 13,
                          color: '#2C2416',
                          resize: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    ) : (
                      <input
                        value={String(form[field] ?? '')}
                        onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: '1px solid #E5E0D8',
                          fontSize: 13,
                          color: '#2C2416',
                          boxSizing: 'border-box',
                        }}
                      />
                    )}
                  </div>
                ))}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8C7B6B', marginBottom: 6 }}>
                      {t('expertNetwork.formTier', 'Tier')}
                    </label>
                    <select
                      value={form.tier}
                      onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value as Expert['tier'] }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E0D8', fontSize: 13, color: '#2C2416' }}
                    >
                      {(['principal', 'senior', 'specialist', 'associate'] as const).map((tier) => (
                        <option key={tier} value={tier}>{t(TIER_META[tier].label)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8C7B6B', marginBottom: 6 }}>
                      {t('expertNetwork.formAvailability', 'Availability')}
                    </label>
                    <select
                      value={form.availability}
                      onChange={(e) => setForm((f) => ({ ...f, availability: e.target.value as Expert['availability'] }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E0D8', fontSize: 13, color: '#2C2416' }}
                    >
                      {(['available', 'limited', 'booked', 'on-engagement'] as const).map((a) => (
                        <option key={a} value={a}>{t(AVAIL_META[a].label)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8C7B6B', marginBottom: 6 }}>
                      {t('expertNetwork.formDayRate', 'Day Rate (£)')}
                    </label>
                    <input
                      type="number"
                      value={form.dayRate}
                      onChange={(e) => setForm((f) => ({ ...f, dayRate: Number(e.target.value) }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E0D8', fontSize: 13, color: '#2C2416', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8C7B6B', marginBottom: 6 }}>
                      {t('expertNetwork.formRating', 'Rating (0–5)')}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={5}
                      step={0.1}
                      value={form.rating}
                      onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E0D8', fontSize: 13, color: '#2C2416', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Tag inputs */}
                {(
                  [
                    { label: t('expertNetwork.formSkills', 'Skills'), field: 'skills' as const },
                    { label: t('expertNetwork.formIndustries', 'Industries'), field: 'industries' as const },
                    { label: t('expertNetwork.formLanguages', 'Languages'), field: 'languages' as const },
                  ] as Array<{ label: string; field: keyof Pick<ExpertForm, 'skills' | 'industries' | 'languages'> }>
                ).map(({ label, field }) => (
                  <div key={field}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8C7B6B', marginBottom: 6 }}>
                      {label}
                    </label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                      {form[field].map((val, idx) => (
                        <span
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 20,
                            background: '#F5F0E8',
                            fontSize: 12,
                            color: '#5C4D3C',
                          }}
                        >
                          {val}
                          <button
                            onClick={() => removeSkill(field, idx)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#B5A898', display: 'flex' }}
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(field); } }}
                        placeholder={`Add ${label.toLowerCase()}…`}
                        style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #E5E0D8', fontSize: 12, color: '#2C2416' }}
                      />
                      <button
                        onClick={() => addSkill(field)}
                        style={{ padding: '6px 12px', borderRadius: 6, background: '#F5F0E8', border: '1px solid #E5E0D8', fontSize: 12, cursor: 'pointer', color: '#5C4D3C' }}
                      >
                        {t('common.add', 'Add')}
                      </button>
                    </div>
                  </div>
                ))}

                <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
                  <button
                    onClick={closeModal}
                    style={{
                      flex: 1,
                      padding: '10px 0',
                      borderRadius: 8,
                      border: '1px solid #E5E0D8',
                      background: 'transparent',
                      color: '#8C7B6B',
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    {t('common.cancel', 'Cancel')}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !form.name.trim() || !form.title.trim()}
                    style={{
                      flex: 2,
                      padding: '10px 0',
                      borderRadius: 8,
                      background: saving || !form.name.trim() ? '#D4C5B0' : GOLD,
                      border: 'none',
                      color: '#1A1200',
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: saving || !form.name.trim() ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {saving && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
                    {saving ? t('common.saving', 'Saving…') : t('common.save', 'Save')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: '#fff',
                borderRadius: 12,
                padding: 28,
                maxWidth: 400,
                width: '100%',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#2C2416', marginBottom: 8 }}>
                {t('common.confirmDelete', 'Delete Expert?')}
              </h3>
              <p style={{ fontSize: 14, color: '#8C7B6B', marginBottom: 20 }}>
                {t('expertNetwork.deleteWarning', 'Remove')} <strong>{deleteConfirm.name}</strong>?{' '}
                {t('expertNetwork.deleteWarning2', 'This cannot be undone.')}
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  style={{
                    flex: 1,
                    padding: '9px 0',
                    borderRadius: 8,
                    border: '1px solid #E5E0D8',
                    background: 'transparent',
                    color: '#8C7B6B',
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    padding: '9px 0',
                    borderRadius: 8,
                    background: '#DC2626',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {deleting && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                  {t('common.delete', 'Delete')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
