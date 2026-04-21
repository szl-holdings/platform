import { demoReadinessItems } from '@lyte/lib/demo-seed';
import { AlertTriangle, CheckCircle, ChevronDown, Shield, XCircle } from 'lucide-react';
import { useState } from 'react';

const BG = { surface: '#0c1018', elevated: '#10141e' };
const BORDER = { subtle: 'rgba(255,255,255,0.04)', muted: 'rgba(255,255,255,0.06)' };
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
  muted: 'rgba(255,255,255,0.14)',
};

const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  complete: {
    label: 'Complete',
    color: '#6b8f71',
    bg: 'rgba(107,143,113,0.08)',
    border: 'rgba(107,143,113,0.2)',
    icon: CheckCircle,
  },
  in_progress: {
    label: 'In Progress',
    color: '#d4a054',
    bg: 'rgba(212,160,84,0.08)',
    border: 'rgba(212,160,84,0.2)',
    icon: AlertTriangle,
  },
  blocked: {
    label: 'Blocked',
    color: '#c45a4a',
    bg: 'rgba(196,90,74,0.08)',
    border: 'rgba(196,90,74,0.2)',
    icon: XCircle,
  },
  pending: {
    label: 'Pending',
    color: TEXT.tertiary as string,
    bg: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.1)',
    icon: AlertTriangle,
  },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) {
    const days = Math.floor(-diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `in ${days}d`;
  }
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function ReadinessItem({ item }: { item: (typeof demoReadinessItems)[0] }) {
  const [open, setOpen] = useState(false);
  const st = STATUS_META[item.status];
  const Icon = st.icon;
  return (
    <div
      className="rounded-md overflow-hidden"
      style={{
        background: BG.surface,
        border: `1px solid ${item.status === 'blocked' ? 'rgba(196,90,74,0.15)' : BORDER.subtle}`,
      }}
    >
      <div className="px-4 py-3 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4 shrink-0" style={{ color: st.color }} />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-medium mb-0.5" style={{ color: TEXT.primary }}>
              {item.title}
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-[8px] px-1.5 py-px rounded"
                style={{ color: st.color, background: st.bg, border: `1px solid ${st.border}` }}
              >
                {st.label}
              </span>
              <span className="text-[9px]" style={{ color: TEXT.muted }}>
                Owner: {item.owner}
              </span>
              {item.complianceRef && (
                <span
                  className="text-[8px] px-1.5 py-px rounded"
                  style={{
                    color: '#8b7ac8',
                    background: 'rgba(139,122,200,0.08)',
                    border: '1px solid rgba(139,122,200,0.2)',
                  }}
                >
                  {item.complianceRef}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5">
              <div
                className="w-16 h-1.5 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${item.score}%`,
                    background:
                      item.score >= 80 ? '#6b8f71' : item.score >= 50 ? '#d4a054' : '#c45a4a',
                  }}
                />
              </div>
              <span
                className="text-[9px] font-mono"
                style={{
                  color: item.score >= 80 ? '#6b8f71' : item.score >= 50 ? '#d4a054' : '#c45a4a',
                }}
              >
                {item.score}%
              </span>
            </div>
            <span className="text-[9px] font-mono" style={{ color: TEXT.muted }}>
              Due: {item.dueBy}
            </span>
            <ChevronDown
              className="w-3.5 h-3.5 transition-transform"
              style={{ color: TEXT.muted, transform: open ? 'rotate(180deg)' : 'none' }}
            />
          </div>
        </div>
      </div>
      {open && (
        <div
          className="px-4 pb-4 border-t space-y-3"
          style={{ borderColor: 'rgba(255,255,255,0.04)' }}
        >
          <p className="text-[10px] leading-relaxed pt-3" style={{ color: TEXT.secondary }}>
            {item.description}
          </p>
          {item.blockedReason && (
            <div
              className="rounded px-3 py-2"
              style={{
                background: 'rgba(196,90,74,0.06)',
                border: '1px solid rgba(196,90,74,0.15)',
              }}
            >
              <div
                className="text-[8px] uppercase tracking-wider mb-0.5"
                style={{ color: '#c45a4a' }}
              >
                Blocked Reason
              </div>
              <div className="text-[10px]" style={{ color: TEXT.secondary }}>
                {item.blockedReason}
              </div>
            </div>
          )}
          {item.lastReviewedAt && (
            <div className="text-[9px]" style={{ color: TEXT.muted }}>
              Last reviewed: {timeAgo(item.lastReviewedAt)}
            </div>
          )}
          <div className="flex gap-2">
            <button
              className="text-[9px] px-3 py-1.5 rounded border"
              style={{
                color: '#d4a054',
                background: 'rgba(212,160,84,0.1)',
                borderColor: 'rgba(212,160,84,0.25)',
              }}
            >
              Update Status
            </button>
            <button
              className="text-[9px] px-3 py-1.5 rounded border"
              style={{ color: TEXT.muted, background: 'transparent', borderColor: BORDER.subtle }}
            >
              Add Comment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DemoReadinessPage() {
  const [catFilter, setCatFilter] = useState('all');

  const categories = Array.from(new Set(demoReadinessItems.map((i) => i.category)));
  const filtered =
    catFilter === 'all'
      ? demoReadinessItems
      : demoReadinessItems.filter((i) => i.category === catFilter);

  const totalScore = Math.round(
    demoReadinessItems.reduce((a, i) => a + i.score, 0) / demoReadinessItems.length,
  );
  const complete = demoReadinessItems.filter((i) => i.status === 'complete').length;
  const blocked = demoReadinessItems.filter((i) => i.status === 'blocked').length;
  const inProgress = demoReadinessItems.filter((i) => i.status === 'in_progress').length;

  const grouped = categories.reduce(
    (acc, cat) => {
      acc[cat] = filtered.filter((i) => i.category === cat);
      return acc;
    },
    {} as Record<string, typeof demoReadinessItems>,
  );

  return (
    <div className="p-4 max-w-[1000px] space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <Shield className="w-3.5 h-3.5" style={{ color: '#d4a054' }} />
          <span
            className="text-[10px] font-medium uppercase tracking-widest"
            style={{ color: '#d4a054' }}
          >
            Command · Readiness
          </span>
        </div>
        <h1 className="text-lg font-bold" style={{ color: TEXT.primary }}>
          Operational Readiness
        </h1>
        <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>
          Compliance and operational readiness status with indicators and context
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div
          className="rounded-md p-4 flex flex-col items-center justify-center"
          style={{ background: BG.surface, border: `1px solid rgba(212,160,84,0.15)` }}
        >
          <div
            className="text-3xl font-bold font-mono mb-0.5"
            style={{
              color: totalScore >= 75 ? '#6b8f71' : totalScore >= 50 ? '#d4a054' : '#c45a4a',
            }}
          >
            {totalScore}%
          </div>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: TEXT.muted }}>
            Readiness Score
          </div>
        </div>
        {[
          { label: 'Complete', value: complete, color: '#6b8f71' },
          { label: 'In Progress', value: inProgress, color: '#d4a054' },
          { label: 'Blocked', value: blocked, color: '#c45a4a' },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-md p-3"
            style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
          >
            <div className="text-[8px] uppercase tracking-wider mb-1" style={{ color: TEXT.muted }}>
              {c.label}
            </div>
            <div className="text-xl font-bold font-mono" style={{ color: c.color }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${totalScore}%`,
            background: 'linear-gradient(90deg, #c45a4a, #d4a054, #6b8f71)',
          }}
        />
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={() => setCatFilter('all')}
          className="text-[9px] px-2.5 py-1 rounded border"
          style={{
            color: catFilter === 'all' ? '#d4a054' : TEXT.muted,
            background: catFilter === 'all' ? 'rgba(212,160,84,0.08)' : 'transparent',
            borderColor: catFilter === 'all' ? 'rgba(212,160,84,0.2)' : BORDER.subtle,
          }}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCatFilter(cat)}
            className="text-[9px] px-2.5 py-1 rounded border"
            style={{
              color: catFilter === cat ? '#d4a054' : TEXT.muted,
              background: catFilter === cat ? 'rgba(212,160,84,0.08)' : 'transparent',
              borderColor: catFilter === cat ? 'rgba(212,160,84,0.2)' : BORDER.subtle,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(
          ([cat, items]) =>
            items.length > 0 && (
              <div key={cat}>
                <div
                  className="text-[9px] uppercase tracking-widest mb-2 font-medium"
                  style={{ color: TEXT.muted }}
                >
                  {cat}
                </div>
                <div className="space-y-2">
                  {items.map((item) => (
                    <ReadinessItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ),
        )}
      </div>
    </div>
  );
}
