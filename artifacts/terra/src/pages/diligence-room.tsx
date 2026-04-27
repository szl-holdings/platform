import { useStandardQuery } from '@szl-holdings/api-client-react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  Shield,
  Tag,
  Trash2,
  Upload,
} from 'lucide-react';
import { useState } from 'react';

const ACCENT = '#40856a';
const API = '/api';

type FieldErrors = Record<string, string[]>;

class ValidationError extends Error {
  fieldErrors: FieldErrors;
  constructor(message: string, fieldErrors: FieldErrors) {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}

async function parseApiError(res: Response): Promise<Error> {
  const body = await res.json().catch(() => null);
  const msg = body?.error ?? 'Request failed';
  if (body?.code === 'VALIDATION_ERROR' && body?.details?.fieldErrors) {
    return new ValidationError(msg, body.details.fieldErrors as FieldErrors);
  }
  return new Error(msg);
}

function fetchDiligenceRoom(matterId?: string) {
  const url = matterId
    ? `${API}/terra/cognitive/diligence-room?matterId=${encodeURIComponent(matterId)}`
    : `${API}/terra/cognitive/diligence-room`;
  return fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((d) => d.data ?? d);
}

async function createMatter(payload: {
  title: string;
  borough?: string;
  targetCloseDate?: string;
  stage?: string;
  ownerName?: string;
}) {
  const res = await fetch(`${API}/terra/cognitive/diligence-room/matters`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await parseApiError(res);
  return (await res.json()).data ?? null;
}

async function uploadEvidence(
  matterId: string,
  payload: {
    file: File | null;
    category: string;
    label: string;
    source?: string;
    summary?: string;
    confidence?: number;
    status?: string;
  },
) {
  const fd = new FormData();
  if (payload.file) fd.append('file', payload.file);
  fd.append('category', payload.category);
  fd.append('label', payload.label);
  if (payload.source) fd.append('source', payload.source);
  if (payload.summary) fd.append('summary', payload.summary);
  if (payload.confidence !== undefined) fd.append('confidence', String(payload.confidence));
  if (payload.status) fd.append('status', payload.status);
  const res = await fetch(
    `${API}/terra/cognitive/diligence-room/matters/${encodeURIComponent(matterId)}/evidence`,
    {
      method: 'POST',
      credentials: 'include',
      body: fd,
    },
  );
  if (!res.ok) throw await parseApiError(res);
  return (await res.json()).data ?? null;
}

async function updateEvidenceStatus(evidenceId: string, status: string) {
  const res = await fetch(
    `${API}/terra/cognitive/diligence-room/evidence/${encodeURIComponent(evidenceId)}`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    },
  );
  if (!res.ok) throw await parseApiError(res);
  return (await res.json()).data ?? null;
}

type EvidenceCitation = {
  ref: string;
  page?: number;
  excerpt: string;
  url?: string;
  addedByName?: string;
  addedAt?: string;
};

async function updateEvidenceCitations(evidenceId: string, citations: EvidenceCitation[]) {
  const res = await fetch(
    `${API}/terra/cognitive/diligence-room/evidence/${encodeURIComponent(evidenceId)}`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ citations }),
    },
  );
  if (!res.ok) throw await parseApiError(res);
  return (await res.json()).data ?? null;
}

const STATUS_CONFIG: Record<string, { color: string; Icon: typeof CheckCircle; label: string }> = {
  verified: { color: '#40856a', Icon: CheckCircle, label: 'Verified' },
  in_review: { color: '#4a7dc8', Icon: Clock, label: 'In Review' },
  pending: { color: '#c8a060', Icon: AlertCircle, label: 'Pending' },
};

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const seconds = Math.max(0, Math.floor(ms / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const CATEGORY_COLORS: Record<string, string> = {
  title: '#4a7dc8',
  environmental: '#40856a',
  financial: '#c8a060',
  lease: '#8b5cf6',
  structural: '#ec4899',
  legal: '#c04a2a',
};

function ConfidencePill({ value }: { value: number }) {
  const color = value >= 0.85 ? '#40856a' : value >= 0.65 ? '#c8a060' : '#c04a2a';
  const label = value >= 0.85 ? 'High' : value >= 0.65 ? 'Medium' : 'Low';
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-mono"
      style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}
    >
      {label} {(value * 100).toFixed(0)}%
    </span>
  );
}

