import {
  type AutonomyMode,
  type EvidenceSource,
  type PolicyState,
  ProofEnvelope,
} from '@szl-holdings/design-system';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  CheckCircle2,
  Clock,
  Cpu,
  Info,
  Loader2,
  Plus,
  ShieldAlert,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { PageHeader, SeverityChip, StatusChip } from '@/lib/data-provenance';
import { HealthcareCaseStudyBanner } from '../components/healthcare-case-study-banner';
import {
  createIncident,
  listIncidents,
  updateIncident,
  type Incident,
  type IncidentSeverity,
  type IncidentStatus,
} from '@/lib/sentra-api';

const ACCENT = '#f5f5f5';

const ISOLATION_EVIDENCE: EvidenceSource[] = [
  {
    id: 'ev-inc-001',
    label: 'Network Sensor — PLC-003 Outbound Traffic',
    type: 'signal',
    timestamp: new Date(Date.now() - 3 * 60_000).toISOString(),
    excerpt:
      'Anomalous C2 beaconing detected from PLC Controller (asset-003) to known malicious IP 45.142.x.x at 3-minute intervals. Confidence: critical.',
  },
  {
    id: 'ev-inc-002',
    label: 'EDR — SCADA Payload Signature Match',
    type: 'api',
    timestamp: new Date(Date.now() - 10 * 60_000).toISOString(),
    excerpt:
      'Encrypted payload on SCADA Server matched LockBit-adjacent signature (SHA-256: a3f1...c9e2). Confidence 97% malicious. Immediate isolation recommended.',
  },
];

const RESET_EVIDENCE: EvidenceSource[] = [
  {
    id: 'ev-inc-003',
    label: 'IAM — Credential Spray Detection',
    type: 'api',
    timestamp: new Date(Date.now() - 25 * 60_000).toISOString(),
    excerpt:
      '14 failed login attempts on OT-Admin account from lateral IP in last 30 minutes. Pattern consistent with credential spraying targeting SCADA segment admin accounts.',
  },
];

const STATUS_FLOW: Record<IncidentStatus, IncidentStatus | null> = {
  open: 'triaging',
  triaging: 'escalated',
  escalated: 'contained',
  contained: 'resolved',
  resolved: null,
};

