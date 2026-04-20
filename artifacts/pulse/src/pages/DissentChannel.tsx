import { AlertTriangle, CheckCircle, Clock, MessageSquare, X } from 'lucide-react';
import { useState } from 'react';
import { useDissents, useFileDissent, useTodaysBrief } from '../lib/api';
import type { DissentRecord } from '../lib/data';

type StatusFilter = 'all' | 'open' | 'under_review' | 'acknowledged' | 'resolved';

function StatusBadge({ status }: { status: DissentRecord['status'] }) {
  const config = {
    open: {
      color: '#e08c40',
      bg: 'rgba(224,140,64,0.1)',
      border: 'rgba(224,140,64,0.3)',
      label: 'Open',
    },
    under_review: {
      color: '#5090e8',
      bg: 'rgba(80,144,232,0.1)',
      border: 'rgba(80,144,232,0.3)',
      label: 'Under Review',
    },
    acknowledged: {
      color: '#c8a84b',
      bg: 'rgba(200,168,75,0.1)',
      border: 'rgba(200,168,75,0.3)',
      label: 'Acknowledged',
    },
    resolved: {
      color: '#4eca8b',
      bg: 'rgba(78,202,139,0.1)',
      border: 'rgba(78,202,139,0.3)',
      label: 'Resolved',
    },
  }[status];

  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: '0.68rem',
        fontWeight: 700,
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      {config.label}
    </span>
  );
}

interface NewDissentForm {
  sectionTitle: string;
  dissentingView: string;
  basis: string;
  impactIfCorrect: string;
}

