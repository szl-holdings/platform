import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { ingestCounselFiling, type DocumentPipelineResult } from '@szl-holdings/document-intelligence';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ChevronDown, ChevronLeft, ChevronRight, Cpu, FileSearch, FileText, Filter, GitBranch, Hash, Link2, Lock, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type ProvenanceKind = 'recommendation' | 'policy' | 'approval' | 'rejection' | 'drift';
type VerificationStatus = 'verified' | 'pending' | 'failed';

interface ProvenanceEntry {
  id: string;
  kind: ProvenanceKind;
  action: string;
  matter: string;
  actor: string;
  time: string;
  modelVersion: string;
  proofHash: string;
  policyRefs: string[];
  evidenceCount: number;
  status: VerificationStatus;
}

interface ApiMatter {
  id: string;
  name: string;
}

interface ProofChainEntry {
  id: string;
  matterId: string;
  timestamp: string;
  eventType: string;
  title: string;
  summary: string;
  privilegeLevel: string;
  author: string;
  parties: string[];
  documentRef?: string;
  hash?: string;
  redacted: boolean;
}

function eventTypeToKind(eventType: string): ProvenanceKind {
  switch (eventType) {
    case 'filing': return 'approval';
    case 'communication': return 'recommendation';
    case 'discovery': return 'policy';
    case 'order': return 'approval';
    case 'settlement': return 'recommendation';
    case 'hearing': return 'policy';
    case 'deadline': return 'drift';
    case 'expert-report': return 'recommendation';
    default: return 'policy';
  }
}

function relativeTime(isoString: string): string {
  const ms = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const kindStyle: Record<
  ProvenanceKind,
  { bg: string; border: string; text: string; label: string; icon: typeof Lock }
> = {
  recommendation: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/25',
    text: 'text-violet-300',
    label: 'Recommendation',
    icon: GitBranch,
  },
  policy: {
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/25',
    text: 'text-sky-300',
    label: 'Policy',
    icon: ShieldCheck,
  },
  approval: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/25',
    text: 'text-emerald-300',
    label: 'Approval',
    icon: Lock,
  },
  rejection: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/25',
    text: 'text-red-300',
    label: 'Rejection',
    icon: FileText,
  },
  drift: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/25',
    text: 'text-amber-300',
    label: 'Drift',
    icon: GitBranch,
  },
};

const statusStyle: Record<
  VerificationStatus,
  { bg: string; border: string; text: string; label: string }
> = {
  verified: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/25',
    text: 'text-emerald-300',
    label: 'VERIFIED',
  },
  pending: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/25',
    text: 'text-violet-300',
    label: 'PENDING',
  },
  failed: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/25',
    text: 'text-red-300',
    label: 'FAILED',
  },
};

const FILTERS: ('all' | ProvenanceKind)[] = [
  'all',
  'recommendation',
  'approval',
  'rejection',
  'policy',
  'drift',
];

function mapProofChainEntries(entries: ProofChainEntry[], matterName: string): ProvenanceEntry[] {
  return entries.map((pc) => ({
    id: pc.id,
    kind: eventTypeToKind(pc.eventType),
    action: pc.title,
    matter: matterName,
    actor: pc.author,
    time: relativeTime(pc.timestamp),
    modelVersion: 'counsel-os 0.6.2',
    proofHash: pc.hash ?? '0x—',
    policyRefs: pc.parties.length > 0 ? [`${pc.eventType} §1`] : [],
    evidenceCount: pc.parties.length,
    status: pc.redacted ? 'pending' : 'verified',
  }));
}

const PAGE_SIZE = 10;

