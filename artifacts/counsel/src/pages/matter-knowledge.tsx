import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  ExternalLink,
  FileText,
  GitBranch,
  Loader2,
  Network,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

const ACCENT = '#8b5cf6';

// --- Types ---

interface KnowledgeDocument {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: 'pending' | 'indexing' | 'indexed' | 'error';
  errorMessage?: string | null;
  chunkCount: number;
  entityCount: number;
  createdAt: string;
  indexedAt?: string | null;
}

interface KnowledgeStatus {
  totalDocuments: number;
  indexedDocuments: number;
  pendingDocuments: number;
  errorDocuments: number;
  totalChunks: number;
  totalEntities: number;
  totalRelations: number;
}

interface KnowledgeEntity {
  id: number;
  name: string;
  type: string;
  description?: string | null;
  mentionCount: number;
}

interface KnowledgeRelation {
  id: number;
  subjectEntity: string;
  predicate: string;
  objectEntity: string;
  description?: string | null;
}

interface Citation {
  chunkId?: number;
  documentId: number;
  fileName: string;
  chunkIndex: number;
  sectionHint?: string | null;
  excerpt: string;
}

interface ChunkDetail {
  id: number;
  documentId: number;
  chunkIndex: number;
  content: string;
  sectionHint?: string | null;
  startChar: number;
  endChar: number;
  fileName: string;
}

interface QueryResponse {
  answer: string;
  citations: Citation[];
  queryId?: number;
}

interface PastQuery {
  id: number;
  question: string;
  answer?: string | null;
  citations: Citation[];
  status: 'pending' | 'answered' | 'error';
  createdAt: string;
}

interface Matter {
  id: string;
  name: string;
  status: string;
  type: string;
}

