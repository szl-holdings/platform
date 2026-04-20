import { demoReports } from '@lyte/lib/demo-seed';
import { BarChart3, CheckCircle, Clock, Download, FileText, Plus, RefreshCw } from 'lucide-react';
import { useState } from 'react';

const BG = { surface: '#0c1018', elevated: '#10141e' };
const BORDER = { subtle: 'rgba(255,255,255,0.04)', muted: 'rgba(255,255,255,0.06)' };
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
  muted: 'rgba(255,255,255,0.14)',
};

const REPORT_STATUS: Record<string, { color: string; bg: string; border: string; label: string }> =
  {
    complete: {
      color: '#6b8f71',
      bg: 'rgba(107,143,113,0.08)',
      border: 'rgba(107,143,113,0.2)',
      label: 'Complete',
    },
    generating: {
      color: '#d4a054',
      bg: 'rgba(212,160,84,0.08)',
      border: 'rgba(212,160,84,0.2)',
      label: 'Generating',
    },
    scheduled: {
      color: '#4a90b8',
      bg: 'rgba(74,144,184,0.08)',
      border: 'rgba(74,144,184,0.2)',
      label: 'Scheduled',
    },
    failed: {
      color: '#c45a4a',
      bg: 'rgba(196,90,74,0.08)',
      border: 'rgba(196,90,74,0.2)',
      label: 'Failed',
    },
  };

const TYPE_LABELS: Record<string, string> = {
  executive_summary: 'Executive Summary',
  signal_digest: 'Signal Digest',
  workflow_health: 'Workflow Health',
  audit_log: 'Audit Log',
  readiness_assessment: 'Readiness Assessment',
  forecast_variance: 'Forecast Variance',
};

