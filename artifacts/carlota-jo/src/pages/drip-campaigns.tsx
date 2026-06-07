import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Mail, Plus, Play, Pause, Users, BarChart3, Eye, Trash2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const BASE = (import.meta.env.BASE_URL ?? '/carlota-jo/').replace(/\/$/, '');
const API = `${BASE}/api/booking/drip`;

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

type DripSequence = {
  sequenceId: string;
  name: string;
  description: string | null;
  practiceArea: string | null;
  status: string;
  totalSteps: number;
  totalEnrolled: number;
  createdAt: string;
};

type DripStep = {
  stepId: string;
  stepOrder: number;
  delayDays: number;
  subject: string;
  bodyHtml: string;
  ctaUrl: string | null;
  ctaLabel: string | null;
};

type Enrollment = {
  enrollmentId: string;
  contactEmail: string;
  contactName: string | null;
  currentStepOrder: number;
  status: string;
  enrolledAt: string;
  lastSentAt: string | null;
};

const statusColors: Record<string, { bg: string; color: string }> = {
  draft: { bg: '#64748b18', color: '#64748b' },
  active: { bg: '#10b98118', color: '#10b981' },
  paused: { bg: '#f59e0b18', color: '#f59e0b' },
  archived: { bg: '#ef444418', color: '#ef4444' },
  completed: { bg: '#3b82f618', color: '#3b82f6' },
  unsubscribed: { bg: '#ef444418', color: '#ef4444' },
};

const gold = '#c8a84b';

