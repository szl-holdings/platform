import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { FileText, Map, Radio, Search } from 'lucide-react';
import { useState } from 'react';
import { heliosApi, type RecalibrationMemo } from '../lib/api';

function MemoCard({ memo, onClick, selected }: { memo: RecalibrationMemo; onClick: () => void; selected: boolean }) {
  return (
    <div
      onClick={onClick}
      className="section-card"
      style={{
        padding: '14px 16px', cursor: 'pointer',
        border: `1px solid ${selected ? 'rgba(245,158,11,0.35)' : 'var(--helios-border)'}`,
        background: selected ? 'rgba(245,158,11,0.05)' : 'var(--helios-card)',
        transition: 'all 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FileText size={13} color="var(--helios-amber)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--helios-text)', marginBottom: 2 }}>
            {memo.title}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--helios-text-muted)', marginBottom: 6 }}>
            Week of {format(new Date(memo.weekOf), 'MMMM d, yyyy')}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: '0.67rem', color: 'var(--helios-text-muted)' }}>
              {memo.signalCount} signals
            </span>
            <span style={{ fontSize: '0.67rem', color: 'var(--helios-text-muted)' }}>
              {memo.proposalCount} proposals
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MemoDetail({ memo }: { memo: RecalibrationMemo }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--helios-border)' }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--helios-amber)', marginBottom: 4 }}>
          RECALIBRATION MEMO · {format(new Date(memo.weekOf), 'MMM d, yyyy').toUpperCase()}
        </div>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--helios-text)', lineHeight: 1.3, marginBottom: 8 }}>
          {memo.title}
        </h2>
        <div style={{ display: 'flex', gap: 16 }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--helios-text-muted)' }}>
            {memo.signalCount} frontier signals analyzed
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--helios-text-muted)' }}>
            {memo.proposalCount} capability proposals generated
          </span>
        </div>
      </div>

      {[
        { key: 'audit', label: 'Audit', description: 'Where we are today — gap analysis against the frontier', Icon: Search, color: '#60a5fa' },
        { key: 'blueprint', label: 'Blueprint', description: 'What we should build — capability upgrade roadmap', Icon: Map, color: '#34d399' },
        { key: 'roadmap', label: 'Roadmap', description: 'How to get there — sequenced execution plan', Icon: Radio, color: '#f59e0b' },
      ].map(({ key, label, description, Icon, color }) => (
        <div key={key} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 5, background: `${color}12`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={12} color={color} />
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--helios-text)' }}>{label}</div>
              <div style={{ fontSize: '0.67rem', color: 'var(--helios-text-muted)' }}>{description}</div>
            </div>
          </div>
          <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--helios-text-dim)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
            {(memo as Record<string, string>)[key]}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RecalibrationMemos() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['memos'],
    queryFn: () => heliosApi.getMemos(),
  });

  const memos = data?.memos ?? [];
  const selected = memos.find(m => m.id === selectedId) ?? memos[0] ?? null;

  return (
    <div style={{ padding: '24px 28px', height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <FileText size={20} color="var(--helios-amber)" />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--helios-text)', letterSpacing: '-0.01em' }}>
            Recalibration Memos
          </h1>
        </div>
        <p style={{ fontSize: '0.825rem', color: 'var(--helios-text-muted)', lineHeight: 1.5 }}>
          Weekly Infrastructure Recalibration — Audit → Blueprint → Roadmap. Generated from the week's frontier signals.
        </p>
      </div>

      {/* Two-pane layout */}
      <div style={{ display: 'flex', gap: 20, flex: 1, overflow: 'hidden' }}>
        {/* Memo list */}
        <div style={{ width: 280, flexShrink: 0, overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="section-card" style={{ padding: 14, height: 80, opacity: 0.5 }} />
              ))}
            </div>
          ) : memos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--helios-text-muted)' }}>
              <FileText size={28} style={{ marginBottom: 10, opacity: 0.3 }} />
              <div style={{ fontSize: '0.825rem' }}>No memos yet. The Evolution Engine generates memos weekly.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {memos.map(m => (
                <MemoCard key={m.id} memo={m} selected={(selectedId ?? memos[0]?.id) === m.id} onClick={() => setSelectedId(m.id)} />
              ))}
            </div>
          )}
        </div>

        {/* Memo content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 4px' }}>
          {selected ? (
            <MemoDetail memo={selected} />
          ) : !isLoading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--helios-text-muted)' }}>
              <FileText size={40} style={{ marginBottom: 16, opacity: 0.2 }} />
              <div style={{ fontWeight: 600 }}>Select a memo to read</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
