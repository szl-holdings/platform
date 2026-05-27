import { useEffect, useState } from 'react';
import { useParams, Link } from 'wouter';
import {
  AlertTriangle, ArrowLeft, BookOpen, CheckCircle2, ChevronRight,
  Clock, Download, FileText, FolderLock, Lock, RefreshCw,
  Shield, ShieldAlert, ShieldCheck, Target, User, XCircle, Zap
} from 'lucide-react';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  useSentraStore, ensureSeeded, type Incident, type IncidentStatus, type IncidentSeverity,
  type ReportType
} from '@/lib/sentra-store';
import { runPolicyGate, ALLOWED_ACTION_CLASSES, requiresApproval } from '@/lib/policy-engine';
import { ActionConfirmModal } from '@/components/action-confirm-modal';
import { OperatorAttentionPanel } from '@/components/operator-attention-panel';
import { BlastRadiusSim } from '@/components/blast-radius-sim';
import { EXECUTABLE_STATUSES, type ActionClass } from '@/lib/sentra-store';

const SEV_COLOR: Record<IncidentSeverity, string> = {
  critical: '#e05252', high: '#f59e0b', medium: '#c9b787', low: '#60a5fa',
};

const STATUS_LABEL: Record<IncidentStatus, string> = {
  new: 'NEW', triage: 'TRIAGE', investigating: 'INVESTIGATING',
  approval_pending: 'APPROVAL PENDING', containment_in_progress: 'CONTAINMENT IN PROGRESS',
  contained: 'CONTAINED', recovery: 'RECOVERY', reporting: 'REPORTING', closed: 'CLOSED',
};

const STATUS_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  new: ['triage'],
  triage: ['investigating'],
  investigating: ['approval_pending', 'contained'],
  approval_pending: ['containment_in_progress'],
  containment_in_progress: ['contained'],
  contained: ['recovery'],
  recovery: ['reporting'],
  reporting: ['closed'],
  closed: [],
};

type Tab = 'overview' | 'contain' | 'evidence' | 'attribution' | 'escalate' | 'timeline';

