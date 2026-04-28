import { Activity, AlertCircle, CheckCircle, Clock, Lock, Zap } from 'lucide-react';
import { BG, BORDER, MetricCard, SectionHeader, StatusBadge, StatusIcon, TEXT } from './shared';
import type { JobStats } from './types';

interface Props {
  jobsData: { data?: JobStats; isLoading: boolean };
}

export function JobsTab({ jobsData }: Props) {
  const jd = jobsData.data;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {jd?.stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
          <MetricCard icon={Activity} label="Total" value={jd.stats.total} color="#d4a054" />
          <MetricCard icon={CheckCircle} label="Completed" value={jd.stats.completed} color="#6b8f71" />
          <MetricCard icon={Zap} label="Running" value={jd.stats.running} color="#4a90b8" />
          <MetricCard icon={Clock} label="Pending" value={jd.stats.pending} color="#8b7ac8" />
          <MetricCard icon={AlertCircle} label="Failed" value={jd.stats.failed} color="#c45a4a" />
        </div>
      )}
      <div style={{ padding: '1rem', borderRadius: '0.75rem', background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
        <SectionHeader icon={Activity} title="Recent Job Runs" subtitle="Latest platform job executions and status" />
        {jd?.jobs && jd.jobs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {jd.jobs.slice(0, 20).map((job) => (
              <div key={job.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', background: BG.section, fontSize: '11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <StatusIcon status={job.status === 'completed' ? 'healthy' : job.status === 'failed' ? 'down' : 'degraded'} />
                  <span style={{ color: TEXT.primary, fontFamily: 'var(--font-mono)', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{job.type}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span style={{ color: TEXT.muted, fontSize: '10px' }}>{new Date(job.startedAt).toLocaleTimeString()}</span>
                  <StatusBadge status={job.status === 'completed' ? 'healthy' : job.status === 'failed' ? 'down' : 'degraded'} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: TEXT.muted, fontSize: '12px', textAlign: 'center', padding: '2rem 0' }}>
            {jobsData.isLoading ? 'Loading job history...' : 'No recent job runs recorded'}
          </div>
        )}
      </div>
      <div style={{ padding: '1rem', borderRadius: '0.75rem', background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
        <SectionHeader icon={Lock} title="Blocked Exports & Approvals" subtitle="Exports or approvals awaiting action" />
        <div style={{ color: TEXT.muted, fontSize: '12px', padding: '0.5rem 0' }}>
          Connect to API admin endpoints for live export queue data. Visit{' '}
          <span style={{ color: '#d4a054', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>/admin/exports</span>{' '}or{' '}
          <span style={{ color: '#d4a054', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>/admin/approvals</span>{' '}for detailed views.
        </div>
      </div>
    </div>
  );
}
