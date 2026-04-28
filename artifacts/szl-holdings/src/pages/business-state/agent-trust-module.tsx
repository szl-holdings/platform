import { AGENT_TRUST } from './data';
import { BG_CARD, BORDER } from './constants';
import { DomainTag, useLive } from './helpers';
import type { DomainId } from './types';

function statusColor(s: string) {
  if (s === 'certified') return '#22c55e';
  if (s === 'monitored') return '#f59e0b';
  return '#ef4444';
}

export function AgentTrustModule() {
  const live = useLive();
  const agents = (live?.agentTrust ?? AGENT_TRUST) as typeof AGENT_TRUST;
  const certified = agents.filter((a) => a.status === 'certified').length;
  const monitored = agents.filter((a) => a.status === 'monitored').length;
  const probation = agents.filter((a) => a.status === 'probation').length;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
        {[
          { label: 'Certified', value: certified, color: '#22c55e' },
          { label: 'Monitored', value: monitored, color: '#f59e0b' },
          { label: 'Probation', value: probation, color: '#ef4444' },
        ].map((s) => (
          <div
            key={s.label}
            style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: '0.625rem', padding: '0.75rem', textAlign: 'center' }}
          >
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {agents.map((agent, i) => {
          const sc = statusColor(agent.status);
          return (
            <div
              key={agent.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto auto auto',
                gap: '1rem',
                alignItems: 'center',
                padding: '0.75rem 0.875rem',
                borderBottom: i < agents.length - 1 ? `1px solid ${BORDER}` : 'none',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                    {agent.agent}
                  </span>
                  {agent.domain && <DomainTag domain={agent.domain as DomainId} />}
                </div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>
                  {agent.actionsExecuted.toLocaleString()} actions · {agent.humanOverrides} overrides
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: sc }}>{agent.trustScore}</div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>trust</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{agent.accuracy}%</div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>accuracy</div>
              </div>
              <div style={{ width: '60px', height: '4px', background: 'hsla(0,0%,100%,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${agent.trustScore}%`, background: sc, borderRadius: '2px' }} />
              </div>
              <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '3px', background: `${sc}20`, color: sc }}>
                {agent.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