const TYPE_COLORS: Record<string, string> = {
  executive_summary: '#d4a054',
  signal_digest: '#c8953c',
  workflow_health: '#4a90b8',
  audit_log: '#8b7ac8',
  readiness_assessment: '#6b8f71',
  forecast_variance: '#c45a4a',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) {
    const absDiff = -diff;
    const mins = Math.floor(absDiff / 60000);
    if (mins < 60) return `in ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `in ${hrs}h`;
    return `in ${Math.floor(hrs / 24)}d`;
  }
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const QUICK_GENERATE = [
  { label: 'Executive Brief', type: 'executive_summary', color: '#d4a054' },
  { label: 'Signal Digest', type: 'signal_digest', color: '#c8953c' },
  { label: 'Forecast Variance', type: 'forecast_variance', color: '#c45a4a' },
  { label: 'Audit Export', type: 'audit_log', color: '#8b7ac8' },
];

export default function DemoReportsPage() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [generating, setGenerating] = useState<string | null>(null);

  const filtered =
    typeFilter === 'all' ? demoReports : demoReports.filter((r) => r.type === typeFilter);
  const complete = demoReports.filter((r) => r.status === 'complete').length;
  const totalRecipients = demoReports.reduce((a, r) => a + r.recipientCount, 0);

  function handleGenerate(type: string) {
    setGenerating(type);
    setTimeout(() => setGenerating(null), 3000);
  }

  return (
    <div className="p-4 max-w-[1100px] space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <BarChart3 className="w-3.5 h-3.5" style={{ color: '#d4a054' }} />
            <span
              className="text-[10px] font-medium uppercase tracking-widest"
              style={{ color: '#d4a054' }}
            >
              Lyte · Reports
            </span>
          </div>
          <h1 className="text-lg font-bold" style={{ color: TEXT.primary }}>
            Report Center
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>
            Report generation, history, and scheduled delivery management
          </p>
        </div>
        <button
          className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded border"
          style={{
            color: '#d4a054',
            background: 'rgba(212,160,84,0.08)',
            borderColor: 'rgba(212,160,84,0.2)',
          }}
        >
          <Plus className="w-3 h-3" /> New Report
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Reports', value: demoReports.length, color: TEXT.secondary },
          { label: 'Completed', value: complete, color: '#6b8f71' },
          { label: 'Total Recipients', value: totalRecipients, color: '#4a90b8' },
          {
            label: 'Scheduled',
            value: demoReports.filter((r) => r.schedule !== 'Ad hoc').length,
            color: '#d4a054',
          },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-md p-3"
            style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
          >
            <div className="text-[8px] uppercase tracking-wider mb-1" style={{ color: TEXT.muted }}>
              {c.label}
            </div>
            <div className="text-xl font-bold font-mono" style={{ color: c.color as string }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div
        className="rounded-md p-4"
        style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
      >
        <div className="text-[9px] uppercase tracking-wider mb-3" style={{ color: TEXT.muted }}>
          Quick Generate
        </div>
        <div className="flex gap-2 flex-wrap">
          {QUICK_GENERATE.map((q) => (
            <button
              key={q.type}
              onClick={() => handleGenerate(q.type)}
              disabled={generating === q.type}
              className="flex items-center gap-1.5 text-[10px] px-3 py-2 rounded border transition-all hover:opacity-80 disabled:opacity-50"
              style={{ color: q.color, background: `${q.color}10`, borderColor: `${q.color}25` }}
            >
              {generating === q.type ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <FileText className="w-3 h-3" />
              )}
              {generating === q.type ? 'Generating...' : q.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={() => setTypeFilter('all')}
          className="text-[9px] px-2.5 py-1 rounded border"
          style={{
            color: typeFilter === 'all' ? '#d4a054' : TEXT.muted,
            background: typeFilter === 'all' ? 'rgba(212,160,84,0.08)' : 'transparent',
            borderColor: typeFilter === 'all' ? 'rgba(212,160,84,0.2)' : BORDER.subtle,
          }}
        >
          All
        </button>
        {Object.entries(TYPE_LABELS).map(([type, label]) => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className="text-[9px] px-2.5 py-1 rounded border"
            style={{
              color: typeFilter === type ? TYPE_COLORS[type] : TEXT.muted,
              background: typeFilter === type ? `${TYPE_COLORS[type]}10` : 'transparent',
              borderColor: typeFilter === type ? `${TYPE_COLORS[type]}25` : BORDER.subtle,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((report) => {
          const st = REPORT_STATUS[report.status];
          const typeColor = TYPE_COLORS[report.type];
          return (
            <div
              key={report.id}
              className="rounded-md px-4 py-3"
              style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded flex items-center justify-center shrink-0"
                  style={{ background: `${typeColor}10`, border: `1px solid ${typeColor}20` }}
                >
                  <FileText className="w-4 h-4" style={{ color: typeColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-semibold" style={{ color: TEXT.primary }}>
                      {report.name}
                    </span>
                    <span
                      className="text-[8px] px-1.5 py-px rounded font-mono uppercase"
                      style={{
                        color: st.color,
                        background: st.bg,
                        border: `1px solid ${st.border}`,
                      }}
                    >
                      {report.status === 'generating' ? '⟳ ' : ''}
                      {st.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[8px] px-1.5 py-px rounded"
                      style={{
                        color: typeColor,
                        background: `${typeColor}10`,
                        border: `1px solid ${typeColor}20`,
                      }}
                    >
                      {TYPE_LABELS[report.type]}
                    </span>
                    <span className="text-[9px]" style={{ color: TEXT.muted }}>
                      Format: {report.format.toUpperCase()}
                    </span>
                    <span className="text-[9px]" style={{ color: TEXT.muted }}>
                      Recipients: {report.recipientCount}
                    </span>
                  </div>
                  <p className="text-[9px] leading-snug" style={{ color: TEXT.secondary }}>
                    {report.summary}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[9px] font-mono" style={{ color: TEXT.muted }}>
                    {timeAgo(report.generatedAt)}
                  </div>
                  <div className="text-[8px]" style={{ color: TEXT.muted }}>
                    {report.fileSizeKb > 0 ? `${report.fileSizeKb} KB` : '—'}
                  </div>
                  <div className="flex gap-1 mt-1.5 justify-end">
                    {report.status === 'complete' && (
                      <button
                        className="flex items-center gap-0.5 text-[8px] px-2 py-1 rounded border"
                        style={{ color: TEXT.secondary, borderColor: BORDER.subtle }}
                      >
                        <Download className="w-2.5 h-2.5" /> Download
                      </button>
                    )}
                    <button
                      className="text-[8px] px-2 py-1 rounded border"
                      style={{ color: TEXT.muted, borderColor: BORDER.subtle }}
                    >
                      View
                    </button>
                  </div>
                  <div className="text-[7px] mt-1" style={{ color: TEXT.muted }}>
                    {report.schedule}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
