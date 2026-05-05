import { useState } from 'react';
import { ACCENT, BORDER, FG, FG_MUT } from './constants';
import { HEATMAP_OPPS, HEATMAP_RISKS } from './data';
import { DomainBadge, useLive } from './shared';

function riskLevelColor(level: string) {
  switch (level) {
    case 'critical':
      return '#ef4444';
    case 'high':
      return '#f97316';
    case 'medium':
      return '#f59e0b';
    default:
      return '#22c55e';
  }
}

export function RiskOpportunityHeatmapSection() {
  const live = useLive();
  const heatRisks = (live?.heatmapRisks ?? HEATMAP_RISKS) as typeof HEATMAP_RISKS;
  const heatOpps = (live?.heatmapOpps ?? HEATMAP_OPPS) as typeof HEATMAP_OPPS;
  const [hovered, setHovered] = useState<string | null>(null);
  const [view, setView] = useState<'both' | 'risks' | 'opps'>('both');
  const [selected, setSelected] = useState<string | null>(null);

  const selectedRisk = heatRisks.find((r) => r.id === selected);
  const selectedOpp = heatOpps.find((o) => o.id === selected);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-bold uppercase tracking-widest" style={{ color: FG_MUT }}>
          Risk / Opportunity Matrix — Probability × Impact
        </div>
        <div className="flex gap-1">
          {(['both', 'risks', 'opps'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="text-[10px] font-semibold px-3 py-1 rounded-md transition-all"
              style={{
                background: view === v ? `${ACCENT}15` : 'transparent',
                border: `1px solid ${view === v ? `${ACCENT}35` : BORDER}`,
                color: view === v ? ACCENT : FG_MUT,
                cursor: 'pointer',
              }}
            >
              {v === 'both' ? 'All' : v === 'risks' ? 'Risks' : 'Opportunities'}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          height: '280px',
          background: 'hsla(0,0%,100%,0.02)',
          border: `1px solid ${BORDER}`,
          borderRadius: '0.75rem',
          overflow: 'visible',
          marginBottom: '1rem',
        }}
      >
        {[0.25, 0.5, 0.75].map((v) => (
          <div key={v}>
            <div
              style={{
                position: 'absolute',
                left: `${v * 100}%`,
                top: 0,
                bottom: 0,
                width: '1px',
                background: 'hsla(0,0%,100%,0.04)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: `${v * 100}%`,
                left: 0,
                right: 0,
                height: '1px',
                background: 'hsla(0,0%,100%,0.04)',
              }}
            />
          </div>
        ))}

        <div
          style={{
            position: 'absolute',
            top: '6px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '9px',
            color: 'rgba(255,255,255,0.18)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Impact →
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '6px',
            right: '6px',
            fontSize: '9px',
            color: 'rgba(255,255,255,0.18)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Probability →
        </div>

        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: '50%',
            height: '50%',
            background: 'hsla(0,70%,10%,0.25)',
            borderTopRightRadius: '0.75rem',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: '50%',
            height: '50%',
            background: 'hsla(160,60%,10%,0.12)',
            borderBottomLeftRadius: '0.75rem',
          }}
        />

        <div
          style={{
            position: 'absolute',
            right: '8px',
            top: '8px',
            fontSize: '8px',
            fontWeight: 700,
            color: 'rgba(239,68,68,0.4)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Critical Zone
        </div>
        <div
          style={{
            position: 'absolute',
            left: '8px',
            bottom: '8px',
            fontSize: '8px',
            fontWeight: 700,
            color: 'rgba(34,197,94,0.4)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Safe Zone
        </div>

        {(view === 'both' || view === 'risks') &&
          heatRisks.map((risk) => {
            const x = risk.probability;
            const y = 1 - risk.impact;
            const color = riskLevelColor(risk.level);
            const isHov = hovered === risk.id;
            const isSel = selected === risk.id;

            return (
              <div
                key={risk.id}
                onMouseEnter={() => setHovered(risk.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(isSel ? null : risk.id)}
                style={{
                  position: 'absolute',
                  left: `${x * 100}%`,
                  top: `${y * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  width: isHov || isSel ? '16px' : '11px',
                  height: isHov || isSel ? '16px' : '11px',
                  borderRadius: '50%',
                  background: color,
                  boxShadow: `0 0 ${isHov || isSel ? 14 : 6}px ${color}80`,
                  border: isSel ? `2px solid #fff` : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  zIndex: isHov || isSel ? 10 : 2,
                }}
              />
            );
          })}

        {(view === 'both' || view === 'opps') &&
          heatOpps.map((opp) => {
            const x = opp.probability;
            const y = 1 - opp.valueScore;
            const color = opp.level === 'high' ? '#22c55e' : '#4d8fcc';
            const isHov = hovered === opp.id;
            const isSel = selected === opp.id;

            return (
              <div
                key={opp.id}
                onMouseEnter={() => setHovered(opp.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(isSel ? null : opp.id)}
                style={{
                  position: 'absolute',
                  left: `${x * 100}%`,
                  top: `${Math.max(2, Math.min(95, y * 100))}%`,
                  transform: 'translate(-50%, -50%) rotate(45deg)',
                  width: isHov || isSel ? '14px' : '10px',
                  height: isHov || isSel ? '14px' : '10px',
                  borderRadius: '2px',
                  background: color,
                  boxShadow: `0 0 ${isHov || isSel ? 12 : 6}px ${color}80`,
                  border: isSel ? `2px solid #fff` : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  zIndex: isHov || isSel ? 10 : 2,
                }}
              />
            );
          })}
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
          <span className="text-[10px]" style={{ color: FG_MUT }}>
            Critical risk
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f97316' }} />
          <span className="text-[10px]" style={{ color: FG_MUT }}>
            High risk
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
          <span className="text-[10px]" style={{ color: FG_MUT }}>
            Medium risk
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '2px',
              background: '#22c55e',
              transform: 'rotate(45deg)',
            }}
          />
          <span className="text-[10px]" style={{ color: FG_MUT }}>
            Opportunity
          </span>
        </div>
        <div className="ml-auto text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Click a dot to inspect
        </div>
      </div>

      {(selectedRisk || selectedOpp) && (
        <div
          style={{
            background: 'hsla(0,0%,100%,0.03)',
            border: `1px solid ${BORDER}`,
            borderRadius: '0.75rem',
            padding: '0.875rem',
            marginBottom: '1rem',
          }}
        >
          {selectedRisk && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: riskLevelColor(selectedRisk.level),
                    flexShrink: 0,
                  }}
                />
                <span className="text-sm font-bold" style={{ color: FG }}>
                  {selectedRisk.title}
                </span>
                <DomainBadge domain={selectedRisk.domain} />
                <span
                  className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded"
                  style={{
                    background: `${riskLevelColor(selectedRisk.level)}20`,
                    color: riskLevelColor(selectedRisk.level),
                  }}
                >
                  {selectedRisk.level}
                </span>
              </div>
              <div className="flex gap-6 text-xs mb-2" style={{ color: FG_MUT }}>
                <span>
                  Probability:{' '}
                  <strong style={{ color: FG }}>
                    {Math.round(selectedRisk.probability * 100)}%
                  </strong>
                </span>
                <span>
                  Impact:{' '}
                  <strong style={{ color: FG }}>{Math.round(selectedRisk.impact * 100)}%</strong>
                </span>
                <span>
                  Owner: <strong style={{ color: FG }}>{selectedRisk.owner}</strong>
                </span>
              </div>
              {selectedRisk.mitigation && (
                <div className="text-[11px]" style={{ color: FG_MUT }}>
                  <span style={{ color: '#22c55e', fontWeight: 600 }}>Mitigation: </span>
                  {selectedRisk.mitigation}
                </div>
              )}
            </div>
          )}
          {selectedOpp && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '2px',
                    background: '#22c55e',
                    transform: 'rotate(45deg)',
                    flexShrink: 0,
                  }}
                />
                <span className="text-sm font-bold" style={{ color: FG }}>
                  {selectedOpp.title}
                </span>
                <DomainBadge domain={selectedOpp.domain} />
                <span
                  className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded"
                  style={{ background: '#22c55e20', color: '#22c55e' }}
                >
                  opportunity
                </span>
              </div>
              <div className="flex gap-6 text-xs mb-2" style={{ color: FG_MUT }}>
                <span>
                  Probability:{' '}
                  <strong style={{ color: FG }}>
                    {Math.round(selectedOpp.probability * 100)}%
                  </strong>
                </span>
                <span>
                  Value Score:{' '}
                  <strong style={{ color: FG }}>{Math.round(selectedOpp.valueScore * 100)}%</strong>
                </span>
                <span>
                  Owner: <strong style={{ color: FG }}>{selectedOpp.owner}</strong>
                </span>
              </div>
              {selectedOpp.action && (
                <div className="text-[11px]" style={{ color: FG_MUT }}>
                  <span style={{ color: ACCENT, fontWeight: 600 }}>Action: </span>
                  {selectedOpp.action}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {(view === 'both' || view === 'risks') && (
        <div className="mb-4">
          <div
            className="text-[10px] font-bold uppercase tracking-widest mb-2"
            style={{ color: FG_MUT }}
          >
            Risks
          </div>
          {heatRisks.map((risk, i) => (
            <div
              key={risk.id}
              className="flex items-center gap-3 py-2 cursor-pointer"
              style={{
                borderBottom: i < heatRisks.length - 1 ? `1px solid ${BORDER}` : 'none',
                borderLeft: `3px solid ${riskLevelColor(risk.level)}50`,
                paddingLeft: '0.75rem',
              }}
              onClick={() => setSelected(selected === risk.id ? null : risk.id)}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: riskLevelColor(risk.level),
                  flexShrink: 0,
                }}
              />
              <span className="text-xs font-semibold flex-1" style={{ color: FG }}>
                {risk.title}
              </span>
              <DomainBadge domain={risk.domain} />
              <span className="text-[10px]" style={{ color: FG_MUT }}>
                P: {Math.round(risk.probability * 100)}%
              </span>
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                style={{
                  background: `${riskLevelColor(risk.level)}20`,
                  color: riskLevelColor(risk.level),
                }}
              >
                {risk.level}
              </span>
            </div>
          ))}
        </div>
      )}

      {(view === 'both' || view === 'opps') && (
        <div>
          <div
            className="text-[10px] font-bold uppercase tracking-widest mb-2"
            style={{ color: FG_MUT }}
          >
            Opportunities
          </div>
          {heatOpps.map((opp, i) => {
            const oppColor = opp.level === 'high' ? '#22c55e' : '#4d8fcc';
            return (
              <div
                key={opp.id}
                className="flex items-center gap-3 py-2 cursor-pointer"
                style={{
                  borderBottom: i < heatOpps.length - 1 ? `1px solid ${BORDER}` : 'none',
                  borderLeft: `3px solid ${oppColor}50`,
                  paddingLeft: '0.75rem',
                }}
                onClick={() => setSelected(selected === opp.id ? null : opp.id)}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '1px',
                    background: oppColor,
                    transform: 'rotate(45deg)',
                    flexShrink: 0,
                  }}
                />
                <span className="text-xs font-semibold flex-1" style={{ color: FG }}>
                  {opp.title}
                </span>
                <DomainBadge domain={opp.domain} />
                <span className="text-[10px]" style={{ color: FG_MUT }}>
                  P: {Math.round(opp.probability * 100)}%
                </span>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: `${oppColor}20`, color: oppColor }}
                >
                  {opp.level}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
