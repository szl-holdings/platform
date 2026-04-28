import { ArrowRight } from 'lucide-react';
import { BORDER, DOMAINS, FG, FG_MUT } from './constants';
import type { DomainKey } from './constants';
import { CROSS_DOMAIN_IMPACTS } from './data';
import { useLive } from './shared';

export function CrossDomainImpactMap() {
  const live = useLive();
  const impacts = live?.crossDomainImpacts ?? CROSS_DOMAIN_IMPACTS;
  const domainKeys = Object.keys(DOMAINS) as DomainKey[];

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  padding: '0.5rem 0.75rem',
                  fontSize: '9px',
                  fontWeight: 700,
                  color: FG_MUT,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                }}
              >
                From ↓ / To →
              </th>
              {domainKeys.map((d) => (
                <th
                  key={d}
                  style={{
                    textAlign: 'center',
                    padding: '0.5rem',
                    fontSize: '9px',
                    fontWeight: 700,
                    color: DOMAINS[d].color,
                  }}
                >
                  {DOMAINS[d].name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {domainKeys.map((src) => (
              <tr key={src} style={{ borderTop: `1px solid ${BORDER}` }}>
                <td
                  style={{
                    padding: '0.5rem 0.75rem',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: DOMAINS[src].color,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {DOMAINS[src].name}
                </td>
                {domainKeys.map((tgt) => {
                  if (src === tgt)
                    return (
                      <td key={tgt} style={{ textAlign: 'center', padding: '0.5rem' }}>
                        <span style={{ fontSize: '8px', color: FG_MUT }}>—</span>
                      </td>
                    );
                  const impact = impacts.find((x) => x.source === src && x.target === tgt);
                  if (!impact)
                    return <td key={tgt} style={{ textAlign: 'center', padding: '0.5rem' }} />;
                  const color =
                    impact.type === 'risk'
                      ? '#ef4444'
                      : impact.type === 'positive'
                        ? '#22c55e'
                        : '#f59e0b';
                  return (
                    <td key={tgt} style={{ textAlign: 'center', padding: '0.5rem' }}>
                      <div
                        title={impact.label}
                        style={{
                          width: '36px',
                          margin: '0 auto',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          background: `${color}15`,
                          border: `1px solid ${color}30`,
                          fontSize: '8px',
                          color,
                          fontWeight: 600,
                          cursor: 'default',
                        }}
                      >
                        {impact.type === 'risk' ? 'risk' : impact.type === 'positive' ? '↑' : '~'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
        {[
          { color: '#ef4444', label: 'Risk / Negative dependency' },
          { color: '#22c55e', label: 'Positive / Value flow' },
          { color: '#f59e0b', label: 'Neutral / Watch' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <div
              style={{ width: 8, height: 8, borderRadius: '2px', background: color, opacity: 0.8 }}
            />
            <span style={{ fontSize: '10px', color: FG_MUT }}>{label}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: FG_MUT,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            marginBottom: '0.25rem',
          }}
        >
          Active Impact Chains
        </div>
        {impacts.map((imp, i) => {
          const srcDomain = DOMAINS[imp.source as DomainKey];
          const tgtDomain = DOMAINS[imp.target as DomainKey];
          return (
            <div
              key={i}
              style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '11px' }}
            >
              <span style={{ color: srcDomain?.color ?? '#8b7ac8' }}>
                {srcDomain?.name ?? imp.source}
              </span>
              <ArrowRight
                style={{
                  width: 10,
                  height: 10,
                  color:
                    imp.type === 'risk'
                      ? '#ef4444'
                      : imp.type === 'positive'
                        ? '#22c55e'
                        : '#f59e0b',
                }}
              />
              <span style={{ color: tgtDomain?.color ?? '#8b7ac8' }}>
                {tgtDomain?.name ?? imp.target}
              </span>
              <span style={{ color: FG_MUT }}>{imp.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