export default function DissentChannel() {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [showForm, setShowForm] = useState(false);
  const { data: dissentsData } = useDissents();
  const { data: todaysBrief } = useTodaysBrief();
  const fileDissent = useFileDissent();
  const dissents: DissentRecord[] = dissentsData ?? [];
  const [form, setForm] = useState<NewDissentForm>({
    sectionTitle: '',
    dissentingView: '',
    basis: '',
    impactIfCorrect: '',
  });

  const filtered = dissents.filter((d) => filter === 'all' || d.status === filter);

  const handleSubmit = () => {
    if (!form.sectionTitle || !form.dissentingView || !form.basis) return;
    fileDissent.mutate(
      {
        briefingId: todaysBrief?.id,
        sectionId: form.sectionTitle.toLowerCase().replace(/\s+/g, '-'),
        sectionTitle: form.sectionTitle,
        dissentingView: form.dissentingView,
        basis: form.basis,
        impactIfCorrect: form.impactIfCorrect,
      },
      {
        onSuccess: () => {
          setForm({ sectionTitle: '', dissentingView: '', basis: '', impactIfCorrect: '' });
          setShowForm(false);
        },
      },
    );
  };

  const submitting = fileDissent.isPending;

  const counts = {
    all: dissents.length,
    open: dissents.filter((d) => d.status === 'open').length,
    under_review: dissents.filter((d) => d.status === 'under_review').length,
    acknowledged: dissents.filter((d) => d.status === 'acknowledged').length,
    resolved: dissents.filter((d) => d.status === 'resolved').length,
  };

  return (
    <div style={{ padding: '28px 28px 40px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.4rem',
              fontWeight: 600,
              color: 'var(--pulse-text)',
              marginBottom: 6,
            }}
          >
            Dissent Channel
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--pulse-text-muted)', maxWidth: 520 }}>
            Structured disagreement on any AI assessment. Filed dissents are tracked, reviewed, and
            fed back into future confidence calibration.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 16px',
            borderRadius: 6,
            background: 'rgba(200,168,75,0.1)',
            border: '1px solid rgba(200,168,75,0.3)',
            color: 'var(--pulse-gold)',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <MessageSquare size={14} />
          File Dissent
        </button>
      </div>

      {/* File dissent form */}
      {showForm && (
        <div
          className="section-card animate-fadeIn"
          style={{ padding: 24, marginBottom: 20, borderColor: 'rgba(200,168,75,0.25)' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18,
            }}
          >
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--pulse-text)' }}>
              New Dissent — Today's Brief
            </h3>
            <button
              onClick={() => setShowForm(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--pulse-text-muted)',
                padding: 4,
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--pulse-text-muted)',
                  marginBottom: 6,
                }}
              >
                Section Being Dissented *
              </label>
              <input
                value={form.sectionTitle}
                onChange={(e) => setForm((f) => ({ ...f, sectionTitle: e.target.value }))}
                placeholder="e.g. Maritime Outlook"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 6,
                  background: 'var(--pulse-bg)',
                  border: '1px solid var(--pulse-border)',
                  color: 'var(--pulse-text)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--pulse-text-muted)',
                  marginBottom: 6,
                }}
              >
                Impact if Dissent is Correct
              </label>
              <input
                value={form.impactIfCorrect}
                onChange={(e) => setForm((f) => ({ ...f, impactIfCorrect: e.target.value }))}
                placeholder="What changes if this dissent is correct?"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 6,
                  background: 'var(--pulse-bg)',
                  border: '1px solid var(--pulse-border)',
                  color: 'var(--pulse-text)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--pulse-text-muted)',
                marginBottom: 6,
              }}
            >
              Dissenting View *
            </label>
            <textarea
              value={form.dissentingView}
              onChange={(e) => setForm((f) => ({ ...f, dissentingView: e.target.value }))}
              placeholder="State the alternative assessment clearly..."
              rows={2}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 6,
                background: 'var(--pulse-bg)',
                border: '1px solid var(--pulse-border)',
                color: 'var(--pulse-text)',
                fontSize: '0.85rem',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ marginTop: 14 }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--pulse-text-muted)',
                marginBottom: 6,
              }}
            >
              Basis / Evidence *
            </label>
            <textarea
              value={form.basis}
              onChange={(e) => setForm((f) => ({ ...f, basis: e.target.value }))}
              placeholder="What evidence or reasoning supports your dissent?"
              rows={2}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 6,
                background: 'var(--pulse-bg)',
                border: '1px solid var(--pulse-border)',
                color: 'var(--pulse-text)',
                fontSize: '0.85rem',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button
              onClick={handleSubmit}
              disabled={!form.sectionTitle || !form.dissentingView || !form.basis || submitting}
              style={{
                padding: '9px 18px',
                borderRadius: 6,
                background: 'rgba(200,168,75,0.12)',
                border: '1px solid rgba(200,168,75,0.35)',
                color: 'var(--pulse-gold)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {submitting ? 'Filing…' : 'File Dissent'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: '9px 16px',
                borderRadius: 6,
                background: 'transparent',
                border: '1px solid var(--pulse-border)',
                color: 'var(--pulse-text-muted)',
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Status filter tabs */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          marginBottom: 20,
          background: 'var(--pulse-card)',
          padding: 4,
          borderRadius: 8,
          border: '1px solid var(--pulse-border)',
          width: 'fit-content',
        }}
      >
        {(['all', 'open', 'under_review', 'acknowledged', 'resolved'] as StatusFilter[]).map(
          (f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                background: filter === f ? 'rgba(255,255,255,0.07)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: filter === f ? 'var(--pulse-text)' : 'var(--pulse-text-muted)',
                fontSize: '0.78rem',
                fontWeight: filter === f ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {f.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              <span
                style={{
                  padding: '1px 5px',
                  borderRadius: 8,
                  fontSize: '0.65rem',
                  background: filter === f ? 'rgba(200,168,75,0.2)' : 'rgba(255,255,255,0.05)',
                  color: filter === f ? 'var(--pulse-gold)' : 'var(--pulse-text-muted)',
                }}
              >
                {counts[f]}
              </span>
            </button>
          ),
        )}
      </div>

      {/* Dissent list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filtered.map((dissent) => (
          <div
            key={dissent.id}
            className="section-card animate-fadeIn"
            style={{ padding: '18px 20px' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    padding: '3px 10px',
                    borderRadius: 4,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--pulse-border)',
                    fontSize: '0.7rem',
                    color: 'var(--pulse-text-muted)',
                    fontWeight: 600,
                  }}
                >
                  {dissent.sectionTitle}
                </div>
                <StatusBadge status={dissent.status} />
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--pulse-text-muted)' }}>
                {new Date(dissent.filedAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--pulse-text-muted)',
                  marginBottom: 5,
                }}
              >
                Dissenting View
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--pulse-text)', lineHeight: 1.6 }}>
                {dissent.dissentingView}
              </p>
            </div>

            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}
            >
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 6,
                  background: 'rgba(0,0,0,0.15)',
                  border: '1px solid var(--pulse-border)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--pulse-text-muted)',
                    marginBottom: 5,
                  }}
                >
                  Basis
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--pulse-text-dim)', lineHeight: 1.5 }}>
                  {dissent.basis}
                </p>
              </div>
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 6,
                  background: 'rgba(200,168,75,0.04)',
                  border: '1px solid rgba(200,168,75,0.12)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--pulse-text-muted)',
                    marginBottom: 5,
                  }}
                >
                  Impact if Correct
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--pulse-text-dim)', lineHeight: 1.5 }}>
                  {dissent.impactIfCorrect}
                </p>
              </div>
            </div>

            {dissent.resolution && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 6,
                  background: 'rgba(78,202,139,0.06)',
                  border: '1px solid rgba(78,202,139,0.2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <CheckCircle size={13} color="#4eca8b" />
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: '#4eca8b',
                    }}
                  >
                    Resolution
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--pulse-text-dim)', lineHeight: 1.5 }}>
                  {dissent.resolution}
                </p>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 12,
                fontSize: '0.68rem',
                color: 'var(--pulse-text-muted)',
              }}
            >
              <span>
                Filed by{' '}
                <strong style={{ color: 'var(--pulse-text-dim)' }}>{dissent.filedBy}</strong>
              </span>
              <span>·</span>
              <span>Brief: {dissent.briefingId}</span>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--pulse-text-muted)' }}>
            <MessageSquare
              size={32}
              style={{ opacity: 0.2, marginBottom: 12, display: 'block', margin: '0 auto 12px' }}
            />
            <p style={{ fontSize: '0.9rem' }}>No dissents in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}
