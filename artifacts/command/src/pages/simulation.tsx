import { EcosystemNav } from '@szl-holdings/shared-ui/ecosystem-nav';
import { useCallback, useEffect, useState } from 'react';

const ACCENT = '#8b7ac8';

interface SimVariable {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  default: number;
  description: string;
  icon: string;
}

const SIM_VARIABLES: SimVariable[] = [
  {
    id: 'oil-price',
    label: 'Oil Price Change',
    unit: '%',
    min: -60,
    max: 100,
    step: 5,
    default: 0,
    description: 'WTI crude shock (%)',
    icon: '🛢',
  },
  {
    id: 'interest-rate',
    label: 'Interest Rate Change',
    unit: 'bps',
    min: -200,
    max: 300,
    step: 25,
    default: 0,
    description: 'Central bank policy shift (basis points)',
    icon: '🏦',
  },
  {
    id: 'threat-level',
    label: 'Global Threat Level',
    unit: '',
    min: 1,
    max: 5,
    step: 1,
    default: 2,
    description: 'Geopolitical threat multiplier (1–5)',
    icon: '⚠',
  },
  {
    id: 'market-conditions',
    label: 'Market Conditions',
    unit: '%',
    min: -40,
    max: 40,
    step: 5,
    default: 0,
    description: 'Equity market index movement (%)',
    icon: '📈',
  },
  {
    id: 'fx-usd',
    label: 'USD Strength',
    unit: '%',
    min: -20,
    max: 20,
    step: 2,
    default: 0,
    description: 'USD index change vs DXY (%)',
    icon: '💵',
  },
];

interface DomainImpact {
  domain: string;
  icon: string;
  color: string;
  impactLabel: string;
  impactValue: string;
  trend: 'up' | 'down' | 'flat';
  confidence: number;
  details: string;
  affectedEntities: string[];
}

