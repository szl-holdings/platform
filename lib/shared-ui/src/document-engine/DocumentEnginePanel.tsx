import {
  AlertCircle,
  BookOpen,
  CheckCircle,
  ChevronRight,
  Clock,
  Download,
  Edit3,
  Eye,
  FileText,
  History,
  Layers,
  MessageSquare,
  Pen,
  Plus,
  Printer,
  Save,
  Search,
  Send,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../utils';
import { createEmptyDocument, DocumentEditor, type DocumentEditorContent } from './editor';
import { DOCUMENT_TEMPLATES } from './templates';
import type { AppSource, DocumentRecord, DocumentTemplate, DocumentVersionMeta } from './types';

const BASE_URL = typeof window !== 'undefined' ? (window as any).__REPLIT_BASE_URL || '' : '';

function apiUrl(path: string) {
  return `${BASE_URL}/api${path}`;
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(apiUrl(path), {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    color: 'text-slate-400',
    bg: 'bg-slate-500/10 border-slate-500/20',
    icon: Edit3,
  },
  review: {
    label: 'In Review',
    color: 'text-[#d4a054]',
    bg: 'bg-[#d4a054]/10 border-[#d4a054]/20',
    icon: Clock,
  },
  approved: {
    label: 'Approved',
    color: 'text-[#6b8f71]',
    bg: 'bg-[#6b8f71]/10 border-[#6b8f71]/20',
    icon: CheckCircle,
  },
  signed: {
    label: 'Signed',
    color: 'text-[#4a90b8]',
    bg: 'bg-blue-500/10 border-blue-500/20',
    icon: CheckCircle,
  },
  archived: {
    label: 'Archived',
    color: 'text-slate-500',
    bg: 'bg-slate-600/10 border-slate-600/20',
    icon: XCircle,
  },
};

const SIG_CONFIG = {
  pending: { label: 'Pending', color: 'text-slate-400', icon: Clock },
  viewed: { label: 'Viewed', color: 'text-[#d4a054]', icon: Eye },
  signed: { label: 'Signed', color: 'text-[#6b8f71]', icon: CheckCircle },
  declined: { label: 'Declined', color: 'text-rose-400', icon: XCircle },
  expired: { label: 'Expired', color: 'text-slate-500', icon: AlertCircle },
};

interface DocumentEnginePanelProps {
  appSource?: AppSource;
  entityType?: string;
  entityId?: string;
  accentColor?: string;
  className?: string;
  isDemo?: boolean;
}

export function DocumentEnginePanel({
  appSource = 'general',
  entityType,
  entityId,
  accentColor = '#8b7ac8',
  className,
  isDemo = true,
}: DocumentEnginePanelProps) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [view, setView] = useState<'list' | 'editor' | 'sign' | 'versions' | 'comments'>('list');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editorContent, setEditorContent] = useState<DocumentEditorContent>(createEmptyDocument());
  const [showNewDoc, setShowNewDoc] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signerInputs, setSignerInputs] = useState([{ email: '', name: '' }]);
  const [saveMessage, setSaveMessage] = useState('');
  const [versions, setVersions] = useState<DocumentVersionMeta[]>([]);
  const [error, setError] = useState<string | null>(null);

  const appTemplates = DOCUMENT_TEMPLATES.filter(
    (t) => t.appSource === appSource || t.appSource === 'general',
  );

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ appSource });
      if (entityType) params.set('entityType', entityType);
      if (entityId) params.set('entityId', entityId);
      const data = await apiFetch(`/documents?${params}`);
      setDocuments(data.data || data || []);
    } catch {
      setDocuments(DEMO_DOCUMENTS.filter((d) => d.appSource === appSource));
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [appSource, entityType, entityId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const openDocument = useCallback(async (doc: DocumentRecord) => {
    setSelectedDoc(doc);
    setEditorContent(
      (doc.contentJson as unknown as DocumentEditorContent) || createEmptyDocument(),
    );
    setView('editor');
    try {
      const detail = await apiFetch(`/documents/${doc.id}`);
      setSelectedDoc(detail);
      setVersions(detail.versions || []);
    } catch {}
  }, []);

  const saveDocument = useCallback(async () => {
    if (!selectedDoc) return;
    setSaving(true);
    try {
      await apiFetch(`/documents/${selectedDoc.id}`, {
        method: 'PUT',
        body: JSON.stringify({ contentJson: editorContent, changeNote: 'Manual save' }),
      });
      setSaveMessage('Saved');
      setTimeout(() => setSaveMessage(''), 2000);
    } catch {
      setSaveMessage('Failed to save');
    } finally {
      setSaving(false);
    }
  }, [selectedDoc, editorContent]);

  const createDocument = useCallback(async () => {
    if (!newDocTitle) return;
    setSaving(true);
    try {
      const templateDef = selectedTemplate
        ? DOCUMENT_TEMPLATES.find((t) => t.slug === selectedTemplate)
        : null;
      const content = templateDef ? templateDef.content : createEmptyDocument();
      const data = await apiFetch('/documents', {
        method: 'POST',
        body: JSON.stringify({
          title: newDocTitle,
          appSource,
          contentJson: content,
          templateId: selectedTemplate || undefined,
          entityType: entityType || undefined,
          entityId: entityId || undefined,
        }),
      });
      setDocuments((prev) => [data, ...prev]);
      setShowNewDoc(false);
      setNewDocTitle('');
      setSelectedTemplate(null);
      openDocument(data);
    } catch {
      const tempDoc: DocumentRecord = {
        id: Date.now(),
        title: newDocTitle,
        type: 'general',
        templateId: selectedTemplate,
        contentJson: selectedTemplate
          ? (DOCUMENT_TEMPLATES.find((t) => t.slug === selectedTemplate)
              ?.content as unknown as Record<string, unknown>) || {}
          : {},
        status: 'draft',
        ownerId: null,
        appSource,
        entityType: entityType || null,
        entityId: entityId || null,
        mergeFieldValues: {},
        isDemo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setDocuments((prev) => [tempDoc, ...prev]);
      setShowNewDoc(false);
      setNewDocTitle('');
      openDocument(tempDoc);
    } finally {
      setSaving(false);
    }
  }, [newDocTitle, selectedTemplate, appSource, entityType, entityId, openDocument]);

  const requestSignatures = useCallback(async () => {
    if (!selectedDoc || signerInputs.some((s) => !s.email || !s.name)) return;
    setSaving(true);
    try {
      await apiFetch(`/documents/${selectedDoc.id}/sign`, {
        method: 'POST',
        body: JSON.stringify({ signers: signerInputs }),
      });
      setShowSignModal(false);
      setSignerInputs([{ email: '', name: '' }]);
      setSaveMessage('Signature requests sent');
      setTimeout(() => setSaveMessage(''), 3000);
      openDocument(selectedDoc);
    } catch {
      setSaveMessage('Signature request created (demo)');
      setShowSignModal(false);
      setTimeout(() => setSaveMessage(''), 2000);
    } finally {
      setSaving(false);
    }
  }, [selectedDoc, signerInputs, openDocument]);

  const filtered = documents.filter((d) => {
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: documents.length,
    draft: documents.filter((d) => d.status === 'draft').length,
    review: documents.filter((d) => d.status === 'review').length,
    signed: documents.filter((d) => d.status === 'signed').length,
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {view === 'list' && (
        <div className="flex flex-col h-full space-y-4 p-6 overflow-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-display font-bold text-white">Document Engine</h2>
              <p className="text-xs text-white/50 mt-0.5">
                WYSIWYG editor, e-signatures, and PDF generation
              </p>
            </div>
            <button
              onClick={() => setShowNewDoc(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-80"
              style={{ background: accentColor }}
            >
              <Plus className="w-3.5 h-3.5" /> New Document
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total', value: stats.total, color: 'text-white' },
              { label: 'Draft', value: stats.draft, color: 'text-slate-400' },
              { label: 'In Review', value: stats.review, color: 'text-[#d4a054]' },
              { label: 'Signed', value: stats.signed, color: 'text-[#6b8f71]' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] text-white/40 uppercase tracking-wider">{s.label}</p>
                <p className={cn('text-2xl font-display font-bold mt-1', s.color)}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documents..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="review">In Review</option>
              <option value="approved">Approved</option>
              <option value="signed">Signed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32 text-white/40 text-sm">
              Loading documents...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-white/40 text-sm gap-2">
              <FileText className="w-8 h-8 opacity-30" />
              <p>No documents yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((doc) => {
                const cfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.draft;
                const StatusIcon = cfg.icon;
                return (
                  <div
                    key={doc.id}
                    onClick={() => openDocument(doc)}
                    className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-white/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{doc.title}</p>
                      <p className="text-[10px] text-white/40 mt-0.5 capitalize">
                        {doc.type.replace(/_/g, ' ')} ·{' '}
                        {new Date(doc.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold flex-shrink-0',
                        cfg.bg,
                        cfg.color,
                      )}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {view === 'editor' && selectedDoc && (
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5 flex-shrink-0">
            <button
              onClick={() => setView('list')}
              className="text-white/50 hover:text-white text-xs flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Close
            </button>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{selectedDoc.title}</p>
              <p className="text-[10px] text-white/40 capitalize">
                {selectedDoc.type.replace(/_/g, ' ')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {saveMessage && <span className="text-xs text-[#6b8f71]">{saveMessage}</span>}
              <button
                onClick={() => setView('versions')}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                title="Version history"
              >
                <History className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('comments')}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                title="Comments"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              <button
                onClick={saveDocument}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" /> Save
              </button>
              <button
                onClick={() => setShowSignModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-80"
                style={{ background: accentColor }}
              >
                <Pen className="w-3.5 h-3.5" /> Request Signatures
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <DocumentEditor
              content={
                (selectedDoc.contentJson as unknown as DocumentEditorContent)?.blocks
                  ? (selectedDoc.contentJson as unknown as DocumentEditorContent)
                  : editorContent
              }
              onChange={setEditorContent}
              appSource={appSource}
              className="h-full"
              themeColor={accentColor}
            />
          </div>

          {selectedDoc.signatures && selectedDoc.signatures.length > 0 && (
            <div className="border-t border-white/10 p-4 flex-shrink-0">
              <p className="text-xs font-semibold text-white/60 mb-2 flex items-center gap-1">
                <Pen className="w-3 h-3" /> Signature Status
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedDoc.signatures.map((sig) => {
                  const cfg = SIG_CONFIG[sig.status] || SIG_CONFIG.pending;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={sig.id}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs"
                    >
                      <Icon className={cn('w-3 h-3', cfg.color)} />
                      <span className="text-white/70">{sig.signerName}</span>
                      <span className={cn('text-[10px]', cfg.color)}>{cfg.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'versions' && selectedDoc && (
        <VersionsPanel
          doc={selectedDoc}
          versions={versions}
          onBack={() => setView('editor')}
          accentColor={accentColor}
        />
      )}

      {view === 'comments' && selectedDoc && (
        <CommentsPanel
          doc={selectedDoc}
          onBack={() => setView('editor')}
          accentColor={accentColor}
        />
      )}

      {showNewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/20 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-display font-bold text-white">New Document</h3>
              <button onClick={() => setShowNewDoc(false)}>
                <X className="w-4 h-4 text-white/50" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/60 mb-1.5 block">Document Title</label>
                <input
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Enter document title..."
                  className="w-full px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-sm text-white placeholder:text-white/30 focus:outline-none"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && createDocument()}
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1.5 block">
                  Start from Template (optional)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className={cn(
                      'text-left p-3 rounded-lg border text-xs transition-colors',
                      !selectedTemplate
                        ? 'border-indigo-500/50 bg-indigo-500/10 text-white'
                        : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10',
                    )}
                  >
                    <BookOpen className="w-4 h-4 mb-1 opacity-60" />
                    <p className="font-medium">Blank Document</p>
                  </button>
                  {appTemplates.map((t) => (
                    <button
                      key={t.slug}
                      onClick={() => setSelectedTemplate(t.slug)}
                      className={cn(
                        'text-left p-3 rounded-lg border text-xs transition-colors',
                        selectedTemplate === t.slug
                          ? 'border-indigo-500/50 bg-indigo-500/10 text-white'
                          : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10',
                      )}
                    >
                      <FileText className="w-4 h-4 mb-1 opacity-60" />
                      <p className="font-medium">{t.title}</p>
                      <p className="text-[10px] opacity-60 mt-0.5 line-clamp-1">{t.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowNewDoc(false)}
                className="px-4 py-1.5 rounded-lg text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createDocument}
                disabled={!newDocTitle || saving}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-80 disabled:opacity-40"
                style={{ background: accentColor }}
              >
                {saving ? 'Creating...' : 'Create Document'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/20 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-display font-bold text-white">Request Signatures</h3>
              <button onClick={() => setShowSignModal(false)}>
                <X className="w-4 h-4 text-white/50" />
              </button>
            </div>
            <p className="text-xs text-white/50 mb-4">
              Add up to 5 signers. They'll receive a signing link.
            </p>
            <div className="space-y-3">
              {signerInputs.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={s.name}
                    onChange={(e) =>
                      setSignerInputs((prev) =>
                        prev.map((p, pi) => (pi === i ? { ...p, name: e.target.value } : p)),
                      )
                    }
                    placeholder="Full name"
                    className="flex-1 px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-xs text-white placeholder:text-white/30 focus:outline-none"
                  />
                  <input
                    value={s.email}
                    onChange={(e) =>
                      setSignerInputs((prev) =>
                        prev.map((p, pi) => (pi === i ? { ...p, email: e.target.value } : p)),
                      )
                    }
                    placeholder="Email address"
                    className="flex-1 px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-xs text-white placeholder:text-white/30 focus:outline-none"
                  />
                  {signerInputs.length > 1 && (
                    <button
                      onClick={() => setSignerInputs((prev) => prev.filter((_, pi) => pi !== i))}
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {signerInputs.length < 5 && (
                <button
                  onClick={() => setSignerInputs((prev) => [...prev, { email: '', name: '' }])}
                  className="text-xs text-white/50 hover:text-white flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add signer
                </button>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowSignModal(false)}
                className="px-4 py-1.5 rounded-lg text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={requestSignatures}
                disabled={saving || signerInputs.some((s) => !s.email || !s.name)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-80 disabled:opacity-40"
                style={{ background: accentColor }}
              >
                {saving ? 'Sending...' : 'Send for Signing'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VersionsPanel({
  doc,
  versions,
  onBack,
  accentColor,
}: {
  doc: DocumentRecord;
  versions: DocumentVersionMeta[];
  onBack: () => void;
  accentColor: string;
}) {
  return (
    <div className="flex flex-col h-full p-6 space-y-4 overflow-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-white/50 hover:text-white text-xs flex items-center gap-1"
        >
          <X className="w-3.5 h-3.5" /> Back
        </button>
        <h3 className="text-base font-display font-bold text-white">Version History</h3>
      </div>
      {versions.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-white/40 text-sm">
          No versions yet.
        </div>
      ) : (
        <div className="space-y-2">
          {versions.map((v) => (
            <div
              key={v.id}
              className="flex items-center gap-4 p-3 rounded-xl border border-white/10 bg-white/5"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/60">
                {v.version}
              </div>
              <div className="flex-1">
                <p className="text-sm text-white/80">{v.changeNote || 'Updated'}</p>
                <p className="text-[10px] text-white/40">
                  {new Date(v.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentsPanel({
  doc,
  onBack,
  accentColor,
}: {
  doc: DocumentRecord;
  onBack: () => void;
  accentColor: string;
}) {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<
    Array<{ id: number; authorName: string; content: string; resolved: boolean; createdAt: string }>
  >(doc.comments || []);

  const postComment = async () => {
    if (!comment.trim()) return;
    const newComment = {
      id: Date.now(),
      authorName: 'You',
      content: comment,
      resolved: false,
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [newComment, ...prev]);
    try {
      await fetch(`/api/documents/${doc.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: comment, authorName: 'You' }),
      });
    } catch {}
    setComment('');
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-4 overflow-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-white/50 hover:text-white text-xs flex items-center gap-1"
        >
          <X className="w-3.5 h-3.5" /> Back
        </button>
        <h3 className="text-base font-display font-bold text-white">Comments</h3>
      </div>
      <div className="flex gap-2">
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-sm text-white placeholder:text-white/30 focus:outline-none"
          onKeyDown={(e) => e.key === 'Enter' && postComment()}
        />
        <button
          onClick={postComment}
          className="px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-80"
          style={{ background: accentColor }}
        >
          Post
        </button>
      </div>
      {comments.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-white/40 text-sm">
          No comments yet.
        </div>
      ) : (
        <div className="space-y-2">
          {comments.map((c) => (
            <div
              key={c.id}
              className={cn(
                'p-3 rounded-xl border',
                c.resolved ? 'border-white/5 bg-white/3 opacity-60' : 'border-white/10 bg-white/5',
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-white/70">{c.authorName}</span>
                <span className="text-[10px] text-white/30">
                  {new Date(c.createdAt).toLocaleString()}
                </span>
                {c.resolved && <span className="text-[10px] text-[#6b8f71] ml-auto">Resolved</span>}
              </div>
              <p className="text-xs text-white/60">{c.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const DEMO_DOCUMENTS: DocumentRecord[] = [
  {
    id: 1,
    title: 'Q1 Deal Memo — 123 Main Street',
    type: 'deal_memo',
    templateId: 'terra-deal-memo',
    contentJson: {},
    status: 'signed',
    ownerId: 1,
    appSource: 'terra',
    entityType: 'property',
    entityId: 'prop_001',
    mergeFieldValues: {},
    isDemo: true,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-20T14:30:00Z',
  },
  {
    id: 2,
    title: 'Engagement Letter — Meridian Capital Group',
    type: 'engagement_letter',
    templateId: 'carlota-engagement-letter',
    contentJson: {},
    status: 'review',
    ownerId: 1,
    appSource: 'carlota_jo',
    entityType: null,
    entityId: null,
    mergeFieldValues: {},
    isDemo: true,
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-02-05T11:00:00Z',
  },
  {
    id: 3,
    title: 'Incident Report — API Gateway Breach',
    type: 'incident_report',
    templateId: 'aegis-incident-report',
    contentJson: {},
    status: 'approved',
    ownerId: 1,
    appSource: 'aegis',
    entityType: 'incident',
    entityId: 'inc_042',
    mergeFieldValues: {},
    isDemo: true,
    createdAt: '2026-02-10T08:00:00Z',
    updatedAt: '2026-02-12T16:00:00Z',
  },
  {
    id: 4,
    title: 'Voyage Report — MV Atlantic Pioneer',
    type: 'voyage_report',
    templateId: 'vessels-voyage-report',
    contentJson: {},
    status: 'draft',
    ownerId: 1,
    appSource: 'vessels',
    entityType: 'voyage',
    entityId: 'voy_2026_001',
    mergeFieldValues: {},
    isDemo: true,
    createdAt: '2026-03-01T07:00:00Z',
    updatedAt: '2026-03-05T09:00:00Z',
  },
  {
    id: 5,
    title: 'NDA — Blackwood Ventures',
    type: 'nda',
    templateId: 'carlota-nda',
    contentJson: {},
    status: 'draft',
    ownerId: 1,
    appSource: 'carlota_jo',
    entityType: null,
    entityId: null,
    mergeFieldValues: {},
    isDemo: true,
    createdAt: '2026-03-10T10:00:00Z',
    updatedAt: '2026-03-10T10:00:00Z',
  },
  {
    id: 6,
    title: 'Workflow Approval — CRM Integration v3',
    type: 'workflow_approval_memo',
    templateId: 'alloy-approval-memo',
    contentJson: {},
    status: 'review',
    ownerId: 1,
    appSource: 'alloy',
    entityType: 'workflow',
    entityId: 'wf_crm_v3',
    mergeFieldValues: {},
    isDemo: true,
    createdAt: '2026-03-15T14:00:00Z',
    updatedAt: '2026-03-18T11:00:00Z',
  },
  {
    id: 7,
    title: 'Charter Party — Pacific Navigator',
    type: 'charter_party',
    templateId: 'vessels-charter-party',
    contentJson: {},
    status: 'signed',
    ownerId: 1,
    appSource: 'vessels',
    entityType: 'vessel',
    entityId: 'ves_005',
    mergeFieldValues: {},
    isDemo: true,
    createdAt: '2026-01-25T09:00:00Z',
    updatedAt: '2026-02-01T15:00:00Z',
  },
  {
    id: 8,
    title: 'Vulnerability Assessment — Q1 2026',
    type: 'vulnerability_assessment',
    templateId: 'aegis-vulnerability-assessment',
    contentJson: {},
    status: 'approved',
    ownerId: 1,
    appSource: 'aegis',
    entityType: null,
    entityId: null,
    mergeFieldValues: {},
    isDemo: true,
    createdAt: '2026-01-05T10:00:00Z',
    updatedAt: '2026-01-20T16:00:00Z',
  },
];

export default DocumentEnginePanel;
