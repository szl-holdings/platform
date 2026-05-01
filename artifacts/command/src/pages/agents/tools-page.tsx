import { useState } from 'react';
import { Wrench, Shield, AlertTriangle, Lock, CheckCircle2, ChevronRight } from 'lucide-react';
import { TOOLS, type ToolRisk } from '@szl/a11oy-runtime';

const RISK_CONFIG: Record<ToolRisk, { label: string; color: string }> = {
  read_only: { label: 'Read Only', color: '#22c55e' },
  low: { label: 'Low', color: '#4d8fcc' },
  medium: { label: 'Medium', color: '#d4a054' },
  high: { label: 'High', color: '#f97316' },
  critical: { label: 'Critical', color: '#ef4444' },
};

const CATEGORY_COLORS: Record<string, string> = {
  intelligence: '#8b7ac8',
  governance: '#4d8fcc',
  finance: '#d4a054',
  compliance: '#f59e0b',
  execution: '#f97316',
  legal: '#ec4899',
};

export function ToolsPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [filterRisk, setFilterRisk] = useState<ToolRisk | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const categories = [...new Set(TOOLS.map((t) => t.category))];
  const filtered = TOOLS.filter((t) => {
    if (filterRisk !== 'all' && t.risk !== filterRisk) return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    return true;
  });

  const selectedTool = selected ? TOOLS.find((t) => t.id === selected) : null;

  return (
    <div
      style={{
        background: '#080c14',
        minHeight: '100vh',
        color: '#e2e8f0',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid #1e293b',
          padding: '20px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: 'rgba(212,160,84,0.15)',
              border: '1px solid rgba(212,160,84,0.3)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Wrench size={18} color="#d4a054" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>Tool Registry</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              15 tools — risk-classified · approval-gated · demo mode
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value as ToolRisk | 'all')}
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 6,
              padding: '6px 10px',
              color: '#94a3b8',
              fontSize: 12,
            }}
          >
            <option value="all">All Risk Levels</option>
            {Object.entries(RISK_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 6,
              padding: '6px 10px',
              color: '#94a3b8',
              fontSize: 12,
            }}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Risk summary */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '12px 32px',
          borderBottom: '1px solid #1e293b',
          overflowX: 'auto',
        }}
      >
        {Object.entries(RISK_CONFIG).map(([risk, cfg]) => {
          const count = TOOLS.filter((t) => t.risk === risk).length;
          return (
            <button
              key={risk}
              onClick={() => setFilterRisk(filterRisk === risk ? 'all' : (risk as ToolRisk))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                background: filterRisk === risk ? `${cfg.color}18` : 'transparent',
                border: `1px solid ${filterRisk === risk ? cfg.color + '40' : '#1e293b'}`,
                borderRadius: 20,
                cursor: 'pointer',
              }}
            >
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color }} />
              <span style={{ fontSize: 11, color: cfg.color }}>{cfg.label}</span>
              <span style={{ fontSize: 11, color: '#64748b' }}>({count})</span>
            </button>
          );
        })}
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 20,
          }}
        >
          <Lock size={10} color="#ef4444" />
          <span style={{ fontSize: 11, color: '#ef4444' }}>data_purge — ALWAYS BLOCKED</span>
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 164px)' }}>
        {/* Tool List */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {filtered.map((tool) => {
              const riskCfg = RISK_CONFIG[tool.risk];
              const catColor = CATEGORY_COLORS[tool.category] ?? '#64748b';
              const isBlocked = tool.id === 'data_purge';
              const isSelected = selected === tool.id;

              return (
                <div
                  key={tool.id}
                  onClick={() => setSelected(isSelected ? null : tool.id)}
                  style={{
                    background: isSelected
                      ? 'rgba(139,122,200,0.06)'
                      : isBlocked
                        ? 'rgba(239,68,68,0.04)'
                        : '#0f172a',
                    border: `1px solid ${isSelected ? 'rgba(139,122,200,0.3)' : isBlocked ? 'rgba(239,68,68,0.25)' : '#1e293b'}`,
                    borderRadius: 10,
                    padding: 14,
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: isBlocked ? '#ef4444' : '#f1f5f9',
                        }}
                      >
                        {tool.name}
                      </div>
                      <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{tool.id}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {isBlocked && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.25)',
                            borderRadius: 4,
                            padding: '2px 7px',
                          }}
                        >
                          <Lock size={9} color="#ef4444" />
                          <span style={{ fontSize: 9, color: '#ef4444', fontWeight: 700 }}>
                            BLOCKED
                          </span>
                        </div>
                      )}
                      <div
                        style={{
                          background: `${riskCfg.color}12`,
                          border: `1px solid ${riskCfg.color}28`,
                          borderRadius: 4,
                          padding: '2px 8px',
                        }}
                      >
                        <span style={{ fontSize: 10, color: riskCfg.color }}>{riskCfg.label}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5, marginBottom: 10 }}
                  >
                    {tool.description.slice(0, 90)}…
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span
                        style={{
                          fontSize: 10,
                          color: catColor,
                          background: `${catColor}10`,
                          border: `1px solid ${catColor}25`,
                          borderRadius: 10,
                          padding: '2px 8px',
                        }}
                      >
                        {tool.category}
                      </span>
                      {tool.requiresApproval && (
                        <span
                          style={{
                            fontSize: 10,
                            color: '#f59e0b',
                            background: 'rgba(245,158,11,0.08)',
                            border: '1px solid rgba(245,158,11,0.2)',
                            borderRadius: 10,
                            padding: '2px 8px',
                          }}
                        >
                          approval
                        </span>
                      )}
                      {tool.requiresAudit && (
                        <span
                          style={{
                            fontSize: 10,
                            color: '#64748b',
                            background: 'rgba(100,116,139,0.08)',
                            border: '1px solid rgba(100,116,139,0.2)',
                            borderRadius: 10,
                            padding: '2px 8px',
                          }}
                        >
                          audit
                        </span>
                      )}
                    </div>
                    <ChevronRight size={12} color={isSelected ? '#8b7ac8' : '#334155'} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedTool && (
          <div
            style={{
              width: 360,
              borderLeft: '1px solid #1e293b',
              overflow: 'auto',
              padding: 20,
              background: '#080c14',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
              {selectedTool.name}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 14 }}>
              {selectedTool.description}
            </div>

            <div
              style={{
                background: '#0f172a',
                borderRadius: 8,
                border: '1px solid #1e293b',
                padding: 14,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 8,
                }}
              >
                Risk Profile
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>Risk Level</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: RISK_CONFIG[selectedTool.risk].color,
                      fontWeight: 600,
                    }}
                  >
                    {RISK_CONFIG[selectedTool.risk].label}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>Approval</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: selectedTool.requiresApproval ? '#f59e0b' : '#22c55e',
                    }}
                  >
                    {selectedTool.requiresApproval ? 'Required' : 'Not required'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>Audit Trail</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: selectedTool.requiresAudit ? '#8b7ac8' : '#64748b',
                    }}
                  >
                    {selectedTool.requiresAudit ? 'Logged' : 'None'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>Category</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: CATEGORY_COLORS[selectedTool.category] ?? '#94a3b8',
                    }}
                  >
                    {selectedTool.category}
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                background: '#0f172a',
                borderRadius: 8,
                border: '1px solid #1e293b',
                padding: 14,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 8,
                }}
              >
                Allowed Operators
              </div>
              {selectedTool.allowedOperators.length === 0 ? (
                <div style={{ fontSize: 11, color: '#ef4444' }}>No operators — always blocked</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {selectedTool.allowedOperators.map((o) => (
                    <span
                      key={o}
                      style={{
                        fontSize: 10,
                        background: 'rgba(139,122,200,0.08)',
                        border: '1px solid rgba(139,122,200,0.2)',
                        color: '#8b7ac8',
                        borderRadius: 4,
                        padding: '2px 8px',
                      }}
                    >
                      {o}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div
              style={{
                background: '#0f172a',
                borderRadius: 8,
                border: '1px solid #1e293b',
                padding: 14,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 8,
                }}
              >
                Demo Behavior
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>
                {selectedTool.demoBehavior}
              </div>
            </div>

            <div
              style={{
                background: '#0f172a',
                borderRadius: 8,
                border: '1px solid #1e293b',
                padding: 14,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 8,
                }}
              >
                Error State
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>
                {selectedTool.errorState}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ToolsPage;
