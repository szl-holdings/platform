import { useStandardQuery } from '@szl-holdings/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
const API = `${BASE}/api`;

type Frequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'on_demand';

interface Schedule {
  scheduleId: string;
  name: string;
  templateId: string;
  domain: string;
  frequency: Frequency;
  isActive: boolean;
  recipientEmails: string[];
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastStatus: string | null;
  runCount: number;
  failCount: number;
  createdAt: string;
}

interface Template {
  templateId: string;
  name: string;
  domain: string;
  reportType: string;
}

const FREQ_LABELS: Record<Frequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  on_demand: 'On Demand',
};

const FREQ_COLORS: Record<Frequency, string> = {
  daily: '#3b82f6',
  weekly: '#8b5cf6',
  monthly: '#c2a55a',
  quarterly: '#10b981',
  on_demand: '#6b7280',
};

const DOMAIN_COLORS: Record<string, string> = {
  szl_holdings: '#c2a55a',
  carlota_jo: '#a855f7',
  aegis: '#06b6d4',
  terra: '#22c55e',
  vessels: '#3b82f6',
  lyte: '#8b5cf6',
  prism: '#e879f9',
  general: '#94a3b8',
};

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

function ScheduleCard({
  schedule,
  onToggle,
  onRunNow,
}: {
  schedule: Schedule;
  onToggle: () => void;
  onRunNow: () => void;
}) {
  const freqColor = FREQ_COLORS[schedule.frequency] || '#6b7280';
  const domainColor = DOMAIN_COLORS[schedule.domain] || '#94a3b8';

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-zinc-900/60 border rounded-xl p-4 transition-all ${
        schedule.isActive ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-900 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded"
              style={{ color: domainColor, backgroundColor: `${domainColor}15` }}
            >
              {schedule.domain.replace(/_/g, ' ')}
            </span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded"
              style={{ color: freqColor, backgroundColor: `${freqColor}18` }}
            >
              {FREQ_LABELS[schedule.frequency]}
            </span>
            {!schedule.isActive && (
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-900 text-zinc-600">Paused</span>
            )}
            {schedule.lastStatus === 'failed' && (
              <span className="text-xs px-2 py-0.5 rounded bg-red-950 text-red-400">
                Last run failed
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-zinc-100 truncate">{schedule.name}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            {schedule.recipientEmails?.length > 0
              ? `→ ${schedule.recipientEmails.slice(0, 2).join(', ')}${schedule.recipientEmails.length > 2 ? ` +${schedule.recipientEmails.length - 2}` : ''}`
              : 'No recipients configured'}
          </p>
        </div>
        <div className="text-right shrink-0 space-y-0.5">
          <p className="text-xs text-zinc-600">
            Next:{' '}
            {schedule.nextRunAt
              ? new Date(schedule.nextRunAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : '—'}
          </p>
          <p className="text-xs text-zinc-600">
            Runs: <span className="text-zinc-400">{schedule.runCount ?? 0}</span>
            {schedule.failCount ? (
              <span className="text-red-500 ml-1">({schedule.failCount} failed)</span>
            ) : null}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={onToggle}
          className="text-xs px-2.5 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
        >
          {schedule.isActive ? 'Pause' : 'Resume'}
        </button>
        <button
          onClick={onRunNow}
          className="text-xs px-2.5 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
        >
          Run Now
        </button>
        {schedule.lastRunAt && (
          <span className="text-xs text-zinc-600 ml-auto">
            Last run:{' '}
            {new Date(schedule.lastRunAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        )}
      </div>
    </motion.div>
  );
}

function CreateScheduleModal({
  templates,
  onClose,
  onCreated,
}: {
  templates: Template[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    name: '',
    templateId: templates[0]?.templateId || '',
    domain: 'szl_holdings',
    frequency: 'weekly' as Frequency,
    recipientEmails: '',
    autoApprove: false,
    deliveryMethod: 'email' as 'email' | 'download',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTemplateChange = (id: string) => {
    const tpl = templates.find((t) => t.templateId === id);
    setForm((f) => ({ ...f, templateId: id, domain: tpl?.domain || f.domain }));
  };

  const handleCreate = async () => {
    if (!form.name) {
      setError('Name is required');
      return;
    }
    if (!form.templateId) {
      setError('Select a template');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const emails = form.recipientEmails
        .split(/[\n,]/)
        .map((e) => e.trim())
        .filter(Boolean);

      await apiFetch('/reports/schedules', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          templateId: form.templateId,
          domain: form.domain,
          frequency: form.frequency,
          recipientEmails: emails,
          autoApprove: form.autoApprove,
          dataConfig: { deliveryMethod: form.deliveryMethod },
        }),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  const DOMAINS = [
    'szl_holdings',
    'carlota_jo',
    'aegis',
    'terra',
    'vessels',
    'lyte',
    'prism',
    'general',
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-zinc-100">New Scheduled Report</h2>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 text-sm">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Schedule Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Weekly Investor Briefing"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500 block mb-1">Report Template</label>
            {templates.length > 0 ? (
              <select
                value={form.templateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
              >
                {templates.map((t) => (
                  <option key={t.templateId} value={t.templateId}>
                    {t.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-500">
                No saved templates. Create one in the Report Builder first.
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Domain</label>
              <select
                value={form.domain}
                onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
              >
                {DOMAINS.map((d) => (
                  <option key={d} value={d}>
                    {d.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Frequency</label>
              <select
                value={form.frequency}
                onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as Frequency }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
              >
                {(Object.entries(FREQ_LABELS) as [Frequency, string][]).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-500 block mb-1">Delivery Method</label>
            <div className="flex gap-2">
              {(['email', 'download'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setForm((f) => ({ ...f, deliveryMethod: m }))}
                  className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                    form.deliveryMethod === m
                      ? 'border-[#c2a55a] bg-[#c2a55a18] text-[#c2a55a]'
                      : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {m === 'email' ? 'Email with Attachment' : 'Download Link'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-500 block mb-1">Recipient Emails</label>
            <textarea
              value={form.recipientEmails}
              onChange={(e) => setForm((f) => ({ ...f, recipientEmails: e.target.value }))}
              rows={3}
              placeholder="investor@example.com&#10;board@company.com"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
            />
            <p className="text-xs text-zinc-600 mt-0.5">One per line or comma-separated</p>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`w-5 h-5 rounded border transition-colors flex items-center justify-center ${
                form.autoApprove ? 'bg-[#c2a55a] border-[#c2a55a]' : 'border-zinc-600'
              }`}
              onClick={() => setForm((f) => ({ ...f, autoApprove: !f.autoApprove }))}
            >
              {form.autoApprove && <span className="text-zinc-900 text-xs font-bold">✓</span>}
            </div>
            <div>
              <p className="text-sm text-zinc-300">Auto-approve generated reports</p>
              <p className="text-xs text-zinc-600">Skip manual approval and deliver immediately</p>
            </div>
          </label>

          {error && <p className="text-xs text-red-400 bg-red-950 px-3 py-2 rounded">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded-lg hover:border-zinc-600"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-zinc-900 bg-[#c2a55a] rounded-lg hover:bg-[#d4bc82] disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ScheduledReports() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [filterDomain, setFilterDomain] = useState('');
  const [filterActive, setFilterActive] = useState<string>('');
  const [runMsg, setRunMsg] = useState<string | null>(null);

  const { data: schedulesRaw, isLoading } = useStandardQuery({
    queryKey: ['report-schedules', filterDomain, filterActive],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filterDomain) params.set('domain', filterDomain);
      if (filterActive) params.set('isActive', filterActive);
      return apiFetch(`/reports/schedules?${params}`);
    },
    refetchInterval: 30_000,
  });

  const { data: templatesRaw } = useStandardQuery({
    queryKey: ['report-templates-schedulable'],
    queryFn: () => apiFetch('/reports/templates?isActive=true&limit=100'),
  });

  // /reports/schedules returns array directly (no meta wrapper)
  const schedules: Schedule[] = Array.isArray(schedulesRaw) ? (schedulesRaw as Schedule[]) : [];
  // /reports/templates uses meta wrapping → response is { data: [...], meta: {...} }
  const templates: Template[] = templatesRaw?.data ?? [];

  const handleRunDue = async () => {
    setRunMsg(null);
    try {
      // run-due returns { processed, results } directly (no meta wrapper)
      const result = await apiFetch('/reports/schedules/run-due', { method: 'POST' });
      setRunMsg(
        `Processed ${result.processed ?? 0} schedules — ${result.results?.filter((x: { status: string }) => x.status === 'completed').length ?? 0} completed`,
      );
      qc.invalidateQueries({ queryKey: ['report-schedules'] });
    } catch {
      setRunMsg('Failed to run schedules');
    }
  };

  const handleToggleSchedule = async (scheduleId: string, currentlyActive: boolean) => {
    try {
      await apiFetch(`/reports/schedules/${scheduleId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !currentlyActive }),
      });
      qc.invalidateQueries({ queryKey: ['report-schedules'] });
    } catch {
      setRunMsg('Failed to update schedule status');
    }
  };

  const handleRunSchedule = async (scheduleId: string) => {
    try {
      await apiFetch(`/reports/schedules/${scheduleId}/run`, { method: 'POST' });
      qc.invalidateQueries({ queryKey: ['report-schedules'] });
      setRunMsg(`Schedule ${scheduleId.slice(0, 8)}… queued for immediate run`);
    } catch {
      setRunMsg('Failed to run schedule');
    }
  };

  const stats = {
    total: schedules.length,
    active: schedules.filter((s) => s.isActive).length,
    paused: schedules.filter((s) => !s.isActive).length,
    failed: schedules.filter((s) => s.lastStatus === 'failed').length,
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-zinc-200">
      <AnimatePresence>
        {showCreate && (
          <CreateScheduleModal
            templates={templates}
            onClose={() => setShowCreate(false)}
            onCreated={() => {
              setShowCreate(false);
              qc.invalidateQueries({ queryKey: ['report-schedules'] });
            }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-0.5">
              <a
                href={`${BASE}/reports`}
                className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
              >
                ← Reports Hub
              </a>
            </div>
            <h1 className="text-xl font-bold text-zinc-100">Scheduled Reports</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Automate report delivery on a recurring schedule
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRunDue}
              className="px-3 py-1.5 text-xs border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
            >
              Run Due Now
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-1.5 text-xs font-medium text-zinc-900 bg-[#c2a55a] rounded-lg hover:bg-[#d4bc82] transition-colors"
            >
              New Schedule
            </button>
          </div>
        </div>
      </div>

      {runMsg && (
        <div className="px-6 py-2 bg-zinc-900 border-b border-zinc-800 text-xs text-zinc-400">
          {runMsg}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Schedules', value: stats.total, color: '#c2a55a' },
            { label: 'Active', value: stats.active, color: '#10b981' },
            { label: 'Paused', value: stats.paused, color: '#6b7280' },
            {
              label: 'Last Run Failed',
              value: stats.failed,
              color: stats.failed > 0 ? '#f43f5e' : '#6b7280',
            },
          ].map((s) => (
            <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: s.color }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <select
            value={filterDomain}
            onChange={(e) => setFilterDomain(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
          >
            <option value="">All domains</option>
            {[
              'szl_holdings',
              'carlota_jo',
              'aegis',
              'terra',
              'vessels',
              'lyte',
              'prism',
              'general',
            ].map((d) => (
              <option key={d} value={d}>
                {d.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
          >
            <option value="">All statuses</option>
            <option value="true">Active only</option>
            <option value="false">Paused only</option>
          </select>
          {(filterDomain || filterActive) && (
            <button
              onClick={() => {
                setFilterDomain('');
                setFilterActive('');
              }}
              className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1.5 border border-zinc-800 rounded-lg"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* How it works */}
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-4">
          <p className="text-xs text-zinc-500 font-medium mb-2 uppercase tracking-widest">
            How it works
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                step: '1',
                title: 'Select a template',
                desc: 'Pick from your saved report templates in the Report Builder',
              },
              {
                step: '2',
                title: 'Set the schedule',
                desc: 'Choose daily, weekly, monthly, or quarterly delivery frequency',
              },
              {
                step: '3',
                title: 'Receive reports',
                desc: 'Get PDF reports via email or expiring download links automatically',
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#c2a55a18] border border-[#c2a55a30] flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-[#c2a55a]">{item.step}</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-300">{item.title}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule list */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12 text-zinc-600">Loading schedules...</div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-zinc-800 rounded-xl">
              <p className="text-zinc-500 mb-2">No scheduled reports configured</p>
              <p className="text-xs text-zinc-600 mb-4">
                Create a schedule to automate report delivery
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="text-sm text-[#c2a55a] hover:text-[#d4bc82] transition-colors"
              >
                Create your first schedule →
              </button>
            </div>
          ) : (
            schedules.map((schedule) => (
              <ScheduleCard
                key={schedule.scheduleId}
                schedule={schedule}
                onToggle={() => handleToggleSchedule(schedule.scheduleId, schedule.isActive)}
                onRunNow={() => handleRunSchedule(schedule.scheduleId)}
              />
            ))
          )}
        </div>

        {/* Delivery history note */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Delivery History</p>
          <p className="text-xs text-zinc-600">
            Full delivery history, read receipts, and download logs are available in the{' '}
            <a
              href={`${BASE}/reports`}
              className="text-[#c2a55a] hover:text-[#d4bc82] transition-colors"
            >
              Reports Hub
            </a>
            . Each generated report is tracked with status, PDF size, and distribution records.
          </p>
          <div className="mt-3 flex gap-2">
            <a
              href={`${BASE}/reports`}
              className="text-xs px-3 py-1.5 border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
            >
              View Reports Hub
            </a>
            <a
              href={`${BASE}/reports/export-builder`}
              className="text-xs px-3 py-1.5 border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
            >
              Export Builder
            </a>
            <a
              href={`${BASE}/investor-analytics`}
              className="text-xs px-3 py-1.5 border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
            >
              Investor Analytics
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