function computeImpact(vars: Record<string, number>): DomainImpact[] {
  const oil = vars['oil-price'] ?? 0;
  const rate = (vars['interest-rate'] ?? 0) / 100;
  const threat = vars['threat-level'] ?? 2;
  const market = vars['market-conditions'] ?? 0;
  const fx = vars['fx-usd'] ?? 0;

  return [
    {
      domain: 'Vessels',
      icon: '⚓',
      color: '#4d8fcc',
      impactLabel: 'Fuel Cost Delta',
      impactValue: oil !== 0 ? `${oil > 0 ? '+' : ''}$${(oil * 0.18).toFixed(1)}M` : 'Neutral',
      trend: oil > 0 ? 'down' : oil < 0 ? 'up' : 'flat',
      confidence: 0.84 + Math.random() * 0.1,
      details:
        oil > 5
          ? `Fuel costs rise by ~${(oil * 0.18).toFixed(1)}M across the fleet. 4 routes become marginally uneconomic. ${threat > 3 ? 'High threat environment increases war-risk premiums.' : ''}`
          : oil < -5
            ? `Fuel savings of ${Math.abs(oil * 0.18).toFixed(1)}M unlock 2 previously unviable routes.`
            : 'Marginal impact on current operations.',
      affectedEntities: oil !== 0 ? ['MV Poseidon', 'MV Argo', 'MV Triton'] : [],
    },
    {
      domain: 'Terra',
      icon: '⬢',
      color: '#22c55e',
      impactLabel: 'Portfolio Valuation',
      impactValue:
        rate !== 0 || market !== 0
          ? `${rate < 0 || market > 0 ? '+' : ''}${(-rate * 2.1 + market * 0.14).toFixed(1)}%`
          : 'Neutral',
      trend: rate < 0 || market > 0 ? 'up' : rate > 0 || market < 0 ? 'down' : 'flat',
      confidence: 0.78 + Math.random() * 0.12,
      details:
        rate !== 0
          ? `Cap rate compression ${rate > 0 ? 'expansion' : 'compression'} of ${Math.abs(rate * 0.4).toFixed(0)}bps. Industrial properties most ${rate > 0 ? 'exposed' : 'insulated'}.`
          : 'Stable real estate valuation environment.',
      affectedEntities:
        rate !== 0 ? ['Miami Beach Commercial', 'Austin Industrial', 'NYC Mixed-Use'] : [],
    },
    {
      domain: 'SZL Holdings',
      icon: '◆',
      color: '#f59e0b',
      impactLabel: 'NAV Impact',
      impactValue: (() => {
        const delta = -oil * 0.003 + -rate * 0.05 + market * 0.04 + -fx * 0.015;
        return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`;
      })(),
      trend: (() => {
        const delta = -oil * 0.003 + -rate * 0.05 + market * 0.04;
        return delta > 0.2 ? 'up' : delta < -0.2 ? 'down' : 'flat';
      })(),
      confidence: 0.82 + Math.random() * 0.1,
      details: `Cross-domain exposure weighted. Maritime segment drives ${Math.abs(oil * 0.3).toFixed(0)}% of variance. Portfolio hedge ratio ${market > 15 ? 'insufficient' : 'adequate'}.`,
      affectedEntities: ['Maritime Fund', 'RE Holdings', 'Venture Portfolio'],
    },
    {
      domain: 'Counsel',
      icon: '⚖',
      color: '#a855f7',
      impactLabel: 'Affected Contracts',
      impactValue:
        oil > 10
          ? '7 clauses triggered'
          : threat > 3
            ? '4 force majeure alerts'
            : 'Minimal exposure',
      trend: oil > 10 || threat > 3 ? 'down' : 'flat',
      confidence: 0.76 + Math.random() * 0.1,
      details:
        oil > 10
          ? `${Math.floor(oil / 10 + 5)} cargo contracts contain fuel price escalation clauses above ${oil}% threshold. Force majeure review required.`
          : threat > 3
            ? 'Elevated threat level triggers war-risk clause review in 4 maritime agreements.'
            : 'No material contractual exposure identified.',
      affectedEntities:
        oil > 10 ? ['MV Poseidon Charter', 'Q3 Cargo Agreement', 'Force Majeure Review'] : [],
    },
    {
      domain: 'Carlota Jo',
      icon: '◈',
      color: '#ec4899',
      impactLabel: 'Client Engagements',
      impactValue:
        market !== 0
          ? `${Math.abs(market) > 15 ? '3' : '1'} alert${Math.abs(market) > 15 ? 's' : ''}`
          : 'Stable',
      trend: Math.abs(market) > 15 ? 'down' : 'flat',
      confidence: 0.71 + Math.random() * 0.1,
      details:
        Math.abs(market) > 15
          ? `${Math.floor(Math.abs(market) / 8)} active engagements in market-sensitive sectors. Advisory strategy review recommended.`
          : 'Client advisory engagements unaffected by current scenario parameters.',
      affectedEntities:
        Math.abs(market) > 15 ? ['Emerging Markets Client', 'PE Strategy Engagement'] : [],
    },
    {
      domain: 'Aegis',
      icon: '🛡',
      color: '#ef4444',
      impactLabel: 'Threat Surface',
      impactValue:
        threat > 3
          ? `+${((threat - 2) * 18).toFixed(0)}% attack probability`
          : threat < 2
            ? 'Reduced'
            : 'Stable',
      trend: threat > 2 ? 'down' : 'up',
      confidence: 0.88 + Math.random() * 0.08,
      details:
        threat > 3
          ? `Elevated geopolitical threat level (${threat}/5) correlates with increased nation-state actor activity. SOC posture elevated.`
          : 'Security perimeter holding under current threat parameters.',
      affectedEntities:
        threat > 3 ? ['Critical Infrastructure', 'Maritime OT Systems', 'Legal Case Files'] : [],
    },
  ];
}

export default function SimulationPage() {
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(SIM_VARIABLES.map((v) => [v.id, v.default])),
  );
  const [hasRun, setHasRun] = useState(false);
  const [running, setRunning] = useState(false);
  const [impacts, setImpacts] = useState<DomainImpact[]>([]);
  const [iterations] = useState(10000);
  const [resultSource, setResultSource] = useState<'api' | 'local' | null>(null);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [csrfReady, setCsrfReady] = useState(false);
  const [csrfError, setCsrfError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const hasCookie = document.cookie.split(';').some((c) => c.trim().startsWith('csrf_token='));
    if (hasCookie) {
      setCsrfReady(true);
      return;
    }
    (async () => {
      try {
        const res = await fetch('/api/csrf-token', { credentials: 'include' });
        if (!res.ok) throw new Error(`csrf-token request failed: ${res.status}`);
        if (!cancelled) {
          setCsrfReady(true);
          setCsrfError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setCsrfError(err instanceof Error ? err.message : 'Unable to initialize CSRF token');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  const [savedScenarios] = useState([
    { id: 's1', label: 'Oil Shock +30%', date: 'Apr 14', variables: { 'oil-price': 30 } },
    { id: 's2', label: 'Rate Cut -100bps', date: 'Apr 12', variables: { 'interest-rate': -100 } },
    { id: 's3', label: 'High Threat (4/5)', date: 'Apr 10', variables: { 'threat-level': 4 } },
  ]);

  const runSimulation = useCallback(async () => {
    setRunning(true);
    setSourceError(null);
    try {
      const csrfMatch = document.cookie.split(';').find((c) => c.trim().startsWith('csrf_token='));
      const csrfToken = csrfMatch ? decodeURIComponent(csrfMatch.split('=')[1]!) : undefined;
      const res = await fetch('/api/simulation/what-if', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify({ variables: values, iterations }),
      });
      if (res.ok) {
        const json = (await res.json()) as { domainImpacts?: DomainImpact[] };
        const apiImpacts = json.domainImpacts;
        if (Array.isArray(apiImpacts) && apiImpacts.length > 0) {
          setImpacts(apiImpacts);
          setResultSource('api');
          setHasRun(true);
          setRunning(false);
          return;
        }
        throw new Error('API returned no domain impacts');
      }
      throw new Error(`API returned HTTP ${res.status}`);
    } catch (err) {
      setSourceError(err instanceof Error ? err.message : 'API request failed');
    }
    await new Promise((r) => setTimeout(r, 400));
    setImpacts(computeImpact(values));
    setResultSource('local');
    setHasRun(true);
    setRunning(false);
  }, [values, iterations]);

  const loadScenario = useCallback((scenario: (typeof savedScenarios)[0]) => {
    setValues((prev) => ({
      ...prev,
      ...(scenario.variables as unknown as Record<string, number>),
    }));
    setHasRun(false);
  }, []);

  const resetAll = useCallback(() => {
    setValues(Object.fromEntries(SIM_VARIABLES.map((v) => [v.id, v.default])));
    setHasRun(false);
    setImpacts([]);
  }, []);

  const hasChanges = SIM_VARIABLES.some((v) => values[v.id] !== v.default);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg-primary, #080a12)',
        color: 'var(--color-fg-primary, rgba(255,255,255,0.9))',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <EcosystemNav currentAppId="command" currentAppName="Unified Command" accentColor={ACCENT} />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: `${ACCENT}20`,
                border: `1px solid ${ACCENT}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
            >
              🌊
            </div>
            <div>
              <h1
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  margin: 0,
                  color: 'rgba(255,255,255,0.95)',
                }}
              >
                What-If Simulation Engine
              </h1>
              <p
                style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.4)',
                  margin: 0,
                  marginTop: '2px',
                }}
              >
                Monte Carlo scenario modeling across all domains · {iterations.toLocaleString()}{' '}
                iterations per run
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '360px 1fr',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* Left Panel — Variables */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Saved Scenarios */}
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  Saved Scenarios
                </span>
              </div>
              <div style={{ padding: '8px' }}>
                {savedScenarios.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => loadScenario(s)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      border: '1px solid transparent',
                      background: 'transparent',
                      color: 'rgba(255,255,255,0.6)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontFamily: 'system-ui, sans-serif',
                      transition: 'all 0.15s',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = `${ACCENT}12`;
                      (e.currentTarget as HTMLButtonElement).style.borderColor = `${ACCENT}30`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
                    }}
                  >
                    <span>{s.label}</span>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                      {s.date}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Variables */}
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  Scenario Variables
                </span>
              </div>
              <div
                style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}
              >
                {SIM_VARIABLES.map((v) => {
                  const val = values[v.id] ?? v.default;
                  const changed = val !== v.default;
                  return (
                    <div key={v.id}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <span style={{ fontSize: '14px' }}>{v.icon}</span>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: changed ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)',
                            }}
                          >
                            {v.label}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: changed ? ACCENT : 'rgba(255,255,255,0.4)',
                            minWidth: '60px',
                            textAlign: 'right',
                          }}
                        >
                          {val > 0 ? '+' : ''}
                          {val}
                          {v.unit}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={v.min}
                        max={v.max}
                        step={v.step}
                        value={val}
                        onChange={(e) => {
                          setValues((prev) => ({ ...prev, [v.id]: Number(e.target.value) }));
                          setHasRun(false);
                        }}
                        style={{ width: '100%', accentColor: ACCENT, cursor: 'pointer' }}
                      />
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginTop: '3px',
                        }}
                      >
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
                          {v.min}
                          {v.unit}
                        </span>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
                          {v.description}
                        </span>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
                          {v.max}
                          {v.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div
                style={{
                  padding: '12px 16px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  gap: '8px',
                }}
              >
                <button
                  onClick={runSimulation}
                  disabled={running || !csrfReady}
                  title={!csrfReady ? (csrfError ?? 'Initializing secure session…') : undefined}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: hasChanges && csrfReady ? ACCENT : 'rgba(255,255,255,0.08)',
                    color: hasChanges && csrfReady ? '#fff' : 'rgba(255,255,255,0.4)',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: hasChanges && csrfReady && !running ? 'pointer' : 'default',
                    fontFamily: 'system-ui, sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                  }}
                >
                  {running ? (
                    <>
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          border: `2px solid rgba(255,255,255,0.3)`,
                          borderTop: '2px solid #fff',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                        }}
                      />
                      Running Monte Carlo...
                    </>
                  ) : (
                    '▶ Run Simulation'
                  )}
                </button>
                {hasChanges && (
                  <button
                    onClick={resetAll}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'transparent',
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontFamily: 'system-ui, sans-serif',
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel — Results */}
          <div>
            {!hasRun && !running && (
              <div
                style={{
                  height: '400px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px dashed rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  gap: '12px',
                }}
              >
                <div style={{ fontSize: '40px', opacity: 0.3 }}>🌊</div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                  Adjust variables and run the simulation
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>
                  Cross-domain impact will appear here
                </div>
              </div>
            )}

            {running && (
              <div
                style={{
                  height: '400px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    border: `3px solid ${ACCENT}30`,
                    borderTop: `3px solid ${ACCENT}`,
                    borderRadius: '50%',
                    animation: 'spin 0.9s linear infinite',
                  }}
                />
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
                  Running {iterations.toLocaleString()} Monte Carlo iterations...
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                  Tracing entity relationships across all domains
                </div>
              </div>
            )}

            {hasRun && !running && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '4px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.4)',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                    }}
                  >
                    Domain Impact Analysis
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'rgba(255,255,255,0.25)',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '5px',
                      padding: '2px 8px',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {iterations.toLocaleString()} iterations
                  </span>
                  {resultSource === 'api' && (
                    <span
                      title="Computed by the live simulation API"
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#22c55e',
                        background: 'rgba(34,197,94,0.1)',
                        borderRadius: '5px',
                        padding: '2px 8px',
                        border: '1px solid rgba(34,197,94,0.35)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: '#22c55e',
                        }}
                      />
                      Source: Live API
                    </span>
                  )}
                  {resultSource === 'local' && (
                    <span
                      title={
                        sourceError
                          ? `API call failed (${sourceError}). Showing in-browser estimate.`
                          : 'Showing in-browser estimate'
                      }
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#f59e0b',
                        background: 'rgba(245,158,11,0.1)',
                        borderRadius: '5px',
                        padding: '2px 8px',
                        border: '1px solid rgba(245,158,11,0.4)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: '#f59e0b',
                        }}
                      />
                      Source: Local estimate (offline)
                    </span>
                  )}
                </div>
                {resultSource === 'local' && sourceError && (
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'rgba(245,158,11,0.85)',
                      background: 'rgba(245,158,11,0.06)',
                      border: '1px solid rgba(245,158,11,0.25)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      marginBottom: '4px',
                    }}
                  >
                    Live simulation API unavailable: {sourceError}. Displaying in-browser estimate
                    as a fallback.
                  </div>
                )}
                {impacts.map((impact) => (
                  <div
                    key={impact.domain}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${impact.color}25`,
                      borderRadius: '14px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '14px',
                      }}
                    >
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: `${impact.color}15`,
                          border: `1px solid ${impact.color}30`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          flexShrink: 0,
                        }}
                      >
                        {impact.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '4px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: 700,
                              color: 'rgba(255,255,255,0.9)',
                            }}
                          >
                            {impact.domain}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              color: impact.color,
                              background: `${impact.color}15`,
                              border: `1px solid ${impact.color}30`,
                              borderRadius: '5px',
                              padding: '2px 7px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}
                          >
                            {impact.impactLabel}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'rgba(255,255,255,0.5)',
                            lineHeight: 1.6,
                          }}
                        >
                          {impact.details}
                        </div>
                        {impact.affectedEntities.length > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              gap: '5px',
                              marginTop: '8px',
                              flexWrap: 'wrap',
                            }}
                          >
                            {impact.affectedEntities.map((e) => (
                              <span
                                key={e}
                                style={{
                                  fontSize: '10px',
                                  color: 'rgba(255,255,255,0.4)',
                                  background: 'rgba(255,255,255,0.05)',
                                  borderRadius: '4px',
                                  padding: '2px 7px',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                }}
                              >
                                {e}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div
                          style={{
                            fontSize: '18px',
                            fontWeight: 800,
                            color:
                              impact.trend === 'up'
                                ? '#22c55e'
                                : impact.trend === 'down'
                                  ? '#ef4444'
                                  : 'rgba(255,255,255,0.4)',
                          }}
                        >
                          {impact.impactValue}
                        </div>
                        <div
                          style={{
                            fontSize: '10px',
                            color: 'rgba(255,255,255,0.3)',
                            marginTop: '2px',
                          }}
                        >
                          {Math.round(impact.confidence * 100)}% conf.
                        </div>
                        {/* Confidence bar */}
                        <div
                          style={{
                            marginTop: '6px',
                            width: '80px',
                            height: '3px',
                            background: 'rgba(255,255,255,0.08)',
                            borderRadius: '2px',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${impact.confidence * 100}%`,
                              background: impact.color,
                              borderRadius: '2px',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
