import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { BORDER, DOMAINS, FG, FG_MUT } from './constants';
import type { DomainKey } from './constants';
import { CAUSAL_EVENTS } from './data';
import { useLive } from './shared';

export function CausalTimelineSection() {
  const live = useLive();
  const events = (live?.causalEvents ?? CAUSAL_EVENTS) as typeof CAUSAL_EVENTS;
  const [expanded, setExpanded] = useState<string[]>([]);

  return (
    <div style={{ position: 'relative', paddingLeft: '1.25rem' }}>
      <div
        style={{
          position: 'absolute',
          left: '4px',
          top: 0,
          bottom: 0,
          width: '1px',
          background: `${BORDER}`,
        }}
      />

      {events.map((event, i) => {
        const colors: Record<string, string> = {
          critical: '#ef4444',
          high: '#f97316',
          medium: '#f59e0b',
          low: '#22c55e',
          none: '#22c55e',
        };
        const color = colors[event.severity] ?? '#6b7280';
        const domain = DOMAINS[event.domain as DomainKey] ?? {
          name: event.domain,
          color: '#8b7ac8',
        };
        const isExp = expanded.includes(event.id);

        return (
          <div
            key={event.id}
            style={{ marginBottom: i < events.length - 1 ? '0.875rem' : 0, position: 'relative' }}
          >
            <div
              style={{
                position: 'absolute',
                left: '-1.25rem',
                top: '4px',
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: color,
                border: '2px solid #080c14',
                boxShadow: `0 0 7px ${color}60`,
              }}
            />

            <div
              style={{ cursor: 'pointer' }}
              onClick={() =>
                setExpanded((prev) =>
                  prev.includes(event.id)
                    ? prev.filter((x) => x !== event.id)
                    : [...prev, event.id],
                )
              }
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{ fontSize: '10px', color: FG_MUT, fontVariantNumeric: 'tabular-nums' }}
                >
                  {event.time}
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 600,
                    padding: '1px 5px',
                    borderRadius: '3px',
                    background: `${domain.color}15`,
                    color: domain.color,
                  }}
                >
                  {domain.name}
                </span>
                {event.causeOf.length > 0 && (
                  <span style={{ fontSize: '9px', color: '#f97316', fontWeight: 600 }}>
                    → causes downstream
                  </span>
                )}
              </div>
              <div style={{ marginTop: '0.25rem', fontSize: '12px', fontWeight: 600, color: FG }}>
                {event.title}
              </div>
            </div>

            {isExp && (
              <div
                style={{
                  marginTop: '0.5rem',
                  padding: '0.625rem 0.75rem',
                  background: 'hsla(0,0%,100%,0.02)',
                  border: `1px solid ${BORDER}`,
                  borderRadius: '0.5rem',
                }}
              >
                <p style={{ fontSize: '11px', color: FG_MUT, lineHeight: 1.6, margin: 0 }}>
                  {event.description}
                </p>
                {event.causedBy.length > 0 && (
                  <div style={{ marginTop: '0.375rem', fontSize: '10px', color: FG_MUT }}>
                    <ArrowRight
                      style={{ width: 9, height: 9, display: 'inline', marginRight: '3px' }}
                    />
                    Caused by: {event.causedBy.join(', ')}
                  </div>
                )}
                {event.causeOf.length > 0 && (
                  <div style={{ marginTop: '0.25rem', fontSize: '10px', color: '#f97316' }}>
                    <ArrowRight
                      style={{ width: 9, height: 9, display: 'inline', marginRight: '3px' }}
                    />
                    Downstream effects: {event.causeOf.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
