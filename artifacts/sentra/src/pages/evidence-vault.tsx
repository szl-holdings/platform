import { useEffect, useState } from 'react';
import {
  CheckCircle2, Download, FileText, Filter, FolderLock, Hash, Link as LinkIcon,
  Lock, Search, Shield, ShieldAlert, Unlock, XCircle
} from 'lucide-react';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useSentraStore, ensureSeeded, type EvidenceItem } from '@/lib/sentra-store';

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: typeof FileText }> = {
  log_excerpt: { label: 'LOG', color: '#60a5fa', icon: FileText },
  pcap: { label: 'PCAP', color: '#c9b787', icon: FileText },
  memory_dump: { label: 'MEMORY', color: '#e05252', icon: FileText },
  screenshot: { label: 'SCREENSHOT', color: '#a78bfa', icon: FileText },
  artifact: { label: 'ARTIFACT', color: '#f59e0b', icon: ShieldAlert },
  indicator: { label: 'INDICATOR', color: '#8a8a8a', icon: Shield },
  report: { label: 'REPORT', color: '#4ade80', icon: FileText },
};

function EvidenceCard({ ev, onLock, onPack }: {
  ev: EvidenceItem;
  onLock: (id: string) => void;
  onPack: (incidentId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const typeCfg = TYPE_CONFIG[ev.type] ?? TYPE_CONFIG.artifact;

  return (
    <div className={cn('rounded-lg border transition-all', expanded && 'border-[#c9b787]/20')}
      style={{ background: 'rgba(255,255,255,0.025)', borderColor: expanded ? undefined : 'rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(x => !x)}>
        <div className="flex-shrink-0">
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold border"
            style={{ color: typeCfg.color, borderColor: `${typeCfg.color}30`, background: `${typeCfg.color}10` }}>
            {typeCfg.label}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-slate-200 truncate">{ev.file_name}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-mono text-slate-500">{ev.id}</span>
            <span className="text-[10px] text-slate-600">·</span>
            <span className="text-[10px] font-mono text-slate-500">{ev.source}</span>
            <span className="text-[10px] text-slate-600">·</span>
            <span className="text-[10px] font-mono text-slate-600">{(ev.size_bytes / 1024).toFixed(1)} KB</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {ev.locked ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20">
              <Lock className="w-2.5 h-2.5" /> LOCKED
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-700/40 text-slate-400 border border-slate-600/30">
              <Unlock className="w-2.5 h-2.5" /> UNLOCKED
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-700/50 p-4 space-y-4">
          {/* Hash */}
          <div>
            <div className="text-[10px] font-mono uppercase text-slate-500 mb-1">SHA-256 Hash</div>
            <div className="flex items-center gap-2">
              <Hash className="w-3 h-3 text-slate-500" />
              <span className="text-[11px] font-mono text-[#c9b787] break-all">{ev.sha256}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Details */}
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-500 mb-2">Evidence Details</div>
              <div className="space-y-1">
                {[
                  ['Type', ev.type.replace(/_/g, ' ').toUpperCase()],
                  ['Source', ev.source],
                  ['Collected By', ev.collected_by],
                  ['Collected At', new Date(ev.collected_at).toLocaleString()],
                  ['Storage URI', ev.storage_uri],
                  ['Description', ev.description],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-2">
                    <span className="text-slate-500 flex-shrink-0 w-28">{label}</span>
                    <span className="text-slate-300 font-mono break-all">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chain of custody */}
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-500 mb-2">Chain of Custody</div>
              <div className="space-y-2">
                {ev.chain_of_custody.map((event, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#c9b787]/20 border border-[#c9b787]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[8px] font-mono text-[#c9b787]">{i + 1}</span>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-slate-300">{event.action}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{event.actor} · {new Date(event.timestamp).toLocaleString()}</div>
                      {event.note && <div className="text-[10px] text-slate-600 italic">{event.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {!ev.locked && (
              <button onClick={() => onLock(ev.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-mono border transition-all hover:border-[#c9b787]/40"
                style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#c9b787' }}>
                <Lock className="w-3 h-3" /> Lock Evidence
              </button>
            )}
            <button onClick={() => onPack(ev.incident_id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-mono border transition-all hover:border-[#60a5fa]/40"
              style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#60a5fa' }}>
              <Download className="w-3 h-3" /> Generate Evidence Pack
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EvidenceVault() {
  useEffect(() => { ensureSeeded(); }, []);
  const store = useSentraStore();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [lockFilter, setLockFilter] = useState<'all' | 'locked' | 'unlocked'>('all');
  const [packResult, setPackResult] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; checked: number } | null>(null);

  const evidence = store.evidence;
  const filtered = evidence.filter(e => {
    if (typeFilter !== 'all' && e.type !== typeFilter) return false;
    if (lockFilter === 'locked' && !e.locked) return false;
    if (lockFilter === 'unlocked' && e.locked) return false;
    if (search) {
      const q = search.toLowerCase();
      return e.file_name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || e.source.toLowerCase().includes(q);
    }
    return true;
  });

  function handleLock(id: string) {
    store.lockEvidence(id, 'Analyst (Manual)');
  }

  function handlePack(incidentId: string) {
    const pack = store.generateEvidencePack(incidentId, 'Analyst');
    setPackResult(`Evidence pack ${pack.id} created — Merkle root: ${pack.merkle_root.substring(0, 12)}…`);
    setTimeout(() => setPackResult(null), 4000);
  }

  function handleVerifyPacks() {
    const results = store.evidencePacks.map(p => store.verifyEvidencePack(p.id));
    const allValid = results.every(r => r.valid);
    setVerifyResult({ valid: allValid, checked: results.length });
    setTimeout(() => setVerifyResult(null), 5000);
  }

  const lockedCount = evidence.filter(e => e.locked).length;
  const packsCount = store.evidencePacks.length;
  const totalSize = evidence.reduce((acc, e) => acc + e.size_bytes, 0);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FolderLock className="w-4 h-4 text-[#c9b787]" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Sentra — Evidence Vault</span>
        </div>
        <h1 className="text-2xl font-display font-bold text-slate-100">Evidence Vault</h1>
        <p className="text-sm text-slate-500 mt-1">Tamper-evident evidence collection with Merkle-root verification and chain-of-custody tracking.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Evidence Items', value: evidence.length, color: '#f5f5f5' },
          { label: 'Locked', value: lockedCount, color: '#4ade80', sub: 'legal hold' },
          { label: 'Evidence Packs', value: packsCount, color: '#c9b787', sub: 'Merkle-signed' },
          { label: 'Total Size', value: `${(totalSize / 1024 / 1024).toFixed(1)} MB`, color: '#60a5fa' },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className="rounded-lg border p-4" style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="text-[10px] font-mono uppercase text-slate-500 mb-1">{label}</div>
            <div className="text-2xl font-display font-bold" style={{ color }}>{value}</div>
            {sub && <div className="text-[10px] text-slate-600 font-mono mt-0.5">{sub}</div>}
          </div>
        ))}
      </div>

      {/* Actions bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={handleVerifyPacks}
          className="flex items-center gap-1.5 px-3 py-2 rounded text-[10px] font-mono border transition-all hover:border-[#4ade80]/40"
          style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#4ade80', background: 'rgba(74,222,128,0.05)' }}>
          <CheckCircle2 className="w-3.5 h-3.5" /> Verify All Merkle Packs ({packsCount})
        </button>
        {packResult && (
          <div className="text-[10px] font-mono text-[#c9b787] px-3 py-2 rounded border border-[#c9b787]/20 bg-[#c9b787]/05">
            ✓ {packResult}
          </div>
        )}
        {verifyResult && (
          <div className={cn('text-[10px] font-mono px-3 py-2 rounded border', verifyResult.valid ? 'text-green-400 border-green-500/20 bg-green-500/05' : 'text-red-400 border-red-500/20 bg-red-500/05')}>
            {verifyResult.valid ? '✓' : '✗'} {verifyResult.checked} packs verified — {verifyResult.valid ? 'All Merkle roots valid' : 'Integrity check FAILED'}
          </div>
        )}
      </div>

      {/* Evidence packs */}
      {store.evidencePacks.length > 0 && (
        <div className="rounded-lg border p-4" style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Hash className="w-3.5 h-3.5 text-[#c9b787]" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Evidence Packs (Merkle-Signed)</span>
          </div>
          <div className="space-y-2">
            {store.evidencePacks.map(pack => (
              <div key={pack.id} className="flex items-center gap-4 p-3 rounded-md border border-slate-700/50 bg-slate-800/20 text-[11px]">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-slate-300">{pack.id}</div>
                  <div className="text-slate-500 font-mono">Incident: {pack.incident_id} · {pack.item_ids.length} items</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-slate-500">Merkle Root</div>
                  <div className="text-[10px] font-mono text-[#c9b787]">{pack.merkle_root.substring(0, 16)}…</div>
                </div>
                <div className="flex items-center gap-1">
                  {pack.verified ? (
                    <span className="text-[9px] font-mono text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> VERIFIED</span>
                  ) : (
                    <span className="text-[9px] font-mono text-red-400 flex items-center gap-1"><XCircle className="w-3 h-3" /> UNVERIFIED</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search evidence…"
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-[#c9b787]/40" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-xs text-slate-400 outline-none">
          <option value="all">All Types</option>
          {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={lockFilter} onChange={e => setLockFilter(e.target.value as typeof lockFilter)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-xs text-slate-400 outline-none">
          <option value="all">All Lock Status</option>
          <option value="locked">Locked Only</option>
          <option value="unlocked">Unlocked Only</option>
        </select>
        <span className="text-[10px] font-mono text-slate-600">{filtered.length} items</span>
      </div>

      {/* Evidence list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-600 text-sm">No evidence items match your filters</div>
        ) : (
          filtered.map(ev => <EvidenceCard key={ev.id} ev={ev} onLock={handleLock} onPack={handlePack} />)
        )}
      </div>
    </div>
  );
}