export default function DripCampaignsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sequencesQ = useQuery({
    queryKey: ['drip-sequences'],
    queryFn: () => fetchJson<{ sequences: DripSequence[] }>(`${API}/sequences`),
    refetchInterval: 8000,
  });

  const sequences = sequencesQ.data?.sequences ?? [];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0b0d', color: '#e2e8f0' }}>
      <Header />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#fff', letterSpacing: '0.02em' }}>
              Lead Nurturing
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: '6px 0 0' }}>
              Automated drip email sequences for consulting engagement nurturing
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: 600,
              background: `${gold}15`,
              color: gold,
              border: `1px solid ${gold}30`,
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Plus size={16} /> New Sequence
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          <StatCard label="Total Sequences" value={sequences.length} icon={<Mail size={16} />} />
          <StatCard label="Active" value={sequences.filter((s) => s.status === 'active').length} icon={<Play size={16} />} />
          <StatCard label="Total Enrolled" value={sequences.reduce((s, seq) => s + seq.totalEnrolled, 0)} icon={<Users size={16} />} />
          <StatCard
            label="Total Steps"
            value={sequences.reduce((s, seq) => s + seq.totalSteps, 0)}
            icon={<BarChart3 size={16} />}
          />
        </div>

        {selectedId ? (
          <SequenceDetail
            sequenceId={selectedId}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sequences.length === 0 && (
              <div style={{ textAlign: 'center', padding: 64, color: 'rgba(255,255,255,0.4)' }}>
                <Mail size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                <p style={{ fontSize: 16 }}>No drip sequences yet</p>
                <p style={{ fontSize: 13 }}>Create your first sequence to start nurturing leads.</p>
              </div>
            )}
            {sequences.map((seq) => {
              const sc = statusColors[seq.status] ?? statusColors.draft;
              return (
                <div
                  key={seq.sequenceId}
                  onClick={() => setSelectedId(seq.sequenceId)}
                  style={{
                    background: '#101216',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 10,
                    padding: '18px 22px',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseOver={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = `${gold}30`; }}
                  onMouseOut={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 17, fontWeight: 600, color: '#fff' }}>{seq.name}</span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          padding: '2px 8px',
                          background: sc.bg,
                          color: sc.color,
                          border: `1px solid ${sc.color}35`,
                          borderRadius: 4,
                        }}
                      >
                        {seq.status.toUpperCase()}
                      </span>
                    </div>
                    <Eye size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />
                  </div>
                  {seq.description && (
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 10px' }}>{seq.description}</p>
                  )}
                  <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                    <span>{seq.totalSteps} steps</span>
                    <span>{seq.totalEnrolled} enrolled</span>
                    {seq.practiceArea && <span>{seq.practiceArea}</span>}
                    <span>{new Date(seq.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />

      {showCreate && (
        <CreateSequenceModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            qc.invalidateQueries({ queryKey: ['drip-sequences'] });
          }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div style={{ background: '#101216', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'rgba(255,255,255,0.4)' }}>
        {icon}
        <span style={{ fontSize: 11, letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: gold }}>{value}</div>
    </div>
  );
}

function SequenceDetail({ sequenceId, onBack }: { sequenceId: string; onBack: () => void }) {
  const qc = useQueryClient();

  const detailQ = useQuery({
    queryKey: ['drip-sequence', sequenceId],
    queryFn: () =>
      fetchJson<{
        sequence: DripSequence;
        steps: DripStep[];
        enrollments: Enrollment[];
        engagementStats: { eventType: string; count: number }[];
      }>(`${API}/sequences/${sequenceId}`),
    refetchInterval: 5000,
  });

  const statusMut = useMutation({
    mutationFn: (status: string) =>
      fetchJson(`${API}/sequences/${sequenceId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drip-sequence', sequenceId] });
      qc.invalidateQueries({ queryKey: ['drip-sequences'] });
    },
  });

  const processMut = useMutation({
    mutationFn: () => fetchJson(`${API}/process`, { method: 'POST' }),
  });

  const data = detailQ.data;
  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading…</div>;

  const { sequence, steps, enrollments, engagementStats } = data;

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          marginBottom: 20,
          padding: '6px 14px',
          fontSize: 12,
          background: 'transparent',
          color: gold,
          border: `1px solid ${gold}30`,
          borderRadius: 6,
          cursor: 'pointer',
        }}
      >
        ← Back to Sequences
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#fff' }}>{sequence.name}</h2>
          {sequence.description && (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>{sequence.description}</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {sequence.status === 'draft' && (
            <button onClick={() => statusMut.mutate('active')} style={actionBtnStyle('#10b981')}>
              <Play size={12} /> ACTIVATE
            </button>
          )}
          {sequence.status === 'active' && (
            <button onClick={() => statusMut.mutate('paused')} style={actionBtnStyle('#f59e0b')}>
              <Pause size={12} /> PAUSE
            </button>
          )}
          {sequence.status === 'paused' && (
            <button onClick={() => statusMut.mutate('active')} style={actionBtnStyle('#10b981')}>
              <Play size={12} /> RESUME
            </button>
          )}
          <button onClick={() => processMut.mutate()} disabled={processMut.isPending} style={actionBtnStyle('#3b82f6')}>
            {processMut.isPending ? 'PROCESSING...' : 'PROCESS QUEUE'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: gold, letterSpacing: '0.04em', marginBottom: 12 }}>
            SEQUENCE STEPS ({steps.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {steps.map((step) => (
              <div
                key={step.stepId}
                style={{
                  background: '#101216',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8,
                  padding: '12px 16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                    Step {step.stepOrder}: {step.subject}
                  </span>
                  <span style={{ fontSize: 11, color: '#64748b' }}>
                    {step.delayDays === 0 ? 'Immediately' : `+${step.delayDays}d`}
                  </span>
                </div>
                {step.ctaUrl && (
                  <span style={{ fontSize: 11, color: gold }}>{step.ctaLabel ?? 'CTA'} →</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: gold, letterSpacing: '0.04em', marginBottom: 12 }}>
            ENGAGEMENT STATS
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {engagementStats.map((stat) => {
              const eventColors: Record<string, string> = {
                sent: '#3b82f6',
                delivered: '#10b981',
                opened: '#8b5cf6',
                clicked: '#c8a84b',
                bounced: '#ef4444',
                unsubscribed: '#f59e0b',
              };
              return (
                <div
                  key={stat.eventType}
                  style={{
                    background: '#101216',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8,
                    padding: '10px 14px',
                  }}
                >
                  <div style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.04em', marginBottom: 4 }}>
                    {stat.eventType.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: eventColors[stat.eventType] ?? '#94a3b8' }}>
                    {stat.count}
                  </div>
                </div>
              );
            })}
            {engagementStats.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 24, color: '#475569', fontSize: 12 }}>
                No engagement data yet
              </div>
            )}
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 700, color: gold, letterSpacing: '0.04em', marginBottom: 12 }}>
        ENROLLED CONTACTS ({enrollments.length})
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {enrollments.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: '#475569', fontSize: 12 }}>
            No contacts enrolled yet
          </div>
        )}
        {enrollments.map((enr) => {
          const ec = statusColors[enr.status] ?? statusColors.draft;
          return (
            <div
              key={enr.enrollmentId}
              style={{
                background: '#101216',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 6,
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>
                  {enr.contactName ?? enr.contactEmail}
                </span>
                {enr.contactName && (
                  <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>{enr.contactEmail}</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  Step {enr.currentStepOrder}/{data.sequence.totalSteps}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 6px',
                    background: ec.bg,
                    color: ec.color,
                    borderRadius: 3,
                  }}
                >
                  {enr.status.toUpperCase()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CreateSequenceModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [practiceArea, setPracticeArea] = useState('');
  const [steps, setSteps] = useState<{ delayDays: number; subject: string; bodyHtml: string }[]>([
    { delayDays: 0, subject: '', bodyHtml: '' },
  ]);
  const [saving, setSaving] = useState(false);

  function addStep() {
    setSteps([...steps, { delayDays: 3, subject: '', bodyHtml: '' }]);
  }

  function updateStep(i: number, field: string, value: string | number) {
    const updated = [...steps];
    (updated[i] as Record<string, unknown>)[field] = value;
    setSteps(updated);
  }

  async function handleSave() {
    if (!name || steps.some((s) => !s.subject || !s.bodyHtml)) return;
    setSaving(true);
    try {
      await fetchJson(`${API}/sequences`, {
        method: 'POST',
        body: JSON.stringify({ name, description: description || undefined, practiceArea: practiceArea || undefined, steps }),
      });
      onCreated();
    } catch {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    fontSize: 13,
    background: '#0a0b0d',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    color: '#e2e8f0',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: '0.04em',
    marginBottom: 4,
    display: 'block',
  };

  const practiceAreas = [
    'Residence Operations',
    'Household Systems Design',
    'Special Projects',
    'Lifestyle Administration',
    'Vendor Management',
    'Advisory Continuity',
  ];

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: '#00000080', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#101216', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 28, width: 560, maxHeight: '85vh', overflow: 'auto' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 20px' }}>New Drip Sequence</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Sequence Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Post-Inquiry Follow-Up" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Purpose of this sequence" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Practice Area</label>
            <select value={practiceArea} onChange={(e) => setPracticeArea(e.target.value)} style={inputStyle}>
              <option value="">All Practice Areas</option>
              {practiceAreas.map((pa) => <option key={pa} value={pa}>{pa}</option>)}
            </select>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>EMAIL STEPS</label>
              <button onClick={addStep} style={{ fontSize: 11, color: gold, background: 'none', border: 'none', cursor: 'pointer' }}>
                + Add Step
              </button>
            </div>
            {steps.map((step, i) => (
              <div key={i} style={{ background: '#0a0b0d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 14, marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: gold, marginBottom: 8 }}>Step {i + 1}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 8, marginBottom: 8 }}>
                  <input
                    value={step.subject}
                    onChange={(e) => updateStep(i, 'subject', e.target.value)}
                    placeholder="Email subject line"
                    style={inputStyle}
                  />
                  <input
                    type="number"
                    min={0}
                    value={step.delayDays}
                    onChange={(e) => updateStep(i, 'delayDays', parseInt(e.target.value) || 0)}
                    style={{ ...inputStyle, textAlign: 'center' }}
                    title="Delay days"
                  />
                </div>
                <textarea
                  value={step.bodyHtml}
                  onChange={(e) => updateStep(i, 'bodyHtml', e.target.value)}
                  placeholder="Email body (HTML)"
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name || steps.some((s) => !s.subject || !s.bodyHtml) || saving}
            style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, background: `${gold}15`, color: gold, border: `1px solid ${gold}30`, borderRadius: 6, cursor: 'pointer', opacity: !name || saving ? 0.5 : 1 }}
          >
            {saving ? 'Creating...' : 'Create Sequence'}
          </button>
        </div>
      </div>
    </div>
  );
}

function actionBtnStyle(color: string): React.CSSProperties {
  return {
    padding: '6px 14px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.04em',
    background: `${color}18`,
    color,
    border: `1px solid ${color}35`,
    borderRadius: 6,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  };
}
