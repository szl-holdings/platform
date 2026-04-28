import {
  CONNECTORS_UI,
  EXECUTION_RUNS,
  formatCurrency,
  WORKFLOWS_UI,
} from '@szl-holdings/shared-ui/core-observability-data';
import { BarChart2, } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const VOLUME_DATA = [
  { day: 'Mon', success: 38, failed: 4 },
  { day: 'Tue', success: 52, failed: 4 },
  { day: 'Wed', success: 44, failed: 4 },
  { day: 'Thu', success: 55, failed: 6 },
  { day: 'Fri', success: 68, failed: 5 },
  { day: 'Sat', success: 29, failed: 0 },
  { day: 'Sun', success: 21, failed: 0 },
];

const TOP_WORKFLOWS = WORKFLOWS_UI.slice(0, 5).map((w, i) => ({
  name: w.name.length > 32 ? `${w.name.slice(0, 32)}…` : w.name,
  runs: [73, 61, 48, 42, 29][i],
  success_rate: [94, 88, 96, 82, 100][i],
}));

export default function AutomationAnalytics() {
  const completed = EXECUTION_RUNS.filter((r) => r.status === 'completed');
  const successRate = Math.round((completed.length / EXECUTION_RUNS.length) * 100);
  const avgDurationSec = Math.round(
    EXECUTION_RUNS.filter((r) => r.duration_ms).reduce((s, r) => s + (r.duration_ms ?? 0), 0) /
      (EXECUTION_RUNS.filter((r) => r.duration_ms).length || 1) /
      1000,
  );
  const valueAutomated = WORKFLOWS_UI.reduce((s, w) => s + w.value_at_risk, 0);
  const totalRuns = VOLUME_DATA.reduce((s, d) => s + d.success + d.failed, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 className="w-4 h-4" style={{ color: '#4B8BDB' }} />
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: '#4B8BDB' }}
          >
            Counsel · Automation Analytics
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white">Automation Analytics</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Execution volume, success rates, connector performance, and automation ROI across all
          workflows.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: 'Success Rate',
            value: `${successRate}%`,
            color: successRate >= 90 ? '#10b981' : '#f59e0b',
            trend: '+3%',
          },
          { label: 'Avg Duration', value: `${avgDurationSec}s`, color: '#4B8BDB', trend: '-12%' },
          { label: 'Total Runs (7d)', value: totalRuns, color: '#8b5cf6', trend: '+18%' },
          {
            label: 'Value Automated',
            value: formatCurrency(valueAutomated),
            color: '#f59e0b',
            trend: '+$340K',
          },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border p-4"
            style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
          >
            <div
              className="text-[10px] font-medium mb-2"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              {c.label}
            </div>
            <div className="text-2xl font-bold mb-1" style={{ color: c.color }}>
              {c.value}
            </div>
            <div className="text-[9px]" style={{ color: '#10b981' }}>
              {c.trend} vs last week
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div
          className="rounded-xl border p-5"
          style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
        >
          <div className="text-sm font-semibold text-white mb-4">Execution Volume — 7 Days</div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={VOLUME_DATA}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                barSize={10}
              >
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0d1117',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    fontSize: 10,
                  }}
                />
                <Bar
                  dataKey="success"
                  name="Success"
                  fill="#4B8BDB"
                  opacity={0.8}
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  dataKey="failed"
                  name="Failed"
                  fill="#ef4444"
                  opacity={0.7}
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className="rounded-xl border p-5"
          style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
        >
          <div className="text-sm font-semibold text-white mb-4">Top Workflows by Volume</div>
          <div className="space-y-3">
            {TOP_WORKFLOWS.map((wf, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-white truncate max-w-[200px]">{wf.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {wf.runs} runs
                    </span>
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: wf.success_rate >= 90 ? '#10b981' : '#f59e0b' }}
                    >
                      {wf.success_rate}%
                    </span>
                  </div>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${wf.success_rate}%`,
                      background: wf.success_rate >= 90 ? '#10b981' : '#f59e0b',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="rounded-xl border p-5"
        style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="text-sm font-semibold text-white mb-4">Connector Performance</div>
        <div className="grid grid-cols-4 gap-3">
          {CONNECTORS_UI.slice(0, 8).map((c) => (
            <div
              key={c.id}
              className="rounded-lg p-3"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-medium text-white truncate max-w-[80px]">
                  {c.name.split(' ')[0]}
                </span>
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    background:
                      c.health === 'healthy'
                        ? '#10b981'
                        : c.health === 'degraded'
                          ? '#f59e0b'
                          : '#ef4444',
                  }}
                />
              </div>
              <div className="grid grid-cols-3 gap-1 text-center">
                <div>
                  <div className="text-xs font-bold" style={{ color: '#4B8BDB' }}>
                    {c.requests_today >= 1000
                      ? `${Math.round(c.requests_today / 100) / 10}k`
                      : c.requests_today}
                  </div>
                  <div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    req
                  </div>
                </div>
                <div>
                  <div
                    className="text-xs font-bold"
                    style={{ color: c.error_rate > 5 ? '#ef4444' : '#10b981' }}
                  >
                    {c.error_rate}%
                  </div>
                  <div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    err
                  </div>
                </div>
                <div>
                  <div
                    className="text-xs font-bold"
                    style={{ color: c.latency_ms > 500 ? '#f59e0b' : '#10b981' }}
                  >
                    {c.latency_ms}ms
                  </div>
                  <div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    lat
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