function StatusPill({ status }: { status: IncidentStatus }) {
  const colors: Record<IncidentStatus, string> = {
    new: '#8a8a8a', triage: '#f59e0b', investigating: '#60a5fa',
    approval_pending: '#c9b787', containment_in_progress: '#e05252',
    contained: '#4ade80', recovery: '#c9b787', reporting: '#8a8a8a', closed: '#4a5568',
  };
  const c = colors[status];
  return (
    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold border"
      style={{ color: c, borderColor: `${c}30`, background: `${c}10` }}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function TimelinePane({ incident }: { incident: Incident }) {
  return (
    <div className="space-y-3">
      {[...incident.timeline].reverse().map((entry, i) => {
        const typeColor: Record<string, string> = {
          detection: '#e05252', system: '#8a8a8a', analyst: '#60a5fa',
          approval: '#f59e0b', containment: '#e05252', evidence: '#c9b787',
          report: '#4ade80', closure: '#4ade80',
        };
        return (
          <div key={entry.id} className="flex items-start gap-3">
            <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border"
              style={{ background: `${typeColor[entry.type] ?? '#8a8a8a'}15`, borderColor: `${typeColor[entry.type] ?? '#8a8a8a'}40` }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: typeColor[entry.type] ?? '#8a8a8a' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-medium text-slate-300">{entry.action}</span>
                <span className="text-[10px] font-mono text-slate-600">{entry.actor}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{entry.detail}</div>
              <div className="text-[10px] font-mono text-slate-700 mt-0.5">{new Date(entry.timestamp).toLocaleString()}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ContainPane({ incident }: { incident: Incident }) {
  const store = useSentraStore();
  const [selectedAsset, setSelectedAsset] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [note, setNote] = useState('');
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Include every affected asset (and a sample of owned ones) so non-executable
  // selections can route through the Safety Gate denial modal rather than being
  // hidden from the analyst.
  const incidentAssetIds = incident.affected_assets.map(a => a.asset_id);
  const affectedAssets = store.assets.filter(a => incidentAssetIds.includes(a.id));
  const fallbackOwned = store.assets.filter(a => EXECUTABLE_STATUSES.includes(a.ownership_status)).slice(0, 20);
  const relevantAssets = affectedAssets.length > 0 ? affectedAssets : fallbackOwned;

  const playbook = store.playbooks.find(p => p.incident_id === incident.id);
  const selectedAssetObj = selectedAsset ? store.getAsset(selectedAsset) ?? null : null;
  const selectedActionClass = (selectedAction || 'preserve_evidence') as ActionClass;

  function handleClickQueue() {
    if (!selectedAsset || !selectedAction || !selectedAssetObj) return;
    setConfirmOpen(true);
  }

  async function handleConfirm(decision: { allowed: boolean; needsApproval: boolean; reason: string; denialMessage: string | null; doctrineCitations: string[] }) {
    setConfirmOpen(false);
    if (!selectedAsset || !selectedAction) return;
    const asset = store.getAsset(selectedAsset);
    if (!asset) return;
    const actionClass = selectedAction as ActionClass;

    store.writePolicyLog({
      action_id: store.nextId('ACT'),
      action_class: actionClass,
      target: asset.name,
      integration: null,
      reason: decision.reason,
      requested_by: 'Analyst (Incident Detail)',
      approval_id: null,
      policy_result: decision.allowed ? 'allow' : 'deny',
      denial_message: decision.denialMessage,
    });

    if (!decision.allowed) {
      setResult({ ok: false, message: decision.denialMessage ?? decision.reason });
      setTimeout(() => setResult(null), 4000);
      return;
    }

    if (decision.needsApproval) {
      const blast = store.computeBlastRadius(selectedAsset, actionClass);
      store.createApproval({
        tenant_id: asset.tenant_id,
        incident_id: incident.id,
        action_id: store.nextId('ACT'),
        action_class: actionClass,
        action_description: `${actionClass.replace(/_/g, ' ')} on ${asset.name}${note ? ` — ${note}` : ''}`,
        target_asset_id: selectedAsset,
        target_asset_name: asset.name,
        target_ownership_status: asset.ownership_status,
        integration_id: null,
        requested_by: 'Analyst (Incident Detail)',
        doctrine_citations: decision.doctrineCitations,
        blast_radius_preview: blast,
        rollback_path: `Restore ${asset.name} via admin console — requires CISO approval`,
        policy_class: actionClass,
      });
      store.advanceIncident(incident.id, 'approval_pending', 'Analyst', `Approval queued for ${actionClass} on ${asset.name}`);
      setResult({ ok: true, message: `Approval queued — check Approval Queue for ${asset.name}` });
    } else {
      store.writeAudit({
        actor: 'Analyst (Incident Detail)',
        action: actionClass,
        action_class: actionClass,
        target_asset_id: selectedAsset,
        integration_id: null,
        policy_decision: 'allow',
        approval_id: null,
        execution_result: 'success',
        evidence_hash: null,
        rollback_reference: null,
        notes: `${actionClass} on ${asset.name}${note ? ` — ${note}` : ''}`,
      });
      store.addIncidentNote(incident.id, 'Analyst', `Action executed: ${actionClass} on ${asset.name}${note ? ` — ${note}` : ''}`);
      setResult({ ok: true, message: `Action executed and logged: ${actionClass} on ${asset.name}` });
    }
    setTimeout(() => setResult(null), 4000);
    setNote('');
  }

  return (
    <div className="space-y-6">
      {/* Playbook */}
      {playbook && (
        <div className="rounded-lg border p-4" style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-3.5 h-3.5 text-[#c9b787]" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9b787]">Active Playbook: {playbook.title}</span>
          </div>
          <div className="space-y-2">
            {playbook.steps.map(step => {
              const statusColor = step.status === 'completed' ? '#4ade80' : step.status === 'running' ? '#60a5fa' : step.status === 'failed' ? '#e05252' : '#8a8a8a';
              return (
                <div key={step.id} className="flex items-start gap-3 p-2 rounded-md border border-slate-700/40">
                  <div className="w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ borderColor: `${statusColor}50`, background: `${statusColor}10` }}>
                    <span className="text-[9px] font-mono" style={{ color: statusColor }}>{step.order}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-300">{step.description}</span>
                      {step.requires_approval && <span className="text-[8px] font-mono text-[#f59e0b]">APPROVAL</span>}
                    </div>
                    <div className="text-[10px] font-mono text-slate-600">{step.action_class.replace(/_/g, ' ')} · {step.status.toUpperCase()}</div>
                    {step.result && <div className="text-[10px] text-slate-500 mt-0.5 italic">{step.result}</div>}
                  </div>
                  <span className="text-[9px] font-mono" style={{ color: statusColor }}>{step.status.toUpperCase()}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {playbook.doctrine_citations.map(c => (
              <span key={c} className="px-1.5 py-0.5 rounded text-[9px] font-mono text-[#c9b787] bg-[#c9b787]/05 border border-[#c9b787]/15">{c}</span>
            ))}
          </div>
        </div>
      )}

      {/* Blast radius preview (inline pre-flight; the confirm modal also shows it) */}
      {selectedAsset && selectedAction && (
        <BlastRadiusPreview assetId={selectedAsset} actionClass={selectedAction} />
      )}

      {/* Action form */}
      <div className="rounded-lg border p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="text-[10px] font-mono uppercase text-slate-500">Queue Containment Action</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] font-mono text-slate-500 mb-1">Target Asset</div>
            <select value={selectedAsset} onChange={e => setSelectedAsset(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none focus:border-[#c9b787]/40">
              <option value="">Select asset…</option>
              {relevantAssets.map(a => {
                const executable = EXECUTABLE_STATUSES.includes(a.ownership_status);
                return (
                  <option key={a.id} value={a.id}>
                    {executable ? '' : '⛔ '}{a.name} [{a.ownership_status}]
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-500 mb-1">Action Class (Defensive Only)</div>
            <select value={selectedAction} onChange={e => setSelectedAction(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none focus:border-[#c9b787]/40">
              <option value="">Select action…</option>
              {ALLOWED_ACTION_CLASSES.filter(ac => ['contain_owned_asset', 'revoke_owned_access', 'rotate_owned_secret', 'preserve_evidence', 'restore_owned_asset'].includes(ac)).map(ac => (
                <option key={ac} value={ac}>{ac.replace(/_/g, ' ')} {requiresApproval(ac) ? '(approval required)' : ''}</option>
              ))}
            </select>
          </div>
        </div>
        {selectedAssetObj && !EXECUTABLE_STATUSES.includes(selectedAssetObj.ownership_status) && (
          <div className="flex items-start gap-1.5 text-[10px] font-mono px-3 py-2 rounded border border-red-500/30 bg-red-500/05 text-red-300">
            <ShieldAlert className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>Safety Gate: ownership '{selectedAssetObj.ownership_status}' is not executable. Confirming will log a denial — no action runs.</span>
          </div>
        )}
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
          placeholder="Justification note (optional)…"
          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-[#c9b787]/40 resize-none" />
        <div className="flex items-center gap-3">
          <button onClick={handleClickQueue} disabled={!selectedAsset || !selectedAction}
            className="flex items-center gap-1.5 px-4 py-2 rounded text-[10px] font-mono font-bold border transition-all disabled:opacity-40"
            style={{ borderColor: '#c9b787', color: '#c9b787', background: 'rgba(201,183,135,0.05)' }}>
            <Zap className="w-3.5 h-3.5" /> Review & Queue
          </button>
          {result && (
            <div className={cn('flex items-center gap-1.5 text-[10px] font-mono px-3 py-1.5 rounded border',
              result.ok ? 'text-green-400 border-green-500/20 bg-green-500/05' : 'text-red-400 border-red-500/20 bg-red-500/05')}>
              {result.ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              {result.message}
            </div>
          )}
        </div>
      </div>

      <ActionConfirmModal
        open={confirmOpen}
        asset={selectedAssetObj}
        actionClass={selectedActionClass}
        actionLabel={selectedAction ? selectedAction.replace(/_/g, ' ') : 'Containment Action'}
        reversible={true}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

function BlastRadiusPreview({ assetId, actionClass }: { assetId: string; actionClass: string }) {
  const store = useSentraStore();
  const asset = store.getAsset(assetId);
  if (!asset) return null;
  const blast = store.computeBlastRadius(assetId, actionClass as Parameters<typeof runPolicyGate>[0]['action_class']);
  const rollbackColor = { low: '#4ade80', medium: '#f59e0b', high: '#e05252' }[blast.rollback_cost];

  return (
    <div className="rounded-lg border p-3" style={{ background: 'rgba(245,158,11,0.04)', borderColor: 'rgba(245,158,11,0.15)' }}>
      <div className="text-[10px] font-mono uppercase text-[#f59e0b] mb-2">Counterfactual Blast Radius Preview</div>
      <div className="text-[11px] text-slate-300 mb-3 leading-relaxed">{blast.description}</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Unreachable', value: blast.unreachable_assets.length },
          { label: 'Revoked Sessions', value: blast.revoked_sessions },
          { label: 'Downstream', value: blast.downstream_services.length },
          { label: 'Recovery (min)', value: blast.estimated_recovery_minutes },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <div className="text-lg font-bold text-slate-200">{value}</div>
            <div className="text-[9px] font-mono text-slate-500">{label}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-[10px] font-mono">
        Rollback cost: <span style={{ color: rollbackColor }} className="font-bold">{blast.rollback_cost.toUpperCase()}</span>
      </div>
    </div>
  );
}

interface LiveEvidencePack {
  pack_id: string;
  pack_hash: string;
  signer_id: string;
  publication?: { attempted: boolean; ok: boolean; reason?: string; topic?: string };
}

async function signEvidencePackViaSentraCore(
  incidentId: string,
  items: Array<{ id: string; kind: string; description: string; payload: string }>,
): Promise<LiveEvidencePack> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const cookieMatch =
    typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/) : null;
  let token = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
  if (!token) {
    try {
      await fetch('/api/csrf-token', { credentials: 'include' });
      const m =
        typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/) : null;
      token = m ? decodeURIComponent(m[1]) : null;
    } catch {
      /* best-effort */
    }
  }
  if (token) headers['X-CSRF-Token'] = token;
  const res = await fetch('/api/sentra/core/evidence-pack', {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ incident_id: incidentId, items }),
  });
  if (!res.ok) throw new Error(`evidence-pack HTTP ${res.status}`);
  const json = (await res.json()) as { data?: LiveEvidencePack } & LiveEvidencePack;
  return (json.data ?? json) as LiveEvidencePack;
}

function EvidencePane({ incident }: { incident: Incident }) {
  const store = useSentraStore();
  const [fileType, setFileType] = useState('log_excerpt');
  const [fileName, setFileName] = useState('');
  const [source, setSource] = useState('');
  const [collected, setCollected] = useState(false);
  const [signing, setSigning] = useState(false);
  const [livePack, setLivePack] = useState<LiveEvidencePack | null>(null);
  const [packError, setPackError] = useState<string | null>(null);

  const evItems = store.evidence.filter(e => e.incident_id === incident.id);

  async function handleSignPack() {
    if (evItems.length === 0) {
      setPackError('Collect at least one evidence item before signing a pack.');
      setTimeout(() => setPackError(null), 4000);
      return;
    }
    setSigning(true);
    setPackError(null);
    try {
      const pack = await signEvidencePackViaSentraCore(
        incident.id,
        evItems.map((e) => ({
          id: e.id,
          kind: e.type,
          description: e.file_name,
          payload: e.sha256 || e.id,
        })),
      );
      setLivePack(pack);
    } catch (err) {
      setPackError(`Sidecar unreachable: ${err instanceof Error ? err.message : String(err)}`);
      setTimeout(() => setPackError(null), 6000);
    } finally {
      setSigning(false);
    }
  }

  function handleCollect() {
    if (!fileName || !source) return;
    store.addEvidence({
      incident_id: incident.id,
      tenant_id: incident.tenant_id,
      type: fileType as Parameters<typeof store.addEvidence>[0]['type'],
      source,
      file_name: fileName,
      sha256: store.simpleHash(`${incident.id}-${fileName}-${Date.now()}`),
      storage_uri: `evidence://${incident.id}/${Date.now()}`,
      collected_by: 'Analyst (Incident Detail)',
      size_bytes: Math.floor(Math.random() * 500000) + 1024,
      description: `Evidence collected from ${source} for incident ${incident.id}`,
    });
    setCollected(true);
    setFileName('');
    setSource('');
    setTimeout(() => setCollected(false), 3000);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="text-[10px] font-mono uppercase text-slate-500">Collect Evidence</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select value={fileType} onChange={e => setFileType(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none focus:border-[#c9b787]/40">
            {['log_excerpt', 'pcap', 'memory_dump', 'screenshot', 'artifact', 'indicator'].map(t => (
              <option key={t} value={t}>{t.replace(/_/g, ' ').toUpperCase()}</option>
            ))}
          </select>
          <input type="text" value={source} onChange={e => setSource(e.target.value)} placeholder="Source system…"
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-[#c9b787]/40" />
          <input type="text" value={fileName} onChange={e => setFileName(e.target.value)} placeholder="File name…"
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-[#c9b787]/40" />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={handleCollect} disabled={!fileName || !source}
            className="flex items-center gap-1.5 px-4 py-2 rounded text-[10px] font-mono font-bold border transition-all disabled:opacity-40"
            style={{ borderColor: '#c9b787', color: '#c9b787', background: 'rgba(201,183,135,0.05)' }}>
            <FolderLock className="w-3.5 h-3.5" /> Collect & Hash
          </button>
          <button
            data-testid="sign-evidence-pack"
            onClick={() => { void handleSignPack(); }}
            disabled={signing || evItems.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded text-[10px] font-mono font-bold border transition-all disabled:opacity-40"
            style={{ borderColor: '#60a5fa', color: '#60a5fa', background: 'rgba(96,165,250,0.05)' }}
          >
            <Download className="w-3.5 h-3.5" />
            {signing ? 'Signing…' : livePack ? 'Re-sign Pack via sentra-core' : 'Sign Evidence Pack via sentra-core'}
          </button>
          {collected && <span className="text-[10px] font-mono text-green-400">✓ Evidence collected and SHA-256 hashed</span>}
          {packError && <span className="text-[10px] font-mono text-red-400">{packError}</span>}
        </div>
      </div>

      {livePack && (
        <div
          data-testid="live-evidence-pack-link"
          className="rounded-lg border p-4 space-y-2"
          style={{ background: 'rgba(96,165,250,0.04)', borderColor: 'rgba(96,165,250,0.25)' }}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#60a5fa]">
                Signed evidence pack · sentra-core evidence_pack.build
              </div>
              <div className="mt-1 flex items-center gap-3 flex-wrap font-mono text-xs">
                <span className="text-slate-100">
                  pack <span className="text-[#60a5fa]">{livePack.pack_id.slice(0, 16)}…</span>
                </span>
                <span className="text-slate-500">signer <span className="text-slate-300">{livePack.signer_id}</span></span>
              </div>
              <div className="mt-1 text-[10px] font-mono text-slate-500 break-all max-w-2xl">
                hash {livePack.pack_hash}
              </div>
              {livePack.publication && (
                <div className="text-[10px] font-mono mt-1 text-slate-500">
                  {livePack.publication.attempted && livePack.publication.ok
                    ? `published to ${livePack.publication.topic ?? 'sentra.evidence'}`
                    : livePack.publication.attempted
                      ? `publish failed (${livePack.publication.reason ?? 'unknown'})`
                      : 'publish skipped (no yawar_url configured)'}
                </div>
              )}
            </div>
            <Link
              href="/evidence-vault"
              className="text-[10px] font-mono text-[#60a5fa] hover:underline whitespace-nowrap"
            >
              Open in Evidence Vault →
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {evItems.length === 0 ? (
          <div className="text-center py-8 text-slate-600 text-sm">No evidence collected yet for this incident</div>
        ) : (
          evItems.map(ev => (
            <div key={ev.id} className="flex items-center gap-3 p-3 rounded-md border border-slate-700/50"
              style={{ background: 'rgba(255,255,255,0.02)' }}>
              <FolderLock className="w-4 h-4 text-[#c9b787] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-300">{ev.file_name}</div>
                <div className="text-[10px] font-mono text-slate-600 truncate">SHA-256: {ev.sha256.substring(0, 24)}…</div>
              </div>
              <div className="flex items-center gap-2">
                {ev.locked ? (
                  <span className="text-[9px] font-mono text-green-400 flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> LOCKED</span>
                ) : (
                  <button onClick={() => store.lockEvidence(ev.id, 'Analyst (Incident Detail)')}
                    className="text-[9px] font-mono text-[#c9b787] hover:underline">Lock</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AttributionPane({ incident }: { incident: Incident }) {
  const attr = incident.attribution_draft;
  if (!attr) {
    return (
      <div className="text-center py-12 text-slate-600 text-sm">
        <Target className="w-8 h-8 text-slate-700 mx-auto mb-3" />
        No attribution draft for this incident.<br />
        <span className="text-[11px] text-slate-700">Attribution draft is auto-generated by A11oy Attribution Agent for critical incidents.</span>
      </div>
    );
  }

  const confColor = attr.confidence === 'high' ? '#e05252' : attr.confidence === 'medium' ? '#f59e0b' : '#8a8a8a';

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4 space-y-3" style={{ background: 'rgba(224,82,82,0.04)', borderColor: 'rgba(224,82,82,0.12)' }}>
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-mono uppercase text-red-400">Attribution Draft — Human Review Required</div>
          {!attr.human_reviewed && (
            <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20">NOT YET REVIEWED</span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
          <div className="space-y-2">
            <div>
              <div className="text-[10px] font-mono text-slate-500">Suspected Actor</div>
              <div className="text-sm font-bold text-[#e05252]">{attr.suspected_actor}</div>
              <div className="text-[10px] font-mono text-slate-500">MITRE Ref: {attr.actor_catalog_ref}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-500">Confidence</div>
              <div className="font-bold" style={{ color: confColor }}>{attr.confidence.toUpperCase()}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-500 mb-1">MITRE Techniques</div>
              <div className="flex flex-wrap gap-1">
                {attr.mitre_techniques.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-400 border border-slate-700">{t}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <div className="text-[10px] font-mono text-slate-500 mb-1">Indicators</div>
              <ul className="space-y-1">
                {attr.indicators.map(ind => (
                  <li key={ind} className="flex items-start gap-1.5 text-[10px]">
                    <AlertTriangle className="w-3 h-3 text-[#f59e0b] flex-shrink-0 mt-0.5" />
                    <span className="text-slate-400 font-mono">{ind}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-500 mb-1">Reasoning</div>
              <div className="text-[10px] text-slate-400 italic leading-relaxed">{attr.reasoning}</div>
            </div>
          </div>
        </div>
        <div className="text-[10px] font-mono text-slate-600">
          Drafted by: {attr.drafted_by} · {new Date(attr.drafted_at).toLocaleString()}
        </div>
      </div>
      <div className="p-3 rounded-md border text-[10px] font-mono text-slate-500" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <strong className="text-[#c9b787]">CAUTION: </strong>
        Attribution is machine-drafted and unconfirmed. Human analyst review required before any legal, law enforcement, or external disclosure use.
        Sentra does not take offensive action on suspected attacker infrastructure. Attribution is informational only.
      </div>
    </div>
  );
}

function EscalatePane({ incident }: { incident: Incident }) {
  const store = useSentraStore();
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatedType, setGeneratedType] = useState<string | null>(null);
  const [advancingStatus, setAdvancingStatus] = useState(false);

  const transitions = STATUS_TRANSITIONS[incident.status];
  const existingReports = store.reports.filter(r => r.incident_id === incident.id);

  async function handleAdvance(newStatus: IncidentStatus) {
    setAdvancingStatus(true);
    await new Promise(r => setTimeout(r, 300));
    store.advanceIncident(incident.id, newStatus, 'Analyst (Console)', `Status advanced to ${newStatus} by analyst`);
    setAdvancingStatus(false);
  }

  async function handleGenerateReport(type: ReportType) {
    setGeneratingReport(true);
    await new Promise(r => setTimeout(r, 500));
    store.generateReport(incident.id, type, 'Analyst (Incident Detail)');
    setGeneratedType(type);
    setGeneratingReport(false);
    setTimeout(() => setGeneratedType(null), 3000);
  }

  async function handleLinkCounsel() {
    store.addIncidentNote(incident.id, 'Analyst', 'Incident linked to Counsel — legal matter created for legal hold and law enforcement coordination');
    store.writeAudit({
      actor: 'Analyst (Console)',
      action: 'counsel_linked',
      action_class: 'update_case',
      target_asset_id: incident.affected_assets[0]?.asset_id ?? null,
      integration_id: null,
      policy_decision: 'allow',
      approval_id: null,
      execution_result: 'success',
      evidence_hash: null,
      rollback_reference: null,
      notes: `Incident ${incident.id} linked to Counsel legal matter`,
    });
    const inc = store.incidents.find(i => i.id === incident.id);
    if (inc) { inc.counsel_linked = true; store.notify(); }
  }

  return (
    <div className="space-y-4">
      {/* Status advancement */}
      <div className="rounded-lg border p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="text-[10px] font-mono uppercase text-slate-500">Advance Incident Status</div>
        <div className="flex items-center gap-2 flex-wrap">
          {transitions.length === 0 ? (
            <span className="text-[11px] text-slate-600">Incident is closed — no further status transitions available</span>
          ) : (
            transitions.map(next => (
              <button key={next} onClick={() => handleAdvance(next)} disabled={advancingStatus}
                className="flex items-center gap-1.5 px-3 py-2 rounded text-[10px] font-mono border transition-all disabled:opacity-40 hover:bg-slate-800/40"
                style={{ borderColor: 'rgba(201,183,135,0.3)', color: '#c9b787' }}>
                <ChevronRight className="w-3 h-3" />
                Advance to: {STATUS_LABEL[next]}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Report generation */}
      <div className="rounded-lg border p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="text-[10px] font-mono uppercase text-slate-500">Generate Reports</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {(['executive_summary', 'technical_incident', 'law_enforcement_referral', 'insurance', 'post_incident_review', 'remediation_plan'] as ReportType[]).map(type => (
            <button key={type} onClick={() => handleGenerateReport(type)} disabled={generatingReport}
              className="px-3 py-2 rounded text-[10px] font-mono border transition-all disabled:opacity-40 text-left hover:border-[#c9b787]/30"
              style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#c9b787' }}>
              {type.replace(/_/g, ' ').toUpperCase()}
            </button>
          ))}
        </div>
        {generatedType && <div className="text-[10px] font-mono text-green-400">✓ Report generated: {generatedType} — view in Reports Generator</div>}
        {existingReports.length > 0 && (
          <div className="text-[10px] font-mono text-slate-500">{existingReports.length} existing reports — <Link href="/reports-generator"><span className="text-[#c9b787] hover:underline cursor-pointer">View all →</span></Link></div>
        )}
      </div>

      {/* Counsel link */}
      <div className="rounded-lg border p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="text-[10px] font-mono uppercase text-slate-500">External Escalation</div>
        <div className="flex items-center gap-3">
          <button onClick={handleLinkCounsel} disabled={incident.counsel_linked}
            className="flex items-center gap-1.5 px-3 py-2 rounded text-[10px] font-mono border transition-all disabled:opacity-40"
            style={{ borderColor: 'rgba(255,255,255,0.1)', color: incident.counsel_linked ? '#4ade80' : '#f5f5f5' }}>
            {incident.counsel_linked ? <CheckCircle2 className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
            {incident.counsel_linked ? 'Linked to Counsel' : 'Link to Counsel (Legal Matter)'}
          </button>
          <Link href="/approval-queue">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded text-[10px] font-mono border transition-all hover:border-[#c9b787]/30"
              style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#c9b787' }}>
              <Clock className="w-3.5 h-3.5" /> View Approval Queue
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function IncidentDetailV2() {
  const params = useParams<{ id: string }>();
  const incidentId = params.id;
  useEffect(() => { ensureSeeded(); }, []);
  const store = useSentraStore();

  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const incident = store.incidents.find(i => i.id === incidentId);

  if (!incident) {
    return (
      <div className="p-6">
        <Link href="/incidents">
          <div className="flex items-center gap-2 text-slate-500 hover:text-[#c9b787] cursor-pointer mb-4 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Incidents
          </div>
        </Link>
        <div className="text-center py-12 text-slate-600">Incident not found: {incidentId}</div>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: typeof Shield }[] = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'contain', label: 'Contain', icon: Lock },
    { id: 'evidence', label: 'Evidence', icon: FolderLock },
    { id: 'attribution', label: 'Attribution', icon: Target },
    { id: 'escalate', label: 'Escalate', icon: AlertTriangle },
  ];

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      {/* Back + header */}
      <div>
        <Link href="/incidents">
          <div className="flex items-center gap-2 text-slate-500 hover:text-[#c9b787] cursor-pointer mb-3 text-sm w-fit">
            <ArrowLeft className="w-4 h-4" /> All Incidents
          </div>
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SEV_COLOR[incident.severity] }} />
              <span className="text-[10px] font-mono text-slate-500">{incident.id}</span>
              <StatusPill status={incident.status} />
              {incident.counsel_linked && (
                <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-[#c9b787]/10 text-[#c9b787] border border-[#c9b787]/20">COUNSEL LINKED</span>
              )}
            </div>
            <h1 className="text-xl font-display font-bold text-slate-100 leading-tight">{incident.title}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-[10px] font-mono font-bold" style={{ color: SEV_COLOR[incident.severity] }}>{incident.severity.toUpperCase()}</span>
              <span className="text-[10px] text-slate-600">·</span>
              <span className="text-[10px] font-mono text-slate-500">{incident.attack_vector}</span>
              <span className="text-[10px] text-slate-600">·</span>
              <span className="text-[10px] font-mono text-slate-500">{incident.assigned_analyst}</span>
              <span className="text-[10px] text-slate-600">·</span>
              <span className="text-[10px] font-mono text-slate-600">{new Date(incident.detected_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800 pb-0">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={cn('flex items-center gap-1.5 px-3 py-2 text-[10px] font-mono uppercase tracking-wider transition-all border-b-2 -mb-px',
              activeTab === id ? 'border-[#c9b787] text-[#c9b787]' : 'border-transparent text-slate-500 hover:text-slate-300')}>
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 text-[11px] leading-relaxed text-slate-400" style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}>
              {incident.description}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <OperatorAttentionPanel incidentId={incident.id} />
              <BlastRadiusSim
                incidentId={incident.id}
                affectedAssetCount={incident.affected_assets.length}
                severity={incident.severity}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border p-4" style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="text-[10px] font-mono uppercase text-slate-500 mb-2">MITRE ATT&CK Techniques</div>
                <div className="flex flex-wrap gap-1">
                  {incident.mitre_techniques.map(t => (
                    <span key={t} className="px-2 py-0.5 rounded text-[9px] font-mono bg-red-500/10 text-red-400 border border-red-500/15">{t}</span>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border p-4" style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="text-[10px] font-mono uppercase text-slate-500 mb-2">Affected Assets</div>
                <div className="space-y-1">
                  {incident.affected_assets.map(a => (
                    <div key={a.asset_id} className="flex items-center gap-2 text-[11px]">
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-slate-800 text-slate-400 border border-slate-700">{a.role}</span>
                      <span className="text-slate-300">{a.asset_name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border p-4" style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="text-[10px] font-mono uppercase text-slate-500 mb-2">Linked Records</div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between"><span className="text-slate-500">Approvals</span><span className="font-mono text-slate-300">{incident.approval_ids.length}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Evidence Items</span><span className="font-mono text-slate-300">{incident.evidence_ids.length}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Reports</span><span className="font-mono text-slate-300">{incident.report_ids.length}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Detection Source</span><span className="font-mono text-slate-300">{incident.detection_source}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'timeline' && <TimelinePane incident={incident} />}
        {activeTab === 'contain' && <ContainPane incident={incident} />}
        {activeTab === 'evidence' && <EvidencePane incident={incident} />}
        {activeTab === 'attribution' && <AttributionPane incident={incident} />}
        {activeTab === 'escalate' && <EscalatePane incident={incident} />}
      </div>
    </div>
  );
}