// --- Utility ---

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_CONFIG = {
  pending: { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', label: 'Pending', icon: Clock },
  indexing: { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', label: 'Indexing…', icon: Loader2 },
  indexed: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', label: 'Indexed', icon: CheckCircle2 },
  error: { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20', label: 'Error', icon: AlertTriangle },
};

const ENTITY_COLORS: Record<string, string> = {
  PARTY: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  PERSON: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  ORGANIZATION: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  DATE: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  OBLIGATION: 'text-red-400 bg-red-400/10 border-red-400/20',
  CLAIM: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  JURISDICTION: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  AMOUNT: 'text-green-400 bg-green-400/10 border-green-400/20',
  DOCUMENT: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
  COURT: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  REGULATION: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
};

// --- Sub-components ---

function StatusBadge({ status }: { status: KnowledgeDocument['status'] }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider border', cfg.color, cfg.bg, cfg.border)}>
      <Icon className={cn('w-2.5 h-2.5', status === 'indexing' && 'animate-spin')} />
      {cfg.label}
    </span>
  );
}

function EntityBadge({ type }: { type: string }) {
  const cls = ENTITY_COLORS[type] ?? 'text-slate-400 bg-slate-400/10 border-slate-400/20';
  return (
    <span className={cn('inline-flex px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider border', cls)}>
      {type}
    </span>
  );
}

function MatterSelector({
  matters,
  selected,
  onSelect,
}: {
  matters: Matter[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedMatter = matters.find((m) => m.id === selected);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors"
        style={{ background: 'rgba(139,92,246,0.06)', borderColor: 'rgba(139,92,246,0.2)', color: '#ede9fe' }}
      >
        <BookOpen className="w-3.5 h-3.5 text-violet-400" />
        <span className="truncate max-w-[200px]">
          {selectedMatter ? selectedMatter.name : 'Select a matter…'}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-violet-400/50 ml-1" />
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-1 w-72 rounded-xl border shadow-2xl z-50 overflow-hidden"
          style={{ background: '#130f24', borderColor: 'rgba(139,92,246,0.2)' }}
        >
          {matters.map((m) => (
            <button
              key={m.id}
              onClick={() => { onSelect(m.id); setOpen(false); }}
              className={cn(
                'w-full text-left px-3 py-2.5 text-xs transition-colors',
                selected === m.id ? 'bg-violet-500/10 text-violet-300' : 'text-white/70 hover:bg-white/5',
              )}
            >
              <div className="font-medium truncate">{m.name}</div>
              <div className="text-[10px] text-white/30 font-mono mt-0.5">{m.id} · {m.type}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function IndexStatusBar({ status }: { status: KnowledgeStatus | undefined }) {
  if (!status) return null;
  const { totalDocuments, indexedDocuments, pendingDocuments, totalEntities, totalRelations, totalChunks } = status;

  return (
    <div
      className="grid grid-cols-3 gap-3 p-4 rounded-xl border"
      style={{ background: 'rgba(139,92,246,0.04)', borderColor: 'rgba(139,92,246,0.1)' }}
    >
      <div>
        <div className="text-[9px] uppercase tracking-widest text-violet-400/50 mb-1">Documents</div>
        <div className="text-lg font-semibold text-violet-100">{indexedDocuments}<span className="text-xs text-white/30 font-normal">/{totalDocuments}</span></div>
        <div className="text-[9px] text-white/30">indexed</div>
        {pendingDocuments > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Loader2 className="w-2.5 h-2.5 text-blue-400 animate-spin" />
            <span className="text-[9px] text-blue-400">{pendingDocuments} processing</span>
          </div>
        )}
      </div>
      <div>
        <div className="text-[9px] uppercase tracking-widest text-violet-400/50 mb-1">Entities</div>
        <div className="text-lg font-semibold text-violet-100">{totalEntities}</div>
        <div className="text-[9px] text-white/30">extracted</div>
      </div>
      <div>
        <div className="text-[9px] uppercase tracking-widest text-violet-400/50 mb-1">Relations</div>
        <div className="text-lg font-semibold text-violet-100">{totalRelations}</div>
        <div className="text-[9px] text-white/30">{totalChunks} chunks</div>
      </div>
    </div>
  );
}

function DocumentCard({
  doc,
  onDelete,
}: {
  doc: KnowledgeDocument;
  onDelete: (id: number) => void;
}) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl border group transition-all hover:border-violet-500/20"
      style={{ background: 'rgba(139,92,246,0.03)', borderColor: 'rgba(139,92,246,0.1)' }}
    >
      <div className="mt-0.5 p-1.5 rounded-lg" style={{ background: 'rgba(139,92,246,0.08)' }}>
        <FileText className="w-3.5 h-3.5 text-violet-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-violet-100 truncate">{doc.fileName}</p>
            <p className="text-[9px] text-white/30 mt-0.5 font-mono">
              {formatFileSize(doc.fileSize)} · {doc.chunkCount} chunks · {doc.entityCount} entities
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={doc.status} />
            <button
              onClick={() => onDelete(doc.id)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all hover:bg-red-500/10 text-red-400/50 hover:text-red-400"
              title="Remove document"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
        {doc.errorMessage && (
          <p className="text-[9px] text-red-400 mt-1">{doc.errorMessage}</p>
        )}
        {doc.indexedAt && (
          <p className="text-[9px] text-white/20 mt-0.5">Indexed {formatDate(doc.indexedAt)}</p>
        )}
      </div>
    </div>
  );
}

function UploadZone({
  matterId,
  onSuccess,
}: {
  matterId: string;
  onSuccess: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList) => {
      if (!files.length) return;
      setUploading(true);
      setError(null);
      for (const file of Array.from(files)) {
        try {
          const formData = new FormData();
          formData.append('document', file);
          const baseUrl = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
          const res = await fetch(`${baseUrl}/counsel-knowledge/${matterId}/upload`, {
            method: 'POST',
            body: formData,
          });
          if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            throw new Error((json as { error?: string }).error ?? `Upload failed: ${res.status}`);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
      setUploading(false);
      onSuccess();
    },
    [matterId, onSuccess],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  return (
    <div>
      <div
        className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer',
          dragging
            ? 'border-violet-500/60 bg-violet-500/10'
            : 'border-violet-500/20 hover:border-violet-500/40 hover:bg-violet-500/5',
        )}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".txt,.pdf,.docx"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
            <p className="text-xs text-violet-300">Uploading documents…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-6 h-6 text-violet-400/50" />
            <p className="text-xs text-white/60">Drop PDF, DOCX, or TXT files here</p>
            <p className="text-[9px] text-white/30">or click to browse · max 20MB per file</p>
          </div>
        )}
      </div>
      {error && (
        <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
}

function ChunkSourceModal({
  matterId,
  citation,
  sourceIndex,
  onClose,
}: {
  matterId: string;
  citation: Citation;
  sourceIndex: number;
  onClose: () => void;
}) {
  const { data, isLoading, isError } = useQuery<{ data: ChunkDetail }>({
    queryKey: ['counsel-chunk', matterId, citation.chunkId],
    queryFn: () =>
      apiFetch<{ data: ChunkDetail }>(
        `/counsel-knowledge/${matterId}/chunks/${citation.chunkId!}`,
        { skipAuth: true },
      ),
    enabled: !!citation.chunkId,
  });

  const chunk = data?.data;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl border shadow-2xl"
        style={{ background: '#0f0b1e', borderColor: 'rgba(139,92,246,0.25)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: 'rgba(139,92,246,0.1)' }}
        >
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-violet-400" />
            <div>
              <div className="text-xs font-medium text-violet-100 truncate max-w-sm">
                Source {sourceIndex + 1} — {citation.fileName}
              </div>
              {citation.sectionHint && (
                <div className="text-[9px] text-white/30 font-mono mt-0.5">
                  Section: {citation.sectionHint}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Meta */}
        <div
          className="flex items-center gap-4 px-5 py-2 shrink-0 border-b"
          style={{ borderColor: 'rgba(139,92,246,0.06)' }}
        >
          <span className="text-[9px] font-mono text-violet-400/50">
            Chunk {citation.chunkIndex + 1}
          </span>
          {chunk && (
            <span className="text-[9px] font-mono text-white/20">
              chars {chunk.startChar}–{chunk.endChar}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
              Loading source…
            </div>
          )}
          {isError && (
            <div className="flex items-center gap-2 text-xs text-red-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              Failed to load chunk content.
            </div>
          )}
          {!isLoading && !isError && !citation.chunkId && (
            <p className="text-xs text-white/70 leading-relaxed italic">"{citation.excerpt}"</p>
          )}
          {chunk && (
            <pre
              className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap font-sans"
            >
              {chunk.content}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

function QueryPanel({
  matterId,
  pastQueries,
}: {
  matterId: string;
  pastQueries: PastQuery[];
}) {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCitations, setExpandedCitations] = useState<number | null>(null);
  const [openCitation, setOpenCitation] = useState<{ citation: Citation; index: number } | null>(null);

  const handleQuery = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const baseUrl = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/counsel-knowledge/${matterId}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const json = await res.json() as { data?: QueryResponse; error?: string };
      if (!res.ok) throw new Error(json.error ?? `Query failed: ${res.status}`);
      setResult(json.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const SAMPLE_QUESTIONS = [
    'What are the key obligations of each party?',
    'What are the termination conditions?',
    'What penalties or liabilities are mentioned?',
    'Who are the main parties and their roles?',
    'What are the key deadlines in this matter?',
  ];

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl border p-4"
        style={{ background: 'rgba(139,92,246,0.04)', borderColor: 'rgba(139,92,246,0.1)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs font-medium text-violet-300">Ask the Matter</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
            placeholder="What are the key obligations of each party?"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/40"
          />
          <button
            onClick={handleQuery}
            disabled={!question.trim() || loading}
            className="px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50 flex items-center gap-1.5"
            style={{ background: 'rgba(139,92,246,0.2)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.3)' }}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {loading ? 'Querying…' : 'Ask'}
          </button>
        </div>

        {/* Sample questions */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => setQuestion(q)}
              className="px-2 py-1 rounded-lg text-[9px] text-white/40 hover:text-violet-300 border border-white/10 hover:border-violet-500/30 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {/* Answer */}
      {result && (
        <div
          className="rounded-xl border p-4 space-y-3"
          style={{ background: 'rgba(139,92,246,0.06)', borderColor: 'rgba(139,92,246,0.15)' }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs font-medium text-violet-300">AI Answer</span>
          </div>
          <div className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap">{result.answer}</div>

          {/* Citations */}
          {result.citations.length > 0 && (
            <div>
              <button
                onClick={() => setExpandedCitations(expandedCitations === -1 ? null : -1)}
                className="flex items-center gap-1.5 text-[10px] text-violet-400/70 hover:text-violet-300 transition-colors"
              >
                <GitBranch className="w-3 h-3" />
                {result.citations.length} source{result.citations.length > 1 ? 's' : ''}
                {expandedCitations === -1 ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
              {expandedCitations === -1 && (
                <div className="mt-2 space-y-2">
                  {result.citations.map((c, i) => (
                    <div
                      key={i}
                      className="rounded-lg border p-3"
                      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(139,92,246,0.1)' }}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[9px] font-mono text-violet-400">Source {i + 1}</span>
                        <span className="text-[9px] text-white/50 truncate">{c.fileName}</span>
                        {c.sectionHint && (
                          <span className="text-[9px] text-white/30 truncate">· {c.sectionHint}</span>
                        )}
                        {c.chunkId && (
                          <button
                            onClick={() => setOpenCitation({ citation: c, index: i })}
                            className="ml-auto flex items-center gap-1 text-[9px] text-violet-400/60 hover:text-violet-300 transition-colors shrink-0"
                            title="View full source passage"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            View source
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-white/50 italic leading-relaxed">"{c.excerpt.slice(0, 200)}…"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Citation source modal */}
      {openCitation && (
        <ChunkSourceModal
          matterId={matterId}
          citation={openCitation.citation}
          sourceIndex={openCitation.index}
          onClose={() => setOpenCitation(null)}
        />
      )}

      {/* Past queries */}
      {pastQueries.length > 0 && (
        <div>
          <div className="text-[9px] uppercase tracking-widest text-white/20 mb-2">Recent Queries</div>
          <div className="space-y-2">
            {pastQueries.slice(0, 5).map((q) => (
              <div
                key={q.id}
                className="rounded-lg border p-3 cursor-pointer hover:border-violet-500/20 transition-colors"
                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
                onClick={() => { if (q.answer) { setQuestion(q.question); setResult({ answer: q.answer, citations: q.citations }); } }}
              >
                <p className="text-[10px] text-white/60">{q.question}</p>
                {q.answer && <p className="text-[9px] text-white/30 mt-1 line-clamp-2">{q.answer}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GraphPanel({ entities, relations }: { entities: KnowledgeEntity[]; relations: KnowledgeRelation[] }) {
  const [filter, setFilter] = useState('');
  const filtered = entities.filter(
    (e) => !filter || e.name.toLowerCase().includes(filter.toLowerCase()) || e.type.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="w-3.5 h-3.5 text-white/30" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter entities…"
          className="flex-1 bg-transparent text-xs text-white/70 placeholder:text-white/20 focus:outline-none"
        />
      </div>

      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {filtered.slice(0, 30).map((e) => (
          <div
            key={e.id}
            className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <EntityBadge type={e.type} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-white/80 truncate">{e.name}</span>
                <span className="text-[8px] font-mono text-white/20">{e.mentionCount}×</span>
              </div>
              {e.description && (
                <p className="text-[9px] text-white/30 truncate">{e.description}</p>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-white/30 text-center py-4">No entities match your filter</p>
        )}
      </div>

      {relations.length > 0 && (
        <>
          <div className="border-t border-white/5 pt-3">
            <div className="text-[9px] uppercase tracking-widest text-white/20 mb-2">Key Relationships</div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {relations.slice(0, 20).map((r) => (
                <div key={r.id} className="flex items-center gap-1.5 text-[10px]">
                  <span className="text-violet-300/70 truncate max-w-[100px]">{r.subjectEntity}</span>
                  <ChevronRight className="w-3 h-3 text-white/20 shrink-0" />
                  <span className="text-white/40 italic truncate max-w-[80px]">{r.predicate}</span>
                  <ChevronRight className="w-3 h-3 text-white/20 shrink-0" />
                  <span className="text-violet-300/70 truncate max-w-[100px]">{r.objectEntity}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// --- Main Page ---

export default function MatterKnowledgePage() {
  const queryClient = useQueryClient();
  const [selectedMatterId, setSelectedMatterId] = useState<string | null>('M-2024-001');
  const [activeTab, setActiveTab] = useState<'documents' | 'query' | 'graph'>('documents');
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);

  const { data: mattersData } = useQuery<{ matters: Matter[] }>({
    queryKey: ['counsel-matters-list'],
    queryFn: () => apiFetch<{ matters: Matter[] }>('/counsel/matters', { skipAuth: true }),
    staleTime: 60_000,
  });

  const matters = mattersData?.matters ?? [];
  const matterId = selectedMatterId ?? matters[0]?.id ?? 'M-2024-001';

  const { data: docsData, refetch: refetchDocs } = useQuery<{ data: KnowledgeDocument[] }>({
    queryKey: ['counsel-knowledge-documents', matterId],
    queryFn: () => apiFetch<{ data: KnowledgeDocument[] }>(`/counsel-knowledge/${matterId}/documents`, { skipAuth: true }),
    enabled: !!matterId,
    refetchInterval: (query) => {
      const docs = (query.state.data as { data?: KnowledgeDocument[] } | undefined)?.data ?? [];
      return docs.some((d) => d.status === 'indexing' || d.status === 'pending') ? 3000 : false;
    },
  });

  const { data: statusData } = useQuery<{ data: KnowledgeStatus }>({
    queryKey: ['counsel-knowledge-status', matterId],
    queryFn: () => apiFetch<{ data: KnowledgeStatus }>(`/counsel-knowledge/${matterId}/status`, { skipAuth: true }),
    enabled: !!matterId,
    refetchInterval: 5000,
  });

  const { data: entitiesData } = useQuery<{ data: KnowledgeEntity[] }>({
    queryKey: ['counsel-knowledge-entities', matterId],
    queryFn: () => apiFetch<{ data: KnowledgeEntity[] }>(`/counsel-knowledge/${matterId}/entities`, { skipAuth: true }),
    enabled: !!matterId && activeTab === 'graph',
  });

  const { data: relationsData } = useQuery<{ data: KnowledgeRelation[] }>({
    queryKey: ['counsel-knowledge-relations', matterId],
    queryFn: () => apiFetch<{ data: KnowledgeRelation[] }>(`/counsel-knowledge/${matterId}/relations`, { skipAuth: true }),
    enabled: !!matterId && activeTab === 'graph',
  });

  const { data: queriesData, refetch: refetchQueries } = useQuery<{ data: PastQuery[] }>({
    queryKey: ['counsel-knowledge-queries', matterId],
    queryFn: () => apiFetch<{ data: PastQuery[] }>(`/counsel-knowledge/${matterId}/queries`, { skipAuth: true }),
    enabled: !!matterId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (docId: number) => {
      const baseUrl = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/counsel-knowledge/${matterId}/documents/${docId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    },
    onSuccess: () => {
      refetchDocs();
      queryClient.invalidateQueries({ queryKey: ['counsel-knowledge-status', matterId] });
    },
  });

  const handleSeed = async () => {
    if (!matterId || seeding) return;
    setSeeding(true);
    setSeedError(null);
    try {
      const baseUrl = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/counsel-knowledge/${matterId}/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json() as { data?: { seeded: boolean; count?: number; message?: string }; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Seed failed');
      refetchDocs();
    } catch (err) {
      setSeedError(err instanceof Error ? err.message : String(err));
    } finally {
      setSeeding(false);
    }
  };

  const docs = docsData?.data ?? [];
  const status = statusData?.data;
  const entities = entitiesData?.data ?? [];
  const relations = relationsData?.data ?? [];
  const pastQueries = queriesData?.data ?? [];

  const TABS = [
    { id: 'documents' as const, label: 'Documents', icon: FileText },
    { id: 'query' as const, label: 'Query', icon: Brain },
    { id: 'graph' as const, label: 'Knowledge Graph', icon: Network },
  ];

  return (
    <div className="h-full flex flex-col" style={{ background: '#0a0614' }}>
      {/* Header */}
      <div
        className="shrink-0 px-6 py-4 border-b"
        style={{ borderColor: 'rgba(139,92,246,0.1)' }}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
            >
              <Brain className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-violet-50 tracking-tight">Matter Knowledge</h1>
              <p className="text-[10px] text-violet-400/40 font-mono uppercase tracking-wider">
                Graph + Vector Knowledge Index
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {matters.length > 0 && (
              <MatterSelector
                matters={matters}
                selected={selectedMatterId}
                onSelect={setSelectedMatterId}
              />
            )}
            {docs.length === 0 && (
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                style={{ background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.25)' }}
              >
                {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                {seeding ? 'Seeding…' : 'Load Sample Documents'}
              </button>
            )}
          </div>
        </div>
        {seedError && (
          <div className="mt-2 flex items-center gap-2 text-xs text-red-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            {seedError}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="shrink-0 px-6 py-3">
        <IndexStatusBar status={status} />
      </div>

      {/* Tabs */}
      <div
        className="shrink-0 px-6 border-b"
        style={{ borderColor: 'rgba(139,92,246,0.08)' }}
      >
        <div className="flex gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all',
                activeTab === id
                  ? 'border-violet-500 text-violet-300'
                  : 'border-transparent text-white/40 hover:text-white/60',
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {activeTab === 'documents' && (
          <div className="max-w-2xl space-y-4">
            <UploadZone matterId={matterId} onSuccess={() => { refetchDocs(); queryClient.invalidateQueries({ queryKey: ['counsel-knowledge-status', matterId] }); }} />
            {docs.length > 0 ? (
              <div className="space-y-2">
                <div className="text-[9px] uppercase tracking-widest text-white/20 mb-1">{docs.length} document{docs.length > 1 ? 's' : ''}</div>
                {docs.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
              </div>
            ) : (
              <div
                className="rounded-xl border p-8 text-center"
                style={{ borderColor: 'rgba(139,92,246,0.1)' }}
              >
                <Database className="w-8 h-8 text-violet-400/20 mx-auto mb-3" />
                <p className="text-sm text-white/40 mb-1">No documents indexed</p>
                <p className="text-xs text-white/20">
                  Upload PDF, DOCX, or TXT files above, or click "Load Sample Documents" to populate with representative legal documents.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'query' && (
          <div className="max-w-2xl">
            {status && status.indexedDocuments === 0 ? (
              <div
                className="rounded-xl border p-8 text-center"
                style={{ borderColor: 'rgba(139,92,246,0.1)' }}
              >
                <Brain className="w-8 h-8 text-violet-400/20 mx-auto mb-3" />
                <p className="text-sm text-white/40 mb-1">No indexed documents yet</p>
                <p className="text-xs text-white/20">
                  Upload and index documents first to enable AI-powered querying.
                </p>
              </div>
            ) : (
              <QueryPanel matterId={matterId} pastQueries={pastQueries} />
            )}
          </div>
        )}

        {activeTab === 'graph' && (
          <div className="max-w-2xl">
            {entities.length === 0 ? (
              <div
                className="rounded-xl border p-8 text-center"
                style={{ borderColor: 'rgba(139,92,246,0.1)' }}
              >
                <Network className="w-8 h-8 text-violet-400/20 mx-auto mb-3" />
                <p className="text-sm text-white/40 mb-1">Knowledge graph not built yet</p>
                <p className="text-xs text-white/20">
                  Index documents to extract entities and relationships.
                </p>
              </div>
            ) : (
              <div
                className="rounded-xl border p-4"
                style={{ background: 'rgba(139,92,246,0.03)', borderColor: 'rgba(139,92,246,0.1)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Network className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-xs font-medium text-violet-300">Extracted Knowledge Graph</span>
                  <span className="text-[9px] text-white/30 font-mono">{entities.length} entities · {relations.length} relations</span>
                </div>
                <GraphPanel entities={entities} relations={relations} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