function FieldErrorInline({ errors }: { errors?: string[] }) {
  if (!errors || errors.length === 0) return null;
  return (
    <div className="text-[9px] mt-0.5" style={{ color: '#ef4444' }}>
      {errors.join(', ')}
    </div>
  );
}

function EvidenceCard({
  evidence,
  index,
  onStatusChange,
  onAddCitation,
  onEditCitation,
  onRemoveCitation,
}: {
  evidence: any;
  index: number;
  onStatusChange?: (status: string) => void;
  onAddCitation?: (citation: EvidenceCitation) => Promise<void>;
  onEditCitation?: (citIndex: number, updated: EvidenceCitation) => Promise<void>;
  onRemoveCitation?: (citIndex: number) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [citationOpen, setCitationOpen] = useState(false);
  const [newCit, setNewCit] = useState({ ref: '', page: '', excerpt: '', url: '' });
  const [citBusy, setCitBusy] = useState(false);
  const [citErr, setCitErr] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editCit, setEditCit] = useState({ ref: '', page: '', excerpt: '', url: '' });
  const [editBusy, setEditBusy] = useState(false);
  const [editErr, setEditErr] = useState<string | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState<number | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [citFieldErrors, setCitFieldErrors] = useState<FieldErrors>({});
  const [statusErr, setStatusErr] = useState<string | null>(null);

  const submitCitation = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onAddCitation) return;
    setCitErr(null);
    setCitFieldErrors({});
    setCitBusy(true);
    try {
      const pageNum = newCit.page.trim() ? Number(newCit.page) : undefined;
      if (pageNum !== undefined && (!Number.isFinite(pageNum) || pageNum < 0)) {
        throw new Error('Page must be a non-negative number');
      }
      await onAddCitation({
        ref: newCit.ref.trim(),
        page: pageNum,
        excerpt: newCit.excerpt.trim(),
        url: newCit.url.trim() || undefined,
      });
      setNewCit({ ref: '', page: '', excerpt: '', url: '' });
      setCitationOpen(false);
    } catch (err) {
      if (err instanceof ValidationError) {
        setCitErr("Couldn't save — see field errors");
        setCitFieldErrors(err.fieldErrors);
      } else {
        setCitErr((err as Error).message);
      }
    } finally {
      setCitBusy(false);
    }
  };
  const cfg = STATUS_CONFIG[evidence.status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.Icon;
  const catColor = CATEGORY_COLORS[evidence.category] ?? '#64748b';

  const handleAdvance = async (e: React.MouseEvent, next: string) => {
    e.stopPropagation();
    if (!onStatusChange) return;
    setUpdating(true);
    setStatusErr(null);
    try {
      await onStatusChange(next);
    } catch (err) {
      if (err instanceof ValidationError) {
        const msgs = Object.entries(err.fieldErrors)
          .map(([field, errs]) => `${field}: ${errs.join(', ')}`)
          .join('; ');
        setStatusErr(msgs || err.message);
      } else {
        setStatusErr((err as Error).message);
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: `1px solid ${evidence.status === 'verified' ? 'rgba(64,133,106,0.2)' : evidence.status === 'in_review' ? 'rgba(74,125,200,0.2)' : 'rgba(200,160,96,0.2)'}`,
      }}
    >
      <div
        className="p-4 cursor-pointer"
        style={{ background: 'rgba(255,255,255,0.02)' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div
              className="text-[8px] font-mono font-bold w-5 h-5 flex items-center justify-center rounded"
              style={{ background: `${catColor}20`, color: catColor }}
            >
              {index + 1}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold" style={{ color: '#e8edf8' }}>
                    {evidence.label}
                  </span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase"
                    style={{ background: `${catColor}18`, color: catColor }}
                  >
                    {evidence.category}
                  </span>
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {evidence.source} · {evidence.date}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}
                >
                  {evidence.freshness} old
                </span>
                <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
              </div>
            </div>

            <p
              className="text-[11px] mt-2 leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              {evidence.summary}
            </p>

            <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
              <ConfidencePill value={evidence.confidence} />
              <div className="flex items-center gap-1.5">
                {onStatusChange && evidence.status !== 'verified' && (
                  <>
                    {evidence.status === 'pending' && (
                      <button
                        disabled={updating}
                        onClick={(e) => handleAdvance(e, 'in_review')}
                        className="text-[9px] px-2 py-0.5 rounded font-mono font-semibold transition-all disabled:opacity-50"
                        style={{
                          background: 'rgba(74,125,200,0.18)',
                          border: '1px solid rgba(74,125,200,0.4)',
                          color: '#4a7dc8',
                        }}
                      >
                        → In Review
                      </button>
                    )}
                    <button
                      disabled={updating}
                      onClick={(e) => handleAdvance(e, 'verified')}
                      className="text-[9px] px-2 py-0.5 rounded font-mono font-semibold transition-all disabled:opacity-50"
                      style={{
                        background: `${ACCENT}18`,
                        border: `1px solid ${ACCENT}40`,
                        color: ACCENT,
                      }}
                    >
                      ✓ Verify
                    </button>
                  </>
                )}
                {statusErr && (
                  <span className="text-[9px]" style={{ color: '#ef4444' }}>
                    {statusErr}
                  </span>
                )}
                {evidence.document?.url && (
                  <a
                    href={
                      evidence.document.url.startsWith('/objects/')
                        ? `${API}/terra/cognitive/diligence-room/evidence/${encodeURIComponent(evidence.id)}/download`
                        : evidence.document.url
                    }
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[9px] px-2 py-0.5 rounded font-mono font-semibold transition-all inline-flex items-center gap-1"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.7)',
                    }}
                  >
                    <ExternalLink className="w-2.5 h-2.5" />
                    {evidence.document.name ?? 'Doc'}
                  </a>
                )}
                <div
                  className="flex items-center gap-1 text-[9px]"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  {expanded ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                  {evidence.citations?.length ?? 0} cit.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {expanded && (evidence.citations?.length > 0 || onAddCitation) && (
        <div
          className="p-4 space-y-2"
          style={{ background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          <div
            className="flex items-center justify-between mb-2"
          >
            <div
              className="text-[9px] uppercase tracking-wider font-semibold"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Citations
            </div>
            {onAddCitation && !citationOpen && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCitationOpen(true);
                }}
                className="text-[9px] px-2 py-0.5 rounded font-mono font-semibold inline-flex items-center gap-1"
                style={{
                  background: `${ACCENT}18`,
                  border: `1px solid ${ACCENT}40`,
                  color: ACCENT,
                }}
              >
                <Plus className="w-2.5 h-2.5" /> Add citation
              </button>
            )}
          </div>
          {onAddCitation && citationOpen && (
            <div
              data-testid="add-citation-form"
              className="p-3 rounded-lg space-y-2"
              style={{
                background: 'rgba(64,133,106,0.06)',
                border: `1px solid ${ACCENT}30`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <input
                    value={newCit.ref}
                    onChange={(e) => setNewCit((c) => ({ ...c, ref: e.target.value }))}
                    placeholder="Reference (e.g. Schedule B-II §4)"
                    className="w-full px-2 py-1 text-[11px] rounded"
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: `1px solid ${citFieldErrors.ref || citFieldErrors.citations ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      color: '#e8edf8',
                    }}
                  />
                  <FieldErrorInline errors={citFieldErrors.ref} />
                </div>
                <div>
                  <input
                    value={newCit.page}
                    onChange={(e) => setNewCit((c) => ({ ...c, page: e.target.value }))}
                    placeholder="Page"
                    inputMode="numeric"
                    className="w-full px-2 py-1 text-[11px] rounded"
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: `1px solid ${citFieldErrors.page ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      color: '#e8edf8',
                    }}
                  />
                  <FieldErrorInline errors={citFieldErrors.page} />
                </div>
              </div>
              <div>
                <textarea
                  value={newCit.excerpt}
                  onChange={(e) => setNewCit((c) => ({ ...c, excerpt: e.target.value }))}
                  placeholder="Excerpt / blockquote text"
                  rows={2}
                  className="w-full px-2 py-1 text-[11px] rounded"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: `1px solid ${citFieldErrors.excerpt ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    color: '#e8edf8',
                  }}
                />
                <FieldErrorInline errors={citFieldErrors.excerpt} />
              </div>
              <div>
                <input
                  value={newCit.url}
                  onChange={(e) => setNewCit((c) => ({ ...c, url: e.target.value }))}
                  placeholder="Source URL (optional)"
                  className="w-full px-2 py-1 text-[11px] rounded"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: `1px solid ${citFieldErrors.url ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    color: '#e8edf8',
                  }}
                />
                <FieldErrorInline errors={citFieldErrors.url} />
              </div>
              <FieldErrorInline errors={citFieldErrors.citations} />
              {citErr && (
                <div className="text-[10px]" style={{ color: '#ef4444' }}>
                  {citErr}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  disabled={citBusy || newCit.ref.trim().length < 1 || newCit.excerpt.trim().length < 1}
                  onClick={submitCitation}
                  className="flex-1 py-1 text-[10px] font-semibold rounded disabled:opacity-50"
                  style={{ background: ACCENT, color: '#0a0f0c' }}
                >
                  {citBusy ? 'Saving…' : 'Save citation'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCitationOpen(false);
                    setCitErr(null);
                  }}
                  className="px-3 py-1 text-[10px] rounded"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.6)',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {(evidence.citations ?? []).map((cit: any, i: number) => (
            <div
              key={i}
              className="p-3 rounded-lg"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {editingIndex === i ? (
                <div
                  className="space-y-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      value={editCit.ref}
                      onChange={(e) => setEditCit((c) => ({ ...c, ref: e.target.value }))}
                      placeholder="Reference"
                      className="col-span-2 px-2 py-1 text-[11px] rounded"
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#e8edf8',
                      }}
                    />
                    <input
                      value={editCit.page}
                      onChange={(e) => setEditCit((c) => ({ ...c, page: e.target.value }))}
                      placeholder="Page"
                      inputMode="numeric"
                      className="px-2 py-1 text-[11px] rounded"
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#e8edf8',
                      }}
                    />
                  </div>
                  <textarea
                    value={editCit.excerpt}
                    onChange={(e) => setEditCit((c) => ({ ...c, excerpt: e.target.value }))}
                    placeholder="Excerpt / blockquote text"
                    rows={2}
                    className="w-full px-2 py-1 text-[11px] rounded"
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#e8edf8',
                    }}
                  />
                  <input
                    value={editCit.url}
                    onChange={(e) => setEditCit((c) => ({ ...c, url: e.target.value }))}
                    placeholder="Source URL (optional)"
                    className="w-full px-2 py-1 text-[11px] rounded"
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#e8edf8',
                    }}
                  />
                  {editErr && (
                    <div className="text-[10px]" style={{ color: '#ef4444' }}>
                      {editErr}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      disabled={editBusy || editCit.ref.trim().length < 1 || editCit.excerpt.trim().length < 1}
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!onEditCitation) return;
                        setEditErr(null);
                        setEditBusy(true);
                        try {
                          const pageNum = editCit.page.trim() ? Number(editCit.page) : undefined;
                          if (pageNum !== undefined && (!Number.isFinite(pageNum) || pageNum < 0)) {
                            throw new Error('Page must be a non-negative number');
                          }
                          await onEditCitation(i, {
                            ref: editCit.ref.trim(),
                            page: pageNum,
                            excerpt: editCit.excerpt.trim(),
                            url: editCit.url.trim() || undefined,
                          });
                          setEditingIndex(null);
                        } catch (err) {
                          setEditErr((err as Error).message);
                        } finally {
                          setEditBusy(false);
                        }
                      }}
                      className="flex-1 py-1 text-[10px] font-semibold rounded disabled:opacity-50"
                      style={{ background: ACCENT, color: '#0a0f0c' }}
                    >
                      {editBusy ? 'Saving…' : 'Save changes'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingIndex(null);
                        setEditErr(null);
                      }}
                      className="px-3 py-1 text-[10px] rounded"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        color: 'rgba(255,255,255,0.6)',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : removeConfirm === i ? (
                <div
                  className="flex items-center gap-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    Remove this citation?
                  </span>
                  <button
                    disabled={removeBusy}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!onRemoveCitation) return;
                      setRemoveBusy(true);
                      try {
                        await onRemoveCitation(i);
                        setRemoveConfirm(null);
                      } finally {
                        setRemoveBusy(false);
                      }
                    }}
                    className="text-[10px] px-2 py-0.5 rounded font-semibold"
                    style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
                  >
                    {removeBusy ? 'Removing…' : 'Confirm'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRemoveConfirm(null);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.6)',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <BookOpen className="w-3 h-3 flex-shrink-0" style={{ color: ACCENT }} />
                    <span className="text-[10px] font-medium" style={{ color: '#e8edf8' }}>
                      {cit.ref}
                    </span>
                    {cit.page && (
                      <span
                        className="text-[9px] px-1 py-0.5 rounded font-mono"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}
                      >
                        p.{cit.page}
                      </span>
                    )}
                    {onEditCitation && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditCit({ ref: cit.ref ?? '', page: cit.page != null ? String(cit.page) : '', excerpt: cit.excerpt ?? '', url: cit.url ?? '' });
                          setEditErr(null);
                          setEditingIndex(i);
                          setRemoveConfirm(null);
                        }}
                        className="p-0.5 rounded hover:bg-white/10 transition-colors"
                        title="Edit citation"
                        style={{ color: 'rgba(255,255,255,0.35)' }}
                      >
                        <Pencil className="w-2.5 h-2.5" />
                      </button>
                    )}
                    {onRemoveCitation && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRemoveConfirm(i);
                          setEditingIndex(null);
                        }}
                        className="p-0.5 rounded hover:bg-white/10 transition-colors"
                        title="Remove citation"
                        style={{ color: 'rgba(255,255,255,0.35)' }}
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                  <blockquote
                    className="text-[10px] pl-2 italic"
                    style={{ color: 'rgba(255,255,255,0.5)', borderLeft: `2px solid ${catColor}40` }}
                  >
                    "{cit.excerpt}"
                  </blockquote>
                  {cit.addedByName && (
                    <div
                      className="text-[9px] mt-1 pl-2"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                    >
                      added by {cit.addedByName}
                      {cit.addedAt ? ` \u00B7 ${relativeTime(cit.addedAt)}` : ''}
                    </div>
                  )}
                </>

              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewMatterForm({ onCreated }: { onCreated: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [matterForm, setMatterForm] = useState({ title: '', borough: '', targetCloseDate: '', stage: 'pre_diligence', ownerName: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    setBusy(true);
    try {
      const r = await createMatter({
        title: matterForm.title,
        borough: matterForm.borough || undefined,
        targetCloseDate: matterForm.targetCloseDate || undefined,
        stage: matterForm.stage,
        ownerName: matterForm.ownerName || undefined,
      });
      if (r?.matter?.id) {
        onCreated(r.matter.id);
        setOpen(false);
        setMatterForm({ title: '', borough: '', targetCloseDate: '', stage: 'pre_diligence', ownerName: '' });
      }
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-semibold mb-2"
        style={{ background: `${ACCENT}12`, border: `1px dashed ${ACCENT}40`, color: ACCENT }}
      >
        <Plus className="w-3 h-3" /> New Matter
      </button>
    );
  }
  return (
    <div
      className="rounded-lg p-3 mb-2 space-y-2"
      style={{ background: 'rgba(64,133,106,0.06)', border: `1px solid ${ACCENT}30` }}
    >
      <input
        value={matterForm.title}
        onChange={(e) => setMatterForm((f) => ({ ...f, title: e.target.value }))}
        placeholder="Matter title (e.g. 245 Park — Acquisition)"
        className="w-full px-2 py-1 text-[11px] rounded"
        style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#e8edf8',
        }}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          value={matterForm.borough}
          onChange={(e) => setMatterForm((f) => ({ ...f, borough: e.target.value }))}
          placeholder="Borough"
          className="px-2 py-1 text-[11px] rounded"
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#e8edf8',
          }}
        />
        <input
          value={matterForm.targetCloseDate}
          onChange={(e) => setMatterForm((f) => ({ ...f, targetCloseDate: e.target.value }))}
          placeholder="Target close YYYY-MM-DD"
          className="px-2 py-1 text-[11px] rounded"
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#e8edf8',
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select
          value={matterForm.stage}
          onChange={(e) => setMatterForm((f) => ({ ...f, stage: e.target.value }))}
          className="px-2 py-1 text-[11px] rounded"
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#e8edf8',
          }}
        >
          <option value="pre_diligence">Pre-Diligence</option>
          <option value="initial_review">Initial Review</option>
          <option value="title_review">Title Review</option>
          <option value="environmental">Environmental</option>
          <option value="financial_audit">Financial Audit</option>
          <option value="legal_review">Legal Review</option>
          <option value="final_approval">IC Sign-Off</option>
        </select>
        <input
          value={matterForm.ownerName}
          onChange={(e) => setMatterForm((f) => ({ ...f, ownerName: e.target.value }))}
          placeholder="Owner (optional)"
          className="px-2 py-1 text-[11px] rounded"
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#e8edf8',
          }}
        />
      </div>
      {err && (
        <div className="text-[10px]" style={{ color: '#ef4444' }}>
          {err}
        </div>
      )}
      <div className="flex gap-2">
        <button
          disabled={busy || matterForm.title.length < 3}
          onClick={submit}
          className="flex-1 py-1 text-[10px] font-semibold rounded disabled:opacity-50"
          style={{ background: ACCENT, color: '#0a0f0c' }}
        >
          {busy ? 'Creating…' : 'Create'}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="px-3 py-1 text-[10px] rounded"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function AddEvidenceForm({ matterId, onAdded }: { matterId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [evidenceForm, setEvidenceForm] = useState({ category: 'title', label: '', summary: '', source: '' });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const submit = async () => {
    setErr(null);
    setFieldErrors({});
    setBusy(true);
    try {
      await uploadEvidence(matterId, {
        file,
        category: evidenceForm.category,
        label: evidenceForm.label,
        source: evidenceForm.source || undefined,
        summary: evidenceForm.summary || undefined,
        status: 'pending',
        confidence: 0.7,
      });
      setOpen(false);
      setEvidenceForm({ category: 'title', label: '', summary: '', source: '' });
      setFile(null);
      onAdded();
    } catch (e) {
      if (e instanceof ValidationError) {
        setErr("Couldn't save — see field errors");
        setFieldErrors(e.fieldErrors);
      } else {
        setErr((e as Error).message);
      }
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-semibold"
        style={{ background: `${ACCENT}12`, border: `1px dashed ${ACCENT}40`, color: ACCENT }}
      >
        <Upload className="w-3 h-3" /> Attach Evidence Document
      </button>
    );
  }
  return (
    <div
      className="rounded-lg p-3 space-y-2"
      style={{ background: 'rgba(64,133,106,0.06)', border: `1px solid ${ACCENT}30` }}
    >
      <div className="grid grid-cols-2 gap-2">
        <div>
          <select
            value={evidenceForm.category}
            onChange={(e) => setEvidenceForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full px-2 py-1 text-[11px] rounded"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: `1px solid ${fieldErrors.category ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
              color: '#e8edf8',
            }}
          >
            {Object.keys(CATEGORY_COLORS).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <FieldErrorInline errors={fieldErrors.category} />
        </div>
        <div>
          <input
            value={evidenceForm.label}
            onChange={(e) => setEvidenceForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="Label (e.g. Title Commitment)"
            className="w-full px-2 py-1 text-[11px] rounded"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: `1px solid ${fieldErrors.label ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
              color: '#e8edf8',
            }}
          />
          <FieldErrorInline errors={fieldErrors.label} />
        </div>
      </div>
      <div>
        <input
          value={evidenceForm.source}
          onChange={(e) => setEvidenceForm((f) => ({ ...f, source: e.target.value }))}
          placeholder="Source (e.g. Chicago Title Insurance)"
          className="w-full px-2 py-1 text-[11px] rounded"
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: `1px solid ${fieldErrors.source ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
            color: '#e8edf8',
          }}
        />
        <FieldErrorInline errors={fieldErrors.source} />
      </div>
      <div>
        <textarea
          value={evidenceForm.summary}
          onChange={(e) => setEvidenceForm((f) => ({ ...f, summary: e.target.value }))}
          placeholder="Summary / findings"
          rows={2}
          className="w-full px-2 py-1 text-[11px] rounded"
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: `1px solid ${fieldErrors.summary ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
            color: '#e8edf8',
          }}
        />
        <FieldErrorInline errors={fieldErrors.summary} />
      </div>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        accept=".pdf,.docx,.doc,.txt,.csv,.xlsx,.xls,.png,.jpg,.jpeg"
        className="w-full text-[10px]"
        style={{ color: 'rgba(255,255,255,0.6)' }}
      />
      {err && (
        <div className="text-[10px]" style={{ color: '#ef4444' }}>
          {err}
        </div>
      )}
      <div className="flex gap-2">
        <button
          disabled={busy || evidenceForm.label.length < 2}
          onClick={submit}
          className="flex-1 py-1 text-[10px] font-semibold rounded disabled:opacity-50"
          style={{ background: ACCENT, color: '#0a0f0c' }}
        >
          {busy ? 'Uploading…' : 'Attach'}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="px-3 py-1 text-[10px] rounded"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function DiligenceRoomPage() {
  const [selectedMatterId, setSelectedMatterId] = useState<string | undefined>(undefined);
  const { data, isLoading, refetch } = useStandardQuery({
    queryKey: ['terra-diligence-room', selectedMatterId],
    queryFn: () => fetchDiligenceRoom(selectedMatterId),
  });

  const matter = data?.matter;
  const allMatters: any[] = data?.allMatters ?? [];
  const prov = data?.provenance;
  const chainSummary = matter?.chainSummary;

  const stageMap: Record<string, string> = {
    pre_diligence: 'Pre-Diligence',
    title_review: 'Title Review',
    environmental: 'Environmental',
    financial_audit: 'Financial Audit',
    legal_review: 'Legal Review',
    final_approval: 'IC Sign-Off',
  };

  return (
    <div style={{ padding: '28px 28px 40px', maxWidth: 1280, margin: '0 auto' }}>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4" style={{ color: ACCENT }} />
            <h1 className="text-xl font-semibold" style={{ color: '#e8edf8' }}>
              Diligence Room
            </h1>
          </div>
          <p className="text-sm" style={{ color: '#94a3b8' }}>
            Evidence chain per diligence matter — documents, citations, freshness, and confidence
            scores with full provenance.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}30`, color: ACCENT }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div
            className="w-5 h-5 border-2 rounded-full animate-spin"
            style={{ borderColor: `${ACCENT}30`, borderTopColor: ACCENT }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-4">
            <div
              className="rounded-xl p-4"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                className="text-xs font-semibold mb-3 uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                Active Matters
              </div>
              <NewMatterForm
                onCreated={(id) => {
                  setSelectedMatterId(id);
                  refetch();
                }}
              />
              {allMatters.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMatterId(m.id)}
                  className="w-full text-left rounded-lg p-3 mb-2 transition-all"
                  style={{
                    background:
                      (selectedMatterId ?? matter?.id) === m.id
                        ? `${ACCENT}15`
                        : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${(selectedMatterId ?? matter?.id) === m.id ? `${ACCENT}40` : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <div className="text-xs font-medium" style={{ color: '#e8edf8' }}>
                    {m.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-[9px] font-mono"
                      style={{ color: 'rgba(255,255,255,0.3)' }}
                    >
                      {stageMap[m.stage] ?? m.stage}
                    </span>
                    <div
                      className="flex-1 h-1 rounded-full overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${m.completionPct}%`, background: ACCENT }}
                      />
                    </div>
                    <span className="text-[9px] font-mono" style={{ color: ACCENT }}>
                      {m.completionPct}%
                    </span>
                  </div>
                  <div className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    Target close: {m.targetClose}
                  </div>
                </button>
              ))}
            </div>

            {chainSummary && (
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="text-xs font-semibold mb-3 uppercase tracking-wider"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  Chain Summary
                </div>
                {[
                  {
                    label: 'Verified',
                    value: chainSummary.verified,
                    color: '#40856a',
                    Icon: CheckCircle,
                  },
                  {
                    label: 'In Review',
                    value: chainSummary.inReview,
                    color: '#4a7dc8',
                    Icon: Clock,
                  },
                  {
                    label: 'Pending',
                    value: chainSummary.pending,
                    color: '#c8a060',
                    Icon: AlertCircle,
                  },
                  {
                    label: 'Avg Confidence',
                    value: `${(chainSummary.avgConfidence * 100).toFixed(0)}%`,
                    color: ACCENT,
                    Icon: Shield,
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="flex items-center gap-2 py-2"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <m.Icon className="w-3 h-3" style={{ color: m.color }} />
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {m.label}
                    </span>
                    <span
                      className="ml-auto text-xs font-mono font-semibold"
                      style={{ color: m.color }}
                    >
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div
              className="rounded-xl p-4"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                className="text-xs font-semibold mb-3 uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                Category Legend
              </div>
              {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                <div
                  key={cat}
                  className="flex items-center gap-2 py-1.5"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: color }} />
                  <span
                    className="text-[10px] capitalize"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    {cat}
                  </span>
                </div>
              ))}
            </div>

            {prov && (
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                  <span
                    className="text-xs font-semibold"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    Provenance
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <ConfidencePill value={prov.confidence} />
                </div>
                <div
                  className="text-[10px] font-mono mb-1"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  {prov.source}
                </div>
                <div className="text-[9px]" style={{ color: 'rgba(64,133,106,0.5)' }}>
                  {prov.traceRef}
                </div>
                <div className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  {prov.runtime}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-3">
            {matter && (
              <>
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="text-base font-semibold" style={{ color: '#e8edf8' }}>
                        {matter.title}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-mono"
                          style={{ background: `${ACCENT}18`, color: ACCENT }}
                        >
                          {stageMap[matter.stage] ?? matter.stage}
                        </span>
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          Opened: {matter.opened}
                        </span>
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          Target close: {matter.targetClose}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-bold font-mono" style={{ color: ACCENT }}>
                        {matter.completionPct}%
                      </div>
                      <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        complete
                      </div>
                    </div>
                  </div>
                  <div
                    className="mt-3 h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${matter.completionPct}%`, background: ACCENT }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {matter.evidenceChain?.map((ev: any, i: number) => (
                    <EvidenceCard
                      key={ev.id}
                      evidence={ev}
                      index={i}
                      onStatusChange={
                        matter.source === 'diligence-db'
                          ? async (next: string) => {
                              await updateEvidenceStatus(ev.id, next);
                              refetch();
                            }
                          : undefined
                      }
                      onAddCitation={
                        matter.source === 'diligence-db'
                          ? async (citation: EvidenceCitation) => {
                              const existing: EvidenceCitation[] = Array.isArray(ev.citations)
                                ? ev.citations
                                : [];
                              await updateEvidenceCitations(ev.id, [...existing, citation]);
                              refetch();
                            }
                          : undefined
                      }
                      onEditCitation={
                        matter.source === 'diligence-db'
                          ? async (citIndex: number, updated: EvidenceCitation) => {
                              const existing: EvidenceCitation[] = Array.isArray(ev.citations)
                                ? [...ev.citations]
                                : [];
                              existing[citIndex] = updated;
                              await updateEvidenceCitations(ev.id, existing);
                              refetch();
                            }
                          : undefined
                      }
                      onRemoveCitation={
                        matter.source === 'diligence-db'
                          ? async (citIndex: number) => {
                              const existing: EvidenceCitation[] = Array.isArray(ev.citations)
                                ? [...ev.citations]
                                : [];
                              existing.splice(citIndex, 1);
                              await updateEvidenceCitations(ev.id, existing);
                              refetch();
                            }
                          : undefined
                      }
                    />
                  ))}
                </div>

                {matter.source === 'diligence-db' && (
                  <AddEvidenceForm matterId={matter.id} onAdded={() => refetch()} />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