const STATUS_LABELS: Record<IncidentStatus, string> = {
  open: 'Start Triage',
  triaging: 'Escalate to P1',
  escalated: 'Mark Contained',
  contained: 'Resolve',
  resolved: 'Resolved',
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

interface CreateModalProps {
  onClose: () => void;
  onCreate: (incident: Incident) => void;
}

function CreateIncidentModal({ onClose, onCreate }: CreateModalProps) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    severity: 'high' as IncidentSeverity,
    mitreStage: 'Initial Access',
    assignedTo: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required.');
      return;
    }
    setSaving(true);
    setError(null);
    const result = await createIncident({
      title: form.title,
      description: form.description,
      severity: form.severity,
      mitreStage: form.mitreStage,
      assignedTo: form.assignedTo || undefined,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onCreate(result.incident);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-xl border bg-slate-900 shadow-2xl"
        style={{ borderColor: 'rgba(239,68,68,0.25)' }}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-sm font-bold text-slate-100 font-display">Create Incident</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="p-5 space-y-4"
        >
          <div>
            <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-1">
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Suspicious lateral movement from web-01"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-[#f5f5f5]/40"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-1">
              Description *
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the incident, affected systems, and initial indicators…"
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-[#f5f5f5]/40 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-1">
                Severity
              </label>
              <select
                value={form.severity}
                onChange={(e) =>
                  setForm({ ...form, severity: e.target.value as IncidentSeverity })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-1">
                MITRE Stage
              </label>
              <input
                type="text"
                value={form.mitreStage}
                onChange={(e) => setForm({ ...form, mitreStage: e.target.value })}
                placeholder="e.g. Lateral Movement"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-[#f5f5f5]/40"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-1">
              Assign To
            </label>
            <input
              type="text"
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              placeholder="e.g. IR Analyst, SOC Lead"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-[#f5f5f5]/40"
            />
          </div>
          {error && (
            <div className="text-xs text-[#f5f5f5] bg-[#f5f5f5]/10 border border-[#f5f5f5]/20 rounded px-3 py-2">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-800 transition-colors border border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[#f5f5f5] hover:bg-[#f5f5f5] text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              Create Incident
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface IncidentDetailProps {
  incident: Incident;
  onUpdate: (updated: Incident) => void;
}

function IncidentDetailPanel({ incident, onUpdate }: IncidentDetailProps) {
  const [advancing, setAdvancing] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [isolationMode, setIsolationMode] = useState<AutonomyMode>('recommend');
  const [resetMode, setResetMode] = useState<AutonomyMode>('recommend');

  const nextStatus = STATUS_FLOW[incident.status];

  const advance = async () => {
    if (!nextStatus) return;
    setAdvancing(true);
    const result = await updateIncident(incident.id, {
      status: nextStatus,
      actor: incident.assignedTo ?? 'Operator',
    });
    setAdvancing(false);
    if (result.ok) onUpdate(result.incident);
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    setAddingNote(true);
    const result = await updateIncident(incident.id, {
      note: noteText,
      actor: incident.assignedTo ?? 'Operator',
    });
    setAddingNote(false);
    if (result.ok) {
      onUpdate(result.incident);
      setNoteText('');
    }
  };

  const isActive = incident.id === 'INC-2026-0891';

  return (
    <div className="space-y-5">
      <div className="sentra-panel p-6">
        <div className="flex justify-between items-start gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] text-slate-500 font-mono">{incident.id}</span>
              <SeverityChip severity={incident.severity} />
              <StatusChip status={incident.status} />
            </div>
            <h2 className="text-lg font-display font-bold text-slate-100">{incident.title}</h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
                MITRE: {incident.mitreStage}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Detected {relativeTime(incident.detectedAt)}
              </span>
              {incident.assignedTo && (
                <span className="text-xs text-slate-500">→ {incident.assignedTo}</span>
              )}
            </div>
          </div>
          {nextStatus && (
            <button
              onClick={() => {
                void advance();
              }}
              disabled={advancing}
              className="px-4 py-2 rounded-lg bg-[#f5f5f5]/90 hover:bg-[#f5f5f5] text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
            >
              {advancing && <Loader2 className="w-3 h-3 animate-spin" />}
              {STATUS_LABELS[incident.status]}
            </button>
          )}
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">{incident.description}</p>
      </div>

      {isActive && (
        <div className="sentra-panel p-6 space-y-4">
          <h3 className="text-xs text-slate-500 uppercase tracking-widest font-mono font-bold">
            Recommended Containment Actions
          </h3>
          <ProofEnvelope
            title="Isolate PLC Segment (VLAN 42)"
            accentColor={ACCENT}
            evidence={ISOLATION_EVIDENCE}
            timestamp={ISOLATION_EVIDENCE[0].timestamp}
            confidence={94}
            policyState={'allowed' as PolicyState}
            autonomyMode={isolationMode}
            onAutonomyChange={setIsolationMode}
          >
            <div className="p-4 bg-[#f5f5f5]/5 rounded border border-[#f5f5f5]/10">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#f5f5f5]/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-[#f5f5f5]" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-200">Isolate PLC Segment (VLAN 42)</div>
                    <p className="text-xs text-slate-500">
                      Anomalous C2 beaconing from PLC Controller (asset-003).
                    </p>
                  </div>
                </div>
                <button className="px-4 py-1.5 rounded bg-[#f5f5f5] hover:bg-[#f5f5f5] text-white text-xs font-bold transition-colors ml-4 shrink-0">
                  Execute Isolation
                </button>
              </div>
            </div>
          </ProofEnvelope>

          <ProofEnvelope
            title="Force Password Reset — OT-Admin Accounts"
            accentColor="#c9b787"
            evidence={RESET_EVIDENCE}
            timestamp={RESET_EVIDENCE[0].timestamp}
            confidence={88}
            policyState={'requires-approval' as PolicyState}
            autonomyMode={resetMode}
            onAutonomyChange={setResetMode}
          >
            <div className="p-4 bg-[#c9b787]/5 rounded border border-[#c9b787]/10">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#c9b787]/20 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4 text-[#c9b787]" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-200">
                      Force Password Reset — OT-Admin
                    </div>
                    <p className="text-xs text-slate-500">
                      Credential spraying detected on OT admin accounts.
                    </p>
                  </div>
                </div>
                <button className="px-4 py-1.5 rounded bg-[#c9b787] hover:bg-[#c9b787] text-white text-xs font-bold transition-colors ml-4 shrink-0">
                  Trigger Reset
                </button>
              </div>
            </div>
          </ProofEnvelope>
        </div>
      )}

      {isActive && (
        <div className="sentra-panel p-6">
          <h3 className="text-xs text-slate-500 uppercase font-mono mb-4">Affected Assets</h3>
          <div className="space-y-2">
            {incident.affectedAssets.map((assetId) => {
              return (
                <div
                  key={assetId}
                  className="flex items-center justify-between p-3 rounded bg-slate-800/50 border border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <Cpu className="w-4 h-4 text-[#f5f5f5]" />
                    <div>
                      <div className="text-xs font-bold text-slate-200">
                        {assetId}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">{assetId}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#f5f5f5]/10 text-[9px] text-[#f5f5f5] border border-[#f5f5f5]/20 font-bold">
                    COMPROMISED
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="sentra-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs text-slate-500 uppercase font-mono font-bold">Incident Timeline</h3>
          <span className="text-[10px] text-slate-600 font-mono">{incident.timeline.length} events</span>
        </div>
        <div className="space-y-4 mb-4">
          {incident.timeline.map((entry, i) => (
            <div key={entry.id ?? i} className="flex gap-4">
              <div className="text-xs font-mono text-slate-500 pt-0.5 shrink-0 w-16">
                {relativeTime(entry.timestamp)}
              </div>
              <div className="flex-1 pb-4 border-b border-slate-800 last:border-0">
                <div
                  className={cn(
                    'text-xs',
                    entry.type === 'detection' || entry.type === 'escalation'
                      ? 'text-[#f5f5f5]'
                      : entry.type === 'resolution'
                        ? 'text-[#c9b787]'
                        : 'text-slate-300',
                  )}
                >
                  {entry.message}
                </div>
                <div className="text-[10px] text-slate-600 font-mono mt-0.5">{entry.actor}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-3 border-t border-slate-800">
          <input
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                void addNote();
              }
            }}
            placeholder="Add a note to the timeline…"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-[#f5f5f5]/40"
          />
          <button
            onClick={() => {
              void addNote();
            }}
            disabled={addingNote || !noteText.trim()}
            className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-mono transition-colors disabled:opacity-50"
          >
            {addingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
          </button>
        </div>
      </div>

      {isActive && (
        <div className="sentra-panel p-6">
          <h3 className="text-xs text-slate-500 uppercase font-mono mb-4">Commander Checklist</h3>
          <div className="space-y-3">
            {[
              { done: true, label: 'Detection confirmed', active: false },
              { done: true, label: 'Impact scope analyzed', active: false },
              {
                done: incident.status !== 'open',
                label: 'Containment in progress',
                active: incident.status === 'open',
              },
              {
                done: ['contained', 'resolved'].includes(incident.status),
                label: 'Eradication complete',
                active: false,
              },
              {
                done: incident.status === 'resolved',
                label: 'Resolved & closed',
                active: false,
              },
            ].map((item, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-3 text-xs',
                  item.done
                    ? 'text-[#c9b787]'
                    : item.active
                      ? 'text-[#c9b787]'
                      : 'text-slate-500',
                )}
              >
                {item.done ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : item.active ? (
                  <Activity className="w-4 h-4 animate-pulse" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function IncidentCommander() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [source, setSource] = useState<'live' | 'seed' | 'loading'>('loading');
  const [selectedId, setSelectedId] = useState<string>('INC-2026-0891');
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setSource('loading');
    const result = await listIncidents();
    setIncidents(result.incidents);
    setSource(result.source);
  };

  useEffect(() => {
    void load();
  }, []);

  const selected = incidents.find((i) => i.id === selectedId) ?? incidents[0];
  const activeCount = incidents.filter((i) => !['resolved', 'contained'].includes(i.status)).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Incident Commander"
        subtitle="Real-time containment and response orchestration"
        provenance={source}
        actions={
          <div className="flex items-center gap-3">
            {activeCount > 0 && (
              <div className="px-3 py-1.5 rounded border border-[#f5f5f5]/40 bg-[#f5f5f5]/10 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#f5f5f5] animate-pulse" />
                <span className="text-xs font-mono text-[#f5f5f5]">{activeCount} active</span>
              </div>
            )}
            <button
              onClick={() => setShowCreate(true)}
              className="px-3 py-1.5 rounded-lg bg-[#f5f5f5]/80 hover:bg-[#f5f5f5] text-white text-xs font-bold transition-colors flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              New Incident
            </button>
          </div>
        }
      />

      <HealthcareCaseStudyBanner currentPage="incident-commander" />

      {showCreate && (
        <CreateIncidentModal
          onClose={() => setShowCreate(false)}
          onCreate={(incident) => {
            setIncidents((prev) => [incident, ...prev]);
            setSelectedId(incident.id);
            setShowCreate(false);
          }}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-2">
          {source === 'loading' ? (
            <div className="space-y-2 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="sentra-panel p-4 h-20" />
              ))}
            </div>
          ) : (
            incidents.map((inc) => (
              <button
                key={inc.id}
                onClick={() => setSelectedId(inc.id)}
                className={cn(
                  'w-full text-left sentra-panel p-4 transition-colors',
                  (selectedId === inc.id || (!selectedId && inc === incidents[0]))
                    ? 'border-[#f5f5f5]/30 bg-[#f5f5f5]/5'
                    : 'hover:bg-slate-800/30',
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="text-xs font-bold text-slate-200 leading-tight line-clamp-2">
                    {inc.title}
                  </div>
                  <SeverityChip severity={inc.severity} />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-slate-500 font-mono">{inc.id}</span>
                  <StatusChip status={inc.status} />
                </div>
                <div className="text-[10px] text-slate-600 font-mono mt-1 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {relativeTime(inc.detectedAt)}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-8">
          {selected ? (
            <IncidentDetailPanel
              key={selected.id}
              incident={selected}
              onUpdate={(updated) => {
                setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
              }}
            />
          ) : (
            <div className="sentra-panel p-16 text-center">
              <Cpu className="w-8 h-8 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Select an incident to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
