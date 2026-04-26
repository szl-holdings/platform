/**
 * Proof-Chain Audit Trail
 *
 * Compliance officer view of every AI-generated content entry registered in
 * the proof chain.  Supports per-entry review (approve / flag / retract) with
 * an optional export-safety override and bulk-action controls.
 */

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Link2,
  RefreshCw,
  Shield,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { fetchJson } from '../../pages/cognitive/shared';

const BG = { page: '#080c14', surface: '#0c1018', elevated: '#10141e', card: '#0f131c' };
const BORDER = { subtle: 'rgba(255,255,255,0.04)', muted: 'rgba(255,255,255,0.07)' };
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
};
const ACCENT = '#2dd4bf';

// ─── Types ───────────────────────────────────────────────────────────────────

type ReviewState = 'unreviewed' | 'reviewed' | 'approved' | 'flagged' | 'retracted';
type ExportSafetyState = 'safe' | 'restricted' | 'blocked' | 'pending_review';
type SourceClass =
  | 'llm_generated'
  | 'llm_summarized'
  | 'llm_extracted'
  | 'human_authored'
  | 'system_computed'
  | 'external_feed'
  | 'hybrid'
  | 'llm_generation';

interface ProofEntry {
  id: number;
  orgId: number | null;
  contentId: string;
  contentType: string;
  sourceClass: SourceClass;
  confidenceScore: number;
  modelLane: string | null;
  modelId: string | null;
  modelProvider: string | null;
  modelVersion: string | null;
  reviewState: ReviewState;
  reviewedBy: number | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  exportSafetyState: ExportSafetyState;
  generatedAt: string;
  serviceAttribution: string | null;
  correlationId: string | null;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function reviewCfg(state: ReviewState) {
  switch (state) {
    case 'approved':
      return { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', label: 'Approved', icon: CheckCircle2 };
    case 'flagged':
      return { color: '#f97316', bg: 'rgba(249,115,22,0.08)', label: 'Flagged', icon: AlertTriangle };
    case 'retracted':
      return { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', label: 'Retracted', icon: XCircle };
    case 'reviewed':
      return { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', label: 'Reviewed', icon: Eye };
    default:
      return { color: '#d4a054', bg: 'rgba(212,160,84,0.08)', label: 'Unreviewed', icon: Clock };
  }
}

function exportSafetyCfg(state: ExportSafetyState) {
  switch (state) {
    case 'safe':
      return { color: '#22c55e', label: 'Safe' };
    case 'restricted':
      return { color: '#f97316', label: 'Restricted' };
    case 'blocked':
      return { color: '#ef4444', label: 'Blocked' };
    default:
      return { color: '#d4a054', label: 'Pending Review' };
  }
}

function confidenceColor(score: number) {
  if (score >= 0.85) return '#22c55e';
  if (score >= 0.7) return '#d4a054';
  return '#ef4444';
}

// ─── Pill component ───────────────────────────────────────────────────────────

function ReviewPill({ state }: { state: ReviewState }) {
  const cfg = reviewCfg(state);
  const Icon = cfg.icon;
  return (
    <span
      className="flex items-center gap-1 text-[8px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider whitespace-nowrap"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
}

// ─── Review modal ─────────────────────────────────────────────────────────────

interface ReviewModalProps {
  entry: ProofEntry;
  onClose: () => void;
  onDone: (updated: ProofEntry) => void;
}

function ReviewModal({ entry, onClose, onDone }: ReviewModalProps) {
  const [reviewState, setReviewState] = useState<ReviewState>(entry.reviewState);
  const [exportSafetyState, setExportSafetyState] = useState<ExportSafetyState>(
    entry.exportSafetyState,
  );
  const [reviewNote, setReviewNote] = useState(entry.reviewNote ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = reviewState !== entry.reviewState || exportSafetyState !== entry.exportSafetyState || reviewNote !== (entry.reviewNote ?? '');

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetchJson<{ data?: ProofEntry } | ProofEntry>(
        `/proof-chain/${entry.id}/review`,
        {
          method: 'POST',
          body: JSON.stringify({ reviewState, exportSafetyState, reviewNote }),
        },
      );
      const updated = ((res as { data?: ProofEntry }).data ?? (res as ProofEntry));
      onDone(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSaving(false);
    }
  }

  const reviewStates: ReviewState[] = ['unreviewed', 'reviewed', 'approved', 'flagged', 'retracted'];
  const exportStates: ExportSafetyState[] = ['safe', 'pending_review', 'restricted', 'blocked'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="rounded-lg border p-5 w-full max-w-md"
        style={{ background: BG.card, borderColor: `${ACCENT}25` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4" style={{ color: ACCENT }} />
          <span className="text-[13px] font-semibold" style={{ color: TEXT.primary }}>
            Review Proof Entry #{entry.id}
          </span>
        </div>

        <div className="mb-3">
          <div className="text-[9px] font-mono mb-1" style={{ color: TEXT.tertiary }}>
            Content
          </div>
          <div className="text-[10px] font-mono px-2 py-1.5 rounded" style={{ background: BG.elevated, color: TEXT.secondary }}>
            {entry.contentType} / {entry.contentId}
          </div>
        </div>

        <div className="mb-3">
          <div className="text-[9px] font-mono mb-1.5" style={{ color: TEXT.tertiary }}>
            Review State
          </div>
          <div className="flex flex-wrap gap-1.5">
            {reviewStates.map((s) => {
              const cfg = reviewCfg(s);
              const active = reviewState === s;
              return (
                <button
                  key={s}
                  onClick={() => setReviewState(s)}
                  className="text-[9px] font-mono px-2 py-1 rounded uppercase"
                  style={{
                    color: active ? cfg.color : TEXT.tertiary,
                    background: active ? cfg.bg : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? cfg.color + '40' : BORDER.muted}`,
                  }}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-3">
          <div className="text-[9px] font-mono mb-1.5" style={{ color: TEXT.tertiary }}>
            Export Safety
          </div>
          <div className="flex flex-wrap gap-1.5">
            {exportStates.map((s) => {
              const cfg = exportSafetyCfg(s);
              const active = exportSafetyState === s;
              return (
                <button
                  key={s}
                  onClick={() => setExportSafetyState(s)}
                  className="text-[9px] font-mono px-2 py-1 rounded uppercase"
                  style={{
                    color: active ? cfg.color : TEXT.tertiary,
                    background: active ? `${cfg.color}12` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? cfg.color + '40' : BORDER.muted}`,
                  }}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4">
          <div className="text-[9px] font-mono mb-1" style={{ color: TEXT.tertiary }}>
            Review Note
          </div>
          <textarea
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            rows={3}
            placeholder="Optional compliance note…"
            className="w-full rounded px-2 py-1.5 text-[10px] font-mono resize-none outline-none"
            style={{
              background: BG.elevated,
              border: `1px solid ${BORDER.muted}`,
              color: TEXT.primary,
            }}
          />
        </div>

        {error && (
          <div
            className="text-[9px] font-mono px-2 py-1.5 rounded mb-3"
            style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}
          >
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded text-[10px] font-semibold"
            style={{ color: TEXT.secondary, border: `1px solid ${BORDER.muted}` }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !canSave}
            className="px-3 py-1.5 rounded text-[10px] font-semibold disabled:opacity-40"
            style={{ color: '#080c14', background: ACCENT }}
          >
            {saving ? 'Saving…' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const REVIEW_STATES: Array<{ value: ReviewState | ''; label: string }> = [
  { value: '', label: 'All States' },
  { value: 'unreviewed', label: 'Unreviewed' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'approved', label: 'Approved' },
  { value: 'flagged', label: 'Flagged' },
  { value: 'retracted', label: 'Retracted' },
];

const SOURCE_CLASSES: Array<{ value: SourceClass | ''; label: string }> = [
  { value: '', label: 'All Sources' },
  { value: 'llm_generated', label: 'LLM Generated' },
  { value: 'llm_generation', label: 'LLM Generation' },
  { value: 'llm_summarized', label: 'LLM Summarized' },
  { value: 'llm_extracted', label: 'LLM Extracted' },
  { value: 'human_authored', label: 'Human Authored' },
  { value: 'system_computed', label: 'System Computed' },
  { value: 'external_feed', label: 'External Feed' },
  { value: 'hybrid', label: 'Hybrid' },
];

export default function ProofChainAudit() {
  const [entries, setEntries] = useState<ProofEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<ReviewState | ''>('');
  const [filterSource, setFilterSource] = useState<SourceClass | ''>('');
  const [filterType, setFilterType] = useState('');
  const [reviewTarget, setReviewTarget] = useState<ProofEntry | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction] = useState<ReviewState>('approved');
  const [bulkInFlight, setBulkInFlight] = useState(false);
  const refreshRef = useRef(0);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams({ limit: '200' });
    if (filterState) params.set('reviewState', filterState);
    if (filterSource) params.set('sourceClass', filterSource);
    if (filterType.trim()) params.set('contentType', filterType.trim());
    return `/proof-chain?${params.toString()}`;
  }, [filterState, filterSource, filterType]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchJson<{ data?: ProofEntry[] } | ProofEntry[]>(buildUrl());
      const list = (res as { data?: ProofEntry[] }).data ?? (res as ProofEntry[]);
      setEntries(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load proof chain');
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  useEffect(() => {
    load();
  }, [load]);

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(entries.map((e) => e.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function handleBulkReview() {
    if (selectedIds.size === 0) return;
    setBulkInFlight(true);
    const ids = Array.from(selectedIds);
    await Promise.allSettled(
      ids.map((id) =>
        fetchJson(`/proof-chain/${id}/review`, {
          method: 'POST',
          body: JSON.stringify({ reviewState: bulkAction }),
        }),
      ),
    );
    setBulkInFlight(false);
    setSelectedIds(new Set());
    load();
  }

  const stats = useMemo(() => {
    const counts: Record<ReviewState, number> = {
      unreviewed: 0,
      reviewed: 0,
      approved: 0,
      flagged: 0,
      retracted: 0,
    };
    for (const e of entries) {
      counts[e.reviewState] = (counts[e.reviewState] ?? 0) + 1;
    }
    return counts;
  }, [entries]);

  return (
    <div
      className="flex flex-col h-screen font-sans text-xs"
      style={{ background: BG.page, color: TEXT.primary }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b shrink-0"
        style={{ borderColor: BORDER.muted, background: BG.surface }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded flex items-center justify-center"
            style={{ background: `${ACCENT}15`, border: `1px solid ${ACCENT}30` }}
          >
            <Link2 className="w-3.5 h-3.5" style={{ color: ACCENT }} />
          </div>
          <div>
            <div className="text-[13px] font-bold tracking-tight" style={{ color: TEXT.primary }}>
              Proof-Chain Audit Trail
            </div>
            <div className="text-[9px] font-mono mt-0.5" style={{ color: TEXT.tertiary }}>
              AI content provenance — compliance review console
            </div>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[9px] font-semibold"
          style={{
            color: ACCENT,
            background: `${ACCENT}10`,
            border: `1px solid ${ACCENT}25`,
          }}
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {/* Stats row */}
      <div
        className="flex gap-3 px-5 py-2.5 border-b shrink-0 overflow-x-auto"
        style={{ borderColor: BORDER.muted }}
      >
        {(Object.entries(stats) as Array<[ReviewState, number]>).map(([state, count]) => {
          const cfg = reviewCfg(state);
          return (
            <button
              key={state}
              onClick={() => setFilterState(filterState === state ? '' : state)}
              className="flex items-center gap-1.5 text-[9px] font-mono px-2.5 py-1 rounded whitespace-nowrap"
              style={{
                color: filterState === state ? cfg.color : TEXT.tertiary,
                background: filterState === state ? cfg.bg : 'rgba(255,255,255,0.03)',
                border: `1px solid ${filterState === state ? cfg.color + '40' : BORDER.muted}`,
              }}
            >
              {state} · {count}
            </button>
          );
        })}
        <div className="ml-auto flex items-center text-[9px] font-mono" style={{ color: TEXT.tertiary }}>
          {entries.length} entries
        </div>
      </div>

      {/* Filters */}
      <div
        className="flex items-center gap-2 px-5 py-2 border-b shrink-0 flex-wrap"
        style={{ borderColor: BORDER.muted, background: BG.surface }}
      >
        <Filter className="w-3 h-3 shrink-0" style={{ color: TEXT.tertiary }} />
        <select
          value={filterState}
          onChange={(e) => setFilterState(e.target.value as ReviewState | '')}
          className="text-[9px] font-mono px-2 py-1 rounded outline-none"
          style={{ background: BG.elevated, color: TEXT.secondary, border: `1px solid ${BORDER.muted}` }}
        >
          {REVIEW_STATES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value as SourceClass | '')}
          className="text-[9px] font-mono px-2 py-1 rounded outline-none"
          style={{ background: BG.elevated, color: TEXT.secondary, border: `1px solid ${BORDER.muted}` }}
        >
          {SOURCE_CLASSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <input
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          placeholder="Content type filter…"
          className="text-[9px] font-mono px-2 py-1 rounded outline-none flex-1 min-w-[140px]"
          style={{ background: BG.elevated, color: TEXT.secondary, border: `1px solid ${BORDER.muted}` }}
        />
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div
          className="flex items-center gap-2.5 px-5 py-2 border-b shrink-0"
          style={{
            borderColor: `${ACCENT}25`,
            background: `${ACCENT}08`,
          }}
        >
          <span className="text-[9px] font-mono" style={{ color: ACCENT }}>
            {selectedIds.size} selected
          </span>
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value as ReviewState)}
            className="text-[9px] font-mono px-2 py-0.5 rounded outline-none"
            style={{ background: BG.elevated, color: TEXT.secondary, border: `1px solid ${BORDER.muted}` }}
          >
            {(['approved', 'reviewed', 'flagged', 'retracted'] as ReviewState[]).map((s) => (
              <option key={s} value={s}>
                Mark {s}
              </option>
            ))}
          </select>
          <button
            onClick={handleBulkReview}
            disabled={bulkInFlight}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-[9px] font-semibold disabled:opacity-40"
            style={{ color: '#080c14', background: ACCENT }}
          >
            {bulkInFlight ? 'Applying…' : 'Apply'}
          </button>
          <button
            onClick={clearSelection}
            className="text-[9px] font-mono px-2 py-0.5 rounded"
            style={{ color: TEXT.secondary, border: `1px solid ${BORDER.muted}` }}
          >
            Clear
          </button>
          <button
            onClick={selectAll}
            className="text-[9px] font-mono px-2 py-0.5 rounded"
            style={{ color: TEXT.secondary, border: `1px solid ${BORDER.muted}` }}
          >
            Select all
          </button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <RefreshCw className="w-5 h-5 animate-spin" style={{ color: ACCENT }} />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <AlertTriangle className="w-5 h-5" style={{ color: '#f97316' }} />
            <div className="text-[10px] font-mono" style={{ color: TEXT.secondary }}>
              {error}
            </div>
            <button
              onClick={load}
              className="text-[9px] font-mono px-2.5 py-1 rounded mt-1"
              style={{ color: ACCENT, border: `1px solid ${ACCENT}30` }}
            >
              Retry
            </button>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <Link2 className="w-5 h-5" style={{ color: TEXT.tertiary }} />
            <div className="text-[10px] font-mono" style={{ color: TEXT.secondary }}>
              No proof entries match the current filters
            </div>
          </div>
        ) : (
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr
                className="sticky top-0 text-[8px] font-mono uppercase tracking-wider"
                style={{ background: BG.surface, borderBottom: `1px solid ${BORDER.muted}` }}
              >
                <th className="px-3 py-2 text-left w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === entries.length && entries.length > 0}
                    onChange={(e) => (e.target.checked ? selectAll() : clearSelection())}
                    className="w-3 h-3"
                  />
                </th>
                <th className="px-3 py-2 text-left" style={{ color: TEXT.tertiary }}>ID</th>
                <th className="px-3 py-2 text-left" style={{ color: TEXT.tertiary }}>Content</th>
                <th className="px-3 py-2 text-left" style={{ color: TEXT.tertiary }}>Source</th>
                <th className="px-3 py-2 text-left" style={{ color: TEXT.tertiary }}>Model</th>
                <th className="px-3 py-2 text-left" style={{ color: TEXT.tertiary }}>Confidence</th>
                <th className="px-3 py-2 text-left" style={{ color: TEXT.tertiary }}>Review</th>
                <th className="px-3 py-2 text-left" style={{ color: TEXT.tertiary }}>Export</th>
                <th className="px-3 py-2 text-left" style={{ color: TEXT.tertiary }}>Generated</th>
                <th className="px-3 py-2 text-left" style={{ color: TEXT.tertiary }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => {
                const selected = selectedIds.has(entry.id);
                const safetyStyle = exportSafetyCfg(entry.exportSafetyState);
                return (
                  <tr
                    key={entry.id}
                    className="border-b"
                    style={{
                      borderColor: BORDER.subtle,
                      background: selected
                        ? `${ACCENT}06`
                        : i % 2 === 0
                          ? 'transparent'
                          : 'rgba(255,255,255,0.01)',
                    }}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelect(entry.id)}
                        className="w-3 h-3"
                      />
                    </td>
                    <td className="px-3 py-2 font-mono" style={{ color: TEXT.tertiary }}>
                      #{entry.id}
                    </td>
                    <td className="px-3 py-2 max-w-[200px]">
                      <div
                        className="font-mono truncate text-[9px]"
                        style={{ color: TEXT.secondary }}
                        title={`${entry.contentType} / ${entry.contentId}`}
                      >
                        <span style={{ color: ACCENT }}>{entry.contentType}</span>
                      </div>
                      <div
                        className="font-mono truncate text-[8px] mt-0.5"
                        style={{ color: TEXT.tertiary }}
                        title={entry.contentId}
                      >
                        {entry.contentId}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                        style={{ color: TEXT.secondary, background: 'rgba(255,255,255,0.04)' }}
                      >
                        {entry.sourceClass}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-[9px] font-mono" style={{ color: TEXT.secondary }}>
                        {entry.modelId ?? '—'}
                      </div>
                      {entry.modelProvider && (
                        <div className="text-[8px] font-mono mt-0.5" style={{ color: TEXT.tertiary }}>
                          {entry.modelProvider}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="h-1 rounded-full flex-1 max-w-[48px]"
                          style={{
                            background: 'rgba(255,255,255,0.08)',
                          }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.round(entry.confidenceScore * 100)}%`,
                              background: confidenceColor(entry.confidenceScore),
                            }}
                          />
                        </div>
                        <span
                          className="text-[8px] font-mono shrink-0"
                          style={{ color: confidenceColor(entry.confidenceScore) }}
                        >
                          {Math.round(entry.confidenceScore * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <ReviewPill state={entry.reviewState} />
                      {entry.reviewNote && (
                        <div
                          className="text-[8px] font-mono mt-0.5 truncate max-w-[120px]"
                          style={{ color: TEXT.tertiary }}
                          title={entry.reviewNote}
                        >
                          {entry.reviewNote}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                        style={{
                          color: safetyStyle.color,
                          background: `${safetyStyle.color}10`,
                        }}
                      >
                        {safetyStyle.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap" style={{ color: TEXT.tertiary }}>
                      <div className="text-[8px] font-mono">
                        {timeAgo(entry.generatedAt)}
                      </div>
                      {entry.serviceAttribution && (
                        <div
                          className="text-[7px] font-mono mt-0.5 truncate max-w-[80px]"
                          style={{ color: TEXT.tertiary }}
                          title={entry.serviceAttribution}
                        >
                          {entry.serviceAttribution}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => setReviewTarget(entry)}
                        className="flex items-center gap-1 text-[8px] font-mono px-2 py-1 rounded"
                        style={{
                          color: ACCENT,
                          background: `${ACCENT}10`,
                          border: `1px solid ${ACCENT}25`,
                        }}
                      >
                        <Eye className="w-2.5 h-2.5" />
                        Review
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Review modal */}
      {reviewTarget && (
        <ReviewModal
          entry={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onDone={(updated) => {
            setEntries((prev) =>
              prev.map((e) => (e.id === updated.id ? (updated as ProofEntry) : e)),
            );
            setReviewTarget(null);
          }}
        />
      )}
    </div>
  );
}
