import { AnimatePresence, motion } from 'framer-motion';
import {
  Archive,
  BookOpen,
  Database,
  Edit2,
  FileText,
  Filter,
  Lightbulb,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Star,
  Tag,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageMeta } from '@/hooks/usePageMeta';
import { apiJson } from '@/lib/api';

const GOLD = 'var(--color-gold)';

type KnowledgeType = 'framework' | 'playbook' | 'template' | 'case-study' | 'research';

type KnowledgeItem = {
  id: number;
  type: KnowledgeType;
  title: string;
  description: string;
  tags: string[];
  industries: string[];
  engagements: string[];
  uses: number;
  rating: string;
  lastUpdated: string;
  author: string;
  isSeeded: boolean;
};

const TYPE_META: Record<KnowledgeType, { label: string; color: string; icon: typeof BookOpen }> = {
  framework: { label: 'knowledgeVault.types.framework', color: '#7C3AED', icon: Target },
  playbook: { label: 'knowledgeVault.types.playbook', color: '#0284C7', icon: BookOpen },
  template: { label: 'knowledgeVault.types.template', color: '#059669', icon: FileText },
  'case-study': { label: 'knowledgeVault.types.caseStudy', color: '#D97706', icon: Archive },
  research: { label: 'knowledgeVault.types.research', color: '#DC2626', icon: Lightbulb },
};

type KnowledgeForm = Omit<KnowledgeItem, 'id' | 'isSeeded'>;

const EMPTY_FORM: KnowledgeForm = {
  type: 'framework',
  title: '',
  description: '',
  tags: [],
  industries: [],
  engagements: [],
  uses: 0,
  rating: '4.5',
  lastUpdated: new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
  author: 'Carlota Jo',
};

type AiSearchResult = {
  items: KnowledgeItem[];
  reasoning: string;
};


