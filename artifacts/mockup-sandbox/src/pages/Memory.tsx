import {
  AlertCircle,
  Brain,
  FlaskConical,
  Loader,
  Pin,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { praxisApi } from '../lib/api';
import type { MemoryItem } from '../lib/types';

const TYPE_COLORS: Record<string, string> = {
  fact: 'var(--gi-accent-blue)',
  preference: 'var(--gi-accent-violet)',
  entity: 'var(--gi-accent-green)',
  claim: 'var(--gi-accent-amber)',
  context: '#8896aa',
};

const TIER_LABELS: Record<string, string> = {
  working: 'WRK',
  session: 'SES',
  episodic: 'EPI',
  semantic: 'SEM',
};

export default function Memory() {
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newType, setNewType] = useState<MemoryItem['type']>('fact');
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const data = await praxisApi.listMemory({
        search: search || undefined,
        type: typeFilter || undefined,
        pinned: pinnedOnly || undefined,
      });
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load memory');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, pinnedOnly]);

  useEffect(() => {
    setLoading(true);
    fetchItems();
  }, [fetchItems]);

  async function handlePin(item: MemoryItem) {
    try {
      const updated = await praxisApi.updateMemory(item.id, { pinned: !item.pinned });
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    } catch {}
  }

  async function handleForget(id: string) {
    if (!confirm('Forget this memory item?')) return;
    try {
      await praxisApi.forgetMemory(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {}
  }

  async function handleAdd() {
    if (!newKey.trim() || !newValue.trim()) return;
    setSubmitting(true);
    try {
      const item = await praxisApi.addMemory({
        key: newKey,
        value: newValue,
        type: newType,
      });
      setItems((prev) => [item, ...prev]);
      setNewKey('');
      setNewValue('');
      setAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add memory');
    } finally {
      setSubmitting(false);
    }
  }

  const grouped = {
    pinned: items.filter((i) => i.pinned),
    unpinned: items.filter((i) => !i.pinned),
  };

  return (
    <div className="min-h-full bg-praxis-bg p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-5 h-5 text-praxis-purple" />
          <div>
            <h1 className="text-lg font-semibold">Persistent Memory</h1>
            <p className="text-xs text-muted-foreground">
              Cross-session · Multi-tier · Research-fed
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setAdding((a) => !a)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-praxis-purple/10 border border-praxis-purple/30 text-praxis-purple text-xs font-medium hover:bg-praxis-purple/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Memory
            </button>
          </div>
        </div>

        <div className="mb-5 flex items-center gap-2 rounded-lg border border-praxis-amber/20 bg-praxis-amber/5 px-3 py-2">
          <FlaskConical className="w-3.5 h-3.5 text-praxis-amber shrink-0" />
          <span className="text-[11px] text-praxis-amber font-mono uppercase tracking-wide">
            Internal Tooling — Not Production
          </span>
          <span className="text-[10px] text-muted-foreground/60 ml-1">
            This module is for internal NEXUS development only. Data here is not customer-facing.
          </span>
        </div>

        {adding && (
          <div className="bg-praxis-surface border border-praxis-purple/20 rounded-xl p-4 mb-5 space-y-3">
            <h3 className="text-sm font-semibold text-praxis-purple">New Memory Item</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mb-1 block">
                  Key
                </label>
                <input
                  type="text"
                  placeholder="e.g. preferred_output_format"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-full bg-praxis-bg border border-praxis rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-praxis-purple/50 placeholder:text-muted-foreground/30"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mb-1 block">
                  Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as MemoryItem['type'])}
                  className="w-full bg-praxis-bg border border-praxis rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-praxis-purple/50"
                >
                  {Object.keys(TYPE_COLORS).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mb-1 block">
                Value
              </label>
              <textarea
                placeholder="Memory value or fact…"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                rows={2}
                className="w-full bg-praxis-bg border border-praxis rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-praxis-purple/50 placeholder:text-muted-foreground/30"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setAdding(false)}
                className="px-3 py-1.5 text-xs rounded-lg border border-praxis text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={submitting || !newKey.trim() || !newValue.trim()}
                className="px-4 py-1.5 text-xs rounded-lg bg-praxis-purple/10 border border-praxis-purple/30 text-praxis-purple hover:bg-praxis-purple/20 disabled:opacity-40 transition-colors"
              >
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
            <input
              type="search"
              placeholder="Search memory…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-praxis-surface border border-praxis rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-praxis-purple/30 placeholder:text-muted-foreground/30"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-praxis-surface border border-praxis rounded-lg px-3 py-2 text-xs focus:outline-none text-muted-foreground"
          >
            <option value="">All types</option>
            {Object.keys(TYPE_COLORS).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            onClick={() => setPinnedOnly((p) => !p)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs transition-colors ${
              pinnedOnly
                ? 'bg-praxis-amber/10 border-praxis-amber/30 text-praxis-amber'
                : 'border-praxis text-muted-foreground hover:text-foreground'
            }`}
          >
            <Pin className="w-3.5 h-3.5" />
            Pinned
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-praxis-red/10 border border-praxis-red/30 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 text-praxis-red shrink-0" />
            <p className="text-xs text-praxis-red">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="w-6 h-6 animate-spin text-muted-foreground/40" />
          </div>
        ) : (
          <>
            {grouped.pinned.length > 0 && (
              <section className="mb-6">
                <h2 className="text-[10px] font-mono text-praxis-amber uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Pin className="w-3 h-3" /> Pinned
                </h2>
                <div className="space-y-2">
                  {grouped.pinned.map((item) => (
                    <MemoryCard
                      key={item.id}
                      item={item}
                      onPin={handlePin}
                      onForget={handleForget}
                    />
                  ))}
                </div>
              </section>
            )}

            {grouped.unpinned.length > 0 && (
              <section>
                {grouped.pinned.length > 0 && (
                  <h2 className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-widest mb-3">
                    Memory Store
                  </h2>
                )}
                <div className="space-y-2">
                  {grouped.unpinned.map((item) => (
                    <MemoryCard
                      key={item.id}
                      item={item}
                      onPin={handlePin}
                      onForget={handleForget}
                    />
                  ))}
                </div>
              </section>
            )}

            {items.length === 0 && (
              <div className="text-center py-16 text-muted-foreground/40">
                <Brain className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm">No memory items yet.</p>
                <p className="text-xs mt-1">
                  Run a Research Swarm query — entities and claims are automatically persisted here.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MemoryCard({
  item,
  onPin,
  onForget,
}: {
  item: MemoryItem;
  onPin: (i: MemoryItem) => void;
  onForget: (id: string) => void;
}) {
  const typeColor = TYPE_COLORS[item.type] ?? '#8896aa';

  return (
    <div className="bg-praxis-surface border border-praxis rounded-lg px-4 py-3 flex items-start gap-3 group hover:border-[#1a2535]/80 transition-colors">
      <div className="mt-0.5">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: typeColor }}
          title={item.type}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono font-medium" style={{ color: typeColor }}>
            {item.type}
          </span>
          <span className="text-[9px] font-mono bg-praxis-bg px-1.5 py-0.5 rounded text-muted-foreground/50">
            {TIER_LABELS[item.tier] ?? item.tier}
          </span>
          <span className="text-[9px] font-mono text-muted-foreground/30">
            conf:{Math.round(item.confidence * 100)}%
          </span>
          {item.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {item.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] px-1 py-0.5 rounded bg-praxis-bg text-muted-foreground/40 border border-praxis"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="text-xs font-mono font-semibold text-foreground/80 mb-1">{item.key}</div>
        <div className="text-xs text-muted-foreground leading-relaxed">{item.value}</div>
        {item.source && (
          <div className="text-[9px] text-muted-foreground/40 mt-1 font-mono">
            source: {item.source}
          </div>
        )}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onPin(item)}
          className={`p-1.5 rounded-md transition-colors ${
            item.pinned
              ? 'text-praxis-amber bg-praxis-amber/10'
              : 'text-muted-foreground/40 hover:text-praxis-amber hover:bg-praxis-amber/10'
          }`}
          title={item.pinned ? 'Unpin' : 'Pin'}
        >
          <Pin className="w-3 h-3" />
        </button>
        <button
          onClick={() => onForget(item.id)}
          className="p-1.5 rounded-md text-muted-foreground/40 hover:text-praxis-red hover:bg-praxis-red/10 transition-colors"
          title="Forget"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
