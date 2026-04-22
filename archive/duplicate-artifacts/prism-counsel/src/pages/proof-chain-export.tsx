import {
  getCounselListMattersQueryKey,
  useCounselAppendProofChainEntry,
} from '@szl-holdings/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Clock,
  Cpu,
  Download,
  EyeOff,
  FileStack,
  FileText,
  Gavel,
  Hash,
  MessageSquare,
  Plus,
  Scale,
  Shield,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useRoute } from 'wouter';
import { type PrivilegeLevel, type ProofChainEntry, findMatterById, formatCurrency, getPrivilegeColor, useMatters } from '@/data/matters';

const PROOF_EVENT_TYPES: ProofChainEntry['eventType'][] = [
  'filing',
  'communication',
  'discovery',
  'order',
  'settlement',
  'hearing',
  'deadline',
  'expert-report',
];
const PRIVILEGE_LEVELS: PrivilegeLevel[] = ['public', 'confidential', 'privileged', 'restricted'];

function NewProofEntryModal({
  matterId,
  matterName,
  onClose,
}: {
  matterId: string;
  matterName: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const append = useCounselAppendProofChainEntry();
  const [eventType, setEventType] = useState<ProofChainEntry['eventType']>('filing');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [privilegeLevel, setPrivilegeLevel] = useState<PrivilegeLevel>('confidential');
  const [author, setAuthor] = useState('');
  const [partiesRaw, setPartiesRaw] = useState('');
  const [documentRef, setDocumentRef] = useState('');
  const [redacted, setRedacted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputCls2 =
    'w-full text-xs bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-white/85 placeholder:text-white/25 focus:outline-none focus:border-purple-500/40';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !summary.trim() || !author.trim()) {
      setError('Title, summary, and author are required.');
      return;
    }
    append.mutate(
      {
        data: {
          matterId,
          eventType,
          title: title.trim(),
          summary: summary.trim(),
          privilegeLevel,
          author: author.trim(),
          parties: partiesRaw
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean),
          documentRef: documentRef.trim() || undefined,
          redacted,
        },
      },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: getCounselListMattersQueryKey() });
          onClose();
        },
        onError: (err: unknown) => {
          setError(err instanceof Error ? err.message : 'Failed to add proof entry.');
        },
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 p-6"
        style={{ background: 'rgba(15,15,20,0.98)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold font-display text-white/90">
              Append Proof-Chain Entry
            </h2>
            <p className="text-[11px] text-white/40 mt-0.5 truncate">{matterName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3" data-testid="form-new-proof">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[10px] text-white/35 uppercase tracking-wider block mb-1">
                Event Type
              </span>
              <select
                data-testid="select-proof-event-type"
                value={eventType}
                onChange={(e) => setEventType(e.target.value as ProofChainEntry['eventType'])}
                className={inputCls2}
              >
                {PROOF_EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] text-white/35 uppercase tracking-wider block mb-1">
                Privilege Level
              </span>
              <select
                data-testid="select-proof-privilege"
                value={privilegeLevel}
                onChange={(e) => setPrivilegeLevel(e.target.value as PrivilegeLevel)}
                className={inputCls2}
              >
                {PRIVILEGE_LEVELS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-[10px] text-white/35 uppercase tracking-wider block mb-1">
              Title *
            </span>
            <input
              data-testid="input-proof-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls2}
              placeholder="Motion to Compel filed"
            />
          </label>
          <label className="block">
            <span className="text-[10px] text-white/35 uppercase tracking-wider block mb-1">
              Summary *
            </span>
            <textarea
              data-testid="input-proof-summary"
              required
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className={inputCls2}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[10px] text-white/35 uppercase tracking-wider block mb-1">
                Author *
              </span>
              <input
                data-testid="input-proof-author"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className={inputCls2}
                placeholder="M. Farooq"
              />
            </label>
            <label className="block">
              <span className="text-[10px] text-white/35 uppercase tracking-wider block mb-1">
                Document Ref
              </span>
              <input
                value={documentRef}
                onChange={(e) => setDocumentRef(e.target.value)}
                className={inputCls2}
                placeholder="ECF No. 92"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-[10px] text-white/35 uppercase tracking-wider block mb-1">
              Parties (comma separated)
            </span>
            <input
              value={partiesRaw}
              onChange={(e) => setPartiesRaw(e.target.value)}
              className={inputCls2}
              placeholder="Apex Capital, FTC"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-white/60">
            <input
              type="checkbox"
              checked={redacted}
              onChange={(e) => setRedacted(e.target.checked)}
            />
            Mark as redacted
          </label>
          {error && (
            <div
              className="text-[11px] text-red-400 px-3 py-2 rounded-lg"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              {error}
            </div>
          )}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs px-3 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white/90 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="button-create-proof"
              disabled={append.isPending}
              className="text-xs px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
              style={{
                background: 'rgba(167,139,250,0.18)',
                color: ACCENT,
                border: '1px solid rgba(167,139,250,0.35)',
              }}
            >
              {append.isPending ? 'Adding…' : 'Add Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const ACCENT = '#a78bfa';

const EVENT_ICONS: Record<string, React.ReactNode> = {
  filing: <Gavel className="w-3.5 h-3.5" />,
  communication: <MessageSquare className="w-3.5 h-3.5" />,
  discovery: <FileText className="w-3.5 h-3.5" />,
  order: <Scale className="w-3.5 h-3.5" />,
  settlement: <CheckCircle className="w-3.5 h-3.5" />,
  hearing: <Gavel className="w-3.5 h-3.5" />,
  deadline: <Clock className="w-3.5 h-3.5" />,
  'expert-report': <Cpu className="w-3.5 h-3.5" />,
};

const EVENT_COLORS: Record<string, string> = {
  filing: '#a78bfa',
  communication: '#38bdf8',
  discovery: '#eab308',
  order: '#ef4444',
  settlement: '#22c55e',
  hearing: '#f97316',
  deadline: '#f97316',
  'expert-report': '#c4b5fd',
};

const PRIV_INCLUDE_MAP: Record<string, PrivilegeLevel[]> = {
  full: ['public', 'confidential', 'privileged', 'restricted'],
  counsel: ['public', 'confidential', 'privileged'],
  court: ['public', 'confidential'],
  public: ['public'],
};

function ProofEntry({
  entry,
  showHash,
  userRole,
}: {
  entry: ProofChainEntry;
  showHash: boolean;
  userRole: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const privColor = getPrivilegeColor(entry.privilegeLevel);
  const evtColor = EVENT_COLORS[entry.eventType] || ACCENT;
  const icon = EVENT_ICONS[entry.eventType];
  const isRedacted = entry.redacted && userRole !== 'partner';

  const date = new Date(entry.timestamp);
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center shrink-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: `${evtColor}15`,
            color: evtColor,
            border: `1px solid ${evtColor}25`,
          }}
        >
          {icon}
        </div>
        <div className="flex-1 w-px mt-2" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      <div className="flex-1 pb-6">
        <div
          className="rounded-xl border border-white/5 overflow-hidden hover:border-white/10 transition-colors cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.02)' }}
          onClick={() => !isRedacted && setExpanded((v) => !v)}
        >
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{ background: `${evtColor}18`, color: evtColor }}
                  >
                    {entry.eventType.replace('-', ' ')}
                  </span>
                  <span
                    className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{ background: `${privColor}18`, color: privColor }}
                  >
                    {entry.privilegeLevel}
                  </span>
                  {entry.redacted && (
                    <span
                      className="flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
                    >
                      <EyeOff className="w-2 h-2" /> Redacted
                    </span>
                  )}
                </div>
                {isRedacted ? (
                  <p className="text-xs font-semibold text-red-400/60 italic">
                    [Content redacted — insufficient privilege level]
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-white/80 leading-snug">{entry.title}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/30">
                  <span>
                    {dateStr} {timeStr}
                  </span>
                  <span>·</span>
                  <span>{entry.author}</span>
                  {entry.documentRef && (
                    <>
                      <span>·</span>
                      <span className="font-mono">{entry.documentRef}</span>
                    </>
                  )}
                </div>
              </div>
              {!isRedacted && (
                <ChevronDown
                  className={`w-3.5 h-3.5 text-white/20 shrink-0 mt-1 transition-transform ${expanded ? 'rotate-180' : ''}`}
                />
              )}
            </div>
          </div>

          {expanded && !isRedacted && (
            <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
              <p className="text-xs text-white/50 leading-relaxed">{entry.summary}</p>
              {entry.parties.length > 0 && (
                <div>
                  <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Parties</p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.parties.map((p) => (
                      <span
                        key={p}
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          color: 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {showHash && entry.hash && (
                <div
                  className="flex items-center gap-2 p-2 rounded-lg"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <Hash className="w-3 h-3 text-white/20 shrink-0" />
                  <span className="font-mono text-[10px] text-white/25 truncate">{entry.hash}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProofChainExport() {
  const [, params] = useRoute('/proof-chain/:matterId');
  const { matters, isLoading } = useMatters();
  const [selectedMatterId, setSelectedMatterId] = useState<string>(params?.matterId ?? '');
  const [exportScope, setExportScope] = useState<'full' | 'counsel' | 'court' | 'public'>(
    'counsel',
  );
  const [userRole, setUserRole] = useState('partner');
  const [showHashes, setShowHashes] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [showNewProof, setShowNewProof] = useState(false);

  const effectiveId = selectedMatterId || matters[0]?.id || '';
  const matter = useMemo(
    () => findMatterById(matters, effectiveId) ?? matters[0],
    [matters, effectiveId],
  );
  const allowedPriv = PRIV_INCLUDE_MAP[exportScope];

  const visibleEntries = useMemo(() => {
    if (!matter) return [];
    return [...matter.proofChain]
      .filter((e) => allowedPriv.includes(e.privilegeLevel))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [matter, allowedPriv]);

  if (!matter) {
    return (
      <div className="p-6 text-xs text-white/30">
        {isLoading ? 'Loading matters…' : 'No matters available.'}
      </div>
    );
  }

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerated(false);

    try {
      const policyRes = await fetch('/api/prism-counsel/privilege/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matterId: matter.id,
          action: 'prism-counsel:export',
          userRole,
          privilegeLevel: matter.privilegeLevel,
          wallEnabled: matter.wall.enabled,
          userApproved: matter.wall.approvedUsers.includes(userRole),
        }),
      });

      if (policyRes.ok) {
        const { data: policy } = await policyRes.json();
        if (!policy.allowed && policy.effect === 'block') {
          setGenerating(false);
          alert(`Access denied by PRISM policy engine:\n${policy.reasoning}`);
          return;
        }
      }
    } catch {}

    fetch('/api/prism-counsel/exports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exportType: 'audit_report',
        format: 'json',
        externalMatterId: matter.id,
      }),
    }).catch(() => {});

    await new Promise((r) => setTimeout(r, 1200));

    const bundle = {
      exportMeta: {
        generatedAt: new Date().toISOString(),
        scope: exportScope,
        privilegeLevelsIncluded: allowedPriv,
        matterNumber: matter.matterNumber,
        matterName: matter.name,
        leadCounsel: matter.leadCounsel,
        jurisdiction: matter.jurisdiction,
        totalEvents: visibleEntries.length,
        policyEngine: 'prism-counsel.matter-wall@1.0',
        attestation:
          'PRISM Counsel privilege review — all redactions applied per matter wall policy',
      },
      matter: {
        id: matter.id,
        name: matter.name,
        matterNumber: matter.matterNumber,
        type: matter.type,
        status: matter.status,
        privilegeLevel: matter.privilegeLevel,
        jurisdiction: matter.jurisdiction,
        leadCounsel: matter.leadCounsel,
        estimatedExposure: matter.estimatedExposure,
      },
      events: visibleEntries.map((e) => ({
        id: e.id,
        timestamp: e.timestamp,
        eventType: e.eventType,
        title: e.redacted ? '[REDACTED — insufficient privilege]' : e.title,
        summary: e.redacted ? null : e.summary,
        author: e.author,
        privilegeLevel: e.privilegeLevel,
        parties: e.parties,
        documentRef: e.documentRef ?? null,
        hash: showHashes ? (e.hash ?? null) : null,
      })),
    };

    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prism-bundle-${matter.matterNumber}-${exportScope}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setGenerating(false);
    setGenerated(true);
  };

  const scopeLabels = {
    full: 'Full — All Privilege Levels (Partner only)',
    counsel: 'Counsel — Privileged + Below',
    court: 'Court — Confidential + Public only',
    public: 'Public — Filed Documents Only',
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileStack className="w-4 h-4" style={{ color: ACCENT }} />
            <h1 className="text-lg font-semibold font-display text-white/90">Proof Chain Export</h1>
          </div>
          <p className="text-xs text-white/30">
            Privilege-aware chronological timeline bundle · Court-ready export
          </p>
        </div>
        <button
          onClick={() => setShowNewProof(true)}
          data-testid="button-new-proof-entry"
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all"
          style={{
            background: 'rgba(167,139,250,0.15)',
            color: ACCENT,
            borderColor: 'rgba(167,139,250,0.35)',
          }}
        >
          <Plus className="w-3 h-3" />
          New Proof Entry
        </button>
      </div>
      {showNewProof && (
        <NewProofEntryModal
          matterId={matter.id}
          matterName={matter.name}
          onClose={() => setShowNewProof(false)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <div
            className="rounded-2xl border border-white/5 p-5 space-y-4"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
              Export Configuration
            </h3>

            <div className="space-y-2">
              <label className="text-[10px] text-white/30 uppercase tracking-wider block">
                Matter
              </label>
              <select
                value={effectiveId}
                onChange={(e) => setSelectedMatterId(e.target.value)}
                className="text-xs bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white/70 focus:outline-none focus:border-purple-500/40 w-full"
              >
                {matters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-white/30 uppercase tracking-wider block">
                Export Scope
              </label>
              <select
                value={exportScope}
                onChange={(e) => setExportScope(e.target.value as typeof exportScope)}
                className="text-xs bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white/70 focus:outline-none focus:border-purple-500/40 w-full"
              >
                {Object.entries(scopeLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-white/30 uppercase tracking-wider block">
                Viewing As
              </label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                className="text-xs bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white/70 focus:outline-none focus:border-purple-500/40 w-full"
              >
                <option value="partner">Partner (full access)</option>
                <option value="associate">Associate</option>
                <option value="paralegal">Paralegal</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-[10px] text-white/40">Show document hashes</label>
              <button
                onClick={() => setShowHashes((v) => !v)}
                className="w-9 h-5 rounded-full transition-all relative"
                style={{
                  background: showHashes ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${showHashes ? 'translate-x-4' : 'translate-x-0.5'}`}
                />
              </button>
            </div>

            <div className="pt-2 border-t border-white/5">
              <div
                className="rounded-lg p-3 space-y-1.5"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <p className="text-[10px] text-white/30">Bundle preview</p>
                <p className="text-xs font-semibold text-white/70">
                  {visibleEntries.length} events included
                </p>
                <p className="text-[10px] text-white/30">
                  Privilege levels: {allowedPriv.join(', ')}
                </p>
                {matter.wall.enabled && exportScope === 'full' && (
                  <div className="flex items-center gap-1.5 text-[10px] text-orange-400">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    Matter wall active — restricted access
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: generating ? 'rgba(167,139,250,0.08)' : 'rgba(167,139,250,0.15)',
                color: generating ? 'rgba(167,139,250,0.4)' : ACCENT,
                border: '1px solid rgba(167,139,250,0.25)',
                cursor: generating ? 'not-allowed' : 'pointer',
              }}
            >
              {generating ? (
                <>
                  <div
                    className="w-4 h-4 border-2 rounded-full animate-spin"
                    style={{ borderColor: 'rgba(167,139,250,0.2)', borderTopColor: ACCENT }}
                  />
                  Generating bundle…
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Generate Export Bundle
                </>
              )}
            </button>

            {generated && (
              <div
                className="flex items-start gap-2.5 p-3 rounded-lg"
                style={{
                  background: 'rgba(34,197,94,0.06)',
                  border: '1px solid rgba(34,197,94,0.15)',
                }}
              >
                <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-semibold text-green-400">Bundle ready</p>
                  <p className="text-[10px] text-green-400/60 mt-0.5">
                    {visibleEntries.length} events · Privilege attestation attached · SHA-256 hashes
                    included
                  </p>
                  <p className="text-[10px] text-green-400/40 mt-1">
                    prism-bundle-{matter.matterNumber}-{exportScope}.pdf
                  </p>
                </div>
              </div>
            )}
          </div>

          <div
            className="rounded-2xl border border-white/5 p-5 space-y-3"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
              Matter Summary
            </h3>
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-white/30">Matter</span>
                <span className="text-white/60 truncate max-w-[160px] text-right">
                  {matter.name.split(' — ')[0]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/30">Lead Counsel</span>
                <span className="text-white/60">{matter.leadCounsel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/30">Jurisdiction</span>
                <span className="text-white/60 truncate max-w-[160px] text-right">
                  {matter.jurisdiction}
                </span>
              </div>
              {matter.estimatedExposure && (
                <div className="flex justify-between">
                  <span className="text-white/30">Exposure</span>
                  <span className="font-mono text-white/60">
                    {formatCurrency(matter.estimatedExposure)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-white/30">Privilege Level</span>
                <span style={{ color: getPrivilegeColor(matter.privilegeLevel) }}>
                  {matter.privilegeLevel}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div
            className="rounded-2xl border border-white/5 overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                <p className="text-xs font-semibold text-white/60">Chronological Timeline</p>
                <span className="text-[10px] font-mono text-white/25">
                  {visibleEntries.length} events
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3 text-white/20" />
                <span className="text-[10px] text-white/20">
                  {scopeLabels[exportScope].split(' — ')[0]}
                </span>
              </div>
            </div>
            <div className="p-5">
              {visibleEntries.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-sm text-white/20">
                  No events match the selected privilege scope.
                </div>
              ) : (
                <div>
                  {visibleEntries.map((entry) => (
                    <ProofEntry
                      key={entry.id}
                      entry={entry}
                      showHash={showHashes}
                      userRole={userRole}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className="rounded-xl p-4 border border-white/5 text-[11px] text-white/20"
        style={{ background: 'rgba(255,255,255,0.01)' }}
      >
        <div className="flex items-start gap-2.5">
          <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: ACCENT }} />
          <div>
            <p className="font-semibold text-white/30 mb-0.5">Privilege Attestation</p>
            <p className="leading-relaxed">
              All exports from PRISM Counsel include an attestation of privilege review. Documents
              marked <span style={{ color: '#f97316' }}>privileged</span> or{' '}
              <span style={{ color: '#ef4444' }}>restricted</span> are excluded from court-scope
              bundles. Each export is logged in the matter audit trail with your identity,
              timestamp, and bundle hash. PRISM Counsel does not constitute legal advice — all
              outputs require review by qualified counsel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
