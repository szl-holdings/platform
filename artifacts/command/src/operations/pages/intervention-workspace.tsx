import {
  APPROVALS,
  EXECUTION_RUNS,
  formatCurrency,
  getStateColor,
  WORKFLOWS,
} from '@szl-holdings/shared-ui/core-observability-data';
import {
  ArrowUpRight,
  CheckCircle,
  Clock,
  ExternalLink,
  MessageSquare,
  RotateCcw,
  Wrench,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';

const THREADS = [
  {
    id: 'thread-001',
    workflow: 'Enterprise Contract Approval — Northgate Systems',
    correlation_id: 'gf-2026-q1-001',
    comments: [
      {
        author: 'Jordan Alvarez',
        time: '2h ago',
        text: 'Legal team is at capacity. VP unavailable until tomorrow. Recommending reroute to CFO backup.',
      },
      {
        author: 'System (Alloy)',
        time: '1.5h ago',
        text: 'Reroute initiated to CFO backup approver. ETA: 2 hours. Correlation ID: gf-2026-q1-001.',
      },
      {
        author: 'Priya Mehta',
        time: '45m ago',
        text: 'CFO backup has been notified. Contract is under review.',
      },
    ],
    actions_available: ['approve', 'reroute', 'escalate', 'defer', 'abort'],
    status: 'in_progress',
  },
  {
    id: 'thread-002',
    workflow: 'Customer Churn Intervention — TechCorp Inc',
    correlation_id: 'corr-churn-techcorp',
    comments: [
      {
        author: 'Marcus Webb',
        time: '1h ago',
        text: 'TechCorp usage dropped 35% this month. NPS is 42 points down. Competitive offer confirmed.',
      },
      {
        author: 'Alloy (AI)',
        time: '55m ago',
        text: 'Model predicts 88% churn probability if no executive contact within 12h. Recommend CEO engagement.',
      },
    ],
    actions_available: ['escalate', 'approve', 'assign', 'defer'],
    status: 'pending',
  },
];

const ACTION_STYLES: Record<string, { color: string; bg: string; border: string; label: string }> =
  {
    approve: {
      color: '#6b8f71',
      bg: 'rgba(107,143,113,0.1)',
      border: 'rgba(107,143,113,0.25)',
      label: 'Approve',
    },
    reroute: {
      color: '#4a90b8',
      bg: 'rgba(14,165,233,0.1)',
      border: 'rgba(14,165,233,0.25)',
      label: 'Reroute',
    },
    escalate: {
      color: '#ec4899',
      bg: 'rgba(236,72,153,0.1)',
      border: 'rgba(236,72,153,0.25)',
      label: 'Escalate',
    },
    defer: {
      color: 'rgba(255,255,255,0.4)',
      bg: 'rgba(255,255,255,0.05)',
      border: 'rgba(255,255,255,0.1)',
      label: 'Defer',
    },
    abort: {
      color: '#c45a4a',
      bg: 'rgba(196,90,74,0.1)',
      border: 'rgba(196,90,74,0.25)',
      label: 'Abort',
    },
    assign: {
      color: '#d4a054',
      bg: 'rgba(212,160,84,0.1)',
      border: 'rgba(212,160,84,0.25)',
      label: 'Assign',
    },
  };

export default function InterventionWorkspace() {
  const [selectedThread, setSelectedThread] = useState(THREADS[0]);
  const [commentText, setCommentText] = useState('');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Wrench className="w-4 h-4" style={{ color: '#d4a054' }} />
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: '#d4a054' }}
          >
            Command · Intervention Workspace
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white">Intervention Workspace</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Comment threads, action selection, reroute/escalate/approve/defer/assign — all in context
          of the workflow and Alloy intelligence.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 h-[600px]">
        <div
          className="rounded-xl border overflow-hidden flex flex-col"
          style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
        >
          <div
            className="px-4 py-3 border-b text-xs font-semibold text-white"
            style={{ borderColor: 'rgba(255,255,255,0.05)' }}
          >
            Active Threads
          </div>
          <div
            className="flex-1 overflow-y-auto divide-y"
            style={{ borderColor: 'rgba(255,255,255,0.04)' }}
          >
            {THREADS.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedThread(t)}
                className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors"
                style={{
                  background: selectedThread?.id === t.id ? 'rgba(212,160,84,0.06)' : undefined,
                  borderLeft:
                    selectedThread?.id === t.id ? '2px solid #d4a054' : '2px solid transparent',
                }}
              >
                <div className="text-[10px] font-medium text-white mb-0.5 leading-snug">
                  {t.workflow}
                </div>
                <div
                  className="text-[9px] flex items-center gap-2"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  <span>{t.comments.length} comments</span>
                  <span
                    className="px-1 py-0.5 rounded"
                    style={{
                      color: t.status === 'in_progress' ? '#4a90b8' : '#d4a054',
                      background:
                        t.status === 'in_progress'
                          ? 'rgba(14,165,233,0.12)'
                          : 'rgba(212,160,84,0.12)',
                    }}
                  >
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div
          className="col-span-2 rounded-xl border overflow-hidden flex flex-col"
          style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.01)' }}
        >
          {selectedThread ? (
            <>
              <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <div className="text-sm font-semibold text-white mb-0.5">
                  {selectedThread.workflow}
                </div>
                <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Correlation: {selectedThread.correlation_id}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {selectedThread.comments.map((c, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        background:
                          c.author.startsWith('System') || c.author.startsWith('FORGE')
                            ? 'rgba(139,92,246,0.15)'
                            : 'rgba(14,165,233,0.15)',
                        color:
                          c.author.startsWith('System') || c.author.startsWith('FORGE')
                            ? '#8b7ac8'
                            : '#4a90b8',
                        border: `1px solid ${c.author.startsWith('System') || c.author.startsWith('FORGE') ? 'rgba(139,92,246,0.3)' : 'rgba(14,165,233,0.3)'}`,
                      }}
                    >
                      {c.author.startsWith('System')
                        ? 'AS'
                        : c.author.startsWith('FORGE')
                          ? 'AL'
                          : c.author
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold text-white">{c.author}</span>
                        <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {c.time}
                        </span>
                      </div>
                      <div
                        className="text-[11px] leading-relaxed"
                        style={{ color: 'rgba(255,255,255,0.6)' }}
                      >
                        {c.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="px-5 py-4 border-t space-y-3"
                style={{ borderColor: 'rgba(255,255,255,0.05)' }}
              >
                <div className="flex gap-2 flex-wrap">
                  {selectedThread.actions_available.map((action) => {
                    const s = ACTION_STYLES[action];
                    if (!s) return null;
                    return (
                      <button
                        key={action}
                        className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80"
                        style={{
                          color: s.color,
                          background: s.bg,
                          border: `1px solid ${s.border}`,
                        }}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                  <a
                    href="/alloy"
                    className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80 flex items-center gap-1 ml-auto"
                    style={{
                      color: '#4B8BDB',
                      background: 'rgba(75,139,219,0.08)',
                      border: '1px solid rgba(75,139,219,0.2)',
                    }}
                  >
                    <ExternalLink className="w-3 h-3" /> Run in Alloy
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment or annotation..."
                    className="flex-1 text-xs px-3 py-2 rounded-lg outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'white',
                    }}
                  />
                  <button
                    className="text-[10px] px-3 py-2 rounded-lg font-medium"
                    style={{
                      color: '#d4a054',
                      background: 'rgba(212,160,84,0.1)',
                      border: '1px solid rgba(212,160,84,0.2)',
                    }}
                  >
                    Post
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div
              className="flex-1 flex items-center justify-center text-sm"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Select a thread to review
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