export default function KnowledgeVault() {
  const { t } = useTranslation();
  usePageMeta({
    title: 'Knowledge Vault | Carlota Jo',
    description:
      'Searchable repository of frameworks, playbooks, templates, and case studies. Governed engagement matching — find relevant precedents.',
    canonical: 'https://szlholdings.com/carlota-jo/knowledge-vault',
  });

  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [aiSearching, setAiSearching] = useState(false);
  const [aiResult, setAiResult] = useState<AiSearchResult | null>(null);
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [form, setForm] = useState<KnowledgeForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<KnowledgeItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiJson<{ items: KnowledgeItem[] }>('/carlota/knowledge');
      setItems(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load knowledge items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const filteredItems = (aiResult ? aiResult.items : items).filter((item) => {
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const runAISearch = async () => {
    if (!searchQuery || items.length === 0) return;
    setAiSearching(true);
    try {
      const prompt = `You are a knowledge management AI for Carlota Jo consulting. The user searched for: "${searchQuery}". Available knowledge items: ${items.map((k) => `"${k.title}" (${k.type}) - ${k.tags.join(', ')}`).join('; ')}. Identify the 1-3 most relevant items by exact title and explain in 2 sentences why each is relevant.`;
      const resp = await fetch('/api/intelligence/ai/advisory', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          model: 'openai/gpt-4o-mini',
        }),
      });
      const data = await resp.json();
      const text = data.content || data.choices?.[0]?.message?.content || '';
      const lower = text.toLowerCase();
      const matched = items.filter((k) => lower.includes(k.title.toLowerCase()));
      setAiResult({
        items: matched.length > 0 ? matched : items.slice(0, 3),
        reasoning: text,
      });
    } catch {
      const fallback = items.filter(
        (k) =>
          k.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
          k.title.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setAiResult({
        items: fallback.length > 0 ? fallback.slice(0, 3) : items.slice(0, 3),
        reasoning: `Based on your search for "${searchQuery}", here are the most relevant items from the knowledge base.`,
      });
    } finally {
      setAiSearching(false);
    }
  };

  const openAdd = () => {
    setEditingItem(null);
    setForm({ ...EMPTY_FORM, lastUpdated: new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) });
    setTagInput('');
    setShowAddModal(true);
  };

  const openEdit = (item: KnowledgeItem) => {
    setEditingItem(item);
    setForm({
      type: item.type,
      title: item.title,
      description: item.description,
      tags: [...item.tags],
      industries: [...item.industries],
      engagements: [...item.engagements],
      uses: item.uses,
      rating: item.rating,
      lastUpdated: item.lastUpdated,
      author: item.author,
    });
    setTagInput('');
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingItem(null);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editingItem) {
        const updated = await apiJson<KnowledgeItem>(`/carlota/knowledge/${editingItem.id}`, { method: 'PUT', body: JSON.stringify(form) });
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        if (selectedItem?.id === updated.id) setSelectedItem(updated);
        if (aiResult) {
          setAiResult((ar) =>
            ar ? { ...ar, items: ar.items.map((i) => (i.id === updated.id ? updated : i)) } : null,
          );
        }
      } else {
        const created = await apiJson<KnowledgeItem>('/carlota/knowledge', { method: 'POST', body: JSON.stringify(form) });
        setItems((prev) => [created, ...prev]);
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
      await apiJson(`/carlota/knowledge/${deleteConfirm.id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((i) => i.id !== deleteConfirm.id));
      if (selectedItem?.id === deleteConfirm.id) setSelectedItem(null);
      if (aiResult) {
        setAiResult((ar) =>
          ar ? { ...ar, items: ar.items.filter((i) => i.id !== deleteConfirm.id) } : null,
        );
      }
      setDeleteConfirm(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const addTag = (list: keyof Pick<KnowledgeForm, 'tags' | 'industries' | 'engagements'>) => {
    const val = tagInput.trim();
    if (!val) return;
    setForm((f) => ({ ...f, [list]: [...f[list], val] }));
    setTagInput('');
  };
  const removeTag = (
    list: keyof Pick<KnowledgeForm, 'tags' | 'industries' | 'engagements'>,
    idx: number,
  ) => {
    setForm((f) => ({ ...f, [list]: f[list].filter((_, i) => i !== idx) }));
  };

  const totalUses = items.reduce((s, k) => s + k.uses, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', paddingTop: 64 }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1A0A2E 0%, #2D1454 50%, #0F0620 100%)',
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
                  background: 'rgba(124,58,237,0.2)',
                  border: '1px solid rgba(124,58,237,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BookOpen size={16} color="#A78BFA" />
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  color: '#A78BFA',
                  textTransform: 'uppercase',
                }}
              >
                {t('knowledgeVault.title', 'Knowledge Vault')}
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
              {t('knowledgeVault.headline', 'Institutional')}
              <br />
              <em style={{ color: '#A78BFA' }}>
                {t('knowledgeVault.headlineAccent', 'Intelligence.')}
              </em>
            </h1>
            <p
              style={{ fontSize: 15, color: '#6B4FA0', maxWidth: 520, lineHeight: 1.7, marginBottom: 32 }}
            >
              {t(
                'knowledgeVault.subtitle',
                'Searchable repository of frameworks, playbooks, templates, and case studies — governed, versioned, and matched to every engagement.',
              )}
            </p>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
              {loading ? (
                <Loader2 size={20} color="#A78BFA" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                [
                  { label: t('knowledgeVault.statsItems', 'Total Items'), value: `${items.length}` },
                  { label: t('knowledgeVault.statsUses', 'Total Uses'), value: `${totalUses}` },
                  {
                    label: t('knowledgeVault.statsTypes', 'Content Types'),
                    value: `${new Set(items.map((i) => i.type)).size}`,
                  },
                  {
                    label: t('knowledgeVault.statsIndustries', 'Industries'),
                    value: `${new Set(items.flatMap((i) => i.industries)).size}`,
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
                    <div style={{ fontSize: 11, color: '#6B4FA0' }}>{s.label}</div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Search + Filters */}
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
              minWidth: 240,
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
              placeholder={t('knowledgeVault.searchPlaceholder', 'Search frameworks, playbooks, case studies…')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setAiResult(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && void runAISearch()}
              style={{
                border: 'none',
                outline: 'none',
                fontSize: 13,
                color: '#2C2416',
                background: 'transparent',
                width: '100%',
              }}
            />
            {searchQuery && (
              <button
                onClick={runAISearch}
                disabled={aiSearching}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: '#7C3AED',
                  border: 'none',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: aiSearching ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                }}
              >
                {aiSearching ? (
                  <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Sparkles size={11} />
                )}
                {t('knowledgeVault.aiSearch', 'AI Search')}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={14} color="#8C7B6B" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
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
              <option value="all">{t('knowledgeVault.filterAll', 'All Types')}</option>
              {(Object.entries(TYPE_META) as [KnowledgeType, (typeof TYPE_META)[KnowledgeType]][]).map(
                ([type, meta]) => (
                  <option key={type} value={type}>
                    {t(meta.label)}
                  </option>
                ),
              )}
            </select>
          </div>

          <button
            onClick={openAdd}
            aria-label={t('knowledgeVault.addItem', 'Add Knowledge Item')}
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
            {t('knowledgeVault.addItem', 'Add Item')}
          </button>
        </div>

        {/* AI Search Result Banner */}
        {aiResult && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '12px 16px',
              background: '#F5F3FF',
              border: '1px solid #DDD6FE',
              borderRadius: 8,
              marginBottom: 16,
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <Sparkles size={15} color="#7C3AED" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED', marginBottom: 4 }}>
                {t('knowledgeVault.aiResultLabel', 'AI Match')}
              </div>
              <p style={{ fontSize: 13, color: '#5C4D3C', lineHeight: 1.6 }}>
                {aiResult.reasoning.slice(0, 280)}{aiResult.reasoning.length > 280 ? '…' : ''}
              </p>
            </div>
            <button
              onClick={() => setAiResult(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B5A898', flexShrink: 0 }}
            >
              <X size={14} />
            </button>
          </motion.div>
        )}

        {/* States */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '80px 0', color: '#8C7B6B' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
            <span>{t('common.loading', 'Loading…')}</span>
          </div>
        )}
        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#DC2626', background: '#FEF2F2', borderRadius: 12, border: '1px solid #FECACA', margin: '20px 0' }}>
            <p style={{ fontWeight: 600 }}>{t('common.error', 'Something went wrong')}</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>{error}</p>
            <button onClick={fetchItems} style={{ marginTop: 12, padding: '8px 16px', borderRadius: 8, border: '1px solid #DC2626', background: 'transparent', color: '#DC2626', cursor: 'pointer', fontSize: 13 }}>
              {t('common.retry', 'Retry')}
            </button>
          </div>
        )}
        {!loading && !error && filteredItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#8C7B6B' }}>
            <BookOpen size={40} color="#D4C5B0" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontWeight: 600, fontSize: 16 }}>{t('knowledgeVault.emptyTitle', 'No items found')}</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>
              {searchQuery ? t('knowledgeVault.emptySearch', 'Try adjusting your search or filters') : t('knowledgeVault.emptyVault', 'Add your first knowledge item')}
            </p>
          </div>
        )}

        {/* Knowledge Item Grid */}
        {!loading && !error && filteredItems.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 20,
              paddingBottom: 40,
            }}
          >
            {filteredItems.map((item, idx) => {
              const meta = TYPE_META[item.type];
              const Icon = meta.icon;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => setSelectedItem(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedItem(item)}
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    border: '1px solid #E5E0D8',
                    padding: 20,
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                  whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
                >
                  {/* Provenance chip */}
                  {item.isSeeded && (
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
                      title="Carlota Jo curated knowledge"
                    >
                      <Database size={9} />
                      {t('common.curated', 'Curated')}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: `${meta.color}15`,
                        border: `1px solid ${meta.color}30`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} color={meta.color} />
                    </div>
                    <div>
                      <div
                        style={{
                          display: 'inline-block',
                          padding: '1px 7px',
                          borderRadius: 20,
                          background: `${meta.color}15`,
                          fontSize: 10,
                          fontWeight: 700,
                          color: meta.color,
                          marginBottom: 4,
                        }}
                      >
                        {t(meta.label)}
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: '#2C2416', lineHeight: 1.4 }}>
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  <p
                    style={{ fontSize: 13, color: '#5C4D3C', lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {item.description}
                  </p>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {item.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          padding: '2px 8px',
                          borderRadius: 20,
                          background: '#F5F0E8',
                          fontSize: 11,
                          color: '#5C4D3C',
                        }}
                      >
                        <Tag size={9} />
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 3 && (
                      <span style={{ fontSize: 11, color: '#B5A898' }}>+{item.tags.length - 3}</span>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 12,
                      color: '#8C7B6B',
                      marginBottom: 12,
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={11} color={GOLD} fill={GOLD} />
                      {Number(item.rating).toFixed(1)}
                    </span>
                    <span>{item.uses} {t('knowledgeVault.uses', 'uses')}</span>
                    <span>{item.lastUpdated}</span>
                  </div>

                  {/* Edit/Delete buttons */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 6,
                      paddingTop: 10,
                      borderTop: '1px solid #F0EBE3',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(item);
                      }}
                      aria-label={`Edit ${item.title}`}
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
                        setDeleteConfirm(item);
                      }}
                      aria-label={`Delete ${item.title}`}
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
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
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
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
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
                onClick={() => setSelectedItem(null)}
                aria-label="Close"
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#B5A898',
                }}
              >
                <X size={18} />
              </button>
              {selectedItem.isSeeded && (
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
                  {t('common.curatedLong', 'Carlota Jo Curated')}
                </div>
              )}
              <div
                style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: 20,
                  background: `${TYPE_META[selectedItem.type].color}15`,
                  border: `1px solid ${TYPE_META[selectedItem.type].color}30`,
                  fontSize: 11,
                  fontWeight: 700,
                  color: TYPE_META[selectedItem.type].color,
                  marginBottom: 12,
                  marginLeft: selectedItem.isSeeded ? 8 : 0,
                }}
              >
                {t(TYPE_META[selectedItem.type].label)}
              </div>
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 500,
                  color: '#2C2416',
                  fontFamily: "'Cormorant Garamond', serif",
                  marginBottom: 8,
                  lineHeight: 1.3,
                }}
              >
                {selectedItem.title}
              </h2>
              <p style={{ fontSize: 13, color: '#8C7B6B', marginBottom: 16 }}>
                {t('knowledgeVault.by', 'By')} {selectedItem.author} · {selectedItem.lastUpdated}
              </p>
              <p style={{ fontSize: 14, color: '#5C4D3C', lineHeight: 1.8, marginBottom: 20 }}>
                {selectedItem.description}
              </p>
              <div style={{ display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#B5A898', marginBottom: 4 }}>{t('knowledgeVault.uses', 'USES')}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#2C2416', fontFamily: "'Cormorant Garamond', serif" }}>{selectedItem.uses}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#B5A898', marginBottom: 4 }}>{t('knowledgeVault.rating', 'RATING')}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#2C2416', fontFamily: "'Cormorant Garamond', serif" }}>{Number(selectedItem.rating).toFixed(1)} / 5</div>
                </div>
              </div>
              {selectedItem.tags.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#B5A898', marginBottom: 8 }}>{t('knowledgeVault.tags', 'TAGS')}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {selectedItem.tags.map((tag) => (
                      <span key={tag} style={{ padding: '3px 10px', borderRadius: 20, background: '#F5F0E8', fontSize: 12, color: '#5C4D3C' }}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}
              {selectedItem.industries.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#B5A898', marginBottom: 8 }}>{t('knowledgeVault.industries', 'INDUSTRIES')}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {selectedItem.industries.map((ind) => (
                      <span key={ind} style={{ padding: '3px 10px', borderRadius: 20, background: '#EFF6FF', fontSize: 12, color: '#0284C7' }}>{ind}</span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, paddingTop: 16, borderTop: '1px solid #F0EBE3' }}>
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    openEdit(selectedItem);
                  }}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', borderRadius: 8, border: '1px solid #E5E0D8', background: 'transparent', color: '#5C4D3C', fontSize: 13, cursor: 'pointer' }}
                >
                  <Edit2 size={13} />
                  {t('common.edit', 'Edit')}
                </button>
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    setDeleteConfirm(selectedItem);
                  }}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', borderRadius: 8, border: '1px solid #FECACA', background: 'transparent', color: '#DC2626', fontSize: 13, cursor: 'pointer' }}
                >
                  <Trash2 size={13} />
                  {t('common.delete', 'Delete')}
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
                  style={{ flex: 1, padding: '9px 0', borderRadius: 8, background: '#7C3AED', border: 'none', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                >
                  {t('knowledgeVault.useItem', 'Use in Engagement')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
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
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: '#2C2416' }}>
                  {editingItem ? t('knowledgeVault.editItem', 'Edit Knowledge Item') : t('knowledgeVault.addItem', 'Add Knowledge Item')}
                </h2>
                <button onClick={closeModal} aria-label="Close" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#B5A898' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8C7B6B', marginBottom: 6 }}>
                    {t('knowledgeVault.formType', 'Type')}
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as KnowledgeType }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E0D8', fontSize: 13, color: '#2C2416' }}
                  >
                    {(Object.entries(TYPE_META) as [KnowledgeType, (typeof TYPE_META)[KnowledgeType]][]).map(([typKey, m]) => (
                      <option key={typKey} value={typKey}>{t(m.label)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8C7B6B', marginBottom: 6 }}>
                    {t('knowledgeVault.formTitle', 'Title')} *
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E0D8', fontSize: 13, color: '#2C2416', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8C7B6B', marginBottom: 6 }}>
                    {t('knowledgeVault.formDescription', 'Description')}
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={4}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E0D8', fontSize: 13, color: '#2C2416', resize: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8C7B6B', marginBottom: 6 }}>
                      {t('knowledgeVault.formAuthor', 'Author')}
                    </label>
                    <input
                      value={form.author}
                      onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E0D8', fontSize: 13, color: '#2C2416', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8C7B6B', marginBottom: 6 }}>
                      {t('knowledgeVault.formLastUpdated', 'Last Updated')}
                    </label>
                    <input
                      value={form.lastUpdated}
                      onChange={(e) => setForm((f) => ({ ...f, lastUpdated: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E0D8', fontSize: 13, color: '#2C2416', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {(
                  [
                    { label: t('knowledgeVault.formTags', 'Tags'), field: 'tags' as const },
                    { label: t('knowledgeVault.formIndustries', 'Industries'), field: 'industries' as const },
                    { label: t('knowledgeVault.formEngagements', 'Related Engagements'), field: 'engagements' as const },
                  ] as Array<{ label: string; field: keyof Pick<KnowledgeForm, 'tags' | 'industries' | 'engagements'> }>
                ).map(({ label, field }) => (
                  <div key={field}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8C7B6B', marginBottom: 6 }}>{label}</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                      {form[field].map((val, idx) => (
                        <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, background: '#F5F0E8', fontSize: 12, color: '#5C4D3C' }}>
                          {val}
                          <button onClick={() => removeTag(field, idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#B5A898', display: 'flex' }}>
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(field); } }}
                        placeholder={`Add ${label.toLowerCase()}…`}
                        style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #E5E0D8', fontSize: 12, color: '#2C2416' }}
                      />
                      <button onClick={() => addTag(field)} style={{ padding: '6px 12px', borderRadius: 6, background: '#F5F0E8', border: '1px solid #E5E0D8', fontSize: 12, cursor: 'pointer', color: '#5C4D3C' }}>
                        {t('common.add', 'Add')}
                      </button>
                    </div>
                  </div>
                ))}

                <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
                  <button
                    onClick={closeModal}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #E5E0D8', background: 'transparent', color: '#8C7B6B', fontSize: 14, cursor: 'pointer' }}
                  >
                    {t('common.cancel', 'Cancel')}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !form.title.trim()}
                    style={{
                      flex: 2,
                      padding: '10px 0',
                      borderRadius: 8,
                      background: saving || !form.title.trim() ? '#D4C5B0' : GOLD,
                      border: 'none',
                      color: '#1A1200',
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: saving || !form.title.trim() ? 'not-allowed' : 'pointer',
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

      {/* Delete Confirm */}
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
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              style={{ background: '#fff', borderRadius: 12, padding: 28, maxWidth: 400, width: '100%' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#2C2416', marginBottom: 8 }}>
                {t('common.confirmDelete', 'Delete Item?')}
              </h3>
              <p style={{ fontSize: 14, color: '#8C7B6B', marginBottom: 20 }}>
                {t('knowledgeVault.deleteWarning', 'Remove')} <strong>{deleteConfirm.title}</strong>?{' '}
                {t('knowledgeVault.deleteWarning2', 'This cannot be undone.')}
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid #E5E0D8', background: 'transparent', color: '#8C7B6B', fontSize: 14, cursor: 'pointer' }}
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