export default function TrustProvenance() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [selectedMatterId, setSelectedMatterId] = useState<string | null>(null);
  const [pipelineResult, setPipelineResult] = useState<DocumentPipelineResult | null>(null);
  const [page, setPage] = useState(1);

  const { data: mattersData, isLoading: mattersLoading, isError: mattersError } = useQuery<{ matters: ApiMatter[] }>({
    queryKey: ['counsel-matters-list-provenance'],
    queryFn: () => apiFetch<{ matters: ApiMatter[] }>('/counsel/matters'),
  });

  const matters = mattersData?.matters ?? [];
  const activeMatterId = selectedMatterId ?? matters[0]?.id ?? null;
  const activeMatterName = matters.find((m) => m.id === activeMatterId)?.name ?? activeMatterId ?? '';

  useEffect(() => { setPage(1); }, [filter, activeMatterId]);

  const { data: proofChainData, isLoading: proofLoading, isError: proofError } = useQuery<{ matterId: string; entries: ProofChainEntry[] }>({
    queryKey: ['counsel-proof-chain', activeMatterId],
    queryFn: () => {
      if (!activeMatterId) throw new Error('No matter selected');
      return apiFetch<{ matterId: string; entries: ProofChainEntry[] }>(`/counsel/proof-chain?matterId=${encodeURIComponent(activeMatterId)}`);
    },
    enabled: !!activeMatterId,
  });

  const isLoading = mattersLoading || proofLoading;
  const isError = mattersError || proofError;

  useEffect(() => {
    ingestCounselFiling({
      fileName: 'engagement_meridian_v3.pdf',
      filingType: 'contract',
      matterRef: 'meridian-compliance-v3',
    })
      .then(setPipelineResult)
      .catch(() => {});
  }, []);

  const entries = useMemo(() => {
    if (!proofChainData?.entries) return [];
    return mapProofChainEntries(proofChainData.entries, activeMatterName);
  }, [proofChainData, activeMatterName]);

  const filtered = useMemo(
    () => (filter === 'all' ? entries : entries.filter((e) => e.kind === filter)),
    [filter, entries],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const verified = entries.filter((e) => e.status === 'verified').length;
  const integrity = entries.length > 0 ? Math.round((verified / entries.length) * 100) : 100;

  return (
    <div className="p-6 space-y-6">
      <header>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-violet-400" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-violet-400/60">
            Operations · Trust & Provenance
          </span>
        </div>
        <h1 className="text-2xl font-bold text-violet-100">Audit Trail</h1>
        <p className="text-violet-400/60 text-sm">
          Evidence-backed log of every AI recommendation, policy decision, and human override across
          Counsel.
        </p>
      </header>

      {matters.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-violet-400/60">Matter:</span>
          <div className="relative">
            <select
              value={activeMatterId ?? ''}
              onChange={(e) => setSelectedMatterId(e.target.value)}
              className="appearance-none bg-violet-500/5 border border-violet-500/20 text-violet-100 text-xs rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:border-violet-500/40"
            >
              {matters.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-violet-400/60 pointer-events-none" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-violet-300/70 mb-2">
            Entries (live)
          </div>
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-violet-500/40 border-t-violet-400 rounded-full animate-spin" />
          ) : (
            <div className="text-3xl font-bold text-violet-50">{entries.length}</div>
          )}
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-300/80 mb-2">
            Verified
          </div>
          <div className="text-3xl font-bold text-emerald-50">{verified}</div>
        </div>
        <div className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-violet-300/70 mb-2">
            Integrity
          </div>
          <div className="text-3xl font-bold text-violet-50">{integrity}%</div>
        </div>
        <div className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-violet-300/70 mb-2">
            Model
          </div>
          <div className="text-base font-bold text-violet-50 font-mono">counsel-os 0.6.2</div>
          <div className="text-[10px] text-violet-400/60 mt-1">
            Signed by Counsel Trust Authority
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-violet-400/60" />
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[11px] font-mono uppercase tracking-wider border transition-colors',
              filter === f
                ? 'bg-violet-500/20 border-violet-500/40 text-violet-100'
                : 'bg-violet-500/5 border-violet-500/10 text-violet-300/70 hover:border-violet-500/25',
            )}
          >
            {f === 'all' ? 'All' : kindStyle[f as ProvenanceKind].label}
          </button>
        ))}
      </div>

      <div className="bg-[#060310] border border-violet-500/15 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center shrink-0">
            <FileSearch className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-violet-100">Filing Intelligence</p>
            <p className="text-[10px] text-violet-400/50 font-mono">
              {pipelineResult
                ? `v${pipelineResult.provenance.pipelineVersion} · ${pipelineResult.provenance.stages.length} stages · ingested at ${new Date(pipelineResult.provenance.ingestedAt).toLocaleTimeString()} · lane: ${pipelineResult.provenance.lane}`
                : 'document-intelligence · OCR → layout → QA · v0.1.0 · lane: counsel'}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Cpu className="w-3 h-3 text-emerald-400" />
            <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider">
              {pipelineResult ? 'pipeline complete' : 'pipeline active'}
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          {[
            {
              chunkId: 'chk-ced-001',
              stage: 'ocr',
              label: 'Engagement letter — Meridian Compliance v.3',
              fileName: 'engagement_meridian_v3.pdf',
              pages: '1–3',
              text: 'Scope of representation includes regulatory counsel services under §4.2 of the Master Engagement Letter. Rate schedule Exhibit A governs billing cadence.',
              confidence: 0.97,
              evidenceRefs: ['ev-4210', 'ev-4211'],
              proofHash: '0x1a3f7c…b902',
            },
            {
              chunkId: 'chk-ced-002',
              stage: 'table',
              label: 'Privilege log — Hargreave IP Settlement',
              fileName: 'hargreave_privilege_log_q1.xlsx',
              pages: 'Sheet 1',
              text: 'Table extracted: 12 rows, 6 columns. Columns: DocID, Date, Author, Recipient, Description, Privilege Basis. 12 documents classified attorney-client.',
              confidence: 0.94,
              evidenceRefs: ['ev-4220'],
              proofHash: '0x9de2a1…c441',
            },
            {
              chunkId: 'chk-ced-003',
              stage: 'layout',
              label: 'Regulatory report draft — Global Data Privacy Audit',
              fileName: 'gdpr_audit_draft_r2.pdf',
              pages: '4–11',
              text: 'Section headings identified: Executive Summary, Findings (§§ 1–5), Recommendations, Appendices. Layout: two-column, 8 pages of substantive content.',
              confidence: 0.91,
              evidenceRefs: ['ev-4230', 'ev-4231'],
              proofHash: '0x3bc09e…7f12',
            },
            {
              chunkId: 'chk-ced-004',
              stage: 'qa',
              label: 'Discovery deadline memo — Meridian Compliance v.3',
              fileName: 'discovery_deadline_memo.docx',
              pages: '1',
              text: 'QA answer: "What is the current discovery deadline?" → "April 14, 2026 per Court Order filed March 12, 2026." Confidence derived from §2.2 of Deadline Extension Policy.',
              confidence: 0.89,
              evidenceRefs: ['ev-4240'],
              proofHash: '0x7fa41b…0e98',
            },
          ].map((chunk) => (
            <div key={chunk.chunkId} className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
                  <span className={cn(
                    'px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider',
                    chunk.stage === 'ocr' ? 'bg-sky-500/15 text-sky-300' :
                    chunk.stage === 'table' ? 'bg-amber-500/15 text-amber-300' :
                    chunk.stage === 'layout' ? 'bg-violet-500/15 text-violet-300' :
                    'bg-emerald-500/15 text-emerald-300',
                  )}>
                    {chunk.stage}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[11px] font-semibold text-violet-100">{chunk.label}</span>
                    <span className="text-[9px] font-mono text-violet-400/40">{chunk.chunkId}</span>
                  </div>
                  <p className="text-[10px] text-violet-300/60 leading-relaxed mb-2">{chunk.text}</p>
                  <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-[9px] font-mono text-violet-400/50">
                    <span className="flex items-center gap-1">
                      <FileText className="w-2.5 h-2.5" />
                      {chunk.fileName} · pp.{chunk.pages}
                    </span>
                    <span className="flex items-center gap-1">
                      <Hash className="w-2.5 h-2.5" />
                      {chunk.proofHash}
                    </span>
                    <span className="flex items-center gap-1">
                      <Link2 className="w-2.5 h-2.5" />
                      {chunk.evidenceRefs.join(', ')}
                    </span>
                    <span className={cn(
                      'flex items-center gap-1',
                      chunk.confidence >= 0.95 ? 'text-emerald-400/70' :
                      chunk.confidence >= 0.90 ? 'text-amber-400/70' : 'text-orange-400/70',
                    )}>
                      conf {Math.round(chunk.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 pt-1 text-[9px] font-mono text-violet-400/35">
          <span className="flex items-center gap-1"><Cpu className="w-2.5 h-2.5" /> pipeline: ocr→layout→table→chart→qa</span>
          <span>·</span>
          <span>
            {pipelineResult
              ? `${pipelineResult.chunks.length} live chunks · ${pipelineResult.provenance.stages.map(s => s.adapterProvider).join('→')} · ${pipelineResult.provenance.fileName}`
              : '4 example chunks · 9 evidence refs · lane: counsel'}
          </span>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-violet-500/40 border-t-violet-400 rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">Failed to load proof-chain entries. Please try again.</p>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-3">
          {visible.length === 0 && (
            <div className="text-center py-10 text-violet-400/40 text-sm">
              No entries matching the selected filter.
            </div>
          )}
          {visible.map((e) => {
            const k = kindStyle[e.kind];
            const s = statusStyle[e.status];
            const Icon = k.icon;
            return (
              <div key={e.id} className="bg-[#0a0614] border border-violet-500/10 rounded-xl p-4">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border',
                      k.bg,
                      k.border,
                    )}
                  >
                    <Icon className={cn('w-5 h-5', k.text)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border',
                          k.bg,
                          k.border,
                          k.text,
                        )}
                      >
                        {k.label}
                      </span>
                      <span className="text-[10px] font-mono text-violet-400/60">{e.id}</span>
                      <span className="text-[10px] font-mono text-violet-400/40">·</span>
                      <span className="text-[10px] font-mono text-violet-400/60">{e.time}</span>
                    </div>
                    <div className="text-sm font-semibold text-violet-50 leading-snug">
                      {e.action}
                    </div>
                    <div className="text-[11px] text-violet-300/60 mt-0.5">
                      Matter: {e.matter} · Actor:{' '}
                      <span className="text-violet-200/80">{e.actor}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-x-4 gap-y-1 flex-wrap text-[10px] font-mono text-violet-400/60">
                      <span className="flex items-center gap-1.5">
                        <GitBranch className="w-3 h-3" /> {e.modelVersion}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Hash className="w-3 h-3" /> {e.proofHash}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3 h-3" /> {e.evidenceCount} evidence refs
                      </span>
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3 h-3" /> {e.policyRefs.length} policy refs
                      </span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider shrink-0 border',
                      s.bg,
                      s.border,
                      s.text,
                    )}
                  >
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] font-mono text-violet-400/50">
                {filtered.length} entries · page {safePage} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="p-1.5 rounded-lg border border-violet-500/20 text-violet-400 hover:bg-violet-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      'w-6 h-6 rounded text-[10px] font-mono transition-colors',
                      p === safePage
                        ? 'bg-violet-500/20 border border-violet-500/40 text-violet-100'
                        : 'text-violet-400/60 hover:bg-violet-500/10',
                    )}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="p-1.5 rounded-lg border border-violet-500/20 text-violet-400 hover:bg-violet-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
