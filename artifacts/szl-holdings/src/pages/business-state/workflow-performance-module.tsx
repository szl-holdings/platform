import { AlertTriangle } from 'lucide-react';
import { BG_CARD, BORDER } from './constants';
import { WORKFLOW_PERF } from './data';
import { DomainTag } from './helpers';

export function WorkflowPerformanceModule() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {WORKFLOW_PERF.map((wf) => {
          const compColor = wf.completion >= 85 ? '#22c55e' : wf.completion >= 70 ? '#f59e0b' : '#ef4444';
          return (
            <div
              key={wf.id}
              style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: '0.75rem', padding: '1rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', flex: 1 }}>
                  {wf.name}
                </span>
                <DomainTag domain={wf.domain} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ flex: 1, height: '6px', background: 'hsla(0,0%,100%,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${wf.completion}%`, background: compColor, borderRadius: '3px' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 800, color: compColor, minWidth: '32px', textAlign: 'right' }}>
                  {wf.completion}%
                </span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                <span>{wf.steps} steps</span>
                <span>avg {wf.avgMin}m</span>
              </div>
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'flex-start', gap: '4px', fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                <AlertTriangle style={{ width: 9, height: 9, color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                <span>{wf.bottleneck}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
